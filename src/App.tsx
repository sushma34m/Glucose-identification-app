import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import QRCode from 'qrcode';
import {
  Mic,
  Volume2,
  VolumeX,
  Search,
  FileText,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Download,
  QrCode,
  MapPin,
  Users,
  Send,
  Activity,
  Wifi,
  WifiOff,
  Database,
  LogOut,
  Map,
  UserCheck,
  Check,
  X,
  ChevronRight,
  UserPlus,
  ArrowRight,
  Lock,
  MessageSquare,
  Sparkles,
  Award,
  BookOpen,
  ShieldAlert,
  HeartPulse,
  Clock,
  User,
  Calendar,
  LineChart
} from 'lucide-react';

import { jsPDF } from 'jspdf';
import { Language, PatientResponse, Question, SyncItem, AssignedHouse, Notification, ScreeningHistoryEntry, FollowUpTask } from './types';
import { SYSTEM_GREETINGS, DIABETES_QUESTION_BANK, HYPERTENSION_QUESTION_BANK, MODERATOR_DATA, SIMULATED_ASHA_MAP, DEMO_ASHA_WORKERS, AGE_GROUPS } from './data';
import AudioWaveform from './components/AudioWaveform';
import { LiveAshaMap } from './components/LiveAshaMap';
import { EmergencyHotline } from './components/EmergencyHotline';
import { AdaptiveInsulinSystem } from './components/AdaptiveInsulinSystem';
import {
  classifyDiabetes,
  classifyHypertension,
  calculateVitalsRisk,
  evaluateNextClinicalAction,
  generateFollowUpTask,
  computeDiseaseProgression
} from './utils/closedLoop';



export default function App() {
  // Navigation & Role States
  const [activePortal, setActivePortal] = useState<'patient' | 'asha' | 'history'>('patient');
  const [selectedRole, setSelectedRole] = useState<'patient' | 'asha' | null>(null);
  const [loggedInPatientName, setLoggedInPatientName] = useState<string>('');
  const [loggedInPatientPhone, setLoggedInPatientPhone] = useState<string>('');
  const [patientAuthTab, setPatientAuthTab] = useState<'login' | 'register'>('login');
  const [patientAuthError, setPatientAuthError] = useState('');
  const [patientAuthLoading, setPatientAuthLoading] = useState(false);
  const [screeningsHistory, setScreeningsHistory] = useState<ScreeningHistoryEntry[]>([]);
  const [selectedHistoryEntry, setSelectedHistoryEntry] = useState<ScreeningHistoryEntry | null>(null);
  const [reportNotFoundError, setReportNotFoundError] = useState<string | null>(null);
  const [isDirectReportView, setIsDirectReportView] = useState(false);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyRiskFilter, setHistoryRiskFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  
  // Synchronized actual offline storage
  const [onlineStatus, setOnlineStatus] = useState(() => {
    if (typeof window !== 'undefined' && navigator) {
      return navigator.onLine;
    }
    return true;
  });
  const [offlineSyncQueue, setOfflineSyncQueue] = useState<SyncItem[]>(() => {
    try {
      const saved = localStorage.getItem('offline_sync_queue');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [globalPatients, setGlobalPatients] = useState<PatientResponse[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [syncingNow, setSyncingNow] = useState(false);
  const [syncCompletedMsg, setSyncCompletedMsg] = useState('');

  // ASHA Worker Login state
  const [ashaWorker, setAshaWorker] = useState<any>(null);
  const [ashaEmployeeId, setAshaEmployeeId] = useState('1001');
  const [ashaName, setAshaName] = useState('ALIA RAI');
  const [ashaPassword, setAshaPassword] = useState('');
  const [ashaPhone, setAshaPhone] = useState('+91 1234567890');
  const [ashaAuthTab, setAshaAuthTab] = useState<'login' | 'register'>('login');
  const [ashaAuthLoading, setAshaAuthLoading] = useState(false);
  const [ashaLoginError, setAshaLoginError] = useState('');
  const [isVoiceAuthListening, setIsVoiceAuthListening] = useState(false);
  const [moderatorEmail, setModeratorEmail] = useState('surakshashetty359@gmail.com');
  const [emailCustomMessage, setEmailCustomMessage] = useState('');
  const [isSendingEmailDigest, setIsSendingEmailDigest] = useState(false);



  // Patient Screening Form Flow State
  const [selectedLang, setSelectedLang] = useState<Language>(Language.ENGLISH);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [screeningStep, setScreeningStep] = useState<
    | 'language'
    | 'rolesSelection'
    | 'patientLogin'
    | 'patientDashboard'
    | 'insulinSystem'
    | 'name'
    | 'gender'
    | 'address'
    | 'familySelf'
    | 'familyFather'
    | 'familyMother'
    | 'familySiblings'
    | 'age'
    | 'questioning'
    | 'report'
  >('language');
  
  // Interactive Screening Values
  const [patientName, setPatientName] = useState('');
  const [patientGender, setPatientGender] = useState<'Male' | 'Female' | 'Other' | ''>('');
  const [patientAddress, setPatientAddress] = useState('');
  const [familySelf, setFamilySelf] = useState('');
  const [familyFather, setFamilyFather] = useState('');
  const [familyMother, setFamilyMother] = useState('');
  const [familySiblings, setFamilySiblings] = useState('');
  const [assignedAsha, setAssignedAsha] = useState<any>(null);
  const [patientAge, setPatientAge] = useState<number | ''>('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  
  // Confirmation state (asks "Is this correct?" after every voice input)
  const [pendingConfirmation, setPendingConfirmation] = useState<{
    stage: 'name' | 'gender' | 'address' | 'familySelf' | 'familyFather' | 'familyMother' | 'familySiblings' | 'age' | 'question';
    value: string;
    questionId?: string;
  } | null>(null);

  // Web Speech API references
  const [isListening, setIsListening] = useState(false);
  const [transcriptText, setTranscriptText] = useState('');
  const [speechError, setSpeechError] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Final Screening Report result
  const [currentReport, setCurrentReport] = useState<PatientResponse | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [analyzingRisk, setAnalyzingRisk] = useState(false);

  // ASHA Area Map & Operations State
  const [assignedHouses, setAssignedHouses] = useState<AssignedHouse[]>(SIMULATED_ASHA_MAP);
  const [selectedHouse, setSelectedHouse] = useState<AssignedHouse | null>(null);
  const [selectedDossierPatient, setSelectedDossierPatient] = useState<PatientResponse | null>(null);
  const [manualPatientForm, setManualPatientForm] = useState({
    name: '',
    age: '',
    language: Language.ENGLISH,
    answers: {} as Record<string, string>
  });
  const [manualEntryActive, setManualEntryActive] = useState(false);
  const [guidanceMessageText, setGuidanceMessageText] = useState('');
  const [ashaSearchQuery, setAshaSearchQuery] = useState('');
  const [ashaRiskFilter, setAshaRiskFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  // Closed Load Vitals Input States
  const [bloodSugar, setBloodSugar] = useState<string>('');
  const [systolicBP, setSystolicBP] = useState<string>('');
  const [diastolicBP, setDiastolicBP] = useState<string>('');
  
  const [manualBloodSugar, setManualBloodSugar] = useState<string>('');
  const [manualSystolicBP, setManualSystolicBP] = useState<string>('');
  const [manualDiastolicBP, setManualDiastolicBP] = useState<string>('');

  const [dossierBloodSugar, setDossierBloodSugar] = useState<string>('');
  const [dossierSystolicBP, setDossierSystolicBP] = useState<string>('');
  const [dossierDiastolicBP, setDossierDiastolicBP] = useState<string>('');

  const [followUpTasks, setFollowUpTasks] = useState<FollowUpTask[]>(() => {
    try {
      const saved = localStorage.getItem('healthsync_followup_tasks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('healthsync_followup_tasks', JSON.stringify(followUpTasks));
    } catch (e) {
      console.error(e);
    }
  }, [followUpTasks]);

  // QR Code Verification State
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [qrScanInput, setQrScanInput] = useState('');
  const [qrScanData, setQrScanData] = useState<any | null>(null);
  const [qrScanSuccessMsg, setQrScanSuccessMsg] = useState('');
  const [qrScanLoading, setQrScanLoading] = useState(false);

  // Notification Toast Overlay
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Speech recognition initialization
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  
  // Audio reference for high-quality backup TTS (for languages with missing native voices)
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);

  // Speech session ID to prevent race conditions during rapid user clicks
  const speechSessionIdRef = useRef<number>(0);

  // Trigger brief alert toasts
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Sync actual status
  const computedIsOnline = onlineStatus;

  // Persist offline sync queue state to localStorage under standard key
  useEffect(() => {
    try {
      localStorage.setItem('offline_sync_queue', JSON.stringify(offlineSyncQueue));
    } catch (e) {
      console.error("Failed to persist offline sync queue:", e);
    }
  }, [offlineSyncQueue]);

  // Automatically trigger queue sync when internet/wifi is reconnected
  useEffect(() => {
    if (computedIsOnline && offlineSyncQueue.length > 0) {
      autoSyncOfflineQueue();
    }
  }, [computedIsOnline, offlineSyncQueue.length]);

  // Automatically sync assignedAsha state when ashaWorker login status changes
  useEffect(() => {
    if (ashaWorker) {
      setAssignedAsha(ashaWorker);
    } else {
      setAssignedAsha(null);
    }
  }, [ashaWorker]);

  // Track standard browser internet connection changes
  useEffect(() => {
    const handleOnline = () => {
      setOnlineStatus(true);
      triggerToast("System Connected to Internet! Automatically synchronising records...");
    };
    const handleOffline = () => {
      setOnlineStatus(false);
      triggerToast("Network Disconnected: The system is now running in secure local offline mode.");
    };

    // Ensure we are initially accurate
    if (typeof window !== 'undefined' && navigator) {
      setOnlineStatus(navigator.onLine);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check for direct routing via URL path or hash containing a report/screening ID
  useEffect(() => {
    const checkDirectUrlRoute = async () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      let urlReportId = '';

      if (path.includes('/report/')) {
        urlReportId = path.split('/report/')[1];
      } else if (hash.includes('report/')) {
        urlReportId = hash.split('report/')[1];
      }

      if (urlReportId) {
        setIsDirectReportView(true);
        urlReportId = urlReportId.split('?')[0].trim();
        if (urlReportId) {
          try {
            // Helper to extract parameters from current URL search or hash portion
            const getQueryParam = (key: string): string => {
              const searchParams = new URLSearchParams(window.location.search);
              if (searchParams.has(key)) return searchParams.get(key) || '';
              const hashParts = window.location.hash.split('?');
              if (hashParts.length > 1) {
                const hashParams = new URLSearchParams(hashParts[1]);
                if (hashParams.has(key)) return hashParams.get(key) || '';
              }
              return '';
            };

            // First search in local storage caches
            const cachedHistoryStr = localStorage.getItem('local_screenings_history_cache');
            let matchedLocal: ScreeningHistoryEntry | null = null;
            if (cachedHistoryStr) {
              try {
                const list: ScreeningHistoryEntry[] = JSON.parse(cachedHistoryStr);
                const found = list.find(scr => scr.id === urlReportId || scr.patientId === urlReportId);
                if (found) matchedLocal = found;
              } catch (e) {}
            }

            if (matchedLocal) {
              setSelectedHistoryEntry(matchedLocal);
              triggerToast("Direct report referenced from URL loaded!");
              return;
            }

            // Retrieve from Backend Clinical Database
            if (computedIsOnline) {
              try {
                const res = await fetch(`/api/screenings/${urlReportId}`);
                if (res.ok) {
                  const data = await res.json();
                  setSelectedHistoryEntry(data);
                  triggerToast("Clinical screening report opened automatically!");
                  return;
                }
              } catch (err) {
                console.error("Backend fetch for direct URL report failed", err);
              }
            }

            // Fallback: If not found in cache or DB, try to dynamically reconstruct card details from URL parameters (offline QR scanning)
            const nameParam = getQueryParam('name');
            if (nameParam) {
              const constructedEntry: ScreeningHistoryEntry = {
                id: urlReportId,
                patientId: getQueryParam('pId') || `PAT-${Date.now()}`,
                timestamp: getQueryParam('ts') || new Date().toISOString(),
                patientDetails: {
                  id: getQueryParam('pId') || `PAT-${Date.now()}`,
                  name: nameParam,
                  age: parseInt(getQueryParam('age') || '40', 10),
                  gender: (getQueryParam('gender') as any) || 'Other',
                  address: getQueryParam('address') || 'Ullal Health Ward',
                  language: (getQueryParam('lang') as any) || 'en'
                },
                answers: {},
                riskResults: {
                  riskFactor: (getQueryParam('risk') as 'high' | 'medium' | 'low') || 'low',
                  riskScore: parseInt(getQueryParam('score') || '0', 10),
                  predictions: {
                    diabetesRisk: (getQueryParam('db') as 'high' | 'medium' | 'low') || 'low',
                    hypertensionRisk: (getQueryParam('bp') as 'high' | 'medium' | 'low') || 'low',
                    notes: `Verified secure digital QR receipt loaded offline. Worker: ${getQueryParam('asha') || 'ASHA Staff'}.`
                  }
                },
                ashaWorker: getQueryParam('asha') ? {
                  id: '1001',
                  name: getQueryParam('asha'),
                  phone: getQueryParam('ashaPhone') || '+91 1234567890',
                  email: '',
                  assignedArea: 'Ullal',
                  hospital: 'Ullal Government Hospital'
                } : undefined
              };

              // Cache reconstructed report
              const currentHist = localStorage.getItem('local_screenings_history_cache');
              let loadedHist: ScreeningHistoryEntry[] = [];
              if (currentHist) {
                try { loadedHist = JSON.parse(currentHist); } catch (e) {}
              }
              if (!loadedHist.some(h => h.id === constructedEntry.id)) {
                loadedHist.unshift(constructedEntry);
                setScreeningsHistory(loadedHist);
                localStorage.setItem('local_screenings_history_cache', JSON.stringify(loadedHist));
              }

              setSelectedHistoryEntry(constructedEntry);
              triggerToast("Offline QR report restored successfully!");
              return;
            }

            // If completely unresolvable
            setReportNotFoundError("Clinical Report was not found. Please ensure the QR code matches a verified patient screening record or that your local offline sync has been pushed.");
            triggerToast("Report not found");
          } catch (err) {
            console.error("Direct URL clinical report load failed:", err);
            setReportNotFoundError("An error occurred while loading this clinical report.");
            triggerToast("Report not found");
          }
        }
      }
    };

    // Delay lookup slightly so initial historical lists parse/boot first
    const timer = setTimeout(checkDirectUrlRoute, 650);
    return () => clearTimeout(timer);
  }, []);

  // Fetch verified patient registry from backend on startup and whenever connection returns
  useEffect(() => {
    fetchPatientsFromBackend();
    fetchNotificationsFromBackend();
    fetchScreeningsHistory();
  }, [computedIsOnline]);

  const fetchScreeningsHistory = async () => {
    const saved = localStorage.getItem('local_screenings_history_cache');
    if (!saved) {
      const initialMockHistory: ScreeningHistoryEntry[] = [
        {
          id: 'SCR-2026-003',
          patientId: 'PAT-103',
          timestamp: new Date(Date.now() - 3600000 * 24 * 3).toISOString(), // 3 days ago
          patientDetails: {
            id: 'PAT-103',
            name: 'Kaveri Gowda',
            age: 52,
            gender: 'Female',
            address: 'Ullal Village, Ward 3, Mangalore, Karnataka',
            language: Language.ENGLISH
          },
          answers: {
            'gen_fatigue': 'yes',
            'diab_thirst': 'yes',
            'diab_urination': 'yes',
            'diab_blurred': 'no',
            'bp_headache': 'yes',
            'bp_dizziness': 'yes'
          },
          riskResults: {
            riskFactor: 'high',
            riskScore: 82,
            predictions: {
              diabetesRisk: 'high',
              hypertensionRisk: 'high',
              notes: 'Patient exhibits dual critical symptoms for both Type-II Diabetes Mellitus and stage-1 hypertension. Report immediate polyuria with recurring cephalalgia. Advised referral to Ullal Government Hospital medical specialist.'
            }
          }
        },
        {
          id: 'SCR-2026-004',
          patientId: 'PAT-104',
          timestamp: new Date(Date.now() - 3600000 * 24 * 14).toISOString(), // 14 days ago
          patientDetails: {
            id: 'PAT-104',
            name: 'Manjappa Hegde',
            age: 64,
            gender: 'Male',
            address: 'Someshwara Sector 2, Mangalore, Karnataka',
            language: Language.KANNADA
          },
          answers: {
            'gen_fatigue': 'yes',
            'diab_thirst': 'no',
            'diab_urination': 'no',
            'bp_headache': 'yes',
            'bp_vision': 'yes',
            'bp_chestpain': 'yes'
          },
          riskResults: {
            riskFactor: 'medium',
            riskScore: 56,
            predictions: {
              diabetesRisk: 'low',
              hypertensionRisk: 'high',
              notes: 'Patient exhibits elevated blood-pressure indicators with bilateral chest distress. No diabetic polydipsia. Urgent referral to Taluk Specialist Center for standard EKG mapping and clinical validation.'
            }
          }
        }
      ];
      localStorage.setItem('local_screenings_history_cache', JSON.stringify(initialMockHistory));
      setScreeningsHistory(initialMockHistory);
      // Try to sync mock entries to server if online
      if (computedIsOnline) {
        try {
          await fetch('/api/screenings/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(initialMockHistory)
          });
        } catch (e) {}
      }
      return;
    }

    if (!computedIsOnline) {
      if (saved) {
        setScreeningsHistory(JSON.parse(saved));
      }
      return;
    }
    try {
      const res = await fetch('/api/screenings');
      if (res.ok) {
        const data = await res.json();
        setScreeningsHistory(data);
        localStorage.setItem('local_screenings_history_cache', JSON.stringify(data));
      } else {
        if (saved) {
          setScreeningsHistory(JSON.parse(saved));
        }
      }
    } catch (err) {
      console.warn('Failed to contact screenings history REST endpoints (recovered from cache):', err);
      if (saved) {
        try {
          setScreeningsHistory(JSON.parse(saved));
        } catch (e) {}
      }
    }
  };

  const saveScreeningHistorySession = async (report: PatientResponse) => {
    const screeningSessionId = report.screeningId || `SCR-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;
    
    const sessionObj: ScreeningHistoryEntry = {
      id: screeningSessionId,
      patientId: report.id || `PAT-${Date.now()}`,
      timestamp: report.submittedAt || new Date().toISOString(),
      patientDetails: {
        id: report.id,
        name: report.name,
        age: report.age,
        gender: report.gender,
        address: report.address,
        language: report.language
      },
      answers: report.answers,
      riskResults: {
        riskFactor: report.riskFactor,
        riskScore: report.riskScore,
        predictions: {
          diabetesRisk: report.predictions.diabetesRisk,
          hypertensionRisk: report.predictions.hypertensionRisk,
          notes: report.predictions.notes
        }
      },
      ashaWorker: report.ashaWorker || (ashaWorker ? {
        id: ashaWorker.id || '1001',
        name: ashaWorker.name || 'Alia Rai',
        phone: ashaWorker.phone,
        email: ashaWorker.email,
        assignedArea: ashaWorker.assignedArea,
        hospital: ashaWorker.hospital
      } : undefined)
    };

    const currentHist = localStorage.getItem('local_screenings_history_cache');
    let loadedHist: ScreeningHistoryEntry[] = [];
    if (currentHist) {
      try { 
        loadedHist = JSON.parse(currentHist); 
      } catch (e) {}
    }
    loadedHist.unshift(sessionObj);
    setScreeningsHistory(loadedHist);
    localStorage.setItem('local_screenings_history_cache', JSON.stringify(loadedHist));

    if (computedIsOnline) {
      try {
        await fetch('/api/screenings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sessionObj)
        });
        fetchScreeningsHistory();
      } catch (err) {
        console.error('Failed to save screening history session to backend:', err);
      }
    } else {
      triggerToast("Screening report saved to local offline database!");
    }
  };

  const fetchPatientsFromBackend = async () => {
    const saved = localStorage.getItem('local_patients_cache');
    if (!computedIsOnline) {
      // Offline, recover from LocalStorage
      if (saved) {
        setGlobalPatients(JSON.parse(saved));
      }
      return;
    }
    try {
      const res = await fetch('/api/patients');
      if (res.ok) {
        const data = await res.json();
        setGlobalPatients(data);
        localStorage.setItem('local_patients_cache', JSON.stringify(data));
      } else {
        if (saved) {
          setGlobalPatients(JSON.parse(saved));
        }
      }
    } catch (err) {
      console.warn('Failed to contact patient directory REST endpoints (recovered from cache):', err);
      if (saved) {
        try {
          setGlobalPatients(JSON.parse(saved));
        } catch (e) {}
      }
    }
  };

  const fetchNotificationsFromBackend = async () => {
    const saved = localStorage.getItem('local_notifications_cache');
    if (!computedIsOnline) {
      if (saved) {
        setNotifications(JSON.parse(saved));
      }
      return;
    }
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        localStorage.setItem('local_notifications_cache', JSON.stringify(data));
      } else {
        if (saved) {
          setNotifications(JSON.parse(saved));
        }
      }
    } catch (err) {
      console.warn('Failed to capture notify list (recovered from cache):', err);
      if (saved) {
        try {
          setNotifications(JSON.parse(saved));
        } catch (e) {}
      }
    }
  };

  // Sync Offline Queue automatically when server reconnection occurs
  useEffect(() => {
    if (computedIsOnline && offlineSyncQueue.length > 0) {
      autoSyncOfflineQueue();
    }
  }, [computedIsOnline, offlineSyncQueue]);

  // Read saved local offline data queues on mount and load persisted sessions
  useEffect(() => {
    const savedQueue = localStorage.getItem('offline_sync_queue');
    if (savedQueue) {
      setOfflineSyncQueue(JSON.parse(savedQueue));
    }

    const savedPatientName = localStorage.getItem('logged_in_patient_name');
    const savedPatientPhone = localStorage.getItem('logged_in_patient_phone');
    if (savedPatientName) {
      setLoggedInPatientName(savedPatientName);
      setLoggedInPatientPhone(savedPatientPhone || '');
    }

    const savedAsha = localStorage.getItem('logged_in_asha_worker');
    if (savedAsha) {
      setAshaWorker(JSON.parse(savedAsha));
    }
  }, []);

  const autoSyncOfflineQueue = async () => {
    if (syncingNow) return;
    setSyncingNow(true);
    setSyncCompletedMsg('');
    triggerToast(`Internet connection restored. Automatically syncing ${offlineSyncQueue.length} offline patient records...`);
    
    const items = [...offlineSyncQueue];
    const patientPayloads = items.map(item => item.data);

    // Formulate matches for the screenings history database as well
    const screeningPayloads = patientPayloads.map(patient => {
      const screeningId = patient.screeningId || `SCR-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;
      return {
        id: screeningId,
        patientId: patient.id || `PAT-${Date.now()}`,
        timestamp: patient.submittedAt || new Date().toISOString(),
        patientDetails: {
          id: patient.id,
          name: patient.name,
          age: patient.age,
          gender: patient.gender,
          address: patient.address,
          language: patient.language
        },
        answers: patient.answers,
        riskResults: {
          riskFactor: patient.riskFactor,
          riskScore: patient.riskScore,
          predictions: {
            diabetesRisk: patient.predictions.diabetesRisk,
            hypertensionRisk: patient.predictions.hypertensionRisk,
            notes: patient.predictions.notes
          }
        },
        ashaWorker: patient.ashaWorker
      };
    });

    try {
      // Post patient records
      const resPatients = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patientPayloads)
      });

      // Post corresponding screenings entries in parallel or sequence
      const resScreenings = await fetch('/api/screenings/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(screeningPayloads)
      }).catch(() => {
        // Fallback individually if bulk endpoint is not mapped
        return Promise.all(screeningPayloads.map(scr => 
          fetch('/api/screenings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(scr)
          })
        )).then(() => ({ ok: true }));
      });

      if (resPatients.ok) {
        // Queue successfully pushed
        setOfflineSyncQueue([]);
        localStorage.removeItem('offline_sync_queue');
        
        const successText = `All ${items.length} local screening files synced securely with the Suraksha regional clinic database!`;
        triggerToast(successText);
        setSyncCompletedMsg(successText);
        setTimeout(() => setSyncCompletedMsg(''), 8000);

        fetchPatientsFromBackend();
        fetchNotificationsFromBackend();
        fetchScreeningsHistory();
      }
    } catch (err) {
      console.error('Sync pipeline deferred:', err);
      triggerToast('Auto-sync deferred. Will re-attempt when connection is stable.');
    } finally {
      setSyncingNow(false);
    }
  };

  // Captures latest callbacks to prevent stale closures in the Speech Recognition singleton on mount
  const handleSpeechResultInputRef = useRef<((text: string) => void) | null>(null);
  useEffect(() => {
    handleSpeechResultInputRef.current = handleSpeechResultInput;
  });

  // Speech Recognition configuration
  useEffect(() => {
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      const rec = new SpeechRecognitionAPI();
      rec.continuous = false;
      rec.interimResults = false;
      
      rec.onstart = () => {
        setIsListening(true);
        isListeningRef.current = true;
        setTranscriptText('');
        setSpeechError('');
      };

      rec.onerror = (e: any) => {
        console.error('Speech recognition error event:', e);
        if (!computedIsOnline || e.error === 'network' || e.error === 'service-not-allowed') {
          // Robust fallback message for offline voice recognition unavailability
          setSpeechError(selectedLang === Language.KANNADA
            ? "ಆಫ್‌ಲೈನ್ ಧ್ವನಿ ಸೌಲಭ್ಯ ಲಭ್ಯವಿಲ್ಲ. ದಯವಿಟ್ಟು ಉತ್ತರವನ್ನು ಬರೆಯಿರಿ."
            : "Offline voice recognition unavailable. Please type your answer.");
        } else {
          setSpeechError(selectedLang === Language.KANNADA
            ? `ಮೈಕ್ರೋಫೋನ್ ಸಿಗ್ನಲ್ ದೋಷ (${e.error}). ದಯವಿಟ್ಟು ಬರೆಯಿರಿ ಅಥವಾ ಟ್ಯಾಪ್ ಮಾಡಿ.`
            : `Voice input error (${e.error}). Please type or tap.`);
        }
        setIsListening(false);
        isListeningRef.current = false;
      };

      rec.onend = () => {
        setIsListening(false);
        isListeningRef.current = false;
      };

      rec.onresult = (event: any) => {
        if (event.results && event.results[0] && event.results[0][0]) {
          const text = event.results[0][0].transcript;
          setTranscriptText(text);
          if (handleSpeechResultInputRef.current) {
            handleSpeechResultInputRef.current(text);
          }
        }
      };

      recognitionRef.current = rec;
    }
  }, []);

  // Pre-load available voices to warm up the web speech synthesis cache
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.getVoices();
        };
      }
    }
  }, []);

  // Voice output (TTS) trigger helper with enhanced Kannada voice loading support & high-quality audio fallback
  const speakText = (text: string, langCode: string) => {
    if (!voiceEnabled) return;
    try {
      // 1. Cancel any current browser native speech synthesis
      window.speechSynthesis.cancel();
      
      // 2. Clear and stop any current fallback audio player to avoid voice overlaps
      if (ttsAudioRef.current) {
        ttsAudioRef.current.pause();
        ttsAudioRef.current.src = "";
        ttsAudioRef.current = null;
      }
      setIsSpeaking(false);

      // Track this session to prevent race conditions when the user clicks buttons while speech is active
      const sessionId = ++speechSessionIdRef.current;

      // Clean check and split text into manageable sentences so TTS endpoints do not truncate or error out
      const rawChunks = text.split(/[。！？!?.\n、;，；|।]+/).map(item => item.trim());
      const chunks = rawChunks.filter(chunkText => chunkText.length > 0);

      if (chunks.length === 0) {
        return;
      }

      // Native Web Speech Fallback function for individual chunks
      const playSpeechSynthesisNativeForChunk = (chunk: string, onDone: () => void) => {
        if (sessionId !== speechSessionIdRef.current) return;

        const utterance = new SpeechSynthesisUtterance(chunk);
        const voices = window.speechSynthesis.getVoices();
        let targetVoice = null;
        
        if (langCode === 'kn' || langCode === 'kn-IN') {
          targetVoice = voices.find(v => 
            v.lang.toLowerCase() === 'kn-in' ||
            v.lang.toLowerCase().startsWith('kn') || 
            v.name.toLowerCase().includes('kannada') ||
            v.name.toLowerCase().includes('kannada (india)')
          );
          utterance.lang = 'kn-IN';
        } else {
          targetVoice = voices.find(v => 
            v.lang.toLowerCase() === 'en-in' || 
            v.name.toLowerCase().includes('india')
          ) || voices.find(v => 
            v.lang.toLowerCase().startsWith('en')
          );
          utterance.lang = 'en-IN';
        }

        if (targetVoice) {
          utterance.voice = targetVoice;
          utterance.lang = targetVoice.lang;
        }

        utterance.rate = (langCode === 'kn' || langCode === 'kn-IN') ? 0.82 : 0.95; 
        utterance.pitch = 1.0;

        utterance.onstart = () => {
          if (sessionId === speechSessionIdRef.current) {
            setIsSpeaking(true);
          }
        };
        utterance.onend = () => {
          if (sessionId === speechSessionIdRef.current) {
            setIsSpeaking(false);
            onDone();
          }
        };
        utterance.onerror = () => {
          if (sessionId === speechSessionIdRef.current) {
            setIsSpeaking(false);
            onDone();
          }
        };

        window.speechSynthesis.speak(utterance);
      };

      // Sequential playlist play runner
      const playAllChunks = (index: number) => {
        if (sessionId !== speechSessionIdRef.current) return;

        if (index >= chunks.length) {
          setIsSpeaking(false);
          return;
        }

        const currentChunkText = chunks[index];
        const isOnline = computedIsOnline || (typeof navigator !== 'undefined' && navigator.onLine);

        if (isOnline) {
          const proxyLang = (langCode === 'kn' || langCode === 'kn-IN') ? 'kn' : 'en';
          const url = `/api/tts?lang=${proxyLang}&text=${encodeURIComponent(currentChunkText)}`;
          
          const audio = new Audio();
          audio.src = url;
          ttsAudioRef.current = audio;

          audio.onplay = () => {
            if (sessionId === speechSessionIdRef.current) {
              setIsSpeaking(true);
            }
          };
          audio.onended = () => {
            if (sessionId === speechSessionIdRef.current) {
              if (ttsAudioRef.current === audio) {
                ttsAudioRef.current = null;
              }
              playAllChunks(index + 1);
            }
          };
          audio.onerror = (err) => {
            console.warn('TTS proxy failed for chunk, trying native speech:', err);
            if (sessionId === speechSessionIdRef.current) {
              if (ttsAudioRef.current === audio) {
                ttsAudioRef.current = null;
              }
              playSpeechSynthesisNativeForChunk(currentChunkText, () => {
                playAllChunks(index + 1);
              });
            }
          };

          audio.play().catch(err => {
            console.warn('Autoplay blocked or playback error for chunk, trying native speech:', err);
            if (sessionId === speechSessionIdRef.current) {
              if (ttsAudioRef.current === audio) {
                ttsAudioRef.current = null;
              }
              playSpeechSynthesisNativeForChunk(currentChunkText, () => {
                playAllChunks(index + 1);
              });
            }
          });
        } else {
          // Play directly via native synth
          playSpeechSynthesisNativeForChunk(currentChunkText, () => {
            playAllChunks(index + 1);
          });
        }
      };

      // Initiate sequential chunked player
      playAllChunks(0);

    } catch (err) {
      console.error('TTS error', err);
      setIsSpeaking(false);
    }
  };

  // Convert English digit representations / voice answers to standard form
  const handleSpeechResultInput = (text: string) => {
    const cleanText = text.trim();
    const lowerText = cleanText.toLowerCase();
    
    // Check if we are in a pending confirmation state
    if (pendingConfirmation) {
      const isYes = 
        lowerText.includes('yes') || 
        lowerText.includes('correct') ||
        lowerText.includes('sari') || 
        lowerText.includes('shari') ||
        lowerText.includes('houdu') || 
        lowerText.includes('haudu') || 
        lowerText.includes('howdu') || 
        lowerText.includes('houdhu') || 
        lowerText.includes('houd') || 
        lowerText.includes('haud') || 
        lowerText.includes('audu') ||
        lowerText.includes('avudu') ||
        lowerText.includes('haa') ||
        lowerText.includes('ok') || 
        lowerText.includes('okay') ||
        cleanText.includes('ಹೌದು') || 
        cleanText.includes('ಹೌದ್') || 
        cleanText.includes('ಸರಿ') ||
        cleanText.includes('ಹೌದು, ಸರಿ') ||
        cleanText.includes('ಹೂ') ||
        cleanText.includes('ಹೂಂ') ||
        cleanText.includes('ಹಾ');

      const isNo = 
        lowerText.includes('no') || 
        lowerText.includes('wrong') || 
        lowerText.includes('repeat') ||
        lowerText.includes('illa') || 
        lowerText.includes('ila') || 
        lowerText.includes('beda') || 
        lowerText.includes('badha') || 
        lowerText.includes('tappu') || 
        lowerText.includes('thappu') || 
        cleanText.includes('ಇಲ್ಲ') || 
        cleanText.includes('ಇಲ್ಲಾ') || 
        cleanText.includes('ಇಲಾ') || 
        cleanText.includes('ಇಲ್ಲೆ') || 
        cleanText.includes('ಬೇಡ') || 
        cleanText.includes('ತಪ್ಪು') || 
        cleanText.includes('ಇಲ್ಲ ಇಲ್ಲ');
      
      if (isYes) {
        confirmCurrentValue();
      } else if (isNo) {
        rejectCurrentValue();
      } else {
        triggerToast(`You said "${cleanText}". Please say "Yes" to confirm or "No" to repeat.`);
      }
      return;
    }

    // Parse input based on screeningStep
    if (screeningStep === 'name') {
      setPatientName(cleanText);
      // Automatically prompt confirmation
      setPendingConfirmation({
        stage: 'name',
        value: cleanText
      });
      speakConfirmation(cleanText);
    } else if (screeningStep === 'gender') {
      let mappedGender: 'Male' | 'Female' | 'Other' = 'Other';
      const isFemale = /\b(female|woman|girl|her|she|mahile)\b/i.test(lowerText) || lowerText.includes('ಮಹಿಳೆ');
      const isMale = /\b(male|man|boy|him|he|purusha)\b/i.test(lowerText) || lowerText.includes('ಪುರುಷ');
      const isOther = /\b(other|transgender|trans|third\s*gender|itara)\b/i.test(lowerText) || lowerText.includes('ಇತರ');

      if (isFemale) {
        mappedGender = 'Female';
      } else if (isMale) {
        mappedGender = 'Male';
      } else if (isOther) {
        mappedGender = 'Other';
      }
      setPatientGender(mappedGender);
      
      const confirmMsg = selectedLang === Language.KANNADA 
        ? `ನೀವು ${mappedGender === 'Male' ? 'ಪುರುಷ' : mappedGender === 'Female' ? 'ಮಹಿಳೆ' : 'ಇತರ'} ಎಂದು ಆಯ್ಕೆ ಮಾಡಿದ್ದೀರಿ.` 
        : `You selected ${mappedGender}.`;
      speakText(confirmMsg, selectedLang);

      setTimeout(() => {
        setScreeningStep('address');
        const addressPrompt = selectedLang === Language.KANNADA
          ? "ದಯವಿಟ್ಟು ನಿಮ್ಮ ನಿವಾಸ ವಿಳಾಸ ಅಥವಾ ಗ್ರಾಮವನ್ನು ಹೇಳಿ ಅಥವಾ ಬರೆಯಿರಿ."
          : "Please speak or enter your current address or village village area.";
        speakText(addressPrompt, selectedLang);
      }, 1600);
    } else if (screeningStep === 'address') {
      setPatientAddress(cleanText);
      setPendingConfirmation({
        stage: 'address',
        value: cleanText
      });
      speakConfirmation(cleanText);
    } else if (screeningStep === 'familySelf') {
      setFamilySelf(cleanText);
      setPendingConfirmation({
        stage: 'familySelf',
        value: cleanText
      });
      speakConfirmation(cleanText);
    } else if (screeningStep === 'familyFather') {
      setFamilyFather(cleanText);
      setPendingConfirmation({
        stage: 'familyFather',
        value: cleanText
      });
      speakConfirmation(cleanText);
    } else if (screeningStep === 'familyMother') {
      setFamilyMother(cleanText);
      setPendingConfirmation({
        stage: 'familyMother',
        value: cleanText
      });
      speakConfirmation(cleanText);
    } else if (screeningStep === 'familySiblings') {
      setFamilySiblings(cleanText);
      setPendingConfirmation({
        stage: 'familySiblings',
        value: cleanText
      });
      speakConfirmation(cleanText);
    } else if (screeningStep === 'age') {
      // Extract numbers
      const match = cleanText.match(/\d+/);
      if (match) {
        const ageVal = parseInt(match[0], 10);
        setPatientAge(ageVal);
        setPendingConfirmation({
          stage: 'age',
          value: ageVal.toString()
        });
        speakConfirmation(ageVal.toString());
      } else {
        triggerToast(`Could not recognize age from "${cleanText}". Try saying e.g. "forty" or select from input list.`);
      }
    } else if (screeningStep === 'questioning') {
      const activeQuestions = getAgeGroupQuestions();
      const currentQuestion = activeQuestions[currentQuestionIndex];
      if (currentQuestion) {
        setPendingConfirmation({
          stage: 'question',
          value: cleanText,
          questionId: currentQuestion.id
        });
        speakConfirmation(cleanText);
      }
    }
  };

  // Speak confirmation dialog
  const speakConfirmation = (valueSpoken: string) => {
    const confirmPrompt = SYSTEM_GREETINGS[selectedLang].voiceConfirmResponse;
    speakText(`${valueSpoken}. ${confirmPrompt}`, selectedLang);
  };

  const startListening = async () => {
    // Explicitly request/confirm microphone permission first using mediaDevices
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Release the stream immediately so we do not leave the recording light on
        stream.getTracks().forEach(track => track.stop());
      }
    } catch (err: any) {
      console.warn("Microphone access permission checking failed:", err);
      const permMsg = selectedLang === Language.KANNADA 
        ? "ಮೈಕ್ರೋಫೋನ್ ಪ್ರವೇಶ ನಿರಾಕರಿಸಲಾಗಿದೆ. ಸೆಟ್ಟಿಂಗ್ಸ್‌ನಲ್ಲಿ ಮೈಕ್ ಅನುಮತಿಯನ್ನು ಆನ್ ಮಾಡಿ." 
        : "Microphone permission denied. Please allow microphone access in your browser settings.";
      setSpeechError(permMsg);
      triggerToast(selectedLang === Language.KANNADA ? "ಮೈಕ್ರೋಫೋನ್ ಅನುಮತಿಯನ್ನು ನೀಡಿ." : "Please allow microphone access.");
      return;
    }

    if (recognitionRef.current) {
      // Abort any active sessions to force reset the browser speech thread state
      try {
        recognitionRef.current.abort();
      } catch (_) {}

      // Slight delay allows the system to release resources cleanly
      setTimeout(() => {
        try {
          if (selectedLang === Language.KANNADA) {
            recognitionRef.current.lang = 'kn-IN';
          } else {
            recognitionRef.current.lang = 'en-US';
          }
          recognitionRef.current.start();
        } catch (err: any) {
          console.warn('SpeechRecognition start caught safely (already active):', err.message);
        }
      }, 100);
    } else {
      const errUnsupported = selectedLang === Language.KANNADA
        ? "ನಿಮ್ಮ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಧ್ವನಿ ಸೌಲಭ್ಯ ಬೆಂಬಲಿಸುವುದಿಲ್ಲ. ಕೀಬೋರ್ಡ್ ಬಳಸಿ."
        : "Microphone SpeechRecognition is disabled or unsupported in this browser. Please use keyboard inputs.";
      setSpeechError(errUnsupported);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
    setIsListening(false);
    isListeningRef.current = false;
  };

  // Language setup - triggers Voice Welcomer
  const startPatientScreening = (lang: Language) => {
    setSelectedLang(lang);
    setScreeningStep('name');
    setPatientName('');
    setPatientAge('');
    setAnswers({});
    setCurrentQuestionIndex(0);
    setPendingConfirmation(null);
    setTranscriptText('');
    
    setTimeout(() => {
      const greeting = SYSTEM_GREETINGS[lang].voiceAskName;
      speakText(greeting, lang);
    }, 500);
  };

  // Core flow sequence navigation controllers
  const confirmCurrentValue = () => {
    if (!pendingConfirmation) return;

    if (pendingConfirmation.stage === 'name') {
      setPendingConfirmation(null);
      setScreeningStep('gender');
      // Speak next step invitation
      const genderPrompt = selectedLang === Language.KANNADA 
        ? "ದಯವಿಟ್ಟು ನಿಮ್ಮ ಲಿಂಗವನ್ನು ಆಯ್ಕೆ ಮಾಡಿ." 
        : "Please select your gender.";
      speakText(genderPrompt, selectedLang);
    } else if (pendingConfirmation.stage === 'gender') {
      setPendingConfirmation(null);
      setScreeningStep('address');
      const addressPrompt = selectedLang === Language.KANNADA
        ? "ದಯವಿಟ್ಟು ನಿಮ್ಮ ನಿವಾಸ ವಿಳಾಸ ಅಥವಾ ಗ್ರಾಮವನ್ನು ಹೇಳಿ ಅಥವಾ ಬರೆಯಿರಿ."
        : "Please speak or enter your current address or village village area.";
      speakText(addressPrompt, selectedLang);
    } else if (pendingConfirmation.stage === 'address') {
      setPendingConfirmation(null);
      // Map ASHA Worker automatically on address confirmation
      const matchedAsha = ashaWorker || getAssignedAshaByAddress(patientAddress);
      setAssignedAsha(matchedAsha);
      
      setScreeningStep('familySelf');
      const famSelfPrompt = selectedLang === Language.KANNADA
        ? "ನಿಮಗೆ ಹಿಂದೆ ಎಂದಾದರೂ ಮಧುಮೇಹ ಅಥವಾ ರಕ್ತದೊತ್ತಡ ಕಾಯಿಲೆ ಇದೆಯೇ? ಹೌದು ಅಥವಾ ಇಲ್ಲ ಎಂದು ಹೇಳಿ."
        : "Do you have any personal history of Diabetes or Hypertension? Say Yes or No.";
      speakText(famSelfPrompt, selectedLang);
    } else if (pendingConfirmation.stage === 'familySelf') {
      setPendingConfirmation(null);
      setScreeningStep('familyFather');
      const famFatherPrompt = selectedLang === Language.KANNADA
        ? "ನಿಮ್ಮ ತಂದೆಯವರ ಆರೋಗ್ಯದ ಬಗ್ಗೆ ಹೇಳಿ. ಅವರ ವಯಸ್ಸು ಎಷ್ಟು? ಅವರಿಗೆ ಮಧುಮೇಹ ಅಥವಾ ರಕ್ತದೊತ್ತಡ ಕಾಯಿಲೆ ಇದೆಯೇ ಅಥವಾ ಇತ್ತೇ?"
        : "Explain your father's health history. Is he alive, how old, and did he have high blood pressure or diabetes?";
      speakText(famFatherPrompt, selectedLang);
    } else if (pendingConfirmation.stage === 'familyFather') {
      setPendingConfirmation(null);
      setScreeningStep('familyMother');
      const famMotherPrompt = selectedLang === Language.KANNADA
        ? "ನಿಮ್ಮ ತಾಯಿಯವರ ಆರೋಗ್ಯದ ಬಗ್ಗೆ ಹೇಳಿ. ಅವರಿಗೆ ರಕ್ತದೊತ್ತಡ ಅಥವಾ ಸಕ್ಕರೆ ಕಾಯಿಲೆ ಇದೆಯೇ ಅಥವಾ ಇತ್ತೇ?"
        : "Explain your mother's health history. Does she have high blood pressure or diabetes?";
      speakText(famMotherPrompt, selectedLang);
    } else if (pendingConfirmation.stage === 'familyMother') {
      setPendingConfirmation(null);
      setScreeningStep('familySiblings');
      const famSiblingsPrompt = selectedLang === Language.KANNADA
        ? "ನಿಮ್ಮ ಅಣ್ಣ ತಮ್ಮಂದಿರು ಅಥವಾ ಅಕ್ಕ ತಂಗಿಯರಿಗೆ ಸಕ್ಕರೆ ಕಾಯಿಲೆ ಅಥವಾ ರಕ್ತದೊತ್ತಡ ಕಾಯಿಲೆ ಇದೆಯೇ? ಎಷ್ಟು ವರ್ಷಗಳಿಂದ ಇದೆ?"
        : "Do your brothers or sisters have diabetes or hypertension, and for how many years?";
      speakText(famSiblingsPrompt, selectedLang);
    } else if (pendingConfirmation.stage === 'familySiblings') {
      setPendingConfirmation(null);
      setScreeningStep('age');
      speakText(SYSTEM_GREETINGS[selectedLang].voiceAskAge, selectedLang);
    } else if (pendingConfirmation.stage === 'age') {
      setPendingConfirmation(null);
      setScreeningStep('questioning');
      setCurrentQuestionIndex(0);
      
      // Delay to allow stage to change and find questions
      setTimeout(() => {
        const q = getAgeGroupQuestions()[0];
        if (q) {
          speakText(q.voicePrompt[selectedLang], selectedLang);
        }
      }, 500);
    } else if (pendingConfirmation.stage === 'question') {
      const qId = pendingConfirmation.questionId;
      if (qId) {
        setAnswers(prev => ({ ...prev, [qId]: pendingConfirmation.value }));
      }
      setPendingConfirmation(null);

      // Check for next question
      const activeQuestions = getAgeGroupQuestions();
      if (currentQuestionIndex < activeQuestions.length - 1) {
        const nextIdx = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextIdx);
        setTimeout(() => {
          const nextQ = activeQuestions[nextIdx];
          if (nextQ) {
            speakText(nextQ.voicePrompt[selectedLang], selectedLang);
          }
        }, 500);
      } else {
        // All screening questions answered successfully!
        generateScreeningReport();
      }
    }
  };

  const rejectCurrentValue = () => {
    if (!pendingConfirmation) return;
    const stage = pendingConfirmation.stage;
    setPendingConfirmation(null);
    setTranscriptText('');

    if (stage === 'name') {
      setPatientName('');
      speakText(SYSTEM_GREETINGS[selectedLang].voiceAskName, selectedLang);
    } else if (stage === 'gender') {
      setPatientGender('');
      const p = selectedLang === Language.KANNADA ? "ದಯವಿಟ್ಟು ನಿಮ್ಮ ಲಿಂಗವನ್ನು ಮತ್ತೊಮ್ಮೆ ಆರಿಸಿ." : "Please select or speak your gender once again.";
      speakText(p, selectedLang);
    } else if (stage === 'address') {
      setPatientAddress('');
      const p = selectedLang === Language.KANNADA ? "ದಯವಿಟ್ಟು ನಿಮ್ಮ ಗ್ರಾಮ ಅಥವಾ ವಿಳಾಸವನ್ನು ಮತ್ತೊಮ್ಮೆ ಹೇಳಿ." : "Please speak your address or village area once again.";
      speakText(p, selectedLang);
    } else if (stage === 'familySelf') {
      setFamilySelf('');
      const p = selectedLang === Language.KANNADA ? "ಕಾಯಿಲೆ ಇತಿಹಾಸವನ್ನು ಮತ್ತೊಮ್ಮೆ ಹೇಳಿ." : "Please say your personal disease history once again.";
      speakText(p, selectedLang);
    } else if (stage === 'familyFather') {
      setFamilyFather('');
      const p = selectedLang === Language.KANNADA ? "ನಿಮ್ಮ ತಂದೆಯವರ ಆರೋಗ್ಯದ ಬಗ್ಗೆ ಮತ್ತೊಮ್ಮೆ ಹೇಳಿ." : "Please describe your father's health status once again.";
      speakText(p, selectedLang);
    } else if (stage === 'familyMother') {
      setFamilyMother('');
      const p = selectedLang === Language.KANNADA ? "ನಿಮ್ಮ ತಾಯಿಯವರ ಆರೋಗ್ಯದ ಬಗ್ಗೆ ಮತ್ತೊಮ್ಮೆ ಹೇಳಿ." : "Please describe your mother's health status once again.";
      speakText(p, selectedLang);
    } else if (stage === 'familySiblings') {
      setFamilySiblings('');
      const p = selectedLang === Language.KANNADA ? "ನಿಮ್ಮ ಒಡಹುಟ್ಟಿದವರ ಆರೋಗ್ಯದ ಬಗ್ಗೆ ಮತ್ತೊಮ್ಮೆ ಹೇಳಿ." : "Please describe your siblings' health status once again.";
      speakText(p, selectedLang);
    } else if (stage === 'age') {
      setPatientAge('');
      speakText(SYSTEM_GREETINGS[selectedLang].voiceAskAge, selectedLang);
    } else if (stage === 'question') {
      const activeQuestions = getAgeGroupQuestions();
      const q = activeQuestions[currentQuestionIndex];
      if (q) {
        speakText(q.voicePrompt[selectedLang], selectedLang);
      }
    }
  };

  // Determine age category string
  const getAgeGroup = (age: number): string => {
    if (age <= 12) return "Child (<12)";
    if (age <= 20) return "Adolescent (13-20)";
    if (age <= 44) return "Young Adult (21-44)";
    if (age <= 59) return "Middle-Aged Adult (45-59)";
    return "Elderly (60+)";
  };

  const getAllQuestionsForAge = (age: number): Question[] => {
    let list: Question[] = [];
    
    // Diabetes group selection
    if (age < 20) {
      list = [...list, ...(DIABETES_QUESTION_BANK[AGE_GROUPS.DIAB_CHILD] || [])];
    } else if (age <= 44) {
      list = [...list, ...(DIABETES_QUESTION_BANK[AGE_GROUPS.DIAB_ADULT] || [])];
    } else {
      list = [...list, ...(DIABETES_QUESTION_BANK[AGE_GROUPS.DIAB_OLDER] || [])];
    }

    // Hypertension group selection
    if (age < 40) {
      list = [...list, ...(HYPERTENSION_QUESTION_BANK[AGE_GROUPS.BP_YOUNG] || [])];
    } else if (age <= 59) {
      list = [...list, ...(HYPERTENSION_QUESTION_BANK[AGE_GROUPS.BP_MID] || [])];
    } else {
      list = [...list, ...(HYPERTENSION_QUESTION_BANK[AGE_GROUPS.BP_OLDER] || [])];
    }

    return list;
  };

  const getAgeGroupQuestions = (): Question[] => {
    const age = parseInt(patientAge.toString(), 10) || 30;
    return getAllQuestionsForAge(age);
  };

  const getAssignedAshaByAddress = (addressStr: string) => {
    const normalized = (addressStr || '').toLowerCase();
    if (normalized.includes('derlakatte') || normalized.includes('derla')) {
      return {
        id: '1002',
        name: 'Shravya',
        phone: '+91 1472583690',
        email: 'shamithanaik247@gmail.com',
        assignedArea: 'Derlakatte',
        hospital: 'Ullal Government Hospital'
      };
    } else {
      // Default / Ullal Govt Hospital Alia Rai
      return {
        id: '1001',
        name: 'ALIA RAI',
        phone: '+91 1234567890',
        email: 'sanjanasahana19@gmail.com',
        assignedArea: 'Ullal',
        hospital: 'Ullal Government Hospital'
      };
    }
  };

  // Submit collected screening details and generate full report
  const generateScreeningReport = async () => {
    setScreeningStep('report');
    setAnalyzingRisk(true);
    speakText(SYSTEM_GREETINGS[selectedLang].voiceCompletedScreening, selectedLang);

    const screeningSessionId = `SCR-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;
    const currentAshaObj = ashaWorker || assignedAsha || getAssignedAshaByAddress(patientAddress);

    const payload = {
      id: `PATIENT-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`,
      screeningId: screeningSessionId,
      name: patientName,
      age: Number(patientAge),
      language: selectedLang,
      gender: patientGender,
      address: patientAddress,
      hasDiabetesOrHypertension: familySelf,
      fatherHistory: familyFather,
      motherHistory: familyMother,
      siblingsHistory: familySiblings,
      ashaWorker: currentAshaObj,
      moderator: MODERATOR_DATA,
      answers,
      submittedAt: new Date().toISOString()
    };

    let reportData: PatientResponse;

    if (!computedIsOnline) {
      // Handle offline diagnostics using offline client logic
      const ruleBasedAnalyzerLocalResult = calculateOfflineRiskLocal(payload.age, payload.answers);
      
      reportData = {
        ...payload,
        riskFactor: ruleBasedAnalyzerLocalResult.riskFactor,
        riskScore: ruleBasedAnalyzerLocalResult.riskScore,
        predictions: {
          diabetesRisk: ruleBasedAnalyzerLocalResult.diabetesRisk,
          hypertensionRisk: ruleBasedAnalyzerLocalResult.hypertensionRisk,
          notes: ruleBasedAnalyzerLocalResult.notes
        },
        synced: false
      };

      // Push record to offline synchronizer cache list
      savePatientOffline(reportData);
    } else {
      // Web Sync Analysis
      try {
        const res = await fetch('/api/gemini/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const dict = await res.json();
          reportData = {
            ...payload,
            riskFactor: dict.riskFactor,
            riskScore: dict.riskScore,
            predictions: {
              diabetesRisk: dict.diabetesRisk,
              hypertensionRisk: dict.hypertensionRisk,
              notes: dict.notes
            },
            synced: true
          };

          // Save to backend database
          await fetch('/api/patients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reportData)
          });

          fetchPatientsFromBackend();
          fetchNotificationsFromBackend();
        } else {
          throw new Error('Server returned error status');
        }
      } catch (err) {
        console.error('Gemini REST API analyze process failed. Falling back to local offline diagnostics logic:', err);
        const ruleBasedFallback = calculateOfflineRiskLocal(payload.age, payload.answers);
        reportData = {
          ...payload,
          riskFactor: ruleBasedFallback.riskFactor,
          riskScore: ruleBasedFallback.riskScore,
          predictions: {
            diabetesRisk: ruleBasedFallback.diabetesRisk,
            hypertensionRisk: ruleBasedFallback.hypertensionRisk,
            notes: ruleBasedFallback.notes
          },
          synced: false
        };
        savePatientOffline(reportData);
      }
    }

    setCurrentReport(reportData);
    setAnalyzingRisk(false);

    // Save newly completed screening session to history log
    saveScreeningHistorySession(reportData);

    // Render beautiful dynamic custom QR code contain verification string payload
    generatePatientQrCodeImg(reportData);
  };

  const calculateOfflineRiskLocal = (age: number, ansList: Record<string, string>): {
    riskFactor: 'low' | 'medium' | 'high';
    riskScore: number;
    diabetesRisk: 'low' | 'medium' | 'high';
    hypertensionRisk: 'low' | 'medium' | 'high';
    notes: string;
  } => {
    let score = 15;
    let hasSugarAlert = false;
    let hasBPAlert = false;

    const checkStateYes = (val: string) => {
      if (!val) return false;
      const lower = val.toLowerCase();
      return lower.includes('yes') || lower.includes('true') || lower.includes('houdu') || lower.includes('haudu') || lower.includes('howdu') || lower.includes('correct') || val.includes('ಹೌದು');
    };

    if (checkStateYes(familySelf)) score += 15;
    if (checkStateYes(familyFather)) score += 10;
    if (checkStateYes(familyMother)) score += 10;
    if (checkStateYes(familySiblings)) score += 10;

    Object.entries(ansList).forEach(([qid, val]) => {
      const lowerVal = val.toLowerCase();
      const isYes = 
        lowerVal.includes('yes') || 
        lowerVal.includes('true') ||
        lowerVal.includes('sari') || 
        lowerVal.includes('shari') ||
        lowerVal.includes('houdu') || 
        lowerVal.includes('haudu') || 
        lowerVal.includes('howdu') || 
        lowerVal.includes('houdhu') || 
        lowerVal.includes('audu') ||
        lowerVal.includes('avudu') ||
        lowerVal.includes('correct') ||
        lowerVal.includes('haa') ||
        val.includes('ಹೌದು') || 
        val.includes('ಹೌದ್') || 
        val.includes('ಸರಿ') ||
        val.includes('ಹೂ') ||
        val.includes('ಹಾ');
      if (isYes) {
        score += 20;
        if (qid.startsWith('diab_') || qid.includes('thirst') || qid.includes('wound') || qid.includes('fatigue')) hasSugarAlert = true;
        if (qid.startsWith('bp_') || qid.includes('dizziness') || qid.includes('breathless') || qid.includes('vision') || qid.includes('chest') || qid.includes('feet')) hasBPAlert = true;
      }
    });

    if (age >= 60) score += 20;
    else if (age >= 45) score += 12;

    if (score > 100) score = 100;

    const riskFactor: 'low' | 'medium' | 'high' = (score >= 60 || (hasSugarAlert && hasBPAlert)) ? 'high' : (score >= 30 ? 'medium' : 'low');
    const diabetesRisk: 'low' | 'medium' | 'high' = hasSugarAlert ? (score >= 60 ? 'high' : 'medium') : 'low';
    const hypertensionRisk: 'low' | 'medium' | 'high' = hasBPAlert ? (score >= 60 ? 'high' : 'medium') : 'low';

    const activeAsha = ashaWorker || assignedAsha || getAssignedAshaByAddress(patientAddress);

    let notes = "";
    if (selectedLang === Language.KANNADA) {
      if (riskFactor === 'high') {
         notes = `ನಿಮ್ಮ ತಪಾಸಣಾ ವರದಿ ಅಪಾಯಕರವಾಗಿದೆ. ತಕ್ಷಣ ನಿಮ್ಮ ನಿಯೋಜಿತ ಆಶಾ ಕಾರ್ಯಕರ್ತೆ ${activeAsha.name} (ಮೊಬೈಲ್: ${activeAsha.phone}) ಅವರನ್ನು ಭೇಟಿ ಮಾಡಿ ಅಥವಾ ಉಲ್ಲಾಳ ಸರ್ಕಾರಿ ಆಸ್ಪತ್ರೆಗೆ ತೆರಳಿ.`;
      } else if (riskFactor === 'medium') {
         notes = `ಸಾಧಾರಣ ಅಪಾಯ ಲಕ್ಷಣಗಳು ಕಂಡುಬಂದಿದೆ. ಪ್ರತಿನಿತ್ಯ ದೈಹಿಕ ಜಾಗೃತಿ ಕಾಯ್ದುಕೊಳ್ಳಿ, ಸಕ್ಕರೆ ಮತ್ತು ಉಪ್ಪನ್ನು ಕಡಿಮೆ ಸೇವಿಸಿ. ನಿಮ್ಮ ಆಶಾ ಕಾರ್ಯಕರ್ತೆ ${activeAsha.name} ಅವರನ್ನು ಸಂಪರ್ಕಿಸಿ.`;
      } else {
         notes = "ವರದಿ ಸಾಮಾನ್ಯವಾಗಿದೆ. ಶುದ್ಧ ಗಾಳಿ, ಸಮತೋಲನ ಆಹಾರದೊಂದಿಗೆ ಆರೋಗ್ಯ ಕಾಪಾಡಿಕೊಳ್ಳಿ. ವರ್ಷಕ್ಕೊಮ್ಮೆ ಉಚಿತ ಕ್ಯಾಂಪ್‌ನಲ್ಲಿ ಪರೀಕ್ಷಿಸಿ.";
      }
    } else {
      if (riskFactor === 'high') {
         notes = `High screening score detected offline. Please immediately contact your assigned ASHA worker ${activeAsha.name} (Phone: ${activeAsha.phone}) for referral protocol at closest PHC center.`;
      } else if (riskFactor === 'medium') {
         notes = `Moderate indicators found offline. Advised physical walking 30 minutes, eliminate high sodium/sugary components instantly. Contact ASHA ${activeAsha.name} (Phone: ${activeAsha.phone}) for tips.`;
      } else {
         notes = "Low risk detected. Follow standard rural green diet and routine screening. Stay active!";
      }
    }

    return { riskFactor, riskScore: score, diabetesRisk, hypertensionRisk, notes };
  };

  // Push record to browser offline memory list
  const savePatientOffline = (patient: PatientResponse) => {
    // Save to local offline queue
    const queueItem: SyncItem = {
      id: `queue_${Date.now()}`,
      action: 'SYNC_PATIENT',
      data: patient,
      status: 'pending',
      timestamp: new Date().toISOString()
    };

    const updatedQueue = [...offlineSyncQueue, queueItem];
    setOfflineSyncQueue(updatedQueue);
    localStorage.setItem('offline_sync_queue', JSON.stringify(updatedQueue));

    // Update global list cache instantly so ASHA worker sees it offline as well
    const updatedGlobal = [patient, ...globalPatients];
    setGlobalPatients(updatedGlobal);
    localStorage.setItem('local_patients_cache', JSON.stringify(updatedGlobal));
    
    triggerToast("Offline Mode Action: Patient screening recorded successfully inside browser local storage queue.");
  };

  // Generate QR code rendering to visual base64 image using installed library
  const generatePatientQrCodeImg = async (data: PatientResponse) => {
    const screeningId = data.screeningId || `SCR-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;
    const baseUrl = `${window.location.origin}/#report/${screeningId}`;
    const params = new URLSearchParams();
    params.set('pId', data.id);
    params.set('scId', screeningId);
    params.set('ts', data.submittedAt || new Date().toISOString());
    params.set('name', data.name);
    params.set('age', String(data.age));
    params.set('gender', data.gender || '');
    params.set('address', data.address || '');
    params.set('lang', data.language);
    params.set('risk', data.riskFactor);
    params.set('score', String(data.riskScore));
    params.set('db', data.predictions.diabetesRisk);
    params.set('bp', data.predictions.hypertensionRisk);
    params.set('asha', data.ashaWorker?.name || '');
    params.set('ashaPhone', data.ashaWorker?.phone || '');
    const qrText = `${baseUrl}?${params.toString()}`;

    try {
      const url = await QRCode.toDataURL(qrText, {
        errorCorrectionLevel: 'H', // High error correction for robust scanned decoding
        margin: 2,
        width: 300,
        color: {
          dark: '#0369a1', // Beautiful Navy Blue matching design
          light: '#f8fafc' // background
        }
      });
      setQrCodeUrl(url);
    } catch (err) {
      console.error('Error constructing canvas QR image', err);
    }
  };

  const processClosingLoopForVitals = (
    patientId: string, 
    patientName: string, 
    sugarStr: string, 
    systolicStr: string, 
    diastolicStr: string,
    baseReport: PatientResponse,
    isRevisit: boolean = false
  ) => {
    const sugarNum = sugarStr.trim() ? Number(sugarStr) : undefined;
    const systolicNum = systolicStr.trim() ? Number(systolicStr) : undefined;
    const diastolicNum = diastolicStr.trim() ? Number(diastolicStr) : undefined;

    const diabetesClassification = classifyDiabetes(sugarNum);
    const bpClassification = classifyHypertension(systolicNum, diastolicNum);

    const vitalsRisk = calculateVitalsRisk(sugarNum, systolicNum, diastolicNum, baseReport.riskFactor);
    const refinedRiskFactor = vitalsRisk.riskFactor;
    const refinedRiskPercentage = vitalsRisk.riskPercentage;

    const actionResult = evaluateNextClinicalAction(patientId, refinedRiskFactor, screeningsHistory);

    const updatedVitals = {
      bloodSugar: sugarNum,
      systolicBP: systolicNum,
      diastolicBP: diastolicNum,
      diabetesClassification,
      bpClassification,
      riskPercentage: refinedRiskPercentage,
      status: actionResult.status,
      nextScheduledDays: actionResult.nextScheduledDays,
      dueDate: new Date(Date.now() + actionResult.nextScheduledDays * 24 * 3600 * 1000).toISOString()
    };

    const updatedReport: PatientResponse = {
      ...baseReport,
      riskFactor: refinedRiskFactor,
      bloodSugar: sugarNum,
      systolicBP: systolicNum,
      diastolicBP: diastolicNum,
      predictions: {
        ...baseReport.predictions,
        diabetesRisk: refinedRiskFactor,
        hypertensionRisk: refinedRiskFactor,
        notes: `Clinical update evaluated. Status mapped to: ${actionResult.status}. ${actionResult.actionRequired}`
      },
      vitals: updatedVitals
    };

    const newTask = generateFollowUpTask(
      patientId,
      patientName,
      refinedRiskFactor,
      diabetesClassification,
      bpClassification,
      refinedRiskPercentage,
      actionResult.nextScheduledDays,
      actionResult.actionRequired,
      actionResult.priority
    );

    setFollowUpTasks(prev => {
      const completedPrev = prev.map(t => {
        if (t.patientId === patientId && t.status === 'Pending') {
          return { ...t, status: 'Completed' as const };
        }
        return t;
      });
      return [newTask, ...completedPrev];
    });

    const previousEntries = screeningsHistory.filter(e => e.patientId === patientId);
    let previousVitals: any = undefined;
    if (previousEntries.length > 0) {
      const sortedPrev = [...previousEntries].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      const lastWithVitals = sortedPrev.find(p => p.riskResults?.vitals?.bloodSugar !== undefined);
      if (lastWithVitals) {
        previousVitals = {
          sugar: lastWithVitals.riskResults.vitals?.bloodSugar,
          systolic: lastWithVitals.riskResults.vitals?.systolicBP,
          diastolic: lastWithVitals.riskResults.vitals?.diastolicBP
        };
      }
    }

    const progressionReport = computeDiseaseProgression(
      { sugar: sugarNum, systolic: systolicNum, diastolic: diastolicNum },
      previousVitals
    );

    const screeningSessionId = `SCR-UPDATE-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;
    const sessionObj: ScreeningHistoryEntry = {
      id: screeningSessionId,
      patientId: patientId,
      timestamp: new Date().toISOString(),
      patientDetails: {
        id: patientId,
        name: patientName,
        age: baseReport.age,
        gender: baseReport.gender,
        address: baseReport.address,
        language: baseReport.language
      },
      answers: baseReport.answers,
      riskResults: {
        riskFactor: refinedRiskFactor,
        riskScore: baseReport.riskScore,
        predictions: {
          diabetesRisk: refinedRiskFactor,
          hypertensionRisk: refinedRiskFactor,
          notes: `${actionResult.status}. Trend: ${actionResult.trend.toUpperCase()}. Message: ${progressionReport.overallSummary}`
        },
        vitals: updatedVitals
      },
      ashaWorker: ashaWorker ? {
        id: ashaWorker.id || '1001',
        name: ashaWorker.name || 'Alia Rai',
        phone: ashaWorker.phone,
        email: ashaWorker.email,
        assignedArea: ashaWorker.assignedArea,
        hospital: ashaWorker.hospital
      } : undefined
    };

    const loadedHist = [sessionObj, ...screeningsHistory];
    setScreeningsHistory(loadedHist);
    localStorage.setItem('local_screenings_history_cache', JSON.stringify(loadedHist));

    setGlobalPatients(prev => prev.map(p => {
      if (p.id === patientId) {
        return updatedReport;
      }
      return p;
    }));

    if (currentReport && currentReport.id === patientId) {
      setCurrentReport(updatedReport);
    }
    
    if (selectedDossierPatient && selectedDossierPatient.id === patientId) {
      setSelectedDossierPatient(updatedReport);
    }

    if (isRevisit) {
      triggerToast(`Success: Clinical revisit recorded. Updated and assigned follow-up for ${patientName}.`);
    } else {
      triggerToast(`Vitals recorded. Closed-Loop Diagnostics initiated for ${patientName}.`);
    }

    if (actionResult.isEscalated) {
      const newNotif: Notification = {
        id: `NOTIF-${Date.now()}`,
        patientId,
        patientName,
        riskFactor: 'high',
        message: `ESC-PHC alert: ${patientName} remains Critical across consecutive screenings! Telemedicine briefed.`,
        timestamp: new Date().toISOString(),
        read: false
      };
      setNotifications(prev => [newNotif, ...prev]);
    }

    return {
      updatedReport,
      actionResult,
      progressionReport
    };
  };


  // Clear report state and direct back to greeting step
  const triggerNewScreening = () => {
    if (loggedInPatientName) {
      setScreeningStep('patientDashboard');
    } else {
      setScreeningStep('language');
      setSelectedRole(null);
    }
    setPatientName('');
    setPatientAge('');
    setAnswers({});
    setCurrentQuestionIndex(0);
    setPendingConfirmation(null);
    setCurrentReport(null);
    setQrCodeUrl('');
  };

  // Helper to compile segregated patient reports for active ASHA Area
  const getSegregatedPatientsForEmail = () => {
    const areaFilter = ashaWorker?.assignedArea?.toLowerCase() || '';
    
    // Filter patients who match this worker's area
    const areaPatients = globalPatients.filter(p => {
      const address = p.address?.toLowerCase() || '';
      return p.ashaWorker?.assignedArea?.toLowerCase() === areaFilter || address.includes(areaFilter);
    });

    const diabetesList = areaPatients.filter(p => {
      const hasDiab = p.predictions.diabetesRisk === 'high' || p.hasDiabetesOrHypertension?.toLowerCase().includes('diab');
      const hasBP = p.predictions.hypertensionRisk === 'high' || p.hasDiabetesOrHypertension?.toLowerCase().includes('bp') || p.hasDiabetesOrHypertension?.toLowerCase().includes('hyper');
      return hasDiab && !hasBP;
    });

    const hypertensionList = areaPatients.filter(p => {
      const hasDiab = p.predictions.diabetesRisk === 'high' || p.hasDiabetesOrHypertension?.toLowerCase().includes('diab');
      const hasBP = p.predictions.hypertensionRisk === 'high' || p.hasDiabetesOrHypertension?.toLowerCase().includes('bp') || p.hasDiabetesOrHypertension?.toLowerCase().includes('hyper');
      return hasBP && !hasDiab;
    });

    const comorbidList = areaPatients.filter(p => {
      const hasDiab = p.predictions.diabetesRisk === 'high' || p.hasDiabetesOrHypertension?.toLowerCase().includes('diab');
      const hasBP = p.predictions.hypertensionRisk === 'high' || p.hasDiabetesOrHypertension?.toLowerCase().includes('bp') || p.hasDiabetesOrHypertension?.toLowerCase().includes('hyper');
      return hasDiab && hasBP;
    });

    return {
      diabetesList,
      hypertensionList,
      comorbidList,
      totalCount: areaPatients.length,
      allAreaPatients: areaPatients
    };
  };

  // Dispatch Case Digest Email triggers
  const handleSendDigestEmail = () => {
    const { diabetesList, hypertensionList, comorbidList, totalCount } = getSegregatedPatientsForEmail();
    setIsSendingEmailDigest(true);
    triggerToast("📂 Formatting secure clinical digest matrices...");

    setTimeout(() => {
      // Build an exceptionally magnificent plaintext representation of all patient lists
      let textBody = `REGIONAL PATIENTS CASE CLINICAL REFERRAL DIGEST\n`;
      textBody += `==============================================\n`;
      textBody += `ASHA Outreach Worker: ${ashaWorker?.name || 'ALIA RAI'} (ID: ${ashaWorker?.id || '1001'})\n`;
      textBody += `Assigned Sector Area: ${ashaWorker?.assignedArea || 'Ullal'}\n`;
      textBody += `Health Facility Node: ${ashaWorker?.hospital || 'Ullal Government Hospital'}\n`;
      textBody += `Date compiled: ${new Date().toLocaleDateString()} (SIMULATED SECURE SMTP PROTOCOL)\n`;
      textBody += `Total Screened Patients in Segment: ${totalCount} patients recorded\n\n`;

      if (emailCustomMessage.trim()) {
        textBody += `OFFICE NOTES / SPECIAL CLINICAL DIRECTIVE:\n`;
        textBody += `"${emailCustomMessage}"\n`;
        textBody += `----------------------------------------------\n\n`;
      }

      textBody += `1. DIABETES MELLETUS ONLY REFERRALS (${diabetesList.length} cases):\n`;
      if (diabetesList.length === 0) {
        textBody += `   - No isolated diabetes cases matched.\n`;
      } else {
        diabetesList.forEach((p, idx) => {
          textBody += `   [${idx+1}] ${p.name}, Age ${p.age} | Risk Index: ${p.riskScore}/100 | Sync: ${p.synced ? 'Synced' : 'Local Cached'}\n`;
          textBody += `       Diagnostic Notes: "${p.predictions.notes}"\n`;
        });
      }
      textBody += `\n`;

      textBody += `2. HYPERTENSION ONLY CLINICAL CASES (${hypertensionList.length} cases):\n`;
      if (hypertensionList.length === 0) {
        textBody += `   - No isolated hypertension cases matched.\n`;
      } else {
        hypertensionList.forEach((p, idx) => {
          textBody += `   [${idx+1}] ${p.name}, Age ${p.age} | Risk Index: ${p.riskScore}/100 | Sync: ${p.synced ? 'Synced' : 'Local Cached'}\n`;
          textBody += `       Diagnostic Notes: "${p.predictions.notes}"\n`;
        });
      }
      textBody += `\n`;

      textBody += `3. COMORBID (BOTH DIABETES & HYPERTENSION) HIGH-DENSITY CASES (${comorbidList.length} cases):\n`;
      if (comorbidList.length === 0) {
        textBody += `   - No comorbid high-vulnerable cases matched.\n`;
      } else {
        comorbidList.forEach((p, idx) => {
          textBody += `   [${idx+1}] ${p.name}, Age ${p.age} | Risk Index: ${p.riskScore}/100 | Sync: ${p.synced ? 'Synced' : 'Local Cached'}\n`;
          textBody += `       Vitals Focus: "${p.predictions.notes}"\n`;
        });
      }

      textBody += `\n==============================================\n`;
      textBody += `Transmitted via Suraksha Health Smart Hub.`;

      // Trigger mailto link for extreme system compliance
      const mailtoUrl = `mailto:${encodeURIComponent(moderatorEmail)}?subject=${encodeURIComponent(`[PHC CASE REFERRALS] ${ashaWorker?.assignedArea || 'Ullal'} Sector Digest - ${ashaWorker?.name}`)}&body=${encodeURIComponent(textBody)}`;
      
      // Simulate transmitting to clinical backend server logs too! 
      console.log("Secure clinical packet prepared:", textBody);
      
      setIsSendingEmailDigest(false);
      triggerToast(`✅ Clinical Email referral packet assembled! Opening secure dispatch overlay...`);
      window.location.href = mailtoUrl;
    }, 1200);
  };

  // Print Patient screening report helper
  const downloadDoctorReport = () => {
    if (!currentReport) return;
    
    const summaryText = `================================================
RURAL INDIA HEALTH SCREENING REPORT - PROTOTYPE
================================================
PATIENT ID: ${currentReport.id}
CSV STATUS: ${currentReport.synced ? 'Synced Online' : 'Pending Server Sync'}
MEMBER NAME: ${currentReport.name}
AGE: ${currentReport.age} (Age Category: ${getAgeGroup(currentReport.age)})
COMMUNICATION LANGUAGE: ${currentReport.language === 'kn' ? 'KANNADA (ಕನ್ನಡ)' : 'ENGLISH'}
SUBMITTED AT: ${new Date(currentReport.submittedAt).toLocaleString()}
------------------------------------------------
SCREENING DIAGNOSTIC SUMMARY:
- Diabetes Risk Level: ${currentReport.predictions.diabetesRisk.toUpperCase()}
- Hypertension / BP Risk Level: ${currentReport.predictions.hypertensionRisk.toUpperCase()}
- Overall Screening Risk Factor: ${currentReport.riskFactor.toUpperCase()} (Score: ${currentReport.riskScore}/100)
------------------------------------------------
CLINICAL NOTES & PHC REFERRAL REFERRAL:
"${currentReport.predictions.notes}"
------------------------------------------------
SCREENING RESPONSE SHEET DATA:
${Object.entries(currentReport.answers).map(([key, val], idx) => `[Question ${idx + 1}] ID ${key}: ${val}`).join('\n')}
================================================
`;

    const blob = new Blob([summaryText], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Report_${currentReport.name.replace(/\s+/g, '_')}_Risk_${currentReport.riskFactor}.txt`;
    link.click();
    triggerToast("Report download initialized successfully!");
  };

  // Dynamic Multi-section PDF assessment report download using jsPDF coordinates
  const downloadPdfReport = async (entry: any) => {
    try {
      const doc = new jsPDF();
      
      const pName = entry.patientDetails?.name || entry.name || 'Anonymous';
      const pAge = entry.patientDetails?.age || entry.age || 'N/A';
      const pGender = entry.patientDetails?.gender || entry.gender || 'Unknown';
      const pAddress = entry.patientDetails?.address || entry.address || 'Not Registered';
      const pLang = entry.patientDetails?.language || entry.language || 'en';
      const pTime = entry.timestamp || entry.submittedAt || new Date().toISOString();
      
      const riskFactor = entry.riskResults?.riskFactor || entry.riskFactor || 'low';
      const riskScore = entry.riskResults?.riskScore ?? entry.riskScore ?? 0;
      const diabRisk = entry.riskResults?.predictions?.diabetesRisk || entry.predictions?.diabetesRisk || 'low';
      const hyperRisk = entry.riskResults?.predictions?.hypertensionRisk || entry.predictions?.hypertensionRisk || 'low';
      const notes = entry.riskResults?.predictions?.notes || entry.predictions?.notes || 'No standard comments compiled.';

      // Generate dynamic verification QR code payload in modern compact scannable URL format
      const screeningId = entry.id || `SCR-${Date.now()}`;
      const baseUrl = `${window.location.origin}/#report/${screeningId}`;
      const params = new URLSearchParams();
      params.set('pId', entry.patientId || entry.id || '');
      params.set('scId', screeningId);
      params.set('ts', pTime);
      params.set('name', pName);
      params.set('age', String(pAge));
      params.set('gender', pGender || '');
      params.set('address', pAddress || '');
      params.set('lang', pLang);
      params.set('risk', riskFactor);
      params.set('score', String(riskScore));
      params.set('db', diabRisk);
      params.set('bp', hyperRisk);
      params.set('asha', entry.ashaWorker?.name || '');
      params.set('ashaPhone', entry.ashaWorker?.phone || '');
      const qrText = `${baseUrl}?${params.toString()}`;

      let base64Qr = null;
      try {
        base64Qr = await QRCode.toDataURL(qrText, {
          errorCorrectionLevel: 'H',
          margin: 1,
          width: 120,
          color: {
            dark: '#0f172a', // Clean black-slate
            light: '#ffffff'
          }
        });
      } catch (qrErr) {
        console.warn("Could not bake QR code into PDF report:", qrErr);
      }

      doc.setProperties({
        title: `Screening Report - ${pName}`,
        subject: 'NCD Early Outreach Screen',
        author: 'Suraksha System'
      });

      // Header Layout
      doc.setFillColor(30, 58, 138); 
      doc.rect(15, 15, 145, 22, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(11);
      doc.text("SURAKSHA OUTREACH CLINICAL ASSESSMENT REPORT", 19, 24);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.text("National Rural India Non-Communicable Diseases (NCD) Portal", 19, 31);

      // Embed dynamic QR Code into the top-right corner header badge
      if (base64Qr) {
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(210, 214, 219);
        doc.setLineWidth(0.4);
        doc.rect(166, 14, 28, 24, 'FD'); // background white with light border box
        doc.addImage(base64Qr, 'PNG', 168, 15, 24, 22);
      }

      let currentY = 48;

      doc.setTextColor(50, 50, 50);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.text("PATIENT HEALTH PROFILE DETAILS", 20, currentY);
      doc.setDrawColor(210, 214, 219);
      doc.setLineWidth(0.3);
      doc.line(20, currentY + 2, 190, currentY + 2);
      
      currentY += 10;
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9.5);
      
      doc.text(`Patient Full Name:`, 20, currentY);
      doc.setFont('Helvetica', 'bold');
      doc.text(`${pName}`, 55, currentY);
      doc.setFont('Helvetica', 'normal');

      doc.text(`Age / Gender:`, 115, currentY);
      doc.setFont('Helvetica', 'bold');
      doc.text(`${pAge} Years / ${pGender}`, 145, currentY);
      doc.setFont('Helvetica', 'normal');

      currentY += 7;
      doc.text(`Home Address:`, 20, currentY);
      doc.setFont('Helvetica', 'bold');
      const limitedAddress = pAddress.length > 51 ? pAddress.substring(0, 48) + '...' : pAddress;
      doc.text(`${limitedAddress}`, 55, currentY);
      doc.setFont('Helvetica', 'normal');

      doc.text(`Language choice:`, 115, currentY);
      doc.setFont('Helvetica', 'bold');
      doc.text(`${pLang === 'kn' ? 'KANNADA (ಕನ್ನಡ)' : 'ENGLISH'}`, 145, currentY);
      doc.setFont('Helvetica', 'normal');

      currentY += 7;
      doc.text(`Screening Time:`, 20, currentY);
      doc.setFont('Helvetica', 'bold');
      doc.text(`${new Date(pTime).toLocaleString()}`, 55, currentY);
      doc.setFont('Helvetica', 'normal');

      doc.text(`Screening Registry ID:`, 115, currentY);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(`${entry.id}`, 150, currentY);
      doc.setFontSize(9.5);
      doc.setFont('Helvetica', 'normal');

      currentY += 7;
      doc.text(`Designated ASHA Worker:`, 20, currentY);
      doc.setFont('Helvetica', 'bold');
      doc.text(`${entry.ashaWorker?.name || 'Alia Rai'}`, 60, currentY);
      doc.setFont('Helvetica', 'normal');

      doc.text(`ASHA Contact Number:`, 115, currentY);
      doc.setFont('Helvetica', 'bold');
      doc.text(`${entry.ashaWorker?.phone || '+91 1234567890'}`, 150, currentY);
      doc.setFont('Helvetica', 'normal');

      currentY += 14;

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.text("CLINICAL RISK ASSESSMENT MATRIX", 20, currentY);
      doc.line(20, currentY + 2, 190, currentY + 2);
      
      currentY += 10;
      doc.setFontSize(9.5);

      doc.text(`Primary Risk Level:`, 20, currentY);
      doc.setFont('Helvetica', 'bold');
      
      if (riskFactor === 'high') {
        doc.setFillColor(239, 68, 68); 
        doc.setTextColor(255, 255, 255);
      } else if (riskFactor === 'medium') {
        doc.setFillColor(245, 158, 11); 
        doc.setTextColor(255, 255, 255);
      } else {
        doc.setFillColor(16, 185, 129); 
        doc.setTextColor(255, 255, 255);
      }
      doc.rect(55, currentY - 4.5, 30, 6, 'F');
      doc.text(`${riskFactor.toUpperCase()}`, 60, currentY);
      
      doc.setTextColor(50, 50, 50);
      doc.setFont('Helvetica', 'normal');

      doc.text(`Cumulative Risk Index:`, 115, currentY);
      doc.setFont('Helvetica', 'bold');
      doc.text(`${riskScore} / 100`, 155, currentY);
      doc.setFont('Helvetica', 'normal');

      currentY += 7.5;
      doc.text(`Diabetes Risk factor:`, 20, currentY);
      doc.setFont('Helvetica', 'bold');
      doc.text(`${diabRisk.toUpperCase()}`, 55, currentY);
      doc.setFont('Helvetica', 'normal');

      doc.text(`Hypertension risk:`, 115, currentY);
      doc.setFont('Helvetica', 'bold');
      doc.text(`${hyperRisk.toUpperCase()}`, 155, currentY);
      doc.setFont('Helvetica', 'normal');

      currentY += 13;

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.text("DIAGNOSTIC ADVISORY & MEDICAL PHC INTERVENTIONS", 20, currentY);
      doc.line(20, currentY + 2, 190, currentY + 2);

      currentY += 10;
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      
      const splitAdvisory = doc.splitTextToSize(notes, 168);
      doc.text(splitAdvisory, 20, currentY);
      
      currentY += (splitAdvisory.length * 4.8) + 8;

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.text("CAPTURED CLINICAL SURVEY SHEET", 20, currentY);
      doc.line(20, currentY + 2, 190, currentY + 2);

      currentY += 10;
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8.5);

      const ansList = Object.entries(entry.answers || {});
      if (ansList.length === 0) {
        doc.text("No diagnostic screening response registers loaded.", 20, currentY);
      } else {
        ansList.forEach(([key, val]: any, idx) => {
          if (currentY > 275) {
            doc.addPage();
            currentY = 25;
          }
          
          let friendlyLabel = key.replace(/_/g, ' ');
          if (key.startsWith('diab_')) friendlyLabel = `Diabetes Checklist [Question ${key.replace('diab_', '')}]`;
          if (key.startsWith('bp_')) friendlyLabel = `Hypertension Checklist [Question ${key.replace('bp_', '')}]`;
          if (key.startsWith('gen_')) friendlyLabel = `General Checklist [Question ${key.replace('gen_', '')}]`;

          doc.setFont('Helvetica', 'bold');
          doc.text(`Q${idx + 1}. ${friendlyLabel}:`, 20, currentY);
          doc.setFont('Helvetica', 'normal');
          
          doc.text(`${val.toUpperCase()}`, 115, currentY);
          currentY += 5.5;
        });
      }

      currentY += 10;
      if (currentY > 275) {
        doc.addPage();
        currentY = 25;
      }
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text("------------------------------------------------------------------------------------------------------------------------------------", 20, currentY);
      currentY += 4;
      doc.text("Disclaimer This diagnostic receipt is an automated early outreach screen report based on comparative regional neural calculations.", 20, currentY);
      currentY += 4;
      doc.text("Definitive diagnostic tests must be carried out in state Taluk sub-centers or PHC nodes prior to diagnostic therapy.", 20, currentY);
      
      const exportName = `Suraksha_Report_${pName.replace(/\s+/g, '_')}_Risk_${riskFactor}.pdf`;
      doc.save(exportName);
      triggerToast(`PDF Assessment downloaded: ${exportName}`);
    } catch (err) {
      console.error("PDF printing error:", err);
      triggerToast("Error writing PDF export formats. Reverting to standard TXT summary report.");
      downloadDoctorReport();
    }
  };

  // Voice Authentication process for ASHA credentials
  const startVoiceAuth = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      triggerToast("Speech Recognition is not supported by your browser software. Please type credentials manually.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-IN'; // South-Asian English locale is highly accurate for Indian names/accents

    setIsVoiceAuthListening(true);
    setAshaLoginError('');
    triggerToast("🎙️ Voice Authenticator: Listening for Name & Employee ID...");

    recognition.onstart = () => {
      console.log("Speech authorization listener started");
    };

    recognition.onresult = (event: any) => {
      const speechText = event.results[0][0].transcript;
      const lower = speechText.toLowerCase();
      console.log("Speech auth transcript:", speechText);
      triggerToast(`Heard: "${speechText}"`);

      // Match ASHA WORKER 1: ALIA RAI / 1001
      const isAlia = lower.includes('alia') || lower.includes('rai') || lower.includes('1001') || lower.includes('one zero zero one');
      // Match ASHA WORKER 2: Shravya / 1002
      const isShravya = lower.includes('shravya') || lower.includes('shravia') || lower.includes('sabya') || lower.includes('shrabya') || lower.includes('1002') || lower.includes('one zero zero two');

      if (isAlia) {
        setAshaEmployeeId('1001');
        setAshaName('ALIA RAI');
        triggerToast("🔑 Voice Verified: ALIA RAI (ID 1001). Loading Area Map...");
        
        // Auto sign-in
        setAshaWorker({
          id: '1001',
          name: 'ALIA RAI',
          assignedArea: 'Ullal',
          phone: '+91 1234567890',
          email: 'sanjanasahana19@gmail.com',
          hospital: 'Ullal Government Hospital'
        } as any);
      } else if (isShravya) {
        setAshaEmployeeId('1002');
        setAshaName('Shravya');
        triggerToast("🔑 Voice Verified: Shravya (ID 1002). Loading Area Map...");
        
        // Auto sign-in
        setAshaWorker({
          id: '1002',
          name: 'Shravya',
          assignedArea: 'Derlakatte',
          phone: '+91 1472583690',
          email: 'shamithanaik247@gmail.com',
          hospital: 'Ullal Government Hospital'
        } as any);
      } else {
        setAshaLoginError(`Speech parsed as: "${speechText}". Credentials unmatches. Please say: "ALIA RAI ID 1001" or "Shravya ID 1002".`);
      }
    };

    recognition.onerror = (err: any) => {
      console.error("Speech Recognition error:", err);
      triggerToast(`Microphone input warning: ${err.error || 'Access denied'}`);
      setIsVoiceAuthListening(false);
    };

    recognition.onend = () => {
      setIsVoiceAuthListening(false);
    };

    try {
      recognition.start();
    } catch (e) {
      console.error("Failed to start speech:", e);
      setIsVoiceAuthListening(false);
    }
  };

  // Log in/registration simulation handler for ASHA Worker
  const handleAshaLoginAction = async (e: React.FormEvent, isRegistering: boolean) => {
    e.preventDefault();
    setAshaLoginError('');
    
    if (!ashaName.trim() || !ashaPhone.trim()) {
      setAshaLoginError('Please enter registered Full Name and Phone Number.');
      return;
    }
    
    setAshaAuthLoading(true);
    try {
      const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: ashaName.trim(),
          phone: ashaPhone.trim(),
          role: 'asha'
        })
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        setAshaWorker(data.user);
        localStorage.setItem('logged_in_asha_worker', JSON.stringify(data.user));
        triggerToast(`Welcome back ASHA Worker ${data.user.name}!`);
      } else {
        setAshaLoginError(data.error || 'Authentication failed. Please check details or register.');
      }
    } catch (err) {
      console.error('Error during ASHA auth:', err);
      // Clean fallback for offline testing
      const fallbackUser = {
        id: ashaName.toLowerCase().includes('shravya') ? '1002' : '1001',
        name: ashaName.trim(),
        phone: ashaPhone.trim(),
        role: 'asha',
        assignedArea: ashaName.toLowerCase().includes('shravya') ? 'Derlakatte' : 'Ullal',
        hospital: 'Ullal Government Hospital'
      };
      setAshaWorker(fallbackUser);
      localStorage.setItem('logged_in_asha_worker', JSON.stringify(fallbackUser));
      triggerToast(`Offline Mode: Logged in as ${fallbackUser.name}`);
    } finally {
      setAshaAuthLoading(false);
    }
  };

  const handlePatientAuth = async (e: React.FormEvent, isRegistering: boolean) => {
    e.preventDefault();
    setPatientAuthError('');
    
    if (!loggedInPatientName.trim() || !loggedInPatientPhone.trim()) {
      setPatientAuthError('Please enter Name and Phone Number.');
      return;
    }
    
    setPatientAuthLoading(true);
    try {
      const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: loggedInPatientName.trim(),
          phone: loggedInPatientPhone.trim(),
          role: 'patient'
        })
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        setLoggedInPatientName(data.user.name);
        setLoggedInPatientPhone(data.user.phone);
        localStorage.setItem('logged_in_patient_name', data.user.name);
        localStorage.setItem('logged_in_patient_phone', data.user.phone);
        setScreeningStep('patientDashboard');
        triggerToast(`Successfully authenticated as ${data.user.name}!`);
      } else {
        setPatientAuthError(data.error || 'Authentication failed. Please check details or register.');
      }
    } catch (err) {
      console.error('Error during Patient auth:', err);
      setLoggedInPatientName(loggedInPatientName.trim());
      setLoggedInPatientPhone(loggedInPatientPhone.trim());
      localStorage.setItem('logged_in_patient_name', loggedInPatientName.trim());
      localStorage.setItem('logged_in_patient_phone', loggedInPatientPhone.trim());
      setScreeningStep('patientDashboard');
      triggerToast(`Offline Mode: Activated session for ${loggedInPatientName.trim()}`);
    } finally {
      setPatientAuthLoading(false);
    }
  };

  // Log out ASHA worker session
  const handleAshaLogout = () => {
    setAshaWorker(null);
    setAshaPassword('');
    localStorage.removeItem('logged_in_asha_worker');
    setSelectedHouse(null);
    setSelectedDossierPatient(null);
  };

  const handlePatientLogout = () => {
    setLoggedInPatientName('');
    setLoggedInPatientPhone('');
    localStorage.removeItem('logged_in_patient_name');
    localStorage.removeItem('logged_in_patient_phone');
    setScreeningStep('rolesSelection');
    triggerToast('Patient session exited safely.');
  };

  // Send interactive recommendation from ASHA worker to a patient
  const sendClinicalGuidanceMessage = async (patientId: string) => {
    if (!guidanceMessageText.trim()) return;

    // Local update optimization
    const matchIdx = globalPatients.findIndex(p => p.id === patientId);
    if (matchIdx !== -1) {
      const gList = [...globalPatients];
      const target = { ...gList[matchIdx] };
      const newMsg = {
        id: `g_${Date.now()}`,
        text: guidanceMessageText,
        sender: ashaWorker?.name || 'ASHA Worker',
        timestamp: new Date().toISOString()
      };
      
      if (!(target as any).guidanceLog) {
        (target as any).guidanceLog = [];
      }
      (target as any).guidanceLog.push(newMsg);
      gList[matchIdx] = target;
      setGlobalPatients(gList);
      
      if (selectedDossierPatient && selectedDossierPatient.id === patientId) {
        setSelectedDossierPatient(target);
      }
    }

    if (computedIsOnline) {
      try {
        await fetch('/api/patients/guidance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientId,
            text: guidanceMessageText,
            sender: ashaWorker?.name || 'ASHA Worker'
          })
        });
      } catch (err) {
        console.error('Failed pushing remote patient message stream:', err);
      }
    }

    setGuidanceMessageText('');
    triggerToast('Special clinical instruction sent successfully to the patient mobile record.');
  };

  // Trigger manual health answers submission by ASHA Worker
  const handleManualFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualPatientForm.name || !manualPatientForm.age) {
       triggerToast('Please provide patient name and age.');
       return;
    }

    const ageNum = parseInt(manualPatientForm.age, 10);
    const mockId = `PATIENT-MANUAL-${Date.now()}`;
    
    // Auto populate answers based on questionnaire to simulate complete screenings
    const questionsNeeded = getAllQuestionsForAge(ageNum);
    const computedAnswers: Record<string, string> = {};
    
    questionsNeeded.forEach(q => {
      // Look up if user typed/checked or default to standard affirmative/negative
      computedAnswers[q.id] = manualPatientForm.answers[q.id] || "No (No complaints/normal)";
    });

    const ruleResult = calculateOfflineRiskLocal(ageNum, computedAnswers);

    const mSugarNum = manualBloodSugar ? Number(manualBloodSugar) : undefined;
    const mSystolicNum = manualSystolicBP ? Number(manualSystolicBP) : undefined;
    const mDiastolicNum = manualDiastolicBP ? Number(manualDiastolicBP) : undefined;

    let finalRiskFactor = ruleResult.riskFactor;
    let finalRiskPercentage = ruleResult.riskScore;

    if (mSugarNum !== undefined || (mSystolicNum !== undefined && mDiastolicNum !== undefined)) {
      const vitalsRisk = calculateVitalsRisk(mSugarNum, mSystolicNum, mDiastolicNum, ruleResult.riskFactor);
      finalRiskFactor = vitalsRisk.riskFactor;
      finalRiskPercentage = vitalsRisk.riskPercentage;
    }

    const manualPatientRecord: PatientResponse = {
      id: mockId,
      name: manualPatientForm.name,
      age: ageNum,
      language: manualPatientForm.language,
      answers: computedAnswers,
      riskFactor: finalRiskFactor,
      riskScore: finalRiskPercentage,
      bloodSugar: mSugarNum,
      systolicBP: mSystolicNum,
      diastolicBP: mDiastolicNum,
      predictions: {
        diabetesRisk: finalRiskFactor,
        hypertensionRisk: finalRiskFactor,
        notes: ruleResult.notes
      },
      submittedAt: new Date().toISOString(),
      synced: false,
      ashaWorker: ashaWorker ? {
        id: ashaWorker.id,
        name: ashaWorker.name,
        phone: ashaWorker.phone || '',
        email: ashaWorker.email || '',
        assignedArea: ashaWorker.assignedArea || '',
        hospital: ashaWorker.hospital || ''
      } : undefined,
      ashaVerifiedBy: ashaWorker?.name || 'ASHA Worker'
    };

    // Save and register record 
    if (computedIsOnline) {
      try {
        const res = await fetch('/api/patients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(manualPatientRecord)
        });
        if (res.ok) {
           manualPatientRecord.synced = true;
        }
      } catch (err) {
        console.error('Manual online POST failed, defaulting to local queue offline.');
      }
    }

    if (!manualPatientRecord.synced) {
      savePatientOffline(manualPatientRecord);
    } else {
      const updatedGlobal = [manualPatientRecord, ...globalPatients];
      setGlobalPatients(updatedGlobal);
      localStorage.setItem('local_patients_cache', JSON.stringify(updatedGlobal));
      triggerToast('Patient screening report recorded securely on clinic server.');
    }

    // Process Closing Loop and Task Generation
    processClosingLoopForVitals(
      mockId,
      manualPatientForm.name,
      manualBloodSugar,
      manualSystolicBP,
      manualDiastolicBP,
      manualPatientRecord,
      false
    );

    // Refresh assigned houses status representation
    setAssignedHouses(prev => prev.map(house => {
      if (house.familyHead.toLowerCase().includes(manualPatientForm.name.toLowerCase().substring(0, 4))) {
         return {
           ...house,
           screeningStatus: 'completed',
           riskRatio: finalRiskFactor
         };
      }
      return house;
    }));

    // Reset Form
    setManualPatientForm({
      name: '',
      age: '',
      language: Language.ENGLISH,
      answers: {}
    });
    setManualBloodSugar('');
    setManualSystolicBP('');
    setManualDiastolicBP('');
    setManualEntryActive(false);
  };

  // QR String scanning parser with dynamic database fetch & auto report presentation
  const testBarcodeScanPayload = async () => {
    const trimmedInput = qrScanInput.trim();
    if (!trimmedInput) {
       setQrScanSuccessMsg('Please enter or paste QR payload summary text first.');
       return;
    }
    
    setQrScanLoading(true);
    setQrScanSuccessMsg('');
    setQrScanData(null);

    try {
      let parsed: any = null;
      let lookupId: string | null = null;

      // 1. Try parsing as JSON first
      if (trimmedInput.startsWith('{') && trimmedInput.endsWith('}')) {
        try {
          parsed = JSON.parse(trimmedInput);
          lookupId = parsed.screeningId || parsed.id || parsed.patientId;
        } catch (e) {
          console.warn("Input looked like JSON but parsing failed, retrying URL/text extractions...", e);
        }
      }

      // 2. If not a parsed JSON or lookupId is empty, try extracting from URL/route patterns
      if (!lookupId) {
        if (trimmedInput.includes('/report/')) {
          const parts = trimmedInput.split('/report/');
          if (parts.length > 1) {
            lookupId = parts[1].split('?')[0].trim();
          }
        } else if (trimmedInput.includes('/api/screenings/')) {
          const parts = trimmedInput.split('/api/screenings/');
          if (parts.length > 1) {
            lookupId = parts[1].split('?')[0].trim();
          }
        } else {
          // If it's a plain string, e.g. "SCR-12345" or "PAT-12345"
          lookupId = trimmedInput;
        }
      }

      if (!lookupId) {
        throw new Error('Could not extract any valid report reference, unique Patient ID, or Screening Session ID.');
      }

      let fetchedReport: ScreeningHistoryEntry | null = null;

      // 1. Search locally in Active React State
      const stateMatch = screeningsHistory.find(
        scr => scr.id === lookupId || scr.patientId === lookupId || (scr.patientDetails && scr.patientDetails.id === lookupId)
      );
      if (stateMatch) {
        fetchedReport = stateMatch;
      }

      // 2. Try looking up in Local Browser Cache (localStorage)
      if (!fetchedReport) {
        const cachedHistoryStr = localStorage.getItem('local_screenings_history_cache');
        if (cachedHistoryStr) {
          try {
            const list: ScreeningHistoryEntry[] = JSON.parse(cachedHistoryStr);
            const found = list.find(scr => scr.id === lookupId || scr.patientId === lookupId || (scr.patientDetails && scr.patientDetails.id === lookupId));
            if (found) fetchedReport = found;
          } catch (e) {
            console.error("Failed to parse local screenings cache", e);
          }
        }
      }

      // 3. Search in backend REST API DB if online
      if (!fetchedReport && computedIsOnline) {
        try {
          const res = await fetch(`/api/screenings/${lookupId}`);
          if (res.ok) {
            const data = await res.json();
            fetchedReport = data;
          }
        } catch (fetchErr) {
          console.warn("REST API lookups failed. Falling back to offline recovery options...", fetchErr);
        }
      }

      // 4. Fallback search inside local patients cache to construct history record
      if (!fetchedReport) {
        const cachedPatientsStr = localStorage.getItem('local_patients_cache');
        if (cachedPatientsStr) {
          try {
            const plist: PatientResponse[] = JSON.parse(cachedPatientsStr);
            const pat = plist.find(p => p.id === lookupId || p.screeningId === lookupId);
            if (pat) {
              fetchedReport = {
                id: pat.screeningId || pat.id || `SCR-${Date.now()}`,
                patientId: pat.id,
                timestamp: pat.submittedAt || new Date().toISOString(),
                patientDetails: {
                  id: pat.id,
                  name: pat.name,
                  age: pat.age,
                  gender: pat.gender || 'Other',
                  address: pat.address || 'Ullal Health Ward District',
                  language: pat.language
                },
                answers: pat.answers || {},
                riskResults: {
                  riskFactor: pat.riskFactor,
                  riskScore: pat.riskScore,
                  predictions: pat.predictions || {
                    diabetesRisk: 'low',
                    hypertensionRisk: 'low',
                    notes: 'Offline compiled verification receipt.'
                  }
                },
                ashaWorker: pat.ashaWorker
              };
            }
          } catch (e) {
            console.error("Failed to recover from local patients cache", e);
          }
        }
      }

      // 5. Build dynamic recovery from QR JSON structure metadata if totally offline
      if (!fetchedReport && parsed && parsed.name) {
        fetchedReport = {
          id: parsed.screeningId || `SCR-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`,
          patientId: parsed.id || `PAT-${Date.now()}`,
          timestamp: parsed.timestamp || new Date().toISOString(),
          patientDetails: {
            id: parsed.id || `PAT-${Date.now()}`,
            name: parsed.name,
            age: parsed.age || 40,
            gender: parsed.gender || 'Other',
            address: parsed.address || 'Ullal Health Ward District',
            language: parsed.lang || 'en'
          },
          answers: parsed.answers || {},
          riskResults: {
            riskFactor: parsed.risk || 'low',
            riskScore: parsed.score || 0,
            predictions: {
              diabetesRisk: parsed.db || 'low',
              hypertensionRisk: parsed.bp || 'low',
              notes: parsed.notes || `Offline verified receipt successfully extracted. Assigned worker: ${parsed.ashaWorker || 'ASHA Staff'}.`
            }
          },
          ashaWorker: parsed.ashaWorker ? { id: '1001', name: parsed.ashaWorker, phone: '', email: '', assignedArea: 'Ullal', hospital: '' } : undefined
        };

        // Cache rebuilt report in state and storage so it doesn't vanish
        setScreeningsHistory(prev => [fetchedReport!, ...prev]);
        const currentCachedHist = localStorage.getItem('local_screenings_history_cache');
        let decodedList = [];
        if (currentCachedHist) {
          try { decodedList = JSON.parse(currentCachedHist); } catch (e) {}
        }
        decodedList.unshift(fetchedReport);
        localStorage.setItem('local_screenings_history_cache', JSON.stringify(decodedList));
      }

      // 6. Build dynamic recovery from QR URL query string if no JSON parsed
      if (!fetchedReport && trimmedInput.includes('?')) {
        try {
          const queryString = trimmedInput.split('?')[1];
          const queryParams = new URLSearchParams(queryString);
          const nameParam = queryParams.get('name');
          if (nameParam) {
            fetchedReport = {
              id: lookupId,
              patientId: queryParams.get('pId') || `PAT-${Date.now()}`,
              timestamp: queryParams.get('ts') || new Date().toISOString(),
              patientDetails: {
                id: queryParams.get('pId') || `PAT-${Date.now()}`,
                name: nameParam,
                age: parseInt(queryParams.get('age') || '40', 10),
                gender: (queryParams.get('gender') as any) || 'Other',
                address: queryParams.get('address') || 'Ullal Health Ward',
                language: (queryParams.get('lang') as any) || 'en'
              },
              answers: {},
              riskResults: {
                riskFactor: (queryParams.get('risk') as 'high' | 'medium' | 'low') || 'low',
                riskScore: parseInt(queryParams.get('score') || '0', 10),
                predictions: {
                  diabetesRisk: (queryParams.get('db') as 'high' | 'medium' | 'low') || 'low',
                  hypertensionRisk: (queryParams.get('bp') as 'high' | 'medium' | 'low') || 'low',
                  notes: `Verified secure digital QR receipt decoded. Worker: ${queryParams.get('asha') || 'ASHA Staff'}.`
                }
              },
              ashaWorker: queryParams.get('asha') ? {
                id: '1001',
                name: queryParams.get('asha') || '',
                phone: queryParams.get('ashaPhone') || '+91 1234567890',
                email: '',
                assignedArea: 'Ullal',
                hospital: 'Ullal Government Hospital'
              } : undefined
            };

            // Cache reconstructed report
            setScreeningsHistory(prev => {
              if (prev.some(h => h.id === fetchedReport?.id)) return prev;
              return [fetchedReport!, ...prev];
            });
            const currentCachedHist = localStorage.getItem('local_screenings_history_cache');
            let decodedList: any[] = [];
            if (currentCachedHist) {
              try { decodedList = JSON.parse(currentCachedHist); } catch (e) {}
            }
            if (!decodedList.some((h: any) => h.id === fetchedReport?.id)) {
              decodedList.unshift(fetchedReport);
              localStorage.setItem('local_screenings_history_cache', JSON.stringify(decodedList));
            }
          }
        } catch (qrUrlErr) {
          console.warn("Failed to reconstruct report from QR URL query string", qrUrlErr);
        }
      }

      if (fetchedReport) {
        // Enforce synchronization to UI displays
        setQrScanData(parsed || fetchedReport);
        setQrScanSuccessMsg(`Verify Completed: Health report successfully loaded and mapped for Patient ${fetchedReport.patientDetails?.name || 'Client'}.`);
        triggerToast("Clinical screening report opened automatically!");

        // Automatically load and display the full diagnostic report popup page
        setSelectedHistoryEntry(fetchedReport);
        setIsQrScannerOpen(false); // Close the scanner console drawer automatically
      } else {
        throw new Error('Report not found');
      }

    } catch (err: any) {
      setQrScanSuccessMsg(`Report not found. Details: ${err.message || 'The specified clinical record is currently unavailable.'}`);
      triggerToast('Report not found');
    } finally {
      setQrScanLoading(false);
    }
  };

  // Clean ASHA notifications
  const clearToastNotifs = async (notifId: string) => {
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
    if (computedIsOnline) {
      try {
        await fetch('/api/notifications/read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: notifId })
        });
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Filters global registry based on worker criteria
  const getFilteredPatients = () => {
    const areaFilter = ashaWorker?.assignedArea?.trim().toLowerCase() || '';

    return globalPatients.filter(p => {
      // Filter by ASHA Area / locality first
      const address = p.address?.toLowerCase() || '';
      const workerArea = p.ashaWorker?.assignedArea?.toLowerCase() || '';

      const belongsToArea = 
        (p.ashaWorker?.id && ashaWorker?.id && String(p.ashaWorker.id) === String(ashaWorker.id)) ||
        (p.ashaWorker?.name && ashaWorker?.name && p.ashaWorker.name.toLowerCase() === ashaWorker.name.toLowerCase()) ||
        workerArea.includes(areaFilter) || 
        address.includes(areaFilter);

      if (!belongsToArea) {
        return false;
      }

      const matchSearch = p.name.toLowerCase().includes(ashaSearchQuery.toLowerCase()) || 
                          p.id.toLowerCase().includes(ashaSearchQuery.toLowerCase());
      
      const matchRisk = ashaRiskFilter === 'all' || p.riskFactor === ashaRiskFilter;
      
      return matchSearch && matchRisk;
    });
  };

  if (isDirectReportView) {
    return (
      <div className="min-h-screen w-full bg-slate-100 font-sans text-slate-950 overflow-auto flex flex-col items-center justify-start p-4 md:p-8" id="standalone-qr-report-view">
        <div className="max-w-2xl w-full bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 md:p-8 space-y-6 flex flex-col my-5">
          {/* Standalone Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-150 pb-5 select-none">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 bg-sky-100 text-sky-600 rounded-xl flex items-center justify-center shadow-inner">
                <HeartPulse className="w-5.5 h-5.5" />
              </div>
              <div>
                <h1 className="text-base font-black text-slate-900 uppercase tracking-tight">SURAKSHA DIGITAL PORTAL</h1>
                <p className="text-[10px] uppercase tracking-widest font-bold text-sky-605 text-sky-600">Official Patient Health Certificate</p>
              </div>
            </div>
            
            <button
              onClick={() => {
                setIsDirectReportView(false);
                setSelectedHistoryEntry(null);
                setReportNotFoundError(null);
                window.location.hash = '';
                setScreeningStep('rolesSelection');
                setSelectedRole(null);
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-705 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer self-start sm:self-center uppercase tracking-wider border border-slate-250"
            >
              Enter Main App
            </button>
          </div>

          {/* Conditional content based on loading/found state */}
          {!selectedHistoryEntry && !reportNotFoundError ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-4">
              <span className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin"></span>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider animate-pulse">Decrypting Clinical Screening Record...</p>
            </div>
          ) : reportNotFoundError ? (
            <div className="py-12 text-center space-y-4 max-w-md mx-auto">
              <div className="w-14 h-14 bg-rose-50 text-rose-500 border border-rose-100 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                <AlertTriangle className="w-6 h-6 animate-bounce" />
              </div>
              <h3 className="text-lg font-black text-rose-800 uppercase">Access Error</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                {reportNotFoundError}
              </p>
              <button
                onClick={() => {
                  setIsDirectReportView(false);
                  setSelectedHistoryEntry(null);
                  setReportNotFoundError(null);
                  window.location.hash = '';
                  setScreeningStep('rolesSelection');
                  setSelectedRole(null);
                }}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs uppercase cursor-pointer"
              >
                Go back to Homepage
              </button>
            </div>
          ) : (
            /* RENDER CLINICAL REPORT DETAILS IN standalone view */
            <div className="space-y-6">
              
              {/* COMPOSITE CLINICAL ALERT HEADER STATS */}
              <div className="p-4 rounded-2xl border bg-emerald-50/50 border-emerald-100 flex flex-col gap-3 select-none">
                <div className="flex items-center gap-2">
                  <div className="bg-emerald-500 text-white rounded-full p-0.5 shadow-sm">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wide">
                    Patient Health Survey Completed Successfully
                  </h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  This survey screening report is finalized and completed. The record has been safely assigned to the designated ASHA worker for continuous regional medical tracking.
                </p>
                <div className="pt-2 border-t border-emerald-100 flex flex-col sm:flex-row gap-x-5 gap-y-1 text-xs">
                  <div>
                    <span className="font-bold text-slate-500">Designated ASHA:</span>{' '}
                    <span className="font-extrabold text-slate-800">
                      {selectedHistoryEntry.ashaWorker?.name || 'Alia Rai'}
                    </span>
                  </div>
                  {selectedHistoryEntry.ashaWorker?.phone && (
                    <div>
                      <span className="font-bold text-slate-500">ASHA Contact:</span>{' '}
                      <span className="font-mono font-extrabold text-sky-700">
                        {selectedHistoryEntry.ashaWorker.phone}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Patient details metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-2">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Patient Demographics</span>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-800 uppercase">{selectedHistoryEntry.patientDetails?.name || selectedHistoryEntry.name || 'Not Specified'}</p>
                    <p className="text-xs text-slate-500"><span className="font-bold">Age:</span> {selectedHistoryEntry.patientDetails?.age || selectedHistoryEntry.age || '40'} Years</p>
                    <p className="text-xs text-slate-500"><span className="font-bold">Gender:</span> {selectedHistoryEntry.patientDetails?.gender || selectedHistoryEntry.gender || 'Other'}</p>
                    <p className="text-xs text-slate-500 leading-relaxed"><span className="font-bold">Address:</span> {selectedHistoryEntry.patientDetails?.address || selectedHistoryEntry.address || 'Ullal Health Ward'}</p>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-2">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Screening Metadata & Staff</span>
                  <div className="space-y-1 text-xs text-slate-600 font-medium">
                    <p className="text-xs text-slate-500"><span className="font-bold">Date & Time:</span> {selectedHistoryEntry.timestamp ? new Date(selectedHistoryEntry.timestamp).toLocaleString() : new Date().toLocaleString()}</p>
                    <p className="text-xs text-slate-500"><span className="font-bold">Assigned ASHA Worker:</span> {selectedHistoryEntry.ashaWorker?.name || 'Alia Rai'} (ID: {selectedHistoryEntry.ashaWorker?.id || '1001'})</p>
                    <span className="text-[10px] inline-block font-black text-rose-800 bg-rose-50 border border-rose-100 rounded px-2 py-0.5 mt-1 font-mono">
                      QR Record Ref ID: {selectedHistoryEntry.id}
                    </span>
                  </div>
                </div>
              </div>

              {/* Clinical Risks Splitting */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-150">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-3">Clinical Metrics Split & Risk Indexes</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 bg-white rounded-lg border border-slate-100 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Diabetes Risk Percentage</span>
                    {(() => {
                      const dRisk = selectedHistoryEntry.riskResults?.predictions?.diabetesRisk || selectedHistoryEntry.predictions?.diabetesRisk || 'low';
                      const percentageVal = dRisk === 'high' ? '80%' : dRisk === 'medium' ? '45%' : '10%';
                      return (
                        <div className="mt-1 flex items-baseline gap-2">
                          <span className="text-lg font-black text-slate-805 text-slate-800 animate-pulse">{percentageVal}</span>
                          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded uppercase ${
                            dRisk === 'high' ? 'bg-rose-100 text-rose-700 font-extrabold border border-rose-200' : dRisk === 'medium' ? 'bg-amber-100 text-amber-700 font-extrabold border border-amber-200' : 'bg-emerald-100 text-emerald-700 font-extrabold border border-emerald-200'
                          }`}>{dRisk}</span>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-slate-100 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Hypertension Risk Percentage</span>
                    {(() => {
                      const hRisk = selectedHistoryEntry.riskResults?.predictions?.hypertensionRisk || selectedHistoryEntry.predictions?.hypertensionRisk || 'low';
                      const percentageVal = hRisk === 'high' ? '85%' : hRisk === 'medium' ? '50%' : '15%';
                      return (
                        <div className="mt-1 flex items-baseline gap-2">
                          <span className="text-lg font-black text-slate-805 text-slate-800 animate-pulse">{percentageVal}</span>
                          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded uppercase ${
                            hRisk === 'high' ? 'bg-rose-100 text-rose-700 font-extrabold border border-rose-200' : hRisk === 'medium' ? 'bg-amber-100 text-amber-700 font-extrabold border border-amber-200' : 'bg-emerald-100 text-emerald-700 font-extrabold border border-emerald-200'
                          }`}>{hRisk}</span>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Advisory notes */}
              <div className="space-y-1.5 leading-relaxed">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block font-bold">Diagnostic Advisory & Referral Advice</span>
                <div className="bg-sky-50 border border-sky-100 text-sky-950 p-4 rounded-xl text-xs font-semibold">
                  {selectedHistoryEntry.riskResults?.predictions?.notes || selectedHistoryEntry.predictions?.notes || 'No notes compiled.'}
                </div>
              </div>

              {/* Answers Grid if entries exist */}
              {selectedHistoryEntry.answers && Object.keys(selectedHistoryEntry.answers).length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Verified Verbal Response Sheets</span>
                  <div className="border border-slate-150 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                    {Object.entries(selectedHistoryEntry.answers).map(([key, val]: any, idx) => {
                      let cleanKeyLabel = key;
                      if (key.startsWith('diab_')) cleanKeyLabel = `Diabetes Checklist [Q${key.replace('diab_', '')}]`;
                      if (key.startsWith('bp_')) cleanKeyLabel = `Hypertension Checklist [Q${key.replace('bp_', '')}]`;
                      if (key.startsWith('gen_')) cleanKeyLabel = `General Checklist [Q${key.replace('gen_', '')}]`;

                      return (
                        <div key={key} className="p-3 bg-white flex justify-between gap-4 items-center">
                          <span className="font-bold text-slate-600">{idx+1}. {cleanKeyLabel}:</span>
                          <span className={`font-mono font-bold uppercase text-[10px] px-2 py-0.5 rounded leading-none ${
                            val === 'yes' || val.toLowerCase().includes('yes') || val.toLowerCase().includes('ಹೌದು')
                              ? 'bg-rose-50 text-rose-600 border border-rose-100'
                              : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          }`}>
                            {val}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Action buttons footer */}
              <div className="flex gap-4 pt-4 border-t border-slate-150 justify-between items-center select-none">
                <button
                  onClick={() => {
                    setIsDirectReportView(false);
                    setSelectedHistoryEntry(null);
                    setReportNotFoundError(null);
                    window.location.hash = '';
                    setScreeningStep('rolesSelection');
                    setSelectedRole(null);
                  }}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-250 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1 uppercase tracking-wide"
                >
                  Return to App
                </button>
                
                <button
                  onClick={() => {
                    downloadPdfReport(selectedHistoryEntry);
                  }}
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-md cursor-pointer uppercase tracking-wider"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Official PDF Report</span>
                </button>
              </div>

            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-900 overflow-hidden">
      
      {/* Toast Alert Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-6 left-1/3 right-1/3 z-50 bg-slate-900 text-white shadow-2xl rounded-xl border border-slate-700/50 p-4 flex items-center gap-3 backdrop-blur-md"
          >
            <Activity className="w-5 h-5 text-sky-400 shrink-0 animate-pulse" />
            <p className="text-sm font-medium tracking-tight">{toastMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar Navigation - Stylized to match Geometric Balance Design theme */}
      {selectedRole && (
        <aside id="aside-bar" className="w-20 bg-white border-r border-slate-200 flex flex-col items-center py-6 space-y-8 select-none shrink-0">
          <div 
            onClick={triggerNewScreening}
            className="w-12 h-12 bg-sky-600 rounded-xl flex items-center justify-center shadow-lg shadow-sky-200 cursor-pointer transition transform hover:scale-105 active:scale-95"
            title="Suraksha Screening App"
          >
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
            </svg>
          </div>

          <nav className="flex flex-col space-y-5 flex-1 pt-4">
            {selectedRole === 'patient' && (
              <>
                <button
                  onClick={() => {
                    setActivePortal('patient');
                    setScreeningStep('patientDashboard');
                  }}
                  className={`p-3 rounded-lg transition-all ${
                    screeningStep !== 'insulinSystem' 
                      ? 'bg-sky-50 text-sky-600 shadow-sm' 
                      : 'text-slate-400 hover:text-sky-600 hover:bg-slate-50'
                  }`}
                  title="Patient Outreach Screen"
                  id="nav-patient"
                >
                  <Mic className="w-6 h-6" />
                </button>

                <button
                  onClick={() => {
                    setActivePortal('patient');
                    setScreeningStep('insulinSystem');
                  }}
                  className={`p-3 rounded-lg transition-all ${
                    screeningStep === 'insulinSystem' 
                      ? 'bg-emerald-50 text-emerald-600 shadow-sm' 
                      : 'text-slate-400 hover:text-emerald-650 hover:bg-emerald-50/40'
                  }`}
                  title="Adaptive Insulin System"
                  id="nav-insulin"
                >
                  <Activity className="w-6 h-6" />
                </button>
              </>
            )}

            {selectedRole === 'asha' && (
              <button
                onClick={() => setActivePortal('asha')}
                className={`p-3 rounded-lg transition-all ${
                  activePortal === 'asha' 
                    ? 'bg-sky-50 text-sky-600 shadow-sm' 
                    : 'text-slate-400 hover:text-sky-600 hover:bg-slate-50'
                }`}
                title="ASHA Worker Dashboard"
                id="nav-asha"
              >
                <Users className="w-6 h-6" />
              </button>
            )}
          </nav>

          {/* Sync Queues Visualized - ONLY FOR ASHA */}
          {activePortal === 'asha' && (
            <div className="flex flex-col items-center space-y-4">
              <div className="relative group cursor-pointer" title="Offline Pending Sync Queue size">
                <Database className={`w-5 h-5 ${offlineSyncQueue.length > 0 ? 'text-amber-500 animate-bounce' : 'text-slate-400'}`} />
                {offlineSyncQueue.length > 0 && (
                  <span className="absolute -top-2.5 -right-2.5 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full border border-slate-50">
                    {offlineSyncQueue.length}
                  </span>
                )}
                
                {/* Sync Hover tooltip list */}
                <div className="hidden group-hover:block absolute bottom-8 left-0 bg-slate-950 text-white text-[10px] p-3 rounded-xl shadow-xl w-48 z-40 border border-slate-700 leading-relaxed font-mono">
                  <span className="font-bold text-amber-500">OFFLINE SYNC QUEUE</span>
                  {offlineSyncQueue.length === 0 ? (
                    <p className="text-slate-400 mt-1">All patient reports synced securely with clinic server!</p>
                  ) : (
                    <div className="mt-1 space-y-1 max-h-32 overflow-y-auto">
                      {offlineSyncQueue.map((item, id) => (
                        <div key={id} className="border-t border-slate-800 pt-1">
                          {id + 1}. {item.data.name} ({item.data.age} yrs) - {item.data.riskFactor?.toUpperCase()} Risk
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200" title="System Settings">
                <span className="text-xs font-bold text-slate-600">IN</span>
              </div>
            </div>
          )}
        </aside>
      )}

      {/* Main Content Pane */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* Header Bar matching "Geometric Balance" design instructions */}
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 select-none">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-sky-900 bg-clip-text text-transparent">
              HealthSync
            </h1>
          </div>

          {/* Configuration Actions */}
          <div className="flex items-center space-x-6">
            
            {/* Real Network Connection Indicator */}
            <div className="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
              <div className={`py-1 px-3.5 rounded-lg text-xs font-bold font-mono transition flex items-center gap-1.5 shadow-sm ${
                !computedIsOnline 
                  ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                  : 'bg-emerald-50 text-emerald-850 border border-emerald-200'
              }`}>
                {!computedIsOnline ? (
                  <>
                    <WifiOff className="w-3.5 h-3.5 text-rose-600" />
                    <span>OFFLINE MODE (QUEUED)</span>
                  </>
                ) : (
                  <>
                    <Wifi className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                    <span>SYSTEM ONLINE (SYNCED)</span>
                  </>
                )}
              </div>
            </div>

            {/* Quick Language Toggle */}
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Interface</span>
              <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 select-none">
                <button
                  onClick={() => startPatientScreening(Language.ENGLISH)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${
                    selectedLang === Language.ENGLISH 
                      ? 'bg-white text-sky-600 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  id="lang-en"
                >
                  English
                </button>
                <button
                  onClick={() => startPatientScreening(Language.KANNADA)}
                  className={`px-4 py-1.5 rounded-md text-xs font-bold transition ${
                    selectedLang === Language.KANNADA 
                      ? 'bg-white text-sky-600 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  id="lang-kn"
                >
                  ಕನ್ನಡ
                </button>
              </div>
            </div>

            <div className="h-8 w-px bg-slate-200"></div>

            {/* Connection Status Icon */}
            <div className="flex items-center space-x-2.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
              <span className="flex h-2.5 w-2.5 relative">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  !computedIsOnline 
                    ? 'bg-rose-400' 
                    : (offlineSyncQueue.length > 0 ? 'bg-amber-400' : 'bg-emerald-400')
                }`}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  !computedIsOnline 
                    ? 'bg-rose-500' 
                    : (offlineSyncQueue.length > 0 ? 'bg-amber-500' : 'bg-emerald-500')
                }`}></span>
              </span>
              <span className="text-[11px] font-black text-slate-700 uppercase tracking-wide">
                {!computedIsOnline 
                  ? 'Offline Mode Active' 
                  : (offlineSyncQueue.length > 0 ? `Sync Pending (${offlineSyncQueue.length} queued)` : 'Online')}
              </span>
            </div>
          </div>
        </header>

        {/* Dynamic Portal Content Viewports */}
        <div className="flex-1 p-8 overflow-y-auto bg-slate-100/40">
          {activePortal === 'patient' ? (
            
            /* ========================================================
               PATIENT SCREENING VIEWPORT
               ======================================================== */
            <div id="patient-view" className="max-w-4xl mx-auto h-full flex flex-col space-y-6">
              
              {/* Voice control bar */}
              <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between shadow-md">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${voiceEnabled ? 'bg-sky-500/20 text-sky-400' : 'bg-rose-500/20 text-rose-400'}`}>
                    {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold tracking-tight">Speech Interactive Clinical Assistant</h3>
                    <p className="text-xs text-slate-400">
                      {voiceEnabled 
                        ? 'Speaks questions aloud. Reads out voice verification requests.' 
                        : 'Muted. Speech synthetic readouts are paused.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setVoiceEnabled(!voiceEnabled)}
                    className={`py-1.5 px-3.5 rounded-lg text-xs font-bold cursor-pointer transition ${
                      voiceEnabled ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-rose-600 text-white hover:bg-rose-500'
                    }`}
                  >
                    {voiceEnabled ? 'Mute AI Voice' : 'Unmute Speech Assistant'}
                  </button>
                </div>
              </div>

              {/* Patient Core Interactive Container */}
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 flex flex-col flex-1 relative min-h-[480px]">
                
                {speechError && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded-xl mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{speechError}</span>
                  </div>
                )}

                {/* Patient Portal Router */}
                {screeningStep === 'language' ? (
                  
                  /* STEP 1: Select Language Screen */
                  <div className="flex-1 flex flex-col items-center justify-center space-y-8 w-full">
                    <div className="flex-1 flex flex-col items-center justify-center text-center max-w-lg mx-auto space-y-8 py-10 w-full">
                      <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-sky-600" />
                      </div>
                      
                      <div className="space-y-3">
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                          Welcome to Rural Patient Early Clinical Screening
                        </h2>
                        <p className="text-slate-500 text-sm leading-relaxed">
                          This automated speech portal tests for underlying diabetes risk and hypertensive tendencies. 
                          Please select your language to activate the vocal consultation screen.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 w-full">
                        <button
                          onClick={() => {
                            setSelectedLang(Language.ENGLISH);
                            setScreeningStep('rolesSelection');
                          }}
                          className="p-5 bg-white border-2 border-slate-200 hover:border-sky-500 rounded-xl font-bold text-slate-700 text-center transition shadow-sm hover:shadow-md flex flex-col items-center gap-2"
                          id="patient-start-en"
                        >
                          <span className="text-xl">English</span>
                          <span className="text-xs text-slate-400 font-normal">Outreach Screen Mode</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedLang(Language.KANNADA);
                            setScreeningStep('rolesSelection');
                          }}
                          className="p-5 bg-white border-2 border-slate-200 hover:border-sky-500 rounded-xl font-bold text-slate-700 text-center transition shadow-sm hover:shadow-md flex flex-col items-center gap-2"
                          id="patient-start-kn"
                        >
                          <span className="text-xl">ಕನ್ನಡ (Kannada)</span>
                          <span className="text-xs text-slate-400 font-normal">ಸಂಪರ್ಕ ಸ್ಕ್ರೀನಿಂಗ್</span>
                        </button>
                      </div>
                    </div>

                    {/* 24/7 Electronic Emergency Trauma Desk & ASHA Link Helpline */}
                    <div className="w-full max-w-2xl mt-4">
                      <EmergencyHotline 
                        selectedLang={selectedLang}
                        patientAddress={patientAddress}
                        voiceEnabled={voiceEnabled}
                      />
                    </div>
                  </div>

                ) : screeningStep === 'rolesSelection' ? (
                  
                  /* ========================================================
                     ROLE SELECTION SCREEN AFTER LANGUAGE SELECTION
                     ======================================================== */
                  <div className="flex-1 flex flex-col items-center justify-center space-y-8 w-full max-w-3xl mx-auto py-10" id="roles-selection-view">
                    <div className="text-center space-y-3">
                      <div className="w-16 h-16 bg-sky-50 text-sky-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                        <Users className="w-8 h-8" />
                      </div>
                      <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                        {selectedLang === Language.KANNADA ? 'ಕೇಂದ್ರ ಪಾತ್ರ ಆಯ್ಕೆ' : 'Select Portal Access Role'}
                      </h2>
                      <p className="text-slate-500 text-sm max-w-lg leading-relaxed">
                        {selectedLang === Language.KANNADA 
                          ? 'ಮುಂದುವರೆಯಲು ಸೂಕ್ತವಾದ ಪಾತ್ರವನ್ನು ಆಯ್ಕೆ ಮಾಡಿ. ರೋಗಿಗಳು ತಪಾಸಣೆ ಕೈಗೊಳ್ಳಬಹುದು, ಮತ್ತು ಆಶಾ ಕಾರ್ಯಕರ್ತೆಯರು ನಿರ್ವಹಿಸಬಹುದು.' 
                          : 'Please choose the appropriate profile designation to continue. Patients can undergo automated screenings and view previous history, whereas ASHA workers manage field records.'}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mt-4">
                      {/* LEFT CARD: Patient Dashboard */}
                      <button
                        onClick={() => {
                          setSelectedRole('patient');
                          setActivePortal('patient');
                          setScreeningStep('patientLogin');
                        }}
                        className="group relative p-8 bg-white border-2 border-slate-200 hover:border-sky-500 rounded-2xl font-sans text-left transition-all duration-300 shadow-sm hover:shadow-xl flex flex-col space-y-4 hover:-translate-y-1"
                        id="role-select-patient"
                      >
                        <div className="w-12 h-12 bg-sky-100 text-sky-600 rounded-xl flex items-center justify-center transition group-hover:scale-110">
                          <HeartPulse className="w-6 h-6" />
                        </div>
                        <div className="space-y-1.5 flex-1 flex flex-col justify-between">
                          <div>
                            <span className="text-xs uppercase font-extrabold tracking-wider text-sky-500 block mb-1">Outreach Component</span>
                            <h3 className="text-xl font-bold text-slate-805 group-hover:text-sky-600 transition">
                              {selectedLang === Language.KANNADA ? 'ರೋಗಿಗಳ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್' : 'Patient Dashboard'}
                            </h3>
                          </div>
                          <p className="text-slate-400 text-xs leading-relaxed font-normal mt-2">
                            {selectedLang === Language.KANNADA
                              ? 'ಧ್ವನಿ ಮಾರ್ಗದರ್ಶನದ ಮೂಲಕ ಮಧುಮೇಹ ಮತ್ತು ರಕ್ತದೊತ್ತಡದ ತಪಾಸಣೆಯನ್ನು ಪ್ರಾರಂಭಿಸಿ ಅಥವಾ ನಿಮ್ಮ ಹಿಂದಿನ ವರದಿಗಳನ್ನು ವೀಕ್ಷಿಸಿ.'
                              : 'Initiate voice-guided non-communicable disease screenings, scan diagnostic QR codes, or access your saved regional clinical record cabinets.'}
                          </p>
                        </div>
                        <div className="pt-2 flex items-center text-xs font-bold text-sky-600 gap-1 mt-auto">
                          <span>{selectedLang === Language.KANNADA ? 'ಪ್ರವೇಶಿಸಿ' : 'Enter Patient Portal'}</span>
                          <ArrowRight className="w-3.5 h-3.5 transition transform group-hover:translate-x-1" />
                        </div>
                      </button>

                      {/* RIGHT CARD: ASHA Worker Dashboard */}
                      <button
                        onClick={() => {
                          setSelectedRole('asha');
                          setActivePortal('asha');
                        }}
                        className="group relative p-8 bg-white border-2 border-slate-200 hover:border-emerald-500 rounded-2xl font-sans text-left transition-all duration-300 shadow-sm hover:shadow-xl flex flex-col space-y-4 hover:-translate-y-1"
                        id="role-select-asha"
                      >
                        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center transition group-hover:scale-110">
                          <Users className="w-6 h-6" />
                        </div>
                        <div className="space-y-1.5 flex-1 flex flex-col justify-between">
                          <div>
                            <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-500 block mb-1">Field Administration</span>
                            <h3 className="text-xl font-bold text-slate-805 group-hover:text-emerald-700 transition">
                              {selectedLang === Language.KANNADA ? 'ಆಶಾ ಕಾರ್ಯಕರ್ತೆಯರ ಲಾಗಿನ್' : 'ASHA Worker Dashboard'}
                            </h3>
                          </div>
                          <p className="text-slate-400 text-xs leading-relaxed font-normal mt-2">
                            {selectedLang === Language.KANNADA
                              ? 'ನಿಮ್ಮ ಆಶಾ ಸಿಬ್ಬಂದಿ ವಿವರಗಳೊಂದಿಗೆ ಲಾಗಿನ್ ಆಗಿ ಗ್ರಾಮದ ಆರೋಗ್ಯ ನಕ್ಷೆ ಮತ್ತು ಬಾಕಿ ಇರುವ ಸಿಂಕ್ ಕ್ಯೂ ಅನ್ನು ನಿರ್ವಹಿಸಿ.'
                              : 'Authenticate with unique employee credentials. Track rural screening zones, analyze spatial household maps, and transmit clinical registers.'}
                          </p>
                        </div>
                        <div className="pt-2 flex items-center text-xs font-bold text-emerald-600 gap-1 mt-auto">
                          <span>{selectedLang === Language.KANNADA ? 'ಲಾಗಿನ್ ಮಾಡಿ' : 'Login as ASHA Worker'}</span>
                          <ArrowRight className="w-3.5 h-3.5 transition transform group-hover:translate-x-1" />
                        </div>
                      </button>
                    </div>

                    <div className="pt-4">
                      <button
                        onClick={() => setScreeningStep('language')}
                        className="text-xs font-bold text-slate-400 hover:text-slate-600 transition"
                      >
                        ← {selectedLang === Language.KANNADA ? 'ಭಾಷೆ ಬದಲಾಯಿಸಿ' : 'Back to Language Selection'}
                      </button>
                    </div>
                  </div>

                ) : screeningStep === 'patientLogin' ? (
                  
                  /* ========================================================
                     SEPARATED PATIENT LOGIN & REGISTRATION VIEW
                     ======================================================== */
                  <div className="flex-1 flex flex-col items-center justify-center space-y-6 max-w-md mx-auto py-10" id="patient-login-view">
                    <div className="text-center space-y-2 mb-2">
                      <div className="w-14 h-14 bg-sky-100 text-sky-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                        <HeartPulse className="w-6 h-6 animate-pulse" />
                      </div>
                      <h2 className="text-2xl font-black text-slate-805 tracking-tight">
                        {selectedLang === Language.KANNADA ? 'ರೋಗಿಗಳ ದೃಢೀಕರಣ ನಿರ್ವಹಣೆ' : 'Patient Authentication'}
                      </h2>
                      <p className="text-xs text-slate-400">
                        {selectedLang === Language.KANNADA 
                          ? 'ತಪಾಸಣಾ ಪ್ರವೇಶ ಪಡೆಯಲು ನಿಮ್ಮ ವಿವರಗಳನ್ನು ಸಲ್ಲಿಸಿ.' 
                          : 'Enter your valid name and mobile digits to securely access clinical cabinets.'}
                      </p>
                    </div>

                    {/* Authentication Double Tabs */}
                    <div className="grid grid-cols-2 gap-1 bg-slate-150 p-1 rounded-xl w-full border border-slate-200">
                      <button
                        type="button"
                        onClick={() => {
                          setPatientAuthTab('login');
                          setPatientAuthError('');
                        }}
                        className={`py-2 text-xs font-extrabold uppercase rounded-lg transition-all ${
                          patientAuthTab === 'login'
                            ? 'bg-white shadow-sm text-sky-600'
                            : 'text-slate-500 hover:text-slate-750'
                        }`}
                      >
                        {selectedLang === Language.KANNADA ? 'ಲಾಗಿನ್' : 'Log In'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPatientAuthTab('register');
                          setPatientAuthError('');
                        }}
                        className={`py-2 text-xs font-extrabold uppercase rounded-lg transition-all ${
                          patientAuthTab === 'register'
                            ? 'bg-white shadow-sm text-sky-600'
                            : 'text-slate-500 hover:text-slate-750'
                        }`}
                      >
                        {selectedLang === Language.KANNADA ? 'ಹೊಸ ನೋಂದಣಿ' : 'Register'}
                      </button>
                    </div>

                    <form onSubmit={(e) => handlePatientAuth(e, patientAuthTab === 'register')} className="bg-white border-2 border-slate-100 rounded-2xl p-6 w-full space-y-4 shadow-xl">
                      {patientAuthError && (
                        <div className="p-3 bg-rose-55 text-rose-600 border border-rose-100 text-xs font-bold rounded-xl text-center">
                          {patientAuthError}
                        </div>
                      )}

                      <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                          {selectedLang === Language.KANNADA ? 'ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರು' : 'Full Name'}
                        </label>
                        <input
                          type="text"
                          required
                          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-sky-500 font-bold bg-white text-slate-800"
                          value={loggedInPatientName}
                          onChange={(e) => setLoggedInPatientName(e.target.value)}
                          placeholder="e.g. Kaveri Gowda"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                          {selectedLang === Language.KANNADA ? 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ' : 'Phone Number'}
                        </label>
                        <input
                          type="tel"
                          required
                          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-sky-500 font-bold bg-white text-slate-800"
                          value={loggedInPatientPhone}
                          onChange={(e) => setLoggedInPatientPhone(e.target.value)}
                          placeholder="e.g. 9876543210"
                        />
                      </div>

                      {patientAuthTab === 'register' && (
                        <p className="text-[10px] text-slate-400 leading-normal">
                          * By registering, we will authorize a safe clinical instance in the master primary cloud index.
                        </p>
                      )}

                      <button
                        type="submit"
                        disabled={patientAuthLoading}
                        className="w-full bg-sky-600 hover:bg-sky-500 text-white font-extrabold py-3 px-4 rounded-xl text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-1"
                      >
                        {patientAuthLoading ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <span>
                              {patientAuthTab === 'login'
                                ? (selectedLang === Language.KANNADA ? 'ಪ್ರವೇಶಿಸಿ' : 'Access Dashboard')
                                : (selectedLang === Language.KANNADA ? 'ಖಾತೆ ತೆರೆಯಿರಿ' : 'Register & Start')}
                            </span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>

                      {/* Demo Autofills list */}
                      <div className="space-y-1.5 text-start border-t border-slate-100 pt-3">
                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block font-bold">Quick Demo Triggers:</span>
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setLoggedInPatientName("Kaveri Gowda");
                              setLoggedInPatientPhone("9876543210");
                              setPatientAuthTab('login');
                            }}
                            className="text-[9px] font-extrabold px-2.5 py-1.5 bg-slate-50 hover:bg-sky-50 border border-slate-200 rounded-lg text-slate-700 transition"
                          >
                            Kaveri Gowda
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setLoggedInPatientName("Manjappa Hegde");
                              setLoggedInPatientPhone("8765432109");
                              setPatientAuthTab('login');
                            }}
                            className="text-[9px] font-extrabold px-2.5 py-1.5 bg-slate-50 hover:bg-sky-50 border border-slate-200 rounded-lg text-slate-700 transition"
                          >
                            Manjappa Hegde
                          </button>
                        </div>
                      </div>
                    </form>

                    <div className="flex justify-between w-full text-xs font-bold text-slate-400 px-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedRole(null);
                          setScreeningStep('rolesSelection');
                        }}
                        className="hover:text-slate-600 transition"
                      >
                        ← {selectedLang === Language.KANNADA ? 'ಪಾತ್ರ ಆಯ್ಕೆಗೆ ಹಿಂತಿರುಗಿ' : 'Back to Selection'}
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => {
                          setLoggedInPatientName("Guest Patient");
                          setLoggedInPatientPhone("0000000000");
                          setScreeningStep('patientDashboard');
                          triggerToast("Logged in as Guest!");
                        }}
                        className="text-sky-600 hover:underline"
                      >
                        {selectedLang === Language.KANNADA ? 'ಅತಿಥಿಯಾಗಿ ಮುಂದುವರೆಯಿರಿ →' : 'Continue as Guest →'}
                      </button>
                    </div>
                  </div>

                ) : screeningStep === 'patientDashboard' ? (
                  
                  /* ========================================================
                     PATIENT PORTAL MAIN HOME DASHBOARD WITH HISTORY & ACCESS
                     ======================================================== */
                  <div className="flex-1 flex flex-col space-y-6 w-full" id="patient-dashboard-cabinet">
                    
                    {/* Welcome Banner */}
                    <div className="bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 text-white rounded-2xl p-6 md:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
                      <div className="absolute right-0 top-0 opacity-10 pointer-events-none translate-x-10 -translate-y-10">
                        <Sparkles className="w-96 h-96" />
                      </div>
                      
                      <div className="space-y-2 relative z-10 max-w-xl text-start">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                          <span className="text-[10px] tracking-wider font-extrabold uppercase text-sky-300">
                            {selectedLang === Language.KANNADA ? 'ಸಂಪರ್ಕ ಪೋರ್ಟಲ್ ಸಕ್ರಿಯವಾಗಿದೆ' : 'Patient Locker Cabinet Active'}
                          </span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-black tracking-tight font-sans">
                          {selectedLang === Language.KANNADA ? 'ನಮಸ್ಕಾರ, ' : 'Welcome, '}<span className="text-sky-300">{loggedInPatientName}</span>
                        </h2>
                        <p className="text-xs text-slate-300 leading-relaxed font-normal">
                          {selectedLang === Language.KANNADA 
                            ? 'ಇದು ನಿಮ್ಮ ಸುರಕ್ಷಾ ಆರೋಗ್ಯ ಪೆಟ್ಟಿಗೆ. ಮಧುಮೇಹ ಮತ್ತು ಹೃದಯ ಸಂಬಂಧಿ ಕಾಯಿಲೆಗಳ ಮುನ್ನೆಚ್ಚರಿಕೆಗಾಗಿ ಇಲ್ಲಿ ತಪಾಸಣೆ ಕೈಗೊಳ್ಳಿ.' 
                            : 'This health portal identifies underlying hypertension and diabetes markers using real-time vocal risk diagnostics. Proceed with a voice consultation or manage your clinical history reports.'}
                        </p>
                      </div>

                      <div className="relative z-10 shrink-0 flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        <button
                          onClick={() => {
                            setPatientName(loggedInPatientName === 'Guest Patient' ? '' : loggedInPatientName);
                            setPatientAge('');
                            setAnswers({});
                            setCurrentQuestionIndex(0);
                            setPendingConfirmation(null);
                            setTranscriptText('');
                            
                            // Let's call startPatientScreening for actual vocal step execution
                            setSelectedLang(selectedLang);
                            setScreeningStep('name');
                            
                            setTimeout(() => {
                              const greeting = SYSTEM_GREETINGS[selectedLang].voiceAskName;
                              speakText(greeting, selectedLang);
                            }, 500);
                          }}
                          className="bg-sky-500 hover:bg-sky-400 text-white font-black py-4 px-6 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-sky-500/20 transition-all flex items-center justify-center gap-2 grow border border-sky-400/30 cursor-pointer"
                        >
                          <Mic className="w-4 h-4 text-white animate-pulse" />
                          <span>{selectedLang === Language.KANNADA ? 'ಕೌನ್ಸೆಲಿಂಗ್ ಆರಂಭಿಸಿ' : 'Launch NCD Consultation'}</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            setLoggedInPatientName('');
                            setSelectedRole(null);
                            setScreeningStep('rolesSelection');
                          }}
                          className="bg-slate-800 hover:bg-slate-705 bg-slate-800 hover:bg-slate-700 text-slate-305 text-slate-300 font-extrabold py-4 px-5 rounded-xl text-xs uppercase tracking-wider border border-slate-700 transition cursor-pointer"
                        >
                          {selectedLang === Language.KANNADA ? 'ನಿರ್ಗಮಿಸಿ' : 'Logout Session'}
                        </button>
                      </div>
                    </div>

                    {/* Adaptive Insulin System Bento Deck Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 select-none text-start">
                      {/* Outreach Screen Card */}
                      <div className="bg-white rounded-2xl p-6 border border-slate-205 border-slate-200 shadow-xs hover:shadow-md transition duration-300 flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <div className="w-10 h-10 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center">
                            <Mic className="w-5 h-5" />
                          </div>
                          <h3 className="text-base font-extrabold text-slate-800">
                            {selectedLang === Language.KANNADA ? 'ಧ್ವನಿ ತಪಾಸಣೆ ಸೇವೆ' : 'Voice early clinical screening'}
                          </h3>
                          <p className="text-xs text-slate-500 leading-relaxed font-normal">
                            {selectedLang === Language.KANNADA
                              ? 'ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ ಧ್ವನಿಯ ಮೂಲಕ ಸುಲಭವಾಗಿ ಮಧುಮೇಹ ಮತ್ತು ಬಿಪಿ ತಪಾಸಣೆ ಕೈಗೊಳ್ಳಿ.'
                              : 'Answer NCD clinical triage questions verbally in Hindi/Kannada/English. Calculates and queues regional safety metrics offline.'}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setPatientName(loggedInPatientName === 'Guest Patient' ? '' : loggedInPatientName);
                            setPatientAge('');
                            setAnswers({});
                            setCurrentQuestionIndex(0);
                            setPendingConfirmation(null);
                            setTranscriptText('');
                            setSelectedLang(selectedLang);
                            setScreeningStep('name');
                            setTimeout(() => {
                              const greeting = SYSTEM_GREETINGS[selectedLang].voiceAskName;
                              speakText(greeting, selectedLang);
                            }, 500);
                          }}
                          className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer"
                        >
                          <Mic className="w-4 h-4" />
                          <span>{selectedLang === Language.KANNADA ? 'ಧ್ವನಿ ತಪಾಸಣೆ ಆರಂಭಿಸಿ' : 'Start Voice screening'}</span>
                        </button>
                      </div>

                      {/* Adaptive Insulin Card */}
                      <div className="bg-white rounded-2xl p-6 border border-emerald-205 border-emerald-200 shadow-xs hover:shadow-md transition duration-300 flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                              <Activity className="w-5 h-5" />
                            </div>
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
                              {selectedLang === Language.KANNADA ? 'ಹೊಸ ವೈಶಿಷ್ಟ್ಯ' : 'NEW INTERACTIVE SUITE'}
                            </span>
                          </div>
                          <h3 className="text-base font-extrabold text-slate-800">
                            {selectedLang === Language.KANNADA ? 'ಅಡಾಪ್ಟಿವ್ ಇನ್ಸುಲಿನ್ ಸಿಸ್ಟಮ್' : 'Adaptive Insulin System'}
                          </h3>
                          <p className="text-xs text-slate-500 leading-relaxed font-normal">
                            {selectedLang === Language.KANNADA
                              ? 'ನಿಮ್ಮ ವಯಸ್ಸು, ತೂಕ, ಊಟದ ಸಮಯದ ಲಕ್ಷಣಗಳನ್ನು ಇನ್ಪುಟ್ ಮಾಡಿ ಗ್ಲುಕೋಸ್ ವರದಿಗಳನ್ನು ವಿಶ್ಲೇಷಿಸಿ.'
                              : 'Inputs physical biometrics weight metrics, post-meal contexts, and active symptoms to estimate glucose anomalies and dosage plans.'}
                          </p>
                        </div>
                        <button
                          onClick={() => setScreeningStep('insulinSystem')}
                          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/10 cursor-pointer"
                        >
                          <Activity className="w-4 h-4 animate-pulse" />
                          <span>{selectedLang === Language.KANNADA ? 'ಇನ್ಸುಲಿನ್ ಸಿಸ್ಟಮ್ ಪ್ರವೇಶಿಸಿ' : 'Enter Adaptive Insulin System'}</span>
                        </button>
                      </div>
                    </div>

                    {/* HISTORY CABINET AND PREVIOUS REPORT VIEWER */}
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div className="text-start">
                          <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                            <Clock className="w-5 h-5 text-sky-600" />
                            {selectedLang === Language.KANNADA ? 'ಹಿಂದಿನ ತಪಾಸಣಾ ವಿವರಗಳು' : 'Your Diagnostic Consultation History'}
                          </h3>
                          <p className="text-xs text-slate-405">
                            {selectedLang === Language.KANNADA 
                              ? 'ನಿಮ್ಮ ಹೆಸರಿನಲ್ಲಿ ಇಲ್ಲಿಯವರೆಗೆ ಸಲ್ಲಿಸಲಾದ ಎಲ್ಲಾ ರೆಕಾರ್ಡ್‌ಗಳ ವಿವರವಾದ ಬ್ಯಾಂಡ್' 
                              : `Previous non-communicable early screening entries compiled for "${loggedInPatientName}".`}
                          </p>
                        </div>

                        {/* Search and Filters */}
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input 
                            type="text"
                            value={historySearchQuery}
                            onChange={(e) => setHistorySearchQuery(e.target.value)}
                            placeholder="Search clinical notes..."
                            className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs text-slate-705 font-bold focus:outline-sky-500"
                          />
                          <select
                            value={historyRiskFilter}
                            onChange={(e) => setHistoryRiskFilter(e.target.value as any)}
                            className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-650 focus:outline-sky-500"
                          >
                            <option value="all">All Risk Levels</option>
                            <option value="high">High Risk Only</option>
                            <option value="medium">Medium Risk</option>
                            <option value="low">Low Risk</option>
                          </select>
                        </div>
                      </div>

                      {/* HISTORY FILTERED LIST */}
                      {(() => {
                        let items = screeningsHistory.filter(scrObj => {
                          const query = historySearchQuery.toLowerCase();
                          const isGuest = loggedInPatientName === 'Guest Patient';
                          const nameMatch = isGuest || 
                            (scrObj.patientDetails?.name || '').toLowerCase().includes(loggedInPatientName.toLowerCase()) ||
                            (scrObj.name || '').toLowerCase().includes(loggedInPatientName.toLowerCase());
                          
                          let riskMatch = true;
                          const riskLevel = scrObj.riskResults?.riskFactor || scrObj.riskFactor || 'low';
                          if (historyRiskFilter !== 'all') {
                            riskMatch = riskLevel === historyRiskFilter;
                          }

                          let searchMatch = true;
                          if (historySearchQuery) {
                            const notes = scrObj.riskResults?.predictions?.notes || scrObj.predictions?.notes || '';
                            const pName = scrObj.patientDetails?.name || scrObj.name || '';
                            searchMatch = scrObj.id.toLowerCase().includes(query) ||
                              pName.toLowerCase().includes(query) ||
                              notes.toLowerCase().includes(query);
                          }

                          return nameMatch && riskMatch && searchMatch;
                        });

                        if (items.length === 0) {
                          return (
                            <div className="bg-white rounded-xl border border-dashed border-slate-350 p-10 text-center space-y-3">
                              <ShieldAlert className="w-8 h-8 text-slate-300 mx-auto" />
                              <p className="text-slate-500 text-xs font-bold">No previous screening logs recorded.</p>
                              <p className="text-slate-400 text-[10px]">
                                Your medical locker is currently clear. Once you complete a vocal assessment screening, it will be automatically logged here.
                              </p>
                            </div>
                          );
                        }

                        // Sorted Newest First
                        const sortedItems = [...items].sort((a, b) => {
                          const timeA = new Date(a.timestamp || a.submittedAt || 0).getTime();
                          const timeB = new Date(b.timestamp || b.submittedAt || 0).getTime();
                          return timeB - timeA;
                        });

                        return (
                          <div className="space-y-3 overflow-y-auto max-h-[360px] pr-1">
                            {sortedItems.map((scr) => {
                              const riskLevel = scr.riskResults?.riskFactor || scr.riskFactor || 'low';
                              const riskScore = scr.riskResults?.riskScore ?? scr.riskScore ?? 0;
                              const timestamp = scr.timestamp || scr.submittedAt || new Date().toISOString();
                              const notes = scr.riskResults?.predictions?.notes || scr.predictions?.notes || '';
                              const pName = scr.patientDetails?.name || scr.name || 'Anonymous';
                              const pAge = scr.patientDetails?.age || scr.age || 'N/A';

                              return (
                                <div key={scr.id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition hover:shadow-md hover:border-slate-300 text-start">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-black text-slate-800 tracking-tight">{pName} ({pAge} Yrs)</span>
                                      <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded ${
                                        riskLevel === 'high' 
                                          ? 'bg-rose-100 text-rose-700' 
                                          : riskLevel === 'medium'
                                          ? 'bg-amber-100 text-amber-800'
                                          : 'bg-emerald-100 text-emerald-700'
                                      }`}>
                                        {riskLevel.toUpperCase()} RISK (SCORE: {riskScore})
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                                      <span>Screening ID: {scr.id}</span>
                                      <span>•</span>
                                      <span>{new Date(timestamp).toLocaleString()}</span>
                                    </div>
                                    <p className="text-slate-500 text-xs italic line-clamp-1">
                                      "{notes}"
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                                    <button
                                      onClick={() => setSelectedHistoryEntry(scr)}
                                      className="flex-1 sm:grow-0 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold py-2 px-3.5 rounded-lg text-xs transition cursor-pointer"
                                    >
                                      View Details
                                    </button>
                                    <button
                                      onClick={() => downloadPdfReport(scr)}
                                      className="flex-1 sm:grow-0 bg-sky-50 hover:bg-sky-100 text-sky-600 font-extrabold py-2 px-3.5 rounded-lg text-xs transition flex items-center justify-center gap-1 border border-sky-100 cursor-pointer"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                      <span>PDF</span>
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>

                    {/* REPORT NOT FOUND ERROR POPUP MODAL */}
                    {reportNotFoundError && (
                      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden p-6 text-center space-y-4">
                          <div className="mx-auto w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
                            <X className="w-6 h-6" />
                          </div>
                          <div className="space-y-1.5">
                            <h3 className="text-base font-bold text-slate-800 text-red-600">Report Not Found</h3>
                            <p className="text-xs text-slate-505 text-slate-500 leading-relaxed">
                              {reportNotFoundError}
                            </p>
                          </div>
                          <button
                            onClick={() => setReportNotFoundError(null)}
                            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    )}

                    {/* HISTORY ENTRY DETAILS POPUP MODAL */}
                    {selectedHistoryEntry && (
                      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
                          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white text-start">
                            <div className="space-y-1">
                              <h3 className="text-lg font-black text-slate-800 tracking-tight">Clinical Report Analytics</h3>
                              <p className="text-xs text-slate-400 font-mono">Screening ID: {selectedHistoryEntry.id}</p>
                            </div>
                            <button
                              onClick={() => setSelectedHistoryEntry(null)}
                              className="text-slate-400 hover:text-slate-650 p-1.5 hover:bg-slate-50 rounded-full transition cursor-pointer"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>

                          <div className="p-6 overflow-y-auto space-y-6 text-start">
                            {/* Summary alert banner */}
                            {(() => {
                              const riskLevel = selectedHistoryEntry.riskResults?.riskFactor || selectedHistoryEntry.riskFactor || 'low';
                              const riskScore = selectedHistoryEntry.riskResults?.riskScore ?? selectedHistoryEntry.riskScore ?? 0;
                              return (
                                <div className={`p-5 rounded-xl text-white ${
                                  riskLevel === 'high' 
                                    ? 'bg-rose-500 shadow-lg shadow-rose-500/10' 
                                    : riskLevel === 'medium'
                                    ? 'bg-amber-500 shadow-lg shadow-amber-500/10'
                                    : 'bg-emerald-500 shadow-lg shadow-emerald-500/10'
                                }`}>
                                  <span className="text-[10px] uppercase font-black tracking-widest text-white/80">Diagnostic Results Level</span>
                                  <h4 className="text-xl font-black uppercase text-white">{riskLevel} Overall Screening Risk</h4>
                                  <p className="text-xs font-mono mt-1 opacity-90 font-bold">Cumulative Risk Score Index: {riskScore} / 100</p>
                                </div>
                              );
                            })()}

                            {/* Survey Completion Status & Designated ASHA worker info */}
                            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 space-y-2.5 text-start">
                              <div className="flex items-center gap-2">
                                <div className="bg-emerald-500 text-white rounded-full p-0.5 shadow-sm">
                                  <Check className="w-3.5 h-3.5" />
                                </div>
                                <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wide">
                                  Patient Health Survey Completed Successfully
                                </h4>
                              </div>
                              <p className="text-xs text-slate-600 leading-relaxed">
                                This survey screening report is finalized and completed. The record has been safely assigned to the designated ASHA worker for continuous regional medical tracking.
                              </p>
                              <div className="pt-2 border-t border-emerald-150 flex flex-col sm:flex-row gap-x-5 gap-y-1 text-xs">
                                <div>
                                  <span className="font-bold text-slate-500">Designated ASHA Worker:</span>{' '}
                                  <span className="font-extrabold text-slate-805 text-slate-800">
                                    {selectedHistoryEntry.ashaWorker?.name || 'Alia Rai'}
                                  </span>
                                </div>
                                <div>
                                  <span className="font-bold text-slate-500">ASHA Contact Number:</span>{' '}
                                  <span className="font-mono font-extrabold text-sky-700">
                                    {selectedHistoryEntry.ashaWorker?.phone || '+91 1234567890'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-2">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Patient Demographics</span>
                                <div className="space-y-1">
                                  <p className="text-sm font-bold text-slate-800">{selectedHistoryEntry.patientDetails?.name || selectedHistoryEntry.name || 'Not Specified'}</p>
                                  <p className="text-xs text-slate-500">
                                    <span className="font-bold">Age:</span> {selectedHistoryEntry.patientDetails?.age || selectedHistoryEntry.age || '40'} Yrs
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    <span className="font-bold">Gender:</span> {selectedHistoryEntry.patientDetails?.gender || selectedHistoryEntry.gender || 'Other'}
                                  </p>
                                  <p className="text-xs text-slate-500 leading-relaxed">
                                    <span className="font-bold">Address:</span> {selectedHistoryEntry.patientDetails?.address || selectedHistoryEntry.address || 'Ullal Health Ward'}
                                  </p>
                                </div>
                              </div>

                              <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-2">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Screening Metadata & Staff</span>
                                <div className="space-y-1 text-xs text-slate-650">
                                  <p className="text-xs text-slate-500">
                                    <span className="font-bold">Date & Time:</span> {selectedHistoryEntry.timestamp ? new Date(selectedHistoryEntry.timestamp).toLocaleString() : new Date().toLocaleString()}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    <span className="font-bold">Assigned ASHA Worker:</span> {selectedHistoryEntry.ashaWorker?.name || 'Alia Rai'} (ID: {selectedHistoryEntry.ashaWorker?.id || '1001'})
                                  </p>
                                  {selectedHistoryEntry.ashaWorker?.phone && (
                                    <p className="text-xs text-slate-500">
                                      <span className="font-bold">ASHA Worker Phone:</span> <span className="font-mono text-sky-700 font-bold">{selectedHistoryEntry.ashaWorker.phone}</span>
                                    </p>
                                  )}
                                  <span className="text-[10px] inline-block font-black text-rose-800 bg-rose-50 border border-rose-100 rounded px-2 py-0.5 mt-1 font-mono">
                                    QR Record Ref ID: {selectedHistoryEntry.id}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-150">
                              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-3">Clinical Metrics Split & Risk Indexes</span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-3 bg-white rounded-lg border border-slate-100 flex flex-col justify-between">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Diabetes Risk Percentage</span>
                                  {(() => {
                                    const dRisk = selectedHistoryEntry.riskResults?.predictions?.diabetesRisk || selectedHistoryEntry.predictions?.diabetesRisk || 'low';
                                    const percentageVal = dRisk === 'high' ? '80%' : dRisk === 'medium' ? '45%' : '10%';
                                    return (
                                      <div className="mt-1 flex items-baseline gap-2">
                                        <span className="text-lg font-black text-slate-800">{percentageVal}</span>
                                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded uppercase ${
                                          dRisk === 'high' ? 'bg-rose-100 text-rose-700' : dRisk === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                                        }`}>{dRisk}</span>
                                      </div>
                                    );
                                  })()}
                                </div>

                                <div className="p-3 bg-white rounded-lg border border-slate-100 flex flex-col justify-between">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Hypertension Risk Percentage</span>
                                  {(() => {
                                    const hRisk = selectedHistoryEntry.riskResults?.predictions?.hypertensionRisk || selectedHistoryEntry.predictions?.hypertensionRisk || 'low';
                                    const percentageVal = hRisk === 'high' ? '85%' : hRisk === 'medium' ? '50%' : '15%';
                                    return (
                                      <div className="mt-1 flex items-baseline gap-2">
                                        <span className="text-lg font-black text-slate-800">{percentageVal}</span>
                                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded uppercase ${
                                          hRisk === 'high' ? 'bg-rose-100 text-rose-700' : hRisk === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                                        }`}>{hRisk}</span>
                                      </div>
                                    );
                                  })()}
                                </div>
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Diagnostic Advisory & Referral Advice</span>
                              <div className="bg-sky-50 border border-sky-100 text-sky-950 p-4 rounded-xl text-xs font-semibold leading-relaxed">
                                {selectedHistoryEntry.riskResults?.predictions?.notes || selectedHistoryEntry.predictions?.notes || 'No notes compiled.'}
                              </div>
                            </div>

                            {/* Answers List */}
                            <div className="space-y-2">
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Verified Verbal Response Sheets</span>
                              <div className="border border-slate-150 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                                {Object.entries(selectedHistoryEntry.answers || {}).map(([key, val]: any, idx) => {
                                  let cleanKeyLabel = key;
                                  if (key.startsWith('diab_')) cleanKeyLabel = `Diabetes Checklist [Q${key.replace('diab_', '')}]`;
                                  if (key.startsWith('bp_')) cleanKeyLabel = `Hypertension Checklist [Q${key.replace('bp_', '')}]`;
                                  if (key.startsWith('gen_')) cleanKeyLabel = `General Checklist [Q${key.replace('gen_', '')}]`;

                                  return (
                                    <div key={key} className="p-3 bg-white flex justify-between gap-4 items-center">
                                      <span className="font-bold text-slate-600">{idx+1}. {cleanKeyLabel}:</span>
                                      <span className={`font-mono font-bold uppercase text-[10px] px-2 py-0.5 rounded leading-none ${
                                        val === 'yes' || val.toLowerCase().includes('yes') || val.toLowerCase().includes('ಹೌದು')
                                          ? 'bg-rose-50 text-rose-600 border border-rose-100'
                                          : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                      }`}>
                                        {val}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3 justify-end">
                            <button
                              onClick={() => setSelectedHistoryEntry(null)}
                              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                            >
                              Close Panel
                            </button>
                            <button
                              onClick={() => {
                                downloadPdfReport(selectedHistoryEntry);
                              }}
                              className="px-4 py-2 bg-sky-605 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1 shadow-md cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download PDF</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                ) : screeningStep === 'name' ? (
                  
                  /* STEP 2: Ask Name vocal process */
                  <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 py-6">
                    <div className="flex items-center justify-between w-full border-b border-slate-100 pb-4 mb-4">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">PATIENT BIO LOG</span>
                      <span className="text-xs text-sky-600 font-bold bg-sky-50 px-3 py-1 rounded">1 of 3</span>
                    </div>

                    <div className="relative">
                      <div className={`w-20 h-20 rounded-full flex items-center justify-center transition ${isSpeaking ? 'bg-sky-500/10' : 'bg-slate-100'}`}>
                        <Mic className={`w-8 h-8 ${isListening ? 'text-rose-500 animate-pulse' : 'text-slate-500'}`} />
                      </div>
                      <AudioWaveform isPlaying={isListening || isSpeaking} type={isSpeaking ? 'synth' : 'mic'} />
                    </div>

                    <div className="space-y-3 max-w-md">
                      <h2 className="text-2xl font-black text-slate-800 leading-tight">
                        "{SYSTEM_GREETINGS[selectedLang].askName}"
                      </h2>
                    </div>

                    {/* Pending speech result visual confirmation block */}
                    {pendingConfirmation ? (
                      <div className="w-full max-w-md bg-sky-50/50 border border-sky-200 rounded-2xl p-6 space-y-4">
                        <div>
                          <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">Recognized Name Text</p>
                          <p className="text-xl font-black text-sky-900 uppercase">"{patientName}"</p>
                        </div>
                        <p className="text-xs text-slate-500 italic">
                          {SYSTEM_GREETINGS[selectedLang].confirmResponse}
                        </p>
                        <div className="flex items-center justify-center gap-4">
                          <button
                            onClick={rejectCurrentValue}
                            className="flex-1 py-3 px-4 bg-white border border-slate-200 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition"
                          >
                            <X className="w-4 h-4 inline mr-1" />
                            {selectedLang === Language.KANNADA ? 'ಇಲ್ಲ, ಮತ್ತೊಮ್ಮೆ ಹೇಳಿ' : 'No, Repeat'}
                          </button>
                          <button
                            onClick={confirmCurrentValue}
                            className="flex-1 py-3 px-4 bg-sky-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-sky-500 transition"
                          >
                            <Check className="w-4 h-4 inline mr-1" />
                            {selectedLang === Language.KANNADA ? 'ಹೌದು, ಸರಿ' : 'Yes, Correct'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full max-w-md space-y-4">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={startListening}
                            className={`py-3 px-6 rounded-xl font-bold flex items-center justify-center gap-2 text-sm border shadow transition ${
                              isListening ? 'bg-rose-600 text-white border-rose-500' : 'bg-white hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <Mic className="w-4 h-4" />
                            {isListening ? (selectedLang === Language.KANNADA ? 'ಕೇಳಿಸಿಕೊಳ್ಳಲಾಗುತ್ತಿದೆ...' : 'Listening...') : (selectedLang === Language.KANNADA ? 'ಮಾತನಾಡಲು ಒತ್ತಿ' : 'Tap to Speak Answer')}
                          </button>
                        </div>

                        {/* Manual entry fallback typed inline safeguard */}
                        <div className="border-t border-slate-100 pt-4 flex items-center gap-2">
                          <input
                            type="text"
                            placeholder={selectedLang === Language.KANNADA ? 'ಇಲ್ಲಿ ಹೆಸರನ್ನು ಬರೆಯಿರಿ' : 'Or type patient name here...'}
                            className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-sky-500"
                            value={patientName}
                            onChange={(e) => setPatientName(e.target.value)}
                          />
                          <button
                            onClick={() => {
                              if (patientName.trim()) {
                                setPendingConfirmation({ stage: 'name', value: patientName });
                                speakText(patientName + ". " + SYSTEM_GREETINGS[selectedLang].voiceConfirmResponse, selectedLang);
                              }
                            }}
                            className="bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                ) : screeningStep === 'gender' ? (
                  
                  /* STEP 3A: Ask Gender vocal process */
                  <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 py-6" id="screening-step-gender">
                    <div className="flex items-center justify-between w-full border-b border-slate-100 pb-4 mb-4">
                      <div>
                        <span className="text-xs font-bold text-slate-400 uppercase">Patient:</span>
                        <span className="text-xs font-bold ml-1 text-slate-800 uppercase tracking-tight">{patientName}</span>
                      </div>
                      <span className="text-xs text-sky-600 font-bold bg-sky-50 px-3 py-1 rounded">2 of 8</span>
                    </div>

                    <div className="relative">
                      <div className={`w-20 h-20 rounded-full flex items-center justify-center transition ${isSpeaking ? 'bg-sky-500/10' : 'bg-slate-100'}`}>
                        <Mic className={`w-8 h-8 ${isListening ? 'text-rose-500 animate-pulse' : 'text-slate-500'}`} />
                      </div>
                      <AudioWaveform isPlaying={isListening || isSpeaking} type={isSpeaking ? 'synth' : 'mic'} />
                    </div>

                    <div className="space-y-3 max-w-md">
                      <h2 className="text-2xl font-black text-slate-800 leading-tight">
                        {selectedLang === Language.KANNADA ? '"ನಿಮ್ಮ ಲಿಂಗವನ್ನು ಆಯ್ಕೆ ಮಾಡಿ"' : '"Please select or speak your gender"'}
                      </h2>
                    </div>

                    <div className="w-full max-w-md space-y-6">
                      <div className="grid grid-cols-3 gap-3">
                        {(['Male', 'Female', 'Other'] as const).map((genderType) => (
                          <button
                            key={genderType}
                            onClick={() => {
                              setPatientGender(genderType);
                              
                              const confirmMsg = selectedLang === Language.KANNADA 
                                ? `ನೀವು ${genderType === 'Male' ? 'ಪುರುಷ' : genderType === 'Female' ? 'ಮಹಿಳೆ' : 'ಇತರ'} ಎಂದು ಆಯ್ಕೆ ಮಾಡಿದ್ದೀರಿ.` 
                                : `You selected ${genderType}.`;
                              speakText(confirmMsg, selectedLang);

                              setTimeout(() => {
                                setScreeningStep('address');
                                const addressPrompt = selectedLang === Language.KANNADA
                                  ? "ದಯವಿಟ್ಟು ನಿಮ್ಮ ನಿವಾಸ ವಿಳಾಸ ಅಥವಾ ಗ್ರಾಮವನ್ನು ಹೇಳಿ ಅಥವಾ ಬರೆಯಿರಿ."
                                  : "Please speak or enter your current address or village village area.";
                                speakText(addressPrompt, selectedLang);
                              }, 1600);
                            }}
                            className={`p-4 rounded-xl border-2 font-bold text-sm transition ${
                              patientGender === genderType 
                                ? 'bg-sky-50 border-sky-500 text-sky-700' 
                                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                            }`}
                            id={`gender-select-${genderType}`}
                          >
                            {genderType === 'Male' ? (selectedLang === 'kn' ? 'ಪುರುಷ' : 'Male') : (genderType === 'Female' ? (selectedLang === 'kn' ? 'ಮಹಿಳೆ' : 'Female') : (selectedLang === 'kn' ? 'ಇತರ' : 'Other'))}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center justify-center">
                        <button
                          onClick={startListening}
                          className={`py-3 px-6 rounded-xl font-bold flex items-center justify-center gap-2 text-sm border shadow transition ${
                            isListening ? 'bg-rose-600 text-white border-rose-500' : 'bg-white hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <Mic className="w-4 h-4" />
                          {isListening ? (selectedLang === Language.KANNADA ? 'ಕೇಳಿಸಿಕೊಳ್ಳಲಾಗುತ್ತಿದೆ...' : 'Listening...') : (selectedLang === Language.KANNADA ? 'ಲಿಂಗವನ್ನು ಹೇಳಲು ಒತ್ತಿ' : 'Tap to Speak Gender')}
                        </button>
                      </div>
                    </div>
                  </div>

                ) : screeningStep === 'address' ? (
                  
                  /* STEP 3B: Ask Address and Map ASHA Worker */
                  <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 py-6" id="screening-step-address">
                    <div className="flex items-center justify-between w-full border-b border-slate-100 pb-4 mb-4">
                      <div>
                        <span className="text-xs font-bold text-slate-400 uppercase">Patient:</span>
                        <span className="text-xs font-bold ml-1 text-slate-800 uppercase tracking-tight">{patientName}</span>
                      </div>
                      <span className="text-xs text-sky-600 font-bold bg-sky-50 px-3 py-1 rounded">3 of 8</span>
                    </div>

                    <div className="relative">
                      <div className={`w-20 h-20 rounded-full flex items-center justify-center transition ${isSpeaking ? 'bg-sky-500/10' : 'bg-slate-100'}`}>
                        <Mic className={`w-8 h-8 ${isListening ? 'text-rose-500 animate-pulse' : 'text-slate-500'}`} />
                      </div>
                      <AudioWaveform isPlaying={isListening || isSpeaking} type={isSpeaking ? 'synth' : 'mic'} />
                    </div>

                    <div className="space-y-3 max-w-sm">
                      <h2 className="text-2xl font-black text-slate-800 leading-tight">
                        {selectedLang === Language.KANNADA ? '"ನಿಮ್ಮ ಗ್ರಾಮ ಅಥವಾ ನಿವಾಸ ವಿಳಾಸ ತಿಳಿಸಿ"' : '"Please tell us your address or village village area"'}
                      </h2>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Tip: Say/type <strong className="text-sky-600">Derlakatte</strong> or <strong className="text-sky-600">Ullal</strong> to test automatic assignation modeling.
                      </p>
                    </div>

                    {pendingConfirmation ? (
                      <div className="w-full max-w-md bg-sky-50/50 border border-sky-200 rounded-2xl p-6 space-y-4">
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Captured Location</p>
                          <p className="text-xl font-black text-sky-950">"{patientAddress}"</p>
                        </div>
                        
                        {/* Instant visual matching indicator */}
                        {(() => {
                          const tempAsha = getAssignedAshaByAddress(patientAddress);
                          return (
                            <div className="bg-white rounded-xl p-4 border border-sky-100 text-left space-y-2 animate-fadeIn shadow-sm">
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                <Award className="w-4 h-4 text-sky-600" />
                                AUTOMATICALLY ASSIGNED ASHA WORKER
                              </p>
                              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                                <div>
                                  <span className="text-slate-400">Health worker:</span>
                                  <p className="font-bold text-slate-700 uppercase">{tempAsha.name}</p>
                                </div>
                                <div>
                                  <span className="text-slate-400">Empl ID:</span>
                                  <p className="font-bold text-slate-700">{tempAsha.id}</p>
                                </div>
                                <div>
                                  <span className="text-slate-400">Helpline:</span>
                                  <p className="font-bold text-emerald-600">{tempAsha.phone}</p>
                                </div>
                                <div>
                                  <span className="text-slate-400">Target Area:</span>
                                  <p className="font-bold text-slate-700">{tempAsha.assignedArea}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        <p className="text-xs text-slate-500 italic">
                          {SYSTEM_GREETINGS[selectedLang].confirmResponse}
                        </p>
                        <div className="flex items-center justify-center gap-4">
                          <button
                            onClick={rejectCurrentValue}
                            className="flex-1 py-3 px-4 bg-white border border-slate-200 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition"
                          >
                            <X className="w-4 h-4 inline mr-1" id="address-reject" />
                            {selectedLang === Language.KANNADA ? 'ಇಲ್ಲ, ಮತ್ತೊಮ್ಮೆ ಹೇಳಿ' : 'No, Repeat'}
                          </button>
                          <button
                            onClick={confirmCurrentValue}
                            className="flex-1 py-3 px-4 bg-sky-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-sky-500 transition"
                          >
                            <Check className="w-4 h-4 inline mr-1" id="address-confirm" />
                            {selectedLang === Language.KANNADA ? 'ಹೌದು, ಸರಿ' : 'Yes, Correct'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full max-w-md space-y-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={startListening}
                            className={`py-3 px-6 rounded-xl font-bold flex items-center justify-center gap-2 text-sm border shadow transition ${
                              isListening ? 'bg-rose-600 text-white border-rose-500' : 'bg-white hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <Mic className="w-4 h-4" />
                            {isListening ? (selectedLang === Language.KANNADA ? 'ವಿಳಾಸ ಆಲಿಸಲಾಗುತ್ತಿದೆ...' : 'Listening...') : (selectedLang === Language.KANNADA ? 'ವಿಳಾಸ ಹೇಳಲು ಒತ್ತಿ' : 'Tap to Speak Address')}
                          </button>
                        </div>

                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex flex-col gap-3">
                          <div className="flex gap-1.5 justify-center">
                            {['Ullal', 'Derlakatte'].map((loc) => (
                              <button
                                key={loc}
                                onClick={() => {
                                  setPatientAddress(loc);
                                  setPendingConfirmation({ stage: 'address', value: loc });
                                  speakText(loc + ". " + SYSTEM_GREETINGS[selectedLang].voiceConfirmResponse, selectedLang);
                                }}
                                className="bg-white border border-slate-200 text-slate-600 hover:border-sky-500 hover:text-sky-600 text-xs px-3 py-1.5 rounded-lg font-bold shadow-sm transition"
                                id={`address-preset-${loc}`}
                              >
                                {loc} Area Preset
                              </button>
                            ))}
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder={selectedLang === Language.KANNADA ? 'ಇಲ್ಲಿ ಗ್ರಾಮ ಅಥವಾ ವಿಳಾಸ ನಮೂದಿಸಿ...' : 'Type physical village details...'}
                              className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-sky-500 bg-white"
                              value={patientAddress}
                              onChange={(e) => setPatientAddress(e.target.value)}
                            />
                            <button
                              onClick={() => {
                                if (patientAddress.trim()) {
                                  setPendingConfirmation({ stage: 'address', value: patientAddress });
                                  speakText(patientAddress + ". " + SYSTEM_GREETINGS[selectedLang].voiceConfirmResponse, selectedLang);
                                }
                              }}
                              className="bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                ) : screeningStep === 'familySelf' ? (
                  
                  /* STEP 3C: Personal History */
                  <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 py-6" id="screening-step-familySelf">
                    <div className="flex items-center justify-between w-full border-b border-slate-100 pb-4 mb-4">
                      <div>
                        <span className="text-xs font-bold text-slate-400 uppercase">Patient:</span>
                        <span className="text-xs font-bold ml-1 text-slate-800 uppercase tracking-tight">{patientName}</span>
                      </div>
                      <span className="text-xs text-sky-600 font-bold bg-sky-50 px-3 py-1 rounded">4 of 8</span>
                    </div>

                    <div className="relative">
                      <div className={`w-20 h-20 rounded-full flex items-center justify-center transition ${isSpeaking ? 'bg-sky-500/10' : 'bg-slate-100'}`}>
                        <Mic className={`w-8 h-8 ${isListening ? 'text-rose-500 animate-pulse' : 'text-slate-500'}`} />
                      </div>
                      <AudioWaveform isPlaying={isListening || isSpeaking} type={isSpeaking ? 'synth' : 'mic'} />
                    </div>

                    <div className="space-y-3 max-w-md">
                      <h2 className="text-2xl font-black text-slate-800 leading-tight">
                        {selectedLang === Language.KANNADA ? '"ನಿಮಗೆ ವೈಯಕ್ತಿಕವಾಗಿ ಈ ಹಿಂದೆ ಮಧುಮೇಹ ಅಥವಾ ಬಿಪಿ ಕಾಯಿಲೆ ಏನಾದರೂ ಇತ್ತೇ?"' : '"Do you have a personal history of Diabetes or Hypertension?"'}
                      </h2>
                    </div>

                    {pendingConfirmation ? (
                      <div className="w-full max-w-md bg-sky-50/50 border border-sky-200 rounded-2xl p-6 space-y-4">
                        <div>
                          <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">Your Personal History</p>
                          <p className="text-lg font-black text-sky-950">"{familySelf}"</p>
                        </div>
                        <p className="text-xs text-slate-500 italic">
                          {SYSTEM_GREETINGS[selectedLang].confirmResponse}
                        </p>
                        <div className="flex items-center justify-center gap-4">
                          <button
                            onClick={rejectCurrentValue}
                            className="flex-1 py-3 px-4 bg-white border border-slate-200 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition"
                          >
                            <X className="w-4 h-4 inline mr-1" id="familySelf-reject" />
                            {selectedLang === Language.KANNADA ? 'ಇಲ್ಲ, ಮತ್ತೊಮ್ಮೆ ಹೇಳಿ' : 'No, Repeat'}
                          </button>
                          <button
                            onClick={confirmCurrentValue}
                            className="flex-1 py-3 px-4 bg-sky-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-sky-500 transition"
                          >
                            <Check className="w-4 h-4 inline mr-1" id="familySelf-confirm" />
                            {selectedLang === Language.KANNADA ? 'ಹೌದು, ಸರಿ' : 'Yes, Correct'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full max-w-md space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <button
                            onClick={() => {
                              setFamilySelf('Yes');
                              setPendingConfirmation({ stage: 'familySelf', value: 'Yes' });
                              speakText((selectedLang === 'kn' ? 'ಹೌದು' : 'Yes') + ". " + SYSTEM_GREETINGS[selectedLang].voiceConfirmResponse, selectedLang);
                            }}
                            className="p-5 bg-white border-2 border-slate-200 hover:border-sky-500 rounded-2xl font-bold text-slate-700 text-center transition hover:bg-sky-50/20"
                            id="familySelf-select-yes"
                          >
                            {selectedLang === Language.KANNADA ? 'ಹೌದು (Yes)' : 'Yes'}
                          </button>
                          <button
                            onClick={() => {
                              setFamilySelf('No');
                              setPendingConfirmation({ stage: 'familySelf', value: 'No' });
                              speakText((selectedLang === 'kn' ? 'ಇಲ್ಲ' : 'No') + ". " + SYSTEM_GREETINGS[selectedLang].voiceConfirmResponse, selectedLang);
                            }}
                            className="p-5 bg-white border-2 border-slate-200 hover:border-sky-500 rounded-xl font-bold text-slate-700 text-center transition hover:bg-sky-50/20"
                            id="familySelf-select-no"
                          >
                            {selectedLang === Language.KANNADA ? 'ಇಲ್ಲ (No)' : 'No'}
                          </button>
                        </div>

                        <div className="flex items-center justify-center">
                          <button
                            onClick={startListening}
                            className={`py-3 px-6 rounded-xl font-bold flex items-center justify-center gap-2 text-sm border shadow transition ${
                              isListening ? 'bg-rose-600 text-white border-rose-500' : 'bg-white hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <Mic className="w-4 h-4" />
                            {isListening ? (selectedLang === Language.KANNADA ? 'ಆಲಿಸಲಾಗುತ್ತಿದೆ...' : 'Listening...') : (selectedLang === Language.KANNADA ? 'ಹೇಳಲು ಒತ್ತಿ' : 'Tap to Speak')}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                ) : screeningStep === 'familyFather' ? (
                  
                  /* STEP 3D: Father History */
                  <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 py-6" id="screening-step-familyFather">
                    <div className="flex items-center justify-between w-full border-b border-slate-100 pb-4 mb-4">
                      <div>
                        <span className="text-xs font-bold text-slate-400 uppercase">Patient:</span>
                        <span className="text-xs font-bold ml-1 text-slate-800 uppercase tracking-tight">{patientName}</span>
                      </div>
                      <span className="text-xs text-sky-600 font-bold bg-sky-50 px-3 py-1 rounded">5 of 8</span>
                    </div>

                    <div className="relative">
                      <div className={`w-20 h-20 rounded-full flex items-center justify-center transition ${isSpeaking ? 'bg-sky-500/10' : 'bg-slate-100'}`}>
                        <Mic className={`w-8 h-8 ${isListening ? 'text-rose-500 animate-pulse' : 'text-slate-500'}`} />
                      </div>
                      <AudioWaveform isPlaying={isListening || isSpeaking} type={isSpeaking ? 'synth' : 'mic'} />
                    </div>

                    <div className="space-y-3 max-w-md">
                      <h2 className="text-2xl font-black text-slate-800 leading-tight animate-fadeIn">
                        {selectedLang === Language.KANNADA ? '"ನಿಮ್ಮ ತಂದೆಯವರ ಆರೋಗ್ಯದ ಬಗ್ಗೆ ಹೇಳಿ. ಅವರಿಗೆ ರಕ್ತದೊತ್ತಡ ಅಥವಾ ಸಕ್ಕರೆ ಕಾಯಿಲೆ ಇತ್ತೇ?"' : '"How is your father\'s health history? Did he have Diabetes or Hypertension?"'}
                      </h2>
                    </div>

                    {pendingConfirmation ? (
                      <div className="w-full max-w-md bg-sky-50/50 border border-sky-200 rounded-2xl p-6 space-y-4">
                        <div>
                          <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">Father's Background</p>
                          <p className="text-lg font-black text-sky-950">"{familyFather}"</p>
                        </div>
                        <p className="text-xs text-slate-500 italic">
                          {SYSTEM_GREETINGS[selectedLang].confirmResponse}
                        </p>
                        <div className="flex items-center justify-center gap-4">
                          <button
                            onClick={rejectCurrentValue}
                            className="flex-1 py-3 px-4 bg-white border border-slate-200 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition"
                          >
                            <X className="w-4 h-4 inline mr-1" id="familyFather-reject" />
                            {selectedLang === Language.KANNADA ? 'ಇಲ್ಲ, ಮತ್ತೊಮ್ಮೆ ಹೇಳಿ' : 'No, Repeat'}
                          </button>
                          <button
                            onClick={confirmCurrentValue}
                            className="flex-1 py-3 px-4 bg-sky-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-sky-500 transition"
                          >
                            <Check className="w-4 h-4 inline mr-1" id="familyFather-confirm" />
                            {selectedLang === Language.KANNADA ? 'ಹೌದು, ಸರಿ' : 'Yes, Correct'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full max-w-md space-y-4">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <button
                            onClick={() => {
                              setFamilyFather('Healthy with no history');
                              setPendingConfirmation({ stage: 'familyFather', value: 'Healthy with no history' });
                              speakText((selectedLang === 'kn' ? 'ಆರೋಗ್ಯಶಾಲಿಯಾಗಿದ್ದರು' : 'No history') + ". " + SYSTEM_GREETINGS[selectedLang].voiceConfirmResponse, selectedLang);
                            }}
                            className="p-4 bg-white border-2 border-slate-200 hover:border-sky-500 rounded-xl font-bold text-slate-700 transition"
                            id="familyFather-select-healthy"
                          >
                            {selectedLang === Language.KANNADA ? 'ಯಾವುದೇ ತೊಂದರೆ ಇರಲಿಲ್ಲ (No issues)' : 'No issues / Healthy'}
                          </button>
                          <button
                            onClick={() => {
                              setFamilyFather('Diagnosed with Diabetes/BP');
                              setPendingConfirmation({ stage: 'familyFather', value: 'Diagnosed with Diabetes/BP' });
                              speakText((selectedLang === 'kn' ? 'ಹೌದು, ಇತಿಹಾಸ ಇತ್ತು' : 'Yes, had Diabetes') + ". " + SYSTEM_GREETINGS[selectedLang].voiceConfirmResponse, selectedLang);
                            }}
                            className="p-4 bg-white border-2 border-slate-200 hover:border-sky-500 rounded-xl font-bold text-slate-700 transition"
                            id="familyFather-select-diseased"
                          >
                            {selectedLang === Language.KANNADA ? 'ಕಾಯಿಲೆ ಇತಿಹಾಸ ಇತ್ತು' : 'Had Diabetes/BP'}
                          </button>
                        </div>

                        <div className="flex items-center justify-center">
                          <button
                            onClick={startListening}
                            className={`py-3 px-6 rounded-xl font-bold flex items-center justify-center gap-2 text-sm border shadow transition ${
                              isListening ? 'bg-rose-600 text-white border-rose-500' : 'bg-white hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <Mic className="w-4 h-4" />
                            {isListening ? (selectedLang === Language.KANNADA ? 'ಆಲಿಸಲಾಗುತ್ತಿದೆ...' : 'Listening...') : (selectedLang === Language.KANNADA ? 'ಹೇಳಲು ಒತ್ತಿ' : 'Tap to Speak')}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                ) : screeningStep === 'familyMother' ? (
                  
                  /* STEP 3E: Mother History */
                  <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 py-6" id="screening-step-familyMother">
                    <div className="flex items-center justify-between w-full border-b border-slate-100 pb-4 mb-4">
                      <div>
                        <span className="text-xs font-bold text-slate-400 uppercase">Patient:</span>
                        <span className="text-xs font-bold ml-1 text-slate-800 uppercase tracking-tight">{patientName}</span>
                      </div>
                      <span className="text-xs text-sky-600 font-bold bg-sky-50 px-3 py-1 rounded">6 of 8</span>
                    </div>

                    <div className="relative">
                      <div className={`w-20 h-20 rounded-full flex items-center justify-center transition ${isSpeaking ? 'bg-sky-500/10' : 'bg-slate-100'}`}>
                        <Mic className={`w-8 h-8 ${isListening ? 'text-rose-500 animate-pulse' : 'text-slate-500'}`} />
                      </div>
                      <AudioWaveform isPlaying={isListening || isSpeaking} type={isSpeaking ? 'synth' : 'mic'} />
                    </div>

                    <div className="space-y-3 max-w-md">
                      <h2 className="text-2xl font-black text-slate-800 leading-tight">
                        {selectedLang === Language.KANNADA ? '"ನಿಮ್ಮ ತಾಯಿಯವರ ಆರೋಗ್ಯ ವೈದ್ಯಕೀಯ ಇತಿಹಾಸ ಹೇಗಿತ್ತು? ಅವರಿಗೆ ಮಧುಮೇಹ ಅಥವಾ ಬಿಪಿ ಕಾಯಿಲೆ ಏನಾದರೂ ಇತ್ತೇ?"' : '"How about your mother\'s health history? Did she have Diabetes or Hypertension?"'}
                      </h2>
                    </div>

                    {pendingConfirmation ? (
                      <div className="w-full max-w-md bg-sky-50/50 border border-sky-200 rounded-2xl p-6 space-y-4">
                        <div>
                          <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">Mother's History</p>
                          <p className="text-lg font-black text-sky-900">"{familyMother}"</p>
                        </div>
                        <p className="text-xs text-slate-500 italic">
                          {SYSTEM_GREETINGS[selectedLang].confirmResponse}
                        </p>
                        <div className="flex items-center justify-center gap-4">
                          <button
                            onClick={rejectCurrentValue}
                            className="flex-1 py-3 px-4 bg-white border border-slate-200 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition"
                          >
                            <X className="w-4 h-4 inline mr-1" id="familyMother-reject" />
                            {selectedLang === Language.KANNADA ? 'ಇಲ್ಲ, ಮತ್ತೊಮ್ಮೆ ಹೇಳಿ' : 'No, Repeat'}
                          </button>
                          <button
                            onClick={confirmCurrentValue}
                            className="flex-1 py-3 px-4 bg-sky-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-sky-500 transition"
                          >
                            <Check className="w-4 h-4 inline mr-1" id="familyMother-confirm" />
                            {selectedLang === Language.KANNADA ? 'ಹೌದು, ಸರಿ' : 'Yes, Correct'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full max-w-md space-y-4">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <button
                            onClick={() => {
                              setFamilyMother('Healthy with no history of disease');
                              setPendingConfirmation({ stage: 'familyMother', value: 'Healthy with no history of disease' });
                              speakText((selectedLang === 'kn' ? 'ತಾಯಿಯವರಿಗೆ ಯಾವುದೇ ಕಾಯಿಲೆ ಇರಲಿಲ್ಲ' : 'No history') + ". " + SYSTEM_GREETINGS[selectedLang].voiceConfirmResponse, selectedLang);
                            }}
                            className="p-4 bg-white border-2 border-slate-200 hover:border-sky-500 rounded-xl font-bold text-slate-700 transition"
                            id="familyMother-select-healthy"
                          >
                            {selectedLang === Language.KANNADA ? 'ಯಾವುದೇ ತೊಂದರೆ ಇರಲಿಲ್ಲ' : 'No issues / Healthy'}
                          </button>
                          <button
                            onClick={() => {
                              setFamilyMother('Mother has Diabetes / High Blood Pressure');
                              setPendingConfirmation({ stage: 'familyMother', value: 'Mother has Diabetes / High Blood Pressure' });
                              speakText((selectedLang === 'kn' ? 'ಹೌದು, ತಾಯಿಯವರಿಗೆ ಕಾಯಿಲೆ ಇತ್ತು' : 'Yes, Mother has history') + ". " + SYSTEM_GREETINGS[selectedLang].voiceConfirmResponse, selectedLang);
                            }}
                            className="p-4 bg-white border-2 border-slate-200 hover:border-sky-500 rounded-xl font-bold text-slate-700 transition"
                            id="familyMother-select-diseased"
                          >
                            {selectedLang === Language.KANNADA ? 'ಕಾಯಿಲೆ ಇತಿಹಾಸ ಇತ್ತು' : 'Had Diabetes/BP'}
                          </button>
                        </div>

                        <div className="flex items-center justify-center">
                          <button
                            onClick={startListening}
                            className={`py-3 px-6 rounded-xl font-bold flex items-center justify-center gap-2 text-sm border shadow transition ${
                              isListening ? 'bg-rose-600 text-white border-rose-500' : 'bg-white hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <Mic className="w-4 h-4" />
                            {isListening ? (selectedLang === Language.KANNADA ? 'ಆಲಿಸಲಾಗುತ್ತಿದೆ...' : 'Listening...') : (selectedLang === Language.KANNADA ? 'ತಾಯಿಯವರ ಆರೋಗ್ಯ ಬಗ್ಗೆ ಹೇಳಲು ಒತ್ತಿ' : 'Tap to Speak')}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                ) : screeningStep === 'familySiblings' ? (
                  
                  /* STEP 3F: Sibling History */
                  <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 py-6" id="screening-step-familySiblings">
                    <div className="flex items-center justify-between w-full border-b border-slate-100 pb-4 mb-4">
                      <div>
                        <span className="text-xs font-bold text-slate-400 uppercase">Patient:</span>
                        <span className="text-xs font-bold ml-1 text-slate-800 uppercase tracking-tight">{patientName}</span>
                      </div>
                      <span className="text-xs text-sky-600 font-bold bg-sky-50 px-3 py-1 rounded">7 of 8</span>
                    </div>

                    <div className="relative">
                      <div className={`w-20 h-20 rounded-full flex items-center justify-center transition ${isSpeaking ? 'bg-sky-500/10' : 'bg-slate-100'}`}>
                        <Mic className={`w-8 h-8 ${isListening ? 'text-rose-500 animate-pulse' : 'text-slate-500'}`} />
                      </div>
                      <AudioWaveform isPlaying={isListening || isSpeaking} type={isSpeaking ? 'synth' : 'mic'} />
                    </div>

                    <div className="space-y-3 max-w-md">
                      <h2 className="text-2xl font-black text-slate-800 leading-tight">
                        {selectedLang === Language.KANNADA ? '"ನಿಮ್ಮ ಒಡಹುಟ್ಟಿದವರಿಗೆ (ಅಣ್ಣ-ತಮ್ಮ ಅಥವಾ ಅಕ್ಕ-ತಂಗಿಯರಿಗೆ) ಯಾರಿಗಾದರೂ ಸಕ್ಕರೆ ಕಾಯಿಲೆ ಅಥವಾ ರಕ್ತದೊತ್ತಡ ಇತ್ತೇ?"' : '"How is your siblings\' health history? Any diagnosed Diabetes or BP cases?"'}
                      </h2>
                    </div>

                    {pendingConfirmation ? (
                      <div className="w-full max-w-md bg-sky-50/50 border border-sky-200 rounded-2xl p-6 space-y-4">
                        <div>
                          <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">Siblings' Background</p>
                          <p className="text-lg font-black text-sky-950">"{familySiblings}"</p>
                        </div>
                        <p className="text-xs text-slate-500 italic">
                          {SYSTEM_GREETINGS[selectedLang].confirmResponse}
                        </p>
                        <div className="flex items-center justify-center gap-4">
                          <button
                            onClick={rejectCurrentValue}
                            className="flex-1 py-3 px-4 bg-white border border-slate-200 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition"
                          >
                            <X className="w-4 h-4 inline mr-1" id="familySiblings-reject" />
                            {selectedLang === Language.KANNADA ? 'ಇಲ್ಲ, ಮತ್ತೊಮ್ಮೆ ಹೇಳಿ' : 'No, Repeat'}
                          </button>
                          <button
                            onClick={confirmCurrentValue}
                            className="flex-1 py-3 px-4 bg-sky-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-sky-500 transition"
                          >
                            <Check className="w-4 h-4 inline mr-1" id="familySiblings-confirm" />
                            {selectedLang === Language.KANNADA ? 'ಹೌದು, ಸರಿ' : 'Yes, Correct'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full max-w-md space-y-4">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <button
                            onClick={() => {
                              setFamilySiblings('No siblings history');
                              setPendingConfirmation({ stage: 'familySiblings', value: 'No siblings history' });
                              speakText((selectedLang === 'kn' ? 'ಒಡಹುಟ್ಟಿದವರಿಗೆ ಕಾಯಿಲೆ ಏನೂ ಇರಲಿಲ್ಲ' : 'No history') + ". " + SYSTEM_GREETINGS[selectedLang].voiceConfirmResponse, selectedLang);
                            }}
                            className="p-4 bg-white border-2 border-slate-200 hover:border-sky-500 rounded-xl font-bold text-slate-700 transition"
                            id="familySiblings-select-healthy"
                          >
                            {selectedLang === Language.KANNADA ? 'ಯಾರೂ ಅನುಭವಿಸುತ್ತಿಲ್ಲ' : 'No issues / Healthy'}
                          </button>
                          <button
                            onClick={() => {
                              setFamilySiblings('Siblings have history of Diabetes/Hypertension');
                              setPendingConfirmation({ stage: 'familySiblings', value: 'Siblings have history of Diabetes/Hypertension' });
                              speakText((selectedLang === 'kn' ? 'ಹೌದು, ಒಡಹುಟ್ಟಿದವರಿಗೆ ಇತಿಹಾಸ ಇತ್ತು' : 'Yes, Sibling has history') + ". " + SYSTEM_GREETINGS[selectedLang].voiceConfirmResponse, selectedLang);
                            }}
                            className="p-4 bg-white border-2 border-slate-200 hover:border-sky-500 rounded-xl font-bold text-slate-700 transition"
                            id="familySiblings-select-diseased"
                          >
                            {selectedLang === Language.KANNADA ? 'ಕಾಯಿಲೆ ಇತಿಹಾಸ ಹೊಂದಿದ್ದಾರೆ' : 'Yes, Sibling History'}
                          </button>
                        </div>

                        <div className="flex items-center justify-center">
                          <button
                            onClick={startListening}
                            className={`py-3 px-6 rounded-xl font-bold flex items-center justify-center gap-2 text-sm border shadow transition ${
                              isListening ? 'bg-rose-600 text-white border-rose-500' : 'bg-white hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <Mic className="w-4 h-4" />
                            {isListening ? (selectedLang === Language.KANNADA ? 'ಆಲಿಸಲಾಗುತ್ತಿದೆ...' : 'Listening...') : (selectedLang === Language.KANNADA ? 'ಹೇಳಲು ಒತ್ತಿ' : 'Tap to Speak')}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                ) : screeningStep === 'age' ? (
                  
                  /* STEP 3: Ask Age vocal process */
                  <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 py-6" id="screening-step-age">
                    <div className="flex items-center justify-between w-full border-b border-slate-100 pb-4 mb-4">
                      <div>
                        <span className="text-xs font-bold text-slate-400 uppercase">Patient:</span>
                        <span className="text-xs font-bold ml-1 text-slate-800 uppercase tracking-tight">{patientName}</span>
                      </div>
                      <span className="text-xs text-sky-600 font-bold bg-sky-50 px-3 py-1 rounded">8 of 8</span>
                    </div>

                    <div className="relative">
                      <div className={`w-20 h-20 rounded-full flex items-center justify-center transition ${isSpeaking ? 'bg-sky-500/10' : 'bg-slate-100'}`}>
                        <Mic className={`w-8 h-8 ${isListening ? 'text-rose-500 animate-pulse' : 'text-slate-500'}`} />
                      </div>
                      <AudioWaveform isPlaying={isListening || isSpeaking} type={isSpeaking ? 'synth' : 'mic'} />
                    </div>

                    <div className="space-y-3 max-w-md">
                      <h2 className="text-2xl font-black text-slate-800 leading-tight">
                        "{SYSTEM_GREETINGS[selectedLang].askAge}"
                      </h2>
                    </div>

                    {pendingConfirmation ? (
                      <div className="w-full max-w-md bg-sky-50/50 border border-sky-200 rounded-2xl p-6 space-y-4">
                        <div>
                          <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">Recognized Age Text</p>
                          <p className="text-xl font-black text-sky-900">"{patientAge}" {selectedLang === Language.KANNADA ? 'ವರ್ಷಗಳು' : 'Years'}</p>
                        </div>
                        <p className="text-xs text-slate-500 italic">
                          {SYSTEM_GREETINGS[selectedLang].confirmResponse}
                        </p>
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={rejectCurrentValue}
                            className="flex-1 py-3 px-4 bg-white border border-slate-200 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition"
                          >
                            <X className="w-4 h-4 inline mr-1" />
                            {selectedLang === Language.KANNADA ? 'ತಪ್ಪು, ಮತ್ತೆ ನಮೂದಿಸಿ' : 'No, Repeat'}
                          </button>
                          <button
                            onClick={confirmCurrentValue}
                            className="flex-1 py-3 px-4 bg-sky-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-sky-500 transition"
                          >
                            <Check className="w-4 h-4 inline mr-1" />
                            {selectedLang === Language.KANNADA ? 'ಹೌದು, ಸರಿ' : 'Yes, Correct'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full max-w-md space-y-4">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={startListening}
                            className={`py-3 px-6 rounded-xl font-bold flex items-center justify-center gap-2 text-sm border shadow transition ${
                              isListening ? 'bg-rose-600 text-white border-rose-500' : 'bg-white hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <Mic className="w-4 h-4" />
                            {isListening ? (selectedLang === Language.KANNADA ? 'ವಯಸ್ಸನ್ನು ಹೇಳಿ...' : 'Speak your age...') : (selectedLang === Language.KANNADA ? 'ವಯಸ್ಸು ನಮೂದಿಸಲು ಮಾತನಾಡಿ' : 'Tap to Speak Age')}
                          </button>
                        </div>

                        {/* Fast click helper buttons for testing age categories */}
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Or select Age Group easily</p>
                          <div className="grid grid-cols-5 gap-2">
                            {[8, 16, 32, 52, 68].map((agePreset) => (
                              <button
                                key={agePreset}
                                onClick={() => {
                                  setPatientAge(agePreset);
                                  setPendingConfirmation({ stage: 'age', value: agePreset.toString() });
                                  speakText(agePreset.toString() + ". " + SYSTEM_GREETINGS[selectedLang].voiceConfirmResponse, selectedLang);
                                }}
                                className="bg-slate-100 hover:bg-sky-50 py-2.5 rounded-lg text-xs font-bold text-slate-600 hover:text-sky-700 transition"
                              >
                                {agePreset} yrs ({getAgeGroup(agePreset)})
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                ) : screeningStep === 'questioning' ? (
                  
                  /* STEP 4: Loop Through age-specific Screening Questions */
                  <div className="flex-1 flex flex-col justify-between py-2">
                    
                    {/* Progress tracking header */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4 select-none">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-sky-600 animate-pulse"></span>
                        <div className="text-xs">
                          <span className="font-bold text-slate-400">PATIENT: </span>
                          <span className="font-black text-slate-800 uppercase tracking-tight">{patientName}</span>
                          <span className="text-slate-400 mx-1">•</span>
                          <span className="font-bold text-slate-500">AGE: {patientAge} ({getAgeGroup(Number(patientAge))})</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-sky-700 font-bold bg-sky-100 px-3 py-1 rounded uppercase tracking-wide">
                          Question {currentQuestionIndex + 1} of {getAgeGroupQuestions().length}
                        </span>
                      </div>
                    </div>

                    {/* Step Visual Process dots indicator */}
                    <div className="flex space-x-2 justify-center mb-6">
                      {getAgeGroupQuestions().map((_, idx) => (
                        <div
                          key={idx}
                          className={`h-2 rounded-full transition-all ${
                            idx === currentQuestionIndex 
                              ? 'w-10 bg-sky-600' 
                              : idx < currentQuestionIndex 
                              ? 'w-6 bg-slate-300' 
                              : 'w-2 bg-slate-200'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Active Question screen content */}
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 max-w-xl mx-auto py-4">
                      
                      <div className="relative">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center transition ${isSpeaking ? 'bg-sky-500/10' : 'bg-slate-100'}`}>
                          <Mic className={`w-6 h-6 ${isListening ? 'text-rose-500 animate-pulse' : 'text-slate-500'}`} />
                        </div>
                        <AudioWaveform isPlaying={isListening || isSpeaking} type={isSpeaking ? 'synth' : 'mic'} />
                      </div>

                      <div className="space-y-4">
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                          CATEGORY: {getAgeGroupQuestions()[currentQuestionIndex]?.category.toUpperCase()} SCREENING
                        </span>
                        
                        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-800 leading-snug">
                          "{getAgeGroupQuestions()[currentQuestionIndex]?.text[selectedLang]}"
                        </h2>
                      </div>

                      {pendingConfirmation ? (
                        <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4 shadow-sm">
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Recognized Voice Response</p>
                            <p className="text-lg font-black text-slate-800 italic uppercase">
                              "{pendingConfirmation.value}"
                            </p>
                          </div>
                          
                          <p className="text-xs text-slate-500 italic">
                            {SYSTEM_GREETINGS[selectedLang].confirmResponse}
                          </p>

                          <div className="flex items-center justify-center gap-3">
                            <button
                              onClick={rejectCurrentValue}
                              className="flex-1 py-2.5 px-4 bg-white border border-slate-200 rounded-xl text-xs font-extrabold text-rose-600 hover:bg-rose-50 transition"
                            >
                              <X className="w-3.5 h-3.5 inline mr-1" />
                              {selectedLang === Language.KANNADA ? 'ತಪ್ಪು, ಮತ್ತೆ ಹೇಳಿ' : 'No, Repeat'}
                            </button>
                            <button
                              onClick={confirmCurrentValue}
                              className="flex-1 py-2.5 px-4 bg-sky-600 text-white rounded-xl text-xs font-extrabold shadow-md hover:bg-sky-500 transition"
                            >
                              <Check className="w-3.5 h-3.5 inline mr-1" />
                              {selectedLang === Language.KANNADA ? 'ಹೌದು, ಸರಿ' : 'Yes, Correct'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full space-y-4">
                          <div className="flex flex-col items-center gap-2">
                            <button
                              onClick={startListening}
                              className={`py-3 px-6 rounded-xl font-bold flex items-center justify-center gap-2 text-sm border shadow-md transition ${
                                isListening ? 'bg-rose-600 text-white border-rose-500' : 'bg-white hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <Mic className="w-4 h-4" />
                              {isListening ? (selectedLang === Language.KANNADA ? 'ಕೇಳಿಸಿಕೊಳ್ಳಲಾಗುತ್ತಿದೆ...' : 'Speak response now...') : (selectedLang === Language.KANNADA ? 'ಉತ್ತರಿಸಲು ಮಾತನಾಡಿ' : 'Tap to Voice Answer')}
                            </button>
                          </div>

                          {/* Quick answers option buttons for evaluator ease */}
                          <div className="space-y-2">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Quick Action Shortcuts (No Microphone Fallbacks)</p>
                            <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
                              <button
                                onClick={() => {
                                  const textVal = selectedLang === Language.KANNADA ? 'ಹೌದು, ತೊಂದರೆ ಇದೆ' : 'Yes, has symptoms';
                                  setPendingConfirmation({ stage: 'question', value: textVal, questionId: getAgeGroupQuestions()[currentQuestionIndex].id });
                                  speakText(textVal + ". " + SYSTEM_GREETINGS[selectedLang].voiceConfirmResponse, selectedLang);
                                }}
                                className="p-3 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-extrabold rounded-xl border border-rose-200 uppercase transition cursor-pointer"
                              >
                                {selectedLang === Language.KANNADA ? 'ಹೌದು, ತೊಂದರೆ ಇದೆ' : 'YES COMPLAINTS'}
                              </button>
                              <button
                                onClick={() => {
                                  const textVal = selectedLang === Language.KANNADA ? 'ಇಲ್ಲ, ನಾನು ಆರಾಮವಾಗಿದ್ದೇನೆ' : 'No, everything is normal';
                                  setPendingConfirmation({ stage: 'question', value: textVal, questionId: getAgeGroupQuestions()[currentQuestionIndex].id });
                                  speakText(textVal + ". " + SYSTEM_GREETINGS[selectedLang].voiceConfirmResponse, selectedLang);
                                }}
                                className="p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-extrabold rounded-xl border border-emerald-200 uppercase transition cursor-pointer"
                              >
                                {selectedLang === Language.KANNADA ? 'ಯಾವುದೇ ತೊಂದರೆ ಇಲ್ಲ' : 'NO COMPLAINTS'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Step cancel */}
                    <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-xs text-start font-sans">
                      <button
                        onClick={triggerNewScreening}
                        className="text-slate-400 hover:text-slate-600 font-medium"
                      >
                        {selectedLang === Language.KANNADA ? 'ರದ್ದು ಮಾಡಿ' : 'Cancel Screening'}
                      </button>
                      <span className="text-slate-400">
                        System automatically logs responses to offline local queue if internet fails.
                      </span>
                    </div>

                  </div>

                ) : screeningStep === 'insulinSystem' ? (
                  <AdaptiveInsulinSystem
                    selectedLang={selectedLang}
                    voiceEnabled={voiceEnabled}
                    speakText={speakText}
                    triggerToast={triggerToast}
                    onClose={() => setScreeningStep('patientDashboard')}
                  />
                ) : (
                  
                  /* STEP 5: Detailed Screening Report */
                  <div className="flex-1 flex flex-col space-y-6 font-sans">
                    
                    {analyzingRisk ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center py-10 space-y-4">
                        <RefreshCw className="w-12 h-12 text-sky-600 animate-spin" />
                        <h2 className="text-xl font-bold text-slate-800">Calculating Screening Risk Diagnostics...</h2>
                        <p className="text-xs text-slate-400">Processing medical responses with deep clinical classifier rules & Gemini AI insights.</p>
                      </div>
                    ) : currentReport ? (
                      <div className="space-y-6">
                        {/* Clinical Report Header Banner */}
                        <div className={`p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                          currentReport.riskFactor === 'high' 
                            ? 'bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-xl shadow-red-100' 
                            : currentReport.riskFactor === 'medium'
                            ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-xl shadow-amber-100'
                            : 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-100'
                        }`}>
                          
                          <div className="space-y-1">
                            <span className="text-[10px] tracking-widest font-black uppercase text-white/80">Diagnostic Assessment Completed</span>
                            <h2 className="text-2xl font-black">{currentReport.name} ({currentReport.age} Years)</h2>
                            <p className="text-xs text-white/95">
                              Registered ID: <span className="font-mono bg-white/20 px-2 py-0.5 rounded text-white">{currentReport.id}</span>
                              <span className="mx-2">•</span>
                              Status: <span className="font-bold underline">{currentReport.synced ? 'Synced Online' : 'Stored Locally (Browser Queue)'}</span>
                            </p>
                          </div>

                          <div className="text-center md:text-right">
                            <span className="text-xs text-white/80 font-bold uppercase block">Clinic Screening Score</span>
                            <span className="text-3xl font-black">{currentReport.riskScore} <span className="text-sm font-normal">/100</span></span>
                            <span className="block text-xs font-bold leading-none bg-white/20 px-3 py-1 rounded-full uppercase mt-1">
                              {currentReport.riskFactor.toUpperCase()} RISK RATING
                            </span>
                          </div>

                        </div>

                        {/* Survey Completion Status & Designated ASHA worker */}
                        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 text-start space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="bg-emerald-550 bg-emerald-500 text-white rounded-full p-1 shadow-sm">
                              <Check className="w-4 h-4" />
                            </div>
                            <h4 className="text-sm font-black text-emerald-800 uppercase tracking-wide">
                              Patient Health Survey Completed Successfully
                            </h4>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            This early outreach screening questionnaire is fully answered and verified. It is mapped to the designated regional Accredited Social Health Activist (ASHA) worker for subsequent taluk health outpost or hospital integration.
                          </p>
                          <div className="pt-2 border-t border-emerald-150/60 flex flex-col sm:flex-row gap-x-6 gap-y-2 text-xs">
                            <div>
                              <span className="font-bold text-slate-500">Designated ASHA Worker:</span>{' '}
                              <span className="font-extrabold text-slate-800">
                                {currentReport.ashaWorker?.name || 'Alia Rai'}
                              </span>
                            </div>
                            <div>
                              <span className="font-bold text-slate-500">ASHA Contact Number:</span>{' '}
                              <span className="font-mono font-extrabold text-sky-700">
                                {currentReport.ashaWorker?.phone || '+91 1234567890'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Comparative risk visual dials */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          
                          {/* Diabetes Gauge Chart card */}
                          <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Diabetes Screening Indicators</h3>
                            <div className="flex items-center gap-4">
                              <div className="relative w-16 h-16 rounded-full border-4 border-slate-200 flex items-center justify-center font-bold">
                                <span className={`absolute inset-0 rounded-full border-4 border-t-sky-500 ${
                                  currentReport.predictions.diabetesRisk === 'high' 
                                    ? 'border-red-500' 
                                    : currentReport.predictions.diabetesRisk === 'medium'
                                    ? 'border-amber-500'
                                    : 'border-emerald-500'
                                }`} />
                                <span className="text-xs uppercase font-black">
                                  {currentReport.predictions.diabetesRisk}
                                </span>
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-slate-800">Hyperglycemia Likelihood</h4>
                                <p className="text-xs text-slate-500">
                                  {currentReport.predictions.diabetesRisk === 'high' 
                                    ? 'Urgent testing for HbA1c and fasting blood sugar recommended immediately.' 
                                    : currentReport.predictions.diabetesRisk === 'medium'
                                    ? 'Moderate indicators. Control sugar content and check sugar levels next month.'
                                    : 'Normal blood sugar indicators tracked based on lifestyle response.'
                                  }
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* BP Gauge Chart card */}
                          <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Hypertension BP Indicators</h3>
                            <div className="flex items-center gap-4">
                              <div className="relative w-16 h-16 rounded-full border-4 border-slate-200 flex items-center justify-center font-bold">
                                <span className={`absolute inset-0 rounded-full border-4 border-t-sky-500 ${
                                  currentReport.predictions.hypertensionRisk === 'high' 
                                    ? 'border-red-500' 
                                    : currentReport.predictions.hypertensionRisk === 'medium'
                                    ? 'border-amber-500'
                                    : 'border-emerald-500'
                                }`} />
                                <span className="text-xs uppercase font-black">
                                  {currentReport.predictions.hypertensionRisk}
                                </span>
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-slate-805">Cardiovascular BP Elevation</h4>
                                <p className="text-xs text-slate-500">
                                  {currentReport.predictions.hypertensionRisk === 'high' 
                                    ? 'High likelihood of elevated systolic BP. Stop all chew tobacco, restrict direct salt.' 
                                    : currentReport.predictions.hypertensionRisk === 'medium'
                                    ? 'Pre-hypertension risk level detected. Increase walking hours and physical manual labor.'
                                    : 'Consistent cardiovascular screening indicator scores. Healthy BP range.'
                                  }
                                </p>
                              </div>
                            </div>
                          </div>

                        </div>

                        {/* Dynamic Patient Verification QR Code Badge */}
                        {qrCodeUrl && (
                          <div className="bg-sky-50/70 border border-sky-100 rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-5 my-5 text-start">
                            <div className="bg-white p-2.5 rounded-xl border border-sky-100 shadow-sm flex-shrink-0 flex flex-col items-center gap-1.5">
                              <img 
                                src={qrCodeUrl} 
                                alt="Patient Verification QR Code" 
                                className="w-28 h-28 select-none"
                                referrerPolicy="no-referrer"
                              />
                              <span className="text-[10px] font-black text-slate-500 tracking-wider uppercase text-center">
                                Scan to View Report
                              </span>
                            </div>
                            <div className="space-y-1.5 flex-1">
                              <span className="text-[10px] bg-sky-100 text-sky-850 px-2.5 py-0.5 rounded font-black uppercase tracking-wider">
                                Secure Clinical Verification QR
                              </span>
                              <h4 className="text-sm font-bold text-slate-800">
                                Digital Receipt QR Code Key
                              </h4>
                              <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
                                This QR code contains offline-valid secure identifiers, screening diagnostics, and risk factor metrics for regional taluk or PHC health nodes.
                              </p>
                              
                              <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-2">
                                <button
                                  onClick={() => {
                                    const screeningId = currentReport.screeningId || currentReport.id;
                                    const baseUrl = `${window.location.origin}/#report/${screeningId}`;
                                    const params = new URLSearchParams();
                                    params.set('pId', currentReport.id);
                                    params.set('scId', screeningId);
                                    params.set('ts', currentReport.submittedAt || new Date().toISOString());
                                    params.set('name', currentReport.name);
                                    params.set('age', String(currentReport.age));
                                    params.set('gender', currentReport.gender || '');
                                    params.set('address', currentReport.address || '');
                                    params.set('lang', currentReport.language);
                                    params.set('risk', currentReport.riskFactor);
                                    params.set('score', String(currentReport.riskScore));
                                    params.set('db', currentReport.predictions.diabetesRisk);
                                    params.set('bp', currentReport.predictions.hypertensionRisk);
                                    params.set('asha', currentReport.ashaWorker?.name || '');
                                    params.set('ashaPhone', currentReport.ashaWorker?.phone || '');
                                    const qrText = `${baseUrl}?${params.toString()}`;

                                    navigator.clipboard.writeText(qrText);
                                    triggerToast("QR Report Link copied successfully!");
                                  }}
                                  className="text-[11px] font-extrabold text-sky-600 hover:text-sky-700 underline transition flex items-center gap-1 cursor-pointer"
                                >
                                  <span>Copy Report Link</span>
                                </button>

                                <button
                                  onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = qrCodeUrl;
                                    link.download = `QR_Code_${currentReport.name.replace(/\s+/g, '_')}.png`;
                                    link.click();
                                    triggerToast("QR Code image download completed!");
                                  }}
                                  className="text-[11px] font-extrabold text-emerald-600 hover:text-emerald-700 underline transition flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Download QR Image</span>
                                </button>

                                <button
                                  onClick={() => {
                                    const screeningId = currentReport.screeningId || currentReport.id;
                                    const baseUrl = `${window.location.origin}/#report/${screeningId}`;
                                    const params = new URLSearchParams();
                                    params.set('pId', currentReport.id);
                                    params.set('scId', screeningId);
                                    params.set('ts', currentReport.submittedAt || new Date().toISOString());
                                    params.set('name', currentReport.name);
                                    params.set('age', String(currentReport.age));
                                    params.set('gender', currentReport.gender || '');
                                    params.set('address', currentReport.address || '');
                                    params.set('lang', currentReport.language);
                                    params.set('risk', currentReport.riskFactor);
                                    params.set('score', String(currentReport.riskScore));
                                    params.set('db', currentReport.predictions.diabetesRisk);
                                    params.set('bp', currentReport.predictions.hypertensionRisk);
                                    params.set('asha', currentReport.ashaWorker?.name || '');
                                    params.set('ashaPhone', currentReport.ashaWorker?.phone || '');
                                    const shareUrl = `${baseUrl}?${params.toString()}`;

                                    if (navigator.share) {
                                      navigator.share({
                                        title: `HealthSync Screening Report - ${currentReport.name}`,
                                        text: `Digital Early Outreach Diagnostic Report for ${currentReport.name}`,
                                        url: shareUrl,
                                      }).catch(() => {
                                        navigator.clipboard.writeText(shareUrl);
                                        triggerToast("Direct link copied to clipboard!");
                                      });
                                    } else {
                                      navigator.clipboard.writeText(shareUrl);
                                      triggerToast("Link copied to clipboard!");
                                    }
                                  }}
                                  className="text-[11px] font-extrabold text-indigo-600 hover:text-indigo-700 underline transition flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                  <span>Share QR Link</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Interactive Client operations buttons */}
                        <div className="flex flex-col md:flex-row gap-3 pt-4 border-t border-slate-100 font-sans">
                          <button
                            onClick={downloadDoctorReport}
                            className="flex-1 py-3 px-4 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition flex items-center justify-center gap-1.5"
                          >
                            <FileText className="w-4 h-4" />
                            Download TXT Report
                          </button>

                          <button
                            onClick={() => {
                              // Retrieve session format and render PDF
                              const sessionObj: ScreeningHistoryEntry = {
                                id: currentReport.id || `PAT-${Date.now()}`,
                                patientId: currentReport.id || `PAT-${Date.now()}`,
                                timestamp: currentReport.submittedAt || new Date().toISOString(),
                                patientDetails: {
                                  id: currentReport.id,
                                  name: currentReport.name,
                                  age: currentReport.age,
                                  gender: currentReport.gender,
                                  address: currentReport.address,
                                  language: currentReport.language
                                },
                                answers: currentReport.answers,
                                riskResults: {
                                  riskFactor: currentReport.riskFactor,
                                  riskScore: currentReport.riskScore,
                                  predictions: {
                                    diabetesRisk: currentReport.predictions.diabetesRisk,
                                    hypertensionRisk: currentReport.predictions.hypertensionRisk,
                                    notes: currentReport.predictions.notes
                                  }
                                }
                              };
                              downloadPdfReport(sessionObj);
                            }}
                            className="flex-1 py-3 px-4 bg-sky-600 text-white rounded-xl text-xs font-bold hover:bg-sky-500 transition shadow-lg shadow-sky-200 flex items-center justify-center gap-1.5"
                          >
                            <Download className="w-4 h-4" />
                            Download PDF Report
                          </button>
                          
                          <button
                            onClick={triggerNewScreening}
                            className="flex-1 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                          >
                            <span>{loggedInPatientName ? 'Return to Dashboard' : 'Start Next Screening'}</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>

                      </div>
                    ) : null}

                  </div>
                )}

              </div>

            </div>
          ) : (
            
            /* ========================================================
               ASHA COMMUNITY WORKER PORTAL
               ======================================================== */
            <div id="asha-view" className="max-w-7xl mx-auto h-full space-y-6">
              
              {/* Login State Toggles */}
              {!ashaWorker ? (
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 max-w-md mx-auto my-12 space-y-6" id="asha-login-view">
                  <div className="text-center space-y-2">
                    <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                      <Users className="w-7 h-7" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                      {selectedLang === Language.KANNADA ? 'ಆಶಾ ಸಿಬ್ಬಂದಿ ದೃಢೀಕರಣ' : 'ASHA Worker Authentication'}
                    </h2>
                    <p className="text-xs text-slate-400">
                      {selectedLang === Language.KANNADA 
                        ? 'ಲಾಗಿನ್ ಮಾಡಲು ಅಥವಾ ಹೊಸ ಸಿಬ್ಬಂದಿ ನೌಕರ ನೋಂದಣಿಗೆ ವಿವರಗಳನ್ನು ಭರ್ತಿ ಮಾಡಿ.' 
                        : 'Access regional clinical desks or register as a village health outreach worker.'}
                    </p>
                  </div>

                  {/* ASHA Auth Tabs */}
                  <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl w-full border border-slate-200 transition">
                    <button
                      type="button"
                      onClick={() => {
                        setAshaAuthTab('login');
                        setAshaLoginError('');
                      }}
                      className={`py-2 text-xs font-extrabold uppercase rounded-lg transition-all ${
                        ashaAuthTab === 'login'
                          ? 'bg-white shadow-sm text-emerald-600 font-black'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {selectedLang === Language.KANNADA ? 'ಲಾಗಿನ್' : 'Log In'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAshaAuthTab('register');
                        setAshaLoginError('');
                      }}
                      className={`py-2 text-xs font-extrabold uppercase rounded-lg transition-all ${
                        ashaAuthTab === 'register'
                          ? 'bg-white shadow-sm text-emerald-600 font-black'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {selectedLang === Language.KANNADA ? 'ನೂತನ ನೋಂದಣಿ' : 'Register'}
                    </button>
                  </div>

                  <form onSubmit={(e) => handleAshaLoginAction(e, ashaAuthTab === 'register')} className="space-y-4">
                    {ashaLoginError && (
                      <div className="p-3 bg-rose-50 text-rose-600 border border-rose-100 text-xs font-bold rounded-xl text-center">
                        {ashaLoginError}
                      </div>
                    )}

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                        {selectedLang === Language.KANNADA ? 'ಪೂರ್ಣ ಹೆಸರು (ಆಂಗ್ಲ ಅಕ್ಷರಗಳಲ್ಲಿ)' : 'Full Registered Name'}
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-emerald-500 font-bold bg-white text-slate-800"
                        value={ashaName}
                        onChange={(e) => setAshaName(e.target.value)}
                        placeholder="e.g. ALIA RAI"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                        {selectedLang === Language.KANNADA ? 'ಮೊಬೈಲ್ ಸಂಪರ್ಕ ಸಂಖ್ಯೆ' : 'Phone Number'}
                      </label>
                      <input
                        type="tel"
                        required
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-emerald-500 font-bold bg-white text-slate-800"
                        value={ashaPhone}
                        onChange={(e) => setAshaPhone(e.target.value)}
                        placeholder="e.g. +91 1234567890"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={ashaAuthLoading}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3 px-4 rounded-xl text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-1"
                    >
                      {ashaAuthLoading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <span>
                            {ashaAuthTab === 'login'
                              ? (selectedLang === Language.KANNADA ? 'ಖಾತೆಗೆ ಪ್ರವೇಶಿಸಿ' : 'Authenticate Staff')
                              : (selectedLang === Language.KANNADA ? 'ಸಿಬ್ಬಂದಿ ನೋಂದಣಿ ಸೇರಿ' : 'Register Official Profile')}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>

                    {/* Pre-approved staff trigger autofills */}
                    <div className="space-y-1.5 text-start border-t border-slate-100 pt-3">
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block font-bold">Approved Field Profiles:</span>
                      <div className="flex flex-wrap gap-1.5 font-sans">
                        <button
                          type="button"
                          onClick={() => {
                            setAshaName("ALIA RAI");
                            setAshaPhone("+91 1234567890");
                            setAshaAuthTab('login');
                          }}
                          className="text-[9px] font-extrabold px-2.5 py-1.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 rounded-lg text-slate-700 transition"
                        >
                          Alia Rai (Ullal)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAshaName("SHRAVYA RAO");
                            setAshaPhone("+91 8765432101");
                            setAshaAuthTab('login');
                          }}
                          className="text-[9px] font-extrabold px-2.5 py-1.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 rounded-lg text-slate-700 transition"
                        >
                          Shravya Rao (Derlakatte)
                        </button>
                      </div>
                    </div>
                  </form>

                  <div className="flex justify-between items-center text-xs font-bold text-slate-400 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRole(null);
                        setActivePortal('patient');
                        setScreeningStep('rolesSelection');
                      }}
                      className="hover:text-slate-600 transition flex items-center gap-1"
                    >
                      ← {selectedLang === Language.KANNADA ? 'ಪಾತ್ರ ಆಯ್ಕೆಗೆ ಹಿಂತಿರುಗಿ' : 'Back to Selection'}
                    </button>
                  </div>
                </div>
              ) : (
                
                /* ========================================================
                   AUTHORIZED WORKER SCREENINGS HUB
                   ======================================================== */
                <div className="space-y-6">
                  
                  {/* Dashboard Info Header and Notifications Alerts banner */}
                  <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-sky-50 text-sky-600 rounded-full flex items-center justify-center">
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-sm font-black text-slate-800">Community Outreach Professional ID: {ashaWorker.id}</h2>
                        <p className="text-xs text-slate-400">Authenticated Staff: <span className="font-bold text-slate-700">{ashaWorker.name}</span> | Assigned Coverage: <span className="font-bold text-slate-700">{ashaWorker.assignedArea}</span></p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setIsQrScannerOpen(!isQrScannerOpen)}
                        className="py-2 px-4 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5"
                      >
                        <QrCode className="w-4 h-4 text-sky-600" />
                        PATIENT QR VERIFIER CONSOLE
                      </button>

                      <button
                        onClick={() => setManualEntryActive(!manualEntryActive)}
                        className="py-2 px-4 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-extrabold transition flex items-center gap-1.5"
                      >
                        <UserPlus className="w-4 h-4" />
                        MANUALLY ENTER OUTREACH DATA CARD
                      </button>

                      <button
                        onClick={handleAshaLogout}
                        className="py-2 px-3 text-rose-500 hover:bg-rose-50 rounded-xl text-xs font-extrabold transition"
                      >
                        <LogOut className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  </div>

                  {/* ====== OFFLINE SYNC QUEUE SYSTEM ====== */}
                  <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-xl ${offlineSyncQueue.length > 0 ? 'bg-amber-50 text-amber-600 animate-pulse' : 'bg-emerald-50 text-emerald-600'}`}>
                          <Database className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2 col">
                            Offline Sync Queue
                            {offlineSyncQueue.length > 0 && (
                              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                            )}
                          </h4>
                          <p className="text-xs text-slate-400">Maintains patient records queued during temporary offline screening.</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-3 py-1 rounded-full font-extrabold ${
                          offlineSyncQueue.length > 0 
                            ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {offlineSyncQueue.length > 0 
                            ? `${offlineSyncQueue.length} records waiting for sync` 
                            : "All records synchronized"}
                        </span>
                      </div>
                    </div>

                    {/* Progress indicator during actual sync operations */}
                    {syncingNow && (
                      <div className="bg-sky-50 border border-sky-100 p-3 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2.5 text-xs text-sky-800 font-bold">
                          <span className="w-4 h-4 border-2 border-sky-600 border-t-transparent rounded-full animate-spin"></span>
                          <span>Auto-syncing clinical records...</span>
                        </div>
                        <div className="w-32 bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div className="bg-sky-600 h-full w-2/3 animate-pulse rounded-full"></div>
                        </div>
                      </div>
                    )}

                    {/* Sync Success Completed feedback message */}
                    {syncCompletedMsg && (
                      <motion.div 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-xl p-3 text-xs font-bold flex items-center gap-2"
                      >
                        <Check className="w-4 h-4 text-emerald-600 animate-bounce" />
                        <span>{syncCompletedMsg}</span>
                      </motion.div>
                    )}

                    {offlineSyncQueue.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Queued Clinical Records:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-48 overflow-y-auto pr-1">
                          {offlineSyncQueue.map((item, index) => (
                            <div key={item.id || index} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col justify-between hover:bg-slate-100/50 transition">
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] text-slate-400 font-mono font-bold">#{index + 1} QUEUED</span>
                                  <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded border ${
                                    item.data.riskFactor === 'high' 
                                      ? 'bg-rose-50 text-rose-700 border-rose-200' 
                                      : item.data.riskFactor === 'medium'
                                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  }`}>
                                    {item.data.riskFactor?.toUpperCase()} RISK
                                  </span>
                                </div>
                                <h5 className="text-xs font-bold text-slate-800 uppercase">{item.data.name}</h5>
                                <p className="text-[10px] text-slate-500">Gender: {item.data.gender} • Age: {item.data.age} Yrs</p>
                                <p className="text-[10px] text-slate-500 truncate">Village: {item.data.address}</p>
                              </div>
                              <div className="border-t border-slate-200/60 mt-2.5 pt-2 flex items-center justify-between text-[9px] text-slate-400 font-mono">
                                <span>Sugar: {item.data.predictions?.diabetesRisk?.toUpperCase()} • BP: {item.data.predictions?.hypertensionRisk?.toUpperCase()}</span>
                                <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-50 bg-opacity-40 border border-slate-150 rounded-xl text-center text-xs text-slate-500 font-medium">
                        All screening entries have been securely synchronized with the regional medical base. No pending offline data.
                      </div>
                    )}
                  </div>

                  {/* HIGH ALERTS POPUPS FROM SURAKSHA PATIENTS IN QUEUES */}
                  {notifications.filter(n => !n.read).length > 0 && (
                    <div className="bg-red-50 border border-red-200 text-red-900 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-600 animate-pulse" />
                        <h4 className="text-sm font-black uppercase tracking-tight text-red-800">Live Warning: Critical Risk Alerts Detected</h4>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {notifications.filter(n => !n.read).map((item) => (
                          <div key={item.id} className="bg-white p-3 rounded-xl border border-red-100 shadow-sm flex items-center justify-between gap-2">
                            <div className="space-y-0.5">
                              <span className="text-[9px] font-black text-red-600 bg-red-50 px-2 py-0.2 rounded uppercase">HIGH PRIORITY Referral REQUIRED</span>
                              <p className="text-xs font-bold text-slate-800">{item.message}</p>
                              <span className="text-[10px] text-slate-400 font-mono block">{new Date(item.timestamp).toLocaleTimeString()}</span>
                            </div>
                            <button
                              onClick={() => clearToastNotifs(item.id)}
                              className="text-xs font-bold text-slate-400 hover:text-slate-800 underline uppercase pr-2 cursor-pointer"
                            >
                              DISMISS
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ========================================================
                     MODERN HEALTHCARE OPERATIONAL COMMAND CENTER
                     ======================================================== */}
                  <div className="bg-[#0b1329] border border-slate-800 p-6 rounded-3xl shadow-2xl space-y-6 text-slate-100 transition duration-300">
                    
                    {/* Console Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#1f2d4e] pb-4 gap-3 select-none">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-sky-950/60 border border-sky-500/30 flex items-center justify-center text-sky-400 relative">
                          <Activity className="w-5 h-5 text-sky-400 animate-pulse" />
                          <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-[#0b1329] animate-ping"></span>
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                            Clinical Triage Operational Console
                            <span className="bg-sky-950/80 text-sky-400 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-sky-800/40">
                              {getFilteredPatients().length} Active Zone Patients
                            </span>
                          </h4>
                          <p className="text-xs text-slate-400">Precision closed-loop clinical monitoring and auto-priority routing based on risk tiers.</p>
                        </div>
                      </div>
                    </div>

                    {/* 1. PRIORITY PATIENT QUEUE (TOP SECTION) */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-sky-400" />
                          1. Priority Patient Queue
                        </h5>
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono font-bold">
                          Urgency-Sorted Triage
                        </span>
                      </div>

                      {(() => {
                        const sortedPatients = [...getFilteredPatients()].sort((a, b) => {
                          const getRiskWeight = (p: PatientResponse) => {
                            if (p.riskFactor === 'high') return 3;
                            if (p.riskFactor === 'medium') return 2;
                            return 1;
                          };

                          const getDueDateValue = (p: PatientResponse) => {
                            if (p.vitals?.dueDate) {
                              return new Date(p.vitals.dueDate).getTime();
                            }
                            const days = p.vitals?.nextScheduledDays || (p.riskFactor === 'high' ? 7 : p.riskFactor === 'medium' ? 30 : 365);
                            return new Date(p.submittedAt).getTime() + days * 24 * 3600 * 1000;
                          };

                          const weightDiff = getRiskWeight(b) - getRiskWeight(a);
                          if (weightDiff !== 0) return weightDiff;

                          return getDueDateValue(a) - getDueDateValue(b);
                        });

                        if (sortedPatients.length === 0) {
                          return (
                            <div className="p-8 bg-[#131d38] border border-dashed border-slate-800 rounded-2xl text-center space-y-2 select-none">
                              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                              <h5 className="text-xs font-bold text-slate-300 uppercase">Queue Completely Cleared</h5>
                              <p className="text-xs text-slate-500 max-w-md mx-auto">
                                No active patient entries match the specified filter in this Sector coverage zone. All registers are fully up to date.
                              </p>
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-3.5 max-h-[420px] overflow-y-auto pr-1">
                            {sortedPatients.map((patient) => {
                              const isSelected = selectedDossierPatient?.id === patient.id;
                              const risk = patient.riskFactor;
                              const riskColor = risk === 'high' ? '#dc2626' : (risk === 'medium' ? '#ca8a04' : '#16a34a');
                              
                              let cardColorStyles = "bg-[#101931] border-slate-800/80 hover:border-slate-700 hover:bg-[#121c38]";
                              if (risk === 'high') {
                                cardColorStyles = "bg-[#18111e] border-red-950/80 hover:border-red-900/80 hover:bg-[#1c1324] ring-1 ring-red-950/20";
                              } else if (risk === 'medium') {
                                cardColorStyles = "bg-[#16161b] border-amber-950/80 hover:border-amber-900/80 hover:bg-[#1a1a21]";
                              }

                              if (isSelected) {
                                cardColorStyles = "bg-[#1c2a4f] border-sky-500/80 shadow-[0_0_12px_rgba(14,165,233,0.15)]";
                              }

                              const dueDateValue = (() => {
                                if (patient.vitals?.dueDate) return new Date(patient.vitals.dueDate).getTime();
                                const days = patient.vitals?.nextScheduledDays || (risk === 'high' ? 7 : risk === 'medium' ? 30 : 365);
                                return new Date(patient.submittedAt).getTime() + days * 24 * 3600 * 1000;
                              })();

                              const isOverdue = dueDateValue <= Date.now();
                              const diffDays = Math.round((dueDateValue - Date.now()) / (1000 * 60 * 60 * 24));
                              
                              let dateBadge = "bg-slate-900/60 text-slate-400 border-slate-800";
                              let dateText = `${new Date(dueDateValue).toLocaleDateString()} (${Math.abs(diffDays)} days overdue)`;
                              if (isOverdue) {
                                dateBadge = "bg-red-950/40 text-red-500 border-red-900/60 font-black animate-pulse";
                              } else if (diffDays === 0) {
                                dateBadge = "bg-amber-950/40 text-[#ca8a04] border-amber-900/60 font-bold";
                                dateText = "Due Today";
                              } else {
                                dateText = `${new Date(dueDateValue).toLocaleDateString()} (${diffDays} days remaining)`;
                              }

                              const diabetesStatus = patient.vitals?.diabetesClassification || classifyDiabetes(patient.bloodSugar);
                              const badges = [];
                              if (risk === 'high') {
                                badges.push('CRITICAL');
                                badges.push('TIER 3');
                                if (diabetesStatus.toLowerCase().includes('type 2')) {
                                  badges.push('POSSIBLE TYPE 2 DIABETES');
                                }
                              } else if (risk === 'medium') {
                                badges.push('BORDERLINE');
                                badges.push('PRE-DIABETIC');
                                badges.push('TIER 2');
                              } else {
                                badges.push('STABLE');
                                badges.push('LOW RISK');
                                badges.push('TIER 1');
                              }

                              return (
                                <div
                                  key={patient.id}
                                  className={`p-4 rounded-2xl border flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all duration-300 ${cardColorStyles}`}
                                >
                                  <div className="space-y-2.5 flex-1 min-w-0 text-start">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <h6 className="text-sm font-black text-white tracking-tight uppercase truncate">
                                        {patient.name}
                                      </h6>
                                      
                                      <span className="text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800 shrink-0">
                                        Household ID: {patient.id}
                                      </span>

                                      <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shrink-0 flex items-center gap-1.5" style={{ color: riskColor, backgroundColor: `${riskColor}20`, border: `1px solid ${riskColor}40` }}>
                                        <span className="w-1.5 h-1.5 rounded-full animate-ping" style={{ backgroundColor: riskColor }}></span>
                                        {risk === 'high' ? 'Tier 3' : risk === 'medium' ? 'Tier 2' : 'Tier 1'} Risk
                                      </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-2 text-[11px] text-slate-450 text-slate-400 border-t border-slate-800/40 pt-2 pb-0.5">
                                      <div>
                                        <span className="text-slate-500 uppercase text-[9px] font-black block">Diabetes Status</span>
                                        <span className={`font-black ${risk === 'high' ? 'text-red-400' : 'text-slate-200'}`}>{diabetesStatus}</span>
                                      </div>
                                      <div>
                                        <span className="text-slate-500 uppercase text-[9px] font-black block">Last Screening Date</span>
                                        <span className="font-mono text-slate-300 flex items-center gap-1">
                                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                          {new Date(patient.submittedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-slate-500 uppercase text-[9px] font-black block">Next Scheduled Visit</span>
                                        <span className={`px-1.5 py-0.2 rounded border font-mono text-[10px] inline-flex items-center gap-1 ${dateBadge}`}>
                                          <Clock className="w-3 h-3 text-current" />
                                          {dateText}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                      {badges.map((bLabel, idx) => (
                                        <span
                                          key={idx}
                                          className="text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded border shadow-sm"
                                          style={{
                                            borderColor: `${riskColor}30`,
                                            color: riskColor,
                                            backgroundColor: `${riskColor}10`
                                          }}
                                        >
                                          {bLabel}
                                        </span>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="flex sm:flex-row lg:flex-col items-stretch justify-end gap-2 shrink-0 select-none">
                                    <button
                                      onClick={() => {
                                        setSelectedDossierPatient(patient);
                                        setTimeout(() => {
                                          const dossierEl = document.getElementById('active-dossier-root');
                                          if (dossierEl) {
                                            dossierEl.scrollIntoView({ behavior: 'smooth' });
                                          }
                                        }, 100);
                                        triggerToast(`Loaded dossier for ${patient.name}. Proceed to Clinical Recheck Form below.`);
                                      }}
                                      className="py-2 px-4.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-sky-950/50 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                                    >
                                      <Sparkles className="w-3.5 h-3.5" />
                                      Perform Re-check
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>

                    {/* 2. CLOSED-LOOP MONITORING STATUS CARD (PLACE BELOW PATIENT LIST) */}
                    {(() => {
                      const sorted = [...getFilteredPatients()].sort((a, b) => {
                        const getRiskWeight = (p: PatientResponse) => {
                          if (p.riskFactor === 'high') return 3;
                          if (p.riskFactor === 'medium') return 2;
                          return 1;
                        };

                        const getDueDateValue = (p: PatientResponse) => {
                          if (p.vitals?.dueDate) {
                            return new Date(p.vitals.dueDate).getTime();
                          }
                          const days = p.vitals?.nextScheduledDays || (p.riskFactor === 'high' ? 7 : p.riskFactor === 'medium' ? 30 : 365);
                          return new Date(p.submittedAt).getTime() + days * 24 * 3600 * 1000;
                        };

                        const weightDiff = getRiskWeight(b) - getRiskWeight(a);
                        if (weightDiff !== 0) return weightDiff;

                        return getDueDateValue(a) - getDueDateValue(b);
                      });

                      const activePatient = selectedDossierPatient || sorted[0];
                      if (!activePatient) return null;

                      const activeRisk = activePatient.riskFactor;
                      const activeTier = activeRisk === 'high' ? 'Tier 3' : (activeRisk === 'medium' ? 'Tier 2' : 'Tier 1');
                      const activeDiabetes = activePatient.vitals?.diabetesClassification || classifyDiabetes(activePatient.bloodSugar);
                      
                      const lastScreeningVal = activePatient.submittedAt 
                        ? new Date(activePatient.submittedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                        : "26 May 2026";
                      
                      const nextVisitVal = (() => {
                        if (activePatient.vitals?.dueDate) {
                          const d = new Date(activePatient.vitals.dueDate);
                          const yyyy = d.getFullYear();
                          const mm = String(d.getMonth() + 1).padStart(2, '0');
                          const dd = String(d.getDate()).padStart(2, '0');
                          return `${yyyy}-${mm}-${dd}`;
                        }
                        const days = activePatient.vitals?.nextScheduledDays || (activeRisk === 'high' ? 7 : activeRisk === 'medium' ? 30 : 365);
                        const d = new Date(new Date(activePatient.submittedAt).getTime() + days * 24 * 3600 * 1000);
                        const yyyy = d.getFullYear();
                        const mm = String(d.getMonth() + 1).padStart(2, '0');
                        const dd = String(d.getDate()).padStart(2, '0');
                        return `${yyyy}-${mm}-${dd}`;
                      })();

                      return (
                        <div className="bg-[#101830] border border-slate-850 border-slate-800 rounded-2xl p-5 space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-3 h-auto">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.5)]"></span>
                              <h5 className="text-xs font-black text-white uppercase tracking-wider">
                                LOOP STATUS: ACTIVE MONITORING
                              </h5>
                            </div>
                            <span className="bg-emerald-950/60 text-emerald-400 border border-emerald-800 text-[9px] font-black px-3 py-1 rounded-full shadow-sm tracking-wider uppercase animate-pulse">
                              CLOSED-LOOP SYNCED
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-1 select-none text-start">
                            <div className="space-y-1">
                              <p className="text-[9px] uppercase font-black text-slate-500 tracking-wider">Active Patient Name</p>
                              <p className="text-xs font-black text-white truncate">{activePatient.name}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[9px] uppercase font-black text-slate-500 tracking-wider">Last Screening Census</p>
                              <p className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                {lastScreeningVal}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[9px] uppercase font-black text-slate-500 tracking-wider">Next Scheduled Visit</p>
                              <p className="text-xs font-mono font-black text-cyan-400 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                                {nextVisitVal}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[9px] uppercase font-black text-slate-500 tracking-wider">Stratified Vitals & NCD</p>
                              <div className="flex flex-col gap-0.5">
                                <span className={`text-[10px] font-black uppercase ${activeRisk === 'high' ? 'text-red-400' : (activeRisk === 'medium' ? 'text-amber-400' : 'text-emerald-400')}`}>
                                  {activeTier} Risk
                                </span>
                                <span className="text-[10px] text-slate-300 font-bold leading-tight">{activeDiabetes}</span>
                              </div>
                            </div>
                          </div>

                          <div className="border-t border-slate-800/60 pt-3">
                            <p className="text-[10px] leading-relaxed text-slate-400 font-medium">
                              “Automatic triage updates are generated dynamically after each screening, feeding results back to scheduling and dispatch queues.”
                            </p>
                          </div>
                        </div>
                      );
                    })()}

                  </div>

                  {/* QR SCREEN VERIFICATION PANEL */}
                  {isQrScannerOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-4"
                    >
                      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                        <h3 className="text-sm font-bold text-sky-400 uppercase tracking-widest flex items-center gap-1.5">
                          <QrCode className="w-4 h-4" />
                          Offline QR Verification Console (Evaluator Sync Tool)
                        </h3>
                        <button onClick={() => setIsQrScannerOpen(false)} className="text-slate-400 hover:text-white text-xs">Close Console</button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        
                        <div className="md:col-span-5 space-y-3">
                          <p className="text-xs text-slate-300 leading-relaxed">
                            Under typical screening conditions, local patient registers generate a compact QR. ASHA workers use their mobile cameras to scan the receipt. 
                            To simulate the camera scan in the AI Studio environment, simply **copy the patient QR data** or **paste the QR payload string** below.
                          </p>
                          
                          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 space-y-2">
                            <p className="text-[10px] text-sky-400 font-bold uppercase tracking-wider">Fast Testing Payload Preset</p>
                            <button
                              onClick={() => {
                                const dummy = {
                                  id: "PATIENT-DEMO-SAMPLE",
                                  name: "Kaveri Gowda",
                                  age: 64,
                                  lang: "kn",
                                  risk: "high",
                                  score: 85,
                                  db: "high",
                                  bp: "high",
                                  answers: { "elderly_chest_pain": "Yes", "elderly_feet_swelling": "Yes" }
                                };
                                setQrScanInput(JSON.stringify(dummy));
                              }}
                              className="w-full bg-slate-700/60 hover:bg-slate-700 py-1.5 px-3 rounded text-left text-xs text-slate-200 transition font-mono border border-slate-600 truncate"
                            >
                              Click to pre-fill high risk sample raw QR payload
                            </button>
                          </div>
                        </div>

                        <div className="md:col-span-7 space-y-3">
                          <textarea
                            className="w-full h-24 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-emerald-400 focus:outline-sky-500 placeholder-slate-600"
                            placeholder="Paste patient QR code json string here..."
                            value={qrScanInput}
                            onChange={(e) => setQrScanInput(e.target.value)}
                          />

                          <div className="flex justify-between items-center">
                            <button
                              onClick={testBarcodeScanPayload}
                              disabled={qrScanLoading}
                              className="bg-sky-500 hover:bg-sky-400 disabled:bg-slate-700 text-slate-950 disabled:text-slate-400 py-2 px-5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                            >
                              {qrScanLoading ? (
                                <>
                                  <span className="w-3 h-3 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                                  <span>Fetching Clinical Record...</span>
                                </>
                              ) : (
                                <span>Verify QR Code Data</span>
                              )}
                            </button>
                          </div>

                          {qrScanSuccessMsg && (
                            <div className="p-3 bg-slate-800 text-xs font-bold rounded-lg text-slate-200 border border-slate-700">
                              {qrScanSuccessMsg}
                              
                              {qrScanData && (
                                <div className="mt-2 text-[11px] text-slate-300 font-normal space-y-1 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                                  <p><span className="font-bold text-sky-400">PATIENT NAME:</span> {qrScanData.name}</p>
                                  <p><span className="font-bold text-sky-400">AGE:</span> {qrScanData.age} Years</p>
                                  <p><span className="font-bold text-sky-400">BP RISK:</span> {qrScanData.bp?.toUpperCase()}</p>
                                  <p><span className="font-bold text-sky-400">DIABETES RISK:</span> {qrScanData.db?.toUpperCase()}</p>
                                  <p><span className="font-bold text-sky-400">RISK SCORE:</span> {qrScanData.score} / 100</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                      </div>
                    </motion.div>
                  )}

                  {/* MANUAL SCREENING OUTREACH INPUT CARD */}
                  {manualEntryActive && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl space-y-4"
                    >
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2">
                        Manual Patient Outreach Screening Intake
                      </h3>
                      
                      <form onSubmit={handleManualFormSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-4">
                          <div>
                            <label className="text-xs font-black uppercase text-slate-400 block mb-1">Full Patient Name</label>
                            <input
                              type="text"
                              className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-sky-500"
                              value={manualPatientForm.name}
                              onChange={(e) => setManualPatientForm({...manualPatientForm, name: e.target.value})}
                              placeholder="Rudra Gowda"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-black uppercase text-slate-400 block mb-1">Current Age</label>
                            <input
                              type="number"
                              className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-sky-500"
                              value={manualPatientForm.age}
                              onChange={(e) => setManualPatientForm({...manualPatientForm, age: e.target.value})}
                              placeholder="54"
                            />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="text-xs font-black uppercase text-slate-400 block mb-1">Survey Language</label>
                            <select
                              className="w-full border border-slate-200 bg-white rounded-xl px-4 py-2 text-sm focus:outline-sky-500"
                              value={manualPatientForm.language}
                              onChange={(e) => setManualPatientForm({...manualPatientForm, language: e.target.value as Language})}
                            >
                              <option value={Language.ENGLISH}>English</option>
                              <option value={Language.KANNADA}>ಕನ್ನಡ (Kannada)</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-xs font-black uppercase text-slate-400 block mb-1">History Checkboxes</label>
                            <div className="space-y-1 text-xs">
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  onChange={(e) => {
                                    const text = e.target.checked ? "Yes, complaints noted" : "No complaints";
                                    setManualPatientForm({
                                      ...manualPatientForm,
                                      answers: { ...manualPatientForm.answers, "midage_vision": text, "midage_wound_healing": text }
                                    });
                                  }}
                                />
                                Vision complaints?
                              </label>

                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  onChange={(e) => {
                                    const text = e.target.checked ? "Yes, active medications" : "No, normal";
                                    setManualPatientForm({
                                      ...manualPatientForm,
                                      answers: { ...manualPatientForm.answers, "midage_history_pills": text }
                                    });
                                  }}
                                />
                                Active meds?
                              </label>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3 bg-slate-50 border border-slate-200 p-3.5 rounded-2xl">
                          <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Clinical Vitals Intake</p>
                          <div>
                            <label className="text-[9px] font-bold uppercase text-slate-500 block mb-0.5">Blood Sugar (mg/dL)</label>
                            <input
                              type="number"
                              className="w-full border border-slate-200 bg-white rounded-lg px-2.5 py-1 text-xs focus:outline-sky-500"
                              value={manualBloodSugar}
                              onChange={(e) => setManualBloodSugar(e.target.value)}
                              placeholder="e.g. 145"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[9px] font-bold uppercase text-slate-500 block mb-0.5">Sys BP (mmHg)</label>
                              <input
                                type="number"
                                className="w-full border border-slate-200 bg-white rounded-lg px-2 py-1 text-xs focus:outline-sky-500"
                                value={manualSystolicBP}
                                onChange={(e) => setManualSystolicBP(e.target.value)}
                                placeholder="125"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] font-bold uppercase text-slate-500 block mb-0.5">Dia BP (mmHg)</label>
                              <input
                                type="number"
                                className="w-full border border-slate-200 bg-white rounded-lg px-2 py-1 text-xs focus:outline-sky-500"
                                value={manualDiastolicBP}
                                onChange={(e) => setManualDiastolicBP(e.target.value)}
                                placeholder="82"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col justify-end space-y-2">
                          <button
                            type="submit"
                            className="bg-sky-600 text-white font-bold py-2 px-4 rounded-xl text-xs hover:bg-sky-500 transition shadow"
                          >
                            Submit outreach card
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => {
                              setManualEntryActive(false);
                              setManualBloodSugar('');
                              setManualSystolicBP('');
                              setManualDiastolicBP('');
                            }}
                            className="border border-slate-200 text-slate-500 font-bold py-1.5 px-4 rounded-xl text-xs hover:bg-slate-50 transition"
                          >
                            Cancel Manual Intake
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}

                  {/* VILLAGE COVERAGE MAP & ACTIVE PATIENTS GRID */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch font-sans">
                    
                    {/* LEFT SIDE: Assigned Area Interactive Village Map with OSM tilelayers and Thermal High-Risk Heatmap */}
                    <div className="lg:col-span-8 flex flex-col gap-4">
                      <LiveAshaMap 
                        assignedArea={ashaWorker.assignedArea}
                        assignedHouses={assignedHouses}
                        patients={globalPatients}
                        onSelectHouse={(house) => setSelectedHouse(house)}
                        selectedHouse={selectedHouse}
                      />

                      {/* Dynamic selected household visual banner overlay (renders right beneath map) */}
                      {selectedHouse && (
                        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                          <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Active Household Card Action</p>
                            <h4 className="text-sm font-black text-slate-800">{selectedHouse.houseNumber} — {selectedHouse.familyHead}'s Family</h4>
                            <p className="text-xs text-slate-500 mt-0.5">Occupants count: <span className="font-extrabold text-slate-700">{selectedHouse.memberCount} members</span> | Direct Status: <span className="font-extrabold text-slate-750 uppercase">{selectedHouse.screeningStatus}</span></p>
                          </div>

                          <div className="flex items-center gap-2 select-none">
                            <button
                              onClick={() => {
                                setManualPatientForm({
                                  name: selectedHouse.familyHead,
                                  age: '45',
                                  language: Language.ENGLISH,
                                  answers: {}
                                });
                                setManualEntryActive(true);
                                setSelectedHouse(null);
                              }}
                              className="bg-sky-600 text-white font-black px-4 py-2 rounded-xl text-xs hover:bg-sky-500 transition shadow"
                            >
                              Initiate Screening intake
                            </button>
                            
                            <button
                              onClick={() => setSelectedHouse(null)}
                              className="text-slate-500 text-xs hover:text-slate-800 font-bold bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl"
                            >
                              Close info
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* RIGHT SIDE: Screening Registry Database Ledger of Patients */}
                    <div className="lg:col-span-4 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between overflow-hidden relative">
                      
                      <div className="space-y-4 flex-1 flex flex-col h-full overflow-hidden">
                        <div className="border-b border-slate-100 pb-3 select-none">
                          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Village Screening Registry</h3>
                          <p className="text-[10px] text-slate-400 mt-0.5">Track early diabetics and high hypertensive residents on file.</p>
                        </div>

                        {/* Search and filter controls */}
                        <div className="space-y-2">
                          <div className="relative">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                            <input
                              type="text"
                              className="w-full border border-slate-200 rounded-xl pl-9 pr-4 py-1.5 text-xs focus:outline-sky-500"
                              placeholder="Search by registered name or ID..."
                              value={ashaSearchQuery}
                              onChange={(e) => setAshaSearchQuery(e.target.value)}
                            />
                          </div>

                          <div className="flex gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-200 select-none">
                            {(['all', 'high', 'medium', 'low'] as const).map((r) => (
                              <button
                                key={r}
                                onClick={() => setAshaRiskFilter(r)}
                                className={`flex-1 py-1 text-[9px] font-black uppercase rounded transition ${
                                  ashaRiskFilter === r 
                                    ? 'bg-white text-sky-600 shadow-sm' 
                                    : 'text-slate-400 hover:text-slate-800'
                                }`}
                              >
                                {r}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Patient Master list mapping */}
                        <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[300px]">
                          {getFilteredPatients().length === 0 ? (
                            <div className="text-center py-10 space-y-2 select-none">
                              <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                              <p className="text-xs text-slate-400 font-medium">No matching screening files recorded on this Sector segment.</p>
                            </div>
                          ) : (
                            getFilteredPatients().map((patient) => {
                              
                              let pillBg = "bg-emerald-50 text-emerald-700 border-emerald-200";
                              if (patient.riskFactor === 'high') {
                                pillBg = "bg-rose-50 text-rose-700 border-rose-200";
                              } else if (patient.riskFactor === 'medium') {
                                pillBg = "bg-amber-50 text-amber-700 border-amber-200";
                              }

                              return (
                                <div
                                  key={patient.id}
                                  onClick={() => setSelectedDossierPatient(patient)}
                                  className={`p-3 rounded-xl border transition cursor-pointer flex flex-col gap-2 ${
                                    selectedDossierPatient?.id === patient.id 
                                      ? 'bg-sky-50/50 border-sky-500 shadow-sm' 
                                      : 'bg-white hover:bg-slate-50 border-slate-200'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">{patient.name}</h4>
                                      <p className="text-[10px] text-slate-400">ID: {patient.id} • {patient.age} Yrs</p>
                                    </div>
                                    <span className={`text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full border ${pillBg}`}>
                                      {patient.riskFactor} Risk
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between text-[9px] text-slate-400 border-t border-slate-100 pt-1">
                                    <span>Sugar: {patient.predictions.diabetesRisk.toUpperCase()} risk</span>
                                    <span>BP: {patient.predictions.hypertensionRisk.toUpperCase()} risk</span>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>

                      </div>

                    </div>

                  </div>

                  {/* HIGH FIDELITY CLINICAL INTEGRATION: REFERRAL REFERRAL LOGS & OFFLINE METRIC */}
                  {selectedDossierPatient && (
                    <motion.div
                      id="active-dossier-root"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-6"
                    >
                      
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-3 border-b border-slate-100 gap-4">
                        <div>
                          <span className="text-[10px] tracking-widest font-black uppercase text-slate-400">Verified Patient Dossier</span>
                           <h3 className="text-xl font-black text-slate-800 uppercase">
                            {selectedDossierPatient.name} ({selectedDossierPatient.age} Years Option Record)
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">Diagnostic Index Score: <span className="font-bold text-sky-600 font-mono">{selectedDossierPatient.riskScore}</span> / 100 • Method: <span className="font-bold text-slate-700">{selectedDossierPatient.language === 'kn' ? 'KANNADA INTERACTIVE' : 'ENGLISH INTERACTIVE'}</span></p>
                        </div>

                        <div className="flex items-center gap-3 select-none">
                          <button
                            onClick={() => {
                              // Simulate immediate record prints
                              triggerToast("Initializing patient diagnostics dossier download...");
                              downloadDoctorReport();
                            }}
                            className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-2 px-4 text-xs font-bold transition flex items-center gap-1.5"
                          >
                            <Download className="w-4 h-4" />
                            DOWNLOAD MEDICAL DOSSIER FILE
                          </button>
                          
                          <button
                            onClick={() => setSelectedDossierPatient(null)}
                            className="text-slate-400 hover:text-slate-800 font-black text-xs uppercase"
                          >
                            Close folder
                          </button>
                        </div>
                      </div>

                      {/* CLOSED LOOP CLINICAL STATUS INDICATOR & CORE METRICS PANEL */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-sky-50/50 border border-sky-100 rounded-2xl select-none">
                        <div className="space-y-1">
                          <span className="text-[9px] font-black uppercase text-slate-400">Current Monitoring Status</span>
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full animate-ping ${
                              selectedDossierPatient.vitals?.status?.toLowerCase().includes('critical') || selectedDossierPatient.riskFactor === 'high'
                                ? 'bg-rose-550' 
                                : selectedDossierPatient.vitals?.status?.toLowerCase().includes('monitoring') || selectedDossierPatient.riskFactor === 'medium'
                                ? 'bg-amber-500' 
                                : 'bg-emerald-500'
                            }`} />
                            <p className="text-xs font-black uppercase text-slate-850 leading-tight">
                              {selectedDossierPatient.vitals?.status || (selectedDossierPatient.riskFactor === 'high' ? 'CRITICAL ACTIONS REQUIRED' : selectedDossierPatient.riskFactor === 'medium' ? 'MONITORING REQUIRED' : 'STABLE')}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[9px] font-black uppercase text-slate-400 font-bold">Clinical Disease Classification</span>
                          <div className="space-y-0.5">
                            <p className="text-[11px] font-bold text-slate-700">
                              Diabetes: <span className="text-sky-700 font-extrabold">{selectedDossierPatient.vitals?.diabetesClassification || classifyDiabetes(selectedDossierPatient.bloodSugar)}</span>
                            </p>
                            <p className="text-[11px] font-bold text-slate-700">
                              BP: <span className="text-sky-700 font-extrabold">{selectedDossierPatient.vitals?.bpClassification || classifyHypertension(selectedDossierPatient.systolicBP, selectedDossierPatient.diastolicBP)}</span>
                            </p>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[9px] font-black uppercase text-slate-400">Triage Risk & Score</span>
                          <div className="flex items-baseline gap-1 mt-0.5">
                            <span className="text-sm font-black text-slate-800">{selectedDossierPatient.vitals?.riskPercentage || selectedDossierPatient.riskScore}%</span>
                            <span className={`text-[9px] font-black uppercase px-2 py-0.2 rounded border ${
                              selectedDossierPatient.riskFactor === 'high' ? 'bg-rose-50 text-rose-700 border-rose-150' : 'bg-emerald-50 text-emerald-700 border-emerald-150'
                            }`}>
                              {selectedDossierPatient.riskFactor} Risk
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[9px] font-black uppercase text-slate-400 font-bold">Next Scheduled Field Re-Check</span>
                          <p className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5 mt-0.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {selectedDossierPatient.vitals?.nextScheduledDays ? `In ${selectedDossierPatient.vitals.nextScheduledDays} days` : 'Annually (Check-Up)'} 
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        
                        {/* Clinical metrics checklist card */}
                        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-4">
                          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <Activity className="w-4 h-4 text-sky-600" />
                            Screening Analysis Index
                          </h4>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between items-center py-1.5 border-b border-slate-200 text-xs text-slate-600">
                              <span>Hyperglycemia (Sugar) risk:</span>
                              <span className={`font-bold uppercase ${
                                selectedDossierPatient.predictions.diabetesRisk === 'high' ? 'text-rose-600' : 'text-slate-800'
                              }`}>{selectedDossierPatient.predictions.diabetesRisk}</span>
                            </div>

                            <div className="flex justify-between items-center py-1.5 border-b border-slate-200 text-xs text-slate-600">
                              <span>Hypertension (BP) risk:</span>
                              <span className={`font-bold uppercase ${
                                selectedDossierPatient.predictions.hypertensionRisk === 'high' ? 'text-rose-600' : 'text-slate-800'
                              }`}>{selectedDossierPatient.predictions.hypertensionRisk}</span>
                            </div>

                            <div className="flex justify-between items-center py-1.5 text-xs text-slate-600">
                              <span>Database status:</span>
                              <span className={`font-bold ${
                                selectedDossierPatient.synced ? 'text-emerald-600' : 'text-amber-500'
                              }`}>{selectedDossierPatient.synced ? 'Synced Online' : 'Cached Pending Sync'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Interactive guidance messaging loop */}
                        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-4 flex flex-col justify-between">
                          <div className="space-y-2">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                              <MessageSquare className="w-4 h-4 text-sky-600" />
                              Contact & Guidance Dispatcher
                            </h4>
                            <p className="text-[11px] text-slate-500">Provide direct recommendations which populate into patient diagnostics reports immediately.</p>
                          </div>

                          <div className="space-y-2">
                            {/* Message Log display stream */}
                            {(selectedDossierPatient as any).guidanceLog && (selectedDossierPatient as any).guidanceLog.length > 0 && (
                              <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-[10px] space-y-1.5 max-h-24 overflow-y-auto">
                                <p className="font-bold text-slate-400 uppercase tracking-wider">Active Guidances Dispatched:</p>
                                {(selectedDossierPatient as any).guidanceLog.map((log: any) => (
                                  <div key={log.id} className="border-t border-slate-100 pt-1.5">
                                    <span className="font-extrabold text-slate-700">{log.sender}</span>: "{log.text}"
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="flex gap-2">
                              <input
                                type="text"
                                className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-sky-500"
                                placeholder="Type medical instructions (e.g., take fasting sugar test on PHC camp...)"
                                value={guidanceMessageText}
                                onChange={(e) => setGuidanceMessageText(e.target.value)}
                              />
                              <button
                                onClick={() => sendClinicalGuidanceMessage(selectedDossierPatient.id)}
                                className="bg-slate-900 text-white rounded-lg px-3 py-1.5 text-xs font-bold hover:bg-slate-800 transition"
                              >
                                Send
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Screening results check details */}
                        <div className="bg-sky-50 border border-sky-100 p-4 rounded-xl space-y-2">
                          <h4 className="text-xs font-black text-sky-850 uppercase tracking-wider flex items-center gap-1">
                            <Sparkles className="w-4 h-4 text-sky-600" />
                            Clinical Recommendations Report Note
                          </h4>
                          <p className="text-xs text-sky-950 font-bold leading-relaxed italic bg-white p-3 rounded-lg border border-sky-100 shadow-sm">
                            "{selectedDossierPatient.predictions.notes}"
                          </p>
                        </div>

                      </div>

                      {/* Regional Care Team Assignation */}
                      <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl space-y-4">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-sky-600" />
                          Assigned Community Care Team
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* ASHA Worker Details Card */}
                          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start gap-3">
                            <div className="bg-sky-50 text-sky-600 p-2.5 rounded-xl shrink-0">
                              <ShieldAlert className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Primary Health Care Worker (ASHA)</p>
                              <p className="text-sm font-black text-slate-800">
                                {selectedDossierPatient.ashaWorker?.name || (selectedDossierPatient.address?.toLowerCase().includes('derlakatte') ? 'Shravya' : 'ALIA RAI')}
                              </p>
                              <p className="text-xs text-slate-500 font-mono mt-0.5">
                                ID: {selectedDossierPatient.ashaWorker?.id || (selectedDossierPatient.address?.toLowerCase().includes('derlakatte') ? '1002' : '1001')} • Area: {selectedDossierPatient.ashaWorker?.assignedArea || (selectedDossierPatient.address?.toLowerCase().includes('derlakatte') ? 'Derlakatte' : 'Ullal')}
                              </p>
                              <p className="text-xs text-slate-650 mt-1.5 flex items-center gap-1">
                                <span className="font-extrabold">PH:</span>
                                <span className="font-mono text-slate-800">{selectedDossierPatient.ashaWorker?.phone || (selectedDossierPatient.address?.toLowerCase().includes('derlakatte') ? '+91 1472583690' : '+91 1234567890')}</span>
                              </p>
                              <p className="text-[11px] text-slate-400 font-mono">
                                {selectedDossierPatient.ashaWorker?.email || (selectedDossierPatient.address?.toLowerCase().includes('derlakatte') ? 'shamithanaik247@gmail.com' : 'sanjanasahana19@gmail.com')}
                              </p>
                            </div>
                          </div>

                          {/* PHC Moderator Details Card */}
                          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start gap-3">
                            <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-xl shrink-0">
                              <HeartPulse className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">PHC Clinical Moderator</p>
                              <p className="text-sm font-black text-slate-800">
                                {selectedDossierPatient.moderator?.name || 'Kiara'}
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                Hospital: <span className="font-bold text-slate-700">Ullal Government Hospital</span>
                              </p>
                              <p className="text-xs text-slate-650 mt-1.5 flex items-center gap-1">
                                <span className="font-extrabold">PH:</span>
                                <span className="font-mono text-slate-800">{selectedDossierPatient.moderator?.phone || '+91 7894561230'}</span>
                              </p>
                              <p className="text-[11px] text-slate-400 font-mono">
                                {selectedDossierPatient.moderator?.email || 'surakshashetty359@gmail.com'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ACTIVE CLINICAL RECHECK FORM & PROGRESSION SUMMARY */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch border-t border-slate-100 pt-6">
                        
                        {/* Dynamic Health progression sparklogs visualizer */}
                        <div className="md:col-span-6 bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-200 pb-2 select-none">
                            <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                              <LineChart className="w-4 h-4 text-sky-600" />
                              Visual Disease Progression Timeline
                            </h4>
                            <span className="text-[9px] font-mono text-slate-400">Past Screening Records</span>
                          </div>

                          {/* Historical Timeline List */}
                          <div className="space-y-2.5 max-h-[170px] overflow-y-auto pr-1">
                            {screeningsHistory.filter(e => e.patientId === selectedDossierPatient.id).length === 0 ? (
                              <p className="text-xs text-slate-400 italic text-center py-6">No previous clinical update records found for this patient.</p>
                            ) : (
                              screeningsHistory
                                .filter(e => e.patientId === selectedDossierPatient.id)
                                .map((historyItem, idx) => {
                                  const v = historyItem.riskResults?.vitals;
                                  return (
                                    <div key={historyItem.id} className="bg-white p-3 rounded-lg border border-slate-250 text-xs flex items-center justify-between gap-4 shadow-sm">
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-[9px] font-mono text-slate-500 font-bold">{new Date(historyItem.timestamp).toLocaleDateString()}</span>
                                          <span className={`text-[8px] px-1.5 py-0.2 rounded font-black uppercase tracking-wider border ${
                                            historyItem.riskResults.riskFactor === 'high' ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                          }`}>{historyItem.riskResults.riskFactor} Risk</span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 font-bold leading-tight">
                                          Logs: {historyItem.riskResults.predictions?.notes}
                                        </p>
                                      </div>

                                      <div className="text-right shrink-0 select-none">
                                        {v?.bloodSugar !== undefined && (
                                          <p className="text-[10px] font-extrabold text-slate-700 font-mono">Sugar: {v.bloodSugar} mg/dL</p>
                                        )}
                                        {v?.systolicBP !== undefined && (
                                          <p className="text-[10px] font-extrabold text-slate-700 font-mono">BP: {v.systolicBP}/{v.diastolicBP} mmHg</p>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })
                            )}
                          </div>
                        </div>

                        {/* Interactive outreach re-screening form */}
                        <div className="md:col-span-6 bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4">
                          <div className="border-b border-slate-200 pb-2 flex items-center justify-between select-none">
                            <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5 font-bold">
                              <HeartPulse className="w-4 h-4 text-emerald-600 animate-pulse" />
                              Log Scheduled Recheck / Revisit
                            </h4>
                            <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase">ASHA Visit</span>
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="text-[9px] font-extrabold uppercase text-slate-500 block mb-1">Sugar (mg/dL)</label>
                              <input
                                type="number"
                                className="w-full bg-white border border-slate-250 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:outline-sky-500"
                                value={dossierBloodSugar}
                                onChange={(e) => setDossierBloodSugar(e.target.value)}
                                placeholder="eg. 140"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] font-extrabold uppercase text-slate-500 block mb-1">Sys BP (mmHg)</label>
                              <input
                                type="number"
                                className="w-full bg-white border border-slate-250 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:outline-sky-500"
                                value={dossierSystolicBP}
                                onChange={(e) => setDossierSystolicBP(e.target.value)}
                                placeholder="eg. 130"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] font-extrabold uppercase text-slate-500 block mb-1">Dia BP (mmHg)</label>
                              <input
                                type="number"
                                className="w-full bg-white border border-slate-250 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:outline-sky-500"
                                value={dossierDiastolicBP}
                                onChange={(e) => setDossierDiastolicBP(e.target.value)}
                                placeholder="eg. 85"
                              />
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              if (!dossierBloodSugar && !dossierSystolicBP && !dossierDiastolicBP) {
                                triggerToast("Wait: please input sugar or BP values to register a revisit screening.");
                                return;
                              }
                              processClosingLoopForVitals(
                                selectedDossierPatient.id,
                                selectedDossierPatient.name,
                                dossierBloodSugar,
                                dossierSystolicBP,
                                dossierDiastolicBP,
                                selectedDossierPatient,
                                true
                              );
                              setDossierBloodSugar('');
                              setDossierSystolicBP('');
                              setDossierDiastolicBP('');
                            }}
                            className="w-full py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white text-xs font-black tracking-wider uppercase rounded-xl transition shadow flex items-center justify-center gap-1.5 cursor-pointer select-none"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                            SAVE CLINICAL VISIT AND PROGRESS CLOSED LOOP
                          </button>
                        </div>

                      </div>

                    </motion.div>
                  )}

                  {/* HIGH FIDELITY CLINICAL INTEGRATION: PHC CASE REFERRALS & MODERATOR EMAIL DIGEST */}
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6 font-sans mt-6"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4 select-none">
                      <div>
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                          <HeartPulse className="w-5 h-5 text-rose-500 animate-pulse" />
                          PHC Case Referrals & Moderator Clinical Digest
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Segregated diagnostic dossiers compiled from active <b>{ashaWorker?.assignedArea || 'Ullal'}</b> household screening runs.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-[11px] bg-slate-100 text-slate-600 py-1 px-3 rounded-lg border border-slate-200">
                        <span>Sector Coverage:</span>
                        <span className="font-bold text-sky-600 uppercase">{ashaWorker?.assignedArea || 'Ullal'}</span>
                      </div>
                    </div>

                    {/* Operational summary panels showing case counts */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {/* Diabetes Only card */}
                      <div className="bg-amber-50/50 hover:bg-amber-50 p-4 rounded-xl border border-amber-100/80 transition shadow-sm">
                        <span className="text-[9px] font-black uppercase text-amber-500 tracking-wider">Group A: Diabetes Only</span>
                        <div className="flex items-baseline gap-1.5 mt-1">
                          <span className="text-2xl font-black text-slate-800">
                            {getSegregatedPatientsForEmail().diabetesList.length}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">cases matched</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 leading-normal">Elevated hyperglycemia, normal baseline vitals.</p>
                      </div>

                      {/* Hypertension Only card */}
                      <div className="bg-blue-50/50 hover:bg-blue-50 p-4 rounded-xl border border-blue-100/80 transition shadow-sm">
                        <span className="text-[9px] font-black uppercase text-blue-500 tracking-wider">Group B: Hypertension Only</span>
                        <div className="flex items-baseline gap-1.5 mt-1">
                          <span className="text-2xl font-black text-slate-800">
                            {getSegregatedPatientsForEmail().hypertensionList.length}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">cases matched</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 leading-normal">High diastolic/systolic pressure profile.</p>
                      </div>

                      {/* Both diabetes and hypertension comorbid card */}
                      <div className="bg-purple-50/50 hover:bg-purple-50 p-4 rounded-xl border border-purple-100/80 transition shadow-sm">
                        <span className="text-[9px] font-black uppercase text-purple-600 tracking-wider">Group C: Co-morbid (Both)</span>
                        <div className="flex items-baseline gap-1.5 mt-1">
                          <span className="text-2xl font-black text-slate-800">
                            {getSegregatedPatientsForEmail().comorbidList.length}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">cases matched</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 leading-normal">Severe double-risk category. Prioritized follow-ups.</p>
                      </div>

                      {/* Total area caseload */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Direct Regional Reach</span>
                        <div className="flex items-baseline gap-1.5 mt-1">
                          <span className="text-2xl font-black text-slate-800">
                            {getSegregatedPatientsForEmail().totalCount}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">total files</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 leading-normal">Registered community screening profiles.</p>
                      </div>
                    </div>

                    {/* Integrated patient list and tabular segregation view */}
                    <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                      <div className="bg-slate-100/50 px-4 py-2 text-[10px] font-black uppercase text-slate-500 tracking-widest border-b border-slate-200">
                        Referrals Classification Breakdown Index
                      </div>
                      
                      <div className="p-4 space-y-4 max-h-[300px] overflow-y-auto">
                        {/* Group A Display */}
                        <div className="space-y-1.5 pb-3 border-b border-slate-200/60">
                          <p className="text-[10px] font-bold text-amber-600 uppercase flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                            Diabetes referrals ({getSegregatedPatientsForEmail().diabetesList.length} cases)
                          </p>
                          {getSegregatedPatientsForEmail().diabetesList.length === 0 ? (
                            <p className="text-xs text-slate-450 italic pl-3">No active isolated diabetes cases recorded.</p>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-3">
                              {getSegregatedPatientsForEmail().diabetesList.map(p => (
                                <div key={p.id} className="bg-white p-2 rounded-lg border border-slate-150 text-xs flex justify-between items-center">
                                  <div>
                                    <span className="font-extrabold uppercase text-slate-755">{p.name}</span>
                                    <span className="text-[10px] text-slate-400 ml-1">({p.age} Yrs)</span>
                                  </div>
                                  <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-black">Score: {p.riskScore}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Group B Display */}
                        <div className="space-y-1.5 pb-3 border-b border-slate-200/60">
                          <p className="text-[10px] font-bold text-blue-600 uppercase flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                            Hypertension referrals ({getSegregatedPatientsForEmail().hypertensionList.length} cases)
                          </p>
                          {getSegregatedPatientsForEmail().hypertensionList.length === 0 ? (
                            <p className="text-xs text-slate-455 italic pl-3">No active isolated hypertension cases recorded.</p>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-3">
                              {getSegregatedPatientsForEmail().hypertensionList.map(p => (
                                <div key={p.id} className="bg-white p-2 rounded-lg border border-slate-150 text-xs flex justify-between items-center">
                                  <div>
                                    <span className="font-extrabold uppercase text-slate-755">{p.name}</span>
                                    <span className="text-[10px] text-slate-400 ml-1">({p.age} Yrs)</span>
                                  </div>
                                  <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-black">Score: {p.riskScore}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Group C Display */}
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-bold text-purple-600 uppercase flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                            Co-morbid High Vulnerability referrals ({getSegregatedPatientsForEmail().comorbidList.length} cases)
                          </p>
                          {getSegregatedPatientsForEmail().comorbidList.length === 0 ? (
                            <p className="text-xs text-slate-455 italic pl-3">No active comorbid double-risk cases recorded.</p>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-3">
                              {getSegregatedPatientsForEmail().comorbidList.map(p => (
                                <div key={p.id} className="bg-white p-2 rounded-[10px] border border-slate-200 text-xs flex justify-between items-center shadow-xs">
                                  <div>
                                    <span className="font-black uppercase text-purple-800">{p.name}</span>
                                    <span className="text-[10px] text-slate-400 ml-1">({p.age} Yrs)</span>
                                  </div>
                                  <span className="font-mono text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.2 rounded font-black">Score: {p.riskScore}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Moderator email transmission configurations form */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
                      <div className="md:col-span-4 space-y-1.5">
                        <label className="text-xs font-black uppercase tracking-wider text-slate-450 block">Moderator Destination Email</label>
                        <input 
                          type="email"
                          value={moderatorEmail}
                          onChange={(e) => setModeratorEmail(e.target.value)}
                          placeholder="surakshashetty359@gmail.com"
                          className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold focus:outline-sky-500"
                        />
                      </div>

                      <div className="md:col-span-5 space-y-1.5">
                        <label className="text-xs font-black uppercase tracking-wider text-slate-450 block">Special Clinical Comments / Directives</label>
                        <input 
                          type="text"
                          value={emailCustomMessage}
                          onChange={(e) => setEmailCustomMessage(e.target.value)}
                          placeholder="Add special instructions (e.g. Prioritize house 14 referral for diagnostic camp...)"
                          className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-medium focus:outline-sky-500"
                        />
                      </div>

                      <div className="md:col-span-3">
                        <button
                          type="button"
                          disabled={isSendingEmailDigest}
                          onClick={handleSendDigestEmail}
                          className="w-full bg-emerald-600 text-white font-black py-3 px-4 rounded-xl text-xs uppercase tracking-wider shadow-md hover:bg-emerald-500 hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-2 disabled:bg-slate-300 disabled:cursor-not-allowed"
                        >
                          <Send className="w-3.5 h-3.5 text-white" />
                          {isSendingEmailDigest ? "Assembling Packet..." : "Compile & Email Moderator"}
                        </button>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-450 font-mono text-center">
                      🔒 All transmissions undergo encrypted compliance mapping for patient data protection and security protocol.
                    </p>
                  </motion.div>

                </div>
              )}

            </div>
          )}
        </div>

        {/* Global Footer Area matching Geometric Balance details styling */}
        <footer className="h-16 bg-white border-t border-slate-200 px-8 flex items-center justify-between text-xs select-none shrink-0">
          <div className="flex items-center space-x-6">
          </div>
        </footer>

      </main>

    </div>
  );
}
