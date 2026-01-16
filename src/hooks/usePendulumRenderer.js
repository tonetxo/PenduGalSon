import { useCallback } from 'react';

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

  const drawGrid = useCallback((ctx, width, height, scale, offsetX, offsetY) => {
    const gridSize = 50; // Double density

    // Calculate visible world bounds
    const startX = Math.floor(-offsetX / scale / gridSize) * gridSize;
    const endX = Math.ceil((width - offsetX) / scale / gridSize) * gridSize;
    const startY = Math.floor(-offsetY / scale / gridSize) * gridSize;
    const endY = Math.ceil((height - offsetY) / scale / gridSize) * gridSize;

    ctx.beginPath();
    ctx.strokeStyle = 'rgba(0,0,0,0.15)'; // More perceptible
    ctx.lineWidth = 0.5 / scale; // Slightly thicker

    // Vertical lines
    for (let x = startX; x <= endX; x += gridSize) {
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
    }
    // Horizontal lines
    for (let y = startY; y <= endY; y += gridSize) {
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
    }
    ctx.stroke();
  }, []);

  const render = useCallback((state, mode, trailLength) => {
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
      // ESTELA SUAVE
      if (mode === 'compound' && state.history.length > 1) {
        ctx.beginPath();
        // Gradiente para la estela (desvanece al final)
        const gradient = ctx.createLinearGradient(
          state.history[0].x, state.history[0].y,
          state.history[state.history.length - 1].x, state.history[state.history.length - 1].y
        );
        gradient.addColorStop(0, 'rgba(147, 81, 234, 0)');
        gradient.addColorStop(1, 'rgba(147, 81, 234, 0.5)');
        ctx.strokeStyle = gradient;

        ctx.lineWidth = 3 / scale;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.moveTo(state.history[0].x, state.history[0].y);
        for (let i = 1; i < state.history.length; i++) {
          ctx.lineTo(state.history[i].x, state.history[i].y);
        }
        ctx.stroke();
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

      ctx.beginPath();
      ctx.moveTo(state.pivot.x, state.pivot.y);
      ctx.lineTo(state.pendulum1.x, state.pendulum1.y);
      if (mode === 'compound' && state.pendulum2.length > 0) {
        ctx.lineTo(state.pendulum2.x, state.pendulum2.y);
      }
      ctx.stroke();

      // PIVOTE ARO (Ring Anchor)
      const isPivotActive = state.dragTarget === 'pivot';
      drawRingAnchor(ctx, state.pivot, 12, scale, isPivotActive);

      // MASAS 3D (Metallic Spheres)
      const isP1Active = state.dragTarget === 'p1';
      drawMetallicBall(ctx, state.pendulum1, 10 + state.mass1 / 5, 'blue', scale, isP1Active);

      if (mode === 'compound' && state.pendulum2.length > 0) {
        const isP2Active = state.dragTarget === 'p2';
        drawMetallicBall(ctx, state.pendulum2, 10 + state.mass2 / 5, 'purple', scale, isP2Active);
      }
    }
    ctx.restore();
  }, [canvasRef, view, drawRingAnchor, drawMetallicBall, drawGrid]);

  return { render };
};