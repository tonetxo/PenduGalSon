import React, { useEffect, useRef } from 'react';
import { usePhysics } from '../hooks/usePhysics';
import { reducirAngulo } from '../physics/pendulum';
import { prepararCanvas, claveSistema } from '../utils/canvas';

const COR = { p1: '#3b82f6', p2: '#9333ea' };
const VENTA_S = 8; // segundos de traxectoria visibles
const MOSTRA_MS = 16;

// Espazo de fases θ fronte a ω: no simple é unha curva pechada (elipse con
// ángulos pequenos); no dobre, a traxectoria non se repite nunca.
const PhasePanel = () => {
  const { engineRef } = usePhysics();
  const panelRef = useRef(null);
  const graficaRef = useRef(null);
  const lendaRef = useRef(null);

  useEffect(() => {
    const historial = [];
    let clave = null;
    let ultimaMostra = 0;
    let id;

    const debuxar = (dobre) => {
      const { ctx, w, h } = prepararCanvas(graficaRef.current);
      const cx = w / 2, cy = h / 2;

      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, cy); ctx.lineTo(w, cy);
      ctx.moveTo(cx, 0); ctx.lineTo(cx, h);
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '9px monospace';
      ctx.fillText('θ', w - 8, cy - 3);
      ctx.fillText('ω', cx + 3, 9);
      if (historial.length < 2) return;

      const series = dobre ? ['p1', 'p2'] : ['p1'];
      // Escala simétrica e común ás dúas series, cun mínimo para que o repouso non se magnifique
      let maxθ = 0.05, maxω = 0.1;
      for (const p of historial) {
        for (const k of series) {
          maxθ = Math.max(maxθ, Math.abs(p[k].θ));
          maxω = Math.max(maxω, Math.abs(p[k].ω));
        }
      }
      const sx = (w / 2 - 4) / maxθ;
      const sy = (h / 2 - 4) / maxω;

      for (const k of series) {
        ctx.strokeStyle = COR[k];
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        historial.forEach((p, i) => {
          const x = cx + p[k].θ * sx;
          const y = cy - p[k].ω * sy;
          // Ao dar a volta, θ salta de π a -π: non unir eses puntos
          const salto = i > 0 && Math.abs(p[k].θ - historial[i - 1][k].θ) > Math.PI;
          if (i === 0 || salto) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.stroke();

        const ultimo = historial[historial.length - 1][k];
        ctx.fillStyle = COR[k];
        ctx.beginPath();
        ctx.arc(cx + ultimo.θ * sx, cy - ultimo.ω * sy, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const actualizar = (agora) => {
      id = requestAnimationFrame(actualizar);
      const s = engineRef.current;
      const panel = panelRef.current;
      if (!panel) return;

      if (!s.pivot || !s.params) {
        panel.style.display = 'none';
        historial.length = 0;
        return;
      }
      panel.style.display = '';

      const novaClave = claveSistema(s.params);
      if (s.isDragging || novaClave !== clave) {
        historial.length = 0;
        clave = novaClave;
      }

      const dobre = s.params.modo === 'dobre';
      lendaRef.current.style.display = dobre ? '' : 'none';

      if (agora - ultimaMostra >= MOSTRA_MS) {
        ultimaMostra = agora;
        historial.push({
          p1: { θ: reducirAngulo(s.pendulum1.angle), ω: s.pendulum1.velocity },
          p2: { θ: reducirAngulo(s.pendulum2.angle), ω: s.pendulum2.velocity },
        });
        if (historial.length > VENTA_S * 1000 / MOSTRA_MS) historial.shift();
      }
      debuxar(dobre);
    };

    id = requestAnimationFrame(actualizar);
    return () => cancelAnimationFrame(id);
  }, [engineRef]);

  return (
    <div
      ref={panelRef}
      style={{ display: 'none' }}
      className="p-2.5 space-y-1 bg-white/85 backdrop-blur rounded-2xl border border-slate-200 shadow-sm text-[10px] text-slate-700"
    >
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide whitespace-nowrap">Espazo de fases</span>
        <span ref={lendaRef} className="flex gap-1.5 whitespace-nowrap">
          <span style={{ color: COR.p1 }}>●1</span>
          <span style={{ color: COR.p2 }}>●2</span>
        </span>
      </div>
      <canvas ref={graficaRef} className="w-full h-28 block" />
    </div>
  );
};

export default PhasePanel;
