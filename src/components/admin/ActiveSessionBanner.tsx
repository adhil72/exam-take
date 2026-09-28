import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import axios from 'axios'
import { AlertCircle, ArrowRight, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export function ActiveSessionBanner() {
  const [activeSession, setActiveSession] = useState<any>(null)

  useEffect(() => {
    const fetchActiveSession = async () => {
      try {
        const res = await axios.get('/api/admin/session/active')
        if (res.data.success && res.data.session) {
          setActiveSession(res.data.session)
        }
      } catch (err) {
        console.error('Failed to fetch active session for banner:', err)
      }
    }
    fetchActiveSession()
  }, [])

  const handleDiscard = async () => {
    if (!activeSession) return
    const confirmed = window.confirm(
      'Are you sure you want to discard this exam session? This will delete all student attempts and clear the lobby.'
    )
    if (!confirmed) return

    try {
      const res = await axios.delete(`/api/admin/session/${activeSession._id}`)
      if (res.data.success) {
        toast.success('Exam session discarded successfully!')
        setActiveSession(null)
      } else {
        toast.error('Failed to discard session')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'Failed to discard session')
    }
  }

  if (!activeSession) return null

  const targetLink = ['in_progress', 'paused'].includes(activeSession.status) 
    ? '/admin/monitor' 
    : '/admin/lobby'

  return (
    <div className="w-full bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all hover:bg-amber-100/50 mb-6">
      <div className="flex items-center gap-3">
        <div className="bg-amber-500/10 p-2 rounded-lg text-amber-600 shrink-0">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-bold text-amber-900 text-sm flex items-center gap-2 flex-wrap">
            Active Exam Session: {activeSession.examTitle || 'Live Session'}
            <span className="flex h-2 w-2 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          </h4>
          <p className="text-xs text-amber-700 mt-0.5 truncate">
            State: <span className="font-bold uppercase text-amber-800">{activeSession.status.replace('_', ' ')}</span>. You must end or manage it before hosting another exam.
          </p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto shrink-0">
        <Link 
          to={targetLink}
          className="w-full sm:w-auto text-center bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
        >
          Manage Session
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
        <button
          onClick={handleDiscard}
          className="w-full sm:w-auto text-center bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-red-200 cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Discard Session
        </button>
      </div>
    </div>
  )
}
