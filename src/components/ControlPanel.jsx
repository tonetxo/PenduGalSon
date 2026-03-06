import React, { useState, useRef, useEffect } from 'react';

const ControlPanel = ({
  gravity,
  setGravity,
  mass1,
  setMass1,
  mass2,
  setMass2,
  volume1,
  setVolume1,
  volume2,
  setVolume2,
  trailLength,
  setTrailLength,
  mode,
  setMode,
  showControls,
  setShowControls
}) => {
  const [panelPosition, setPanelPosition] = useState(0); // 0 = fully open, >0 = pixels hidden
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const startPosition = useRef(0);
  const panelRef = useRef(null);
  const [panelHeight, setPanelHeight] = useState(500); // Default estimate

  // Update panel height on mount and resize
  useEffect(() => {
    if (panelRef.current) {
      const updateHeight = () => {
        setPanelHeight(panelRef.current.offsetHeight);
      };
      updateHeight();
      window.addEventListener('resize', updateHeight);
      return () => window.removeEventListener('resize', updateHeight);
    }
  }, []);

  // Sync with showControls prop
  useEffect(() => {
    if (!showControls) {
      setPanelPosition(panelHeight || 500);
    }
  }, [showControls, panelHeight]);

  const handleTouchStart = (e) => {
    setIsDragging(true);
    startY.current = e.touches[0].clientY;
    startPosition.current = panelPosition;
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const y = e.touches[0].clientY;
    const delta = y - startY.current;
    
    // New position = start position + delta (dragging down increases position)
    const newPosition = Math.max(0, Math.min(panelHeight, startPosition.current + delta));
    setPanelPosition(newPosition);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    
    // Decide if panel should be considered "open" or "closed"
    // Threshold: if less than 50% visible, it's closed
    const isClosed = panelPosition > panelHeight / 2;
    setShowControls(!isClosed);
  };

  // Calculate transform style
  const transformStyle = {
    transform: `translateY(${panelPosition}px)`,
    transition: isDragging ? 'none' : 'transform 300ms ease-out'
  };

  return (
    <aside
      ref={panelRef}
      className={`fixed bottom-[50px] left-0 right-0 w-full md:w-72 md:static md:h-full bg-white border-t md:border-t-0 md:border-l rounded-t-3xl md:rounded-none z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] md:shadow-none`}
      style={transformStyle}
    >
      {/* Drag Handle Area - Absolute positioned to stick out */}
      <div
        className="absolute -top-12 left-0 right-0 h-12 flex items-end justify-center pb-3 md:hidden touch-none bg-gradient-to-t from-white/50 to-transparent"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Visual Pill */}
        <div className="w-16 h-1.5 bg-blue-500/80 rounded-full shadow-sm backdrop-blur-sm" />
      </div>

      <div className="px-6 pb-6 md:p-6 space-y-8 h-auto max-h-[80vh] md:max-h-none md:h-auto overflow-y-auto">
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

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 5 6 9H2v6h4l5 4V5Z" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
                Vol. Azul
              </span>
              <span>{volume1}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={volume1}
              onChange={e => setVolume1(Number(e.target.value))}
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

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 5 6 9H2v6h4l5 4V5Z" />
                      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                    </svg>
                    Vol. Púrpura
                  </span>
                  <span>{volume2}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume2}
                  onChange={e => setVolume2(Number(e.target.value))}
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
      </div>
    </aside>
  );
};

export default ControlPanel;