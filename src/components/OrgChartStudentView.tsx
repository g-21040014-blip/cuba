import React from 'react';
import * as Icons from 'lucide-react';

export function OrgChartStudentView() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Carta Organisasi (Pelajar)</h1>
          <p className="text-sm text-slate-500 mt-1">Struktur Majlis Kepimpinan Pelajar Asrama (AJK).</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 flex flex-col items-center overflow-x-auto min-h-[500px]">
        
        {/* Ketua Asrama */}
        <div className="flex flex-col items-center">
          <div className="bg-indigo-600 text-white p-4 rounded-xl text-center w-64 shadow-md">
            <h3 className="font-bold text-lg">Ketua Asrama</h3>
            <p className="text-sm text-indigo-100 mt-1">Ahmad Zaki bin Abu</p>
          </div>
          <div className="w-px h-8 bg-slate-300"></div>
        </div>

        {/* Setiausaha & Bendahari */}
        <div className="flex flex-col items-center relative w-full">
          {/* Horizontal Connector */}
          <div className="w-[24rem] h-px bg-slate-300"></div>
          
          <div className="flex justify-between w-[24rem] mt-0 relative">
            <div className="w-px h-8 bg-slate-300 absolute left-0 top-0"></div>
            <div className="w-px h-8 bg-slate-300 absolute right-0 top-0"></div>
            
            <div className="w-full flex justify-between mt-8">
              <div className="bg-blue-500 text-white p-4 rounded-xl text-center w-40 shadow-md relative -left-20">
                <h3 className="font-bold text-sm">Setiausaha</h3>
                <p className="text-xs text-blue-100 mt-1">Siti Nurhaliza</p>
              </div>
              
              <div className="bg-blue-500 text-white p-4 rounded-xl text-center w-40 shadow-md relative -right-20">
                <h3 className="font-bold text-sm">Bendahari</h3>
                <p className="text-xs text-blue-100 mt-1">Chong Wei Jie</p>
              </div>
            </div>
          </div>
          
          <div className="w-px h-8 bg-slate-300 absolute top-0"></div>
        </div>
        
        {/* Biro-biro */}
        <div className="flex flex-col items-center mt-[-32px]">
            <div className="w-px h-16 bg-slate-300"></div>
            <div className="w-[40rem] h-px bg-slate-300"></div>
            
            <div className="flex justify-between w-[40rem] mt-0 relative">
                <div className="w-px h-8 bg-slate-300 absolute left-0 top-0"></div>
                <div className="w-px h-8 bg-slate-300 absolute left-1/3 top-0"></div>
                <div className="w-px h-8 bg-slate-300 absolute right-1/3 top-0"></div>
                <div className="w-px h-8 bg-slate-300 absolute right-0 top-0"></div>
                
                <div className="w-full flex justify-between mt-8">
                    <div className="bg-teal-600 text-white p-3 rounded-xl text-center w-32 shadow-md relative -left-16">
                        <h3 className="font-bold text-xs">Biro Agama</h3>
                        <p className="text-[10px] text-teal-100 mt-1">Aliuddin</p>
                    </div>
                    <div className="bg-teal-600 text-white p-3 rounded-xl text-center w-32 shadow-md relative -left-[4.5rem]">
                        <h3 className="font-bold text-xs">Biro Disiplin</h3>
                        <p className="text-[10px] text-teal-100 mt-1">Muthu</p>
                    </div>
                    <div className="bg-teal-600 text-white p-3 rounded-xl text-center w-32 shadow-md relative -right-[4.5rem]">
                        <h3 className="font-bold text-xs">Biro Sukan</h3>
                        <p className="text-[10px] text-teal-100 mt-1">Khairul</p>
                    </div>
                    <div className="bg-teal-600 text-white p-3 rounded-xl text-center w-32 shadow-md relative -right-16">
                        <h3 className="font-bold text-xs">Biro Makanan</h3>
                        <p className="text-[10px] text-teal-100 mt-1">Aisyah</p>
                    </div>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}
