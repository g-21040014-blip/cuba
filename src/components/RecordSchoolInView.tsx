import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { fetchPublicStudents } from '../lib/sheets';
import { useLocalStorage } from '../lib/useLocalStorage';

interface Student {
  id: string;
  name: string;
  form: string;
  image?: string;
}

interface AttendanceRecord {
  id: string;
  studentId: string;
  name: string;
  form: string;
  date: string;
  timeIn: string;
  status: string;
}

export function RecordSchoolInView() {
  const [method, setMethod] = useState<'manual' | 'qr'>('qr');
  const [searchTerm, setSearchTerm] = useState('');
  const [scannedStudent, setScannedStudent] = useState<Student | null>(null);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [recordDate, setRecordDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [filterDate, setFilterDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    const loadStudents = async () => {
      try {
        setLoadingStudents(true);
        const data = await fetchPublicStudents();
        const formattedStudents = data.map(row => ({
          id: row['ID Pelajar'] || '',
          name: row['Nama Penuh'] || '',
          form: row['Tingkatan'] || '',
          image: row['GAMBAR'] || undefined
        })).filter(s => s.id !== '');
        setStudents(formattedStudents);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingStudents(false);
      }
    };
    loadStudents();
  }, []);

  const [records, setRecords] = useLocalStorage<AttendanceRecord[]>('school-in-records', []);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchTerm.trim()) return;
    
    const student = students.find(s => s.id.toUpperCase() === searchTerm.toUpperCase());
    if (student) {
      setScannedStudent(student);
    } else {
      alert('Pelajar tidak dijumpai!');
      setScannedStudent(null);
    }
  };

  const handleRecord = async () => {
    if (!scannedStudent) return;
    
    const today = recordDate;
    const alreadyRecorded = records.find(r => r.studentId === scannedStudent.id && r.date === today);
    if (alreadyRecorded) {
      alert('Pelajar ini telah direkodkan balik ke asrama hari ini.');
      return;
    }

    const now = new Date();
    const timeString = now.toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit', hour12: false });
    
    const newRecord: AttendanceRecord = {
      id: `KHD${String(records.length + 2).padStart(3, '0')}`,
      studentId: scannedStudent.id,
      name: scannedStudent.name,
      form: scannedStudent.form,
      date: today,
      timeIn: timeString,
      status: 'Pulang'
    };
    
    setRecords([newRecord, ...records]);
    setScannedStudent(null);
    setSearchTerm('');
    alert('Rekod berjaya disimpan!');

    // Post to Apps Script
    const appScriptUrl = localStorage.getItem('appScriptUrl');
    if (appScriptUrl) {
      try {
        await fetch(appScriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'recordIn',
            row: {
              'ID Transaksi': newRecord.id,
              'ID Pelajar': newRecord.studentId,
              'Nama Pelajar': newRecord.name,
              'Tingkatan': newRecord.form,
              'Tarikh': newRecord.date,
              'Masa Keluar': '',
              'Masa Masuk': newRecord.timeIn,
              'Status': newRecord.status
            }
          })
        });
      } catch (err) {
        console.error('Error posting to Apps Script:', err);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Rekod Balik Asrama (Dari Sekolah)</h1>
          <p className="text-sm text-slate-500 mt-1">Imbas QR pelajar untuk merekod pergerakan masuk (pulang) dari sekolah.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">
        {/* Input Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
          <div className="mb-6 bg-teal-50 p-4 rounded-lg border border-teal-100">
            <label className="block text-sm font-medium text-teal-900 mb-2">Tarikh Kepulangan Direkodkan</label>
            <input 
              type="date" 
              value={recordDate} 
              onChange={(e) => setRecordDate(e.target.value)} 
              className="w-full text-sm border-teal-200 rounded-lg shadow-sm focus:border-teal-500 focus:ring-teal-500 p-2 border bg-white" 
            />
          </div>

          <div className="flex space-x-2 mb-6 bg-slate-100 p-1 rounded-lg">
            <button 
              onClick={() => { setMethod('qr'); setScannedStudent(null); setSearchTerm(''); }}
              className={`flex-1 flex justify-center items-center py-2 text-sm font-medium rounded-md transition-colors ${method === 'qr' ? 'bg-white shadow text-teal-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Icons.QrCode className="w-4 h-4 mr-2" /> Imbasan QR
            </button>
            <button 
              onClick={() => { setMethod('manual'); setScannedStudent(null); setSearchTerm(''); }}
              className={`flex-1 flex justify-center items-center py-2 text-sm font-medium rounded-md transition-colors ${method === 'manual' ? 'bg-white shadow text-teal-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Icons.Keyboard className="w-4 h-4 mr-2" /> Kemasukan Manual
            </button>
          </div>

          {method === 'qr' ? (
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50">
              <div className="w-48 h-48 bg-slate-200 rounded-lg flex items-center justify-center mb-4 cursor-pointer" onClick={() => {
                // Simulate QR scan
                const randomStudent = students[Math.floor(Math.random() * students.length)];
                setSearchTerm(randomStudent.id);
                setScannedStudent(randomStudent);
              }}>
                <Icons.Camera className="w-12 h-12 text-slate-400" />
              </div>
              <p className="text-sm text-slate-500 text-center">Halakan kamera pada Kod QR pas pelajar untuk merekod kepulangan.</p>
              <button className="mt-4 px-4 py-2 bg-slate-800 text-white text-sm rounded-lg hover:bg-slate-700 transition-colors">
                Aktifkan Kamera (Simulasi Klik QR)
              </button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSearch}>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ID / IC Pelajar</label>
                <div className="flex space-x-2">
                  <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Cth: P001" 
                    className="flex-1 text-sm border-slate-300 rounded-lg shadow-sm focus:border-teal-500 focus:ring-teal-500 p-2.5 border" 
                  />
                  <button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-lg transition-colors font-medium">Cari</button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Result/Confirmation Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h2 className="font-semibold text-slate-800">Semakan Pelajar</h2>
          </div>
          
          <div className="p-6 flex flex-col space-y-6">
            {scannedStudent ? (
              <>
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 bg-slate-200 rounded-lg flex items-center justify-center text-slate-400 overflow-hidden shrink-0">
                      {scannedStudent.image ? (
                        <img src={scannedStudent.image} alt={scannedStudent.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <Icons.User className="w-8 h-8" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-800">{scannedStudent.name}</h3>
                      <p className="text-sm text-slate-500">{scannedStudent.id} • Tingkatan {scannedStudent.form}</p>
                      <div className="inline-flex items-center mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
                        <Icons.Clock className="w-3 h-3 mr-1" /> Di Sekolah
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 text-sm">
                    <div className="grid grid-cols-2 gap-y-2">
                      <div className="text-slate-500">Masa Imbasan:</div>
                      <div className="font-medium text-slate-800">{new Date().toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit', hour12: false })}</div>
                      <div className="text-slate-500 flex items-center">Tarikh:</div>
                      <div className="font-medium text-slate-800">
                        {new Date(recordDate).toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                      <div className="text-slate-500">Status Kepulangan:</div>
                      <div className="font-medium text-emerald-600">Menepati Masa</div>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleRecord}
                  className="w-full mt-6 bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-lg font-bold text-lg shadow-sm transition-colors flex items-center justify-center"
                >
                  <Icons.Home className="w-5 h-5 mr-2" /> REKOD BALIK ASRAMA
                </button>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
                <Icons.UserSearch className="w-16 h-16 mb-4 text-slate-300" />
                <p>Sila imbas QR atau cari ID pelajar.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table for attendance records */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-8">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center">
            <Icons.ListChecks className="w-5 h-5 mr-2 text-slate-500" /> Log Kepulangan Ke Asrama
          </h2>
          <div>
            <input 
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="text-sm border-slate-300 rounded-lg shadow-sm focus:border-teal-500 focus:ring-teal-500 p-2 border"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">ID Transaksi</th>
                <th className="py-3 px-4">ID Pelajar</th>
                <th className="py-3 px-4">Nama Pelajar</th>
                <th className="py-3 px-4">Tingkatan</th>
                <th className="py-3 px-4">Tarikh</th>
                <th className="py-3 px-4 text-center">Masa Masuk</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {records.filter(r => r.date === filterDate).map((record, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-mono text-xs text-slate-500">{record.id}</td>
                  <td className="py-3 px-4 font-semibold text-teal-600">{record.studentId}</td>
                  <td className="py-3 px-4 text-slate-800 font-medium">{record.name}</td>
                  <td className="py-3 px-4 text-slate-600">{record.form || '-'}</td>
                  <td className="py-3 px-4">{record.date}</td>
                  <td className="py-3 px-4 text-center">{record.timeIn}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))}
              {records.filter(r => r.date === filterDate).length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Tiada rekod kepulangan pada {new Date(filterDate).toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
