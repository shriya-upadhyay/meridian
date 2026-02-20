import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import api from "../api";
import { usePartyStore } from "./partyStore";
import { useToast } from "./toastStore";
import { ContractWrapper } from "../../../backend/src/types";

export interface Transaction extends ContractWrapper {
  // Extends base contract wrapper
}

interface TransactionContextType {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  fetchTransactions: () => Promise<void>;
  freezeTransaction: (txId: string) => Promise<void>;
  settleTransaction: (txId: string) => Promise<void>;
  getTransactionById: (id: string) => Transaction | undefined;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentParty } = usePartyStore();
  const { displaySuccess, displayError } = useToast();

  // Fetch transactions for current party
  const fetchTransactions = useCallback(async () => {
    if (!currentParty) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await api.listTransactions(currentParty.id);
      setTransactions(data as Transaction[]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch transactions";
      setError(message);
      displayError(message);
    } finally {
      setLoading(false);
    }
  }, [currentParty, displayError]);

  // Fetch transactions when party changes
  useEffect(() => {
    fetchTransactions();
  }, [currentParty, fetchTransactions]);

  const freezeTransaction = useCallback(
    async (txId: string) => {
      if (!currentParty) {
        displayError("No party selected");
        return;
      }

      try {
        await api.freezeTransaction(currentParty.id, txId);
        displaySuccess("Transaction frozen successfully");
        await fetchTransactions();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to freeze transaction";
        displayError(message);
        throw err;
      }
    },
    [currentParty, displaySuccess, displayError, fetchTransactions]
  );

  const settleTransaction = useCallback(
    async (txId: string) => {
      if (!currentParty) {
        displayError("No party selected");
        return;
      }

      try {
        await api.settleTransaction(currentParty.id, txId);
        displaySuccess("Transaction settled successfully");
        await fetchTransactions();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to settle transaction";
        displayError(message);
        throw err;
      }
    },
    [currentParty, displaySuccess, displayError, fetchTransactions]
  );

  const getTransactionById = (id: string) => transactions.find((t) => t.contractId === id);

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        loading,
        error,
        fetchTransactions,
        freezeTransaction,
        settleTransaction,
        getTransactionById,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error("useTransactions must be used within TransactionProvider");
  }
  return context;
};
