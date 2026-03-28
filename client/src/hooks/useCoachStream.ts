import { useState, useCallback, useRef } from 'react';
import { currentUserId, currentToken } from '../lib/api';

export function useCoachStream() {
  const [suggestion, setSuggestion] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const fetchStream = useCallback(() => {
    // Clean up previous event source if exists
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setIsStreaming(true);
    setSuggestion('');
    
    const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';
    const source = new EventSource(`${BASE_URL}/coach/suggest-stream?userId=${currentUserId}&token=${currentToken || ''}`);
    eventSourceRef.current = source;
    
    source.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.token) {
          setSuggestion((prev) => prev + data.token);
        }
      } catch (err) {
        console.error('SSE parse error', err);
      }
    };
    
    source.onerror = () => {
      source.close();
      setIsStreaming(false);
      setSuggestion((prev) => prev || 'Stay consistent and track your progress daily! 💪');
      eventSourceRef.current = null;
    };
  }, []);

  return { suggestion, isStreaming, fetchStream };
}
