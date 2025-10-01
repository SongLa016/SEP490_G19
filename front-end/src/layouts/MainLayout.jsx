import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './main/Header';
import Footer from './main/Footer';

const MainLayout = ({ children }) => {
     return (
          <div className="min-h-screen bg-gray-50">
               <Header />
               <main className="flex-1">
                    {children ? children : <Outlet />}
               </main>
               <Footer />
          </div>
     );
};

export default MainLayout;
