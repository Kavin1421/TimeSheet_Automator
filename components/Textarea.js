import { useRef, useEffect } from 'react';
import { cn } from '../utils/cn';

export default function Textarea({ value, onChange, placeholder, required = false }) {
  const textareaRef = useRef(null);

  // Auto-resize logic
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // Reset height
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`; // Set to scroll height
    }
  }, [value]);

  return (
    <div className="w-full">
      <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">
        Description {required && <span className="text-red-500">*</span>}
      </label>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className={cn(
          "w-full min-h-[100px] bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 shadow-sm",
          "placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-800 dark:text-slate-200"
        )}
        rows={3}
      />
    </div>
  );
}
