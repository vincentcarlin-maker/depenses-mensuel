
import React from 'react';

const EuroIcon: React.FC<{ className?: string }> = ({ className = "h-3.5 w-3.5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.2 7a6 7 0 1 0 0 10M5 10h8M5 14h8" />
    </svg>
);

export default EuroIcon;
