import React, { useState, useEffect } from "react";
import { MapPin, Users, BarChart3, Shield } from "lucide-react";
import { updateUserProfile, changePassword } from "../../../../shared/index";
import { useAuth } from "../../../../contexts/AuthContext";
import Header from "../../layouts/Header";
import Footer from "../../layouts/Footer";
import HomePage from "../home/HomePage";
import FieldSearch from "../fields/FieldSearch";
import BookingHistory from "../booking/BookingHistory";

import { Button, Section, FadeIn, SlideIn, PhoneInput } from "../../../../shared/components/ui";
import { NotificationsDisplay } from "../../../../shared";

export default function Dashboard({ currentView, navigateTo }) {
     const { user, logout } = useAuth();
     const [name, setName] = useState(user?.name || "");
     const [phone, setPhone] = useState(user?.phone || "");
     const [oldPassword, setOldPassword] = useState("");
     const [newPassword, setNewPassword] = useState("");
     const [profileMsg, setProfileMsg] = useState("");
     const [profileErr, setProfileErr] = useState("");
     const [pwdMsg, setPwdMsg] = useState("");
     const [pwdErr, setPwdErr] = useState("");

     // Cuộn lên đầu 
     useEffect(() => {
          const loadingTimeout = setTimeout(() => {
               window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
               });
          }, 100);
          return () => clearTimeout(loadingTimeout);
     }, [currentView]);

     const renderContent = () => {
          switch (currentView) {
               case "home":
                    return <HomePage user={user} navigateTo={navigateTo} />;
               case "search":
                    return <FieldSearch user={user} navigateTo={navigateTo} />;
               case "notifications":
                    return (
                         <div className="min-h-screen bg-gray-50 py-8">
                              <div className="max-w-4xl mx-auto px-4">
                                   <h1 className="text-3xl font-bold text-gray-900 mb-8">Thông báo</h1>
                                   <NotificationsDisplay userId={user?.id} />
                              </div>
                         </div>
                    );
               case "bookings":
                    return <BookingHistory user={user} navigateTo={navigateTo} />;
               default:
                    return <HomePage user={user} navigateTo={navigateTo} />;
          }
     };

     return (
          <Section className="min-h-screen  text-white">
               <Header
                    user={user}
                    onLoggedOut={logout}
                    currentView={currentView}
                    navigateTo={navigateTo}
               />
               {renderContent()}
               <Footer />
          </Section>
     );
}
