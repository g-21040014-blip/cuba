import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { fetchPublicStudents } from '../lib/sheets';
import { useLocalStorage } from '../lib/useLocalStorage';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList } from 'recharts';

interface Student {
  id: string;
  name: string;
  form: string;
}

type FilterType = 'Harian' | 'Mingguan' | 'Bulanan' | 'Tahunan';

export function SchoolAttendanceStatsView() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [outRecords] = useLocalStorage<any[]>('school-out-records', []);
  const [inRecords] = useLocalStorage<any[]>('school-in-records', []);

  const today = new Date().toISOString().split('T')[0];
  const [filterType, setFilterType] = useState<FilterType>('Harian');
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [selectedClass, setSelectedClass] = useState<string>('Semua');

  useEffect(() => {
    const loadStudents = async () => {
      setLoading(true);
      try {
        const data = await fetchPublicStudents();
        const formattedStudents = data.map(row => {
          let formStr = (row['Tingkatan'] || '').toUpperCase().trim();
          if (formStr === '3 BONEKA') {
            formStr = '3BO';
          } else if (formStr === '3 BANGSAWAN') {
            formStr = '3BG';
          } else if (formStr === '4 SONGKET') {
            formStr = '4SO';
          } else if (formStr === '4 SUTERA') {
            formStr = '4SU';
          } else {
            formStr = formStr.substring(0, 3);
          }
          return {
            id: row['ID Pelajar'] || '',
            name: row['Nama Penuh'] || '',
            form: formStr
          };
        }).filter(s => s.id !== '');
        setStudents(formattedStudents);
      } catch (error) {
        console.error('Failed to load students:', error);
      } finally {
        setLoading(false);
      }
    };
    loadStudents();
  }, []);

  const isDateInPeriod = (recordDate: string) => {
    if (!recordDate) return false;
    if (filterType === 'Harian') {
      return recordDate === selectedDate;
    } else if (filterType === 'Mingguan') {
      const rDate = new Date(recordDate);
      const sDate = new Date(selectedDate);
      const day = sDate.getDay();
      const diff = sDate.getDate() - day + (day === 0 ? -6 : 1);
      const startOfWeek = new Date(new Date(selectedDate).setDate(diff));
      startOfWeek.setHours(0,0,0,0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23,59,59,999);
      return rDate >= startOfWeek && rDate <= endOfWeek;
    } else if (filterType === 'Bulanan') {
      return recordDate.substring(0, 7) === selectedDate.substring(0, 7);
    } else if (filterType === 'Tahunan') {
      return recordDate.substring(0, 4) === selectedDate.substring(0, 4);
    }
    return false;
  };

  const getPeriodText = () => {
    const sDate = new Date(selectedDate);
    if (filterType === 'Harian') {
      return sDate.toLocaleDateString('ms-MY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    } else if (filterType === 'Mingguan') {
      const day = sDate.getDay();
      const diff = sDate.getDate() - day + (day === 0 ? -6 : 1);
      const startOfWeek = new Date(new Date(selectedDate).setDate(diff));
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return `${startOfWeek.toLocaleDateString('ms-MY', { day: 'numeric', month: 'short' })} - ${endOfWeek.toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    } else if (filterType === 'Bulanan') {
      return sDate.toLocaleDateString('ms-MY', { month: 'long', year: 'numeric' });
    } else if (filterType === 'Tahunan') {
      return sDate.getFullYear().toString();
    }
    return '';
  };

  const isTodayIncluded = isDateInPeriod(today);

  // Kehadiran (Ke Sekolah)
  const filteredOutRecords = outRecords.filter(r => isDateInPeriod(r.date));
  const uniqueOutDates = new Set(filteredOutRecords.map(r => r.date));
  const daysCountOut = uniqueOutDates.size > 0 
    ? uniqueOutDates.size + (isTodayIncluded && !uniqueOutDates.has(today) ? 1 : 0)
    : (isTodayIncluded ? 1 : 0);
  
  const presentCountOut = filteredOutRecords.length;
  const absentCountOut = Math.max(0, (students.length * daysCountOut) - presentCountOut);
  
  const chartDataOut = [
    { name: 'Hadir', value: presentCountOut },
    { name: 'Belum Hadir', value: absentCountOut }
  ];
  const COLORS_OUT = ['#10b981', '#f43f5e'];

  const formStatsMapOut = new Map<string, { name: string; 'Jumlah Murid': number; Hadir: number; 'Belum Hadir': number }>();

  students.forEach(s => {
    if (!formStatsMapOut.has(s.form)) {
      formStatsMapOut.set(s.form, { name: s.form, 'Jumlah Murid': 0, Hadir: 0, 'Belum Hadir': 0 });
    }
    formStatsMapOut.get(s.form)!['Jumlah Murid'] += 1;
    const studentPresentCount = filteredOutRecords.filter(r => r.studentId === s.id).length;
    formStatsMapOut.get(s.form)!.Hadir += studentPresentCount;
    formStatsMapOut.get(s.form)!['Belum Hadir'] += (daysCountOut - studentPresentCount);
  });
  const barChartDataOut = Array.from(formStatsMapOut.values()).sort((a, b) => {
    // Custom sort logic or just alphabetical
    // Since specifiedForms is removed, we sort alphabetically
    return a.name.localeCompare(b.name, 'en', { numeric: true });
  });

  // Kepulangan (Balik Asrama)
  const filteredInRecords = inRecords.filter(r => isDateInPeriod(r.date));
  const uniqueInDates = new Set(filteredInRecords.map(r => r.date));
  const daysCountIn = uniqueInDates.size > 0 
    ? uniqueInDates.size + (isTodayIncluded && !uniqueInDates.has(today) ? 1 : 0)
    : (isTodayIncluded ? 1 : 0);
    
  const returnedCount = filteredInRecords.length;
  const notReturnedCount = Math.max(0, (students.length * daysCountIn) - returnedCount);

  const chartDataIn = [
    { name: 'Telah Pulang', value: returnedCount },
    { name: 'Belum Pulang', value: notReturnedCount }
  ];
  const COLORS_IN = ['#14b8a6', '#f59e0b'];

  const formStatsMapIn = new Map<string, { name: string; 'Jumlah Murid': number; 'Telah Pulang': number; 'Belum Pulang': number }>();

  students.forEach(s => {
    if (!formStatsMapIn.has(s.form)) {
      formStatsMapIn.set(s.form, { name: s.form, 'Jumlah Murid': 0, 'Telah Pulang': 0, 'Belum Pulang': 0 });
    }
    formStatsMapIn.get(s.form)!['Jumlah Murid'] += 1;
    const studentReturnedCount = filteredInRecords.filter(r => r.studentId === s.id).length;
    formStatsMapIn.get(s.form)!['Telah Pulang'] += studentReturnedCount;
    formStatsMapIn.get(s.form)!['Belum Pulang'] += (daysCountIn - studentReturnedCount);
  });
  const barChartDataIn = Array.from(formStatsMapIn.values()).sort((a, b) => {
    return a.name.localeCompare(b.name, 'en', { numeric: true });
  });

  const filteredStudentsByClass = students.filter(s => selectedClass === 'Semua' || s.form === selectedClass);
  const presentStudentsSchool = filteredStudentsByClass.filter(s => filteredOutRecords.some(r => r.studentId === s.id)).sort((a, b) => a.name.localeCompare(b.name));
  const absentStudentsSchool = filteredStudentsByClass.filter(s => !filteredOutRecords.some(r => r.studentId === s.id)).sort((a, b) => a.name.localeCompare(b.name));
  const returnedStudentsAsrama = filteredStudentsByClass.filter(s => filteredInRecords.some(r => r.studentId === s.id)).sort((a, b) => a.name.localeCompare(b.name));
  const notReturnedStudentsAsrama = filteredStudentsByClass.filter(s => !filteredInRecords.some(r => r.studentId === s.id)).sort((a, b) => a.name.localeCompare(b.name));

  const classList = Array.from(new Set(students.map(s => String(s.form)))).sort((a: string, b: string) => a.localeCompare(b, 'en', { numeric: true }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Statistik Kehadiran Sekolah</h1>
        <p className="text-sm text-slate-500 mt-1">Laporan statistik kehadiran ke sekolah dan kepulangan ke asrama.</p>
      </div>
      
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <label className="block text-xs font-medium text-slate-500 mb-1">Tapis Berdasarkan</label>
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as FilterType)}
            className="text-sm border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 w-full sm:w-48"
          >
            <option value="Harian">Harian</option>
            <option value="Mingguan">Mingguan</option>
            <option value="Bulanan">Bulanan</option>
            <option value="Tahunan">Tahunan</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-slate-500 mb-1">Pilih Tarikh / Tempoh</label>
          {filterType === 'Tahunan' ? (
            <input 
              type="number" 
              value={selectedDate.substring(0, 4)}
              onChange={(e) => setSelectedDate(`${e.target.value}-01-01`)}
              className="text-sm border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 w-full sm:w-48"
              min="2020" max="2100"
            />
          ) : filterType === 'Bulanan' ? (
            <input 
              type="month" 
              value={selectedDate.substring(0, 7)}
              onChange={(e) => setSelectedDate(`${e.target.value}-01`)}
              className="text-sm border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 w-full sm:w-48"
            />
          ) : (
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-sm border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 w-full sm:w-48"
            />
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Icons.Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : students.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-6 text-center">
          <Icons.AlertCircle className="w-8 h-8 mx-auto mb-2 text-amber-500" />
          <p className="font-medium">Tiada Data Pelajar</p>
          <p className="text-sm mt-1">Sila muat naik atau daftarkan pelajar terlebih dahulu.</p>
        </div>
      ) : (
        <>
          {/* Sesi Ke Sekolah */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-800 flex items-center">
              <Icons.BookOpen className="w-5 h-5 mr-2 text-indigo-500" />
              Sesi Pergi Ke Sekolah
            </h2>
            <div className="grid grid-cols-1 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center">
                <h3 className="text-lg font-bold text-slate-800 self-start mb-6">Kehadiran Mengikut Kelas</h3>
                <div className="w-full h-64">
                  {presentCountOut === 0 && absentCountOut === 0 ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                      <Icons.BarChart3 className="w-8 h-8 mb-2 opacity-50" />
                      <span className="text-sm">Tiada Rekod</span>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barChartDataOut} margin={{ top: 20, right: 20, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} allowDecimals={false} />
                        <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Bar dataKey="Hadir" fill="#10b981" radius={[4, 4, 0, 0]}>
                          <LabelList dataKey="Hadir" position="top" style={{ fontSize: '10px', fill: '#64748b' }} />
                        </Bar>
                        <Bar dataKey="Belum Hadir" fill="#f43f5e" radius={[4, 4, 0, 0]}>
                          <LabelList dataKey="Belum Hadir" position="top" style={{ fontSize: '10px', fill: '#64748b' }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          </div>

          <hr className="border-slate-200 my-8" />

          {/* Sesi Pulang */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-800 flex items-center">
              <Icons.Home className="w-5 h-5 mr-2 text-indigo-500" />
              Sesi Balik Ke Asrama
            </h2>
            <div className="grid grid-cols-1 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center">
                <h3 className="text-lg font-bold text-slate-800 self-start mb-6">Kepulangan Mengikut Kelas</h3>
                <div className="w-full h-64">
                  {returnedCount === 0 && notReturnedCount === 0 ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                      <Icons.BarChart3 className="w-8 h-8 mb-2 opacity-50" />
                      <span className="text-sm">Tiada Rekod</span>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barChartDataIn} margin={{ top: 20, right: 20, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} allowDecimals={false} />
                        <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Bar dataKey="Telah Pulang" fill="#14b8a6" radius={[4, 4, 0, 0]}>
                          <LabelList dataKey="Telah Pulang" position="top" style={{ fontSize: '10px', fill: '#64748b' }} />
                        </Bar>
                        <Bar dataKey="Belum Pulang" fill="#f59e0b" radius={[4, 4, 0, 0]}>
                          <LabelList dataKey="Belum Pulang" position="top" style={{ fontSize: '10px', fill: '#64748b' }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          </div>

          <hr className="border-slate-200 my-8" />
          
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <h3 className="text-lg font-bold text-slate-800">Senarai Kehadiran Murid</h3>
              <div>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="text-sm border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 w-full sm:w-48"
                >
                  <option value="Semua">Semua Kelas</option>
                  {classList.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Sesi Sekolah */}
              <div>
                <h4 className="font-semibold text-slate-700 mb-4 flex items-center">
                  <Icons.BookOpen className="w-5 h-5 mr-2 text-indigo-500" />
                  Sesi Pergi Ke Sekolah
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {/* Hadir */}
                  <div className="bg-emerald-50 rounded-lg border border-emerald-100 flex flex-col h-96 overflow-hidden">
                    <div className="bg-emerald-100 px-4 py-2 border-b border-emerald-200 flex justify-between items-center">
                      <h5 className="font-semibold text-emerald-800 text-sm">Hadir</h5>
                      <span className="bg-emerald-200 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-full">{presentStudentsSchool.length}</span>
                    </div>
                    <div className="p-4 overflow-y-auto flex-1">
                      {presentStudentsSchool.length > 0 ? (
                        <ul className="space-y-2">
                          {presentStudentsSchool.map((s, idx) => (
                            <li key={`${s.id}-${idx}`} className="text-sm text-emerald-900 border-b border-emerald-200/50 pb-1">{s.name}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-emerald-600/70 text-center italic mt-4">Tiada murid</p>
                      )}
                    </div>
                  </div>
                  {/* Belum Hadir */}
                  <div className="bg-rose-50 rounded-lg border border-rose-100 flex flex-col h-96 overflow-hidden">
                    <div className="bg-rose-100 px-4 py-2 border-b border-rose-200 flex justify-between items-center">
                      <h5 className="font-semibold text-rose-800 text-sm">Belum Hadir</h5>
                      <span className="bg-rose-200 text-rose-800 text-xs font-bold px-2 py-0.5 rounded-full">{absentStudentsSchool.length}</span>
                    </div>
                    <div className="p-4 overflow-y-auto flex-1">
                      {absentStudentsSchool.length > 0 ? (
                        <ul className="space-y-2">
                          {absentStudentsSchool.map((s, idx) => (
                            <li key={`${s.id}-${idx}`} className="text-sm text-rose-900 border-b border-rose-200/50 pb-1">{s.name}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-rose-600/70 text-center italic mt-4">Tiada murid</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sesi Asrama */}
              <div>
                <h4 className="font-semibold text-slate-700 mb-4 flex items-center">
                  <Icons.Home className="w-5 h-5 mr-2 text-indigo-500" />
                  Sesi Balik Ke Asrama
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {/* Telah Pulang */}
                  <div className="bg-teal-50 rounded-lg border border-teal-100 flex flex-col h-96 overflow-hidden">
                    <div className="bg-teal-100 px-4 py-2 border-b border-teal-200 flex justify-between items-center">
                      <h5 className="font-semibold text-teal-800 text-sm">Telah Pulang</h5>
                      <span className="bg-teal-200 text-teal-800 text-xs font-bold px-2 py-0.5 rounded-full">{returnedStudentsAsrama.length}</span>
                    </div>
                    <div className="p-4 overflow-y-auto flex-1">
                      {returnedStudentsAsrama.length > 0 ? (
                        <ul className="space-y-2">
                          {returnedStudentsAsrama.map((s, idx) => (
                            <li key={`${s.id}-${idx}`} className="text-sm text-teal-900 border-b border-teal-200/50 pb-1">{s.name}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-teal-600/70 text-center italic mt-4">Tiada murid</p>
                      )}
                    </div>
                  </div>
                  {/* Belum Pulang */}
                  <div className="bg-amber-50 rounded-lg border border-amber-100 flex flex-col h-96 overflow-hidden">
                    <div className="bg-amber-100 px-4 py-2 border-b border-amber-200 flex justify-between items-center">
                      <h5 className="font-semibold text-amber-800 text-sm">Belum Pulang</h5>
                      <span className="bg-amber-200 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full">{notReturnedStudentsAsrama.length}</span>
                    </div>
                    <div className="p-4 overflow-y-auto flex-1">
                      {notReturnedStudentsAsrama.length > 0 ? (
                        <ul className="space-y-2">
                          {notReturnedStudentsAsrama.map((s, idx) => (
                            <li key={`${s.id}-${idx}`} className="text-sm text-amber-900 border-b border-amber-200/50 pb-1">{s.name}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-amber-600/70 text-center italic mt-4">Tiada murid</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
