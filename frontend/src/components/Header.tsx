import React from "react";
// import usePartyStore from "../stores/partyStore";

const Header: React.FC = () => {
  // TODO: Get current party from store
  return (
    <nav className="navbar navbar-light bg-light mb-4">
      <div className="container-fluid">
        <span className="navbar-brand mb-0 h1">Cross-Border Tx DApp</span>
        <span className="badge bg-primary">Current Party: {/* party name here */} AliceCorp</span>
      </div>
    </nav>
  );
};

export default Header;
