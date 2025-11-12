import { useState } from "react";
import { User, Settings, BarChart3, Users, Calendar } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button, Container } from "../../../../shared/components/ui";
import UserProfile from "./UserProfile";
import ProfileSettings from "./ProfileSettings";
import ProfileStats from "./ProfileStats";

export default function ProfileIndex({ user }) {
  const [activeTab, setActiveTab] = useState("profile");

  const tabs = [
    { id: "profile", label: "Hồ sơ", icon: User, component: UserProfile },
    {
      id: "settings",
      label: "Cài đặt",
      icon: Settings,
      component: ProfileSettings,
    },
    {
      id: "stats",
      label: "Thống kê",
      icon: BarChart3,
      component: ProfileStats,
    },
  ];

  const activeTabData = tabs.find((tab) => tab.id === activeTab);
  const ActiveComponent = activeTabData?.component || UserProfile;

  return (
    <div className="min-h-screen bg-[url('https://mixivivu.com/section-background.png')] bg-cover bg-center">
      {/* Sticky Header with Segmented Tabs */}
      <div className="sticky top-0 z-30 pt-20">
        <div className="bg-white/70 backdrop-blur-sm border-b border-teal-100 shadow-[0_10px_30px_-25px_rgba(13,148,136,0.45)]">
          <Container>
            <div className="flex items-center justify-between py-4">
              {/* Segmented control */}
              <div
                role="tablist"
                aria-label="Profile sections"
                className="relative mx-auto w-full max-w-2xl"
              >
                <div className="flex items-center justify-between rounded-2xl border border-teal-200 bg-white/60 p-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => setActiveTab(tab.id)}
                        className={`relative flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-300 ${
                          isActive
                            ? "text-teal-800"
                            : "text-teal-600 hover:text-teal-800"
                        }`}
                      >
                        {isActive && (
                          <span className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-br from-teal-100/90 via-white to-teal-50 shadow-sm transition-all duration-300" />
                        )}
                        <Icon className="w-4 h-4" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick actions */}
              <div className="hidden md:flex items-center gap-3 pl-6">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-teal-300 text-teal-700 hover:bg-teal-50 hover:text-teal-900 rounded-xl"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Tìm đối thủ
                </Button>
                <Button
                  size="sm"
                  className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Đặt sân
                </Button>
              </div>
            </div>
          </Container>
        </div>
      </div>

      {/* Profile Content */}
      <div className="pb-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <ActiveComponent user={user} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
