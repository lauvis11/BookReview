import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Paleta: #412817 primario | #745a34 secundario | #c2a878 dorado | #ffdcc6 crema | #f7f3ea beige | #d3c3bb borde

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

  const isNameInvalid = name.length > 0 && (name.length < 3 || name.length > 50);
  const isPasswordInvalid = password.length > 0 && (password.length < 6 || !/[0-9]/.test(password) || password.length > 100);

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

  const renderVisualSide = () => (
    <div className="flex w-full h-full bg-[#412817] relative items-center justify-center p-12 overflow-hidden">
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="w-full h-full bg-[radial-gradient(#ffdcc6_1px,transparent_1px)] [background-size:24px_24px]"></div>
      </div>
      <div className="relative z-10 text-center flex flex-col items-center">
        <div className="w-56 h-72 md:w-60 md:h-80 bg-surface-container rounded-sm shadow-2xl flex items-center justify-center transform -rotate-2 hover:rotate-0 transition-transform duration-700 overflow-hidden border-4 border-[#c2a878]/20">
          <img 
            src="/imagen-libro.png" 
            alt="BookReview Logo" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="mt-10 space-y-3">
          <p className="font-headline italic text-xl md:text-2xl text-[#ffdcc6] drop-shadow-sm">"Una habitación sin libros es como un cuerpo sin alma."</p>
          <p className="font-label text-xs tracking-widest uppercase text-[#c2a878] opacity-80">— Cicerón</p>
        </div>
      </div>
    </div>
  );

  const renderFormSide = (isLoginMode) => (
    <div className="flex w-full h-full flex-col justify-center bg-surface-container-lowest p-6 md:p-8 lg:p-12">
      <header className="mb-8 flex flex-col items-center text-center">
        <h2 className="font-headline font-semibold text-xl md:text-2xl text-[#745a34] mb-3 tracking-wide opacity-90">
          {isLoginMode ? 'Iniciar Sesión' : 'Crear Cuenta'}
        </h2>
        <img src="/Book-rewiev-logo-removebg-preview.png" alt="BookReview Logo" className="h-14 md:h-16 object-contain mb-2 drop-shadow-sm opacity-90" />
        <p className="font-body text-on-surface-variant font-light text-sm max-w-sm">
          {isLoginMode ? 'Bienvenido de nuevo. Por favor, ingresa tus datos.' : 'Únete a nuestra comunidad de lectores.'}
        </p>
      </header>

      {/* Messages */}
      {error && <div className="mb-4 p-3 rounded-sm bg-error-container text-on-error-container text-sm">{error}</div>}
      {success && <div className="mb-4 p-3 rounded-sm bg-secondary-container text-on-secondary-container text-sm">{success}</div>}

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="relative">
          <input
            className="peer w-full bg-surface-container-low border-0 border-b-2 border-outline-variant/50 hover:bg-surface-container focus:bg-surface-container focus:border-secondary focus:ring-0 transition-all duration-300 pt-6 pb-2 px-2 font-body text-on-surface placeholder-transparent"
            id={`username-${isLoginMode}`}
            placeholder="Usuario"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <label 
            className="absolute left-2 top-1.5 translate-y-0 font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant transition-all duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-placeholder-shown:text-stone-400 peer-focus:top-1.5 peer-focus:translate-y-0 peer-focus:text-[10px] peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-widest peer-focus:text-secondary cursor-text" 
            htmlFor={`username-${isLoginMode}`}
          >
            Usuario
          </label>
          {!isLoginMode && isNameInvalid && (
            <p className="absolute -bottom-5 left-2 text-[10px] font-body text-error font-medium">
              Debe tener entre 3 y 50 caracteres
            </p>
          )}
        </div>
        <div className="relative">
          <input
            className="peer w-full bg-surface-container-low border-0 border-b-2 border-outline-variant/50 hover:bg-surface-container focus:bg-surface-container focus:border-secondary focus:ring-0 transition-all duration-300 pt-6 pb-2 px-2 pr-10 font-body text-on-surface placeholder-transparent"
            id={`password-${isLoginMode}`}
            placeholder="Contraseña"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <label 
            className="absolute left-2 top-1.5 translate-y-0 font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant transition-all duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-placeholder-shown:text-stone-400 peer-focus:top-1.5 peer-focus:translate-y-0 peer-focus:text-[10px] peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-widest peer-focus:text-secondary cursor-text" 
            htmlFor={`password-${isLoginMode}`}
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
          {!isLoginMode && isPasswordInvalid && (
            <p className="absolute -bottom-5 left-2 text-[10px] font-body text-error font-medium">
              Mín. 6 caracteres y al menos un número
            </p>
          )}
        </div>
        <button
          className="w-full py-4 bg-primary text-on-primary font-label font-bold uppercase tracking-[0.15em] rounded-sm shadow-md hover:shadow-xl hover:scale-[1.02] hover:brightness-110 active:scale-[0.98] active:brightness-95 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Cargando...' : isLoginMode ? 'Iniciar Sesión' : 'Crear Cuenta'}
        </button>
      </form>

      <div className="mt-12 pt-8 border-t border-surface-container-high text-center">
        <p className="font-body text-sm text-on-surface-variant mb-3">
          {isLoginMode ? '¿Nuevo en la colección? ' : '¿Ya tienes una cuenta? '}
          <button
            onClick={() => { setIsLogin(!isLoginMode); setError(''); setSuccess('') }}
            className="text-secondary font-semibold hover:text-primary hover:underline underline-offset-4 decoration-secondary ml-1 cursor-pointer transition-colors duration-200"
          >
            {isLoginMode ? 'Regístrate ahora' : 'Iniciar sesión'}
          </button>
        </p>
        <Link 
          to="/" 
          className="font-body text-xs text-on-surface-variant opacity-70 hover:opacity-100 hover:text-primary underline underline-offset-2 transition-all duration-200"
        >
          Acceder sin iniciar sesión
        </Link>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen flex flex-col items-center justify-center py-8 md:py-12 px-4 md:px-6">
      
      {/* The Book Container */}
      <div className="relative w-full max-w-4xl min-h-[600px] flex flex-col md:flex-row bg-surface-container-lowest shadow-[0_20px_40px_rgba(28,28,22,0.06)] rounded-lg [perspective:2500px]">
        
        {/* Left Static Page: Form (Register) */}
        <div className={`w-full md:w-1/2 h-full rounded-t-lg md:rounded-none md:rounded-l-lg overflow-hidden ${!isLogin ? 'block' : 'hidden md:block'}`}>
          {renderFormSide(false)}
        </div>

        {/* Right Static Page: Form (Login) */}
        <div className={`w-full md:w-1/2 h-full rounded-b-lg md:rounded-none md:rounded-r-lg overflow-hidden ${isLogin ? 'block' : 'hidden md:block'}`}>
          {renderFormSide(true)}
        </div>

        {/* The Turning Page (Spine in center, sitting on the Right) */}
        <div 
          className={`hidden md:block absolute top-0 right-0 w-1/2 h-full [transform-style:preserve-3d] [transform-origin:left_center] transition-transform duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] z-30 ${isLogin ? '[transform:rotateY(-180deg)]' : '[transform:rotateY(0deg)]'}`}
        >
          {/* FRONT of turning page (Visible when Register, on the Right) */}
          <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] rounded-r-lg overflow-hidden shadow-2xl">
            {renderVisualSide()}
          </div>

          {/* BACK of turning page (Visible when Login, on the Left) */}
          <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-l-lg overflow-hidden shadow-2xl">
            {renderVisualSide()}
          </div>
        </div>

        {/* Center Spine Line (Decorative) */}
        <div className="hidden md:block absolute inset-y-0 left-1/2 w-px bg-gradient-to-b from-transparent via-[#412817]/20 to-transparent z-40"></div>

      </div>

      {/* Decorative Element */}
      <div className="absolute bottom-12 flex flex-col items-center gap-4 opacity-30 pointer-events-none">
        <span className="material-symbols-outlined text-4xl text-primary">menu_book</span>
        <div className="w-px h-12 bg-primary"></div>
      </div>
    </main>
  )
}
