import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Download, Eye, RotateCcw } from 'lucide-react';

interface ExecutionViewProps {
  runId: string;
  isDadMode: boolean;
  onReset: () => void;
}

export function ExecutionView({ runId, isDadMode, onReset }: ExecutionViewProps) {
  const [status, setStatus] = useState('running');
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const pollResults = async () => {
      try {
        const response = await fetch(`/api/results/${runId}`);
        const data = await response.json();
        
        setStatus(data.status);
        setProgress(data.progress || 0);
        setResults(data.results);
        setLogs(data.logs || []);
        
        if (data.status === 'completed' || data.status === 'failed') {
          return; // Stop polling
        }
        
        setTimeout(pollResults, 2000);
      } catch (error) {
        console.error('Polling failed:', error);
        setTimeout(pollResults, 5000);
      }
    };

    pollResults();
  }, [runId]);

  const downloadBundle = async () => {
    try {
      const response = await fetch(`/api/download/${runId}`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `yafa-results-${runId}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              {isDadMode ? "Working on it..." : `Execution ${runId}`}
            </span>
            <div className="flex items-center gap-2">
              <Badge variant={status === 'completed' ? 'default' : status === 'failed' ? 'destructive' : 'secondary'}>
                {status}
              </Badge>
              <Button variant="ghost" size="sm" onClick={onReset}>
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            {isDadMode 
              ? status === 'completed' 
                ? "All done! Here are your results:"
                : "Please wait while I work on your request..."
              : "Real-time execution progress and logs"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={progress} className="w-full" />
          
          {!isDadMode && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Activity Log</h4>
              <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto text-xs font-mono">
                {logs.map((log, idx) => (
                  <div key={idx} className="text-gray-600">
                    {log.timestamp}: {log.message}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>
              {isDadMode ? "Everything you requested:" : "Generated artifacts and deliverables"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="prose prose-sm max-w-none">
              {results.preview}
            </div>
            
            {results.files && results.files.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Files Generated</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {results.files.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">{file.path}</span>
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button onClick={downloadBundle}>
                <Download className="w-4 h-4 mr-2" />
                Download Bundle
              </Button>
              <Button variant="outline" onClick={onReset}>
                New Task
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
