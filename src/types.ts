export enum Language {
  ENGLISH = 'en',
  KANNADA = 'kn'
}

export interface PatientResponse {
  id: string; // Patient ID
  screeningId?: string; // Screening report ID
  name: string;
  age: number;
  language: Language;
  gender?: 'Male' | 'Female' | 'Other' | '';
  address?: string;
  hasDiabetesOrHypertension?: string;
  fatherHistory?: string;
  motherHistory?: string;
  siblingsHistory?: string;
  ashaWorker?: {
    id: string;
    name: string;
    phone: string;
    email: string;
    assignedArea: string;
    hospital: string;
  };
  moderator?: {
    name: string;
    phone: string;
    email: string;
  };
  answers: Record<string, string>; // Maps questionId -> user input text
  riskFactor: 'low' | 'medium' | 'high';
  riskScore: number; // calculated scale
  predictions: {
    diabetesRisk: 'low' | 'medium' | 'high';
    hypertensionRisk: 'low' | 'medium' | 'high';
    notes: string;
  };
  bloodSugar?: number;
  systolicBP?: number;
  diastolicBP?: number;
  vitals?: {
    bloodSugar?: number;
    systolicBP?: number;
    diastolicBP?: number;
    diabetesClassification?: string;
    bpClassification?: string;
    riskPercentage?: number;
    status?: string;
    nextScheduledDays?: number;
    dueDate?: string;
  };
  submittedAt: string;
  synced: boolean;
  ashaVerifiedBy?: string; // Asha worker ID who scanned / verified this
}

export interface Question {
  id: string;
  text: Record<Language, string>;
  voicePrompt: Record<Language, string>;
  category: 'BP' | 'diabetes' | 'general' | 'lifestyle';
}

export interface SyncItem {
  id: string;
  action: 'CREATE' | 'SYNC_PATIENT';
  data: PatientResponse;
  status: 'pending' | 'synced' | 'failed';
  timestamp: string;
}

export interface AshaWorker {
  id: string;
  name: string;
  assignedArea: string;
}

export interface AssignedHouse {
  id: string;
  houseNumber: string;
  familyHead: string;
  screeningStatus: 'pending' | 'completed' | 'overdue';
  riskRatio: 'low' | 'medium' | 'high' | null;
  coords: { x: number; y: number }; // x,y on simulated grid map
  memberCount: number;
  area?: string;
}

export interface Notification {
  id: string;
  patientId: string;
  patientName: string;
  riskFactor: 'low' | 'medium' | 'high';
  message: string;
  timestamp: string;
  read: boolean;
}

export interface ScreeningHistoryEntry {
  id: string;                     // Unique Screening Session ID
  patientId: string;              // Linked Patient ID
  timestamp: string;              // Screening Date & Time
  patientDetails: {
    id: string;
    name: string;
    age: number;
    gender?: 'Male' | 'Female' | 'Other' | '';
    address?: string;
    language?: string;
  };
  answers: Record<string, string>; // Complete screening questionnaire responses
  riskResults: {
    riskFactor: 'low' | 'medium' | 'high';
    riskScore: number;
    predictions: {
      diabetesRisk: 'low' | 'medium' | 'high';
      hypertensionRisk: 'low' | 'medium' | 'high';
      notes: string;
    };
    vitals?: {
      bloodSugar?: number;
      systolicBP?: number;
      diastolicBP?: number;
      diabetesClassification?: string;
      bpClassification?: string;
      riskPercentage?: number;
      status?: string;
      nextScheduledDays?: number;
      dueDate?: string;
    }
  };
  ashaWorker?: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    assignedArea?: string;
    hospital?: string;
  };
}

export interface FollowUpTask {
  taskId: string;
  patientId: string;
  patientName: string;
  dueDate: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'Completed' | 'Overdue';
  actionRequired: string;
  diabetesClassification: string;
  bpClassification: string;
  riskFactor: 'low' | 'medium' | 'high';
  riskPercentage: number;
}

export interface VitalsReading {
  timestamp: string;
  bloodSugar?: number;
  systolicBP?: number;
  diastolicBP?: number;
  diabetesClassification: string;
  bpClassification: string;
  riskFactor: 'low' | 'medium' | 'high';
  riskPercentage: number;
}

