import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { parseISO, format, startOfWeek, endOfWeek, eachDayOfInterval, isAfter, isSameDay } from 'date-fns';
import { cn } from '../utils/cn';

export default function AnalyticsDashboard({ records }) {
  // 1. Weekly Velocity Chart Data
  const weeklyData = useMemo(() => {
    if (!records || records.length === 0) return [];
    
    // Group records by week
    const weeksMap = {};
    records.forEach(r => {
      if (r.entryType !== 'Normal' || !r.time) return;
      try {
        const d = r.rawDate ? new Date(r.rawDate) : new Date(r.date);
        const start = format(startOfWeek(d, { weekStartsOn: 1 }), 'MMM dd');
        const end = format(endOfWeek(d, { weekStartsOn: 1 }), 'MMM dd');
        const label = `${start} - ${end}`;
        
        if (!weeksMap[label]) weeksMap[label] = { label, hours: 0 };
        weeksMap[label].hours += r.time;
      } catch(e) {}
    });
    
    // Sort weeks chronologically
    return Object.values(weeksMap).reverse().slice(-8); // last 8 weeks
  }, [records]);

  // 2. Heatmap Data (Simulated GitHub Matrix)
  const heatmapData = useMemo(() => {
    if (!records || records.length === 0) return [];
    
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - 90); // last 90 days
    
    const days = eachDayOfInterval({ start: startDate, end: today });
    
    const daysMap = {};
    records.forEach(r => {
      try {
        const d = r.rawDate ? new Date(r.rawDate) : new Date(r.date);
        const f = format(d, 'yyyy-MM-dd');
        daysMap[f] = r;
      } catch(e) {}
    });

    return days.map(d => {
      const f = format(d, 'yyyy-MM-dd');
      const record = daysMap[f];
      
      let level = 0; // None
      if (record) {
        if (record.entryType === 'Normal') {
          if (record.time >= 10) level = 4;
          else if (record.time >= 8) level = 3;
          else if (record.time > 0) level = 2;
        } else if (record.entryType === 'Sick Leave') {
          level = 5; // Red/Yellow
        } else if (record.entryType === 'Planned Leave') {
          level = 6; // Blue
        } else if (record.entryType === 'Holiday') {
          level = 7; // Green
        }
      }
      return { date: d, format: f, level, record };
    });
  }, [records]);

  const getHeatmapColor = (level) => {
    switch(level) {
      case 4: return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'; // 10+ hours (bright green)
      case 3: return 'bg-emerald-400'; // 8 hours (normal green)
      case 2: return 'bg-emerald-200 dark:bg-emerald-900/60'; // <8 hours (light green)
      case 5: return 'bg-red-400'; // Sick Leave
      case 6: return 'bg-blue-400'; // Planned Leave
      case 7: return 'bg-teal-400'; // Holiday
      default: return 'bg-slate-100 dark:bg-slate-800/50'; // Empty
    }
  };

  if (!records || records.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Velocity Chart */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm lg:col-span-2 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-32 bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-6">Weekly Velocity (Hrs)</h3>
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
              <Tooltip 
                cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
              />
              <Bar dataKey="hours" radius={[4, 4, 4, 4]}>
                {weeklyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.hours > 40 ? '#10b981' : entry.hours < 40 ? '#f43f5e' : '#6366f1'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* GitHub Style Heatmap (Last 90 days) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">Activity Heatmap</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Last 90 days of tracked entries</p>
        </div>
        
        <div className="flex flex-wrap gap-1.5 justify-end">
          {heatmapData.map((day, i) => (
            <div 
              key={i} 
              title={`${day.format}: ${day.record?.time ? day.record.time + ' Hrs' : day.record?.entryType || 'No entry'}`}
              className={cn("w-3.5 h-3.5 rounded-sm transition-all hover:scale-125 hover:z-10 cursor-pointer", getHeatmapColor(day.level))} 
            />
          ))}
        </div>
        
        <div className="flex items-center justify-end gap-3 mt-6 text-[10px] text-slate-500 font-medium">
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-slate-100 dark:bg-slate-800" /> Empty</div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-emerald-400" /> Normal</div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-blue-400" /> Leave</div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-red-400" /> Sick</div>
        </div>
      </div>
    </div>
  );
}
