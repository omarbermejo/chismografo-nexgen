import type { Variants } from 'framer-motion'

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.25 } },
}

export const slideDown: Variants = {
  hidden: { opacity: 0, y: -12, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.28, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
}

export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
}

export const threadLine: Variants = {
  hidden: { scaleY: 0, opacity: 0 },
  show: { scaleY: 1, opacity: 1, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { scaleY: 0, opacity: 0, transition: { duration: 0.15 } },
}

/* ─── Movimiento "cuaderno" ─── */

// La nota cae y se asienta con su inclinación (--tilt la pone el componente).
export const pageSettle: Variants = {
  hidden: { opacity: 0, y: 14, rotate: 0 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 320, damping: 26 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
}

// La cinta cae justo después de la nota.
export const tapeDrop: Variants = {
  hidden: { opacity: 0, y: -10, rotate: -12 },
  show: { opacity: 0.9, y: 0, rotate: -4, transition: { type: 'spring', stiffness: 300, damping: 18, delay: 0.12 } },
}

// Revelar secreto: el marcador se borra con un barrido L→R.
export const reveal: Variants = {
  hidden: { clipPath: 'inset(0 0 0 0)' },
  show: { clipPath: 'inset(0 100% 0 0)', transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] } },
}

// Voltear hoja (repost / submit cuestionario = "pásalo").
export const passPage: Variants = {
  hidden: { rotateY: 0, opacity: 1 },
  show: { rotateY: -160, opacity: 0, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } },
}

// Trazo de resaltador que crece bajo un título.
export const highlightSweep: Variants = {
  hidden: { scaleX: 0 },
  show: { scaleX: 1, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1], delay: 0.15 } },
}
