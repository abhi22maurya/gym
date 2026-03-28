import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { currentUserId, api } from '../../lib/api';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BM_aixC839y2U5JXXvM2aVbO0E3T3RzXb3I2-i--7NqfUv7A9hU8w2Y_b8w6R1R5y0W8A6Y5a3A6V5D4Q6S5E4a';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushSubscribe() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setSupported(true);
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          if (sub) setIsSubscribed(true);
        });
      });
    }
  }, []);

  const subscribe = async () => {
    try {
      if (Notification.permission === 'denied') {
        alert('Push notifications are blocked in your browser settings.');
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
      
      await api.post('/notifications/subscribe', {
        userId: currentUserId,
        subscription: sub
      });
      
      setIsSubscribed(true);
    } catch (error) {
      console.error('Subscription failed', error);
      alert('Failed to subscribe. Please try again.');
    }
  };

  if (!supported) return null;

  return (
    <div className="apple-card animate-fade-in" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--color-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Bell color="white" size={20} />
        </div>
        <div>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--label-primary)' }}>Water Reminders</p>
          <p style={{ fontSize: 13, color: 'var(--label-secondary)' }}>Get notified to stay hydrated</p>
        </div>
      </div>
      <button 
        onClick={subscribe} 
        disabled={isSubscribed}
        style={{
          background: isSubscribed ? 'var(--bg-secondary)' : 'var(--color-blue)',
          color: isSubscribed ? 'var(--label-secondary)' : 'white',
          border: 'none', padding: '8px 16px', borderRadius: 20, fontSize: 14, fontWeight: 600,
          cursor: isSubscribed ? 'default' : 'pointer',
          transition: 'all 0.2s'
        }}
      >
        {isSubscribed ? 'Enabled' : 'Enable'}
      </button>
    </div>
  );
}
