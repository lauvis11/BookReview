import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, register } = useAuth()
  const navigate = useNavigate()

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
        setSuccess('¡Cuenta creada! Ahora puedes iniciar sesión.')
        setIsLogin(true)
        setPassword('')
      }
    } catch (err) {
      if (!isLogin && err.response?.status === 409) {
        setError('Ya existe una cuenta con este nombre de usuario')
      } else if (!isLogin && err.response?.status === 400) {
        setError('El nombre de usuario o la contraseña no cumplen los requisitos')
      } else {
        setError(isLogin ? 'Usuario o contraseña incorrectos' : 'No se pudo crear la cuenta')
      }
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center py-8 md:py-12 px-4 md:px-6">
      {/* Login Card */}
      <div className="relative w-full max-w-4xl flex flex-col md:flex-row items-stretch bg-surface-container-lowest shadow-[0_20px_40px_rgba(28,28,22,0.06)] overflow-hidden rounded-lg">
        {/* Visual Side (Editorial Asymmetry) */}
        <div className="hidden md:flex flex-1 bg-surface-container-low relative items-center justify-center p-12 overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="w-full h-full bg-[radial-gradient(#412817_0.5px,transparent_0.5px)] [background-size:16px_16px]"></div>
          </div>
          <div className="relative z-10 text-center flex flex-col items-center">
            <div className="w-56 h-72 md:w-60 md:h-80 bg-surface-container rounded-sm shadow-xl flex items-center justify-center transform -rotate-2 hover:rotate-0 transition-transform duration-700 overflow-hidden">
              <img 
                src="/Book-review.webp" 
                alt="BookReview Logo" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="mt-8 space-y-2">
              <p className="font-headline italic text-xl text-primary-container">"Una habitación sin libros es como un cuerpo sin alma."</p>
              <p className="font-label text-xs tracking-widest uppercase opacity-60">— Cicerón</p>
            </div>
          </div>
        </div>

        {/* Form Side */}
        <div className="flex-1 p-6 md:p-8 lg:p-12 flex flex-col justify-center">
          <header className="mb-8 flex flex-col items-center text-center">
            <img src="/Book-rewiev-logo-removebg-preview.png" alt="BookReview Logo" className="h-20 md:h-24 object-contain mb-3 drop-shadow-sm" />
            <p className="font-body text-on-surface-variant font-light text-sm max-w-sm">
              {isLogin ? 'Bienvenido de nuevo a BookReview. Por favor, ingresa tus datos.' : 'Únete a BookReview. Crea tu cuenta.'}
            </p>
          </header>

          {/* Messages */}
          {error && <div className="mb-4 p-3 rounded-sm bg-error-container text-on-error-container text-sm">{error}</div>}
          {success && <div className="mb-4 p-3 rounded-sm bg-secondary-container text-on-secondary-container text-sm">{success}</div>}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="relative">
              <input
                className="peer w-full bg-surface-container-low border-0 border-b-2 border-outline-variant/50 hover:bg-surface-container focus:bg-surface-container focus:border-secondary focus:ring-0 transition-all duration-300 pt-6 pb-2 px-2 font-body text-on-surface placeholder-transparent"
                id="username"
                placeholder="Usuario"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <label 
                className="absolute left-2 top-1.5 translate-y-0 font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant transition-all duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-placeholder-shown:text-stone-400 peer-focus:top-1.5 peer-focus:translate-y-0 peer-focus:text-[10px] peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-widest peer-focus:text-secondary cursor-text" 
                htmlFor="username"
              >
                Usuario
              </label>
            </div>
            <div className="relative">
              <input
                className="peer w-full bg-surface-container-low border-0 border-b-2 border-outline-variant/50 hover:bg-surface-container focus:bg-surface-container focus:border-secondary focus:ring-0 transition-all duration-300 pt-6 pb-2 px-2 pr-10 font-body text-on-surface placeholder-transparent"
                id="password"
                placeholder="Contraseña"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <label 
                className="absolute left-2 top-1.5 translate-y-0 font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant transition-all duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-placeholder-shown:text-stone-400 peer-focus:top-1.5 peer-focus:translate-y-0 peer-focus:text-[10px] peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-widest peer-focus:text-secondary cursor-text" 
                htmlFor="password"
              >
                Contraseña
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-secondary transition-colors cursor-pointer"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                <span className="material-symbols-outlined text-[20px] pt-1">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
            <button
              className="w-full py-4 bg-primary text-on-primary font-label font-bold uppercase tracking-[0.15em] rounded-sm shadow-md hover:shadow-xl hover:scale-[1.02] hover:brightness-110 active:scale-[0.98] active:brightness-95 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Cargando...' : isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </button>
          </form>

          <div className="mt-12 pt-8 border-t border-surface-container-high text-center">
            <p className="font-body text-sm text-on-surface-variant">
              {isLogin ? '¿Nuevo en la colección? ' : '¿Ya tienes una cuenta? '}
              <button
                onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess('') }}
                className="text-secondary font-semibold hover:text-primary hover:underline underline-offset-4 decoration-secondary ml-1 cursor-pointer transition-colors duration-200"
              >
                {isLogin ? 'Regístrate ahora' : 'Iniciar sesión'}
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Decorative Element */}
      <div className="absolute bottom-12 flex flex-col items-center gap-4 opacity-30">
        <span className="material-symbols-outlined text-4xl text-primary">menu_book</span>
        <div className="w-px h-12 bg-primary"></div>
      </div>
    </main>
  )
}
