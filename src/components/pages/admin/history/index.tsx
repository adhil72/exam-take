import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Card, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useHistory } from './use-history'
import { Calendar, Clock, Users, Loader2, History, ChevronRight, Search, X, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useConfirm } from '@/contexts/confirm.context'

export function AdminHistoryPage() {
  const { loading, sessions, error, deleteSession, clearAllHistory } = useHistory()
  const { confirm: dialogConfirm } = useConfirm()
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 transition-colors">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-xs font-['IBM_Plex_Mono'] text-muted-foreground uppercase tracking-widest mt-3 animate-pulse">
          RETRIEVING_HISTORY_LOGS
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground p-6 md:p-8 flex flex-col items-center justify-center">
        <div className="w-full max-w-md bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl font-['IBM_Plex_Mono'] text-xs uppercase text-center">
          ERROR // {error}
        </div>
      </div>
    )
  }

  const filteredSessions = sessions.filter((session: any) => {
    const matchesSearch = 
      session.examTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session._id?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const dateObj = new Date(session.createdAt)
    const localYear = dateObj.getFullYear()
    const localMonth = String(dateObj.getMonth() + 1).padStart(2, '0')
    const localDay = String(dateObj.getDate()).padStart(2, '0')
    const sessionDateStr = `${localYear}-${localMonth}-${localDay}`
    
    const matchesDate = !dateFilter || sessionDateStr === dateFilter
    const matchesStatus = statusFilter === 'all' || session.status === statusFilter

    return matchesSearch && matchesDate && matchesStatus
  })

  const hasActiveFilters = searchQuery !== '' || dateFilter !== '' || statusFilter !== 'all'

  const clearFilters = () => {
    setSearchQuery('')
    setDateFilter('')
    setStatusFilter('all')
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-['Inter'] selection:bg-primary/20 transition-colors duration-300">
      
      {/* Sticky Top Header */}
      <div className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border px-6 md:px-8 py-3 transition-colors">
        <div className="max-w-[1500px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight font-['Space_Grotesk'] uppercase text-foreground flex items-center gap-2">
              <History className="h-4.5 w-4.5 text-primary shrink-0" />
              History & Reports
            </h2>
            <p className="text-[10px] text-muted-foreground font-['IBM_Plex_Mono'] uppercase tracking-widest mt-0.5">
              SYS_HISTORY // EXAM SESSION LIFECYCLE LOGS
            </p>
          </div>

          {sessions.length > 0 && (
            <Button
              variant="outline"
              onClick={async () => {
                const confirmed = await dialogConfirm(
                  "Are you sure you want to clear all history? This will permanently delete ALL past exam sessions, student attempts, and scorecards."
                )
                if (confirmed) {
                  try {
                    await clearAllHistory()
                    toast.success("All history logs successfully cleared!")
                  } catch (err: any) {
                    toast.error(err.message || "Failed to clear history")
                  }
                }
              }}
              className="border-destructive/30 hover:bg-destructive/10 text-destructive font-['IBM_Plex_Mono'] text-xs font-bold uppercase tracking-wider h-9 px-4 rounded shadow-sm gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear All History
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-[1200px] mx-auto p-6 md:p-8 space-y-6">
        
        {/* Filters Controls Panel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 border border-border bg-card rounded-xl shadow-sm items-center">
          <div className="relative col-span-1 sm:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              type="text"
              placeholder="Search exam preset or session ID..."
              className="pl-9 bg-card border-border text-foreground font-sans text-sm focus-visible:ring-1 focus-visible:ring-primary w-full h-10 shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div>
            <Input 
              type="date"
              className="bg-card border-border text-foreground font-['IBM_Plex_Mono'] text-xs focus-visible:ring-1 focus-visible:ring-primary w-full h-10 shadow-sm block"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>

          <div className="flex gap-2 items-center">
            <select
              className="h-10 cursor-pointer rounded-lg border border-border bg-card px-3 text-xs outline-none transition-colors focus:border-primary w-full text-foreground font-['IBM_Plex_Mono']"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">ALL_STATUS</option>
              <option value="completed">COMPLETED</option>
              <option value="results_published">PUBLISHED</option>
              <option value="in_progress">IN_PROGRESS</option>
              <option value="lobby">LOBBY</option>
              <option value="paused">PAUSED</option>
            </select>

            {hasActiveFilters && (
              <Button 
                onClick={clearFilters}
                variant="outline"
                size="icon"
                className="h-10 w-10 shrink-0 border-border text-muted-foreground hover:text-foreground"
                title="Clear Filters"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {filteredSessions.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground border border-dashed border-border bg-card rounded-xl p-8 max-w-md mx-auto w-full">
              <Clock className="w-10 h-10 mx-auto opacity-30 mb-3 animate-pulse" />
              <h3 className="font-['Space_Grotesk'] font-bold text-sm uppercase text-foreground">NO SESSIONS FOUND</h3>
              <p className="font-['IBM_Plex_Mono'] text-[10px] uppercase tracking-wider mt-1">
                Try modifying your filter options or search queries.
              </p>
            </div>
          ) : (
            filteredSessions.map((session: any) => (
              <Card 
                key={session._id} 
                className="bg-card border border-border rounded-xl shadow-sm hover:border-primary/45 transition-all duration-200 overflow-hidden relative group"
              >
                <div className="absolute top-0 bottom-0 left-0 w-1 bg-primary/20 group-hover:bg-primary transition-colors" />
                
                <div className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="text-[9px] text-muted-foreground font-['IBM_Plex_Mono'] uppercase tracking-widest">
                      ID: {session._id}
                    </div>
                    <CardTitle className="text-base font-bold text-foreground font-['Space_Grotesk'] uppercase tracking-wide truncate">
                      {session.examTitle}
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground font-['IBM_Plex_Mono']">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        {new Date(session.createdAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        {session.startedAt ? new Date(session.startedAt).toLocaleTimeString() : 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full md:w-auto shrink-0 justify-between md:justify-end border-t md:border-t-0 border-border/60 pt-3 md:pt-0">
                    <span className={`px-2.5 py-1 text-[9px] font-['IBM_Plex_Mono'] font-bold border rounded uppercase tracking-wider ${
                      session.status === 'completed' || session.status === 'results_published'
                        ? 'bg-primary/10 border-primary/20 text-primary'
                        : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                    }`}>
                      {session.status.replace('_', ' ')}
                    </span>

                     <div className="flex items-center gap-2 w-full md:w-auto">
                      <Link 
                        to="/admin/history/$sessionId" 
                        params={{ sessionId: session._id }} 
                        className="w-full md:w-auto shrink-0"
                      >
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="bg-card border-border hover:bg-accent text-foreground hover:text-foreground font-['IBM_Plex_Mono'] text-xs font-bold uppercase tracking-wider h-9 rounded shadow-sm gap-1 cursor-pointer w-full md:w-auto"
                        >
                          <Users className="w-3.5 h-3.5" />
                          View Results
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>

                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={async () => {
                          const confirmed = await dialogConfirm(
                            "Are you sure you want to delete this session? This will permanently delete all student attempts and results for this session."
                          )
                          if (confirmed) {
                            try {
                              await deleteSession(session._id)
                              toast.success("Session deleted successfully!")
                            } catch (err: any) {
                              toast.error(err.message || "Failed to delete session")
                            }
                          }
                        }}
                        className="border-border text-destructive hover:bg-destructive/10 hover:text-destructive h-9 w-9 shrink-0 transition-colors cursor-pointer"
                        title="Delete Session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                </div>
              </Card>
            ))
          )}
        </div>

      </div>
    </div>
  )
}
