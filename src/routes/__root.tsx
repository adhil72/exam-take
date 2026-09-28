import { useState, useEffect } from 'react'
import { createRootRoute, Outlet, useLocation } from '@tanstack/react-router'
import { Toaster } from 'sonner'
import { Button } from '@/components/ui/button'
import { AuthProvider } from '@/providers/auth-provider'
import { ConfirmProvider } from '@/providers/confirm-provider'
import { applyTheme, useStudentTheme } from '@/lib/student-theme'

export const Route = createRootRoute({
  component: RootComponent,
})

function StudentFullscreenWrapper({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement)

  const isStudentRoute = !location.pathname.startsWith('/admin')

  // Student screens follow their own theme (light by default); admin pages keep the admin's setting
  const { theme: studentTheme } = useStudentTheme()
  useEffect(() => {
    if (!isStudentRoute) return
    applyTheme(studentTheme)
    return () => applyTheme(localStorage.getItem('theme') === 'dark' ? 'dark' : 'light')
  }, [isStudentRoute, studentTheme])

  useEffect(() => {
    if (!isStudentRoute) return

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [isStudentRoute])

  const enterFullscreen = () => {
    const el = document.documentElement
    if (el.requestFullscreen) {
      el.requestFullscreen()
    }
  }

  if (isStudentRoute && !isFullscreen) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center space-y-4 z-50">
        <h2 className="text-2xl font-bold">Fullscreen Required</h2>
        <p className="text-muted-foreground">This exam must be taken in fullscreen mode.</p>
        <Button onClick={enterFullscreen}>Enter Fullscreen</Button>
      </div>
    )
  }

  return <>{children}</>
}

function RootComponent() {
  return (
    <div className="min-h-screen bg-background font-sans antialiased text-foreground">
      <AuthProvider>
        <ConfirmProvider>
          <StudentFullscreenWrapper>
            <Outlet />
          </StudentFullscreenWrapper>
        </ConfirmProvider>
      </AuthProvider>
      <Toaster position="top-center" richColors />
    </div>
  )
}

