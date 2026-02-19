import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import api from "../api";
import { usePartyStore } from "./partyStore";
import { useToast } from "./toastStore";
import { ContractWrapper } from "../../../backend/src/types";

export interface Proposal extends ContractWrapper {
  // Extends base contract wrapper
}

interface ProposalContextType {
  proposals: Proposal[];
  loading: boolean;
  error: string | null;
  fetchProposals: () => Promise<void>;
  createProposal: (data: any) => Promise<void>;
  acceptProposal: (proposalId: string) => Promise<void>;
  withdrawProposal: (proposalId: string) => Promise<void>;
  getProposalById: (id: string) => Proposal | undefined;
}

const ProposalContext = createContext<ProposalContextType | undefined>(undefined);

export const ProposalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentParty } = usePartyStore();
  const { displaySuccess, displayError } = useToast();

  // Fetch proposals for current party
  const fetchProposals = useCallback(async () => {
    if (!currentParty) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await api.listProposals(currentParty.id);
      setProposals(data as Proposal[]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch proposals";
      setError(message);
      displayError(message);
    } finally {
      setLoading(false);
    }
  }, [currentParty, displayError]);

  // Fetch proposals when party changes
  useEffect(() => {
    fetchProposals();
  }, [currentParty, fetchProposals]);

  const createProposal = useCallback(
    async (data: any) => {
      if (!currentParty) {
        displayError("No party selected");
        return;
      }

      try {
        await api.createProposal(currentParty.id, data);
        displaySuccess("Proposal created successfully");
        await fetchProposals();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create proposal";
        displayError(message);
        throw err;
      }
    },
    [currentParty, displaySuccess, displayError, fetchProposals]
  );

  const acceptProposal = useCallback(
    async (proposalId: string) => {
      if (!currentParty) {
        displayError("No party selected");
        return;
      }

      try {
        await api.acceptProposal(currentParty.id, proposalId);
        displaySuccess("Proposal accepted successfully");
        await fetchProposals();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to accept proposal";
        displayError(message);
        throw err;
      }
    },
    [currentParty, displaySuccess, displayError, fetchProposals]
  );

  const withdrawProposal = useCallback(
    async (proposalId: string) => {
      if (!currentParty) {
        displayError("No party selected");
        return;
      }

      try {
        await api.withdrawProposal(currentParty.id, proposalId);
        displaySuccess("Proposal withdrawn successfully");
        await fetchProposals();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to withdraw proposal";
        displayError(message);
        throw err;
      }
    },
    [currentParty, displaySuccess, displayError, fetchProposals]
  );

  const getProposalById = (id: string) => proposals.find((p) => p.contractId === id);

  return (
    <ProposalContext.Provider
      value={{
        proposals,
        loading,
        error,
        fetchProposals,
        createProposal,
        acceptProposal,
        withdrawProposal,
        getProposalById,
      }}
    >
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