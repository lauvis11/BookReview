import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  AlertCircle,
  BookOpen,
  Check,
  ChevronLeft,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  User,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { frases } from '../utils/frases'
import { useSEO } from '../hooks/useSEO'
import BrandLogo from '../components/ui/BrandLogo'

const TOTAL_STRIPS = 16
const FOLD_ANGLES = [0, 3.2, 3.6, 4.0, 4.4, 4.8, 5.2, 5.5, 5.5, 5.2, 4.8, 4.4, 4.0, 3.6, 3.2, 2.8]
const TURN_DURATION_MS = 800

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const [isTurning, setIsTurning] = useState(false)
  const turnTimerRef = useRef(null)
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [quote] = useState(() => frases[Math.floor(Math.random() * frases.length)])

  useEffect(() => {
    return () => {
      if (turnTimerRef.current) clearTimeout(turnTimerRef.current)
    }
  }, [])

  useSEO({
    title: isLogin ? 'Iniciar sesión' : 'Crear cuenta',
    description:
      'Iniciá sesión o creá tu cuenta en BookReview para organizar tu biblioteca personal, guardar favoritos y conversar con Lib, tu asistente de lectura.',
    noindex: true,
  })
  const { login, register } = useAuth()
  const navigate = useNavigate()

  const isNameValid = name.trim().length >= 3 && name.trim().length <= 50
  const isPasswordValid =
    password.length >= 6 && /[0-9]/.test(password) && password.length <= 100
  const isNameInvalid = name.length > 0 && !isNameValid
  const isPasswordInvalid = password.length > 0 && !isPasswordValid

  const handleModeSwitch = (targetIsLogin) => {
    if (targetIsLogin === isLogin) return
    if (turnTimerRef.current) clearTimeout(turnTimerRef.current)
    setIsTurning(true)
    setIsLogin(targetIsLogin)
    setError('')
    setSuccess('')
    turnTimerRef.current = setTimeout(() => {
      setIsTurning(false)
    }, TURN_DURATION_MS)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      if (isLogin) {
        await login({ name, password })
        navigate('/')
      } else {
        await register({ name, password })
        const userData = await login({ name, password })
        navigate(`/user/${userData.id}`, { state: { openEdit: true } })
      }
    } catch (err) {
      if (!isLogin && err.response?.status === 409) {
        setError('Ese nombre de usuario ya está en uso. Probá con otro.')
      } else if (!isLogin && err.response?.status === 400) {
        setError('Revisá que el usuario y la contraseña cumplan las condiciones.')
      } else {
        setError(
          isLogin
            ? 'El usuario o la contraseña no coinciden. Revisalos e intentá de nuevo.'
            : 'No pudimos crear la cuenta en este momento. Intentá de nuevo.'
        )
      }
    }
    setLoading(false)
  }

  const renderVisualSide = (face = 'front') => {
    const isFront = face === 'front'

    return (
      <div
        className={`relative flex items-center justify-center w-full h-full bg-primary p-10 sm:p-12 lg:p-14 overflow-hidden select-none ${
          isFront ? 'border-r-[3px] border-[#dfd6c5]' : 'border-l-[3px] border-[#dfd6c5]'
        }`}
      >
        {/* Sombreado natural del giro de hoja 3D */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 ${
            isFront ? 'auth-leaf-sheen-front' : 'auth-leaf-sheen-back'
          }`}
        />

        {/* Epígrafe literario minimalista: únicamente la frase y su autor con tipografía Playfair Display */}
        <figure className="relative z-10 w-full max-w-[330px]">
          <blockquote className="font-epigraph italic text-[23px] sm:text-[25px] lg:text-[27px] font-normal text-[#f8f7f2] leading-[1.45] tracking-[-0.01em] text-balance">
            “{quote.frase}”
          </blockquote>
          <figcaption className="mt-6 flex items-center gap-3">
            <span aria-hidden="true" className="h-px w-7 bg-secondary/75 shrink-0" />
            <span className="font-epigraph text-[15px] lg:text-[16px] font-medium tracking-[0.02em] text-secondary">
              {quote.autor}
            </span>
          </figcaption>
        </figure>
      </div>
    )
  }

  // Renderiza recursivamente los 16 segmentos continuos sin bordes ni gradientes por franja para que la curvatura sea invisible
  const renderFlexibleStrip = (index) => {
    const isOuterEdge = index === TOTAL_STRIPS - 1
    const backSliceIndex = TOTAL_STRIPS - 1 - index

    return (
      <>
        {/* Cara frontal del segmento (visible a la derecha en modo Registro) */}
        <div
          className={`auth-strip-face absolute inset-y-0 left-0 w-[calc(100%+0.75px)] overflow-hidden ${
            isOuterEdge ? 'rounded-r-[11px]' : ''
          }`}
        >
          <div
            className="absolute top-0 bottom-0 h-full"
            style={{ width: `${TOTAL_STRIPS * 100}%`, left: `-${index * 100}%` }}
          >
            {renderVisualSide('front')}
          </div>
        </div>

        {/* Cara trasera del segmento (visible a la izquierda en modo Iniciar Sesión) */}
        <div
          className={`auth-strip-face auth-strip-face-back absolute inset-y-0 left-0 w-[calc(100%+0.75px)] overflow-hidden ${
            isOuterEdge ? 'rounded-l-[11px]' : ''
          }`}
        >
          <div
            className="absolute top-0 bottom-0 h-full"
            style={{ width: `${TOTAL_STRIPS * 100}%`, left: `-${backSliceIndex * 100}%` }}
          >
            {renderVisualSide('back')}
          </div>
        </div>

        {/* Siguiente segmento articulado encadenado al borde derecho */}
        {index + 1 < TOTAL_STRIPS && (
          <div
            data-login={isLogin}
            style={{ '--fold-deg': `${FOLD_ANGLES[index + 1]}deg` }}
            className="auth-fold-lead absolute top-0 left-full w-full h-full"
          >
            <div
              data-login={isLogin}
              style={{ '--fold-deg': `${FOLD_ANGLES[index + 1]}deg` }}
              className="auth-fold-lag relative w-full h-full"
            >
              {renderFlexibleStrip(index + 1)}
            </div>
          </div>
        )}
      </>
    )
  }

  const renderFormSide = (isLoginMode) => {
    const isActive = isLogin === isLoginMode
    const modeKey = isLoginMode ? 'login' : 'register'

    return (
      <div
        inert={!isActive ? '' : undefined}
        aria-hidden={!isActive}
        className={`relative flex w-full h-full flex-col justify-between bg-surface-container-lowest p-6 sm:p-8 lg:px-11 lg:py-10 ${
          isLoginMode ? 'auth-page-right-curve' : 'auth-page-left-curve'
        } ${isActive ? 'pointer-events-auto' : 'pointer-events-none select-none'}`}
      >
        {/* Cabecera editorial con logo centrado */}
        <div className="w-full max-w-[340px] mx-auto text-center">
          <Link
            to="/"
            tabIndex={isActive ? 0 : -1}
            className="inline-flex items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary rounded-sm"
          >
            <BrandLogo variant="light" className="h-8 sm:h-9 w-auto" />
          </Link>

          <h1 className="mt-4 font-headline text-2xl sm:text-[26px] font-bold tracking-tight text-on-surface leading-snug">
            {isLoginMode ? 'Bienvenido de nuevo' : 'Creá tu cuenta de lector'}
          </h1>
          <p className="mt-1 font-body text-sm text-on-surface-variant leading-relaxed">
            {isLoginMode
              ? 'Ingresá tus datos para continuar con tu biblioteca y tus reseñas.'
              : 'Guardá tus lecturas favoritas, compartí opiniones y pedile recomendaciones a Lib.'}
          </p>
        </div>

        {/* Cuerpo del formulario */}
        <div className="w-full max-w-[340px] mx-auto mt-3 mb-4">
          {isActive && error && (
            <div
              role="alert"
              className="mb-4 flex items-start gap-2.5 rounded-[10px] bg-error-container/80 px-3.5 py-2.5 text-on-error-container text-xs font-body leading-relaxed border border-error/15"
            >
              <AlertCircle
                size={15}
                strokeWidth={2}
                absoluteStrokeWidth
                className="shrink-0 mt-0.5 text-error"
                aria-hidden="true"
              />
              <span>{error}</span>
            </div>
          )}

          {isActive && success && (
            <div
              role="status"
              className="mb-4 flex items-start gap-2.5 rounded-[10px] bg-secondary-container px-3.5 py-2.5 text-on-secondary-container text-xs font-body leading-relaxed"
            >
              <Check
                size={15}
                strokeWidth={2}
                absoluteStrokeWidth
                className="shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <span>{success}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            {/* Campo Usuario */}
            <div>
              <label
                htmlFor={`username-${modeKey}`}
                className="block font-body text-xs font-semibold text-on-surface mb-1.5"
              >
                Nombre de usuario
              </label>
              <div className="relative flex items-center">
                <User
                  size={16}
                  strokeWidth={1.75}
                  absoluteStrokeWidth
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3.5 z-10 text-outline"
                />
                <input
                  id={`username-${modeKey}`}
                  type="text"
                  autoComplete="username"
                  placeholder="Tu nombre de usuario"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  tabIndex={isActive ? 0 : -1}
                  required
                  className={`w-full h-11 rounded-[10px] bg-surface-container-low/85 pl-10 pr-3.5 font-body text-sm text-on-surface placeholder:text-outline/65 border transition-[background-color,border-color,box-shadow] duration-150 ease-out outline-none! focus-visible:outline-none! focus:translate-y-0! focus:bg-white ${
                    !isLoginMode && isNameInvalid
                      ? 'border-error/70 focus:border-error focus:shadow-[0_0_0_3px_rgba(186,26,26,0.12)]'
                      : 'border-outline-variant/85 hover:border-primary/40 focus:border-primary focus:shadow-[0_0_0_3px_rgba(14,81,70,0.12)]'
                  }`}
                />
              </div>
            </div>

            {/* Campo Contraseña */}
            <div>
              <label
                htmlFor={`password-${modeKey}`}
                className="block font-body text-xs font-semibold text-on-surface mb-1.5"
              >
                Contraseña
              </label>
              <div className="relative flex items-center">
                <Lock
                  size={16}
                  strokeWidth={1.75}
                  absoluteStrokeWidth
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3.5 z-10 text-outline"
                />
                <input
                  id={`password-${modeKey}`}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isLoginMode ? 'current-password' : 'new-password'}
                  placeholder={isLoginMode ? 'Tu contraseña' : 'Mínimo 6 caracteres y un número'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  tabIndex={isActive ? 0 : -1}
                  required
                  className={`w-full h-11 rounded-[10px] bg-surface-container-low/85 pl-10 pr-10 font-body text-sm text-on-surface placeholder:text-outline/65 border transition-[background-color,border-color,box-shadow] duration-150 ease-out outline-none! focus-visible:outline-none! focus:translate-y-0! focus:bg-white ${
                    !isLoginMode && isPasswordInvalid
                      ? 'border-error/70 focus:border-error focus:shadow-[0_0_0_3px_rgba(186,26,26,0.12)]'
                      : 'border-outline-variant/85 hover:border-primary/40 focus:border-primary focus:shadow-[0_0_0_3px_rgba(14,81,70,0.12)]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={isActive ? 0 : -1}
                  className="absolute right-2.5 z-10 p-1.5 rounded-md text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors duration-150 ease-out cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? (
                    <EyeOff size={16} strokeWidth={1.75} absoluteStrokeWidth aria-hidden="true" />
                  ) : (
                    <Eye size={16} strokeWidth={1.75} absoluteStrokeWidth aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {/* Indicadores claros de requisitos en Registro */}
            {!isLoginMode && (
              <ul className="pt-0.5 space-y-1.5" aria-label="Requisitos de la cuenta">
                <li
                  className={`flex items-center gap-2 font-body text-xs transition-colors duration-150 ${
                    isNameValid
                      ? 'text-primary font-medium'
                      : isNameInvalid
                      ? 'text-error'
                      : 'text-on-surface-variant/80'
                  }`}
                >
                  <span
                    className={`inline-flex size-4 items-center justify-center rounded-full border transition-colors duration-150 ${
                      isNameValid
                        ? 'bg-primary border-primary text-white'
                        : isNameInvalid
                        ? 'border-error text-error'
                        : 'border-outline-variant text-transparent'
                    }`}
                  >
                    <Check size={10} strokeWidth={2.5} absoluteStrokeWidth aria-hidden="true" />
                  </span>
                  <span>Usuario de 3 a 50 caracteres</span>
                </li>
                <li
                  className={`flex items-center gap-2 font-body text-xs transition-colors duration-150 ${
                    isPasswordValid
                      ? 'text-primary font-medium'
                      : isPasswordInvalid
                      ? 'text-error'
                      : 'text-on-surface-variant/80'
                  }`}
                >
                  <span
                    className={`inline-flex size-4 items-center justify-center rounded-full border transition-colors duration-150 ${
                      isPasswordValid
                        ? 'bg-primary border-primary text-white'
                        : isPasswordInvalid
                        ? 'border-error text-error'
                        : 'border-outline-variant text-transparent'
                    }`}
                  >
                    <Check size={10} strokeWidth={2.5} absoluteStrokeWidth aria-hidden="true" />
                  </span>
                  <span>Contraseña de 6+ caracteres con al menos un número</span>
                </li>
              </ul>
            )}

            {/* Botón principal sin flecha -> */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                tabIndex={isActive ? 0 : -1}
                className="group w-full h-11 inline-flex items-center justify-center gap-2 px-5 rounded-[10px] bg-primary hover:bg-[#166e5e] text-white font-body text-sm font-semibold shadow-[0_2px_6px_rgba(14,81,70,0.22)] hover:shadow-[0_6px_16px_rgba(14,81,70,0.28)] transition-[background-color,box-shadow,transform] duration-150 ease-out enabled:active:scale-[0.96] [-webkit-tap-highlight-color:transparent] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {loading ? (
                  <>
                    <Loader2
                      size={16}
                      strokeWidth={2}
                      absoluteStrokeWidth
                      className="animate-spin"
                      aria-hidden="true"
                    />
                    <span>{isLoginMode ? 'Ingresando...' : 'Creando cuenta...'}</span>
                  </>
                ) : (
                  <span>{isLoginMode ? 'Iniciar sesión' : 'Crear cuenta'}</span>
                )}
              </button>
            </div>

            {/* Recuperación de contraseña en línea que redirige a /recuperar-contraseña */}
            {isLoginMode && (
              <div className="pt-1 flex items-center justify-center gap-1.5">
                <span className="font-body text-xs text-on-surface-variant">
                  ¿Olvidaste tu contraseña?
                </span>
                <Link
                  to="/recuperar-contraseña"
                  tabIndex={isActive ? 0 : -1}
                  className="font-body text-xs font-semibold text-primary hover:text-[#166e5e] underline underline-offset-4 decoration-primary/70 hover:decoration-[#166e5e] transition-[color,text-decoration-color,transform] duration-150 ease-out active:scale-[0.96] [-webkit-tap-highlight-color:transparent] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-xs"
                >
                  Recuperar contraseña
                </Link>
              </div>
            )}
          </form>
        </div>

        {/* Pie del formulario: cambio de página */}
        <div className="w-full max-w-[340px] mx-auto pt-4 border-t border-surface-container-high flex flex-col gap-2.5">
          <p className="text-center font-body text-xs text-on-surface-variant">
            {isLoginMode ? '¿Todavía no tenés cuenta?' : '¿Ya tenés una cuenta?'}
          </p>
          <button
            type="button"
            onClick={() => handleModeSwitch(!isLoginMode)}
            tabIndex={isActive ? 0 : -1}
            className="group w-full h-11 inline-flex items-center justify-center gap-2 ps-5 pe-4.5 rounded-[10px] bg-transparent border-2 border-secondary text-secondary-dark hover:bg-secondary/10 hover:border-secondary-hover font-body text-sm font-semibold transition-[background-color,border-color,color,transform] duration-150 ease-out enabled:active:scale-[0.96] [-webkit-tap-highlight-color:transparent] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
          >
            <BookOpen size={16} strokeWidth={2} absoluteStrokeWidth aria-hidden="true" />
            <span>{isLoginMode ? 'Crear cuenta' : 'Iniciar sesión'}</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center py-6 sm:py-10 px-4 md:px-6 overflow-x-hidden bg-surface">
      {/* Atmósfera editorial sutil de fondo */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(14,81,70,0.06),transparent_45%),radial-gradient(circle_at_85%_80%,rgba(237,189,121,0.12),transparent_50%)]"
      />

      {/* Barra superior minimalista sin bordes ni fondo para acceder sin cuenta */}
      <div className="relative z-10 w-full max-w-4xl mb-3 flex items-center justify-between">
        <Link
          to="/"
          className="group inline-flex items-center gap-1 py-1 font-body text-sm font-medium text-primary hover:text-outline transition-[color,transform] duration-150 ease-out active:scale-[0.96] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary rounded-xs"
        >
          <ChevronLeft
            size={16}
            strokeWidth={2}
            absoluteStrokeWidth
            aria-hidden="true"
            className="rtl:-scale-x-100 transition-transform duration-150 ease-out group-hover:-translate-x-0.5"
          />
          <span>Acceder sin cuenta</span>
        </Link>
      </div>

      {/* Cubierta exterior de tapa dura (Concentric radius: outer 22px = inner 11px + 10px p-2.5 + 1px border) */}
      <div className="relative z-10 w-full max-w-4xl rounded-[22px] bg-[#0b3b33] p-2 sm:p-2.5 shadow-[0_32px_70px_-15px_rgba(7,35,30,0.42)] border border-secondary/25">
        {/* Cinta marcapáginas dorada en el lomo superior */}
        <div
          aria-hidden="true"
          className="hidden md:block absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-7 bg-secondary rounded-t-xs shadow-sm z-40 [clip-path:polygon(0_0,100%_0,100%_100%,50%_78%,0_100%)]"
        />

        {/* Pliego interior de páginas abiertas (rounded-[11px]) */}
        <div className="auth-book-spread relative w-full min-h-[580px] grid grid-cols-1 md:grid-cols-2 bg-surface-container-lowest rounded-[11px]">
          {/* Página izquierda estática (Formulario de Registro en Desktop / Hoja con giro suave en Móvil) */}
          <div
            className={`col-start-1 row-start-1 md:col-start-1 md:row-start-1 w-full h-full rounded-[11px] md:rounded-none md:rounded-l-[11px] overflow-hidden border-l-[3px] border-[#e6dfd3] transition-[transform,opacity] duration-450 ease-[cubic-bezier(0.23,1,0.32,1)] ${
              !isLogin
                ? 'opacity-100 translate-x-0 z-10'
                : 'opacity-0 -translate-x-4 pointer-events-none md:opacity-100 md:translate-x-0 md:pointer-events-auto z-0'
            }`}
          >
            {renderFormSide(false)}
          </div>

          {/* Página derecha estática (Formulario de Login en Desktop / Hoja con giro suave en Móvil) */}
          <div
            className={`col-start-1 row-start-1 md:col-start-2 md:row-start-1 w-full h-full rounded-[11px] md:rounded-none md:rounded-r-[11px] overflow-hidden border-r-[3px] border-[#e6dfd3] transition-[transform,opacity] duration-450 ease-[cubic-bezier(0.23,1,0.32,1)] ${
              isLogin
                ? 'opacity-100 translate-x-0 z-10'
                : 'opacity-0 translate-x-4 pointer-events-none md:opacity-100 md:translate-x-0 md:pointer-events-auto z-0'
            }`}
          >
            {renderFormSide(true)}
          </div>

          {/* Sombra proyectada sobre el pliego al pasar la hoja (Desktop, 100% GPU translate) */}
          <div
            aria-hidden="true"
            className={`hidden md:block pointer-events-none absolute inset-y-0 left-0 w-1/2 z-20 bg-radial from-black/22 via-black/8 to-transparent transition-[transform,opacity] duration-780 ease-[cubic-bezier(0.645,0.045,0.355,1)] ${
              isLogin ? 'translate-x-0 opacity-65' : 'translate-x-full opacity-65'
            }`}
          />

          {/* Hoja en reposo 100% plana y continua (sin pliegues visibles antes de empezar ni al terminar) */}
          <div
            aria-hidden="true"
            className={`hidden md:block pointer-events-none absolute top-0 bottom-0 w-1/2 z-30 overflow-hidden shadow-[0_18px_42px_rgba(7,35,30,0.32)] ${
              isLogin ? 'left-0 rounded-l-[11px]' : 'left-1/2 rounded-r-[11px]'
            } ${isTurning ? 'opacity-0' : 'opacity-100'}`}
          >
            {renderVisualSide(isLogin ? 'back' : 'front')}
          </div>

          {/* Escenario 3D aislado en z-30 para que la hoja siempre pase por encima de las páginas estáticas */}
          <div
            aria-hidden="true"
            className={`auth-3d-stage hidden md:block pointer-events-none absolute inset-0 z-30 ${
              isTurning ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div
              data-login={isLogin}
              className="auth-fold-root absolute top-0 left-1/2 w-[3.125%] h-full"
            >
              {renderFlexibleStrip(0)}
            </div>
          </div>

          {/* Pliegue central profundo del lomo (Gutter 3D realista) */}
          <div
            aria-hidden="true"
            className="auth-spine-gutter hidden md:block pointer-events-none absolute inset-y-0 left-1/2 -ml-5 w-10 z-40"
          />
          <div
            aria-hidden="true"
            className="hidden md:block pointer-events-none absolute inset-y-0 left-1/2 w-px bg-gradient-to-b from-secondary/40 via-[#07231e]/45 to-secondary/40 z-40"
          />
        </div>
      </div>
    </main>
  )
}
