import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '@/contexts/auth.context'
import { useTheme } from '@/contexts/theme.context'
import { toast } from 'sonner'

export function useView() {
  const { logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  const [examsCount, setExamsCount] = useState(0)
  const [studentsCount, setStudentsCount] = useState(0)
  const [clients, setClients] = useState<any[]>([])
  const [activeSession, setActiveSession] = useState<any>(null)
  const [serverAddress, setServerAddress] = useState(window.location.origin)
  const [loading, setLoading] = useState(true)

  const user = { email: localStorage.getItem('gexam_admin_name') || 'ADMIN' }

  const fetchData = async () => {
    try {
      setLoading(true)
      const [examsRes, studentsRes, clientsRes, activeSessionRes] = await Promise.all([
        axios.get('/api/admin/exams').catch(() => ({ data: { success: false, exams: [] } })),
        axios.get('/api/admin/students?limit=100000').catch(() => ({ data: { success: false, students: [] } })),
        axios.get('/api/admin/clients').catch(() => ({ data: { success: false, clients: [] } })),
        axios.get('/api/admin/session/active').catch(() => ({ data: { success: false, session: null } }))
      ])

      setExamsCount(examsRes.data.exams?.length || 0)
      setStudentsCount(studentsRes.data.students?.length || 0)
      setClients(clientsRes.data.clients || [])
      setActiveSession(activeSessionRes.data.session || null)
    } catch (err) {
      console.error('Failed to load dashboard telemetry:', err)
      toast.error('Failed to update dashboard telemetry')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Students need the LAN address, not "localhost"
    axios
      .get('/api/status')
      .then((res) => {
        const ip = res.data.lanAddresses?.[0]
        if (ip) setServerAddress(`http://${ip}:${res.data.port || window.location.port || 3000}`)
      })
      .catch(() => {})
    fetchData()
  }, [])

  return {
    logout,
    user,
    theme,
    toggleTheme,
    isDark,
    examsCount,
    studentsCount,
    clients,
    activeSession,
    serverAddress,
    loading,
    refetch: fetchData
  }
}
