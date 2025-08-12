import React, { useState } from 'react';
import { AppHeader } from './components/AppHeader';
import { GuidedBuilder } from './components/GuidedBuilder';
import { ExecutionView } from './components/ExecutionView';
import { useModeToggle } from './hooks/useModeToggle';

function App() {
  const { isDadMode, setIsDadMode } = useModeToggle();
  const [currentView, setCurrentView] = useState<'builder' | 'execution'>('builder');
  const [runId, setRunId] = useState<string | null>(null);

  const handleExecute = async (plan: any) => {
    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plan)
      });
      
      const result = await response.json();
      setRunId(result.runId);
      setCurrentView('execution');
    } catch (error) {
      console.error('Execution failed:', error);
    }
  };

  const handleReset = () => {
    setCurrentView('builder');
    setRunId(null);
  };

  const handleHelp = () => {
    // Simple help modal could be added here
    alert(isDadMode 
      ? "Just describe what you want to accomplish in simple terms. I'll take care of the rest!"
      : "YAFA-MS helps you create business plans, documents, and automation workflows. Use Expert mode for full control, or Dad mode for simplified experience."
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader 
        isDadMode={isDadMode}
        onModeToggle={setIsDadMode}
        onHelp={handleHelp}
      />
      
      <main className="container mx-auto px-6 py-8">
        {currentView === 'builder' ? (
          <GuidedBuilder 
            isDadMode={isDadMode}
            onExecute={handleExecute}
          />
        ) : (
          <ExecutionView
            runId={runId!}
            isDadMode={isDadMode}
            onReset={handleReset}
          />
        )}
      </main>
    </div>
  );
}

export default App;
