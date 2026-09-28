import { useNavigate } from '@tanstack/react-router'
import { useView } from './use-view'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Activity, Search, Monitor } from 'lucide-react'
import { StatsBar } from './components/stats-bar'
import { StudentCard } from './components/student-card'
import { ActivitySidebar } from './components/activity-sidebar'
import { SessionControls } from './components/session-controls'
import { EndSessionModal } from './components/end-session-modal'

export default function AdminMonitorPage() {
  const navigate = useNavigate()
  const {
    activeSession,
    examTitle,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    timeLeft,
    broadcastMsg,
    setBroadcastMsg,
    activityLogs,
    setActivityLogs,
    soundEnabled,
    setSoundEnabled,
    extendMinutes,
    setExtendMinutes,
    showEndModal,
    setShowEndModal,
    endConfirmationText,
    setEndConfirmationText,
    logsEndRef,
    handlePauseExam,
    handleResumeExam,
    handleExtendTime,
    handleEndExam,
    handleForceSubmit,
    handleKick,
    handleUnlock,
    handleBroadcast,
    filteredAttempts,
    formatTime,
    totalStudents,
    connectedCount,
    submittedCount,
    avgCompletion,
  } = useView()

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background select-none">

      {/* ─── Header ─── */}
      <header className="flex items-center justify-between border-b bg-background px-6 py-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => navigate({ to: '/admin/lobby' })}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div>
            <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
              <Activity className="size-4 text-primary" />
              {examTitle}
            </h1>
            <p className="text-xs text-muted-foreground">Live Session Monitor</p>
          </div>
        </div>

        {/* Timer + Status */}
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1 rounded-md font-mono text-lg font-extrabold tabular-nums ${
            timeLeft < 60000
              ? 'bg-destructive/10 text-destructive'
              : timeLeft < 300000
                ? 'bg-amber-100 text-amber-700'
                : 'bg-primary/10 text-primary'
          }`}>
            {formatTime(timeLeft)}
          </div>
          <Badge
            variant={activeSession?.status === 'in_progress' ? 'default' : 'secondary'}
            className="capitalize"
          >
            <span className={`size-1.5 rounded-full mr-1.5 ${
              activeSession?.status === 'in_progress' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            }`} />
            {activeSession?.status?.replace('_', ' ') || 'Loading'}
          </Badge>
        </div>
      </header>

      {/* ─── Main Content ─── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left — Stats + Students Grid + Controls */}
        <div className="flex flex-1 flex-col overflow-hidden">

          {/* Stats row */}
          <div className="p-6 pb-0">
            <StatsBar
              connectedCount={connectedCount}
              totalStudents={totalStudents}
              submittedCount={submittedCount}
              avgCompletion={avgCompletion}
            />
          </div>

          {/* Filter bar */}
          <div className="flex flex-col gap-3 px-6 py-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search students, PCs, batches…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="h-8 cursor-pointer rounded-lg border border-input bg-background px-2.5 text-sm outline-none transition-colors focus:border-ring"
              >
                <option value="all">All States</option>
                <option value="in_progress">In Progress</option>
                <option value="offline">Offline</option>
                <option value="submitted">Submitted</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="h-8 cursor-pointer rounded-lg border border-input bg-background px-2.5 text-sm outline-none transition-colors focus:border-ring"
              >
                <option value="progress">By Progress</option>
                <option value="name">By Name</option>
                <option value="machine">By Machine</option>
              </select>
            </div>
          </div>

          {/* Student cards grid */}
          <ScrollArea className="flex-1 min-h-0 px-6 pb-4">
            {filteredAttempts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Monitor className="size-10 mb-3 opacity-40" />
                <p className="text-sm font-medium">No students found</p>
                <p className="text-xs mt-1">Make sure clients are connected in the lobby.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {filteredAttempts.map((item) => (
                  <StudentCard
                    key={item._id}
                    item={item}
                    onForceSubmit={handleForceSubmit}
                    onKick={handleKick}
                    onUnlock={handleUnlock}
                  />
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Session controls at bottom */}
          <SessionControls
            activeSession={activeSession}
            timeLeft={timeLeft}
            formatTime={formatTime}
            extendMinutes={extendMinutes}
            setExtendMinutes={setExtendMinutes}
            onPause={handlePauseExam}
            onResume={handleResumeExam}
            onExtendTime={handleExtendTime}
            onEndExam={() => setShowEndModal(true)}
          />
        </div>

        {/* Right — Activity Sidebar */}
        <ActivitySidebar
          activityLogs={activityLogs}
          setActivityLogs={setActivityLogs}
          soundEnabled={soundEnabled}
          setSoundEnabled={setSoundEnabled}
          broadcastMsg={broadcastMsg}
          setBroadcastMsg={setBroadcastMsg}
          handleBroadcast={handleBroadcast}
          logsEndRef={logsEndRef as any}
        />
      </div>

      {/* ─── End Session Dialog ─── */}
      <EndSessionModal
        open={showEndModal}
        endConfirmationText={endConfirmationText}
        setEndConfirmationText={setEndConfirmationText}
        onConfirm={handleEndExam}
        onCancel={() => {
          setShowEndModal(false)
          setEndConfirmationText('')
        }}
      />
    </div>
  )
}
