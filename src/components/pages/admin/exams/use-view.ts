import { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import confirm from '@/lib/confirm'

export function useView() {
  const [exams, setExams] = useState<any[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [activeSession, setActiveSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Prepare modal state
  const [selectedExam, setSelectedExam] = useState<any>(null)
  const [previewQuestions, setPreviewQuestions] = useState<any[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [startingSession, setStartingSession] = useState(false)

  // Used Questions State
  const [viewingUsedQuestionsExam, setViewingUsedQuestionsExam] = useState<any>(null)
  const [usedQuestions, setUsedQuestions] = useState<any[]>([])
  const [loadingUsedQuestions, setLoadingUsedQuestions] = useState(false)
  const [avoidUsedQuestions, setAvoidUsedQuestions] = useState(false)

  // Builder dialog state
  const [builderOpen, setBuilderOpen] = useState(false)
  const [editingExam, setEditingExam] = useState<any>(null)

  const navigate = useNavigate()

  const fetchExams = async () => {
    try {
      setLoading(true)
      const [examsRes, sessionsRes, activeSessionRes] = await Promise.all([
        axios.get(`/api/admin/exams`),
        axios.get(`/api/admin/sessions`).catch(() => ({ data: { success: false, sessions: [] } })),
        axios.get(`/api/admin/session/active`).catch(() => ({ data: { success: false, session: null } }))
      ])
      setExams(examsRes.data.exams || [])
      setSessions(sessionsRes.data.sessions || [])
      setActiveSession(activeSessionRes.data.session || null)
    } catch (err) {
      toast.error('Failed to load exams')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchExams()
  }, [])

  const openBuilder = (exam: any | null = null) => {
    setEditingExam(exam)
    setBuilderOpen(true)
  }

  const handleDeleteExam = async (exam: any) => {
    const ok = await confirm(`Delete "${exam.title}"? Past results are kept in History.`, { type: 'error', confirmText: 'Delete' })
    if (!ok) return
    try {
      await axios.delete(`/api/admin/exams/${exam._id}`)
      toast.success('Exam deleted')
      fetchExams()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete exam')
    }
  }

  const handleDuplicateExam = async (exam: any) => {
    try {
      await axios.post(`/api/admin/exams/${exam._id}/duplicate`)
      toast.success('Exam duplicated')
      fetchExams()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to duplicate exam')
    }
  }

  const handleSelectExam = async (exam: any) => {
    setSelectedExam(exam)
    setShowPreview(false)
    setAvoidUsedQuestions(false)

    try {
      await axios.post('/api/admin/clients/unassign-all')
    } catch (err) {
      console.error('Failed to clear assignments:', err)
      toast.error('Failed to reset student devices')
    }
  }

  const handleFetchPreview = async () => {
    if (!selectedExam) return
    try {
      const res = await axios.get(`/api/admin/questions/${selectedExam._id}`)
      setPreviewQuestions(res.data.questions || [])
      setShowPreview(true)
    } catch (err) {
      toast.error('Failed to load preview questions')
    }
  }

  const handleViewUsedQuestions = async (exam: any) => {
    setViewingUsedQuestionsExam(exam)
    setLoadingUsedQuestions(true)
    try {
      const res = await axios.get(`/api/admin/questions/${exam._id}/previously-used`)
      setUsedQuestions(res.data.questions || [])
    } catch (err) {
      toast.error('Failed to load previously used questions')
    } finally {
      setLoadingUsedQuestions(false)
    }
  }

  const handleStartLobby = async () => {
    if (!selectedExam) return
    setStartingSession(true)
    try {
      const res = await axios.post(`/api/admin/session`, {
        examId: selectedExam._id,
        settings: {
          shuffleQuestions: true,
          shuffleChoices: true,
          showResultImmediately: false,
          allowReview: true,
          avoidUsedQuestions: avoidUsedQuestions
        }
      })

      const sessionId = res.data.session._id
      await axios.post(`/api/admin/session/${sessionId}/lobby`)

      toast.success('Exam session created and lobby opened!')
      navigate({ to: '/admin/lobby' })
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to start exam session')
      setStartingSession(false)
    }
  }

  return {
    exams,
    sessions,
    activeSession,
    loading,
    selectedExam,
    setSelectedExam,
    previewQuestions,
    showPreview,
    setShowPreview,
    startingSession,
    viewingUsedQuestionsExam,
    setViewingUsedQuestionsExam,
    usedQuestions,
    loadingUsedQuestions,
    avoidUsedQuestions,
    setAvoidUsedQuestions,
    builderOpen,
    setBuilderOpen,
    editingExam,
    openBuilder,
    fetchExams,
    handleSelectExam,
    handleFetchPreview,
    handleViewUsedQuestions,
    handleStartLobby,
    handleDeleteExam,
    handleDuplicateExam
  }
}
