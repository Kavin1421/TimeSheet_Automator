import { useState } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { format, parse, isWeekend, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import Dropdown from './Dropdown';
import Textarea from './Textarea';
import { cn } from '../utils/cn';

export default function EditModal({ record, onClose, onSave }) {
  // Extract initial Date safely.
  let initialDateStr = '';
  try {
    if (record.rawDate) {
      initialDateStr = format(parseISO(record.rawDate), 'yyyy-MM-dd');
    }
  } catch (e) {
    initialDateStr = format(new Date(), 'yyyy-MM-dd');
  }

  const [dateStr, setDateStr] = useState(initialDateStr);
  const [issues, setIssues] = useState(record.issues && record.issues.trim() ? record.issues.split(' | ').filter(Boolean) : []);
  const [time, setTime] = useState(record.time || 8);
  const [description, setDescription] = useState(record.description || '');
  const [entryType, setEntryType] = useState(record.entryType !== 'Holiday' ? record.entryType : 'Normal'); // 'Holiday' is backend controlled mostly, but map it gracefully
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    let parsedDateForWeekend;
    try {
      parsedDateForWeekend = parse(dateStr, 'yyyy-MM-dd', new Date());
    } catch (e) {
      parsedDateForWeekend = new Date();
    }
    
    const isWeekendDay = isWeekend(parsedDateForWeekend);
    const isLeave = entryType !== 'Normal';
    const isSpecialEntry = isWeekendDay || isLeave;

    if (!isSpecialEntry) {
      if (issues.length === 0) {
        toast.error('Please select at least one issue.');
        return;
      }
      if (!description.trim()) {
        toast.error('Description is required.');
        return;
      }
    }

    setIsSubmitting(true);
    
    let formattedDateForExcel;
    try {
      formattedDateForExcel = format(parsedDateForWeekend, 'EEEE, d MMMM, yyyy');
    } catch (e) {
      formattedDateForExcel = format(new Date(), 'EEEE, d MMMM, yyyy');
    }

    const payload = {
      rowNum: record.rowNum,
      dateStr: formattedDateForExcel,
      issues: issues.join(' | '),
      time,
      priority: record.priority || 1, // keep existing
      description,
      entryType,
      isWeekendDay,
    };

    try {
      const res = await fetch('/api/updateRecord', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Failed to update Excel. Try again.');

      toast.success('Record updated successfully!');
      onSave(); // Trigger table refresh
    } catch (error) {
      toast.error(error.message || 'Failed to update Excel.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={() => !isSubmitting && onClose()}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Edit Record #{record.rowNum}</h3>
          <button 
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[75vh] space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Date Field */}
            <div className="w-full">
              <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all text-slate-800 dark:text-slate-200"
                required
              />
              {dateStr && isWeekend(parse(dateStr, 'yyyy-MM-dd', new Date())) && (
                <p className="text-xs text-green-500 mt-1.5 font-medium">Weekend detected! Will save as Holiday.</p>
              )}
            </div>

            {/* Entry Type */}
            <div className="w-full">
              <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">
                Entry Type
              </label>
              <select
                value={entryType}
                onChange={(e) => setEntryType(e.target.value)}
                disabled={dateStr && isWeekend(parse(dateStr, 'yyyy-MM-dd', new Date()))}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all text-slate-800 dark:text-slate-200"
              >
                <option value="Normal">Normal Entry</option>
                <option value="Holiday">Holiday</option>
                <option value="Planned Leave">Planned Leave</option>
                <option value="Sick Leave">Sick Leave</option>
              </select>
            </div>
          </div>

          {/* Time Slider */}
          <div className={cn("w-full transition-opacity", entryType !== 'Normal' || (dateStr && isWeekend(parse(dateStr, 'yyyy-MM-dd', new Date()))) ? 'opacity-40 pointer-events-none' : '')}>
            <div className="flex justify-between items-end mb-1.5">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Time (Hrs) <span className="text-red-500">*</span>
              </label>
              <span className="text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-md text-xs">{time} hours</span>
            </div>
            <div className="flex items-center gap-4 h-[44px]">
              <input
                type="range"
                min="0"
                max="24"
                step="1"
                value={time}
                onChange={(e) => setTime(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>
          </div>

          <div className={cn("transition-opacity space-y-6", entryType !== 'Normal' || (dateStr && isWeekend(parse(dateStr, 'yyyy-MM-dd', new Date()))) ? 'opacity-40 pointer-events-none' : '')}>
            <Dropdown selected={issues} onChange={setIssues} />
            <Textarea 
              value={description} 
              onChange={setDescription} 
              placeholder="Detailed description of tasks completed..." 
              required={entryType === 'Normal' && !(dateStr && isWeekend(parse(dateStr, 'yyyy-MM-dd', new Date())))} 
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 mt-8">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-medium rounded-xl text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 text-sm font-medium rounded-xl text-white bg-primary hover:bg-primary-dark transition-all shadow-lg flex items-center gap-2 disabled:opacity-70"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
