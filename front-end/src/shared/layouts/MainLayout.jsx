import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../../roles/player/layouts/Header';
import Footer from '../../roles/player/layouts/Footer';
import Breadcrumb from '../../shared/components/Breadcrumb';
import ScrollProgressBar from '../../shared/components/ScrollProgressBar';
import { useAuth } from '../../contexts/AuthContext';
import { ModalProvider } from '../../contexts/ModalContext';

const MainLayout = ({ children }) => {
     const { user, logout } = useAuth();

     return (
          <ModalProvider>
               <div className="min-h-screen bg-gray-50">
                    <ScrollProgressBar />
                    <Header user={user} onLoggedOut={logout} />
                    <Breadcrumb />
                    <main className="flex-1">
                         {children ? children : <Outlet />}
                    </main>
                    <Footer />
               </div>
          </ModalProvider>
     );
};

export default MainLayout;
