import React, { useState, useEffect } from 'react';
import { Need, Volunteer } from '../types';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { ReportNeed } from './ReportNeed';
import { useLanguage } from './LanguageContext';
import { Clock, CheckCircle2, UserCircle, MapPin, Plus, List, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CitizenPortalProps {
  user: any;
  needs: Need[];
}

export function CitizenPortal({ user, needs }: CitizenPortalProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'history' | 'report'>('report');
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);

  useEffect(() => {
    const fetchVolunteers = async () => {
      const snap = await getDocs(collection(db, 'volunteers'));
      setVolunteers(snap.docs.map(d => ({ uid: d.id, ...d.data() } as Volunteer)));
    };
    fetchVolunteers();
  }, []);

  const myReports = needs.filter(n => n.reportedBy === user.uid);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black tracking-tighter italic text-slate-900 leading-none">Citizen Portal</h2>
          <p className="text-slate-500 font-medium mt-2">Report needs and track your impact on the community.</p>
        </div>

        <div className="flex bg-slate-100 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab('report')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === 'report' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Plus className="h-4 w-4" />
            Report Need
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === 'history' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <List className="h-4 w-4" />
            My Reports ({myReports.length})
          </button>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {activeTab === 'report' ? (
          <motion.div
            key="report"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
          >
            <ReportNeed user={user} />
          </motion.div>
        ) : (
          <motion.div
            key="history"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-6"
          >
            {myReports.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-[32px] p-20 text-center space-y-4">
                <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-300">
                  <Sparkles className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">No reports filed yet</h3>
                <p className="text-slate-500 max-w-xs mx-auto">Your contributions help humanitarian efforts reach those in need. Start by reporting a finding from the field.</p>
                <button 
                   onClick={() => setActiveTab('report')}
                   className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:scale-105 active:scale-95 transition-all"
                >
                  Create First Report
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {myReports.sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime()).map(need => {
                  const assignedVolunteer = volunteers.find(v => v.uid === need.assignedVolunteerId);
                  
                  return (
                    <div key={need.id} className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-100/50 p-8 flex flex-col md:flex-row gap-8 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-2 h-full bg-slate-900/5" />
                      
                      {need.imageUrl && (
                        <div className="w-full md:w-32 h-32 rounded-2xl overflow-hidden flex-shrink-0">
                           <img src={need.imageUrl} alt="Context" className="w-full h-full object-cover" />
                        </div>
                      )}

                      <div className="flex-1 space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                              need.status === 'resolved' ? 'bg-emerald-50 text-emerald-600' :
                              need.status === 'assigned' ? 'bg-blue-50 text-blue-600' :
                              'bg-amber-50 text-amber-600'
                            }`}>
                              {need.status}
                            </span>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest pt-1">
                               <Clock className="h-3 w-3" />
                               Reported {new Date(need.reportedAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="text-right">
                             <span className="text-2xl font-black text-slate-900 tracking-tighter">{need.priorityScore}</span>
                             <p className="text-[8px] font-black text-slate-300 uppercase leading-none">Priority Index</p>
                          </div>
                        </div>

                        <p className="text-lg font-bold text-slate-800 leading-tight">"{need.description}"</p>

                        <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-slate-50">
                           <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-slate-300" />
                              <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Sector {Math.floor(need.location.lat)}</span>
                           </div>
                           
                           {assignedVolunteer ? (
                             <div className="flex items-center gap-3 px-4 py-2 bg-blue-50/50 rounded-2xl border border-blue-100">
                               <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                 <UserCircle className="h-5 w-5" />
                               </div>
                               <div>
                                 <label className="text-[8px] font-black text-blue-400 uppercase tracking-[0.2em] block">Assigned Volunteer</label>
                                 <span className="text-xs font-bold text-slate-900">{assignedVolunteer.name}</span>
                                 <span className="text-[10px] text-slate-400 ml-2">({assignedVolunteer.skills?.[0]})</span>
                               </div>
                             </div>
                           ) : (
                             <div className="flex items-center gap-2 text-slate-300 italic text-xs font-medium">
                               <Sparkles className="h-4 w-4" />
                               AI matching in progress...
                             </div>
                           )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
