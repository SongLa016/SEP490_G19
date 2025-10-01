import { useState } from 'react';
import Login from '../../pages/auth/Login';
import Register from '../../pages/auth/Register';
import { Button } from '../../components/ui';

export default function Auth({ onLoggedIn }) {
     const [tab, setTab] = useState('login'); // login | register

     return (
          <div className="max-w-4xl mx-auto p-4 sm:p-6">
               <div className="rounded-2xl justify-center max-w-xl mx-auto shadow-lg border border-gray-100 backdrop-blur p-5">
                    <div className="flex items-center justify-between mb-1">
                         <div className="flex items-center gap-2">
                              <img src={require('../../components/assets/logo.png')} alt="Logo" className="h-16 w-20 rounded-lg bg-white/90" />
                         </div>
                         <Button onClick={() => (window.location.href = '/')} variant="outline" className="text-teal-500 hover:text-teal-800 underline hover:bg-white/90 rounded-lg underline-offset-4">Về trang chủ</Button>
                    </div>
                    {tab === 'login' && (
                         <Login compact onLoggedIn={onLoggedIn} onGoRegister={() => setTab('register')} />
                    )}
                    {tab === 'register' && (
                         <Register compact onDone={() => setTab('login')} onGoLogin={() => setTab('login')} />
                    )}
               </div>
          </div>
     );
}


