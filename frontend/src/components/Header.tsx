import React from "react";
import { usePartyStore } from "../stores/partyStore";
import PartySelector from "./PartySelector";

const Header: React.FC = () => {
  const { currentParty } = usePartyStore();

  return (
    <nav className="navbar navbar-light bg-light mb-4 border-bottom">
      <div className="container-fluid">
        <span className="navbar-brand mb-0 h1">
          <strong>Cross-Border Transaction DApp</strong>
        </span>
        <div className="d-flex align-items-center gap-3">
          {currentParty && (
            <span className="badge bg-primary px-3 py-2">
              Current Party: <strong>{currentParty.name}</strong>
            </span>
          )}
          <PartySelector />
        </div>
      </div>
    </nav>
  );
};

export default Header;
