import { useRef, useCallback, useEffect } from 'react';
import { frecuencia, detectarEventos, alturaCentro } from './musica';

// Separación mínima entre notas dun mesmo brazo, para que o caos non faga ruído
const MIN_ENTRE_NOTAS_S = 0.06;

// Nota pulsada curta: ataque rápido e caída exponencial
function tocarNota(ctx, destino, freq, volume, tipo, duracion) {
  if (!Number.isFinite(freq) || freq < 20 || volume <= 0) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = tipo;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(volume, t + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duracion);
  osc.connect(gain);
  gain.connect(destino);
  osc.start(t);
  osc.stop(t + duracion + 0.05);
}

// escala: 'libre' | 'pentatonica' | 'maior' | 'menor'
// disparo: 'continuo' (son sostido) | 'centro' | 'extremos' (notas pulsadas)
export const useAudio = (isMuted, isSimulating, volume1 = 70, volume2 = 50, escala = 'libre', disparo = 'continuo') => {
  const audioCtxRef = useRef(null);
  const nodesRef = useRef(null);

  // Usar refs para valores que cambian frecuentemente,
  // así updateAudio non se recrea e o loop de animación non se reinicia
  const isMutedRef = useRef(isMuted);
  const isSimulatingRef = useRef(isSimulating);
  const volume1Ref = useRef(volume1);
  const volume2Ref = useRef(volume2);
  const escalaRef = useRef(escala);
  const disparoRef = useRef(disparo);
  // Estado anterior de cada brazo, para detectar os pasos polo centro e os extremos
  const anteriorRef = useRef(null);

  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);
  useEffect(() => { isSimulatingRef.current = isSimulating; }, [isSimulating]);
  useEffect(() => { volume1Ref.current = volume1; }, [volume1]);
  useEffect(() => { volume2Ref.current = volume2; }, [volume2]);
  useEffect(() => { escalaRef.current = escala; }, [escala]);
  useEffect(() => { disparoRef.current = disparo; }, [disparo]);

  const initAudio = useCallback(async () => {
    if (audioCtxRef.current) {
      if (audioCtxRef.current.state === 'suspended') {
        await audioCtxRef.current.resume();
      }
      return;
    }

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();

      const createOsc = (type, volume = 0.1) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        gain.gain.value = 0;
        osc.connect(gain);
        osc.start();
        return { osc, gain, baseVol: volume };
      };

      const bass = createOsc('triangle', 0.7);
      const lead = createOsc('sine', 0.25);
      const leadHarmonic = createOsc('triangle', 0.1);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1400;

      const delay = ctx.createDelay(1.0);
      const feedback = ctx.createGain();
      feedback.gain.value = 0.35;

      const master = ctx.createGain();
      master.gain.value = 0.8;

      bass.gain.connect(filter);
      lead.gain.connect(filter);
      leadHarmonic.gain.connect(filter);

      filter.connect(master);
      master.connect(ctx.destination);

      master.connect(delay);
      delay.connect(feedback);
      feedback.connect(delay);
      delay.connect(ctx.destination);

      audioCtxRef.current = ctx;
      nodesRef.current = { bass, lead, leadHarmonic, delay, master, filter, ctx };

      if (ctx.state === 'suspended') await ctx.resume();
    } catch (e) {
      console.error("Audio error", e);
    }
  }, []);

  // Modo de notas pulsadas: unha nota por brazo cada vez que pasa polo
  // centro ou por un extremo. No centro a altura vai coa velocidade (a
  // amplitude); nos extremos, co ángulo (esquerda grave, dereita aguda).
  const dispararNotas = useCallback((state, escala, vol1, vol2, destino, ctx) => {
    const { params } = state;
    if (!params) return;
    const brazos = [
      {
        id: 'p1', p: state.pendulum1, base: 65.4, oitavas: 3, tipo: 'triangle', volume: 0.6 * vol1, duracion: 1.2,
        // A barra do péndulo físico oscila coma un simple de lonxitude 2L/3
        L: params.modo === 'fisico' ? (2 * params.L1) / 3 : params.L1,
      },
    ];
    if (params.modo === 'dobre') {
      brazos.push({ id: 'p2', p: state.pendulum2, base: 261.6, oitavas: 4, tipo: 'sine', volume: 0.35 * vol2, duracion: 0.8, L: params.L2 });
    }

    const anterior = anteriorRef.current ?? {};
    const agora = ctx.currentTime;
    const seguinte = {};
    for (const b of brazos) {
      const actual = { θ: b.p.angle, ω: b.p.velocity, t: anterior[b.id]?.t ?? -Infinity };
      const previo = anterior[b.id];
      if (previo) {
        const ev = detectarEventos(previo, actual);
        const toca = disparoRef.current === 'centro' ? ev.centro : ev.extremo;
        if (toca && agora - previo.t >= MIN_ENTRE_NOTAS_S) {
          const x = disparoRef.current === 'centro'
            ? alturaCentro(actual.ω, params.g, b.L)
            : (Math.sin(actual.θ) + 1) / 2;
          tocarNota(ctx, destino, frecuencia(b.base, x, b.oitavas, escala), b.volume, b.tipo, b.duracion);
          actual.t = agora;
        }
      }
      seguinte[b.id] = actual;
    }
    anteriorRef.current = seguinte;
  }, []);

  const updateAudio = useCallback((state) => {
    if (!nodesRef.current) return;

    const { bass, lead, leadHarmonic, delay, filter, ctx } = nodesRef.current;
    const now = ctx.currentTime;

    const silenciar = () => {
      bass.gain.gain.setTargetAtTime(0, now, 0.05);
      lead.gain.gain.setTargetAtTime(0, now, 0.05);
      leadHarmonic.gain.gain.setTargetAtTime(0, now, 0.05);
    };

    const { pendulum1, pendulum2, pivot } = state;
    if (isMutedRef.current || !isSimulatingRef.current || !pivot || !pendulum1 || !pendulum2) {
      silenciar();
      anteriorRef.current = null;
      return;
    }

    const escala = escalaRef.current;
    const vol1Multiplier = volume1Ref.current / 100;
    const vol2Multiplier = volume2Ref.current / 100;

    if (disparoRef.current !== 'continuo') {
      silenciar();
      dispararNotas(state, escala, vol1Multiplier, vol2Multiplier, filter, ctx);
      return;
    }
    anteriorRef.current = null;

    // Usar ángulos e velocidades (independentes da escala/zoom)
    const p1Angle = Number.isFinite(pendulum1.angle) ? pendulum1.angle : 0;
    const p1Velocity = Math.abs(Number.isFinite(pendulum1.velocity) ? pendulum1.velocity : 0);
    const p2Angle = Number.isFinite(pendulum2.angle) ? pendulum2.angle : 0;
    const p2Velocity = Math.abs(Number.isFinite(pendulum2.velocity) ? pendulum2.velocity : 0);

    // Normalizar: sin(angle) está en [-1, 1]
    // dx controla a frecuencia (esquerda = grave, dereita = agudo)
    const dx1 = Math.sin(p1Angle);
    // dy controla o volume baseándose na velocidade (máis rápido = máis forte).
    // As velocidades van en rad/s reais (≈36 veces as da física antiga).
    const dy1 = Math.min(1, p1Velocity / 29 + 0.3); // Base de 0.3 para que sempre soe algo

    const dx2 = Math.sin(p2Angle);
    const dy2 = Math.min(1, p2Velocity / 22 + 0.2);

    // Cunha escala, a altura salta de nota en nota en vez de esvarar
    const glide = escala === 'libre' ? 0.1 : 0.015;

    // Bass: Frecuencia baseada no ángulo do péndulo 1
    const freqBass = frecuencia(65.4, (dx1 + 1) / 2, 3, escala); // C2 a C5
    if (Number.isFinite(freqBass) && freqBass > 20) {
      bass.osc.frequency.setTargetAtTime(freqBass, now, glide);
    }
    bass.gain.gain.setTargetAtTime(dy1 * bass.baseVol * vol1Multiplier, now, 0.1);

    // Delay baseado na amplitude do ángulo
    const dTime = Math.max(0.05, Math.min(0.7, Math.abs(p1Angle) * 0.3));
    delay.delayTime.setTargetAtTime(dTime, now, 0.1);

    // Lead: Frecuencia baseada no ángulo do péndulo 2
    const freqLead = frecuencia(261.6, (dx2 + 1) / 2, 4, escala); // C4 a C8
    if (Number.isFinite(freqLead) && freqLead > 20) {
      lead.osc.frequency.setTargetAtTime(freqLead, now, Math.min(glide, 0.05));
      leadHarmonic.osc.frequency.setTargetAtTime(freqLead * 1.5, now, Math.min(glide, 0.05));
    }

    const volL = dy2 * lead.baseVol * vol2Multiplier;
    lead.gain.gain.setTargetAtTime(volL, now, 0.1);
    leadHarmonic.gain.gain.setTargetAtTime(volL * 0.4, now, 0.1);
  }, [dispararNotas]);

  return { initAudio, updateAudio };
};