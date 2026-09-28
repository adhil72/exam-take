import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Clock, RotateCcw, Check, X, Minus, Trophy } from 'lucide-react'
import axios from 'axios'

/* ------------------------------------------------------------------ */
/*  Main page                                                         */
/* ------------------------------------------------------------------ */
export default function StudentSubmittedPage() {
  const navigate = useNavigate()
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Prevent back navigation to the exam page
  useEffect(() => {
    window.history.pushState(null, '', window.location.href)
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Fetch results
  useEffect(() => {
    const fetchResults = async () => {
      try {
        const clientId = localStorage.getItem('gexam_client_id')
        if (!clientId) {
          setError('Client session not found.')
          setLoading(false)
          return
        }
        const res = await axios.get(`/api/admin/client/${clientId}/results`)
        if (res.data.success) setResults(res.data)
        else setError('Failed to fetch results.')
      } catch (err: any) {
        setError(err.response?.data?.error || 'An error occurred while fetching your results.')
      } finally {
        setLoading(false)
      }
    }
    fetchResults()
  }, [])

  /* derived data --------------------------------------------------- */
  const summary = results?.summary

  const formatDuration = (ms: number) => {
    if (!ms) return '0 min'
    const totalSecs = Math.floor(ms / 1000)
    const h = Math.floor(totalSecs / 3600)
    const m = Math.floor((totalSecs % 3600) / 60)
    const s = totalSecs % 60
    if (h > 0) return `${h}h ${m}m`
    if (m > 0) return `${m}m ${s}s`
    return `${s}s`
  }

  const handleReset = async () => {
    try {
      const clientId = localStorage.getItem('gexam_client_id')
      if (clientId) await axios.post(`/api/admin/client/${clientId}/unassign`)
    } catch (err) {
      console.error('Failed to unassign client:', err)
    } finally {
      navigate({ to: '/' })
    }
  }

  /* ---- loading / error screens ----------------------------------- */
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-5">
        <div className="w-10 h-10 border-[3px] border-border border-t-primary rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground font-medium tracking-wide animate-pulse">
          Evaluating responses…
        </p>
      </div>
    )
  }

  if (error || !summary) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-sm w-full bg-card border border-border rounded-2xl p-8 text-center space-y-5 shadow-sm">
          <div className="w-14 h-14 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
            <X className="w-7 h-7 text-destructive" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Something went wrong</h2>
            <p className="text-sm text-muted-foreground mt-1">{error || 'No results available.'}</p>
          </div>
          <button
            onClick={() => navigate({ to: '/' })}
            className="w-full py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-accent transition-colors cursor-pointer"
          >
            Return to Start
          </button>
        </div>
      </div>
    )
  }

  /* ---- stats for the bottom row ---------------------------------- */
  const stats = [
    { label: 'Correct', value: summary.correctCount, icon: Check, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Incorrect', value: summary.incorrectCount, icon: X, color: 'text-destructive', bg: 'bg-destructive/10' },
    { label: 'Skipped', value: summary.skippedCount, icon: Minus, color: 'text-muted-foreground', bg: 'bg-muted' },
    { label: 'Duration', value: formatDuration(summary.timeSpentMs), icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  ]

  /* ---- main render ----------------------------------------------- */
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12 selection:bg-primary/20">

      {/* centred card */}
      <div className="w-full max-w-lg space-y-10">

        {/* ─── hero: headline ─── */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <Trophy className="w-3.5 h-3.5" />
            Exam Complete
          </div>
          
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Score Obtained</p>
            <h1 className="text-5xl font-black text-foreground tracking-tight">
              {Number(summary.totalScore || 0).toFixed(2)}
              <span className="text-muted-foreground font-normal text-xl ml-1.5">/ {summary.maxScore}</span>
            </h1>
          </div>

          <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
            Your responses have been recorded and evaluated successfully.
          </p>
        </div>

        {/* ─── stat cards grid ─── */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map((s) => (
            <div
              key={s.label}
              className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3 shadow-sm"
            >
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{s.label}</p>
                <p className="text-xl font-bold text-foreground leading-tight truncate">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ─── questions breakdown bar ─── */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Answer Distribution</span>
            <span className="text-xs text-muted-foreground">{summary.totalQuestions} questions</span>
          </div>
          <div className="flex h-2.5 rounded-full overflow-hidden bg-muted">
            {summary.correctCount > 0 && (
              <div
                className="bg-emerald-500 transition-all duration-700"
                style={{ width: `${(summary.correctCount / summary.totalQuestions) * 100}%` }}
              />
            )}
            {summary.incorrectCount > 0 && (
              <div
                className="bg-destructive transition-all duration-700"
                style={{ width: `${(summary.incorrectCount / summary.totalQuestions) * 100}%` }}
              />
            )}
            {summary.skippedCount > 0 && (
              <div
                className="bg-muted-foreground/30 transition-all duration-700"
                style={{ width: `${(summary.skippedCount / summary.totalQuestions) * 100}%` }}
              />
            )}
          </div>
          <div className="flex items-center gap-4 text-[11px] text-muted-foreground font-medium">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Correct</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-destructive" /> Wrong</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-muted-foreground/30" /> Skipped</span>
          </div>
        </div>

        {/* ─── action ─── */}
        <div className="flex justify-center pt-2">
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-foreground text-background text-sm font-semibold hover:opacity-90 active:scale-[.97] transition-all duration-150 shadow-md cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Device
          </button>
        </div>

      </div>
    </div>
  )
}
