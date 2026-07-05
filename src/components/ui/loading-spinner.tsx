import React from 'react';
import { motion, Variants } from 'framer-motion';

/* ─────────────────────────────────────────────────────────────────
   ChatBubbleLoader – a lightweight, GPU-composited loading screen.
   All animations use transform/opacity only → no layout thrashing.
───────────────────────────────────────────────────────────────── */

const bubbles = [
  { side: 'left',  delay: 0,    color: 'from-violet-500 to-purple-600' },
  { side: 'right', delay: 0.35, color: 'from-orange-400 to-amber-500'  },
  { side: 'left',  delay: 0.7,  color: 'from-violet-500 to-purple-600' },
] as const;

const bubbleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.4, y: 10 },
  visible: (delay: number) => ({
    opacity: [0, 1, 1, 0],
    scale:   [0.4, 1, 1, 0.4],
    y:       [10, 0, 0, 10],
    transition: {
      delay,
      duration: 1.6,
      repeat: Infinity,
      repeatDelay: 0.4,
      ease: 'easeInOut' as const,
      times: [0, 0.2, 0.8, 1],
    },
  }),
};

const dotVariants: Variants = {
  animate: (i: number) => ({
    y: [0, -5, 0],
    transition: {
      delay: i * 0.15,
      duration: 0.6,
      repeat: Infinity,
      repeatDelay: 0.8,
      ease: 'easeInOut' as const,
    },
  }),
};

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-8">
      {/* Chat bubble stack */}
      <div className="flex flex-col gap-3 w-56">
        {bubbles.map((b, i) => (
          <motion.div
            key={i}
            className={`flex ${b.side === 'right' ? 'justify-end' : 'justify-start'}`}
            custom={b.delay}
            initial="hidden"
            animate="visible"
            variants={bubbleVariants}
          >
            <div
              className={`
                bg-gradient-to-br ${b.color}
                rounded-2xl px-4 py-3 flex items-center gap-1.5 shadow-lg
                ${b.side === 'right' ? 'rounded-br-sm' : 'rounded-bl-sm'}
              `}
            >
              {[0, 1, 2].map((dot) => (
                <motion.span
                  key={dot}
                  custom={dot}
                  animate="animate"
                  variants={dotVariants}
                  className="w-2 h-2 rounded-full bg-white/90 block"
                />
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* App label */}
      <motion.div
        className="flex flex-col items-center gap-1"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <span className="text-lg font-bold bg-gradient-to-r from-violet-500 to-orange-400 bg-clip-text text-transparent tracking-wide">
          ChatBuzz
        </span>
        <motion.span
          className="text-xs text-muted-foreground/70 tracking-widest uppercase"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' as const }}
        >
          connecting you…
        </motion.span>
      </motion.div>
    </div>
  );
};
