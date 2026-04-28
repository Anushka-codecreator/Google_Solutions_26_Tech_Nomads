import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'hi';

interface Translation {
  [key: string]: {
    en: string;
    hi: string;
  };
}

const translations: Translation = {
  missionControl: { en: 'Mission Control', hi: 'मिशन कंट्रोल' },
  reportNeed: { en: 'Citizen Portal', hi: 'नागरिक पोर्टल' },
  volunteerPortal: { en: 'Volunteer Portal', hi: 'स्वयंसेवक पोर्टल' },
  impactAnalytics: { en: 'Impact Analytics', hi: 'प्रभाव विश्लेषण' },
  askSahyog: { en: 'Ask Sahyog AI', hi: 'सहयोग एआई से पूछें' },
  criticalGaps: { en: 'Critical Gaps', hi: 'गंभीर कमियां' },
  activePersonnel: { en: 'Active Personnel', hi: 'सक्रिय कर्मी' },
  predictiveInsight: { en: 'Predictive Intelligence', hi: 'अनुमानित बुद्धिमत्ता' },
  peopleReached: { en: 'People Reached', hi: 'पहुंचे हुए लोग' },
  tasksResolved: { en: 'Tasks Resolved', hi: 'पूर्ण किए गए कार्य' },
  totalImpactHours: { en: 'Total Impact Hours', hi: 'कुल प्रभाव घंटे' },
  avgResolution: { en: 'Avg Resolution', hi: 'औसत समाधान' },
  networkStatus: { en: 'Network Status', hi: 'नेटवर्क स्थिति' },
  fieldDataSync: { en: 'Field Data Sync', hi: 'डेटा सिंक' },
  signOut: { en: 'Sign Out', hi: 'साइन आउट' },
  totalNeeds: { en: 'Total Needs', hi: 'कुल जरूरतें' },
  resolved: { en: 'Resolved', hi: 'समाधान किया गया' },
  dispatchToCloud: { en: 'Dispatch to Cloud', hi: 'क्लाउड पर भेजें' },
  discard: { en: 'Discard', hi: 'खारिज करें' },
  analyzeWithGemini: { en: 'Synthesize with Gemini', hi: 'जेमिनी के साथ विश्लेषण करें' },
  rawInput: { en: 'Raw Input Stream', hi: 'कच्चा इनपुट स्ट्रीम' },
  intelligenceIntake: { en: 'Intelligence Intake', hi: 'खुफिया जानकारी' },
  reportPlaceholder: { en: 'e.g. 20 families in Ward 7 need clean water...', hi: 'उदा. वार्ड 7 में 20 परिवारों को साफ पानी की जरूरत है...' },
  missionControlDesc: { en: 'Real-time aggregate of community intelligence.', hi: 'सामुदायिक खुफिया जानकारी का रीयल-टाइम एग्रीगेट।' },
  criticalGapTitle: { en: 'Critical Gap Detected', hi: 'गंभीर अंतर का पता चला' },
  recruitFieldStaff: { en: 'Recruit Field Staff', hi: 'फील्ड स्टाफ की भर्ती करें' },
  livePriorityQueue: { en: 'Live Priority Queue', hi: 'लाइव प्राथमिकता कतार' },
  allocationStrategy: { en: 'Allocation Strategy', hi: 'आवंटन रणनीति' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string) => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}
