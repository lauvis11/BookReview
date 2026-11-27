import { useState } from 'react'
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
    const clamped = Math.min(120, Math.max(10, Math.round(Number(minutes) || DEFAULT_DAILY_MINUTES)))
    saveReaderPreferences(user?.id, { dailyMinutes: clamped })
  }

  const handlePaceChange = (preset) => {
    saveReaderPreferences(user?.id, {
      paceId: preset.id,
      pagesPerHour: preset.pagesPerHour,
    })
  }

  return (
    <section
      aria-labelledby="reading-calculator-heading"
      className="bg-[#eae6da]/70 dark:bg-surface-container-low border border-[#d6d0c0]/85 dark:border-outline-variant rounded-2xl p-5 sm:p-7 md:p-8"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-5 border-b border-[#d6d0c0]/75 dark:border-outline-variant/80">
        <div>
          <span className="inline-flex items-center gap-1.5 font-hero-sans text-[11px] font-bold uppercase tracking-[0.18em] text-secondary-dark">
            <Clock size={14} strokeWidth={1.85} absoluteStrokeWidth aria-hidden="true" />
            Calculadora de lectura
          </span>
          <h2
            id="reading-calculator-heading"
            className="font-hero-display text-2xl sm:text-[30px] font-semibold tracking-[-0.015em] text-primary dark:text-[#e8e3d6] leading-[1.1] mt-1"
          >
            ¿Cuánto tardás en{' '}
            <span className="italic font-medium text-secondary-dark">leerlo?</span>
          </h2>
        </div>

        <div className="flex flex-col items-start sm:items-end gap-1">
          <div
            className="inline-flex items-center gap-1.5 bg-[#f8f7f2] dark:bg-surface-container border border-[#d6d0c0]/75 dark:border-outline-variant px-3 py-1.5 font-hero-sans text-xs font-semibold text-primary dark:text-[#e8e3d6] tabular-nums"
            style={{ borderRadius: '9999px' }}
          >
            <BookOpen size={14} strokeWidth={1.85} absoluteStrokeWidth aria-hidden="true" className="text-primary/80 dark:text-[#edbd79]" />
            <span>{totalPages} págs.</span>
          </div>
          {!hasExactPageCount && (
            <p className="font-hero-sans text-[11px] text-on-surface-variant italic">
              Estimación basada en {DEFAULT_TOTAL_PAGES_FALLBACK} págs. estándar
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
              <div className="flex items-center justify-between gap-2">
                <span className="font-hero-sans text-[11px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">
                  Tramo a calcular
                </span>
                <span className="font-hero-sans text-xs font-medium text-primary dark:text-[#d6e8b5] tabular-nums">
                  Llevás {bookProgress.pagesRead} págs. ({bookProgress.percentage}%)
                </span>
              </div>

              <div
                role="group"
                aria-label="Seleccionar tramo del libro"
                className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 p-1 bg-[#f8f7f2] dark:bg-surface-container-lowest border border-[#d6d0c0]/75 dark:border-outline-variant rounded-xl"
              >
                <button
                  type="button"
                  aria-pressed={activeScope === 'remaining'}
                  onClick={() => setScope('remaining')}
                  className={`px-3 py-2 rounded-lg font-hero-sans text-xs font-semibold tabular-nums cursor-pointer transition-[background-color,border-color,color,scale] duration-150 ease-out active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                    activeScope === 'remaining'
                      ? 'bg-primary text-white shadow-[0_2px_8px_-2px_rgba(14,81,70,0.3)]'
                      : 'text-on-surface-variant hover:text-primary dark:hover:text-[#e8e3d6] hover:bg-[#eae6da]/55 dark:hover:bg-surface-container'
                  }`}
                >
                  Lo que te falta ({remainingPages} págs.)
                </button>
                <button
                  type="button"
                  aria-pressed={activeScope === 'full'}
                  onClick={() => setScope('full')}
                  className={`px-3 py-2 rounded-lg font-hero-sans text-xs font-semibold tabular-nums cursor-pointer transition-[background-color,border-color,color,scale] duration-150 ease-out active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                    activeScope === 'full'
                      ? 'bg-primary text-white shadow-[0_2px_8px_-2px_rgba(14,81,70,0.3)]'
                      : 'text-on-surface-variant hover:text-primary dark:hover:text-[#e8e3d6] hover:bg-[#eae6da]/55 dark:hover:bg-surface-container'
                  }`}
                >
                  Libro completo ({totalPages} págs.)
                </button>
              </div>
            </div>
          )}

          {/* Daily time control */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="reading-daily-minutes"
                className="inline-flex items-center gap-1.5 font-hero-sans text-[11px] font-bold uppercase tracking-[0.14em] text-on-surface-variant"
              >
                <Clock size={14} strokeWidth={1.85} absoluteStrokeWidth aria-hidden="true" className="text-secondary-dark" />
                Tiempo diario dedicado
              </label>
              <span className="font-hero-sans text-sm font-bold text-primary dark:text-[#e8e3d6] tabular-nums">
                {dailyMinutes} min / día
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {DAILY_MINUTE_PRESETS.map((minutes) => {
                const isSelected = dailyMinutes === minutes
                return (
                  <button
                    key={minutes}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => handleDailyMinutesChange(minutes)}
                    style={{ borderRadius: '9999px' }}
                    className={`px-3.5 py-1.5 border font-hero-sans text-xs font-semibold tabular-nums cursor-pointer transition-[background-color,border-color,color,scale] duration-150 ease-out active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                      isSelected
                        ? 'bg-primary text-white border-primary shadow-[0_3px_10px_-3px_rgba(14,81,70,0.35)]'
                        : 'bg-[#f8f7f2] dark:bg-surface-container-lowest text-primary dark:text-[#e8e3d6] border-[#d6d0c0]/80 dark:border-outline-variant hover:border-primary/45 dark:hover:border-secondary/60 hover:bg-white dark:hover:bg-surface-container'
                    }`}
                  >
                    {minutes} min
                  </button>
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
                className="w-full h-2 accent-[#0e5146] dark:accent-[#edbd79] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
              />
              <div className="flex justify-between mt-1 font-hero-sans text-[11px] font-medium text-on-surface-variant tabular-nums">
                <span>10 min</span>
                <span>60 min</span>
                <span>120 min</span>
              </div>
            </div>
          </div>

          {/* Reading pace control */}
          <div className="space-y-2.5">
            <span className="inline-flex items-center gap-1.5 font-hero-sans text-[11px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">
              <Gauge size={14} strokeWidth={1.85} absoluteStrokeWidth aria-hidden="true" className="text-secondary-dark" />
              Ritmo de lectura
            </span>

            <div className="grid grid-cols-1 gap-2">
              {PACE_PRESETS_LIST.map((preset) => {
                const isSelected = activePace.id === preset.id
                return (
                  <button
                    key={preset.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => handlePaceChange(preset)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl border cursor-pointer transition-[background-color,border-color,color,scale] duration-150 ease-out active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                      isSelected
                        ? 'bg-white dark:bg-surface-container border-primary dark:border-secondary shadow-[0_4px_12px_-4px_rgba(14,81,70,0.16)] dark:shadow-[0_6px_16px_-4px_rgba(0,0,0,0.45)]'
                        : 'bg-[#f8f7f2] dark:bg-surface-container-lowest border-[#d6d0c0]/75 dark:border-outline-variant hover:border-primary/40 dark:hover:border-secondary/50 hover:bg-white/90 dark:hover:bg-surface-container'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-hero-sans text-[13px] font-bold text-primary dark:text-[#e8e3d6] tabular-nums">
                        {preset.label} · {preset.pagesPerHour} pág/h
                      </span>
                      <span
                        aria-hidden="true"
                        style={{ borderRadius: '9999px' }}
                        className={`w-4 h-4 shrink-0 border flex items-center justify-center transition-[background-color,border-color] duration-150 ease-out ${
                          isSelected
                            ? 'border-primary dark:border-secondary bg-primary dark:bg-secondary'
                            : 'border-[#d6d0c0] dark:border-outline-variant bg-white/80 dark:bg-surface-container-low'
                        }`}
                      >
                        {isSelected && (
                          <span
                            className="w-1.5 h-1.5 bg-white dark:bg-on-secondary"
                            style={{ borderRadius: '9999px' }}
                          />
                        )}
                      </span>
                    </div>
                    <p className="font-hero-sans text-xs text-on-surface-variant mt-0.5 leading-snug">
                      {preset.desc}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right: Editorial readout block */}
        <div className="md:col-span-5 flex">
          <div className="w-full bg-white/85 dark:bg-surface-container-lowest border border-[#d6d0c0]/80 dark:border-outline-variant rounded-xl p-5 flex flex-col justify-between divide-y divide-[#d6d0c0]/70 dark:divide-outline-variant/70">
            {/* Hero estimate */}
            <div className="pb-4">
              <span className="font-hero-sans text-[11px] font-bold uppercase tracking-[0.14em] text-secondary-dark block">
                {activeScope === 'remaining' ? 'Para completar tu lectura' : 'Tiempo estimado'}
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-hero-display text-5xl sm:text-[54px] font-semibold text-primary dark:text-[#e8e3d6] leading-none tabular-nums">
                  {daysNeeded}
                </span>
                <span className="font-hero-display italic text-2xl font-medium text-secondary-dark">
                  {daysNeeded === 1 ? 'día' : 'días'}
                </span>
              </div>
              <p className="mt-2 font-hero-sans text-xs text-on-surface-variant tabular-nums">
                Sobre {targetPages} {targetPages === 1 ? 'página' : 'páginas'} a {dailyMinutes} min diarios
              </p>
            </div>

            {/* Total reading time */}
            <div className="py-3.5 flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 font-hero-sans text-xs font-medium text-on-surface-variant">
                <Clock size={15} strokeWidth={1.85} absoluteStrokeWidth aria-hidden="true" className="text-primary/80 dark:text-[#edbd79] shrink-0" />
                Tiempo total
              </span>
              <span className="font-hero-sans text-sm font-bold text-primary dark:text-[#e8e3d6] tabular-nums">
                {formattedTotalDuration}
              </span>
            </div>

            {/* Pages per day */}
            <div className="py-3.5 flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 font-hero-sans text-xs font-medium text-on-surface-variant">
                <BookOpen size={15} strokeWidth={1.85} absoluteStrokeWidth aria-hidden="true" className="text-primary/80 dark:text-[#edbd79] shrink-0" />
                Avance diario
              </span>
              <span className="font-hero-sans text-sm font-bold text-primary dark:text-[#e8e3d6] tabular-nums">
                ~{pagesPerDay} {pagesPerDay === 1 ? 'pág.' : 'págs.'}/día
              </span>
            </div>

            {/* Finish date */}
            <div className="pt-3.5 flex items-start gap-2.5">
              <Calendar size={15} strokeWidth={1.85} absoluteStrokeWidth aria-hidden="true" className="text-secondary-dark shrink-0 mt-0.5" />
              <p className="font-hero-sans text-xs text-on-surface-variant leading-relaxed">
                Leyendo desde hoy, lo terminás el{' '}
                <strong className="font-bold text-primary dark:text-[#e8e3d6]">{formattedFinishDate}</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
