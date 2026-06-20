import {
  Ruler, Compass, Calculator, PenTool, Sigma, Pi, BookOpen, FlaskConical, Globe2,
} from 'lucide-react'

// רקע למידה דקורטיבי משותף — נייר משבצות (סרגל חישובים) + סמלי למידה מרחפים.
// משותף לכל מסכי הלמידה כדי לשמור שפה עיצובית אחת.
const FLOATING: { node: React.ReactNode; cls: string; delay: string }[] = [
  { node: <Pi className="w-full h-full" />, cls: 'top-[14%] right-[8%] w-10 h-10', delay: '0s' },
  { node: <Sigma className="w-full h-full" />, cls: 'top-[26%] left-[10%] w-9 h-9', delay: '1.2s' },
  { node: <Ruler className="w-full h-full" />, cls: 'top-[60%] right-[12%] w-11 h-11', delay: '0.6s' },
  { node: <Compass className="w-full h-full" />, cls: 'bottom-[16%] left-[14%] w-10 h-10', delay: '2s' },
  { node: <Calculator className="w-full h-full" />, cls: 'top-[42%] right-[22%] w-8 h-8', delay: '1.6s' },
  { node: <PenTool className="w-full h-full" />, cls: 'bottom-[28%] right-[30%] w-8 h-8', delay: '0.9s' },
  { node: <FlaskConical className="w-full h-full" />, cls: 'top-[70%] left-[26%] w-9 h-9', delay: '2.4s' },
  { node: <BookOpen className="w-full h-full" />, cls: 'top-[10%] left-[30%] w-9 h-9', delay: '1.8s' },
  { node: <Globe2 className="w-full h-full" />, cls: 'bottom-[10%] right-[44%] w-8 h-8', delay: '0.4s' },
  { node: <span className="text-2xl font-display">∑</span>, cls: 'top-[52%] left-[6%]', delay: '2.1s' },
  { node: <span className="text-2xl font-display">√x</span>, cls: 'bottom-[40%] left-[40%]', delay: '1.1s' },
  { node: <span className="text-xl font-display">a²+b²</span>, cls: 'top-[34%] left-[44%]', delay: '0.7s' },
]

/** רקע למידה — לשים בתוך מיכל `relative overflow-hidden`. `accent` צובע אותו לפי הרמה. */
export function LearningBackground({ accent, fixed = false }: { accent?: string; fixed?: boolean }) {
  return (
    <div aria-hidden className={`pointer-events-none ${fixed ? 'fixed' : 'absolute'} inset-0 overflow-hidden`}>
      {/* נייר משבצות — דועך בשוליים */}
      <div
        className="absolute inset-0 opacity-50 dark:opacity-30"
        style={{
          backgroundImage:
            'linear-gradient(color-mix(in oklch, var(--foreground) 8%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in oklch, var(--foreground) 8%, transparent) 1px, transparent 1px)',
          backgroundSize: '38px 38px',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 50% 30%, black 35%, transparent 78%)',
          maskImage: 'radial-gradient(ellipse 80% 70% at 50% 30%, black 35%, transparent 78%)',
        }}
      />
      {accent && (
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[42rem] h-[42rem] rounded-full blur-3xl opacity-25 transition-colors duration-700"
          style={{ background: `radial-gradient(circle, ${accent} 0%, transparent 70%)` }}
        />
      )}
      {FLOATING.map((f, i) => (
        <div
          key={i}
          className={`absolute animate-float ${f.cls}`}
          style={{ animationDelay: f.delay, color: accent ? `color-mix(in oklch, ${accent} 35%, var(--muted-foreground))` : 'var(--muted-foreground)', opacity: 0.2 }}
        >
          {f.node}
        </div>
      ))}
    </div>
  )
}
