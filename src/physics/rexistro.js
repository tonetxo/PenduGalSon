// Gravación de datos da simulación para exportar en CSV.
// O rexistro é { mostras: [...] } e engadirMostra modifícao no sitio:
// copialo cada 10 ms sería caro con decenas de miles de filas.

// Cada cantos subpasos de 1 ms se garda unha mostra (10 → 100 mostras/s)
export const SUBPASOS_POR_MOSTRA = 10;

// Tope de mostras (10 min a 100 Hz); ao pasalo descártanse as máis vellas
export const MAX_MOSTRAS = 60000;

export const COLUMNAS = ['t (s)', 'θ1 (rad)', 'ω1 (rad/s)', 'θ2 (rad)', 'ω2 (rad/s)', 'Ec (J)', 'Ep (J)', 'E (J)'];

export function novoRexistro() {
  return { mostras: [] };
}

export function engadirMostra(rexistro, t, estado, enerxia, max = MAX_MOSTRAS) {
  const { mostras } = rexistro;
  mostras.push([t, estado.θ1, estado.ω1, estado.θ2, estado.ω2, enerxia.cinetica, enerxia.potencial, enerxia.total]);
  // Recortar por bloques do 10 % para non mover o array en cada mostra
  if (mostras.length > max) mostras.splice(0, mostras.length - max + Math.floor(max / 10));
  return rexistro;
}

// CSV estándar (separador coma, punto decimal), que abren as follas de
// cálculo e Python. O BOM fai que Excel lea ben os θ e ω.
export function aCSV(rexistro) {
  const filas = rexistro.mostras.map((m) =>
    m.map((v, i) => (i === 0 ? v.toFixed(3) : v.toPrecision(8))).join(','),
  );
  return '\uFEFF' + [COLUMNAS.join(','), ...filas].join('\n') + '\n';
}

// Nome do ficheiro cos parámetros do experimento, sen caracteres problemáticos
export function nomeFicheiro(params, data = new Date()) {
  const n = (v) => v.toFixed(2);
  const lonxitudes = params.modo === 'dobre' ? `L${n(params.L1)}-${n(params.L2)}` : `L${n(params.L1)}`;
  // Hora local, que é a que ve quen fai o experimento
  const d2 = (v) => String(v).padStart(2, '0');
  const selo = `${data.getFullYear()}${d2(data.getMonth() + 1)}${d2(data.getDate())}`
    + `-${d2(data.getHours())}${d2(data.getMinutes())}${d2(data.getSeconds())}`;
  return `pendugalson_${params.modo}_${lonxitudes}_g${n(params.g)}_${selo}.csv`;
}
