import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertTriangle } from 'lucide-react'

interface EndSessionModalProps {
  open: boolean
  endConfirmationText: string
  setEndConfirmationText: (v: string) => void
  onConfirm: () => void
  onCancel: () => void
}

export function EndSessionModal({
  open,
  endConfirmationText,
  setEndConfirmationText,
  onConfirm,
  onCancel,
}: EndSessionModalProps) {
  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) onCancel() }}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-5" />
            End Exam Session?
          </DialogTitle>
          <DialogDescription>
            This will immediately end the exam and force-submit all remaining
            attempts. This action is <strong className="text-destructive">irreversible</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="endConfirm" className="text-sm">
            Type <strong>END</strong> to confirm
          </Label>
          <Input
            id="endConfirm"
            type="text"
            placeholder="END"
            value={endConfirmationText}
            onChange={(e) => setEndConfirmationText(e.target.value)}
            className="text-center font-mono font-bold tracking-widest"
            autoFocus
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={endConfirmationText !== 'END'}
            className="flex-1"
          >
            End Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
