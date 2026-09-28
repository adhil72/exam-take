import { useView } from './use-view'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export default function StudentHomePage() {
  const {
    machineName,
    setMachineName,
    isRegistered,
    clientId,
    status,
    assignedStudent,
    errorMsg,
    handleRegister,
    handleResetRegistration
  } = useView()

  if (!isRegistered) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative">
        <div className="w-full max-w-md space-y-8 animate-in fade-in-0 duration-300">
          <div className="text-center space-y-2">
            <span className="text-[10px] text-primary font-['IBM_Plex_Mono'] font-bold uppercase tracking-widest px-2.5 py-0.5 border border-primary/20 bg-primary/5 rounded-full">
              SECURE CONNECT
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight font-['Space_Grotesk'] uppercase text-foreground mt-2">
              Connect Machine
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Register this workstation node to join the examination network
            </p>
          </div>
          
          <form onSubmit={handleRegister} className="space-y-6 pt-4">
            <div className="space-y-2">
              <Label htmlFor="pcName" className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider text-muted-foreground">
                Terminal PC Name / ID
              </Label>
              <Input
                id="pcName"
                type="text"
                required
                placeholder="e.g. PC-01, LAB1-PC15"
                value={machineName}
                onChange={(e) => setMachineName(e.target.value)}
                className="bg-card border-border text-foreground font-sans focus-visible:ring-1 focus-visible:ring-primary h-11"
              />
            </div>
            <Button type="submit" className="w-full h-11 bg-primary text-primary-foreground font-['IBM_Plex_Mono'] font-bold uppercase tracking-widest hover:bg-primary/90">
              Register & Handshake
            </Button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative">
      
      {/* Top Header Connection Status */}
      <header className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center bg-transparent border-b border-border/20">
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground font-['IBM_Plex_Mono'] uppercase tracking-widest">GATE Examination Console</span>
          <span className="font-['Space_Grotesk'] text-base font-bold uppercase tracking-tight text-foreground">{machineName}</span>
        </div>
        <div className="flex items-center gap-2 border border-border bg-card shadow-xs px-3 py-1 rounded-md">
          <span className={`w-2 h-2 rounded-full ${status === 'disconnected' ? 'bg-amber-500 animate-pulse' : status === 'rejected' ? 'bg-destructive' : 'bg-primary shadow-[0_0_8px_var(--color-primary)] animate-pulse'}`} />
          <span className="text-[10px] font-['IBM_Plex_Mono'] font-bold uppercase tracking-widest text-foreground">
            {status === 'disconnected' ? 'SIGNAL LOSS' : status === 'rejected' ? 'BLOCKED' : 'CONNECTED'}
          </span>
        </div>
      </header>

      {/* Main Waiting Display Center */}
      <div className="w-full max-w-xl text-center space-y-8 animate-in fade-in-0 duration-300">
        {status === 'pending' && (
          <div className="space-y-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <h1 className="text-3xl font-bold tracking-tight font-['Space_Grotesk'] uppercase text-foreground">
              Handshake Initiated
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto leading-relaxed text-sm">
              Establishing secure connection with the supervisor console. Awaiting machine authorization...
            </p>
          </div>
        )}

        {status === 'approved' && !assignedStudent && (
          <div className="space-y-4">
            <div className="inline-flex p-3 bg-muted/20 rounded-full border border-border">
              <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin flex items-center justify-center">
              </div>
            </div>
            <h1 className="text-3xl font-bold tracking-tight font-['Space_Grotesk'] uppercase text-foreground">
              System Standby
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto leading-relaxed text-sm">
              This terminal is successfully registered on the exam network. Please wait for the test supervisor to bind your student credentials to this station.
            </p>
            <div className="inline-block mt-4 px-3 py-1 border border-border bg-muted/30 rounded text-[10px] font-['IBM_Plex_Mono'] text-muted-foreground uppercase tracking-widest">
              Node ID: {clientId?.slice(0, 8)}
            </div>
          </div>
        )}

        {status === 'assigned' && assignedStudent && (
          <div className="space-y-6">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary mx-auto bg-muted shadow-lg relative flex items-center justify-center">
              {assignedStudent.photoUrl ? (
                <img src={assignedStudent.photoUrl} alt={assignedStudent.name} className="w-full h-full object-cover dark:grayscale" />
              ) : (
                <span className="text-4xl font-bold text-muted-foreground uppercase font-['Space_Grotesk']">
                  {assignedStudent.name.charAt(0)}
                </span>
              )}
            </div>
            
            <div className="space-y-2">
              <span className="text-[10px] font-['IBM_Plex_Mono'] font-bold text-primary uppercase tracking-widest px-2.5 py-0.5 border border-primary/20 bg-primary/5 rounded-full">
                Operator Verified
              </span>
              <h1 className="text-4xl font-extrabold tracking-tight font-['Space_Grotesk'] text-foreground uppercase mt-2">
                {assignedStudent.name}
              </h1>
              <p className="text-muted-foreground font-['IBM_Plex_Mono'] text-sm tracking-wide">
                {assignedStudent.email}
              </p>
            </div>

            <div className="pt-8 border-t border-border max-w-sm mx-auto space-y-2">
              <div className="flex items-center justify-center gap-2 text-primary font-['IBM_Plex_Mono'] text-sm font-semibold uppercase tracking-wider animate-pulse">
                <span className="inline-block w-2 h-2 rounded-full bg-primary" />
                Lobby Initialization Pending
              </div>
              <p className="text-xs text-muted-foreground">
                Do not close this window. The exam console will automatically launch when the coordinator starts the session.
              </p>
            </div>
          </div>
        )}

        {status === 'rejected' && (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-destructive/10 text-destructive border border-destructive/20 rounded-full flex items-center justify-center mx-auto text-3xl font-bold font-['IBM_Plex_Mono']">
              ✕
            </div>
            <h1 className="text-3xl font-bold tracking-tight font-['Space_Grotesk'] uppercase text-destructive">
              Access Denied
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto leading-relaxed text-sm">
              {errorMsg || 'This station has been disconnected or rejected by the test coordinator.'}
            </p>
            <div className="pt-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleResetRegistration}
                className="font-['IBM_Plex_Mono'] uppercase tracking-wider text-xs font-semibold h-9"
              >
                RESET HANDSHAKE
              </Button>
            </div>
          </div>
        )}

        {status === 'disconnected' && (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto text-3xl animate-pulse font-['IBM_Plex_Mono']">
              ⚠️
            </div>
            <h1 className="text-3xl font-bold tracking-tight font-['Space_Grotesk'] uppercase text-amber-500">
              Signal Lost
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto leading-relaxed text-sm">
              Re-establishing connection with the local network server. Please remain seated.
            </p>
            <div className="pt-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleResetRegistration}
                className="font-['IBM_Plex_Mono'] uppercase tracking-wider text-xs font-semibold h-9"
              >
                RESET CONNECTION
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
