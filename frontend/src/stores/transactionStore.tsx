import React, { createContext, useContext, useState } from "react";

export interface Transaction {
  id: string;
  proposalId: string;
  status: "pending" | "approved" | "rejected" | "settled";
  amount: number;
  currency: string;
  approverComments?: string;
  settledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface TransactionContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Transaction) => void;
  approveTransaction: (txId: string) => void;
  rejectTransaction: (txId: string, comments: string) => void;
  settleTransaction: (txId: string) => void;
  getTransactionById: (id: string) => Transaction | undefined;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const addTransaction = (transaction: Transaction) => {
    setTransactions([...transactions, transaction]);
  };

  const approveTransaction = (txId: string) => {
    setTransactions(
      transactions.map((t) =>
        t.id === txId ? { ...t, status: "approved", updatedAt: new Date() } : t
      )
    );
  };

  const rejectTransaction = (txId: string, comments: string) => {
    setTransactions(
      transactions.map((t) =>
        t.id === txId
          ? { ...t, status: "rejected", approverComments: comments, updatedAt: new Date() }
          : t
      )
    );
  };

  const settleTransaction = (txId: string) => {
    setTransactions(
      transactions.map((t) =>
        t.id === txId
          ? { ...t, status: "settled", settledAt: new Date(), updatedAt: new Date() }
          : t
      )
    );
  };

  const getTransactionById = (id: string) => transactions.find((t) => t.id === id);

  return (
    <TransactionContext.Provider
      value={{ transactions, addTransaction, approveTransaction, rejectTransaction, settleTransaction, getTransactionById }}
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