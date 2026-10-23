import { describe, it, expect } from 'vitest';
import { paso, enerxia, derivadasSimple, derivadasDobre } from './pendulum.js';

const DT = 0.001;
const G = 9.81;
const grados = (d) => (d * Math.PI) / 180;

const simple = { modo: 'simple', L1: 1, L2: 1, m1: 1, m2: 1, g: G, b: 0 };
const dobre = { modo: 'dobre', L1: 1, L2: 1, m1: 1, m2: 1, g: G, b: 0 };

function simular(estado, params, segundos, cadaPaso) {
  const n = Math.round(segundos / DT);
  let s = estado;
  for (let i = 1; i <= n; i++) {
    s = paso(s, params, DT);
    cadaPaso?.(s, i * DT);
  }
  return s;
}

// Período medido polos cruces de θ por 0 en sentido positivo,
// con interpolación lineal entre pasos.
function medirPeriodo(θ0, params, segundos = 30) {
  const cruces = [];
  let anterior = { θ1: θ0, ω1: 0, θ2: 0, ω2: 0 };
  let t = 0;
  const n = Math.round(segundos / DT);
  for (let i = 0; i < n; i++) {
    const seguinte = paso(anterior, params, DT);
    if (anterior.θ1 < 0 && seguinte.θ1 >= 0) {
      const fraccion = -anterior.θ1 / (seguinte.θ1 - anterior.θ1);
      cruces.push(t + fraccion * DT);
    }
    anterior = seguinte;
    t += DT;
  }
  return (cruces.at(-1) - cruces[0]) / (cruces.length - 1);
}

describe('derivadas', () => {
  it('en repouso no equilibrio non hai aceleración', () => {
    const repouso = { θ1: 0, ω1: 0, θ2: 0, ω2: 0 };
    expect(derivadasSimple(repouso, simple).ω1).toBeCloseTo(0, 12);
    const d = derivadasDobre(repouso, dobre);
    expect(d.ω1).toBeCloseTo(0, 12);
    expect(d.ω2).toBeCloseTo(0, 12);
  });
});

describe('conservación da enerxía (b = 0, 60 s)', () => {
  it('péndulo simple', () => {
    const inicial = { θ1: grados(60), ω1: 0, θ2: 0, ω2: 0 };
    const E0 = enerxia(inicial, simple).total;
    let maxErro = 0;
    simular(inicial, simple, 60, (s) => {
      maxErro = Math.max(maxErro, Math.abs(enerxia(s, simple).total - E0) / E0);
    });
    expect(maxErro).toBeLessThan(1e-4);
  });

  it('péndulo dobre caótico', () => {
    const inicial = { θ1: grados(120), ω1: 0, θ2: grados(-60), ω2: 0 };
    const E0 = enerxia(inicial, dobre).total;
    let maxErro = 0;
    simular(inicial, dobre, 60, (s) => {
      maxErro = Math.max(maxErro, Math.abs(enerxia(s, dobre).total - E0) / E0);
    });
    expect(maxErro).toBeLessThan(1e-4);
  });

  it('o dobre con masas e lonxitudes distintas tamén conserva', () => {
    const params = { modo: 'dobre', L1: 0.7, L2: 1.3, m1: 2, m2: 0.5, g: G, b: 0 };
    const inicial = { θ1: grados(170), ω1: 1, θ2: grados(10), ω2: -2 };
    const E0 = enerxia(inicial, params).total;
    const final = simular(inicial, params, 60);
    expect(Math.abs(enerxia(final, params).total - E0) / E0).toBeLessThan(1e-4);
  });
});

describe('período do péndulo simple', () => {
  const T0 = 2 * Math.PI * Math.sqrt(simple.L1 / simple.g);

  it('con 5° coincide con 2π√(L/g) (erro < 0,5 %)', () => {
    const T = medirPeriodo(grados(5), simple);
    expect(Math.abs(T - T0) / T0).toBeLessThan(0.005);
  });

  it('con 90° é ≈18 % maior ca a fórmula de ángulo pequeno', () => {
    const T = medirPeriodo(grados(90), simple);
    // Valor exacto: T/T0 = 2K(sin 45°)/π ≈ 1,18034
    expect(T / T0).toBeGreaterThan(1.17);
    expect(T / T0).toBeLessThan(1.19);
  });

  it('non depende da masa', () => {
    const T1 = medirPeriodo(grados(30), { ...simple, m1: 0.1 });
    const T2 = medirPeriodo(grados(30), { ...simple, m1: 10 });
    expect(T1).toBeCloseTo(T2, 6);
  });
});

describe('amortecemento (b > 0)', () => {
  function comprobarDecrecente(params, inicial) {
    let Eprev = enerxia(inicial, params).total;
    const E0 = Eprev;
    let subidas = 0;
    simular(inicial, params, 20, (s) => {
      const E = enerxia(s, params).total;
      // Tolerancia mínima para o redondeo en coma flotante
      if (E > Eprev + 1e-12 * E0) subidas++;
      Eprev = E;
    });
    expect(subidas).toBe(0);
    expect(Eprev).toBeLessThan(E0 * 0.5);
  }

  it('a enerxía do simple diminúe sempre', () => {
    comprobarDecrecente({ ...simple, b: 0.1 }, { θ1: grados(80), ω1: 0, θ2: 0, ω2: 0 });
  });

  it('a enerxía do dobre diminúe sempre', () => {
    comprobarDecrecente({ ...dobre, b: 0.1 }, { θ1: grados(120), ω1: 0, θ2: grados(-60), ω2: 0 });
  });
});
