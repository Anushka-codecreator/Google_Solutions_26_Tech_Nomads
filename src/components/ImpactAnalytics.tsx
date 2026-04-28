import React, { useMemo } from 'react';
import { Need } from '../types';
import { BarChart3, Users, Zap, Clock, TrendingUp, HandHeart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useLanguage } from './LanguageContext';

interface ImpactAnalyticsProps {
  needs: Need[];
}

export function ImpactAnalytics({ needs }: ImpactAnalyticsProps) {
  const { t } = useLanguage();
  const resolved = needs.filter(n => n.status === 'resolved');
  
  const stats = useMemo(() => {
    // Only count population if status is resolved to correctly depict people reached
    const populationReached = resolved.reduce((acc, curr) => {
      const pop = Number(curr.population);
      return acc + (isNaN(pop) ? 0 : pop);
    }, 0);

    return {
      peopleHelped: populationReached,
      tasksCompleted: resolved.length,
      timeSaved: resolved.reduce((acc, curr) => acc + (curr.priorityScore / 10), 0).toFixed(1),
      avgResolution: "4.2h"
    };
  }, [resolved]);

  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    resolved.forEach(n => {
      counts[n.category] = (counts[n.category] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [resolved]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight italic">{t('impactAnalytics')}</h2>
          <p className="text-slate-500">Measurable results of community-led action.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl">
           <button className="px-4 py-2 text-xs font-bold bg-white shadow-sm rounded-lg">Last 30 Days</button>
           <button className="px-4 py-2 text-xs font-bold text-slate-500">All Time</button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label={t('peopleReached')} value={stats.peopleHelped} icon={Users} color="emerald" />
        <MetricCard label={t('tasksResolved')} value={stats.tasksCompleted} icon={HandHeart} color="blue" />
        <MetricCard label={t('totalImpactHours')} value={stats.timeSaved} icon={Zap} color="amber" />
        <MetricCard label={t('avgResolution')} value={stats.avgResolution} icon={Clock} color="indigo" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[32px] border shadow-sm h-[450px]">
          <h3 className="font-bold mb-8 flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            Impact Distribution by Category
          </h3>
          <div className="h-full pb-16">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 500 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 500 }} />
                <Tooltip 
                   cursor={{ fill: '#f8fafc' }}
                   contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899'][index % 5]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 text-white p-10 rounded-[32px] shadow-2xl flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-indigo-500/20 transition-colors" />
            
            <div>
              <h3 className="text-2xl font-bold mb-4">The "Success Gap" Analysis</h3>
              <p className="text-slate-400 mb-8 leading-relaxed text-sm">
                AI patterns show that our <strong>Allocation Engine</strong> has reduced response time by 22% in critical water-scarcity sectors. High-population areas are receiving medical triage 4 hours faster than previous manual methods.
              </p>
            </div>

            <div className="space-y-6">
               <div className="space-y-2">
                 <div className="flex justify-between items-end">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Community Stability</span>
                    <span className="text-4xl font-mono text-emerald-400">84<span className="text-xl">%</span></span>
                 </div>
                 <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[84%] transition-all duration-1000 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                    <div className="text-xs text-slate-500 font-bold mb-1 uppercase tracking-tighter">Response Gain</div>
                    <div className="text-xl font-bold text-blue-400">+22.4%</div>
                  </div>
                  <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                    <div className="text-xs text-slate-500 font-bold mb-1 uppercase tracking-tighter">Triage Speed</div>
                    <div className="text-xl font-bold text-amber-400">4.1x</div>
                  </div>
               </div>
            </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, color }: any) {
  const colors: any = {
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    blue: 'text-blue-600 bg-blue-50 border-blue-100',
    amber: 'text-amber-600 bg-amber-50 border-amber-100',
    indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100'
  };

  return (
    <div className={`p-8 rounded-[32px] border bg-white shadow-sm flex items-center justify-between group hover:shadow-md transition-shadow`}>
      <div>
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">{label}</label>
        <div className="text-4xl font-extrabold tracking-tight">{value}</div>
      </div>
      <div className={`p-4 rounded-2xl ${colors[color]}`}>
        <Icon className="h-7 w-7" />
      </div>
    </div>
  );
}
