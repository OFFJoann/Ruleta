import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Clock3, Copy, MessageCircle, RotateCcw, Ticket } from 'lucide-react';
import { useState } from 'react';
import type { SpinResult, Theme } from '../../types';

interface Props {
  result: SpinResult | null;
  theme: Theme;
  onClose: () => void;
}

export function ResultModal({ result, theme, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.participation.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <AnimatePresence>
      {result && (
        <motion.div
          className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="glass-strong relative my-6 w-full max-w-lg overflow-hidden rounded-3xl p-1 shadow-2xl"
            initial={{ scale: 0.75, y: 60, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={{ type: 'spring', damping: 18, stiffness: 180 }}
          >
            <div
              className="absolute inset-x-0 top-0 h-40 opacity-40 blur-2xl"
              style={{ background: `linear-gradient(90deg, ${theme.primaryColor}, ${theme.accentColor})` }}
            />
            <div className="relative rounded-[22px] bg-[#0d0719]/95 p-6 text-center sm:p-8">
              <motion.div
                className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full text-3xl"
                style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})` }}
                animate={{ scale: [1, 1.12, 1], rotate: [0, 8, -8, 0] }}
                transition={{ repeat: Infinity, duration: 2.4 }}
              >
                🎉
              </motion.div>

              <h2
                className="neon-title text-2xl sm:text-3xl"
                style={{ color: theme.textColor }}
              >
                {result.result.title}
              </h2>
              <p className="mt-3 text-base font-semibold text-white/90">{result.result.message}</p>
              {result.result.description && (
                <p className="mt-2 text-sm leading-relaxed text-white/55">{result.result.description}</p>
              )}

              {result.result.imageUrl && (
                <img
                  src={result.result.imageUrl}
                  alt="Celebración"
                  className="mx-auto mt-4 max-h-44 rounded-xl object-contain"
                />
              )}

              <div className="mt-5 rounded-2xl border border-dashed border-white/20 bg-white/5 p-4">
                <div className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">
                  <Ticket size={13} /> Tu código único
                </div>
                <button
                  onClick={copyCode}
                  className="mt-2 flex w-full items-center justify-center gap-2 font-display text-xl font-black tracking-widest text-white transition hover:text-[color:var(--primary)]"
                >
                  {result.participation.code}
                  {copied ? <CheckCircle2 size={16} className="text-green-400" /> : <Copy size={16} className="opacity-60" />}
                </button>
                <p className="mt-1 text-[11px] text-white/40">
                  {copied ? '¡Copiado!' : 'Presiona para copiar · Guárdalo para reclamar'}
                </p>
              </div>

              {result.result.instructions && (
                <div className="mt-4 flex gap-2 rounded-xl bg-white/5 p-3 text-left text-xs leading-relaxed text-white/70">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-400" />
                  <span>{result.result.instructions}</span>
                </div>
              )}
              {result.result.expiresAt && (
                <div className="mt-2 flex items-center gap-2 text-xs text-white/50">
                  <Clock3 size={14} /> Vigencia: {result.result.expiresAt}
                </div>
              )}

              <a
                href={result.result.whatsapp.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-neon mt-6 w-full"
              >
                <MessageCircle size={17} /> {result.result.whatsapp.buttonText}
              </a>

              {result.result.terms && (
                <p className="mt-4 text-[10px] leading-relaxed text-white/35">{result.result.terms}</p>
              )}

              <button onClick={onClose} className="mt-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white/50 transition hover:text-white">
                <RotateCcw size={13} /> Volver a intentar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
