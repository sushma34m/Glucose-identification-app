import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  HeartPulse,
  Activity,
  X,
  FileText,
  Volume2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Database,
  Trash,
  Check,
  Sparkles
} from 'lucide-react';
import { Language } from '../types';

interface AdaptiveInsulinSystemProps {
  selectedLang: Language;
  voiceEnabled: boolean;
  speakText: (text: string, langCode: string) => void;
  triggerToast: (msg: string) => void;
  onClose: () => void;
}

interface InsulinReport {
  id: string;
  age: number;
  weight: number;
  mealTiming: string;
  symptoms: {
    thirst: boolean;
    fatigue: boolean;
    urination: boolean;
    dizziness: boolean;
    weakness: boolean;
    blurredVision: boolean;
  };
  glucoseStatus: string;
  riskLevel: 'low' | 'medium' | 'high';
  recommendation: string;
  advice: string;
  submittedAt: string;
  bloodSugar?: number;
  systolicBP?: number;
  diastolicBP?: number;
  diabetesClassification?: string;
  bpClassification?: string;
}

export function AdaptiveInsulinSystem({
  selectedLang,
  voiceEnabled,
  speakText,
  triggerToast,
  onClose
}: AdaptiveInsulinSystemProps) {
  // Form State
  const [insulinAge, setInsulinAge] = useState<string>('');
  const [insulinWeight, setInsulinWeight] = useState<string>('');
  const [mealTiming, setMealTiming] = useState<string>('fasting');
  const [bloodGlucose, setBloodGlucose] = useState<string>('');
  const [systolicBP, setSystolicBP] = useState<string>('');
  const [diastolicBP, setDiastolicBP] = useState<string>('');
  const [insulinSymptoms, setInsulinSymptoms] = useState({
    thirst: false,
    fatigue: false,
    urination: false,
    dizziness: false,
    weakness: false,
    blurredVision: false
  });

  // Results & History State
  const [insulinReport, setInsulinReport] = useState<InsulinReport | null>(null);
  const [insulinHistory, setInsulinHistory] = useState<InsulinReport[]>(() => {
    try {
      const saved = localStorage.getItem('adaptive_insulin_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Warning Overlay State
  const [showInsulinWarning, setShowInsulinWarning] = useState(false);
  const [insulinWarningText, setInsulinWarningText] = useState('');

  // Save history change to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('adaptive_insulin_history', JSON.stringify(insulinHistory));
    } catch (e) {
      console.error('Failed to save insulin history:', e);
    }
  }, [insulinHistory]);

  const calculateResult = (e: React.FormEvent) => {
    e.preventDefault();
    if (!insulinAge || !insulinWeight) {
      triggerToast(selectedLang === Language.KANNADA ? "ದಯವಿಟ್ಟು ವಯಸ್ಸು ಮತ್ತು ತೂಕವನ್ನು ನಮೂದಿಸಿ." : "Please fill in both Age and Weight fields.");
      return;
    }

    const { thirst, fatigue, urination, dizziness, weakness, blurredVision } = insulinSymptoms;

    let glucoseStatus = "Normal Glucose";
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    let recommendation = "";
    let advice = "";

    // Prediction rules:
    // thirst + fatigue + urination -> High Glucose Risk (Frequent thirst, Fatigue, Frequent urination)
    // dizziness + weakness -> Low Glucose Risk (Dizziness, Weakness)
    // otherwise -> Normal Glucose
    if (thirst && fatigue && urination) {
      glucoseStatus = "High Glucose Risk";
      riskLevel = 'high';
      recommendation = selectedLang === Language.KANNADA 
        ? "ಕ್ಷಿಪ್ರವಾಗಿ ಕಾರ್ಯನಿರ್ವಹಿಸುವ ಇನ್ಸುಲಿನ್ ತಿದ್ದುಪಡಿ ಪ್ರಮಾಣವನ್ನು ತೆಗೆದುಕೊಳ್ಳಿ (ಶರ್ಕರಪಿಷ್ಟ ಅನುಪಾತದ ಆಧಾರದ ಮೇಲೆ 4-8 ಯೂನಿಟ್ಗಳು). ತಕ್ಷಣ ಕಾರ್ಬೋಹೈಡ್ರೇಟ್ ಆಹಾರ ಸೇವಿಸಬೇಡಿ."
        : "Administer rapid-acting insulin correction dose (suggested 4-8 units based on carbohydrate ratio). Suspend immediate carbohydrate-heavy dietary intake.";
      advice = selectedLang === Language.KANNADA
        ? "ನಿರ್ಜಲೀಕರಣ ತಡೆಗಟ್ಟುವುದು ಮುಖ್ಯ. ಮುಂದಿನ ಒಂದು ಗಂಟೆಯಲ್ಲಿ ಕನಿಷ್ಠ 500 ಮಿಲಿ ನೀರು ಕುಡಿಯಿರಿ. ನಿಮ್ಮ ಆಶಾ ಕಾರ್ಯಕರ್ತೆ ಅಥವಾ ಪ್ರಾಥಮಿಕ ಚಿಕಿತ್ಸಾ ಕೇಂದ್ರವನ್ನು ಸಂಪರ್ಕಿಸಿ."
        : "Hydration is extremely critical. Consume at least 500ml-1L of clean drinking water over the next hour. Rest quietly, avoid exhausting manual labor, and connect with your neighborhood ASHA worker or primary care clinic immediately.";
    } else if (dizziness && weakness) {
      glucoseStatus = "Low Glucose Risk";
      riskLevel = 'high';
      recommendation = selectedLang === Language.KANNADA
        ? "ಇನ್ಸುಲಿನ್ ತೆಗೆದುಕೊಳ್ಳಬೇಡಿ. ತಕ್ಷಣ ಇನ್ಸುಲಿನ್ ಪಂಪ್ ಅಥವಾ ಹಿನ್ನೆಲೆ ಬೇಸಲ್ ಇನ್ಸುಲಿನ್ ಸೇವನೆಯನ್ನು ನಿಲ್ಲಿಸಿ."
        : "DO NOT ADMINISTER INSULIN. Immediately hold or suspend active correction protocols or background basal pump delivery.";
      advice = selectedLang === Language.KANNADA
        ? "ಲೋ ಗ್ಲುಕೋಸ್ ಶಂಕೆ: '15 ರ ನಿಯಮ' ಅನ್ವಯಿಸಿ. ತಕ್ಷಣ 15 ಗ್ರಾಂ ಸಕ್ಕರೆ ಆಹಾರ ತೆಗೆದುಕೊಳ್ಳಿ (ಅರ್ಧ ಗ್ಲಾಸ್ ಹಣ್ಣಿನ ರಸ ಅಥವಾ ಸಕ್ಕರೆ ನೀರು). 15 ನಿಮಿಷ ವಿಶ್ರಾಂತಿ ಪಡೆದು, ಮತ್ತೆ ಪರೀಕ್ಷಿಸಿ."
        : "Hypoglycemia Suspected: Rule of 15 applies. Consume 15 grams of fast-acting sugar (e.g. half a cup of fresh juice, dynamic sugar-water, or 3 glucose tablets) immediately. Rest quietly for 15 minutes, recheck status, and repeat if needed. Alert a nearby caregiver.";
    } else {
      glucoseStatus = "Normal Glucose";
      riskLevel = 'low';
      recommendation = selectedLang === Language.KANNADA
        ? "ವೈದ್ಯರು ಸೂಚಿಸಿದ ನಿಯಮಿತ ಬೇಸಲ್ ಇನ್ಸುಲಿನ್ ಪ್ರಮಾಣವನ್ನು ಮುಂದುವರಿಸಿ. ಈ ಸಮಯದಲ್ಲಿ ಯಾವುದೇ ಹೆಚ್ಚುವರಿ ಪ್ರಮಾಣ ಬೇಡ."
        : "Maintain standard basal dosage as prescribed by your doctor. No corrective insulin is needed at this time.";
      advice = selectedLang === Language.KANNADA
        ? "ಸಮತೋಲಿತ ಪೌಷ್ಟಿಕ ಆಹಾರ ಮುಂದುವರಿಸಿ, ಅತಿಯಾದ ಸಕ್ಕರೆ ಸೇವನೆ ಮಿತಗೊಳಿಸಿ. ಪ್ರತಿದಿನ 30 ನಿಮಿಷ ಹಗುರವಾದ ವ್ಯಾಯಾಮ ಮಾಡಿ."
        : "Continue consistent nutritional balance, limit excessive dietary sugars, and engage in daily light exercise (like walking for 30 minutes). Screen regular biological response parameters frequently.";
    }

    // Diabetes Classification Logic
    let diabetesClassificationValue = "";
    if (bloodGlucose) {
      const glucoseVal = Number(bloodGlucose);
      if (glucoseVal < 100) {
        diabetesClassificationValue = selectedLang === Language.KANNADA ? "ಸಾಮಾನ್ಯ ಗ್ಲೈಸೆಮಿಯಾ (Normal Glycemia)" : "Normal Glycemia";
      } else if ((mealTiming === 'fasting' && glucoseVal >= 100 && glucoseVal <= 125) || (mealTiming === 'post-meal' && glucoseVal >= 140 && glucoseVal <= 199)) {
        diabetesClassificationValue = selectedLang === Language.KANNADA ? "ಪ್ರಿ-ಡಯಾಬಿಟಿಸ್ (Pre-diabetes)" : "Pre-diabetes";
      } else if (glucoseVal >= 126 || (mealTiming === 'post-meal' && glucoseVal >= 200) || glucoseVal >= 200) {
        if (Number(insulinAge) < 30) {
          diabetesClassificationValue = selectedLang === Language.KANNADA ? "ಟೈಪ್ 1 ಡಯಾಬಿಟಿಸ್ ಶಂಕೆ" : "Suspected Type 1 Diabetes";
        } else {
          diabetesClassificationValue = selectedLang === Language.KANNADA ? "ಟೈಪ್ 2 ಡಯಾಬಿಟಿಸ್ ಶಂಕೆ" : "Suspected Type 2 Diabetes";
        }
      } else {
        diabetesClassificationValue = selectedLang === Language.KANNADA ? "ಸಾಮಾನ್ಯ ಗ್ಲುಕೋಸ್ ಮಟ್ಟ" : "Normal Glycemia";
      }
    } else {
      // Symptoms-based fallback
      if (thirst && urination && fatigue) {
        if (Number(insulinAge) < 30) {
          diabetesClassificationValue = selectedLang === Language.KANNADA ? "ಟೈಪ್ 1 ಮಧುಮೇಹ ಶಂಕೆ" : "Suspected Type 1 Diabetes";
        } else {
          diabetesClassificationValue = selectedLang === Language.KANNADA ? "ಟೈಪ್ 2 ಮಧುಮೇಹ ಶಂಕೆ" : "Suspected Type 2 Diabetes";
        }
      } else if (thirst || urination || fatigue || blurredVision) {
        diabetesClassificationValue = selectedLang === Language.KANNADA ? "ಪ್ರಿ-ಡಯಾಬಿಟಿಸ್ ಅಪಾಯ" : "Pre-diabetes Risk Category";
      } else {
        diabetesClassificationValue = selectedLang === Language.KANNADA ? "ಸಾಮಾನ್ಯ ಗ್ಲುಕೋಸ್ ಮಟ್ಟದ ಸೂಚನೆ" : "Normal Glycemia Indicators";
      }
    }

    // Blood Pressure Classification Logic
    let bpClassificationValue = "";
    if (systolicBP && diastolicBP) {
      const sVal = Number(systolicBP);
      const dVal = Number(diastolicBP);
      if (sVal < 90 || dVal < 60) {
        bpClassificationValue = selectedLang === Language.KANNADA ? "ಕಡಿಮೆ ಬಿಪಿ (Low BP / Hypotension)" : "Low BP (Hypotension)";
      } else if (sVal >= 140 || dVal >= 90) {
        bpClassificationValue = selectedLang === Language.KANNADA ? "ಹೆಚ್ಚಿನ ಬಿಪಿ (High BP / Stage 2)" : "High BP (Hypertension Stage 2)";
      } else if ((sVal >= 130 && sVal < 140) || (dVal >= 80 && dVal < 90)) {
        bpClassificationValue = selectedLang === Language.KANNADA ? "ಹೆಚ್ಚಿನ ಬಿಪಿ (High BP / Stage 1)" : "High BP (Hypertension Stage 1)";
      } else if ((sVal >= 121 && sVal <= 129) && dVal < 80) {
        bpClassificationValue = selectedLang === Language.KANNADA ? "ಸಾಧಾರಣಕ್ಕಿಂತ ಹೆಚ್ಚಿನ ಬಿಪಿ (Elevated)" : "Elevated BP (Pre-hypertension)";
      } else {
        bpClassificationValue = selectedLang === Language.KANNADA ? "ಸಾಮಾನ್ಯ ಬಿಪಿ (Normal BP)" : "Normal Blood Pressure";
      }
    } else {
      // Symptoms-based fallback
      if (dizziness && weakness) {
        bpClassificationValue = selectedLang === Language.KANNADA ? "ಕಡಿಮೆ ಬಿಪಿ ಸಾಧ್ಯತೆ (Suspected Low BP)" : "Suspected Low BP";
      } else if (blurredVision && fatigue && (Number(insulinAge) >= 50 || Number(insulinWeight) >= 80)) {
        bpClassificationValue = selectedLang === Language.KANNADA ? "ಹೆಚ್ಚಿನ ಬಿಪಿ ಸಾಧ್ಯತೆ" : "Suspected High BP";
      } else {
        bpClassificationValue = selectedLang === Language.KANNADA ? "ಸಾಮಾನ್ಯ ರಕ್ತದೊತ್ತಡ" : "Normal BP Range";
      }
    }

    // Trigger Warning Pop-up
    if (riskLevel === 'high') {
      let warningMsg = "";
      if (glucoseStatus === "High Glucose Risk") {
        warningMsg = selectedLang === Language.KANNADA
          ? `ಅಪಾಯ ಸೂಚನೆ: ಅತಿ ಹೆಚ್ಚು ಗ್ಲುಕೋಸ್ ಅಪಾಯ ಪತ್ತೆಯಾಗಿದೆ. ವಯಸ್ಸು: ${insulinAge} ವರ್ಷ, ತೂಕ: ${insulinWeight} ಕೆಜಿ. ಸಾಕಷ್ಟು ಪ್ರಮಾಣದ ನೀರು ಕುಡಿಯಿರಿ ಮತ್ತು ವೈದ್ಯರನ್ನು ಭೇಟಿಯಾಗಿ!`
          : `CRITICAL ALERT: Hyperglycemia risk parameter flagged. Patient Age: ${insulinAge} years, Weight: ${insulinWeight}kg, Meal timing window: ${mealTiming.toUpperCase()}. High glucose risk accompanied by acute thirst, fatigue, and frequent urination. Ensure hydration in immediate window!`;
      } else {
        warningMsg = selectedLang === Language.KANNADA
          ? `ತುರ್ತು ಸೂಚನೆ: ಇನ್ಸುಲಿನ್ ಪ್ರಮಾಣದ ಇಳಿಕೆ ಶಂಕೆ ಪತ್ತೆಯಾಗಿದೆ. ತಕ್ಷಣ 15 ಗ್ರಾಂ ಸಕ್ಕರೆ ಹಣ್ಣಿನ ರಸ ಅಥವಾ ಸಿಹಿಯನ್ನು ಸೇವಿಸಿ, ವಿಶ್ರಾಂತಿ ತೆಗೆದುಕೊಳ್ಳಿ!`
          : `CRITICAL WARNING: Hypoglycemia risk parameter flagged. Patient Age: ${insulinAge} years, Weight: ${insulinWeight}kg, Meal timing window: ${mealTiming.toUpperCase()}. Danger of diabetic shock or fainting. Administer 15g of fast carbs immediately!`;
      }
      setInsulinWarningText(warningMsg);
      setShowInsulinWarning(true);

      if (voiceEnabled) {
        speakText(warningMsg, selectedLang === Language.KANNADA ? 'kn' : 'en');
      }
    }

    // Also alert for High/Low BP triggers specifically if those numbers are critical
    if (systolicBP && diastolicBP) {
      const sVal = Number(systolicBP);
      const dVal = Number(diastolicBP);
      if (sVal >= 140 || dVal >= 90) {
        const bpMsg = selectedLang === Language.KANNADA
          ? `ಬಿಪಿ ಮುನ್ನೆಚ್ಚರಿಕೆ: ಹೆಚ್ಚಿನ ರಕ್ತದೊತ್ತಡ (${systolicBP}/${diastolicBP}) ಪತ್ತೆಯಾಗಿದೆ! ವಿಶ್ರಾಂತಿ ಪಡೆಯಿರಿ ಮತ್ತು ಕನಿಷ್ಠ ಪ್ರಮಾಣದ ಉಪ್ಪನ್ನು ಸೇವಿಸಿ.`
          : `BP WARNING: High Blood Pressure detected (${systolicBP}/${diastolicBP} mmHg)! Please rest calmly, stay hydrated, limit sodium intake, and consult your health provider if symptomatology worsens.`;
        setInsulinWarningText(prev => prev ? `${prev}\n\n${bpMsg}` : bpMsg);
        setShowInsulinWarning(true);
      } else if (sVal < 90 || dVal < 60) {
        const bpMsg = selectedLang === Language.KANNADA
          ? `ಬಿಪಿ ಮುನ್ನೆಚ್ಚರಿಕೆ: ಕಡಿಮೆ ರಕ್ತದೊತ್ತಡ (${systolicBP}/${diastolicBP}) ಪತ್ತೆಯಾಗಿದೆ! ಸಾಕಷ್ಟು ದ್ರವ ಆಹಾರ ಸೇವಿಸಿ.`
          : `BP WARNING: Low Blood Pressure detected (${systolicBP}/${diastolicBP} mmHg)! Increase hydration, rest with legs elevated, and ensure normal dietary mineral content.`;
        setInsulinWarningText(prev => prev ? `${prev}\n\n${bpMsg}` : bpMsg);
        setShowInsulinWarning(true);
      }
    }

    const newReport: InsulinReport = {
      id: `INS-${Date.now()}`,
      age: Number(insulinAge),
      weight: Number(insulinWeight),
      mealTiming,
      symptoms: { ...insulinSymptoms },
      glucoseStatus,
      riskLevel,
      recommendation,
      advice,
      submittedAt: new Date().toISOString(),
      bloodSugar: bloodGlucose ? Number(bloodGlucose) : undefined,
      systolicBP: systolicBP ? Number(systolicBP) : undefined,
      diastolicBP: diastolicBP ? Number(diastolicBP) : undefined,
      diabetesClassification: diabetesClassificationValue,
      bpClassification: bpClassificationValue
    };

    setInsulinReport(newReport);
    setInsulinHistory(prev => [newReport, ...prev]);

    triggerToast(
      selectedLang === Language.KANNADA 
        ? `ಇನ್ಸುಲಿನ್ ಮತ್ತು ಜೈವಿಕ ಮೌಲ್ಯಮಾಪನ ಪೂರ್ಣಗೊಂಡಿದೆ: ${glucoseStatus}`
        : `Bio-response & insulin assessment compiled: ${glucoseStatus}`
    );
  };

  return (
    <div className="flex-1 flex flex-col space-y-6 font-sans text-start selection:bg-emerald-500/20" id="adaptive-insulin-viewport">
      
      {/* Header bar with Back button and status indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-5 gap-4">
        <div className="space-y-1.5 text-start">
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider border border-emerald-100">
              {selectedLang === Language.KANNADA ? 'ಬಯೋ-ರೆಸ್ಪಾನ್ಸ್ ಅನಾಲಿಟಿಕ್ಸ್' : 'Active Bio-Response Analyzer'}
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <HeartPulse className="w-6 h-6 text-emerald-600 shrink-0" />
            {selectedLang === Language.KANNADA ? 'ಅಡಾಪ್ಟಿವ್ ಇನ್ಸುಲಿನ್ ಮತ್ತು ಗ್ಲುಕೋಸ್ ಮೌಲ್ಯಮಾಪನ ಶ್ರೇಣಿ' : 'Adaptive Insulin & Glucose Identification System'}
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            {selectedLang === Language.KANNADA
              ? 'ಪ್ರಾದೇಶಿಕ ಇನ್ಸುಲಿನ್ ಚಿಕಿತ್ಸಕ ವ್ಯವಸ್ಥೆ. ರೋಗಿಯ ಲಕ್ಷಣಗಳು, ಊಟದ ಸಮಯ ಮತ್ತು ದೇಹದ ಇತರ ಅಂಶಗಳನ್ನು ಆಧರಿಸಿ ಅತ್ಯುತ್ತಮ ಸಲಹೆ ಮತ್ತು ಎಚ್ಚರಿಕೆಗಳನ್ನು ಪಡೆದುಕೊಳ್ಳಿ.'
              : 'Enter demographic, biometric, and live symptomatic inputs to calculate risk levels, simulated glucose trends, and adaptive professional clinical instructions.'}
          </p>
        </div>

        <button
          onClick={onClose}
          className="self-start sm:self-center px-4 py-2.5 bg-slate-100 font-extrabold hover:bg-slate-200 text-slate-700 text-xs rounded-xl flex items-center gap-2 border border-slate-200 shadow-xs transition cursor-pointer"
        >
          <X className="w-4 h-4" />
          <span>{selectedLang === Language.KANNADA ? 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹಿಂತಿರುಗಿ' : 'Return to Cabinet'}</span>
        </button>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column - Assessment Input Form */}
        <form 
          onSubmit={calculateResult}
          className="lg:col-span-7 bg-slate-50/50 rounded-2xl border border-slate-200 p-6 md:p-8 space-y-6"
        >
          <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600" />
            {selectedLang === Language.KANNADA ? 'ಆರೋಗ್ಯ ಮೌಲ್ಯಮಾಪನ ನಮೂನೆ' : 'Physiological Assessment Form'}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Age field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
                <span>{selectedLang === Language.KANNADA ? 'ರೋಗಿಯ ವಯಸ್ಸು (ವರ್ಷಗಳು)' : 'Patient Age (Years)'}</span>
                <span className="text-rose-550 text-rose-500">*</span>
              </label>
              <input 
                type="number"
                required
                value={insulinAge}
                onChange={(e) => setInsulinAge(e.target.value)}
                placeholder="e.g. 45"
                min="1"
                max="120"
                className="w-full bg-white border border-slate-200 focus:border-emerald-555 focus:border-emerald-500 focus:outline-none p-3 rounded-xl text-sm font-medium transition"
              />
            </div>

            {/* Weight field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
                <span>{selectedLang === Language.KANNADA ? 'ದೇಹದ ತೂಕ (ಕಿಲೋಗ್ರಾಂ)' : 'Body Weight (kg)'}</span>
                <span className="text-rose-550 text-rose-500">*</span>
              </label>
              <input 
                type="number"
                required
                value={insulinWeight}
                onChange={(e) => setInsulinWeight(e.target.value)}
                placeholder="e.g. 72"
                min="10"
                max="300"
                className="w-full bg-white border border-slate-200 focus:border-emerald-555 focus:border-emerald-500 focus:outline-none p-3 rounded-xl text-sm font-medium transition"
              />
            </div>

            {/* Blood Glucose Level field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
                <span>{selectedLang === Language.KANNADA ? 'ರಕ್ತದ ಗ್ಲುಕೋಸ್ ಮಟ್ಟ (mg/dL - ಐಚ್ಛಿಕ)' : 'Blood Glucose Level (mg/dL - Optional)'}</span>
              </label>
              <input 
                type="number"
                value={bloodGlucose}
                onChange={(e) => setBloodGlucose(e.target.value)}
                placeholder="e.g. 110"
                min="30"
                max="600"
                className="w-full bg-white border border-slate-200 focus:border-emerald-555 focus:border-emerald-500 focus:outline-none p-3 rounded-xl text-sm font-medium transition"
              />
            </div>

            {/* BP values */}
            <div className="space-y-1.5 grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold text-slate-600">
                  {selectedLang === Language.KANNADA ? 'ಸಿಸ್ಟೋಲಿಕ್ బిపి (mmHg)' : 'Systolic BP (mmHg)'}
                </label>
                <input 
                  type="number"
                  value={systolicBP}
                  onChange={(e) => setSystolicBP(e.target.value)}
                  placeholder="120"
                  min="50"
                  max="250"
                  className="w-full bg-white border border-slate-200 focus:border-emerald-555 focus:border-emerald-500 focus:outline-none p-3 rounded-xl text-sm font-medium transition"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600">
                  {selectedLang === Language.KANNADA ? 'ಡಯಾಸ್ಟೋಲಿಕ್ ಬಿಪಿ' : 'Diastolic (mmHg)'}
                </label>
                <input 
                  type="number"
                  value={diastolicBP}
                  onChange={(e) => setDiastolicBP(e.target.value)}
                  placeholder="80"
                  min="30"
                  max="150"
                  className="w-full bg-white border border-slate-200 focus:border-emerald-555 focus:border-emerald-500 focus:outline-none p-3 rounded-xl text-sm font-medium transition"
                />
              </div>
            </div>
          </div>

          {/* Meal timing Dropdown */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600">
              {selectedLang === Language.KANNADA ? 'ಊಟದ ಸಮಯದ ಮಾಹಿತಿ' : 'Meal Timing Window'}
            </label>
            <select
              value={mealTiming}
              onChange={(e) => setMealTiming(e.target.value)}
              className="w-full bg-white border border-slate-200 focus:border-emerald-500 focus:outline-none p-3 rounded-xl text-sm font-bold text-slate-700 transition"
            >
              <option value="fasting">{selectedLang === Language.KANNADA ? 'ಖಾಲಿ ಹೊಟ್ಟೆ (೮+ ಗಂಟೆ ಆಹಾರವಿಲ್ಲದೆ)' : 'Morning Fasting (8+ hours no food)'}</option>
              <option value="pre-meal">{selectedLang === Language.KANNADA ? 'ಊಟಕ್ಕೆ ಮೊದಲು (೩೦ ನಿಮಿಷ ಮುಂಚಿತವಾಗಿ)' : 'Pre-Meal (Within 30 mins before eating)'}</option>
              <option value="post-meal">{selectedLang === Language.KANNADA ? 'ಊಟದ ನಂತರ (೧.೫ ರಿಂದ ೨ ಗಂಟೆಯ ನಂತರ)' : 'Post-Meal (1.5 - 2 hours after eating)'}</option>
              <option value="bedtime">{selectedLang === Language.KANNADA ? 'ಮಲಗುವ ಮುನ್ನ' : 'Bedtime Monitoring'}</option>
            </select>
          </div>

          {/* Symptoms Checklist */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest block">
                {selectedLang === Language.KANNADA ? 'ಹಾಲಿ ಇರುವ ದೈಹಿಕ ಲಕ್ಷಣಗಳು' : 'Active Symptoms Assessment'}
              </label>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {selectedLang === Language.KANNADA ? 'ಕಳೆದ ೨೪ ಗಂಟೆಗಳಲ್ಲಿ ಗಮನಿಸಿದ ಪ್ರಮುಖ ತೊಂದರೆಗಳನ್ನು ಗುರುತಿಸಿ.' : 'Select all immediate physical conditions noticed over the past 24 hours.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              {[
                { key: 'thirst', label: selectedLang === Language.KANNADA ? 'ಅತಿಯಾದ ಬಾಯಾರಿಕೆ' : 'Frequent Thirst', desc: selectedLang === Language.KANNADA ? 'ನಿರಂತರ ಒಣ ಬಾಯಿ' : 'Constant dry mouth' },
                { key: 'urination', label: selectedLang === Language.KANNADA ? 'ಅತಿಯಾದ ಮೂತ್ರವಿಸರ್ಜನೆ' : 'Frequent Urination', desc: selectedLang === Language.KANNADA ? 'ಪದೇ ಪದೇ ಶೌಚಾಲಯಕ್ಕೆ ಹೋಗುವುದು' : 'Excessive urinary trips' },
                { key: 'fatigue', label: selectedLang === Language.KANNADA ? 'ಸುಸ್ತು ಮತ್ತು ದಣಿವು' : 'Fatigue & Lethargy', desc: selectedLang === Language.KANNADA ? 'ಅತಿಯಾದ ನಿಶ್ಯಕ್ತಿ' : 'Feeling unusually worn down' },
                { key: 'dizziness', label: selectedLang === Language.KANNADA ? 'ತಲೆ ತಿರುಗುವುದು' : 'Dizziness & Lightheadedness', desc: selectedLang === Language.KANNADA ? 'ಸಮತೋಲನ ಕಳೆದುಕೊಳ್ಳುವುದು' : 'Unsteady balance' },
                { key: 'weakness', label: selectedLang === Language.KANNADA ? 'ಶಾರೀರಿಕ ದೌರ್ಬಲ್ಯ' : 'Body Weakness', desc: selectedLang === Language.KANNADA ? 'ಸಾಮಾನ್ಯ ಶಕ್ತಿಯ ಕೊರತೆ' : 'Loss of usual strength' },
                { key: 'blurredVision', label: selectedLang === Language.KANNADA ? 'ಮಸುಕಾದ ದೃಷ್ಟಿ' : 'Blurred Vision', desc: selectedLang === Language.KANNADA ? 'ಕಣ್ಣು ಮಸಕಾಗುವುದು' : 'Transient focusing issues' }
              ].map((symptom) => (
                <label 
                  key={symptom.key}
                  className={`flex items-start gap-3 p-3.5 bg-white border rounded-xl cursor-pointer select-none transition-all hover:bg-slate-50 ${
                    insulinSymptoms[symptom.key as keyof typeof insulinSymptoms]
                      ? 'border-emerald-500 bg-emerald-50/20 shadow-xs'
                      : 'border-slate-200'
                  }`}
                >
                  <input 
                    type="checkbox"
                    className="w-4 h-4 accent-emerald-500 mt-0.5 rounded cursor-pointer"
                    checked={insulinSymptoms[symptom.key as keyof typeof insulinSymptoms]}
                    onChange={(e) => setInsulinSymptoms({
                      ...insulinSymptoms,
                      [symptom.key]: e.target.checked
                    })}
                  />
                  <div className="space-y-0.5 leading-none">
                    <span className="text-xs font-bold text-slate-800 block">
                      {symptom.label}
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {symptom.desc}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={() => {
                setInsulinAge('');
                setInsulinWeight('');
                setMealTiming('fasting');
                setBloodGlucose('');
                setSystolicBP('');
                setDiastolicBP('');
                setInsulinSymptoms({
                  thirst: false,
                  fatigue: false,
                  urination: false,
                  dizziness: false,
                  weakness: false,
                  blurredVision: false
                });
                setInsulinReport(null);
                triggerToast(selectedLang === Language.KANNADA ? "ನಮೂನೆ ಮರುಹೊಂದಿಸಲಾಗಿದೆ" : "Form settings refreshed!");
              }}
              className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-black rounded-xl uppercase tracking-wider transition cursor-pointer"
            >
              {selectedLang === Language.KANNADA ? 'ಮರುಹೊಂದಿಸಿ' : 'Reset'}
            </button>
            
            <button
              type="submit"
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-555 hover:bg-emerald-500 text-white text-xs font-black rounded-xl uppercase tracking-wider transition shadow-lg shadow-emerald-505/20 shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Activity className="w-4 h-4 shrink-0" />
              <span>{selectedLang === Language.KANNADA ? 'ವಿಶ್ಲೇಷಣೆ ನಡೆಸಿ' : 'Analyze Clinical Factors'}</span>
            </button>
          </div>
        </form>

        {/* Right Column - Results Pane & Interactive Visuals */}
        <div className="lg:col-span-5 space-y-6">
          
          {insulinReport ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  {selectedLang === Language.KANNADA ? 'ಮೌಲ್ಯಮಾಪನ ವರದಿ' : 'Diagnostic Report Output'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  ID: {insulinReport.id}
                </span>
              </div>

              {/* Glucose Status Indicator & Pulse Animation */}
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl">
                <div className="relative flex items-center justify-center">
                  <span className={`animate-ping absolute inline-flex h-10 w-10 rounded-full opacity-35 ${
                    insulinReport.riskLevel === 'high' 
                      ? (insulinReport.glucoseStatus.includes('High') ? 'bg-rose-450 bg-rose-400' : 'bg-amber-450 bg-amber-400')
                      : 'bg-emerald-450 bg-emerald-400'
                  }`}></span>
                  <div className={`relative w-12 h-12 rounded-full flex items-center justify-center ${
                    insulinReport.riskLevel === 'high'
                      ? (insulinReport.glucoseStatus.includes('High') ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-500')
                      : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    <HeartPulse className="w-6 h-6 animate-pulse" />
                  </div>
                </div>
                
                <div className="text-start space-y-0.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                    {selectedLang === Language.KANNADA ? 'ಹಾಲಿ ಸ್ಥಿತಿ' : 'Current Status'}
                  </span>
                  <h4 className="text-lg font-black text-slate-800 leading-none">
                    {selectedLang === Language.KANNADA
                      ? (insulinReport.glucoseStatus.includes('High') ? 'ಹೆಚ್ಚಿನ ಗ್ಲುಕೋಸ್ ಅಪಾಯ' : (insulinReport.glucoseStatus.includes('Low') ? 'ಕಡಿಮೆ ಗ್ಲುಕೋಸ್ ಅಪಾಯ' : 'ಸಾಮಾನ್ಯ ಗ್ಲುಕೋಸ್ ಮಟ್ಟ'))
                      : insulinReport.glucoseStatus}
                  </h4>
                  <span className={`inline-flex px-2 py-0.5 mt-1 rounded text-[10px] font-bold uppercase tracking-wider border ${
                    insulinReport.riskLevel === 'high'
                      ? 'bg-rose-50 border-rose-200 text-rose-700'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  }`}>
                    {selectedLang === Language.KANNADA
                      ? (insulinReport.riskLevel === 'high' ? 'ಹೆಚ್ಚಿನ ಅಪಾಯ' : 'ಕಡಿಮೆ ಅಪಾಯ')
                      : `${insulinReport.riskLevel.toUpperCase()} RISK METRIC`}
                  </span>
                </div>
              </div>

              {/* Animated medical dashboard cards */}
              <div className="grid grid-cols-2 gap-3 text-start">
                <div className="bg-slate-50/50 border border-slate-100 p-3.5 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">{selectedLang === Language.KANNADA ? 'ರೋಗಿಯ ವಯಸ್ಸು' : 'Bio Age Factor'}</span>
                  <span className="text-base font-black text-slate-850 text-slate-800">{insulinReport.age} <span className="text-xs text-slate-500">{selectedLang === Language.KANNADA ? 'ವರ್ಷ' : 'Yrs'}</span></span>
                  <span className="block text-[9px] text-slate-400 mt-1">{insulinReport.age > 45 ? 'Senior Bracket' : 'Standard Bracket'}</span>
                </div>
                <div className="bg-slate-50/50 border border-slate-100 p-3.5 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">{selectedLang === Language.KANNADA ? 'ದೇಹದ ತೂಕ' : 'Metabolic Weight'}</span>
                  <span className="text-base font-black text-slate-850 text-slate-800">{insulinReport.weight} <span className="text-xs text-slate-500">kg</span></span>
                  <span className="block text-[9px] text-slate-400 mt-1">Simulated BMI: ~{Math.round((insulinReport.weight / 1.75 ** 2) * 10) / 10}</span>
                </div>
                <div className="bg-slate-50/50 border border-slate-100 p-3.5 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">{selectedLang === Language.KANNADA ? 'ಊಟದ ವಿಂಡೋ' : 'Insulin Context'}</span>
                  <span className="text-xs font-extrabold text-slate-700 block truncate mt-1">{insulinReport.mealTiming.toUpperCase()}</span>
                  <span className="block text-[9px] text-slate-400">Activity: 4 hours</span>
                </div>
                <div className="bg-slate-50/50 border border-slate-100 p-3.5 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">{selectedLang === Language.KANNADA ? 'ಲಕ್ಷಣಗಳ ತೀವ್ರತೆ' : 'Symptom Severity'}</span>
                  <span className="text-base font-black text-slate-800">
                    {Object.values(insulinReport.symptoms).filter(Boolean).length} <span className="text-xs font-normal text-slate-500">/6</span>
                  </span>
                  <span className="block text-[9px] text-slate-400 mt-1">Active complaints</span>
                </div>
              </div>
 
              {/* Classification Badges */}
              <div className="grid grid-cols-2 gap-3 text-start">
                <div className={`p-4 rounded-xl border ${
                  insulinReport.diabetesClassification?.includes('Type 1') || insulinReport.diabetesClassification?.includes('ಟೈಪ್ 1')
                    ? 'bg-red-50/50 border-red-200/60 text-red-950'
                    : insulinReport.diabetesClassification?.includes('Type 2') || insulinReport.diabetesClassification?.includes('ಟೈಪ್ 2')
                    ? 'bg-amber-50/50 border-amber-200/60 text-amber-950'
                    : insulinReport.diabetesClassification?.includes('Pre-diabetes') || insulinReport.diabetesClassification?.includes('ಪ್ರಿ-ಡಯಾಬಿಟಿಸ್')
                    ? 'bg-yellow-50/50 border-yellow-200/60 text-yellow-950'
                    : 'bg-emerald-50/50 border-emerald-200/60 text-emerald-950'
                }`}>
                  <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">
                    {selectedLang === Language.KANNADA ? 'ಮಧುಮೇಹ ವರ್ಗೀಕರಣ' : 'Diabetes Classification'}
                  </span>
                  <span className="text-xs font-black block mt-1.5 leading-tight">
                    {insulinReport.diabetesClassification || (selectedLang === Language.KANNADA ? "ಸಾಮಾನ್ಯ ಗ್ಲುಕೋಸ್ ಮಟ್ಟದ ಸೂಚನೆ" : "Normal Glycemia Indicators")}
                  </span>
                  {insulinReport.bloodSugar !== undefined && (
                    <span className="text-[9px] text-slate-400 block mt-1 font-mono">
                      Glucose: {insulinReport.bloodSugar} mg/dL
                    </span>
                  )}
                </div>

                <div className={`p-4 rounded-xl border ${
                  insulinReport.bpClassification?.includes('High') || insulinReport.bpClassification?.includes('ಹೆಚ್ಚಿನ')
                    ? 'bg-red-50/50 border-red-200/60 text-red-950'
                    : insulinReport.bpClassification?.includes('Low') || insulinReport.bpClassification?.includes('ಕಡಿಮೆ')
                    ? 'bg-amber-50/50 border-amber-200/60 text-amber-950'
                    : insulinReport.bpClassification?.includes('Elevated') || insulinReport.bpClassification?.includes('ಸಾಧಾರಣಕ್ಕಿಂತ')
                    ? 'bg-yellow-50/50 border-yellow-200/60 text-yellow-950'
                    : 'bg-emerald-50/50 border-emerald-200/60 text-emerald-950'
                }`}>
                  <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">
                    {selectedLang === Language.KANNADA ? 'ರಕ್ತದೊತ್ತಡ ವರ್ಗೀಕರಣ' : 'BP Classification'}
                  </span>
                  <span className="text-xs font-black block mt-1.5 leading-tight">
                    {insulinReport.bpClassification || (selectedLang === Language.KANNADA ? "ಸಾಮಾನ್ಯ ರಕ್ತದೊತ್ತಡ" : "Normal BP Range")}
                  </span>
                  {insulinReport.systolicBP !== undefined && insulinReport.diastolicBP !== undefined && (
                    <span className="text-[9px] text-slate-400 block mt-1 font-mono">
                      BP: {insulinReport.systolicBP}/{insulinReport.diastolicBP} mmHg
                    </span>
                  )}
                </div>
              </div>

              {/* Recommendation Card */}
              <div className="space-y-1 bg-sky-50/40 border border-sky-100 p-4 rounded-xl text-start">
                <h5 className="text-[11px] font-black uppercase text-sky-800 tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                  {selectedLang === Language.KANNADA ? 'ಇನ್ಸುಲಿನ್ ಶಿಫಾರಸು' : 'Adaptive Insulin Recommendation'}
                </h5>
                <p className="text-xs font-bold text-slate-800 leading-relaxed pt-1">
                  {insulinReport.recommendation}
                </p>
              </div>

              {/* Health Advice card */}
              <div className="space-y-1 bg-emerald-50/30 border border-emerald-100 p-4 rounded-xl text-start">
                <h5 className="text-[11px] font-black uppercase text-emerald-800 tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  {selectedLang === Language.KANNADA ? 'ಸಲಹೆ ಮತ್ತು ಮಾರ್ಗಸೂಚಿಗಳು' : 'Interactive Medical Support Advice'}
                </h5>
                <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                  {insulinReport.advice}
                </p>
              </div>

              {/* Read Aloud Button */}
              {voiceEnabled && (
                <button
                  type="button"
                  onClick={() => {
                    const textToSpeak = `Patient assessment completed. Results identify: ${insulinReport.glucoseStatus}. Recommended action is: ${insulinReport.recommendation}`;
                    speakText(textToSpeak, 'en');
                  }}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Volume2 className="w-4 h-4 text-sky-400" />
                  <span>{selectedLang === Language.KANNADA ? 'ವರದಿಯನ್ನು ಜೋರಾಗಿ ಪಠಿಸಿ' : 'Read Aloud Report'}</span>
                </button>
              )}
            </motion.div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 border-dashed p-8 text-center flex flex-col items-center justify-center min-h-[340px] space-y-4">
              <div className="w-14 h-14 bg-slate-50 text-slate-400 border border-slate-200 rounded-full flex items-center justify-center">
                <Activity className="w-7 h-7 text-slate-400" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h4 className="text-sm font-bold text-slate-700">{selectedLang === Language.KANNADA ? 'ಮಾಹಿತಿಗಾಗಿ ಕಾಯಲಾಗುತ್ತಿದೆ' : 'Waiting for Bio-Metrics Input'}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {selectedLang === Language.KANNADA 
                    ? 'ಅಡಾಪ್ಟಿವ್ ಇನ್ಸುಲಿನ್ ಮತ್ತು ಆವೃತ್ತಿ ಸಲಹೆ ಪಡೆಯಲು ಎಡಭಾಗದ ನಮೂನೆಯಲ್ಲಿ ವಿವರಗಳನ್ನು ಭರ್ತಿ ಮಾಡಿ ವಿಶ್ಲೇಷಿಸಿ.'
                    : 'Fill in physical parameters and mark observed diagnostic symptoms to evaluate adaptive glucose metrics and retrieve critical recommendations.'}
                </p>
              </div>
            </div>
          )}

          {/* Simplistic Trend / Glycemic Progress Tracker Visualisation */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3.5 text-start">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600 shrink-0" />
              {selectedLang === Language.KANNADA ? 'ಇತ್ತೀಚಿನ ಗ್ಲುಕೋಸ್ ಪ್ರವೃತ್ತಿ ಗ್ರಾಫ್' : 'Recent Patient Glycemic Trend'}
            </h4>
            
            {insulinHistory.length > 0 ? (
              <div className="space-y-4">
                <div className="h-20 bg-slate-50 border border-slate-100 rounded-xl p-2 flex items-center justify-center relative overflow-hidden">
                  <svg viewBox="0 0 400 100" className="w-full h-full text-emerald-600">
                    {(() => {
                      const reversedHistory = [...insulinHistory].reverse().slice(-7);
                      if (reversedHistory.length === 1) {
                        return (
                          <>
                            <circle cx="200" cy="50" r="6" fill="#10b981" />
                            <text x="200" y="80" textAnchor="middle" fontSize="10" fill="#64748b" fontWeight="bold">Steady Baseline</text>
                          </>
                        );
                      }
                      
                      const points = reversedHistory.map((item, idx) => {
                        const statusVal = item.glucoseStatus.includes('High') ? 2 : (item.glucoseStatus.includes('Low') ? 0 : 1);
                        const x = (idx / (reversedHistory.length - 1)) * 360 + 20;
                        const y = 80 - statusVal * 30; // 0 -> 80, 1 -> 50, 2 -> 20
                        return { x, y, statusVal };
                      });

                      const pathD = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

                      return (
                        <>
                          <line x1="10" y1="20" x2="390" y2="20" stroke="#fecaca" strokeDasharray="3,3" />
                          <line x1="10" y1="50" x2="390" y2="50" stroke="#a7f3d0" strokeDasharray="3,3" />
                          <line x1="10" y1="80" x2="390" y2="80" stroke="#fef3c7" strokeDasharray="3,3" />
                          
                          <path d={pathD} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                          
                          {points.map((p, idx) => (
                            <circle 
                              key={idx}
                              cx={p.x} 
                              cy={p.y} 
                              r="4.5" 
                              fill={p.statusVal === 2 ? '#ef4444' : (p.statusVal === 0 ? '#f59e0b' : '#10b981')} 
                            />
                          ))}
                        </>
                      );
                    })()}
                  </svg>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span> High Risk</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Normal Baseline</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Low Risk</span>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 italic text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                {selectedLang === Language.KANNADA
                  ? 'ಗ್ಲುಕೋಸ್ ಹರಡುವಿಕೆಯ ಗ್ರಾಫ್ ನಿರ್ಮಿಸಲು ಕನಿಷ್ಠ ಒಂದು ಅಸೆಸ್ಮೆಂಟ್ ಪೂರ್ಣಗೊಳಿಸಿ.'
                  : 'No history logged yet. Complete an assessment to generate your glycemic trend dashboard.'}
              </p>
            )}
          </div>

        </div>
      </div>

      {/* Historical Logs List */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 text-start">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-3">
          <div className="space-y-0.5">
            <h4 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600" />
              {selectedLang === Language.KANNADA ? 'ಹಿಂದಿನ ಇನ್ಸುಲಿನ್ ಆವೃತ್ತಿಗಳ ಲಾಗ್ಗಳು' : 'Previous Adaptive Insulin Decisions'}
            </h4>
            <p className="text-xs text-slate-400">
              {selectedLang === Language.KANNADA ? 'ಬ್ರೌಸರ್ ಸೆಷನ್‌ನಲ್ಲಿ ಸಂಗ್ರಹವಾಗಿರುವ ರೋಗಿಯ ಇನ್ಸುಲಿನ್ ನಿರ್ಧಾರ ವರದಿಗಳು.' : 'All calculated physiological assessments logged securely inside this browser cabinet session.'}
            </p>
          </div>
          
          {insulinHistory.length > 0 && (
            <button
              onClick={() => {
                if (confirm(selectedLang === Language.KANNADA ? "ಎಲ್ಲಾ ಹಳೆಯ ರೆಕಾರ್ಡ್‌ಗಳನ್ನು ಅಳಿಸಲು ಖಚಿತಪಡಿಸಿ?" : "Are you sure you want to purge all adaptive reports?")) {
                  setInsulinHistory([]);
                  setInsulinReport(null);
                  triggerToast(selectedLang === Language.KANNADA ? "ಎಲ್ಲಾ ವರದಿಗಳನ್ನು ಅಳಿಸಲಾಗಿದೆ" : "Decision logs purged successfully!");
                }
              }}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-700 text-xs font-bold rounded-lg transition shrink-0 cursor-pointer"
            >
              {selectedLang === Language.KANNADA ? 'ಎಲ್ಲಾ ಅಳಿಸಿ' : 'Clear All Logs'}
            </button>
          )}
        </div>

        {insulinHistory.length === 0 ? (
          <div className="text-center py-8 text-slate-400 space-y-2">
            <Database className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-xs">{selectedLang === Language.KANNADA ? 'ಯಾವುದೇ ಹಿಂದಿನ ವರದಿಗಳು ಇಲ್ಲ.' : 'No saved metabolic report records.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-250 text-slate-400 font-bold">
                  <th className="py-2.5 px-2">ID</th>
                  <th className="py-2.5 px-2">Timestamp</th>
                  <th className="py-2.5 px-2">Age/Weight</th>
                  <th className="py-2.5 px-2">Window</th>
                  <th className="py-2.5 px-2">Symptoms</th>
                  <th className="py-2.5 px-2">Status</th>
                  <th className="py-2.5 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {insulinHistory.map((entry) => {
                  const activeCount = Object.values(entry.symptoms).filter(Boolean).length;
                  return (
                    <tr key={entry.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                      <td className="py-3 px-2 font-mono font-bold text-slate-600">{entry.id}</td>
                      <td className="py-3 px-2 text-slate-500">
                        {new Date(entry.submittedAt).toLocaleDateString()} {new Date(entry.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-2 text-slate-800 font-bold">
                        {entry.age} yrs / {entry.weight} kg
                      </td>
                      <td className="py-3 px-2 text-slate-600 uppercase font-mono text-[10px]">
                        {entry.mealTiming}
                      </td>
                      <td className="py-3 px-2 text-slate-500 font-medium">
                        {activeCount ? `${activeCount} symptoms` : 'None'}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                            entry.riskLevel === 'high'
                              ? 'bg-rose-50 border-rose-200 text-rose-700'
                              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          }`}>
                            {entry.glucoseStatus}
                          </span>
                          {(entry.diabetesClassification || entry.bpClassification) && (
                            <div className="text-[10px] text-slate-450 text-slate-500 font-semibold block leading-tight mt-1">
                              {entry.diabetesClassification && <div className="text-emerald-700 font-bold">{entry.diabetesClassification}</div>}
                              {entry.bpClassification && <div className="text-teal-700 font-bold">{entry.bpClassification}</div>}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => {
                              setInsulinReport(entry);
                              setInsulinAge(String(entry.age));
                              setInsulinWeight(String(entry.weight));
                              setMealTiming(entry.mealTiming);
                              setBloodGlucose(entry.bloodSugar ? String(entry.bloodSugar) : '');
                              setSystolicBP(entry.systolicBP ? String(entry.systolicBP) : '');
                              setDiastolicBP(entry.diastolicBP ? String(entry.diastolicBP) : '');
                              setInsulinSymptoms(entry.symptoms);
                              triggerToast(`Loaded: ${entry.id}`);
                            }}
                            className="px-2.5 py-1.5 bg-sky-50 text-sky-600 border border-sky-100 hover:bg-sky-100 text-[11px] font-black rounded-lg transition cursor-pointer"
                          >
                            Inspect
                          </button>
                          
                          <button
                            onClick={() => {
                              const filtered = insulinHistory.filter(item => item.id !== entry.id);
                              setInsulinHistory(filtered);
                              if (insulinReport?.id === entry.id) {
                                setInsulinReport(null);
                              }
                              triggerToast("Record deleted");
                            }}
                            className="px-2.5 py-1.5 bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 rounded-lg transition text-[11px] cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Styled Emergency Alert Modal */}
      <AnimatePresence>
        {showInsulinWarning && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="bg-white rounded-2xl max-w-lg w-full border-2 border-red-500 shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center gap-4 text-left border-b border-slate-105 pb-3">
                <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center text-rose-600 shrink-0">
                  <AlertTriangle className="w-7 h-7 text-red-600 animate-bounce" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-red-600 tracking-wider block">
                    {selectedLang === Language.KANNADA ? 'ತುರ್ತು ಚಿಕಿತ್ಸಾ ಎಚ್ಚರಿಕೆ' : 'Critical Assessment Warning Triggered'}
                  </span>
                  <h3 className="text-base font-black text-slate-800 leading-none mt-0.5">
                    {selectedLang === Language.KANNADA ? 'ಅಸಾಮಾನ್ಯ ಜೈವಿಕ ಗ್ಲುಕೋಸ್ ಅಪಾಯ ಕಂಡುಬಂದಿದೆ' : 'Acute Clinical Risk Parameters Detected'}
                  </h3>
                </div>
              </div>

              <p className="text-slate-700 text-xs leading-relaxed font-bold bg-rose-50 border border-rose-100 p-4 rounded-xl text-left select-all">
                {insulinWarningText}
              </p>

              <div className="flex gap-3 justify-end pt-2">
                {voiceEnabled && (
                  <button
                    type="button"
                    onClick={() => speakText(insulinWarningText, selectedLang === Language.KANNADA ? 'kn' : 'en')}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4 text-sky-600" />
                    <span>{selectedLang === Language.KANNADA ? 'ಧ್ವನಿ ಎಚ್ಚರಿಕೆ' : 'Vocal Warning'}</span>
                  </button>
                )}
                
                <button
                  type="button"
                  onClick={() => {
                    setShowInsulinWarning(false);
                  }}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-red-200 cursor-pointer"
                >
                  {selectedLang === Language.KANNADA ? 'ಖಚಿತಪಡಿಸಿ ಮರುಸ್ಥಾಪಿಸಿ' : 'Acknowledge & Dismiss'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
