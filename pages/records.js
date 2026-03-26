import { useState, useEffect, useMemo, useCallback } from 'react';
import Head from 'next/head';
import { Search, Download, ArrowUpDown, Loader2, AlertCircle, FileSpreadsheet, Trash2, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../utils/cn';
import EditModal from '../components/EditModal';
import ManagerExportModal from '../components/ManagerExportModal';

export default function Records() {
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [sortConfig, setSortConfig] = useState({ key: 'rawDate', direction: 'desc' });

  // Modals state
  const [editingRecord, setEditingRecord] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);

  // Manager Export State
  const [exportMonth, setExportMonth] = useState(new Date().getMonth() + 1);
  const [exportYear, setExportYear] = useState(new Date().getFullYear());
  const [isExportingManager, setIsExportingManager] = useState(false);
  const [showManagerExport, setShowManagerExport] = useState(false);

  const fetchRecords = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch('/api/readExcel?all=true');
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch records');
      }
      
      setRecords(data.allEntries || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleManagerExport = async () => {
    try {
      setIsExportingManager(true);
      const res = await fetch('/api/exportManager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: exportMonth, year: exportYear })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to generate billing sheet');
      }

      toast.success(
        <div>
          <b>Success!</b><br />
          File saved at:<br/>
          <span className="text-xs break-all text-slate-500 mt-1 block">{data.path}</span>
        </div>,
        { duration: 6000 }
      );
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsExportingManager(false);
    }
  };

  const confirmDelete = async (rowNum) => {
    try {
      setIsDeleting(true);
      const res = await fetch('/api/deleteRecord', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowNum })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Delete failed');
      
      toast.success('Record securely deleted and shifted!');
      setRecordToDelete(null);
      fetchRecords(); // refetch mapping explicitly to regenerate row mapping IDs
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedRecords = useMemo(() => {
    let result = [...records];

    // 1. Filter by Entry Type
    if (filterType !== 'All') {
      result = result.filter(r => r.entryType === filterType);
    }

    // 2. Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r => 
        (r.issues && r.issues.toLowerCase().includes(q)) ||
        (r.description && r.description.toLowerCase().includes(q)) ||
        (r.date && r.date.toLowerCase().includes(q))
      );
    }

    // 3. Sort
    result.sort((a, b) => {
      let aVal = a[sortConfig.key] || '';
      let bVal = b[sortConfig.key] || '';

      if (sortConfig.key === 'time' || sortConfig.key === 'priority' || sortConfig.key === 'rowNum') {
        aVal = Number(aVal);
        bVal = Number(bVal);
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [records, searchQuery, filterType, sortConfig]);

  const exportToCSV = () => {
    if (filteredAndSortedRecords.length === 0) return;

    const headers = ['Date', 'Issues/Status', 'Time (Hrs)', 'Priority', 'Description'];
    
    // Process formatting for CSV (wrapping in quotes to handle commas/newlines)
    const csvRows = filteredAndSortedRecords.map(r => {
      return [
        `"${r.date || ''}"`,
        `"${(r.issues || '').replace(/"/g, '""')}"`,
        r.time || 0,
        r.priority || 1,
        `"${(r.description || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvString = [headers.join(','), ...csvRows].join('\n');
    
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'timesheet_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getEntryBadgeColor = (type) => {
    switch (type) {
      case 'Holiday': return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 border-green-200 dark:border-green-800';
      case 'Planned Leave': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'Sick Leave': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-4 sm:px-6 md:px-12 py-8 relative">
      <Head>
        <title>Timesheet Records | Dashboard</title>
      </Head>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">All Records</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">View, search, and export your historical timesheet entries.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search description or issues..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
              />
            </div>
            
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full sm:w-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm cursor-pointer"
            >
              <option value="All">All Types</option>
              <option value="Normal">Normal Data</option>
              <option value="Holiday">Holidays</option>
              <option value="Planned Leave">Planned Leaves</option>
              <option value="Sick Leave">Sick Leaves</option>
            </select>

            <button 
              onClick={() => setShowManagerExport(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Billing
            </button>

            <button 
              onClick={exportToCSV}
              disabled={filteredAndSortedRecords.length === 0}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              CSV
            </button>
          </div>
        </div>

        {/* Manager Export UI Panel */}
        {showManagerExport && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
           <div>
             <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
               <FileSpreadsheet className="w-5 h-5 text-indigo-500" />
               Manager Billing Export
             </h2>
             <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Generate a formally structured billing timesheet for internal routing.</p>
           </div>
           
           <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
             <select 
               value={exportMonth}
               suppressHydrationWarning={true}
               onChange={e => setExportMonth(Number(e.target.value))}
               className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 appearance-none min-w-[120px] font-medium text-slate-700 dark:text-slate-200"
             >
                {Array.from({ length: 12 }, (_, i) => {
                  const d = new Date(2000, i, 1);
                  return <option key={i+1} value={i+1}>{d.toLocaleString('default', { month: 'long' })}</option>
                })}
             </select>

             <select 
               value={exportYear}
               suppressHydrationWarning={true}
               onChange={e => setExportYear(Number(e.target.value))}
               className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 appearance-none min-w-[100px] font-medium text-slate-700 dark:text-slate-200"
             >
                {[2024, 2025, 2026, 2027].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
             </select>
             
             <button
               onClick={handleManagerExport}
               disabled={isExportingManager}
               className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md disabled:opacity-70 w-full sm:w-auto"
             >
               {isExportingManager ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
               Generate Report
             </button>
             <button
               onClick={() => setShowManagerExport(false)}
               className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-3 py-2 text-sm transition-colors"
             >
               Cancel
             </button>
           </div>
        </div>
        )}

        {/* Data Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden relative">
          
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
              <p>Loading your extensive timesheet history...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-32 text-red-500 text-center px-4">
              <AlertCircle className="w-8 h-8 mb-4 opacity-80" />
              <h3 className="font-semibold text-lg mb-1">Failed to load</h3>
              <p className="text-sm opacity-80 max-w-md">{error}</p>
              <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-red-50 dark:bg-red-500/10 rounded-lg text-sm font-medium hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors">Try Again</button>
            </div>
          ) : filteredAndSortedRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-slate-500 text-center px-4">
              <FileSpreadsheet className="w-12 h-12 mb-4 text-slate-300 dark:text-slate-700" />
              <h3 className="font-semibold text-lg mb-1 text-slate-700 dark:text-slate-300">No records found</h3>
              <p className="text-sm">Try adjusting your search queries or filters above.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 select-none">
                  <tr>
                    <th onClick={() => handleSort('rawDate')} className="px-6 py-4 font-medium cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
                      <div className="flex items-center gap-1.5"><ArrowUpDown className="w-3.5 h-3.5" /> Date</div>
                    </th>
                    <th className="px-6 py-4 font-medium">Type</th>
                    <th onClick={() => handleSort('issues')} className="px-6 py-4 font-medium cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
                      <div className="flex items-center gap-1.5"><ArrowUpDown className="w-3.5 h-3.5" /> Issues mapped</div>
                    </th>
                    <th onClick={() => handleSort('time')} className="px-6 py-4 font-medium cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
                      <div className="flex items-center gap-1.5"><ArrowUpDown className="w-3.5 h-3.5" /> Time (Hrs)</div>
                    </th>
                    <th className="px-6 py-4 font-medium w-full">Description</th>
                    <th className="px-6 py-4 font-medium sticky right-0 bg-slate-50 dark:bg-slate-900/90 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)] text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredAndSortedRecords.map((record, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-200">{record.date}</td>
                      <td className="px-6 py-4">
                        <span className={cn("px-2.5 py-1 rounded-md text-xs font-medium border", getEntryBadgeColor(record.entryType))}>
                          {record.entryType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {record.entryType === 'Normal' ? (
                          <div className="flex items-center gap-1.5 flex-wrap max-w-[200px]">
                            {record.issues && record.issues.split(' | ').map((iss, i) => (
                              <span key={i} className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded text-xs truncate max-w-[120px]" title={iss}>
                                {iss}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {record.entryType === 'Normal' ? (
                          <span className="font-semibold text-primary">{record.time}</span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-normal min-w-[300px]">
                        {record.entryType === 'Normal' ? (
                          <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed line-clamp-2 hover:line-clamp-none transition-all">
                            {record.description}
                          </p>
                        ) : (
                          <span className="text-slate-400 italic">{record.entryType} logged</span>
                        )}
                      </td>
                      <td className="px-4 py-4 sticky right-0 bg-white dark:bg-slate-900 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.02)] border-l border-slate-50 dark:border-slate-800">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setEditingRecord(record)}
                            className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/40 rounded transition-colors"
                            title="Edit Record"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setRecordToDelete(record)}
                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/40 rounded transition-colors"
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Footer stats */}
          {!isLoading && !error && filteredAndSortedRecords.length > 0 && (
            <div className="bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
              <p>Showing <strong>{filteredAndSortedRecords.length}</strong> of {records.length} total entries</p>
              <p>Total Filtered Hours: <strong>{filteredAndSortedRecords.reduce((acc, curr) => acc + (curr.time || 0), 0)}</strong></p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {recordToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !isDeleting && setRecordToDelete(null)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl p-7 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">Delete Record?</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm leading-relaxed">
              Are you sure you want to delete the entry for <strong className="text-slate-700 dark:text-slate-200">{recordToDelete.date}</strong>? This will permanently remove the row from Excel and shift the sheet up.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                disabled={isDeleting} 
                onClick={() => setRecordToDelete(null)} 
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                disabled={isDeleting} 
                onClick={() => confirmDelete(recordToDelete.rowNum)} 
                className="px-5 py-2 text-sm font-medium bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all shadow-md flex items-center gap-2 disabled:opacity-70"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingRecord && (
        <EditModal 
          record={editingRecord} 
          onClose={() => setEditingRecord(null)}
          onSave={() => {
            setEditingRecord(null);
            fetchRecords();
          }}
        />
      )}

      {/* Manager Billing Modal */}
      {showManagerExport && (
         <ManagerExportModal onClose={() => setShowManagerExport(false)} />
      )}
    </div>
  );
}
