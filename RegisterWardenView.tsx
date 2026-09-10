import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { initAuth, googleSignIn } from '../lib/google-auth';
import { fetchWardensFromSheets, saveWardensToSheets } from '../lib/sheets-api';

export function RegisterWardenView() {
  const [wardens, setWardens] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    phone: '',
    email: '',
    block: ''
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

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const data = await fetchWardensFromSheets();
      const formatted = data.map((row: any) => ({
        id: row['ID Warden'] || '-',
        name: row['Nama'] || '-',
        phone: row['No Telefon'] || '-',
        email: row['Emel'] || '-',
        block: row['Blok Bertugas'] || '-',
      }));
      setWardens(formatted);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Gagal memuat turun data warden.');
      // If we failed, fallback to local storage or defaults?
      // Not strictly necessary but let's keep it simple.
    } finally {
      setLoading(false);
    }
  };

  const syncToSheets = async (newWardens: any[]) => {
    if (needsAuth) {
      setErrorMsg('Sila log masuk untuk simpan ke Google Sheets.');
      return;
    }
    try {
      setLoading(true);
      setErrorMsg(null);
      setSyncSuccess(null);
      await saveWardensToSheets(newWardens);
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

    let newWardens = [...wardens];
    if (isEditing && editIndex !== null) {
      newWardens[editIndex] = formData;
      setIsEditing(false);
      setEditIndex(null);
    } else {
      newWardens = [formData, ...newWardens];
    }
    
    setWardens(newWardens);
    await syncToSheets(newWardens);

    setFormData({
      id: '',
      name: '',
      phone: '',
      email: '',
      block: ''
    });
  };

  const handleEdit = (warden: any, index: number) => {
    setFormData({
      id: warden.id,
      name: warden.name,
      phone: warden.phone,
      email: warden.email,
      block: warden.block
    });
    setIsEditing(true);
    setEditIndex(index);
  };

  const handleDelete = async (index: number) => {
    if (confirm('Adakah anda pasti untuk memadam rekod warden ini?')) {
      const newWardens = [...wardens];
      newWardens.splice(index, 1);
      setWardens(newWardens);
      
      await syncToSheets(newWardens);
          
      if (isEditing && editIndex === index) {
        setIsEditing(false);
        setEditIndex(null);
        setFormData({
          id: '',
          name: '',
          phone: '',
          email: '',
          block: ''
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Daftar Warden Asrama</h1>
          <p className="text-sm text-slate-500 mt-1">Urus senarai warden dan tugasan blok.</p>
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
            <div className="flex flex-col items-end">
              <span className="inline-flex items-center text-sm text-emerald-600 font-medium">
                <Icons.CheckCircle2 className="w-4 h-4 mr-1" /> Log Masuk
              </span>
              <button type="button" onClick={loadData} disabled={loading} className="text-xs text-indigo-600 hover:text-indigo-700 mt-1 flex items-center">
                <Icons.RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} /> Muat Semula Data
              </button>
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
              <><Icons.Edit2 className="w-5 h-5 mr-2 text-indigo-500" /> Kemaskini Warden</>
            ) : (
              <><Icons.UserPlus className="w-5 h-5 mr-2 text-indigo-500" /> Tambah Warden</>
            )}
          </h2>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">ID Warden</label>
              <input 
                type="text" 
                name="id"
                value={formData.id}
                onChange={handleInputChange}
                required
                placeholder="Contoh: W004" 
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
                required
                placeholder="Nama Warden" 
                className="w-full text-sm border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">No Telefon</label>
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Emel</label>
              <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Contoh: warden@sekolah.edu.my" 
                className="w-full text-sm border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Blok Bertugas</label>
              <select 
                name="block"
                value={formData.block}
                onChange={handleInputChange}
                className="w-full text-sm border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border"
              >
                <option value="">-- Pilih Blok --</option>
                <option value="A">Blok A</option>
                <option value="B">Blok B</option>
              </select>
            </div>
            <div className="pt-2 flex space-x-3">
              <button 
                type="submit" 
                disabled={loading}
                className="flex-1 flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                <Icons.Save className="w-4 h-4" />
                <span>Simpan Rekod</span>
              </button>
              {isEditing && (
                <button 
                  type="button" 
                  onClick={() => {
                    setIsEditing(false);
                    setEditIndex(null);
                    setFormData({
                      id: '',
                      name: '',
                      phone: '',
                      email: '',
                      block: ''
                    });
                  }}
                  className="flex items-center justify-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-lg font-medium transition-colors"
                >
                  Batal
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center">
              <Icons.ShieldCheck className="w-5 h-5 mr-2 text-slate-500" /> Senarai Warden
            </h2>
            <span className="text-sm text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 font-medium">
              Jumlah: {wardens.length}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">ID Warden</th>
                  <th className="py-3 px-4">Nama</th>
                  <th className="py-3 px-4">Hubungan</th>
                  <th className="py-3 px-4 text-center">Blok</th>
                  <th className="py-3 px-4 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading && wardens.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center">
                        <Icons.Loader2 className="w-6 h-6 animate-spin text-indigo-500 mb-2" />
                        Memuat turun data...
                      </div>
                    </td>
                  </tr>
                ) : wardens.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      Tiada rekod warden.
                    </td>
                  </tr>
                ) : (
                  wardens.map((warden, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-indigo-600">{warden.id}</td>
                      <td className="py-3 px-4 font-medium text-slate-800">{warden.name}</td>
                      <td className="py-3 px-4">
                        <p className="text-xs text-slate-800">{warden.phone}</p>
                        <p className="text-xs text-slate-500">{warden.email}</p>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {warden.block && warden.block !== '-' ? (
                          <span className="inline-flex items-center justify-center bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs font-medium border border-slate-200">
                            Blok {warden.block}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <button 
                            onClick={() => handleEdit(warden, i)}
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
