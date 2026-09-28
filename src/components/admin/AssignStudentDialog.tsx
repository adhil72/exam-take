import { useState, useEffect } from 'react'
import axios from 'axios'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { UserPlus } from 'lucide-react'

import { Student } from '@/types'


interface AssignStudentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  machineName: string;
  onAssign: (studentId: string) => Promise<void>;
  assignedStudentIds: string[];
}

export function AssignStudentDialog({
  isOpen,
  onClose,
  machineName,
  onAssign,
  assignedStudentIds
}: AssignStudentDialogProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(false)
  const [assigningId, setAssigningId] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newBatch, setNewBatch] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [addError, setAddError] = useState<string | null>(null)

  // Quick-add a student and assign them to this machine straight away
  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddError(null)
    setAssigningId('new')
    try {
      const res = await axios.post('/api/admin/students', { name: newName, batch: newBatch, email: newEmail })
      await onAssign(res.data.student._id)
      onClose()
    } catch (err: any) {
      setAddError(err.response?.data?.error || 'Failed to add student')
    } finally {
      setAssigningId(null)
    }
  }

  useEffect(() => {
    if (!isOpen) return

    const fetchStudents = async () => {
      setLoading(true)
      try {
        const res = await axios.get('/api/admin/students', {
          params: { search: searchQuery, limit: 30 }
        })
        if (res.data.success) {
          setStudents(res.data.students || [])
        }
      } catch (err) {
        console.error('Error searching students:', err)
      } finally {
        setLoading(false)
      }
    }

    // Debounce search query
    const delayDebounceFn = setTimeout(() => {
      fetchStudents()
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery, isOpen])

  // Clear search query on open/close
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('')
      setStudents([])
      setShowAdd(false)
      setNewName('')
      setNewBatch('')
      setNewEmail('')
      setAddError(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  // Filter out students already assigned elsewhere
  const availableStudents = students.filter(
    (student) => !assignedStudentIds.includes(student._id)
  )

  const handleSelect = async (studentId: string) => {
    setAssigningId(studentId)
    try {
      await onAssign(studentId)
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setAssigningId(null)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
      <Card className="w-full max-w-md shadow-2xl bg-card text-card-foreground border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-bold text-foreground">Assign Student</CardTitle>
          <CardDescription className="text-muted-foreground text-sm mt-1">
            Select student attendee for machine <strong className="text-foreground">{machineName}</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="dialog-search" className="text-foreground text-xs font-semibold uppercase tracking-wider">Search Student</Label>
            <div className="flex gap-2">
              <Input 
                id="dialog-search"
                type="text"
                placeholder="Search by name, email, or batch..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-muted/50 border-border text-foreground focus-visible:bg-background placeholder:text-muted-foreground text-sm"
                autoFocus
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAdd((v) => !v)}
                className="px-3 shrink-0 flex items-center justify-center gap-1.5 text-xs font-semibold text-foreground bg-muted/50 border border-border hover:bg-accent h-9"
                title="Add a new student"
              >
                <UserPlus className="w-3.5 h-3.5" />
                New
              </Button>
            </div>
          </div>

          {showAdd && (
            <form onSubmit={handleQuickAdd} className="space-y-2 p-3 border border-border rounded-lg bg-muted/50">
              <Input required autoFocus placeholder="Full name *" value={newName} onChange={(e) => setNewName(e.target.value)} className="bg-background text-sm" />
              <div className="flex gap-2">
                <Input placeholder="Batch" value={newBatch} onChange={(e) => setNewBatch(e.target.value)} className="bg-background text-sm w-1/3" />
                <Input type="email" placeholder="Email (optional)" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="bg-background text-sm flex-1" />
              </div>
              {addError && <p className="text-xs text-destructive font-medium">{addError}</p>}
              <Button type="submit" disabled={assigningId !== null || !newName.trim()} className="w-full h-9 text-sm">
                {assigningId === 'new' ? 'Adding…' : `Add & assign to ${machineName}`}
              </Button>
            </form>
          )}

          <div className="max-h-60 overflow-y-auto divide-y divide-border border border-border rounded-lg bg-muted/30">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground text-sm flex flex-col items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                Searching students...
              </div>
            ) : availableStudents.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm italic">
                {searchQuery ? 'No matching students — use “New” to add one' : 'No students yet — use “New” to add one'}
              </div>
            ) : (
              availableStudents.map((student) => (
                <button
                  key={student._id}
                  disabled={assigningId !== null}
                  onClick={() => handleSelect(student._id)}
                  className="w-full text-left p-3 hover:bg-accent disabled:opacity-50 cursor-pointer transition-colors flex items-center gap-3 border-none bg-transparent outline-none group"
                >
                  <div className="w-9 h-9 rounded-full overflow-hidden border border-border bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground shrink-0">
                    {student.photoUrl ? (
                      <img src={student.photoUrl} alt={student.name} className="w-full h-full object-cover" />
                    ) : (
                      student.name.charAt(0)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground truncate text-sm group-hover:text-primary transition-colors">{student.name}</div>
                    <div className="text-xs text-muted-foreground truncate mt-0.5">{student.email}</div>
                  </div>
                  <div className="text-xs font-semibold bg-muted text-muted-foreground px-2 py-0.5 rounded-md shrink-0">
                    {student.batch}
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={assigningId !== null}
              className="text-muted-foreground hover:bg-accent"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
