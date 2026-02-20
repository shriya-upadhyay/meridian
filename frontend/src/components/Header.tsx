import React from "react";
import { usePartyStore } from "../stores/partyStore";
import PartySelector from "./PartySelector";

const Header: React.FC = () => {
  const { currentParty } = usePartyStore();

  return (
    <nav className="meridian-navbar mb-4 d-flex align-items-center justify-content-between">
      <span className="navbar-brand mb-0">
        <span>Meridian</span> | Cross-Border Transactions
      </span>
      <div className="d-flex align-items-center gap-3">
        {currentParty && (
          <span className="party-badge">
            Acting as: <strong>{currentParty.name}</strong>
          </span>
        )}
        <PartySelector />
      </div>
    </nav>
  );
};

export default Header;
