import React from 'react';

const UserPlusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 20 20"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M11 11a4 4 0 100-8 4 4 0 000 8zm-1 5a7 7 0 00-7 7h16a7 7 0 00-7-7zm6-4h-2m2 2h-2m-2-2v2"
    />
  </svg>
);

export default UserPlusIcon;