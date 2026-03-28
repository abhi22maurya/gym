import { useState } from 'react';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Dashboard } from './pages/Dashboard';
import { WorkoutLogger } from './pages/WorkoutLogger';
import { NutritionLogger } from './pages/NutritionLogger';
import { PostureAI } from './pages/PostureAI';
import { HealthKitSync } from './pages/HealthKitSync';
import { Settings } from './pages/Settings';
import { logWater, getTodayWater } from './lib/api';
import { ActivityRing } from './components/ui/ActivityRing';
import type { Page } from './layouts/DashboardLayout';

/* ── Hydration Page ── */
function HydrationPage() {
  const [amount, setAmount] = useState(250);
  const [totalMl, setTotalMl] = useState(0);
  const [logged, setLogged] = useState(false);
  const goal = 3000;
  const pct = Math.min(Math.round((totalMl / goal) * 100), 100);

  const handleLog = async () => {
    await logWater(amount);
    const res = await getTodayWater();
    setTotalMl(res.data.totalMl ?? 0);
    setLogged(true);
    setTimeout(() => setLogged(false), 2000);
  };

  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.4px', color: 'var(--label-primary)' }}>Hydration</h1>
        <p style={{ fontSize: 15, color: 'var(--label-secondary)', marginTop: 2 }}>Daily water goal: {goal / 1000}L</p>
      </div>

      {/* Big ring */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
        <ActivityRing progress={pct} color="var(--color-teal)" size={200} strokeWidth={20}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 36, fontWeight: 800, color: 'var(--color-teal)', letterSpacing: '-1px', lineHeight: 1 }}>
              {(totalMl / 1000).toFixed(1)}
            </p>
            <p style={{ fontSize: 14, color: 'var(--label-secondary)' }}>of 3.0 L</p>
          </div>
        </ActivityRing>
      </div>

      {/* Quick add buttons */}
      <p className="section-title">QUICK ADD</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
        {[150, 250, 350, 500].map(ml => (
          <button
            key={ml}
            onClick={() => setAmount(ml)}
            style={{
              padding: '14px 0', borderRadius: 'var(--radius-md)', border: 'none',
              cursor: 'pointer', fontFamily: 'var(--font-sans)',
              fontSize: 15, fontWeight: 600,
              background: amount === ml ? 'var(--color-teal)' : 'var(--bg-secondary)',
              color: amount === ml ? 'white' : 'var(--label-primary)',
              boxShadow: amount === ml ? '0 4px 14px rgba(90,200,250,0.35)' : 'var(--shadow-sm)',
              transition: 'all 200ms var(--spring)',
              transform: amount === ml ? 'scale(1.04)' : 'scale(1)',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {ml}
            <span style={{ fontSize: 10, fontWeight: 400, display: 'block', opacity: 0.75 }}>ml</span>
          </button>
        ))}
      </div>

      <button
        onClick={handleLog}
        style={{
          width: '100%', padding: 16, borderRadius: 'var(--radius-md)', border: 'none',
          cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 16, fontWeight: 700,
          background: logged ? 'var(--color-green)' : 'var(--color-teal)',
          color: 'white', transition: 'all 200ms var(--spring)',
          boxShadow: `0 4px 20px ${logged ? 'rgba(48,209,88,0.35)' : 'rgba(90,200,250,0.35)'}`,
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {logged ? `✓ +${amount}ml logged!` : `+ Log ${amount}ml`}
      </button>

      {/* Today breakdown */}
      {totalMl > 0 && (
        <div className="apple-card animate-fade-in" style={{ marginTop: 20, padding: '16px' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--label-secondary)', marginBottom: 8 }}>TODAY'S INTAKE</p>
          <div className="apple-progress" style={{ height: 8 }}>
            <div className="apple-progress-fill" style={{ width: `${pct}%`, background: 'var(--color-teal)' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ fontSize: 13, color: 'var(--label-secondary)' }}>{totalMl} ml consumed</span>
            <span style={{ fontSize: 13, color: 'var(--color-teal)', fontWeight: 600 }}>{pct}% of goal</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Sleep Page (Coming soon) ── */
function SleepPage() {
  return (
    <div style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center', paddingTop: 60 }}>
      <div style={{ fontSize: 72, marginBottom: 20 }}>😴</div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--label-primary)', marginBottom: 8 }}>Sleep Tracking</h1>
      <p style={{ fontSize: 15, color: 'var(--label-secondary)', lineHeight: 1.6, maxWidth: 280, margin: '0 auto' }}>
        Log sleep hours and quality for AI-powered recovery insights. Coming soon.
      </p>
      <div style={{ marginTop: 28, padding: '20px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', textAlign: 'left' }}>
        {['Average sleep: — hrs', 'Sleep quality: —', 'Recovery score: —'].map(item => (
          <div key={item} className="list-row" style={{ paddingLeft: 0, paddingRight: 0, opacity: 0.4 }}>
            <span style={{ fontSize: 15, color: 'var(--label-secondary)' }}>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Root App ── */
export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('overview');

  const pages: Record<Page, React.ReactNode> = {
    overview: <Dashboard />,
    workout: <WorkoutLogger />,
    nutrition: <NutritionLogger />,
    hydration: <HydrationPage />,
    sleep: <SleepPage />,
    posture: <PostureAI />,
    healthkit: <HealthKitSync />,
    settings: <Settings />,
  };

  return (
    <DashboardLayout currentPage={currentPage} onNavigate={setCurrentPage}>
      {pages[currentPage]}
    </DashboardLayout>
  );
}
