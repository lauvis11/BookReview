import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Check, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import {
  computeMonthlyStatsFromState,
  DEFAULT_PAGES_PER_HOUR,
  formatMonthLabel,
  getMonthKey,
  getTodayDateStr,
  PACE_PRESETS,
  useReadingTracker,
} from '../../utils/readingTrackerStore'

const NUMBER_FORMATTER = new Intl.NumberFormat('es-AR')

function formatNumber(value) {
  return NUMBER_FORMATTER.format(Math.max(0, Math.round(Number(value) || 0)))
}

function splitDuration(totalMinutes) {
  const safe = Math.max(0, Math.round(Number(totalMinutes) || 0))
  const hours = Math.floor(safe / 60)
  const mins = safe % 60
  return { hours, mins, total: safe }
}

function formatDurationText(totalMinutes) {
  const { hours, mins } = splitDuration(totalMinutes)
  if (hours > 0 && mins > 0) return `${hours} h ${mins} min`
  if (hours > 0) return `${hours} h`
  return `${mins} min`
}

function getBooksSubtitle(stats) {
  if (stats.booksCompletedInMonth === 0) {
    return 'Sin libros completados en el mes'
  }
  if (stats.libraryCompletedFallbackCount > 0 && stats.trackedCompletedCount > 0) {
    return `${formatNumber(stats.trackedCompletedCount)} con registro · ${formatNumber(stats.libraryCompletedFallbackCount)} desde Biblioteca sin fecha`
  }
  if (stats.libraryCompletedFallbackCount > 0) {
    return stats.libraryCompletedFallbackCount === 1
      ? 'Desde Biblioteca sin fecha de registro'
      : 'Marcados en Biblioteca sin fecha de registro'
  }
  return stats.trackedCompletedCount === 1
    ? 'Completado con avance registrado'
    : 'Completados con avance registrado'
}

export default function MonthlyStatsSection({
  userId,
  completedBooks = [],
  readingBooks = [],
  onRequestLogPages,
}) {
  const [selectedMonthKey, setSelectedMonthKey] = useState(() => getMonthKey())
  const [selectedDate, setSelectedDate] = useState(null)
  const [hoveredDate, setHoveredDate] = useState(null)
  const [failedCovers, setFailedCovers] = useState(() => new Set())

  const { trackerState, preferences } = useReadingTracker(userId)
  const currentMonthKey = getMonthKey()
  const todayDateStr = getTodayDateStr()
  const readingCount = Array.isArray(readingBooks) ? readingBooks.length : 0

  const stats = useMemo(
    () => computeMonthlyStatsFromState(trackerState, selectedMonthKey, completedBooks),
    [trackerState, selectedMonthKey, completedBooks]
  )

  const prevMonth = useMemo(() => {
    const candidates = stats.availableMonths.filter((m) => m < stats.monthKey)
    return candidates.length > 0 ? candidates[candidates.length - 1] : null
  }, [stats.availableMonths, stats.monthKey])

  const nextMonth = useMemo(() => {
    return stats.availableMonths.find((m) => m > stats.monthKey) || null
  }, [stats.availableMonths, stats.monthKey])

  const peakDay = useMemo(() => {
    let best = null
    for (const day of stats.daysInMonthGrid) {
      if (day.pages > 0 && (!best || day.pages >= best.pages)) {
        best = day
      }
    }
    return best
  }, [stats.daysInMonthGrid])

  const maxPagesInMonth = peakDay ? peakDay.pages : 0

  const activeHoverDay = useMemo(
    () => (hoveredDate ? stats.daysInMonthGrid.find((d) => d.date === hoveredDate) || null : null),
    [hoveredDate, stats.daysInMonthGrid]
  )

  const activeSelectedDay = useMemo(
    () => (selectedDate ? stats.daysInMonthGrid.find((d) => d.date === selectedDate) || null : null),
    [selectedDate, stats.daysInMonthGrid]
  )

  const inspectedDay = activeHoverDay || activeSelectedDay || peakDay
  const isCurrentMonth = stats.monthKey === currentMonthKey
  const totalDays = stats.daysInMonthGrid.length

  const durationParts = splitDuration(stats.minutesReadInMonth)
  const pacePreset = preferences?.paceId ? PACE_PRESETS[preferences.paceId] : null
  const pagesPerHour = Number(preferences?.pagesPerHour) || DEFAULT_PAGES_PER_HOUR
  const paceLabel = pacePreset ? pacePreset.label.toLowerCase() : 'configurado'
  const paceSubtitle = `A ritmo ${paceLabel} (${formatNumber(pagesPerHour)} págs./h)`

  const booksUnit = stats.booksCompletedInMonth === 1 ? 'libro' : 'libros'
  const streakUnit =
    stats.bestStreakInMonth === 0
      ? 'días'
      : stats.bestStreakInMonth === 1
        ? 'día'
        : 'días seguidos'

  const handleSelectMonth = (monthKey) => {
    setSelectedMonthKey(monthKey)
    setSelectedDate(null)
    setHoveredDate(null)
  }

  const handleCoverError = (bookId) => {
    setFailedCovers((prev) => {
      if (prev.has(bookId)) return prev
      const next = new Set(prev)
      next.add(bookId)
      return next
    })
  }

  return (
    <section
      aria-labelledby="monthly-stats-heading"
      className="bg-[#eae6da]/70 border border-[#d6d0c0]/85 rounded-2xl p-5 sm:p-6 lg:p-7"
    >
      {/* Cabecera con selector mensual */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2
            id="monthly-stats-heading"
            className="font-hero-display text-2xl sm:text-[28px] font-semibold tracking-[-0.015em] text-primary leading-tight"
          >
            Estadísticas mensuales
          </h2>
          <p className="mt-1 font-hero-sans text-[13.5px] text-on-surface-variant leading-snug">
            {isCurrentMonth && readingCount > 0
              ? `Actividad de ${stats.monthLabel} · ${formatNumber(readingCount)} ${readingCount === 1 ? 'lectura en curso' : 'lecturas en curso'}`
              : `Resumen de lectura correspondiente a ${stats.monthLabel}`}
          </p>
        </div>

        <nav
          aria-label="Selector de mes"
          className="inline-flex items-center self-start sm:self-auto gap-1 rounded-xl bg-white/85 border border-[#d6d0c0]/85 p-1"
        >
          <button
            type="button"
            disabled={!prevMonth}
            onClick={() => prevMonth && handleSelectMonth(prevMonth)}
            aria-label={
              prevMonth
                ? `Mes anterior: ${formatMonthLabel(prevMonth)}`
                : 'No hay un mes anterior con registros'
            }
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-on-surface hover:bg-[#eae6da]/65 hover:text-primary disabled:text-on-surface-variant/35 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer transition-[background-color,color,scale] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
          >
            <ChevronLeft size={16} strokeWidth={1.9} aria-hidden="true" />
          </button>

          <span className="min-w-[140px] sm:min-w-[156px] px-2 text-center font-hero-sans text-[13.5px] font-semibold text-on-surface tabular-nums select-none">
            {stats.monthLabel}
          </span>

          <button
            type="button"
            disabled={!nextMonth}
            onClick={() => nextMonth && handleSelectMonth(nextMonth)}
            aria-label={
              nextMonth
                ? `Mes siguiente: ${formatMonthLabel(nextMonth)}`
                : 'Estás viendo el último mes disponible'
            }
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-on-surface hover:bg-[#eae6da]/65 hover:text-primary disabled:text-on-surface-variant/35 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer transition-[background-color,color,scale] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
          >
            <ChevronRight size={16} strokeWidth={1.9} aria-hidden="true" />
          </button>
        </nav>
      </div>

      {/* 4 KPIs mensuales en retícula tipográfica dividida por reglas de 1px */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-[#d6d0c0]/85 bg-white/85 rounded-xl overflow-hidden">
        {/* KPI 1: Libros leídos en el mes */}
        <div className="p-4 sm:p-5 flex flex-col justify-between gap-2 border-b border-[#d6d0c0]/75 sm:border-r lg:border-b-0">
          <span className="font-hero-sans text-[13px] font-medium text-on-surface-variant">
            Libros leídos en el mes
          </span>
          <div className="flex items-baseline gap-1.5 tabular-nums">
            <span className="font-hero-display text-3xl sm:text-[34px] font-semibold leading-none tracking-[-0.02em] text-on-surface">
              {formatNumber(stats.booksCompletedInMonth)}
            </span>
            <span className="font-hero-sans text-xs sm:text-[13px] font-medium text-on-surface-variant">
              {booksUnit}
            </span>
          </div>
          <p className="font-hero-sans text-xs text-on-surface-variant/90 leading-snug">
            {getBooksSubtitle(stats)}
          </p>
        </div>

        {/* KPI 2: Páginas del mes */}
        <div className="p-4 sm:p-5 flex flex-col justify-between gap-2 border-b border-[#d6d0c0]/75 lg:border-b-0 lg:border-r">
          <span className="font-hero-sans text-[13px] font-medium text-on-surface-variant">
            Páginas del mes
          </span>
          <div className="flex items-baseline gap-1.5 tabular-nums">
            <span className="font-hero-display text-3xl sm:text-[34px] font-semibold leading-none tracking-[-0.02em] text-on-surface">
              {formatNumber(stats.pagesReadInMonth)}
            </span>
            <span className="font-hero-sans text-xs sm:text-[13px] font-medium text-on-surface-variant">
              págs.
            </span>
          </div>
          <p className="font-hero-sans text-xs text-on-surface-variant/90 leading-snug tabular-nums">
            {stats.activeDaysInMonth > 0
              ? `Promedio: ${formatNumber(stats.averagePagesPerActiveDay)} págs./día activo`
              : 'Sin registros aún'}
          </p>
        </div>

        {/* KPI 3: Tiempo de lectura mensual */}
        <div className="p-4 sm:p-5 flex flex-col justify-between gap-2 border-b border-[#d6d0c0]/75 sm:border-b-0 sm:border-r">
          <span className="font-hero-sans text-[13px] font-medium text-on-surface-variant">
            Tiempo de lectura mensual
          </span>
          <div className="flex items-baseline flex-wrap gap-x-1.5 gap-y-0.5 tabular-nums">
            {durationParts.hours > 0 ? (
              <>
                <span className="font-hero-display text-3xl sm:text-[34px] font-semibold leading-none tracking-[-0.02em] text-on-surface">
                  {formatNumber(durationParts.hours)}
                </span>
                <span className="font-hero-sans text-xs sm:text-[13px] font-medium text-on-surface-variant">
                  h
                </span>
                {durationParts.mins > 0 && (
                  <>
                    <span className="font-hero-display text-3xl sm:text-[34px] font-semibold leading-none tracking-[-0.02em] text-on-surface ml-0.5">
                      {durationParts.mins}
                    </span>
                    <span className="font-hero-sans text-xs sm:text-[13px] font-medium text-on-surface-variant">
                      min
                    </span>
                  </>
                )}
              </>
            ) : (
              <>
                <span className="font-hero-display text-3xl sm:text-[34px] font-semibold leading-none tracking-[-0.02em] text-on-surface">
                  {durationParts.mins}
                </span>
                <span className="font-hero-sans text-xs sm:text-[13px] font-medium text-on-surface-variant">
                  min
                </span>
              </>
            )}
          </div>
          <p className="font-hero-sans text-xs text-on-surface-variant/90 leading-snug tabular-nums">
            {paceSubtitle}
          </p>
        </div>

        {/* KPI 4: Mayor racha sostenida del mes */}
        <div className="p-4 sm:p-5 flex flex-col justify-between gap-2">
          <span className="font-hero-sans text-[13px] font-medium text-on-surface-variant">
            Mayor racha del mes
          </span>
          <div className="flex items-baseline gap-1.5 tabular-nums">
            <span className="font-hero-display text-3xl sm:text-[34px] font-semibold leading-none tracking-[-0.02em] text-on-surface">
              {formatNumber(stats.bestStreakInMonth)}
            </span>
            <span className="font-hero-sans text-xs sm:text-[13px] font-medium text-on-surface-variant">
              {streakUnit}
            </span>
          </div>
          <p className="font-hero-sans text-xs text-on-surface-variant/90 leading-snug tabular-nums">
            {formatNumber(stats.activeDaysInMonth)}{' '}
            {stats.activeDaysInMonth === 1 ? 'día activo' : 'días activos'} en el mes
          </p>
        </div>
      </div>

      {/* Gráfica de constancia diaria (Días 1..N) */}
      <div className="mt-4 bg-white/85 border border-[#d6d0c0]/80 rounded-xl p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h3 className="font-hero-display text-xl font-semibold text-primary leading-tight">
              Constancia diaria
            </h3>
            <p className="mt-0.5 font-hero-sans text-xs text-on-surface-variant">
              Páginas registradas por día en {stats.monthLabel}
            </p>
          </div>

          {/* Readout interactivo del día inspeccionado */}
          <div
            aria-live="polite"
            className="inline-flex flex-wrap items-center gap-2 rounded-lg bg-[#f8f7f2] border border-[#d6d0c0]/75 px-3 py-2 font-hero-sans text-xs sm:text-[13px] tabular-nums"
          >
            <span
              aria-hidden="true"
              className={`h-2 w-2 shrink-0 ${
                inspectedDay && inspectedDay.pages > 0
                  ? peakDay && inspectedDay.date === peakDay.date
                    ? 'bg-[#c9833b]'
                    : 'bg-primary'
                  : 'bg-[#d6d0c0]'
              }`}
              style={{ borderRadius: '9999px' }}
            />
            {inspectedDay ? (
              <>
                <span className="font-semibold text-on-surface">
                  Día {inspectedDay.dayNumber} ({inspectedDay.weekdayLabel}):
                </span>
                {inspectedDay.pages > 0 ? (
                  <span className="text-on-surface-variant">
                    {formatNumber(inspectedDay.pages)} págs. · ~
                    {formatDurationText(inspectedDay.minutes)} · {inspectedDay.booksTouched}{' '}
                    {inspectedDay.booksTouched === 1 ? 'libro' : 'libros'}
                  </span>
                ) : (
                  <span className="text-on-surface-variant">Sin lectura registrada</span>
                )}
                {peakDay && inspectedDay.date === peakDay.date && (
                  <span
                    className="inline-flex items-center px-2 py-0.5 text-[11px] font-semibold bg-[#f7e4cd] text-[#7a4d16] border border-[#c9833b]/35"
                    style={{ borderRadius: '9999px' }}
                  >
                    Mejor día
                  </span>
                )}
              </>
            ) : (
              <span className="text-on-surface-variant">
                Sin lectura registrada en {stats.monthLabel}
              </span>
            )}
          </div>
        </div>

        {/* Tira de barras por día con escala Y honesta */}
        <div className="mt-5">
          <div className="flex items-stretch">
            {/* Eje Y */}
            <div
              aria-hidden="true"
              className="w-8 sm:w-10 shrink-0 flex flex-col justify-between items-end pr-2 pt-3 pb-0.5 font-hero-sans text-[11px] text-on-surface-variant/80 tabular-nums select-none"
            >
              <span>{maxPagesInMonth > 0 ? formatNumber(maxPagesInMonth) : '—'}</span>
              {maxPagesInMonth >= 2 ? (
                <span>{formatNumber(Math.round(maxPagesInMonth / 2))}</span>
              ) : (
                <span />
              )}
              <span>0</span>
            </div>

            {/* Track de barras */}
            <div className="relative flex-1 min-w-0 h-32 sm:h-36 flex items-end gap-[2px] sm:gap-1 border-b border-[#d6d0c0]/90">
              {/* Líneas horizontales de guía */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-3 bottom-0 flex flex-col justify-between"
              >
                <div className="border-t border-dashed border-[#d6d0c0]/55" />
                <div className="border-t border-dashed border-[#d6d0c0]/40" />
                <div />
              </div>

              {stats.daysInMonthGrid.map((day) => {
                const isPeak = Boolean(peakDay && day.date === peakDay.date)
                const isSelected = Boolean(activeSelectedDay && day.date === activeSelectedDay.date)
                const isInspected = Boolean(inspectedDay && day.date === inspectedDay.date)
                const ratio = maxPagesInMonth > 0 ? day.pages / maxPagesInMonth : 0
                const heightPct = day.pages > 0 ? Math.max(12, Math.round(ratio * 100)) : 0
                const barOpacity = day.pages > 0 ? Math.min(1, 0.52 + ratio * 0.48) : 1

                return (
                  <button
                    key={day.date}
                    type="button"
                    onMouseEnter={() => setHoveredDate(day.date)}
                    onMouseLeave={() => setHoveredDate(null)}
                    onFocus={() => setHoveredDate(day.date)}
                    onBlur={() => setHoveredDate(null)}
                    onClick={() =>
                      setSelectedDate((prev) => (prev === day.date ? null : day.date))
                    }
                    aria-pressed={isSelected}
                    aria-label={
                      day.pages > 0
                        ? `Día ${day.dayNumber} (${day.weekdayLabel}): ${day.pages} páginas, aproximadamente ${formatDurationText(day.minutes)}, ${day.booksTouched} ${day.booksTouched === 1 ? 'libro' : 'libros'}`
                        : `Día ${day.dayNumber} (${day.weekdayLabel}): Sin lectura registrada`
                    }
                    className={`group relative flex-1 min-w-0 h-full flex flex-col items-center rounded-[4px] cursor-pointer transition-[background-color] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary [-webkit-tap-highlight-color:transparent] ${
                      isInspected ? 'bg-[#eae6da]/55' : 'hover:bg-[#eae6da]/35'
                    }`}
                  >
                    {/* Indicador discreto del mejor día */}
                    <span className="h-3 w-full flex items-center justify-center shrink-0">
                      {isPeak && (
                        <span
                          aria-hidden="true"
                          className="h-1.5 w-1.5 bg-[#c9833b]"
                          style={{ borderRadius: '9999px' }}
                        />
                      )}
                    </span>

                    {/* Contenedor fijo para que ninguna barra altere el layout */}
                    <span className="flex-1 w-full flex items-end">
                      <span
                        aria-hidden="true"
                        className={`w-full transition-[opacity,background-color] duration-150 ease-out ${
                          day.pages > 0
                            ? isInspected
                              ? 'bg-primary outline outline-1 outline-[#c9833b]'
                              : 'bg-primary group-hover:opacity-100'
                            : isInspected
                              ? 'bg-[#c9833b]/55'
                              : 'bg-[#eae6da] group-hover:bg-[#d6d0c0]'
                        }`}
                        style={{
                          height: day.pages > 0 ? `${heightPct}%` : '4px',
                          opacity: day.pages > 0 ? (isInspected ? 1 : barOpacity) : 1,
                          borderRadius: '4px 4px 2px 2px',
                        }}
                      />
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Etiquetas de días alineadas en el eje X */}
          <div className="mt-1.5 flex items-center">
            <div aria-hidden="true" className="w-8 sm:w-10 shrink-0" />
            <div className="flex-1 min-w-0 flex gap-[2px] sm:gap-1">
              {stats.daysInMonthGrid.map((day) => {
                const showLabel =
                  day.dayNumber === 1 ||
                  day.dayNumber === 5 ||
                  day.dayNumber === 10 ||
                  day.dayNumber === 15 ||
                  day.dayNumber === 20 ||
                  (day.dayNumber === 25 && totalDays >= 29) ||
                  day.dayNumber === totalDays
                const isToday = day.date === todayDateStr

                return (
                  <div key={day.date} className="relative flex-1 min-w-0 h-4">
                    {showLabel && (
                      <span
                        className={`absolute top-0 text-[11px] font-hero-sans tabular-nums whitespace-nowrap ${
                          day.dayNumber === 1
                            ? 'left-0'
                            : day.dayNumber === totalDays
                              ? 'right-0'
                              : 'left-1/2 -translate-x-1/2'
                        } ${isToday ? 'font-semibold text-primary' : 'text-on-surface-variant/85'}`}
                      >
                        {day.dayNumber}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Nota / CTA si hay 0 páginas en el mes pero ya hay libros en desglose */}
        <div className="mt-3 pt-3 border-t border-[#d6d0c0]/55 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-hero-sans text-on-surface-variant">
          {stats.pagesReadInMonth > 0 ? (
            <>
              <span>Pasá el cursor o tocá cualquier día para inspeccionar su actividad.</span>
              {peakDay && (
                <span className="inline-flex items-center gap-1.5 tabular-nums">
                  <span
                    aria-hidden="true"
                    className="h-2 w-2 bg-[#c9833b]"
                    style={{ borderRadius: '9999px' }}
                  />
                  <span>
                    Mejor día: Día {peakDay.dayNumber} ({formatNumber(peakDay.pages)} págs.)
                  </span>
                </span>
              )}
            </>
          ) : (
            <>
              <span>Aún no registraste páginas diarias en {stats.monthLabel}.</span>
              {stats.monthBooks.length > 0 && (
                <button
                  type="button"
                  onClick={() => onRequestLogPages?.()}
                  className="self-start sm:self-auto inline-flex items-center gap-1.5 ps-3 pe-3.5 py-1.5 rounded-lg bg-primary hover:bg-[#166e5e] text-white font-semibold cursor-pointer transition-[background-color,scale] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <Plus size={14} strokeWidth={2} aria-hidden="true" />
                  <span>Registrar páginas leídas hoy</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Desglose de Libros del Mes */}
      <div className="mt-4 bg-white/85 border border-[#d6d0c0]/80 rounded-xl p-4 sm:p-5">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <h3 className="font-hero-display text-xl font-semibold text-primary leading-tight">
              Desglose de libros del mes
            </h3>
            <p className="mt-0.5 font-hero-sans text-xs text-on-surface-variant">
              Títulos con avance o cierre registrado durante {stats.monthLabel}
            </p>
          </div>

          <span className="font-hero-sans text-xs font-medium text-on-surface-variant tabular-nums shrink-0">
            {formatNumber(stats.monthBooks.length)}{' '}
            {stats.monthBooks.length === 1 ? 'título' : 'títulos'}
          </span>
        </div>

        {stats.pagesReadInMonth === 0 && stats.monthBooks.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-[#d6d0c0] bg-[#f8f7f2]/80 px-5 py-7 text-center">
            <BookOpen
              size={22}
              strokeWidth={1.6}
              aria-hidden="true"
              className="mx-auto text-primary/70"
            />
            <p className="mt-2.5 font-hero-display text-xl font-semibold text-on-surface">
              Sin lecturas registradas en {stats.monthLabel}
            </p>
            <p className="mt-1 max-w-md mx-auto font-hero-sans text-[13.5px] text-on-surface-variant leading-relaxed">
              {isCurrentMonth && readingCount > 0
                ? `Tenés ${formatNumber(readingCount)} ${readingCount === 1 ? 'libro marcado como leyendo' : 'libros marcados como leyendo'}. Sumá tus páginas de hoy para seguir tu progreso mensual.`
                : 'Cuando registres páginas leídas, cada libro aparecerá aquí con su avance y tiempo dedicado.'}
            </p>
            <button
              type="button"
              onClick={() => onRequestLogPages?.()}
              className="mt-4 inline-flex items-center justify-center gap-2 h-10 ps-4 pe-4.5 rounded-[10px] bg-primary hover:bg-[#166e5e] text-white font-hero-sans text-[13.5px] font-semibold cursor-pointer transition-[background-color,scale] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <Plus size={15} strokeWidth={2} aria-hidden="true" />
              <span>Registrar páginas leídas hoy</span>
            </button>
          </div>
        ) : stats.monthBooks.length === 0 ? (
          <p className="mt-4 font-hero-sans text-[13.5px] text-on-surface-variant">
            Se registraron páginas en {stats.monthLabel}, pero no hay títulos asociados en el desglose.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-[#d6d0c0]/65">
            {stats.monthBooks.map((book) => {
              const showCover = Boolean(book.img) && !failedCovers.has(book.bookId)
              const bookHref = `/books/${book.bookId}`

              return (
                <li
                  key={book.bookId}
                  className="py-3.5 first:pt-2 last:pb-1 flex items-start sm:items-center gap-3.5 sm:gap-4"
                >
                  <Link
                    to={bookHref}
                    tabIndex={-1}
                    aria-hidden="true"
                    className="relative aspect-[2/3] w-11 sm:w-12 shrink-0 overflow-hidden rounded-[4px] bg-[#eae6da] focus-visible:outline-none"
                  >
                    {showCover ? (
                      <img
                        src={book.img}
                        alt=""
                        loading="lazy"
                        onError={() => handleCoverError(book.bookId)}
                        className="h-full w-full object-cover outline outline-1 -outline-offset-1 outline-black/10"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-primary/45">
                        <BookOpen size={16} strokeWidth={1.6} aria-hidden="true" />
                      </span>
                    )}
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-y-0 left-0 w-[4px] bg-gradient-to-r from-black/15 via-white/15 to-transparent"
                    />
                  </Link>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                      <div className="min-w-0">
                        <Link
                          to={bookHref}
                          className="font-hero-sans text-sm sm:text-[15px] font-semibold text-on-surface hover:text-primary transition-[color] duration-150 ease-out line-clamp-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-sm"
                        >
                          {book.title}
                        </Link>
                        <p className="mt-0.5 font-hero-sans text-xs sm:text-[13px] text-on-surface-variant line-clamp-1">
                          {book.author || 'Autor desconocido'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                        <div className="text-left sm:text-right font-hero-sans text-xs tabular-nums">
                          {book.pagesReadInMonth > 0 ? (
                            <>
                              <p className="font-semibold text-primary">
                                +{formatNumber(book.pagesReadInMonth)} págs. este mes
                              </p>
                              <p className="text-on-surface-variant">
                                ~{formatDurationText(book.minutesInMonth)}
                                {book.totalPages > 0 && (
                                  <span className="hidden sm:inline">
                                    {' '}
                                    · {formatNumber(book.currentPagesRead)}/
                                    {formatNumber(book.totalPages)} págs.
                                  </span>
                                )}
                              </p>
                            </>
                          ) : book.completedViaLibraryOnly ? (
                            <p className="text-on-surface-variant">
                              Completado en Biblioteca (sin sesiones)
                            </p>
                          ) : (
                            <p className="text-on-surface-variant">
                              Completado este mes
                              {book.totalPages > 0 &&
                                ` · ${formatNumber(book.totalPages)} págs.`}
                            </p>
                          )}
                        </div>

                        {book.isCompleted ? (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-1 font-hero-sans text-xs font-semibold whitespace-nowrap shrink-0 bg-[#f7e4cd] text-[#7a4d16] border border-[#c9833b]/35"
                            style={{ borderRadius: '9999px' }}
                          >
                            <Check size={12} strokeWidth={2.25} aria-hidden="true" />
                            <span>Completado</span>
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center px-2.5 py-1 font-hero-sans text-xs font-semibold whitespace-nowrap shrink-0 tabular-nums bg-[#e3eee9] text-[#183f38] border border-[#0e5146]/20"
                            style={{ borderRadius: '9999px' }}
                          >
                            {book.percentage}% completado
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}
