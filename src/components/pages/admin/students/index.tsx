import { useEffect, useState } from 'react'
import axios from 'axios'
import { Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import { ArrowLeft, Pencil, Trash2, UserPlus, Upload, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import confirm from '@/lib/confirm'

interface StudentRow {
  _id: string
  name: string
  email: string
  batch: string
  registerNumber: string
  phone: string
}

const empty = { name: '', email: '', batch: '', registerNumber: '', phone: '' }
const mono = "font-['IBM_Plex_Mono']"

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<StudentRow[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)

  const [importOpen, setImportOpen] = useState(false)
  const [importText, setImportText] = useState('')

  const load = async () => {
    try {
      const res = await axios.get('/api/admin/students', { params: { search, limit: 1000 } })
      setStudents(res.data.students || [])
      setTotal(res.data.total || 0)
    } catch {
      toast.error('Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const t = setTimeout(load, 250)
    return () => clearTimeout(t)
  }, [search])

  const openForm = (s?: StudentRow) => {
    setEditingId(s?._id || null)
    setForm(s ? { name: s.name, email: s.email, batch: s.batch, registerNumber: s.registerNumber, phone: s.phone } : empty)
    setFormOpen(true)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editingId) await axios.put(`/api/admin/students/${editingId}`, form)
      else await axios.post('/api/admin/students', form)
      toast.success(editingId ? 'Student updated' : 'Student added')
      setFormOpen(false)
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save student')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (s: StudentRow) => {
    if (!(await confirm(`Delete ${s.name}? Past results keep their attempt data.`, { type: 'error', confirmText: 'Delete' }))) return
    try {
      await axios.delete(`/api/admin/students/${s._id}`)
      toast.success('Student deleted')
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete student')
    }
  }

  // One student per line: name, email, batch, register number, phone (only name is required)
  const runImport = async () => {
    const rows = importText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        const [name, email, batch, registerNumber, phone] = l.split(/[,\t]/).map((x) => x.trim())
        return { name, email, batch, registerNumber, phone }
      })
    try {
      const res = await axios.post('/api/admin/students/bulk', { students: rows })
      toast.success(`Imported ${res.data.added} students${res.data.skipped ? `, skipped ${res.data.skipped}` : ''}`)
      setImportOpen(false)
      setImportText('')
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Import failed')
    }
  }

  const field = (key: keyof typeof empty, label: string, required = false) => (
    <div className="space-y-1.5">
      <Label className={`${mono} text-xs uppercase tracking-wider text-muted-foreground`}>{label}{required && ' *'}</Label>
      <Input required={required} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="h-10 bg-card" />
    </div>
  )

  return (
    <div className="min-h-screen bg-background text-foreground font-['Inter']">
      <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border px-6 md:px-8 py-4">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/admin/dashboard">
              <Button variant="ghost" size="icon" className="h-9 w-9 cursor-pointer"><ArrowLeft className="w-4 h-4" /></Button>
            </Link>
            <div>
              <h2 className="text-2xl font-bold tracking-tight font-['Space_Grotesk'] uppercase">Students</h2>
              <p className={`${mono} text-[10px] text-muted-foreground uppercase tracking-widest`}>SYS_ROSTER // {total} REGISTERED</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setImportOpen(true)} className="gap-2 cursor-pointer"><Upload className="w-4 h-4" />Bulk import</Button>
            <Button onClick={() => openForm()} className="gap-2 cursor-pointer"><UserPlus className="w-4 h-4" />Add student</Button>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto p-6 md:p-8 space-y-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email, batch or register number…" className="pl-10 h-11 bg-card rounded-xl" />
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {loading ? (
            <p className="p-8 text-center text-sm text-muted-foreground">Loading…</p>
          ) : students.length === 0 ? (
            <p className="p-10 text-center text-sm text-muted-foreground">
              {search ? 'No students match your search.' : 'No students yet. Add one, or bulk import a list.'}
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className={`${mono} text-[11px] uppercase tracking-wider text-muted-foreground bg-muted/30`}>
                <tr>
                  <th className="text-left p-3">Name</th>
                  <th className="text-left p-3 hidden md:table-cell">Email</th>
                  <th className="text-left p-3">Batch</th>
                  <th className="text-left p-3 hidden md:table-cell">Reg. no</th>
                  <th className="p-3 w-24" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {students.map((s) => (
                  <tr key={s._id} className="hover:bg-muted/20">
                    <td className="p-3 font-semibold">{s.name}</td>
                    <td className="p-3 text-muted-foreground hidden md:table-cell">{s.email || '—'}</td>
                    <td className="p-3">{s.batch || '—'}</td>
                    <td className="p-3 text-muted-foreground hidden md:table-cell">{s.registerNumber || '—'}</td>
                    <td className="p-2 text-right whitespace-nowrap">
                      <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer" onClick={() => openForm(s)}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive cursor-pointer" onClick={() => remove(s)}><Trash2 className="w-4 h-4" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md bg-card border border-border rounded-xl p-6">
          <DialogHeader>
            <DialogTitle className="font-['Space_Grotesk'] uppercase">{editingId ? 'Edit student' : 'Add student'}</DialogTitle>
            <DialogDescription className="sr-only">Student details</DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="space-y-3">
            {field('name', 'Full name', true)}
            <div className="grid grid-cols-2 gap-3">
              {field('batch', 'Batch')}
              {field('registerNumber', 'Register no.')}
            </div>
            {field('email', 'Email')}
            {field('phone', 'Phone')}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setFormOpen(false)} className="cursor-pointer">Cancel</Button>
              <Button type="submit" disabled={saving || !form.name.trim()} className="cursor-pointer">{saving ? 'Saving…' : 'Save'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="sm:max-w-lg bg-card border border-border rounded-xl p-6">
          <DialogHeader>
            <DialogTitle className="font-['Space_Grotesk'] uppercase">Bulk import</DialogTitle>
            <DialogDescription className="text-xs">
              One student per line: <code>name, email, batch, register no, phone</code> — only the name is required. Paste from a spreadsheet works too.
            </DialogDescription>
          </DialogHeader>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            rows={10}
            placeholder={'Asha K, asha@example.com, CS-A\nRavi P, , CS-B'}
            className="w-full rounded-lg border border-input bg-card p-3 text-sm font-mono"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setImportOpen(false)} className="cursor-pointer">Cancel</Button>
            <Button onClick={runImport} disabled={!importText.trim()} className="cursor-pointer">Import</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
