
import React from 'react';

const EuroIcon: React.FC<{ className?: string }> = ({ className = "h-3.5 w-3.5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 7.756a4.5 4.5 0 010 8.488M7.5 10.5h5.25m-5.25 3h5.25" />
    </svg>
);

export default EuroIcon;
