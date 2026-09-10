const renderModal = () => {
  if (!viewingCategory) return null;

  let title = 'Senarai Murid';
  let filteredList = students;

  if (viewingCategory === 'DALAM') {
    title = 'Senarai Dalam Asrama';
    filteredList = students.filter(s => statuses[s.kp]?.status === 'DALAM');
  } else if (viewingCategory === 'OUTING') {
    title = 'Senarai Sedang Outing';
    filteredList = students.filter(s => statuses[s.kp]?.status === 'OUTING');
  } else if (viewingCategory === 'BERMALAM') {
    title = 'Senarai Pulang Bermalam';
    filteredList = students.filter(s => statuses[s.kp]?.status === 'BERMALAM');
  } else if (viewingCategory === 'KUARANTIN') {
    title = 'Senarai Bilik Sakit / Kuarantin';
    filteredList = students.filter(s => statuses[s.kp]?.status === 'KUARANTIN');
  } else if (viewingCategory === 'KELUAR') {
    title = 'Senarai Riadah / Latihan';
    filteredList = students.filter(s => statuses[s.kp]?.status === 'KELUAR');
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-800 animate-in slide-in-from-right duration-300">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 backdrop-blur z-10 sticky top-0">
          <div>
            <h3 className="font-bold text-white text-lg">{title}</h3>
            <p className="text-xs text-slate-400">{filteredList.length} rekod</p>
          </div>
          <button
            onClick={() => setViewingCategory(null)}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredList.map(s => {
            const st = statuses[s.kp];
            const config = getStatusBadgeConfig(st?.status || 'DALAM');
            return (
              <div 
                key={s.kp} 
                className="bg-slate-950/50 border border-slate-800/60 rounded-xl p-3 flex items-start gap-3 cursor-pointer hover:border-teal-500/30 transition-colors"
                onClick={() => {
                  setViewingCategory(null);
                  onSelectStudent(s);
                }}
              >
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0 border border-slate-700 overflow-hidden">
                  {s.photo ? (
                    <img src={s.photo} alt={s.nama} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-bold text-slate-400 text-sm">{s.nama.substring(0, 2)}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-white text-sm truncate">{s.nama}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{s.kelas} &middot; {s.bidang}</p>
                  
                  {st?.status !== 'DALAM' && st?.dest && (
                    <p className="text-[11px] text-slate-300 mt-1.5 flex items-center gap-1">
                      <Compass className="w-3 h-3 text-slate-400" />
                      <span className="truncate">{st.dest}</span>
                    </p>
                  )}
                </div>
                <div className={`px-2 py-1 rounded border text-[10px] font-bold ${config.bg} ${config.text} ${config.border}`}>
                  {config.label}
                </div>
              </div>
            );
          })}

          {filteredList.length === 0 && (
            <div className="text-center py-10">
              <p className="text-slate-500 text-sm">Tiada rekod dijumpai.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
