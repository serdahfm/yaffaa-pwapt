import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Button } from './components/ui/button';
import { Label } from './components/ui/label';
import { Textarea } from './components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Toggle } from './components/ui/toggle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Progress } from './components/ui/progress';
import { ScrollArea } from './components/ui/scroll-area';
import { PlayIcon, DownloadIcon, Sparkles, Settings, FileText } from 'lucide-react';
import './App.css';

interface Plan {
  id: string;
  summary: string;
  deliverables: Array<{ id: string; name: string; description: string }>;
  tasks: Array<{ id: string; name: string; dependencies: string[] }>;
  assumptions: Array<{ key: string; value: string; why: string }>;
  blockers: Array<{ id: string; label: string; why: string }>;
}

interface JobResult {
  runId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  logs: string[];
  result?: {
    preview: string;
    files: Array<{ path: string; type: string; content: string }>;
    metadata: any;
  };
  error?: string;
}

export default function App() {
  const [mission, setMission] = useState('');
  const [mode, setMode] = useState('Standard');
  const [yafa, setYafa] = useState(false);
  const [dial, setDial] = useState('Plan+Drafts');
  const [plan, setPlan] = useState<Plan | null>(null);
  const [jobResult, setJobResult] = useState<JobResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState<ReturnType<typeof setInterval> | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (polling) {
        clearInterval(polling);
      }
    };
  }, [polling]);

  const generatePlan = async () => {
    if (!mission.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mission,
          mode,
          yafa: yafa ? 'On' : 'Off',
          dial
        })
      });
      
      if (!response.ok) throw new Error('Plan generation failed');
      
      const data = await response.json();
      setPlan(data);
    } catch (error) {
      console.error('Plan generation error:', error);
      alert('Failed to generate plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const executeMission = async () => {
    if (!mission.trim()) return;
    
    setLoading(true);
    setJobResult(null);
    
    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mission,
          mode,
          yafa: yafa ? 'On' : 'Off',
          dial,
          plan
        })
      });
      
      if (!response.ok) throw new Error('Execution failed');
      
      const { runId } = await response.json();
      
      // Start polling for results
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(`/api/results/${runId}`);
          if (!statusResponse.ok) return;
          
          const result = await statusResponse.json() as JobResult;
          setJobResult(result);
          
          if (result.status === 'completed' || result.status === 'failed') {
            clearInterval(pollInterval);
            setPolling(null);
            setLoading(false);
          }
        } catch (error) {
          console.error('Polling error:', error);
        }
      }, 1000);
      
      setPolling(pollInterval);
    } catch (error) {
      console.error('Execution error:', error);
      alert('Failed to start execution. Please try again.');
      setLoading(false);
    }
  };

  const downloadResults = async () => {
    if (!jobResult || jobResult.status !== 'completed') return;
    
    try {
      const response = await fetch(`/api/download/${jobResult.runId}`);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `yafa-results-${jobResult.runId}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download results. Please try again.');
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <header className="mb-8">
        <h1 className="text-4xl font-bold flex items-center gap-2 mb-2">
          <Sparkles className="h-8 w-8 text-primary" />
          YAFA-MS vNext
        </h1>
        <p className="text-muted-foreground">Yet Another Framework Agnostic Mission Solver</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Mission Control</CardTitle>
              <CardDescription>Define your mission and configure execution parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mission">Mission Statement</Label>
                <Textarea
                  id="mission"
                  placeholder="Describe your mission objective..."
                  value={mission}
                  onChange={(e) => setMission(e.target.value)}
                  className="min-h-32"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mode">Execution Mode</Label>
                  <Select value={mode} onValueChange={setMode}>
                    <SelectTrigger id="mode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Standard">Standard</SelectItem>
                      <SelectItem value="Fast">Fast</SelectItem>
                      <SelectItem value="Thorough">Thorough</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dial">Detail Dial</Label>
                  <Select value={dial} onValueChange={setDial}>
                    <SelectTrigger id="dial">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Plan Only">Plan Only</SelectItem>
                      <SelectItem value="Plan+Drafts">Plan + Drafts</SelectItem>
                      <SelectItem value="Full Exec">Full Execution</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Toggle
                  pressed={yafa}
                  onPressedChange={setYafa}
                  aria-label="Toggle YAFA mode"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  YAFA High-Stakes Mode
                </Toggle>
                <span className="text-sm text-muted-foreground">
                  {yafa ? 'Enhanced validation enabled' : 'Standard validation'}
                </span>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={generatePlan} 
                  disabled={loading || !mission.trim()}
                  variant="outline"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Plan
                </Button>
                <Button 
                  onClick={executeMission} 
                  disabled={loading || !mission.trim()}
                  className="flex-1"
                >
                  <PlayIcon className="h-4 w-4 mr-2" />
                  Execute Mission
                </Button>
              </div>
            </CardContent>
          </Card>

          {plan && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Execution Plan</CardTitle>
                <CardDescription>{plan.summary}</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="deliverables">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="deliverables">Deliverables</TabsTrigger>
                    <TabsTrigger value="tasks">Tasks</TabsTrigger>
                    <TabsTrigger value="assumptions">Assumptions</TabsTrigger>
                    <TabsTrigger value="blockers">Blockers</TabsTrigger>
                  </TabsList>
                  <TabsContent value="deliverables" className="space-y-2">
                    {plan.deliverables.map((d) => (
                      <div key={d.id} className="p-3 bg-muted rounded-lg">
                        <div className="font-medium">{d.name}</div>
                        <div className="text-sm text-muted-foreground">{d.description}</div>
                      </div>
                    ))}
                  </TabsContent>
                  <TabsContent value="tasks" className="space-y-2">
                    {plan.tasks.map((t) => (
                      <div key={t.id} className="p-3 bg-muted rounded-lg">
                        <div className="font-medium">{t.name}</div>
                        {t.dependencies.length > 0 && (
                          <div className="text-sm text-muted-foreground">
                            Depends on: {t.dependencies.join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </TabsContent>
                  <TabsContent value="assumptions" className="space-y-2">
                    {plan.assumptions.map((a) => (
                      <div key={a.key} className="p-3 bg-muted rounded-lg">
                        <div className="font-medium">{a.value}</div>
                        <div className="text-sm text-muted-foreground">Reason: {a.why}</div>
                      </div>
                    ))}
                  </TabsContent>
                  <TabsContent value="blockers" className="space-y-2">
                    {plan.blockers.length === 0 ? (
                      <div className="text-muted-foreground">No blockers identified</div>
                    ) : (
                      plan.blockers.map((b) => (
                        <div key={b.id} className="p-3 bg-muted rounded-lg">
                          <div className="font-medium">{b.label}</div>
                          <div className="text-sm text-muted-foreground">{b.why}</div>
                        </div>
                      ))
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {jobResult && (
            <Card>
              <CardHeader>
                <CardTitle>Execution Status</CardTitle>
                <CardDescription>
                  {jobResult.status === 'running' && 'Mission in progress...'}
                  {jobResult.status === 'completed' && 'Mission completed successfully'}
                  {jobResult.status === 'failed' && 'Mission failed'}
                  {jobResult.status === 'pending' && 'Mission queued'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{jobResult.progress}%</span>
                  </div>
                  <Progress value={jobResult.progress} />
                </div>

                <div className="space-y-2">
                  <Label>Execution Log</Label>
                  <ScrollArea className="h-48 w-full rounded-md border p-2">
                    <div className="space-y-1">
                      {jobResult.logs.map((log, i) => (
                        <div key={i} className="text-sm text-muted-foreground">
                          {log}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                {jobResult.status === 'completed' && jobResult.result && (
                  <>
                    <div className="space-y-2">
                      <Label>Preview</Label>
                      <div className="p-3 bg-muted rounded-lg text-sm whitespace-pre-wrap">
                        {jobResult.result.preview}
                      </div>
                    </div>

                    <Button 
                      onClick={downloadResults} 
                      className="w-full"
                    >
                      <DownloadIcon className="h-4 w-4 mr-2" />
                      Download Results
                    </Button>
                  </>
                )}

                {jobResult.status === 'failed' && jobResult.error && (
                  <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                    Error: {jobResult.error}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>About YAFA-MS</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2 text-muted-foreground">
              <p>
                YAFA-MS (Yet Another Framework Agnostic Mission Solver) is an advanced
                execution engine that transforms mission statements into actionable
                deliverables.
              </p>
              <p>
                It uses the YAFA protocol for enhanced validation and quality
                assurance, ensuring reliable and comprehensive results.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}