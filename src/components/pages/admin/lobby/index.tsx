import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useView } from './use-view'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Monitor, Wifi, RefreshCw, Play, Pause, Square, Moon, Sun, Search, Sliders } from 'lucide-react'
import { AssignStudentDialog } from '@/components/admin/AssignStudentDialog'
import { useTheme } from '@/contexts/theme.context'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

// Split flap timer sub-component
function SplitFlapDigit({ digit }: { digit: string }) {
  return (
    <div className="relative w-10 h-14 bg-card rounded-md border border-border overflow-hidden flex items-center justify-center shadow-sm">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-muted z-10 pointer-events-none" />
      <div className="absolute top-1/2 left-0 w-full h-[1px] dark:h-[2px] bg-border z-20" />
      <span className="font-['IBM_Plex_Mono'] text-3xl font-bold text-foreground z-0">{digit}</span>
    </div>
  )
}

function SplitFlapTimer({ timeStr }: { timeStr: string }) {
  const chars = timeStr.split('');
  return (
    <div className="flex items-center gap-1">
      {chars.map((c, i) => (
        c === ':' ? (
          <div key={i} className="text-muted-foreground font-['IBM_Plex_Mono'] text-2xl font-bold px-1 animate-pulse pb-1">:</div>
        ) : (
          <SplitFlapDigit key={i} digit={c} />
        )
      ))}
    </div>
  )
}

export default function AdminLobbyPage() {
  const navigate = useNavigate()
  const {
    clients,
    selectedClient,
    setSelectedClient,
    isAssigning,
    setIsAssigning,
    serverIp,
    activeSession,
    timeLeft,
    extendMinutes,
    setExtendMinutes,
    loading,
    assignedCount,
    disconnectedCount,
    fetchData,
    handleApprove,
    handleReject,
    handleAssignStudent,
    handleUnassignStudent,
    handleUnassignAll,
    handleStartExam,
    handlePauseExam,
    handleResumeExam,
    handleEndExam,
    handleExtendTime,
    handleForceSubmit,
    formatTime
  } = useView()

  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const [searchQuery, setSearchQuery] = useState('');
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);

  const unassignedClients = clients.filter(c => !c.studentId && c.status !== 'rejected' && c.status !== 'disconnected');
  const assignedClients = clients.filter(c => c.studentId && c.status !== 'rejected' && c.status !== 'disconnected');
  const blockedClients = clients.filter(c => c.status === 'rejected');

  const filteredUnassigned = unassignedClients.filter(c => 
    c.machineName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.ipAddress.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAssigned = assignedClients.filter(c => 
    c.machineName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.ipAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.student?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.student?.batch || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBlocked = blockedClients.filter(c => 
    c.machineName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.ipAddress.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background text-foreground font-['Inter'] selection:bg-primary/20 transition-colors duration-300">
      
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border px-6 md:px-8 py-4 md:py-5 transition-colors">
        <div className="max-w-[1500px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-['Space_Grotesk'] uppercase text-foreground">Network Operations Center</h2>
            <p className="text-muted-foreground mt-1 text-sm font-['IBM_Plex_Mono']">
              SYS_LOBBY // MANAGING CONNECTED NODES AND EXAM SESSION
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={toggleTheme} variant="ghost" size="icon" className="text-muted-foreground hover:bg-accent rounded-full h-9 w-9">
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            {activeSession && (
              <Button 
                onClick={() => setIsSessionModalOpen(true)} 
                className="bg-primary text-primary-foreground hover:bg-primary/90 border border-transparent rounded-md gap-2 font-['Inter'] shadow-sm"
              >
                <Sliders className="h-4 w-4" />
                Session Control
              </Button>
            )}
            {activeSession && (activeSession.status === 'in_progress' || activeSession.status === 'paused') && (
              <Button onClick={() => navigate({ to: '/admin/monitor' })} className="bg-card hover:bg-accent border border-border text-foreground rounded-md gap-2 font-['Inter'] shadow-sm">
                <Monitor className="h-4 w-4 text-primary" />
                Live Monitor
              </Button>
            )}
            <Button onClick={fetchData} className="bg-card hover:bg-accent border border-border text-foreground rounded-md gap-2 font-['Inter'] shadow-sm">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-[1500px] mx-auto p-6 md:p-8 space-y-6">

        {/* Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="bg-card border border-border p-4 rounded-xl shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-8 h-8 bg-muted flex items-center justify-center rounded-bl-xl border-b border-l border-border">
              <div className="w-2 h-2 rounded-full bg-foreground opacity-50" />
            </div>
            <p className="text-xs text-muted-foreground font-['IBM_Plex_Mono'] uppercase tracking-widest mb-3">Total Nodes</p>
            <div className="text-4xl font-bold font-['IBM_Plex_Mono'] text-foreground">{clients.length}</div>
          </div>
          
          <div className="bg-card border border-border p-4 rounded-xl shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-8 h-8 bg-muted flex items-center justify-center rounded-bl-xl border-b border-l border-border">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
            </div>
            <p className="text-xs text-muted-foreground font-['IBM_Plex_Mono'] uppercase tracking-widest mb-3">Unassigned</p>
            <div className="text-4xl font-bold font-['IBM_Plex_Mono'] text-amber-500">{unassignedClients.length}</div>
          </div>

          <div className="bg-card border border-border p-4 rounded-xl shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-8 h-8 bg-muted flex items-center justify-center rounded-bl-xl border-b border-l border-border">
              <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)] opacity-80" />
            </div>
            <p className="text-xs text-muted-foreground font-['IBM_Plex_Mono'] uppercase tracking-widest mb-3">Assigned</p>
            <div className="text-4xl font-bold font-['IBM_Plex_Mono'] text-primary">{assignedCount}</div>
          </div>

          <div className="bg-card border border-border p-4 rounded-xl shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-8 h-8 bg-muted flex items-center justify-center rounded-bl-xl border-b border-l border-border">
              <div className="w-2 h-2 rounded-full bg-destructive shadow-[0_0_8px_var(--color-destructive)] opacity-80" />
            </div>
            <p className="text-xs text-muted-foreground font-['IBM_Plex_Mono'] uppercase tracking-widest mb-3">Link Down</p>
            <div className="text-4xl font-bold font-['IBM_Plex_Mono'] text-destructive">{disconnectedCount}</div>
          </div>
        </div>

        {/* Server Address Banner */}
        <div className="bg-card border border-border shadow-sm p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-muted rounded-lg">
              <Wifi className="h-5 w-5 text-primary animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground font-['IBM_Plex_Mono'] uppercase tracking-widest">Listening Interface</span>
              <div className="font-['IBM_Plex_Mono'] text-primary font-medium text-sm md:text-base mt-1 flex items-center">
                $ connect --host http://{serverIp}:3000<span className="animate-pulse ml-1 inline-block w-2 h-4 bg-primary" />
              </div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground font-['IBM_Plex_Mono'] border border-border bg-muted px-3 py-1.5 rounded-md">
            BROADCAST INSTRUCTIONS TO CLIENTS
          </div>
        </div>



        {/* Search Input Banner */}
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search nodes by machine name, IP address, operator name, or batch..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 bg-card border-border text-foreground font-sans text-sm focus-visible:ring-1 focus-visible:ring-primary w-full h-11 shadow-sm"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 text-muted-foreground hover:text-foreground text-xs font-semibold font-['IBM_Plex_Mono']"
            >
              CLEAR
            </button>
          )}
        </div>

        {/* Unassigned Nodes Array */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="border-b border-border bg-muted/30 p-4">
            <h3 className="font-['Space_Grotesk'] text-lg font-bold tracking-wide text-foreground uppercase">Unassigned Nodes ({filteredUnassigned.length})</h3>
            <p className="text-[10px] text-muted-foreground font-['IBM_Plex_Mono'] uppercase tracking-widest mt-1">
              Active network nodes awaiting operator binding
            </p>
          </div>
          
          <div className="p-6">
            {clients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-16 h-16 border border-border bg-muted rounded-xl flex items-center justify-center mb-4">
                  <Monitor className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-muted-foreground font-['IBM_Plex_Mono'] font-medium uppercase tracking-widest text-sm">NO SIGNAL DETECTED</h3>
                <p className="text-muted-foreground opacity-70 font-['IBM_Plex_Mono'] text-xs mt-2">Awaiting network handshake...</p>
              </div>
            ) : filteredUnassigned.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-border rounded-lg bg-muted/20">
                <p className="text-muted-foreground font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">No matching unassigned nodes</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredUnassigned.map(client => (
                  <div key={client._id} className="border border-border bg-muted/10 p-4 rounded-lg flex flex-col justify-between hover:border-primary/50 hover:bg-muted/20 transition-all duration-200 group relative">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-['IBM_Plex_Mono'] text-sm font-bold text-foreground flex items-center gap-1.5">
                          <span className="text-primary font-bold">{'>'}</span> {client.machineName}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${client.status === 'disconnected' ? 'bg-muted-foreground' : 'bg-primary shadow-[0_0_4px_var(--color-primary)]'}`} />
                          <span className="text-[9px] font-['IBM_Plex_Mono'] font-bold text-muted-foreground uppercase">
                            {client.status === 'disconnected' ? 'OFFLINE' : 'ONLINE'}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground font-['IBM_Plex_Mono'] mt-1">{client.ipAddress}</p>
                    </div>
                    
                    <div className="mt-4 pt-3 border-t border-border flex items-center justify-between gap-2">
                      <Button
                        size="sm"
                        disabled={activeSession?.status !== 'lobby'}
                        onClick={() => { setSelectedClient(client); setIsAssigning(true) }}
                        className="bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary text-xs font-semibold font-['IBM_Plex_Mono'] h-8 rounded px-3 shadow-none w-full transition-all"
                      >
                        BIND OPERATOR
                      </Button>
                      {activeSession?.status === 'lobby' && (
                        <button
                          onClick={() => handleReject(client._id)}
                          className="text-destructive/70 hover:text-destructive hover:bg-destructive/10 text-xs font-bold rounded h-8 w-8 flex items-center justify-center transition-colors border border-transparent hover:border-destructive/30"
                          title="Block Node"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Assigned Nodes Array */}
        <div className="bg-card border border-border rounded-xl shadow-sm flex flex-col overflow-hidden">
          <div className="border-b border-border bg-muted/30 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-['Space_Grotesk'] text-lg font-bold tracking-wide text-foreground uppercase">Assigned Nodes Array ({filteredAssigned.length})</h3>
              <p className="text-[10px] text-muted-foreground font-['IBM_Plex_Mono'] uppercase tracking-widest mt-1">
                Roster of active operators bound to network machines
              </p>
            </div>
            <Button 
              onClick={handleUnassignAll} 
              disabled={assignedCount === 0 || activeSession?.status === 'in_progress' || activeSession?.status === 'paused'}
              className="bg-transparent hover:bg-destructive/10 border border-destructive/30 text-destructive rounded-md font-['IBM_Plex_Mono'] text-xs font-semibold uppercase tracking-widest h-8 px-3 transition-colors shadow-sm disabled:opacity-50 disabled:border-border disabled:text-muted-foreground disabled:bg-transparent disabled:shadow-none"
            >
              PURGE ROSTER
            </Button>
          </div>
          
          <div className="p-0 overflow-x-auto">
            {filteredAssigned.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/5">
                <div className="w-12 h-12 border border-border bg-muted rounded-xl flex items-center justify-center mb-3">
                  <Monitor className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-muted-foreground font-['IBM_Plex_Mono'] font-medium uppercase tracking-widest text-xs">NO ACTIVE ASSIGNMENTS</h3>
                <p className="text-muted-foreground opacity-70 font-['IBM_Plex_Mono'] text-[10px] mt-1">No matching active assignments</p>
              </div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 border-b border-border font-['IBM_Plex_Mono'] text-[10px] text-muted-foreground uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Node ID</th>
                    <th className="px-6 py-4 font-semibold">IP Address</th>
                    <th className="px-6 py-4 font-semibold">Telemetry Status</th>
                    <th className="px-6 py-4 font-semibold">Operator</th>
                    <th className="px-6 py-4 text-right font-semibold">Commands</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-['IBM_Plex_Mono'] text-sm">
                  {filteredAssigned.map(client => (
                    <tr key={client._id} className="hover:bg-accent/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3 text-foreground font-medium">
                          <span className="text-muted-foreground opacity-50 group-hover:opacity-100 group-hover:text-primary transition-colors font-bold">{'>'}</span>
                          {client.machineName}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{client.ipAddress}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {client.status === 'disconnected' ? (
                            <>
                              <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                              <span className="text-muted-foreground font-semibold text-xs">OFFLINE</span>
                            </>
                          ) : (
                            <>
                              <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_4px_var(--color-primary)]" />
                              <span className="text-primary font-semibold text-xs">ONLINE</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {client.student ? (
                          <div className="flex items-center gap-3 font-sans">
                            <div className="h-8 w-8 rounded-full bg-background border border-border flex items-center justify-center overflow-hidden">
                              {client.student.photoUrl ? (
                                <img src={client.student.photoUrl} alt="" className="object-cover h-full w-full dark:grayscale dark:opacity-80" />
                              ) : (
                                <span className="text-xs font-semibold text-muted-foreground">{client.student.name.charAt(0)}</span>
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-foreground font-medium text-xs">{client.student.name}</span>
                              <span className="text-muted-foreground text-[10px] mt-0.5">{client.student.batch}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground opacity-50 text-xs italic">NULL</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 items-center opacity-70 group-hover:opacity-100 transition-opacity">
                          {activeSession?.status === 'lobby' && (
                            <>
                              <button onClick={() => handleUnassignStudent(client._id)} className="px-3 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/30 hover:border-amber-500 text-xs font-semibold rounded-md transition-colors shadow-sm">
                                UNBIND
                              </button>
                              <button onClick={() => handleReject(client._id)} className="px-3 py-1 text-destructive hover:bg-destructive/10 text-xs font-semibold rounded-md transition-colors ml-1">
                                KILL
                              </button>
                            </>
                          )}

                          {(activeSession?.status === 'in_progress' || activeSession?.status === 'paused') && client.studentId && (
                            <button onClick={() => handleForceSubmit(client._id)} className="px-3 py-1 bg-destructive/10 text-destructive border border-destructive/30 hover:border-destructive text-xs font-semibold rounded-md transition-colors shadow-sm">
                              FORCE_SUBMIT
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Access Control Denied List */}
        {filteredBlocked.length > 0 && (
          <div className="bg-card border border-destructive/20 rounded-xl shadow-sm flex flex-col overflow-hidden">
            <div className="border-b border-destructive/20 bg-destructive/5 p-4">
              <h3 className="font-['Space_Grotesk'] text-lg font-bold tracking-wide text-destructive uppercase">Access Control Denied List ({filteredBlocked.length})</h3>
              <p className="text-[10px] text-muted-foreground font-['IBM_Plex_Mono'] uppercase tracking-widest mt-1">
                Restricted nodes currently barred from the exam lobby
              </p>
            </div>
            
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 border-b border-border font-['IBM_Plex_Mono'] text-[10px] text-muted-foreground uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Node ID</th>
                    <th className="px-6 py-3 font-semibold">IP Address</th>
                    <th className="px-6 py-3 font-semibold">Telemetry Status</th>
                    <th className="px-6 py-3 text-right font-semibold">Commands</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-['IBM_Plex_Mono'] text-sm">
                  {filteredBlocked.map(client => (
                    <tr key={client._id} className="hover:bg-accent/50 transition-colors group">
                      <td className="px-6 py-3 text-foreground">{client.machineName}</td>
                      <td className="px-6 py-3 text-muted-foreground">{client.ipAddress}</td>
                      <td className="px-6 py-3 text-destructive font-semibold text-xs">BLOCKED</td>
                      <td className="px-6 py-3 text-right">
                        <button onClick={() => handleApprove(client._id)} className="px-3 py-1 bg-primary/10 text-primary border border-primary/30 hover:border-primary text-xs font-semibold rounded-md transition-colors shadow-sm">
                          RESTORE NODE
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Session Control Modal */}
      {activeSession && (
        <Dialog open={isSessionModalOpen} onOpenChange={setIsSessionModalOpen}>
          <DialogContent className="sm:max-w-md max-w-lg bg-card border border-border text-foreground rounded-xl shadow-lg p-6">
            <DialogHeader className="mb-4">
              <DialogTitle className="font-['Space_Grotesk'] text-xl font-bold uppercase tracking-wide flex items-center justify-between">
                <span>Session Control Panel</span>
                <span className="text-[10px] font-['IBM_Plex_Mono'] font-bold border border-border bg-muted px-2 py-0.5 rounded uppercase tracking-wider text-foreground">
                  STATUS: {activeSession.status.replace('_', ' ')}
                </span>
              </DialogTitle>
              <DialogDescription className="text-muted-foreground font-['IBM_Plex_Mono'] text-[10px] uppercase tracking-widest mt-1">
                Configure Active Session Lifecycle
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-2">
              {/* Status Indicator Bar */}
              <div className="flex items-center justify-between p-3 border border-border bg-muted/20 rounded-lg">
                <span className="text-xs text-muted-foreground font-['IBM_Plex_Mono'] uppercase tracking-wider">Telemetry State</span>
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${
                    activeSession.status === 'lobby' ? 'bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]' :
                    activeSession.status === 'in_progress' ? 'bg-primary animate-pulse shadow-[0_0_8px_var(--color-primary)]' :
                    activeSession.status === 'paused' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-muted-foreground'
                  }`} />
                  <span className="text-xs font-['IBM_Plex_Mono'] font-bold uppercase tracking-widest text-foreground">
                    {activeSession.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Timer Block */}
              <div className="flex flex-col items-center justify-center bg-muted/30 border border-border p-5 rounded-xl text-center">
                <span className="text-[10px] text-muted-foreground font-['IBM_Plex_Mono'] uppercase tracking-widest mb-3">
                  {activeSession.status === 'lobby' && activeSession.scheduledAt ? 'T-MINUS COUNTDOWN' : 'SESSION CLOCK'}
                </span>
                <SplitFlapTimer timeStr={timeLeft > 0 ? formatTime(timeLeft) : '00:00'} />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2">
                {activeSession.status === 'lobby' && (
                  <Button 
                    onClick={() => { handleStartExam(); setIsSessionModalOpen(false); }} 
                    disabled={loading || assignedCount === 0}
                    className="bg-primary hover:bg-primary/95 text-primary-foreground font-['IBM_Plex_Mono'] font-semibold uppercase tracking-widest py-6 w-full shadow-sm"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    EXECUTE START
                  </Button>
                )}

                {activeSession.status === 'in_progress' && (
                  <Button 
                    onClick={handlePauseExam}
                    className="bg-amber-500 hover:bg-amber-500/95 text-black font-['IBM_Plex_Mono'] font-semibold uppercase tracking-widest py-6 w-full shadow-sm"
                  >
                    <Pause className="w-4 h-4 mr-2" />
                    HALT SESSION
                  </Button>
                )}

                {activeSession.status === 'paused' && (
                  <Button 
                    onClick={handleResumeExam}
                    className="bg-primary hover:bg-primary/95 text-primary-foreground font-['IBM_Plex_Mono'] font-semibold uppercase tracking-widest py-6 w-full shadow-sm"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    RESUME SESSION
                  </Button>
                )}

                {(activeSession.status === 'in_progress' || activeSession.status === 'paused') && (
                  <Button 
                    onClick={() => { handleEndExam(); setIsSessionModalOpen(false); }}
                    className="bg-destructive hover:bg-destructive/95 text-destructive-foreground font-['IBM_Plex_Mono'] font-semibold uppercase tracking-widest py-6 w-full shadow-sm"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    TERMINATE SESSION
                  </Button>
                )}
              </div>

              {/* Time Extension */}
              {(activeSession.status === 'in_progress' || activeSession.status === 'paused') && (
                <div className="border-t border-border pt-4 mt-4">
                  <span className="text-[10px] text-muted-foreground font-['IBM_Plex_Mono'] uppercase tracking-widest block mb-2">
                    EXTEND SESSION TIME
                  </span>
                  <div className="flex items-center gap-2 bg-muted/50 border border-border p-2 rounded-lg">
                    <Input
                      type="number"
                      placeholder="MIN"
                      value={extendMinutes}
                      onChange={(e) => setExtendMinutes(e.target.value)}
                      className="flex-1 bg-background border-border text-foreground font-['IBM_Plex_Mono'] focus-visible:ring-1 focus-visible:ring-primary placeholder:text-muted-foreground h-9 shadow-sm"
                    />
                    <Button 
                      onClick={handleExtendTime} 
                      className="bg-primary hover:bg-primary/95 text-primary-foreground font-['IBM_Plex_Mono'] uppercase tracking-wider text-xs font-semibold h-9 px-4 shadow-sm"
                    >
                      EXTEND
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Assignment Dialog - kept standard but will inherit some styles */}
      <AssignStudentDialog
        isOpen={isAssigning}
        onClose={() => {
          setIsAssigning(false)
          setSelectedClient(null)
        }}
        machineName={selectedClient?.machineName || ''}
        onAssign={handleAssignStudent}
        assignedStudentIds={clients
          .map((c) => c.studentId)
          .filter(Boolean) as string[]}
      />
    </div>
  )
}
