import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AIChatProvider, useAIChatContext } from './context/AIChatContext'
import { ThemeProvider } from './context/ThemeContext'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import AdminLayout from './components/admin/AdminLayout'
import ChatWidget from './components/Chat/ChatWidget'
import ErrorBoundary from './components/layout/ErrorBoundary'
import ScrollToTop from './components/layout/ScrollToTop'

// Lazy loaded pages
const Home = lazy(() => import('./pages/Home'))
const Catalog = lazy(() => import('./pages/Catalog'))
const BookDetail = lazy(() => import('./pages/BookDetail'))
const Auth = lazy(() => import('./pages/Auth'))
const RecoverPassword = lazy(() => import('./pages/RecoverPassword'))
const UserProfile = lazy(() => import('./pages/UserProfile'))
const Library = lazy(() => import('./pages/Library'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const AdminBooks = lazy(() => import('./pages/AdminBooks'))
const AdminUsers = lazy(() => import('./pages/AdminUsers'))
const NotFound = lazy(() => import('./pages/NotFound'))

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div
      style={{ borderRadius: '9999px' }}
      className="animate-spin w-10 h-10 border-4 border-outline-variant/40 border-t-primary"
    />
  </div>
)

function ProtectedRoute({ children, requireAdmin = false }) {
  const { isAuthenticated, loading, user } = useAuth()

  if (loading) {
    return <LoadingFallback />
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />
  }

  if (requireAdmin && user?.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return children
}

function PublicLayout() {
  const { isSideOpen } = useAIChatContext()

  return (
    <div className="relative min-h-screen w-full">
      <div className={`ai-split-shell min-h-screen flex flex-col ${isSideOpen ? 'is-side-open' : ''}`}>
        <Navbar />
        <main className="flex-1 min-w-0">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/books/:id" element={<BookDetail />} />
            <Route path="/user/:id" element={<UserProfile />} />
            <Route
              path="/library"
              element={
                <ProtectedRoute>
                  <Library />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
      <ChatWidget />
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <AuthProvider>
          <AIChatProvider>
            <BrowserRouter>
              <ScrollToTop />
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  {/* Auth Routes (No Navbar/Footer) */}
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/recuperar-contraseña" element={<RecoverPassword />} />
                  <Route path="/recuperar-contrasena" element={<RecoverPassword />} />

                  {/* Admin Routes */}
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute requireAdmin>
                        <AdminLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<AdminDashboard />} />
                    <Route path="books" element={<AdminBooks />} />
                    <Route path="users" element={<AdminUsers />} />
                  </Route>

                  {/* Public Routes */}
                  <Route path="/*" element={<PublicLayout />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </AIChatProvider>
        </AuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  )
}

export default App
