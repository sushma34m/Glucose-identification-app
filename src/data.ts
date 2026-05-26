import { Question, AssignedHouse, Language } from './types';

export const SYSTEM_GREETINGS = {
  [Language.ENGLISH]: {
    askName: "Please state your name clearly.",
    voiceAskName: "Please state your name clearly.",
    askGender: "Please select or state your gender: Male, Female, or Other.",
    voiceAskGender: "Please select or state your gender: Male, Female, or Other.",
    askAddress: "What is your village or address?",
    voiceAskAddress: "Please tell me your complete address, village, or town name.",
    askFamilySelf: "Do you have diabetes or hypertension? If yes, since how many years?",
    voiceAskFamilySelf: "Do you have diabetes or hypertension? If yes, since how many years?",
    askFamilyFather: "Is your father alive? If yes, age + disease history; if no, past history.",
    voiceAskFamilyFather: "Is your father alive? If yes, what is his age and health history? If no, what was his past history?",
    askFamilyMother: "Is your mother alive? If yes, age + disease history; if no, past history.",
    voiceAskFamilyMother: "Is your mother alive? If yes, what is her age and health history? If no, what was her past history?",
    askFamilySibnings: "Do your siblings have diabetes or hypertension? If yes, since how many years?",
    voiceAskFamilySibnings: "Do your siblings have diabetes or hypertension? If yes, since how many years?",
    askAge: "What is your age in years?",
    voiceAskAge: "What is your age in years?",
    confirmResponse: "Is this information correct? Speak Yes or No, or tap to choose.",
    voiceConfirmResponse: "Is this correct? Yes or No.",
    completedScreening: "Thank you. Your screening is complete. Generating your risk report now.",
    voiceCompletedScreening: "Thank you. Your screening is complete. Generating your risk report now.",
    yes: "Yes",
    no: "No",
    cancel: "Cancel",
    correct: "Correct",
    incorrect: "Incorrect",
    processing: "Processing voice response...",
  },
  [Language.KANNADA]: {
    askName: "ದಯವಿಟ್ಟು ನಿಮ್ಮ ಹೆಸರನ್ನು ಸ್ಪಷ್ಟವಾಗಿ ಹೇಳಿ.",
    voiceAskName: "ನಿಮ್ಮ ಹೆಸರೇನು? ದಯವಿಟ್ಟು ಹೆಸರನ್ನು ಸ್ಪಷ್ಟವಾಗಿ ಹೇಳಿ.",
    askGender: "ನಿಮ್ಮ ಲಿಂಗವನ್ನು ತಿಳಿಸಿ: ಪುರುಷ, ಮಹಿಳೆ ಅಥವಾ ಇತರರು.",
    voiceAskGender: "ನಿಮ್ಮ ಲಿಂಗವನ್ನು ತಿಳಿಸಿ: ಪುರುಷ, ಮಹಿಳೆ ಅಥವಾ ಇತರರು ಎಂದು ಹೇಳಿ.",
    askAddress: "ನಿಮ್ಮ ವಿಳಾಸ ಅಥವಾ ಗ್ರಾಮದ ಹೆಸರನ್ನು ತಿಳಿಸಿ.",
    voiceAskAddress: "ದಯವಿಟ್ಟು ನಿಮ್ಮ ಪೂರ್ಣ ವಿಳಾಸ ಅಥವಾ ಗ್ರಾಮದ ಹೆಸರನ್ನು ತಿಳಿಸಿ.",
    askFamilySelf: "ನಿಮಗೆ ಸಕ್ಕರೆ ಕಾಯಿಲೆ ಅಥವಾ ರಕ್ತದೊತ್ತಡದ ತೊಂದರೆ ಇದೆಯೇ? ಇದ್ದಾರೆ ಎಷ್ಟು ವರ್ಷಗಳಿಂದ ಇದೆ?",
    voiceAskFamilySelf: "ನಿಮಗೆ ಸಕ್ಕರೆ ಕಾಯಿಲೆ ಅಥವಾ ರಕ್ತದೊತ್ತಡದ ತೊಂದರೆ ಇದೆಯೇ? ಇದ್ದಲ್ಲಿ, ಎಷ್ಟು ವರ್ಷಗಳಿಂದ ಇದೆ?",
    askFamilyFather: "ನಿಮ್ಮ ತಂದೆಯವರು ಇದ್ದಾರೆಯೇ? ಇದ್ದರೆ ವಯಸ್ಸು ಮತ್ತು ಇತಿಹಾಸ ತಿಳಿಸಿ; ಇಲ್ಲದಿದ್ದರೆ ಹಿಂದಿನ ಅನಾರೋಗ್ಯ ತಿಳಿಸಿ.",
    voiceAskFamilyFather: "ನಿಮ್ಮ ತಂದೆಯವರು ಇದ್ದಾರೆಯೇ? ಇದ್ದರೆ ಅವರ ವಯಸ್ಸು ಮತ್ತು ಆರೋಗ್ಯದ ಇತಿಹಾಸವೇನು? ಇಲ್ಲದಿದ್ದರೆ ಹಿಂದಿನ ಅನಾರೋಗ್ಯದ ಇತಿಹಾಸ ತಿಳಿಸಿ.",
    askFamilyMother: "ನಿಮ್ಮ ತಾಯಿಯವರು ಇದ್ದಾರೆಯೇ? ಇದ್ದರೆ ವಯಸ್ಸು ಮತ್ತು ಇತಿಹಾಸ ತಿಳಿಸಿ; ಇಲ್ಲದಿದ್ದರೆ ಹಿಂದಿನ ಅನಾರೋಗ್ಯ ತಿಳಿಸಿ.",
    voiceAskFamilyMother: "ನಿಮ್ಮ ತಾಯಿಯವರು ಇದ್ದಾರೆಯೇ? ಇದ್ದರೆ ಅವರ ವಯಸ್ಸು ಮತ್ತು ಆರೋಗ್ಯದ ಇತಿಹಾಸವೇನು? ಇಲ್ಲದಿದ್ದರೆ ಹಿಂದಿನ ಅನಾರೋಗ್ಯದ ಇತಿಹಾಸ ತಿಳಿಸಿ.",
    askFamilySibnings: "ನಿಮ್ಮ ಒಡಹುಟ್ಟಿದವರಿಗೆ ಸಕ್ಕರೆ ಕಾಯಿಲೆ ಅಥವಾ ಬಿಪಿ ಇದೆಯೇ? ಇದ್ದರೆ ಎಷ್ಟು ವರ್ಷಗಳಿಂದ ಇದೆ?",
    voiceAskFamilySibnings: "ನಿಮ್ಮ ಒಡಹುಟ್ಟಿದವರಿಗೆ ಸಕ್ಕರೆ ಕಾಯಿಲೆ ಅಥವಾ ರಕ್ತದೊತ್ತಡ ಇದೆಯೇ? ಇದ್ದಲ್ಲಿ, ಎಷ್ಟು ವರ್ಷಗಳಿಂದ ಇದೆ?",
    askAge: "ನಿಮ್ಮ ವಯಸ್ಸು ಎಷ್ಟು?",
    voiceAskAge: "ನಿಮ್ಮ ವಯಸ್ಸು ಎಷ್ಟು ತಿಳಿಸಿ?",
    confirmResponse: "ಈ ಮಾಹಿತಿ ಸರಿಯಾಗಿದೆಯೇ? ಹೌದು ಅಥವಾ ಇಲ್ಲ ಎಂದು ಹೇಳಿ.",
    voiceConfirmResponse: "ಈ ಮಾಹಿತಿ ಸರಿಯಾಗಿದೆಯೇ? ಹೌದು ಅಥವಾ ಇಲ್ಲ.",
    completedScreening: "ಧನ್ಯವಾದಗಳು. ನಿಮ್ಮ ತಪಾಸಣೆ ಪೂರ್ಣಗೊಂಡಿದೆ. ನಿಮ್ಮ ವರದಿಯನ್ನು ತಯಾರಿಸಲಾಗುತ್ತಿದೆ.",
    voiceCompletedScreening: "ಧನ್ಯವಾದಗಳು. ನಿಮ್ಮ ತಪಾಸಣೆ ಪೂರ್ಣಗೊಂಡಿದೆ. ವರದಿ ತಯಾರಿಸಲಾಗುತ್ತಿದೆ.",
    yes: "ಹೌದು",
    no: "ಇಲ್ಲ",
    cancel: "ರದ್ದು ಮಾಡಿ",
    correct: "ಸರಿ",
    incorrect: "ತಪ್ಪು",
    processing: "ಧ್ವನಿಯನ್ನು ಗ್ರಹಿಸಲಾಗುತ್ತಿದೆ...",
  }
};

export const AGE_GROUPS = {
  DIAB_CHILD: 'diab_child',
  DIAB_ADULT: 'diab_adult',
  DIAB_OLDER: 'diab_older',
  BP_YOUNG: 'bp_young',
  BP_MID: 'bp_mid',
  BP_OLDER: 'bp_older'
};

// MODERATOR details
export const MODERATOR_DATA = {
  name: "Kiara",
  phone: "+91 7894561230",
  email: "surakshashetty359@gmail.com"
};

// Specific DEMO ASHA Workers with email, phone, hospital, and area details
export const DEMO_ASHA_WORKERS = [
  {
    id: '1001',
    name: 'ALIA RAI',
    phone: '+91 1234567890',
    email: 'sanjanasahana19@gmail.com',
    assignedArea: 'Ullal',
    hospital: 'Ullal Government Hospital'
  },
  {
    id: '1002',
    name: 'Shravya',
    phone: '+91 1472583690',
    email: 'shamithanaik247@gmail.com',
    assignedArea: 'Derlakatte',
    hospital: 'Ullal Government Hospital'
  }
];

export const DIABETES_QUESTION_BANK: Record<string, Question[]> = {
  [AGE_GROUPS.DIAB_CHILD]: [
    {
      id: 'diab_kid_urination',
      text: {
        [Language.ENGLISH]: 'Do you experience frequent urination or bedwetting?',
        [Language.KANNADA]: 'ನಿಮಗೆ ಪದೇ ಪದೇ ಮೂತ್ರ ತೊಂದರೆ ಅಥವಾ ಮಲಗಿರುವಾಗ ಮೂತ್ರ ವಿಸರ್ಜನೆ ಆಗುತ್ತದೆಯೇ?'
      },
      voicePrompt: {
        [Language.ENGLISH]: 'Do you experience frequent urination? Answer yes or no.',
        [Language.KANNADA]: 'ನಿಮಗೆ ಪದೇ ಪದೇ ಮೂತ್ರ ತೊಂದರೆ ಆಗ್ತಿದ್ಯಾ? ಹೌದು ಅಥವಾ ಇಲ್ಲ ಅಂತ ಹೇಳಿ.'
      },
      category: 'diabetes'
    },
    {
      id: 'diab_kid_thirst',
      text: {
        [Language.ENGLISH]: 'Do you experience excessive thirst?',
        [Language.KANNADA]: 'ನಿಮಗೆ ಅತಿಯಾಗಿ ಬಾಯಾರಿಕೆ ಆಗುತ್ತದೆಯೇ?'
      },
      voicePrompt: {
        [Language.ENGLISH]: 'Do you feel excessively thirsty? Speak yes or no.',
        [Language.KANNADA]: 'ನಿಮಗೆ ಅತಿಯಾಗಿ ಬಾಯಾರಿಕೆ ಆಗುತ್ತಿದೆಯೇ? ಹೌದು ಅಥವಾ ಇಲ್ಲ ಅಂತ ಹೇಳಿ.'
      },
      category: 'diabetes'
    },
    {
      id: 'diab_kid_weight',
      text: {
        [Language.ENGLISH]: 'Have you had sudden unexplained weight loss?',
        [Language.KANNADA]: 'ನಿಮಗೆ ಇದ್ದಕ್ಕಿದ್ದಂತೆ ವಿಪರೀತ ತೂಕ ಇಳಿಕೆ ಆಗಿದೆಯೇ?'
      },
      voicePrompt: {
        [Language.ENGLISH]: 'Did you experience sudden weight loss? Yes or no.',
        [Language.KANNADA]: 'ನಿಮ್ಮ ತೂಕ ಇದ್ದಕ್ಕಿದ್ದಂತೆ ಇಳಿಕೆಯಾಗಿದೆಯೇ? ಹೌದು ಅಥವಾ ಇಲ್ಲ ಹೇಳಿ.'
      },
      category: 'diabetes'
    },
    {
      id: 'diab_kid_fatigue_vision',
      text: {
        [Language.ENGLISH]: 'Do you suffer from persistent fatigue or blurry vision?',
        [Language.KANNADA]: 'ನಿಮಗೆ ನಿರಂತರ ಆಯಾಸ ಅಥವಾ ಕಣ್ಣು ಮಂಜಾಗುವ ತೊಂದರೆ ಇದೆಯೇ?'
      },
      voicePrompt: {
        [Language.ENGLISH]: 'Do you experience fatigue or blurry vision? Yes or no.',
        [Language.KANNADA]: 'ನಿಮಗೆ ವಿಪರೀತ ಸುಸ್ತು ಅಥವಾ ಕಣ್ಣು ಮಂಜಾಗುತ್ತಿದೆಯೇ? ಹೌದು ಅಥವಾ ಇಲ್ಲ ಹೇಳಿ.'
      },
      category: 'diabetes'
    },
    {
      id: 'diab_kid_gestational',
      text: {
        [Language.ENGLISH]: 'Did your mother have blood sugar during pregnancy (gestational diabetes)?',
        [Language.KANNADA]: 'ನಿಮ್ಮ ತಾಯಿಯವರಿಗೆ ಗರ್ಭಾವಸ್ಥೆಯ ಸಮಯದಲ್ಲಿ ಸಕ್ಕರೆ ಕಾಯಿಲೆ ಇತ್ತೇ?'
      },
      voicePrompt: {
        [Language.ENGLISH]: 'Did your mother have gestational diabetes? Answer yes or no.',
        [Language.KANNADA]: 'ಗರ್ಭಾವಸ್ಥೆಯಲ್ಲಿ ನಿಮ್ಮ ತಾಯಿಗೆ ಸಕ್ಕರೆ ಕಾಯಿಲೆ ಇತ್ತೇ? ಹೌದು ಅಥವಾ ಇಲ್ಲ ತಿಳಿಸಿ.'
      },
      category: 'diabetes'
    },
    {
      id: 'diab_kid_patches',
      text: {
        [Language.ENGLISH]: 'Do you have dark skin patches on your neck or armpits?',
        [Language.KANNADA]: 'ನಿಮ್ಮ ಕುತ್ತಿಗೆ ಅಥವಾ ಬಂಕುಗಳಲ್ಲಿ ಕಪ್ಪು ಕಲೆಗಳು/ಮಚ್ಚೆಗಳು ಇವೆಯೇ?'
      },
      voicePrompt: {
        [Language.ENGLISH]: 'Do you have dark patches on your neck? Speak yes or no.',
        [Language.KANNADA]: 'ಕುತ್ತಿಗೆ ಅಥವಾ ಬಗಲುಗಳಲ್ಲಿ ಕಪ್ಪು ಬಣ್ಣದ ಮಚ್ಚೆಗಳು ಇವೆಯೇ? ಹೌದು ಅಥವಾ ಇಲ್ಲ ಹೇಳಿ.'
      },
      category: 'diabetes'
    }
  ],
  [AGE_GROUPS.DIAB_ADULT]: [
    {
      id: 'diab_adult_family',
      text: {
        [Language.ENGLISH]: 'Is there a family history of diabetes?',
        [Language.KANNADA]: 'ನಿಮ್ಮ ಕುಟುಂಬದಲ್ಲಿ ಯಾರಿಗಾದರೂ ಸಕ್ಕರೆ ಕಾಯಿಲೆಯ ಇತಿಹಾಸ ಇದೆಯೇ?'
      },
      voicePrompt: {
        [Language.ENGLISH]: 'Is diabetes present in your family? Answer yes or no.',
        [Language.KANNADA]: 'ಕುಟುಂಬದಲ್ಲಿ ಯಾರಿಗಾದರೂ ಸಕ್ಕರೆ ಕಾಯಿಲೆ ಇದೆಯೇ? ಹೌದು ಅಥವಾ ಇಲ್ಲ ತಿಳಿಸಿ.'
      },
      category: 'diabetes'
    },
    {
      id: 'diab_adult_pcos',
      text: {
        [Language.ENGLISH]: 'Do you have a history of PCOS or gestational diabetes (for females)?',
        [Language.KANNADA]: 'ನಿಮಗೆ ಪಿಸಿಓಎಸ್ (PCOS) ಅಥವಾ ಗರ್ಭಾವಸ್ಥೆಯಲ್ಲಿ ಸಕ್ಕರೆ ಕಾಯಿಲೆಯ ಇತಿಹಾಸವಿದೆಯೇ (ಮಹಿಳೆಯರಿಗಷ್ಟೇ)?'
      },
      voicePrompt: {
        [Language.ENGLISH]: 'Do you have a history of PCOS or high blood sugar during pregnancy? Yes or no.',
        [Language.KANNADA]: 'ಹೆಣ್ಣುಮಕ್ಕಳಿಗೆ ಪಿಸಿಓಎಸ್ ಅಥವಾ ಗರ್ಭಾವಸ್ಥೆಯಲ್ಲಿ ಸಕ್ಕರೆ ಕಾಯಿಲೆ ಇತ್ತೇ? ಹೌದು ಅಥವಾ ಇಲ್ಲ ಹೇಳಿ.'
      },
      category: 'diabetes'
    },
    {
      id: 'diab_adult_sitting',
      text: {
        [Language.ENGLISH]: 'Do you have high sitting hours and low daily physical activity?',
        [Language.KANNADA]: 'ನಿಮ್ಮ ದಿನನಿತ್ಯದ ಕೆಲಸದಲ್ಲಿ ದೈಹಿಕ ಶ್ರಮ ಕಡಿಮೆಯಿದ್ದು, ಕುಳಿತುಕೊಳ್ಳುವ ಸಮಯ ಹೆಚ್ಚಿದೆಯೇ?'
      },
      voicePrompt: {
        [Language.ENGLISH]: 'Do you sit for long hours with little physical activity? Speak yes or no.',
        [Language.KANNADA]: 'ದೈಹಿಕ ಶ್ರಮ ಕಡಿಮೆ ಇದ್ದು ಒಂದೇ ಕಡೆ ಹೆಚ್ಚು ಕುಳಿತುಕೊಳ್ಳುತ್ತೀರಾ? ಹೌದು ಅಥವಾ ಇಲ್ಲ ಹೇಳಿ.'
      },
      category: 'diabetes'
    },
    {
      id: 'diab_adult_bp_chol',
      text: {
        [Language.ENGLISH]: 'Do you have a history of high blood pressure or high cholesterol?',
        [Language.KANNADA]: 'ನಿಮಗೆ ಸಕ್ಕರೆ ಕಾಯಿಲೆ, ಅಧಿಕ ರಕ್ತದೊತ್ತಡ ಅಥವಾ ಕೊಲೆಸ್ಟ್ರಾಲ್ ತೊಂದರೆ ಇದೆಯೇ?'
      },
      voicePrompt: {
        [Language.ENGLISH]: 'Do you have high BP or high cholesterol? Speak yes or no.',
        [Language.KANNADA]: 'ನಿಮಗೆ ಬಿಪಿ ಅಥವಾ ಕೊಲೆಸ್ಟ್ರಾಲ್ ತೊಂದರೆ ಇದೆಯೇ? ಹೌದು ಅಥವಾ ಇಲ್ಲ ಹೇಳಿ.'
      },
      category: 'diabetes'
    },
    {
      id: 'diab_adult_wound',
      text: {
        [Language.ENGLISH]: 'Do minor cuts, wounds, or skin infections heal very slowly?',
        [Language.KANNADA]: 'ನಿಮ್ಮ ಸಣ್ಣ ಗಾಯಗಳು ಅಥವಾ ಸೋಂಕುಗಳು ಗುಣವಾಗಲು ಬಹಳ ದಿನ ತೆಗೆದುಕೊಳ್ಳುತ್ತವೆಯೇ?'
      },
      voicePrompt: {
        [Language.ENGLISH]: 'Do wounds or infections take a long time to heal? Yes or no.',
        [Language.KANNADA]: 'ನಿಮ್ಮ ಗಾಯಗಳು ಒಣಗಲು ತುಂಬಾ ಸಮಯ ಹಿಡಿಯುತ್ತದೆಯೇ? ಹೌದು ಅಥವಾ ಇಲ್ಲ ಹೇಳಿ.'
      },
      category: 'diabetes'
    },
    {
      id: 'diab_adult_weight',
      text: {
        [Language.ENGLISH]: 'Do you experience frequent unexplained weight fluctuations?',
        [Language.KANNADA]: 'ನಿಮ್ಮ تೂಕದಲ್ಲಿ ಹಠಾತ್ ಏರಿಳಿತಗಳು ಆಗುತ್ತಿವೆಯೇ?'
      },
      voicePrompt: {
        [Language.ENGLISH]: 'Do you notice sudden fluctuations in weight? Speak yes or no.',
        [Language.KANNADA]: 'ನಿಮ್ಮ ತೂಕದಲ್ಲಿ ತೀವ್ರ ಏರುಪೇರು ಆಗುತ್ತಿದೆಯೇ? ಹೌದು ಅಥವಾ ಇಲ್ಲ ಎಂದು ಹೇಳಿ.'
      },
      category: 'diabetes'
    }
  ],
  [AGE_GROUPS.DIAB_OLDER]: [
    {
      id: 'diab_elder_tingling',
      text: {
        [Language.ENGLISH]: 'Do you feel numbness or tingling sensations in your hands or feet?',
        [Language.KANNADA]: 'ನಿಮ್ಮ ಕೈ ಕಾಲುಗಳಲ್ಲಿ ಮರಗಟ್ಟುವಿಕೆ ಅಥವಾ ಸೂಜಿ ಚುಚ್ಚಿದಂತೆ ಉರಿ ಕಂಡುಬರುತ್ತದೆಯೇ?'
      },
      voicePrompt: {
        [Language.ENGLISH]: 'Do you feel numbness or tingling in your hands or feet? Speak yes or no.',
        [Language.KANNADA]: 'ಕೈಕಾಲುಗಳಲ್ಲಿ ಮರಗಟ್ಟುವಿಕೆ ಅಥವಾ ಜುಮ್ಮೆನಿಸುವಿಕೆ ಆಗ್ತಿದ್ಯಾ? ಹೌದು ಅಥವ ಇಲ್ಲ ಹೇಳಿ.'
      },
      category: 'diabetes'
    },
    {
      id: 'diab_elder_vision',
      text: {
        [Language.ENGLISH]: 'Do you currently experience blurry vision or eye problems?',
        [Language.KANNADA]: 'ನಿಮಗೆ ಈಗ ಕಣ್ಣು ಮಂಜಾಗುವ ಅಥವಾ ದೃಷ್ಟಿ ದೋಷದ ತೊಂದರೆ ಇದೆಯೇ?'
      },
      voicePrompt: {
        [Language.ENGLISH]: 'Do you have blurry vision or eye problems? Yes or no.',
        [Language.KANNADA]: 'ಕಣ್ಣು ಮಂಜಾಗುವುದು ಅಥವಾ ದೃಷ್ಟಿ ತೊಂದರೆ ಹೆಚ್ಚಾಗಿದೆಯೇ? ಹೌದು ಅಥವ ಇಲ್ಲ ತಿಳಿಸಿ.'
      },
      category: 'diabetes'
    },
    {
      id: 'diab_elder_chest',
      text: {
        [Language.ENGLISH]: 'Do you feel chest pain, tightness or breathlessness?',
        [Language.KANNADA]: 'ನಿಮಗೆ ಎದೆನೋವು ಉಸಿರಾಟದ ತೊಂದರೆ ಅಥವಾ ಎದೆ ಬಿಗಿತ ಆಗುತ್ತದೆಯೇ?'
      },
      voicePrompt: {
        [Language.ENGLISH]: 'Do you experience chest pain or shortness of breath? Speak yes or no.',
        [Language.KANNADA]: 'ಎದೆನೋವು ಅಥವಾ ಉಸಿರಾಟದ ತೊಂದರೆ ಕಾಣಿಸುತ್ತಿದೆಯೇ? ಹೌದು ಅಥವಾ ಇಲ್ಲ ಹೇಳಿ.'
      },
      category: 'diabetes'
    },
    {
      id: 'diab_elder_meds',
      text: {
        [Language.ENGLISH]: 'Are you currently taking any daily medications?',
        [Language.KANNADA]: 'ನೀವು ಪ್ರಸ್ತುತ ದಿನನಿತ್ಯ ಯಾವುದಾದರೂ ಕಾಯಿಲೆಗೆ ಮಾತ್ರೆಗಳನ್ನು ತೆಗೆದುಕೊಳ್ಳುತ್ತಿದ್ದೀರಾ?'
      },
      voicePrompt: {
        [Language.ENGLISH]: 'Are you taking any daily medicines? Yes or no.',
        [Language.KANNADA]: 'ದಿನಾ ಮಾತ್ರೆಗಳನ್ನು ತೆಗೆದುಕೊಳ್ಳುತ್ತಿದ್ದೀರಾ? ಹೌದು ಅಥವಾ ಇಲ್ಲ ಹೇಳಿ.'
      },
      category: 'diabetes'
    },
    {
      id: 'diab_elder_memory',
      text: {
        [Language.ENGLISH]: 'Do you experience memory issues or forgetfulness in taking your medications?',
        [Language.KANNADA]: 'ಮಾತ್ರೆಗಳನ್ನು ತೆಗೆದುಕೊಳ್ಳಲು ಮರೆತುಹೋಗುವುದು ಅಥವಾ ಮರೆವಿನ ತೊಂದರೆ ಇದೆಯೇ?'
      },
      voicePrompt: {
        [Language.ENGLISH]: 'Do you sometimes forget to take your medicines? Yes or no.',
        [Language.KANNADA]: 'ಮಾತ್ರೆಗಳನ್ನು ನುಂಗಲು ಮರೆತುಹೋಗುವ ಸಮಸ್ಯೆ ಇದೆಯೇ? ಹೌದು ಅಥವಾ ಇಲ್ಲ ಹೇಳಿ.'
      },
      category: 'diabetes'
    },
    {
      id: 'diab_elder_night_urine',
      text: {
        [Language.ENGLISH]: 'Do you have to wake up frequently at night for urination?',
        [Language.KANNADA]: 'ರಾತ್ರಿಯ ಸಮಯದಲ್ಲಿ ಪದೇ ಪದೇ ಮೂತ್ರ ವಿಸರ್ಜನೆಗೆ ಏಳಬೇಕಾಗುತ್ತದೆಯೇ?'
      },
      voicePrompt: {
        [Language.ENGLISH]: 'Do you wake up many times at night for urination? Yes or no.',
        [Language.KANNADA]: 'ರಾತ್ರಿ ಹೊತ್ತು ಮೂತ್ರ ವಿಸರ್ಜನೆಗೆ ಪದೇ ಪದೇ ಎದ್ದೇಳಬೇಕಾಗುತ್ತದೆಯೇ? ಹೌದು ಅಥವಾ ಇಲ್ಲ ತಿಳಿಸಿ.'
      },
      category: 'diabetes'
    }
  ]
};

export const HYPERTENSION_QUESTION_BANK: Record<string, Question[]> = {
  [AGE_GROUPS.BP_YOUNG]: [
    {
      id: 'bp_young_headache',
      text: {
        [Language.ENGLISH]: 'Do you get frequent morning headaches?',
        [Language.KANNADA]: 'ನಿಮಗೆ ಬೆಳಗಿನ ಜಾವ ಪದೇ ಪದೇ ತಲೆನೋವು ಬರುತ್ತದೆಯೇ?'
      },
      voicePrompt: {
        [Language.ENGLISH]: 'Do you get frequent morning headaches? Yes or no.',
        [Language.KANNADA]: 'ಬೆಳಗಿನ ಸಮಯದಲ್ಲಿ ಪದೇ ಪದೇ ತಲೆನೋವು ಕಾಣಿಸಿಕೊಳ್ಳುತ್ತದೆಯೇ? ಹೌದು ಅಥವ ಇಲ್ಲ ಹೇಳಿ.'
      },
      category: 'BP'
    },
    {
      id: 'bp_young_dizzy',
      text: {
        [Language.ENGLISH]: 'Do you feel sudden dizzy spells or lightheadedness?',
        [Language.KANNADA]: 'ನಿಮಗೆ ಹಠಾತ್ ತಲೆಸುತ್ತು ಅಥವಾ ತಲೆ ಹಗುರವಾದಂತೆ ಅನಿಸುತ್ತದೆಯೇ?'
      },
      voicePrompt: {
        [Language.ENGLISH]: 'Do you feel dizzy often? Yes or no.',
        [Language.KANNADA]: 'ನಿಮಗೆ ಆಗಾಗ ತಲೆಸುತ್ತು ಬಂದಂತೆ ಅನಿಸುತ್ತದೆಯೇ? ಹೌದು ಅಥವ ಇಲ್ಲ ತಿಳಿಸಿ.'
      },
      category: 'BP'
    },
    {
      id: 'bp_young_heartbeat',
      text: {
        [Language.ENGLISH]: 'Do you experience irregular or fast heartbeats?',
        [Language.KANNADA]: 'ನಿಮ್ಮ ಎದೆಬಡಿತದಲ್ಲಿ ಏರುಪೇರು ಅಥವಾ ಜೋರಾಗಿ ಬಡಿದುಕೊಳ್ಳುವುದು ಕಂಡುಬರುತ್ತದೆಯೇ?'
      },
      voicePrompt: {
        [Language.ENGLISH]: 'Do you feel your heartbeat is too fast or irregular? Speak yes or no.',
        [Language.KANNADA]: 'ನಿಮ್ಮ ಎದೆಬಡಿತ ಅಸಹಜವಾಗಿ ವೇಗವಾಗಿ ಓಡುತ್ತಿದೆಯೇ? ಹೌದು ಅಥವಾ ಇಲ್ಲ ಎಂದು ಹೇಳಿ.'
      },
      category: 'BP'
    },
    {
      id: 'bp_young_salt',
      text: {
        [Language.ENGLISH]: 'Do you consume high amounts of salt or packaged, salty food?',
        [Language.KANNADA]: 'ನೀವು ತಿಂಡಿಗಳಲ್ಲಿ ಹೆಚ್ಚು ಉಪ್ಪು ಅಥವಾ ಉಪ್ಪಿನಕಾಯಿ, ಸಿದ್ಧ ಆಹಾರ ತಿನ್ನುತ್ತೀರಾ?'
      },
      voicePrompt: {
        [Language.ENGLISH]: 'Do you eat a lot of salty custom or packaged food? Yes or no.',
        [Language.KANNADA]: 'ಸಿಹಿ ಅಥವಾ ಉಪ್ಪು, ಕರಿದ ದಿನಬಳಕೆ ತಿಂಡಿ ಖಾರಗಳನ್ನು ಹೆಚ್ಚು ಬಳಸುತ್ತೀರಾ? ಹೌದು ಅಥವಾ ಇಲ್ಲ ತಿಳಿಸಿ.'
      },
      category: 'lifestyle'
    },
    {
      id: 'bp_young_exercise',
      text: {
        [Language.ENGLISH]: 'Do you engage in regular physical exercise or walk daily?',
        [Language.KANNADA]: 'ನೀವು ಪ್ರತಿದಿನ ನಿಯಮಿತವಾಗಿ ಕೃಷಿ ಕೆಲಸ, ವ್ಯಾಯಾಮ ಅಥವಾ ನಡಿಗೆ ಮಾಡುತ್ತೀರಾ?'
      },
      voicePrompt: {
        [Language.ENGLISH]: 'Do you exercise or walk daily? Yes or no.',
        [Language.KANNADA]: 'ಪ್ರತಿದಿನ ನಿಯಮಿತವಾಗಿ ದೈಹಿಕ ವ್ಯಾಯಾಮ ಅಥವಾ ಹೊಲದ ಕೆಲಸ ಇದೆಯೇ? ಹೌದು ಅಥವಾ ಇಲ್ಲ ತಿಳಿಸಿ.'
      },
      category: 'lifestyle'
    },
    {
      id: 'bp_young_sitting',
      text: {
        [Language.ENGLISH]: 'Do you sit for long hours during your work or rest?',
        [Language.KANNADA]: 'ನೀವು ದಿನದಲ್ಲಿ ದೀರ್ಘಕಾಲ ಒಂದೇ ಕಡೆ ಕುಳಿತುಕೊಳ್ಳುತ್ತೀರಾ?'
      },
      voicePrompt: {
        [Language.ENGLISH]: 'Do you sit for long hours? Answer yes or no.',
        [Language.KANNADA]: 'ಕೆಲಸದ ಅವಧಿಯಲ್ಲಿ ಒಂದೇ ಸಮನೆ ಕುಳಿತುಕೊಳ್ಳುವ ಸಮಯ ಹೆಚ್ಚಾಗಿದೆಯೇ? ಹೌದು ಅಥವಾ ಇಲ್ಲ ಹೇಳಿ.'
      },
      category: 'lifestyle'
    },
    {
      id: 'bp_young_sleep',
      text: {
        [Language.ENGLISH]: 'Do you experience poor or short sleep (less than 6-7 hours)?',
        [Language.KANNADA]: 'ನಿಮ್ಮ ನಿದ್ರೆ ಕಡಿಮೆಯಾಗುತ್ತಿದೆಯೇ (ದಿನಕ್ಕೆ ೬ ರಿಂದ ೭ ಗಂಟೆಗಳಿಗಿಂತ ಕಡಿಮೆ)?'
      },
      voicePrompt: {
        [Language.ENGLISH]: 'Do you sleep less than 6 hours per night? Yes or no.',
        [Language.KANNADA]: 'ದಿನಕ್ಕೆ ಆರೇಳು ಗಂಟೆಗಳಿಗಿಂತ ಕಡಿಮೆ ನಿದ್ದೆ ಮಾಡುತ್ತೀರಾ? ಹೌದು ಅಥವಾ ಇಲ್ಲ ಹೇಳಿ.'
      },
      category: 'lifestyle'
    },
    {
      id: 'bp_young_smoke',
      text: {
        [Language.ENGLISH]: 'Do you smoke, use tobacco, or chew paan daily?',
        [Language.KANNADA]: 'ನೀವು ಧೂಮಪಾನ, ಬೀಡಿ, ಅಡಿಕೆ ಅಥವಾ ತಂಬಾಕನ್ನು ಬಳಸುತ್ತೀರಾ?'
      },
      voicePrompt: {
        [Language.ENGLISH]: 'Do you smoke or chew tobacco? Yes or no.',
        [Language.KANNADA]: 'ಬೀಡಿ, ಸಿಗರೇಟು ಸೇದುವುದು ಅಥವಾ ತಂಬಾಕು, ಅಡಿಕೆ ಸೇವಿಸುವ ಅವ್ಯಾಸವಿದೆಯೇ? ಹೌದು ಅಥವಾ ಇಲ್ಲ ಹೇಳಿ.'
      },
      category: 'lifestyle'
    },
    {
      id: 'bp_young_alcohol',
      text: {
        [Language.ENGLISH]: 'Do you consume alcohol regularly?',
        [Language.KANNADA]: 'ನೀವು ನಿಯಮಿತವಾಗಿ ಮದ್ಯಪಾನ ಸೇವಿಸುತ್ತೀರಾ?'
      },
      voicePrompt: {
        [Language.ENGLISH]: 'Do you drink alcohol regularly? Yes or no.',
        [Language.KANNADA]: 'ಮದ್ಯಪಾನ ಸೇವಿಸುವ ರೂಢಿ ಇದೆಯೇ? ಹೌದು ಅಥವಾ ಇಲ್ಲ ಅಂತ ಹೇಳಿ.'
      },
      category: 'lifestyle'
    },
    {
      id: 'bp_young_family',
      text: {
        [Language.ENGLISH]: 'Do you have a family history of high blood pressure or heart disease?',
        [Language.KANNADA]: 'ನಿಮ್ಮ ಪೋಷಕರಲ್ಲಿ ಯಾರಿಗಾದರೂ ಮಧುಮೇಹ ಅಥವಾ ಹೃದಯ ಕಾಯಿಲೆ ಇದೆಯೇ?'
      },
      voicePrompt: {
        [Language.ENGLISH]: 'Is there blood pressure or heart disease in your family? Speak yes or no.',
        [Language.KANNADA]: 'ಕುಟುಂಬದಲ್ಲಿ ಯಾರಾದರೂ ಬಿಪಿ ಅಥವಾ ಹೃದಯದ ಇತಿಹಾಸ ಹೊಂದಿದ್ದಾರೆಯೇ? ಹೌದು ಅಥವಾ ಇಲ್ಲ ತಿಳಿಸಿ.'
      },
      category: 'BP'
    }
  ],
  [AGE_GROUPS.BP_MID]: [
    {
      id: 'bp_mid_stiffness',
      text: {
        [Language.ENGLISH]: 'Do you suffer from headaches or neck stiffness?',
        [Language.KANNADA]: 'ನಿಮಗೆ ಕುತ್ತಿಗೆ ಬಿಗಿತ ಅಥವಾ ಪದೇ ಪದೇ ತಲೆನೋವು ಬರುತ್ತದೆಯೇ?'
      },
      voicePrompt: {
        [Language.ENGLISH]: 'Do you have headaches or neck stiffness? Yes or no.',
        [Language.KANNADA]: 'ತಲೆನೋವು ಅಥವಾ ಕುತ್ತಿಗೆಯ ಹಿಂಭಾಗ ಹಿಡಿದಂತೆ ಬಿಗಿತ ಆಗ್ತಿದ್ಯಾ? ಹೌದು ದಯವಿಟ್ಟು ತಿಳಿಸಿ.'
      },
      category: 'BP'
    },
    {
      id: 'bp_mid_chest',
      text: {
        [Language.ENGLISH]: 'Do you experience chest discomfort during physical labor?',
        [Language.KANNADA]: 'ದೈಹಿಕ ಶ್ರಮದ ಕೆಲಸ ಮಾಡುವಾಗ ಎದೆಯಲ್ಲಿ ಅಸಮಾಧಾನ ಅಥವಾ ಭಾರ ಅನಿಸುತ್ತದೆಯೇ?'
      },
      voicePrompt: {
        [Language.ENGLISH]: 'Do you feel chest discomfort during work? Speak yes or no.',
        [Language.KANNADA]: 'ಭಾರವಾದ ಕೆಲಸ ಮಾಡುವಾಗ ಎದೆ ಬಿಗಿಯಾದಂತೆ ಅನಿಸುತ್ತದೆಯೇ? ಹೌದು ಅಥವಾ ಇಲ್ಲ ಹೇಳಿ.'
      },
      category: 'BP'
    },
    {
      id: 'bp_mid_breathless',
      text: {
        [Language.ENGLISH]: 'Do you experience shortness of breath when walking or climbing?',
        [Language.KANNADA]: 'ಮೆಟ್ಟಿಲು ಹತ್ತುವಾಗ ಅಥವಾ ನಡೆಯುವಾಗ ಕೈ ಕಟ್ಟಿ ಉಸಿರಾಟದ ತೊಂದರೆ ಆಗುತ್ತದೆಯೇ?'
      },
      voicePrompt: {
        [Language.ENGLISH]: 'Do you feel short of breath when walking? Speak yes or no.',
        [Language.KANNADA]: 'ಮೆಟ್ಟಿಲು ಹತ್ತುವಾಗ ಉಸಿರು ಹತ್ತಿದಂತೆ ಆಯಾಸ ಆಗ್ತಿದ್ಯಾ? ಹೌದು ಅಥವಾ ಇಲ್ಲ ಹೇಳಿ.'
      },
      category: 'BP'
    },
    {
      id: 'bp_mid_vision',
      text: {
        [Language.ENGLISH]: 'Do you notice sudden blurred or hazy vision?',
        [Language.KANNADA]: 'ನಿಮಗೆ ಇದ್ದಕ್ಕಿದ್ದಂತೆ ಕಣ್ಣುಗಳು ಮಂಜಾಗುವ ತೊಂದರೆ ಕಾಣಿಸಿಕೊಂಡಿದೆಯೇ?'
      },
      voicePrompt: {
        [Language.ENGLISH]: 'Did you notice blurry vision recently? Yes or no.',
        [Language.KANNADA]: 'ಇತ್ತೀಚಿಗೆ ಕಣ್ಣು ಮಂಜಾಗುವ ಹಾಗೂ ದೂರದ್ದು ಕಾಣದಿರುವ ಸಮಸ್ಯೆ ಇದೆಯೇ? ಹೌದು ಅಥವಾ ಇಲ್ಲ ಹೇಳಿ.'
      },
      category: 'BP'
    },
    {
      id: 'bp_mid_checked',
      text: {
        [Language.ENGLISH]: 'Has your blood pressure ever been checked before?',
        [Language.KANNADA]: 'ನಿಮ್ಮ ರಕ್ತದೊತ್ತಡವನ್ನು (ಬಿಪಿ) ಎಂದಾದರೂ ಹಿಂದೆ ಪರೀಕ್ಷಿಸಲಾಗಿದೆಯೇ?'
      },
      voicePrompt: {
        [Language.ENGLISH]: 'Have you ever checked your blood pressure? Yes or no.',
        [Language.KANNADA]: 'ನಿಮ್ಮ ರಕ್ತದೊತ್ತಡವನ್ನು ಹಿಂದೆ ಎಂದಾದರೂ ಲಾಲಾ ಪರೀಕ್ಷೆ ಮಾಡಿದ್ದೀರಾ? ಹೌದು ಅಥವಾ ಇಲ್ಲ ಹೇಳಿ.'
      },
      category: 'BP'
    },
    {
      id: 'bp_mid_diagnosis',
      text: {
        [Language.ENGLISH]: 'Have you ever been diagnosed with hypertension (high BP)?',
        [Language.KANNADA]: 'ನಿಮಗೆ ಹಿಂದೆ ಎಂದಾದರೂ ರಕ್ತದೊತ್ತಡದ ತೊಂದರೆ ಇದೆ ಎಂದು ವೈದ್ಯರು ಹೇಳಿದ್ದಾರೆಯೇ?'
      },
      voicePrompt: {
        [Language.ENGLISH]: 'Are you diagnosed with high BP? Speak yes or no.',
        [Language.KANNADA]: 'ದಾಖಲೆಗಳಲ್ಲಿ ಈ ಮುಂಚೆ ನಿಮಗೆ ಬಿಪಿ ಇದೆ ಎಂದು ಬಂದಿದೆಯೇ? ಹೌದು ಅಥವಾ ಇಲ್ಲ ಹೇಳಿ.'
      },
      category: 'BP'
    },
    {
      id: 'bp_mid_meds',
      text: {
        [Language.ENGLISH]: 'Are you currently taking any medication for your blood pressure?',
        [Language.KANNADA]: 'ನೀವು ಬಿಪಿ ನಿಯಂತ್ರಣಕ್ಕಾಗಿ ಮಾತ್ರೆಗಳನ್ನು ಏನಾದರೂ ತೆಗೆದುಕೊಳ್ಳುತ್ತಿದ್ದೀರಾ?'
      },
      voicePrompt: {
        [Language.ENGLISH]: 'Do you take blood pressure medicine? Yes or no.',
        [Language.KANNADA]: 'ಬಿಪಿ ನಿಯಂತ್ರಣಕ್ಕೆ ನೀವು ನಿಯಮಿತವಾಗಿ ಗುಳಿಗೆಗಳನ್ನು ನುಂಗುತ್ತಿದ್ದೀರಾ? ಹೌದು ಅಥವಾ ಇಲ್ಲ ತಿಳಿಸಿ.'
      },
      category: 'BP'
    },
    {
      id: 'bp_mid_salt',
      text: {
        [Language.ENGLISH]: 'Do you eat high salt, pickled, oily or fried food daily?',
        [Language.KANNADA]: 'ನಿಮ್ಮ ದಿನನಿತ್ಯದ ಆಹಾರದಲ್ಲಿ ಹೆಚ್ಚು ಉಪ್ಪು, ಕರಿದ ಉಪ್ಪಿನಕಾಯಿ ಪದಾರ್ಥಗಳನ್ನು ಬಳಸುತ್ತೀರಾ?'
      },
      voicePrompt: {
        [Language.ENGLISH]: 'Do you eat oily, fried, or high salt foods often? Yes or no.',
        [Language.KANNADA]: 'ನಿಮ್ಮ ಊಟದಲ್ಲಿ ಉಪ್ಪು, ಎಣ್ಣೆ ಪದಾರ್ಥಗಳು ಹೆಚ್ಚಾಗಿ ಇರುತ್ತವೆಯೇ? ಹೌದು ಅಥವಾ ಇಲ್ಲ ಹೇಳಿ.'
      },
      category: 'lifestyle'
    },
    {
      id: 'bp_mid_exercise',
      text: {
        [Language.ENGLISH]: 'Do you engage in regular physical exercise or daily physical labor?',
        [Language.KANNADA]: 'ನಿಮ್ಮ ದಿನಚರಿಯಲ್ಲಿ ದೈಹಿಕ ವ್ಯಾಯಾಮ ಅಥವಾ ಕಠಿಣ ಹೊಲದ ಕೆಲಸ ಮಾಡಲು ಸಾಧ್ಯವಾಗುತ್ತದೆಯೇ?'
      },
      voicePrompt: {
        [Language.ENGLISH]: 'Do you perform daily exercise or manual tasks? Answer yes or no.',
        [Language.KANNADA]: 'ನಿಮ್ಮ ದೈನಂದಿನ ಜೀವನದಲ್ಲಿ ಜಮೀನಿನ ಕೆಲಸ ಅಥವಾ ನಡಿಗೆ ಇದೆಯೇ? ಹೌದು ಅಥವಾ ಇಲ್ಲ ಹೇಳಿ.'
      },
      category: 'lifestyle'
    },
    {
      id: 'bp_mid_stress',
      text: {
        [Language.ENGLISH]: 'Do you experience high mental stress or anxiety?',
        [Language.KANNADA]: 'ನಿಮಗೆ ಮಾನಸಿಕ ಒತ್ತಡ ಅಥವಾ ಆತಂಕದ ದಿನಗಳು ಹೆಚ್ಚಿವೆಯೇ?'
      },
      voicePrompt: {
        [Language.ENGLISH]: 'Do you suffer from high mental stress? Yes or no.',
        [Language.KANNADA]: 'ನಿಮಗೆ ಮಾನಸಿಕ ಚಿಂತೆ ಅಥವಾ ತಳಮಳ ಉಂಟಾಗುತ್ತದೆಯೇ? ಹೌದು ಅಥವಾ ಇಲ್ಲ ಹೇಳಿ.'
      },
      category: 'lifestyle'
    },
    {
      id: 'bp_mid_diabetes',
      text: {
        [Language.ENGLISH]: 'Do you already have diabetes or high blood sugar?',
        [Language.KANNADA]: 'ನಿಮಗೆ ಈಗಾಗಲೇ ಸಕ್ಕರೆ ಕಾಯಿಲೆಯ ತೊಂದರೆ ಇದೆಯೇ?'
      },
      voicePrompt: {
        [Language.ENGLISH]: 'Do you already have diabetes? Speak yes or no.',
        [Language.KANNADA]: 'ನಿಮಗೆ ಮಧುಮೇಹ ಅಥವಾ ಸಕ್ಕರೆ ಅಂಶ ರಕ್ತದಲ್ಲಿ ಹೆಚ್ಚಿದೆಯೇ? ಹೌದು ಅಥವಾ ಇಲ್ಲ ತಿಳಿಸಿ.'
      },
      category: 'BP'
    },
    {
      id: 'bp_mid_kidney',
      text: {
        [Language.ENGLISH]: 'Do you suffer from kidney disease or high cholesterol?',
        [Language.KANNADA]: 'ನಿಮಗೆ ಮೂತ್ರಪಿಂಡ (ಕಿಡ್ನಿ) ತೊಂದರೆ ಅಥವಾ ಕೊಲೆಸ್ಟ್ರಾಲ್ ಇದೆಯೇ?'
      },
      voicePrompt: {
        [Language.ENGLISH]: 'Do you have kidney or cholesterol issues? Yes or no.',
        [Language.KANNADA]: 'ನಿಮ್ಮ ಶರೀರದಲ್ಲಿ ಹೆಚ್ಚಿನ ಕೊಲೆಸ್ಟ್ರಾಲ್ ಅಥವಾ ಕಿಡ್ನಿ ಗಾಯಗಳು ಇವೆಯೇ? ಹೌದು ಅಥವಾ ಇಲ್ಲ ತಿಳಿಸಿ.'
      },
      category: 'BP'
    },
    {
      id: 'bp_mid_habits',
      text: {
        [Language.ENGLISH]: 'Do you regularly smoke, chew tobacco or consume alcohol?',
        [Language.KANNADA]: 'ನಿವು ಧೂಮಪಾನ, ಆಲ್ಕೋಹಾಲ್ ಅಥವಾ ತಂಬಾಕಿನ ಅಭ್ಯಾಸ ಹೊಂದಿದ್ದೀರಾ?'
      },
      voicePrompt: {
        [Language.ENGLISH]: 'Do you smoke, drink or chew tobacco? Yes or no.',
        [Language.KANNADA]: 'ಸಿಗರೇಟು ಸೇದುವುದು ಅಥವಾ ಗುಟ್ಕಾ, ತಂಬಾಕು ಮತ್ತು ಮದ್ಯಪಾನ ಮಾಡುತ್ತೀರಾ? ಹೌದು ಅಥವಾ ಇಲ್ಲ ತಿಳಿಸಿ.'
      },
      category: 'lifestyle'
    }
  ],
  [AGE_GROUPS.BP_OLDER]: [
    {
      id: 'bp_elder_walk_dizzy',
      text: {
        [Language.ENGLISH]: 'Do you feel dizzy or lose balance while walking?',
        [Language.KANNADA]: 'ನಡೆಯುವಾಗ ನಿಮಗೆ ತಲೆಸುತ್ತು ಬರುವುದು ಅಥವಾ ಸಮತೋಲನ ತಪ್ಪಿದಂತೆ ಆಗುತ್ತದೆಯೇ?'
      },
      voicePrompt: {
        [Language.ENGLISH]: 'Do you feel dizzy or lose balance while walking? Answer yes or no.',
        [Language.KANNADA]: 'ನಿಮಗೆ ನಡೆಯುವಾಗ ತಲೆ ಜುಮ್ಮೆನ್ನುವುದು ಅಥವಾ ತೊಟ್ಟ ತೊಟ್ಟ ಬೀಳುವುದು ಆಗ್ತಿದ್ಯಾ? ಹೌದು ಇಲ್ಲ ತಿಳಿಸಿ.'
      },
      category: 'BP'
    },
    {
      id: 'bp_elder_confusion',
      text: {
        [Language.ENGLISH]: 'Do you experience frequent confusion or throbbing headaches?',
        [Language.KANNADA]: 'ನಿಮಗೆ ಆಗಾಗ ಗೊಂದಲ ಅಥವಾ ವಿಪರೀತ ತಲೆನೋವು ಕಂಡುಬರುತ್ತದೆಯೇ?'
      },
      voicePrompt: {
        [Language.ENGLISH]: 'Do you get severe headaches or confusion? Yes or no.',
        [Language.KANNADA]: 'ತಲೆಯಲ್ಲಿ ವಿಪರೀತ ತಿರುಗುನೋವು ಅಥವಾ ತಕ್ಷಣ ಮರೆತುಹೋಗುವುದು ಆಗ್ತಿದ್ಯಾ? ಹೌದು ಅಥವ ಇಲ್ಲ ಹೇಳಿ.'
      },
      category: 'BP'
    },
    {
      id: 'bp_elder_chest',
      text: {
        [Language.ENGLISH]: 'Do you suffer from frequent or crushing chest pain?',
        [Language.KANNADA]: 'ನಿಮಗೆ ಆಗಾಗ ವಿಪರೀತ ಎದೆನೋವು ಕಾಣಿಸಿಕೊಳ್ಳುತ್ತದೆಯೇ?'
      },
      voicePrompt: {
        [Language.ENGLISH]: 'Do you have tight, squeezing chest pain? Speak yes or no.',
        [Language.KANNADA]: 'ಎದೆಯಲ್ಲಿ ಭಾರವೆನಿಸಿ ಜೋರಾದ ನೋವು ಕಾಣುತ್ತದೆಯೇ? ಹೌದು ಅಥವಾ ಇಲ್ಲ ಹೇಳಿ.'
      },
      category: 'BP'
    },
    {
      id: 'bp_elder_breathless',
      text: {
        [Language.ENGLISH]: 'Do you experience breathlessness even at complete rest?',
        [Language.KANNADA]: 'ಮನೆಯಲ್ಲಿ ಕೇವಲ ವಿಶ್ರಾಂತಿ ಪಡೆಯುವಾಗಲೂ ಉಸಿರಾಟದ ತೊಂದರೆ ಆಗುತ್ತದೆಯೇ?'
      },
      voicePrompt: {
        [Language.ENGLISH]: 'Do you feel short of breath even while resting? Yes or no.',
        [Language.KANNADA]: 'ಸುಮ್ಮನೆ ಕೂತಾಗಲೂ ಉಸಿರಾಟಕ್ಕೆ ಕಷ್ಟ ಅನಿಸುತ್ತದೆಯೇ? ಹೌದು ಅಥವಾ ಇಲ್ಲ ತಿಳಿಸಿ.'
      },
      category: 'BP'
    },
    {
      id: 'bp_elder_diagnosis',
      text: {
        [Language.ENGLISH]: 'Have you been diagnosed with high blood pressure before?',
        [Language.KANNADA]: 'ನಿಮಗೆ ಈ ಹಿಂದೆ ಎಂದಾದರೂ ಅಧಿಕ ರಕ್ತದೊತ್ತಡದ ತೊಂದರೆ ಇದೆ ಎಂದು ಖಚಿತಪಡಿಸಲಾಗಿದೆಯೇ?'
      },
      voicePrompt: {
        [Language.ENGLISH]: 'Has high BP been detected before? Yes or no.',
        [Language.KANNADA]: 'ನಿಮಗೆ ಮುಂಚೆ ವೈದ್ಯರು ಬಿಪಿ ಇದೆ ಎಂದು ಬರೆದುಕೊಟ್ಟಿದ್ದಾರೆಯೇ? ಹೌದು ಅಥವಾ ಇಲ್ಲ ಹೇಳಿ.'
      },
      category: 'BP'
    },
    {
      id: 'bp_elder_meds',
      text: {
        [Language.ENGLISH]: 'Do you take blood pressure medication regularly?',
        [Language.KANNADA]: 'ನೀವು ಬಿಪಿಯ ಮಾತ್ರೆಗಳನ್ನು ನಿಯಮಿತವಾಗಿ ತೆಗೆದುಕೊಳ್ಳುತ್ತೀರಾ?'
      },
      voicePrompt: {
        [Language.ENGLISH]: 'Do you take high BP medication daily? Yes or no.',
        [Language.KANNADA]: 'ಬಿಪಿ ಮಾತ್ರೆಗಳನ್ನು ಕಾಯಂ ದಿನಾಲು ತೆಗೆದುಕೊಳ್ಳುತ್ತಿದ್ದೀರಾ? ಹೌದು ಅಥವಾ ಇಲ್ಲ ಹೇಳಿ.'
      },
      category: 'BP'
    },
    {
      id: 'bp_elder_missed',
      text: {
        [Language.ENGLISH]: 'Do you ever forget or miss your blood pressure medicine doses?',
        [Language.KANNADA]: 'ನೀವು ಎಂದಾದರೂ ತಪ್ಪದೇ ಮಾತ್ರೆಗಳನ್ನು ತೆಗೆದುಕೊಳ್ಳುವುದನ್ನು ಮರೆಯುತ್ತೀರಾ?'
      },
      voicePrompt: {
        [Language.ENGLISH]: 'Do you sometimes forget or miss doses of BP meds? Yes or no.',
        [Language.KANNADA]: 'ಮಾತ್ರೆ ನುಂಗಲು ಮರೆತುಬಿಡುವುದು ಆಗುತ್ತದೆಯೇ? ಹೌದು ಅಥವಾ ಇಲ್ಲ ಹೇಳಿ.'
      },
      category: 'BP'
    },
    {
      id: 'bp_elder_feet',
      text: {
        [Language.ENGLISH]: 'Do you have persistent swelling in both ankles or feet?',
        [Language.KANNADA]: 'ನಿಮ್ಮ ಎರಡೂ ಪಾದಗಳಲ್ಲಿ ಅಥವಾ ಹಿಮ್ಮಡಿಯಲ್ಲಿ ನೀರು ತುಂಬಿದಂತೆ ಊತ ಕಂಡುಬರುತ್ತದೆಯೇ?'
      },
      voicePrompt: {
        [Language.ENGLISH]: 'Is there constant swelling in your feet? Yes or no.',
        [Language.KANNADA]: 'ನಿಮ್ಮ ಎರಡು ಕಾಲುಗಳ ಪಾದ ಭಾಗ ತೀವ್ರ ಊದಿಕೊಂಡಿದೆಯೇ? ಹೌದು ಅಥವಾ ಇಲ್ಲ ತಿಳಿಸಿ.'
      },
      category: 'BP'
    },
    {
      id: 'bp_elder_vision',
      text: {
        [Language.ENGLISH]: 'Do you experience constant vision problems or blurriness?',
        [Language.KANNADA]: 'ನಿಮಗೆ ದೃಷ್ಟಿ ಮಂದವಾಗುವುದು ಅಥವಾ ದಿನೇ ದಿನೇ ಮಂಜಾಗುವ ತೊಂದರೆ ಇದೆಯೇ?'
      },
      voicePrompt: {
        [Language.ENGLISH]: 'Do you experience trouble with vision? Speak yes or no.',
        [Language.KANNADA]: 'ಕಣ್ಣಿನ ದೃಷ್ಟಿ ಕಡಮೆಯಾಗಿ ಮಸುಕು ಕಾಣಿಸುತ್ತದೆಯೇ? ಹೌದು ಅಥವಾ ಇಲ್ಲ ಹೇಳಿ.'
      },
      category: 'BP'
    },
    {
      id: 'bp_elder_stroke',
      text: {
        [Language.ENGLISH]: 'Do you have a personal history of stroke or paralysis?',
        [Language.KANNADA]: 'ನಿಮಗೆ ಹಿಂದೆ ಎಂದಾದರೂ ಪಾರ್ಶ್ವವಾಯು (ಲಕ್ವ) ಹೊಡೆದ ಇತಿಹಾಸ ವಿದೆಯೇ?'
      },
      voicePrompt: {
        [Language.ENGLISH]: 'Do you have history of stroke or brain paralysis? Yes or no.',
        [Language.KANNADA]: 'ನಿಮಗೆ ಹಿಂದೆ ಪಾರ್ಶ್ವವಾಯು ಅಥವಾ ಲಕ್ವ ರೋಗ ತಗುಲಿತ್ತೇ? ಹೌದು ಅಥವಾ ಇಲ್ಲ ಹೇಳಿ.'
      },
      category: 'BP'
    },
    {
      id: 'bp_elder_low_salt',
      text: {
        [Language.ENGLISH]: 'Do you strictly follow a low salt diet?',
        [Language.KANNADA]: 'ನೀವು ಊಟದಲ್ಲಿ ಕಡಿಮೆ ಉಪ್ಪು ಸೇವಿಸುವ ಪದ್ಧತಿಯನ್ನು ಅನುಸರಿಸುತ್ತೀರಾ?'
      },
      voicePrompt: {
        [Language.ENGLISH]: 'Do you eat low salt meals? Speak yes or no.',
        [Language.KANNADA]: 'ಊಟವನ್ನು ಅತಿ ಕಡಿಮೆ ಉಪ್ಪಿನೊಂದಿಗೆ ಸೇವಿಸುತ್ತೀರಾ? ಹೌದು ಅಥವಾ ಇಲ್ಲ ಹೇಳಿ.'
      },
      category: 'lifestyle'
    },
    {
      id: 'bp_elder_activity',
      text: {
        [Language.ENGLISH]: 'Are you able to maintain some light physical activity or walking?',
        [Language.KANNADA]: 'ನೀವು ಪ್ರತಿದಿನ ಸಣ್ಣದಾಗಿ ನಡಿಗೆ ಅಥವಾ ಹಗುರವಾದ ದೈಹಿಕ ಕೆಲಸಗಳನ್ನು ಮಾಡಲು ಶಕ್ತರಾಗಿದ್ದೀರಾ?'
      },
      voicePrompt: {
        [Language.ENGLISH]: 'Do you walk or stay active physically? Yes or no.',
        [Language.KANNADA]: 'ಪ್ರತಿದಿನ ಸಣ್ಣ ನಡಿಗೆ ಅಥವಾ ಸಾಧಾರಣ ಕೃತಿಗಳನ್ನು ಮಾಡಲು ಸಾಧ್ಯವಿದೆಯೇ? ಹೌದು ಅಥವಾ ಇಲ್ಲ ಹೇಳಿ.'
      },
      category: 'lifestyle'
    }
  ]
};

// Simulated houses for Ullal and Derlakatte regions primarily
export const SIMULATED_ASHA_MAP: AssignedHouse[] = [
  { id: 'H01', houseNumber: 'House No. 12', familyHead: 'Ramesh Gowda', screeningStatus: 'completed', riskRatio: 'medium', coords: { x: 12, y: 15 }, memberCount: 5, area: 'Ullal' },
  { id: 'H02', houseNumber: 'House No. 15', familyHead: 'Savitha Patil', screeningStatus: 'completed', riskRatio: 'low', coords: { x: 28, y: 18 }, memberCount: 4, area: 'Ullal' },
  { id: 'H03', houseNumber: 'House No. 19', familyHead: 'Venkat Rao', screeningStatus: 'overdue', riskRatio: null, coords: { x: 45, y: 12 }, memberCount: 3, area: 'Ullal' },
  { id: 'H04', houseNumber: 'House No. 22', familyHead: 'Basappa Nayak', screeningStatus: 'pending', riskRatio: null, coords: { x: 62, y: 22 }, memberCount: 6, area: 'Ullal' },
  { id: 'H05', houseNumber: 'House No. 28', familyHead: 'Anasuya Hegde', screeningStatus: 'completed', riskRatio: 'high', coords: { x: 80, y: 16 }, memberCount: 2, area: 'Ullal' },
  { id: 'H06', houseNumber: 'House No. 34', familyHead: 'Devendra Gowda', screeningStatus: 'pending', riskRatio: null, coords: { x: 15, y: 42 }, memberCount: 4, area: 'Ullal' },
  { id: 'H07', houseNumber: 'House No. 38', familyHead: 'Manjula K.', screeningStatus: 'completed', riskRatio: 'low', coords: { x: 34, y: 48 }, memberCount: 5, area: 'Ullal' },
  { id: 'H08', houseNumber: 'House No. 40', familyHead: 'Shrikant Bhat', screeningStatus: 'pending', riskRatio: null, coords: { x: 52, y: 40 }, memberCount: 3, area: 'Derlakatte' },
  { id: 'H09', houseNumber: 'House No. 45', familyHead: 'Rajanna Gowda', screeningStatus: 'completed', riskRatio: 'high', coords: { x: 74, y: 45 }, memberCount: 6, area: 'Derlakatte' },
  { id: 'H10', houseNumber: 'House No. 51', familyHead: 'Vijayamma M.', screeningStatus: 'overdue', riskRatio: null, coords: { x: 18, y: 72 }, memberCount: 4, area: 'Derlakatte' },
  { id: 'H11', houseNumber: 'House No. 55', familyHead: 'Ganesh Shett', screeningStatus: 'completed', riskRatio: 'medium', coords: { x: 38, y: 68 }, memberCount: 3, area: 'Derlakatte' },
  { id: 'H12', houseNumber: 'House No. 62', familyHead: 'Mohammad Shafi', screeningStatus: 'pending', riskRatio: null, coords: { x: 60, y: 75 }, memberCount: 5, area: 'Derlakatte' },
  { id: 'H13', houseNumber: 'House No. 68', familyHead: 'Saraswathi S.', coords: { x: 82, y: 70 }, screeningStatus: 'pending', riskRatio: null, memberCount: 4, area: 'Derlakatte' },
  { id: 'H14', houseNumber: 'House No. 71', familyHead: 'Channaiah Swamy', coords: { x: 48, y: 90 }, screeningStatus: 'completed', riskRatio: 'low', memberCount: 2, area: 'Derlakatte' }
];
