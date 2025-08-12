import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, CheckCircle2 } from 'lucide-react';

interface GuidedBuilderProps {
  isDadMode: boolean;
  onExecute: (plan: any) => void;
}

export function GuidedBuilder({ isDadMode, onExecute }: GuidedBuilderProps) {
  const [mission, setMission] = useState('');
  const [mode, setMode] = useState('Standard');
  const [yafa, setYafa] = useState('Off');
  const [dial, setDial] = useState('Plan+Drafts');
  const [plan, setPlan] = useState(null);
  const [isPlanning, setIsPlanning] = useState(false);

  const generatePlan = async () => {
    if (!mission.trim()) return;
    
    setIsPlanning(true);
    try {
      const response = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mission, mode, yafa, dial })
      });
      
      const result = await response.json();
      setPlan(result);
    } catch (error) {
      console.error('Planning failed:', error);
    } finally {
      setIsPlanning(false);
    }
  };

  const handleExecute = () => {
    onExecute({ mission, mode, yafa, dial, plan });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {isDadMode ? "What would you like to accomplish?" : "Mission Definition"}
          </CardTitle>
          <CardDescription>
            {isDadMode 
              ? "Describe your goal in plain language - I'll handle the details"
              : "Define your objective with context and constraints"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder={isDadMode 
              ? "I need help with..." 
              : "Describe your mission, goals, and any specific requirements..."
            }
            value={mission}
            onChange={(e) => setMission(e.target.value)}
            rows={4}
            className="min-h-[100px]"
          />
          
          {!isDadMode && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Mode</label>
                <Select value={mode} onValueChange={setMode}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Standard">Standard</SelectItem>
                    <SelectItem value="Brainstorm">Brainstorm</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">YAFA Protocol</label>
                <Select value={yafa} onValueChange={setYafa}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Off">Off</SelectItem>
                    <SelectItem value="On">High-Stakes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Execution Level</label>
                <Select value={dial} onValueChange={setDial}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Plan+Drafts">Plan + Drafts</SelectItem>
                    <SelectItem value="Full Exec">Full Execution</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          
          <Button 
            onClick={generatePlan}
            disabled={!mission.trim() || isPlanning}
            className="w-full md:w-auto"
          >
            {isPlanning ? "Analyzing..." : "Generate Plan"}
          </Button>
        </CardContent>
      </Card>

      {plan && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Execution Plan
            </CardTitle>
            <CardDescription>
              {isDadMode ? "Here's what I'll do for you" : "Review and modify the proposed approach"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="prose prose-sm max-w-none">
              <p>{plan.summary}</p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Deliverables</h4>
              <div className="flex flex-wrap gap-2">
                {plan.deliverables?.map((item, idx) => (
                  <Badge key={idx} variant="secondary">
                    {item.name}
                  </Badge>
                ))}
              </div>
            </div>
            
            <Button onClick={handleExecute} className="w-full md:w-auto">
              <Play className="w-4 h-4 mr-2" />
              {isDadMode ? "Go!" : "Execute Plan"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
