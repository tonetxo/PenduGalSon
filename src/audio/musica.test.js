import { describe, it, expect } from 'vitest';
import { cuantizar, frecuencia, detectarEventos, alturaCentro, ESCALAS } from './musica.js';
import { paso } from '../physics/pendulum.js';

describe('cuantizar á escala', () => {
  it('libre non cambia nada', () => {
    expect(cuantizar(5.37, 'libre')).toBe(5.37);
  });

  it('leva cada semitón ao grao máis próximo', () => {
    expect(cuantizar(1, 'maior')).toBe(0); // empate 0/2: queda o primeiro
    expect(cuantizar(3.4, 'maior')).toBe(4);
    expect(cuantizar(6, 'pentatonica')).toBe(7);
    expect(cuantizar(3, 'menor')).toBe(3);
  });

  it('funciona noutras oitavas e preto da fronteira', () => {
    expect(cuantizar(12 + 4.2, 'maior')).toBe(16);
    expect(cuantizar(11.8, 'pentatonica')).toBe(12); // máis preto do Do de arriba ca do La
    expect(cuantizar(-0.4, 'menor')).toBe(0);
  });

  it('o resultado sempre é un grao da escala', () => {
    for (const escala of ['pentatonica', 'maior', 'menor']) {
      for (let s = 0; s < 48; s += 0.37) {
        expect(ESCALAS[escala]).toContain(((cuantizar(s, escala) % 12) + 12) % 12);
      }
    }
  });
});

describe('frecuencia', () => {
  it('en modo libre reproduce o mapeo orixinal do son', () => {
    const dx = 0.3;
    expect(frecuencia(65.4, (dx + 1) / 2, 3, 'libre')).toBeCloseTo(65.4 * Math.pow(2, (dx + 1) * 1.5), 9);
  });

  it('os extremos do rango dan a base e a base·2^oitavas', () => {
    expect(frecuencia(261.6, 0, 4, 'maior')).toBeCloseTo(261.6, 9);
    expect(frecuencia(261.6, 1, 4, 'maior')).toBeCloseTo(261.6 * 16, 6);
    expect(frecuencia(261.6, 7, 4, 'maior')).toBeCloseTo(261.6 * 16, 6); // limitado
  });
});

describe('detectarEventos nun péndulo de verdade', () => {
  it('nun período hai dous pasos polo centro e dous extremos', () => {
    const params = { modo: 'simple', L1: 1, L2: 1, m1: 1, m2: 1, g: 9.81, b: 0 };
    let s = { θ1: 0.5, ω1: 0, θ2: 0, ω2: 0 };
    // Arrincar despois do extremo inicial (ω = 0 exacto) para non contalo
    for (let i = 0; i < 10; i++) s = paso(s, params, 0.001);
    let centros = 0, extremos = 0;
    // Uns 2,05 s ≈ un período, mostreado a 60 fps coma na app
    for (let f = 0; f < 120; f++) {
      let seguinte = s;
      for (let i = 0; i < 17; i++) seguinte = paso(seguinte, params, 0.001);
      const ev = detectarEventos({ θ: s.θ1, ω: s.ω1 }, { θ: seguinte.θ1, ω: seguinte.ω1 });
      if (ev.centro) centros++;
      if (ev.extremo) extremos++;
      s = seguinte;
    }
    expect(centros).toBe(2);
    expect(extremos).toBe(2);
  });

  it('o paso polo punto máis alto ao dar voltas non conta coma centro', () => {
    const ev = detectarEventos({ θ: Math.PI - 0.01, ω: 5 }, { θ: Math.PI + 0.01, ω: 5 });
    expect(ev.centro).toBe(false);
  });
});

describe('alturaCentro', () => {
  it('nun simple vale sin(θmax/2)', () => {
    const g = 9.81, L = 1, θmax = 1.2;
    // Velocidade no centro por conservación da enerxía
    const ω = Math.sqrt(2 * (g / L) * (1 - Math.cos(θmax)));
    expect(alturaCentro(ω, g, L)).toBeCloseTo(Math.sin(θmax / 2), 12);
  });

  it('sen gravidade non divide por cero', () => {
    expect(alturaCentro(3, 0, 1)).toBe(1);
  });
});
