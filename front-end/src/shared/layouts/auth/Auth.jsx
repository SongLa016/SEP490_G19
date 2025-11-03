import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../../../contexts/AuthContext';
//
import { FadeIn, ScaleIn } from '../../components/ui/animations';
import Login from '../../auth/Login';
import Register from '../../auth/Register';
import { ArrowLeft } from 'lucide-react';


export default function Auth() {
     const [tab, setTab] = useState('login'); // login | register
     const { login } = useAuth();
     const navigate = useNavigate();

     const handleLoggedIn = (user) => {
          console.log("User logged in:", user);
          console.log("User role:", user?.roleName);

          login(user);

          // Redirect based on user role using Link
          if (user && user.roleName) {
               const role = user.roleName.toLowerCase();
               console.log("Redirecting based on role:", role);

               switch (role) {
                    case 'admin':
                         navigate('/admin');
                         break;
                    case 'owner':
                         navigate('/owner');
                         break;
                    case 'player':
                    default:
                         navigate('/home');
                         break;
               }
          } else {
               // Fallback to home if no role (treat as Player)
               console.log("No role found, redirecting to Player home");
               navigate('/home');
          }
     };

     const handleTabChange = (newTab) => {
          if (newTab !== tab) setTab(newTab);
     };

     return (
          <div className="w-full h-full rounded-2xl flex overflow-hidden relative">
               {/* Full-page bg stays as-is (from parent). Add subtle vignette */}
               <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/10"></div>

               {/* Background Panel - Left for Login, Right for Register */}
               <div className={`hidden  lg:block lg:w-1/2 relative overflow-hidden ${tab === 'register' ? 'order-2' : 'order-1'}`}>
                    {/* Background image changes per tab (opposite side of form) */}
                    <img
                         src={tab === 'register'
                              ? 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=1600&auto=format&fit=crop'
                              : 'https://images.unsplash.com/photo-1547347298-4074fc3086f0?q=80&w=1600&auto=format&fit=crop'}
                         alt="Auth background"
                         className="absolute inset-0 w-full h-full object-cover"
                         loading="lazy"
                    />
                    {/* Overlay gradient for readability, side-aware */}
                    <div className={`absolute inset-0 ${tab === 'register' ? 'bg-gradient-to-l' : 'bg-gradient-to-r'} from-white/50 via-white/20 to-transparent backdrop-blur-[1.5px]`}></div>
               </div>

               {/* Form Panel - Right for Login, Left for Register */}
               <div className={`w-full lg:w-1/2 flex flex-col relative overflow-y-auto scrollbar-hide ${tab === 'register' ? 'order-1' : 'order-2'}`}>
                    {/* Panel background: glass with light gradient */}
                    <div className="absolute inset-0 h-full bg-white/80 backdrop-blur-md"></div>
                    {/* Edge gradient towards split line */}
                    <div className={`absolute inset-y-0 ${tab === 'register' ? 'right-0 bg-gradient-to-r' : 'left-0 bg-gradient-to-l'} from-transparent via-black/5 to-black/10 opacity-20 w-10`}></div>
                    {/* Header */}
                    <div className="flex items-center justify-between p-3 lg:px-4 absolute top-0 left-0 right-0 z-10">
                         <FadeIn delay={100} duration={0.4}>
                              <div className="flex items-center gap-2">
                                   <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                                        <img
                                             src={require('../../components/assets/logo.png')}
                                             alt="Logo"
                                             className="h-10 w-auto rounded-lg transform transition-transform hover:scale-105"
                                        />
                                   </div>
                              </div>
                         </FadeIn>
                         <FadeIn delay={200} duration={0.4}>
                              <Link to="/home" className="text-sm border-none hover:border-none hover:bg-transparent text-gray-700 font-medium transition-all duration-200"
                              >
                                   <ArrowLeft className="w-6 h-6" />
                              </Link>
                         </FadeIn>
                    </div>

                    {/* Form Content - Centered with smooth crossfade/slide */}
                    <div className="absolute inset-0 flex items-center justify-center px-5 md:px-8 lg:px-8 xl:px-12 mt-12 z-10">
                         <div className="relative w-full max-w-lg min-h-[620px]">
                              {/* Login panel */}
                              <div className={`absolute inset-0 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${tab === 'login' ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 -translate-x-6 pointer-events-none'}`}>
                                   <ScaleIn delay={0} duration={0.3} className="w-full h-full">
                                        <Login
                                             compact
                                             onLoggedIn={handleLoggedIn}
                                             onGoRegister={() => handleTabChange('register')}
                                        />
                                   </ScaleIn>
                              </div>

                              {/* Register panel */}
                              <div className={`absolute inset-0 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${tab === 'register' ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 translate-x-6 pointer-events-none'}`}>
                                   <ScaleIn delay={0} duration={0.3} className="w-full h-full">
                                        <Register
                                             compact
                                             onDone={() => handleTabChange('login')}
                                             onGoLogin={() => handleTabChange('login')}
                                        />
                                   </ScaleIn>
                              </div>
                         </div>
                    </div>
               </div>
          </div>
     );
}


