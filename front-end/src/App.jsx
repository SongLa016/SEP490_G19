import { useState, useEffect } from "react";
import Dashboard from "./components/Dashboard";
import Auth from "./components/Auth";
import Header from "./components/Header";
import HomePage from "./components/HomePage";
import FieldSearch from "./components/FieldSearch";
import FieldDetail from "./components/FieldDetail";
import BookingHistory from "./components/BookingHistory";
import Community from "./components/Community";
import { getCurrentUser } from "./utils/authStore";
import { Button } from "./components/ui";
import logo from "./components/assets/images/logo.png";
import landingpage from "./components/assets/images/landingpage.png";
import { MoveRight } from "lucide-react";

function App() {
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState("landing"); // landing | home | login | register | dashboard
  const [currentView, setCurrentView] = useState("home"); // home | search | profile | etc.

  useEffect(() => {
    const u = getCurrentUser();
    if (u) {
      setUser(u);
      setScreen("dashboard");
      return;
    }
    // try {
    //   const hasVisited = window.localStorage.getItem("hasVisited");
    //   if (hasVisited) {
    //     setScreen("home");
    //   } else {
    //     setScreen("landing");
    //   }
    // } catch {
    //   setScreen("landing");
    // }
  }, []);

  function handleLoggedIn(newUser) {
    setUser(newUser);
    setScreen("dashboard");
  }

  function handleLoggedOut() {
    setUser(null);
    setScreen("landing");
    setCurrentView("home");
  }

  function navigateTo(view) {
    // From visitor header: go to auth screens
    if (view === "login" || view === "register") {
      setScreen(view);
      return;
    }
    setCurrentView(view);
  }

  // Hiển thị màn hình landing page
  if (screen === "landing") {
    return (
      <div className="min-h-screen text-gray-900 relative">
        <img
          src={
            "https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg"
          }
          alt="Landing background"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="max-w-6xl items-center grid grid-cols-1 lg:grid-cols-2 gap-8 mx-auto p-6 relative z-10 min-h-screen">
          <div className="flex flex-col items-start">
            <div className="flex flex-row items-start mb-6">
              <img
                src={logo}
                alt="Logo"
                className="h-28 px-2 mr-3 my-auto hover:scale-105 transition-all bg-white duration-300"
              />
              <div className="h-[114px] bg-teal-500 p-1 me-5 rounded-full"></div>
              <div className="flex flex-col items-start">
                <h1 className="text-4xl w-[60vh] font-bold text-white">
                  BallSpot – Nền tảng kết nối & đặt sân bóng đá
                </h1>
                <p className="text-sm pt-2 text-white">
                  Xem và đặt sân trực tuyến
                </p>
              </div>
            </div>
            <Button
              className="bg-white mt-4 lg:mt-0 lg:ml-40 flex items-center justify-center hover:bg-teal-500 hover:text-white transition-all duration-300 hover:scale-110 hover:cursor-pointer text-black px-5 py-3 rounded-full w-fit"
              onClick={() => {
                try {
                  window.localStorage.setItem("hasVisited", "1");
                } catch { }
                setScreen("home");
              }}
            >
              <p> Tham gia ngay</p>
              <MoveRight className="pt-1 ml-2" />
            </Button>
          </div>
          <div className="w-full px-3 lg:block hidden">
            <img
              src={landingpage}
              alt="Landing Page"
              className="w-full h-auto object-cover rounded-xl shadow-lg"
            />
          </div>
        </div>
      </div>
    );
  }

  // Visitor home screen
  if (screen === "home" && !user) {
    const renderVisitorView = () => {
      switch (currentView) {
        case "search":
          return <FieldSearch user={null} navigateTo={navigateTo} />;
        case "field-detail":
          return <FieldDetail user={null} navigateTo={navigateTo} />;
        case "bookings":
          return <BookingHistory user={null} navigateTo={navigateTo} />;
        case "community":
          return <Community user={null} navigateTo={navigateTo} />;
        case "home":
        default:
          return <HomePage user={null} navigateTo={navigateTo} />;
      }
    };

    return (
      <div className="min-h-screen bg-gray-50">
        <Header
          user={null}
          onLoggedOut={handleLoggedOut}
          currentView={currentView}
          navigateTo={navigateTo}
        />
        {renderVisitorView()}
      </div>
    );
  }

  // Hiển thị dashboard
  if (screen === "dashboard" && user) {
    return (
      <div className="">
        <div className="">
          <Dashboard
            user={user}
            onLoggedOut={handleLoggedOut}
            currentView={currentView}
            navigateTo={navigateTo}
          />
        </div>
      </div>
    );
  } // Hiển thị màn hình đăng nhập/đăng ký
  if (screen === "login" || screen === "register") {
    return (
      <div className="relative min-h-screen">
        <img
          src={
            "https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg"
          }
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
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 md:p-8">
            <Auth onLoggedIn={handleLoggedIn} />
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default App;
