import React, { useState } from 'react';
import PendulumCanvas from './components/PendulumCanvas';
import ControlPanel from './components/ControlPanel';
import Header from './components/Header';
import { PhysicsProvider } from './hooks/usePhysics';
import './styles.css';

const App = () => {
  const [gravity, setGravity] = useState(9.8);
  const [mass1, setMass1] = useState(15);
  const [mass2, setMass2] = useState(15);
  const [volume1, setVolume1] = useState(70);
  const [volume2, setVolume2] = useState(50);
  const [trailLength, setTrailLength] = useState(200);
  const [mode, setMode] = useState('simple');
  const [isSimulating, setIsSimulating] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [snapEnabled, setSnapEnabled] = useState(false);

  return (
    <PhysicsProvider initialState={{ gravity, mass1, mass2, mode }} isSimulating={isSimulating}>
      <div className="fixed inset-0 bg-white flex flex-col font-sans text-slate-900 select-none overflow-hidden pt-[env(safe-area-inset-top,32px)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
        <Header
          isSimulating={isSimulating}
          setIsSimulating={setIsSimulating}
          isMuted={isMuted}
          setIsMuted={setIsMuted}
          setGravity={setGravity}
          setMass1={setMass1}
          setMass2={setMass2}
          setTrailLength={setTrailLength}
          setMode={setMode}
          showControls={showControls}
          setShowControls={setShowControls}
          showInstructions={showInstructions}
          setShowInstructions={setShowInstructions}
        />

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
            volume1={volume1}
            volume2={volume2}
            snapEnabled={snapEnabled}
            setSnapEnabled={setSnapEnabled}
          />

          <ControlPanel
            gravity={gravity}
            setGravity={setGravity}
            mass1={mass1}
            setMass1={setMass1}
            mass2={mass2}
            setMass2={setMass2}
            volume1={volume1}
            setVolume1={setVolume1}
            volume2={volume2}
            setVolume2={setVolume2}
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