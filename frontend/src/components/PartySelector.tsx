import React from "react";
import { useNavigate } from "react-router-dom";
import { usePartyStore } from "../stores/partyStore";

const PartySelector: React.FC = () => {
  const navigate = useNavigate();
  const { parties, currentParty, setCurrentParty, loading } = usePartyStore();

  const handlePartyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const partyId = e.target.value;
    const party = parties.find(p => p.id === partyId);
    if (party) {
      setCurrentParty(party);
      navigate(`/${party.role}`);
    }
  };

  if (loading) return <div className="mb-3">Loading parties...</div>;

  return (
    <div className="mb-3">
      <label htmlFor="party-select" className="form-label">Select Party</label>
      <select 
        id="party-select" 
        className="form-select"
        value={currentParty?.id || ""}
        onChange={handlePartyChange}
      >
        {parties.map(party => (
          <option key={party.id} value={party.id}>
            {party.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default PartySelector;