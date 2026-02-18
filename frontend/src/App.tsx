import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
// Context providers (implement these in src/stores/)
import { PartyProvider } from "./stores/partyStore";
import { ProposalProvider } from "./stores/proposalStore";
import { TransactionProvider } from "./stores/transactionStore";
import { ToastProvider } from "./stores/toastStore";
// Shared components
import Header from "./components/Header";
import PartySelector from "./components/PartySelector";
// Dashboard views
import SenderDashboard from "./views/SenderDashboard";
import RecipientDashboard from "./views/RecipientDashboard";
import RegulatorDashboard from "./views/RegulatorDashboard";

const App: React.FC = () => {
  return (
    <PartyProvider>
      <ProposalProvider>
        <TransactionProvider>
          <ToastProvider>
              <Header />
              <PartySelector />
              <Routes>
                <Route path="/sender" element={<SenderDashboard />} />
                <Route path="/recipient" element={<RecipientDashboard />} />
                <Route path="/regulator" element={<RegulatorDashboard />} />
                <Route path="*" element={<Navigate to="/sender" replace />} />
              </Routes>
          </ToastProvider>
        </TransactionProvider>
      </ProposalProvider>
    </PartyProvider>
  );
};

export default App;
