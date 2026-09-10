/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Menu, Bell, User, Search, X, Loader2 } from 'lucide-react';
import * as Icons from 'lucide-react';
import { ViewType } from './types';
import { navigationMenu } from './data';
import { fetchPublicStudents } from './lib/sheets';
import { RegisterStudentView } from './components/RegisterStudentView';
import { NfcScannerView } from './components/NfcScannerView';
import { RegisterWardenView } from './components/RegisterWardenView';
import { RegisterCommitteeView } from './components/RegisterCommitteeView';
import { OrgChartWardenView } from './components/OrgChartWardenView';
import { OrgChartStudentView } from './components/OrgChartStudentView';
import { ApplyOutChildView } from './components/ApplyOutChildView';
import { ApplyOutStudentView } from './components/ApplyOutStudentView';
import { RecordOutView } from './components/RecordOutView';
import { RecordInView } from './components/RecordInView';
import { RecordSchoolOutView } from './components/RecordSchoolOutView';
import { RecordSchoolInView } from './components/RecordSchoolInView';
import { SchoolAttendanceStatsView } from './components/SchoolAttendanceStatsView';
import { DataReportView } from './components/DataReportView';
import { initAuth, googleSignIn } from './lib/google-auth';
import { saveRoomsToSheets, fetchSpreadsheetMetadata } from './lib/sheets-api';

export default function App() {

  const [needsAuth, setNeedsAuth] = useState(false);

  useEffect(() => {
    const unsubscribe = initAuth(
      () => setNeedsAuth(false),
      () => setNeedsAuth(true)
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const [loginError, setLoginError] = useState('');

  const handleLogin = async () => {
    try {
      setLoginError('');
      await googleSignIn();
      setNeedsAuth(false);
    } catch (err: any) {
      console.error('Login failed:', err);
      setLoginError(err.message || 'Gagal log masuk');
    }
  };
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isSearchOpen && allStudents.length === 0 && !isSearching) {
      setIsSearching(true);
      fetchPublicStudents().then(data => {
        setAllStudents(data);
        setIsSearching(false);
      }).catch(err => {
        console.error(err);
        setIsSearching(false);
      });
    }
  }, [isSearchOpen, allStudents.length, isSearching]);

  const filteredStudents = allStudents.filter(student => {
    const query = searchQuery.toLowerCase();
    const name = (student['Nama Penuh'] || '').toLowerCase();
    const room = (student['No Bilik'] || '').toLowerCase();
    const form = (student['Tingkatan'] || '').toLowerCase();
    return name.includes(query) || room.includes(query) || form.includes(query);
  }).slice(0, 5); // Limit to 5 results

  const renderIcon = (iconName: string, className?: string) => {
    const Icon = (Icons as any)[iconName];
    return Icon ? <Icon className={className || "w-5 h-5"} /> : null;
  };

  const handleNavClick = (id: ViewType) => {
    setCurrentView(id);
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden font-sans">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-20 lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 w-72 bg-slate-900 text-slate-300 z-30 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              A
            </div>
            <span className="text-white font-semibold text-lg tracking-wide">AsramaPro</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-slate-700">
          {navigationMenu.map((group, index) => (
            <div key={index} className="mb-6">
              <h3 className="px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                {group.title}
              </h3>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const isActive = currentView === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => handleNavClick(item.id)}
                        className={`w-full flex items-center space-x-3 px-6 py-2.5 text-sm font-medium transition-colors ${
                          isActive 
                            ? 'bg-indigo-500/10 text-indigo-400 border-r-4 border-indigo-500' 
                            : 'hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        {renderIcon(item.icon, `w-5 h-5 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`)}
                        <span>{item.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
        
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
              <User className="w-6 h-6 text-slate-300" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Ahmad Warden</p>
              <p className="text-xs text-slate-400">Ketua Warden</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-white h-16 border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 z-10">
          <div className="flex items-center">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 mr-3 text-slate-500 hover:bg-slate-100 rounded-md"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            <div className="hidden sm:flex items-center bg-slate-100 rounded-md px-3 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:bg-white transition-all relative" ref={searchRef}>
              <Search className="w-4 h-4 text-slate-400 mr-2" />
              <input 
                type="text" 
                placeholder="Cari pelajar, bilik..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchOpen(true)}
                className="bg-transparent border-none focus:outline-none text-sm w-64 text-slate-700 placeholder-slate-400"
              />
              {isSearchOpen && searchQuery && (
                <div className="absolute top-full left-0 mt-2 w-full max-w-md bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden z-50">
                  {isSearching ? (
                    <div className="flex items-center justify-center p-4 text-slate-500">
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      <span className="text-sm">Sedang mencari...</span>
                    </div>
                  ) : filteredStudents.length > 0 ? (
                    <ul className="max-h-80 overflow-y-auto">
                      {filteredStudents.map((student, idx) => (
                        <li key={idx} className="p-3 border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer last:border-0" onClick={() => setIsSearchOpen(false)}>
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-medium text-slate-800">{student['Nama Penuh'] || 'Tanpa Nama'}</p>
                              <div className="flex items-center mt-1 space-x-3 text-xs text-slate-500">
                                <span className="flex items-center"><Icons.GraduationCap className="w-3 h-3 mr-1" /> {student['Tingkatan'] || '-'}</span>
                                <span className="flex items-center"><Icons.DoorClosed className="w-3 h-3 mr-1" /> Bilik {student['No Bilik'] || '-'}</span>
                              </div>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${student['Status'] === 'Aktif' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                              {student['Status'] || 'Tidak Diketahui'}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-4 text-center text-sm text-slate-500">
                      Tiada hasil dijumpai untuk "{searchQuery}"
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {loginError && (
              <span className="hidden sm:inline-flex items-center text-xs text-rose-600 font-medium max-w-[200px] truncate" title={loginError}>
                <Icons.AlertCircle className="w-3 h-3 mr-1 flex-shrink-0" /> Ralat Log Masuk (Klik Tab Baharu)
              </span>
            )}
            {needsAuth ? (
              <button 
                onClick={handleLogin}
                className="hidden sm:flex bg-white text-slate-700 border border-slate-300 rounded-md shadow-sm hover:bg-slate-50 px-3 py-1.5 items-center space-x-2 transition-colors"
              >
                <span className="text-xs font-medium">Log Masuk Google</span>
              </button>
            ) : (
              <span className="hidden sm:inline-flex items-center text-xs text-emerald-600 font-medium">
                <Icons.CheckCircle2 className="w-3 h-3 mr-1" /> Bersambung
              </span>
            )}
            <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="hidden sm:block h-8 w-px bg-slate-200"></div>
            <span className="hidden sm:block text-sm font-medium text-slate-600">
              Sekolah Seni Malaysia Johor
            </span>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-6xl mx-auto">
            {renderView(currentView)}
          </div>
        </div>
      </main>
    </div>
  );
}

function renderView(view: ViewType) {
  switch (view) {
    case 'dashboard':
      return <DashboardPlaceholder />;
    case 'approve-out':
      return <ApproveOutPlaceholder />;
    case 'upload-data':
      return <DatabaseSetupView />;
    case 'register-block':
      return <RegisterBlockView />;
    case 'register-room':
      return <RegisterRoomView />;
    case 'register-student':
      return <RegisterStudentView />;
    case 'register-warden':
      return <RegisterWardenView />;
    case 'register-committee':
      return <RegisterCommitteeView />;
    case 'org-chart-warden':
      return <OrgChartWardenView />;
    case 'org-chart-student':
      return <OrgChartStudentView />;
    case 'apply-out-child':
      return <ApplyOutChildView />;
    case 'apply-out-student':
      return <ApplyOutStudentView />;
    case 'nfc-scanner':
      return <NfcScannerView />;
    case 'record-out':
      return <RecordOutView />;
    case 'record-in':
      return <RecordInView />;
    case 'record-school-out':
      return <RecordSchoolOutView />;
    case 'record-school-in':
      return <RecordSchoolInView />;
    case 'school-attendance-stats':
      return <SchoolAttendanceStatsView />;
    case 'data-report':
      return <DataReportView />;
    default:
      return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icons.Hammer className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Modul Dalam Pembinaan</h2>
          <p className="text-slate-500">Antaramuka untuk modul ini sedang dibangunkan.</p>
        </div>
      );
  }
}

function DatabaseSetupView() {
  const [appScriptUrl, setAppScriptUrl] = React.useState<string>(() => {
    return localStorage.getItem('appScriptUrl') || '';
  });
  const [isSaved, setIsSaved] = React.useState(false);

  const handleSave = () => {
    localStorage.setItem('appScriptUrl', appScriptUrl);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const appScriptCode = `function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Kehadiran Sekolah');
  if (!sheet) {
    sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('Kehadiran Sekolah');
    sheet.appendRow(['ID Transaksi', 'ID Pelajar', 'Nama Pelajar', 'Tingkatan', 'Tarikh', 'Masa Keluar', 'Masa Masuk', 'Status']);
  }
  
  var data = JSON.parse(e.postData.contents);
  var action = data.action;
  var row = data.row;
  
  var dataRange = sheet.getDataRange();
  var values = dataRange.getValues();
  var headers = values[0];
  
  if (action === 'recordOut') {
    var newRow = headers.map(function(header) {
      return row[header] || '';
    });
    sheet.appendRow(newRow);
  } else if (action === 'recordIn') {
    var rowIndex = -1;
    var studentIdIdx = headers.indexOf('ID Pelajar');
    var dateIdx = headers.indexOf('Tarikh');
    
    for (var i = values.length - 1; i >= 1; i--) {
      if (values[i][studentIdIdx] == row['ID Pelajar'] && values[i][dateIdx] == row['Tarikh']) {
        rowIndex = i + 1;
        break;
      }
    }
    
    if (rowIndex > -1) {
      var timeInIdx = headers.indexOf('Masa Masuk') + 1;
      var statusIdx = headers.indexOf('Status') + 1;
      sheet.getRange(rowIndex, timeInIdx).setValue(row['Masa Masuk']);
      sheet.getRange(rowIndex, statusIdx).setValue('Pulang');
    } else {
       var newRow = headers.map(function(header) {
         return row[header] || '';
       });
       sheet.appendRow(newRow);
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({success: true})).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Kehadiran Sekolah');
  if (!sheet) return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
  
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var result = [];
  for (var i = 1; i < data.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = data[i][j];
    }
    result.push(obj);
  }
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Muat Naik Data Asrama (Setup Apps Script)</h1>
        <p className="text-sm text-slate-500 mt-1">Gunakan Google Apps Script untuk menyimpan dan mengemaskini data terus ke Google Sheets anda.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 max-w-4xl">
        <div className="flex flex-col space-y-8">
          <div>
            <h2 className="text-lg font-semibold text-slate-800 mb-2">1. Salin Kod Google Apps Script</h2>
            <p className="text-slate-600 text-sm mb-4">
              Buka Google Sheets anda, pergi ke <strong>Extensions &gt; Apps Script</strong>. 
              Gantikan kod sedia ada dengan kod di bawah:
            </p>
            <div className="relative">
              <pre className="bg-slate-900 text-slate-50 p-4 rounded-lg text-sm overflow-x-auto max-h-64 overflow-y-auto">
                {appScriptCode}
              </pre>
              <button 
                onClick={() => navigator.clipboard.writeText(appScriptCode)}
                className="absolute top-2 right-2 bg-slate-800 hover:bg-slate-700 text-slate-200 p-2 rounded flex items-center transition-colors"
                title="Salin Kod"
              >
                <Icons.Copy className="w-4 h-4" />
              </button>
            </div>
            <p className="text-slate-600 text-sm mt-4">
              Selepas meletakkan kod di atas, klik butang <strong>Deploy &gt; New deployment</strong>. 
              Pilih type <strong>Web app</strong>. 
              Setkan: <br/>
              - Execute as: <strong>Me</strong><br/>
              - Who has access: <strong>Anyone</strong><br/>
              Kemudian, salin Web App URL yang diberikan.
            </p>
          </div>
          
          <hr className="border-slate-200" />
          
          <div>
            <h2 className="text-lg font-semibold text-slate-800 mb-2">2. Masukkan Web App URL</h2>
            <p className="text-slate-600 text-sm mb-4">
              Tampal (paste) URL Web App yang anda salin tadi di sini supaya sistem boleh menghantar dan menerima data daripada Google Sheets anda.
            </p>
            <div className="flex space-x-3">
              <input 
                type="text" 
                value={appScriptUrl}
                onChange={(e) => setAppScriptUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/AKfycby.../exec"
                className="flex-1 text-sm border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border"
              />
              <button
                onClick={handleSave}
                className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
              >
                <Icons.Save className="w-4 h-4" />
                <span>{isSaved ? 'Disimpan!' : 'Simpan URL'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardPlaceholder() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Papan Pemuka</h1>
          <p className="text-sm text-slate-500 mt-1">Ringkasan status asrama hari ini.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Jumlah Pelajar" value="452" icon="Users" color="bg-blue-500" trend="+12 bulan ini" />
        <StatCard title="Kapasiti Bilik" value="85%" icon="Bed" color="bg-indigo-500" trend="25 katil kosong" />
        <StatCard title="Pelajar Keluar (Hari ini)" value="18" icon="LogOut" color="bg-amber-500" trend="5 belum pulang" />
        <StatCard title="Permohonan Keluar" value="7" icon="FileText" color="bg-rose-500" trend="Memerlukan kelulusan" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Pergerakan Terkini</h2>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${i % 2 === 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                    {i % 2 === 0 ? <Icons.ArrowDownRight className="w-5 h-5" /> : <Icons.ArrowUpRight className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">Muhammad Ali bin Abu</p>
                    <p className="text-xs text-slate-500">Tingkatan 4 Sains • Bilik A203</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${i % 2 === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {i % 2 === 0 ? 'Masuk' : 'Keluar'}
                  </span>
                  <p className="text-xs text-slate-400 mt-1">Hari ini, {14 - i}:30 PM</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Tindakan Cepat</h2>
          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 text-left transition-colors">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-md">
                  <Icons.CheckSquare className="w-4 h-4" />
                </div>
                <span className="font-medium text-slate-700 text-sm">Luluskan Permohonan (7)</span>
              </div>
              <Icons.ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
            <button className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 text-left transition-colors">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-md">
                  <Icons.QrCode className="w-4 h-4" />
                </div>
                <span className="font-medium text-slate-700 text-sm">Imbas Kod QR Pelajar</span>
              </div>
              <Icons.ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
            <button className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 text-left transition-colors">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-md">
                  <Icons.FileSpreadsheet className="w-4 h-4" />
                </div>
                <span className="font-medium text-slate-700 text-sm">Jana Laporan Harian</span>
              </div>
              <Icons.ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color, trend }: { title: string, value: string, icon: string, color: string, trend: string }) {
  const Icon = (Icons as any)[icon];
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex items-start space-x-4">
      <div className={`p-3 rounded-xl text-white ${color}`}>
        {Icon && <Icon className="w-6 h-6" />}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800 mt-1">{value}</h3>
        <p className="text-xs text-slate-400 mt-1">{trend}</p>
      </div>
    </div>
  );
}

function ApproveOutPlaceholder() {
  return (
    <div className="space-y-6">
       <div>
        <h1 className="text-2xl font-bold text-slate-800">Kelulusan Keluar Asrama</h1>
        <p className="text-sm text-slate-500 mt-1">Uruskan permohonan keluar pelajar yang memerlukan kelulusan warden.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-slate-700">Tapis status:</span>
            <select className="text-sm border-slate-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-1.5 border">
              <option>Menunggu Kelulusan (7)</option>
              <option>Telah Diluluskan</option>
              <option>Ditolak</option>
            </select>
          </div>
          <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center">
            <Icons.CheckCheck className="w-4 h-4 mr-1" /> Luluskan Semua
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Pelajar</th>
                <th className="py-3 px-4">Tujuan</th>
                <th className="py-3 px-4">Tarikh / Masa Keluar</th>
                <th className="py-3 px-4">Tarikh / Masa Balik</th>
                <th className="py-3 px-4 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {[
                { name: "Ahmad Zaki", room: "A102", reason: "Balik Kampung", out: "Jumaat, 3:00 PM", in: "Ahad, 5:00 PM" },
                { name: "Siti Nurhaliza", room: "B204", reason: "Klinik Kesihatan", out: "Hari ini, 10:00 AM", in: "Hari ini, 1:00 PM" },
                { name: "Chong Wei", room: "A301", reason: "Urusan Keluarga", out: "Sabtu, 8:00 AM", in: "Sabtu, 6:00 PM" },
              ].map((req, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-medium text-slate-800">{req.name}</p>
                    <p className="text-xs text-slate-500">Bilik {req.room}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                      {req.reason}
                    </span>
                  </td>
                  <td className="py-3 px-4">{req.out}</td>
                  <td className="py-3 px-4">{req.in}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end space-x-2">
                      <button className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-md transition-colors" title="Tolak">
                        <Icons.X className="w-5 h-5" />
                      </button>
                      <button className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors" title="Luluskan">
                        <Icons.Check className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function RegisterBlockView() {
  const [blocks, setBlocks] = React.useState([
    { code: 'A', name: 'ASPURA', capacity: 40, warden: 'HAIRI BIN ABDUL RAHIM' },
    { code: 'A', name: 'ASPURA', capacity: 40, warden: 'NOOR FAIZ BIN JAFFAR' },
    { code: 'B', name: 'ASPURI', capacity: 40, warden: 'NIZAM BIN RUSLI' },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Daftar Blok Asrama</h1>
          <p className="text-sm text-slate-500 mt-1">Urus senarai blok asrama dan kapasiti.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Pendaftaran */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-fit">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
            <Icons.PlusCircle className="w-5 h-5 mr-2 text-indigo-500" /> Tambah Blok Baru
          </h2>
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Kod Blok</label>
              <input 
                type="text" 
                placeholder="Contoh: C" 
                className="w-full text-sm border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nama Blok</label>
              <input 
                type="text" 
                placeholder="Contoh: Asrama Putera (Ibnu Sina)" 
                className="w-full text-sm border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Jumlah Bilik</label>
              <input 
                type="number" 
                placeholder="0" 
                className="w-full text-sm border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ketua Warden Bertugas</label>
              <select className="w-full text-sm border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border">
                <option value="">-- Pilih Warden --</option>
                <option value="HAIRI BIN ABDUL RAHIM">HAIRI BIN ABDUL RAHIM</option>
                <option value="NOOR FAIZ BIN JAFFAR">NOOR FAIZ BIN JAFFAR</option>
                <option value="NIZAM BIN RUSLI">NIZAM BIN RUSLI</option>
              </select>
            </div>
            <div className="pt-2">
              <button 
                type="button"
                className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
              >
                <Icons.Save className="w-4 h-4" />
                <span>Simpan Blok</span>
              </button>
            </div>
          </form>
        </div>

        {/* Senarai Blok */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center">
              <Icons.Building className="w-5 h-5 mr-2 text-slate-500" /> Senarai Blok Berdaftar
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Kod</th>
                  <th className="py-3 px-4">Nama Blok</th>
                  <th className="py-3 px-4 text-center">Jumlah Bilik</th>
                  <th className="py-3 px-4">Warden</th>
                  <th className="py-3 px-4 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {blocks.map((block, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-indigo-600">{block.code}</td>
                    <td className="py-3 px-4 text-slate-800 font-medium">{block.name}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center justify-center bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full text-xs font-medium">
                        {block.capacity} Bilik
                      </span>
                    </td>
                    <td className="py-3 px-4">{block.warden}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors" title="Edit">
                          <Icons.Edit2 className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors" title="Padam">
                          <Icons.Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {blocks.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      Tiada data blok direkodkan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function RegisterRoomView() {
  const [rooms, setRooms] = React.useState(() => {
    const savedRooms = localStorage.getItem('asrama_rooms');
    if (savedRooms) {
      try {
        return JSON.parse(savedRooms);
      } catch (e) {
        console.error('Error parsing rooms from local storage:', e);
      }
    }
    return [
      { roomNo: 'A101', blockCode: 'A', capacity: 4, occupants: 4, status: 'Penuh' },
      { roomNo: 'A102', blockCode: 'A', capacity: 4, occupants: 3, status: 'Ada Kekosongan' },
      { roomNo: 'B201', blockCode: 'B', capacity: 4, occupants: 0, status: 'Kosong' },
    ];
  });

  const [roomNeedsAuth, setRoomNeedsAuth] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = initAuth(
      () => setRoomNeedsAuth(false),
      () => setRoomNeedsAuth(true)
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const handleRoomLogin = async () => {
    try {
      setIsSyncing(true);
      await googleSignIn();
      setRoomNeedsAuth(false);
    } catch (err) {
      console.error('Login failed:', err);
      setSyncError('Gagal untuk log masuk ke Google.');
    } finally {
      setIsSyncing(false);
    }
  };

  const syncToSheets = async (newRooms: any[]) => {
    if (roomNeedsAuth) {
      setSyncError('Sila log masuk untuk simpan ke Google Sheets.');
      return;
    }
    try {
      setIsSyncing(true);
      setSyncError(null);
      setSyncSuccess(null);
      await saveRoomsToSheets(newRooms);
      setSyncSuccess('Berjaya disimpan ke Google Sheets!');
      setTimeout(() => setSyncSuccess(null), 3000);
    } catch (err: any) {
      console.error('Sync failed:', err);
      setSyncError(err.message || 'Gagal untuk menyimpan ke Google Sheets.');
    } finally {
      setIsSyncing(false);
    }
  };

  React.useEffect(() => {
    localStorage.setItem('asrama_rooms', JSON.stringify(rooms));
  }, [rooms]);

  const [formData, setFormData] = React.useState({
    roomNo: '',
    blockCode: '',
    capacity: 4,
    occupants: 0,
    status: 'Kosong'
  });
  const [isEditing, setIsEditing] = React.useState(false);
  const [editIndex, setEditIndex] = React.useState<number | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'capacity' || name === 'occupants' ? parseInt(value) || 0 : value 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.roomNo || !formData.blockCode) return;

    let newRooms = [...rooms];
    if (isEditing && editIndex !== null) {
      newRooms[editIndex] = formData;
      setIsEditing(false);
      setEditIndex(null);
    } else {
      newRooms = [formData, ...newRooms];
    }
    
    setRooms(newRooms);
    await syncToSheets(newRooms);

    setFormData({
      roomNo: '',
      blockCode: '',
      capacity: 4,
      occupants: 0,
      status: 'Kosong'
    });
  };

  const handleEdit = (room: any, index: number) => {
    setFormData({
      roomNo: room.roomNo,
      blockCode: room.blockCode,
      capacity: room.capacity,
      occupants: room.occupants,
      status: room.status
    });
    setIsEditing(true);
    setEditIndex(index);
  };

  const handleDelete = async (index: number) => {
    if (confirm('Adakah anda pasti untuk memadam rekod bilik ini?')) {
      const newRooms = [...rooms];
      newRooms.splice(index, 1);
      setRooms(newRooms);
      await syncToSheets(newRooms);
      
      if (isEditing && editIndex === index) {
        setIsEditing(false);
        setEditIndex(null);
        setFormData({
          roomNo: '',
          blockCode: '',
          capacity: 4,
          occupants: 0,
          status: 'Kosong'
        });
      }
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditIndex(null);
    setFormData({
      roomNo: '',
      blockCode: '',
      capacity: 4,
      occupants: 0,
      status: 'Kosong'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Daftar Bilik Asrama</h1>
          <p className="text-sm text-slate-500 mt-1">Urus senarai bilik asrama, kapasiti dan penghuni.</p>
        </div>
        <div>
          {roomNeedsAuth ? (
            <button 
              onClick={handleRoomLogin}
              disabled={isSyncing}
              className="gsi-material-button bg-white text-slate-700 border border-slate-300 rounded-md shadow-sm hover:bg-slate-50 px-4 py-2 flex items-center space-x-2 transition-colors disabled:opacity-50"
            >
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                <path fill="none" d="M0 0h48v48H0z"></path>
              </svg>
              <span className="text-sm font-medium">Log masuk dengan Google</span>
            </button>
          ) : (
            <div className="flex flex-col items-end">
              <span className="inline-flex items-center text-sm text-emerald-600 font-medium">
                <Icons.CheckCircle2 className="w-4 h-4 mr-1" /> Google Sheets Disambung
              </span>
              <button onClick={() => syncToSheets(rooms)} disabled={isSyncing} className="text-xs text-indigo-600 hover:text-indigo-700 mt-1 flex items-center">
                <Icons.RefreshCw className={`w-3 h-3 mr-1 ${isSyncing ? 'animate-spin' : ''}`} /> Sinkronisasi Sekarang
              </button>
            </div>
          )}
        </div>
      </div>

      {syncError && (
        <div className="bg-rose-50 text-rose-700 p-3 rounded-lg text-sm flex items-start border border-rose-100">
          <Icons.AlertCircle className="w-5 h-5 mr-2 shrink-0 mt-0.5" />
          <p>{syncError}</p>
        </div>
      )}

      {syncSuccess && (
        <div className="bg-emerald-50 text-emerald-700 p-3 rounded-lg text-sm flex items-start border border-emerald-100">
          <Icons.CheckCircle2 className="w-5 h-5 mr-2 shrink-0 mt-0.5" />
          <p>{syncSuccess}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Pendaftaran */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-fit">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
            {isEditing ? (
              <><Icons.Edit2 className="w-5 h-5 mr-2 text-indigo-500" /> Kemaskini Bilik</>
            ) : (
              <><Icons.PlusCircle className="w-5 h-5 mr-2 text-indigo-500" /> Tambah Bilik Baru</>
            )}
          </h2>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">No Bilik</label>
              <input 
                type="text" 
                name="roomNo"
                value={formData.roomNo}
                onChange={handleInputChange}
                placeholder="Contoh: A101" 
                required
                className="w-full text-sm border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Kod Blok</label>
              <select 
                name="blockCode"
                value={formData.blockCode}
                onChange={handleInputChange}
                required
                className="w-full text-sm border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border"
              >
                <option value="">-- Pilih Blok --</option>
                <option value="A">A - ASPURA</option>
                <option value="B">B - ASPURI</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Kapasiti Maksimum</label>
              <input 
                type="number" 
                name="capacity"
                value={formData.capacity}
                onChange={handleInputChange}
                placeholder="4" 
                min="1"
                required
                className="w-full text-sm border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Jumlah Penghuni Semasa</label>
              <input 
                type="number" 
                name="occupants"
                value={formData.occupants}
                onChange={handleInputChange}
                placeholder="0" 
                min="0"
                className="w-full text-sm border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select 
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full text-sm border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border"
              >
                <option value="Kosong">Kosong</option>
                <option value="Ada Kekosongan">Ada Kekosongan</option>
                <option value="Penuh">Penuh</option>
                <option value="Diselenggara">Diselenggara</option>
              </select>
            </div>
            <div className="pt-2 flex flex-col space-y-2">
              <button 
                type="submit"
                className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
              >
                <Icons.Save className="w-4 h-4" />
                <span>{isEditing ? 'Simpan Kemaskini' : 'Simpan Bilik'}</span>
              </button>
              {isEditing && (
                <button 
                  type="button" 
                  onClick={handleCancelEdit}
                  className="w-full flex items-center justify-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-lg font-medium transition-colors"
                >
                  <span>Batal Kemaskini</span>
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Senarai Bilik */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center">
              <Icons.DoorClosed className="w-5 h-5 mr-2 text-slate-500" /> Senarai Bilik Berdaftar
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">No Bilik</th>
                  <th className="py-3 px-4 text-center">Blok</th>
                  <th className="py-3 px-4 text-center">Kapasiti</th>
                  <th className="py-3 px-4 text-center">Penghuni</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {rooms.map((room, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-800">{room.roomNo}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center justify-center bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs font-medium border border-slate-200">
                        Blok {room.blockCode}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-slate-600">{room.capacity}</td>
                    <td className="py-3 px-4 text-center font-medium text-slate-800">{room.occupants}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        room.status === 'Penuh' ? 'bg-rose-100 text-rose-700' :
                        room.status === 'Ada Kekosongan' ? 'bg-amber-100 text-amber-700' :
                        room.status === 'Kosong' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {room.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button 
                          onClick={() => handleEdit(room, i)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors" 
                          title="Edit"
                        >
                          <Icons.Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(i)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors" 
                          title="Padam"
                        >
                          <Icons.Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {rooms.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      Tiada data bilik direkodkan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

