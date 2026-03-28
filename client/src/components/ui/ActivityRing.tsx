import { useEffect, useRef } from 'react';

interface ActivityRingProps {
  /** 0–100 */
  progress: number;
  color: string;
  size: number;
  strokeWidth: number;
  /** Optional track color — defaults to 15% opacity of color */
  trackColor?: string;
  children?: React.ReactNode;
}

export function ActivityRing({
  progress,
  color,
  size,
  strokeWidth,
  trackColor,
  children,
}: ActivityRingProps) {
  const circleRef = useRef<SVGCircleElement>(null);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(Math.max(progress, 0), 100) / 100) * circumference;

  // Animate on progress change
  useEffect(() => {
    const el = circleRef.current;
    if (!el) return;
    el.style.strokeDashoffset = String(circumference); // start from 0
    requestAnimationFrame(() => {
      el.style.transition = 'stroke-dashoffset 1s cubic-bezier(0.25, 0, 0, 1)';
      el.style.strokeDashoffset = String(offset);
    });
  }, [progress, circumference, offset]);

  const center = size / 2;

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track ring */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={trackColor ?? color + '25'}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Progress ring */}
        <circle
          ref={circleRef}
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
        />
      </svg>
      {children && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

interface TripleRingProps {
  move: number;   // 0–100
  exercise: number;
  stand: number;
  size?: number;
}

export function TripleActivityRing({ move, exercise, stand, size = 120 }: TripleRingProps) {
  const sw = size * 0.095; // stroke width proportional
  const gap = sw * 1.15;   // gap between rings

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      {/* Outer — Move (red/pink) */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <ActivityRing progress={move} color="#FA2D55" size={size} strokeWidth={sw} />
      </div>
      {/* Middle — Exercise (green) */}
      <div style={{ position: 'absolute', inset: gap }}>
        <ActivityRing progress={exercise} color="#A3F70F" size={size - gap * 2} strokeWidth={sw} />
      </div>
      {/* Inner — Stand (teal) */}
      <div style={{ position: 'absolute', inset: gap * 2 }}>
        <ActivityRing progress={stand} color="#4DF0CD" size={size - gap * 4} strokeWidth={sw} />
      </div>
    </div>
  );
}
