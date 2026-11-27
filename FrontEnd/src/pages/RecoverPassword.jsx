import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  Check,
  ChevronLeft,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
} from 'lucide-react'
import { useSEO } from '../hooks/useSEO'
import { useTheme } from '../context/ThemeContext'
import BrandLogo from '../components/ui/BrandLogo'
import { forgotPassword, verifyResetCode, resetPassword } from '../api/auth'

export default function RecoverPassword() {
  const { isDark } = useTheme()
  const [step, setStep] = useState('email') // 'email' | 'code' | 'password' | 'success'
  const [email, setEmail] = useState('')
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [recoveryToken, setRecoveryToken] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  const codeInputsRef = useRef([])
  const navigate = useNavigate()

  useSEO({
    title: 'Recuperar contraseña',
    description: 'Recuperá el acceso a tu cuenta de BookReview mediante un código de verificación de 6 dígitos.',
    noindex: true,
  })

  useEffect(() => {
    if (step === 'code') {
      codeInputsRef.current[0]?.focus()
    }
  }, [step])

  const isPasswordFormatValid =
    password.length >= 6 && /[0-9]/.test(password) && password.length <= 100
  const isPasswordFormatInvalid = password.length > 0 && !isPasswordFormatValid
  const doPasswordsMatch =
    password.length > 0 && confirmPassword.length > 0 && password === confirmPassword
  const isConfirmInvalid = confirmPassword.length > 0 && password !== confirmPassword

  // Paso 1: Solicitar envío de código al correo vía Brevo
  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')
    const trimmed = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Ingresá un correo electrónico válido.')
      return
    }

    setLoading(true)
    try {
      const { data } = await forgotPassword({ email: trimmed })
      setRecoveryToken(data?.recoveryToken || '')
      setCode(['', '', '', '', '', ''])
      setStep('code')
    } catch (err) {
      if (err.response?.status === 429) {
        setError('Demasiados intentos en pocos minutos. Esperá un momento y volvé a probar.')
      } else {
        setError(
          err.response?.data?.message ||
            'No pudimos enviar el código en este momento. Intentá de nuevo.'
        )
      }
    } finally {
      setLoading(false)
    }
  }

  // Manejo de las 6 casillas del código de 6 dígitos
  const handleDigitChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...code]
    next[index] = digit
    setCode(next)
    setError('')

    if (digit && index < 5) {
      codeInputsRef.current[index + 1]?.focus()
    }
  }

  const handleDigitKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      codeInputsRef.current[index - 1]?.focus()
    } else if (e.key === 'ArrowLeft' && index > 0) {
      codeInputsRef.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < 5) {
      codeInputsRef.current[index + 1]?.focus()
    }
  }

  const handleCodePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    const next = ['', '', '', '', '', '']
    for (let i = 0; i < 6; i++) {
      next[i] = pasted[i] || ''
    }
    setCode(next)
    setError('')
    const focusIdx = Math.min(pasted.length, 5)
    codeInputsRef.current[focusIdx]?.focus()
  }

  const handleResendCode = async () => {
    if (loading) return
    setError('')
    setInfo('')
    setLoading(true)
    try {
      const { data } = await forgotPassword({ email: email.trim() })
      setRecoveryToken(data?.recoveryToken || '')
      setCode(['', '', '', '', '', ''])
      setInfo('Enviamos un nuevo código de 6 dígitos a tu correo.')
      codeInputsRef.current[0]?.focus()
    } catch (err) {
      if (err.response?.status === 429) {
        setError('Demasiados intentos en pocos minutos. Esperá un momento y volvé a probar.')
      } else {
        setError(
          err.response?.data?.message ||
            'No pudimos reenviar el código en este momento.'
        )
      }
    } finally {
      setLoading(false)
    }
  }

  // Paso 2: Verificar el código de 6 dígitos en el backend
  const handleCodeSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')
    const fullCode = code.join('')
    if (fullCode.length < 6) {
      setError('Completá los 6 dígitos del código enviado a tu correo.')
      return
    }

    setLoading(true)
    try {
      const { data } = await verifyResetCode({ code: fullCode, recoveryToken })
      setResetToken(data?.resetToken || '')
      setStep('password')
    } catch (err) {
      if (err.response?.status === 429) {
        setError('Demasiados intentos fallidos. Esperá unos minutos antes de reintentar.')
      } else {
        setError(
          err.response?.data?.message ||
            'El código ingresado es incorrecto o venció.'
        )
      }
    } finally {
      setLoading(false)
    }
  }

  // Paso 3: Guardar nueva contraseña real en MySQL
  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')
    if (!isPasswordFormatValid) {
      setError('La contraseña debe tener al menos 6 caracteres y un número.')
      return
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas ingresadas no coinciden.')
      return
    }

    setLoading(true)
    try {
      await resetPassword({ resetToken, new_password: password })
      setStep('success')
    } catch (err) {
      if (err.response?.status === 429) {
        setError('Demasiados intentos en pocos minutos. Esperá un momento y volvé a probar.')
      } else {
        setError(
          err.response?.data?.message ||
            'No pudimos actualizar tu contraseña. Solicitá un nuevo código.'
        )
      }
    } finally {
      setLoading(false)
    }
  }

  const stepIndex = step === 'email' ? 1 : step === 'code' ? 2 : step === 'password' ? 3 : 4

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center py-8 px-4 overflow-x-hidden bg-surface">
      {/* Atmósfera editorial sutil de fondo */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(14,81,70,0.06),transparent_45%),radial-gradient(circle_at_85%_80%,rgba(237,189,121,0.12),transparent_50%)] dark:bg-[radial-gradient(circle_at_15%_20%,rgba(20,108,92,0.18),transparent_45%),radial-gradient(circle_at_85%_80%,rgba(237,189,121,0.08),transparent_50%)]"
      />

      {/* Enlace superior minimalista para volver a iniciar sesión */}
      <div className="relative z-10 w-full max-w-[440px] mb-3 flex items-center justify-between">
        <Link
          to="/auth"
          className="group inline-flex items-center gap-1 py-1 font-body text-sm font-medium text-primary dark:text-[#d6e8b5] hover:text-outline dark:hover:text-[#edbd79] transition-[color,transform] duration-150 ease-out active:scale-[0.96] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary rounded-xs"
        >
          <ChevronLeft
            size={16}
            strokeWidth={2}
            absoluteStrokeWidth
            aria-hidden="true"
            className="rtl:-scale-x-100 transition-transform duration-150 ease-out group-hover:-translate-x-0.5"
          />
          <span>Volver a iniciar sesión</span>
        </Link>
      </div>

      {/* Contenedor modal flotante con borde fino uniforme en todos los lados y sombra sutil */}
      <div className="relative z-10 w-full max-w-[440px] rounded-[16px] bg-surface-container-lowest p-6 sm:p-8 lg:p-9 border border-primary/25 dark:border-outline-variant shadow-[0_16px_40px_-8px_rgba(14,81,70,0.1),0_4px_16px_-2px_rgba(0,0,0,0.04)] dark:shadow-[0_22px_54px_-10px_rgba(0,0,0,0.68)]">
        <div className="w-full">
          {/* Cabecera con logo centrado e indicador de progreso */}
          <div className="text-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary rounded-sm"
            >
              <BrandLogo variant={isDark ? 'dark' : 'light'} className="h-8 sm:h-9 w-auto" />
            </Link>

            {step !== 'success' && (
              <div
                className="mt-4 flex items-center justify-center gap-1.5"
                aria-label={`Paso ${stepIndex} de 3`}
              >
                {[1, 2, 3].map((idx) => (
                  <span
                    key={idx}
                    className={`h-1.5 rounded-full transition-[width,background-color] duration-200 ease-out ${
                      idx === stepIndex
                        ? 'w-7 bg-primary dark:bg-secondary'
                        : idx < stepIndex
                        ? 'w-3 bg-secondary dark:bg-primary'
                        : 'w-3 bg-outline-variant/60'
                    }`}
                  />
                ))}
              </div>
            )}

            <h1 className="mt-4 font-headline text-2xl sm:text-[26px] font-bold tracking-tight text-on-surface leading-snug">
              {step === 'email' && 'Recuperá tu contraseña'}
              {step === 'code' && 'Ingresá el código'}
              {step === 'password' && 'Creá tu nueva contraseña'}
              {step === 'success' && 'Contraseña actualizada'}
            </h1>

            <p className="mt-1.5 font-body text-sm text-on-surface-variant leading-relaxed">
              {step === 'email' &&
                'Ingresá el correo electrónico asociado a tu cuenta para enviarte un código de verificación.'}
              {step === 'code' && (
                <>
                  Enviamos un código de 6 dígitos a{' '}
                  <span className="font-semibold text-on-surface">{email}</span>.{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setStep('email')
                      setError('')
                      setInfo('')
                    }}
                    className="font-semibold text-primary dark:text-[#d6e8b5] hover:text-[#166e5e] dark:hover:text-[#edbd79] underline underline-offset-2 cursor-pointer"
                  >
                    Cambiar
                  </button>
                </>
              )}
              {step === 'password' &&
                'Ingresá dos veces tu nueva contraseña para confirmar el cambio.'}
              {step === 'success' &&
                'Tu contraseña se restableció correctamente. Ya podés ingresar a tu cuenta.'}
            </p>
          </div>

          {/* Cuerpo dinámico por paso con animación de entrada de Animate UI */}
          <div key={step} className="animate-ui-step-panel mt-5">
            {error && (
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

            {info && (
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
                <span>{info}</span>
              </div>
            )}

            {/* PASO 1: Correo electrónico */}
            {step === 'email' && (
              <form className="space-y-4" onSubmit={handleEmailSubmit} noValidate>
                <div>
                  <label
                    htmlFor="recover-email"
                    className="block font-body text-xs font-semibold text-on-surface mb-1.5"
                  >
                    Correo electrónico
                  </label>
                  <div className="relative flex items-center">
                    <Mail
                      size={16}
                      strokeWidth={1.75}
                      absoluteStrokeWidth
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3.5 z-10 text-outline"
                    />
                    <input
                      id="recover-email"
                      type="email"
                      autoComplete="email"
                      placeholder="tu@correo.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        setError('')
                      }}
                      required
                      className="w-full h-11 rounded-[10px] bg-surface-container-low/85 pl-10 pr-3.5 font-body text-sm text-on-surface placeholder:text-outline/65 border border-outline-variant/85 hover:border-primary/40 dark:hover:border-secondary/50 focus:border-primary dark:focus:border-secondary focus:shadow-[0_0_0_3px_rgba(14,81,70,0.12)] dark:focus:shadow-[0_0_0_3px_rgba(237,189,121,0.16)] transition-[background-color,border-color,box-shadow] duration-150 ease-out outline-none! focus-visible:outline-none! focus:translate-y-0! focus:bg-white dark:focus:bg-surface-container"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 inline-flex items-center justify-center gap-2 px-5 rounded-[10px] bg-primary hover:bg-[#166e5e] dark:hover:bg-[#19826f] text-white font-body text-sm font-semibold shadow-[0_2px_6px_rgba(14,81,70,0.22)] hover:shadow-[0_6px_16px_rgba(14,81,70,0.28)] transition-[background-color,box-shadow,transform] duration-150 ease-out enabled:active:scale-[0.96] [-webkit-tap-highlight-color:transparent] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
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
                        <span>Verificando correo...</span>
                      </>
                    ) : (
                      <span>Enviar código</span>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* PASO 2: Solo el código de 6 dígitos */}
            {step === 'code' && (
              <form className="space-y-4" onSubmit={handleCodeSubmit} noValidate>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label
                      htmlFor="recover-code-0"
                      className="block font-body text-xs font-semibold text-on-surface"
                    >
                      Código de 6 dígitos
                    </label>
                    <button
                      type="button"
                      onClick={handleResendCode}
                      className="font-body text-xs font-semibold text-primary dark:text-[#d6e8b5] hover:text-[#166e5e] dark:hover:text-[#edbd79] underline underline-offset-4 decoration-primary/70 dark:decoration-[#d6e8b5]/60 transition-colors duration-150 cursor-pointer"
                    >
                      Reenviar código
                    </button>
                  </div>

                  <div className="grid grid-cols-6 gap-2" onPaste={handleCodePaste}>
                    {code.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`recover-code-${idx}`}
                        ref={(el) => {
                          codeInputsRef.current[idx] = el
                        }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                        aria-label={`Dígito ${idx + 1} del código`}
                        className="w-full h-11 rounded-[10px] bg-surface-container-low/85 text-center font-body text-base font-bold tabular-nums text-on-surface border border-outline-variant/85 hover:border-primary/40 dark:hover:border-secondary/50 focus:border-primary dark:focus:border-secondary focus:shadow-[0_0_0_3px_rgba(14,81,70,0.12)] dark:focus:shadow-[0_0_0_3px_rgba(237,189,121,0.16)] transition-[background-color,border-color,box-shadow] duration-150 ease-out outline-none! focus-visible:outline-none! focus:translate-y-0! focus:bg-white dark:focus:bg-surface-container"
                      />
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 inline-flex items-center justify-center gap-2 px-5 rounded-[10px] bg-primary hover:bg-[#166e5e] dark:hover:bg-[#19826f] text-white font-body text-sm font-semibold shadow-[0_2px_6px_rgba(14,81,70,0.22)] hover:shadow-[0_6px_16px_rgba(14,81,70,0.28)] transition-[background-color,box-shadow,transform] duration-150 ease-out enabled:active:scale-[0.96] [-webkit-tap-highlight-color:transparent] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
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
                        <span>Verificando código...</span>
                      </>
                    ) : (
                      <span>Verificar código</span>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* PASO 3: Ingresar 2 veces la nueva contraseña */}
            {step === 'password' && (
              <form className="space-y-4" onSubmit={handlePasswordSubmit} noValidate>
                <div>
                  <label
                    htmlFor="recover-new-password"
                    className="block font-body text-xs font-semibold text-on-surface mb-1.5"
                  >
                    Nueva contraseña
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
                      id="recover-new-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Mínimo 6 caracteres y un número"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        setError('')
                      }}
                      required
                      className={`w-full h-11 rounded-[10px] bg-surface-container-low/85 pl-10 pr-10 font-body text-sm text-on-surface placeholder:text-outline/65 border transition-[background-color,border-color,box-shadow] duration-150 ease-out outline-none! focus-visible:outline-none! focus:translate-y-0! focus:bg-white dark:focus:bg-surface-container ${
                        isPasswordFormatInvalid
                          ? 'border-error/70 focus:border-error focus:shadow-[0_0_0_3px_rgba(186,26,26,0.12)]'
                          : 'border-outline-variant/85 hover:border-primary/40 dark:hover:border-secondary/50 focus:border-primary dark:focus:border-secondary focus:shadow-[0_0_0_3px_rgba(14,81,70,0.12)] dark:focus:shadow-[0_0_0_3px_rgba(237,189,121,0.16)]'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 z-10 p-1.5 rounded-md text-on-surface-variant hover:text-primary dark:hover:text-[#edbd79] hover:bg-surface-container transition-colors duration-150 ease-out cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
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

                <div>
                  <label
                    htmlFor="recover-confirm-password"
                    className="block font-body text-xs font-semibold text-on-surface mb-1.5"
                  >
                    Repetir nueva contraseña
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
                      id="recover-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Volvé a escribir la contraseña"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value)
                        setError('')
                      }}
                      required
                      className={`w-full h-11 rounded-[10px] bg-surface-container-low/85 pl-10 pr-10 font-body text-sm text-on-surface placeholder:text-outline/65 border transition-[background-color,border-color,box-shadow] duration-150 ease-out outline-none! focus-visible:outline-none! focus:translate-y-0! focus:bg-white dark:focus:bg-surface-container ${
                        isConfirmInvalid
                          ? 'border-error/70 focus:border-error focus:shadow-[0_0_0_3px_rgba(186,26,26,0.12)]'
                          : 'border-outline-variant/85 hover:border-primary/40 dark:hover:border-secondary/50 focus:border-primary dark:focus:border-secondary focus:shadow-[0_0_0_3px_rgba(14,81,70,0.12)] dark:focus:shadow-[0_0_0_3px_rgba(237,189,121,0.16)]'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2.5 z-10 p-1.5 rounded-md text-on-surface-variant hover:text-primary dark:hover:text-[#edbd79] hover:bg-surface-container transition-colors duration-150 ease-out cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
                      aria-label={
                        showConfirmPassword ? 'Ocultar confirmación' : 'Mostrar confirmación'
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={16} strokeWidth={1.75} absoluteStrokeWidth aria-hidden="true" />
                      ) : (
                        <Eye size={16} strokeWidth={1.75} absoluteStrokeWidth aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Indicadores claros de validación */}
                <ul className="pt-0.5 space-y-1.5" aria-label="Requisitos de la nueva contraseña">
                  <li
                    className={`flex items-center gap-2 font-body text-xs transition-colors duration-150 ${
                      isPasswordFormatValid
                        ? 'text-primary dark:text-[#d6e8b5] font-medium'
                        : isPasswordFormatInvalid
                        ? 'text-error'
                        : 'text-on-surface-variant/80'
                    }`}
                  >
                    <span
                      className={`inline-flex size-4 items-center justify-center rounded-full border transition-colors duration-150 ${
                        isPasswordFormatValid
                          ? 'bg-primary border-primary text-white'
                          : isPasswordFormatInvalid
                          ? 'border-error text-error'
                          : 'border-outline-variant text-transparent'
                      }`}
                    >
                      <Check size={10} strokeWidth={2.5} absoluteStrokeWidth aria-hidden="true" />
                    </span>
                    <span>Mínimo 6 caracteres con al menos un número</span>
                  </li>
                  <li
                    className={`flex items-center gap-2 font-body text-xs transition-colors duration-150 ${
                      doPasswordsMatch
                        ? 'text-primary dark:text-[#d6e8b5] font-medium'
                        : isConfirmInvalid
                        ? 'text-error'
                        : 'text-on-surface-variant/80'
                    }`}
                  >
                    <span
                      className={`inline-flex size-4 items-center justify-center rounded-full border transition-colors duration-150 ${
                        doPasswordsMatch
                          ? 'bg-primary border-primary text-white'
                          : isConfirmInvalid
                          ? 'border-error text-error'
                          : 'border-outline-variant text-transparent'
                      }`}
                    >
                      <Check size={10} strokeWidth={2.5} absoluteStrokeWidth aria-hidden="true" />
                    </span>
                    <span>Ambas contraseñas coinciden</span>
                  </li>
                </ul>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 inline-flex items-center justify-center gap-2 px-5 rounded-[10px] bg-primary hover:bg-[#166e5e] dark:hover:bg-[#19826f] text-white font-body text-sm font-semibold shadow-[0_2px_6px_rgba(14,81,70,0.22)] hover:shadow-[0_6px_16px_rgba(14,81,70,0.28)] transition-[background-color,box-shadow,transform] duration-150 ease-out enabled:active:scale-[0.96] [-webkit-tap-highlight-color:transparent] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
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
                        <span>Guardando contraseña...</span>
                      </>
                    ) : (
                      <span>Guardar contraseña</span>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* PASO 4: Éxito con animación de ícono de Animate UI (spring.checkPop + transition.check) */}
            {step === 'success' && (
              <div className="pt-2 pb-1 text-center space-y-5">
                <div className="relative mx-auto size-16 flex items-center justify-center">
                  {/* Halo expansivo sutil */}
                  <span
                    aria-hidden="true"
                    className="animate-ui-check-ring absolute inset-0 rounded-full bg-primary/18"
                  />
                  {/* Círculo con spring.checkPop (scale 0.5 -> 1.13 -> 1) */}
                  <div className="animate-ui-check-badge relative size-16 rounded-full bg-primary text-secondary flex items-center justify-center shadow-[0_8px_24px_rgba(14,81,70,0.28)]">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="size-8"
                      aria-hidden="true"
                    >
                      <path
                        d="M5 12.5L10 17.5L19 7.5"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="animate-ui-check-path"
                      />
                    </svg>
                  </div>
                </div>

                <p className="font-body text-xs text-on-surface-variant leading-relaxed">
                  Actualizamos la contraseña asociada a{' '}
                  <span className="font-semibold text-on-surface">{email}</span>.
                </p>

                <button
                  type="button"
                  onClick={() => navigate('/auth')}
                  className="w-full h-11 inline-flex items-center justify-center gap-2 px-5 rounded-[10px] bg-primary hover:bg-[#166e5e] dark:hover:bg-[#19826f] text-white font-body text-sm font-semibold shadow-[0_2px_6px_rgba(14,81,70,0.22)] hover:shadow-[0_6px_16px_rgba(14,81,70,0.28)] transition-[background-color,box-shadow,transform] duration-150 ease-out enabled:active:scale-[0.96] [-webkit-tap-highlight-color:transparent] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <span>Iniciar sesión</span>
                </button>
              </div>
            )}
          </div>

          {/* Pie con botón secundario amarillo mientras no esté en el paso final */}
          {step !== 'success' && (
            <div className="mt-6 pt-4 border-t border-surface-container-high flex flex-col gap-2.5">
              <p className="text-center font-body text-xs text-on-surface-variant">
                ¿Recordaste tu contraseña?
              </p>
              <Link
                to="/auth"
                className="w-full h-11 inline-flex items-center justify-center gap-2 px-5 rounded-[10px] bg-transparent border-2 border-secondary text-secondary-dark hover:bg-secondary/10 hover:border-secondary-hover font-body text-sm font-semibold transition-[background-color,border-color,color,transform] duration-150 ease-out active:scale-[0.96] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
              >
                <span>Iniciar sesión</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
