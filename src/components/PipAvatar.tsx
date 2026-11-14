import React from 'react';

export const PipAvatar: React.FC<{ size?: number }> = ({ size = 48 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className="shrink-0 animate-float-slow"
    >
      {/* Antenna */}
      <line x1="32" y1="6" x2="32" y2="15" stroke="#38bdf8" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="32" cy="6" r="4" fill="#facc15" />
      {/* Ear thrusters */}
      <rect x="6" y="26" width="8" height="16" rx="4" fill="#f472b6" />
      <rect x="50" y="26" width="8" height="16" rx="4" fill="#f472b6" />
      {/* Bot Head */}
      <rect x="13" y="15" width="38" height="36" rx="14" fill="#38bdf8" stroke="#e0f2fe" strokeWidth="2.5" />
      {/* Visor Screen */}
      <rect x="18" y="23" width="28" height="19" rx="8" fill="#120b36" />
      {/* Cute Eyes */}
      <circle cx="26" cy="31" r="3.5" fill="#34d399" />
      <circle cx="38" cy="31" r="3.5" fill="#34d399" />
      <circle cx="27" cy="29.8" r="1.2" fill="#ffffff" />
      <circle cx="39" cy="29.8" r="1.2" fill="#ffffff" />
      {/* Happy Smile */}
      <path d="M27 36.5C29 39 35 39 37 36.5" stroke="#facc15" strokeWidth="2.4" strokeLinecap="round" />
      {/* Bottom Hover Ring */}
      <ellipse cx="32" cy="56" rx="14" ry="3.5" fill="#22d3ee" opacity="0.45" />
    </svg>
  );
};
