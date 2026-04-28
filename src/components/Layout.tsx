import React from 'react';
import { LayoutDashboard, Send, User, LogOut, Heart, BarChart3, Languages, Sparkles } from 'lucide-react';
import { AppView } from '../types';
import { useLanguage } from './LanguageContext';

interface LayoutProps {
  children: React.ReactNode;
  user: any;
  view: AppView;
  setView: (view: AppView) => void;
  onLogout: () => void;
}

export function Layout({ children, user, view, setView, onLogout }: LayoutProps) {
  const { language, setLanguage, t } = useLanguage();

  const navItems = [
    { id: 'ngo', label: t('missionControl'), icon: LayoutDashboard },
    { id: 'report', label: t('reportNeed'), icon: Send },
    { id: 'volunteer', label: t('volunteerPortal'), icon: Heart },
    { id: 'impact', label: t('impactAnalytics'), icon: BarChart3 },
    { id: 'chat', label: t('askSahyog'), icon: Sparkles },
  ] as const;

  return (
    <div className="flex h-screen bg-[#f8f9fa] overflow-hidden">
      {/* Side Sidebar Navigation */}
      <aside className="w-72 border-r bg-white p-8 hidden md:flex flex-col">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-slate-900 rounded-[12px] flex items-center justify-center shadow-lg shadow-slate-200">
              <Heart className="text-white h-6 w-6" />
            </div>
            <span className="text-2xl font-black tracking-tighter italic">SAHYOG</span>
          </div>
          
          <button 
            onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
            className="p-2 rounded-xl hover:bg-slate-50 text-slate-400 transition-all flex items-center gap-2 text-[10px] font-black border border-transparent hover:border-slate-100 uppercase"
          >
            <Languages className="h-4 w-4" />
            {language}
          </button>
        </div>

        <nav className="space-y-2 flex-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-bold transition-all ${
                view === item.id
                  ? 'bg-slate-900 text-white shadow-xl shadow-slate-200 scale-[1.02]'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-8 border-t space-y-6">
          <div className="p-4 bg-slate-50 rounded-[20px] border border-slate-100">
             <div className="flex items-center gap-3 mb-3">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('networkStatus')}</span>
             </div>
             <div className="space-y-2">
               <div className="flex justify-between items-center text-[10px] font-mono italic">
                 <span className="text-slate-500">{t('fieldDataSync')}</span>
                 <span className="text-emerald-600 font-bold">ACTIVE</span>
               </div>
               <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                 <div className="h-full bg-emerald-500 w-[100%]" />
               </div>
             </div>
          </div>

          <div className="flex items-center gap-4 px-2">
            <img 
              src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} 
              alt="User" 
              className="h-12 w-12 rounded-2xl object-cover ring-4 ring-slate-50 border border-white"
            />
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold truncate text-slate-900 uppercase tracking-tighter">{user.displayName || 'Humanitarian'}</p>
              <button 
                onClick={onLogout}
                className="text-[10px] font-bold text-red-500 hover:text-red-600 transition-colors uppercase tracking-widest flex items-center gap-1"
              >
                {t('signOut')} <LogOut className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto w-full">
        <div className="md:hidden flex items-center justify-between p-6 bg-white border-b">
           <span className="text-2xl font-black tracking-tighter italic">SAHYOG</span>
           <div className="flex items-center gap-4">
             <button onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')} className="text-slate-400 font-bold text-xs uppercase">{language}</button>
             <button onClick={onLogout} className="text-red-500"><LogOut className="h-6 w-6"/></button>
           </div>
        </div>
        <div className="p-6 md:p-12">
          {children}
        </div>
      </main>
    </div>
  );
}
