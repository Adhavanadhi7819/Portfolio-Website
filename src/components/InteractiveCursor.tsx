import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';

type CursorVariant = 'default' | 'pointer' | 'zoom' | 'text';

export const InteractiveCursor: React.FC = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [variant, setVariant] = useState<CursorVariant>('default');

  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // Ultra-responsive core dot + fluid trailing reticle ring
  const dotX = useSpring(mouseX, { stiffness: 1400, damping: 48, mass: 0.15 });
  const dotY = useSpring(mouseY, { stiffness: 1400, damping: 48, mass: 0.15 });

  const ringX = useSpring(mouseX, { stiffness: 420, damping: 32, mass: 0.42 });
  const ringY = useSpring(mouseY, { stiffness: 420, damping: 32, mass: 0.42 });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const finePointer = window.matchMedia('(pointer: fine)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const updateAvailability = () => {
      const active = finePointer.matches && !reducedMotion.matches;
      setIsEnabled(active);
      if (active) {
        document.body.classList.add('has-custom-cursor');
      } else {
        document.body.classList.remove('has-custom-cursor');
      }
    };

    updateAvailability();
    finePointer.addEventListener('change', updateAvailability);
    reducedMotion.addEventListener('change', updateAvailability);

    return () => {
      finePointer.removeEventListener('change', updateAvailability);
      reducedMotion.removeEventListener('change', updateAvailability);
      document.body.classList.remove('has-custom-cursor');
    };
  }, []);

  useEffect(() => {
    if (!isEnabled) return;

    const resolveVariant = (target: EventTarget | null): CursorVariant => {
      const el = target as HTMLElement | null;
      if (!el || typeof el.closest !== 'function') return 'default';

      if (el.closest('input, textarea, [contenteditable="true"]')) {
        return 'text';
      }
      if (el.closest('[data-cursor="view"], .cursor-zoom-in')) {
        return 'zoom';
      }
      if (
        el.closest(
          'a, button, [role="button"], [role="tab"], label, select, .cursor-pointer'
        )
      ) {
        return 'pointer';
      }
      return 'default';
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      setIsVisible(true);
      setVariant(resolveVariant(e.target));
    };

    const handleMouseDown = () => setIsPressed(true);
    const handleMouseUp = () => setIsPressed(false);
    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mousedown', handleMouseDown, { passive: true });
    window.addEventListener('mouseup', handleMouseUp, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [isEnabled, mouseX, mouseY]);

  if (!isEnabled) return null;

  const ringSize =
    variant === 'zoom'
      ? 54
      : variant === 'pointer'
      ? 42
      : variant === 'text'
      ? 14
      : 28;

  const ringScale = isPressed ? 0.8 : 1;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden"
      aria-hidden="true"
    >
      {/* Fluid Trailing Ring */}
      <motion.div
        style={{
          x: ringX,
          y: ringY,
          translateX: '-50%',
          translateY: '-50%'
        }}
        animate={{
          width: ringSize,
          height: ringSize,
          scale: ringScale,
          opacity: isVisible ? (variant === 'text' ? 0.25 : 1) : 0,
          borderColor:
            variant === 'pointer' || variant === 'zoom'
              ? 'rgba(192, 169, 223, 0.95)'
              : 'rgba(192, 169, 223, 0.5)',
          backgroundColor:
            variant === 'zoom'
              ? 'rgba(192, 169, 223, 0.16)'
              : variant === 'pointer'
              ? 'rgba(192, 169, 223, 0.08)'
              : 'rgba(192, 169, 223, 0)'
        }}
        transition={{
          type: 'spring',
          stiffness: 460,
          damping: 32,
          opacity: { duration: 0.15 }
        }}
        className="fixed top-0 left-0 rounded-full border backdrop-blur-[1px] flex items-center justify-center shadow-[0_0_18px_rgba(192,169,223,0.22)]"
      >
        {variant === 'zoom' && (
          <motion.span
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-[9px] font-mono font-bold tracking-widest text-amber-300 uppercase select-none"
          >
            VIEW
          </motion.span>
        )}
      </motion.div>

      {/* Precision Center Core Dot */}
      <motion.div
        style={{
          x: dotX,
          y: dotY,
          translateX: '-50%',
          translateY: '-50%'
        }}
        animate={{
          scale: isPressed ? 1.45 : variant === 'zoom' ? 0 : variant === 'pointer' ? 0.65 : 1,
          opacity: isVisible && variant !== 'text' ? 1 : 0
        }}
        transition={{
          type: 'spring',
          stiffness: 650,
          damping: 35,
          opacity: { duration: 0.12 }
        }}
        className="fixed top-0 left-0 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(192,169,223,0.9)]"
      />
    </div>
  );
};
