import { FollowUpTask, ScreeningHistoryEntry } from '../types';

/**
 * STEP 1: Disease Classification Logic
 */
export function classifyDiabetes(bloodSugar?: number): string {
  if (bloodSugar === undefined || bloodSugar === null) {
    return 'Pending Vitals Intake';
  }
  if (bloodSugar < 140) {
    return 'Normal Glycemia';
  } else if (bloodSugar >= 140 && bloodSugar <= 199) {
    return 'Prediabetes';
  } else {
    return 'Type 2 Diabetes (Likely)';
  }
}

export function classifyHypertension(systolic?: number, diastolic?: number): string {
  if (systolic === undefined || diastolic === undefined || systolic === null || diastolic === null) {
    return 'Pending Vitals Intake';
  }
  if (systolic < 130 && diastolic < 85) {
    return 'Normal BP';
  } else if ((systolic >= 130 && systolic <= 139) || (diastolic >= 85 && diastolic <= 89)) {
    return 'Pre-hypertension';
  } else {
    return 'Hypertension';
  }
}

/**
 * Calculate refined Risk Level & Percentage based on quantitative metrics
 */
export function calculateVitalsRisk(
  bloodSugar?: number,
  systolic?: number,
  diastolic?: number,
  qualitativeRisk: 'low' | 'medium' | 'high' = 'low'
): { riskFactor: 'low' | 'medium' | 'high'; riskPercentage: number } {
  let sugarPercentage = 10;
  if (bloodSugar !== undefined && bloodSugar !== null) {
    if (bloodSugar < 140) {
      sugarPercentage = 10 + Math.max(0, (bloodSugar / 140) * 15); // max 25%
    } else if (bloodSugar >= 140 && bloodSugar <= 199) {
      sugarPercentage = 40 + ((bloodSugar - 140) / 60) * 25; // 40% - 65%
    } else {
      sugarPercentage = 70 + Math.min(((bloodSugar - 200) / 250) * 25, 25); // 70% - 95%
    }
  } else {
    // Fall back to qualitative risk representation
    sugarPercentage = qualitativeRisk === 'high' ? 80 : (qualitativeRisk === 'medium' ? 45 : 12);
  }

  let bpPercentage = 10;
  if (systolic !== undefined && diastolic !== undefined && systolic !== null && diastolic !== null) {
    if (systolic < 130 && diastolic < 85) {
      bpPercentage = 10 + Math.max(0, ((systolic - 90) / 40) * 15); // max 25%
    } else if ((systolic >= 130 && systolic <= 139) || (diastolic >= 85 && diastolic <= 89)) {
      bpPercentage = 45 + Math.max((systolic - 130) * 2.5, (diastolic - 85) * 4); // 45% - 65%
    } else {
      bpPercentage = 75 + Math.min(((systolic - 140) / 80) * 20, 20); // 75% - 95%
    }
  } else {
    bpPercentage = qualitativeRisk === 'high' ? 85 : (qualitativeRisk === 'medium' ? 45 : 12);
  }

  const overallPercentage = Math.round((sugarPercentage + bpPercentage) / 2);
  
  let finalRisk: 'low' | 'medium' | 'high' = 'low';
  if (overallPercentage >= 70 || (bloodSugar && bloodSugar >= 200) || (systolic && systolic >= 140)) {
    finalRisk = 'high';
  } else if (overallPercentage >= 35) {
    finalRisk = 'medium';
  }

  return {
    riskFactor: finalRisk,
    riskPercentage: overallPercentage
  };
}

/**
 * STEP 2 & STEP 7 & STEP 8: Clinical Follow-up and Next Action Engine (Adaptive Decision Engine)
 */
export function evaluateNextClinicalAction(
  patientId: string,
  currentRiskFactor: 'low' | 'medium' | 'high',
  history: ScreeningHistoryEntry[] = []
): {
  status: string;
  nextScheduledDays: number;
  priority: 'Low' | 'Medium' | 'High';
  actionRequired: string;
  isEscalated: boolean;
  telemedicineBrief?: string;
  trend: 'improving' | 'worsening' | 'stable';
} {
  // Extract previous checks for this patient
  const patientHistory = history
    .filter(entry => entry.patientId === patientId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Count past consecutive risks
  let consecutiveHigh = 0;
  let consecutiveMedium = 0;

  for (const entry of patientHistory) {
    if (entry.riskResults?.riskFactor === 'high') {
      consecutiveHigh++;
    } else {
      break;
    }
  }

  for (const entry of patientHistory) {
    if (entry.riskResults?.riskFactor === 'medium') {
      consecutiveMedium++;
    } else {
      break;
    }
  }

  // Determine trend based on history
  let trend: 'improving' | 'worsening' | 'stable' = 'stable';
  if (patientHistory.length > 0) {
    const lastRisk = patientHistory[0].riskResults?.riskFactor;
    if (currentRiskFactor === 'high' && (lastRisk === 'medium' || lastRisk === 'low')) {
      trend = 'worsening';
    } else if (currentRiskFactor === 'low' && (lastRisk === 'medium' || lastRisk === 'high')) {
      trend = 'improving';
    } else if (currentRiskFactor === 'medium' && lastRisk === 'low') {
      trend = 'worsening';
    } else if (currentRiskFactor === 'medium' && lastRisk === 'high') {
      trend = 'improving';
    }
  }

  let status = 'Stable';
  let nextScheduledDays = 365;
  let priority: 'Low' | 'Medium' | 'High' = 'Low';
  let actionRequired = 'Routine annual checkup';
  let isEscalated = false;
  let telemedicineBrief = '';

  // Apply clinical routing rules
  if (currentRiskFactor === 'high') {
    priority = 'High';
    
    // Check for escalation (repeated high/red across 2+ entries)
    if (consecutiveHigh >= 1) {
      isEscalated = true;
      status = 'CRITICAL - Immediate PHC Intervention Required';
      nextScheduledDays = 1; // Immediate check next day
      actionRequired = 'Critical repeated readings. Urgent PHC physician evaluation and immediate ASHA review.';
      telemedicineBrief = `Patient with ID ${patientId} has demonstrated consecutive high-risk glycemia or hypertensive episodes. Immediate clinical escalation to the Primary Health Centre (PHC) is mandatory for pharmacological management.`;
    } else {
      status = 'Immediate Attention Required';
      nextScheduledDays = 1;
      actionRequired = 'Immediate ASHA worker visit and Primary Health Cente (PHC) specialist referral';
    }
  } else if (currentRiskFactor === 'medium') {
    priority = 'Medium';
    
    // Smart interval reduction for repeated medium risk (Step 8)
    if (consecutiveMedium >= 1) {
      status = 'Monitoring Required (Interval Reduced)';
      nextScheduledDays = 60; // Reduced from 90 to 60 (Step 8)
      actionRequired = 'Repeated pre-diabetic/pre-hypertensive markers. Dynamic check window shortened to 60 days. Focus on dietary modifications and exercise.';
    } else {
      status = 'Monitoring Required';
      nextScheduledDays = 90;
      actionRequired = 'Lifestyle monitoring, dynamic calorie restriction, active daily labor, and re-screening in 90 days.';
    }
  } else {
    // Low risk / Green
    status = 'Stable';
    nextScheduledDays = 365;
    priority = 'Low';
    actionRequired = 'Routine annual outreach checkup with basic biometric recordings.';
  }

  return {
    status,
    nextScheduledDays,
    priority,
    actionRequired,
    isEscalated,
    telemedicineBrief: isEscalated ? telemedicineBrief : undefined,
    trend
  };
}

/**
 * STEP 3: Auto Task Generator Helper
 */
export function generateFollowUpTask(
  patientId: string,
  patientName: string,
  riskFactor: 'low' | 'medium' | 'high',
  diabetesClassification: string,
  bpClassification: string,
  riskPercentage: number,
  nextVisitDays: number,
  actionRequired: string,
  priority: 'Low' | 'Medium' | 'High'
): FollowUpTask {
  const taskId = `TASK-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;
  
  // Compute target calendar due date
  const dueEpoch = Date.now() + nextVisitDays * 24 * 3600 * 1000;
  const dueDate = new Date(dueEpoch).toISOString();

  return {
    taskId,
    patientId,
    patientName,
    dueDate,
    priority,
    status: 'Pending',
    actionRequired,
    diabetesClassification,
    bpClassification,
    riskFactor,
    riskPercentage
  };
}

/**
 * STEP 5: Disease Progression Comparison Engine
 */
export interface ProgressionReport {
  overallSummary: string;
  sugarTrend: 'improved' | 'worsened' | 'stable' | 'none';
  bpTrend: 'improved' | 'worsened' | 'stable' | 'none';
  sugarDelta?: number;
  bpDeltaSystolic?: number;
  bpDeltaDiastolic?: number;
}

export function computeDiseaseProgression(
  current: { sugar?: number; systolic?: number; diastolic?: number },
  previous?: { sugar?: number; systolic?: number; diastolic?: number }
): ProgressionReport {
  if (!previous) {
    return {
      overallSummary: 'Baseline established. Progression tracking will commence on next screening revisit.',
      sugarTrend: 'none',
      bpTrend: 'none'
    };
  }

  let sugarTrend: 'improved' | 'worsened' | 'stable' | 'none' = 'none';
  let sugarDelta: number | undefined;
  if (current.sugar !== undefined && previous.sugar !== undefined) {
    sugarDelta = current.sugar - previous.sugar;
    if (sugarDelta > 10) {
      sugarTrend = 'worsened';
    } else if (sugarDelta < -10) {
      sugarTrend = 'improved';
    } else {
      sugarTrend = 'stable';
    }
  }

  let bpTrend: 'improved' | 'worsened' | 'stable' | 'none' = 'none';
  let bpDeltaSystolic: number | undefined;
  let bpDeltaDiastolic: number | undefined;
  if (
    current.systolic !== undefined && 
    previous.systolic !== undefined && 
    current.diastolic !== undefined && 
    previous.diastolic !== undefined
  ) {
    bpDeltaSystolic = current.systolic - previous.systolic;
    bpDeltaDiastolic = current.diastolic - previous.diastolic;
    
    if (bpDeltaSystolic > 8 || bpDeltaDiastolic > 5) {
      bpTrend = 'worsened';
    } else if (bpDeltaSystolic < -8 || bpDeltaDiastolic < -5) {
      bpTrend = 'improved';
    } else {
      bpTrend = 'stable';
    }
  }

  // Assemble nice text outline summary
  const summaryParts: string[] = [];
  
  if (sugarDelta !== undefined) {
    if (sugarDelta > 0) {
      summaryParts.push(`Glucose level shifted upwards: +${sugarDelta} mg/dL (Worsened)`);
    } else if (sugarDelta < 0) {
      summaryParts.push(`Glucose level optimized: -${Math.abs(sugarDelta)} mg/dL (Improved)`);
    } else {
      summaryParts.push(`Glucose level remains unchanged (${current.sugar} mg/dL)`);
    }
  }

  if (bpDeltaSystolic !== undefined && bpDeltaDiastolic !== undefined) {
    const bpState = bpTrend === 'improved' ? 'Optimized' : (bpTrend === 'worsened' ? 'Worsened' : 'Stable');
    const prevBpStr = `${previous.systolic}/${previous.diastolic}`;
    const curBpStr = `${current.systolic}/${current.diastolic}`;
    summaryParts.push(`BP transitioned from ${prevBpStr} to ${curBpStr} mmHg (${bpState})`);
  }

  return {
    overallSummary: summaryParts.length > 0 ? summaryParts.join(' • ') : 'No quantitative comparison available.',
    sugarTrend,
    bpTrend,
    sugarDelta,
    bpDeltaSystolic,
    bpDeltaDiastolic
  };
}
