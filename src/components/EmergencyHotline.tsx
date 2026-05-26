import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Phone, 
  PhoneCall, 
  PhoneOff, 
  ShieldAlert, 
  Volume2, 
  VolumeX, 
  MapPin, 
  User, 
  Activity, 
  Plus, 
  X, 
  Clock, 
  HeartPulse, 
  Mic, 
  MicOff,
  AlertTriangle,
  Sparkles,
  Volume1,
  Send
} from 'lucide-react';
import { Language } from '../types';

interface EmergencyHotlineProps {
  selectedLang: Language;
  patientAddress?: string;
  voiceEnabled?: boolean;
}

export const EmergencyHotline: React.FC<EmergencyHotlineProps> = ({
  selectedLang = Language.ENGLISH,
  patientAddress = '',
  voiceEnabled = true,
}) => {
  // Sector selection: auto-detect based on patientAddress prop if it matches
  const detectSector = (): 'ullal' | 'derlakatte' | 'phc' => {
    const address = patientAddress.toLowerCase();
    if (address.includes('ullal')) return 'ullal';
    if (address.includes('derlakatte')) return 'derlakatte';
    return 'phc';
  };

  const [activeSector, setActiveSector] = useState<'ullal' | 'derlakatte' | 'phc'>(detectSector());
  const [dialedNumber, setDialedNumber] = useState('');
  const [isCalling, setIsCalling] = useState(false);
  const [callStatus, setCallStatus] = useState<'connecting' | 'ringing' | 'connected' | 'disconnected'>('disconnected');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callerName, setCallerName] = useState('');
  const [callRole, setCallRole] = useState<'ASHA worker' | 'Hospital Emergency' | 'Central PHC Dispatch'>('ASHA worker');
  const [callTranscripts, setCallTranscripts] = useState<{ sender: 'them' | 'you'; text: string; time: string }[]>([]);
  const [showManualDialer, setShowManualDialer] = useState(false);
  const [userSpeechInput, setUserSpeechInput] = useState('');
  const [isUserSpeakingSimulated, setIsUserSpeakingSimulated] = useState(false);

  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Update sector automatically if address prop changes
  useEffect(() => {
    setActiveSector(detectSector());
  }, [patientAddress]);

  // Translate helpers
  const t = (en: string, kn: string) => (selectedLang === Language.KANNADA ? kn : en);

  // Emergency contact directories
  const contacts = {
    ullal: {
      asha: {
        id: '1001',
        name: 'Alia Rai',
        phone: '+91 12345 67890',
        role: 'ASHA Officers Group Lead',
        hospital: 'Ullal Government Hospital'
      },
      hospital: {
        name: 'Ullal Government Hospital & Emergency Triage',
        phone: '+91 99999 10801',
        ambulanceStatus: '2 Ambulances Standby'
      }
    },
    derlakatte: {
      asha: {
        id: '1002',
        name: 'Shravya',
        phone: '+91 14725 83690',
        role: 'ASHA Sector Supervisor',
        hospital: 'Ullal Sector Subcenter (Derlakatte)'
      },
      hospital: {
        name: 'Ullal Sector Subcenter Trauma Unit',
        phone: '+91 99999 10802',
        ambulanceStatus: '1 Rapid Ambulance Active'
      }
    },
    phc: {
      asha: {
        name: 'PHC Emergency Response Desk',
        phone: '108',
        role: 'Centralized Health Helpline',
        hospital: 'District Core PHC Base Center'
      },
      hospital: {
        name: 'District Core PHC Base Center',
        phone: '+91 99999 10800',
        ambulanceStatus: 'Specialist ICU Fleet Available'
      }
    }
  };

  // Synthesize Phone tones via Web Audio API 
  const playTone = (freq1: number, freq2: number, durationMs: number, gainVal: number = 0.08) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      
      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc1.frequency.value = freq1;
      osc2.frequency.value = freq2;

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(gainVal, ctx.currentTime + 0.05);
      gainNode.gain.setValueAtTime(gainVal, ctx.currentTime + (durationMs / 1000) - 0.05);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + (durationMs / 1000));

      osc1.start();
      osc2.start();

      setTimeout(() => {
        try {
          osc1.stop();
          osc2.stop();
          ctx.close();
        } catch (e) {}
      }, durationMs);
    } catch (e) {
      console.warn('Tone synth blocked or unsupported', e);
    }
  };

  const playDialBeep = () => {
    // DTMF dual-tone simulation
    playTone(697, 1209, 150, 0.08); 
  };

  const playRingTone = () => {
    // Phone ring: 440Hz + 480Hz for 1.8 seconds
    playTone(440, 480, 1800, 0.05);
  };

  const playDisconnectBeeps = () => {
    // 3 brief high tones
    playTone(425, 425, 200, 0.08);
    setTimeout(() => playTone(425, 425, 200, 0.08), 300);
    setTimeout(() => playTone(425, 425, 200, 0.08), 600);
  };

  // Speaks response via SpeechSynthesis
  const speakClinicalResponse = (text: string) => {
    if (!voiceEnabled) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = selectedLang === Language.KANNADA ? 'kn-IN' : 'en-IN';
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis error", e);
    }
  };

  // Dial Pad key click
  const handleKeyClick = (key: string) => {
    if (dialedNumber.length < 15) {
      setDialedNumber(prev => prev + key);
      playDialBeep();
    }
  };

  const handleBackspace = () => {
    setDialedNumber(prev => prev.slice(0, -1));
    playDialBeep();
  };

  // Initiate calling simulation
  const initiateCall = (target: 'asha' | 'hospital', forceNumber?: string) => {
    setIsCalling(true);
    setCallStatus('connecting');
    setCallDuration(0);
    setCallTranscripts([]);
    
    // Determine info based on target and number
    let targetName = '';
    let targetRole: 'ASHA worker' | 'Hospital Emergency' | 'Central PHC Dispatch' = 'ASHA worker';
    let targetPhone = '';

    if (forceNumber) {
      targetPhone = forceNumber;
      if (forceNumber === '108') {
        targetName = t('District Emergency Dispatch', 'ಜಿಲ್ಲಾ ತುರ್ತು ರವಾನೆ ಸೇವೆ');
        targetRole = 'Central PHC Dispatch';
      } else if (forceNumber.includes('12345') || forceNumber.includes('1001')) {
        targetName = 'Alia Rai';
        targetRole = 'ASHA worker';
      } else if (forceNumber.includes('14725') || forceNumber.includes('1002')) {
        targetName = 'Shravya';
        targetRole = 'ASHA worker';
      } else if (forceNumber.includes('10801')) {
        targetName = 'Ullal Government Hospital';
        targetRole = 'Hospital Emergency';
      } else if (forceNumber.includes('10802')) {
        targetName = 'Derlakatte Trauma Subcenter';
        targetRole = 'Hospital Emergency';
      } else {
        targetName = t('Primary Health Center (PHC)', 'ಪ್ರಾಥಮಿಕ ಆರೋಗ್ಯ ಕೇಂದ್ರ (PHC)');
        targetRole = 'Central PHC Dispatch';
      }
    } else {
      const activeData = contacts[activeSector];
      if (target === 'asha') {
        targetName = activeData.asha.name;
        targetPhone = activeData.asha.phone;
        targetRole = activeSector === 'phc' ? 'Central PHC Dispatch' : 'ASHA worker';
      } else {
        targetName = activeData.hospital.name;
        targetPhone = activeData.hospital.phone;
        targetRole = 'Hospital Emergency';
      }
    }

    setCallerName(targetName);
    setCallRole(targetRole);
    setDialedNumber(targetPhone);

    // Speed beep sound sequence
    playDialBeep();
    setTimeout(() => playDialBeep(), 180);
    setTimeout(() => playDialBeep(), 360);

    // Phase 1: Connecting (rings after 1 second)
    setTimeout(() => {
      setCallStatus('ringing');
      playRingTone();

      // Phase 2: Open dialog (connected after 3 seconds)
      setTimeout(() => {
        setCallStatus('connected');
        
        // Start duration ticker
        durationTimerRef.current = setInterval(() => {
          setCallDuration(prev => prev + 1);
        }, 1000);

        // Generate customized responsive speech context based on medical triage guidelines
        let initialReply = '';
        if (targetRole === 'ASHA worker') {
          initialReply = t(
            `Hello, this is ASHA officer ${targetName} speaking. If you are experiencing high sugar, blood-pressure crisis, or chest discomfort, remain calm. I am notifying the PHC base hospital, and I will head to your area right now. How are you feeling currently?`,
            `ನಮಸ್ಕಾರ, ನಾನು ಆಶಾ ಕಾರ್ಯಕರ್ತೆ ${targetName} ಮಾತನಾಡುತ್ತಿದ್ದೇನೆ. ನಿಮಗೆ ತೀವ್ರ ಸಕ್ಕರೆ ಕಾಯಿಲೆ, ರಕ್ತದೊತ್ತಡದ ತೊಂದರೆ ಅಥವಾ ಎದೆ ನೋವು ಇದ್ದರೆ ಗಾಬರಿಯಾಗಬೇಡಿ. ನಾನು ಪ್ರಾಥಮಿಕ ಆರೋಗ್ಯ ಕೇಂದ್ರಕ್ಕೆ ತಿಳಿಸಿ, ತಕ್ಷಣ ನಿಮ್ಮ ಮನೆಗೆ ಹೊರಡುತ್ತಿದ್ದೇನೆ. ಈಗ ಹೇಗಿದೆ ನಿಮ್ಮ ಆರೋಗ್ಯ?`
          );
        } else if (targetRole === 'Hospital Emergency') {
          initialReply = t(
            `Emergency Triage Desk here. We coordinates Sector ${activeSector.toUpperCase()}. Our ambulance is currently active. Please monitor vital conditions. Are they experiencing shortness of breath or dizziness?`,
            `ತುರ್ತು ಚಿಕಿತ್ಸಾ ವಿಭಾಗ. ನಾವು ${activeSector.toUpperCase()} ವಲಯದ ತೊಂದರೆಗಳನ್ನು ನಿರ್ವಹಿಸುತ್ತಿದ್ದೇವೆ. ನಮ್ಮ ಆ್ಯಂಬುಲೆನ್ಸ್ ಸಿದ್ಧವಾಗಿದೆ. ರೋಗಿಯ ಉಸಿರಾಟದ ತೊಂದರೆ ಅಥವಾ ತಲೆಸುತ್ತು ಜಾಸ್ತಿ ಆಗಿದೆಯೇ? ವಿವರ ತಿಳಿಸಿ.`
          );
        } else {
          initialReply = t(
            `108 Central PHC Health Helpline. State your village sector and main health complaints immediately. We are alerting the closest local ASHA supervisor to coordinate rapid home care.`,
            `೧೦೮ ಜಿಲ್ಲಾ ಆರೋಗ್ಯ ಹೆಲ್ಪ್‌ಲೈನ್. ನಿಮ್ಮ ಊರು ಮತ್ತು ತೊಂದರೆಯನ್ನು ತಕ್ಷಣ ತಿಳಿಸಿ. ನಾವು ಹತ್ತಿರದ ಆಶಾ ಕಾರ್ಯಕರ್ತರಿಗೆ ಶೀಘ್ರ ಭೇಟಿಗೆ ಆದೇಶಿಸುತ್ತಿದ್ದೇವೆ.`
          );
        }

        setCallTranscripts([{
          sender: 'them',
          text: initialReply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        }]);

        // Vocalise the synthesized sound
        speakClinicalResponse(initialReply);

      }, 2500);

    }, 1000);
  };

  const endCall = () => {
    setIsCalling(false);
    setCallStatus('disconnected');
    setCallDuration(0);
    setCallTranscripts([]);
    setUserSpeechInput('');
    window.speechSynthesis?.cancel();

    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }

    playDisconnectBeeps();
  };

  // Simulate speaking back to the emergency dispatcher
  const submitSpeechSimulation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userSpeechInput.trim()) return;

    const userText = userSpeechInput.trim();
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    // Add user question to transcript list
    const updatedLogs = [
      ...callTranscripts,
      { sender: 'you', text: userText, time: currentTime }
    ];
    setCallTranscripts(updatedLogs);
    setUserSpeechInput('');
    setIsUserSpeakingSimulated(true);

    // Simulate smart dispatcher automated response rules after 1.5 seconds
    setTimeout(() => {
      setIsUserSpeakingSimulated(false);
      let autoReply = '';
      const promptLower = userText.toLowerCase();

      if (promptLower.includes('breathing') || promptLower.includes('shortness') || promptLower.includes('breath') || promptLower.includes('chest') || promptLower.includes('ನೋವು') || promptLower.includes('ಉಸಿರಾಟ')) {
        autoReply = t(
          "Understood, this is highly critical. Please keep their head elevated and lay them down comfortably. An immediate ambulance is being routed, and local base center ASHA worker is dispatched with a digital screening kits on high alert.",
          "ತಿಳಿಯಿತು, ಇದು ಗಂಭೀರವಾಗಿದೆ. ದಯವಿಟ್ಟು ರೋಗಿಯನ್ನು ಆರಾಮವಾಗಿ ಮಲಗಿಸಿ, ತಲೆಯನ್ನು ಸ್ವಲ್ಪ ಎತ್ತರದಲ್ಲಿಡಿ. ಜಿಲ್ಲಾ ಆ್ಯಂಬುಲೆನ್ಸ್ ಹಾಗೂ ಆಶಾ ಕಾರ್ಯಕರ್ತೆ ತಕ್ಷಣ ನಿಮ್ಮ ಮನೆಗೆ ತಲುಪಲಿದ್ದಾರೆ."
        );
      } else if (promptLower.includes('sugar') || promptLower.includes('diabetes') || promptLower.includes('bp') || promptLower.includes('ರಕ್ತದೊತ್ತಡ') || promptLower.includes('ತಲೆಸುತ್ತು')) {
        autoReply = t(
          "Noted. Make sure they take a sip of water. We are updating their screening dossier on our server for immediate doctor access. Ensure they rest quietly until health worker arrives.",
          "ದಾಖಲಿಸಿಕೊಳ್ಳಲಾಗಿದೆ. ಸ್ವಲ್ಪ ನೀರು ಕುಡಿಸಿ. ನಾವು ರೋಗಿಯ ಹಳೆಯ ಗ್ಲುಕೋಸ್ ಹಾಗೂ ಬಿಪಿ ವರದಿಯನ್ನು ವೈದ್ಯರಿಗೆ ಕಳುಹಿಸಿದ್ದೇವೆ. ಕಾರ್ಯಕರ್ತೆ ಬರುವವರೆಗೆ ವಿಶ್ರಾಂತಿ ಪಡೆಯಲು ತಿಳಿಸಿ."
        );
      } else {
        autoReply = t(
          `Thank you for confirming these details. Our clinical tracking coordinates show your sector position. We have logged this distress signal to the PHC Core dashboard. Please keep this line open.`,
          `ವಿವರ ನೀಡಿದ್ದಕ್ಕೆ ಧನ್ಯವಾದಗಳು. ನಮ್ಮ ಜಿಪಿಎಸ್ ವ್ಯವಸ್ಥೆಯು ನಿಮ್ಮ ವಲಯವನ್ನು ಪತ್ತೆಹಚ್ಚಿದೆ. ವೈದ್ಯಕೀಯ ನೆರವು ತಂಡ ಶೀಘ್ರದಲ್ಲಿ ತಲುಪಲಿದೆ. ಈ ಫೋನ್ ಕರೆ ಆನ್ ಇರಲಿ.`
        );
      }

      setCallTranscripts(prev => [
        ...prev,
        { sender: 'them', text: autoReply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }
      ]);

      speakClinicalResponse(autoReply);
    }, 1800);
  };

  // Fast trigger speech suggestion
  const invokePromptSuggestion = (text: string) => {
    setUserSpeechInput(text);
  };

  // Convert duration number to format string
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
      window.speechSynthesis?.cancel();
    };
  }, []);

  return (
    <div id="patient-emergency-hotline-container" className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden font-sans">
      
      {/* Banner Indicator Bar */}
      <div className="bg-gradient-to-r from-red-600 to-rose-600 px-4 py-1.5 text-white flex items-center justify-between shadow-xs select-none">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-white animate-pulse" />
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-wider">
              {t('PHC Emergency Helpline', 'ತುರ್ತು ವೈದ್ಯಕೀಯ ಸಹಾಯವಾಣಿ')}
            </h4>
          </div>
        </div>
        <span className="text-[8px] font-bold bg-white/20 px-2 py-0.5 rounded uppercase border border-white/10 tracking-widest font-mono">
          {t('ACTIVE', 'ಸಕ್ರಿಯ')}
        </span>
      </div>

      <div className="p-3 space-y-2.5">
        {/* Step 1: Sector Mapped Coordinates */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
              <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
              {t('Sector:', 'ವಲಯ:')}
            </span>
            <div className="flex bg-slate-200/60 p-0.5 rounded">
              <button
                type="button"
                onClick={() => {
                  setActiveSector('ullal');
                  playDialBeep();
                }}
                className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase transition ${activeSector === 'ullal' ? 'bg-sky-600 text-white' : 'text-slate-600 hover:text-slate-800'}`}
              >
                Ullal
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveSector('derlakatte');
                  playDialBeep();
                }}
                className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase transition ${activeSector === 'derlakatte' ? 'bg-sky-600 text-white' : 'text-slate-600 hover:text-slate-800'}`}
              >
                Derlakatte
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveSector('phc');
                  playDialBeep();
                }}
                className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase transition ${activeSector === 'phc' ? 'bg-sky-600 text-white' : 'text-slate-600 hover:text-slate-800'}`}
              >
                108 PHC
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowManualDialer(!showManualDialer);
              playDialBeep();
            }}
            className="text-[9px] text-slate-500 hover:text-sky-600 font-bold underline"
          >
            {showManualDialer ? t('Show Mapped Contacts', 'ನಕ್ಷೆ ಸಂಪರ್ಕಗಳು') : t('Dial Pad', 'ಡಯಲ್ ಪ್ಯಾಡ್')}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {showManualDialer ? (
            /* MANUAL DIALER INTERACTION */
            <motion.div
              key="manual-dialer"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="grid grid-cols-1 md:grid-cols-12 gap-3"
            >
              {/* Dialpad Panel */}
              <div className="md:col-span-6 bg-slate-900 p-2.5 rounded-xl flex flex-col items-center">
                <div className="w-full bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 mb-2 flex items-center justify-between">
                  <span className="text-slate-500 font-mono text-[8px] uppercase font-bold">Dial:</span>
                  <div className="flex items-center gap-1 overflow-hidden">
                    <span id="manual-dialer-number" className="text-amber-500 font-mono text-sm font-black tracking-wider">{dialedNumber || '—'}</span>
                    {dialedNumber && (
                      <button 
                        onClick={handleBackspace}
                        className="text-slate-500 hover:text-slate-300 p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Key Grid 3x4 */}
                <div className="grid grid-cols-3 gap-1.5 text-white">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((k) => (
                    <button
                      key={k}
                      onClick={() => handleKeyClick(k)}
                      className="w-8 h-8 rounded-full border border-slate-800 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 transition flex items-center justify-center font-mono text-xs font-bold text-slate-100"
                    >
                      {k}
                    </button>
                  ))}
                </div>

                <div className="flex gap-1.5 w-full mt-2.5">
                  <button
                    onClick={() => setDialedNumber('')}
                    className="flex-1 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold text-[9px] uppercase border border-slate-705 transition"
                  >
                    {t('Clear', 'ಖಾಲಿ')}
                  </button>
                  <button
                    disabled={!dialedNumber}
                    onClick={() => initiateCall('hospital', dialedNumber)}
                    className="flex-1 py-1 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold text-[9px] uppercase transition flex items-center justify-center gap-1 shadow"
                  >
                    <Phone className="w-2.5 h-2.5 text-white" />
                    {t('Dial', 'ಕರೆ')}
                  </button>
                </div>
              </div>

              {/* Fast Dial Reference Cards */}
              <div className="md:col-span-6 space-y-1.5 flex flex-col justify-center">
                <p className="text-[8px] font-black uppercase text-slate-400 tracking-wider">{t('Shortcuts', 'ಶಾರ್ಟ್ ಕಟ್‌ಗಳು')}</p>
                <div 
                  onClick={() => { setDialedNumber('108'); playDialBeep(); }}
                  className="bg-red-50 hover:bg-red-100 border border-red-150 p-2 rounded-lg flex items-center justify-between cursor-pointer transition"
                >
                  <div>
                    <span className="text-[8px] font-bold uppercase bg-red-600 text-white px-1.5 py-0.2 rounded font-mono">108</span>
                    <h5 className="text-[10px] font-bold text-red-900 leading-none mt-1">{t('Ambulance Line', 'ತುರ್ತು ಆ್ಯಂಬುಲೆನ್ಸ್')}</h5>
                  </div>
                </div>

                <div 
                  onClick={() => { setDialedNumber('1001'); playDialBeep(); }}
                  className="bg-slate-50 hover:bg-sky-50 border border-slate-200 p-2 rounded-lg flex items-center justify-between cursor-pointer transition"
                >
                  <div>
                    <span className="text-[8px] font-bold uppercase bg-slate-200 text-slate-600 px-1.5 py-0.2 rounded font-mono">1001</span>
                    <h5 className="text-[10px] font-bold text-slate-800 leading-none mt-1">Alia (Ullal ASHA)</h5>
                  </div>
                </div>

                <div 
                  onClick={() => { setDialedNumber('1002'); playDialBeep(); }}
                  className="bg-slate-50 hover:bg-sky-50 border border-slate-200 p-2 rounded-lg flex items-center justify-between cursor-pointer transition"
                >
                  <div>
                    <span className="text-[8px] font-bold uppercase bg-slate-200 text-slate-600 px-1.5 py-0.2 rounded font-mono">1002</span>
                    <h5 className="text-[10px] font-bold text-slate-800 leading-none mt-1">Shravya (Derlakatte)</h5>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            /* SECTOR MAPPED MAP CONTACTS DIRECTORIES */
            <motion.div
              key="sector-contacts"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              {/* CARD A: Contact Related ASHA Welfare Officer */}
              <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl border border-slate-200 p-3 flex flex-col justify-between transition">
                <div>
                  <span className="text-[8px] text-indigo-600 font-extrabold uppercase tracking-wider block leading-none">
                    {t('SECTOR ASHA', 'ಆಶಾ ಕಾರ್ಯಕರ್ತೆ')}
                  </span>
                  <h3 className="text-xs font-black text-slate-800 mt-0.5">
                    {contacts[activeSector].asha.name}
                  </h3>
                  <p className="text-[9px] text-slate-400 font-medium leading-tight">
                    {contacts[activeSector].asha.role}
                  </p>
                  
                  <div className="bg-white/80 py-1 px-1.5 rounded border border-slate-200 mt-2 text-[9px] font-mono font-bold text-slate-600 flex items-center justify-between">
                    <span>{t('Phone:', 'ಫೋನ್:')}</span>
                    <span className="text-slate-800 font-black">{contacts[activeSector].asha.phone}</span>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center gap-1.5">
                  <button
                    onClick={() => initiateCall('asha')}
                    className="flex-1 bg-sky-600 hover:bg-sky-500 text-white py-1.5 px-2 rounded-lg font-black text-[9px] uppercase tracking-wider transition flex items-center justify-center gap-1 shadow-xs"
                  >
                    <Phone className="w-2.5 h-2.5 text-white" />
                    {t('Call ASHA', 'ಕರೆ ಮಾಡಿ')}
                  </button>
                  <a 
                    href={`tel:${contacts[activeSector].asha.phone.replace(/\s+/g, '')}`} 
                    className="bg-white hover:bg-slate-50 border border-slate-200 p-1.5 rounded-lg text-slate-500 transition"
                    title="Real Dial Link"
                  >
                    <PhoneCall className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* CARD B: Contact Nearest Referral PHC Hospital & Subcenter */}
              <div className="relative overflow-hidden bg-gradient-to-br from-red-50/20 to-red-50/70 rounded-xl border border-red-100 p-3 flex flex-col justify-between transition">
                <div>
                  <span className="text-[8px] text-red-600 font-extrabold uppercase tracking-wider block leading-none">
                    {t('REFERRAL HOSPITAL', 'ಶಿಫಾರಸು ಆಸ್ಪತ್ರೆ')}
                  </span>
                  <h3 className="text-xs font-black text-slate-850 mt-0.5 truncate">
                    {contacts[activeSector].hospital.name}
                  </h3>
                  <p className="text-[9px] text-red-700 font-bold leading-tight">
                    {contacts[activeSector].hospital.ambulanceStatus}
                  </p>
                  
                  <div className="bg-white/80 py-1 px-1.5 rounded border border-red-200/50 mt-2 text-[9px] font-mono font-bold text-slate-600 flex items-center justify-between">
                    <span>{t('Desk:', 'ತುರ್ತು ಫೋನ್:')}</span>
                    <span className="text-red-700 font-black">{contacts[activeSector].hospital.phone}</span>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center gap-1.5">
                  <button
                    onClick={() => initiateCall('hospital')}
                    className="flex-1 bg-red-600 hover:bg-red-505 text-white py-1.5 px-2 rounded-lg font-black text-[9px] uppercase tracking-wider transition flex items-center justify-center gap-1 shadow-xs"
                  >
                    <HeartPulse className="w-2.5 h-2.5 text-white" />
                    {t('Call Hospital', 'ಆಸ್ಪತ್ರೆ ಕರೆ')}
                  </button>
                  <a 
                    href={`tel:${contacts[activeSector].hospital.phone.replace(/\s+/g, '')}`} 
                    className="bg-white hover:bg-red-100 border border-red-150 p-1.5 rounded-lg text-red-600 transition"
                    title="Real Dial Link"
                  >
                    <PhoneCall className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* FULL-SCREEN ACTIVE EMERGENCY VOICE CALL OVERLAY */}
      <AnimatePresence>
        {isCalling && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/98 backdrop-blur-md z-[9999] flex flex-col justify-between p-6 md:p-8 text-white font-sans overflow-y-auto"
          >
            {/* Header / Network Status */}
            <div className="flex justify-between items-center bg-white/5 border border-white/10 rounded-2xl p-4.5 max-w-2xl mx-auto w-full select-none">
              <div className="flex items-center gap-3">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
                <div>
                  <h4 className="text-[10px] font-black text-rose-500 tracking-wider uppercase">{t('ENCRYPTED CLINICAL VOICE LINK', 'ಸುರಕ್ಷಿತ ವೈದ್ಯಕೀಯ ಧ್ವನಿ ಸಂಪರ್ಕ')}</h4>
                  <p className="text-[9px] text-slate-400 font-mono">PHC Trunk Server Node: TMK-04-A</p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[9px] font-bold bg-white/10 px-2 py-0.5 rounded tracking-wide text-slate-300 font-mono">
                  {callStatus.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Middle: Core Contact Avatar and Info */}
            <div className="flex-1 flex flex-col items-center justify-center my-6 max-w-md mx-auto w-full text-center space-y-6 select-none">
              <div className="relative flex items-center justify-center">
                {/* Visual pulse waveforms around avatar */}
                <span className={`absolute w-32 h-32 rounded-full border border-rose-500/10 ${callStatus === 'connected' ? 'animate-ping' : ''}`} style={{ animationDuration: '3s' }} />
                <span className={`absolute w-44 h-44 rounded-full border border-sky-500/10 ${callStatus === 'connected' ? 'animate-ping' : ''}`} style={{ animationDuration: '4.5s' }} />
                <span className={`absolute w-56 h-56 rounded-full border border-white/5 ${callStatus === 'connected' ? 'animate-ping' : ''}`} style={{ animationDuration: '6s' }} />

                <div className={`w-24 h-24 rounded-full flex items-center justify-center border-4 shadow-2xl transition duration-500 ${
                  callStatus === 'connected' ? 'bg-sky-600 border-sky-400/80 scale-110' : 'bg-slate-800 border-slate-700 scale-100'
                }`}>
                  {callRole === 'Hospital Emergency' ? (
                    <Activity className="w-10 h-10 text-white" />
                  ) : callRole === 'Central PHC Dispatch' ? (
                    <ShieldAlert className="w-10 h-10 text-rose-500 animate-bounce" />
                  ) : (
                    <User className="w-10 h-10 text-white" />
                  )}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest block mb-1">
                  {callRole.toUpperCase()}
                </span>
                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                  {callerName}
                </h2>
                <p className="text-xs text-slate-400 font-mono font-bold mt-1 tracking-widest">
                  {dialedNumber}
                </p>
              </div>

              {/* Call Timer Counter */}
              <div className="flex flex-col items-center gap-1 bg-white/5 px-4.5 py-2.5 rounded-2xl border border-white/10 shadow-inner">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('CALL DURATION', 'ಕರೆಯ ಅವಧಿ')}</span>
                <span className="text-lg font-bold font-mono tracking-widest text-emerald-400">
                  {callStatus === 'connected' ? formatTime(callDuration) : '00:00'}
                </span>
              </div>
            </div>

            {/* Bottom 1: Live Interactive Dialog Transcript Logs */}
            <div className="max-w-xl mx-auto w-full bg-slate-900 border border-white/10 rounded-2xl p-4.5 space-y-4 mb-6 shadow-inner">
              <div className="flex justify-between items-center pb-2.5 border-b border-white/10 select-none">
                <h5 className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                  {t('Live Interactive Speech Registry Logs', 'ನೈಜ-ಸಮಯದ ಸಂಭಾಷಣೆ ಲಾಗ್')}
                </h5>
                <span className="text-[9px] font-mono text-slate-400 text-center">
                  {t('Speak or select answers to interact', 'ಸಂಭಾಷಣೆಯನ್ನು ನಿಯಂತ್ರಿಸಿ')}
                </span>
              </div>

              {/* Speech transcript blocks */}
              <div id="emergency-speech-registry-logs" className="space-y-3.5 max-h-[160px] overflow-y-auto pr-1">
                {callTranscripts.map((log, index) => (
                  <div key={index} className={`flex flex-col ${log.sender === 'you' ? 'items-end' : 'items-start'}`}>
                    <span className="text-[8px] text-slate-500 font-mono mb-0.5">{log.time}</span>
                    <div className={`p-3 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                      log.sender === 'you' 
                        ? 'bg-sky-600 text-white rounded-tr-none' 
                        : 'bg-white/10 text-slate-100 rounded-tl-none border border-white/5'
                    }`}>
                      {log.text}
                    </div>
                  </div>
                ))}
                {isUserSpeakingSimulated && (
                  <div className="flex items-start">
                    <span className="text-[8px] text-slate-500 font-mono mb-0.5">...</span>
                    <div className="p-3 bg-white/5 border border-white/5 text-slate-400 text-xs rounded-2xl rounded-tl-none italic animate-pulse">
                      {t('Dispatcher is writing clinical note...', 'ಪ್ರತಿಕ್ರಿಯೆಯನ್ನು ಬರೆಯಲಾಗುತ್ತಿದೆ...')}
                    </div>
                  </div>
                )}
                {callTranscripts.length === 0 && (
                  <p className="text-center text-[11px] text-slate-500 italic py-4">
                    {t('Waiting to establish clinical voice link...', 'ಧ್ವನಿ ಲಿಂಕ್ ಸ್ಥಾಪನೆಗಾಗಿ ಕಾಯಲಾಗುತ್ತಿದೆ...')}
                  </p>
                )}
              </div>

              {/* Speak simulator interactive controls */}
              {callStatus === 'connected' && (
                <form onSubmit={submitSpeechSimulation} className="border-t border-white/10 pt-3 flex gap-2">
                  <input
                    type="text"
                    value={userSpeechInput}
                    onChange={(e) => setUserSpeechInput(e.target.value)}
                    placeholder={t('Type a speech answer to reply... (e.g., "Difficulty breathing")', 'ಉತ್ತರವನ್ನು ಟೈಪ್ ಮಾಡಿ... (ಉದಾಹರಣೆಗೆ "ಉಸಿರಾಟದ ತೊಂದರೆ ಇದೆ")')}
                    className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-rose-500 shadow-inner"
                  />
                  <button
                    type="submit"
                    className="bg-rose-600 hover:bg-rose-500 font-black text-[10px] uppercase tracking-wider px-3 py-2 rounded-xl transition flex items-center gap-1.5 focus:outline-none"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {t('Simulate Speak', 'ಮಾತನಾಡಿದಂತೆ ಕಳುಹಿಸಿ')}
                  </button>
                </form>
              )}

              {/* Fast interactive click-prompts representing patient distress symptoms */}
              {callStatus === 'connected' && (
                <div className="pt-2">
                  <p className="text-[8px] font-black uppercase text-slate-500 tracking-wider mb-1.5">{t('Tap distress shortcuts to speak simulated symptoms:', 'ಲಕ್ಷಣದ ಶಾರ್ಟ್‌ಕಟ್‌ಗಳನ್ನು ಒತ್ತಿ:')}</p>
                  <div className="flex flex-wrap gap-1.5">
                    <button 
                      type="button" 
                      onClick={() => invokePromptSuggestion(t("Patient has severe breathing difficulty and chest pain.", "ರೋಗಿಗೆ ತೀವ್ರ ಉಸಿರಾಟದ ತೊಂದರೆ ಮತ್ತು ಎದೆ ನೋವು ಇದೆ."))}
                      className="bg-white/5 hover:bg-white/15 text-[10px] text-zinc-300 hover:text-white px-2.5 py-1 rounded-lg transition border border-white/5 uppercase"
                    >
                      🚨 {t('Hard Breathing & Chest Pain', 'ಉಸಿರಾಟ ಮತ್ತು ಎದೆ ನೋವು')}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => invokePromptSuggestion(t("Their glucose sugar reading is dangerously high at 380 mg/dL.", "ಗ್ಲುಕೋಸ್ ಮಟ್ಟ ಅಪಾಯಕಾರಿ ಪ್ರಮಾಣದಲ್ಲಿ (೩೮೦) ಹೆಚ್ಚಾಗಿದೆ."))}
                      className="bg-white/5 hover:bg-white/15 text-[10px] text-zinc-300 hover:text-white px-2.5 py-1 rounded-lg transition border border-white/5 uppercase"
                    >
                      🩸 {t('Extreme Blood Sugar (380+)', 'ಸಕ್ಕರೆ ಕಾಯಿಲೆ ಹೆಚ್ಚಳ')}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => invokePromptSuggestion(t("Dizziness with a severe blood pressure surge of 190/110.", "ರೋಗಿಗೆ ತಲೆಸುತ್ತು ಹಾಗೂ ವಿಪರೀತ ಬಿಪಿ (೧೯೦/೧೧೦) ಇದೆ."))}
                      className="bg-white/5 hover:bg-white/15 text-[10px] text-zinc-300 hover:text-white px-2.5 py-1 rounded-lg transition border border-white/5 uppercase"
                    >
                      ❤️ {t('BP Spike & Dizziness (190+)', 'ಬಿಪಿ ಬಿಕ್ಕಟ್ಟು')}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom 2: Call Hardware Controls */}
            <div className="max-w-lg mx-auto w-full flex flex-col items-center space-y-4 select-none">
              
              <div className="flex items-center gap-6 md:gap-8 bg-white/5 rounded-full px-8 py-3.5 border border-white/10 shadow-lg justify-center w-full">
                
                {/* Control A: Mute */}
                <button
                  type="button"
                  onClick={() => {
                    setIsMuted(!isMuted);
                    playDialBeep();
                  }}
                  className={`p-3.5 rounded-full transition flex items-center justify-center border ${
                    isMuted ? 'bg-red-600 border-red-500 text-white' : 'bg-slate-800 border-slate-705 text-zinc-350 hover:bg-slate-700 hover:text-white'
                  }`}
                  title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                >
                  {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                {/* Control B: End call (Primary Center Action) */}
                <button
                  type="button"
                  onClick={endCall}
                  className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 hover:scale-105 active:scale-95 transition-all text-white flex items-center justify-center shadow-xl shadow-red-950/40 relative group"
                  title="Disconnect Emergency Call Link"
                >
                  <PhoneOff className="w-7 h-7 text-white" />
                  <span className="absolute -bottom-6 text-[9px] font-black tracking-widest text-red-500 uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                    {t('END LINK', 'ಕರೆ ಕಡಿತ')}
                  </span>
                </button>

                {/* Control C: Speaker Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    setIsSpeakerOn(!isSpeakerOn);
                    playDialBeep();
                  }}
                  className={`p-3.5 rounded-full transition flex items-center justify-center border ${
                    isSpeakerOn ? 'bg-sky-600 border-sky-500 text-white animate-pulse' : 'bg-slate-800 border-slate-705 text-zinc-350 hover:bg-slate-700 hover:text-white'
                  }`}
                  title={isSpeakerOn ? 'Use ear receiver' : 'Enable louder speakerphone'}
                >
                  {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <Volume1 className="w-5 h-5" />}
                </button>

              </div>

              <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                <span>{t('Voice lines automatically record to subcenter logs to prevent diagnostic lag.', 'ಕರೆ ರೆಕಾರ್ಡಿಂಗ್ ಹಾಗೂ ಸ್ಥಳ ಟ್ರ್ಯಾಕಿಂಗ್ ಸಕ್ರಿಯವಾಗಿದೆ')}</span>
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

// Internal Tiny Icons for local modular simplicity
const ChevronRightIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m9 18 6-6-6-6"/></svg>
);
