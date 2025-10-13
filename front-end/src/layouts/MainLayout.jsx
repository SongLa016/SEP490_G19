import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './main/Header';
import Footer from './main/Footer';
import { useAuth } from '../contexts/AuthContext';

const MainLayout = ({ children }) => {
     const { user, logout } = useAuth();

     return (
          <div className="min-h-screen bg-gray-50">
               <Header user={user} onLoggedOut={logout} />
               <main className="flex-1">
                    {children ? children : <Outlet />}
               </main>
               <Footer />
          </div>
     );
};

export default MainLayout;
