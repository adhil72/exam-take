import { useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'sonner'
import { Plus, Trash2, AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

interface Topic { topicId: string; topicName: string; count: number; byYear: Record<string, number>; byYearMark: Record<string, Record<string, number>> }
interface Stream { streamId: string; name: string; years: string[]; topics: Topic[] }
interface TopicConfig { topicId: string; topicName: string; marks: number | null; count: number }

const rowKey = (c: { topicId: string; marks: number | null }) => `${c.topicId}|${c.marks ?? 'any'}`

interface Props {
  open: boolean
  exam: any | null // null = create
  onClose: () => void
  onSaved: () => void
}

const mono = "font-['IBM_Plex_Mono']"

export function ExamBuilderDialog({ open, exam, onClose, onSaved }: Props) {
  const [streams, setStreams] = useState<Stream[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [patternLoading, setPatternLoading] = useState(false)

  const [title, setTitle] = useState('')
  const [streamId, setStreamId] = useState('')
  const [duration, setDuration] = useState(180)
  const [years, setYears] = useState<string[]>([])
  const [config, setConfig] = useState<TopicConfig[]>([])

  useEffect(() => {
    if (!open) return
    setLoading(true)
    axios
      .get('/api/admin/streams')
      .then((res) => setStreams(res.data.streams || []))
      .catch(() => toast.error('Failed to load question bank streams'))
      .finally(() => setLoading(false))
  }, [open])

  useEffect(() => {
    if (!open) return
    setTitle(exam?.title || '')
    setStreamId(exam?.streamId || '')
    setDuration(exam?.duration || 180)
    setYears(exam?.years || [])
    setConfig((exam?.questionConfig || []).map((c: any) => ({ topicId: c.topicId, topicName: c.topicName, marks: c.marks ?? null, count: c.count })))
  }, [open, exam])

  const stream = streams.find((s) => s.streamId === streamId)

  // Questions available for a topic (optionally at a fixed mark value) under the current year filter
  const availableFor = (topicId: string, marks: number | null) => {
    const t = stream?.topics.find((x) => x.topicId === topicId)
    if (!t) return 0
    return (years.length ? years : stream!.years).reduce(
      (n, y) => n + (marks == null ? t.byYear[y] || 0 : t.byYearMark[y]?.[String(marks)] || 0),
      0
    )
  }

  const unusedTopics = (stream?.topics || []).filter((t) => !config.some((c) => c.topicId === t.topicId && c.marks === null))
  const allMarked = config.length > 0 && config.every((c) => c.marks)
  const totalMarks = allMarked ? config.reduce((n, c) => n + (c.count || 0) * (c.marks as number), 0) : null
  const totalQuestions = config.reduce((n, c) => n + (c.count || 0), 0)

  // Standard GATE paper (65 questions / 100 marks / 3 hours) for the stream
  const applyGatePattern = async (id: string, yearList: string[]) => {
    setPatternLoading(true)
    try {
      const res = await axios.get(`/api/admin/streams/${id}/gate-pattern`, { params: { years: yearList.join(',') } })
      setConfig(res.data.questionConfig)
      setDuration(res.data.duration)
    } catch {
      toast.error('Failed to load the GATE pattern')
    } finally {
      setPatternLoading(false)
    }
  }

  const changeStream = (id: string) => {
    setStreamId(id)
    setYears([])
    setConfig([])
    if (!id) return
    const s = streams.find((x) => x.streamId === id)
    if (s && !title.trim()) setTitle(`GATE ${id.toUpperCase()}`)
    applyGatePattern(id, [])
  }

  const toggleYear = (y: string) => setYears((prev) => (prev.includes(y) ? prev.filter((x) => x !== y) : [...prev, y]))

  const addTopic = (topicId: string) => {
    const t = stream?.topics.find((x) => x.topicId === topicId)
    if (t) setConfig((prev) => [...prev, { topicId: t.topicId, topicName: t.topicName, marks: null, count: 5 }])
  }

  const setCount = (key: string, count: number) =>
    setConfig((prev) => prev.map((c) => (rowKey(c) === key ? { ...c, count } : c)))

  const save = async () => {
    setSaving(true)
    try {
      const body = { title, streamId, duration, years, questionConfig: config }
      if (exam) await axios.put(`/api/admin/exams/${exam._id}`, body)
      else await axios.post('/api/admin/exams', body)
      toast.success(exam ? 'Exam updated' : 'Exam created')
      onSaved()
      onClose()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save exam')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !saving) onClose() }}>
      <DialogContent className="sm:max-w-2xl max-w-2xl max-h-[90vh] overflow-y-auto bg-card border border-border text-foreground rounded-xl p-6">
        <DialogHeader>
          <DialogTitle className="font-['Space_Grotesk'] text-xl font-bold uppercase tracking-wide">
            {exam ? 'Edit Exam' : 'Create Exam'}
          </DialogTitle>
          <DialogDescription className={`${mono} text-[10px] uppercase tracking-widest text-muted-foreground`}>
            Questions are drawn from the local gate-questions bank
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : streams.length === 0 ? (
          <p className="text-sm text-destructive py-6">
            No question bank found. Set QUESTIONS_DIR to your gate-questions folder and restart the server.
          </p>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label className={`${mono} text-xs uppercase tracking-wider text-muted-foreground`}>Exam name</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="GATE CSE" className="h-10 bg-card" />
              </div>
              <div className="space-y-1.5">
                <Label className={`${mono} text-xs uppercase tracking-wider text-muted-foreground`}>Duration (min)</Label>
                <Input type="number" min={1} value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="h-10 bg-card" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className={`${mono} text-xs uppercase tracking-wider text-muted-foreground`}>Stream</Label>
              <select
                value={streamId}
                onChange={(e) => changeStream(e.target.value)}
                className="w-full h-10 rounded-lg border border-input bg-card px-2.5 text-sm"
              >
                <option value="">Select a stream…</option>
                {streams.map((s) => (
                  <option key={s.streamId} value={s.streamId}>{s.name} ({s.streamId.toUpperCase()})</option>
                ))}
              </select>
            </div>

            {stream && (
              <>
                <div className="space-y-1.5">
                  <Label className={`${mono} text-xs uppercase tracking-wider text-muted-foreground`}>
                    Question years <span className="normal-case">(none selected = all years)</span>
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {stream.years.map((y) => (
                      <button
                        key={y}
                        type="button"
                        onClick={() => toggleYear(y)}
                        className={`px-3 py-1 rounded-md border text-xs font-bold ${mono} cursor-pointer ${
                          years.includes(y) ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/40 border-border text-muted-foreground'
                        }`}
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Label className={`${mono} text-xs uppercase tracking-wider text-muted-foreground`}>Topics</Label>
                      <Button type="button" variant="outline" disabled={patternLoading} onClick={() => applyGatePattern(streamId, years)} className="h-7 px-2.5 text-xs cursor-pointer">
                        {patternLoading ? 'Loading…' : 'Reset to GATE pattern'}
                      </Button>
                    </div>
                    <span className={`${mono} text-xs text-muted-foreground`}>
                      <strong className="text-foreground">{totalQuestions}</strong> questions
                      {totalMarks !== null && <> · <strong className="text-foreground">{totalMarks}</strong> marks</>}
                    </span>
                  </div>

                  {config.length === 0 && <p className="text-xs text-muted-foreground py-2">No topics added yet.</p>}

                  {config.map((c) => {
                    const key = rowKey(c)
                    const have = availableFor(c.topicId, c.marks)
                    const short = have < c.count
                    return (
                      <div key={key} className="flex items-center gap-3 p-2.5 border border-border rounded-lg bg-muted/20">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold truncate">
                            {c.topicName}
                            {c.marks && <span className="ml-2 text-xs font-medium text-muted-foreground">{c.marks}-mark</span>}
                          </div>
                          <div className={`text-[12px] ${short ? 'text-amber-600' : 'text-muted-foreground'} flex items-center gap-1`}>
                            {short && <AlertTriangle className="w-3 h-3" />}
                            {have} available{short ? ' — not enough' : ''}
                          </div>
                        </div>
                        <Input
                          type="number"
                          min={1}
                          value={c.count}
                          onChange={(e) => setCount(key, Number(e.target.value))}
                          className="w-20 h-9 bg-card text-center"
                        />
                        <Button variant="ghost" size="icon" aria-label={`Remove ${c.topicName}`} className="h-9 w-9 text-muted-foreground hover:text-destructive cursor-pointer"
                          onClick={() => setConfig((prev) => prev.filter((x) => rowKey(x) !== key))}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )
                  })}

                  {unusedTopics.length > 0 && (
                    <div className="flex items-center gap-2 pt-1">
                      <Plus className="w-4 h-4 text-muted-foreground shrink-0" />
                      <select
                        value=""
                        onChange={(e) => e.target.value && addTopic(e.target.value)}
                        className="flex-1 h-9 rounded-lg border border-input bg-card px-2.5 text-sm"
                      >
                        <option value="">Add a topic…</option>
                        {unusedTopics.map((t) => (
                          <option key={t.topicId} value={t.topicId}>{t.topicName} — {availableFor(t.topicId, null)} questions</option>
                        ))}
                      </select>
                      <Button
                        variant="outline"
                        className="h-9 text-xs cursor-pointer"
                        onClick={() => setConfig((prev) => [...prev, ...unusedTopics.map((t) => ({ topicId: t.topicId, topicName: t.topicName, marks: null, count: 5 }))])}
                      >
                        Add all
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <Button variant="ghost" onClick={onClose} disabled={saving} className="cursor-pointer">Cancel</Button>
              <Button onClick={save} disabled={saving || !title.trim() || !streamId || config.length === 0} className="cursor-pointer">
                {saving ? 'Saving…' : exam ? 'Save changes' : 'Create exam'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
