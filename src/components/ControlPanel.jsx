import React from 'react';

const ControlPanel = ({ 
  gravity, 
  setGravity, 
  mass1, 
  setMass1, 
  mass2, 
  setMass2, 
  trailLength, 
  setTrailLength, 
  mode, 
  setMode, 
  showControls, 
  setShowControls 
}) => {
  return (
    <aside className={`absolute md:static right-0 top-0 bottom-0 w-72 bg-white border-l p-6 z-40 transition-transform duration-300 ${showControls ? 'translate-x-0 shadow-xl' : 'translate-x-full md:translate-x-0'}`}>
      <div className="space-y-8">
        <section>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 block">Física</label>
          <div className="flex p-1 bg-slate-100 rounded-xl">
            <button 
              onClick={() => setMode('simple')} 
              className={`flex-1 py-2 text-sm font-bold rounded-lg ${mode === 'simple' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
            >
              Simple
            </button>
            <button 
              onClick={() => setMode('compound')} 
              className={`flex-1 py-2 text-sm font-bold rounded-lg ${mode === 'compound' ? 'bg-white shadow text-purple-600' : 'text-slate-500'}`}
            >
              Dobre
            </button>
          </div>
        </section>
        
        <section className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span>Gravidade</span>
              <span>{gravity}</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="25" 
              step="0.5" 
              value={gravity} 
              onChange={e => setGravity(Number(e.target.value))} 
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none accent-blue-600 cursor-pointer" 
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span>Masa Azul</span>
              <span>{mass1}</span>
            </div>
            <input 
              type="range" 
              min="5" 
              max="100" 
              value={mass1} 
              onChange={e => setMass1(Number(e.target.value))} 
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none accent-blue-600 cursor-pointer" 
            />
          </div>
          
          {mode === 'compound' && (
            <>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span>Masa Púrpura</span>
                  <span>{mass2}</span>
                </div>
                <input 
                  type="range" 
                  min="5" 
                  max="100" 
                  value={mass2} 
                  onChange={e => setMass2(Number(e.target.value))} 
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none accent-purple-600 cursor-pointer" 
                />
              </div>
              
              <div className="space-y-2 pt-2 border-t">
                <div className="flex justify-between text-xs font-bold">
                  <span>Duración do Rastro</span>
                  <span>{trailLength}</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="500" 
                  value={trailLength} 
                  onChange={e => setTrailLength(Number(e.target.value))} 
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none accent-purple-600 cursor-pointer" 
                />
              </div>
            </>
          )}
        </section>

        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-[11px] text-amber-800 leading-relaxed shadow-sm">
          <p className="font-bold flex items-center gap-1 mb-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
            Visualización
          </p>
          Usa o novo control deslizante de rastro para ver traxectorias máis curtas ou máis longas no modo dobre.
        </div>
      </div>
    </aside>
  );
};

export default ControlPanel;