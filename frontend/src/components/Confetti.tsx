import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  spin: number;
  shape: 'rect' | 'circle';
}

export function Confetti({ active, colors }: { active: boolean; colors: string[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const particles: Particle[] = Array.from({ length: 170 }, () => ({
      x: canvas.width * (0.25 + Math.random() * 0.5),
      y: canvas.height * 0.35 + Math.random() * 60,
      vx: (Math.random() - 0.5) * 13,
      vy: -Math.random() * 13 - 3,
      size: 5 + Math.random() * 9,
      color: colors[Math.floor(Math.random() * colors.length)] ?? '#a855f7',
      rotation: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.3,
      shape: Math.random() > 0.5 ? 'rect' : 'circle',
    }));

    let frame = 0;
    let animation = 0;
    const draw = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      frame += 1;
      particles.forEach((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.22;
        particle.vx *= 0.995;
        particle.rotation += particle.spin;
        context.save();
        context.translate(particle.x, particle.y);
        context.rotate(particle.rotation);
        context.globalAlpha = Math.max(0, 1 - frame / 190);
        context.fillStyle = particle.color;
        if (particle.shape === 'circle') {
          context.beginPath();
          context.arc(0, 0, particle.size / 2, 0, Math.PI * 2);
          context.fill();
        } else {
          context.fillRect(-particle.size / 2, -particle.size / 4, particle.size, particle.size / 2);
        }
        context.restore();
      });
      if (frame < 200) animation = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animation);
  }, [active, colors]);

  if (!active) return null;
  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-50" />;
}
