import React from 'react';

const Logo = () => (
    <svg width="36" height="36" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-3">
        <circle cx="20" cy="20" r="20" fill="url(#paint0_linear_1_2)"/>
        <path d="M13 28V12L20 18L27 12V28L20 22L13 28Z" fill="white" fillOpacity="0.9"/>
        <defs>
            <linearGradient id="paint0_linear_1_2" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFFFFF" stopOpacity="0.4"/>
                <stop offset="1" stopColor="#FFFFFF" stopOpacity="0.1"/>
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
