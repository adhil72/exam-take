import { useState, useEffect } from 'react'
import axios from 'axios'

export function useHistory() {
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchSessions = async () => {
    try {
      const res = await axios.get('/api/admin/sessions')
      if (res.data.success) {
        setSessions(res.data.sessions)
      } else {
        setError('Failed to fetch sessions')
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSessions()
  }, [])

  const deleteSession = async (sessionId: string) => {
    try {
      const res = await axios.delete(`/api/admin/session/${sessionId}`)
      if (res.data.success) {
        setSessions(prev => prev.filter(s => s._id !== sessionId))
        return true
      }
      return false
    } catch (err: any) {
      throw new Error(err.response?.data?.error || err.message || 'Failed to delete session')
    }
  }

  const clearAllHistory = async () => {
    try {
      const res = await axios.delete(`/api/admin/sessions`)
      if (res.data.success) {
        setSessions([])
        return true
      }
      return false
    } catch (err: any) {
      throw new Error(err.response?.data?.error || err.message || 'Failed to clear all history')
    }
  }

  return { sessions, loading, error, deleteSession, clearAllHistory, refetch: fetchSessions }
}
