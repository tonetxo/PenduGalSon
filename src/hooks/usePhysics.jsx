import { useRef, useContext, createContext, useCallback, useMemo } from 'react';

const PhysicsContext = createContext();

export const usePhysics = () => {
  const context = useContext(PhysicsContext);
  if (!context) {
    throw new Error('usePhysics must be used within a PhysicsProvider');
  }
  return context;
};

export const PhysicsProvider = ({ children, initialState, isSimulating }) => {
  const engineRef = useRef({
    pivot: null,
    pendulum1: { angle: Math.PI / 4, velocity: 0, length: 200, x: 0, y: 0 },
    pendulum2: { angle: Math.PI / 4, velocity: 0, length: 0, x: 0, y: 0 },
    isDragging: false,
    dragTarget: null,
    dragStep: 0,
    history: [],
    lastMouse: { x: 0, y: 0 },
    lastPinchDist: 0,
    view: { x: 0, y: 0, scale: 1 },
    dpr: 1,
    damping: 0,
    tempo: 0, // s simulados
    enerxia: null,
    medidor: null,
    comparar: null, // péndulo de comparación (sensibilidade ao caos)
    rexistro: null, // datos gravados para exportar en CSV
    snapAngle1: null,
    snapLength1: null,
    snapAngle2: null,
    snapLength2: null,
    ...initialState
  });

  const updatePendulumPositions = useCallback(() => {
    const s = engineRef.current;
    if (s.pivot) {
      s.pendulum1.x = s.pivot.x + s.pendulum1.length * Math.sin(s.pendulum1.angle);
      s.pendulum1.y = s.pivot.y + s.pendulum1.length * Math.cos(s.pendulum1.angle);

      if (s.pendulum2) {
        s.pendulum2.x = s.pendulum1.x + s.pendulum2.length * Math.sin(s.pendulum2.angle);
        s.pendulum2.y = s.pendulum1.y + s.pendulum2.length * Math.cos(s.pendulum2.angle);
      }
    }
  }, []);

  const resetSimulation = useCallback(() => {
    const s = engineRef.current;
    s.pivot = null;
    s.history = [];
    s.pendulum1 = { angle: Math.PI / 4, velocity: 0, length: 200, x: 0, y: 0 };
    s.pendulum2 = { angle: Math.PI / 4, velocity: 0, length: 0, x: 0, y: 0 };
    s.dragStep = 0;
    s.isDragging = false;
    s.dragTarget = null;
    s.tempo = 0;
    s.enerxia = null;
    s.medidor = null;
    s.comparar = null;
    s.rexistro = null;
  }, []);

  const updateGravity = useCallback((g) => { engineRef.current.gravity = g; }, []);
  const updateMass1 = useCallback((m) => { engineRef.current.mass1 = m; }, []);
  const updateMass2 = useCallback((m) => { engineRef.current.mass2 = m; }, []);
  const updateDamping = useCallback((b) => { engineRef.current.damping = b; }, []);
  const updateMode = useCallback((m) => {
    const s = engineRef.current;
    s.mode = m;
    // Se cambiamos a modo dobre cun péndulo existente, inicializar pendulum2
    if (m === 'dobre' && s.pivot && s.pendulum2.length === 0) {
      s.pendulum2.length = 100;
      s.pendulum2.angle = s.pendulum1.angle;
      s.pendulum2.velocity = 0;
      // Actualizar posicións
      s.pendulum2.x = s.pendulum1.x + s.pendulum2.length * Math.sin(s.pendulum2.angle);
      s.pendulum2.y = s.pendulum1.y + s.pendulum2.length * Math.cos(s.pendulum2.angle);
    }
  }, []);

  const value = useMemo(() => ({
    engineRef,
    updatePendulumPositions,
    resetSimulation,
    isSimulating,
    updateGravity,
    updateMass1,
    updateMass2,
    updateDamping,
    updateMode
  }), [
    updatePendulumPositions,
    resetSimulation,
    isSimulating,
    updateGravity,
    updateMass1,
    updateMass2,
    updateDamping,
    updateMode
  ]);

  return (
    <PhysicsContext.Provider value={value}>
      {children}
    </PhysicsContext.Provider>
  );
};