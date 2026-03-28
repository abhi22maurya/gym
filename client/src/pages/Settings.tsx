import { useState, useEffect } from 'react';
import { SignOutButton, useUser } from '@clerk/clerk-react';
import { User, LogOut, ChevronRight, Apple } from 'lucide-react';
import { getUserProfile } from '../lib/api';

export function Settings() {
  const { user } = useUser();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    getUserProfile().then(res => setProfile(res.data)).catch(() => {});
  }, []);

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', paddingBottom: 100 }}>
      <div className="animate-fade-in" style={{ marginBottom: 24, padding: '24px 0' }}>
        <h1 style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-0.5px' }}>Settings</h1>
      </div>

      {/* Profile Card */}
      <div className="apple-card animate-fade-in" style={{ padding: 20, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 64, height: 64, borderRadius: 32, background: 'linear-gradient(135deg, #a855f7, #ec4899)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
          <User size={32} color="white" />
        </div>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.3px', margin: 0 }}>
            {profile?.name || user?.firstName || 'AI Gym User'}
          </h2>
          <p style={{ fontSize: 14, color: 'var(--label-secondary)', marginTop: 4 }}>
            Goal: {profile?.goalType === 'gain_muscle' ? 'Build Muscle' : profile?.goalType === 'lose_fat' ? 'Lose Fat' : 'Improve Health'}
          </p>
        </div>
      </div>

      {/* Data Source Box */}
      <p className="section-title">INTEGRATIONS</p>
      <div className="apple-card animate-fade-in" style={{ padding: '0 20px', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: '0.5px solid var(--separator)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--color-red)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Apple size={18} color="white" />
            </div>
            <span style={{ fontSize: 16, fontWeight: 500 }}>Apple Health</span>
          </div>
          <ChevronRight size={20} color="var(--label-tertiary)" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--color-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 18 }}>💬</span>
            </div>
            <span style={{ fontSize: 16, fontWeight: 500 }}>WhatsApp Bot</span>
          </div>
          <span style={{ fontSize: 14, color: 'var(--label-secondary)' }}>Configured</span>
        </div>
      </div>

      <p className="section-title">ACCOUNT</p>
      <div className="apple-card animate-fade-in" style={{ padding: 8 }}>
        <SignOutButton>
          <button style={{
            width: '100%', padding: '14px 12px', background: 'transparent', border: 'none',
            display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left',
            color: 'var(--color-red)', borderRadius: 10, transition: 'background 0.2s'
          }}>
            <LogOut size={20} strokeWidth={2} />
            <span style={{ fontSize: 16, fontWeight: 500 }}>Sign Out</span>
          </button>
        </SignOutButton>
      </div>
    </div>
  );
}
