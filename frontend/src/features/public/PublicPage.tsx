import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Crown, Loader2, ShieldCheck, Sparkles, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Background } from '../../components/Background';
import { Confetti } from '../../components/Confetti';
import { api, errorMessage } from '../../services/api';
import type { SpinResult, WheelData } from '../../types';
import { ResultModal } from './ResultModal';
import { Wheel, type SpinRequest } from '../wheel/Wheel';

const fetchWheel = async (): Promise<WheelData> => (await api.get<WheelData>('/wheel')).data;

function playSound(url: string) {
  if (!url) return;
  try {
    void new Audio(url).play().catch(() => undefined);
  } catch {
    /* sonido opcional */
  }
}

export function PublicPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({ queryKey: ['wheel'], queryFn: fetchWheel });
  const theme = data?.theme;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [spinRequest, setSpinRequest] = useState<SpinRequest | null>(null);
  const [spinResult, setSpinResult] = useState<SpinResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!theme) return;
    const style = document.documentElement.style;
    style.setProperty('--primary', theme.primaryColor);
    style.setProperty('--secondary', theme.secondaryColor);
    style.setProperty('--accent', theme.accentColor);
    style.setProperty('--text', theme.textColor);
    style.setProperty('--font', theme.fontFamily);
    document.title = `${theme.clubName} · Ruleta de premios`;
  }, [theme]);

  const spinMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post<SpinResult>('/spin', { name, phone, acceptedTerms: accepted });
      return response.data;
    },
    onSuccess: (result) => {
      setError('');
      setSpinResult(result);
      setSpinRequest({ id: Date.now(), segments: result.segments, winningIndex: result.winningIndex });
      playSound(theme?.spinSoundUrl ?? '');
    },
    onError: (mutationError) => setError(errorMessage(mutationError)),
  });

  const handleSpinComplete = () => {
    setShowResult(true);
    if (theme?.confettiEnabled) setConfetti(true);
    if (theme?.winSoundUrl) playSound(theme.winSoundUrl);
    else {
      const AudioContextClass = window.AudioContext
        ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass && theme?.effectsEnabled) {
        try {
          const context = new AudioContextClass();
          [523.25, 659.25, 783.99].forEach((frequency, index) => {
            const oscillator = context.createOscillator();
            const gain = context.createGain();
            oscillator.frequency.value = frequency;
            gain.gain.setValueAtTime(0.0001, context.currentTime + index * 0.12);
            gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + index * 0.12 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + index * 0.12 + 0.45);
            oscillator.connect(gain).connect(context.destination);
            oscillator.start(context.currentTime + index * 0.12);
            oscillator.stop(context.currentTime + index * 0.12 + 0.5);
          });
        } catch {
          /* audio no disponible */
        }
      }
    }
  };

  const reset = () => {
    setShowResult(false);
    setSpinResult(null);
    setSpinRequest(null);
    setConfetti(false);
    setAccepted(false);
    setError('');
    queryClient.invalidateQueries({ queryKey: ['wheel'] }).then(() => undefined);
    queryClient.refetchQueries({ queryKey: ['wheel'] }).then(() => undefined);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07030f]">
        <Loader2 className="animate-spin text-purple-400" size={42} />
      </div>
    );
  }

  if (isError || !data || !theme) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#07030f] px-6 text-center">
        <p className="font-display text-2xl font-bold">No se pudo cargar la ruleta</p>
        <p className="text-sm text-white/50">Verifica que el servidor esté en funcionamiento.</p>
        <button className="btn-neon" onClick={() => queryClient.invalidateQueries({ queryKey: ['wheel'] })}>
          Reintentar
        </button>
      </div>
    );
  }

  const canSpin = data.promotion.enabled && data.segments.length > 0 && !spinRequest;

  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      <Background theme={theme} />
      <Confetti active={confetti} colors={[theme.primaryColor, theme.secondaryColor, theme.accentColor, '#ffffff']} />

      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <div className="flex items-center gap-3">
          {theme.logoUrl ? (
            <img src={theme.logoUrl} alt={theme.clubName} className="h-11 w-auto object-contain" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 bg-gradient-to-br from-purple-500 to-cyan-400 font-display font-black">
              {theme.clubName.slice(0, 1)}
            </div>
          )}
          <div>
            <p className="font-display text-sm font-black tracking-[0.18em]">{theme.clubName}</p>
            <p className="text-[9px] uppercase tracking-[0.3em] text-white/40">Promociones</p>
          </div>
        </div>
        <a
          href="/admin"
          className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/35 transition hover:border-white/30 hover:text-white/70"
        >
          Admin
        </a>
      </header>

      <main className="mx-auto max-w-7xl px-5 pb-16 sm:px-8">
        <div className="mb-6 text-center">
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-white/60">
              <Sparkles size={12} /> Sorteo en vivo
            </div>
            <h1 className="neon-title text-4xl sm:text-6xl" style={{ color: theme.textColor }}>
              {theme.headline}
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm text-white/55 sm:text-base">{theme.subheadline}</p>
          </motion.div>
        </div>

        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,.95fr)]">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7 }}>
            <Wheel
              segments={data.segments}
              theme={theme}
              spinRequest={spinRequest}
              onSpinComplete={handleSpinComplete}
              disabled={!data.promotion.enabled}
            />
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.15 }}>
            <div className="card-dark relative overflow-hidden">
              <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[color:var(--primary)]/20 blur-3xl" />
              <div className="relative">
                <div className="mb-5 flex items-center gap-2">
                  <Crown size={18} className="text-[color:var(--primary)]" />
                  <h2 className="font-display text-lg font-bold tracking-wide">PARTICIPA AHORA</h2>
                </div>

                {!data.promotion.enabled ? (
                  <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-5 text-center">
                    <p className="font-display text-base font-bold text-amber-200">RULETA CERRADA</p>
                    <p className="mt-2 text-sm text-white/60">{data.promotion.finishedMessage}</p>
                  </div>
                ) : spinRequest ? (
                  <div className="flex flex-col items-center gap-3 py-8 text-center">
                    <Loader2 size={30} className="animate-spin text-[color:var(--primary)]" />
                    <p className="font-display text-sm font-bold tracking-widest">¡GIRANDO LA RULETA!</p>
                    <p className="text-xs text-white/45">La suerte está decidida por el servidor…</p>
                  </div>
                ) : (
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      if (!name.trim() || !phone.trim()) {
                        setError('Completa tu nombre y WhatsApp');
                        return;
                      }
                      if (!accepted) {
                        setError('Debes aceptar los términos y condiciones');
                        return;
                      }
                      spinMutation.mutate();
                    }}
                    className="space-y-3.5"
                  >
                    <div>
                      <label className="label-dark" htmlFor="name">Tu nombre</label>
                      <input
                        id="name"
                        className="input-dark"
                        placeholder="¿Cómo te llamas?"
                        value={name}
                        maxLength={80}
                        onChange={(event) => setName(event.target.value)}
                      />
                    </div>
                    <div>
                      <label className="label-dark" htmlFor="phone">Número de WhatsApp</label>
                      <input
                        id="phone"
                        className="input-dark"
                        placeholder="300 123 4567"
                        inputMode="tel"
                        value={phone}
                        maxLength={20}
                        onChange={(event) => setPhone(event.target.value)}
                      />
                    </div>
                    <label className="flex cursor-pointer items-start gap-2.5 pt-1 text-xs text-white/55">
                      <span
                        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                          accepted ? 'border-[color:var(--primary)] bg-[color:var(--primary)]' : 'border-white/25'
                        }`}
                        onClick={() => setAccepted(!accepted)}
                      >
                        {accepted && <Check size={12} strokeWidth={3} />}
                      </span>
                      <input type="checkbox" className="sr-only" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} />
                      <span>
                        Acepto los{' '}
                        <button type="button" className="font-semibold text-[color:var(--primary)] underline" onClick={() => setShowTerms(true)}>
                          términos y condiciones
                        </button>
                      </span>
                    </label>

                    <AnimatePresence>
                      {error && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                          {error}
                        </motion.p>
                      )}
                    </AnimatePresence>

                    <button type="submit" className="btn-neon mt-2 w-full py-4" disabled={spinMutation.isPending}>
                      {spinMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                      {theme.spinButtonText}
                    </button>

                    <p className="flex items-center justify-center gap-1.5 pt-1 text-[10px] text-white/35">
                      <ShieldCheck size={12} /> Resultado generado de forma segura · Máx. {data.promotion.maxPerPhone} giros por número
                    </p>
                  </form>
                )}
              </div>
            </div>

            {data.segments.length > 0 && (
              <div className="mt-5">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">Premios en juego</p>
                <div className="flex flex-wrap gap-2">
                  {data.segments.map((segment) => (
                    <span key={segment.id} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-white/70">
                      <span>{segment.icon}</span> {segment.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </main>

      <footer className="border-t border-white/5 py-5 text-center text-[10px] uppercase tracking-widest text-white/25">
        {theme.footerText}
      </footer>

      <AnimatePresence>
        {showTerms && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="glass-strong w-full max-w-md rounded-2xl p-6">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-display font-bold">Términos y condiciones</h3>
                <button onClick={() => setShowTerms(false)} className="text-white/50 hover:text-white"><X size={18} /></button>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/65">{theme.termsText}</p>
              <button className="btn-neon mt-5 w-full" onClick={() => { setAccepted(true); setShowTerms(false); }}>Aceptar y continuar</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ResultModal result={showResult ? spinResult : null} theme={theme} onClose={reset} />
    </div>
  );
}
