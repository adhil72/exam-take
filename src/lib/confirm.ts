type ConfirmOptions = {
    type?: 'default' | 'success' | 'error'
    confirmText?: string
    cancelText?: string | null
    action?: () => Promise<any>
}

let _handler: ((msg: string, opts?: ConfirmOptions) => Promise<boolean>) | undefined

export function registerConfirm(handler?: (msg: string, opts?: ConfirmOptions) => Promise<boolean>) {
    _handler = handler
}

export async function confirm(msg: string, opts?: ConfirmOptions): Promise<boolean> {
    if (_handler) return _handler(msg, opts)
    const ok = window.confirm(msg)
    if (!ok) return false
    if (opts?.action) {
        try {
            await opts.action()
            return true
        } catch (e) {
            return false
        }
    }
    return true
}

export default confirm
