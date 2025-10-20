import { createContext, useContext, useState } from 'react';

const ModalContext = createContext();

export const useModal = () => {
     const context = useContext(ModalContext);
     if (!context) {
          throw new Error('useModal must be used within a ModalProvider');
     }
     return context;
};

export const ModalProvider = ({ children }) => {
     const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

     const openBookingModal = () => setIsBookingModalOpen(true);
     const closeBookingModal = () => setIsBookingModalOpen(false);

     const value = {
          isBookingModalOpen,
          openBookingModal,
          closeBookingModal,
     };

     return (
          <ModalContext.Provider value={value}>
               {children}
          </ModalContext.Provider>
     );
};
