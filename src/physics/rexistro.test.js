import { describe, it, expect } from 'vitest';
import { novoRexistro, engadirMostra, aCSV, nomeFicheiro, COLUMNAS } from './rexistro.js';

const estado = { θ1: 0.5, ω1: -1.25, θ2: 0, ω2: 0 };
const enerxia = { cinetica: 0.78125, potencial: 0.5, total: 1.28125 };

describe('rexistro para CSV', () => {
  it('xera cabeceira coas columnas pedidas e unha fila por mostra', () => {
    let r = novoRexistro();
    r = engadirMostra(r, 0, estado, enerxia);
    r = engadirMostra(r, 0.01, estado, enerxia);
    const liñas = aCSV(r).replace('﻿', '').trim().split('\n');
    expect(liñas[0]).toBe(COLUMNAS.join(','));
    expect(liñas[0]).toBe('t (s),θ1 (rad),ω1 (rad/s),θ2 (rad),ω2 (rad/s),Ec (J),Ep (J),E (J)');
    expect(liñas).toHaveLength(3);
    expect(liñas[2]).toBe('0.010,0.50000000,-1.2500000,0.0000000,0.0000000,0.78125000,0.50000000,1.2812500');
  });

  it('os valores relense igual cun parser normal', () => {
    let r = novoRexistro();
    r = engadirMostra(r, 1.23, { θ1: Math.PI, ω1: 1e-7, θ2: -2, ω2: 12.3456789 }, enerxia);
    const fila = aCSV(r).trim().split('\n')[1].split(',').map(Number);
    expect(fila[0]).toBe(1.23);
    expect(fila[1]).toBeCloseTo(Math.PI, 7);
    expect(fila[2]).toBeCloseTo(1e-7, 14);
    expect(fila[4]).toBeCloseTo(12.3456789, 6);
  });

  it('ao pasar o tope descarta as mostras máis vellas', () => {
    let r = novoRexistro();
    for (let i = 0; i < 105; i++) r = engadirMostra(r, i, estado, enerxia, 100);
    expect(r.mostras.length).toBeLessThanOrEqual(100);
    expect(r.mostras.at(-1)[0]).toBe(104);
    // As que quedan seguen en orde e sen ocos
    r.mostras.forEach((m, i) => i > 0 && expect(m[0] - r.mostras[i - 1][0]).toBe(1));
  });

  it('o nome do ficheiro leva os parámetros e non ten caracteres raros', () => {
    const data = new Date(2026, 9, 23, 7, 10, 5); // hora local
    expect(nomeFicheiro({ modo: 'simple', L1: 1, g: 9.81 }, data))
      .toBe('pendugalson_simple_L1.00_g9.81_20261023-071005.csv');
    expect(nomeFicheiro({ modo: 'dobre', L1: 0.7, L2: 0.5, g: 1.62 }, data))
      .toBe('pendugalson_dobre_L0.70-0.50_g1.62_20261023-071005.csv');
  });
});
