'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import Navigation from '@/components/Navigation';

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const shouldReduceMotion = useReducedMotion();
    // Landing page manages its own spacing; app pages need top padding for content
    const isLandingPage = pathname === '/';
    // Auth pages (login/signup) center their content, no extra padding needed
    const isAuthPage = pathname === '/login' || pathname === '/signup';

    const variants = shouldReduceMotion
        ? {
              initial: { opacity: 0 },
              animate: { opacity: 1 },
              exit: { opacity: 0 }
          }
        : {
              initial: { opacity: 0, y: 12 },
              animate: { opacity: 1, y: 0 },
              exit: { opacity: 0, y: -12 }
          };

    return (
        <>
            {/* Dynamic Island nav floats above all pages */}
            <Navigation />
            <div className={
                isLandingPage ? '' :
                isAuthPage    ? '' :
                                'pt-20 min-h-screen'
            }>
                <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                        key={pathname}
                        variants={variants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            </div>
        </>
    );
}
