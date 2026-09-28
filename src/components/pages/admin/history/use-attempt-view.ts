import { useState, useEffect } from 'react'
import axios from 'axios'

export function useAttemptView(attemptId: string) {
  const [results, setResults] = useState<any>(null)
  const [attempt, setAttempt] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await axios.get(`/api/admin/attempt/${attemptId}/results`)
        if (res.data.success) {
          setResults({ summary: res.data.summary, questions: res.data.questions })
          setAttempt(res.data.attempt)
        } else {
          setError('Failed to fetch attempt results')
        }
      } catch (err: any) {
        setError(err.response?.data?.error || err.message)
      } finally {
        setLoading(false)
      }
    }
    if (attemptId) {
      fetchResults()
    }
  }, [attemptId])

  return { results, attempt, loading, error }
}
