import React, { useRef, useEffect, useCallback, useState } from 'react';
import { usePhysics } from '../hooks/usePhysics';
import { useAudio } from '../audio/useAudio';
import { usePendulumRenderer } from '../hooks/usePendulumRenderer';

const PendulumCanvas = ({
  isSimulating,
  setIsSimulating,
  mode,
  trailLength,
  isMuted,
  showInstructions,
  setShowInstructions,
  gravity,
  mass1,
  mass2,
  volume1,
  volume2,
  snapEnabled,
  setSnapEnabled
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const viewRef = useRef({ x: 0, y: 0, scale: 1 });
  const trailLengthRef = useRef(trailLength);

  const {
    engineRef,
    updatePendulumPositions,
    updateGravity,
    updateMass1,
    updateMass2,
    updateMode
  } = usePhysics();
  const { initAudio, updateAudio } = useAudio(isMuted, isSimulating, volume1, volume2);
  const { render } = usePendulumRenderer(canvasRef, viewRef);

  useEffect(() => { trailLengthRef.current = trailLength; }, [trailLength]);
  useEffect(() => { updateGravity(gravity); }, [gravity, updateGravity]);
  useEffect(() => { updateMass1(mass1); }, [mass1, updateMass1]);
  useEffect(() => { updateMass2(mass2); }, [mass2, updateMass2]);
  useEffect(() => { updateMode(mode); }, [mode, updateMode]);

  const getScreenPos = useCallback((e) => {
    if (!e.touches && e.nativeEvent) {
      return { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY };
    }
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  }, []);

  const toWorld = useCallback((screenX, screenY) => {
    const { x, y, scale } = viewRef.current;
    return { x: (screenX - x) / scale, y: (screenY - y) / scale };
  }, [viewRef]);

  const getDist = useCallback((a, b) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2), []);

  const findTarget = useCallback((worldPos, hitRadius) => {
    const s = engineRef.current;
    if (!s.pivot) return null;

    const candidates = [
      { id: 'pivot', pos: s.pivot, dist: getDist(worldPos, s.pivot) },
      { id: 'p1', pos: s.pendulum1, dist: getDist(worldPos, s.pendulum1) },
    ];

    if (mode === 'compound' && s.pendulum2.length > 0) {
      candidates.push({ id: 'p2', pos: s.pendulum2, dist: getDist(worldPos, s.pendulum2) });
    }

    const matches = candidates
      .filter(c => c.dist <= hitRadius)
      .sort((a, b) => a.dist - b.dist);

    if (matches.length > 0) return matches[0].id;
    return null;
  }, [mode, getDist, engineRef]);

  const handleStart = useCallback(async (e) => {
    if (e.cancelable) e.preventDefault();
    const s = engineRef.current;

    if (e.touches && e.touches.length === 2) {
      s.dragTarget = 'zoom';
      s.lastPinchDist = getDist(
        { x: e.touches[0].clientX, y: e.touches[0].clientY },
        { x: e.touches[1].clientX, y: e.touches[1].clientY }
      );
      return;
    }

    const screenPos = getScreenPos(e);
    const worldPos = toWorld(screenPos.x, screenPos.y);
    const hitRadius = 50 / viewRef.current.scale;

    if (s.pivot) {
      const target = findTarget(worldPos, hitRadius);
      if (target) {
        if (target === 'create_p2') {
          s.dragTarget = 'p2';
          s.dragStep = 2;
        } else {
          s.dragTarget = target;
        }
        s.isDragging = true;
        s.history = [];
        // Pausar a simulación cando se arrastra calquera elemento do péndulo
        if (target !== 'pan' && target !== 'zoom') {
          setIsSimulating(false);
        }
        return;
      }
    }

    if (!s.pivot) {
      s.pivot = worldPos;
      s.dragStep = 1;
      s.dragTarget = 'p1';
      s.isDragging = true;
      s.history = [];
      // Pausar a simulación mentres se crea o péndulo
      setIsSimulating(false);
      setShowInstructions(false);
    } else {
      s.dragTarget = 'pan';
      s.isDragging = true;
      s.lastMouse = { x: screenPos.x, y: screenPos.y };
    }
  }, [engineRef, getScreenPos, toWorld, findTarget, setShowInstructions, setIsSimulating]);

  const handleMove = useCallback((e) => {
    const s = engineRef.current;
    const screenPos = getScreenPos(e);
    const worldPos = toWorld(screenPos.x, screenPos.y);

    if (!s.isDragging) {
      const hitRadius = 50 / viewRef.current.scale;
      if (s.pivot) {
        const target = findTarget(worldPos, hitRadius);
        canvasRef.current.style.cursor = target ? 'pointer' : 'default';
      } else {
        canvasRef.current.style.cursor = 'crosshair';
      }
      return;
    }

    if (s.dragTarget === 'zoom' && e.touches?.length === 2) {
      const d = getDist(
        { x: e.touches[0].clientX, y: e.touches[0].clientY },
        { x: e.touches[1].clientX, y: e.touches[1].clientY }
      );
      const ratio = d / s.lastPinchDist;
      setView(prevView => {
        const next = { ...prevView, scale: Math.max(0.2, Math.min(4, prevView.scale * ratio)) };
        viewRef.current = next;
        return next;
      });
      s.lastPinchDist = d;
      return;
    }

    if (s.dragTarget === 'pan') {
      const dx = screenPos.x - s.lastMouse.x;
      const dy = screenPos.y - s.lastMouse.y;
      setView(prevView => {
        const next = { ...prevView, x: prevView.x + dx, y: prevView.y + dy };
        viewRef.current = next;
        return next;
      });
      s.lastMouse = { x: screenPos.x, y: screenPos.y };
      return;
    }

    // APLICAR SNAP TO GRID
    if (snapEnabled) {
      const gridSize = 50;
      worldPos.x = Math.round(worldPos.x / gridSize) * gridSize;
      worldPos.y = Math.round(worldPos.y / gridSize) * gridSize;
    }

    if (s.dragTarget === 'pivot') {
      s.pivot = worldPos;
    } else if (s.dragTarget === 'p1') {
      const dx = worldPos.x - s.pivot.x;
      const dy = worldPos.y - s.pivot.y;
      s.pendulum1.length = Math.max(20, Math.sqrt(dx * dx + dy * dy));
      s.pendulum1.angle = Math.atan2(dx, dy);
      s.pendulum1.velocity = 0;
    } else if (s.dragTarget === 'p2') {
      const dx = worldPos.x - s.pendulum1.x;
      const dy = worldPos.y - s.pendulum1.y;
      s.pendulum2.length = Math.max(10, Math.sqrt(dx * dx + dy * dy));
      s.pendulum2.angle = Math.atan2(dx, dy);
      s.pendulum2.velocity = 0;
    }

    updatePendulumPositions();
    s.history = [];
  }, [engineRef, getScreenPos, toWorld, findTarget, updatePendulumPositions]);

  const handleEnd = useCallback(() => {
    const s = engineRef.current;
    if (!s.isDragging) return;

    if (s.dragTarget === 'p1') {
      if (mode === 'simple') {
        if (s.dragStep === 1) {
          // Iniciar simulación automaticamente ao completar a creación
          setIsSimulating(true);
        }
        s.dragStep = 2;
      } else {
        if (s.dragStep === 1) {
          s.pendulum2.length = 100;
          s.pendulum2.angle = s.pendulum1.angle;
          s.pendulum2.velocity = 0;
          updatePendulumPositions();
          s.dragStep = 2;
          // Iniciar simulación automaticamente ao completar a creación
          setIsSimulating(true);
        }
      }
    }

    s.isDragging = false;
    s.dragTarget = null;
  }, [engineRef, mode, updatePendulumPositions, setIsSimulating]);

  const loop = useCallback(() => {
    const s = engineRef.current;
    if (s.pivot) {
      if (isSimulating) {
        const dt = 0.2;
        const g = s.gravity * 0.15;
        const isDraggingAny = s.isDragging && s.dragTarget !== 'pan' && s.dragTarget !== 'zoom';

        if (!isDraggingAny) {
          if (s.mode === 'simple') {
            const accel = -(g / s.pendulum1.length) * Math.sin(s.pendulum1.angle);
            s.pendulum1.velocity += accel * dt;
            s.pendulum1.angle += s.pendulum1.velocity * dt;
            s.pendulum1.velocity *= 0.998;
          } else {
            const m1 = s.mass1, m2 = s.mass2, l1 = s.pendulum1.length, l2 = s.pendulum2.length;
            const a1 = s.pendulum1.angle, a2 = s.pendulum2.angle, v1 = s.pendulum1.velocity, v2 = s.pendulum2.velocity;

            const den = l1 * (2 * m1 + m2 - m2 * Math.cos(2 * a1 - 2 * a2));
            if (den !== 0 && Number.isFinite(den)) {
              const a1_acc = (-g * (2 * m1 + m2) * Math.sin(a1) - m2 * g * Math.sin(a1 - 2 * a2) - 2 * Math.sin(a1 - a2) * m2 * (v2 * v2 * l2 + v1 * v1 * l1 * Math.cos(a1 - a2))) / den;
              const a2_acc = (2 * Math.sin(a1 - a2) * (v1 * v1 * l1 * (m1 + m2) + g * (m1 + m2) * Math.cos(a1) + v2 * v2 * l2 * m2 * Math.cos(a1 - a2))) / (l2 * (2 * m1 + m2 - m2 * Math.cos(2 * a1 - 2 * a2)));

              const safeA1Acc = Math.max(-10, Math.min(10, a1_acc));
              const safeA2Acc = Math.max(-10, Math.min(10, a2_acc));

              // Validar que os cálculos son estables
              if (Number.isFinite(safeA1Acc) && Number.isFinite(safeA2Acc)) {
                s.pendulum1.velocity += safeA1Acc * dt;
                s.pendulum2.velocity += safeA2Acc * dt;
                s.pendulum1.angle += s.pendulum1.velocity * dt;
                s.pendulum2.angle += s.pendulum2.velocity * dt;

                s.pendulum1.velocity = Math.max(-2, Math.min(2, s.pendulum1.velocity));
                s.pendulum2.velocity = Math.max(-3, Math.min(3, s.pendulum2.velocity));
              } else {
                // Reiniciar velocidades se o cálculo é inestable
                s.pendulum1.velocity = 0;
                s.pendulum2.velocity = 0;
              }
            }
          }
        }
      }

      updatePendulumPositions();

      if (isSimulating && !s.isDragging) {
        s.history.push({ x: s.pendulum2.x, y: s.pendulum2.y });
        if (s.history.length > trailLengthRef.current) {
          s.history.splice(0, s.history.length - trailLengthRef.current);
        }
      }

    }
    updateAudio(s);
    render(s, s.mode, trailLengthRef.current);
  }, [engineRef, isSimulating, updatePendulumPositions, updateAudio, render]);

  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !canvasRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvasRef.current.style.width = `${rect.width}px`;
      canvasRef.current.style.height = `${rect.height}px`;
      canvasRef.current.width = rect.width * dpr;
      canvasRef.current.height = rect.height * dpr;

      const ctx = canvasRef.current.getContext('2d');
      ctx.scale(dpr, dpr);
      engineRef.current.dpr = dpr;
    };

    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) resizeObserver.observe(containerRef.current);

    window.addEventListener('resize', handleResize);
    setTimeout(handleResize, 0);

    // Iniciar o bucle de animación
    let animationFrameId;
    const startLoop = () => {
      loop();
      animationFrameId = requestAnimationFrame(startLoop);
    };
    startLoop();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
    };
  }, [loop, engineRef]);

  useEffect(() => {
    const handleGlobalEnd = () => handleEnd();
    window.addEventListener('mouseup', handleGlobalEnd);
    window.addEventListener('touchend', handleGlobalEnd, { passive: false });
    return () => {
      window.removeEventListener('mouseup', handleGlobalEnd);
      window.removeEventListener('touchend', handleGlobalEnd);
    };
  }, [handleEnd]);

  return (
    <div className="flex-1 relative flex overflow-hidden">
      <div className="flex-1 relative bg-slate-50" ref={containerRef}>
        <canvas
          ref={canvasRef}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
          className="absolute inset-0 w-full h-full touch-none cursor-default"
        />

        {/* Botón de Snap to Grid */}
        <button
          onClick={() => setSnapEnabled(!snapEnabled)}
          className={`absolute top-4 right-4 p-3 rounded-full shadow-md border active:scale-95 transition-all z-30 ${snapEnabled ? 'bg-blue-600 text-white border-blue-700 shadow-blue-200' : 'bg-white/90 backdrop-blur border-slate-200 text-slate-500 hover:text-blue-600'}`}
          title={snapEnabled ? "Desactivar Axuste a Cadrícula" : "Activar Axuste a Cadrícula"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.5 5h7c.276 0 .5.224.5.5v7c0 .276-.224.5-.5.5h-7a.5.5 0 0 1-.5-.5v-7c0-.276.224-.5.5-.5Z"></path>
            <path d="M12.5 13h7c.276 0 .5.224.5.5v3.5c0 .276-.224.5-.5.5h-7a.5.5 0 0 1-.5-.5v-3.5c0-.276.224-.5.5-.5Z"></path>
            <path d="M11 13H4a.5.5 0 0 1-.5-.5v-3.5c0-.276.224-.5.5-.5h7c.276 0 .5.224.5.5v3.5c0 .276-.224.5-.5.5Z"></path>
            <path d="M11 5H4a.5.5 0 0 1-.5-.5v-1c0-.276.224-.5.5-.5h7c.276 0 .5.224.5.5v1c0 .276-.224.5-.5.5Z"></path>
          </svg>
        </button>

        {showInstructions && (
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl">
              <h3 className="text-2xl font-black mb-2">Composición Gravitatoria</h3>
              <p className="text-sm text-slate-500 mb-8 leading-relaxed">Arrastra no lenzo para crear. Preme 'Parar' para editar calquera parte do péndulo sen que se mova.</p>
              <button
                onClick={() => { initAudio(); setShowInstructions(false); }}
                className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl active:scale-95 transition-transform shadow-lg shadow-blue-200"
              >
                Comezar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PendulumCanvas;