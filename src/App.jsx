import React, { useState } from 'react';
import PendulumCanvas from './components/PendulumCanvas';
import ControlPanel from './components/ControlPanel';
import Header from './components/Header';
import { PhysicsProvider } from './hooks/usePhysics';
import './styles.css';

const App = () => {
  const [gravity, setGravity] = useState(9.81); // m/s²
  const [mass1, setMass1] = useState(1); // kg
  const [mass2, setMass2] = useState(1); // kg
  const [damping, setDamping] = useState(0); // s⁻¹
  const [volume1, setVolume1] = useState(70);
  const [volume2, setVolume2] = useState(50);
  const [escala, setEscala] = useState('libre');
  const [disparo, setDisparo] = useState('continuo');
  const [trailLength, setTrailLength] = useState(3);
  const [mode, setMode] = useState('dobre');
  const [isSimulating, setIsSimulating] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [snapEnabled, setSnapEnabled] = useState(false);
  const [snapAnglesEnabled, setSnapAnglesEnabled] = useState(false);

  return (
    <PhysicsProvider initialState={{ gravity, mass1, mass2, damping, mode }} isSimulating={isSimulating}>
      <div className="fixed inset-0 bg-white flex flex-col font-sans text-slate-900 select-none overflow-hidden pt-[max(env(safe-area-inset-top,0px),38px)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
        <Header
          isSimulating={isSimulating}
          setIsSimulating={setIsSimulating}
          isMuted={isMuted}
          setIsMuted={setIsMuted}
          setGravity={setGravity}
          setMass1={setMass1}
          setMass2={setMass2}
          setDamping={setDamping}
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
            damping={damping}
            volume1={volume1}
            volume2={volume2}
            escala={escala}
            disparo={disparo}
            snapEnabled={snapEnabled}
            setSnapEnabled={setSnapEnabled}
            snapAnglesEnabled={snapAnglesEnabled}
            setSnapAnglesEnabled={setSnapAnglesEnabled}
          />

          <ControlPanel
            gravity={gravity}
            setGravity={setGravity}
            mass1={mass1}
            setMass1={setMass1}
            mass2={mass2}
            setMass2={setMass2}
            damping={damping}
            setDamping={setDamping}
            volume1={volume1}
            setVolume1={setVolume1}
            volume2={volume2}
            setVolume2={setVolume2}
            escala={escala}
            setEscala={setEscala}
            disparo={disparo}
            setDisparo={setDisparo}
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