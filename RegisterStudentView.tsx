import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { initAuth, googleSignIn, logout } from '../lib/google-auth';
import { fetchStudentsFromSheets, saveStudentsToSheets } from '../lib/sheets-api';
import { parseStudentsCSV } from '../data/importStudents';

export function RegisterStudentView() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    jantina: '',
    form: '',
    bidang: '',
    kelas_seni: '',
    gambar: '',
    room: '',
    phone: '',
    status: 'Aktif'
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);

  useEffect(() => {
    const unsubscribe = initAuth(
      () => {
        setNeedsAuth(false);
        loadData();
      },
      () => {
        setNeedsAuth(true);
        setLoading(false);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const handleLogin = async () => {
    try {
      setLoading(true);
      await googleSignIn();
      setNeedsAuth(false);
      loadData();
    } catch (err) {
      console.error('Login failed:', err);
      setErrorMsg('Gagal untuk log masuk ke Google.');
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setNeedsAuth(true);
      setStudents([]);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const data = await fetchStudentsFromSheets();
      const formatted = data.map((row: any) => {
        let image = row['GAMBAR'] || undefined;
        if (image && typeof image === 'string' && image.includes('drive.google.com')) {
          const match = image.match(/id=([^&]+)/) || image.match(/\/d\/([a-zA-Z0-9_-]+)/);
          if (match) {
            image = `https://drive.google.com/thumbnail?id=${match[1]}&sz=w400-h400`;
          }
        }
        return {
          id: row['NO KP'] || row['ID Pelajar'] || '-',
          name: row['NAMA MURID'] || row['Nama Penuh'] || '-',
          jantina: row['JANTINA'] || '-',
          form: row['KELAS AKADEMIK'] || row['Tingkatan / Kelas'] || row['Tingkatan'] || '-',
          bidang: row['BIDANG'] || '-',
          kelas_seni: row['KELAS SENI'] || '-',
          room: row['NO BILIK'] || row['No Bilik'] || '-',
          phone: row['NO TELEFON'] || row['No Telefon Penjaga'] || '-',
          status: row['STATUS'] || row['Status'] || 'Aktif',
          image: image,
          gambar: row['GAMBAR'] || ''
        };
      });
      setStudents(formatted);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Gagal memuat turun data pelajar.');
    } finally {
      setLoading(false);
    }
  };


  const uniqueForms = Array.from(new Set(students.map(s => s.form).filter(f => f && f !== '-'))).sort();
  const uniqueRooms = Array.from(new Set(students.map(s => s.room).filter(r => r && r !== '-'))).sort();

  const syncToSheets = async (newStudents: any[]) => {
    if (needsAuth) {
      setErrorMsg('Sila log masuk untuk simpan ke Google Sheets.');
      return;
    }
    try {
      setLoading(true);
      setErrorMsg(null);
      setSyncSuccess(null);
      await saveStudentsToSheets(newStudents);
      setSyncSuccess('Berjaya disimpan ke Google Sheets!');
      setTimeout(() => setSyncSuccess(null), 3000);
    } catch (err: any) {
      console.error('Sync failed:', err);
      setErrorMsg(err.message || 'Gagal untuk menyimpan ke Google Sheets.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id || !formData.name) return;

    let newStudents = [...students];
    if (isEditing && editIndex !== null) {
      newStudents[editIndex] = formData;
      setIsEditing(false);
      setEditIndex(null);
    } else {
      newStudents = [formData, ...newStudents];
    }
    
    setStudents(newStudents);
    await syncToSheets(newStudents);

    // Reset form
    setFormData({
      id: '',
      name: '',
      form: '',
      room: '',
      phone: '',
      status: 'Aktif'
    });
  };

  const handleEdit = (student: any, index: number) => {
    setFormData({
      id: student.id,
      name: student.name,
      jantina: student.jantina || '',
      form: student.form,
      bidang: student.bidang || '',
      kelas_seni: student.kelas_seni || '',
      gambar: student.gambar || '',
      room: student.room,
      phone: student.phone,
      status: student.status
    });
    setIsEditing(true);
    setEditIndex(index);
  };

  const handleDelete = async (index: number) => {
    if (confirm('Adakah anda pasti untuk memadam rekod pelajar ini?')) {
      const newStudents = [...students];
      newStudents.splice(index, 1);
      setStudents(newStudents);
      
      await syncToSheets(newStudents);
          
      // If deleting the currently edited item, reset form
      if (isEditing && editIndex === index) {
        setIsEditing(false);
        setEditIndex(null);
        setFormData({
          id: '',
          name: '',
          jantina: '',
          form: '',
          bidang: '',
          kelas_seni: '',
          gambar: '',
          room: '',
          phone: '',
          status: 'Aktif'
        });
      }
    }
  };
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditIndex(null);
    setFormData({
      id: '',
      name: '',
      jantina: '',
      form: '',
      bidang: '',
      kelas_seni: '',
      gambar: '',
      room: '',
      phone: '',
      status: 'Aktif'
    });
  };

  const handleImportCSV = async () => {
    if (confirm('Amaran: Tindakan ini akan MENGGANTIKAN SEMUA rekod pelajar yang sedia ada dengan data dari fail CSV. Adakah anda pasti?')) {
      try {
        setLoading(true);
        const imported = parseStudentsCSV();
        if (imported.length > 0) {
          setStudents(imported);
          await syncToSheets(imported);
          alert(`Berjaya memuat naik ${imported.length} pelajar.`);
          loadData(); // Reload to generate image thumbnails
        } else {
          alert('Tiada data pelajar dijumpai dalam CSV.');
        }
      } catch (err: any) {
        alert('Ralat mengimport CSV: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Daftar Asrama Pelajar</h1>
          <p className="text-sm text-slate-500 mt-1">Urus senarai pelajar, maklumat bilik dan penjaga.</p>
        </div>
        <div>
          {needsAuth ? (
            <button 
              type="button"
              onClick={handleLogin}
              disabled={loading}
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
            <div className="flex flex-col items-end gap-2">
              <span className="inline-flex items-center text-sm text-emerald-600 font-medium">
                <Icons.CheckCircle2 className="w-4 h-4 mr-1" /> Log Masuk
              </span>
              <div className="flex gap-2">
                <button type="button" onClick={handleLogout} className="text-xs text-slate-600 border border-slate-200 bg-slate-50 rounded px-2 py-1 hover:bg-slate-100 flex items-center transition-colors">
                  <Icons.LogOut className="w-3 h-3 mr-1" /> Log Keluar
                </button>
                <button type="button" onClick={handleImportCSV} disabled={loading} className="text-xs text-amber-600 border border-amber-200 bg-amber-50 rounded px-2 py-1 hover:bg-amber-100 flex items-center transition-colors">
                  <Icons.FileUp className="w-3 h-3 mr-1" /> Import CSV
                </button>
                <button type="button" onClick={loadData} disabled={loading} className="text-xs text-indigo-600 border border-indigo-200 bg-indigo-50 rounded px-2 py-1 hover:bg-indigo-100 flex items-center transition-colors">
                  <Icons.RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} /> Muat Semula Data
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="bg-rose-50 text-rose-700 p-3 rounded-lg text-sm flex items-start border border-rose-100">
          <Icons.AlertCircle className="w-5 h-5 mr-2 shrink-0 mt-0.5" />
          <p>{errorMsg}</p>
        </div>
      )}

      {syncSuccess && (
        <div className="bg-emerald-50 text-emerald-700 p-3 rounded-lg text-sm flex items-start border border-emerald-100">
          <Icons.CheckCircle2 className="w-5 h-5 mr-2 shrink-0 mt-0.5" />
          <p>{syncSuccess}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-fit">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
            {isEditing ? (
              <><Icons.Edit2 className="w-5 h-5 mr-2 text-indigo-500" /> Kemaskini Pelajar</>
            ) : (
              <><Icons.UserPlus className="w-5 h-5 mr-2 text-indigo-500" /> Tambah Pelajar Baru</>
            )}
          </h2>
          
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">NO KP</label>
              <input 
                type="text" 
                name="id"
                value={formData.id}
                onChange={handleInputChange}
                placeholder="Contoh: 123456012345" 
                required
                className="w-full text-sm border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nama Penuh</label>
              <input 
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Nama Pelajar" 
                required
                className="w-full text-sm border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Jantina</label>
              <select 
                name="jantina"
                value={formData.jantina}
                onChange={handleInputChange}
                className="w-full text-sm border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border" 
              >
                <option value="">-- Pilih Jantina --</option>
                <option value="L">Lelaki (L)</option>
                <option value="P">Perempuan (P)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Kelas Akademik</label>
              <input 
                type="text" 
                name="form"
                value={formData.form}
                onChange={handleInputChange}
                placeholder="Contoh: 2 INANG" 
                className="w-full text-sm border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Bidang</label>
              <input 
                type="text" 
                name="bidang"
                value={formData.bidang}
                onChange={handleInputChange}
                placeholder="Contoh: TARI" 
                className="w-full text-sm border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Kelas Seni</label>
              <input 
                type="text" 
                name="kelas_seni"
                value={formData.kelas_seni}
                onChange={handleInputChange}
                placeholder="Contoh: 2 GEMALAI" 
                className="w-full text-sm border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Pautan Gambar (Drive)</label>
              <input 
                type="text" 
                name="gambar"
                value={formData.gambar}
                onChange={handleInputChange}
                placeholder="Pautan Google Drive" 
                className="w-full text-sm border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">No Bilik (Asrama)</label>
              <select
                name="room"
                value={formData.room}
                onChange={handleInputChange}
                className="w-full text-sm border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border"
              >
                <option value="">-- Pilih Bilik --</option>
                {uniqueRooms.map(room => (
                  <option key={room as string} value={room as string}>{room as string}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">No Telefon Penjaga</label>
              <input 
                type="text" 
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Contoh: 012-3456789" 
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
                <option value="Aktif">Aktif</option>
                <option value="Tidak Aktif">Tidak Aktif</option>
              </select>
            </div>
            <div className="pt-2 flex flex-col space-y-2">
              <button 
                type="submit" 
                className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
              >
                <Icons.Save className="w-4 h-4" />
                <span>{isEditing ? 'Simpan Kemaskini' : 'Simpan Rekod Pelajar'}</span>
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

        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center">
              <Icons.GraduationCap className="w-5 h-5 mr-2 text-slate-500" /> Senarai Pelajar Berdaftar
            </h2>
          </div>
          
          <div className="overflow-x-auto max-h-[600px]">
            {loading ? (
              <div className="p-12 flex justify-center items-center">
                <Icons.Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              </div>
            ) : (
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200 sticky top-0 shadow-sm">
                  <tr>
                    <th className="py-3 px-4">NO KP</th>
                    <th className="py-3 px-4">Nama Penuh</th>
                    <th className="py-3 px-4">Jantina</th>
                    <th className="py-3 px-4">Bilik</th>
                    <th className="py-3 px-4">Seni / Bidang</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {students.map((student, i) => (
                    <tr key={`${student.id}-${i}`} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-indigo-600">{student.id}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          {student.image ? (
                            <img src={student.image} alt={student.name} className="w-10 h-10 rounded-full object-cover border border-slate-200" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-slate-200 shrink-0">
                              {student.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-slate-800 line-clamp-1">{student.name}</p>
                            <p className="text-xs text-slate-500">{student.form}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{student.jantina}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center justify-center bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs font-medium border border-slate-200">
                          {student.room}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <span className="inline-flex items-center justify-center bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap">
                          {student.kelas_seni || student.bidang || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${student.status === 'Aktif' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          {student.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <button 
                            onClick={() => handleEdit(student, i)}
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
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
