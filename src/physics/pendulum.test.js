import { describe, it, expect } from 'vitest';
import {
  paso, enerxia, avanzar, derivadasSimple, derivadasDobre,
  periodoTeorico, novoMedidor, rexistrarPaso,
} from './pendulum.js';

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

describe('avanzar con subpasos fixos', () => {
  function porFotogramas(hz, segundos) {
    let s = { θ1: grados(120), ω1: 0, θ2: grados(-60), ω2: 0 };
    let acumulado = 0;
    for (let i = 0; i < Math.round(segundos * hz); i++) {
      ({ estado: s, acumulado } = avanzar(s, dobre, 1 / hz, acumulado));
    }
    return s;
  }

  it('dá o mesmo resultado a 60 e a 120 Hz', () => {
    const a60 = porFotogramas(60, 2);
    const a120 = porFotogramas(120, 2);
    expect(a120.θ1).toBeCloseTo(a60.θ1, 6);
    expect(a120.θ2).toBeCloseTo(a60.θ2, 6);
  });

  it('o dobre segue estable durante 5 minutos sen límites', () => {
    const inicial = { θ1: grados(120), ω1: 0, θ2: grados(-60), ω2: 0 };
    const E0 = enerxia(inicial, dobre).total;
    const { estado } = avanzar(inicial, dobre, 300);
    expect(Number.isFinite(estado.θ1) && Number.isFinite(estado.θ2)).toBe(true);
    expect(Math.abs(enerxia(estado, dobre).total - E0) / E0).toBeLessThan(1e-4);
  });
});

describe('medidor de período (o que amosa a interface)', () => {
  // Simula a 60 fps, coma a app, e devolve o último período medido
  function medirComoNaApp(θ0, params, segundos = 20) {
    let s = { θ1: θ0, ω1: 0, θ2: 0, ω2: 0 };
    let medidor = novoMedidor();
    let acumulado = 0;
    let t = 0;
    for (let i = 0; i < segundos * 60; i++) {
      const res = avanzar(s, params, 1 / 60, acumulado);
      const tNovo = t + 1 / 60 + acumulado - res.acumulado;
      medidor = rexistrarPaso(medidor, s.θ1, res.estado.θ1, t, tNovo);
      ({ estado: s, acumulado } = res);
      t = tNovo;
    }
    return medidor.periodo;
  }

  it('periodoTeorico dá 2π√(L/g) e null sen gravidade', () => {
    expect(periodoTeorico(1, 9.81)).toBeCloseTo(2.00607, 4);
    expect(periodoTeorico(1, 0)).toBeNull();
  });

  it('con 5° mide o mesmo có teórico (erro < 0,5 %)', () => {
    const T0 = periodoTeorico(1, G);
    expect(Math.abs(medirComoNaApp(grados(5), simple) - T0) / T0).toBeLessThan(0.005);
  });

  it('con 90° mide ≈18 % máis có teórico', () => {
    const ratio = medirComoNaApp(grados(90), simple) / periodoTeorico(1, G);
    expect(ratio).toBeGreaterThan(1.17);
    expect(ratio).toBeLessThan(1.19);
  });

  it('na Lúa o período é máis longo', () => {
    const lua = { ...simple, g: 1.62 };
    const T = medirComoNaApp(grados(5), lua, 30);
    expect(Math.abs(T - periodoTeorico(1, 1.62)) / T).toBeLessThan(0.005);
  });

  it('tamén mide o período se o péndulo dá voltas completas', () => {
    // Na parte de abaixo con ω0 = 8 rad/s supera o punto máis alto (fai falta 2√(g/L) ≈ 6,3)
    let s = { θ1: 0.3, ω1: 8, θ2: 0, ω2: 0 };
    let medidor = novoMedidor();
    let t = 0;
    for (let i = 0; i < 10000; i++) {
      const seguinte = paso(s, simple, DT);
      medidor = rexistrarPaso(medidor, s.θ1, seguinte.θ1, t, t + DT);
      s = seguinte;
      t += DT;
    }
    expect(s.θ1).toBeGreaterThan(4 * Math.PI); // deu varias voltas
    // Tempo dunha volta enteira calculado á parte, integrando dt = dθ/ω
    let volta = 0;
    let p = { θ1: 0, ω1: Math.sqrt(8 ** 2 + 2 * G * (1 - Math.cos(0.3))), θ2: 0, ω2: 0 };
    while (p.θ1 < 2 * Math.PI) { p = paso(p, simple, DT); volta += DT; }
    expect(medidor.periodo).toBeCloseTo(volta, 2);
  });

  it('non mide nada mentres non hai dous cruces no mesmo sentido', () => {
    let m = novoMedidor();
    m = rexistrarPaso(m, -0.1, 0.1, 0, 1);
    expect(m.periodo).toBeNull();
    m = rexistrarPaso(m, 0.1, -0.1, 1, 2);
    expect(m.periodo).toBeNull();
    m = rexistrarPaso(m, -0.1, 0.1, 2, 3);
    expect(m.periodo).toBeCloseTo(2, 10);
  });
});
