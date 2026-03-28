import React from 'react';
import { cn } from '../../lib/utils';

interface ProgressRingProps {
  progress: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  trackColor?: string;
  progressColor?: string;
  icon?: React.ReactNode;
  title: string;
  valueText: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 120,
  strokeWidth = 10,
  trackColor = "text-dark-800",
  progressColor = "text-brand-500",
  icon,
  title,
  valueText
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(100, progress) / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-2 rounded-2xl bg-dark-800/20 shadow-inner">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        {/* Background track */}
        <svg fill="transparent" className={`absolute transform -rotate-90 w-full h-full ${trackColor}`}>
          <circle
            stroke="currentColor"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
          />
        </svg>

        {/* Foreground progress */}
        <svg fill="transparent" className={`absolute transform -rotate-90 w-full h-full ${progressColor} drop-shadow-[0_0_8px_currentColor]`}>
          <circle
            stroke="currentColor"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        
        {/* Center label */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <div className={`mb-1 ${progressColor}`}>{icon}</div>
        </div>
      </div>
      
      <div className="mt-4 text-center">
        <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider">{title}</h4>
        <p className="font-bold text-lg text-white mt-1">{valueText}</p>
      </div>
    </div>
  );
};
