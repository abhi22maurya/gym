import { useState, useRef } from 'react';
import { logWorkout, parseVoiceInput } from '../lib/api';
import { Mic, MicOff, Plus, ChevronRight, Flame } from 'lucide-react';
import { ActivityRing } from '../components/ui/ActivityRing';

const EXERCISES = [
  { name: 'Bench Press', emoji: '🏋️', muscle: 'Chest' },
  { name: 'Squat', emoji: '🦵', muscle: 'Legs' },
  { name: 'Deadlift', emoji: '💪', muscle: 'Back' },
  { name: 'Pull-up', emoji: '🔝', muscle: 'Back' },
  { name: 'Push-up', emoji: '👐', muscle: 'Chest' },
  { name: 'Shoulder Press', emoji: '🙆', muscle: 'Shoulders' },
  { name: 'Bicep Curl', emoji: '💪', muscle: 'Arms' },
  { name: 'Tricep Dip', emoji: '🔻', muscle: 'Arms' },
  { name: 'Barbell Row', emoji: '🏋️', muscle: 'Back' },
  { name: 'Leg Press', emoji: '🦵', muscle: 'Legs' },
  { name: 'Plank', emoji: '🧘', muscle: 'Core' },
  { name: 'Lat Pulldown', emoji: '⬇️', muscle: 'Back' },
];

const RECENT_PRS = [
  { name: 'Bench Press', pr: '80 kg', delta: '+2.5kg', positive: true },
  { name: 'Squat', pr: '100 kg', delta: '→ no change', positive: false },
  { name: 'Deadlift', pr: '120 kg', delta: '+5kg', positive: true },
  { name: 'Pull-up', pr: '12 reps', delta: '+2 reps', positive: true },
];

function NumberStepper({ label, value, onChange, min = 0, max = 200, step = 1 }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number;
}) {
  return (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--label-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
        {label}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <button
          onClick={() => onChange(Math.max(min, value - step))}
          style={{
            width: 34, height: 34, borderRadius: '50%', border: 'none',
            background: 'var(--fill-primary)', color: 'var(--label-primary)',
            fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-sans)', transition: 'all 150ms var(--spring)',
            WebkitTapHighlightColor: 'transparent',
          }}
          onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.9)')}
          onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
          onTouchStart={e => (e.currentTarget.style.transform = 'scale(0.9)')}
          onTouchEnd={e => (e.currentTarget.style.transform = 'scale(1)')}
        >−</button>
        <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--label-primary)', minWidth: 52, letterSpacing: '-0.5px' }}>
          {value}
        </span>
        <button
          onClick={() => onChange(Math.min(max, value + step))}
          style={{
            width: 34, height: 34, borderRadius: '50%', border: 'none',
            background: 'var(--color-blue)', color: 'white',
            fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-sans)', transition: 'all 150ms var(--spring)',
            WebkitTapHighlightColor: 'transparent',
          }}
          onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.9)')}
          onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
          onTouchStart={e => (e.currentTarget.style.transform = 'scale(0.9)')}
          onTouchEnd={e => (e.currentTarget.style.transform = 'scale(1)')}
        >+</button>
      </div>
    </div>
  );
}

export function WorkoutLogger() {
  const [selected, setSelected] = useState<typeof EXERCISES[0] | null>(null);
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(10);
  const [weight, setWeight] = useState(60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('');
  const recRef = useRef<any>(null);

  const handleLog = async () => {
    if (!selected) return;
    setIsSubmitting(true);
    try {
      await logWorkout({ exerciseName: selected.name, sets, reps, weightKg: weight });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch { /* silent */ } finally {
      setIsSubmitting(false);
    }
  };

  const startVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setVoiceStatus('Voice not supported. Try Chrome.'); return; }
    recRef.current = new SR();
    recRef.current.lang = 'en-IN';
    recRef.current.onstart = () => { setIsListening(true); setVoiceStatus('Listening…'); };
    recRef.current.onresult = async (e: any) => {
      const t = e.results[0][0].transcript;
      setVoiceStatus(`"${t}"`);
      try {
        const res = await parseVoiceInput(t);
        if (res.data.action === 'log_workout' && res.data.data) {
          const d = res.data.data;
          if (d.exerciseName) {
            const match = EXERCISES.find(ex => ex.name.toLowerCase().includes(d.exerciseName.toLowerCase()));
            if (match) setSelected(match);
          }
          if (d.sets) setSets(d.sets);
          if (d.reps) setReps(d.reps);
          if (d.weightKg) setWeight(d.weightKg);
        }
      } catch { setVoiceStatus('Could not parse. Fill manually.'); }
    };
    recRef.current.onerror = () => setIsListening(false);
    recRef.current.onend = () => setIsListening(false);
    recRef.current.start();
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.4px', color: 'var(--label-primary)' }}>Log Workout</h1>
          <p style={{ fontSize: 15, color: 'var(--label-secondary)', marginTop: 2 }}>Track sets, reps and weight</p>
        </div>
        <button
          onClick={isListening ? () => recRef.current?.stop() : startVoice}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px',
            borderRadius: 'var(--radius-full)', border: 'none', cursor: 'pointer',
            background: isListening ? 'var(--color-red)' : 'var(--fill-primary)',
            color: isListening ? 'white' : 'var(--label-primary)',
            fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-sans)',
            transition: 'all 200ms var(--spring)',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          {isListening ? 'Stop' : 'Voice'}
        </button>
      </div>

      {/* Voice status */}
      {voiceStatus && (
        <div className="apple-card animate-fade-in" style={{
          padding: '12px 16px', marginBottom: 16,
          border: '1px solid var(--color-blue)20',
          background: 'var(--color-blue)08',
        }}>
          <p style={{ fontSize: 14, color: 'var(--color-blue)' }}>🎤 {voiceStatus}</p>
        </div>
      )}

      {/* Exercise picker */}
      <p className="section-title">CHOOSE EXERCISE</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
        {EXERCISES.map(ex => (
          <button
            key={ex.name}
            onClick={() => setSelected(ex)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              padding: '14px 8px',
              borderRadius: 'var(--radius-lg)', border: 'none', cursor: 'pointer',
              background: selected?.name === ex.name ? 'var(--color-green)' : 'var(--bg-secondary)',
              color: selected?.name === ex.name ? 'white' : 'var(--label-primary)',
              transition: 'all 200ms var(--spring)',
              boxShadow: selected?.name === ex.name ? '0 4px 16px var(--color-green)40' : 'var(--shadow-sm)',
              transform: selected?.name === ex.name ? 'scale(1.03)' : 'scale(1)',
              WebkitTapHighlightColor: 'transparent',
              fontFamily: 'var(--font-sans)',
            }}
          >
            <span style={{ fontSize: 22 }}>{ex.emoji}</span>
            <span style={{ fontSize: 11, fontWeight: 600, textAlign: 'center', lineHeight: 1.2 }}>{ex.name}</span>
            <span style={{
              fontSize: 10, opacity: 0.7,
              color: selected?.name === ex.name ? 'rgba(255,255,255,0.8)' : 'var(--label-secondary)',
            }}>{ex.muscle}</span>
          </button>
        ))}
      </div>

      {/* Sets / Reps / Weight steppers */}
      {selected && (
        <div className="apple-card animate-scale-in" style={{ padding: '24px 20px', marginBottom: 24 }}>
          <p style={{ fontSize: 17, fontWeight: 600, color: 'var(--label-primary)', textAlign: 'center', marginBottom: 24 }}>
            {selected.emoji} {selected.name}
          </p>
          <div style={{ display: 'flex', gap: 16 }}>
            <NumberStepper label="Sets" value={sets} onChange={setSets} min={1} max={20} />
            <div style={{ width: 1, background: 'var(--separator)' }} />
            <NumberStepper label="Reps" value={reps} onChange={setReps} min={1} max={100} />
            <div style={{ width: 1, background: 'var(--separator)' }} />
            <NumberStepper label="Weight kg" value={weight} onChange={setWeight} min={0} max={500} step={2.5} />
          </div>

          {/* Volume calc */}
          <div style={{
            marginTop: 20, padding: '12px', borderRadius: 10,
            background: 'var(--fill-tertiary)',
            display: 'flex', justifyContent: 'space-around',
          }}>
            {[
              { label: 'Total Volume', value: `${sets * reps * weight} kg` },
              { label: 'Sets × Reps', value: `${sets} × ${reps}` },
            ].map(({ label, value }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 11, color: 'var(--label-secondary)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--label-primary)' }}>{value}</p>
              </div>
            ))}
          </div>

          <button
            onClick={handleLog}
            disabled={isSubmitting}
            style={{
              marginTop: 20, width: '100%', padding: 16, borderRadius: 'var(--radius-md)',
              border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)',
              fontSize: 16, fontWeight: 700, letterSpacing: '-0.2px',
              background: success ? 'var(--color-green)' : 'var(--color-blue)',
              color: 'white', transition: 'all 200ms var(--spring)',
              boxShadow: success ? '0 4px 20px var(--color-green)40' : '0 4px 20px var(--color-blue)40',
              transform: isSubmitting ? 'scale(0.98)' : 'scale(1)',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {success ? '✓ Set Logged!' : isSubmitting ? 'Logging…' : '+ Log Set'}
          </button>
        </div>
      )}

      {/* Personal Records */}
      <p className="section-title">PERSONAL RECORDS</p>
      <div className="apple-card" style={{ padding: '4px 0' }}>
        {RECENT_PRS.map(({ name, pr, delta, positive }) => (
          <div key={name} className="list-row">
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'var(--color-orange)18',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Flame size={16} color="var(--color-orange)" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--label-primary)' }}>{name}</p>
              <p style={{ fontSize: 13, color: 'var(--label-secondary)' }}>PR: {pr}</p>
            </div>
            <span style={{
              fontSize: 13, fontWeight: 600,
              color: positive ? 'var(--color-green)' : 'var(--label-secondary)',
            }}>{delta}</span>
            <ChevronRight size={16} color="var(--label-tertiary)" />
          </div>
        ))}
      </div>
    </div>
  );
}
