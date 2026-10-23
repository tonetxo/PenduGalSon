// Axusta un canvas pequeno á densidade da pantalla e devolve o contexto limpo
export function prepararCanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (canvas.width !== Math.round(w * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  return { ctx, w, h };
}

// Identifica o sistema físico: se cambia, as gráficas empezan de novo
export const claveSistema = ({ modo, L1, L2, m1, m2, g }) => `${modo}|${L1}|${L2}|${m1}|${m2}|${g}`;
