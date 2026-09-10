import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Clock, 
  UserCheck, 
  History, 
  Shield, 
  FileText,
  Volume2,
  VolumeX,
  PlusCircle,
  HelpCircle,
  CheckCircle2,
  LogOut,
  AlertTriangle,
  Database,
  Info,
  Key
} from 'lucide-react';
import { 
  Student, 
  HostelState, 
  StudentStatus, 
  HostelLog, 
  SessionPeriod, 
  AttendanceSession,
  Warden,
  ParentRequest,
  StatusType
} from './types/hostel';
import { INITIAL_STUDENTS } from './data/studentsData';
import { INITIAL_WARDENS } from './data/wardensData';
import { loadHostelState, saveHostelState } from './utils/storage';
import { sounds } from './utils/audio';
import { isOutingOverdue } from './utils/helpers';
import { 
  getGoogleSheetsConfig, 
  syncLogMovementToSheets, 
  syncAttendanceToSheets 
} from './services/googleSheetsSync';
import { fetchSmartMergedStudentsFromGoogleSheet } from './services/googleSheetImport';
import { 
  subscribeToSupabaseSyncError, 
  isSupabaseConfigured, 
  SupabaseSyncErrorState,
  syncStudentStatus,
  syncBulkStudentStatuses,
  syncHostelLog,
  syncBulkHostelLogs,
  syncAttendanceRecordToCloud,
  syncNewStudentToCloud,
  fetchInitialStateFromSupabase,
  parseSpecialCloudLogs,
  retryPendingSync
} from './services/supabaseService';
import { mergeIncomingParentRequests } from './services/parentRequestsService';
import { supabase, onSupabaseClientChange } from './lib/supabase';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ScanStation } from './components/ScanStation';
import { Dashboard } from './components/Dashboard';
import { StudentList } from './components/StudentList';
import { OutingMonitor } from './components/OutingMonitor';
import { AttendanceSessionView } from './components/AttendanceSessionView';
import { ActivityLog } from './components/ActivityLog';
import { StudentModal } from './components/StudentModal';
import { GatePassModal } from './components/GatePassModal';
import { DailyReportModal } from './components/DailyReportModal';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { SupabaseModal } from './components/SupabaseModal';
import { ScannerKiosk } from './components/ScannerKiosk';
import { LoginScreen } from './components/LoginScreen';
import { AdminPinModal } from './components/AdminPinModal';
import { ParentPortalModal } from './components/ParentPortalModal';
import { CategoryStudentModal, CategoryType } from './components/CategoryStudentModal';
import { ParentPortalPage } from './components/ParentPortalPage';
import { BulkReturnModal } from './components/BulkReturnModal';
import { BulkOutingView } from './components/BulkOutingView';
import { EditMovementModal } from './components/EditMovementModal';

export default function App() {
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem('asrama_students_list_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return INITIAL_STUDENTS;
  });

  const handleImportStudents = (importedStudents: Student[]) => {
    if (!Array.isArray(importedStudents) || importedStudents.length === 0) return;
    setStudents(importedStudents);
    try {
      localStorage.setItem('asrama_students_list_v3', JSON.stringify(importedStudents));
    } catch (e) {
      console.warn('Failed to save imported students:', e);
    }
  };

  const sanitizeWardens = (list: Warden[]): Warden[] => {
    return list.map(w => {
      const upperName = (w.nama || '').toUpperCase();
      if (upperName.includes('NIZAM')) {
        return {
          ...w,
          jawatan: 'Ketua Warden Asrama',
          blok: 'Pentadbiran Asrama'
        };
      }
      if (upperName.includes('NOOR FAIZ')) {
        return {
          ...w,
          jawatan: 'Warden Aspura',
          blok: 'Aspura (Kasturi & Tuah)'
        };
      }
      return w;
    });
  };

  const handleImportWardens = (importedWardens: Warden[]) => {
    if (!Array.isArray(importedWardens) || importedWardens.length === 0) return;
    const sanitized = sanitizeWardens(importedWardens);
    setWardens(sanitized);
    try {
      localStorage.setItem('ssem_wardens_list_v2', JSON.stringify(sanitized));
    } catch (e) {
      console.warn('Failed to save imported wardens:', e);
    }
  };

  // Wardens state
  const [wardens, setWardens] = useState<Warden[]>(() => {
    try {
      const saved = localStorage.getItem('ssem_wardens_list_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const sanitized = sanitizeWardens(parsed);
          localStorage.setItem('ssem_wardens_list_v2', JSON.stringify(sanitized));
          return sanitized;
        }
      }
    } catch {
      // fallback
    }
    return INITIAL_WARDENS;
  });

  const [selectedWardenId, setSelectedWardenId] = useState<string>(() => {
    const saved = localStorage.getItem('ssem_selected_warden_id');
    if (saved && INITIAL_WARDENS.some(w => w.id === saved)) {
      return saved;
    }
    return INITIAL_WARDENS[0].id;
  });

  const currentWarden = useMemo(() => {
    return wardens.find(w => w.id === selectedWardenId) || wardens[0];
  }, [wardens, selectedWardenId]);

  const [userRole, setUserRole] = useState<'admin' | 'warden' | 'guard' | null>(() => {
    // Check if role is provided in URL query string (e.g. ?role=guard or ?role=warden)
    try {
      const params = new URLSearchParams(window.location.search);
      const urlRole = params.get('role') || params.get('as');
      if (urlRole === 'guard' || urlRole === 'warden' || urlRole === 'admin') {
        localStorage.setItem('ssemj_user_role', urlRole);
        return urlRole;
      }
    } catch {}
    return localStorage.getItem('ssemj_user_role') as 'admin' | 'warden' | 'guard' | null;
  });

  const [hostelState, setHostelState] = useState<HostelState>(() => loadHostelState());
  // If guard is logged in, restrict initial tab to scan
  const [activeTab, setActiveTab] = useState<'dashboard' | 'scan' | 'murid' | 'outing' | 'kehadiran' | 'log' | 'keluar-pukal'>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'outing' || tabParam === 'murid' || tabParam === 'kehadiran' || tabParam === 'log' || tabParam === 'keluar-pukal') {
        return tabParam as any;
      }
      return 'dashboard';
    } catch {
      return 'dashboard';
    }
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('asrama_sound_enabled') !== 'false';
  });

  // Modals state
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<Student | null>(null);
  const [editingMovementStudent, setEditingMovementStudent] = useState<Student | null>(null);
  const [selectedStudentForGatePass, setSelectedStudentForGatePass] = useState<Student | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeCategoryModal, setActiveCategoryModal] = useState<CategoryType | null>(null);
  const [isGSheetModalOpen, setIsGSheetModalOpen] = useState(false);
  const [isAdminPinModalOpen, setIsAdminPinModalOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isParentPortalOpen, setIsParentPortalOpen] = useState(false);
  const [isBulkReturnModalOpen, setIsBulkReturnModalOpen] = useState(false);
  const [gSheetConfig, setGSheetConfig] = useState(() => getGoogleSheetsConfig());
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [supabaseVersion, setSupabaseVersion] = useState(0);

  useEffect(() => {
    const unsub = onSupabaseClientChange(() => {
      setSupabaseVersion(v => v + 1);
    });
    return () => unsub();
  }, []);

  // Function to open Google Sheets with Admin check
  const handleOpenGoogleSheets = () => {
    if (userRole === 'admin') {
      setGSheetConfig(getGoogleSheetsConfig());
      setIsGSheetModalOpen(true);
    } else {
      setIsAdminPinModalOpen(true);
    }
  };

  const [isSyncingSheets, setIsSyncingSheets] = useState(false);

  // 1-Click Quick Sync from Google Sheets (Smart Merge)
  const handleQuickSyncGoogleSheets = async () => {
    setIsSyncingSheets(true);
    try {
      const config = getGoogleSheetsConfig();
      const sheetId = config.spreadsheetId || '1tNACM32JUAbiSQW1JaI5L53uL67Daa0tXqYcP6bpWGs';
      const res = await fetchSmartMergedStudentsFromGoogleSheet(sheetId);
      if (res.success && res.students.length > 0) {
        handleImportStudents(res.students);
        showToast(res.message || `Berjaya menyelaraskan ${res.students.length} murid dengan Google Sheets!`, 'success');
      } else {
        showToast(res.message || 'Gagal menyelaraskan data Google Sheet.', 'warning');
      }
    } catch (e: any) {
      showToast(e.message || 'Ralat semasa menyelaraskan Google Sheet.', 'warning');
    } finally {
      setIsSyncingSheets(false);
    }
  };

  // Background Auto-Sync on startup to ensure app always matches Google Sheets
  useEffect(() => {
    let isMounted = true;
    const runAutoSync = async () => {
      try {
        const config = getGoogleSheetsConfig();
        const sheetId = config.spreadsheetId || '1tNACM32JUAbiSQW1JaI5L53uL67Daa0tXqYcP6bpWGs';
        const res = await fetchSmartMergedStudentsFromGoogleSheet(sheetId);
        if (isMounted && res.success && res.students.length > 0) {
          handleImportStudents(res.students);
          console.log(`[GoogleSheetAutoSync] Synchronized ${res.students.length} students on load`);
        }
      } catch (e) {
        console.warn('[GoogleSheetAutoSync] Skipped on load:', e);
      }
    };
    runAutoSync();
    return () => { isMounted = false; };
  }, []);

  const [supabaseErrorState, setSupabaseErrorState] = useState<SupabaseSyncErrorState>({
    hasRlsError: false,
    lastErrorMessage: null,
    lastErrorCode: null,
    lastFailedTable: null,
    timestamp: 0,
  });

  // Subscribe to Supabase RLS error states
  useEffect(() => {
    const unsub = subscribeToSupabaseSyncError((state) => {
      setSupabaseErrorState(state);
    });
    return () => unsub();
  }, []);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warning' | 'info' | 'error' } | null>(null);

  // Active Session state
  const [currentSessionPeriod, setCurrentSessionPeriod] = useState<SessionPeriod>('ROLLCALL');
  const todayDateStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const sessionInfo = useMemo(() => {
    return {
      key: `${todayDateStr}_ROLLCALL`,
      period: 'ROLLCALL' as SessionPeriod,
      dateStr: todayDateStr,
      label: 'Roll-Call Asrama',
      timeTarget: 'Malam'
    };
  }, [todayDateStr]);

  // Sync state to storage
  useEffect(() => {
    saveHostelState(hostelState);
  }, [hostelState]);

  // Sync sound settings
  useEffect(() => {
    sounds.enabled = soundEnabled;
    localStorage.setItem('asrama_sound_enabled', soundEnabled ? 'true' : 'false');
  }, [soundEnabled]);

  // Function to pull latest state from Supabase and synchronize state
  const handleRefreshSupabase = useCallback(async (quiet = true) => {
    if (!isSupabaseConfigured()) {
      if (!quiet) {
        setIsSupabaseModalOpen(true);
        showToast('Pangkalan Data Awan belum dikonfigurasi. Sila ikuti panduan.', 'warning');
      }
      return;
    }
    try {
      if (!quiet) setIsSyncingCloud(true);
      const data = await fetchInitialStateFromSupabase();
      if (data) {
        setHostelState(prev => {
          const newStatuses = { ...prev.statuses };
          data.statuses.forEach((s: any) => {
            const cleanKp = (s.kp || '').replace(/[\s-]/g, '');
            const localStatus = prev.statuses[s.kp] || (cleanKp ? prev.statuses[cleanKp] : undefined);

            // CRITICAL: Prevent state reversion!
            // If local state was updated more recently (its timestamp is newer than Supabase snapshot),
            // retain the local state and do NOT overwrite it with stale cloud data.
            if (localStatus && localStatus.since && s.since && localStatus.since > Number(s.since)) {
              return;
            }

            const statusObj: StudentStatus = {
              status: s.status,
              since: Number(s.since) || Date.now(),
              dest: s.destination,
              expectedReturn: typeof s.expected_return === 'number'
                ? new Date(s.expected_return).toISOString().slice(0, 16).replace('T', ' ')
                : s.expected_return
            };
            newStatuses[s.kp] = statusObj;
            newStatuses[cleanKp] = statusObj;

            const match = students.find(st => st.kp.replace(/[\s-]/g, '') === cleanKp);
            if (match && match.kp !== s.kp) {
              newStatuses[match.kp] = statusObj;
            }
          });

          // Map logs and merge (prevent duplicates)
          const newLogsMap = new Map<string, HostelLog>();
          data.logs.forEach((l: any) => {
            newLogsMap.set(l.id, {
              id: l.id,
              ts: l.ts,
              kp: l.kp,
              nama: l.nama,
              kelas: '',
              bidang: '',
              action: l.action,
              detail: l.detail,
              officer: l.officer
            });
          });

          prev.logs.forEach(l => {
            if (!newLogsMap.has(l.id)) {
              newLogsMap.set(l.id, l);
            }
          });

          const mergedLogs = Array.from(newLogsMap.values()).sort((a, b) => b.ts - a.ts).slice(0, 1500);

          // Parse special logs for parent requests, attendance, new students
          const parsed = parseSpecialCloudLogs(data.logs);
          if (parsed.requests.length > 0) {
            mergeIncomingParentRequests(parsed.requests);
          }

          // Merge attendance
          const mergedAttendance = { ...prev.attendance };
          Object.entries(parsed.attendance).forEach(([sKey, records]) => {
            mergedAttendance[sKey] = {
              ...(mergedAttendance[sKey] || {}),
              ...records
            };
          });

          // Merge newly registered students if any
          if (parsed.newStudents.length > 0) {
            setStudents(currentStudents => {
              const currentKps = new Set(currentStudents.map(cs => cs.kp.replace(/[\s-]/g, '')));
              const toAdd = parsed.newStudents.filter(ns => !currentKps.has(ns.kp.replace(/[\s-]/g, '')));
              if (toAdd.length > 0) {
                const updatedList = [...toAdd, ...currentStudents];
                try {
                  localStorage.setItem('asrama_students_list_v3', JSON.stringify(updatedList));
                } catch {}
                return updatedList;
              }
              return currentStudents;
            });
          }

          return {
            ...prev,
            statuses: newStatuses,
            logs: mergedLogs,
            attendance: mergedAttendance
          };
        });

        // Flush offline queue if any
        retryPendingSync().catch(() => {});

        if (!quiet) {
          showToast(`Penyegerakan awan berjaya! Status terkini dimuat turun.`, 'success');
        }
      }
    } catch (err) {
      console.warn('Error refreshing Supabase:', err);
      if (!quiet) {
        showToast('Gagal menyegerakkan dengan pangkalan data awan.', 'error');
      }
    } finally {
      if (!quiet) setIsSyncingCloud(false);
    }
  }, [students]);

  // Supabase Realtime Subscription, Polling Fallback, and Visibility Sync
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    // 1. Initial fetch
    handleRefreshSupabase(true);

    // 2. Setup Realtime subscription
    const channelName = `ssemj_realtime_main_${Math.random().toString(36).substring(7)}`;
    const channel = supabase.channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'student_status' }, (payload) => {
        const newRow = payload.new as any;
        if (newRow && newRow.kp) {
          setHostelState(prev => {
            const cleanKp = (newRow.kp || '').replace(/[\s-]/g, '');
            const localStatus = prev.statuses[newRow.kp] || (cleanKp ? prev.statuses[cleanKp] : undefined);

            // If local status is newer than the incoming event, keep local state
            if (localStatus && localStatus.since && newRow.since && localStatus.since > Number(newRow.since)) {
              return prev;
            }

            const statusObj: StudentStatus = {
              status: newRow.status,
              since: Number(newRow.since) || Date.now(),
              dest: newRow.destination,
              expectedReturn: typeof newRow.expected_return === 'number'
                ? new Date(newRow.expected_return).toISOString().slice(0, 16).replace('T', ' ')
                : newRow.expected_return
            };
            const nextStatuses = {
              ...prev.statuses,
              [newRow.kp]: statusObj,
              [cleanKp]: statusObj
            };
            const match = students.find(st => st.kp.replace(/[\s-]/g, '') === cleanKp);
            if (match && match.kp !== newRow.kp) {
              nextStatuses[match.kp] = statusObj;
            }
            return {
              ...prev,
              statuses: nextStatuses
            };
          });
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'hostel_logs' }, (payload) => {
        const newLog = payload.new as any;
        if (newLog && newLog.id) {
          const logItem: HostelLog = {
            id: newLog.id,
            ts: newLog.ts,
            kp: newLog.kp,
            nama: newLog.nama,
            kelas: '',
            bidang: '',
            action: newLog.action,
            detail: newLog.detail,
            officer: newLog.officer
          };

          setHostelState(prev => {
            if (prev.logs.some(l => l.id === newLog.id)) return prev;
            return {
              ...prev,
              logs: [logItem, ...prev.logs].slice(0, 1500)
            };
          });

          // Handle special real-time logs
          if (newLog.action === 'PERMOHONAN_WARIS' || newLog.action === 'LULUS_WARIS' || newLog.action === 'TOLAK_WARIS') {
            try {
              const req = JSON.parse(newLog.detail);
              if (req && req.id) mergeIncomingParentRequests([req]);
            } catch {}
          } else if (newLog.action === 'Kehadiran') {
            try {
              const att = JSON.parse(newLog.detail);
              if (att && att.sessionKey) {
                setHostelState(prev => {
                  const cleanKp = (newLog.kp || '').replace(/[\s-]/g, '');
                  const currentSess = prev.attendance[att.sessionKey] || {};
                  return {
                    ...prev,
                    attendance: {
                      ...prev.attendance,
                      [att.sessionKey]: {
                        ...currentSess,
                        [cleanKp]: att.time || newLog.ts,
                        [newLog.kp]: att.time || newLog.ts
                      }
                    }
                  };
                });
              }
            } catch {}
          } else if (newLog.action === 'DAFTAR_MURID') {
            try {
              const st = JSON.parse(newLog.detail);
              if (st && st.kp) {
                setStudents(prev => {
                  if (prev.some(s => s.kp.replace(/[\s-]/g, '') === st.kp.replace(/[\s-]/g, ''))) return prev;
                  const updated = [st, ...prev];
                  try { localStorage.setItem('asrama_students_list_v3', JSON.stringify(updated)); } catch {}
                  return updated;
                });
              }
            } catch {}
          }
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsRealtimeConnected(true);
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setIsRealtimeConnected(false);
        }
      });

    // 3. Fallback background auto-polling every 8 seconds
    const interval = setInterval(() => {
      handleRefreshSupabase(true);
    }, 8000);

    // 4. Tab focus & visibility change listener
    const onFocus = () => handleRefreshSupabase(true);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleRefreshSupabase(true);
      }
    };
    window.addEventListener('focus', onFocus);
    window.addEventListener('online', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('online', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [handleRefreshSupabase, students, supabaseVersion]);

  // Sync custom added students
  const handleAddNewStudent = (newStudent: Student) => {
    const updated = [newStudent, ...students];
    setStudents(updated);
    try {
      localStorage.setItem('asrama_students_list_v3', JSON.stringify(updated));
    } catch {
      // ignore
    }
    const cleanKp = newStudent.kp.replace(/[\s-]/g, '');
    const newStatus: StudentStatus = { status: 'DALAM', since: Date.now() };
    // Give default status
    setHostelState(prev => ({
      ...prev,
      statuses: {
        ...prev.statuses,
        [newStudent.kp]: newStatus,
        [cleanKp]: newStatus
      }
    }));
    syncNewStudentToCloud(newStudent).catch(() => {});
    syncStudentStatus(newStudent.kp, 'DALAM', undefined).catch(() => {});
    showToast(`Murid baru ${newStudent.nama} berjaya didaftarkan.`, 'success');
  };

  const handleDeleteStudent = (kp: string) => {
    const updated = students.filter(s => s.kp !== kp);
    setStudents(updated);
    try {
      localStorage.setItem('asrama_students_list_v3', JSON.stringify(updated));
    } catch {
      // ignore
    }
    showToast(`Data murid berjaya dipadam. (${updated.length} data tersisa)`, 'success');
  };

  const handleEditStudent = (updatedStudent: Student) => {
    const updated = students.map(s => s.kp === updatedStudent.kp ? updatedStudent : s);
    setStudents(updated);
    try {
      localStorage.setItem('asrama_students_list_v3', JSON.stringify(updated));
    } catch {
      // ignore
    }
    if (selectedStudentForModal && selectedStudentForModal.kp === updatedStudent.kp) {
      setSelectedStudentForModal(updatedStudent);
    }
    showToast(`Maklumat ${updatedStudent.nama} berjaya dikemaskini.`, 'success');
  };

  const showToast = (message: string, type: 'success' | 'warning' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
    }, 3200);
  };

  // Helper log addition
  const recordLog = (
    s: Student,
    action: HostelLog['action'],
    detail: string,
    officer?: string
  ) => {
    const activeOfficer = officer || (userRole === 'guard' ? 'Pengawal Keselamatan Pintu Pagar' : `${currentWarden.nama} (${currentWarden.jawatan})`);
    const newLog: HostelLog = {
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      ts: Date.now(),
      kp: s.kp,
      nama: s.nama,
      kelas: s.kelas,
      bidang: s.bidang,
      action,
      detail,
      officer: activeOfficer
    };
    return newLog;
  };

  // MOVEMENT ACTIONS
  const handleMarkMasuk = (s: Student) => {
    sounds.playActionChime('in');
    const cleanKp = s.kp.replace(/[\s-]/g, '');
    const newStatus: StudentStatus = { status: 'DALAM', since: Date.now() };
    const log = recordLog(s, 'Masuk Asrama', 'Kembali melapor diri ke asrama');
    setHostelState(prev => {
      return {
        ...prev,
        statuses: {
          ...prev.statuses,
          [s.kp]: newStatus,
          [cleanKp]: newStatus
        },
        logs: [log, ...prev.logs].slice(0, 1500)
      };
    });
    syncLogMovementToSheets(log, s, newStatus);
    syncStudentStatus(s.kp, 'DALAM', undefined);
    syncHostelLog(log);
    showToast(`${s.nama.split(' ')[0]} disahkan masuk asrama.`, 'success');
  };

  const handleMarkKeluar = (s: Student) => {
    sounds.playActionChime('out');
    const cleanKp = s.kp.replace(/[\s-]/g, '');
    const newStatus: StudentStatus = { status: 'KELUAR', since: Date.now(), dest: 'Luar Kawasan Asrama' };
    const log = recordLog(s, 'Keluar Asrama', 'Keluar dari kawasan asrama');
    setHostelState(prev => {
      return {
        ...prev,
        statuses: {
          ...prev.statuses,
          [s.kp]: newStatus,
          [cleanKp]: newStatus
        },
        logs: [log, ...prev.logs].slice(0, 1500)
      };
    });
    syncLogMovementToSheets(log, s, newStatus);
    syncStudentStatus(s.kp, 'KELUAR', newStatus.dest);
    syncHostelLog(log);
    showToast(`${s.nama.split(' ')[0]} disahkan keluar asrama.`, 'info');
  };

  const handleMarkKeluarLain = (s: Student) => {
    const reason = window.prompt('Masukkan sebab keluar (Cth: Klinik, Kursus, Bengkel, dan lain-lain):');
    if (!reason) return;
    
    sounds.playActionChime('out');
    const cleanKp = s.kp.replace(/[\s-]/g, '');
    const newStatus: StudentStatus = { status: 'KELUAR', since: Date.now(), dest: reason };
    const log = recordLog(s, 'Keluar Asrama', reason);
    
    setHostelState(prev => {
      return {
        ...prev,
        statuses: {
          ...prev.statuses,
          [s.kp]: newStatus,
          [cleanKp]: newStatus
        },
        logs: [log, ...prev.logs].slice(0, 1500)
      };
    });
    
    syncLogMovementToSheets(log, s, newStatus);
    syncStudentStatus(s.kp, 'KELUAR', newStatus.dest);
    syncHostelLog(log);
    
    showToast(`${s.nama.split(' ')[0]} keluar atas urusan: ${reason}`, 'info');
  };

  const handleStartOuting = (s: Student, dest: string, expectedReturn: string, transport?: string) => {
    sounds.playActionChime('out');
    const cleanKp = s.kp.replace(/[\s-]/g, '');
    const passId = `OUT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newStatus: StudentStatus = {
      status: 'OUTING',
      since: Date.now(),
      dest,
      expectedReturn,
      transport,
      passId
    };
    const log = recordLog(s, 'Mula Outing', `Destinasi: ${dest} (Dijangka pulang ${expectedReturn})`);
    setHostelState(prev => {
      return {
        ...prev,
        statuses: {
          ...prev.statuses,
          [s.kp]: newStatus,
          [cleanKp]: newStatus
        },
        logs: [log, ...prev.logs].slice(0, 1500)
      };
    });
    syncLogMovementToSheets(log, s, newStatus);
    syncStudentStatus(s.kp, 'OUTING', dest, expectedReturn);
    syncHostelLog(log);
    showToast(`Outing dimulakan: ${s.nama.split(' ')[0]} (Pas: ${passId})`, 'warning');
  };

  const handleEndOuting = (s: Student) => {
    sounds.playActionChime('in');
    const cleanKp = s.kp.replace(/[\s-]/g, '');
    const newStatus: StudentStatus = { status: 'DALAM', since: Date.now() };
    const log = recordLog(s, 'Tamat Outing', 'Pulang dari outing harian dengan selamat');
    setHostelState(prev => {
      return {
        ...prev,
        statuses: {
          ...prev.statuses,
          [s.kp]: newStatus,
          [cleanKp]: newStatus
        },
        logs: [log, ...prev.logs].slice(0, 1500)
      };
    });
    syncLogMovementToSheets(log, s, newStatus);
    syncStudentStatus(s.kp, 'DALAM', undefined);
    syncHostelLog(log);
    showToast(`Tamat outing: ${s.nama.split(' ')[0]} kembali ke asrama.`, 'success');
  };

  const handleEndKeluar = (s: Student) => {
    sounds.playActionChime('in');
    const cleanKp = s.kp.replace(/[\s-]/g, '');
    const newStatus: StudentStatus = { status: 'DALAM', since: Date.now() };
    const log = recordLog(s, 'Masuk Asrama', 'Kembali ke asrama selepas aktiviti luar / lawatan');
    setHostelState(prev => {
      const nextState = {
        ...prev,
        statuses: {
          ...prev.statuses,
          [s.kp]: newStatus,
          [cleanKp]: newStatus
        },
        logs: [log, ...prev.logs].slice(0, 1500)
      };
      saveHostelState(nextState);
      return nextState;
    });
    syncLogMovementToSheets(log, s, newStatus);
    syncStudentStatus(s.kp, 'DALAM', undefined);
    syncHostelLog(log);
    showToast(`${s.nama.split(' ')[0]} disahkan selamat kembali ke asrama.`, 'success');
  };

  const handleStartBermalam = (
    s: Student,
    dest: string,
    returnDate: string,
    guardian: string,
    phone: string,
    carPlate: string
  ) => {
    sounds.playActionChime('out');
    const cleanKp = s.kp.replace(/[\s-]/g, '');
    const passId = `BML-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newStatus: StudentStatus = {
      status: 'BERMALAM',
      since: Date.now(),
      dest,
      expectedReturn: returnDate,
      guardianName: guardian,
      guardianPhone: phone,
      passId
    };
    const log = recordLog(
      s,
      'Pulang Bermalam',
      `Diambil oleh ${guardian} (${phone}, Plat: ${carPlate || '—'}). Jangka kembali: ${returnDate}`
    );
    setHostelState(prev => {
      return {
        ...prev,
        statuses: {
          ...prev.statuses,
          [s.kp]: newStatus,
          [cleanKp]: newStatus
        },
        logs: [log, ...prev.logs].slice(0, 1500)
      };
    });
    syncLogMovementToSheets(log, s, newStatus);
    syncStudentStatus(s.kp, 'BERMALAM', dest, returnDate);
    syncHostelLog(log);
    showToast(`Pelepasan bermalam: ${s.nama.split(' ')[0]} (Pas: ${passId})`, 'info');
  };

  const handleEndBermalam = (s: Student) => {
    sounds.playActionChime('in');
    const cleanKp = s.kp.replace(/[\s-]/g, '');
    const newStatus: StudentStatus = { status: 'DALAM', since: Date.now() };
    const log = recordLog(s, 'Kembali Bermalam', 'Melapor diri kembali selepas cuti bermalam');
    setHostelState(prev => {
      return {
        ...prev,
        statuses: {
          ...prev.statuses,
          [s.kp]: newStatus,
          [cleanKp]: newStatus
        },
        logs: [log, ...prev.logs].slice(0, 1500)
      };
    });
    syncLogMovementToSheets(log, s, newStatus);
    syncStudentStatus(s.kp, 'DALAM', undefined);
    syncHostelLog(log);
    showToast(`${s.nama.split(' ')[0]} kembali ke asrama daripada bermalam.`, 'success');
  };

  const handleApproveAndCheckOut = (s: Student, req: ParentRequest) => {
    const cleanKp = s.kp.replace(/[\s-]/g, '');
    const expectedReturn = `${req.tarikhKembali} ${req.masaKembali}`;
    if (req.type === 'OUTING') {
      sounds.playActionChime('out');
      const passId = req.passId || `OUT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const newStatus: StudentStatus = {
        status: 'OUTING',
        since: Date.now(),
        dest: req.sebab,
        expectedReturn,
        guardianName: req.namaPenjaga,
        guardianPhone: req.telPenjaga,
        transport: req.noKenderaan,
        passId
      };
      const log = recordLog(s, 'Mula Outing', `Permohonan Waris (${req.namaPenjaga}) - ${req.sebab}`);
      setHostelState(prev => ({
        ...prev,
        statuses: { ...prev.statuses, [s.kp]: newStatus, [cleanKp]: newStatus },
        logs: [log, ...prev.logs].slice(0, 1500)
      }));
      syncLogMovementToSheets(log, s, newStatus);
      syncStudentStatus(s.kp, 'OUTING', req.sebab, expectedReturn);
      syncHostelLog(log);
      showToast(`Outing diaktifkan: ${s.nama.split(' ')[0]} (Pas: ${passId})`, 'info');
    } else {
      sounds.playActionChime('out');
      const passId = req.passId || `BML-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const newStatus: StudentStatus = {
        status: 'BERMALAM',
        since: Date.now(),
        dest: req.sebab,
        expectedReturn,
        guardianName: req.namaPenjaga,
        guardianPhone: req.telPenjaga,
        transport: req.noKenderaan,
        alasan: req.sebab,
        passId
      };
      const log = recordLog(s, 'Pulang Bermalam', `Permohonan Waris (${req.namaPenjaga}) - Kenderaan: ${req.noKenderaan}`);
      setHostelState(prev => ({
        ...prev,
        statuses: { ...prev.statuses, [s.kp]: newStatus, [cleanKp]: newStatus },
        logs: [log, ...prev.logs].slice(0, 1500)
      }));
      syncLogMovementToSheets(log, s, newStatus);
      syncStudentStatus(s.kp, 'BERMALAM', req.sebab, expectedReturn);
      syncHostelLog(log);
      showToast(`Pulang Bermalam diaktifkan: ${s.nama.split(' ')[0]} (Pas: ${passId})`, 'info');
    }
  };

  const handleSetKuarantin = (s: Student, reason: string) => {
    sounds.playActionChime('out');
    const cleanKp = s.kp.replace(/[\s-]/g, '');
    const passId = `MED-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newStatus: StudentStatus = {
      status: 'KUARANTIN',
      since: Date.now(),
      alasan: reason,
      passId
    };
    const log = recordLog(s, 'Rawatan / Kuarantin', `Rehat di Bilik Sakit: ${reason}`);
    setHostelState(prev => {
      return {
        ...prev,
        statuses: {
          ...prev.statuses,
          [s.kp]: newStatus,
          [cleanKp]: newStatus
        },
        logs: [log, ...prev.logs].slice(0, 1500)
      };
    });
    syncLogMovementToSheets(log, s, newStatus);
    syncStudentStatus(s.kp, 'KUARANTIN', 'Bilik Sakit');
    syncHostelLog(log);
    showToast(`${s.nama.split(' ')[0]} ditempatkan di bilik sakit / kuarantin.`, 'warning');
  };

  // EDIT & CORRECTION HANDLERS FOR STUDENT RECORD & LOGS
  const handleUpdateStudentMovement = (
    s: Student,
    newStatusData: {
      status: StatusType;
      dest: string;
      expectedReturn: string;
      transport: string;
      guardianName: string;
      guardianPhone: string;
    },
    correctionNote: string
  ) => {
    const cleanKp = s.kp.replace(/[\s-]/g, '');
    const currentStatus = hostelState.statuses[s.kp] || { status: 'DALAM', since: Date.now() };
    const updatedStatus: StudentStatus = {
      ...currentStatus,
      status: newStatusData.status,
      dest: newStatusData.dest || undefined,
      expectedReturn: newStatusData.expectedReturn || undefined,
      transport: newStatusData.transport || undefined,
      guardianName: newStatusData.guardianName || undefined,
      guardianPhone: newStatusData.guardianPhone || undefined,
    };

    const actionText = newStatusData.status === 'DALAM' 
      ? 'Masuk Asrama' 
      : newStatusData.status === 'BERMALAM' 
      ? 'Pulang Bermalam' 
      : newStatusData.status === 'OUTING' 
      ? 'Mula Outing' 
      : 'Keluar Asrama';

    const logDetail = `[Kemaskini/Pembetulan Rekod] Status: ${newStatusData.status}${newStatusData.dest ? `, Destinasi: ${newStatusData.dest}` : ''}${newStatusData.expectedReturn ? `, Dijangka: ${newStatusData.expectedReturn}` : ''}. Catatan: ${correctionNote}`;
    const log = recordLog(s, actionText, logDetail);

    setHostelState(prev => {
      const nextState = {
        ...prev,
        statuses: {
          ...prev.statuses,
          [s.kp]: updatedStatus,
          [cleanKp]: updatedStatus
        },
        logs: [log, ...prev.logs].slice(0, 1500)
      };
      saveHostelState(nextState);
      return nextState;
    });

    syncLogMovementToSheets(log, s, updatedStatus);
    syncStudentStatus(s.kp, newStatusData.status, newStatusData.dest, newStatusData.expectedReturn);
    syncHostelLog(log);
    showToast(`Rekod pergerakan ${s.nama.split(' ')[0]} telah berjaya dikemaskini.`, 'success');
  };

  const handleCancelMovement = (s: Student, reason: string) => {
    sounds.playActionChime('in');
    const cleanKp = s.kp.replace(/[\s-]/g, '');
    const newStatus: StudentStatus = { status: 'DALAM', since: Date.now() };
    const log = recordLog(s, 'Masuk Asrama', `[Batal Rekod Keluar] Murid sebenarnya tidak keluar / tersilap rekod. Sebab: ${reason}`);

    setHostelState(prev => {
      const nextState = {
        ...prev,
        statuses: {
          ...prev.statuses,
          [s.kp]: newStatus,
          [cleanKp]: newStatus
        },
        logs: [log, ...prev.logs].slice(0, 1500)
      };
      saveHostelState(nextState);
      return nextState;
    });

    syncLogMovementToSheets(log, s, newStatus);
    syncStudentStatus(s.kp, 'DALAM', undefined);
    syncHostelLog(log);
    showToast(`Pelepasan dibatalkan: ${s.nama.split(' ')[0]} dikembalikan ke status Dalam Asrama.`, 'success');
  };

  const handleUpdateLog = (updatedLog: HostelLog) => {
    setHostelState(prev => {
      const nextLogs = prev.logs.map(l => l.id === updatedLog.id ? updatedLog : l);
      const nextState = {
        ...prev,
        logs: nextLogs
      };
      saveHostelState(nextState);
      return nextState;
    });
    syncHostelLog(updatedLog);
    showToast('Rekod log berjaya dikemaskini.', 'success');
  };

  const handleDeleteLog = (logId: string) => {
    setHostelState(prev => {
      const nextLogs = prev.logs.filter(l => l.id !== logId);
      const nextState = {
        ...prev,
        logs: nextLogs
      };
      saveHostelState(nextState);
      return nextState;
    });
    showToast('Rekod log telah dipadam.', 'info');
  };

  // ATTENDANCE ROLL-CALL ACTIONS
  const handleMarkHadir = (s: Student) => {
    const key = sessionInfo.key;
    if (hostelState.attendance[key]?.[s.kp]) {
      sounds.playActionChime('error');
      showToast(`${s.nama.split(' ')[0]} sudah ditandakan hadir sesi ini.`, 'info');
      return;
    }

    const now = Date.now();
    const cleanKp = s.kp.replace(/[\s-]/g, '');
    sounds.playSuccessBeep();
    const log = recordLog(s, 'Kehadiran', `Sesi ${sessionInfo.label} (${sessionInfo.timeTarget})`);
    setHostelState(prev => {
      const currentSessionMap = prev.attendance[key] || {};
      return {
        ...prev,
        attendance: {
          ...prev.attendance,
          [key]: {
            ...currentSessionMap,
            [s.kp]: now,
            [cleanKp]: now
          }
        },
        logs: [log, ...prev.logs].slice(0, 1500)
      };
    });
    syncAttendanceToSheets(sessionInfo.label, s, now);
    syncHostelLog(log);
    syncAttendanceRecordToCloud(key, sessionInfo.label, s, now, currentWarden?.nama || 'Warden Bertugas');
    showToast(`Hadir direkod: ${s.nama.split(' ')[0]} (Roll-Call)`, 'success');
  };

  const handleBulkMarkHadir = (studentsToMark: Student[]) => {
    const key = sessionInfo.key;
    sounds.playActionChime('in');
    const now = Date.now();
    const wardenName = currentWarden?.nama || 'Warden Bertugas';
    const newLogs: HostelLog[] = [];

    setHostelState(prev => {
      const currentSessionMap = { ...(prev.attendance[key] || {}) };

      studentsToMark.forEach(s => {
        if (!currentSessionMap[s.kp]) {
          const cleanKp = s.kp.replace(/[\s-]/g, '');
          currentSessionMap[s.kp] = now;
          currentSessionMap[cleanKp] = now;
          const log = recordLog(s, 'Kehadiran', 'Sahkan hadir berkelompok Roll-Call Asrama');
          newLogs.push(log);
        }
      });

      return {
        ...prev,
        attendance: {
          ...prev.attendance,
          [key]: currentSessionMap
        },
        logs: [...newLogs, ...prev.logs].slice(0, 1500)
      };
    });

    newLogs.forEach(l => {
      syncHostelLog(l);
      const studentObj = students.find(st => st.kp === l.kp);
      if (studentObj) {
        syncAttendanceRecordToCloud(key, sessionInfo.label, studentObj, now, wardenName);
      }
    });

    showToast(`Pukal: ${studentsToMark.length} murid ditandakan hadir Roll-Call.`, 'success');
  };

  const handleConfirmBulkOuting = (
    selectedKps: string[],
    params: {
      type: 'BERMALAM' | 'OUTING' | 'KELUAR';
      tarikhKeluar: string;
      masaKeluar: string;
      tarikhBalik: string;
      masaBalik: string;
      tujuan: string;
      catatan: string;
      wardenNama: string;
    }
  ) => {
    if (!selectedKps || selectedKps.length === 0) return;

    sounds.playActionChime('out');
    const now = Date.now();
    const expectedReturn = `${params.tarikhBalik} ${params.masaBalik}`;
    const newLogs: HostelLog[] = [];
    const updatedStatuses: Record<string, StudentStatus> = {};
    const studentsToSync: { student: Student; status: StudentStatus; log: HostelLog }[] = [];

    selectedKps.forEach(kp => {
      const cleanTargetKp = (kp || '').replace(/[\s-]/g, '');
      const student = students.find(s => {
        const sClean = (s.kp || '').replace(/[\s-]/g, '');
        return s.kp === kp || (sClean && sClean === cleanTargetKp);
      });
      if (!student) return;

      const cleanKp = (student.kp || '').replace(/[\s-]/g, '');
      const passPrefix = params.type === 'BERMALAM' ? 'BML' : params.type === 'OUTING' ? 'OUT' : 'KLR';
      const passId = `${passPrefix}-PUKAL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const st: StudentStatus = {
        status: params.type,
        since: now,
        dest: params.tujuan,
        expectedReturn,
        transport: params.catatan,
        passId
      };
      
      updatedStatuses[student.kp] = st;
      if (cleanKp) {
        updatedStatuses[cleanKp] = st;
      }

      const actionTitle = 
        params.type === 'BERMALAM' 
          ? 'Pulang Bermalam' 
          : params.type === 'OUTING' 
          ? 'Mula Outing' 
          : 'Keluar Asrama';

      const detailMsg = `Pelepasan Pukal (${params.type}): ${params.tujuan}. Jangka balik: ${expectedReturn}${params.catatan ? ` (${params.catatan})` : ''}`;

      const log = recordLog(
        student,
        actionTitle,
        detailMsg,
        params.wardenNama
      );
      newLogs.push(log);
      studentsToSync.push({ student, status: st, log });
    });

    if (studentsToSync.length === 0) {
      showToast('Tiada murid yang sepadan dijumpai untuk pelepasan pukal.', 'warning');
      return;
    }

    setHostelState(prev => {
      const nextState = {
        ...prev,
        statuses: {
          ...prev.statuses,
          ...updatedStatuses
        },
        logs: [...newLogs, ...prev.logs].slice(0, 1500)
      };
      // Direct immediate persistence to localStorage!
      saveHostelState(nextState);
      return nextState;
    });

    // Cloud (Supabase) & Google Sheets batch synchronization
    const bulkStatusPayload = studentsToSync.map(({ student, status }) => ({
      kp: student.kp,
      status: status.status,
      since: status.since,
      destination: status.dest,
      expectedReturn: status.expectedReturn,
    }));

    // 1. Batch status sync to Supabase with fallback
    syncBulkStudentStatuses(bulkStatusPayload).then(res => {
      if (!res.success && res.error) {
        showToast(`Perhatian: Status disimpan secara setempat (offline). Ralat awan: ${res.error}`, 'warning');
      }
    });

    // 2. Batch logs sync to Supabase
    syncBulkHostelLogs(newLogs);

    // 3. Google Sheets sync
    studentsToSync.forEach(({ student, status, log }) => {
      syncLogMovementToSheets(log, student, status);
    });

    const actionText = params.type === 'BERMALAM' 
      ? 'pulang bermalam' 
      : params.type === 'OUTING' 
      ? 'mula outing' 
      : 'keluar (lawatan / aktiviti luar)';
    showToast(`Pukal Berjaya: ${studentsToSync.length} murid direkodkan ${actionText}.`, 'success');
  };

  const handleBulkReturnOuting = () => {
    setIsBulkReturnModalOpen(true);
  };

  const handleConfirmBulkReturn = (selectedKps: string[], note: string) => {
    if (!selectedKps || selectedKps.length === 0) return;

    sounds.playActionChime('in');
    const now = Date.now();
    const newLogs: HostelLog[] = [];
    const updatedStatuses: Record<string, StudentStatus> = {};
    const studentsToSync: { student: Student; status: StudentStatus; log: HostelLog }[] = [];

    selectedKps.forEach(kp => {
      const cleanTargetKp = (kp || '').replace(/[\s-]/g, '');
      const student = students.find(s => {
        const sClean = (s.kp || '').replace(/[\s-]/g, '');
        return s.kp === kp || (sClean && sClean === cleanTargetKp);
      });
      if (!student) return;

      const cleanKp = (student.kp || '').replace(/[\s-]/g, '');
      const currentStatus = hostelState.statuses[student.kp]?.status || 'KELUAR';
      const st: StudentStatus = {
        status: 'DALAM',
        since: now
      };
      updatedStatuses[student.kp] = st;
      if (cleanKp) {
        updatedStatuses[cleanKp] = st;
      }

      const actionTitle = currentStatus === 'OUTING' ? 'Tamat Outing' : 'Masuk Asrama';
      const log = recordLog(
        student,
        actionTitle,
        note || `Pulang Pukal - Disahkan oleh ${currentWarden?.nama || 'Warden Bertugas'}`
      );
      newLogs.push(log);
      studentsToSync.push({ student, status: st, log });
    });

    if (studentsToSync.length === 0) return;

    setHostelState(prev => {
      const nextState = {
        ...prev,
        statuses: {
          ...prev.statuses,
          ...updatedStatuses
        },
        logs: [...newLogs, ...prev.logs].slice(0, 1500)
      };
      saveHostelState(nextState);
      return nextState;
    });

    // Cloud (Supabase) & Google Sheets batch synchronization
    const bulkStatusPayload = studentsToSync.map(({ student, status }) => ({
      kp: student.kp,
      status: 'DALAM',
      since: status.since,
      destination: undefined,
      expectedReturn: undefined,
    }));

    // 1. Batch status sync to Supabase
    syncBulkStudentStatuses(bulkStatusPayload).then(res => {
      if (!res.success && res.error) {
        showToast(`Perhatian: Status disimpan secara setempat (offline). Ralat awan: ${res.error}`, 'warning');
      }
    });

    // 2. Batch logs sync to Supabase
    syncBulkHostelLogs(newLogs);

    // 3. Google Sheets sync
    studentsToSync.forEach(({ student, status, log }) => {
      syncLogMovementToSheets(log, student, status);
    });

    showToast(`Pukal: ${studentsToSync.length} murid disahkan selamat kembali ke asrama.`, 'success');
  };

  // Header stats computation
  const stats = useMemo(() => {
    const total = students.length;
    const getStudentStatus = (s: Student): string => {
      return hostelState.statuses[s.kp]?.status || 
             (s.kp ? hostelState.statuses[s.kp.replace(/[\s-]/g, '')]?.status : undefined) || 
             'DALAM';
    };

    const dalam = students.filter(s => getStudentStatus(s) === 'DALAM').length;
    const keluar = students.filter(s => getStudentStatus(s) === 'KELUAR').length;
    const outing = students.filter(s => getStudentStatus(s) === 'OUTING').length;
    const bermalam = students.filter(s => getStudentStatus(s) === 'BERMALAM').length;
    const kuarantin = students.filter(s => getStudentStatus(s) === 'KUARANTIN').length;
    const hadirKelas = Math.max(0, total - bermalam - outing - kuarantin);

    return {
      total,
      dalam,
      keluar,
      outing,
      bermalam,
      kuarantin,
      hadirKelas,
      overdue: students.filter(s => {
        const st = hostelState.statuses[s.kp] || (s.kp ? hostelState.statuses[s.kp.replace(/[\s-]/g, '')] : undefined);
        return st?.status === 'OUTING' && isOutingOverdue(st?.expectedReturn);
      }).length
    };
  }, [students, hostelState.statuses]);

  // Ensure every student has a valid status entry in hostelState.statuses
  useEffect(() => {
    if (!students || students.length === 0) return;
    setHostelState(prev => {
      let missingCount = 0;
      const updatedStatuses = { ...prev.statuses };
      students.forEach(s => {
        const cleanKp = s.kp.replace(/[\s-]/g, '');
        if (!updatedStatuses[s.kp] && !updatedStatuses[cleanKp]) {
          updatedStatuses[s.kp] = { status: 'DALAM', since: Date.now() };
          missingCount++;
        }
      });
      if (missingCount > 0) {
        const nextState = { ...prev, statuses: updatedStatuses };
        saveHostelState(nextState);
        return nextState;
      }
      return prev;
    });
  }, [students]);

  const currentAttendanceMap = hostelState.attendance[sessionInfo.key] || {};

  // Route path normalization
  const pathname = window.location.pathname.toLowerCase().replace(/\/+$/, '');
  const hash = window.location.hash.toLowerCase();
  const searchParams = new URLSearchParams(window.location.search);

  // Dedicated public scanner route. It intentionally bypasses all management UI.
  if (
    pathname === '/scanner' ||
    pathname.endsWith('/scanner') ||
    hash === '#scanner' ||
    hash === '#/scanner' ||
    searchParams.get('page') === 'scanner' ||
    searchParams.get('mode') === 'scanner' ||
    searchParams.has('scanner') ||
    searchParams.has('scan') ||
    searchParams.has('kp') ||
    searchParams.has('nfc') ||
    pathname === '/nfc' ||
    pathname.endsWith('/nfc')
  ) {
    return (
      <ScannerKiosk
        students={students}
        statuses={hostelState.statuses}
        onMarkMasuk={handleMarkMasuk}
        onMarkKeluar={handleMarkKeluar}
      />
    );
  }

  // Dedicated public portal for parents/guardians (/waris, /portal-waris, /ibubapa)
  // Standalone public route completely separated from staff login
  if (
    pathname === '/waris' ||
    pathname.endsWith('/waris') ||
    pathname === '/portal-waris' ||
    pathname.endsWith('/portal-waris') ||
    pathname === '/ibubapa' ||
    pathname.endsWith('/ibubapa') ||
    hash === '#waris' ||
    hash === '#/waris' ||
    hash === '#portal-waris' ||
    hash.includes('waris') ||
    searchParams.get('page') === 'waris' ||
    searchParams.get('p') === 'waris' ||
    searchParams.get('mode') === 'waris' ||
    searchParams.get('portal') === 'waris' ||
    searchParams.has('waris')
  ) {
    return <ParentPortalPage students={students} />;
  }

  if (!userRole) {
    return (
      <LoginScreen 
        onLogin={(role) => {
          setUserRole(role);
          localStorage.setItem('ssemj_user_role', role);
          setActiveTab(role === 'guard' ? 'scan' : 'dashboard');
        }} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col selection:bg-blue-500/20 selection:text-blue-900">
      
      {/* Toast Notification Popup */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200 pointer-events-none">
          <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white border text-slate-800 text-xs font-semibold shadow-xl ring-1 ${
            toast.type === 'error' ? 'border-red-200 ring-red-200/50' :
            toast.type === 'warning' ? 'border-amber-200 ring-amber-200/50' :
            toast.type === 'info' ? 'border-sky-200 ring-sky-200/50' :
            'border-emerald-200 ring-emerald-200/50'
          }`}>
            {toast.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-red-600" />
            ) : toast.type === 'warning' ? (
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            ) : toast.type === 'info' ? (
              <Info className="w-4 h-4 text-sky-600" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-7xl w-full mx-auto p-3 sm:p-5 flex-1 flex flex-col">
        
        {/* App Header */}
        <Header
          stats={stats}
          students={students}
          statuses={hostelState.statuses}
          onSelectStudent={(s) => setSelectedStudentForModal(s)}
          onPrintReport={() => setIsReportModalOpen(true)}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled(v => !v)}
          onOpenGoogleSheets={handleOpenGoogleSheets}
          onQuickSyncGoogleSheets={handleQuickSyncGoogleSheets}
          isSyncingGoogleSheets={isSyncingSheets}
          isGSheetConnected={Boolean(gSheetConfig.webhookUrl)}
          isGSheetAutoSync={Boolean(gSheetConfig.autoSync)}
          onOpenSupabase={() => setIsSupabaseModalOpen(true)}
          onQuickSyncSupabase={() => handleRefreshSupabase(false)}
          isSyncingSupabase={isSyncingCloud}
          isRealtimeConnected={isRealtimeConnected}
          hasSupabaseRlsError={supabaseErrorState.hasRlsError}
          isSupabaseConnected={isSupabaseConfigured()}
          wardens={wardens}
          currentWarden={currentWarden}
          onSelectWarden={(id) => {
            setSelectedWardenId(id);
            try {
              localStorage.setItem('ssem_selected_warden_id', id);
            } catch {}
          }}
          userRole={userRole}
          onOpenParentPortal={() => setIsParentPortalOpen(true)}
          onLogout={() => {
            setUserRole(null);
            localStorage.removeItem('ssemj_user_role');
          }}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onOpenCategory={(cat) => setActiveCategoryModal(cat)}
        />

        {/* Sidebar Menu Drawer */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab as any);
            setIsSidebarOpen(false);
          }}
          stats={stats}
          studentsCount={students.length}
          currentAttendanceCount={Object.keys(currentAttendanceMap).length}
          userRole={userRole}
          wardens={wardens}
          currentWarden={currentWarden}
          onSelectWarden={(id) => {
            setSelectedWardenId(id);
            try {
              localStorage.setItem('ssem_selected_warden_id', id);
            } catch {}
          }}
          onOpenCategory={(cat) => {
            setActiveCategoryModal(cat);
            setIsSidebarOpen(false);
          }}
          onPrintReport={() => {
            setIsSidebarOpen(false);
            setIsReportModalOpen(true);
          }}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled(v => !v)}
          onOpenGoogleSheets={() => {
            setIsSidebarOpen(false);
            handleOpenGoogleSheets();
          }}
          isGSheetConnected={Boolean(gSheetConfig.webhookUrl)}
          onQuickSyncGoogleSheets={handleQuickSyncGoogleSheets}
          isSyncingGoogleSheets={isSyncingSheets}
          onOpenSupabase={() => {
            setIsSidebarOpen(false);
            setIsSupabaseModalOpen(true);
          }}
          isSupabaseConnected={isSupabaseConfigured()}
          isRealtimeConnected={isRealtimeConnected}
          hasSupabaseRlsError={supabaseErrorState.hasRlsError}
          onQuickSyncSupabase={() => handleRefreshSupabase(false)}
          isSyncingSupabase={isSyncingCloud}
          onOpenParentPortal={() => {
            setIsSidebarOpen(false);
            setIsParentPortalOpen(true);
          }}
          onLogout={() => {
            setIsSidebarOpen(false);
            setUserRole(null);
            localStorage.removeItem('ssemj_user_role');
          }}
        />

        {/* PROMINENT SUPABASE CONFIGURATION BANNER IF NOT CONFIGURED */}
        {!isSupabaseConfigured() && (
          <div
            id="banner-supabase-setup"
            onClick={() => setIsSupabaseModalOpen(true)}
            className="mb-4 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border-2 border-amber-400 shadow-xl cursor-pointer hover:border-amber-300 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-white"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex-shrink-0 animate-pulse">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-white">⚡ Pangkalan Data Awan (Supabase) Belum Disambungkan</span>
                  <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-amber-400 text-slate-950 uppercase tracking-wider">
                    Penting
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Data telefon pengawal &amp; warden belum disegerakkan secara masa nyata. Tekan butang di sebelah untuk buka <b>Tab 1: Kunci Sambungan &amp; Kongsi Telefon</b>.
                </p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsSupabaseModalOpen(true);
              }}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-xs font-black shadow-lg transition-all flex items-center justify-center gap-1.5 flex-shrink-0"
            >
              <Key className="w-4 h-4" />
              <span>Buka Tab 1: Kunci Supabase ➔</span>
            </button>
          </div>
        )}

        {/* NAVIGATION TABS BAR */}
        <nav className="flex items-center gap-1.5 overflow-x-auto pb-1 mb-5 scrollbar-none border-b border-slate-200 relative">

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all border ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20'
                : 'text-slate-600 border-transparent hover:text-blue-700 hover:bg-slate-200/70'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Utama</span>
          </button>

          <button
            onClick={() => setActiveTab('outing')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all border ${
              activeTab === 'outing'
                ? 'bg-amber-600 text-white border-amber-600 shadow-sm shadow-amber-500/20'
                : 'text-slate-600 border-transparent hover:text-amber-700 hover:bg-amber-50'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Outing &amp; Bermalam</span>
            <span className={`px-1.5 py-0.2 text-[11px] rounded-full font-mono ${
              activeTab === 'outing' ? 'bg-amber-700 text-white' : 'bg-amber-100 text-amber-800'
            }`}>
              {stats.outing + stats.bermalam}
            </span>
            {stats.overdue > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            )}
          </button>

          {(userRole === 'warden' || userRole === 'admin') && (
            <>
              <button
                id="tab-keluar-pukal"
                onClick={() => setActiveTab('keluar-pukal')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all border ${
                  activeTab === 'keluar-pukal'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20'
                    : 'text-slate-600 border-transparent hover:text-blue-700 hover:bg-slate-200/70'
                }`}
              >
                <LogOut className="w-4 h-4 rotate-180 text-amber-500" />
                <span>Keluar Pukal</span>
              </button>

              <button
                onClick={() => setActiveTab('kehadiran')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all border ${
                  activeTab === 'kehadiran'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20'
                    : 'text-slate-600 border-transparent hover:text-blue-700 hover:bg-slate-200/70'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>Roll-Call</span>
                <span className={`px-1.5 py-0.2 text-[11px] rounded-full font-mono ${
                  activeTab === 'kehadiran' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {Object.keys(currentAttendanceMap).length}/{students.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('murid')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all border ${
                  activeTab === 'murid'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20'
                    : 'text-slate-600 border-transparent hover:text-blue-700 hover:bg-slate-200/70'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Data Murid</span>
                <span className={`px-1.5 py-0.2 text-[11px] rounded-full font-mono ${
                  activeTab === 'murid' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {students.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('log')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all border ${
                  activeTab === 'log'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20'
                    : 'text-slate-600 border-transparent hover:text-blue-700 hover:bg-slate-200/70'
                }`}
              >
                <History className="w-4 h-4" />
                <span>Log Aktiviti</span>
              </button>
            </>
          )}

          {/* Quick Setup Supabase Tab Button */}
          <button
            id="tab-open-supabase"
            onClick={() => setIsSupabaseModalOpen(true)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all border ${
              isSupabaseConfigured()
                ? 'bg-sky-50 text-sky-700 border-sky-300 hover:bg-sky-100 hover:text-sky-800'
                : 'bg-amber-500/15 text-amber-900 border-amber-400/80 hover:bg-amber-500/25 font-bold animate-pulse'
            }`}
            title="Buka Tetapan & Status Pangkalan Data Setup Supabase"
          >
            <Database className="w-4 h-4 text-sky-600" />
            <span>Setup Supabase</span>
            {!isSupabaseConfigured() && (
              <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 text-[10px] font-black rounded-full uppercase">
                Setup
              </span>
            )}
          </button>
          
          {/* Spacer for logout button */}
          <div className="w-24 shrink-0"></div>
        </nav>

        {/* TAB CONTENTS */}
        <main className="flex-1">
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left Column: Quick Imbasan Scanner Station (pinned for instant warden check) */}
              <div className="lg:col-span-4 z-10">
                <ScanStation
                  students={students}
                  statuses={hostelState.statuses}
                  selectedSession={sessionInfo}
                  attendanceMap={currentAttendanceMap}
                  onMarkMasuk={handleMarkMasuk}
                  onMarkKeluar={handleMarkKeluar}
                  onMarkKeluarLain={handleMarkKeluarLain}
                  onStartOuting={handleStartOuting}
                  onEndOuting={handleEndOuting}
                  onStartBermalam={handleStartBermalam}
                  onEndBermalam={handleEndBermalam}
                  onSetKuarantin={handleSetKuarantin}
                  onOpenStudentModal={setSelectedStudentForModal}
                  onOpenGatePass={setSelectedStudentForGatePass}
                  onOpenBulkReturn={() => setIsBulkReturnModalOpen(true)}
                  userRole={userRole}
                  officerName={userRole === 'guard' ? 'Pengawal Keselamatan Pintu Pagar' : `${currentWarden.nama} (${currentWarden.jawatan})`}
                />
              </div>

              {/* Right Column: Dashboard Analytics & Overviews */}
              <div className="lg:col-span-8">
                <Dashboard
                  students={students}
                  statuses={hostelState.statuses}
                  selectedSession={sessionInfo}
                  attendanceMap={currentAttendanceMap}
                  onSelectStudent={setSelectedStudentForModal}
                  onEndOuting={handleEndOuting}
                  onOpenBulkReturn={() => setIsBulkReturnModalOpen(true)}
                  onOpenBulkOuting={() => setActiveTab('keluar-pukal')}
                />
              </div>
            </div>
          )}

          {activeTab === 'scan' && (
            <div className="max-w-2xl mx-auto">
              <ScanStation
                students={students}
                statuses={hostelState.statuses}
                selectedSession={sessionInfo}
                attendanceMap={currentAttendanceMap}
                onMarkMasuk={handleMarkMasuk}
                onMarkKeluar={handleMarkKeluar}
                onMarkKeluarLain={handleMarkKeluarLain}
                onStartOuting={handleStartOuting}
                onEndOuting={handleEndOuting}
                onStartBermalam={handleStartBermalam}
                onEndBermalam={handleEndBermalam}
                onSetKuarantin={handleSetKuarantin}
                onOpenStudentModal={setSelectedStudentForModal}
                onOpenGatePass={setSelectedStudentForGatePass}
                onOpenBulkReturn={() => setIsBulkReturnModalOpen(true)}
                userRole={userRole}
                officerName={userRole === 'guard' ? 'Pengawal Keselamatan Pintu Pagar' : `${currentWarden.nama} (${currentWarden.jawatan})`}
              />
            </div>
          )}

          {activeTab === 'outing' && (
            <OutingMonitor
              students={students}
              statuses={hostelState.statuses}
              currentWarden={currentWarden}
              onEndOuting={handleEndOuting}
              onEndBermalam={handleEndBermalam}
              onEndKeluar={handleEndKeluar}
              onSelectStudent={setSelectedStudentForModal}
              onOpenGatePass={setSelectedStudentForGatePass}
              onBulkReturnOuting={handleBulkReturnOuting}
              onOpenParentPortal={() => setIsParentPortalOpen(true)}
              onShowToast={showToast}
              onApproveAndCheckOut={handleApproveAndCheckOut}
              onUpdateStudentStatus={handleUpdateStudentMovement}
              onCancelMovement={handleCancelMovement}
              userRole={userRole}
            />
          )}

          {activeTab === 'kehadiran' && (
            <AttendanceSessionView
              students={students}
              statuses={hostelState.statuses}
              selectedSession={sessionInfo}
              attendanceMap={currentAttendanceMap}
              onSelectSession={setCurrentSessionPeriod}
                    onBulkMarkHadir={handleBulkMarkHadir}
              onSelectStudent={setSelectedStudentForModal}
            />
          )}

          {activeTab === 'keluar-pukal' && (
            <BulkOutingView
              students={students}
              statuses={hostelState.statuses}
              wardens={wardens}
              currentWarden={currentWarden}
              onConfirmBulkOuting={handleConfirmBulkOuting}
              onNavigateTab={(tab) => setActiveTab(tab as any)}
            />
          )}

          {activeTab === 'murid' && (
            <StudentList
              students={students}
              statuses={hostelState.statuses}
              onSelectStudent={setSelectedStudentForModal}
              onOpenGatePass={setSelectedStudentForGatePass}
              onMarkMasuk={handleMarkMasuk}
              onMarkKeluar={handleMarkKeluar}
              onAddNewStudent={handleAddNewStudent}
              onOpenGoogleSheets={handleOpenGoogleSheets}
            />
          )}

          {activeTab === 'log' && (
            <ActivityLog
              logs={hostelState.logs}
              onPrintReport={() => setIsReportModalOpen(true)}
              onUpdateLog={handleUpdateLog}
              onDeleteLog={handleDeleteLog}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="mt-8 pt-4 border-t border-slate-200 text-center text-xs text-slate-500 space-y-1">
          <p>
            Sistem Pengurusan Kad Asrama &middot; Sekolah Seni Malaysia Johor
          </p>
          <p className="text-[11px] text-slate-400">
            Kementerian Pendidikan Malaysia &middot; Pengimbasan NFC &middot; Roll-Call &middot; Pas Pagar Keselamatan
          </p>
        </footer>

      </div>

      {/* STUDENT DETAILS & DIGITAL SMART CARD MODAL */}
      <StudentModal
        student={selectedStudentForModal}
        status={selectedStudentForModal ? hostelState.statuses[selectedStudentForModal.kp] : undefined}
        logs={hostelState.logs}
        onClose={() => setSelectedStudentForModal(null)}
        onEditStudent={handleEditStudent}
        onDeleteStudent={handleDeleteStudent}
        onOpenGatePass={s => {
          setSelectedStudentForGatePass(s);
          setSelectedStudentForModal(null);
        }}
        onQuickAction={action => {
          if (!selectedStudentForModal) return;
          if (action === 'masuk') handleMarkMasuk(selectedStudentForModal);
          else if (action === 'keluar') handleMarkKeluar(selectedStudentForModal);
          else if (action === 'keluar-lain') handleMarkKeluarLain(selectedStudentForModal);
          else if (action === 'end-outing') handleEndOuting(selectedStudentForModal);
        }}
        onOpenEditMovement={s => setEditingMovementStudent(s)}
      />

      {/* PRINTABLE GATE PASS MODAL */}
      <GatePassModal
        student={selectedStudentForGatePass}
        status={selectedStudentForGatePass ? hostelState.statuses[selectedStudentForGatePass.kp] : undefined}
        onClose={() => setSelectedStudentForGatePass(null)}
      />

      {/* PRINTABLE OFFICIAL DAILY WARDEN REPORT MODAL */}
      {isReportModalOpen && (
        <DailyReportModal
          students={students}
          statuses={hostelState.statuses}
          logs={hostelState.logs}
          currentWarden={currentWarden}
          onClose={() => setIsReportModalOpen(false)}
        />
      )}

      {/* GOOGLE SHEETS REAL-TIME SYNC MODAL */}
      <GoogleSheetsModal
        isOpen={isGSheetModalOpen}
        onClose={() => {
          setIsGSheetModalOpen(false);
          setGSheetConfig(getGoogleSheetsConfig());
        }}
        students={students}
        statuses={hostelState.statuses}
        wardens={wardens}
        onImportStudents={handleImportStudents}
        onImportWardens={handleImportWardens}
        onSyncNotification={(msg, isSuccess) => {
          showToast(msg, isSuccess ? 'success' : 'warning');
          setGSheetConfig(getGoogleSheetsConfig());
        }}
        onOpenSupabase={() => {
          setIsGSheetModalOpen(false);
          setIsSupabaseModalOpen(true);
        }}
      />

      {/* ADMIN PIN VERIFICATION MODAL */}
      <AdminPinModal
        isOpen={isAdminPinModalOpen}
        onClose={() => setIsAdminPinModalOpen(false)}
        onSuccess={() => {
          setGSheetConfig(getGoogleSheetsConfig());
          setIsGSheetModalOpen(true);
        }}
      />

      {/* SUPABASE CLOUD & RLS ASSISTANT MODAL */}
      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        onShowToast={showToast}
        hostelState={hostelState}
        students={students}
        onConfigSaved={() => {
          handleRefreshSupabase(false);
        }}
      />

      {/* PARENT / GUARDIAN PUBLIC PORTAL MODAL */}
      <ParentPortalModal
        isOpen={isParentPortalOpen}
        onClose={() => setIsParentPortalOpen(false)}
        students={students}
        onRequestSubmitted={() => {
          showToast('Permohonan berjaya dihantar ke Warden Bertugas.', 'success');
        }}
      />

      {/* BULK RETURN MODAL (PULANG PUKAL WARDEN) */}
      <BulkReturnModal
        isOpen={isBulkReturnModalOpen}
        onClose={() => setIsBulkReturnModalOpen(false)}
        students={students}
        statuses={hostelState.statuses}
        currentWarden={currentWarden}
        onConfirmBulkReturn={handleConfirmBulkReturn}
      />

      {/* EDIT RECORD / MOVEMENT CORRECTION MODAL */}
      {editingMovementStudent && (
        <EditMovementModal
          isOpen={!!editingMovementStudent}
          student={editingMovementStudent}
          status={hostelState.statuses[editingMovementStudent.kp]}
          wardenName={currentWarden.nama}
          onClose={() => setEditingMovementStudent(null)}
          onSave={(st, data, note) => {
            handleUpdateStudentMovement(st, data, note);
            setEditingMovementStudent(null);
          }}
          onCancelMovement={(st, reason) => {
            handleCancelMovement(st, reason);
            setEditingMovementStudent(null);
          }}
        />
      )}

      {/* MODAL SENARAI MAKLUMAT KATEGORI MURID (LAYER PALING ATAS DENGAN PORTAL Z-[9999]) */}
      <CategoryStudentModal
        isOpen={Boolean(activeCategoryModal)}
        category={activeCategoryModal}
        onClose={() => setActiveCategoryModal(null)}
        students={students}
        statuses={hostelState.statuses}
        onSelectStudent={(st) => {
          setSelectedStudentForModal(st);
          setActiveCategoryModal(null);
        }}
      />

    </div>
  );
}

