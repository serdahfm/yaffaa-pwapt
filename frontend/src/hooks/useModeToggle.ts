import { useState, useEffect } from 'react';

export function useModeToggle() {
  const [isDadMode, setIsDadMode] = useState(() => {
    try {
      const saved = localStorage.getItem('yafa-dad-mode');
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('yafa-dad-mode', JSON.stringify(isDadMode));
    } catch {
      // Silent fail for localStorage issues
    }
  }, [isDadMode]);

  return { isDadMode, setIsDadMode };
}
