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

    // Validar valores numéricos antes de usar
    const safeP1X = Number.isFinite(pendulum1.x) ? pendulum1.x : 0;
    const safeP1Y = Number.isFinite(pendulum1.y) ? pendulum1.y : 0;
    const safeP2X = Number.isFinite(pendulum2.x) ? pendulum2.x : 0;
    const safeP2Y = Number.isFinite(pendulum2.y) ? pendulum2.y : 0;
    const safePivotX = Number.isFinite(pivot.x) ? pivot.x : 0;
    const safePivotY = Number.isFinite(pivot.y) ? pivot.y : 0;

    const dx1 = Math.max(-2, Math.min(2, (safeP1X - safePivotX) / 400));
    const dy1 = Math.max(0, Math.min(1, 1 - (safeP1Y - safePivotY + 300) / 600));
    const dx2 = Math.max(-2, Math.min(2, (safeP2X - safePivotX) / 400));
    const dy2 = Math.max(0, Math.min(1, 1 - (safeP2Y - safePivotY + 300) / 600));

    const freqBass = 65.4 * Math.pow(2, (dx1 + 1) * 2);
    if (Number.isFinite(freqBass) && freqBass > 20) {
      bass.osc.frequency.setTargetAtTime(freqBass, now, 0.1);
    }
    const vol1Multiplier = volume1 / 100;
    bass.gain.gain.setTargetAtTime(dy1 * bass.baseVol * vol1Multiplier, now, 0.1);

    const dTime = Math.max(0, Math.min(0.9, Math.abs(dx1) * 0.5));
    delay.delayTime.setTargetAtTime(dTime, now, 0.1);

    const freqLead = 261.6 * Math.pow(2, (dx2 + 1) * 3);
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