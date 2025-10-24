import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../../contexts/AuthContext';
import { Button } from '../../components/ui';
import Login from '../../auth/Login';
import Register from '../../auth/Register';


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
                         window.location.href = '/admin';
                         break;
                    case 'owner':
                         window.location.href = '/owner';
                         break;
                    case 'player':
                    default:
                         window.location.href = '/home';
                         break;
               }
          } else {
               // Fallback to home if no role (treat as Player)
               console.log("No role found, redirecting to Player home");
               window.location.href = '/home';
          }
     };

     return (
          <div className="max-w-4xl mx-auto p-4 sm:p-6">
               <div className="rounded-2xl justify-center max-w-xl mx-auto shadow-lg border border-gray-100 backdrop-blur p-5">
                    <div className="flex items-center justify-between mb-1">
                         <div className="flex items-center gap-2">
                              <img src={require('../../components/assets/logo.png')} alt="Logo" className="h-16 w-20 rounded-lg bg-white/90" />
                         </div>
                         <Button onClick={() => navigate('/')} variant="outline" className="text-teal-500 hover:text-teal-800 underline hover:bg-white/90 rounded-lg underline-offset-4">Về trang chủ</Button>
                    </div>
                    {tab === 'login' && (
                         <Login compact onLoggedIn={handleLoggedIn} onGoRegister={() => setTab('register')} />
                    )}
                    {tab === 'register' && (
                         <Register compact onDone={() => setTab('login')} onGoLogin={() => setTab('login')} />
                    )}
               </div>
          </div>
     );
}


