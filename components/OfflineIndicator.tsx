import React from 'react';
import CloudIcon from './icons/CloudIcon';
import CloudSlashIcon from './icons/CloudSlashIcon';

interface OfflineIndicatorProps {
  isOnline: boolean;
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ isOnline }) => {
  const title = isOnline ? 'Mode en ligne' : 'Mode hors ligne';
  const iconColor = isOnline ? 'text-white' : 'text-yellow-300';

  return (
    <div
      className={`p-2 rounded-full transition-colors ${iconColor}`}
      title={title}
      aria-label={title}
    >
      {isOnline ? <CloudIcon /> : <CloudSlashIcon />}
    </div>
  );
};

export default OfflineIndicator;
