import React from 'react';
import * as Icons from 'lucide-react';

export function ApplyOutChildView() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Mohon Anak Keluar</h1>
        <p className="text-sm text-slate-500 mt-1">Borang untuk penjaga memohon pelepasan keluar asrama bagi anak jagaan.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <form className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">ID Pelajar (Anak)</label>
            <input type="text" placeholder="Masukkan ID Pelajar" className="w-full text-sm border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border" />
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
              <option value="Kecemasan / Kematian">Kecemasan / Kematian</option>
              <option value="Rawatan Klinik / Hospital">Rawatan Klinik / Hospital</option>
              <option value="Urusan Keluarga">Urusan Rasmi / Keluarga</option>
              <option value="Outing Biasa">Outing Biasa (Hujung Minggu)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Catatan Tambahan (Pilihan)</label>
            <textarea rows={3} placeholder="Sila berikan butiran lanjut..." className="w-full text-sm border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border"></textarea>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start space-x-3">
            <Icons.AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              Permohonan ini akan disemak oleh Warden bertugas. Anda akan menerima notifikasi setelah permohonan diluluskan atau ditolak. Pastikan anak anda tidak keluar sehingga mendapat kelulusan.
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
