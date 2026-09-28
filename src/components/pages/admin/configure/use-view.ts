import { useState } from 'react'
import axios from 'axios'
import { useNavigate } from '@tanstack/react-router'

export function useView({ examId }: { examId: string }) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  // Configure States
  const [shuffleQuestions, setShuffleQuestions] = useState(true)
  const [shuffleChoices, setShuffleChoices] = useState(true)
  const [allowReview, setAllowReview] = useState(true)
  const [showResultImmediately, setShowResultImmediately] = useState(false)

  const handleOpenLobby = async () => {
    setLoading(true)
    try {
      // 1. Create Session
      const createRes = await axios.post('/api/admin/session', {
        examId,
        settings: {
          shuffleQuestions,
          shuffleChoices,
          allowReview,
          showResultImmediately
        }
      })

      if (createRes.data.success) {
        const session = createRes.data.session
        // 2. Open Lobby
        const lobbyRes = await axios.post(`/api/admin/session/${session._id}/lobby`)
        if (lobbyRes.data.success) {
          navigate({ to: '/admin/lobby' })
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to initialize session')
    } finally {
      setLoading(false)
    }
  }

  return {
    shuffleQuestions,
    setShuffleQuestions,
    shuffleChoices,
    setShuffleChoices,
    allowReview,
    setAllowReview,
    showResultImmediately,
    setShowResultImmediately,
    loading,
    handleOpenLobby
  }
}
