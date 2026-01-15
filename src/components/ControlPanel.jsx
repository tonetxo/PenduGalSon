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
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const currentY = useRef(0);

  // Reset drag offset when panel is toggled
  useEffect(() => {
    if (!showControls) {
      setDragOffset(0);
    }
  }, [showControls]);

  const handleTouchStart = (e) => {
    setIsDragging(true);
    startY.current = e.touches[0].clientY;
    currentY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const y = e.touches[0].clientY;
    const delta = y - startY.current;

    // Only allow dragging down (positive delta)
    if (delta > 0) {
      setDragOffset(delta);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);

    // If dragged more than 100px, close the panel
    if (dragOffset > 100) {
      setShowControls(false);
    }

    // Always reset offset to let CSS transition take over (either to closed 100% or open 0%)
    setDragOffset(0);
  };

  // Calculate transform for mobile only
  const getTransform = () => {
    // If dragging, follow finger
    if (isDragging) {
      return `translateY(${dragOffset}px)`;
    }
    // If not dragging, rely on CSS classes (handled by parent logic, but we need to override if showControls is true)
    // Actually, we use the classes for base state, and inline style only during drag
    return undefined;
  };

  return (
    <aside
      className={`fixed bottom-0 left-0 right-0 w-full md:w-72 md:static md:h-full bg-white border-t md:border-t-0 md:border-l rounded-t-3xl md:rounded-none z-40 transition-transform ${isDragging ? 'duration-0' : 'duration-300'} ${showControls ? 'translate-y-0 md:translate-x-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] md:shadow-none' : 'translate-y-full md:translate-x-0'}`}
      style={{ transform: isDragging ? `translateY(${dragOffset}px)` : undefined }}
    >
      {/* Drag Handle Area */}
      <div
        className="w-full h-12 flex items-center justify-center md:hidden touch-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
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