import { useEffect, useState } from 'react'
import axios from 'axios'
import { useAuth } from '@/contexts/auth.context'

export const ADMIN_NAME_KEY = 'gexam_admin_name'

export function useView() {
  // null = still asking the server whether an admin exists yet
  const [configured, setConfigured] = useState<boolean | null>(null)
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const { login } = useAuth()

  useEffect(() => {
    axios
      .get('/api/auth/status')
      .then((res) => setConfigured(!!res.data.configured))
      .catch(() => {
        setConfigured(true)
        setMessage('Cannot reach the server.')
        setStatus('error')
      })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    if (!configured && password !== confirmPassword) {
      setStatus('error')
      setMessage('Passwords do not match.')
      return
    }
    setStatus('loading')
    try {
      const res = await axios.post(configured ? '/api/auth/login' : '/api/auth/setup', { name, password })
      localStorage.setItem(ADMIN_NAME_KEY, res.data.name || name)
      login(res.data.token)
    } catch (err: any) {
      setStatus('error')
      setMessage(err.response?.data?.error || 'Request failed. Is the server running?')
    }
  }

  return { configured, name, setName, password, setPassword, confirmPassword, setConfirmPassword, status, message, handleSubmit }
}
