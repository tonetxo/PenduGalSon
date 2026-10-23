// Motor de física do péndulo simple e dobre.
// Funcións puras, sen dependencias de React nin do canvas.
//
// Unidades SI:
//   estado:     { θ1, ω1, θ2, ω2 }       rad, rad/s
//   parámetros: { L1, L2, m1, m2, g, b, modo }
//               L en m, m en kg, g en m/s², b en s⁻¹ (amortecemento viscoso)
//               modo: 'simple' | 'dobre' (por defecto 'dobre')
//
// Os ángulos mídense desde a vertical cara abaixo, en sentido antihorario positivo.

// Péndulo simple: θ̈ = -(g/L)·sin θ - b·ω
export function derivadasSimple(estado, params) {
  const { θ1, ω1 } = estado;
  const { L1, g, b = 0 } = params;
  return {
    θ1: ω1,
    ω1: -(g / L1) * Math.sin(θ1) - b * ω1,
    θ2: 0,
    ω2: 0,
  };
}

// Péndulo dobre con masas puntuais (ecuacións de Lagrange).
// O amortecemento -b·ω disipa sempre enerxía: equivale a unha forza
// xeneralizada -b·M·ω, cuxa potencia -b·ωᵀMω é ≤ 0 (M definida positiva).
export function derivadasDobre(estado, params) {
  const { θ1, ω1, θ2, ω2 } = estado;
  const { L1, L2, m1, m2, g, b = 0 } = params;

  const delta = θ1 - θ2;
  const den = 2 * m1 + m2 - m2 * Math.cos(2 * delta);

  const α1 = (
    -g * (2 * m1 + m2) * Math.sin(θ1)
    - m2 * g * Math.sin(θ1 - 2 * θ2)
    - 2 * Math.sin(delta) * m2 * (ω2 * ω2 * L2 + ω1 * ω1 * L1 * Math.cos(delta))
  ) / (L1 * den);

  const α2 = (
    2 * Math.sin(delta) * (
      ω1 * ω1 * L1 * (m1 + m2)
      + g * (m1 + m2) * Math.cos(θ1)
      + ω2 * ω2 * L2 * m2 * Math.cos(delta)
    )
  ) / (L2 * den);

  return {
    θ1: ω1,
    ω1: α1 - b * ω1,
    θ2: ω2,
    ω2: α2 - b * ω2,
  };
}

function derivadasPara(params) {
  return params.modo === 'simple' ? derivadasSimple : derivadasDobre;
}

function sumar(estado, d, h) {
  return {
    θ1: estado.θ1 + d.θ1 * h,
    ω1: estado.ω1 + d.ω1 * h,
    θ2: estado.θ2 + d.θ2 * h,
    ω2: estado.ω2 + d.ω2 * h,
  };
}

// Un paso de Runge-Kutta de orde 4. dt en segundos.
export function paso(estado, params, dt) {
  const f = derivadasPara(params);
  const k1 = f(estado, params);
  const k2 = f(sumar(estado, k1, dt / 2), params);
  const k3 = f(sumar(estado, k2, dt / 2), params);
  const k4 = f(sumar(estado, k3, dt), params);
  const comb = (k) => (k1[k] + 2 * k2[k] + 2 * k3[k] + k4[k]) / 6;
  return {
    θ1: estado.θ1 + dt * comb('θ1'),
    ω1: estado.ω1 + dt * comb('ω1'),
    θ2: estado.θ2 + dt * comb('θ2'),
    ω2: estado.ω2 + dt * comb('ω2'),
  };
}

// Enerxía en J. A potencial tómase respecto da posición de equilibrio
// (todo colgando), así que é sempre ≥ 0.
export function enerxia(estado, params) {
  const { θ1, ω1, θ2, ω2 } = estado;
  const { L1, L2, m1, m2, g } = params;

  if (params.modo === 'simple') {
    const cinetica = 0.5 * m1 * L1 * L1 * ω1 * ω1;
    const potencial = m1 * g * L1 * (1 - Math.cos(θ1));
    return { cinetica, potencial, total: cinetica + potencial };
  }

  const v1Cad = L1 * L1 * ω1 * ω1;
  const v2Cad = v1Cad + L2 * L2 * ω2 * ω2 + 2 * L1 * L2 * ω1 * ω2 * Math.cos(θ1 - θ2);
  const cinetica = 0.5 * m1 * v1Cad + 0.5 * m2 * v2Cad;

  const h1 = L1 * (1 - Math.cos(θ1));
  const h2 = h1 + L2 * (1 - Math.cos(θ2));
  const potencial = m1 * g * h1 + m2 * g * h2;

  return { cinetica, potencial, total: cinetica + potencial };
}
