import React from 'react';
import * as Icons from 'lucide-react';

export function OrgChartWardenView() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Carta Organisasi (Warden)</h1>
          <p className="text-sm text-slate-500 mt-1">Hierarki dan struktur pengurusan asrama.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 flex flex-col items-center overflow-x-auto">
        
        {/* Pengetua */}
        <div className="flex flex-col items-center">
          <div className="bg-slate-800 text-white p-4 rounded-xl text-center w-64 shadow-md">
            <h3 className="font-bold text-lg">Pengetua</h3>
            <p className="text-sm text-slate-300 mt-1">Haji Mohd Ali</p>
          </div>
          <div className="w-px h-8 bg-slate-300"></div>
        </div>

        {/* PKHEM */}
        <div className="flex flex-col items-center">
          <div className="bg-indigo-600 text-white p-4 rounded-xl text-center w-64 shadow-md">
            <h3 className="font-bold text-lg">Penolong Kanan HEM</h3>
            <p className="text-sm text-indigo-100 mt-1">Ustaz Zakaria</p>
          </div>
          <div className="w-px h-8 bg-slate-300"></div>
        </div>

        {/* Ketua Warden */}
        <div className="flex flex-col items-center relative">
          <div className="bg-blue-600 text-white p-4 rounded-xl text-center w-64 shadow-md z-10 relative">
            <h3 className="font-bold text-lg">Ketua Warden</h3>
            <p className="text-sm text-blue-100 mt-1">HAIRI BIN ABDUL RAHIM</p>
          </div>
          
          <div className="w-px h-8 bg-slate-300"></div>
          {/* Horizontal Connector */}
          <div className="w-[32rem] h-px bg-slate-300"></div>
          
          {/* Warden Level */}
          <div className="flex justify-between w-[32rem] mt-0 relative">
            <div className="w-px h-8 bg-slate-300 absolute left-0 top-0"></div>
            <div className="w-px h-8 bg-slate-300 absolute right-0 top-0"></div>
            
            <div className="w-full flex justify-between mt-8">
              <div className="bg-emerald-600 text-white p-4 rounded-xl text-center w-56 shadow-md relative -left-28">
                <h3 className="font-bold">Warden Blok A</h3>
                <p className="text-sm text-emerald-100 mt-1">NOOR FAIZ BIN JAFFAR</p>
              </div>
              <div className="bg-emerald-600 text-white p-4 rounded-xl text-center w-56 shadow-md relative -right-28">
                <h3 className="font-bold">Warden Blok B</h3>
                <p className="text-sm text-emerald-100 mt-1">NIZAM BIN RUSLI</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
