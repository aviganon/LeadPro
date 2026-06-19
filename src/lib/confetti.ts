// Lightweight DOM confetti — no dependency. Spawns colorful pieces that fall and clean up.
const COLORS = ['#7C3AED', '#06B6D4', '#EC4899', '#22C55E', '#F59E0B']

export function burstConfetti(count = 36) {
  if (typeof document === 'undefined') return
  const frag = document.createDocumentFragment()
  const pieces: HTMLElement[] = []
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div')
    el.className = 'confetti-piece'
    el.style.left = Math.random() * 100 + 'vw'
    el.style.background = COLORS[i % COLORS.length]
    el.style.animationDelay = Math.random() * 0.3 + 's'
    el.style.animationDuration = 1.8 + Math.random() * 1.2 + 's'
    frag.appendChild(el)
    pieces.push(el)
  }
  document.body.appendChild(frag)
  window.setTimeout(() => pieces.forEach((p) => p.remove()), 3200)
}
