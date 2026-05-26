import React, { useRef, useState, useEffect } from 'react';

interface KnobProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (val: number) => void;
  label: string;
  icon: string;
  color: string;
  glowColor: string;
}

export function Knob({
  value,
  min = 0,
  max = 100,
  onChange,
  label,
  icon,
  color,
  glowColor,
}: KnobProps) {
  const knobRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);

  // Math for the arc visualizer
  const radius = 35;
  const circumference = 2 * Math.PI * radius; // ~219.91
  const arcLength = circumference * 0.75; // ~164.93 (270 degrees out of 360)
  const strokeDashoffset = arcLength - (arcLength * ((value - min) / (max - min)));

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!knobRef.current) return;

    knobRef.current.setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragStartY.current = e.clientY;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    const dy = dragStartY.current - e.clientY; // drag up is positive
    dragStartY.current = e.clientY; // update reference point for next movement frame

    const sensitivity = 1.15; // smooth professional fader response multiplier
    let newValue = value + dy * sensitivity;
    newValue = Math.max(min, Math.min(max, Math.round(newValue)));

    if (newValue !== value) {
      onChange(newValue);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    if (knobRef.current) {
      knobRef.current.releasePointerCapture(e.pointerId);
    }
    setIsDragging(false);
  };

  // Support double-clicking the dial to reset back to mute (or 0)
  const handleDoubleClick = () => {
    onChange(0);
  };

  // Angle of the interactive internal arrow indicating rotation
  const percentage = (value - min) / (max - min);
  const minAngle = 135; // South-West
  const maxAngle = 405; // South-East
  const currentAngle = minAngle + percentage * 270;

  return (
    <div className="flex flex-col items-center">
      {/* Knob Container with custom cursors */}
      <div
        ref={knobRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDoubleClick={handleDoubleClick}
        className={`relative w-20 h-20 flex items-center justify-center select-none cursor-ns-resize transition-all duration-300 ${
          isDragging ? 'scale-105 active-knob' : 'hover:scale-102'
        }`}
        style={{ touchAction: 'none' }}
        title={`${label}: ${value}% (Double-click para zerar)`}
      >
        {/* Glow Halo Background */}
        <div 
          className="absolute inset-0 rounded-full transition-all duration-500 opacity-20 pointer-events-none blur-md"
          style={{
            background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
            transform: isDragging ? 'scale(1.15)' : 'scale(0.95)',
          }}
        />

        {/* SVG Dial Elements */}
        <svg width="100%" height="100%" viewBox="0 0 100 100" className="relative z-10 block overflow-visible">
          <defs>
            {/* Real retro-analog physical dial button shading */}
            <radialGradient id="knob-cap-grad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#20203a" />
              <stop offset="70%" stopColor="#111122" />
              <stop offset="100%" stopColor="#080812" />
            </radialGradient>
          </defs>

          {/* 1. Track back rim arc (270 degrees) */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            stroke="rgba(28, 28, 50, 0.75)"
            strokeWidth="5"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
            transform="rotate(135 50 50)"
          />

          {/* 2. Neon dynamic gauge level arc */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth="5.5"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(135 50 50)"
            style={{
              filter: isDragging 
                ? `drop-shadow(0 0 5px ${color}) drop-shadow(0 0 1px ${color})` 
                : `drop-shadow(0 0 2px ${glowColor})`,
              transition: isDragging ? 'none' : 'stroke-dashoffset 150ms ease-out',
            }}
          />

          {/* 3. Physical Central Cap */}
          <circle
            cx="50"
            cy="50"
            r="24"
            fill="url(#knob-cap-grad)"
            stroke={isDragging ? color : '#1c1c35'}
            strokeWidth="1.5"
            className="transition-all duration-200"
            style={{
              filter: isDragging ? 'drop-shadow(0 0 3px rgba(255,255,255,0.1))' : 'none'
            }}
          />

          {/* 4. Synthesizer Dial pointer needle (rotated dynamically) */}
          <g 
            transform={`rotate(${currentAngle} 50 50)`}
            style={{
              transition: isDragging ? 'none' : 'transform 150ms ease-out',
            }}
          >
            {/* Sleek needle line leading to dial edge */}
            <line
              x1="50"
              y1="50"
              x2="50"
              y2="30"
              stroke={color}
              strokeWidth="2.5"
              strokeLinecap="round"
              style={{
                filter: `drop-shadow(0 0 2px ${glowColor})`,
              }}
            />
          </g>
        </svg>

        {/* Display Center value of active knob in small retro typography */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20">
          <span className="text-xs font-mono font-bold tracking-tighter mt-1 text-white opacity-95">
            {value}
          </span>
          <span className="text-[7px] font-mono tracking-widest text-[#52526e] uppercase">
            %
          </span>
        </div>
      </div>

      {/* Label and descriptive details below knob */}
      <span className="text-[10px] font-medium text-[#e2e2f0] flex items-center gap-1 mt-1 font-sans">
        <span className="opacity-90">{icon}</span> {label}
      </span>
    </div>
  );
}
