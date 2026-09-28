import { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { getSocket } from '@/lib/socket'
import { toast } from 'sonner'
import { generateUUID } from '@/lib/utils'

export function useView() {
  const [machineName, setMachineName] = useState('')
  const [isRegistered, setIsRegistered] = useState(false)
  const [clientId, setClientId] = useState<string | null>(null)
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected' | 'disconnected' | 'assigned'>('pending')
  const [assignedStudent, setAssignedStudent] = useState<{ id: string; name: string; email: string; photoUrl: string } | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const navigate = useNavigate()

  const connectSocket = (cid: string, name: string) => {
    const socket = getSocket('client', cid)

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err)
      toast.error(`Connection failed: ${err.message || 'Check your network / server IP'}`)
      setStatus('disconnected')
    })

    socket.on('connect', () => {
      console.log('Socket connected')
      socket.emit('client:join', { clientId: cid, machineName: name, browserInfo: navigator.userAgent })
    })

    socket.on('client:registered', (data: { clientId: string; status: any }) => {
      console.log('Registered status:', data)
      setStatus(data.status)
    })

    socket.on('client:approved', () => {
      setStatus('approved')
    })

    socket.on('client:rejected', (data: { reason?: string }) => {
      setStatus('rejected')
      setErrorMsg(data.reason || 'Connection rejected by Admin')
    })

    socket.on('client:assigned', (data: { student: any }) => {
      if (data.student) {
        setAssignedStudent(data.student)
        setStatus('assigned')
      } else {
        setAssignedStudent(null)
        setStatus('approved')
      }
    })

    // Listen for exam:start to move student into exam mode
    socket.on('exam:start', (data: { attemptId: string; questions: any[]; duration: number; startTime: string; endTime: string; settings: any }) => {
      console.log('Exam started event received:', data)
      sessionStorage.setItem('gexam_active_attempt', JSON.stringify(data))
      navigate({ to: '/exam' })
    })

    socket.on('disconnect', () => {
      setStatus('disconnected')
    })
  }

  useEffect(() => {
    const storedId = localStorage.getItem('gexam_client_id')
    const storedName = localStorage.getItem('gexam_machine_name')
    if (storedId && storedName) {
      setClientId(storedId)
      setMachineName(storedName)
      setIsRegistered(true)
      connectSocket(storedId, storedName)
    }
  }, [])

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    if (!machineName.trim()) return

    const cid = generateUUID()
    localStorage.setItem('gexam_client_id', cid)
    localStorage.setItem('gexam_machine_name', machineName)
    setClientId(cid)
    setIsRegistered(true)
    connectSocket(cid, machineName)
  }

  const handleResetRegistration = () => {
    localStorage.removeItem('gexam_client_id')
    localStorage.removeItem('gexam_machine_name')
    setIsRegistered(false)
  }

  return {
    machineName,
    setMachineName,
    isRegistered,
    clientId,
    status,
    assignedStudent,
    errorMsg,
    handleRegister,
    handleResetRegistration
  }
}
