import React, { useState } from 'react';
import PendulumCanvas from './components/PendulumCanvas';
import ControlPanel from './components/ControlPanel';
import { PhysicsProvider } from './hooks/usePhysics';
import './styles.css';

const App = () => {
  const [gravity, setGravity] = useState(9.8);
  const [mass1, setMass1] = useState(15);
  const [mass2, setMass2] = useState(15);
  const [trailLength, setTrailLength] = useState(200);
  const [mode, setMode] = useState('simple');
  const [isSimulating, setIsSimulating] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  return (
    <PhysicsProvider initialState={{ gravity, mass1, mass2, mode }} isSimulating={isSimulating}>
      <div className="fixed inset-0 bg-white flex flex-col font-sans text-slate-900 select-none overflow-hidden">
        <header className="h-16 bg-white border-b px-6 flex justify-between items-center z-50 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13"></path>
                <circle cx="6" cy="18" r="3"></circle>
                <circle cx="18" cy="16" r="3"></circle>
              </svg>
            </div>
            <span className="font-bold text-lg">Péndulo Musical</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSimulating(!isSimulating)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all ${isSimulating ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
            >
              {isSimulating ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                  </svg> Parar
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5,3 19,12 5,21" />
                  </svg> Reproducir
                </>
              )}
            </button>

            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-2 rounded-full transition-colors ${isMuted ? 'text-red-500 bg-red-50' : 'text-blue-600 bg-blue-50'}`}
            >
              {isMuted ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 5 6 9H2v6h4l5 4V5Z" />
                  <path d="M23 9l-6 6M17 9l6 6" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 5 6 9H2v6h4l5 4V5Z" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
              )}
            </button>

            <button
              onClick={() => {
                setGravity(9.8);
                setMass1(15);
                setMass2(15);
                setTrailLength(200);
                setMode('simple');
                setIsSimulating(false);
              }}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-full"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 4v6h-6"></path>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
              </svg>
            </button>

            <button
              onClick={() => setShowControls(!showControls)}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-full md:hidden"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </svg>
            </button>
          </div>
        </header>

        <div className="flex-1 relative flex overflow-hidden">
          <PendulumCanvas
            isSimulating={isSimulating}
            setIsSimulating={setIsSimulating}
            mode={mode}
            trailLength={trailLength}
            isMuted={isMuted}
            showInstructions={showInstructions}
            setShowInstructions={setShowInstructions}
            gravity={gravity}
            mass1={mass1}
            mass2={mass2}
          />

          <ControlPanel
            gravity={gravity}
            setGravity={setGravity}
            mass1={mass1}
            setMass1={setMass1}
            mass2={mass2}
            setMass2={setMass2}
            trailLength={trailLength}
            setTrailLength={setTrailLength}
            mode={mode}
            setMode={setMode}
            showControls={showControls}
            setShowControls={setShowControls}
          />
        </div>
      </div>
    </PhysicsProvider>
  );
};

export default App;