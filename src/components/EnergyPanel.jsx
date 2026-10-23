import React, { useEffect, useRef } from 'react';
import { usePhysics } from '../hooks/usePhysics';
import { periodoTeorico } from '../physics/pendulum';
import { fmt, fmtCifras } from '../utils/fmt';
import { prepararCanvas, claveSistema } from '../utils/canvas';

const COR = { cinetica: '#f59e0b', potencial: '#10b981', total: '#334155' };
const VENTA_S = 10; // segundos visibles na gráfica
const MOSTRA_MS = 50; // cada canto se garda un punto da gráfica
const TEXTO_MS = 100; // cada canto se refrescan os números

const Fila = ({ etiqueta, cor, valorRef, barraRef }) => (
  <div>
    <div className="flex justify-between">
      <span className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full" style={{ background: cor }} />
        {etiqueta}
      </span>
      <span ref={valorRef} className="font-mono tabular-nums">–</span>
    </div>
    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-0.5">
      <div ref={barraRef} className="h-full rounded-full" style={{ background: cor, width: 0 }} />
    </div>
  </div>
);

const EnergyPanel = () => {
  const { engineRef } = usePhysics();
  const panelRef = useRef(null);
  const graficaRef = useRef(null);
  const periodoRef = useRef(null);
  const v = {
    cinetica: useRef(null), potencial: useRef(null), total: useRef(null),
    medido: useRef(null), teorico: useRef(null), diferenza: useRef(null), datos: useRef(null),
  };
  const barra = { cinetica: useRef(null), potencial: useRef(null), total: useRef(null) };

  useEffect(() => {
    const historial = [];
    let claveHistorial = null;
    let ultimaMostra = 0;
    let ultimoTexto = 0;
    let id;

    const debuxarGrafica = (escala) => {
      const { ctx, w, h } = prepararCanvas(graficaRef.current);
      if (historial.length < 2 || escala <= 0) return;

      const n = VENTA_S * 1000 / MOSTRA_MS;
      for (const clave of ['potencial', 'cinetica', 'total']) {
        ctx.beginPath();
        ctx.strokeStyle = COR[clave];
        ctx.lineWidth = clave === 'total' ? 1.5 : 1;
        historial.forEach((p, i) => {
          const x = ((i + n - historial.length) / (n - 1)) * w;
          const y = h - 1 - (p[clave] / (escala * 1.05)) * (h - 2);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.stroke();
      }
    };

    const actualizar = (agora) => {
      id = requestAnimationFrame(actualizar);
      const s = engineRef.current;
      const panel = panelRef.current;
      if (!panel) return;

      if (!s.pivot || !s.enerxia) {
        panel.style.display = 'none';
        historial.length = 0;
        return;
      }
      panel.style.display = '';

      // A gráfica empeza de novo ao arrastrar ou cambiar parámetros:
      // a enerxía total só ten que ser constante para un mesmo sistema
      const { modo, L1, L2, g } = s.params;
      const clave = claveSistema(s.params);
      if (s.isDragging || clave !== claveHistorial) {
        historial.length = 0;
        claveHistorial = clave;
      }

      if (agora - ultimaMostra >= MOSTRA_MS) {
        ultimaMostra = agora;
        historial.push({ ...s.enerxia });
        if (historial.length > VENTA_S * 1000 / MOSTRA_MS) historial.shift();
      }

      // Escala común: a maior enerxía total da venta visible
      const escala = historial.reduce((max, p) => Math.max(max, p.total), s.enerxia.total);
      for (const clave of ['cinetica', 'potencial', 'total']) {
        barra[clave].current.style.width = escala > 0 ? `${(s.enerxia[clave] / escala) * 100}%` : '0';
      }
      debuxarGrafica(escala);

      if (agora - ultimoTexto < TEXTO_MS) return;
      ultimoTexto = agora;

      for (const clave of ['cinetica', 'potencial', 'total']) {
        v[clave].current.textContent = `${fmtCifras(s.enerxia[clave])} J`;
      }

      v.datos.current.textContent = modo === 'simple'
        ? `L ${fmt(L1)} m · g ${fmt(g)} m/s²`
        : `L ${fmt(L1)}+${fmt(L2)} m · g ${fmt(g)}`;

      periodoRef.current.style.display = modo === 'simple' ? '' : 'none';
      if (modo !== 'simple') return;

      const teorico = periodoTeorico(L1, g);
      const medido = s.medidor?.periodo ?? null;
      v.teorico.current.textContent = teorico ? `${fmt(teorico, 3)} s` : '–';
      v.medido.current.textContent = medido ? `${fmt(medido, 3)} s` : '…';
      if (teorico && medido) {
        const dif = ((medido - teorico) / teorico) * 100;
        v.diferenza.current.textContent = `${dif >= 0 ? '+' : '−'}${fmt(Math.abs(dif), 2)} %`;
      } else {
        v.diferenza.current.textContent = '–';
      }
    };

    id = requestAnimationFrame(actualizar);
    return () => cancelAnimationFrame(id);
  }, [engineRef]);

  return (
    <div
      ref={panelRef}
      style={{ display: 'none' }}
      className="p-2.5 space-y-1.5 bg-white/85 backdrop-blur rounded-2xl border border-slate-200 shadow-sm text-[10px] text-slate-700"
    >
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enerxía</div>
      <Fila etiqueta="Cinética" cor={COR.cinetica} valorRef={v.cinetica} barraRef={barra.cinetica} />
      <Fila etiqueta="Potencial" cor={COR.potencial} valorRef={v.potencial} barraRef={barra.potencial} />
      <Fila etiqueta="Total" cor={COR.total} valorRef={v.total} barraRef={barra.total} />
      <canvas ref={graficaRef} className="w-full h-9 block" />
      <div ref={v.datos} className="text-[9px] text-slate-400 font-mono whitespace-nowrap" />

      <div ref={periodoRef} className="pt-2 border-t border-slate-200 space-y-0.5">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Período</div>
        <div className="flex justify-between"><span>Medido</span><span ref={v.medido} className="font-mono tabular-nums">…</span></div>
        <div className="flex justify-between"><span>2π√(L/g)</span><span ref={v.teorico} className="font-mono tabular-nums">–</span></div>
        <div className="flex justify-between"><span>Diferenza</span><span ref={v.diferenza} className="font-mono tabular-nums">–</span></div>
      </div>
    </div>
  );
};

export default EnergyPanel;
