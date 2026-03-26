import Link from 'next/link';
import { useRouter } from 'next/router';
import { cn } from '../utils/cn';
import { Clock, LayoutDashboard } from 'lucide-react';

export default function Navbar() {
  const router = useRouter();

  const links = [
    { name: 'Log Entry', path: '/', icon: Clock },
    { name: 'All Records', path: '/records', icon: LayoutDashboard },
  ];

  return (
    <nav className="fixed top-0 inset-x-0 h-16 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center shadow-lg shadow-primary/30">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white tracking-tight">
            Timesheet
          </span>
        </div>
        
        <div className="flex items-center gap-1 sm:gap-2">
          {links.map((link) => {
            const isActive = router.pathname === link.path;
            const Icon = link.icon;
            
            return (
              <Link 
                key={link.path} 
                href={link.path}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-slate-100 dark:bg-slate-800 text-primary dark:text-primary shadow-sm" 
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-slate-400")} />
                <span className="hidden sm:inline">{link.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
