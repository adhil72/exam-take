import { useState, useEffect, useRef, useMemo } from 'react'
import axios from 'axios'
import { useNavigate } from '@tanstack/react-router'
import { getSocket } from '@/lib/socket'
import { ClientAttempt, LogEntry } from '@/types'
import { generateUUID } from '@/lib/utils'

export function useView() {
  const navigate = useNavigate()
  const [activeSession, setActiveSession] = useState<any>(null)
  const [examTitle, setExamTitle] = useState('Active Exam')
  const [attempts, setAttempts] = useState<ClientAttempt[]>([])
  
  // Real-time tracking of answered questions per attempt to ensure exact counts
  const answersTrackerRef = useRef<Record<string, Set<string>>>({})

  // Local Search & Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'offline' | 'submitted' | 'in_progress'>('all')
  const [sortBy, setSortBy] = useState<'progress' | 'name' | 'machine'>('progress')

  // UI States
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [broadcastMsg, setBroadcastMsg] = useState('')
  const [activityLogs, setActivityLogs] = useState<LogEntry[]>([])
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [extendMinutes, setExtendMinutes] = useState('5')
  const [showEndModal, setShowEndModal] = useState(false)
  const [endConfirmationText, setEndConfirmationText] = useState('')

  const logsEndRef = useRef<HTMLDivElement>(null)

  // Stable refs for states to prevent socket listener recreation/infinite loop
  const soundEnabledRef = useRef(soundEnabled)
  useEffect(() => {
    soundEnabledRef.current = soundEnabled
  }, [soundEnabled])

  const attemptsRef = useRef(attempts)
  useEffect(() => {
    attemptsRef.current = attempts
  }, [attempts])

  // Synthesize Web Audio alerts for real-time cues
  const triggerAudioAlert = (type: 'warning' | 'success' | 'info') => {
    if (!soundEnabledRef.current) return
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)

      if (type === 'warning') {
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(820, ctx.currentTime)
        gain.gain.setValueAtTime(0.12, ctx.currentTime)
        osc.start(ctx.currentTime)
        osc.frequency.setValueAtTime(550, ctx.currentTime + 0.12)
        osc.stop(ctx.currentTime + 0.28)
      } else if (type === 'success') {
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(523.25, ctx.currentTime) // C5
        gain.gain.setValueAtTime(0.12, ctx.currentTime)
        osc.start(ctx.currentTime)
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08) // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16) // G5
        osc.stop(ctx.currentTime + 0.32)
      } else {
        osc.type = 'sine'
        osc.frequency.setValueAtTime(580, ctx.currentTime)
        gain.gain.setValueAtTime(0.08, ctx.currentTime)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.08)
      }
    } catch (e) {
      console.warn('AudioContext playback blocked/unsupported:', e)
    }
  }

  const addLog = (type: 'info' | 'warning' | 'success' | 'danger', message: string) => {
    const entry: LogEntry = {
      id: generateUUID(),
      timestamp: new Date(),
      type,
      message
    }
    setActivityLogs(prev => [...prev.slice(-99), entry]) // limit logs count to 100
  }

  // Initial Data fetch
  const fetchMonitorData = async () => {
    try {
      const activeRes = await axios.get('/api/admin/session/active')
      if (activeRes.data.success && activeRes.data.session) {
        const session = activeRes.data.session
        setActiveSession(session)
        
        // Fetch monitor items
        const monitorRes = await axios.get(`/api/admin/session/${session._id}/monitor`)
        if (monitorRes.data.success) {
          setExamTitle(monitorRes.data.examTitle)
          const items: ClientAttempt[] = monitorRes.data.attempts || []
          setAttempts(items)

          // Seed answers tracker
          const tracker: Record<string, Set<string>> = {}
          items.forEach(item => {
            tracker[item._id] = new Set<string>()
          })
          answersTrackerRef.current = tracker
        }
      } else {
        navigate({ to: '/admin/exams' })
      }
    } catch (err) {
      console.error('Failed to fetch monitor status:', err)
    }
  }

  // Ticking local countdown clock
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
    }
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [activeSession])

  useEffect(() => {
    fetchMonitorData()

    const socket = getSocket('admin')

    socket.on('connect', () => {
      console.log('Admin Monitor socket connected')
    })

    socket.on('admin:session-updated', (updatedSession: any) => {
      setActiveSession(updatedSession)
      addLog('info', `Session status updated: ${updatedSession.status.replace('_', ' ')}`)
    })

    socket.on('admin:client-updated', (client: any) => {
      setAttempts(prev => 
        prev.map(item => 
          item.clientId === client._id 
            ? { ...item, client } 
            : item
        )
      )
      if (client.status === 'locked') {
        const attempt = attemptsRef.current.find(a => a.clientId === client._id)
        const name = attempt?.student?.name || 'A student'
        addLog('danger', `🔒 Security Alert: PC ${client.machineName || 'Unknown'} (${name}) has been LOCKED due to lost focus!`)
        triggerAudioAlert('warning')
      }
    })

    socket.on('exam:timer', (data: { remainingMs: number }) => {
      setTimeLeft(data.remainingMs)
    })

    socket.on('admin:client-joined', (data: { client: any }) => {
      fetchMonitorData()
      addLog('info', `Client PC connected: ${data.client.machineName}`)
      triggerAudioAlert('info')
    })

    socket.on('admin:client-disconnected', (data: { clientId: string; machineName: string; lastSeen: string }) => {
      setAttempts(prev => 
        prev.map(item => 
          item.clientId === data.clientId 
            ? { ...item, client: item.client ? { ...item.client, status: 'disconnected', lastSeen: data.lastSeen } : null } 
            : item
        )
      )
      addLog('danger', `⚠️ Connection lost: PC ${data.machineName || 'Unknown'} disconnected`)
      triggerAudioAlert('warning')
    })

    socket.on('admin:client-reconnected', (data: { clientId: string }) => {
      setAttempts(prev => 
        prev.map(item => 
          item.clientId === data.clientId 
            ? { ...item, client: item.client ? { ...item.client, status: 'approved' } : null } 
            : item
        )
      )
      addLog('success', `Connection restored for client ID: ${data.clientId.slice(0, 8)}...`)
      triggerAudioAlert('info')
    })

    socket.on('admin:client-navigated', (data: { clientId: string; questionId: string }) => {
      setAttempts(prev => 
        prev.map(item => {
          if (item.clientId === data.clientId) {
            const qIdx = item.questions.indexOf(data.questionId)
            const label = qIdx >= 0 ? `Q${qIdx + 1}` : 'Unknown Question'
            addLog('info', `PC ${item.client?.machineName || 'Unknown'} (${item.student?.name}) navigated to ${label}`)
            return { ...item, currentQuestionId: data.questionId }
          }
          return item
        })
      )
    })

    socket.on('admin:answer-updated', (data: { attemptId: string; clientId: string; questionId: string; answered: boolean }) => {
      if (!answersTrackerRef.current[data.attemptId]) {
        answersTrackerRef.current[data.attemptId] = new Set<string>()
      }
      const beforeCount = answersTrackerRef.current[data.attemptId].size
      answersTrackerRef.current[data.attemptId].add(data.questionId)
      const afterCount = answersTrackerRef.current[data.attemptId].size

      setAttempts(prev => 
        prev.map(item => {
          if (item._id === data.attemptId) {
            // Increment progress count if it's a new unique answered question
            const increment = afterCount > beforeCount ? 1 : 0
            return { ...item, answeredCount: item.answeredCount + increment }
          }
          return item
        })
      )
    })

    socket.on('admin:client-tab-switched', (data: { clientId: string; isLeft: boolean; tabSwitchCount: number; timestamp: string }) => {
      setAttempts(prev => 
        prev.map(item => {
          if (item.clientId === data.clientId) {
            const studentName = item.student?.name || 'Unknown student'
            const machine = item.client?.machineName || 'Unknown PC'
            if (data.isLeft) {
              addLog('warning', `🚨 Infraction: ${studentName} (${machine}) left exam tab! (Infractions: ${data.tabSwitchCount})`)
              triggerAudioAlert('warning')
            } else {
              addLog('info', `Focus restored: ${studentName} (${machine}) returned to exam.`)
            }
            return { ...item, tabSwitchCount: data.tabSwitchCount, isLeft: data.isLeft }
          }
          return item
        })
      )
    })

    socket.on('admin:attempt-submitted', (data: { attemptId: string; clientId: string }) => {
      setAttempts(prev => 
        prev.map(item => 
          item._id === data.attemptId 
            ? { ...item, status: 'submitted' } 
            : item
        )
      )
      // Find candidate from attemptsRef
      const target = attemptsRef.current.find(a => a._id === data.attemptId)
      const label = target ? `${target.student?.name} (${target.client?.machineName})` : 'A student'
      addLog('success', `✅ Exam Submitted: ${label} successfully finished.`)
      triggerAudioAlert('success')
    })

    return () => {
      socket.off('admin:session-updated')
      socket.off('admin:client-updated')
      socket.off('exam:timer')
      socket.off('admin:client-joined')
      socket.off('admin:client-disconnected')
      socket.off('admin:client-reconnected')
      socket.off('admin:client-navigated')
      socket.off('admin:answer-updated')
      socket.off('admin:client-tab-switched')
      socket.off('admin:attempt-submitted')
    }
  }, [])

  // Scroll Activity feed to bottom on new entry
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activityLogs])

  // Global Lifecycle controllers
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

  const handleExtendTime = async () => {
    if (!activeSession || !extendMinutes.trim()) return
    try {
      const res = await axios.post(`/api/admin/session/${activeSession._id}/extend`, {
        minutes: parseInt(extendMinutes, 10)
      })
      if (res.data.success) {
        setActiveSession(res.data.session)
        addLog('info', `⏱️ Time extended by ${extendMinutes} minutes globally`)
        triggerAudioAlert('info')
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to extend time')
    }
  }

  const handleEndExam = async () => {
    if (endConfirmationText !== 'END') return
    setShowEndModal(false)
    setEndConfirmationText('')
    try {
      const res = await axios.post(`/api/admin/session/${activeSession._id}/end`)
      if (res.data.success) {
        navigate({ to: '/admin/exams' })
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to end exam')
    }
  }

  // Individual Actions
  const handleForceSubmit = async (clientId: string, studentName: string) => {
    if (!confirm(`Are you absolutely sure you want to force submit ${studentName}'s exam attempt?`)) return
    try {
      await axios.post(`/api/admin/client/${clientId}/force-submit`)
      addLog('warning', `Supervisor force-submitted exam for: ${studentName}`)
      triggerAudioAlert('info')
      fetchMonitorData()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to force submit')
    }
  }

  const handleKick = async (clientId: string, studentName: string) => {
    if (!confirm(`Kick machine connection and unassign ${studentName}? This ejects them back to the login screen.`)) return
    try {
      await axios.post(`/api/admin/client/${clientId}/kick`)
      addLog('danger', `Supervisor kicked client computer representing student: ${studentName}`)
      triggerAudioAlert('warning')
      fetchMonitorData()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to kick client')
    }
  }

  const handleUnlock = async (clientId: string, studentName: string) => {
    if (!confirm(`Are you sure you want to unlock ${studentName}'s screen and allow them to resume?`)) return
    try {
      await axios.post(`/api/admin/client/${clientId}/unlock`)
      addLog('success', `🔓 Supervisor unlocked exam screen for: ${studentName}`)
      triggerAudioAlert('success')
      fetchMonitorData()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to unlock client')
    }
  }

  // Send broadcast notification banner
  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!broadcastMsg.trim() || !activeSession) return
    try {
      const res = await axios.post(`/api/admin/session/${activeSession._id}/broadcast`, {
        message: broadcastMsg.trim()
      })
      if (res.data.success) {
        addLog('info', `📢 Broadcast announcement sent: "${broadcastMsg.trim()}"`)
        setBroadcastMsg('')
        triggerAudioAlert('info')
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to broadcast message')
    }
  }

  // Filter & Search computation
  const filteredAttempts = useMemo(() => {
    return attempts.filter(item => {
      // Search
      const searchStr = `${item.student?.name} ${item.client?.machineName} ${item.student?.batch} ${item.student?.email}`.toLowerCase()
      if (searchQuery.trim() && !searchStr.includes(searchQuery.toLowerCase())) {
        return false
      }

      // Status Filters
      const isOnline = item.client && item.client.status !== 'disconnected'
      if (statusFilter === 'offline') {
        return !isOnline
      }
      if (statusFilter === 'submitted') {
        return item.status === 'submitted' || item.status === 'force_submitted' || item.status === 'timed_out'
      }
      if (statusFilter === 'in_progress') {
        return isOnline && item.status === 'in_progress'
      }
      return true
    }).sort((a, b) => {
      if (sortBy === 'name') {
        return (a.student?.name || '').localeCompare(b.student?.name || '')
      }
      if (sortBy === 'machine') {
        return (a.client?.machineName || '').localeCompare(b.client?.machineName || '')
      }
      // Sort by progress desc
      const progA = a.questions.length > 0 ? (a.answeredCount / a.questions.length) : 0
      const progB = b.questions.length > 0 ? (b.answeredCount / b.questions.length) : 0
      return progB - progA
    })
  }, [attempts, searchQuery, statusFilter, sortBy])

  // Format Helper
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

  // Overall calculations
  const totalStudents = attempts.length
  const connectedCount = attempts.filter(a => a.client && a.client.status !== 'disconnected').length
  const submittedCount = attempts.filter(a => ['submitted', 'force_submitted', 'timed_out'].includes(a.status)).length
  
  const avgCompletion = totalStudents > 0 
    ? Math.round(attempts.reduce((sum, curr) => sum + (curr.questions.length > 0 ? (curr.answeredCount / curr.questions.length) * 100 : 0), 0) / totalStudents)
    : 0

  return {
    activeSession,
    examTitle,
    attempts,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    timeLeft,
    broadcastMsg,
    setBroadcastMsg,
    activityLogs,
    setActivityLogs,
    soundEnabled,
    setSoundEnabled,
    extendMinutes,
    setExtendMinutes,
    showEndModal,
    setShowEndModal,
    endConfirmationText,
    setEndConfirmationText,
    logsEndRef,
    handlePauseExam,
    handleResumeExam,
    handleExtendTime,
    handleEndExam,
    handleForceSubmit,
    handleKick,
    handleUnlock,
    handleBroadcast,
    filteredAttempts,
    formatTime,
    totalStudents,
    connectedCount,
    submittedCount,
    avgCompletion
  }
}
