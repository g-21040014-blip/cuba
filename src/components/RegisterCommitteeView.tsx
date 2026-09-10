import React from 'react';
import * as Icons from 'lucide-react';

export function RegisterCommitteeView() {
  const [committees, setCommittees] = React.useState([
    { id: 'P001', name: 'Ahmad Zaki bin Abu', role: 'Ketua Asrama', task: 'Memantau Disiplin' },
    { id: 'P002', name: 'Siti Nurhaliza binti Ali', role: 'Setiausaha', task: 'Merekod Kehadiran' },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Daftar AJK Asrama</h1>
          <p className="text-sm text-slate-500 mt-1">Urus senarai Ahli Jawatankuasa Asrama dalam kalangan pelajar.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-fit">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
            <Icons.BadgePlus className="w-5 h-5 mr-2 text-indigo-500" /> Tambah AJK Baru
          </h2>
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">ID Pelajar</label>
              <input type="text" placeholder="Cari ID/Nama Pelajar..." className="w-full text-sm border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Jawatan</label>
              <select className="w-full text-sm border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border">
                <option value="">-- Pilih Jawatan --</option>
                <option value="Ketua Asrama">Ketua Asrama</option>
                <option value="Penolong Ketua Asrama">Penolong Ketua Asrama</option>
                <option value="Setiausaha">Setiausaha</option>
                <option value="Bendahari">Bendahari</option>
                <option value="Biro Agama">Biro Agama</option>
                <option value="Biro Sukan">Biro Sukan</option>
                <option value="Biro Disiplin">Biro Disiplin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tugasan Spesifik (Pilihan)</label>
              <textarea placeholder="Contoh: Mengambil kedatangan solat jemaah" rows={3} className="w-full text-sm border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border"></textarea>
            </div>
            <div className="pt-2">
              <button type="button" className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors">
                <Icons.Save className="w-4 h-4" />
                <span>Simpan Rekod AJK</span>
              </button>
            </div>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center">
              <Icons.Users className="w-5 h-5 mr-2 text-slate-500" /> Senarai AJK Dilantik
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Pelajar</th>
                  <th className="py-3 px-4">Jawatan</th>
                  <th className="py-3 px-4">Tugasan</th>
                  <th className="py-3 px-4 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {committees.map((ajk, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-800">{ajk.name}</p>
                      <p className="text-xs text-slate-500">ID: {ajk.id}</p>
                    </td>
                    <td className="py-3 px-4 font-semibold text-indigo-600">{ajk.role}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{ajk.task}</td>
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
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
