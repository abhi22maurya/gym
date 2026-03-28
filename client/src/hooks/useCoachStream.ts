import { useState, useCallback, useRef } from 'react';
import { currentUserId } from '../lib/api';

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
    
    const source = new EventSource(`http://localhost:5001/api/coach/suggest-stream?userId=${currentUserId}`);
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
