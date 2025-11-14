import React from 'react';

import Auth from './auth/Auth';

export default function AuthLayout() {
     return (
          <div className="relative min-h-screen ">
               <img
                    src="https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg"
                    alt="Auth background"
                    className="absolute inset-0 w-full h-full object-cover"
               />
               <div className="absolute inset-0 bg-black/50" />
               <div className=" z-10 max-w-6xl mx-auto p-2 md:p-8 items-center min-h-screen fixed top-0 left-0 right-0 bottom-0">
                    <Auth />
               </div>
          </div>
     );
}

