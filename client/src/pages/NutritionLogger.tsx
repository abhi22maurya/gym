import { useState, useRef } from 'react';
import { logMeal, analyzeFoodImage } from '../lib/api';
import { ActivityRing } from '../components/ui/ActivityRing';
import { Camera, ChevronRight } from 'lucide-react';

const INDIAN_PRESETS = [
  { name: 'Dal Chawal', emoji: '🍛', calories: 350, proteinG: 12, carbsG: 60, fatG: 5, mealType: 'lunch' },
  { name: 'Roti + Sabji', emoji: '🫓', calories: 280, proteinG: 8, carbsG: 48, fatG: 6, mealType: 'dinner' },
  { name: 'Chicken Breast', emoji: '🍗', calories: 165, proteinG: 31, carbsG: 0, fatG: 3.6, mealType: 'lunch' },
  { name: 'Paneer Bhurji', emoji: '🧀', calories: 300, proteinG: 20, carbsG: 6, fatG: 22, mealType: 'lunch' },
  { name: 'Omelette (3 eggs)', emoji: '🍳', calories: 210, proteinG: 18, carbsG: 1, fatG: 15, mealType: 'breakfast' },
  { name: 'Banana', emoji: '🍌', calories: 90, proteinG: 1, carbsG: 23, fatG: 0.3, mealType: 'snack' },
  { name: 'Whey Protein', emoji: '🥛', calories: 130, proteinG: 25, carbsG: 5, fatG: 1.5, mealType: 'snack' },
  { name: 'Idli Sambhar', emoji: '🍱', calories: 250, proteinG: 8, carbsG: 45, fatG: 3, mealType: 'breakfast' },
  { name: 'Curd Rice', emoji: '🍚', calories: 220, proteinG: 6, carbsG: 42, fatG: 4, mealType: 'lunch' },
  { name: 'Rajma Chawal', emoji: '🫘', calories: 380, proteinG: 14, carbsG: 65, fatG: 6, mealType: 'lunch' },
];

interface MacroState {
  mealName: string; calories: number; proteinG: number; carbsG: number; fatG: number; mealType: string;
}

const EMPTY: MacroState = { mealName: '', calories: 0, proteinG: 0, carbsG: 0, fatG: 0, mealType: 'lunch' };

export function NutritionLogger() {
  const [form, setForm] = useState<MacroState>(EMPTY);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const totalMacros = form.proteinG + form.carbsG + form.fatG || 1;
  const proteinPct = Math.round((form.proteinG / totalMacros) * 100);
  const carbsPct = Math.round((form.carbsG / totalMacros) * 100);
  const fatPct = Math.round((form.fatG / totalMacros) * 100);

  const handlePreset = (p: typeof INDIAN_PRESETS[0]) => {
    setForm({ mealName: p.name, calories: p.calories, proteinG: p.proteinG, carbsG: p.carbsG, fatG: p.fatG, mealType: p.mealType });
    setImagePreview('');
  };

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      const src = ev.target?.result as string;
      setImagePreview(src);
      setIsAnalyzing(true);
      try {
        const res = await analyzeFoodImage(src.split(',')[1], 'Indian food');
        const d = res.data;
        setForm({ mealName: d.mealName ?? 'Unknown', calories: d.calories ?? 0, proteinG: d.proteinG ?? 0, carbsG: d.carbsG ?? 0, fatG: d.fatG ?? 0, mealType: 'lunch' });
      } catch { /* silent */ } finally { setIsAnalyzing(false); }
    };
    reader.readAsDataURL(file);
  };

  const handleLog = async () => {
    if (!form.mealName) return;
    setIsSubmitting(true);
    try {
      await logMeal(form);
      setSuccess(true);
      setForm(EMPTY);
      setImagePreview('');
      setTimeout(() => setSuccess(false), 2500);
    } catch { /* silent */ } finally { setIsSubmitting(false); }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.4px', color: 'var(--label-primary)' }}>Nutrition</h1>
          <p style={{ fontSize: 15, color: 'var(--label-secondary)', marginTop: 2 }}>Smart diet with Indian presets + AI scan</p>
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px',
            borderRadius: 'var(--radius-full)', border: 'none', cursor: 'pointer',
            background: isAnalyzing ? 'var(--color-orange)' : 'var(--fill-primary)',
            color: isAnalyzing ? 'white' : 'var(--label-primary)',
            fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-sans)',
            transition: 'all 200ms var(--spring)',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <Camera size={16} />
          {isAnalyzing ? 'Analyzing…' : 'Scan Food'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImage} />
      </div>

      {/* Macro ring summary (shows when a food is selected) */}
      {form.mealName && (
        <div className="apple-card animate-scale-in" style={{
          padding: '20px', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 20,
        }}>
          {/* Macro donut */}
          <div style={{ position: 'relative', width: 90, height: 90, flexShrink: 0 }}>
            <ActivityRing progress={proteinPct} color="var(--color-blue)" size={90} strokeWidth={9} />
            <div style={{ position: 'absolute', inset: 9 }}>
              <ActivityRing progress={carbsPct} color="var(--color-yellow)" size={72} strokeWidth={9} />
              <div style={{ position: 'absolute', inset: 9 }}>
                <ActivityRing progress={fatPct} color="var(--color-pink)" size={54} strokeWidth={9} />
              </div>
            </div>
            {/* Center */}
            <div style={{
              position: 'absolute', inset: 0, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column',
            }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--label-primary)' }}>{form.calories}</span>
              <span style={{ fontSize: 9, color: 'var(--label-secondary)', fontWeight: 500 }}>kcal</span>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--label-primary)', marginBottom: 10 }}>{form.mealName}</p>
            {[
              { label: 'Protein', g: form.proteinG, color: 'var(--color-blue)' },
              { label: 'Carbs', g: form.carbsG, color: 'var(--color-yellow)' },
              { label: 'Fat', g: form.fatG, color: 'var(--color-pink)' },
            ].map(({ label, g, color }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: 3, background: color }} />
                <span style={{ fontSize: 13, color: 'var(--label-secondary)', flex: 1 }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--label-primary)' }}>{g}g</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image preview (from camera scan) */}
      {imagePreview && (
        <div className="animate-scale-in" style={{ marginBottom: 16 }}>
          <img src={imagePreview} alt="Food scan" style={{
            width: '100%', height: 180, objectFit: 'cover',
            borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)',
          }} />
        </div>
      )}

      {/* Indian Presets */}
      <p className="section-title">🇮🇳 INDIAN FOOD PRESETS</p>
      <div className="apple-card" style={{ marginBottom: 24, padding: '4px 0' }}>
        {INDIAN_PRESETS.map(p => (
          <button
            key={p.name}
            onClick={() => handlePreset(p)}
            className="list-row"
            style={{
              width: '100%', textAlign: 'left', cursor: 'pointer',
              background: form.mealName === p.name ? 'var(--color-orange)08' : undefined,
              borderLeft: form.mealName === p.name ? `3px solid var(--color-orange)` : '3px solid transparent',
            }}
          >
            <span style={{ fontSize: 22, flexShrink: 0 }}>{p.emoji}</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 15, fontWeight: form.mealName === p.name ? 600 : 400, color: 'var(--label-primary)' }}>
                {p.name}
              </p>
              <p style={{ fontSize: 13, color: 'var(--label-secondary)' }}>
                {p.calories} kcal · {p.proteinG}g protein
              </p>
            </div>
            <span style={{ fontSize: 12, color: 'var(--label-tertiary)', background: 'var(--fill-tertiary)', padding: '2px 8px', borderRadius: 8, fontWeight: 500 }}>
              {p.mealType}
            </span>
            <ChevronRight size={14} color="var(--label-quaternary)" style={{ marginLeft: 4 }} />
          </button>
        ))}
      </div>

      {/* Log button */}
      <button
        onClick={handleLog}
        disabled={!form.mealName || isSubmitting}
        style={{
          width: '100%', padding: 16, borderRadius: 'var(--radius-md)',
          border: 'none', cursor: form.mealName ? 'pointer' : 'not-allowed',
          fontFamily: 'var(--font-sans)', fontSize: 16, fontWeight: 700,
          background: success ? 'var(--color-green)' : form.mealName ? 'var(--color-blue)' : 'var(--fill-primary)',
          color: form.mealName ? 'white' : 'var(--label-tertiary)',
          transition: 'all 250ms var(--spring)',
          boxShadow: form.mealName ? '0 4px 20px var(--color-blue)30' : 'none',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {success ? '✓ Meal Logged!' : isSubmitting ? 'Logging…' : form.mealName ? `Log ${form.mealName}` : 'Select a food above'}
      </button>
    </div>
  );
}
