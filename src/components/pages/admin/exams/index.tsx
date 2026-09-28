import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useView } from './use-view'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import MdPreview from '@/components/ui/md-preview'
import { ActiveSessionBanner } from '@/components/admin/ActiveSessionBanner'
import { ExamBuilderDialog } from '@/components/admin/ExamBuilderDialog'
import { useTheme } from '@/contexts/theme.context'
import { useAuth } from '@/contexts/auth.context'
import { 
  RefreshCw, 
  Clock, 
  HelpCircle, 
  ArrowLeft, 
  Loader2, 
  AlertTriangle, 

  FileText,
  Eye,
  ServerCrash,
  Moon,
  Sun,
  Search,
  History,
  LogOut,
  Plus,
  Pencil,
  Copy,
  Trash2
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

function getFirstLineOfQuestion(htmlOrMd: string): string {
  if (!htmlOrMd) return '';
  // 1. Strip HTML tags
  let plain = htmlOrMd.replace(/<[^>]*>/g, '');
  // 2. Strip markdown headers or styling
  plain = plain.replace(/[#*`]/g, '');
  // 3. Get first non-empty line
  const lines = plain.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const firstLine = lines[0] || '';
  // 4. Truncate if too long (e.g., 100 chars) with ellipsis
  if (firstLine.length > 100) {
    return firstLine.substring(0, 100) + '...';
  }
  return firstLine;
}

export default function AdminExamsPage() {
  const {
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
  } = useView()

  const { theme, toggleTheme } = useTheme()
  const { logout } = useAuth()
  const isDark = theme === 'dark'
  const [searchQuery, setSearchQuery] = useState('')
  const [viewingPastSessionsExam, setViewingPastSessionsExam] = useState<any>(null)
  const [usedQuestionsPage, setUsedQuestionsPage] = useState(1)
  const pageSize = 15

  const totalUsedPages = Math.ceil(usedQuestions.length / pageSize)
  const paginatedUsedQuestions = usedQuestions.slice(
    (usedQuestionsPage - 1) * pageSize,
    usedQuestionsPage * pageSize
  )

  const filteredExams = exams.filter((exam) => 
    exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (exam.streamName || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-background text-foreground font-['Inter'] selection:bg-primary/20 transition-colors duration-300">
      
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border px-6 md:px-8 py-4 md:py-5 transition-colors">
        <div className="max-w-[1500px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-['Space_Grotesk'] uppercase text-foreground">Exams</h2>
            <p className="text-muted-foreground mt-1 text-sm font-['IBM_Plex_Mono']">
              SYS_EXAMS // CREATE, CONFIGURE AND HOST EXAMS
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={toggleTheme} variant="ghost" size="icon" className="text-muted-foreground hover:bg-accent rounded-full h-9 w-9">
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button 
              onClick={fetchExams}
              disabled={loading}
              className="bg-card hover:bg-accent border border-border text-foreground rounded-md gap-2 font-['Inter'] shadow-sm cursor-pointer"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh List
            </Button>
            <Button
              onClick={() => openBuilder(null)}
              className="rounded-md gap-2 font-['Inter'] shadow-sm cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              New Exam
            </Button>
            <Button 
              onClick={logout}
              variant="outline"
              className="bg-card hover:bg-accent border border-border text-foreground hover:text-foreground rounded-md gap-2 font-['Inter'] shadow-sm cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-[1500px] mx-auto p-6 md:p-8 space-y-6">
        <ActiveSessionBanner />

        {/* Search Input Banner */}
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search exams by name or stream..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 bg-card border-border text-foreground font-sans text-sm focus-visible:ring-1 focus-visible:ring-primary w-full h-11 shadow-sm rounded-xl"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 text-muted-foreground hover:text-foreground text-xs font-semibold font-['IBM_Plex_Mono']"
            >
              CLEAR
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-muted-foreground font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider animate-pulse">FETCHING_PRESETS_TELEM</p>
          </div>
        ) : exams.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-card border border-border rounded-xl p-8 space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground">
              <ServerCrash className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-['Space_Grotesk'] font-bold text-foreground text-lg uppercase">NO EXAMS YET</h3>
              <p className="text-muted-foreground font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider mt-1">
                Create your first exam to get started.
              </p>
            </div>
          </div>
        ) : filteredExams.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-card border border-border rounded-xl p-8 space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground">
              <ServerCrash className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-['Space_Grotesk'] font-bold text-foreground text-lg uppercase">NO MATCHING PRESETS</h3>
              <p className="text-muted-foreground font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider mt-1">
                Try modifying your query or clearing the filter.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredExams.map((exam) => {
              const examSessions = sessions.filter((s) => s.examId === exam._id)
              const isActivePreset = activeSession && activeSession.examId === exam._id
              return (
                <div 
                  key={exam._id} 
                  className={`bg-card border p-5 rounded-xl shadow-sm hover:border-primary/50 transition-all duration-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group relative ${
                    isActivePreset ? 'border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.05)] bg-amber-500/[0.01]' : 'border-border'
                  }`}
                >
                  <div className="space-y-3.5 flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-primary font-bold shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-bold text-foreground font-['Space_Grotesk'] group-hover:text-primary transition-colors">
                            {exam.title}
                          </h3>
                          {isActivePreset && (
                            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] bg-amber-500/15 border border-amber-500/30 text-amber-500 font-bold font-['IBM_Plex_Mono'] animate-pulse shrink-0">
                              ● ACTIVE SESSION
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground font-['IBM_Plex_Mono'] uppercase tracking-wider mt-0.5">
                          {exam.streamName} {exam.years?.length ? `· ${exam.years.join(', ')}` : '· all years'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-3 text-xs font-semibold text-muted-foreground pl-13 font-['IBM_Plex_Mono'] uppercase">
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-muted/50 border border-border rounded-md">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        Duration: <strong className="text-foreground">{exam.duration} MIN</strong>
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-muted/50 border border-border rounded-md">
                        <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />
                        Questions: <strong className="text-foreground">{exam.totalQuestions}</strong>{exam.totalMarks ? <> · Marks: <strong className="text-foreground">{exam.totalMarks}</strong></> : null}
                      </div>
                      {exam.questionConfig?.map((c: any) => (
                        <div key={c.topicId} className="px-2.5 py-1 bg-muted/30 border border-border rounded-md normal-case">
                          {c.topicName}{c.marks ? ` · ${c.marks}m` : ''}: <strong className="text-foreground">{c.count}</strong>
                        </div>
                      ))}
                      {exam.hasShortage && (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-600 rounded-md">
                          <AlertTriangle className="w-3.5 h-3.5" /> Not enough questions
                        </div>
                      )}
                      {examSessions.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setViewingPastSessionsExam(exam)}
                            className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary rounded-md transition-colors cursor-pointer text-xs font-['IBM_Plex_Mono'] uppercase font-bold"
                            title="View Created Papers (Past Sessions)"
                          >
                            <History className="w-3.5 h-3.5" />
                            Used: <strong className="text-primary font-bold">{examSessions.length} {examSessions.length === 1 ? 'TIME' : 'TIMES'}</strong>
                          </button>
                          
                          <button
                            onClick={() => handleViewUsedQuestions(exam)}
                            className="flex items-center gap-1.5 px-3 py-1 bg-muted border border-border hover:bg-accent text-muted-foreground hover:text-foreground rounded-md transition-colors cursor-pointer text-xs font-['IBM_Plex_Mono'] uppercase font-bold"
                            title="View All Unique Questions Previously Used by Students"
                          >
                            <HelpCircle className="w-3.5 h-3.5" />
                            Used Questions
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <Button variant="ghost" size="icon" title="Edit" onClick={() => openBuilder(exam)} className="h-9 w-9 text-muted-foreground cursor-pointer"><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" title="Duplicate" onClick={() => handleDuplicateExam(exam)} className="h-9 w-9 text-muted-foreground cursor-pointer"><Copy className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" title="Delete" onClick={() => handleDeleteExam(exam)} className="h-9 w-9 text-muted-foreground hover:text-destructive cursor-pointer"><Trash2 className="w-4 h-4" /></Button>
                    <Button
                      onClick={() => handleSelectExam(exam)}
                      disabled={exam.hasShortage}
                      className="flex-1 md:flex-none px-6 py-5 bg-primary text-primary-foreground hover:bg-primary/95 border border-transparent rounded-md font-['IBM_Plex_Mono'] text-xs font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer min-w-[160px] disabled:opacity-50"
                    >
                      PREPARE EXAM
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Sync/Prepare Modal */}
      {selectedExam && !showPreview && (
        <Dialog open={!!selectedExam} onOpenChange={(open) => { if (!open && !startingSession) setSelectedExam(null); }}>
          <DialogContent className="sm:max-w-md max-w-lg bg-card border border-border text-foreground rounded-xl shadow-lg p-6">
            <DialogHeader className="mb-4">
              <DialogTitle className="font-['Space_Grotesk'] text-xl font-bold uppercase tracking-wide">
                Prepare Exam
              </DialogTitle>
              <DialogDescription className="text-muted-foreground font-['IBM_Plex_Mono'] text-[10px] uppercase tracking-widest mt-1">
                Opens the lobby and builds a fresh paper for every student
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-2 font-['IBM_Plex_Mono'] text-sm">
              {/* Target Exam Info */}
              <div className="p-3 border border-border bg-muted/20 rounded-lg flex justify-between items-center text-xs">
                <span className="text-muted-foreground uppercase tracking-wider">Exam</span>
                <span className="font-semibold text-primary">{selectedExam?.title}</span>
              </div>

              {/* If in use warning */}
              {activeSession && activeSession.examId === selectedExam?._id && (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 p-4 rounded-lg text-xs leading-relaxed">
                  <div className="font-bold flex items-center gap-1.5 mb-1 text-amber-600">
                    <AlertTriangle className="w-4 h-4 shrink-0" /> PRESET_CURRENTLY_ACTIVE
                  </div>
                  <p className="opacity-95 text-xs normal-case">
                    An exam session is currently running for this preset. You cannot open a new lobby until the active session is ended or discarded.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Link
                      to={['in_progress', 'paused'].includes(activeSession.status) ? '/admin/monitor' : '/admin/lobby'}
                      className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors inline-block"
                    >
                      Go to Active Session
                    </Link>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between p-3 border border-border bg-muted/10 rounded-lg text-xs font-semibold font-['IBM_Plex_Mono']">
                <div className="space-y-0.5 pr-2 flex-1">
                  <span className="text-foreground uppercase tracking-wider block">Avoid Used Questions</span>
                  <span className="text-[10px] text-muted-foreground font-sans normal-case block leading-normal">
                    Skip questions that appeared in earlier sessions of this exam.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={avoidUsedQuestions}
                  onChange={(e) => setAvoidUsedQuestions(e.target.checked)}
                  className="w-4.5 h-4.5 text-primary bg-card border-border rounded focus:ring-primary cursor-pointer accent-primary shrink-0"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 bg-card hover:bg-accent border border-border text-foreground text-xs font-bold uppercase tracking-wider py-5 rounded-md shadow-sm cursor-pointer"
                  onClick={handleFetchPreview}
                >
                  PREVIEW QUESTIONS
                </Button>
                <Button
                  className="flex-1 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold uppercase tracking-wider py-5 rounded-md shadow-sm cursor-pointer"
                  onClick={handleStartLobby}
                  disabled={startingSession || !!(activeSession && activeSession.examId === selectedExam?._id)}
                >
                  {startingSession ? 'LOADING...' : 'OPEN LOBBY'}
                </Button>
              </div>

              <div className="pt-2 flex justify-end border-t border-slate-100">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedExam(null)} 
                  disabled={startingSession}
                  className="text-muted-foreground hover:text-foreground cursor-pointer text-xs font-bold"
                >
                  CANCEL
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Preview Modal */}
      {showPreview && selectedExam && (
        <Dialog open={showPreview} onOpenChange={(open) => { if (!open) setShowPreview(false); }}>
          <DialogContent className="max-w-5xl h-[85vh] bg-card border border-border text-foreground rounded-xl shadow-lg p-0 flex flex-col overflow-hidden">
            <DialogHeader className="p-6 border-b border-border bg-muted/10 shrink-0">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <DialogTitle className="font-['Space_Grotesk'] text-xl font-bold uppercase tracking-wide flex items-center gap-2 text-foreground">
                    <Eye className="w-5 h-5 text-primary" />
                    Node Inspector // Question Preview
                  </DialogTitle>
                  <DialogDescription className="text-muted-foreground font-['IBM_Plex_Mono'] text-[10px] uppercase tracking-widest mt-1">
                    Verify formatting, choices, and media assets for offline environment
                  </DialogDescription>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button 
                    variant="outline"
                    className="bg-card hover:bg-accent border border-border text-foreground font-['IBM_Plex_Mono'] text-xs font-bold uppercase tracking-wider py-5 rounded-md shadow-sm cursor-pointer"
                    onClick={() => setShowPreview(false)}
                  >
                    <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                    BACK
                  </Button>
                  <Button 
                    className="bg-primary hover:bg-primary/95 text-primary-foreground font-['IBM_Plex_Mono'] text-xs font-bold uppercase tracking-wider py-5 rounded-md shadow-sm cursor-pointer"
                    onClick={handleStartLobby}
                    disabled={startingSession}
                  >
                    {startingSession ? 'LOADING...' : 'OPEN LOBBY'}
                  </Button>
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-6 bg-muted/5 space-y-6">
              {previewQuestions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center font-['IBM_Plex_Mono'] text-muted-foreground">
                  <FileText className="w-10 h-10 opacity-30 mb-3" />
                  <p className="text-xs uppercase tracking-wider">Empty question node</p>
                </div>
              ) : (
                previewQuestions.map((q, idx) => (
                  <div key={q._id} className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
                    <div className="flex gap-4">
                      <div className="w-7 h-7 rounded bg-muted border border-border flex items-center justify-center font-['IBM_Plex_Mono'] font-bold text-xs text-muted-foreground shrink-0 mt-0.5">
                        {String(idx + 1).padStart(2, '0')}
                      </div>
                      <div className="flex-1 space-y-4 overflow-hidden">
                        <MdPreview value={q.question} className="text-sm text-foreground font-sans leading-relaxed" />
                        
                        {q.choices && q.choices.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                            {q.choices.map((choice: string, cIdx: number) => {
                              const isCorrect = q.answers?.includes(choice);
                              return (
                                <div 
                                  key={cIdx}
                                  className={`p-3 border rounded-lg flex gap-3 items-start transition-colors duration-200 ${
                                    isCorrect 
                                      ? 'bg-primary/10 border-primary/30 text-primary' 
                                      : 'bg-muted/10 border-border text-foreground hover:bg-muted/20'
                                  }`}
                                >
                                  <div className={`w-5 h-5 shrink-0 rounded-full border flex items-center justify-center text-[10px] font-['IBM_Plex_Mono'] font-bold mt-0.5 ${
                                    isCorrect
                                      ? 'bg-primary border-primary text-primary-foreground shadow-sm'
                                      : 'bg-background border-border text-muted-foreground'
                                  }`}>
                                    {String.fromCharCode(65 + cIdx)}
                                  </div>
                                  <MdPreview value={choice} minimal className="text-xs leading-relaxed font-sans" />
                                </div>
                              )
                            })}
                          </div>
                        )}

                        {q.explanation && (
                          <div className="mt-4 p-4 bg-muted/40 border border-border rounded-lg text-xs leading-relaxed text-muted-foreground">
                            <strong className="text-primary font-bold font-['IBM_Plex_Mono'] uppercase tracking-wide block mb-1.5">Explanation:</strong>
                            <MdPreview value={q.explanation} className="text-xs leading-relaxed font-sans" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Past Sessions/Created Papers Modal */}
      {viewingPastSessionsExam && (
        <Dialog open={!!viewingPastSessionsExam} onOpenChange={(open) => { if (!open) setViewingPastSessionsExam(null); }}>
          <DialogContent className="sm:max-w-md max-w-lg bg-card border border-border text-foreground rounded-xl shadow-lg p-6">
            <DialogHeader className="mb-4">
              <DialogTitle className="font-['Space_Grotesk'] text-xl font-bold uppercase tracking-wide flex items-center justify-between">
                <span>Exam History Roster</span>
                <span className="text-[10px] font-['IBM_Plex_Mono'] font-bold border border-border bg-muted px-2 py-0.5 rounded uppercase tracking-wider text-foreground">
                  NODES: {sessions.filter((s) => s.examId === viewingPastSessionsExam._id).length}
                </span>
              </DialogTitle>
              <DialogDescription className="text-muted-foreground font-['IBM_Plex_Mono'] text-[10px] uppercase tracking-widest mt-1">
                Past Papers Created for "{viewingPastSessionsExam.title}"
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 py-2 font-['IBM_Plex_Mono'] text-xs">
              {sessions
                .filter((s) => s.examId === viewingPastSessionsExam._id)
                .map((session) => (
                  <div key={session._id} className="border border-border bg-muted/15 p-3 rounded-lg flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="font-bold text-foreground">
                        Session on {new Date(session.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {session.startedAt ? `Started: ${new Date(session.startedAt).toLocaleTimeString()}` : 'Not started'}
                      </p>
                      <span className={`inline-block px-1.5 py-0.5 rounded-[3px] text-[8px] font-bold uppercase tracking-wider border ${
                        session.status === 'completed' || session.status === 'results_published'
                          ? 'bg-primary/10 border-primary/20 text-primary shadow-[0_0_2px_var(--color-primary)]'
                          : 'bg-amber-500/10 border-amber-500/20 text-amber-500 shadow-[0_0_2px_rgba(245,158,11,0.2)]'
                      }`}>
                        {session.status.replace('_', ' ')}
                      </span>
                    </div>
                    
                    <Link 
                      to="/admin/history/$sessionId" 
                      params={{ sessionId: session._id }} 
                      className="shrink-0"
                    >
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="bg-card hover:bg-accent border border-border text-foreground text-[10px] font-bold uppercase h-8 px-2.5 rounded shadow-none transition-all cursor-pointer"
                      >
                        View Results
                      </Button>
                    </Link>
                  </div>
                ))}
            </div>

            <div className="pt-4 border-t border-border flex justify-end">
              <Button 
                onClick={() => setViewingPastSessionsExam(null)} 
                className="bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold uppercase tracking-wider py-2 px-4 shadow-sm cursor-pointer"
              >
                Close Window
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Previously Used Questions Modal */}
      {viewingUsedQuestionsExam && (
        <Dialog 
          open={!!viewingUsedQuestionsExam} 
          onOpenChange={(open) => { 
            if (!open) {
              setViewingUsedQuestionsExam(null); 
              setUsedQuestionsPage(1);
            }
          }}
        >
          <DialogContent className="max-w-5xl h-[85vh] bg-card border border-border text-foreground rounded-xl shadow-lg p-0 flex flex-col overflow-hidden">
            <DialogHeader className="p-6 border-b border-border bg-muted/10 shrink-0">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <DialogTitle className="font-['Space_Grotesk'] text-xl font-bold uppercase tracking-wide flex items-center gap-2 text-foreground">
                    <History className="w-5 h-5 text-primary animate-pulse" />
                    Question Vault // Used Questions
                  </DialogTitle>
                  <DialogDescription className="text-muted-foreground font-['IBM_Plex_Mono'] text-[10px] uppercase tracking-widest mt-1">
                    All unique questions that were assigned to student attempts in past sessions of "{viewingUsedQuestionsExam.title}"
                  </DialogDescription>
                </div>
                <Button 
                  variant="outline"
                  className="bg-card hover:bg-accent border border-border text-foreground font-['IBM_Plex_Mono'] text-xs font-bold uppercase tracking-wider py-2 px-4 rounded-md shadow-sm cursor-pointer shrink-0 h-9"
                  onClick={() => {
                    setViewingUsedQuestionsExam(null);
                    setUsedQuestionsPage(1);
                  }}
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                  CLOSE
                </Button>
              </div>
            </DialogHeader>

            <div className="flex-1 flex flex-col overflow-hidden p-6 bg-muted/5">
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {loadingUsedQuestions ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <p className="text-muted-foreground font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">RETRIEVING_VAULT_DATA</p>
                  </div>
                ) : usedQuestions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center font-['IBM_Plex_Mono'] text-muted-foreground">
                    <HelpCircle className="w-10 h-10 opacity-30 mb-3" />
                    <p className="text-xs uppercase tracking-wider">No previously used questions found</p>
                    <p className="text-[10px] opacity-75 mt-1">No students have taken an attempt under this preset yet.</p>
                  </div>
                ) : (
                  paginatedUsedQuestions.map((q, idx) => {
                    const absoluteIdx = (usedQuestionsPage - 1) * pageSize + idx + 1;
                    const questionText = getFirstLineOfQuestion(q.question);
                    return (
                      <div 
                        key={q._id} 
                        className="bg-card border border-border rounded-xl p-4 shadow-sm hover:border-primary/30 transition-all flex items-start justify-between gap-4 font-sans"
                      >
                        <div className="flex gap-3 items-start overflow-hidden w-full">
                          <span className="w-8 h-8 rounded bg-muted border border-border flex items-center justify-center font-['IBM_Plex_Mono'] font-bold text-xs text-muted-foreground shrink-0 mt-0.5">
                            {String(absoluteIdx).padStart(2, '0')}
                          </span>
                          <div className="overflow-hidden flex-1">
                            <p className="text-sm font-semibold text-foreground truncate max-w-full">
                              {questionText || '(Empty Question text)'}
                            </p>
                            <div className="flex gap-2.5 mt-1.5 font-['IBM_Plex_Mono'] text-[10px] uppercase text-muted-foreground font-semibold">
                              <span className="border border-border bg-muted/30 px-1.5 py-0.5 rounded">
                                {q.type}
                              </span>
                              <span className="border border-border bg-muted/30 px-1.5 py-0.5 rounded">
                                Score: +{q.marks} / -{q.negativeMarks || 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Pagination Controls */}
              {!loadingUsedQuestions && totalUsedPages > 1 && (
                <div className="flex items-center justify-between border-t border-border pt-4 mt-6 shrink-0 font-['IBM_Plex_Mono']">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUsedQuestionsPage(prev => Math.max(prev - 1, 1))}
                    disabled={usedQuestionsPage === 1}
                    className="text-xs font-bold uppercase shadow-none rounded cursor-pointer h-9 px-3"
                  >
                    PREVIOUS
                  </Button>
                  <span className="text-xs text-muted-foreground font-bold uppercase">
                    PAGE {usedQuestionsPage} OF {totalUsedPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUsedQuestionsPage(prev => Math.min(prev + 1, totalUsedPages))}
                    disabled={usedQuestionsPage === totalUsedPages}
                    className="text-xs font-bold uppercase shadow-none rounded cursor-pointer h-9 px-3"
                  >
                    NEXT
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
      <ExamBuilderDialog open={builderOpen} exam={editingExam} onClose={() => setBuilderOpen(false)} onSaved={fetchExams} />
    </div>
  )
}
