import { useState, useEffect } from 'react'
import axios from 'axios'

export function useSessionView(sessionId: string) {
  const [results, setResults] = useState<any[]>([])
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchResults = async () => {
    try {
      const res = await axios.get(`/api/admin/session/${sessionId}/results`)
      if (res.data.success) {
        setResults(res.data.results)
        setSession(res.data.session)
      } else {
        setError('Failed to fetch session results')
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (sessionId) {
      fetchResults()
    }
  }, [sessionId])

  return { results, session, loading, error, refetch: fetchResults }
}
