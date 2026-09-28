import { Card, CardHeader, CardDescription, CardTitle, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Users, CheckCircle2, Activity } from 'lucide-react'

interface StatsBarProps {
  connectedCount: number
  totalStudents: number
  submittedCount: number
  avgCompletion: number
}

export function StatsBar({ connectedCount, totalStudents, submittedCount, avgCompletion }: StatsBarProps) {
  const onlinePct = totalStudents > 0 ? Math.round((connectedCount / totalStudents) * 100) : 0
  const submittedPct = totalStudents > 0 ? Math.round((submittedCount / totalStudents) * 100) : 0

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

      {/* Online PCs */}
      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center gap-1.5">
            <Users className="size-3.5 text-primary" />
            Online PCs
          </CardDescription>
          <CardTitle className="text-2xl font-extrabold tabular-nums">
            {connectedCount}
            <span className="text-sm font-normal text-muted-foreground"> / {totalStudents}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={onlinePct}>
            <span className="text-xs text-muted-foreground tabular-nums">{onlinePct}%</span>
          </Progress>
        </CardContent>
      </Card>

      {/* Submissions */}
      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5 text-emerald-600" />
            Submitted
          </CardDescription>
          <CardTitle className="text-2xl font-extrabold tabular-nums">
            {submittedCount}
            <span className="text-sm font-normal text-muted-foreground"> / {totalStudents}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={submittedPct}>
            <span className="text-xs text-muted-foreground tabular-nums">{submittedPct}%</span>
          </Progress>
        </CardContent>
      </Card>

      {/* Avg Completion */}
      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center gap-1.5">
            <Activity className="size-3.5 text-amber-600" />
            Average Completion
          </CardDescription>
          <CardTitle className="text-2xl font-extrabold tabular-nums">
            {avgCompletion}%
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={avgCompletion}>
            <span className="text-xs text-muted-foreground">questions answered</span>
          </Progress>
        </CardContent>
      </Card>
    </div>
  )
}
