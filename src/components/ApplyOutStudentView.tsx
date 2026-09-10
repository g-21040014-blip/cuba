import React from 'react';
import * as Icons from 'lucide-react';

export function ApplyOutStudentView() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Mohon Keluar Asrama (Pelajar)</h1>
        <p className="text-sm text-slate-500 mt-1">Borang permohonan keluar asrama untuk diisi oleh pelajar.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <form className="space-y-5">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6 flex items-center space-x-4">
            <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center">
              <Icons.User className="w-6 h-6 text-slate-500" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">Ahmad Zaki bin Abu (P001)</p>
              <p className="text-xs text-slate-500">Tingkatan 4 Sains 1 • Bilik A101</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tarikh Keluar</label>
              <input type="date" className="w-full text-sm border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Masa Keluar</label>
              <input type="time" className="w-full text-sm border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tarikh Jangka Balik</label>
              <input type="date" className="w-full text-sm border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Masa Jangka Balik</label>
              <input type="time" className="w-full text-sm border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tujuan Keluar</label>
            <select className="w-full text-sm border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border">
              <option value="">-- Pilih Tujuan --</option>
              <option value="Balik Kampung / Bermalam">Balik Kampung / Bermalam</option>
              <option value="Outing Biasa">Outing Biasa</option>
              <option value="Beli Barang Keperluan">Beli Barang Keperluan</option>
              <option value="Aktiviti Sekolah Luar">Program / Aktiviti Sekolah</option>
            </select>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
            <Icons.Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">
              Sila pastikan anda memakai pakaian yang sesuai (pakaian rasmi outing) sebelum keluar. Kegagalan mematuhi peraturan akan menyebabkan permohonan ditolak.
            </p>
          </div>

          <div className="pt-4 flex justify-end">
            <button type="button" className="flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors">
              <Icons.Send className="w-4 h-4" />
              <span>Hantar Permohonan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
