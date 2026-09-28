import { Link, useParams } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSessionView } from './use-session-view'
import { Search, ArrowLeft, Eye, Award, Loader2, History } from 'lucide-react'
import { useState } from 'react'

export function AdminSessionResultsPage() {
  const { sessionId } = useParams({ from: '/admin/history/$sessionId' })
  const { loading, results, error } = useSessionView(sessionId)
  const [searchTerm, setSearchTerm] = useState('')

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 transition-colors">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-xs font-['IBM_Plex_Mono'] text-muted-foreground uppercase tracking-widest mt-3 animate-pulse">
          LOADING_SESSION_SCORES
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

  const filteredResults = results.filter((r: any) => 
    r.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.studentEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.studentBatch?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-background text-foreground font-['Inter'] selection:bg-primary/20 transition-colors duration-300">
      
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border px-6 md:px-8 py-3 transition-colors">
        <div className="max-w-[1500px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/admin/history">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-muted-foreground hover:bg-accent rounded-full h-9 w-9 shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="w-[1px] h-8 bg-border" />
            <div>
              <h2 className="text-xl font-bold tracking-tight font-['Space_Grotesk'] uppercase text-foreground flex items-center gap-2">
                <History className="h-4.5 w-4.5 text-primary shrink-0" />
                Session Results
              </h2>
              <p className="text-[10px] text-muted-foreground font-['IBM_Plex_Mono'] uppercase tracking-widest mt-0.5">
                SYS_RESULTS // STUDENT SCORECARDS FOR SESSION {sessionId.substring(0, 8)}
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Main Content Dashboard */}
      <div className="max-w-[1500px] mx-auto p-6 md:p-8 space-y-6">
        
        <Card className="bg-card border border-border shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="py-4 border-b border-border bg-muted/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base font-bold font-['Space_Grotesk'] uppercase text-foreground">
                  Score Roster
                </CardTitle>
                <p className="text-[9px] text-muted-foreground font-['IBM_Plex_Mono'] uppercase tracking-wider mt-0.5">
                  Individual attendee performance metrics
                </p>
              </div>
              
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by name, email or batch..." 
                  className="pl-9 bg-card border-border text-foreground font-sans text-sm focus-visible:ring-1 focus-visible:ring-primary w-full h-10 shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 border-b border-border font-['IBM_Plex_Mono'] text-[10px] text-muted-foreground uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4 font-semibold">Student Info</th>
                  <th className="px-6 py-4 font-semibold">Batch</th>
                  <th className="px-6 py-4 font-semibold">Telemetry Status</th>
                  <th className="px-6 py-4 font-semibold">Final Score</th>
                  <th className="px-6 py-4 font-semibold text-center">Correct / Incorrect</th>
                  <th className="px-6 py-4 text-right font-semibold">Commands</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-['IBM_Plex_Mono'] text-sm">
                {filteredResults.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider bg-muted/5">
                      NO MATCHING ATTENDEE SCORES FOUND
                    </td>
                  </tr>
                ) : (
                  filteredResults.map((r: any) => (
                    <tr key={r.attemptId} className="hover:bg-accent/40 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-bold text-foreground font-sans">{r.studentName}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 font-['IBM_Plex_Mono']">{r.studentEmail}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 bg-muted border border-border text-muted-foreground text-xs font-semibold rounded font-['IBM_Plex_Mono']">
                          {r.studentBatch || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 text-[10px] font-bold border rounded uppercase tracking-wider ${
                          r.status === 'submitted' || r.status === 'force_submitted' || r.status === 'timed_out' 
                            ? 'bg-primary/10 border-primary/20 text-primary' 
                            : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                        }`}>
                          {r.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {r.summary ? (
                          <div className="flex items-center gap-1.5 font-bold text-foreground text-sm">
                            <Award className="w-4 h-4 text-primary shrink-0" />
                            {r.summary.totalScore} 
                            <span className="text-[10px] text-muted-foreground font-normal">/ {r.summary.maxScore}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic text-xs">Pending</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {r.summary ? (
                          <div className="flex items-center justify-center gap-1.5 text-xs">
                            <span className="px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded font-bold">{r.summary.correctCount}</span>
                            <span className="text-muted-foreground opacity-40">/</span>
                            <span className="px-1.5 py-0.5 bg-destructive/10 border border-destructive/20 text-destructive rounded font-bold">{r.summary.incorrectCount}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground opacity-40">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link to="/admin/history/attempt/$attemptId" params={{ attemptId: r.attemptId }}>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-primary hover:text-primary hover:bg-primary/10 text-xs font-bold font-['IBM_Plex_Mono'] uppercase h-8 rounded px-2 shadow-none cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            inspect
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
