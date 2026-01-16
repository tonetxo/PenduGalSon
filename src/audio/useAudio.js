import { useRef, useCallback } from 'react';

export const useAudio = (isMuted, isSimulating, volume1 = 70, volume2 = 50) => {
  const audioCtxRef = useRef(null);
  const nodesRef = useRef(null);

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
      nodesRef.current = { bass, lead, leadHarmonic, delay, master, ctx };

      if (ctx.state === 'suspended') await ctx.resume();
    } catch (e) {
      console.error("Audio error", e);
    }
  }, []);

  const updateAudio = useCallback((state) => {
    if (!nodesRef.current) return;

    const { bass, lead, leadHarmonic, delay, ctx } = nodesRef.current;
    const now = ctx.currentTime;

    const { pendulum1, pendulum2, pivot } = state;
    if (isMuted || !isSimulating || !pivot || !pendulum1 || !pendulum2) {
      bass.gain.gain.setTargetAtTime(0, now, 0.05);
      lead.gain.gain.setTargetAtTime(0, now, 0.05);
      leadHarmonic.gain.gain.setTargetAtTime(0, now, 0.05);
      return;
    }

    // Usar ángulos e velocidades (independentes da escala/zoom)
    const p1Angle = Number.isFinite(pendulum1.angle) ? pendulum1.angle : 0;
    const p1Velocity = Math.abs(Number.isFinite(pendulum1.velocity) ? pendulum1.velocity : 0);
    const p2Angle = Number.isFinite(pendulum2.angle) ? pendulum2.angle : 0;
    const p2Velocity = Math.abs(Number.isFinite(pendulum2.velocity) ? pendulum2.velocity : 0);

    // Normalizar: sin(angle) está en [-1, 1]
    // dx controla a frecuencia (esquerda = grave, dereita = agudo)
    const dx1 = Math.sin(p1Angle);
    // dy controla o volume baseándose na velocidade (máis rápido = máis forte)
    const dy1 = Math.min(1, p1Velocity / 0.8 + 0.3); // Base de 0.3 para que sempre soe algo

    const dx2 = Math.sin(p2Angle);
    const dy2 = Math.min(1, p2Velocity / 0.6 + 0.2);

    // Bass: Frecuencia baseada no ángulo do péndulo 1
    const freqBass = 65.4 * Math.pow(2, (dx1 + 1) * 1.5); // C2 a C5
    if (Number.isFinite(freqBass) && freqBass > 20) {
      bass.osc.frequency.setTargetAtTime(freqBass, now, 0.1);
    }
    const vol1Multiplier = volume1 / 100;
    bass.gain.gain.setTargetAtTime(dy1 * bass.baseVol * vol1Multiplier, now, 0.1);

    // Delay baseado na amplitude do ángulo
    const dTime = Math.max(0.05, Math.min(0.7, Math.abs(p1Angle) * 0.3));
    delay.delayTime.setTargetAtTime(dTime, now, 0.1);

    // Lead: Frecuencia baseada no ángulo do péndulo 2
    const freqLead = 261.6 * Math.pow(2, (dx2 + 1) * 2); // C4 a C8
    if (Number.isFinite(freqLead) && freqLead > 20) {
      lead.osc.frequency.setTargetAtTime(freqLead, now, 0.05);
      leadHarmonic.osc.frequency.setTargetAtTime(freqLead * 1.5, now, 0.05);
    }

    const vol2Multiplier = volume2 / 100;
    const volL = dy2 * lead.baseVol * vol2Multiplier;
    lead.gain.gain.setTargetAtTime(volL, now, 0.1);
    leadHarmonic.gain.gain.setTargetAtTime(volL * 0.4, now, 0.1);
  }, [isMuted, isSimulating, volume1, volume2]);

  return { initAudio, updateAudio };
};