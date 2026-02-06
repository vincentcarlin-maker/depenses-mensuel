
import React from 'react';

interface IconProps {
  className?: string;
}

export const MandatoryIcon: React.FC<IconProps> = ({ className = "h-5 w-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

export const FuelIcon: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M19.77 7.23l.01-.01-3.72-3.72L15 4.56l2.11 2.11c-.94.36-1.61 1.26-1.61 2.33 0 1.38 1.12 2.5 2.5 2.5.36 0 .69-.08 1-.21v7.21c0 .55-.45 1-1 1s-1-.45-1-1V14c0-1.1-.9-2-2-2h-1V5c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v16h10v-7.5h1v4.5c0 1.65 1.35 3 3 3s3-1.35 3-3V9c0-.69-.28-1.32-.73-1.77zM12 10H6V5h6v5z" fill="currentColor"/>
  </svg>
);

export const HeatingIcon: React.FC<IconProps> = ({ className = "h-5 w-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1.001A3.75 3.75 0 0012 18z" />
  </svg>
);

export const GroceriesIcon: React.FC<IconProps> = ({ className = "h-5 w-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
  </svg>
);

export const RestaurantIcon: React.FC<IconProps> = ({ className = "h-5 w-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 2v20" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
  </svg>
);

export const CarRepairsIcon: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.5 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z" fill="currentColor"/>
  </svg>
);

export const MiscIcon: React.FC<IconProps> = ({ className = "h-5 w-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
  </svg>
);

export const GiftIcon: React.FC<IconProps> = ({ className = "h-5 w-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <rect x="3" y="8" width="18" height="4" rx="1" strokeLinecap="round" strokeLinejoin="round" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" />
  </svg>
);

export const ClothingIcon: React.FC<IconProps> = ({ className = "h-5 w-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M19 6h-2c0-2.76-2.24-5-5-5S7 3.24 7 6H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-3c1.66 0 3 1.34 3 3H9c0-1.66 1.34-3 3-3z" fill="currentColor"/>
  </svg>
);

export const PalmTreeIcon: React.FC<IconProps> = ({ className = "h-5 w-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 22V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 11C12 11 15 6 21 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 11C12 11 9 6 3 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 11C12 11 17 9 19 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 11C12 11 7 9 5 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const BirthdayIcon: React.FC<IconProps> = ({ className = "h-5 w-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15h14v5a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-5z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15V8" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5a1.5 1.5 0 0 1 1.5 1.5c0 .83-.67 1.5-1.5 1.5S10.5 6.83 10.5 6c0-.83.67-1.5 1.5-1.5z" />
  </svg>
);

export const ShieldIcon: React.FC<IconProps> = ({ className = "h-5 w-5" }) => (
    <svg viewBox="0 0 40 40" className={className}>
        <circle cx="20" cy="20" r="20" fill="#10B981"/>
        <path d="M20 12v16M12 20h16" stroke="white" strokeWidth="4" strokeLinecap="round"/>
    </svg>
);

export const WifiIcon: React.FC<IconProps> = ({ className }) => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="12" cy="12" r="12" fill="#6366F1"/>
    <path d="M5 10c3-3.5 11-3.5 14 0" stroke="white" stroke-width="2" stroke-linecap="round"/>
    <path d="M8 13.5c2-2.5 6-2.5 8 0" stroke="white" stroke-width="2" stroke-linecap="round"/>
    <path d="M10.5 16.5c1-1 2.5-1 3.5 0" stroke="white" stroke-width="2" stroke-linecap="round"/>
    <circle cx="12.2" cy="20.2" r="1.5" fill="white"/>
  </svg>
);

export const MusicNoteIcon: React.FC<IconProps> = ({ className = "h-5 w-5" }) => (
  <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="deezerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF4FD8"/>
        <stop offset="100%" stopColor="#7B4DFF"/>
      </linearGradient>
      <linearGradient id="col1grad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FFD12C" />
        <stop offset="100%" stopColor="#FFAA00" />
      </linearGradient>
      <linearGradient id="col2grad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FFEE58" />
        <stop offset="100%" stopColor="#FFD600" />
      </linearGradient>
      <linearGradient id="col3grad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FF80AB" />
        <stop offset="100%" stopColor="#F50057" />
      </linearGradient>
      <linearGradient id="col4grad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#40C4FF" />
        <stop offset="100%" stopColor="#0091EA" />
      </linearGradient>
    </defs>
    
    <circle cx="32" cy="32" r="30" fill="url(#deezerGradient)"/>
    
    <g id="equalizer">
      {/* Column 1 - Orange/Yellow */}
      <g fill="url(#col1grad)">
        <rect x="16" y="35" width="6" height="4" rx="1.5" />
        <rect x="16" y="40" width="6" height="4" rx="1.5" />
      </g>
      {/* Column 2 - Yellow */}
      <g fill="url(#col2grad)">
        <rect x="25" y="30" width="6" height="4" rx="1.5" />
        <rect x="25" y="35" width="6" height="4" rx="1.5" />
        <rect x="25" y="40" width="6" height="4" rx="1.5" />
      </g>
      {/* Column 3 - Pink */}
      <g fill="url(#col3grad)">
        <rect x="34" y="25" width="6" height="4" rx="1.5" />
        <rect x="34" y="30" width="6" height="4" rx="1.5" />
        <rect x="34" y="35" width="6" height="4" rx="1.5" />
        <rect x="34" y="40" width="6" height="4" rx="1.5" />
      </g>
      {/* Column 4 - Blue */}
      <g fill="url(#col4grad)">
        <rect x="43" y="20" width="6" height="4" rx="1.5" />
        <rect x="43" y="25" width="6" height="4" rx="1.5" />
        <rect x="43" y="30" width="6" height="4" rx="1.5" />
        <rect x="43" y="35" width="6" height="4" rx="1.5" />
        <rect x="43" y="40" width="6" height="4" rx="1.5" />
      </g>
    </g>
  </svg>
);

export const DevicePhoneMobileIcon: React.FC<IconProps> = ({ className = "h-5 w-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75A2.25 2.25 0 0015.75 1.5h-2.25m-3 14.25h3" />
  </svg>
);

export const CeoIcon: React.FC<IconProps> = ({ className = "h-5 w-5" }) => (
  <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="20" cy="20" r="20" fill="#0EA5E9"/>
    <path d="M20 10c-1.2 0-8 6.5-8 11.5 0 4.5 3.5 8.5 8 8.5s8-4 8-8.5c0-5-6.8-11.5-8-11.5z" fill="white"/>
  </svg>
);

export const SfrIcon: React.FC<IconProps> = ({ className = "h-5 w-5" }) => (
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
            <radialGradient id="sfrRedGradient" cx="50%" cy="40%" r="60%" fx="50%" fy="40%">
                <stop offset="0%" stopColor="#f8574e"/>
                <stop offset="100%" stopColor="#d41d14"/>
            </radialGradient>
        </defs>
        <circle cx="32" cy="32" r="30" fill="url(#sfrRedGradient)"/>
        <text
            x="32"
            y="32"
            fontFamily="'Arial Black', 'Arial Bold', sans-serif"
            fontSize="24"
            fontWeight="900"
            fill="white"
            textAnchor="middle"
            dominantBaseline="middle"
        >
            SFR
        </text>
    </svg>
);

export const TotalEnergiesIcon: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="20" cy="20" r="20" fill="#FACC15"/>
    <path d="M22 8L10 22h10l-1 10 12-14h-10z" fill="white"/>
  </svg>
);

export const TrashBinIcon: React.FC<IconProps> = ({ className = "h-5 w-5" }) => (
  <svg viewBox="0 0 40 40" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="20" fill="#EF4444"/>
    <path d="M14 29c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V17H14v12zM27 14h-3.5l-1-1h-5l-1 1H13v2h14v-2z" fill="white"/>
  </svg>
);
