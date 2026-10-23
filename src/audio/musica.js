// Utilidades musicais puras: escalas, cuantización de altura e detección
// dos momentos do movemento nos que se disparan notas.

// Graos de cada escala en semitons desde a tónica (null = altura continua)
export const ESCALAS = {
  libre: null,
  pentatonica: [0, 2, 4, 7, 9],
  maior: [0, 2, 4, 5, 7, 9, 11],
  menor: [0, 2, 3, 5, 7, 8, 10],
};

// Leva un número de semitons (pode ter decimais) ao grao da escala máis próximo
export function cuantizar(semitonos, escala) {
  const graos = ESCALAS[escala];
  if (!graos) return semitonos;
  const oitava = Math.floor(semitonos / 12);
  let mellor = null;
  // Mirar tamén a oitava de arriba e a de abaixo para os graos de fronteira
  for (const o of [oitava - 1, oitava, oitava + 1]) {
    for (const g of graos) {
      const candidato = o * 12 + g;
      if (mellor === null || Math.abs(candidato - semitonos) < Math.abs(mellor - semitonos)) {
        mellor = candidato;
      }
    }
  }
  return mellor;
}

// x ∈ [0, 1] percorre `oitavas` oitavas desde a frecuencia base
export function frecuencia(base, x, oitavas, escala) {
  const xLimitado = Math.min(1, Math.max(0, x));
  return base * Math.pow(2, cuantizar(xLimitado * oitavas * 12, escala) / 12);
}

const reducir = (θ) => Math.atan2(Math.sin(θ), Math.cos(θ));

// Compara dous fotogramas dun brazo e di se pasou polo centro (θ = 0)
// ou por un extremo (ω cambia de signo, o punto máis alto da oscilación)
export function detectarEventos(anterior, actual) {
  const a = reducir(anterior.θ);
  const b = reducir(actual.θ);
  // Un salto de máis de π é o paso polo punto máis alto ao dar a volta
  const centro = Math.abs(b - a) < Math.PI && ((a < 0 && b >= 0) || (a > 0 && b <= 0));
  const extremo = (anterior.ω > 0 && actual.ω <= 0) || (anterior.ω < 0 && actual.ω >= 0);
  return { centro, extremo };
}

// Altura relativa (0–1) para unha nota no centro: a velocidade comparada coa
// necesaria para chegar arriba de todo, 2√(g/L). Nun simple é sin(θmax/2).
export function alturaCentro(ω, g, L) {
  if (!(g > 0) || !(L > 0)) return 1;
  return Math.min(1, Math.abs(ω) / (2 * Math.sqrt(g / L)));
}
