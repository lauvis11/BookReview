/**
 * Store local por usuario para seguimiento real de lectura:
 * - Preferencias de ritmo y tiempo diario (Calculadora en BookDetail)
 * - Registro diario de páginas, porcentajes de avance y rachas (Progreso en Library)
 * - Agregación mensual de estadísticas (Estadísticas Mensuales en Library)
 *
 * Sincroniza reactivamente dentro de la pestaña vía `bookreview:tracker-updated`
 * y entre pestañas vía el evento nativo `storage`.
 */
import { useEffect, useMemo, useState } from 'react'
import { createReadingLog, getReadingTracker } from '../api/reading'

export const DEFAULT_PAGES_PER_HOUR = 45
export const DEFAULT_DAILY_MINUTES = 30
export const DEFAULT_TOTAL_PAGES_FALLBACK = 250
export const TRACKER_UPDATED_EVENT = 'bookreview:tracker-updated'

export const PACE_PRESETS = {
  calm: {
    id: 'calm',
    label: 'Pausado',
    pagesPerHour: 30,
    desc: 'Lectura reflexiva o técnica (~2 min/pág)',
  },
  steady: {
    id: 'steady',
    label: 'Habitual',
    pagesPerHour: 45,
    desc: 'Ritmo fluido de novela (~1.3 min/pág)',
  },
  fast: {
    id: 'fast',
    label: 'Ágil',
    pagesPerHour: 60,
    desc: 'Lectura veloz (~1 min/pág)',
  },
}

export const PACE_PRESETS_LIST = Object.values(PACE_PRESETS)

const SPANISH_WEEKDAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const SPANISH_WEEKDAYS_LETTER = ['D', 'L', 'M', 'X', 'J', 'V', 'S']

function pad2(value) {
  return String(value).padStart(2, '0')
}

export function getStorageKey(userId) {
  return `bookreview_reading_tracker_v1_${userId || 'guest'}`
}

export function getTodayDateStr(date = new Date()) {
  const year = date.getFullYear()
  const month = pad2(date.getMonth() + 1)
  const day = pad2(date.getDate())
  return `${year}-${month}-${day}`
}

export function getMonthKey(date = new Date()) {
  const year = date.getFullYear()
  const month = pad2(date.getMonth() + 1)
  return `${year}-${month}`
}

export function addDaysToDateStr(dateStr, deltaDays) {
  const [y, m, d] = String(dateStr).split('-').map(Number)
  if (!y || !m || !d) return getTodayDateStr()
  const next = new Date(y, m - 1, d + deltaDays)
  return getTodayDateStr(next)
}

export function formatMonthLabel(monthKey) {
  const [y, m] = String(monthKey).split('-').map(Number)
  if (!y || !m) return monthKey
  const date = new Date(y, m - 1, 1)
  const formatted = new Intl.DateTimeFormat('es-AR', {
    month: 'long',
    year: 'numeric',
  }).format(date)
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

function getDefaultState() {
  return {
    preferences: {
      dailyMinutes: DEFAULT_DAILY_MINUTES,
      paceId: 'steady',
      pagesPerHour: DEFAULT_PAGES_PER_HOUR,
    },
    booksProgress: {},
    logs: [],
  }
}

function normalizeState(raw) {
  const fallback = getDefaultState()
  if (!raw || typeof raw !== 'object') return fallback

  const rawPrefs = raw.preferences && typeof raw.preferences === 'object' ? raw.preferences : {}
  const paceId = PACE_PRESETS[rawPrefs.paceId] ? rawPrefs.paceId : 'steady'
  const dailyMinutes = Math.min(180, Math.max(5, Number(rawPrefs.dailyMinutes) || DEFAULT_DAILY_MINUTES))
  const pagesPerHour = Math.min(150, Math.max(10, Number(rawPrefs.pagesPerHour) || PACE_PRESETS[paceId].pagesPerHour))

  const booksProgress =
    raw.booksProgress && typeof raw.booksProgress === 'object' && !Array.isArray(raw.booksProgress)
      ? raw.booksProgress
      : {}

  const logs = Array.isArray(raw.logs)
    ? raw.logs.filter((entry) => entry && typeof entry === 'object' && entry.date && entry.bookId)
    : []

  return {
    preferences: {
      dailyMinutes,
      paceId,
      pagesPerHour,
    },
    booksProgress,
    logs,
  }
}

export function getTrackerState(userId) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return getDefaultState()
  }
  try {
    const raw = window.localStorage.getItem(getStorageKey(userId))
    if (!raw) return getDefaultState()
    return normalizeState(JSON.parse(raw))
  } catch {
    return getDefaultState()
  }
}

function persistState(userId, nextState) {
  const normalized = normalizeState(nextState)
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(getStorageKey(userId), JSON.stringify(normalized))
      window.dispatchEvent(
        new CustomEvent(TRACKER_UPDATED_EVENT, {
          detail: { userId: userId || 'guest' },
        })
      )
    } catch {
      // Ignora cuotas llenas o modo privado restrictivo
    }
  }
  return normalized
}

export function saveReaderPreferences(userId, partialPrefs) {
  const current = getTrackerState(userId)
  const mergedPrefs = {
    ...current.preferences,
    ...(partialPrefs && typeof partialPrefs === 'object' ? partialPrefs : {}),
  }
  if (partialPrefs?.paceId && PACE_PRESETS[partialPrefs.paceId] && !partialPrefs.pagesPerHour) {
    mergedPrefs.pagesPerHour = PACE_PRESETS[partialPrefs.paceId].pagesPerHour
  }
  return persistState(userId, {
    ...current,
    preferences: mergedPrefs,
  })
}

export function resolveBookId(book) {
  if (!book) return ''
  const raw = book.id ?? book.book_id ?? book.bookId ?? ''
  return raw ? String(raw) : ''
}

export function resolveBookTotalPages(book, existingEntry = null) {
  const rawBookPages = Number(book?.pages ?? book?.totalPages)
  if (Number.isFinite(rawBookPages) && rawBookPages > 0) {
    return Math.round(rawBookPages)
  }
  const rawEntryPages = Number(existingEntry?.totalPages)
  if (Number.isFinite(rawEntryPages) && rawEntryPages > 0) {
    return Math.round(rawEntryPages)
  }
  return DEFAULT_TOTAL_PAGES_FALLBACK
}

export function computeBookProgressFromState(state, book) {
  const bookId = resolveBookId(book)
  const entry = bookId ? state.booksProgress?.[bookId] || null : null
  const totalPages = resolveBookTotalPages(book, entry)
  const rawRead = Number(entry?.pagesRead) || 0
  const pagesRead = Math.min(totalPages, Math.max(0, Math.round(rawRead)))
  const remainingPages = Math.max(0, totalPages - pagesRead)
  const percentage = totalPages > 0 ? Math.min(100, Math.round((pagesRead / totalPages) * 100)) : 0
  const isCompleted = totalPages > 0 && pagesRead >= totalPages

  return {
    bookId,
    pagesRead,
    totalPages,
    remainingPages,
    percentage,
    isCompleted,
    lastReadDate: entry?.lastReadDate || null,
    completedAt: entry?.completedAt || null,
  }
}

export function getBookProgress(userId, book) {
  const state = getTrackerState(userId)
  return computeBookProgressFromState(state, book)
}

export function logPagesRead(userId, { book, mode = 'add', pagesInput, minutesSpent } = {}) {
  const bookId = resolveBookId(book)
  const current = getTrackerState(userId)
  if (!bookId) {
    return {
      state: current,
      bookProgress: computeBookProgressFromState(current, book),
      pagesDelta: 0,
      justCompleted: false,
    }
  }

  const existing = current.booksProgress[bookId] || null
  const totalPages = resolveBookTotalPages(book, existing)
  const prevPagesRead = Math.min(totalPages, Math.max(0, Math.round(Number(existing?.pagesRead) || 0)))
  const sanitizedInput = Math.max(0, Math.round(Number(pagesInput) || 0))

  const nextPagesRead =
    mode === 'set'
      ? Math.min(totalPages, sanitizedInput)
      : Math.min(totalPages, prevPagesRead + sanitizedInput)

  const pagesDelta = Math.max(0, nextPagesRead - prevPagesRead)

  if (pagesDelta <= 0 && nextPagesRead === prevPagesRead) {
    return {
      state: current,
      bookProgress: computeBookProgressFromState(current, book),
      pagesDelta: 0,
      justCompleted: false,
    }
  }

  const today = getTodayDateStr()
  const wasCompleted = prevPagesRead >= totalPages
  const isNowCompleted = nextPagesRead >= totalPages
  const justCompleted = !wasCompleted && isNowCompleted

  const authorText = Array.isArray(book?.author)
    ? book.author.join(', ')
    : book?.author || existing?.author || 'Autor desconocido'

  const updatedEntry = {
    bookId,
    title: book?.title || existing?.title || 'Libro sin título',
    author: authorText,
    img: book?.img || existing?.img || null,
    totalPages,
    pagesRead: nextPagesRead,
    lastReadDate: today,
    completedAt: isNowCompleted ? existing?.completedAt || today : null,
  }

  const nextBooksProgress = {
    ...current.booksProgress,
    [bookId]: updatedEntry,
  }

  let nextLogs = current.logs
  if (pagesDelta > 0) {
    const pagesPerHour = current.preferences.pagesPerHour || DEFAULT_PAGES_PER_HOUR
    const resolvedMinutes =
      Number(minutesSpent) > 0
        ? Math.round(Number(minutesSpent))
        : Math.max(1, Math.round((pagesDelta * 60) / pagesPerHour))

    const newLog = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      date: today,
      timestamp: new Date().toISOString(),
      bookId,
      bookTitle: updatedEntry.title,
      bookImg: updatedEntry.img,
      totalPages,
      pagesDelta,
      pagesReadAfter: nextPagesRead,
      minutesSpent: resolvedMinutes,
      completedBook: justCompleted,
    }
    nextLogs = [newLog, ...current.logs]
  }

  const savedState = persistState(userId, {
    ...current,
    booksProgress: nextBooksProgress,
    logs: nextLogs,
  })

  return {
    state: savedState,
    bookProgress: computeBookProgressFromState(savedState, { ...book, id: bookId, pages: totalPages }),
    pagesDelta,
    justCompleted,
  }
}

export function computeStreakStatsFromState(state, referenceDate = new Date()) {
  const pagesByDate = {}
  for (const entry of state.logs || []) {
    const delta = Number(entry?.pagesDelta) || 0
    if (entry?.date && delta > 0) {
      pagesByDate[entry.date] = (pagesByDate[entry.date] || 0) + delta
    }
  }

  const today = getTodayDateStr(referenceDate)
  const yesterday = addDaysToDateStr(today, -1)
  const isActiveToday = (pagesByDate[today] || 0) > 0

  let currentStreak = 0
  let cursor = isActiveToday ? today : (pagesByDate[yesterday] || 0) > 0 ? yesterday : null
  while (cursor && (pagesByDate[cursor] || 0) > 0) {
    currentStreak += 1
    cursor = addDaysToDateStr(cursor, -1)
  }

  const activeDatesSorted = Object.keys(pagesByDate)
    .filter((dateStr) => pagesByDate[dateStr] > 0)
    .sort()

  let bestStreak = 0
  let running = 0
  let prevDate = null
  for (const dateStr of activeDatesSorted) {
    if (prevDate && addDaysToDateStr(prevDate, 1) === dateStr) {
      running += 1
    } else {
      running = 1
    }
    if (running > bestStreak) bestStreak = running
    prevDate = dateStr
  }

  const last7Days = []
  for (let offset = -6; offset <= 0; offset += 1) {
    const dateStr = addDaysToDateStr(today, offset)
    const [y, m, d] = dateStr.split('-').map(Number)
    const dt = new Date(y, m - 1, d)
    const weekdayIdx = dt.getDay()
    const pages = pagesByDate[dateStr] || 0
    last7Days.push({
      date: dateStr,
      label: SPANISH_WEEKDAYS_SHORT[weekdayIdx],
      shortLabel: SPANISH_WEEKDAYS_LETTER[weekdayIdx],
      dayNum: d,
      active: pages > 0,
      pages,
      isToday: dateStr === today,
    })
  }

  return {
    isActiveToday,
    todayPages: pagesByDate[today] || 0,
    currentStreak,
    bestStreak,
    totalActiveDays: activeDatesSorted.length,
    last7Days,
  }
}

export function computeStreakStats(userId) {
  return computeStreakStatsFromState(getTrackerState(userId))
}

export function computeMonthlyStatsFromState(
  state,
  monthKey = getMonthKey(),
  backendCompletedBooks = []
) {
  const currentMonthKey = getMonthKey()
  const safeMonthKey = /^\d{4}-\d{2}$/.test(String(monthKey || '')) ? monthKey : currentMonthKey
  const [year, month] = safeMonthKey.split('-').map(Number)
  const totalDaysInMonth = new Date(year, month, 0).getDate()
  const pagesPerHour = state.preferences?.pagesPerHour || DEFAULT_PAGES_PER_HOUR

  const monthLogs = (state.logs || []).filter(
    (entry) => entry?.date?.startsWith(safeMonthKey) && Number(entry?.pagesDelta) > 0
  )

  let pagesReadInMonth = 0
  let minutesReadInMonth = 0
  const byDay = {}
  const byBookMap = new Map()
  const trackedCompletedIds = new Set()

  for (const entry of Object.values(state.booksProgress || {})) {
    if (entry?.completedAt?.startsWith(safeMonthKey) && entry?.bookId) {
      trackedCompletedIds.add(String(entry.bookId))
    }
  }

  for (const log of monthLogs) {
    const delta = Number(log.pagesDelta) || 0
    const mins =
      Number(log.minutesSpent) > 0
        ? Math.round(Number(log.minutesSpent))
        : Math.max(1, Math.round((delta * 60) / pagesPerHour))

    pagesReadInMonth += delta
    minutesReadInMonth += mins

    if (!byDay[log.date]) {
      byDay[log.date] = { pages: 0, minutes: 0, bookIds: new Set() }
    }
    byDay[log.date].pages += delta
    byDay[log.date].minutes += mins
    byDay[log.date].bookIds.add(String(log.bookId))

    if (log.completedBook) {
      trackedCompletedIds.add(String(log.bookId))
    }

    const bKey = String(log.bookId)
    const progressEntry = state.booksProgress?.[bKey] || null
    const existingBook = byBookMap.get(bKey) || {
      bookId: bKey,
      title: progressEntry?.title || log.bookTitle || 'Libro',
      author: progressEntry?.author || '',
      img: progressEntry?.img || log.bookImg || null,
      totalPages: resolveBookTotalPages(progressEntry, { totalPages: log.totalPages }),
      pagesReadInMonth: 0,
      minutesInMonth: 0,
      currentPagesRead: Number(progressEntry?.pagesRead ?? log.pagesReadAfter) || 0,
      percentage: 0,
      isCompleted: false,
      completedViaLibraryOnly: false,
    }

    existingBook.pagesReadInMonth += delta
    existingBook.minutesInMonth += mins
    existingBook.currentPagesRead = Math.max(
      existingBook.currentPagesRead,
      Number(progressEntry?.pagesRead ?? log.pagesReadAfter) || 0
    )
    existingBook.percentage =
      existingBook.totalPages > 0
        ? Math.min(100, Math.round((existingBook.currentPagesRead / existingBook.totalPages) * 100))
        : 0
    existingBook.isCompleted =
      trackedCompletedIds.has(bKey) || existingBook.currentPagesRead >= existingBook.totalPages

    byBookMap.set(bKey, existingBook)
  }

  // Incluye libros marcados como completados desde el tracker en este mes aunque sus páginas hayan venido sin log o con completedAt
  for (const bookId of trackedCompletedIds) {
    if (!byBookMap.has(bookId)) {
      const entry = state.booksProgress?.[bookId]
      if (entry) {
        const total = resolveBookTotalPages(entry)
        byBookMap.set(bookId, {
          bookId,
          title: entry.title || 'Libro completado',
          author: entry.author || '',
          img: entry.img || null,
          totalPages: total,
          pagesReadInMonth: 0,
          minutesInMonth: 0,
          currentPagesRead: Number(entry.pagesRead) || total,
          percentage: 100,
          isCompleted: true,
          completedViaLibraryOnly: false,
        })
      }
    }
  }

  // En el mes actual, integra libros completados en el backend que no tengan fecha previa en otro mes
  let libraryCompletedFallbackCount = 0
  if (safeMonthKey === currentMonthKey && Array.isArray(backendCompletedBooks)) {
    for (const b of backendCompletedBooks) {
      const bId = resolveBookId(b)
      if (!bId) continue
      const existingProgress = state.booksProgress?.[bId]
      if (existingProgress?.completedAt && !existingProgress.completedAt.startsWith(safeMonthKey)) {
        continue
      }
      if (!trackedCompletedIds.has(bId)) {
        libraryCompletedFallbackCount += 1
        trackedCompletedIds.add(bId)
        if (!byBookMap.has(bId)) {
          const total = resolveBookTotalPages(b)
          byBookMap.set(bId, {
            bookId: bId,
            title: b.title || 'Libro completado',
            author: Array.isArray(b.author) ? b.author.join(', ') : b.author || '',
            img: b.img || null,
            totalPages: total,
            pagesReadInMonth: 0,
            minutesInMonth: 0,
            currentPagesRead: total,
            percentage: 100,
            isCompleted: true,
            completedViaLibraryOnly: true,
          })
        }
      }
    }
  }

  const daysInMonthGrid = []
  let activeDaysInMonth = 0
  let bestStreakInMonth = 0
  let currentRunInMonth = 0

  for (let day = 1; day <= totalDaysInMonth; day += 1) {
    const dateStr = `${safeMonthKey}-${pad2(day)}`
    const dayInfo = byDay[dateStr]
    const pages = dayInfo?.pages || 0
    const minutes = dayInfo?.minutes || 0
    const booksTouched = dayInfo?.bookIds?.size || 0
    const dt = new Date(year, month - 1, day)

    if (pages > 0) {
      activeDaysInMonth += 1
      currentRunInMonth += 1
      if (currentRunInMonth > bestStreakInMonth) {
        bestStreakInMonth = currentRunInMonth
      }
    } else {
      currentRunInMonth = 0
    }

    daysInMonthGrid.push({
      date: dateStr,
      dayNumber: day,
      weekdayLabel: SPANISH_WEEKDAYS_SHORT[dt.getDay()],
      pages,
      minutes,
      booksTouched,
    })
  }

  const monthSet = new Set([currentMonthKey])
  for (const log of state.logs || []) {
    if (log?.date && /^\d{4}-\d{2}/.test(log.date)) {
      monthSet.add(log.date.slice(0, 7))
    }
  }
  for (const entry of Object.values(state.booksProgress || {})) {
    if (entry?.completedAt && /^\d{4}-\d{2}/.test(entry.completedAt)) {
      monthSet.add(entry.completedAt.slice(0, 7))
    }
  }
  const availableMonths = Array.from(monthSet).sort()

  const monthBooks = Array.from(byBookMap.values()).sort((a, b) => {
    if (b.pagesReadInMonth !== a.pagesReadInMonth) {
      return b.pagesReadInMonth - a.pagesReadInMonth
    }
    return Number(b.isCompleted) - Number(a.isCompleted)
  })

  return {
    monthKey: safeMonthKey,
    monthLabel: formatMonthLabel(safeMonthKey),
    booksCompletedInMonth: trackedCompletedIds.size,
    trackedCompletedCount: trackedCompletedIds.size - libraryCompletedFallbackCount,
    libraryCompletedFallbackCount,
    pagesReadInMonth,
    minutesReadInMonth,
    bestStreakInMonth,
    activeDaysInMonth,
    averagePagesPerActiveDay:
      activeDaysInMonth > 0 ? Math.round(pagesReadInMonth / activeDaysInMonth) : 0,
    daysInMonthGrid,
    monthBooks,
    availableMonths,
  }
}

export function computeMonthlyStats(
  userId,
  monthKey = getMonthKey(),
  backendCompletedBooks = []
) {
  return computeMonthlyStatsFromState(getTrackerState(userId), monthKey, backendCompletedBooks)
}

const hydratedUsers = new Set()
const inflightSyncs = new Map()

export function invalidateReadingTrackerCache(userId) {
  if (userId) {
    hydratedUsers.delete(String(userId))
  } else {
    hydratedUsers.clear()
  }
}

export async function syncReadingTracker(userId, { force = false } = {}) {
  if (!userId) return getTrackerState(userId)
  const key = String(userId)

  if (!force && hydratedUsers.has(key)) {
    return getTrackerState(userId)
  }

  if (inflightSyncs.has(key)) {
    return inflightSyncs.get(key)
  }

  const promise = (async () => {
    try {
      const { data } = await getReadingTracker()
      const current = getTrackerState(userId)
      const remoteProgress =
        data?.booksProgress && typeof data.booksProgress === 'object' && !Array.isArray(data.booksProgress)
          ? data.booksProgress
          : {}
      const remoteLogs = Array.isArray(data?.logs) ? data.logs : []

      hydratedUsers.add(key)
      return persistState(userId, {
        ...current,
        booksProgress: remoteProgress,
        logs: remoteLogs,
      })
    } catch {
      return getTrackerState(userId)
    } finally {
      inflightSyncs.delete(key)
    }
  })()

  inflightSyncs.set(key, promise)
  return promise
}

export async function logPagesReadRemote(userId, { book, mode = 'add', pagesInput, minutesSpent } = {}) {
  const bookId = resolveBookId(book)
  const current = getTrackerState(userId)

  if (!bookId) {
    return {
      state: current,
      bookProgress: computeBookProgressFromState(current, book),
      pagesDelta: 0,
      justCompleted: false,
      statusChanged: false,
    }
  }

  if (!userId) {
    return {
      ...logPagesRead(userId, { book, mode, pagesInput, minutesSpent }),
      statusChanged: false,
    }
  }

  const sanitizedInput = Math.max(0, Math.round(Number(pagesInput) || 0))
  const parsedMinutes = Number(minutesSpent) > 0 ? Math.round(Number(minutesSpent)) : undefined
  const pagesPerHour = current.preferences?.pagesPerHour || DEFAULT_PAGES_PER_HOUR

  const { data } = await createReadingLog({
    book_id: bookId,
    mode,
    pages_input: sanitizedInput,
    minutes_spent: parsedMinutes,
    read_date: getTodayDateStr(),
    pages_per_hour: pagesPerHour,
  })

  const pagesDelta = Math.max(0, Number(data?.pagesDelta) || 0)
  if (pagesDelta <= 0) {
    return {
      state: current,
      bookProgress: data?.bookProgress || computeBookProgressFromState(current, book),
      pagesDelta: 0,
      justCompleted: false,
      statusChanged: false,
    }
  }

  const latest = getTrackerState(userId)
  const remoteProgressEntry = data?.bookProgress
    ? {
        bookId: data.bookProgress.bookId || bookId,
        status: data.bookProgress.status || data.status || 'reading',
        title: data.bookProgress.title || book?.title || 'Libro sin título',
        author:
          data.bookProgress.author ||
          (Array.isArray(book?.author) ? book.author.join(', ') : book?.author || 'Autor desconocido'),
        img: data.bookProgress.img ?? book?.img ?? null,
        totalPages: resolveBookTotalPages(data.bookProgress, book),
        pagesRead: Number(data.bookProgress.pagesRead) || 0,
        lastReadDate: data.bookProgress.lastReadDate || getTodayDateStr(),
        completedAt: data.bookProgress.completedAt || null,
      }
    : null

  const nextBooksProgress = remoteProgressEntry
    ? { ...latest.booksProgress, [bookId]: remoteProgressEntry }
    : latest.booksProgress

  const nextLogs = data?.log
    ? [data.log, ...latest.logs.filter((entry) => String(entry.id) !== String(data.log.id))]
    : latest.logs

  hydratedUsers.add(String(userId))
  const savedState = persistState(userId, {
    ...latest,
    booksProgress: nextBooksProgress,
    logs: nextLogs,
  })

  return {
    state: savedState,
    bookProgress: computeBookProgressFromState(savedState, {
      ...book,
      id: bookId,
      pages: remoteProgressEntry?.totalPages ?? book?.pages,
    }),
    pagesDelta,
    justCompleted: Boolean(data?.justCompleted),
    statusChanged: Boolean(data?.statusChanged),
  }
}

export function useReadingTracker(userId) {
  const [version, setVersion] = useState(0)

  useEffect(() => {
    const sync = () => setVersion((v) => v + 1)
    const handleStorage = (event) => {
      if (!event.key || event.key === getStorageKey(userId)) {
        sync()
      }
    }

    window.addEventListener(TRACKER_UPDATED_EVENT, sync)
    window.addEventListener('storage', handleStorage)

    if (userId) {
      void syncReadingTracker(userId)
    }

    return () => {
      window.removeEventListener(TRACKER_UPDATED_EVENT, sync)
      window.removeEventListener('storage', handleStorage)
    }
  }, [userId])

  const trackerState = useMemo(() => {
    void version
    return getTrackerState(userId)
  }, [userId, version])

  const streakStats = useMemo(() => computeStreakStatsFromState(trackerState), [trackerState])

  return {
    trackerState,
    preferences: trackerState.preferences,
    booksProgress: trackerState.booksProgress,
    logs: trackerState.logs,
    streakStats,
  }
}
