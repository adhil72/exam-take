import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmContext } from "@/contexts/confirm.context";
import { registerConfirm } from '@/lib/confirm'
import { ReactNode, useState, useEffect } from "react";
import { Loader2 } from 'lucide-react'

export const ConfirmProvider = ({ children }: { children: ReactNode }) => {
    const [openConfirm, setOpenConfirm] = useState(false);
    const [message, setMessage] = useState("");
    const [resolvePromise, setResolvePromise] = useState<(value: boolean) => void>();
    const [confirmType, setConfirmType] = useState<'default' | 'success' | 'error'>('default')
    const [confirmText, setConfirmText] = useState<string | undefined>(undefined)
    const [cancelText, setCancelText] = useState<string | undefined | null>(undefined)
    const [action, setAction] = useState<(() => Promise<any>) | undefined>(undefined)
    const [loading, setLoading] = useState(false)

    const confirm = (msg: string, opts?: { type?: 'default' | 'success' | 'error', confirmText?: string, cancelText?: string | null, action?: () => Promise<any> }) => {
        setMessage(msg);
        setConfirmType(opts?.type || 'default')
        setConfirmText(opts?.confirmText)
        setCancelText(opts?.cancelText)
        setAction(() => opts?.action)
        setOpenConfirm(true);
        return new Promise<boolean>((resolve) => {
            setResolvePromise(() => resolve);
        });
    };

    useEffect(() => {
        registerConfirm((m: string, opts?: any) => confirm(m, opts))
        return () => registerConfirm(undefined)
    }, [])

    const handleClose = () => {
        if (loading) return // prevent closing while loading
        setOpenConfirm(false);
        if (resolvePromise) {
            resolvePromise(false);
        }
    };

    return <ConfirmContext.Provider value={{ confirm }}>
        {children}
        <Dialog open={openConfirm} onOpenChange={handleClose}>
            <DialogContent className="max-w-md bg-card border border-border rounded-xl p-6 text-foreground font-sans shadow-lg">
                <DialogHeader>
                    <DialogTitle className="text-lg font-bold font-['Space_Grotesk'] uppercase text-foreground">
                        Confirm Action
                    </DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground my-3">{message}</p>
                <DialogFooter className="flex justify-end gap-2 mt-4 pt-3 border-t border-border">
                    {cancelText !== null && (
                        <Button 
                            variant='outline' 
                            onClick={handleClose}
                            className="bg-transparent border-border hover:bg-accent text-foreground font-['IBM_Plex_Mono'] text-xs font-bold uppercase tracking-wider h-9 rounded shadow-sm"
                        >
                            {cancelText || 'Cancel'}
                        </Button>
                    )}
                    <Button 
                        variant={confirmType === 'default' ? 'default' : confirmType === 'success' ? 'secondary' : 'destructive'} 
                        onClick={async () => {
                            if (action) {
                                try {
                                    setLoading(true)
                                    await action()
                                    setOpenConfirm(false)
                                    if (resolvePromise) resolvePromise(true)
                                } catch (e) {
                                    setOpenConfirm(false)
                                    if (resolvePromise) resolvePromise(false)
                                } finally {
                                    setLoading(false)
                                }
                            } else {
                                setOpenConfirm(false);
                                if (resolvePromise) {
                                    resolvePromise(true);
                                }
                            }
                        }}
                        className="font-['IBM_Plex_Mono'] text-xs font-bold uppercase tracking-wider h-9 rounded shadow-sm cursor-pointer"
                    >
                        {loading ? <Loader2 className="size-4 animate-spin" /> : (confirmText || 'OK')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </ConfirmContext.Provider>
}
