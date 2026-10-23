import React, { useRef, useEffect, useCallback, useState } from 'react';
import { usePhysics } from '../hooks/usePhysics';
import { useAudio } from '../audio/useAudio';
import { usePendulumRenderer } from '../hooks/usePendulumRenderer';
import EnergyPanel from './EnergyPanel';
import PhasePanel from './PhasePanel';
import { avanzar, enerxia, novoMedidor, rexistrarPaso, reducirAngulo, PX_POR_METRO, SUBPASO } from '../physics/pendulum';
import { novoRexistro, engadirMostra, aCSV, nomeFicheiro, SUBPASOS_POR_MOSTRA } from '../physics/rexistro';
import { fmt } from '../utils/fmt';
import { claveSistema } from '../utils/canvas';
import { compartirFicheiro } from '../utils/exportar';

// Tope de tempo por fotograma, para non dar un salto ao volver dunha pestana en segundo plano
const MAX_DT_FOTOGRAMA = 0.05;

// Parámetros físicos (SI) a partir do estado do canvas (píxeles)
const paramsDe = (s) => ({
  // Sen segundo brazo (por exemplo, a medio crear) o dobre compórtase coma un simple
  modo: s.mode === 'fisico' ? 'fisico' : s.mode === 'dobre' && s.pendulum2.length > 0 ? 'dobre' : 'simple',
  L1: s.pendulum1.length / PX_POR_METRO,
  L2: s.pendulum2.length / PX_POR_METRO,
  m1: s.mass1,
  m2: s.mass2,
  g: s.gravity,
  b: s.damping ?? 0,
});

const estadoDe = (s) => ({
  θ1: s.pendulum1.angle,
  ω1: s.pendulum1.velocity,
  θ2: s.pendulum2.angle,
  ω2: s.pendulum2.velocity,
});

// Perturbación do péndulo de comparación, en rad
const DELTA_COMPARAR = 0.001;


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
  damping,
  volume1,
  volume2,
  escala,
  disparo,
  snapEnabled,
  setSnapEnabled,
  snapAnglesEnabled,
  setSnapAnglesEnabled
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const viewRef = useRef({ x: 0, y: 0, scale: 1 });
  const trailLengthRef = useRef(trailLength);
  const isSimulatingRef = useRef(isSimulating);
  const lastTimeRef = useRef(null);
  const [showData, setShowData] = useState(true);
  // Estado da interface que depende do motor; o bucle sincronízao só cando cambia
  const [ui, setUi] = useState({ haiPendulo: false, comparando: false });
  const uiRef = useRef(ui);
  const deltaRef = useRef(null);
  const ultimoDeltaRef = useRef(0);
  const accumulatorRef = useRef(0);

  const {
    engineRef,
    updatePendulumPositions,
    updateGravity,
    updateMass1,
    updateMass2,
    updateDamping,
    updateMode
  } = usePhysics();
  const { initAudio, updateAudio } = useAudio(isMuted, isSimulating, volume1, volume2, escala, disparo);
  const { render } = usePendulumRenderer(canvasRef, viewRef);

  useEffect(() => { trailLengthRef.current = trailLength; }, [trailLength]);
  useEffect(() => { isSimulatingRef.current = isSimulating; }, [isSimulating]);
  useEffect(() => { updateGravity(gravity); }, [gravity, updateGravity]);
  useEffect(() => { updateMass1(mass1); }, [mass1, updateMass1]);
  useEffect(() => { updateMass2(mass2); }, [mass2, updateMass2]);
  useEffect(() => { updateDamping(damping); }, [damping, updateDamping]);
  useEffect(() => { updateMode(mode); }, [mode, updateMode]);

  // Asegurar que o audio se inicializa cando se empeza a simular
  useEffect(() => {
    if (isSimulating) {
      initAudio();
    }
  }, [isSimulating, initAudio]);

  const getScreenPos = useCallback((e) => {
    if (!e.touches && e.nativeEvent) {
      return { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY };
    }
    if (!canvasRef.current) return { x: 0, y: 0 };
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

    if (mode === 'dobre' && s.pendulum2.length > 0) {
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
        if (canvasRef.current) canvasRef.current.style.cursor = target ? 'pointer' : 'default';
      } else {
        if (canvasRef.current) canvasRef.current.style.cursor = 'crosshair';
      }
      return;
    }

    if (s.dragTarget === 'zoom' && e.touches?.length === 2) {
      const d = getDist(
        { x: e.touches[0].clientX, y: e.touches[0].clientY },
        { x: e.touches[1].clientX, y: e.touches[1].clientY }
      );
      const ratio = d / s.lastPinchDist;
      
      // Calcular punto central del pellizco en coordenadas de pantalla
      const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      
      setView(prevView => {
        // Calcular punto en mundo antes del zoom
        const rect = canvasRef.current.getBoundingClientRect();
        const screenX = centerX - rect.left;
        const screenY = centerY - rect.top;
        const worldXBefore = (screenX - prevView.x) / prevView.scale;
        const worldYBefore = (screenY - prevView.y) / prevView.scale;
        
        // Aplicar zoom
        const newScale = Math.max(0.2, Math.min(4, prevView.scale * ratio));
        
        // Ajustar offset para mantener el punto central fijo
        const newView = {
          x: screenX - worldXBefore * newScale,
          y: screenY - worldYBefore * newScale,
          scale: newScale
        };
        
        viewRef.current = newView;
        return newView;
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

    // APLICAR SNAP TO GRID (posiciones)
    if (snapEnabled) {
      const gridSize = 50;
      worldPos.x = Math.round(worldPos.x / gridSize) * gridSize;
      worldPos.y = Math.round(worldPos.y / gridSize) * gridSize;
    }

    if (s.dragTarget === 'pivot') {
      s.pivot = worldPos;
      s.snapAngle1 = null;
      s.snapLength1 = null;
      s.snapAngle2 = null;
      s.snapLength2 = null;
    } else if (s.dragTarget === 'p1') {
      const dx = worldPos.x - s.pivot.x;
      const dy = worldPos.y - s.pivot.y;
      
      s.pendulum1.length = Math.max(20, Math.sqrt(dx * dx + dy * dy));
      s.pendulum1.angle = Math.atan2(dx, dy);
      s.pendulum1.velocity = 0;
      
      // Snap de ángulos y longitudes (solo en modo estático)
      if (snapAnglesEnabled && !isSimulatingRef.current) {
        const length = s.pendulum1.length;
        const snapLength = Math.round(length / 50) * 50;
        s.pendulum1.length = Math.max(50, snapLength);
        
        const angleFromVertical = s.pendulum1.angle;
        const snapAngle = Math.round(angleFromVertical / (Math.PI / 12)) * (Math.PI / 12);
        s.pendulum1.angle = snapAngle;
        
        s.snapLength1 = s.pendulum1.length;
        s.snapAngle1 = Math.round(((Math.PI / 2 - snapAngle) * 180) / Math.PI);
        
        console.log('📐 P1 ANGLE SNAP:', 'L=' + s.snapLength1, 'A=' + s.snapAngle1 + '°');
      } else {
        s.snapAngle1 = null;
        s.snapLength1 = null;
      }
      
      console.log('🖱️ DRAG P1:', 'snapGrid=' + snapEnabled, 'snapAngles=' + snapAnglesEnabled, 'sim=' + isSimulatingRef.current);
    } else if (s.dragTarget === 'p2') {
      const dx = worldPos.x - s.pendulum1.x;
      const dy = worldPos.y - s.pendulum1.y;
      
      s.pendulum2.length = Math.max(10, Math.sqrt(dx * dx + dy * dy));
      s.pendulum2.angle = Math.atan2(dx, dy);
      s.pendulum2.velocity = 0;
      
      // Snap de ángulos y longitudes (solo en modo estático)
      if (snapAnglesEnabled && !isSimulatingRef.current) {
        const length = s.pendulum2.length;
        const snapLength = Math.round(length / 50) * 50;
        s.pendulum2.length = Math.max(50, snapLength);
        
        const angleFromVertical = s.pendulum2.angle;
        const snapAngle = Math.round(angleFromVertical / (Math.PI / 12)) * (Math.PI / 12);
        s.pendulum2.angle = snapAngle;
        
        s.snapLength2 = s.pendulum2.length;
        s.snapAngle2 = Math.round(((Math.PI / 2 - snapAngle) * 180) / Math.PI);
        
        console.log('📐 P2 ANGLE SNAP:', 'L=' + s.snapLength2, 'A=' + s.snapAngle2 + '°');
      } else {
        s.snapAngle2 = null;
        s.snapLength2 = null;
      }
    }

    updatePendulumPositions();
    s.history = [];
  }, [engineRef, getScreenPos, toWorld, findTarget, updatePendulumPositions, snapEnabled, snapAnglesEnabled]);

  const handleEnd = useCallback(() => {
    const s = engineRef.current;
    if (!s.isDragging) return;

    if (s.dragTarget === 'p1') {
      if (mode !== 'dobre') {
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

  const alternarComparar = useCallback(() => {
    const s = engineRef.current;
    if (s.comparar) {
      s.comparar = null;
    } else if (s.pivot && s.mode === 'dobre') {
      const estado = estadoDe(s);
      s.comparar = { estado: { ...estado, θ2: estado.θ2 + DELTA_COMPARAR }, history: [] };
    }
  }, [engineRef]);

  const exportarCSV = useCallback(async () => {
    const s = engineRef.current;
    if (!s.rexistro || !s.params) return;
    try {
      await compartirFicheiro(nomeFicheiro(s.params), aCSV(s.rexistro));
    } catch (e) {
      // Pechar a folla de compartir sen escoller nada tamén chega aquí
      console.warn('Exportación cancelada ou fallida', e);
    }
  }, [engineRef]);

  const loop = useCallback(() => {
    const s = engineRef.current;
    const agora = performance.now();
    const dtReal = Math.min((agora - (lastTimeRef.current ?? agora)) / 1000, MAX_DT_FOTOGRAMA);
    lastTimeRef.current = agora;

    if (s.pivot) {
      const isDraggingAny = s.isDragging && s.dragTarget !== 'pan' && s.dragTarget !== 'zoom';

      const params = paramsDe(s);

      // O período mídese de novo se cambia a lonxitude, a gravidade ou o modo
      const claveMedida = `${params.modo}|${params.L1}|${params.g}`;
      if (!s.medidor || s.medidor.clave !== claveMedida || isDraggingAny) {
        s.medidor = { ...novoMedidor(), clave: claveMedida };
      }

      // Gravación para o CSV: unha por experimento, empeza de novo se cambia o sistema
      const claveRexistro = claveSistema(params);
      if (!s.rexistro || s.rexistro.clave !== claveRexistro || isDraggingAny) {
        s.rexistro = { ...novoRexistro(), clave: claveRexistro, subpasos: 0 };
        engadirMostra(s.rexistro, 0, estadoDe(s), enerxia(estadoDe(s), params));
      }

      // A comparación só ten sentido mentres non se toca o péndulo
      if (s.comparar && (params.modo !== 'dobre' || isDraggingAny)) s.comparar = null;

      if (isSimulatingRef.current && !isDraggingAny) {
        const estado = estadoDe(s);
        if (s.comparar) {
          // Mesmo acumulador có principal: os dous dan exactamente os mesmos subpasos
          s.comparar.estado = avanzar(s.comparar.estado, params, dtReal, accumulatorRef.current).estado;
        }
        const rexistro = s.rexistro;
        const mostrear = (e) => {
          rexistro.subpasos++;
          if (rexistro.subpasos % SUBPASOS_POR_MOSTRA === 0) {
            engadirMostra(rexistro, rexistro.subpasos * SUBPASO, e, enerxia(e, params));
          }
        };
        const res = avanzar(estado, params, dtReal, accumulatorRef.current, SUBPASO, mostrear);
        // Tempo simulado exacto: o consumido polos subpasos neste fotograma
        const tAnterior = s.tempo;
        s.tempo += dtReal + accumulatorRef.current - res.acumulado;
        accumulatorRef.current = res.acumulado;

        s.medidor = {
          ...rexistrarPaso(s.medidor, estado.θ1, res.estado.θ1, tAnterior, s.tempo),
          clave: claveMedida,
        };

        s.pendulum1.angle = res.estado.θ1;
        s.pendulum1.velocity = res.estado.ω1;
        s.pendulum2.angle = res.estado.θ2;
        s.pendulum2.velocity = res.estado.ω2;
      } else {
        accumulatorRef.current = 0;
      }

      s.params = params;
      s.enerxia = enerxia(estadoDe(s), params);

      updatePendulumPositions();

      if (isSimulatingRef.current && !s.isDragging) {
        s.history.push({ x: s.pendulum2.x, y: s.pendulum2.y });
        if (s.history.length > trailLengthRef.current) {
          s.history.splice(0, s.history.length - trailLengthRef.current);
        }
      }

      if (s.comparar) {
        const c = s.comparar;
        const { θ1, θ2 } = c.estado;
        const x1 = s.pivot.x + s.pendulum1.length * Math.sin(θ1);
        const y1 = s.pivot.y + s.pendulum1.length * Math.cos(θ1);
        c.p1 = { x: x1, y: y1 };
        c.p2 = { x: x1 + s.pendulum2.length * Math.sin(θ2), y: y1 + s.pendulum2.length * Math.cos(θ2) };
        if (isSimulatingRef.current) {
          c.history.push(c.p2);
          if (c.history.length > trailLengthRef.current) {
            c.history.splice(0, c.history.length - trailLengthRef.current);
          }
        }
        if (deltaRef.current && agora - ultimoDeltaRef.current > 100) {
          ultimoDeltaRef.current = agora;
          const delta = Math.abs(reducirAngulo(s.pendulum2.angle - θ2)) * 180 / Math.PI;
          deltaRef.current.textContent = `Δθ₂ ${fmt(delta, delta < 1 ? 3 : 0)}°`;
        }
      }

    }
    const novaUi = { haiPendulo: !!s.pivot, comparando: !!s.comparar };
    if (novaUi.haiPendulo !== uiRef.current.haiPendulo || novaUi.comparando !== uiRef.current.comparando) {
      uiRef.current = novaUi;
      setUi(novaUi);
    }

    updateAudio(s);
    render(s, s.mode, trailLengthRef.current, snapAnglesEnabled, isSimulatingRef.current);
  }, [engineRef, updatePendulumPositions, updateAudio, render, snapAnglesEnabled]);

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

        {showData && (
          <div className="absolute top-3 left-3 w-44 flex flex-col gap-2 pointer-events-none z-20">
            <EnergyPanel />
            <PhasePanel />
          </div>
        )}

        {/* Botón de datos (enerxía, período e espazo de fases) */}
        <button
          onClick={() => setShowData(!showData)}
          className={`absolute top-4 right-36 p-3 rounded-full shadow-md border active:scale-95 transition-all z-30 ${showData ? 'bg-slate-700 text-white border-slate-800' : 'bg-white/90 backdrop-blur border-slate-200 text-slate-500 hover:text-slate-700'}`}
          title={showData ? 'Ocultar datos' : 'Amosar datos'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        </button>

        {ui.haiPendulo && (
          <button
            onClick={exportarCSV}
            className="absolute top-20 right-4 p-3 rounded-full shadow-md border active:scale-95 transition-all z-30 bg-white/90 backdrop-blur border-slate-200 text-slate-500 hover:text-slate-700"
            title="Exportar CSV (t, θ, ω, enerxías)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>
        )}

        {mode === 'dobre' && ui.haiPendulo && (
          <button
            onClick={alternarComparar}
            className={`absolute top-36 right-4 px-4 py-2 rounded-full shadow-md border active:scale-95 transition-all z-30 text-sm font-bold ${ui.comparando ? 'bg-amber-500 text-white border-amber-600' : 'bg-white/90 backdrop-blur border-slate-200 text-slate-600'}`}
            title="Engade un segundo péndulo con θ₂ + 0,001 rad"
          >
            {ui.comparando ? <span ref={deltaRef} className="font-mono tabular-nums">Δθ₂ 0,057°</span> : 'Comparar'}
          </button>
        )}

        {/* Botón de Snap to Grid - MORADO */}
        <button
          onClick={() => setSnapEnabled(!snapEnabled)}
          className={`absolute top-4 right-4 p-3 rounded-full shadow-md border active:scale-95 transition-all z-30 ${snapEnabled ? 'bg-purple-600 text-white border-purple-700 shadow-purple-200' : 'bg-white/90 backdrop-blur border-slate-200 text-slate-500 hover:text-purple-600'}`}
          title={snapEnabled ? "Desactivar axuste á cuadrícula" : "Activar axuste á cuadrícula"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="3" y1="9" x2="21" y2="9"></line>
            <line x1="3" y1="15" x2="21" y2="15"></line>
            <line x1="9" y1="3" x2="9" y2="21"></line>
            <line x1="15" y1="3" x2="15" y2="21"></line>
          </svg>
        </button>

        {/* Botón de Snap de Ángulos - AZUL */}
        <button
          onClick={() => setSnapAnglesEnabled(!snapAnglesEnabled)}
          className={`absolute top-4 right-20 p-3 rounded-full shadow-md border active:scale-95 transition-all z-30 ${snapAnglesEnabled ? 'bg-blue-600 text-white border-blue-700 shadow-blue-200' : 'bg-white/90 backdrop-blur border-slate-200 text-slate-500 hover:text-blue-600'}`}
          title={snapAnglesEnabled ? "Desactivar axuste de ángulos" : "Activar axuste de ángulos (15° e lonxitudes de 0,25 m)"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
          </svg>
        </button>

        {showInstructions && (
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl my-auto">
              <div className="text-center mb-6">
                <h3 className="text-3xl font-pendugal text-blue-800 mb-1">PenduGalSon</h3>
                <p className="text-sm font-medium text-slate-400 italic">Máquina de ritmo cinético e harmonía gravitatoria</p>
              </div>

              <div className="text-slate-600 space-y-4 text-sm sm:text-base leading-relaxed mb-8 text-center sm:text-left">
                <p>
                  Nesta singular estancia sonora, as leis de Newton danse a man coa melodía do éter.
                  Ao trazar o movemento no lenzo, invocamos forzas invisibles que transforman a xeometría en vibración.
                </p>
                <p>
                  Cada oscilación é un testemuño do equilibrio entre a orde matemática e o azar primordial,
                  unha viaxe sensorial polas estelas que deixa a gravidade no espazo-tempo.
                </p>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="font-bold text-slate-800 mb-2 flex items-center gap-2 justify-center sm:justify-start">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11l5 3V15Z" /></svg>
                    Tradución sonara de forzas:
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-1 text-sm">
                    <li>O <span className="font-bold">movemento lateral</span> dita o ton e o pulso.</li>
                    <li>A <span className="font-bold">caída vertical</span> modula a intensidade da voz.</li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <button
                  onClick={() => { initAudio(); setShowInstructions(false); }}
                  className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl active:scale-95 transition-transform shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
                >
                  Continuar Experimento
                </button>

                <div className="text-center pt-2 border-t border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Autoría e Credenciais</p>
                  <p className="text-sm font-bold text-slate-800">© Toño Pita 2026</p>
                  <a href="mailto:tonetxo@gmail.com" className="text-xs text-blue-500 hover:underline">tonetxo@gmail.com</a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PendulumCanvas;