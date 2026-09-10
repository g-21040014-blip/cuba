import React from 'react';
import * as Icons from 'lucide-react';

export function DataReportView() {
  const records = [
    { id: 'TRX001', student: 'Ahmad Zaki bin Abu', form: '4 Sains 1', type: 'Keluar', datetime: '10 Nov 2023, 15:00', purpose: 'Balik Kampung' },
    { id: 'TRX002', student: 'Ahmad Zaki bin Abu', form: '4 Sains 1', type: 'Masuk', datetime: '12 Nov 2023, 16:45', purpose: 'Balik Kampung' },
    { id: 'TRX003', student: 'Siti Nurhaliza binti Ali', form: '5 Sastera', type: 'Keluar', datetime: '15 Nov 2023, 08:00', purpose: 'Klinik Kesihatan' },
    { id: 'TRX004', student: 'Siti Nurhaliza binti Ali', form: '5 Sastera', type: 'Masuk', datetime: '15 Nov 2023, 13:30', purpose: 'Klinik Kesihatan' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Data Keluar / Masuk Asrama</h1>
          <p className="text-sm text-slate-500 mt-1">Laporan penuh log pergerakan pelajar.</p>
        </div>
        <button className="flex items-center space-x-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium">
          <Icons.Download className="w-4 h-4" />
          <span>Eksport Laporan</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between bg-slate-50">
          <div className="flex space-x-2">
            <input 
              type="date" 
              className="text-sm border-slate-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border" 
            />
            <select className="text-sm border-slate-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border">
              <option value="">Semua Tingkatan</option>
              <option value="4">Tingkatan 4</option>
              <option value="5">Tingkatan 5</option>
            </select>
          </div>
          <div className="relative w-full sm:w-64">
            <input 
              type="text" 
              placeholder="Cari nama pelajar..." 
              className="w-full text-sm border-slate-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 pl-8 border" 
            />
            <Icons.Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">ID Transaksi</th>
                <th className="py-3 px-4">Pelajar</th>
                <th className="py-3 px-4">Tarikh & Masa</th>
                <th className="py-3 px-4 text-center">Jenis Aktiviti</th>
                <th className="py-3 px-4">Tujuan / Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {records.map((record, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 text-xs font-mono text-slate-400">{record.id}</td>
                  <td className="py-3 px-4">
                    <p className="font-medium text-slate-800">{record.student}</p>
                    <p className="text-xs text-slate-500">{record.form}</p>
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-medium">{record.datetime}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                      record.type === 'Keluar' 
                        ? 'bg-rose-50 text-rose-700 border-rose-200' 
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {record.type === 'Keluar' ? <Icons.ArrowUpRight className="w-3 h-3 mr-1" /> : <Icons.ArrowDownRight className="w-3 h-3 mr-1" />}
                      {record.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{record.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination placeholder */}
        <div className="p-4 border-t border-slate-200 flex justify-between items-center text-sm text-slate-500">
          <div>Menunjukkan 1 hingga 4 dari 4 rekod</div>
          <div className="flex space-x-1">
            <button className="px-3 py-1 border border-slate-300 rounded hover:bg-slate-50" disabled>Kiri</button>
            <button className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-600 rounded">1</button>
            <button className="px-3 py-1 border border-slate-300 rounded hover:bg-slate-50" disabled>Kanan</button>
          </div>
        </div>
      </div>
    </div>
  );
}
