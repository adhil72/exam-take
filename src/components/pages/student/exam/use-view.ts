import { useState, useEffect, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { getSocket } from '@/lib/socket'
import { Question } from '@/types'

export function useView() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  // Attempt State
  const [attemptId, setAttemptId] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [allowReview, setAllowReview] = useState(true)

  // Answers, Flags, and Visited Sets
  const [answersMap, setAnswersMap] = useState<Record<string, any>>({})
  const [flaggedIds, setFlaggedIds] = useState<string[]>([])
  const [visitedIndexes, setVisitedIndexes] = useState<number[]>([0])

  // Timer & Overlays
  const [timeLeft, setTimeLeft] = useState(0)
  const [endTime, setEndTime] = useState<string | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [showWarningModal, setShowWarningModal] = useState(false)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [broadcastMessage, setBroadcastMessage] = useState<string | null>(null)
  
  // Custom GATE Pattern States
  const [showCalculator, setShowCalculator] = useState(false)

  // Fullscreen & Lock states
  const [isLocked, setIsLocked] = useState(false)
  const [showFullscreenOverlay, setShowFullscreenOverlay] = useState(!document.fullscreenElement)
  const [lockReason, setLockReason] = useState('')

  const socketRef = useRef<any>(null)
  const clientIdRef = useRef<string | null>(null)

  // Question Timer tracking
  const lastQuestionChangeRef = useRef<number>(Date.now())
  const questionTimesRef = useRef<Record<string, number>>({})
  const isFinishedRef = useRef(false)

  // Stable refs to prevent stale closures in socket events registered on mount
  const attemptIdRef = useRef(attemptId)
  useEffect(() => {
    attemptIdRef.current = attemptId
  }, [attemptId])

  const questionsRef = useRef(questions)
  useEffect(() => {
    questionsRef.current = questions
  }, [questions])

  const currentIndexRef = useRef(currentIndex)
  useEffect(() => {
    currentIndexRef.current = currentIndex
  }, [currentIndex])

  const isLockedRef = useRef(false)
  useEffect(() => {
    isLockedRef.current = isLocked
  }, [isLocked])

  const showFullscreenOverlayRef = useRef(true)
  useEffect(() => {
    showFullscreenOverlayRef.current = showFullscreenOverlay
  }, [showFullscreenOverlay])

  const isPausedRef = useRef(false)
  useEffect(() => {
    isPausedRef.current = isPaused
  }, [isPaused])

  useEffect(() => {
    const rawData = sessionStorage.getItem('gexam_active_attempt')
    const clientId = localStorage.getItem('gexam_client_id')
    clientIdRef.current = clientId

    if (!rawData || !clientId) {
      navigate({ to: '/' })
      return
    }

    const data = JSON.parse(rawData)
    setAttemptId(data.attemptId)
    attemptIdRef.current = data.attemptId
    setQuestions(data.questions || [])
    questionsRef.current = data.questions || []
    setEndTime(data.endTime)
    setAllowReview(data.settings?.allowReview ?? true)

    if (data.sessionStatus === 'paused') {
      setIsPaused(true)
    }

    if (data.isLocked) {
      setIsLocked(true)
      isLockedRef.current = true
      setLockReason('Locked session detected. Wait for supervisor approval.')
      setShowFullscreenOverlay(false)
    }

    // Restore answers if any (reconnection case)
    if (data.answers) {
      const restored: Record<string, any> = {}
      Object.keys(data.answers).forEach((qid) => {
        restored[qid] = data.answers[qid].answer
        questionTimesRef.current[qid] = data.answers[qid].timeSpentMs || 0
      })
      setAnswersMap(restored)
    }

    // Connect socket
    const socket = getSocket('client', clientId)
    socketRef.current = socket

    const safeExitFullscreen = () => {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => console.log(err))
      }
    }

    socket.on('connect', () => {
      console.log('Exam socket connected')
    })

    socket.on('exam:timer', (timerData: { remainingMs: number }) => {
      setTimeLeft(timerData.remainingMs)
    })

    socket.on('exam:paused', () => {
      setIsPaused(true)
    })

    socket.on('exam:resumed', (resumeData: { endTime: string }) => {
      setIsPaused(false)
      setEndTime(resumeData.endTime)
    })

    socket.on('exam:time-extended', (extendData: { newEndTime: string }) => {
      setEndTime(extendData.newEndTime)
    })

    socket.on('exam:force-submit', () => {
      isFinishedRef.current = true
      sessionStorage.removeItem('gexam_active_attempt')
      navigate({ to: '/submitted' })
    })

    socket.on('exam:ended', () => {
      isFinishedRef.current = true
      sessionStorage.removeItem('gexam_active_attempt')
      navigate({ to: '/submitted' })
    })

    socket.on('exam:submitted', () => {
      isFinishedRef.current = true
      sessionStorage.removeItem('gexam_active_attempt')
      navigate({ to: '/submitted' })
    })

    socket.on('exam:message', (msgData: { message: string }) => {
      setBroadcastMessage(msgData.message)
    })

    socket.on('client:rejected', () => {
      safeExitFullscreen()
      sessionStorage.removeItem('gexam_active_attempt')
      navigate({ to: '/' })
    })

    socket.on('exam:start', (startData: any) => {
      if (startData.isLocked) {
        setIsLocked(true)
        isLockedRef.current = true
        setLockReason('Locked by exam supervisor.')
        setShowFullscreenOverlay(false)
      }
    })

    socket.on('exam:unlock', () => {
      setIsLocked(false)
      isLockedRef.current = false
      setLockReason('')
      setShowFullscreenOverlay(true)
    })

    setLoading(false)

    // Trigger Lock helper
    const triggerLock = (reason: string) => {
      if (isFinishedRef.current || isPausedRef.current || isLockedRef.current || showFullscreenOverlayRef.current) return
      setIsLocked(true)
      isLockedRef.current = true
      setLockReason(reason)
      
      socket.emit('client:cheat-detected', { clientId, reason })
    }

    // Exited Fullscreen Listener
    const handleFullscreenChange = () => {
      if (isFinishedRef.current) return
      if (!document.fullscreenElement && !showFullscreenOverlayRef.current && !isLockedRef.current && !isPausedRef.current) {
        triggerLock('Exited fullscreen mode')
      }
    }

    // Visibility Listener (Anti-Cheat Tab switching)
    const handleVisibilityChange = () => {
      if (isFinishedRef.current) return
      if (document.visibilityState === 'hidden') {
        triggerLock('Switched tab or minimized window')
        socket.emit('client:tab-switch', { clientId, isLeft: true })
      } else {
        socket.emit('client:tab-switch', { clientId, isLeft: false })
      }
    }

    // Blur Listener (Focus Loss / Another screen window focus)
    const handleWindowBlur = () => {
      if (isFinishedRef.current) return
      triggerLock('Lost window focus (clicked outside or opened another app)')
    }

    // BeforeUnload warning (Accidental tab closures)
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = 'Are you sure you want to close this exam? Your active progress will be locked.'
      return e.returnValue
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    window.addEventListener('blur', handleWindowBlur)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      window.removeEventListener('blur', handleWindowBlur)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      socket.off('exam:timer')
      socket.off('exam:paused')
      socket.off('exam:resumed')
      socket.off('exam:time-extended')
      socket.off('exam:force-submit')
      socket.off('exam:ended')
      socket.off('exam:submitted')
      socket.off('exam:message')
      socket.off('client:rejected')
      socket.off('exam:start')
      socket.off('exam:unlock')
    }
  }, [])

  // Timer Tick Check
  useEffect(() => {
    let interval: any = null
    if (endTime && !isPaused) {
      const runTimer = () => {
        const diff = new Date(endTime).getTime() - Date.now()
        setTimeLeft(diff > 0 ? diff : 0)
        if (diff <= 0) {
          clearInterval(interval)
          handleFinalSubmit(true)
        }
      }
      runTimer()
      interval = setInterval(runTimer, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [endTime, isPaused])

  // Track time spent per question
  useEffect(() => {
    lastQuestionChangeRef.current = Date.now()
  }, [currentIndex])

  const saveCurrentQuestionTime = () => {
    if (questionsRef.current.length === 0) return
    const currentQ = questionsRef.current[currentIndexRef.current]
    const elapsed = Date.now() - lastQuestionChangeRef.current
    
    if (!questionTimesRef.current[currentQ.id]) {
      questionTimesRef.current[currentQ.id] = 0
    }
    questionTimesRef.current[currentQ.id] += elapsed
    lastQuestionChangeRef.current = Date.now()
  }

  const handleAnswerSubmit = (ansValue: any) => {
    saveCurrentQuestionTime()
    const currentQ = questions[currentIndex]
    
    // Save locally
    setAnswersMap((prev) => ({
      ...prev,
      [currentQ.id]: ansValue
    }))

    // Save to server
    if (socketRef.current) {
      socketRef.current.emit('client:answer', {
        attemptId,
        questionId: currentQ.id,
        answer: ansValue,
        timeSpentMs: questionTimesRef.current[currentQ.id] || 0
      })
    }
  }

  const handleClearResponse = () => {
    saveCurrentQuestionTime()
    if (questions.length === 0) return
    const currentQ = questions[currentIndex]

    setAnswersMap((prev) => {
      const next = { ...prev }
      delete next[currentQ.id]
      return next
    })

    if (socketRef.current) {
      socketRef.current.emit('client:answer', {
        attemptId,
        questionId: currentQ.id,
        answer: null,
        timeSpentMs: questionTimesRef.current[currentQ.id] || 0
      })
    }
  }

  const handleToggleFlag = () => {
    if (questions.length === 0) return
    const currentQ = questions[currentIndex]
    let updatedFlags
    if (flaggedIds.includes(currentQ.id)) {
      updatedFlags = flaggedIds.filter((id) => id !== currentQ.id)
    } else {
      updatedFlags = [...flaggedIds, currentQ.id]
    }
    setFlaggedIds(updatedFlags)

    if (socketRef.current) {
      socketRef.current.emit('client:flag', {
        clientId: clientIdRef.current,
        questionId: currentQ.id,
        isFlagged: updatedFlags.includes(currentQ.id)
      })
    }
  }

  const handleNavigate = (index: number) => {
    if (!allowReview && index !== currentIndex + 1) return // restrict if review not allowed
    if (index < 0 || index >= questions.length) return
    
    saveCurrentQuestionTime()
    setCurrentIndex(index)
    
    if (!visitedIndexes.includes(index)) {
      setVisitedIndexes((prev) => [...prev, index])
    }

    if (socketRef.current) {
      socketRef.current.emit('client:navigate', {
        clientId: clientIdRef.current,
        questionId: questions[index].id
      })
    }
  }

  const handleSaveAndNext = () => {
    if (currentIndex < questions.length - 1) {
      handleNavigate(currentIndex + 1)
    }
  }

  const handleMarkReviewAndNext = () => {
    const currentQ = questions[currentIndex]
    if (!flaggedIds.includes(currentQ.id)) {
      handleToggleFlag()
    }
    if (currentIndex < questions.length - 1) {
      handleNavigate(currentIndex + 1)
    }
  }

  const handleFinalSubmit = (force = false) => {
    saveCurrentQuestionTime()
    if (force) {
      isFinishedRef.current = true
      if (socketRef.current) {
        socketRef.current.emit('client:submit', { attemptId: attemptIdRef.current })
      }
    } else {
      setShowSubmitModal(true)
    }
  }

  const confirmSubmit = () => {
    setShowSubmitModal(false)
    isFinishedRef.current = true
    if (socketRef.current) {
      socketRef.current.emit('client:submit', { attemptId })
    }
  }

  const answeredCount = Object.keys(answersMap).length
  const unansweredCount = questions.length - answeredCount

  // Timer warning color classes
  const isDangerTime = timeLeft < 60000 // Under 1m
  const isWarnTime = timeLeft >= 60000 && timeLeft < 300000 // Under 5m

  const formatTime = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000)
    const mins = Math.floor(totalSecs / 60)
    const secs = totalSecs % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const enterFullscreenAndStart = () => {
    const el = document.documentElement
    if (el.requestFullscreen) {
      el.requestFullscreen().then(() => {
        setShowFullscreenOverlay(false)
      }).catch((err) => {
        console.error("Error entering fullscreen mode:", err)
        setShowFullscreenOverlay(false)
      })
    } else {
      setShowFullscreenOverlay(false)
    }
  }

  return {
    loading,
    questions,
    currentIndex,
    allowReview,
    answersMap,
    flaggedIds,
    visitedIndexes,
    timeLeft,
    isPaused,
    showWarningModal,
    setShowWarningModal,
    showSubmitModal,
    setShowSubmitModal,
    broadcastMessage,
    setBroadcastMessage,
    showCalculator,
    setShowCalculator,
    handleAnswerSubmit,
    handleClearResponse,
    handleToggleFlag,
    handleNavigate,
    handleSaveAndNext,
    handleMarkReviewAndNext,
    handleFinalSubmit,
    confirmSubmit,
    answeredCount,
    unansweredCount,
    isDangerTime,
    isWarnTime,
    formatTime,
    isLocked,
    showFullscreenOverlay,
    lockReason,
    enterFullscreenAndStart
  }
}
