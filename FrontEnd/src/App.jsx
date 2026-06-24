import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, Suspense, lazy } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
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
const UserProfile = lazy(() => import('./pages/UserProfile'))
const Library = lazy(() => import('./pages/Library'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const AdminBooks = lazy(() => import('./pages/AdminBooks'))
const AdminUsers = lazy(() => import('./pages/AdminUsers'))
const NotFound = lazy(() => import('./pages/NotFound'))

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin w-10 h-10 border-4 border-[#d3c3bb]/30 border-t-primary rounded-full"></div>
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

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Auth Route (No Navbar/Footer) */}
            <Route path="/auth" element={<Auth />} />

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
            <Route
              path="/*"
              element={
                <div className="min-h-screen flex flex-col">
                  <Navbar />
                  <main className="flex-1">
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/catalog" element={<Catalog />} />
                      <Route path="/books/:id" element={<BookDetail />} />
                      <Route path="/user/:id" element={<UserProfile />} />
                      <Route path="/library" element={<Library />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </main>
                  <Footer />
                  <ChatWidget />
                </div>
              }
            />
          </Routes>
        </Suspense>
      </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
