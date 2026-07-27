import React, { createContext, useContext, useState } from 'react';

const CarrierContext = createContext();

export const CarrierProvider = ({ children }) => {
  const [selectedCarrier, setSelectedCarrier] = useState(() => {
    return localStorage.getItem('helixvault_selected_carrier') || null;
  });
  const [carrierSequence, setCarrierSequence] = useState(() => {
    return localStorage.getItem('helixvault_carrier_sequence') || null;
  });

  const selectCarrier = (accession, sequence) => {
    setSelectedCarrier(accession);
    setCarrierSequence(sequence);
    if (accession) {
      localStorage.setItem('helixvault_selected_carrier', accession);
    } else {
      localStorage.removeItem('helixvault_selected_carrier');
    }
    if (sequence) {
      localStorage.setItem('helixvault_carrier_sequence', sequence);
    } else {
      localStorage.removeItem('helixvault_carrier_sequence');
    }
  };

  const clearCarrier = () => {
    setSelectedCarrier(null);
    setCarrierSequence(null);
    localStorage.removeItem('helixvault_selected_carrier');
    localStorage.removeItem('helixvault_carrier_sequence');
  };

  return (
    <CarrierContext.Provider value={{ selectedCarrier, carrierSequence, selectCarrier, clearCarrier }}>
      {children}
    </CarrierContext.Provider>
  );
};

export const useCarrier = () => useContext(CarrierContext);
