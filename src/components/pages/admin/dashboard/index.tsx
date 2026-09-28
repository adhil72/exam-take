import { Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import {
  ArrowRight,
  ChevronRight,
  Copy,
  History,
  ListTodo,
  LogOut,
  Moon,
  Activity,
  RefreshCw,
  Sun,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useView } from './use-view'

const rowCls =
  'group flex items-center gap-4 px-4 py-3.5 hover:bg-accent/60 focus-visible:bg-accent/60 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring transition-colors'

function ListRow({
  to,
  icon: Icon,
  step,
  title,
  detail,
  value,
}: {
  to: string
  icon: React.ElementType
  step?: number
  title: string
  detail: string
  value?: string
}) {
  return (
    <Link to={to} className={rowCls}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-medium text-foreground">
          {step && <span className="mr-2 text-muted-foreground tabular-nums">{step}</span>}
          {title}
        </span>
        <span className="block text-[13px] text-muted-foreground">{detail}</span>
      </span>
      {value && <span className="text-[15px] tabular-nums text-muted-foreground">{value}</span>}
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/70 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
    </Link>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="px-1 text-[13px] font-medium text-muted-foreground">{title}</h3>
      <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">{children}</div>
    </section>
  )
}

export default function AdminDashboardPage() {
  const { logout, user, toggleTheme, isDark, examsCount, studentsCount, clients, activeSession, serverAddress, loading, refetch } =
    useView()

  const connected = clients.filter((c) => c.status !== 'disconnected' && c.status !== 'rejected')
  const assigned = connected.filter((c) => c.studentId)

  // The "Now" panel answers: what state is the lab in, and what should I do next?
  const live = activeSession && ['in_progress', 'paused'].includes(activeSession.status)
  const inLobby = activeSession && !live
  let now: { label: string; title: string; detail: string; cta: string; to: string; tone: 'idle' | 'lobby' | 'live' }
  if (live) {
    now = {
      label: activeSession.status === 'paused' ? 'Paused' : 'Live',
      title: activeSession.examTitle || 'Exam in progress',
      detail: `${assigned.length} student${assigned.length === 1 ? '' : 's'} sitting the exam`,
      cta: 'Open live monitor',
      to: '/admin/monitor',
      tone: 'live',
    }
  } else if (inLobby) {
    now = {
      label: 'Lobby open',
      title: activeSession.examTitle || 'Waiting for students',
      detail: `${connected.length} machine${connected.length === 1 ? '' : 's'} connected, ${assigned.length} assigned to a student`,
      cta: 'Open lobby',
      to: '/admin/lobby',
      tone: 'lobby',
    }
  } else if (studentsCount === 0) {
    now = { label: 'Getting started', title: 'Add your students', detail: 'You need at least one student before you can host an exam.', cta: 'Add students', to: '/admin/students', tone: 'idle' }
  } else if (examsCount === 0) {
    now = { label: 'Getting started', title: 'Create your first exam', detail: 'Pick a stream and topics from the GATE question bank.', cta: 'Create exam', to: '/admin/exams', tone: 'idle' }
  } else {
    now = { label: 'Ready', title: 'Ready to host an exam', detail: `${studentsCount} students and ${examsCount} exam${examsCount === 1 ? '' : 's'} set up.`, cta: 'Host an exam', to: '/admin/exams', tone: 'idle' }
  }

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(serverAddress)
      toast.success('Address copied')
    } catch {
      toast.error('Copy failed — select the address and copy it manually')
    }
  }

  return (
    <div className="min-h-screen bg-background font-['Inter'] text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
          <div className="flex items-baseline gap-3">
            <span className="text-[17px] font-semibold tracking-tight">GExam</span>
            <span className="hidden text-[13px] text-muted-foreground sm:inline">Signed in as {user.email}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={refetch} disabled={loading} aria-label="Refresh" className="h-9 w-9 cursor-pointer text-muted-foreground">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin motion-reduce:animate-none' : ''}`} />
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={isDark ? 'Switch to light appearance' : 'Switch to dark appearance'} className="h-9 w-9 cursor-pointer text-muted-foreground">
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" onClick={logout} className="h-9 cursor-pointer gap-2 px-3 text-[13px] text-muted-foreground">
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-5 py-8">
        <div className="grid gap-5 lg:grid-cols-3">
          {/* Now */}
          <section
            aria-live="polite"
            className="flex flex-col justify-between gap-8 rounded-2xl border border-border bg-card p-6 lg:col-span-2"
          >
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
                <span
                  className={`h-2 w-2 rounded-full ${
                    now.tone === 'live' ? 'bg-primary motion-safe:animate-pulse' : now.tone === 'lobby' ? 'bg-amber-500' : 'bg-muted-foreground/40'
                  }`}
                />
                {now.label}
              </div>
              <h1 className="text-[28px] font-semibold leading-tight tracking-tight">{now.title}</h1>
              <p className="text-[15px] text-muted-foreground">{now.detail}</p>
            </div>
            <div>
              <Link to={now.to}>
                <Button className="h-11 cursor-pointer gap-2 rounded-xl px-5 text-[15px] font-medium">
                  {now.cta}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </section>

          {/* Connect machines */}
          <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
            <div>
              <h2 className="text-[15px] font-semibold">Student machines</h2>
              <p className="mt-1 text-[13px] text-muted-foreground">Open this address in a browser on each lab PC.</p>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 py-1.5 pl-3 pr-1.5">
              <code className="min-w-0 flex-1 truncate font-mono text-[13px] text-foreground select-all">{serverAddress}</code>
              <Button variant="ghost" size="icon" onClick={copyAddress} aria-label="Copy address" className="h-8 w-8 shrink-0 cursor-pointer text-muted-foreground">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <dl className="mt-auto grid grid-cols-2 gap-4 text-[13px]">
              <div>
                <dt className="text-muted-foreground">Connected</dt>
                <dd className="text-2xl font-semibold tabular-nums">{connected.length}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">With a student</dt>
                <dd className="text-2xl font-semibold tabular-nums">{assigned.length}</dd>
              </div>
            </dl>
          </section>
        </div>

        <Section title="Set up">
          <ListRow to="/admin/students" icon={Users} step={1} title="Students" detail="Add, import and edit the people sitting exams." value={String(studentsCount)} />
          <ListRow to="/admin/exams" icon={ListTodo} step={2} title="Exams" detail="Build exams from the GATE question bank and host them." value={String(examsCount)} />
        </Section>

        <Section title="Run and review">
          <ListRow to="/admin/monitor" icon={Activity} title="Live monitor" detail="Watch progress, pause, extend time or end the exam." />
          <ListRow to="/admin/history" icon={History} title="History" detail="Scorecards and answer sheets from past sessions." />
        </Section>
      </main>
    </div>
  )
}
