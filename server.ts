import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;
app.use(express.json());

// Enable highly-compatible CORS and preflight handling middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

const PATIENT_DATA_FILE = path.join(process.cwd(), 'patients.json');
const SCREENINGS_DATA_FILE = path.join(process.cwd(), 'screenings.json');
const USERS_DATA_FILE = path.join(process.cwd(), 'users.json');

// Helper to read / write users list
function getUsersList(): any[] {
  try {
    if (fs.existsSync(USERS_DATA_FILE)) {
      const raw = fs.readFileSync(USERS_DATA_FILE, 'utf-8');
      return JSON.parse(raw);
    } else {
      const seedUsers = [
        {
          id: "USR-001",
          name: "Kaveri Gowda",
          phone: "9876543210",
          role: "patient"
        },
        {
          id: "USR-002",
          name: "Manjappa Hegde",
          phone: "8765432109",
          role: "patient"
        },
        {
          id: "USR-003",
          name: "ALIA RAI",
          phone: "+91 1234567890",
          role: "asha",
          assignedArea: "Ullal",
          hospital: "Ullal Government Hospital"
        },
        {
          id: "USR-004",
          name: "Shravya",
          phone: "+91 1472583690",
          role: "asha",
          assignedArea: "Derlakatte",
          hospital: "Ullal Government Hospital"
        }
      ];
      fs.writeFileSync(USERS_DATA_FILE, JSON.stringify(seedUsers, null, 2));
      return seedUsers;
    }
  } catch (err) {
    console.error('Error reading users file, using seed data', err);
  }
  return [];
}

function saveUsersList(data: any[]) {
  try {
    fs.writeFileSync(USERS_DATA_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing users file', err);
  }
}

// Helper to read / write patients list
function getPatientsList(): any[] {
  try {
    if (fs.existsSync(PATIENT_DATA_FILE)) {
      const raw = fs.readFileSync(PATIENT_DATA_FILE, 'utf-8');
      return JSON.parse(raw);
    } else {
      const seedPatients = [
        {
          id: "PAT-1001",
          name: "Ramesh Gowda",
          age: 54,
          language: "en",
          gender: "Male",
          address: "Ullal Sea Crest Ward, Karnataka",
          riskFactor: "high",
          riskScore: 82,
          predictions: {
            diabetesRisk: "high",
            hypertensionRisk: "high",
            notes: "Immediate referral recommended for high fasting blood glucose and elevated systolic BP."
          },
          submittedAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(), // 2 days ago
          synced: true,
          ashaWorker: {
            id: "1001",
            name: "ALIA RAI",
            phone: "+91 1234567890",
            email: "sanjanasahana19@gmail.com",
            assignedArea: "Ullal",
            hospital: "Ullal Government Hospital"
          },
          answers: { "diab_adult_wound": "yes", "diab_adult_sitting": "yes", "bp_mid_stiffness": "yes" }
        },
        {
          id: "PAT-1002",
          name: "Savitha Patil",
          age: 32,
          language: "kn",
          gender: "Female",
          address: "Ullal Rural Sector A, Karnataka",
          riskFactor: "low",
          riskScore: 18,
          predictions: {
            diabetesRisk: "low",
            hypertensionRisk: "low",
            notes: "Healthy normal profile. Re-evaluate annually."
          },
          submittedAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(), // 3 days ago
          synced: true,
          ashaWorker: {
            id: "1001",
            name: "ALIA RAI",
            phone: "+91 1234567890",
            email: "sanjanasahana19@gmail.com",
            assignedArea: "Ullal",
            hospital: "Ullal Government Hospital"
          },
          answers: {}
        },
        {
          id: "PAT-1003",
          name: "Basappa Nayak",
          age: 48,
          language: "kn",
          gender: "Male",
          address: "Ullal Main Street Crossing, Karnataka",
          riskFactor: "medium",
          riskScore: 48,
          predictions: {
            diabetesRisk: "medium",
            hypertensionRisk: "low",
            notes: "Borderline blood sugar level. Enhance walking exercise."
          },
          submittedAt: new Date(Date.now() - 3600000 * 12).toISOString(), // 12 hours ago
          synced: true,
          ashaWorker: {
            id: "1001",
            name: "ALIA RAI",
            phone: "+91 1234567890",
            email: "sanjanasahana19@gmail.com",
            assignedArea: "Ullal",
            hospital: "Ullal Government Hospital"
          },
          answers: { "diab_adult_sitting": "yes" }
        },
        {
          id: "PAT-1004",
          name: "Kaveri Gowda",
          age: 52,
          language: "kn",
          gender: "Female",
          address: "Derlakatte Rural Sector B, Karnataka",
          riskFactor: "high",
          riskScore: 78,
          predictions: {
            diabetesRisk: "high",
            hypertensionRisk: "medium",
            notes: "High risk was identified during previous screening. Standard recommendations include reducing carbohydrates."
          },
          submittedAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(), // 5 days ago
          synced: true,
          ashaWorker: {
            id: "1002",
            name: "Shravya",
            phone: "+91 1472583690",
            email: "shamithanaik247@gmail.com",
            assignedArea: "Derlakatte",
            hospital: "Ullal Government Hospital"
          },
          answers: { "diab_adult_wound": "yes", "bp_mid_stiffness": "yes" }
        },
        {
          id: "PAT-1005",
          name: "Venkat Rao",
          age: 45,
          language: "en",
          gender: "Male",
          address: "Derlakatte Temple Road, Karnataka",
          riskFactor: "medium",
          riskScore: 50,
          predictions: {
            diabetesRisk: "low",
            hypertensionRisk: "medium",
            notes: "Elevated pulse and blood pressure check recommended. Monitor sugar intake."
          },
          submittedAt: new Date(Date.now() - 3600000 * 24).toISOString(), // 24 hours ago
          synced: true,
          ashaWorker: {
            id: "1002",
            name: "Shravya",
            assignedArea: "Derlakatte",
            phone: "+91 1472583690",
            email: "shamithanaik247@gmail.com",
            hospital: "Ullal Government Hospital"
          },
          answers: { "bp_mid_stress": "yes" }
        },
        {
          id: "PAT-1006",
          name: "Channaiah Swamy",
          age: 71,
          language: "kn",
          gender: "Male",
          address: "Derlakatte Green View Ward, Karnataka",
          riskFactor: "low",
          riskScore: 22,
          predictions: {
            diabetesRisk: "low",
            hypertensionRisk: "low",
            notes: "Low screened risk profile. Re-evaluate in 12 months."
          },
          submittedAt: new Date(Date.now() - 3600000 * 48).toISOString(), // 48 hours ago
          synced: true,
          ashaWorker: {
            id: "1002",
            name: "Shravya",
            assignedArea: "Derlakatte",
            phone: "+91 1472583690",
            email: "shamithanaik247@gmail.com",
            hospital: "Ullal Government Hospital"
          },
          answers: {}
        }
      ];
      fs.writeFileSync(PATIENT_DATA_FILE, JSON.stringify(seedPatients, null, 2));
      return seedPatients;
    }
  } catch (err) {
    console.error('Error reading patient file, using blank in-memory list', err);
  }
  return [];
}

function savePatientsList(data: any[]) {
  try {
    fs.writeFileSync(PATIENT_DATA_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing patient file', err);
  }
}

// Helper to read / write screening sessions separately
function getScreeningsList(): any[] {
  try {
    if (fs.existsSync(SCREENINGS_DATA_FILE)) {
      const raw = fs.readFileSync(SCREENINGS_DATA_FILE, 'utf-8');
      return JSON.parse(raw);
    } else {
      // Create with some lovely starter templates so the history section has a couple of past reports for demos
      const starterHistoryList = [
        {
          id: "SCR-1715016000000",
          patientId: "demo_p1",
          timestamp: "2026-05-15T10:00:00Z",
          patientDetails: {
            id: "demo_p1",
            name: "Kaveri Gowda",
            age: 52,
            gender: "Female",
            address: "Derlakatte Rural Sector B, Karnataka",
            language: "kn"
          },
          answers: {
            "diab_wound": "no",
            "diab_thirst": "yes",
            "diab_piss": "yes",
            "bp_headache": "yes",
            "bp_breathless": "no"
          },
          riskResults: {
            riskFactor: "high",
            riskScore: 72,
            predictions: {
              diabetesRisk: "high",
              hypertensionRisk: "medium",
              notes: "High risk was identified during previous screening on May 15. Standard recommendations include reducing carbohydrates and visiting the Taluk hospital for confirmation test."
            }
          }
        },
        {
          id: "SCR-1714016000000",
          patientId: "demo_p2",
          timestamp: "2026-05-10T14:30:00Z",
          patientDetails: {
            id: "demo_p2",
            name: "Manjappa Hegde",
            age: 63,
            gender: "Male",
            address: "Ullal Fish Haven Ward, Karnataka",
            language: "en"
          },
          answers: {
            "diab_wound": "yes",
            "diab_thirst": "no",
            "bp_headache": "yes",
            "bp_breathless": "yes"
          },
          riskResults: {
            riskFactor: "medium",
            riskScore: 54,
            predictions: {
              diabetesRisk: "medium",
              hypertensionRisk: "high",
              notes: "Older patient with high blood pressure indicators and moderate sugar levels. Needs ASHA tracking for regular BP monitoring."
            }
          }
        }
      ];
      fs.writeFileSync(SCREENINGS_DATA_FILE, JSON.stringify(starterHistoryList, null, 2));
      return starterHistoryList;
    }
  } catch (err) {
    console.error('Error reading screenings file, using blank list', err);
  }
  return [];
}

function saveScreeningsList(data: any[]) {
  try {
    fs.writeFileSync(SCREENINGS_DATA_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing screenings file', err);
  }
}

// In-memory notifications log
let NOTIFICATIONS: any[] = [
  {
    id: 'notif_1',
    patientId: 'demo_p1',
    patientName: 'Kaveri Gowda',
    riskFactor: 'high',
    message: 'New high-risk screening submitted from Rural Sector B. Needs urgent attention.',
    timestamp: new Date().toISOString(),
    read: false
  }
];

// Initialize Gemini
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
  console.log('Gemini AI system pre-loaded successfully!');
} else {
  console.log('No GEMINI_API_KEY environment variable found. Graceful rule-based health fallback activated.');
}

// REST endpoints
app.post('/api/auth/register', (req, res) => {
  const { name, phone, role, assignedArea } = req.body;
  if (!name || !phone || !role) {
    return res.status(400).json({ error: 'Name, phone, and role are required' });
  }

  const list = getUsersList();
  const phoneClean = phone.replace(/\D/g, '');
  
  // check duplicate
  const exists = list.some(u => 
    u.role === role && 
    u.name.toLowerCase() === name.toLowerCase() && 
    u.phone.replace(/\D/g, '') === phoneClean
  );

  if (exists) {
    return res.status(400).json({ error: 'User already exists with this name and phone number.' });
  }

  const newUser = {
    id: role === 'asha' ? `ASHA-${Date.now()}` : `USR-${Date.now()}`,
    name: name.trim(),
    phone: phone.trim(),
    role,
    assignedArea: assignedArea || (role === 'asha' ? 'Ullal' : undefined),
    hospital: role === 'asha' ? 'Ullal Government Hospital' : undefined
  };

  list.push(newUser);
  saveUsersList(list);

  res.json({ success: true, user: newUser });
});

app.post('/api/auth/login', (req, res) => {
  const { name, phone, role } = req.body;
  if (!name || !phone || !role) {
    return res.status(400).json({ error: 'Name, phone, and role are required' });
  }

  const list = getUsersList();
  const phoneClean = phone.replace(/\D/g, '');
  const searchName = name.trim().toLowerCase();

  const user = list.find(u => 
    u.role === role && 
    u.name.trim().toLowerCase() === searchName && 
    u.phone.replace(/\D/g, '') === phoneClean
  );

  if (!user) {
    return res.status(404).json({ error: 'No account matches this Name and Phone Number. Please check details or register.' });
  }

  res.json({ success: true, user });
});

app.get('/api/patients', (req, res) => {
  const list = getPatientsList();
  res.json(list);
});

app.post('/api/patients', (req, res) => {
  const incomingPatients = Array.isArray(req.body) ? req.body : [req.body];
  const list = getPatientsList();
  const newlyCreated: any[] = [];

  incomingPatients.forEach((pat: any) => {
    // Prevent duplicates
    const index = list.findIndex(p => p.id === pat.id);
    const completedPat = {
      ...pat,
      synced: true,
      submittedAt: pat.submittedAt || new Date().toISOString()
    };

    if (index !== -1) {
      list[index] = completedPat;
    } else {
      list.push(completedPat);
    }
    newlyCreated.push(completedPat);

    // Trigger notification if High or Medium risk
    if (completedPat.riskFactor === 'high' || completedPat.riskFactor === 'medium') {
      NOTIFICATIONS.unshift({
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        patientId: completedPat.id,
        patientName: completedPat.name,
        riskFactor: completedPat.riskFactor,
        message: `High risk identified for ${completedPat.name} (Age: ${completedPat.age}). BP/Diabetes alert triggered.`,
        timestamp: new Date().toISOString(),
        read: false
      });
    }
  });

  savePatientsList(list);
  res.status(200).json({ success: true, count: newlyCreated.length, data: newlyCreated });
});

app.get('/api/notifications', (req, res) => {
  res.json(NOTIFICATIONS);
});

app.post('/api/notifications/read', (req, res) => {
  const { id } = req.body;
  NOTIFICATIONS = NOTIFICATIONS.map(n => n.id === id ? { ...n, read: true } : n);
  res.json({ success: true });
});

// GET all historical screenings
app.get('/api/screenings', (req, res) => {
  const list = getScreeningsList();
  res.json(list);
});

// GET a specific clinical report by Screening ID or Patient ID
app.get('/api/screenings/:id', (req, res) => {
  const { id } = req.params;
  const list = getScreeningsList();
  
  // Try finding report by screening ID or patient ID
  const found = list.find(scr => scr.id === id || scr.patientId === id || (scr.patientDetails && scr.patientDetails.id === id));
  if (found) {
    return res.json(found);
  }
  
  // Fallback to check patient directory
  const patList = getPatientsList();
  const patFound = patList.find(p => p.id === id || p.screeningId === id);
  if (patFound) {
    const screeningFormat = {
      id: patFound.screeningId || patFound.id,
      patientId: patFound.id,
      timestamp: patFound.submittedAt || new Date().toISOString(),
      patientDetails: {
        id: patFound.id,
        name: patFound.name,
        age: patFound.age,
        gender: patFound.gender || '',
        address: patFound.address || '',
        language: patFound.language
      },
      answers: patFound.answers || {},
      riskResults: {
        riskFactor: patFound.riskFactor,
        riskScore: patFound.riskScore,
        predictions: patFound.predictions || {
          diabetesRisk: 'low',
          hypertensionRisk: 'low',
          notes: ''
        }
      },
      ashaWorker: patFound.ashaWorker,
      ashaVerifiedBy: patFound.ashaVerifiedBy
    };
    return res.json(screeningFormat);
  }

  res.status(404).json({ error: 'Report not found' });
});

// POST a new screening session (saved separately, never overwriting)
app.post('/api/screenings', (req, res) => {
  const incomingScreenings = Array.isArray(req.body) ? req.body : [req.body];
  const list = getScreeningsList();
  const newlyCreated: any[] = [];

  incomingScreenings.forEach((scr: any) => {
    const completedScr = {
      ...scr,
      id: scr.id || `SCR-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`,
      timestamp: scr.timestamp || new Date().toISOString()
    };
    list.push(completedScr);
    newlyCreated.push(completedScr);
  });

  saveScreeningsList(list);
  res.status(200).json({ success: true, count: newlyCreated.length, data: newlyCreated });
});

// Send custom guidance simulation
app.post('/api/patients/guidance', (req, res) => {
  const { patientId, text, sender } = req.body;
  const list = getPatientsList();
  const index = list.findIndex(p => p.id === patientId);

  if (index !== -1) {
    if (!list[index].guidanceLog) {
      list[index].guidanceLog = [];
    }
    list[index].guidanceLog.push({
      id: `g_${Date.now()}`,
      text,
      sender,
      timestamp: new Date().toISOString()
    });
    savePatientsList(list);
    return res.json({ success: true, patient: list[index] });
  }
  res.status(404).json({ error: 'Patient not found' });
});

// Proxy high-quality text-to-speech engine to prevent origin blocks, iframe filters, or rate limits on mobile devices
app.get('/api/tts', async (req, res) => {
  const { text, lang } = req.query;
  if (!text) {
    return res.status(400).send('Missing text parameter');
  }
  
  const languageCode = lang === 'kn' ? 'kn' : 'en';
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${languageCode}&client=tw-ob&q=${encodeURIComponent(text.toString())}`;

  try {
    const ttsResponse = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36',
        'Referer': 'https://translate.google.com/'
      }
    });

    if (!ttsResponse.ok) {
      throw new Error(`Google TTS status: ${ttsResponse.status}`);
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache text audio clips to speed up flow repeat transitions
    
    const arrayBuffer = await ttsResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.send(buffer);
  } catch (err: any) {
    console.error('TTS Proxy streaming failure:', err.message);
    res.status(500).send('Failed to synthesize high quality vocal proxy');
  }
});

// Analyze risk using Gemini
app.post('/api/gemini/analyze', async (req, res) => {
  const { 
    name, 
    age, 
    language, 
    gender, 
    address, 
    hasDiabetesOrHypertension, 
    fatherHistory, 
    motherHistory, 
    siblingsHistory, 
    ashaWorker, 
    moderator, 
    answers 
  } = req.body;

  // Compile prompt context
  const compiledAnswersText = Object.entries(answers || {})
    .map(([qid, ans]) => `- Question ID: ${qid}, Answer given by patient: "${ans}"`)
    .join('\n');

  const systemInstruction = `You are a professional rural endocrinology and cardiovascular health screening expert AI of Suraksha Healthcare. 
Analyze the provided answers of a rural Indian patient during diabetes/hypertension screening, taking into account their gender, location, family medical history, and questionnaire answers.
Based on their age (${age}), calculate whether they are at 'low', 'medium', or 'high' risk and return specific diagnostic notes.
Keep descriptions understandable for rural outreach health workers (ASHA workers) and primary health center practitioners.
Give advice in Kannada if language is 'kn', otherwise give it in English.
Crucial: Explicitly mention the assigned ASHA worker's name and contact number if provided to instruct the patient to contact them for primary testing.
Provide the output STRICTLY in the following JSON format:
{
  "riskFactor": "low" | "medium" | "high",
  "riskScore": number between 0 and 100,
  "diabetesRisk": "low" | "medium" | "high",
  "hypertensionRisk": "low" | "medium" | "high",
  "notes": "string advice and critical focus areas in the selected language"
}`;

  const prompt = `Patient Name: ${name}
Age: ${age}
Gender: ${gender || 'Not specified'}
Address Location: ${address || 'Not specified'}
Patient's Self Diabetes/Hypertension history: ${hasDiabetesOrHypertension || 'Not reported'}
Father's Health History: ${fatherHistory || 'Not reported'}
Mother's Health History: ${motherHistory || 'Not reported'}
Siblings' Health History: ${siblingsHistory || 'Not reported'}
Assigned ASHA worker: ${ashaWorker ? `${ashaWorker.name} (Phone: ${ashaWorker.phone}, Area: ${ashaWorker.assignedArea})` : 'None'}
Assigned Moderator: ${moderator ? `${moderator.name} (Phone: ${moderator.phone})` : 'None'}

Answers provided to the age-specific screening questionnaire:
${compiledAnswersText}`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              riskFactor: { type: Type.STRING, description: '"low", "medium", or "high"' },
              riskScore: { type: Type.INTEGER, description: 'Scale 0-100 indicating risk weight' },
              diabetesRisk: { type: Type.STRING, description: '"low", "medium", or "high"' },
              hypertensionRisk: { type: Type.STRING, description: '"low", "medium", or "high"' },
              notes: { type: Type.STRING, description: 'Direct clear guidance' }
            },
            required: ['riskFactor', 'riskScore', 'diabetesRisk', 'hypertensionRisk', 'notes']
          }
        }
      });

      const responseText = response.text;
      if (responseText) {
        try {
          const parsed = JSON.parse(responseText.trim());
          return res.json(parsed);
        } catch (parseError) {
          console.error('Failed to parse Gemini output, falling back...', responseText);
        }
      }
    } catch (apiError) {
      console.error('Error contacting Gemini API, transitioning to backup engine:', apiError);
    }
  }

  // Graceful rule-based engine backup (guarantees hackathon prototype works under all network conditions)
  console.log('Applying Offline Rule-Based Health Analyzer...');
  
  // Rule based logic
  let score = 10; // Start minimal
  let hasHighBPSymptom = false;
  let hasHighSugarSymptom = false;

  const checkYes = (val: string) => {
    if (!val) return false;
    const lower = val.toLowerCase();
    return lower.includes('yes') || lower.includes('true') || lower.includes('houdu') || lower.includes('haudu') || lower.includes('howdu') || lower.includes('correct') || val.includes('ಹೌದು');
  };

  // Add family history scoring
  if (checkYes(hasDiabetesOrHypertension)) score += 15;
  if (checkYes(fatherHistory)) score += 10;
  if (checkYes(motherHistory)) score += 10;
  if (checkYes(siblingsHistory)) score += 10;

  Object.entries(answers || {}).forEach(([qid, val]) => {
    const isYes = typeof val === 'string' && (val.toLowerCase().includes('yes') || val.includes('ಹೌದು') || val.toLowerCase().includes('true'));
    if (isYes) {
      score += 20;
      if (qid.startsWith('diab_') || qid.includes('thirst') || qid.includes('wound') || qid.includes('fatigue')) hasHighSugarSymptom = true;
      if (qid.startsWith('bp_') || qid.includes('dizziness') || qid.includes('breathless') || qid.includes('vision') || qid.includes('chest') || qid.includes('feet')) hasHighBPSymptom = true;
    }
  });

  // Age based increases
  if (age >= 60) score += 20;
  else if (age >= 45) score += 12;

  if (score > 100) score = 100;

  let riskFactor: 'low' | 'medium' | 'high' = 'low';
  if (score >= 60 || hasHighSugarSymptom && hasHighBPSymptom) riskFactor = 'high';
  else if (score >= 30) riskFactor = 'medium';

  const diabetesRisk = hasHighSugarSymptom ? (score >= 60 ? 'high' : 'medium') : 'low';
  const hypertensionRisk = hasHighBPSymptom ? (score >= 60 ? 'high' : 'medium') : 'low';

  const activeAsha = ashaWorker || { name: 'ALIA RAI', phone: '+91 1234567890' };

  // Localized clinical notes matching Language
  let notes = "";
  if (language === 'kn') {
    if (riskFactor === 'high') {
      notes = `ಹೆಚ್ಚಿನ ಅಪಾಯದ ಪ್ರಮಾಣ ಕಂಡುಬಂದಿದೆ. ರಕ್ತದೊತ್ತಡ ಮತ್ತು ಸಕ್ಕರೆ ಪ್ರಮಾಣವನ್ನು ತಕ್ಷಣವೇ ನಿಮ್ಮ ಆಶಾ ಕಾರ್ಯಕರ್ತೆ ${activeAsha.name} (ಮೊಬೈಲ್: ${activeAsha.phone}) ಅಥವಾ ಹತ್ತಿರದ ಉಲ್ಲಾಳ ಸರ್ಕಾರಿ ಆಸ್ಪತ್ರೆಯಲ್ಲಿ ಪರೀಕ್ಷಿಸಿಕೊಳ್ಳಿ.`;
    } else if (riskFactor === 'medium') {
      notes = `ಮಧ್ಯಮ ಅಪಾಯದ ಸಾದ್ಯತೆ. ಸಕ್ಕರೆ ಹಾಗು ಉಪ್ಪು ಕಡಿಮೆ ಬಳಸಿ. ನಡಿಗೆ ಮಾಡಿ. ನಿಮ್ಮ ಆಶಾ ಕಾರ್ಯಕರ್ತೆ ${activeAsha.name} ರವರನ್ನು ಸಂಪರ್ಕಿಸಿ ಸಲಹೆ ಪಡೆಯಿರಿ.`;
    } else {
      notes = `ಪರೀಕ್ಷೆ ಪೂರ್ಣಗೊಂಡಿದೆ, ಅಪಾಯದ ಮಟ್ಟ ಕಡಿಮೆಯಾಗಿದೆ. ಉತ್ತಮ ಆರೋಗ್ಯಕ್ಕಾಗಿ ಕೃಷಿ ಕೆಲಸ ಮುಂದುವರಿಸಿ. ವರ್ಷಕ್ಕೊಮ್ಮೆ ಉಚಿತ ತಪಾಸಣೆ ಮಾಡಿಸಿಕೊಳ್ಳಿ.`;
    }
  } else {
    if (riskFactor === 'high') {
      notes = `High clinical risk profile detected. Immediate referral to clinic is recommended. Please contact your assigned ASHA worker ${activeAsha.name} (Phone: ${activeAsha.phone}) immediately for referral protocol.`;
    } else if (riskFactor === 'medium') {
      notes = `Moderate screening risk factor. Enhance daily active hours and limit direct salt/sugar intake. Please follow up with your local ASHA worker ${activeAsha.name} (Phone: ${activeAsha.phone}).`;
    } else {
      notes = `Excellent, low screened risk profile. Continue regular active rural lifestyle. Re-evaluate annually.`;
    }
  }

  res.json({
    riskFactor,
    riskScore: score,
    diabetesRisk,
    hypertensionRisk,
    notes
  });
});

// Setup Vite Dev server and production file fallback
async function launch() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Mounted Vite engine for active dev middleware...');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Serving production clinical bundles from folder: dist');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Rural Indian Health System active directly on Port ${PORT}`);
  });
}

launch().catch((err) => {
  console.error('Failed to configure server pipelines:', err);
});
