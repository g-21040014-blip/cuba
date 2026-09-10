import React from 'react';
import * as Icons from 'lucide-react';

export function RecordOutView() {
  const [method, setMethod] = React.useState<'manual' | 'qr'>('qr');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Rekod Keluar Asrama</h1>
          <p className="text-sm text-slate-500 mt-1">Sahkan pelajar keluar dari kawasan asrama di pondok pengawal / warden.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">
        {/* Input Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex space-x-2 mb-6 bg-slate-100 p-1 rounded-lg">
            <button 
              onClick={() => setMethod('qr')}
              className={`flex-1 flex justify-center items-center py-2 text-sm font-medium rounded-md transition-colors ${method === 'qr' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Icons.QrCode className="w-4 h-4 mr-2" /> Imbasan QR
            </button>
            <button 
              onClick={() => setMethod('manual')}
              className={`flex-1 flex justify-center items-center py-2 text-sm font-medium rounded-md transition-colors ${method === 'manual' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Icons.Keyboard className="w-4 h-4 mr-2" /> Kemasukan Manual
            </button>
          </div>

          {method === 'qr' ? (
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50">
              <div className="w-48 h-48 bg-slate-200 rounded-lg flex items-center justify-center mb-4">
                <Icons.Camera className="w-12 h-12 text-slate-400" />
              </div>
              <p className="text-sm text-slate-500 text-center">Halakan kamera pada Kod QR pas pelajar untuk mengimbas.</p>
              <button className="mt-4 px-4 py-2 bg-slate-800 text-white text-sm rounded-lg hover:bg-slate-700 transition-colors">
                Aktifkan Kamera
              </button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ID / IC Pelajar</label>
                <div className="flex space-x-2">
                  <input type="text" placeholder="Cth: P001" className="flex-1 text-sm border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border" />
                  <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg transition-colors font-medium">Cari</button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Result/Confirmation Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h2 className="font-semibold text-slate-800">Semakan Kelulusan</h2>
          </div>
          
          <div className="p-6 flex flex-col h-full justify-between">
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-slate-200 rounded-lg flex items-center justify-center text-slate-400">
                  <Icons.User className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-800">Ahmad Zaki bin Abu</h3>
                  <p className="text-sm text-slate-500">P001 • Tingkatan 4 Sains 1</p>
                  <div className="inline-flex items-center mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                    <Icons.CheckCircle2 className="w-3 h-3 mr-1" /> Kelulusan Sah
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 text-sm">
                <div className="grid grid-cols-2 gap-y-2">
                  <div className="text-slate-500">Tujuan:</div>
                  <div className="font-medium text-slate-800">Balik Kampung</div>
                  <div className="text-slate-500">Tarikh Kelulusan:</div>
                  <div className="font-medium text-slate-800">10 Nov 2023</div>
                  <div className="text-slate-500">Mesti Pulang Pada:</div>
                  <div className="font-medium text-rose-600">12 Nov 2023, 17:00</div>
                </div>
              </div>
            </div>

            <button className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-bold text-lg shadow-sm transition-colors flex items-center justify-center">
              <Icons.LogOut className="w-5 h-5 mr-2" /> SAHKAN KELUAR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
