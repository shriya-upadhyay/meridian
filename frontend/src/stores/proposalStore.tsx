import React, { createContext, useContext, useState } from "react";

export interface Proposal {
  id: string;
  senderId: string;
  recipientId: string;
  amount: number;
  currency: string;
  description: string;
  status: "pending" | "accepted" | "withdrawn";
  createdAt: Date;
  updatedAt: Date;
}

interface ProposalContextType {
  proposals: Proposal[];
  addProposal: (proposal: Proposal) => void;
  acceptProposal: (proposalId: string) => void;
  withdrawProposal: (proposalId: string) => void;
  getProposalById: (id: string) => Proposal | undefined;
}

const ProposalContext = createContext<ProposalContextType | undefined>(undefined);

export const ProposalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [proposals, setProposals] = useState<Proposal[]>([]);

  const addProposal = (proposal: Proposal) => {
    setProposals([...proposals, proposal]);
  };

  const acceptProposal = (proposalId: string) => {
    setProposals(
      proposals.map((p) =>
        p.id === proposalId ? { ...p, status: "accepted", updatedAt: new Date() } : p
      )
    );
  };

  const withdrawProposal = (proposalId: string) => {
    setProposals(
      proposals.map((p) =>
        p.id === proposalId ? { ...p, status: "withdrawn", updatedAt: new Date() } : p
      )
    );
  };

  const getProposalById = (id: string) => proposals.find((p) => p.id === id);

  return (
    <ProposalContext.Provider value={{ proposals, addProposal, acceptProposal, withdrawProposal, getProposalById }}>
      {children}
    </ProposalContext.Provider>
  );
};

export const useProposals = () => {
  const context = useContext(ProposalContext);
  if (!context) {
    throw new Error("useProposals must be used within ProposalProvider");
  }
  return context;
};