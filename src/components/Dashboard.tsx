import React, { useMemo, useState, useEffect } from 'react';
import { Need, Volunteer } from '../types';
import { ArrowUpRight, Map as MapIcon, Users, AlertCircle, TrendingUp, Sparkles, BrainCircuit, UserCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { MapView } from './Map';
import { aiService } from '../lib/ai';
import { useLanguage } from './LanguageContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, getDocs, doc, updateDoc, addDoc, setDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';

interface DashboardProps {
  needs: Need[];
}

export function Dashboard({ needs }: DashboardProps) {
  const { t } = useLanguage();
  const [prediction, setPrediction] = useState<string>("Loading predictive insights...");
  const [isAllocating, setIsAllocating] = useState(false);
  const [allocationLog, setAllocationLog] = useState<string[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);

  useEffect(() => {
    const fetchVolunteers = async () => {
      const snap = await getDocs(collection(db, 'volunteers'));
      setVolunteers(snap.docs.map(d => ({ uid: d.id, ...d.data() } as Volunteer)));
    };
    fetchVolunteers();
  }, [needs]); // Refresh when needs change to keep mappings fresh

  useEffect(() => {
    if (needs.length > 3) {
      aiService.predictFutureNeeds(needs).then(setPrediction);
    }
  }, [needs]);

  const stats = useMemo(() => {
    return {
      total: needs.length,
      critical: needs.filter(n => n.severity === 'critical' || n.priorityScore > 80).length,
      assigned: needs.filter(n => n.status === 'assigned' || n.status === 'in-progress').length,
      resolved: needs.filter(n => n.status === 'resolved').length
    };
  }, [needs]);

  const criticalGap = useMemo(() => {
    return needs.find(n => n.priorityScore > 90 && n.status === 'reported');
  }, [needs]);

  const handleSeedVolunteers = async () => {
    const mockVolunteers: Partial<Volunteer>[] = [
      { name: "Dr. Amara (Medical)", skills: ["medical"], available: true, activeTasks: 0, location: { lat: 19.07, lng: 72.87 } },
      { name: "Suresh (Water Tech)", skills: ["water"], available: true, activeTasks: 0, location: { lat: 19.08, lng: 72.88 } },
      { name: "Anita (Engg)", skills: ["infrastructure"], available: true, activeTasks: 0, location: { lat: 19.09, lng: 72.89 } },
      { name: "Rahul (General)", skills: ["food", "education"], available: true, activeTasks: 0, location: { lat: 19.10, lng: 72.90 } },
    ];

    for (const v of mockVolunteers) {
      await addDoc(collection(db, 'volunteers'), {
        ...v,
        uid: `mock-${Math.random().toString(36).substr(2, 9)}`,
        lastActive: new Date().toISOString(),
        tasksCompleted: 0,
        fatigueLevel: 0
      });
    }
    alert("Field Personnel Synchronized (4 new specialists added)");
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleAutoAllocate = async () => {
    setIsAllocating(true);
    setAllocationLog([]);
    try {
      const volSnap = await getDocs(collection(db, 'volunteers'));
      const fetchedVolunteers = volSnap.docs.map(d => ({ uid: d.id, ...d.data() } as Volunteer));
      
      const unassigned = needs.filter(n => n.status === 'reported').sort((a, b) => b.priorityScore - a.priorityScore);
      
      for (const need of unassigned) {
        let bestVolunteer: Volunteer | null = null;
        let maxScore = -1;

        const eligible = fetchedVolunteers.filter(v => v.available && (v.activeTasks || 0) < 3);

        for (const v of eligible) {
          let score = 0;
          
          // 1. Skill Match (40 pts)
          if (v.skills?.includes(need.category)) score += 40;
          else if (v.skills?.includes('general')) score += 15;

          // 2. Distance (40 pts)
          if (need.location && v.location) {
            const dist = calculateDistance(need.location.lat, need.location.lng, v.location.lat, v.location.lng);
            // 40 points for 0km, sliding down effectively (e.g., 20km = 0pts)
            score += Math.max(0, 40 * (1 - dist / 20));
          }

          // 3. Capacity (20 pts)
          const load = v.activeTasks || 0;
          score += (3 - load) * 6.6; 

          if (score > maxScore) {
            maxScore = score;
            bestVolunteer = v;
          }
        }

        if (bestVolunteer && maxScore > 25) {
          await updateDoc(doc(db, 'needs', need.id), {
            status: 'assigned',
            assignedVolunteerId: bestVolunteer.uid
          });
          
          const newCount = (bestVolunteer.activeTasks || 0) + 1;
          bestVolunteer.activeTasks = newCount;
          
          await setDoc(doc(db, 'volunteers', bestVolunteer.uid), {
            activeTasks: newCount,
            lastActive: new Date().toISOString()
          }, { merge: true });

          const isCrossField = !bestVolunteer.skills?.includes(need.category);
          setAllocationLog(prev => [...prev, `${isCrossField ? '⚠️ ' : '✅ '}Matched "${need.description.slice(0, 15)}..." to ${bestVolunteer!.name} (Score: ${Math.round(maxScore)})`]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAllocating(false);
      setTimeout(() => setAllocationLog([]), 8000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-black tracking-tighter italic text-slate-900 leading-none">{t('missionControl')}</h2>
          <p className="text-slate-500 font-medium">{t('missionControlDesc')}</p>
        </div>
        
        <div className="flex flex-col gap-4">
          <button 
            onClick={handleSeedVolunteers}
            className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors flex items-center gap-2 self-end"
          >
            <Users className="h-3 w-3" />
            Seed Demo Personnel
          </button>
          
          <div className="bg-slate-900 text-white p-6 rounded-[32px] flex items-center gap-6 max-w-lg shadow-2xl shadow-slate-300 relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-blue-500/20 transition-colors" />
             
             <div className="h-12 w-12 rounded-2xl bg-blue-500/20 flex items-center justify-center flex-shrink-0 animate-pulse relative z-10 font-black">
                <BrainCircuit className="h-6 w-6 text-blue-400" />
             </div>
             <div className="overflow-hidden relative z-10">
               <div className="flex items-center gap-2 mb-1">
                 <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">{t('predictiveInsight')}</span>
                 <Sparkles className="h-3 w-3 text-amber-400" />
               </div>
               <p className="text-xs text-slate-300 italic leading-relaxed" title={prediction}>"{prediction}"</p>
             </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {criticalGap && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-red-50 border-2 border-red-100 p-6 rounded-[32px] flex items-center justify-between gap-6"
          >
            <div className="flex items-center gap-6">
              <div className="h-14 w-14 rounded-2xl bg-red-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-red-200">
                 <AlertCircle className="text-white h-7 w-7" />
              </div>
              <div>
                 <h4 className="font-black text-red-900 text-lg tracking-tight uppercase">{t('criticalGapTitle')}</h4>
                 <p className="text-sm text-red-700 font-medium max-w-xl">A priority index {criticalGap.priorityScore} need requires immediate {criticalGap.category} intervention.</p>
              </div>
            </div>
            <button 
              onClick={handleAutoAllocate}
              disabled={isAllocating}
              className="px-6 py-3 bg-red-600 text-white text-[10px] font-black rounded-xl hover:bg-red-700 transition-all uppercase tracking-widest active:scale-95 disabled:opacity-50"
            >
              {isAllocating ? 'Synthesizing...' : t('recruitFieldStaff')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label={t('totalNeeds')} value={stats.total} icon={MapIcon} trend="+12% volume" color="slate" />
        <StatCard label={t('criticalGaps')} value={stats.critical} icon={AlertCircle} color="red" />
        <StatCard label={t('activePersonnel')} value={stats.assigned} icon={Users} color="blue" />
        <StatCard label={t('resolved')} value={stats.resolved} icon={TrendingUp} color="emerald" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-black text-xs uppercase tracking-[0.2em] text-slate-400">Tactical Map Overview</h3>
            <button 
              onClick={handleAutoAllocate}
              disabled={isAllocating}
              className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-2 hover:text-blue-600 transition-colors"
            >
              <Sparkles className="h-3 w-3" />
              {t('allocationStrategy')}
            </button>
          </div>
          <div className="bg-white rounded-[40px] border border-slate-100 p-2 shadow-2xl shadow-slate-100 overflow-hidden h-[500px]">
            <MapView needs={needs} />
          </div>

          <div className="pt-10 space-y-6">
            <h3 className="font-black text-xs uppercase tracking-[0.2em] text-slate-400">Global Needs Directory</h3>
            <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-xl shadow-slate-100">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="bg-slate-50 border-b border-slate-100">
                     <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Status</th>
                     <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Description</th>
                     <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Category</th>
                     <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Responder</th>
                     <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 text-right">Priority</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                   {needs.sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime()).map(need => {
                     const assignedVol = volunteers.find(v => v.uid === need.assignedVolunteerId);
                     const isCrossField = assignedVol && !assignedVol.skills?.includes(need.category);
                     
                     return (
                       <tr key={need.id} className="hover:bg-slate-50/50 transition-colors group">
                         <td className="px-6 py-4">
                           <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                             need.status === 'resolved' ? 'bg-emerald-50 text-emerald-600' :
                             need.status === 'assigned' ? 'bg-blue-50 text-blue-600' :
                             'bg-slate-50 text-slate-400'
                           }`}>
                             {need.status}
                           </span>
                         </td>
                         <td className="px-6 py-4">
                           <p className="text-sm font-bold text-slate-800 line-clamp-1 group-hover:line-clamp-none transition-all">{need.description}</p>
                         </td>
                         <td className="px-6 py-4">
                           <span className="text-[10px] font-black text-slate-400 uppercase">{need.category}</span>
                         </td>
                         <td className="px-6 py-4">
                           {assignedVol ? (
                             <div className="flex flex-col">
                               <span className="text-[10px] font-bold text-slate-700">{assignedVol.name}</span>
                               {isCrossField && (
                                 <span className="text-[8px] font-black text-amber-600 uppercase flex items-center gap-1">
                                   <AlertTriangle className="h-2 w-2" />
                                   Cross-Field
                                 </span>
                               )}
                             </div>
                           ) : (
                             <span className="text-[10px] text-slate-300 italic font-medium">Unassigned</span>
                           )}
                         </td>
                         <td className="px-6 py-4 text-right">
                           <span className="text-sm font-black text-slate-900">{need.priorityScore}</span>
                         </td>
                       </tr>
                     );
                   })}
                 </tbody>
               </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="font-black text-xs uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
            {t('livePriorityQueue')}
          </h3>
          
          <div className="space-y-4 max-h-[440px] overflow-y-auto pr-2 custom-scrollbar">
            {allocationLog.length > 0 && (
              <div className="bg-blue-600 text-white p-4 rounded-2xl text-[10px] font-bold space-y-1 animate-pulse">
                {allocationLog.map((log, i) => <div key={i}>• {log}</div>)}
              </div>
            )}
            
            {needs
              .filter(n => n.status !== 'resolved')
              .sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0))
              .slice(0, 10)
              .map((need) => (
                <div key={need.id} className="bg-white p-6 rounded-[24px] border border-slate-50 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 group cursor-pointer relative overflow-hidden">
                  {need.imageUrl && (
                    <div className="absolute top-0 right-0 w-16 h-16 opacity-10 group-hover:opacity-20 transition-opacity">
                       <img src={need.imageUrl} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      need.severity === 'critical' ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-500'
                    }`}>
                      {need.category}
                    </span>
                    <span className="text-2xl font-black text-slate-900 tracking-tighter">{need.priorityScore || '?'}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-800 mb-3 line-clamp-2 leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity italic">"{need.description}"</p>
                  
                  <div className="flex flex-col gap-3 border-t pt-4">
                    <div className="flex items-center justify-between text-[10px]">
                       <span className="font-black text-slate-300 uppercase underline decoration-2 decoration-blue-500/20">{need.status.replace('-', ' ')}</span>
                       <span className="font-bold text-slate-400">{new Date(need.reportedAt).toLocaleDateString()}</span>
                    </div>
                    
                    {need.assignedVolunteerId && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-slate-900 rounded-xl text-white">
                         <UserCircle className="h-4 w-4 text-blue-400" />
                         <span className="text-[10px] font-black uppercase tracking-tighter truncate">Staff_ID: {need.assignedVolunteerId.slice(0, 8)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color = 'slate', trend }: any) {
  const colors = {
    red: 'text-red-600 bg-red-50 border-red-100',
    blue: 'text-blue-600 bg-blue-50 border-blue-100',
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    slate: 'text-slate-900 bg-slate-50 border-slate-100'
  };

  return (
    <div className="bg-white p-8 rounded-[32px] border border-slate-50 shadow-sm hover:shadow-md transition-shadow flex items-start justify-between group">
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 opacity-60 group-hover:opacity-100 transition-opacity">{label}</p>
        <h4 className="text-4xl font-black tracking-tighter text-slate-900">{value}</h4>
        {trend && <p className="text-[10px] font-bold text-emerald-500 mt-2 flex items-center gap-1"><TrendingUp className="h-3 w-3 "/> {trend}</p>}
      </div>
      <div className={`p-4 rounded-2xl border ${(colors as any)[color]}`}>
        <Icon className="h-6 w-6" />
      </div>
    </div>
  );
}
