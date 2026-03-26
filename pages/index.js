import { useEffect, useState } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { Clock, Calendar, CheckSquare, Sun, Moon } from 'lucide-react';
import Form from '../components/Form';

export default function Home() {
  const [entries, setEntries] = useState([]);
  const [todaysHours, setTodaysHours] = useState(0);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Initial theme setup based on preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
    }
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const fetchRecentData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/readExcel');
      if (res.ok) {
        const data = await res.json();
        setEntries(data.recentEntries || []);
        setTodaysHours(data.todaysHours || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-300 py-8 px-4 sm:px-6">
      <Head>
        <title>Timesheet Automator</title>
        <meta name="description" content="Automated Excel timesheet logger" />
      </Head>

      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-8 sm:mb-12">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2.5 rounded-xl text-primary">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                Timesheet Automator
              </h1>
              <p className="text-sm text-slate-500 font-medium">Synced with Local Excel</p>
            </div>
          </div>
          
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Form Area */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-8"
          >
            <Form onEntryAdded={fetchRecentData} />
          </motion.div>

          {/* Side Panel: Summaries */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-4 space-y-6"
          >
            {/* Today's Stats Card */}
            <div className="bg-gradient-to-br from-primary to-primary-dark rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 -m-4 bg-white/10 w-24 h-24 rounded-full blur-2xl"></div>
              <h3 className="font-semibold text-white/80 text-sm mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Today&apos;s Total Hours
              </h3>
              <div className="text-4xl font-black tracking-tight flex items-baseline gap-1">
                {loading ? '...' : todaysHours} <span className="text-lg font-medium text-white/70">hrs</span>
              </div>
            </div>

            {/* Recent Entries */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4 pb-4 border-b border-slate-100 dark:border-slate-800/50">
                <CheckSquare className="w-4 h-4 text-primary" /> Last 3 Entries
              </h3>
              
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse flex flex-col gap-2">
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
                      <div className="h-3 bg-slate-100 dark:bg-slate-800/50 rounded w-full"></div>
                    </div>
                  ))}
                </div>
              ) : entries.length > 0 ? (
                <div className="space-y-4">
                  {entries.map((entry, idx) => (
                    <div key={idx} className="group relative pl-4 border-l-2 border-slate-200 dark:border-slate-700 hover:border-primary transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          {entry.date}
                        </span>
                        <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                          {entry.time}h
                        </span>
                      </div>
                      <p className="text-sm text-slate-800 dark:text-slate-200 font-medium truncate mb-1">
                        {entry.issues}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No recent entries found.</p>
              )}
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
