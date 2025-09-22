import React from "react";

export default function MainLayout({ children }) {
     return (
          <div className="min-h-screen flex flex-col">
               <header className="bg-white shadow-sm p-4">Header</header>
               <main className="flex-1 container mx-auto p-4">{children}</main>
               <footer className="bg-white p-4 text-center">Footer</footer>
          </div>
     );
}
