import { useState } from 'react'
import { motion as Motion } from 'motion/react'
import {
  scale,
  spring,
  useShouldReduceMotion,
  useTempoTransition,
} from '@animate-ui/react/utils/motion'
import { BookOpen, Calendar, Clock, Gauge } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import {
  DEFAULT_DAILY_MINUTES,
  DEFAULT_TOTAL_PAGES_FALLBACK,
  PACE_PRESETS,
  PACE_PRESETS_LIST,
  computeBookProgressFromState,
  saveReaderPreferences,
  useReadingTracker,
} from '../../utils/readingTrackerStore'

const DAILY_MINUTE_PRESETS = [15, 30, 45, 60]

function formatDuration(totalMinutes) {
  const safeMinutes = Math.max(1, Math.round(totalMinutes))
  const hours = Math.floor(safeMinutes / 60)
  const minutes = safeMinutes % 60

  if (hours === 0) return `${minutes} min`
  if (minutes === 0) return `${hours} h`
  return `${hours} h ${minutes} min`
}

function formatEstimatedFinishDate(baseTimestamp, daysNeeded) {
  const finishDate = new Date(baseTimestamp)
  finishDate.setDate(finishDate.getDate() + daysNeeded)
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'long',
  }).format(finishDate)
}

export default function ReadingTimeCalculator({ book }) {
  const { user } = useAuth()
  const { trackerState, preferences } = useReadingTracker(user?.id)
  const reduce = useShouldReduceMotion()
  const selectionSpring = useTempoTransition(spring.selection)
  const pressSpring = useTempoTransition(spring.press)

  const [scope, setScope] = useState('remaining')
  const [baseTimestamp] = useState(() => {
    const today = new Date()
    today.setHours(12, 0, 0, 0)
    return today.getTime()
  })

  const rawBookPages = Number(book?.pages)
  const roundedBookPages = Number.isFinite(rawBookPages) ? Math.round(rawBookPages) : 0
  const hasExactPageCount = roundedBookPages > 0
  const totalPages = hasExactPageCount ? roundedBookPages : DEFAULT_TOTAL_PAGES_FALLBACK

  const bookProgress = computeBookProgressFromState(trackerState, book)
  const canToggleRemaining = bookProgress.pagesRead > 0 && bookProgress.pagesRead < totalPages
  const remainingPages =
    bookProgress.totalPages === totalPages
      ? bookProgress.remainingPages
      : Math.max(1, totalPages - bookProgress.pagesRead)

  const activeScope = canToggleRemaining ? scope : 'full'
  const targetPages = activeScope === 'remaining' ? remainingPages : totalPages

  const dailyMinutes = Math.min(
    120,
    Math.max(10, Number(preferences?.dailyMinutes) || DEFAULT_DAILY_MINUTES)
  )
  const activePace = PACE_PRESETS[preferences?.paceId] || PACE_PRESETS.steady
  const pagesPerHour = Number(preferences?.pagesPerHour) || activePace.pagesPerHour

  const totalMinutes = Math.max(1, Math.round((targetPages / pagesPerHour) * 60))
  const daysNeeded = Math.max(1, Math.ceil(totalMinutes / dailyMinutes))
  const pagesPerDay = Math.max(1, Math.round((dailyMinutes / 60) * pagesPerHour))
  const formattedTotalDuration = formatDuration(totalMinutes)
  const formattedFinishDate = formatEstimatedFinishDate(baseTimestamp, daysNeeded)

  const handleDailyMinutesChange = (minutes) => {
    const clamped = Math.min(
      120,
      Math.max(10, Math.round(Number(minutes) || DEFAULT_DAILY_MINUTES))
    )
    saveReaderPreferences(user?.id, { dailyMinutes: clamped })
  }

  const handlePaceChange = (preset) => {
    saveReaderPreferences(user?.id, {
      paceId: preset.id,
      pagesPerHour: preset.pagesPerHour,
    })
  }

  const pressTap = reduce ? undefined : { transform: `scale(${scale.press})` }

  return (
    <section
      aria-labelledby="reading-calculator-heading"
      className="bg-white dark:bg-[#131f1c] border border-[#18332f]/[0.08] dark:border-white/[0.08] rounded-2xl p-5 sm:p-7 shadow-[0_1px_2px_rgba(24,51,47,0.03)] dark:shadow-none"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-5 border-b border-[#18332f]/[0.08] dark:border-white/[0.08]">
        <div>
          <h2
            id="reading-calculator-heading"
            className="font-hero-display text-2xl sm:text-[28px] font-semibold tracking-[-0.015em] text-[#18332f] dark:text-[#f0ede6] leading-[1.12]"
          >
            Tiempo estimado de lectura
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-[#4a615b] dark:text-[#a6b7b1]">
            Ajustá tu rutina diaria y ritmo para calcular cuándo lo terminás.
          </p>
        </div>

        <div className="flex flex-col items-start sm:items-end gap-1 shrink-0">
          <span
            style={{ borderRadius: '9999px' }}
            className="inline-flex items-center gap-1.5 bg-[#f8f7f2] dark:bg-[#192824] border border-[#18332f]/[0.08] dark:border-white/[0.08] px-3 py-1.5 text-xs font-semibold text-[#18332f] dark:text-[#f0ede6] tabular-nums"
          >
            <BookOpen
              size={14}
              strokeWidth={1.85}
              absoluteStrokeWidth
              aria-hidden="true"
              className="text-[#0e5146] dark:text-[#edbd79]"
            />
            <span>{totalPages} págs.</span>
          </span>
          {!hasExactPageCount && (
            <p className="text-[11px] text-[#5d726c] dark:text-[#a6b7b1]">
              Base estimada de {DEFAULT_TOTAL_PAGES_FALLBACK} págs.
            </p>
          )}
        </div>
      </div>

      {/* Main 2-column grid */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-7 items-stretch">
        {/* Left: Interactive controls */}
        <div className="md:col-span-7 flex flex-col justify-between gap-6">
          {canToggleRemaining && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-[#4a615b] dark:text-[#a6b7b1]">
                  Tramo a calcular
                </span>
                <span className="font-semibold text-[#0e5146] dark:text-[#4fb39d] tabular-nums">
                  Llevás {bookProgress.pagesRead} págs. ({bookProgress.percentage}%)
                </span>
              </div>

              {/* Concentric segmented control (rounded-xl p-1 + rounded-lg) with gliding spring indicator */}
              <div
                role="group"
                aria-label="Seleccionar tramo del libro"
                className="grid grid-cols-1 sm:grid-cols-2 gap-1 p-1 bg-[#f1efe7] dark:bg-[#192824] rounded-xl"
              >
                {[
                  { key: 'remaining', label: `Lo que falta (${remainingPages} págs.)` },
                  { key: 'full', label: `Libro completo (${totalPages} págs.)` },
                ].map((tab) => {
                  const isActive = activeScope === tab.key
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => setScope(tab.key)}
                      className={`relative px-3 py-2 rounded-lg text-xs font-semibold tabular-nums cursor-pointer transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e5146] ${
                        isActive
                          ? 'text-[#18332f] dark:text-[#f0ede6]'
                          : 'text-[#4a615b] dark:text-[#a6b7b1] hover:text-[#18332f] dark:hover:text-[#f0ede6]'
                      }`}
                    >
                      {isActive && (
                        <Motion.span
                          layoutId="calc-scope-indicator"
                          transition={selectionSpring}
                          className="absolute inset-0 rounded-lg bg-white dark:bg-[#0c1412] border border-[#18332f]/[0.07] dark:border-white/[0.08] shadow-[0_1px_2px_rgba(24,51,47,0.06)] dark:shadow-none"
                        />
                      )}
                      <span className="relative z-10">{tab.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Daily time control */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="reading-daily-minutes"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4a615b] dark:text-[#a6b7b1]"
              >
                <Clock
                  size={14}
                  strokeWidth={1.85}
                  absoluteStrokeWidth
                  aria-hidden="true"
                  className="text-[#c9833b] dark:text-[#edbd79]"
                />
                <span>Tiempo diario dedicado</span>
              </label>
              <span className="text-sm font-semibold text-[#18332f] dark:text-[#f0ede6] tabular-nums">
                {dailyMinutes} min / día
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {DAILY_MINUTE_PRESETS.map((minutes) => {
                const isSelected = dailyMinutes === minutes
                return (
                  <Motion.button
                    key={minutes}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => handleDailyMinutesChange(minutes)}
                    whileTap={pressTap}
                    transition={pressSpring}
                    style={{ borderRadius: '9999px' }}
                    className={`px-3.5 py-1.5 border text-xs font-semibold tabular-nums cursor-pointer transition-[background-color,border-color,color] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e5146] ${
                      isSelected
                        ? 'bg-[#0e5146] dark:bg-[#166e5e] text-white border-transparent'
                        : 'bg-[#f8f7f2] dark:bg-[#192824] text-[#18332f] dark:text-[#f0ede6] border-[#18332f]/[0.1] dark:border-white/[0.08] hover:border-[#0e5146]/40 dark:hover:border-[#edbd79]/40'
                    }`}
                  >
                    {minutes} min
                  </Motion.button>
                )
              })}
            </div>

            <div className="pt-0.5">
              <input
                id="reading-daily-minutes"
                type="range"
                min={10}
                max={120}
                step={5}
                value={dailyMinutes}
                onChange={(event) => handleDailyMinutesChange(event.target.value)}
                aria-label="Tiempo diario dedicado en minutos"
                className="w-full h-2 accent-[#0e5146] dark:accent-[#edbd79] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0e5146]"
              />
              <div className="flex justify-between mt-1 text-[11px] font-medium text-[#5d726c] dark:text-[#a6b7b1] tabular-nums">
                <span>10 min</span>
                <span>60 min</span>
                <span>120 min</span>
              </div>
            </div>
          </div>

          {/* Reading pace control */}
          <div className="space-y-2.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4a615b] dark:text-[#a6b7b1]">
              <Gauge
                size={14}
                strokeWidth={1.85}
                absoluteStrokeWidth
                aria-hidden="true"
                className="text-[#c9833b] dark:text-[#edbd79]"
              />
              <span>Ritmo de lectura</span>
            </span>

            <div className="grid grid-cols-1 gap-2">
              {PACE_PRESETS_LIST.map((preset) => {
                const isSelected = activePace.id === preset.id
                return (
                  <Motion.button
                    key={preset.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => handlePaceChange(preset)}
                    whileTap={reduce ? undefined : { transform: `scale(${scale.choice})` }}
                    transition={pressSpring}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl border cursor-pointer transition-[background-color,border-color] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e5146] ${
                      isSelected
                        ? 'bg-[#f2f5f0] dark:bg-[#192824] border-[#0e5146]/45 dark:border-[#edbd79]/45'
                        : 'bg-[#f8f7f2]/70 dark:bg-[#0c1412]/50 border-[#18332f]/[0.08] dark:border-white/[0.08] hover:border-[#18332f]/20 dark:hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-semibold text-[#18332f] dark:text-[#f0ede6] tabular-nums">
                        {preset.label} ({preset.pagesPerHour} pág/h)
                      </span>
                      <span
                        aria-hidden="true"
                        style={{ borderRadius: '9999px' }}
                        className={`w-4 h-4 shrink-0 border flex items-center justify-center transition-[background-color,border-color] duration-150 ${
                          isSelected
                            ? 'border-[#0e5146] dark:border-[#edbd79] bg-[#0e5146] dark:bg-[#edbd79]'
                            : 'border-[#18332f]/25 dark:border-white/25 bg-white dark:bg-[#131f1c]'
                        }`}
                      >
                        {isSelected && (
                          <span
                            className="w-1.5 h-1.5 bg-white dark:bg-[#0c1412]"
                            style={{ borderRadius: '9999px' }}
                          />
                        )}
                      </span>
                    </div>
                    <p className="text-xs text-[#5d726c] dark:text-[#a6b7b1] mt-0.5 leading-snug">
                      {preset.desc}
                    </p>
                  </Motion.button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right: Clean Editorial Readout */}
        <div className="md:col-span-5 flex">
          <div className="w-full bg-[#f8f7f2] dark:bg-[#192824] border border-[#18332f]/[0.08] dark:border-white/[0.08] rounded-xl p-5 flex flex-col justify-between divide-y divide-[#18332f]/[0.08] dark:divide-white/[0.08]">
            <div className="pb-4">
              <span className="text-xs font-semibold text-[#c9833b] dark:text-[#edbd79] block">
                {activeScope === 'remaining' ? 'Para completar tu lectura' : 'Duración estimada'}
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-hero-display text-5xl sm:text-[52px] font-semibold text-[#18332f] dark:text-[#f0ede6] leading-none tabular-nums">
                  {daysNeeded}
                </span>
                <span className="font-hero-display italic text-2xl font-medium text-[#4a615b] dark:text-[#a6b7b1]">
                  {daysNeeded === 1 ? 'día' : 'días'}
                </span>
              </div>
              <p className="mt-2 text-xs text-[#5d726c] dark:text-[#a6b7b1] tabular-nums">
                Sobre {targetPages} {targetPages === 1 ? 'página' : 'páginas'} a {dailyMinutes} min diarios
              </p>
            </div>

            <div className="py-3.5 flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 text-xs font-medium text-[#4a615b] dark:text-[#a6b7b1]">
                <Clock
                  size={15}
                  strokeWidth={1.8}
                  absoluteStrokeWidth
                  aria-hidden="true"
                  className="text-[#0e5146] dark:text-[#edbd79] shrink-0"
                />
                <span>Tiempo total</span>
              </span>
              <span className="text-sm font-semibold text-[#18332f] dark:text-[#f0ede6] tabular-nums">
                {formattedTotalDuration}
              </span>
            </div>

            <div className="py-3.5 flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 text-xs font-medium text-[#4a615b] dark:text-[#a6b7b1]">
                <BookOpen
                  size={15}
                  strokeWidth={1.8}
                  absoluteStrokeWidth
                  aria-hidden="true"
                  className="text-[#0e5146] dark:text-[#edbd79] shrink-0"
                />
                <span>Avance diario</span>
              </span>
              <span className="text-sm font-semibold text-[#18332f] dark:text-[#f0ede6] tabular-nums">
                ~{pagesPerDay} {pagesPerDay === 1 ? 'pág.' : 'págs.'}/día
              </span>
            </div>

            <div className="pt-3.5 flex items-start gap-2.5">
              <Calendar
                size={15}
                strokeWidth={1.8}
                absoluteStrokeWidth
                aria-hidden="true"
                className="text-[#c9833b] dark:text-[#edbd79] shrink-0 mt-0.5"
              />
              <p className="text-xs text-[#4a615b] dark:text-[#a6b7b1] leading-relaxed">
                Empezando hoy, lo terminás el{' '}
                <strong className="font-semibold text-[#18332f] dark:text-[#f0ede6]">
                  {formattedFinishDate}
                </strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
