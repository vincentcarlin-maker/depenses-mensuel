import React from 'react';

const Logo = () => (
    <svg width="36" height="36" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-3">
        <rect width="40" height="40" rx="8" fill="url(#paint0_linear_logo)"/>
        <path d="M10 28V20" stroke="#99f6e4" strokeWidth="3" strokeLinecap="round"/>
        <path d="M16 28V15" stroke="#99f6e4" strokeWidth="3" strokeLinecap="round"/>
        <path d="M22 28V22" stroke="#99f6e4" strokeWidth="3" strokeLinecap="round"/>
        <path d="M28 28V12" stroke="#99f6e4" strokeWidth="3" strokeLinecap="round"/>
        <defs>
            <linearGradient id="paint0_linear_logo" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                <stop stopColor="#2d3748"/>
                <stop offset="1" stopColor="#1a202c"/>
            </linearGradient>
        </defs>
    </svg>
);


const Header: React.FC = () => {
  return (
    <header className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg">
      <div className="container mx-auto px-4 py-5 md:px-8 flex items-center">
        <Logo />
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
          Suivi des Dépenses
        </h1>
      </div>
    </header>
  );
};

export default Header;