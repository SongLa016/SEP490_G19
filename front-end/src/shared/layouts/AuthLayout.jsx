import React from 'react';

import Auth from './auth/Auth';

const AuthLayout = () => {
     return (
          <div className="relative min-h-screen">
               <img
                    src="https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg"
                    alt="Auth background"
                    className="absolute inset-0 w-full h-full object-cover"
               />
               <div className="absolute inset-0 bg-black/50" />
               <div className="relative z-10 max-w-6xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center min-h-screen">
                    <div className="hidden lg:block text-white">
                         <h1 className="text-4xl font-extrabold leading-tight">
                              Chào mừng đến BallSpot
                         </h1>
                         <p className="mt-3 text-teal-100 max-w-md">
                              Đặt sân nhanh chóng, an toàn và nhiều ưu đãi hấp dẫn.
                         </p>
                    </div>
                    <div className="">
                         <Auth />
                    </div>
               </div>
          </div>
     );
};

export default AuthLayout;
