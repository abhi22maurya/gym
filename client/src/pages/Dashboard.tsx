import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TripleActivityRing, ActivityRing } from '../components/ui/ActivityRing';
import { PushSubscribe } from '../components/ui/PushSubscribe';
import { getTodayWater, getDietLogs, getWorkoutLogs, getMetrics } from '../lib/api';
import { useCoachStream } from '../hooks/useCoachStream';
import {
  AreaChart, Area, XAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import { Sparkles, ArrowUpRight, Flame, Droplets, Dumbbell, Activity, RefreshCw } from 'lucide-react';

/* ── Small stat tile (Health.app style) ─────────────────────── */
function StatTile({
  label, value, unit, color, icon: Icon, progress,
}: {
  label: string; value: string; unit?: string;
  color: string; icon: React.ElementType; progress?: number;
}) {
  return (
    <div className="apple-card animate-fade-in" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 8, minHeight: 120 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: color + '18',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={16} color={color} strokeWidth={2} />
        </div>
        {progress !== undefined && (
          <div style={{ width: 36, height: 36 }}>
            <ActivityRing progress={progress} color={color} size={36} strokeWidth={4} />
          </div>
        )}
      </div>
      <div>
        <p style={{ fontSize: 12, color: 'var(--label-secondary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {label}
        </p>
        <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--label-primary)', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
          {value}
          {unit && <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--label-secondary)', marginLeft: 2 }}>{unit}</span>}
        </p>
      </div>
      {progress !== undefined && (
        <div className="apple-progress">
          <div className="apple-progress-fill" style={{ width: `${Math.min(progress, 100)}%`, background: color }} />
        </div>
      )}
    </div>
  );
}

/* ── AI Coach card ──────────────────────────────────────────── */
function CoachCard({ suggestion, loading, onRefresh }: { suggestion: string; loading: boolean; onRefresh: () => void }) {
  return (
    <div style={{
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      background: 'linear-gradient(135deg, #1d1b4b 0%, #0a2150 50%, #0d3b2e 100%)',
      padding: '20px',
      boxShadow: '0 8px 32px rgba(0, 122, 255, 0.15)',
      position: 'relative',
    }}>
      {/* Ambient glows */}
      <div style={{
        position: 'absolute', top: -20, right: -20, width: 120, height: 120,
        borderRadius: '50%', background: 'rgba(10, 132, 255, 0.2)',
        filter: 'blur(30px)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: -20, left: 40, width: 80, height: 80,
        borderRadius: '50%', background: 'rgba(48, 209, 88, 0.15)',
        filter: 'blur(24px)', pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'rgba(255, 255, 255, 0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Sparkles size={14} color="#FFD60A" strokeWidth={2} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.02em' }}>
              SMART COACH
            </span>
          </div>
          <button
            onClick={onRefresh}
            style={{
              border: 'none', background: 'rgba(255,255,255,0.08)', cursor: 'pointer',
              borderRadius: 8, padding: 6, display: 'flex', alignItems: 'center',
              transition: 'background 150ms',
            }}
          >
            <RefreshCw size={14} color="rgba(255,255,255,0.5)" style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>

        <p style={{
          fontSize: 15, lineHeight: 1.55, color: loading ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.9)',
          fontStyle: loading ? 'normal' : 'italic',
          fontWeight: 400, letterSpacing: '-0.1px',
          transition: 'color 300ms',
        }}>
          {loading ? 'Analyzing your data...' : `"${suggestion}"`}
        </p>

        {!loading && (
          <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
            <button style={{
              border: 'none', background: 'var(--color-blue)', color: 'white',
              borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'var(--font-sans)',
              transition: 'all 150ms var(--ease-out)',
            }}>
              Adjust Plan
            </button>
            <button style={{
              border: 'none', background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)',
              borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 500,
              cursor: 'pointer', fontFamily: 'var(--font-sans)',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              Details <ArrowUpRight size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Custom chart tooltip ───────────────────────────────────── */
function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]) return null;
  return (
    <div style={{
      background: 'var(--bg-elevated)', borderRadius: 10, padding: '8px 12px',
      boxShadow: 'var(--shadow-md)', border: '0.5px solid var(--separator)',
      fontSize: 13, fontFamily: 'var(--font-sans)',
    }}>
      <p style={{ color: 'var(--label-secondary)', marginBottom: 2 }}>{payload[0].payload.name}</p>
      <p style={{ color: 'var(--color-blue)', fontWeight: 700 }}>{payload[0].value} kg</p>
    </div>
  );
}

const MOCK_WEIGHT = [
  { name: 'Mon', weight: 82.5 }, { name: 'Tue', weight: 82.2 },
  { name: 'Wed', weight: 81.9 }, { name: 'Thu', weight: 82.0 },
  { name: 'Fri', weight: 81.5 }, { name: 'Sat', weight: 81.3 }, { name: 'Sun', weight: 81.0 },
];

export function Dashboard() {
  const [greeting, setGreeting] = useState('');
  const { suggestion, isStreaming, fetchStream } = useCoachStream();

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  useEffect(() => {
    fetchStream();
  }, [fetchStream]);

  const todayIso = new Date().toISOString().split('T')[0];

  const { data: waterData } = useQuery({ 
    queryKey: ['water', todayIso], 
    queryFn: () => getTodayWater().then(d => d.data) 
  });
  
  const { data: dietData } = useQuery({ 
    queryKey: ['diet', todayIso], 
    queryFn: () => getDietLogs(todayIso).then(d => d.data) 
  });
  
  const { data: workoutData } = useQuery({ 
    queryKey: ['workout'], 
    queryFn: () => getWorkoutLogs().then(d => d.data) 
  });
  
  const { data: metricsData } = useQuery({ 
    queryKey: ['metrics'], 
    queryFn: () => getMetrics().then(d => d.data) 
  });

  const waterMl = waterData?.totalMl ?? 0;

  const logs = dietData?.data ?? [];
  const protein = logs.reduce((s: number, l: any) => s + (l.proteinG ?? 0), 0);
  const calories = logs.reduce((s: number, l: any) => s + (l.calories ?? 0), 0);

  const wLogs = workoutData?.data ?? [];
  const todayStr = new Date().toDateString();
  const workoutDone = wLogs.some((l: any) => new Date(l.date).toDateString() === todayStr);

  const mLogs = metricsData?.data ?? [];
  const weightData = (mLogs.length >= 2) 
    ? mLogs.slice(0, 7).reverse().map((item: any, i: number) => ({
      name: MOCK_WEIGHT[i]?.name ?? `Day ${i + 1}`,
      weight: item.weightKg,
    }))
    : MOCK_WEIGHT;

  const proteinPct = Math.round((protein / 160) * 100);
  const waterPct = Math.round((waterMl / 3000) * 100);
  const caloriePct = Math.round((calories / 2500) * 100);
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* Hero header */}
      <div className="animate-fade-in" style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 15, color: 'var(--label-secondary)', fontWeight: 400, marginBottom: 4 }}>
          {today}
        </p>
        <h1 style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--label-primary)', lineHeight: 1.1 }}>
          {greeting},<br />Abhishek 👋
        </h1>
      </div>

      {/* AI Coach */}
      <div style={{ marginBottom: 24 }} className="animate-fade-in">
        <CoachCard suggestion={suggestion} loading={isStreaming} onRefresh={fetchStream} />
      </div>

      {/* Activity Rings + Today's Summary */}
      <div className="apple-card animate-fade-in" style={{ padding: '20px', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {/* Triple Ring */}
          <div style={{ flexShrink: 0 }}>
            <TripleActivityRing
              move={caloriePct}
              exercise={workoutDone ? 100 : 0}
              stand={waterPct}
              size={120}
            />
          </div>
          {/* Legend */}
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--label-primary)', marginBottom: 12 }}>Today's Activity</p>
            {[
              { label: 'Calories', value: `${Math.round(calories)} / 2,500 kcal`, color: '#FA2D55' },
              { label: 'Workout', value: workoutDone ? 'Completed ✓' : 'Not yet logged', color: '#A3F70F' },
              { label: 'Hydration', value: `${(waterMl / 1000).toFixed(1)} / 3.0 L`, color: '#4DF0CD' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: 4, background: color, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: 'var(--label-secondary)', flex: 1 }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--label-primary)' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <PushSubscribe />

      {/* Stat Tiles — 2-column grid */}
      <p className="section-title">HEALTH METRICS</p>
      <div className="animate-stagger" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 12,
        marginBottom: 24,
      }}>
        <StatTile label="Protein" value={`${Math.round(protein)}`} unit="g" color="var(--color-orange)" icon={Flame} progress={proteinPct} />
        <StatTile label="Water" value={`${(waterMl / 1000).toFixed(1)}`} unit="L" color="var(--color-teal)" icon={Droplets} progress={waterPct} />
        <StatTile label="Calories" value={`${Math.round(calories)}`} unit="kcal" color="var(--color-pink)" icon={Activity} progress={caloriePct} />
        <StatTile label="Workout" value={workoutDone ? 'Done' : '—'} color="var(--color-green)" icon={Dumbbell} progress={workoutDone ? 100 : 0} />
      </div>

      {/* Weight Chart */}
      <p className="section-title">WEIGHT TREND</p>
      <div className="apple-card animate-fade-in" style={{ padding: '20px 12px 12px', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '0 8px', marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--label-primary)' }}>Body Weight</span>
          <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-blue)' }}>
            {weightData[weightData.length - 1]?.weight ?? '—'}
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--label-secondary)', marginLeft: 2 }}>kg</span>
          </span>
        </div>
        <div style={{ height: 140 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weightData} margin={{ top: 5, right: 10, left: -30, bottom: 0 }}>
              <defs>
                <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-blue)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--color-blue)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--label-tertiary)', fontSize: 11 }} />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone" dataKey="weight"
                stroke="var(--color-blue)" strokeWidth={2.5}
                fill="url(#wGrad)" dot={false}
                activeDot={{ r: 5, fill: 'var(--color-blue)', stroke: 'var(--bg-secondary)', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Muscle fatigue */}
      <p className="section-title">MUSCLE RECOVERY</p>
      <div className="apple-card animate-fade-in" style={{ padding: '4px 0' }}>
        {[
          { muscle: 'Chest', recovery: 15, color: 'var(--color-red)' },
          { muscle: 'Back', recovery: 60, color: 'var(--color-orange)' },
          { muscle: 'Legs', recovery: 90, color: 'var(--color-green)' },
          { muscle: 'Arms', recovery: 40, color: 'var(--color-yellow)' },
        ].map(({ muscle, recovery, color }) => (
          <div key={muscle} className="list-row">
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: color + '18',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{ fontSize: 13 }}>💪</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 15, color: 'var(--label-primary)', fontWeight: 500 }}>{muscle}</span>
                <span style={{ fontSize: 13, color, fontWeight: 600 }}>{recovery}% recovered</span>
              </div>
              <div className="apple-progress">
                <div className="apple-progress-fill" style={{ width: `${recovery}%`, background: color }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
