import confetti from 'canvas-confetti'

const GREENS = ['#39e079', '#2bc463', '#1a9e52', '#0d7a3a', '#b6ffd3']

export function fireConfetti(originX = 0.5, originY = 0.6) {
  const base = {
    colors: GREENS,
    startVelocity: 28,
    spread: 90,
    ticks: 80,
    gravity: 0.9,
    scalar: 0.9,
    drift: 0,
  }

  // left burst
  confetti({ ...base, particleCount: 55, angle: 60, origin: { x: 0, y: originY } })
  // right burst
  confetti({ ...base, particleCount: 55, angle: 120, origin: { x: 1, y: originY } })
  // center pop
  confetti({ ...base, particleCount: 35, angle: 90, spread: 60, startVelocity: 22, origin: { x: originX, y: originY } })
}
