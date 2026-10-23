import { useCallback } from 'react';
import { PX_POR_METRO } from '../physics/pendulum';
import { fmt } from '../utils/fmt';

// Radio da bóla en px segundo a masa en kg (o volume crece coa masa)
const radioBola = (masa) => 8 + 6 * Math.cbrt(masa);

// Grosor da barra do péndulo físico en px segundo a súa masa en kg
const grosorBarra = (masa) => 6 + 4 * Math.cbrt(masa);

// Rastro con opacidade segundo a idade (en segundos simulados) de cada punto.
// Agrúpase en tramos para non facer un stroke por segmento.
const TRAMOS_RASTRO = 24;
function drawTrail(ctx, history, tempo, duracion, rgb, alphaMax, width) {
  if (history.length < 2 || duracion <= 0) return;
  ctx.save();
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  // Puntas planas: as redondas solapan nas unións dos tramos e deixan puntos máis opacos
  ctx.lineCap = 'butt';
  const n = history.length;
  let inicio = 0;
  for (let k = 1; k <= TRAMOS_RASTRO; k++) {
    const fin = k === TRAMOS_RASTRO ? n - 1 : Math.round((k * (n - 1)) / TRAMOS_RASTRO);
    if (fin <= inicio) continue;
    // Idade do punto medio do tramo: 0 = novo, 1 = a piques de desaparecer
    const medio = history[(inicio + fin) >> 1];
    const idade = Math.min(1, Math.max(0, (tempo - medio.t) / duracion));
    ctx.strokeStyle = `rgba(${rgb}, ${(alphaMax * (1 - idade) ** 1.5).toFixed(3)})`;
    ctx.beginPath();
    ctx.moveTo(history[inicio].x, history[inicio].y);
    for (let i = inicio + 1; i <= fin; i++) ctx.lineTo(history[i].x, history[i].y);
    ctx.stroke();
    inicio = fin;
  }
  ctx.restore();
}

export const usePendulumRenderer = (canvasRef, view) => {
  const drawRingAnchor = useCallback((ctx, p, r, scale, active) => {
    const rad = r / scale;
    // Sombra
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 5;

    // Aro exterior
    const gradRing = ctx.createRadialGradient(
      p.x - rad * 0.5,
      p.y - rad * 0.5,
      rad * 0.2,
      p.x,
      p.y,
      rad
    );
    gradRing.addColorStop(0, '#e2e8f0');
    gradRing.addColorStop(0.5, '#64748b');
    gradRing.addColorStop(1, '#1e293b');

    ctx.beginPath();
    ctx.arc(p.x, p.y, rad, 0, Math.PI * 2, false); // Exterior
    ctx.arc(p.x, p.y, rad * 0.4, 0, Math.PI * 2, true); // Agujero interior
    ctx.fillStyle = gradRing;
    ctx.fill();
    ctx.restore();

    // Aro de selección
    if (active) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, rad + 5 / scale, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(30, 58, 138, 0.8)'; // Darker blue selection
      ctx.lineWidth = 2 / scale;
      ctx.stroke();
    }
  }, []);

  const drawMetallicBall = useCallback((ctx, p, r, colorHue, scale, active) => {
    const rad = r / scale;

    // Sombra de la esfera
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;

    // Gradiente Esférico
    const grad = ctx.createRadialGradient(
      p.x - rad * 0.3,
      p.y - rad * 0.3,
      rad * 0.1,
      p.x,
      p.y,
      rad
    );

    if (colorHue === 'blue') {
      grad.addColorStop(0, '#bfdbfe'); // Brillo especular
      grad.addColorStop(0.4, '#3b82f6'); // Color base
      grad.addColorStop(1, '#172554'); // Sombra propia
    } else { // Purple
      grad.addColorStop(0, '#e9d5ff');
      grad.addColorStop(0.4, '#9333ea');
      grad.addColorStop(1, '#581c87');
    }

    ctx.beginPath();
    ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();

    // Anillo de selección - CAMBIADO A GRIS OSCURO
    if (active) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, rad + 5 / scale, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.6)'; // Gris Pizarra Oscuro
      ctx.lineWidth = 2 / scale;
      ctx.stroke();
    }
  }, []);

  // Barra ríxida do péndulo físico, coa marca do centro de masas (CM) no medio
  const drawRod = useCallback((ctx, from, to, mass, scale, active) => {
    const ancho = grosorBarra(mass);
    const grad = ctx.createLinearGradient(from.x, from.y, to.x, to.y);
    grad.addColorStop(0, '#1e40af');
    grad.addColorStop(1, '#3b82f6');
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = grad;
    ctx.lineWidth = ancho;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();

    // Brillo para que pareza metálica
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = ancho * 0.25;
    ctx.stroke();

    const cm = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5 / scale;
    ctx.beginPath();
    ctx.arc(cm.x, cm.y, 4 / scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#0f172a';
    ctx.font = `bold ${10 / scale}px monospace`;
    ctx.textAlign = 'left';
    ctx.fillText('CM', cm.x + 8 / scale, cm.y + 3 / scale);

    // Asa no extremo para arrastrar
    if (active) {
      ctx.beginPath();
      ctx.arc(to.x, to.y, ancho / 2 + 5 / scale, 0, Math.PI * 2);
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2 / scale;
      ctx.stroke();
    }
    ctx.restore();
  }, []);

  const drawGrid = useCallback((ctx, width, height, scale, offsetX, offsetY) => {
    const gridSize = 50;

    const startX = Math.floor(-offsetX / scale / gridSize) * gridSize;
    const endX = Math.ceil((width - offsetX) / scale / gridSize) * gridSize;
    const startY = Math.floor(-offsetY / scale / gridSize) * gridSize;
    const endY = Math.ceil((height - offsetY) / scale / gridSize) * gridSize;

    ctx.beginPath();
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 0.5 / scale;

    for (let x = startX; x <= endX; x += gridSize) {
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
    }
    for (let y = startY; y <= endY; y += gridSize) {
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
    }
    ctx.stroke();
  }, []);

  const drawAngleIndicator = useCallback((ctx, origin, angle, color, scale) => {
    const arcRadius = 50 / scale;
    const labelRadius = 65 / scale;
    const directionInCanvas = Math.PI / 2 - angle;
    
    ctx.beginPath();
    if (directionInCanvas >= 0) {
      ctx.arc(origin.x, origin.y, arcRadius, 0, directionInCanvas, false);
    } else {
      ctx.arc(origin.x, origin.y, arcRadius, 0, directionInCanvas, true);
    }
    ctx.strokeStyle = color + 'B3';
    ctx.lineWidth = 2 / scale;
    ctx.setLineDash([5 / scale, 3 / scale]);
    ctx.stroke();
    ctx.setLineDash([]);
    
    const angleDegrees = Math.round((directionInCanvas * 180) / Math.PI);
    const midAngle = directionInCanvas / 2;
    const labelX = origin.x + labelRadius * Math.cos(midAngle);
    const labelY = origin.y + labelRadius * Math.sin(midAngle);
    
    ctx.font = `${12 / scale}px monospace`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${angleDegrees}°`, labelX, labelY);
  }, []);

  const drawLengthIndicator = useCallback((ctx, startX, startY, endX, endY, length, color, scale) => {
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    
    ctx.beginPath();
    ctx.arc(midX, midY, 3 / scale, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    
    ctx.font = `${11 / scale}px monospace`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    
    const dx = endX - startX;
    const dy = endY - startY;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > 0) {
      const perpX = -dy / len;
      const perpY = dx / len;
      ctx.fillText(`${fmt(length / PX_POR_METRO)} m`, midX + perpX * 15, midY + perpY * 15);
    }
  }, []);

  const render = useCallback((state, mode, trailLength, snapAnglesEnabled, isSimulating) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const { x, y, scale } = view.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // DIBUJAR CUADRÍCULA (GRID)
    drawGrid(ctx, canvas.width, canvas.height, scale, x, y);

    if (state.pivot) {
      // ESTELA: desvanécese coa idade de cada punto, ao longo do propio camiño
      if (mode === 'dobre') {
        drawTrail(ctx, state.history, state.tempo, trailLength, '147, 81, 234', 0.7, 3 / scale);
      }

      // PÉNDULO DE COMPARACIÓN (semitransparente, por debaixo do principal)
      const c = state.comparar;
      if (mode === 'dobre' && c?.p2) {
        ctx.save();
        drawTrail(ctx, c.history, state.tempo, trailLength, '245, 158, 11', 0.55, 2 / scale);
        ctx.globalAlpha = 0.4;
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 3 / scale;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(state.pivot.x, state.pivot.y);
        ctx.lineTo(c.p1.x, c.p1.y);
        ctx.lineTo(c.p2.x, c.p2.y);
        ctx.stroke();
        drawMetallicBall(ctx, c.p1, radioBola(state.mass1), 'blue', scale, false);
        drawMetallicBall(ctx, c.p2, radioBola(state.mass2), 'purple', scale, false);
        ctx.restore();
      }

      // BRAZOS METÁLICOS
      ctx.lineCap = 'round';
      ctx.lineWidth = 3 / scale;
      // Gradiente para la cuerda
      const stringGrad = ctx.createLinearGradient(
        state.pivot.x,
        state.pivot.y,
        state.pendulum2.x,
        state.pendulum2.y
      );
      stringGrad.addColorStop(0, '#94a3b8');
      stringGrad.addColorStop(0.5, '#cbd5e1');
      stringGrad.addColorStop(1, '#94a3b8');
      ctx.strokeStyle = stringGrad;

      if (mode === 'fisico') {
        drawRod(ctx, state.pivot, state.pendulum1, state.mass1, scale, state.dragTarget === 'p1');
      } else {
        ctx.beginPath();
        ctx.moveTo(state.pivot.x, state.pivot.y);
        ctx.lineTo(state.pendulum1.x, state.pendulum1.y);
        if (mode === 'dobre' && state.pendulum2.length > 0) {
          ctx.lineTo(state.pendulum2.x, state.pendulum2.y);
        }
        ctx.stroke();
      }

      // PIVOTE ARO (Ring Anchor)
      const isPivotActive = state.dragTarget === 'pivot';
      drawRingAnchor(ctx, state.pivot, 12, scale, isPivotActive);

      // MASAS 3D (Metallic Spheres)
      const isP1Active = state.dragTarget === 'p1';
      if (mode !== 'fisico') {
        drawMetallicBall(ctx, state.pendulum1, radioBola(state.mass1), 'blue', scale, isP1Active);
      }

      if (mode === 'dobre' && state.pendulum2.length > 0) {
        const isP2Active = state.dragTarget === 'p2';
        drawMetallicBall(ctx, state.pendulum2, radioBola(state.mass2), 'purple', scale, isP2Active);
      }
      
      // INDICADORES DE SNAP DE ÁNGULOS
      if (snapAnglesEnabled && !isSimulating && state.snapAngle1 !== null && state.snapLength1 !== null) {
        drawAngleIndicator(ctx, state.pivot, state.pendulum1.angle, '#3b82f6', scale);
        drawLengthIndicator(ctx, state.pivot.x, state.pivot.y, 
                            state.pendulum1.x, state.pendulum1.y, 
                            state.snapLength1, '#3b82f6', scale);
      }
      
      if (mode === 'dobre' && snapAnglesEnabled && !isSimulating && state.snapAngle2 !== null && state.snapLength2 !== null) {
        drawAngleIndicator(ctx, state.pendulum1, state.pendulum2.angle, '#9333ea', scale);
        drawLengthIndicator(ctx, state.pendulum1.x, state.pendulum1.y, 
                            state.pendulum2.x, state.pendulum2.y, 
                            state.snapLength2, '#9333ea', scale);
      }
    }
    ctx.restore();
  }, [canvasRef, view, drawRingAnchor, drawMetallicBall, drawRod, drawGrid, drawAngleIndicator, drawLengthIndicator]);

  return { render };
};