import { useEffect, useRef, useState } from 'react';
import type { Segment, Theme } from '../../types';

export interface SpinRequest {
  id: number;
  segments: Segment[];
  winningIndex: number;
}

interface Props {
  segments: Segment[];
  theme: Theme;
  spinRequest: SpinRequest | null;
  onSpinComplete: () => void;
  disabled?: boolean;
}

const RADIUS = 190;
const SPIN_DURATION = 5200;

function polar(angleDegrees: number, radius: number) {
  const radians = (angleDegrees * Math.PI) / 180;
  return { x: radius * Math.sin(radians), y: -radius * Math.cos(radians) };
}

function segmentPath(start: number, end: number) {
  const from = polar(start, RADIUS);
  const to = polar(end, RADIUS);
  const largeArc = end - start > 180 ? 1 : 0;
  return `M 0 0 L ${from.x.toFixed(2)} ${from.y.toFixed(2)} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${to.x.toFixed(2)} ${to.y.toFixed(2)} Z`;
}

export function Wheel({ segments, theme, spinRequest, onSpinComplete, disabled }: Props) {
  const baseRotation = segments.length ? -180 / segments.length : 0;
  const [view, setView] = useState<{ segments: Segment[]; rotation: number; rotating: boolean }>({
    segments,
    rotation: baseRotation,
    rotating: false,
  });
  const rotationRef = useRef(baseRotation);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!spinRequest || spinRequest.segments.length === 0) return;
    const count = spinRequest.segments.length;
    const segmentAngle = 360 / count;
    const center = (spinRequest.winningIndex + 0.5) * segmentAngle;
    const jitter = (Math.random() - 0.5) * segmentAngle * 0.45;
    const desired = ((-center + jitter) % 360 + 360) % 360;
    const current = rotationRef.current;
    const delta = ((desired - current) % 360 + 360) % 360;
    const target = current + 360 * 6 + delta;

    rotationRef.current = target;
    setView({ segments: spinRequest.segments, rotation: target, rotating: true });

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setView((previous) => ({ ...previous, rotating: false }));
      onSpinComplete();
    }, SPIN_DURATION + 120);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinRequest?.id]);

  useEffect(() => {
    if (spinRequest || view.rotating) return;
    rotationRef.current = baseRotation;
    setView({ segments, rotation: baseRotation, rotating: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segments]);

  const count = view.segments.length || 1;
  const segmentAngle = 360 / count;
  const fontSize = count > 12 ? 9 : count > 8 ? 11 : 13;

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[580px] select-none">
      <div
        className="absolute inset-[-3%] rounded-full opacity-90"
        style={{
          background: `conic-gradient(from 0deg, ${theme.primaryColor}, ${theme.secondaryColor}, ${theme.accentColor}, ${theme.primaryColor})`,
          boxShadow: `0 0 60px color-mix(in srgb, ${theme.primaryColor} 55%, transparent), 0 0 120px color-mix(in srgb, ${theme.secondaryColor} 25%, transparent)`,
        }}
      />
      <div className="absolute inset-[1.5%] rounded-full bg-[#08050f] p-[6px]">
        <div
          className="relative h-full w-full overflow-hidden rounded-full"
          style={
            theme.wheelBackgroundUrl
              ? { backgroundImage: `url(${theme.wheelBackgroundUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
              : { background: 'radial-gradient(circle at 50% 35%, #1d1230, #08050f 72%)' }
          }
        >
          <svg
            viewBox="-200 -200 400 400"
            className="wheel-shadow h-full w-full"
            role="img"
            aria-label="Ruleta de premios"
          >
            <defs>
              {view.segments.map((segment) => (
                <clipPath key={`clip-${segment.id}`} id={`wheel-clip-${segment.id}`}>
                  <path d={segmentPath(0, segmentAngle)} />
                </clipPath>
              ))}
            </defs>

            <g
              style={{
                transform: `rotate(${view.rotation}deg)`,
                transformOrigin: '0px 0px',
                transition: view.rotating
                  ? `transform ${SPIN_DURATION}ms cubic-bezier(0.12, 0.72, 0.08, 1)`
                  : 'none',
              }}
            >
              {view.segments.map((segment, index) => {
                const start = index * segmentAngle;
                const end = start + segmentAngle;
                const center = start + segmentAngle / 2;
                const labelPosition = polar(center, 128);
                return (
                  <g key={`${segment.id}-${index}`}>
                    <g transform={`rotate(${start})`}>
                      <path d={segmentPath(0, segmentAngle)} fill={segment.color} />
                      {segment.imageUrl && (
                        <image
                          href={segment.imageUrl}
                          x={-RADIUS}
                          y={-RADIUS}
                          width={RADIUS * 2}
                          height={RADIUS * 2}
                          preserveAspectRatio="xMidYMid slice"
                          clipPath={`url(#wheel-clip-${segment.id})`}
                          opacity={0.32}
                        />
                      )}
                      <path
                        d={segmentPath(0, segmentAngle)}
                        fill="none"
                        stroke="rgba(255,255,255,.22)"
                        strokeWidth={1.2}
                      />
                    </g>
                    <text
                      x={labelPosition.x}
                      y={labelPosition.y - 6}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={fontSize + 9}
                    >
                      {segment.icon}
                    </text>
                    <text
                      x={labelPosition.x}
                      y={labelPosition.y + 11}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#fff"
                      fontSize={fontSize}
                      fontWeight={800}
                      style={{ paintOrder: 'stroke', stroke: 'rgba(0,0,0,.45)', strokeWidth: 2.4 }}
                    >
                      {segment.name.length > 15 ? `${segment.name.slice(0, 14)}…` : segment.name}
                    </text>
                  </g>
                );
              })}
            </g>

            <circle r={RADIUS - 1} fill="none" stroke="rgba(255,255,255,.25)" strokeWidth={2} />
            <circle r={78} fill="#0b0616" stroke="rgba(255,255,255,.2)" strokeWidth={2} />
          </svg>

          <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 aspect-square w-[26%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full border-[3px] border-white/30 shadow-[0_0_30px_rgba(0,0,0,.8)]">
            {theme.wheelCenterVideoUrl ? (
              <video
                className="h-full w-full object-cover"
                src={theme.wheelCenterVideoUrl}
                poster={theme.wheelCenterPosterUrl || undefined}
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
              />
            ) : theme.wheelCenterImageUrl ? (
              <img className="h-full w-full object-cover" src={theme.wheelCenterImageUrl} alt="Centro de la ruleta" />
            ) : theme.wheelCenterPosterUrl ? (
              <img className="h-full w-full object-cover" src={theme.wheelCenterPosterUrl} alt="Centro de la ruleta" />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center font-display text-2xl font-black"
                style={{
                  background: `radial-gradient(circle, ${theme.primaryColor}, #0a0514 75%)`,
                  color: '#fff',
                }}
              >
                {theme.clubName.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          <div className="absolute inset-[1.5%] rounded-full border-[6px] border-[#0b0616]/80" />
          {Array.from({ length: 36 }).map((_, index) => {
            const position = polar((index * 360) / 36, 186);
            return (
              <span
                key={index}
                className="absolute h-[5px] w-[5px] -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  left: `calc(50% + ${position.x}px)`,
                  top: `calc(50% + ${position.y}px)`,
                  background: index % 3 === 0 ? '#fff' : theme.pointerColor,
                  boxShadow: `0 0 8px ${theme.pointerColor}`,
                  opacity: 0.9,
                }}
              />
            );
          })}
        </div>
      </div>

      <div className="absolute left-1/2 top-[-2%] z-20 -translate-x-1/2 drop-shadow-[0_6px_10px_rgba(0,0,0,.8)]">
        <svg width="42" height="54" viewBox="0 0 44 56" aria-hidden="true">
          <path d="M22 55 L4 10 Q22 -2 40 10 Z" fill={theme.pointerColor} stroke="#fff" strokeWidth="1.6" />
          <circle cx="22" cy="15" r="4" fill="#fff" opacity=".85" />
        </svg>
      </div>

      {disabled && (
        <div className="absolute inset-0 z-30 flex items-center justify-center rounded-full bg-black/60 text-center font-display text-lg font-bold text-white/80">
          RULETA NO DISPONIBLE
        </div>
      )}
    </div>
  );
}
