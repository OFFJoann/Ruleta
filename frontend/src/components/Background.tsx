import type { Theme } from '../types';

export function Background({ theme }: { theme: Theme }) {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#07030f]">
      {theme.backgroundVideoUrl ? (
        <video
          className="absolute inset-0 h-full w-full object-cover opacity-40"
          src={theme.backgroundVideoUrl}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
        />
      ) : theme.backgroundUrl ? (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-50"
          style={{ backgroundImage: `url(${theme.backgroundUrl})` }}
        />
      ) : null}

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(120,40,200,.30),transparent_55%),radial-gradient(ellipse_at_50%_100%,rgba(0,180,220,.20),transparent_50%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#07030f]/70 via-transparent to-[#07030f]" />

      {theme.effectsEnabled && (
        <>
          <div className="light-beam left-[12%] animate-glow" style={{ transform: 'rotate(-18deg)' }} />
          <div className="light-beam left-[45%] animate-glow" style={{ transform: 'rotate(8deg)', animationDelay: '0.8s' }} />
          <div className="light-beam right-[12%] animate-glow" style={{ transform: 'rotate(22deg)', animationDelay: '1.6s' }} />
          <div className="absolute inset-x-0 bottom-0 h-56 grid-floor opacity-60" />
        </>
      )}

      {Array.from({ length: 28 }).map((_, index) => (
        <span
          key={index}
          className="absolute h-[3px] w-[3px] rounded-full bg-white/70 animate-glow"
          style={{
            left: `${(index * 37) % 100}%`,
            top: `${(index * 61) % 100}%`,
            animationDelay: `${(index % 7) * 0.4}s`,
          }}
        />
      ))}
    </div>
  );
}
