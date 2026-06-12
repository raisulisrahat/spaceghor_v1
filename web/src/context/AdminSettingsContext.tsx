import React, { createContext, useContext, useState, useEffect } from 'react';

type TextSize = 'standard' | 'comfortable';

interface AdminSettingsContextType {
  textSize: TextSize;
  setTextSize: (size: TextSize) => void;
  toggleTextSize: () => void;
}

const AdminSettingsContext = createContext<AdminSettingsContextType | undefined>(undefined);

export const AdminSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [textSize, setTextSize] = useState<TextSize>(() => {
    const saved = localStorage.getItem('admin-text-size');
    return (saved as TextSize) || 'standard';
  });

  useEffect(() => {
    localStorage.setItem('admin-text-size', textSize);
  }, [textSize]);

  const toggleTextSize = () => {
    setTextSize(prev => prev === 'standard' ? 'comfortable' : 'standard');
  };

  return (
    <AdminSettingsContext.Provider value={{ textSize, setTextSize, toggleTextSize }}>
      <div className={textSize === 'comfortable' ? 'admin-text-comfortable' : ''}>
        {children}
      </div>
    </AdminSettingsContext.Provider>
  );
};

export const useAdminSettings = () => {
  const context = useContext(AdminSettingsContext);
  if (context === undefined) {
    throw new Error('useAdminSettings must be used within an AdminSettingsProvider');
  }
  return context;
};
