import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, X } from 'lucide-react';
import { cn } from '../utils/cn';

const OPTIONS = [
  'Essence and FPM Migration',
  'SIT Support',
  'UAT Support',
  'Production Support',
  'LI Related Task'
];

export default function Dropdown({ selected, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (option) => {
    if (selected.includes(option)) {
      onChange(selected.filter((item) => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const removeOption = (e, option) => {
    e.stopPropagation();
    onChange(selected.filter((item) => item !== option));
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">
        Issues (Multi-Select) <span className="text-red-500">*</span>
      </label>

      <div
        className={cn(
          "min-h-[46px] w-full bg-white dark:bg-slate-800 border rounded-xl flex items-center justify-between px-3 py-1.5 cursor-pointer shadow-sm transition-all duration-200",
          isOpen ? "border-primary ring-2 ring-primary/20" : "border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-wrap gap-1.5 items-center flex-1 pr-2">
          {selected.length === 0 && (
            <span className="text-slate-400 dark:text-slate-500 text-sm ml-1 select-none">
              Select issues...
            </span>
          )}
          <AnimatePresence>
            {selected.map((option) => (
              <motion.div
                key={option}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-1 bg-primary/10 dark:bg-primary/20 text-primary-dark dark:text-primary px-2.5 py-1 rounded-md text-xs font-semibold"
              >
                <span>{option}</span>
                <button
                  type="button"
                  onClick={(e) => removeOption(e, option)}
                  className="hover:bg-primary/20 dark:hover:bg-primary/30 rounded-full p-0.5 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <div className="text-slate-400 shrink-0">
          <ChevronDown className={cn("w-5 h-5 transition-transform duration-200", isOpen && "rotate-180")} />
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute z-10 w-full mt-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden py-1"
          >
            {OPTIONS.map((option) => {
              const isSelected = selected.includes(option);
              return (
                <div
                  key={option}
                  onClick={() => toggleOption(option)}
                  className={cn(
                    "flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-sm",
                    isSelected ? "bg-primary/5 dark:bg-primary/10 text-primary-dark dark:text-primary font-medium" : "text-slate-700 dark:text-slate-200"
                  )}
                >
                  <span>{option}</span>
                  {isSelected && <Check className="w-4 h-4 text-primary" />}
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
