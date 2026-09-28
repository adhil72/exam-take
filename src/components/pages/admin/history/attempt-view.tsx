import { useParams, Link } from '@tanstack/react-router'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAttemptView } from './use-attempt-view'
import { CheckCircle, XCircle, MinusCircle, Clock, ArrowLeft, User, Loader2, History } from 'lucide-react'
import MdPreview from '@/components/ui/md-preview'

export function AdminAttemptResultsPage() {
  const { attemptId } = useParams({ from: '/admin/history/attempt/$attemptId' })
  const { loading, results, attempt, error } = useAttemptView(attemptId)

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 transition-colors">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-xs font-['IBM_Plex_Mono'] text-muted-foreground uppercase tracking-widest mt-3 animate-pulse">
          LOADING_ATTEMPT_METRICS
        </p>
      </div>
    )
  }

  if (error || !results) {
    return (
      <div className="min-h-screen bg-background text-foreground p-6 md:p-8 flex flex-col items-center justify-center">
        <div className="w-full max-w-md bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl font-['IBM_Plex_Mono'] text-xs uppercase text-center">
          ERROR // {error || 'Results not found'}
        </div>
      </div>
    )
  }

  const { summary, questions } = results

  return (
    <div className="min-h-screen bg-background text-foreground font-['Inter'] selection:bg-primary/20 transition-colors duration-300">
      
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border px-6 md:px-8 py-3 transition-colors">
        <div className="max-w-[1500px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link 
              to={attempt?.sessionId ? "/admin/history/$sessionId" : "/admin/history"} 
              params={attempt?.sessionId ? { sessionId: attempt.sessionId } : undefined}
            >
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
                Attempt Review
              </h2>
              <p className="text-[10px] text-muted-foreground font-['IBM_Plex_Mono'] uppercase tracking-widest mt-0.5">
                SYS_ATTEMPT // {attemptId.substring(0, 8)} // {attempt?.student?.name || 'STUDENT'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-[1000px] mx-auto p-6 md:p-8 space-y-8">
        
        {/* Student metadata header card */}
        <Card className="bg-card border border-border p-5 rounded-xl shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-full bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0">
              {attempt?.student?.photoUrl ? (
                <img src={attempt.student.photoUrl} alt="" className="object-cover h-full w-full" />
              ) : (
                <User className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0">
              <span className="text-[9px] text-primary font-['IBM_Plex_Mono'] uppercase tracking-wider block">
                Attendee Identity
              </span>
              <h3 className="font-bold text-foreground text-base truncate font-sans">
                {attempt?.student?.name}
              </h3>
              <p className="text-xs text-muted-foreground font-['IBM_Plex_Mono'] mt-0.5 uppercase tracking-wide">
                {attempt?.student?.email} • {attempt?.student?.batch || 'BATCH N/A'}
              </p>
            </div>
          </div>
        </Card>

        {/* Score Summary Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-card border border-border rounded-xl shadow-sm">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
              <span className="text-[9px] font-bold text-primary font-['IBM_Plex_Mono'] uppercase tracking-widest mb-2 block">
                Total Score
              </span>
              <div className="text-3xl font-bold font-['IBM_Plex_Mono'] text-foreground">
                {summary.totalScore}
                <span className="text-xs text-muted-foreground font-normal ml-1">/{summary.maxScore}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border border-border rounded-xl shadow-sm">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
              <CheckCircle className="w-5 h-5 text-emerald-500 mb-2 shrink-0" />
              <span className="text-[9px] font-bold text-emerald-500 font-['IBM_Plex_Mono'] uppercase tracking-widest mb-1 block">
                Correct
              </span>
              <div className="text-2xl font-bold font-['IBM_Plex_Mono'] text-foreground">{summary.correctCount}</div>
            </CardContent>
          </Card>

          <Card className="bg-card border border-border rounded-xl shadow-sm">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
              <XCircle className="w-5 h-5 text-destructive mb-2 shrink-0" />
              <span className="text-[9px] font-bold text-destructive font-['IBM_Plex_Mono'] uppercase tracking-widest mb-1 block">
                Incorrect
              </span>
              <div className="text-2xl font-bold font-['IBM_Plex_Mono'] text-foreground">{summary.incorrectCount}</div>
            </CardContent>
          </Card>

          <Card className="bg-card border border-border rounded-xl shadow-sm">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
              <MinusCircle className="w-5 h-5 text-muted-foreground mb-2 shrink-0" />
              <span className="text-[9px] font-bold text-muted-foreground font-['IBM_Plex_Mono'] uppercase tracking-widest mb-1 block">
                Unanswered
              </span>
              <div className="text-2xl font-bold font-['IBM_Plex_Mono'] text-foreground">{summary.skippedCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Breakdown */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 border-b border-border pb-3">
            <h3 className="font-['Space_Grotesk'] text-lg font-bold tracking-wide text-foreground uppercase">
              Question Roster
            </h3>
            <span className="px-2 py-0.5 bg-muted border border-border text-muted-foreground text-[10px] font-['IBM_Plex_Mono'] rounded font-bold uppercase tracking-wider">
              {summary.totalQuestions} Questions
            </span>
          </div>
          
          {questions.map((q: any, index: number) => {
            let statusColor = "border-border"
            let badgeColor = "bg-muted text-muted-foreground border-border"
            let statusIcon = <MinusCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            let statusText = "Skipped"
            let scoreColor = "text-muted-foreground bg-muted/20 border-border"

            if (q.status === "correct") {
              statusColor = "border-emerald-500/30"
              badgeColor = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
              statusIcon = <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              statusText = "Correct"
              scoreColor = "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
            } else if (q.status === "incorrect") {
              statusColor = "border-destructive/30"
              badgeColor = "bg-destructive/10 text-destructive border-destructive/20"
              statusIcon = <XCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
              statusText = "Incorrect"
              scoreColor = "text-destructive bg-destructive/10 border-destructive/20"
            } else if (q.status === "pending") {
              statusColor = "border-amber-500/30"
              badgeColor = "bg-amber-500/10 text-amber-500 border-amber-500/20"
              statusIcon = <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              statusText = "Pending Review"
              scoreColor = "text-amber-500 bg-amber-500/10 border-amber-500/20"
            }

            return (
              <Card key={q.id} className={`p-5 rounded-xl border bg-card shadow-sm transition-all hover:border-primary/30 ${statusColor}`}>
                
                {/* Question Info Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-foreground text-background font-bold text-sm shadow-sm font-['IBM_Plex_Mono']">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className={`px-2.5 py-1 rounded text-xs font-bold font-['IBM_Plex_Mono'] flex items-center gap-1.5 border uppercase tracking-wider ${badgeColor}`}>
                      {statusIcon}
                      {statusText}
                    </div>
                    <div className="px-2 py-1 rounded bg-muted border border-border text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-['IBM_Plex_Mono']">
                      {q.type === 'mcq' ? 'MCQ Single' : q.type === 'm-mcq' ? 'MCQ Multiple' : q.type === 'numerical' ? 'Numerical' : 'Descriptive'}
                    </div>
                  </div>
                  <div className={`text-xs font-bold font-['IBM_Plex_Mono'] px-3 py-1 rounded border shadow-sm ${scoreColor}`}>
                    {q.score > 0 ? `+${q.score}` : q.score} Marks
                  </div>
                </div>

                {/* Question Content */}
                <div className="pb-4 border-b border-border/60">
                  <MdPreview value={q.question} className="text-foreground text-sm font-sans leading-relaxed" />
                </div>
                
                {/* Attachments */}
                {q.files && q.files.length > 0 && (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 pb-4 border-b border-border/60">
                    {q.files.map((file: string, fIdx: number) => (
                      <div key={fIdx} className="border border-border p-2 rounded-lg bg-muted/20 flex items-center justify-center shadow-sm">
                        {file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.svg') ? (
                          <img src={`/data/files/${file}`} alt="attachment" className="max-h-60 object-contain rounded" />
                        ) : (
                          <a href={`/data/files/${file}`} target="_blank" rel="noreferrer" className="text-primary hover:text-primary hover:underline font-bold text-xs flex items-center gap-1.5 font-['IBM_Plex_Mono']">
                            📎 DOWNLOAD ATTACHMENT {fIdx + 1}
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Answers Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  
                  <div className="bg-muted/15 p-4 rounded-lg border border-border relative overflow-hidden">
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${q.status === 'correct' ? 'bg-emerald-500' : q.status === 'incorrect' ? 'bg-destructive' : 'bg-muted-foreground'}`} />
                    <span className="text-[9px] font-bold text-muted-foreground font-['IBM_Plex_Mono'] uppercase tracking-widest block mb-2">
                      Student's Answer
                    </span>
                    <div className="font-medium text-foreground text-sm font-sans break-words">
                      {q.studentAnswer === null || q.studentAnswer === undefined || q.studentAnswer === "" ? (
                        <span className="text-muted-foreground/60 italic font-['IBM_Plex_Mono'] text-xs">NO_ANSWER_PROVIDED</span>
                      ) : Array.isArray(q.studentAnswer) ? (
                        <div className="flex flex-wrap gap-1 items-center">
                          {q.studentAnswer.map((ans: string, aIdx: number) => (
                            <span key={aIdx} className="inline-flex items-center">
                              <MdPreview value={ans} minimal className="font-medium text-foreground text-sm font-sans" />
                              {aIdx < q.studentAnswer.length - 1 && <span className="mr-1">,</span>}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <MdPreview value={String(q.studentAnswer)} className="font-medium text-foreground text-sm font-sans" />
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-muted/30 p-4 rounded-lg border border-border relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />
                    <span className="text-[9px] font-bold text-emerald-500/70 font-['IBM_Plex_Mono'] uppercase tracking-widest block mb-2">
                      Correct Answer
                    </span>
                    <div className="font-medium text-foreground text-sm font-sans break-words">
                      {q.correctAnswer && q.correctAnswer.length > 0 ? (
                        <div className="flex flex-wrap gap-1 items-center">
                          {q.correctAnswer.map((ans: string, aIdx: number) => (
                            <span key={aIdx} className="inline-flex items-center">
                              <MdPreview value={ans} minimal className="font-medium text-foreground text-sm font-sans" />
                              {aIdx < q.correctAnswer.length - 1 && <span className="mr-1">,</span>}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground/60 italic font-['IBM_Plex_Mono'] text-xs">EVALUATION_PENDING</span>
                      )}
                    </div>
                  </div>

                </div>

                {q.explanation && (
                  <div className="mt-4 p-4 bg-muted/20 border border-border rounded-lg text-xs leading-relaxed text-muted-foreground">
                    <strong className="text-primary font-bold font-['IBM_Plex_Mono'] uppercase tracking-wide block mb-1.5">
                      Explanation:
                    </strong>
                    <MdPreview value={q.explanation} className="text-xs leading-relaxed font-sans" />
                  </div>
                )}

              </Card>
            )
          })}
        </div>

      </div>
    </div>
  )
}
