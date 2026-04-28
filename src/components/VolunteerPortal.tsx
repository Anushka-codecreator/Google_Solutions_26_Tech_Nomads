import React, { useState, useEffect, useMemo } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Need, Volunteer } from '../types';
import { aiService } from '../lib/ai';
import { useLanguage } from './LanguageContext';
import { doc, updateDoc, collection, query, where, getDocs, setDoc } from 'firebase/firestore';
import { Heart, Navigation, CheckCircle, Clock, MapPin, Search, Sparkles, UserCircle, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface VolunteerPortalProps {
  user: any;
  needs: Need[];
}

export function VolunteerPortal({ user, needs }: VolunteerPortalProps) {
  const { t } = useLanguage();
  const [matchingTask, setMatchingTask] = useState<Need | null>(null);
  const [isMatching, setIsMatching] = useState(false);
  const [activeTask, setActiveTask] = useState<Need | null>(null);

  useEffect(() => {
    const myTask = needs.find(n => n.assignedVolunteerId === user.uid && n.status !== 'resolved');
    setActiveTask(myTask || null);
  }, [needs, user.uid]);

  const [userProfile, setUserProfile] = useState<Volunteer | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const snap = await getDocs(query(collection(db, 'volunteers'), where('uid', '==', user.uid)));
      if (!snap.empty) {
        setUserProfile({ uid: snap.docs[0].id, ...snap.docs[0].data() } as Volunteer);
      }
    };
    fetchProfile();
  }, [user.uid]);

  const handleJoinVolunteer = async () => {
    const newProfile: Volunteer = {
      uid: user.uid,
      name: user.displayName || 'Volunteer',
      skills: ['medical'],
      available: true,
      lastActive: new Date().toISOString(),
      tasksCompleted: 0,
      activeTasks: 0,
      fatigueLevel: 0,
      location: { lat: 19.07, lng: 72.87 }
    };
    await setDoc(doc(db, 'volunteers', user.uid), newProfile);
    setUserProfile(newProfile);
  };

  const handleDeactivateProfile = async () => {
    if (!userProfile) return;
    if (confirm("This will remove your responder profile and stop all task assignments. Continue?")) {
      await updateDoc(doc(db, 'volunteers', userProfile.uid), {
        available: false,
        activeTasks: 0
      });
      setUserProfile(null);
      // In a real app we might delete the doc or use a proper 'role' field
    }
  };

  const updateSkills = async (skill: string) => {
    if (!userProfile) return;
    const currentSkills = userProfile.skills || [];
    const newSkills = currentSkills.includes(skill) 
      ? currentSkills.filter(s => s !== skill)
      : [...currentSkills, skill];
    
    await setDoc(doc(db, 'volunteers', userProfile.uid), {
      skills: newSkills
    }, { merge: true });
    setUserProfile(prev => prev ? { ...prev, skills: newSkills } : null);
  };

  const fatigueLevel = useMemo(() => {
    const myResolved = needs.filter(n => n.assignedVolunteerId === user.uid && n.status === 'resolved');
    return Math.min(100, myResolved.length * 20); // 5 missions = 100% fatigue for demo
  }, [needs, user.uid]);

  const activeTasksCount = useMemo(() => {
    return needs.filter(n => n.assignedVolunteerId === user.uid && n.status !== 'resolved').length;
  }, [needs, user.uid]);

  const runSmartMatch = async () => {
    setIsMatching(true);
    try {
      await new Promise(r => setTimeout(r, 1500));
      const openNeeds = needs.filter(n => n.status === 'reported');
      if (openNeeds.length === 0) return;

      // Use AI to match based on the actual profile
      const bestMatchId = await aiService.matchVolunteer(openNeeds[0], userProfile ? [userProfile] : []);
      const matchedNeed = openNeeds.find(n => n.id === bestMatchId) || openNeeds.sort((a, b) => b.priorityScore - a.priorityScore)[0];
      
      setMatchingTask(matchedNeed);
    } catch (e) {
      console.error(e);
    } finally {
      setIsMatching(false);
    }
  };

  const handleAcceptTask = async (task: Need) => {
    try {
      const taskRef = doc(db, 'needs', task.id);
      await updateDoc(taskRef, {
        status: 'assigned',
        assignedVolunteerId: user.uid
      });

      // Update volunteer workload
      if (userProfile) {
        const newCount = (userProfile.activeTasks || 0) + 1;
        await setDoc(doc(db, 'volunteers', userProfile.uid), {
          activeTasks: newCount,
          lastActive: new Date().toISOString()
        }, { merge: true });
        setUserProfile(prev => prev ? { ...prev, activeTasks: newCount } : null);
      }

      setMatchingTask(null);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `needs/${task.id}`);
    }
  };

  const handleResolveTask = async (task: Need) => {
    try {
      const taskRef = doc(db, 'needs', task.id);
      await updateDoc(taskRef, {
        status: 'resolved'
      });

      // Update volunteer workload (decrement)
      if (userProfile) {
        const newCount = Math.max(0, (userProfile.activeTasks || 0) - 1);
        const newCompleted = (userProfile.tasksCompleted || 0) + 1;
        await setDoc(doc(db, 'volunteers', userProfile.uid), {
          activeTasks: newCount,
          tasksCompleted: newCompleted,
          lastActive: new Date().toISOString()
        }, { merge: true });
        setUserProfile(prev => prev ? { ...prev, activeTasks: newCount, tasksCompleted: newCompleted } : null);
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `needs/${task.id}`);
    }
  };

  if (!userProfile) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="h-24 w-24 bg-blue-50 rounded-[40px] flex items-center justify-center mx-auto text-blue-600 shadow-xl shadow-blue-100">
          <Heart className="h-12 w-12" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black tracking-tighter text-slate-900 uppercase">Ready to Respond?</h2>
          <p className="text-slate-500 leading-relaxed font-medium">Join our network of field specialists and community responders to start receiving AI-matched humanitarian tasks.</p>
        </div>
        <button
          onClick={handleJoinVolunteer}
          className="w-full bg-slate-900 text-white rounded-[24px] py-6 font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-slate-300 flex items-center justify-center gap-3"
        >
          <Sparkles className="h-5 w-5 text-amber-400" />
          Initialize Field Profile
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Volunteer Portal</h2>
          <p className="text-slate-500">Find where your skills can make the most impact.</p>
          <div className="flex flex-wrap gap-2 mt-4">
            {['medical', 'water', 'infrastructure', 'food', 'education'].map(skill => (
              <button
                key={skill}
                onClick={() => updateSkills(skill)}
                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                  userProfile?.skills?.includes(skill)
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                    : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>
        
        {fatigueLevel > 70 && (
          <div className="bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900 uppercase">Burnout Detected: Fatigue {fatigueLevel}%</p>
              <p className="text-[10px] text-amber-700 font-medium">You have completed several missions recently. AI suggests a 4-hour rest period.</p>
            </div>
          </div>
        )}

        {!activeTask && (
          <button
            onClick={runSmartMatch}
            disabled={isMatching}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all disabled:opacity-50"
          >
            {isMatching ? <motion.div animate={{ rotate: 360 }} duration={1} repeat={Infinity}><Sparkles className="h-5 w-5" /></motion.div> : <Search className="h-5 w-5" />}
            AI Smart Match
          </button>
        )}
        <button 
           onClick={handleDeactivateProfile}
           className="text-[10px] font-black text-red-400 uppercase tracking-widest hover:text-red-600 self-end mt-2"
        >
          Deactivate Profile
        </button>
      </header>

      {activeTask ? (
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white border-2 border-emerald-500 rounded-3xl p-8 shadow-xl space-y-6"
        >
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wider">
               <Clock className="h-3 w-3" />
               Current Assignment
             </div>
             <span className="text-xs font-mono text-slate-400">#TSK-{activeTask.id.slice(0, 6)}</span>
          </div>

          <div>
            <h3 className="text-2xl font-bold mb-2">{activeTask.description}</h3>
            <div className="flex items-center gap-2 text-slate-500 mb-4">
               <MapPin className="h-4 w-4" />
               <span className="text-sm font-medium">Sector {Math.floor(activeTask.location.lat)} • Mumbai Region</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Priority Index</label>
                <p className="text-xl font-mono text-slate-900">{activeTask.priorityScore}</p>
             </div>
             <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Category</label>
                <p className="text-xl font-bold text-slate-900 capitalize">{activeTask.category}</p>
             </div>
          </div>

          {!userProfile?.skills?.includes(activeTask.category) && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <p className="text-xs font-bold text-amber-800 uppercase tracking-tight">
                Cross-Field assistance requested: This task is outside your primary skills.
              </p>
            </div>
          )}

          <button
            onClick={() => handleResolveTask(activeTask)}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-colors shadow-lg"
          >
            <CheckCircle className="h-5 w-5" />
            Mark Task as Resolved
          </button>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {matchingTask ? (
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-8 space-y-6"
            >
              <div className="flex items-center gap-2 text-amber-700 font-bold text-sm tracking-tight">
                <Sparkles className="h-4 w-4" />
                AI Recommendation Engine Found a Match
              </div>
              <h3 className="text-2xl font-bold">{matchingTask.description}</h3>
              <p className="text-slate-600 italic leading-relaxed text-sm">
                "Based on your proximity and general first-aid skills, this {matchingTask.category} need at {matchingTask.location.lat.toFixed(2)} is a high-priority match."
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => handleAcceptTask(matchingTask)}
                  className="flex-1 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-md"
                >
                  Accept Mission
                </button>
                <button
                  onClick={() => setMatchingTask(null)}
                  className="px-6 py-3 border border-amber-300 rounded-xl font-bold text-amber-800 hover:bg-amber-100 transition-all"
                >
                  Skip
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center text-slate-400">
              <Heart className="h-12 w-12 mb-4 opacity-50" />
              <p className="font-medium">No active assignment.</p>
              <p className="text-xs">Use 'AI Smart Match' to find a project requiring your help.</p>
            </div>
          )}
        </div>
      )}

      {/* Nearby Needs Secondary List */}
      <div className="space-y-4 pt-8">
        <h3 className="font-bold flex items-center gap-2">
          <Navigation className="h-5 w-5 text-blue-500" />
          Emerging Needs in Your Area
        </h3>
        <div className="space-y-4">
          {needs
            .sort((a, b) => b.priorityScore - a.priorityScore)
            .map(need => (
              <div key={need.id} className={`bg-white p-6 rounded-2xl border transition-all ${
                need.assignedVolunteerId === user.uid ? 'border-blue-200 bg-blue-50/30' : 'border-slate-100'
              }`}>
                <div className="flex justify-between items-start mb-2">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    need.status === 'reported' ? 'bg-amber-50 text-amber-600' :
                    need.status === 'assigned' ? 'bg-blue-50 text-blue-600' :
                    'bg-emerald-50 text-emerald-600'
                  }`}>
                    {need.status}
                  </span>
                  <span className="text-xl font-black text-slate-900">{need.priorityScore}</span>
                </div>
                <p className="font-bold text-slate-800 mb-4">{need.description}</p>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase">
                    <MapPin className="h-3 w-3" />
                    Sector {Math.floor(need.location.lat)}
                  </div>
                  {need.status === 'reported' && (
                    <button 
                      onClick={() => handleAcceptTask(need)}
                      className="text-[10px] bg-slate-900 text-white px-4 py-2 rounded-xl font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
                    >
                      Accept
                    </button>
                  )}
                  {need.status === 'assigned' && need.assignedVolunteerId === user.uid && (
                    <button 
                      onClick={() => handleResolveTask(need)}
                      className="text-[10px] bg-emerald-600 text-white px-4 py-2 rounded-xl font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
