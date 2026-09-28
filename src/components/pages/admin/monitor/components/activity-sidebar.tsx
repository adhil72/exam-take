import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Activity, Volume2, VolumeX, Send, Trash2 } from 'lucide-react'
import type { LogEntry } from '@/types'
import type { RefObject } from 'react'

interface ActivitySidebarProps {
  activityLogs: LogEntry[]
  setActivityLogs: (logs: LogEntry[]) => void
  soundEnabled: boolean
  setSoundEnabled: (v: boolean) => void
  broadcastMsg: string
  setBroadcastMsg: (v: string) => void
  handleBroadcast: (e: React.FormEvent) => void
  logsEndRef: RefObject<HTMLDivElement>
}


const logBorderColor: Record<string, string> = {
  info: 'border-l-muted-foreground/30',
  warning: 'border-l-amber-500',
  success: 'border-l-emerald-500',
  danger: 'border-l-destructive',
}

export function ActivitySidebar({
  activityLogs,
  setActivityLogs,
  soundEnabled,
  setSoundEnabled,
  broadcastMsg,
  setBroadcastMsg,
  handleBroadcast,
  logsEndRef,
}: ActivitySidebarProps) {
  return (
    <aside className="flex w-full flex-col border-t lg:w-[360px] lg:border-t-0 lg:border-l shrink-0">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <Activity className="size-4 text-primary" />
          <span className="text-sm font-semibold">Activity Feed</span>
          {activityLogs.length > 0 && (
            <Badge variant="secondary" className="text-[10px] tabular-nums">
              {activityLogs.length}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Mute alerts' : 'Unmute alerts'}
          >
            {soundEnabled
              ? <Volume2 className="size-3.5 text-emerald-600" />
              : <VolumeX className="size-3.5 text-muted-foreground" />
            }
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setActivityLogs([])}
            title="Clear logs"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Scrollable log feed */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-3 space-y-1.5">
          {activityLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Activity className="size-5 mb-2 opacity-40" />
              <p className="text-xs">Waiting for events…</p>
            </div>
          ) : (
            activityLogs.map((log) => (
              <div
                key={log.id}
                className={`rounded-md border-l-2 bg-muted/30 px-3 py-2 text-xs leading-relaxed ${logBorderColor[log.type] || logBorderColor.info}`}
              >
                <span className="mr-1.5 font-mono text-[10px] text-muted-foreground">
                  {log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <span className="text-foreground/80">{log.message}</span>
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
      </ScrollArea>

      <Separator />

      {/* Broadcast panel */}
      <div className="p-3">
        <Card size="sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5 text-xs">
              📢 Broadcast
            </CardTitle>
            <CardDescription className="text-[11px]">
              Send a message to all student screens.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleBroadcast} className="flex gap-2">
              <Input
                value={broadcastMsg}
                onChange={(e) => setBroadcastMsg(e.target.value)}
                placeholder="Type announcement…"
                className="flex-1 text-xs"
                maxLength={120}
                required
              />
              <Button type="submit" size="icon">
                <Send className="size-3.5" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </aside>
  )
}
