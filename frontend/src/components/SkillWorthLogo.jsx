import React from 'react';

export default function SkillWorthLogo({ className = '', height = 40, showSubtitle = true, inverted = false }) {
  const primaryFill = inverted ? '#A5F0EB' : '#176B68';
  const textFill = inverted ? '#F3F1EB' : '#17212B';
  const subFill = inverted ? '#BEC9C7' : '#65727A';
  const sealStroke = inverted ? '#F3F1EB' : '#17212B';
  const sealBg = inverted ? '#17212B' : '#F7F5EF';

  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      <svg
        viewBox="0 0 240 60"
        height={height}
        className="w-auto max-w-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Symbol: Checkmark + Stepped Skill Horizon + Arch of Recognition */}
        <g transform="translate(8, 8)">
          {/* Base Shield/Seal Arc */}
          <path
            d="M 6 12 C 6 28 22 40 22 40 C 22 40 38 28 38 12 L 22 4 Z"
            stroke={sealStroke}
            strokeWidth="2.5"
            fill={sealBg}
            strokeLinejoin="round"
          />
          {/* Deep Teal stepped path representing experience stages */}
          <path
            d="M 12 24 L 18 24 L 18 18 L 26 18 L 26 12 L 32 12"
            stroke={primaryFill}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Warm Gold Recognition Star/Check mark vertex */}
          <circle cx="22" cy="27" r="3" fill="#D7A84B" />
          <path
            d="M 16 27 L 20 31 L 28 21"
            stroke="#32745B"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
        {/* Wordmark */}
        <text
          x="60"
          y="34"
          fontFamily="'Manrope', 'Inter', -apple-system, sans-serif"
          fontWeight="800"
          fontSize="22"
          fill={textFill}
          letterSpacing="-0.03em"
        >
          Skill<tspan fill={primaryFill}>Worth</tspan>
        </text>
        {showSubtitle && (
          <text
            x="60"
            y="46"
            fontFamily="'Inter', -apple-system, sans-serif"
            fontWeight="600"
            fontSize="8.5"
            fill={subFill}
            letterSpacing="0.16em"
          >
            RECOGNITION OF PRIOR LEARNING
          </text>
        )}
      </svg>
    </div>
  );
}
