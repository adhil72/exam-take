import { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from '@tanstack/react-router'
import { getSocket } from '@/lib/socket'
import { ClientMachine } from '@/types'

export function useView() {
  const navigate = useNavigate()
  const [clients, setClients] = useState<ClientMachine[]>([])
  const [selectedClient, setSelectedClient] = useState<ClientMachine | null>(null)
  const [isAssigning, setIsAssigning] = useState(false)
  const [serverIp, setServerIp] = useState('localhost')

  // Active Session Control States
  const [activeSession, setActiveSession] = useState<any>(null)
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [extendMinutes, setExtendMinutes] = useState('5')
  const [loading, setLoading] = useState(false)

  // Selectors
  const pendingCount = clients.filter((c) => c.status === 'pending').length
  const assignedCount = clients.filter((c) => c.studentId).length
  const disconnectedCount = clients.filter((c) => c.status === 'disconnected').length

  // Fetch initial clients and session status
  const fetchData = async () => {
    try {
      const sessionRes = await axios.get('/api/admin/session/active')
      if (sessionRes.data.success && sessionRes.data.session) {
        setActiveSession(sessionRes.data.session)
      } else {
        // If there's no active session, redirect back to exams screen
        navigate({ to: '/admin/exams' })
        return
      }

      const clientsRes = await axios.get('/api/admin/clients')
      if (clientsRes.data.success) {
        setClients(clientsRes.data.clients)
      }
    } catch (err) {
      console.error('Error fetching lobby data:', err)
    }
  }

  // Ticking authoritative local countdown
  useEffect(() => {
    let timer: any = null
    if (activeSession && activeSession.status === 'in_progress') {
      const calculateTime = () => {
        const rem = new Date(activeSession.endsAt).getTime() - Date.now()
        setTimeLeft(rem > 0 ? rem : 0)
      }
      calculateTime()
      timer = setInterval(calculateTime, 1000)
    } else if (activeSession && activeSession.status === 'paused') {
      setTimeLeft(activeSession.remainingMs || 0)
    } else if (activeSession && activeSession.status === 'lobby' && activeSession.scheduledAt) {
      // Countdown to auto start
      const calculateTimeToStart = () => {
        const rem = new Date(activeSession.scheduledAt).getTime() - Date.now()
        if (rem <= 0) {
          setTimeLeft(0)
          // If we are still in lobby and the time has come, auto start if there are clients assigned
          if (!loading && assignedCount > 0) {
            handleStartExam()
          }
        } else {
          setTimeLeft(rem)
        }
      }
      calculateTimeToStart()
      timer = setInterval(calculateTimeToStart, 1000)
    }

    return () => {
      if (timer) clearInterval(timer)
    }
  }, [activeSession, loading, clients])

  useEffect(() => {
    setServerIp(window.location.hostname)
    fetchData()

    // Setup Socket.io connection for Admin
    const socket = getSocket('admin')

    socket.on('connect', () => {
      console.log('Admin socket connected')
    })

    socket.on('admin:client-joined', (data: { client: ClientMachine }) => {
      setClients((prev) => {
        const filtered = prev.filter((c) => c._id !== data.client._id)
        return [...filtered, data.client]
      })
    })

    socket.on('admin:client-disconnected', (data: { clientId: string; lastSeen: string }) => {
      setClients((prev) =>
        prev.map((c) =>
          c._id === data.clientId
            ? { ...c, status: 'disconnected', lastSeen: data.lastSeen }
            : c
        )
      )
    })

    socket.on('admin:client-reconnected', (data: { clientId: string }) => {
      setClients((prev) =>
        prev.map((c) =>
          c._id === data.clientId
            ? { ...c, status: 'approved' }
            : c
        )
      )
    })

    socket.on('admin:client-updated', (updatedClient: ClientMachine) => {
      setClients((prev) =>
        prev.map((c) => (c._id === updatedClient._id ? updatedClient : c))
      )
    })

    socket.on('admin:clients-bulk-approved', () => {
      fetchData()
    })

    // Listen for real-time exam session updates
    socket.on('admin:session-updated', (updatedSession: any) => {
      setActiveSession(updatedSession)
    })

    // Listen for timer broadcasts
    socket.on('exam:timer', (data: { remainingMs: number }) => {
      setTimeLeft(data.remainingMs)
    })

    return () => {
      socket.off('admin:client-joined')
      socket.off('admin:client-disconnected')
      socket.off('admin:client-reconnected')
      socket.off('admin:client-updated')
      socket.off('admin:clients-bulk-approved')
      socket.off('admin:session-updated')
      socket.off('exam:timer')
    }
  }, [])

  // Client approvals & blocking
  const handleApprove = async (id: string) => {
    try {
      await axios.post(`/api/admin/client/${id}/approve`)
      fetchData()
    } catch (err) {
      console.error('Error approving client:', err)
    }
  }

  const handleReject = async (id: string) => {
    try {
      await axios.post(`/api/admin/client/${id}/reject`)
      fetchData()
    } catch (err) {
      console.error('Error rejecting client:', err)
    }
  }

  const handleApproveAll = async () => {
    try {
      await axios.post('/api/admin/clients/approve-all')
      fetchData()
    } catch (err) {
      console.error('Error approving all clients:', err)
    }
  }

  const handleAssignStudent = async (studentId: string) => {
    if (!selectedClient) return
    try {
      await axios.post(`/api/admin/client/${selectedClient._id}/assign`, { studentId })
      setIsAssigning(false)
      setSelectedClient(null)
      fetchData()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to assign student')
      throw err
    }
  }

  const handleUnassignStudent = async (id: string) => {
    try {
      await axios.post(`/api/admin/client/${id}/unassign`)
      fetchData()
    } catch (err) {
      console.error('Error unassigning student:', err)
    }
  }

  const handleUnassignAll = async () => {
    if (!confirm('Are you sure you want to clear student assignments from all machines?')) return
    try {
      await axios.post('/api/admin/clients/unassign-all')
      fetchData()
    } catch (err) {
      console.error('Error unassigning all students:', err)
    }
  }

  // Active Session Lifecycle controls
  const handleStartExam = async () => {
    if (!activeSession) return
    setLoading(true)
    try {
      const res = await axios.post(`/api/admin/session/${activeSession._id}/start`)
      if (res.data.success) {
        setActiveSession(res.data.session)
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to start exam. Make sure you have approved clients with assigned students.')
    } finally {
      setLoading(false)
    }
  }

  const handlePauseExam = async () => {
    if (!activeSession) return
    try {
      const res = await axios.post(`/api/admin/session/${activeSession._id}/pause`)
      if (res.data.success) {
        setActiveSession(res.data.session)
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to pause exam')
    }
  }

  const handleResumeExam = async () => {
    if (!activeSession) return
    try {
      const res = await axios.post(`/api/admin/session/${activeSession._id}/resume`)
      if (res.data.success) {
        setActiveSession(res.data.session)
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to resume exam')
    }
  }

  const handleEndExam = async () => {
    if (!activeSession) return
    if (!confirm('Are you sure you want to force-end the exam session? This will force submit all active student attempts.')) return
    try {
      const res = await axios.post(`/api/admin/session/${activeSession._id}/end`)
      if (res.data.success) {
        navigate({ to: '/admin/exams' })
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to end exam')
    }
  }

  const handleExtendTime = async () => {
    if (!activeSession || !extendMinutes.trim()) return
    try {
      const res = await axios.post(`/api/admin/session/${activeSession._id}/extend`, {
        minutes: parseInt(extendMinutes, 10)
      })
      if (res.data.success) {
        setActiveSession(res.data.session)
        alert(`Time extended by ${extendMinutes} minutes!`)
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to extend time')
    }
  }

  const handleForceSubmit = async (clientId: string) => {
    if (!confirm('Force submit this student attempt? They will not be able to answer any more questions.')) return
    try {
      await axios.post(`/api/admin/client/${clientId}/force-submit`)
      fetchData()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to force submit')
    }
  }

  const formatTime = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000)
    const hrs = Math.floor(totalSecs / 3600)
    const mins = Math.floor((totalSecs % 3600) / 60)
    const secs = totalSecs % 60
    
    const pad = (n: number) => String(n).padStart(2, '0')
    
    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`
    }
    return `${pad(mins)}:${pad(secs)}`
  }

  return {
    clients,
    selectedClient,
    setSelectedClient,
    isAssigning,
    setIsAssigning,
    serverIp,
    activeSession,
    timeLeft,
    extendMinutes,
    setExtendMinutes,
    loading,
    pendingCount,
    assignedCount,
    disconnectedCount,
    fetchData,
    handleApprove,
    handleReject,
    handleApproveAll,
    handleAssignStudent,
    handleUnassignStudent,
    handleUnassignAll,
    handleStartExam,
    handlePauseExam,
    handleResumeExam,
    handleEndExam,
    handleExtendTime,
    handleForceSubmit,
    formatTime
  }
}
