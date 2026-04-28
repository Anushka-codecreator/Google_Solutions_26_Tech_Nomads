import React, { useState, useRef, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { aiService } from '../lib/ai';
import { useLanguage } from './LanguageContext';
import { Volunteer } from '../types';
import { collection, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { Send, Sparkles, AlertCircle, FileText, CheckCircle2, Image as ImageIcon, X, Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ReportNeedProps {
  user: any;
}

export function ReportNeed({ user }: ReportNeedProps) {
  const { t } = useLanguage();
  const [reportText, setReportText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [success, setSuccess] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false; 
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setReportText(prev => {
          const newText = (prev.trim() + ' ' + finalTranscript).trim();
          return newText;
        });
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProcess = async () => {
    if (!reportText.trim() && !selectedImage) return;
    setIsProcessing(true);
    setPreview(null);

    try {
      const parsed = await aiService.parseNeedFromReport(reportText, selectedImage || undefined);
      const score = await aiService.calculatePriority(parsed);
      
      // Fetch volunteers for smart matching
      const volSnap = await getDocs(collection(db, 'volunteers'));
      const volunteers = volSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as Volunteer));
      
      const bestVolunteerId = await aiService.matchVolunteer({ ...parsed, id: 'temp' } as any, volunteers);
      const idealResponder = volunteers.find(v => v.uid === bestVolunteerId);

      setPreview({ 
        ...parsed, 
        priorityScore: score, 
        imageUrl: selectedImage,
        idealResponder: idealResponder ? { name: idealResponder.name, uid: idealResponder.uid } : null
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async () => {
    if (!preview) return;
    setIsProcessing(true);

    try {
      const path = 'needs';
      const needData = {
        description: preview.description,
        category: preview.category,
        severity: preview.severity,
        population: preview.population || 0,
        priorityScore: preview.priorityScore,
        location: preview.location,
        imageUrl: preview.imageUrl || null,
        status: preview.idealResponder ? 'assigned' : 'reported',
        assignedVolunteerId: preview.idealResponder?.uid || null,
        reportedBy: user.uid,
        reportedAt: new Date().toISOString(),
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, path), needData);
      setSuccess(true);
      setReportText('');
      setSelectedImage(null);
      setPreview(null);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      console.error("Submission failed", e);
      handleFirestoreError(e, OperationType.CREATE, 'needs');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <header className="space-y-2">
        <h2 className="text-4xl font-black tracking-tighter italic text-slate-900 leading-none">{t('intelligenceIntake')}</h2>
        <p className="text-slate-500 text-lg">Report field findings via text, voice, or images for AI synthesis.</p>
      </header>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-2xl shadow-slate-200/50 p-10 space-y-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-900/5 rounded-full -mr-16 -mt-16 sm:block hidden" />
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              <FileText className="h-3 w-3" />
              {t('rawInput')}
            </div>
            <div className="flex items-center gap-1.5">
               <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
               <span className="text-[10px] font-bold text-emerald-600 uppercase">Live Buffer</span>
            </div>
          </div>
          
          <div className="relative group">
            <textarea
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              placeholder={t('reportPlaceholder')}
              className="w-full h-48 p-6 rounded-[24px] border-2 border-slate-50 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 outline-none resize-none transition-all placeholder:text-slate-300 text-lg leading-relaxed font-medium"
            />
            
            <div className="absolute bottom-6 right-6 flex gap-2">
              <button 
                className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:scale-110 active:scale-95 transition-all text-slate-400 hover:text-slate-900"
                title="Attach Image"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="h-5 w-5" />
              </button>
              <button 
                className={`p-4 rounded-2xl border shadow-sm hover:shadow-md hover:scale-110 active:scale-95 transition-all ${
                  isListening ? 'bg-red-500 border-red-200 text-white animate-pulse' : 'bg-white border-slate-100 text-slate-400 hover:text-slate-900'
                }`}
                title={isListening ? "Stop Listening" : "Start Voice Input"}
                onClick={toggleListening}
              >
                <Mic className="h-5 w-5" />
              </button>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleImageChange} 
            />
          </div>

          <AnimatePresence>
            {selectedImage && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative inline-block"
              >
                <img src={selectedImage} alt="Preview" className="h-24 w-24 object-cover rounded-xl border-2 border-slate-100 shadow-sm" />
                <button 
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow-lg"
                  onClick={() => setSelectedImage(null)}
                >
                  <X className="h-3 w-3" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={handleProcess}
          disabled={isProcessing || (!reportText.trim() && !selectedImage)}
          className="flex w-full items-center justify-center gap-3 rounded-[24px] bg-slate-900 px-8 py-5 font-black text-white disabled:opacity-50 transition-all hover:scale-[1.01] active:scale-[0.99] shadow-xl shadow-slate-200"
        >
          {isProcessing ? (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
              <Sparkles className="h-6 w-6 text-amber-400" />
            </motion.div>
          ) : (
            <>
              <Sparkles className="h-6 w-6 text-amber-400" />
              {t('analyzeWithGemini')}
            </>
          )}
        </button>
      </div>

      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-[40px] border-4 border-slate-900 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] overflow-hidden"
          >
            <div className="bg-slate-900 p-8 flex justify-between items-center bg-gradient-to-r from-slate-900 to-slate-800">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                   <ShieldCheckIcon className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                   <span className="text-white font-black text-xs uppercase tracking-widest block opacity-50">Validation Engine</span>
                   <span className="text-white font-bold text-xl tracking-tighter uppercase">AI-STRUCTURED INTEL</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-blue-400 font-mono text-4xl font-black">{preview.priorityScore}</span>
                <span className="block text-[10px] font-black text-blue-400/50 uppercase">Priority Index</span>
              </div>
            </div>
            
            <div className="p-10 space-y-10">
              {preview.imageUrl && (
                <div className="w-full h-48 rounded-[32px] overflow-hidden border border-slate-100 shadow-sm">
                   <img src={preview.imageUrl} alt="Context" className="w-full h-full object-cover" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Category</label>
                  <p className="font-black text-2xl text-slate-900 tracking-tight capitalize">{preview.category}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inferred Severity</label>
                  <p className={`font-black text-2xl tracking-tight capitalize ${
                    preview.severity === 'critical' ? 'text-red-500' : 'text-slate-900'
                  }`}>{preview.severity}</p>
                </div>
              </div>

              {preview.idealResponder && (
                <div className="bg-blue-50/50 border border-blue-100 p-6 rounded-[32px] flex items-center gap-4">
                  <div className="h-10 w-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest block mb-0.5">Ideal Match Found</label>
                    <p className="font-bold text-slate-900">Assist from {preview.idealResponder.name} requested</p>
                  </div>
                </div>
              )}

              <div className="p-8 bg-slate-50 rounded-[32px] border border-slate-100 space-y-2 italic text-slate-600 leading-relaxed text-lg font-medium">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest not-italic block mb-2">Refined Narrative</label>
                  "{preview.description}"
              </div>

              <div className="pt-6 flex gap-4">
                <button
                  onClick={handleSubmit}
                  className="flex-1 flex items-center justify-center gap-3 rounded-[24px] bg-blue-600 px-8 py-5 font-black text-white hover:bg-blue-700 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-200"
                >
                  <Send className="h-5 w-5" />
                  {t('dispatchToCloud')}
                </button>
                <button
                  onClick={() => setPreview(null)}
                  className="px-8 py-5 rounded-[24px] border-2 border-slate-100 font-black text-slate-500 hover:bg-slate-50 transition-all uppercase tracking-widest text-xs"
                >
                  {t('discard')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-center gap-2 text-emerald-600 font-bold bg-emerald-50 p-4 rounded-xl border border-emerald-100"
          >
            <CheckCircle2 className="h-5 w-5" />
            Report Successfully Synthesized and Dispatched
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ShieldCheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
