import { useView } from './use-view'
import { useNavigate } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ActiveSessionBanner } from '@/components/admin/ActiveSessionBanner'
import { Sliders } from 'lucide-react'

interface AdminConfigurePageProps {
  examId: string
}

export default function AdminConfigurePage({ examId }: AdminConfigurePageProps) {
  const navigate = useNavigate()
  const {
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
  } = useView({ examId })

  return (
    <div className="min-h-screen bg-background text-foreground font-['Inter'] flex flex-col items-center justify-center p-4 transition-colors duration-300 relative">
      <div className="w-full max-w-md space-y-6">
        <ActiveSessionBanner />

        {/* Center Logo/Icon */}
        <div className="flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center text-primary shadow-sm">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-['Space_Grotesk'] uppercase text-foreground">Exam Configuration</h1>
            <p className="text-[10px] text-muted-foreground font-['IBM_Plex_Mono'] uppercase tracking-widest mt-0.5">
              Define Supervisor Parameters
            </p>
          </div>
        </div>

        <Card className="w-full bg-card border border-border shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="text-center pb-4 border-b border-border bg-muted/20">
            <CardTitle className="text-lg font-bold font-['Space_Grotesk'] uppercase text-foreground">Session Settings</CardTitle>
            <CardDescription className="text-[10px] font-['IBM_Plex_Mono'] uppercase tracking-widest text-muted-foreground mt-1">
              SYS_CONFIG // LOBBY PROVISIONING
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-6">
            <div className="space-y-3">
              
              {/* Shuffle Questions */}
              <div className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-card hover:bg-muted/10 transition-colors">
                <div className="space-y-0.5 pr-4 flex-1">
                  <Label htmlFor="shuffle-q" className="text-xs font-bold font-['IBM_Plex_Mono'] uppercase tracking-wider text-foreground cursor-pointer">
                    Shuffle Questions
                  </Label>
                  <p className="text-[11px] text-muted-foreground leading-normal mt-0.5">
                    Deliver questions in a different random order to each PC.
                  </p>
                </div>
                <input
                  id="shuffle-q"
                  type="checkbox"
                  checked={shuffleQuestions}
                  onChange={(e) => setShuffleQuestions(e.target.checked)}
                  className="w-4.5 h-4.5 text-primary bg-card border-border rounded focus:ring-primary cursor-pointer accent-primary shrink-0"
                />
              </div>

              {/* Shuffle Choices */}
              <div className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-card hover:bg-muted/10 transition-colors">
                <div className="space-y-0.5 pr-4 flex-1">
                  <Label htmlFor="shuffle-c" className="text-xs font-bold font-['IBM_Plex_Mono'] uppercase tracking-wider text-foreground cursor-pointer">
                    Shuffle Choices
                  </Label>
                  <p className="text-[11px] text-muted-foreground leading-normal mt-0.5">
                    Randomize MCQ option orders on each student screen.
                  </p>
                </div>
                <input
                  id="shuffle-c"
                  type="checkbox"
                  checked={shuffleChoices}
                  onChange={(e) => setShuffleChoices(e.target.checked)}
                  className="w-4.5 h-4.5 text-primary bg-card border-border rounded focus:ring-primary cursor-pointer accent-primary shrink-0"
                />
              </div>

              {/* Allow Review */}
              <div className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-card hover:bg-muted/10 transition-colors">
                <div className="space-y-0.5 pr-4 flex-1">
                  <Label htmlFor="allow-rev" className="text-xs font-bold font-['IBM_Plex_Mono'] uppercase tracking-wider text-foreground cursor-pointer">
                    Allow Back & Review
                  </Label>
                  <p className="text-[11px] text-muted-foreground leading-normal mt-0.5">
                    Allow students to navigate back and change answers during exam.
                  </p>
                </div>
                <input
                  id="allow-rev"
                  type="checkbox"
                  checked={allowReview}
                  onChange={(e) => setAllowReview(e.target.checked)}
                  className="w-4.5 h-4.5 text-primary bg-card border-border rounded focus:ring-primary cursor-pointer accent-primary shrink-0"
                />
              </div>

              {/* Show Result Immediately */}
              <div className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-card hover:bg-muted/10 transition-colors">
                <div className="space-y-0.5 pr-4 flex-1">
                  <Label htmlFor="show-res" className="text-xs font-bold font-['IBM_Plex_Mono'] uppercase tracking-wider text-foreground cursor-pointer">
                    Show Score Immediately
                  </Label>
                  <p className="text-[11px] text-muted-foreground leading-normal mt-0.5">
                    Display final marks to students immediately upon submission.
                  </p>
                </div>
                <input
                  id="show-res"
                  type="checkbox"
                  checked={showResultImmediately}
                  onChange={(e) => setShowResultImmediately(e.target.checked)}
                  className="w-4.5 h-4.5 text-primary bg-card border-border rounded focus:ring-primary cursor-pointer accent-primary shrink-0"
                />
              </div>

            </div>
          </CardContent>

          <CardFooter className="flex justify-between gap-3 border-t border-border bg-muted/20 p-4">
            <Button 
              variant="outline" 
              onClick={() => navigate({ to: '/admin/exams' })}
              className="flex-1 bg-card hover:bg-accent border border-border text-foreground hover:text-foreground text-xs font-bold uppercase tracking-wider py-5 rounded-md shadow-sm cursor-pointer"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleOpenLobby}
              disabled={loading}
              className="flex-1 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold uppercase tracking-wider py-5 rounded-md shadow-sm cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Opening...' : 'Open Lobby'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
