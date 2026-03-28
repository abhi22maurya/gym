import { useState } from 'react';
import { Activity, CheckCircle, Apple } from 'lucide-react';
import { syncHealthKit } from '../lib/api';

export function HealthKitSync() {
  const [synced, setSynced] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleManualSync = async () => {
    setLoading(true);
    try {
      // Simulate reading from local device health framework
      await syncHealthKit({ steps: 8432, sleepHours: 7.2, activeCalories: 420 });
      setSynced(true);
      setTimeout(() => setSynced(false), 3000);
    } catch {
      alert('Failed to sync. Make sure the server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', paddingBottom: 100 }}>
      {/* Header */}
      <div className="animate-fade-in" style={{ marginBottom: 24, padding: '24px 0' }}>
        <h1 style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-0.5px' }}>Apple Health</h1>
        <p style={{ fontSize: 15, color: 'var(--label-secondary)', marginTop: 8 }}>
          Sync your steps, sleep, and active energy automatically.
        </p>
      </div>

      <div className="apple-card animate-fade-in" style={{ padding: 24, textAlign: 'center', marginBottom: 24 }}>
        <div style={{
          width: 80, height: 80, borderRadius: 20, background: 'var(--color-red)', 
          margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Apple color="white" size={40} />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>iOS Shortcuts Sync</h2>
        <p style={{ fontSize: 15, color: 'var(--label-secondary)', lineHeight: 1.5, marginBottom: 24 }}>
          To sync your Apple Health data automatically, download our iOS Shortcut. It runs in the background and sends data directly to your dashboard.
        </p>
        <button style={{
          background: 'var(--label-primary)', color: 'var(--bg-primary)',
          border: 'none', padding: '14px 24px', borderRadius: 12,
          fontSize: 15, fontWeight: 600, width: '100%', cursor: 'pointer'
        }}>
          Download Shortcut
        </button>
      </div>

      <div className="apple-card animate-fade-in" style={{ padding: 24, animationDelay: '100ms' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <Activity color="var(--color-blue)" size={24} />
          <h3 style={{ fontSize: 17, fontWeight: 600 }}>Manual Sync (Demo)</h3>
        </div>
        <p style={{ fontSize: 15, color: 'var(--label-secondary)', marginBottom: 20 }}>
          Test the HealthKit data pipeline by sending a mock payload.
        </p>
        <button 
          onClick={handleManualSync}
          disabled={loading || synced}
          style={{
            background: synced ? 'var(--color-green)' : 'var(--color-blue)', color: 'white',
            border: 'none', padding: '14px 24px', borderRadius: 12,
            fontSize: 15, fontWeight: 600, width: '100%', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.2s'
          }}
        >
          {loading ? 'Syncing...' : synced ? <><CheckCircle size={18} /> Synced Successfully</> : 'Trigger Sync'}
        </button>
      </div>
    </div>
  );
}
