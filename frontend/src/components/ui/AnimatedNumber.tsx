'use client';

import React, { useEffect, useRef } from 'react';
import { useMotionValue, animate, useReducedMotion } from 'framer-motion';

export default function AnimatedNumber({ value, precision = 6 }: { value: number; precision?: number }) {
    const shouldReduceMotion = useReducedMotion();
    const motionValue = useMotionValue(value);
    const textRef = useRef<HTMLSpanElement>(null);
    const prevValueRef = useRef(value);

    useEffect(() => {
        if (shouldReduceMotion) {
            if (textRef.current) {
                textRef.current.textContent = value.toFixed(precision);
            }
            return;
        }

        // Start animation from the previous value
        motionValue.set(prevValueRef.current);
        const controls = animate(motionValue, value, {
            duration: 1.0,
            ease: [0.16, 1, 0.3, 1], // Expo out curve
        });

        const unsubscribe = motionValue.on('change', (latest) => {
            if (textRef.current) {
                textRef.current.textContent = latest.toFixed(precision);
            }
        });

        prevValueRef.current = value;

        return () => {
            controls.stop();
            unsubscribe();
        };
    }, [value, precision, motionValue, shouldReduceMotion]);

    return <span ref={textRef}>{value.toFixed(precision)}</span>;
}
