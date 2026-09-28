import { useView } from './use-view'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Monitor } from 'lucide-react'

const labelCls = "text-xs font-bold font-['IBM_Plex_Mono'] uppercase tracking-wider text-muted-foreground"
const inputCls = 'bg-card border-border text-foreground font-sans text-sm focus-visible:ring-1 focus-visible:ring-primary w-full h-10 shadow-sm'

export default function AdminSetupPage() {
  const { configured, name, setName, password, setPassword, confirmPassword, setConfirmPassword, status, message, handleSubmit } = useView()

  const isSetup = configured === false

  return (
    <div className="min-h-screen bg-background text-foreground font-['Inter'] flex flex-col items-center justify-center p-4 transition-colors duration-300 relative">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center text-primary shadow-sm">
            <Monitor className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-['Space_Grotesk'] uppercase text-foreground">GExam LAN Server</h1>
            <p className="text-[10px] text-muted-foreground font-['IBM_Plex_Mono'] uppercase tracking-widest mt-0.5">Offline Exam Console</p>
          </div>
        </div>

        <Card className="w-full bg-card border border-border shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="text-center pb-4 border-b border-border bg-muted/20">
            <CardTitle className="text-lg font-bold font-['Space_Grotesk'] uppercase text-foreground">
              {isSetup ? 'First-time Setup' : 'Admin Login'}
            </CardTitle>
            <CardDescription className="text-[10px] font-['IBM_Plex_Mono'] uppercase tracking-widest text-muted-foreground mt-1">
              {isSetup ? 'CREATE THE ADMIN ACCOUNT FOR THIS SERVER' : 'SYS_AUTH // SIGN IN'}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            {configured === null ? (
              <p className="text-center text-xs text-muted-foreground font-['IBM_Plex_Mono'] uppercase py-6">Checking server…</p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className={labelCls}>{isSetup ? 'Your name' : 'Name'}</Label>
                  <Input id="name" required autoFocus autoComplete="username" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className={labelCls}>Password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    minLength={isSetup ? 6 : undefined}
                    autoComplete={isSetup ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputCls}
                  />
                  {isSetup && <p className="text-[11px] text-muted-foreground">At least 6 characters.</p>}
                </div>

                {isSetup && (
                  <div className="space-y-2">
                    <Label htmlFor="confirm" className={labelCls}>Confirm password</Label>
                    <Input id="confirm" type="password" required autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputCls} />
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-['IBM_Plex_Mono'] text-xs font-bold uppercase tracking-wider h-10 shadow-sm cursor-pointer disabled:opacity-50 mt-2"
                >
                  {status === 'loading' ? 'Please wait…' : isSetup ? 'Create admin & continue' : 'Sign in'}
                </Button>

                {message && (
                  <div className="p-3 rounded-md text-xs mt-4 font-['IBM_Plex_Mono'] border bg-destructive/10 text-destructive border-destructive/20">
                    {message}
                  </div>
                )}
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
