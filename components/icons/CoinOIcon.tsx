import React from 'react';

interface CoinOIconProps {
  className?: string;
  style?: React.CSSProperties;
}

export const CoinOIcon: React.FC<CoinOIconProps> = ({ 
  className = "w-[0.86em] h-[0.86em]",
  style
}) => {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block select-none align-baseline shrink-0 ${className}`}
      style={{
        verticalAlign: '-0.075em',
        margin: '0 0.04em',
        ...style
      }}
      aria-label="o"
      role="img"
    >
      <defs>
        {/* Outer 3D rounded rim gradient */}
        <linearGradient id="coinRim3D" x1="20%" y1="15%" x2="85%" y2="85%">
          <stop offset="0%" stopColor="#FFF37A" />
          <stop offset="25%" stopColor="#FFDC26" />
          <stop offset="60%" stopColor="#FFB800" />
          <stop offset="100%" stopColor="#E68A00" />
        </linearGradient>

        {/* Specular highlight on top-left edge of the rim */}
        <linearGradient id="coinRimHighlight" x1="15%" y1="10%" x2="85%" y2="90%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="28%" stopColor="#FFF390" stopOpacity="0.75" />
          <stop offset="70%" stopColor="#FF9E00" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#D47400" stopOpacity="0.5" />
        </linearGradient>

        {/* Recessed coin floor gradient */}
        <radialGradient id="coinFloorGrad" cx="38%" cy="36%" r="65%">
          <stop offset="0%" stopColor="#FFCA12" />
          <stop offset="45%" stopColor="#FFB600" />
          <stop offset="80%" stopColor="#FFA400" />
          <stop offset="100%" stopColor="#E58400" />
        </radialGradient>

        {/* Inner shadow cast by rim onto the floor */}
        <radialGradient id="coinFloorShadow" cx="42%" cy="40%" r="50%">
          <stop offset="72%" stopColor="#000000" stopOpacity="0" />
          <stop offset="100%" stopColor="#9C4D00" stopOpacity="0.5" />
        </radialGradient>

        {/* 3D drop shadow under the Euro symbol */}
        <filter id="coinEuroShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="1.4" dy="2.6" stdDeviation="1.6" floodColor="#853E00" floodOpacity="0.65" />
          <feDropShadow dx="0.5" dy="1.0" stdDeviation="0.7" floodColor="#5C2900" floodOpacity="0.4" />
        </filter>

        {/* Euro symbol 3D extrusion under-bevel */}
        <linearGradient id="coinEuroSide" x1="20%" y1="20%" x2="80%" y2="80%">
          <stop offset="0%" stopColor="#E68D00" />
          <stop offset="100%" stopColor="#C46600" />
        </linearGradient>

        {/* Euro symbol front face gradient */}
        <linearGradient id="coinEuroFace" x1="25%" y1="15%" x2="80%" y2="85%">
          <stop offset="0%" stopColor="#FFF48C" />
          <stop offset="30%" stopColor="#FFE648" />
          <stop offset="70%" stopColor="#FFD016" />
          <stop offset="100%" stopColor="#FFAF00" />
        </linearGradient>

        {/* Top gloss highlight on the Euro symbol */}
        <linearGradient id="coinEuroGloss" x1="25%" y1="10%" x2="40%" y2="90%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
          <stop offset="50%" stopColor="#FFF4A0" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#FFA000" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* 1. Outer Coin Base & Rim */}
      <circle cx="50" cy="50" r="45" fill="url(#coinRim3D)" />
      <circle cx="50" cy="50" r="44.2" stroke="url(#coinRimHighlight)" strokeWidth="1.4" fill="none" />

      {/* 2. Recessed Coin Floor */}
      <circle cx="50" cy="50" r="35.5" fill="url(#coinFloorGrad)" />
      <circle cx="50" cy="50" r="35.5" fill="url(#coinFloorShadow)" />

      {/* 3. Euro Symbol Group with 3D Shadow & Extrusion */}
      <g filter="url(#coinEuroShadow)">
        {/* Extruded under-layer slightly offset down-right */}
        <path
          d="M 62 36 A 16 16 0 1 0 62 64"
          fill="none"
          stroke="url(#coinEuroSide)"
          strokeWidth="7.8"
          strokeLinecap="round"
          transform="translate(0.5, 1.2)"
        />
        <line
          x1="30"
          y1="46"
          x2="58"
          y2="46"
          stroke="url(#coinEuroSide)"
          strokeWidth="5.8"
          strokeLinecap="round"
          transform="translate(0.5, 1.2)"
        />
        <line
          x1="30"
          y1="54"
          x2="56"
          y2="54"
          stroke="url(#coinEuroSide)"
          strokeWidth="5.8"
          strokeLinecap="round"
          transform="translate(0.5, 1.2)"
        />

        {/* Main Euro symbol body */}
        <path
          d="M 62 36 A 16 16 0 1 0 62 64"
          fill="none"
          stroke="url(#coinEuroFace)"
          strokeWidth="7.6"
          strokeLinecap="round"
        />
        <line
          x1="30"
          y1="46"
          x2="58"
          y2="46"
          stroke="url(#coinEuroFace)"
          strokeWidth="5.6"
          strokeLinecap="round"
        />
        <line
          x1="30"
          y1="54"
          x2="56"
          y2="54"
          stroke="url(#coinEuroFace)"
          strokeWidth="5.6"
          strokeLinecap="round"
        />
      </g>

      {/* 4. Glossy Specular Highlights on the Euro symbol top edge */}
      <path
        d="M 60 36.5 A 16 16 0 1 0 60 63.5"
        fill="none"
        stroke="url(#coinEuroGloss)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <line
        x1="31"
        y1="45.2"
        x2="57"
        y2="45.2"
        stroke="#FFFFFF"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeOpacity="0.75"
      />
      <line
        x1="31"
        y1="53.2"
        x2="55"
        y2="53.2"
        stroke="#FFFFFF"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeOpacity="0.65"
      />
    </svg>
  );
};

export default CoinOIcon;
