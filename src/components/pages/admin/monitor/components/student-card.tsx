import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { AlertTriangle, UserMinus, Unplug } from 'lucide-react'
import type { ClientAttempt } from '@/types'

interface StudentCardProps {
  item: ClientAttempt
  onForceSubmit: (clientId: string, studentName: string) => void
  onKick: (clientId: string, studentName: string) => void
  onUnlock: (clientId: string, studentName: string) => void
}

export function StudentCard({ item, onForceSubmit, onKick, onUnlock }: StudentCardProps) {
  const isOnline = item.client && item.client.status !== 'disconnected'
  const isLockedStatus = item.client?.status === 'locked'
  const totalQ = item.questions.length
  const answered = item.answeredCount
  const progressPct = totalQ > 0 ? Math.round((answered / totalQ) * 100) : 0
  const tabWarnings = item.tabSwitchCount || 0
  const currentIdx = item.currentQuestionId ? item.questions.indexOf(item.currentQuestionId) : -1
  const curQLabel = currentIdx >= 0 ? `Q${currentIdx + 1}` : '—'
  const isOutOfFocus = item.isLeft
  const isSubmitted = ['submitted', 'force_submitted', 'timed_out'].includes(item.status)
  const studentName = item.student?.name || 'Unknown'

  return (
    <Card className={`transition-all duration-200 ${
      isLockedStatus ? 'ring-2 ring-destructive border-destructive bg-red-50/5' :
      isOutOfFocus ? 'ring-2 ring-amber-500/60 border-amber-500/40' :
      !isOnline ? 'opacity-55' :
      isSubmitted ? 'ring-1 ring-emerald-500/30' :
      ''
    }`}>
      <CardHeader className="pb-2">
        {/* Name row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`size-2 rounded-full shrink-0 ${
              isLockedStatus ? 'bg-destructive animate-ping' :
              isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground/40'
            }`} />
            <span className="font-semibold text-sm truncate" title={studentName}>
              {studentName}
            </span>
          </div>
          <Badge variant="secondary" className="shrink-0 font-mono text-[10px]">
            {item.client?.machineName || '—'}
          </Badge>
        </div>

        {/* Batch + ID */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{item.student?.batch || 'No batch'}</span>
          {isSubmitted ? (
            <Badge variant="outline" className="text-emerald-600 border-emerald-200 text-[10px]">
              ✓ Submitted
            </Badge>
          ) : isLockedStatus ? (
            <Badge variant="destructive" className="text-[10px] animate-pulse flex items-center gap-1 font-bold">
              🔒 Locked
            </Badge>
          ) : (
            <Badge variant={isOnline ? 'outline' : 'secondary'} className="text-[10px]">
              {isOnline ? 'Online' : 'Offline'}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Tab switch warning banner */}
        {isLockedStatus ? (
          <div className="flex items-center justify-center gap-1.5 rounded-md bg-destructive/10 border border-destructive/20 px-2 py-1.5 text-xs font-semibold text-destructive animate-pulse">
            <AlertTriangle className="size-3.5" />
            Security Lock: Focus Lost
          </div>
        ) : isOutOfFocus ? (
          <div className="flex items-center justify-center gap-1.5 rounded-md bg-amber-500/10 border border-amber-500/20 px-2 py-1.5 text-xs font-semibold text-amber-600">
            <AlertTriangle className="size-3.5" />
            Student Left Exam Tab
          </div>
        ) : null}

        {/* Metrics row */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-md bg-muted/50 px-2 py-1.5">
            <div className="text-[10px] text-muted-foreground">Position</div>
            <div className="font-mono text-xs font-bold">{curQLabel}</div>
          </div>
          <div className="rounded-md bg-muted/50 px-2 py-1.5">
            <div className="text-[10px] text-muted-foreground">Answered</div>
            <div className="font-mono text-xs font-bold">{answered}/{totalQ}</div>
          </div>
          <div className={`rounded-md px-2 py-1.5 ${
            tabWarnings > 0 ? 'bg-destructive/10' : 'bg-muted/50'
          }`}>
            <div className="text-[10px] text-muted-foreground">Warnings</div>
            <div className={`font-mono text-xs font-bold ${
              tabWarnings > 0 ? 'text-destructive' : ''
            }`}>
              {tabWarnings}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <Progress value={progressPct}>
          <span className="text-xs text-muted-foreground">Progress</span>
          <span className="text-xs text-muted-foreground tabular-nums ml-auto">{progressPct}%</span>
        </Progress>
      </CardContent>

      {/* Action buttons */}
      {!isSubmitted && (
        <CardFooter className="flex-col gap-2">
          {isLockedStatus && (
            <Button
              size="sm"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-1"
              onClick={() => onUnlock(item.clientId, studentName)}
            >
              🔓 Unlock & Resume
            </Button>
          )}
          <div className="flex w-full gap-2">
            <Button
              size="sm"
              variant="destructive"
              className="flex-1"
              onClick={() => onForceSubmit(item.clientId, studentName)}
            >
              <UserMinus className="size-3.5" />
              Force Submit
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => onKick(item.clientId, studentName)}
            >
              <Unplug className="size-3.5" />
              Kick
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  )
}
