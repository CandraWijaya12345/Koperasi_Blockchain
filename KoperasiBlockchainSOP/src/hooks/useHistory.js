// hooks/useHistory.js
import { useMemo, useState } from 'react';

export const useHistory = (history) => {
  const [search, setSearch] = useState('');

  const filteredHistory = useMemo(() => {
    if (!search) return history || [];
    const keyword = search.toLowerCase();
    return (history || []).filter((log) => {
      const eventName = log.eventName || '';
      return eventName.toLowerCase().includes(keyword);
    });
  }, [history, search]);

  return {
    search,
    setSearch,
    filteredHistory,
  };
};
