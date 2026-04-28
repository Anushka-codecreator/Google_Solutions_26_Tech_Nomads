import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
import { Need, Volunteer, AuthState, AppView } from './types';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { ReportNeed } from './components/ReportNeed';
import { VolunteerPortal } from './components/VolunteerPortal';
import { CitizenPortal } from './components/CitizenPortal';
import { ImpactAnalytics } from './components/ImpactAnalytics';
import { AIAssistant } from './components/AIAssistant';
import { LanguageProvider } from './components/LanguageContext';
import { LogIn, UserCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    role: null
  });
  const [needs, setNeeds] = useState<Need[]>([]);
  const [view, setView] = useState<AppView>('ngo');

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setAuthState({
        user,
        loading: false,
        role: user ? (user.email?.includes('ngo') ? 'ngo' : 'volunteer') : null
      });
    });

    const q = query(collection(db, 'needs'), orderBy('reportedAt', 'desc'), limit(50));
    const needsPath = 'needs';
    const unsubNeeds = onSnapshot(q, (snapshot) => {
      const needsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Need));
      setNeeds(needsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, needsPath);
    });

    return () => {
      unsubAuth();
      unsubNeeds();
    };
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Login failed", err);
    }
  };

  if (authState.loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-2xl font-bold text-slate-400"
        >
          Sahyog
        </motion.div>
      </div>
    );
  }

  return (
    <LanguageProvider>
      <div className="min-h-screen">
        {!authState.user ? (
          <div className="flex h-screen items-center justify-center p-6 bg-[#fbfbfb]">
            <div className="max-w-[480px] w-full space-y-12 animate-in fade-in zoom-in duration-700">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 text-white rounded-full text-[10px] font-bold uppercase tracking-widest mx-auto">
                   <Sparkles className="h-3 w-3 text-amber-400" />
                   Alpha Release 0.8
                </div>
                <h1 className="text-6xl font-black tracking-tighter italic text-slate-900 pointer-events-none">
                  SAHYOG<span className="text-blue-600">.</span>
                </h1>
                <p className="text-slate-500 text-lg leading-relaxed max-w-sm mx-auto">
                  Transforming chaotic field reports into structured humanitarian intelligence.
                </p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={handleLogin}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl bg-slate-900 px-6 py-5 font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-slate-200"
                >
                  <LogIn className="h-5 w-5" />
                  Continue with Google Identity
                </button>
                <div className="flex items-center gap-4 py-2">
                  <div className="h-px bg-slate-200 flex-1" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Environment</span>
                  <div className="h-px bg-slate-200 flex-1" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-3xl border border-slate-100 p-6 text-left bg-white shadow-sm hover:shadow-md transition-shadow cursor-default group">
                    <ShieldCheck className="mb-4 h-8 w-8 text-blue-600 group-hover:scale-110 transition-transform" />
                    <h3 className="font-bold text-slate-900">NGO Control</h3>
                    <p className="text-xs text-slate-500 leading-normal">Mission management and predictive reporting.</p>
                  </div>
                  <div className="rounded-3xl border border-slate-100 p-6 text-left bg-white shadow-sm hover:shadow-md transition-shadow cursor-default group">
                    <UserCircle className="mb-4 h-8 w-8 text-emerald-600 group-hover:scale-110 transition-transform" />
                    <h3 className="font-bold text-slate-900">Volunteer Hub</h3>
                    <p className="text-xs text-slate-500 leading-normal">Smart task allocation and field coordination.</p>
                  </div>
                </div>
              </div>
              
              <footer className="text-center">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] opacity-50">Secure • Real-time • AI-Augmented</p>
              </footer>
            </div>
          </div>
        ) : (
          <Layout 
            user={authState.user} 
            view={view} 
            setView={setView}
            onLogout={() => signOut(auth)}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={view}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, type: 'spring' }}
                className="p-6"
              >
                {view === 'ngo' && <Dashboard needs={needs} />}
                {view === 'report' && <CitizenPortal user={authState.user} needs={needs} />}
                {view === 'volunteer' && <VolunteerPortal user={authState.user} needs={needs} />}
                {view === 'impact' && <ImpactAnalytics needs={needs} />}
                {view === 'chat' && <AIAssistant needs={needs} />}
              </motion.div>
            </AnimatePresence>
          </Layout>
        )}
      </div>
    </LanguageProvider>
  );
}
