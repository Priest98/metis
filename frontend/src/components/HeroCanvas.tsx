'use client';

import { useEffect, useRef } from 'react';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    r: number;
}

interface Signal {
    from: number;
    to: number;
    progress: number;
    speed: number;
    opacity: number;
}

/** Read the current theme's ink color channels from CSS variables */
function getInkRgb(): [number, number, number] {
    const raw = getComputedStyle(document.documentElement)
        .getPropertyValue('--color-ink-rgb').trim();
    const parts = raw.split(' ').map(Number);
    return [parts[0] ?? 236, parts[1] ?? 238, parts[2] ?? 244];
}

export default function HeroCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animId: number;
        let particles: Particle[] = [];
        let signals: Signal[] = [];
        let inkRgb: [number, number, number] = getInkRgb();

        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            canvas.width  = canvas.offsetWidth  * dpr;
            canvas.height = canvas.offsetHeight * dpr;
            ctx.scale(dpr, dpr);
        };

        const init = () => {
            resize();
            inkRgb = getInkRgb(); // refresh on every resize / theme change
            const W = canvas.offsetWidth;
            const H = canvas.offsetHeight;
            const count = Math.min(Math.floor((W * H) / 14000), 70);
            particles = Array.from({ length: count }, () => ({
                x:  Math.random() * W,
                y:  Math.random() * H,
                vx: (Math.random() - 0.5) * 0.25,
                vy: (Math.random() - 0.5) * 0.25,
                r:  Math.random() * 1.2 + 0.8,
            }));
        };

        const draw = () => {
            const W = canvas.offsetWidth;
            const H = canvas.offsetHeight;
            const [r, g, b] = inkRgb;
            ctx.clearRect(0, 0, W, H);

            // ── Move particles ──────────────────────────────────
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0 || p.x > W) p.vx *= -1;
                if (p.y < 0 || p.y > H) p.vy *= -1;
            });

            // ── Draw connection lines ────────────────────────────
            const MAX_DIST = 140;
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx   = particles[i].x - particles[j].x;
                    const dy   = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < MAX_DIST) {
                        const alpha = (1 - dist / MAX_DIST) * 0.12;
                        ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }

            // ── Draw particles ───────────────────────────────────
            particles.forEach(p => {
                ctx.fillStyle = `rgba(${r},${g},${b},0.35)`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fill();
            });

            // ── Spawn signals randomly ───────────────────────────
            if (Math.random() < 0.006 && signals.length < 6 && particles.length > 1) {
                const from = Math.floor(Math.random() * particles.length);
                let   to   = Math.floor(Math.random() * particles.length);
                if (to === from) to = (to + 1) % particles.length;
                signals.push({ from, to, progress: 0, speed: 0.012 + Math.random() * 0.01, opacity: 1 });
            }

            // ── Draw & advance signals ───────────────────────────
            signals = signals.filter(s => {
                s.progress += s.speed;
                const pFrom = particles[s.from];
                const pTo   = particles[s.to];
                if (!pFrom || !pTo) return false;

                const x = pFrom.x + (pTo.x - pFrom.x) * s.progress;
                const y = pFrom.y + (pTo.y - pFrom.y) * s.progress;
                const fade = Math.sin(s.progress * Math.PI); // 0→1→0

                // Trail line
                ctx.strokeStyle = `rgba(215,255,62,${0.35 * fade})`;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(pFrom.x, pFrom.y);
                ctx.lineTo(x, y);
                ctx.stroke();

                // Glowing dot
                ctx.shadowColor  = '#D7FF3E';
                ctx.shadowBlur   = 8;
                ctx.fillStyle    = `rgba(215,255,62,${0.9 * fade})`;
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;

                return s.progress < 1;
            });

            animId = requestAnimationFrame(draw);
        };

        init();
        draw();

        const onResize = () => { init(); };
        window.addEventListener('resize', onResize);

        // Re-read theme colors when the html class changes (dark ↔ light)
        const observer = new MutationObserver(() => {
            inkRgb = getInkRgb();
        });
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class'],
        });

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('resize', onResize);
            observer.disconnect();
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="pointer-events-none absolute inset-0 h-full w-full opacity-40 lg:opacity-70"
            aria-hidden="true"
            style={{ display: 'block' }}
        />
    );
}
