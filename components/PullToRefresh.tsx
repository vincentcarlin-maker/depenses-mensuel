import React from 'react';

interface PullToRefreshProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
  children: React.ReactNode;
}

const PullToRefresh: React.FC<PullToRefreshProps> = ({ children }) => {
  return <>{children}</>;
};

export default PullToRefresh;
