import { useView } from './use-view'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MCQInput } from '@/components/exam/MCQInput'
import { MultiMCQInput } from '@/components/exam/MultiMCQInput'
import { NumericalInput } from '@/components/exam/NumericalInput'
import { DescriptiveInput } from '@/components/exam/DescriptiveInput'
import { ShieldAlert, PauseCircle, Info, Calculator as CalcIcon, Check, Sun, Moon } from 'lucide-react'
import { useStudentTheme } from '@/lib/student-theme'
import MdPreview from '@/components/ui/md-preview'
import { Calculator } from './components/calculator'

export default function StudentExamPage() {
  const { theme: studentTheme, toggle: toggleStudentTheme } = useStudentTheme()
  const {
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
    handleNavigate,
    handleSaveAndNext,
    handleMarkReviewAndNext,
    handleFinalSubmit,
    confirmSubmit,
    isDangerTime,
    formatTime,
    isLocked,
    showFullscreenOverlay,
    lockReason,
    enterFullscreenAndStart
  } = useView()

  if (loading || questions.length === 0) {
    return (
      <div className="min-h-screen bg-card flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  const currentQuestion = questions[currentIndex]
  const currentAnswer = answersMap[currentQuestion.id] ?? ''

  // Determine counts for legend
  let answered = 0
  let notAnswered = 0
  let markedForReview = 0
  let answeredAndMarked = 0
  let notVisited = questions.length

  questions.forEach((q, idx) => {
    const isAns = answersMap[q.id] !== undefined && answersMap[q.id] !== '' && (!Array.isArray(answersMap[q.id]) || answersMap[q.id].length > 0)
    const isFlagged = flaggedIds.includes(q.id)
    const isVisited = visitedIndexes.includes(idx)

    if (isVisited) notVisited--

    if (isAns && isFlagged) answeredAndMarked++
    else if (isFlagged) markedForReview++
    else if (isAns) answered++
    else if (isVisited) notAnswered++
  })

  // For unvisited, we adjust because we subtract visited from total.
  // Actually, let's just use the strict counts from above.
  
  const getStatusShapeClasses = (qId: string, idx: number) => {
    const isAns = answersMap[qId] !== undefined && answersMap[qId] !== '' && (!Array.isArray(answersMap[qId]) || answersMap[qId].length > 0)
    const isFlagged = flaggedIds.includes(qId)
    const isVisited = visitedIndexes.includes(idx)

    if (isAns && isFlagged) return "gate-shape-circle bg-purple-600 text-white relative"
    if (isFlagged) return "gate-shape-circle bg-purple-600 text-white"
    if (isAns) return "gate-shape-shield bg-green-500 text-white pt-1" // pt-1 to center text due to shield shape
    if (isVisited) return "gate-shape-shield bg-red-500 text-white pt-1"
    return "gate-shape-square bg-muted border border-border text-foreground"
  }

  const subjectTitle = "Exam Paper"

  return (
    <div className="h-screen bg-background flex flex-col relative select-none overflow-hidden font-sans text-sm">
      
      {/* Overlays (Unchanged functionality) */}
      {broadcastMessage && (
        <div className="bg-amber-500 text-white font-semibold text-center py-2 px-6 flex items-center justify-between z-50 absolute top-0 w-full">
          <div className="flex-1 flex items-center justify-center gap-2">
            <span>📢</span>
            <span>Broadcast: {broadcastMessage}</span>
          </div>
          <button onClick={() => setBroadcastMessage(null)} className="hover:text-amber-100 font-extrabold p-1">✕</button>
        </div>
      )}
      
      {isPaused && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-white">
          <PauseCircle className="w-20 h-20 text-amber-500 animate-pulse mb-4" />
          <h2 className="text-3xl font-extrabold tracking-tight">Exam Paused</h2>
          <p className="mt-2 text-center">The supervisor has temporarily paused the exam.</p>
        </div>
      )}

      {showFullscreenOverlay && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex flex-col items-center justify-center text-white">
          <div className="text-center max-w-md space-y-6">
            <h2 className="text-3xl font-extrabold">Fullscreen Required</h2>
            <p className="text-slate-300 text-sm">This exam must be taken in Fullscreen Mode. Exiting will lock your session.</p>
            <Button onClick={enterFullscreenAndStart} className="w-full py-6 text-base font-bold">
              Enter Fullscreen & Start Exam
            </Button>
          </div>
        </div>
      )}

      {isLocked && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex flex-col items-center justify-center text-white">
          <div className="text-center max-w-md space-y-6">
            <h2 className="text-3xl font-extrabold text-destructive">Exam Locked</h2>
            <div className="p-4 bg-slate-900 rounded-lg text-xs text-slate-400 border border-slate-800">
              Reason: <strong className="text-destructive font-semibold">{lockReason}</strong>
            </div>
            <p className="text-xs text-slate-400">Please notify the supervisor to unlock your session.</p>
          </div>
        </div>
      )}

      {showWarningModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
          <Card className="w-full max-w-md border-red-500 shadow-2xl">
            <CardHeader className="text-center">
              <ShieldAlert className="w-16 h-16 text-destructive mx-auto animate-bounce mb-2" />
              <CardTitle className="text-2xl text-destructive font-black">Cheat Warning!</CardTitle>
            </CardHeader>
            <CardContent className="text-center">Tab switching or minimizing is strictly prohibited.</CardContent>
            <CardFooter>
              <Button variant="destructive" className="w-full" onClick={() => setShowWarningModal(false)}>Return to Exam</Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader>
              <CardTitle>Submit Exam?</CardTitle>
              <CardDescription>Confirm your submission. You will not be able to re-enter the exam.</CardDescription>
            </CardHeader>
            <CardFooter className="flex gap-3 pt-4 border-t w-full">
              <Button variant="outline" onClick={() => setShowSubmitModal(false)} className="flex-1">Keep Answering</Button>
              <Button onClick={confirmSubmit} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">Yes, Submit</Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Calculator Modal */}
      {showCalculator && <Calculator onClose={() => setShowCalculator(false)} />}


      {/* GATE UI Sub-header */}
      <div className="bg-muted border-b border-border flex items-center justify-between px-3 h-14 shrink-0 shadow-sm z-30 relative">
        <div className="flex h-full items-end pt-2">
          <div className="bg-blue-600 text-white px-6 h-full rounded-t-xl flex items-center justify-center text-sm font-bold cursor-default shadow-[0_-2px_10px_rgba(37,99,235,0.2)] border-x border-t border-blue-500">
            {subjectTitle}
            <Info className="w-4 h-4 ml-2 opacity-80" />
          </div>
        </div>
        <div className="flex items-center gap-4 px-2 font-bold text-sm">
          <div className="flex items-center gap-2 bg-card px-4 py-1.5 rounded-lg border border-border shadow-sm">
            <span className="text-muted-foreground font-medium text-xs uppercase tracking-wider hidden sm:inline">Time Left</span>
            <span className={`text-base font-mono ${isDangerTime ? 'text-red-600 dark:text-red-400 animate-pulse' : 'text-foreground'}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
          <button
            onClick={toggleStudentTheme}
            className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-accent text-foreground border border-border hover:border-muted-foreground transition-all duration-200 shadow-sm bg-card active:scale-95"
            title={studentTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label={studentTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {studentTheme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button 
            onClick={() => setShowCalculator(!showCalculator)}
            className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-accent text-foreground border border-border hover:border-muted-foreground transition-all duration-200 shadow-sm hover:shadow bg-card active:scale-95"
            title="Scientific Calculator"
          >
            <CalcIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Content Pane */}
        <main className="flex-1 flex flex-col bg-card overflow-hidden relative">
          
          {/* Top Tabs inside the left pane */}
          <div className="flex bg-background border-b border-border shrink-0 pt-2 px-2">
             <div className="px-5 py-2 text-blue-700 dark:text-blue-400 font-bold text-sm bg-card rounded-t-md border-t border-l border-r border-border shadow-[0_-2px_5px_rgba(0,0,0,0.02)] relative z-10 -mb-[1px]">
                {subjectTitle}
             </div>
          </div>

          {/* Info Bar */}
          <div className="flex justify-end items-center px-8 py-3 border-b border-border bg-card shrink-0 gap-4 shadow-sm z-10 relative">
             <div className="mr-auto text-xs font-medium text-muted-foreground">
               Question Type: <span className="text-foreground font-bold ml-1">{currentQuestion.type === 'mcq' ? 'MCQ Single' : currentQuestion.type === 'm-mcq' ? 'Multiple Select' : 'Numerical'}</span>
             </div>
             <div className="text-xs font-medium flex gap-4 items-center bg-green-500/10 text-green-700 dark:text-green-400 px-3 py-1.5 rounded-full border border-green-500/20">
               <span>Marks for correct answer: <span className="font-bold ml-1">{currentQuestion.marks}</span></span>
             </div>
             {currentQuestion.negativeMarks > 0 && (
               <div className="text-xs font-medium flex gap-4 items-center bg-red-500/10 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-full border border-red-500/20">
                 <span>Negative Marks: <span className="font-bold ml-1">{currentQuestion.negativeMarks}</span></span>
               </div>
             )}
          </div>

          {/* Question Area */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col">
            <div className="font-bold text-lg text-foreground mb-4 pb-2 border-b border-border">Question No. {currentIndex + 1}</div>
            <div className="flex-1 pl-2">
              <MdPreview
                value={currentQuestion.question}
                className="text-base text-foreground"
              />
                
                {currentQuestion.files && currentQuestion.files.length > 0 && (
                  <div className="mt-4 grid grid-cols-1 gap-3">
                    {currentQuestion.files.map((file, idx) => (
                      <div key={idx} className="border p-2 bg-card flex items-center justify-center">
                        {file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.svg') ? (
                          <img src={`/data/files/${file}`} alt="attachment" className="max-h-[400px] object-contain" />
                        ) : (
                          <a href={`/data/files/${file}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Download Attachment</a>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-8 border-t border-border pt-4 max-w-2xl">
                  {currentQuestion.type === 'mcq' && (
                    <MCQInput choices={currentQuestion.choices || []} selectedAnswer={currentAnswer} onAnswerChange={handleAnswerSubmit} />
                  )}
                  {currentQuestion.type === 'm-mcq' && (
                    <MultiMCQInput choices={currentQuestion.choices || []} selectedAnswers={Array.isArray(currentAnswer) ? currentAnswer : []} onAnswerChange={handleAnswerSubmit} />
                  )}
                  {currentQuestion.type === 'numerical' && (
                    <NumericalInput selectedAnswer={currentAnswer} onAnswerChange={handleAnswerSubmit} />
                  )}
                  {currentQuestion.type === 'descriptive' && (
                    <DescriptiveInput selectedAnswer={currentAnswer} onAnswerChange={handleAnswerSubmit} />
                  )}
                </div>
              </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="bg-background border-t border-border p-4 shrink-0 flex justify-between items-center z-10 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
            <div className="flex gap-3">
              <button 
                onClick={handleMarkReviewAndNext}
                className="bg-card border border-border hover:bg-accent hover:border-muted-foreground text-foreground px-6 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 shadow-sm active:scale-95"
              >
                Mark for Review & Next
              </button>
              <button 
                onClick={handleClearResponse}
                className="bg-card border border-border hover:bg-accent hover:border-muted-foreground text-foreground px-6 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 shadow-sm active:scale-95"
              >
                Clear Response
              </button>
            </div>
            
            <button 
              onClick={handleSaveAndNext}
              className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-2.5 rounded-lg font-bold text-sm transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
            >
              Save & Next
            </button>
          </div>
        </main>

        {/* Right Sidebar Pane */}
        <aside className="w-[340px] bg-background border-l border-border flex flex-col shrink-0 overflow-hidden shadow-[-4px_0_15px_rgba(0,0,0,0.03)] z-20">
          
          {/* Profile Section */}
          <div className="bg-card p-5 border-b border-border flex items-center gap-4 shrink-0 z-10 relative">
            <div className="w-16 h-16 bg-muted rounded-lg border border-border overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
              {/* Fallback image if student photo is missing */}
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=student" alt="Profile" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Time Left: <span className="text-blue-700 dark:text-blue-400 font-mono text-sm ml-1 font-bold">{formatTime(timeLeft)}</span></div>
              <div className="text-base text-foreground font-bold truncate">Student Name</div>
            </div>
          </div>

          {/* Legend Section */}
          <div className="bg-card p-5 border-b border-border shrink-0">
            <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-[11px] font-semibold text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-7 h-6 gate-shape-shield bg-green-500 text-white flex items-center justify-center pt-0.5 shadow-sm">{answered}</div>
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-6 gate-shape-shield bg-red-500 text-white flex items-center justify-center pt-0.5 shadow-sm">{notAnswered}</div>
                <span>Not Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-6 gate-shape-square bg-card border border-border text-foreground flex items-center justify-center shadow-sm">{notVisited}</div>
                <span>Not Visited</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 gate-shape-circle bg-purple-600 text-white flex items-center justify-center shadow-sm">{markedForReview}</div>
                <span>Marked for Review</span>
              </div>
              <div className="flex items-center gap-2 col-span-2 mt-1">
                <div className="w-7 h-7 gate-shape-circle bg-purple-600 text-white flex items-center justify-center relative shadow-sm">
                  {answeredAndMarked}
                  <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full w-3.5 h-3.5 flex items-center justify-center border-2 border-card">
                    <Check className="w-2.5 h-2.5 text-white" />
                  </div>
                </div>
                <span className="leading-tight">Answered & Marked for Review <br/><span className="font-normal text-[9px] text-muted-foreground">(will be considered for evaluation)</span></span>
              </div>
            </div>
          </div>

          {/* Section Header */}
          <div className="bg-blue-600 text-white font-bold text-sm px-4 py-2 shrink-0 shadow-md z-10 relative">
            {subjectTitle}
          </div>

          {/* Question Palette Grid */}
          <div className="flex-1 overflow-y-auto p-4 bg-muted/40">
            <div className="font-bold text-xs mb-4 text-muted-foreground uppercase tracking-wider">Choose a Question</div>
            <div className="flex flex-wrap gap-2.5">
              {questions.map((q, idx) => {
                const shapeClass = getStatusShapeClasses(q.id, idx)
                const isCurrent = idx === currentIndex
                const isRestricted = !allowReview && idx !== currentIndex + 1 && idx !== currentIndex

                return (
                  <button
                    key={q.id}
                    onClick={() => handleNavigate(idx)}
                    disabled={isRestricted && idx > currentIndex}
                    className={`w-10 h-9 flex items-center justify-center font-bold text-sm disabled:opacity-40 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${shapeClass} ${
                      isCurrent ? 'ring-2 ring-blue-600 ring-offset-2 ring-offset-background scale-110 z-10 shadow-lg' : 'shadow-sm'
                    }`}
                  >
                    {idx + 1}
                    {/* Add small green dot indicator if answered & flagged */}
                    {shapeClass.includes("relative") && (
                      <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full w-3 h-3 flex items-center justify-center border-2 border-card shadow-sm">
                         <Check className="w-2 h-2 text-white" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Submit Test Button */}
          <div className="p-5 bg-card border-t border-border shrink-0 flex justify-center shadow-[0_-4px_10px_rgba(0,0,0,0.02)] z-10">
             <button
                onClick={() => handleFinalSubmit(false)}
                className="bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 font-bold px-8 py-3 rounded-lg text-sm w-full transition-all duration-200 shadow-sm hover:shadow active:scale-95"
              >
                Submit Test
              </button>
          </div>

        </aside>
      </div>
    </div>
  )
}
