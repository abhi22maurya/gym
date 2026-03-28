import { useState } from 'react';
import { Activity, ChevronRight } from 'lucide-react';
import { onboardUser } from '../lib/api';

const inputStyle = {
  width: '100%', padding: 16, borderRadius: 12, background: 'var(--bg-secondary)', border: 'none',
  fontSize: 17, color: 'var(--label-primary)', outline: 'none'
};

export function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    weight: '',
    height: '',
    goalType: 'lose_fat'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onboardUser({
        name: formData.name,
        age: Number(formData.age),
        weight: Number(formData.weight),
        height: Number(formData.height),
        goalType: formData.goalType
      });
      onComplete();
    } catch (e) {
      alert('Failed to save profile. Try again.');
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && !formData.name) return;
    if (step === 2 && (!formData.weight || !formData.height)) return;
    
    if (step === 3) {
      handleSubmit();
    } else {
      setStep(s => s + 1);
    }
  };

  return (
    <div style={{ maxWidth: 480, margin: '80px auto', padding: '0 24px' }}>
      <div style={{ marginBottom: 40 }} className="animate-fade-in">
        <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= step ? 'var(--color-blue)' : 'var(--fill-tertiary)' }} />
          ))}
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-1px' }}>
          {step === 1 && "What's your name?"}
          {step === 2 && "Your body metrics"}
          {step === 3 && "What's your goal?"}
        </h1>
        <p style={{ fontSize: 16, color: 'var(--label-secondary)', marginTop: 8 }}>
          {step === 1 && "We'll use this to personalize your journey."}
          {step === 2 && "This helps the AI calculate your daily targets."}
          {step === 3 && "We'll build your AI path around this."}
        </p>
      </div>

      <div className="animate-fade-in" key={step} style={{ marginBottom: 40 }}>
        {step === 1 && (
          <input
            autoFocus
            type="text"
            placeholder="e.g. Abhishek"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            style={{
              width: '100%', padding: '16px 0', fontSize: 28, fontWeight: 600,
              background: 'transparent', border: 'none', borderBottom: '2px solid var(--fill-tertiary)',
              color: 'var(--label-primary)', outline: 'none'
            }}
          />
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ fontSize: 13, color: 'var(--label-secondary)', fontWeight: 600, display: 'block', marginBottom: 8 }}>AGE</label>
              <input type="number" placeholder="25" value={formData.age} onChange={e => setFormData({ ...formData, age: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 13, color: 'var(--label-secondary)', fontWeight: 600, display: 'block', marginBottom: 8 }}>WEIGHT (KG)</label>
              <input type="number" placeholder="75.5" value={formData.weight} onChange={e => setFormData({ ...formData, weight: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 13, color: 'var(--label-secondary)', fontWeight: 600, display: 'block', marginBottom: 8 }}>HEIGHT (CM)</label>
              <input type="number" placeholder="175" value={formData.height} onChange={e => setFormData({ ...formData, height: e.target.value })} style={inputStyle} />
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { id: 'lose_fat', label: 'Lose Fat', desc: 'Burn fat and get lean' },
              { id: 'gain_muscle', label: 'Gain Muscle', desc: 'Build size and strength' },
              { id: 'improve_posture', label: 'Improve Posture', desc: 'Fix mechanics & stay healthy' }
            ].map(goal => (
              <button
                key={goal.id}
                onClick={() => setFormData({ ...formData, goalType: goal.id })}
                style={{
                  padding: 20, borderRadius: 16, border: formData.goalType === goal.id ? '2px solid var(--color-blue)' : '2px solid transparent',
                  background: 'var(--bg-secondary)', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--label-primary)', marginBottom: 4 }}>{goal.label}</div>
                <div style={{ fontSize: 14, color: 'var(--label-secondary)' }}>{goal.desc}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={nextStep}
        disabled={loading}
        style={{
          width: '100%', padding: 18, borderRadius: 100, background: 'var(--color-blue)', color: 'white',
          border: 'none', fontSize: 17, fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8,
          opacity: ((step === 1 && !formData.name) || (step === 2 && (!formData.weight || !formData.height))) ? 0.5 : 1
        }}
      >
        {loading ? <Activity className="animate-spin" size={20} /> : (step === 3 ? "Complete Setup" : "Continue")}
        {!loading && step !== 3 && <ChevronRight size={20} />}
      </button>
    </div>
  );
}
