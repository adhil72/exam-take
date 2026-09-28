import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Clock, Pause, Play, Square, Plus } from 'lucide-react'
import type { ActiveSession } from '@/types'

interface SessionControlsProps {
  activeSession: ActiveSession | null
  timeLeft: number
  formatTime: (ms: number) => string
  extendMinutes: string
  setExtendMinutes: (v: string) => void
  onPause: () => void
  onResume: () => void
  onExtendTime: () => void
  onEndExam: () => void
}

export function SessionControls({
  activeSession,
  timeLeft,
  formatTime,
  extendMinutes,
  setExtendMinutes,
  onPause,
  onResume,
  onExtendTime,
  onEndExam,
}: SessionControlsProps) {
  if (!activeSession) return null

  return (
    <div className="border-t bg-muted/30 px-6 py-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

        {/* Timer */}
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Clock className="size-5" />
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Server Timer
            </div>
            <div className={`font-mono text-2xl font-extrabold tabular-nums tracking-tight ${
              timeLeft < 60000 ? 'text-destructive' :
              timeLeft < 300000 ? 'text-amber-600' :
              'text-primary'
            }`}>
              {timeLeft > 0 ? formatTime(timeLeft) : '00:00'}
            </div>
          </div>
          {timeLeft < 60000 && timeLeft > 0 && (
            <Badge variant="destructive" className="animate-pulse">Critical</Badge>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Pause / Resume */}
          {activeSession.status === 'in_progress' ? (
            <Button variant="outline" onClick={onPause} className="border-amber-500/50 text-amber-600 hover:bg-amber-50 hover:text-amber-700">
              <Pause className="size-4 mr-1.5" />
              Pause
            </Button>
          ) : activeSession.status === 'paused' ? (
            <Button onClick={onResume} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Play className="size-4 mr-1.5" />
              Resume
            </Button>
          ) : null}

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Extend Time */}
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              value={extendMinutes}
              onChange={(e) => setExtendMinutes(e.target.value)}
              className="w-16 text-center font-mono font-bold"
              min={1}
            />
            <Button variant="outline" onClick={onExtendTime}>
              <Plus className="size-4 mr-1" />
              Extend min
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* End Exam */}
          <Button variant="destructive" onClick={onEndExam}>
            <Square className="size-3.5 mr-1.5" />
            End Exam
          </Button>
        </div>
      </div>
    </div>
  )
}
