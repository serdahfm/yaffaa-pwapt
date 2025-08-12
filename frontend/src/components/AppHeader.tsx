import React from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { HelpCircle, Zap } from 'lucide-react';

interface AppHeaderProps {
  isDadMode: boolean;
  onModeToggle: (isDad: boolean) => void;
  onHelp: () => void;
}

export function AppHeader({ isDadMode, onModeToggle, onHelp }: AppHeaderProps) {
  return (
    <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">YAFA-MS</h1>
              <p className="text-sm text-gray-500">AI Business Assistant</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <span className={`text-sm font-medium ${isDadMode ? 'text-gray-500' : 'text-gray-900'}`}>
                Expert
              </span>
              <Switch 
                checked={isDadMode}
                onCheckedChange={onModeToggle}
                aria-label="Toggle between Expert and Dad mode"
              />
              <span className={`text-sm font-medium ${isDadMode ? 'text-gray-900' : 'text-gray-500'}`}>
                Dad Mode
              </span>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onHelp}
              className="text-gray-500 hover:text-gray-900"
            >
              <HelpCircle className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
