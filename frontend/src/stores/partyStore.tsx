import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface Party {
  id: string;
  name: string;
  role: 'sender' | 'recipient' | 'regulator';
}

interface PartyContextType {
  parties: Party[];
  currentParty: Party | null;
  setCurrentParty: (party: Party) => void;
  loading: boolean;
}

const PartyContext = createContext<PartyContextType | undefined>(undefined);

export const PartyProvider = ({ children }: { children: React.ReactNode }) => {
  const [parties, setParties] = useState<Party[]>([]);
  const [currentParty, setCurrentParty] = useState<Party | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchParties = useCallback(async () => {
    try {
      const response = await fetch('/api/parties');
      const data: Party[] = await response.json();
      setParties(data);
      if (data.length > 0 && !currentParty) {
        setCurrentParty(data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch parties:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchParties();
  }, [fetchParties]);

  return (
    <PartyContext.Provider value={{ parties, currentParty, setCurrentParty, loading }}>
      {children}
    </PartyContext.Provider>
  );
};

export const usePartyStore = () => {
  const context = useContext(PartyContext);
  if (!context) throw new Error('usePartyStore must be used within PartyProvider');
  return context;
};
