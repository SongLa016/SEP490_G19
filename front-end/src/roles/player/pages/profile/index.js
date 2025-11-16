import React, { useState } from "react";
import { User, Settings, BarChart3, Users, Calendar } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button, Container } from "../../../../shared/components/ui";
import UserProfile from "./UserProfile";
import ProfileSettings from "./ProfileSettings";
import ProfileStats from "./ProfileStats";
import BankingManagement from "./BankingManagement";

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
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50">
      {/* Main Content */}
      <div className="pt-28">
        <div className="lg:ml-32">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Content Area */}
            <div className="flex-1 ">
              {/* Header with current tab info */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl shadow-lg">
                      {(() => {
                        const IconComponent = activeTabData?.icon || User;
                        return <IconComponent className="w-6 h-6 text-white" />;
                      })()}
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">
                        {activeTabData?.label || "Hồ sơ"}
                      </h1>
                      <p className="text-gray-600 mt-1">
                        {activeTab === "profile" &&
                          "Quản lý thông tin cá nhân của bạn"}
                        {activeTab === "settings" &&
                          "Cài đặt tài khoản và bảo mật"}
                        {activeTab === "stats" &&
                          "Xem thống kê hoạt động của bạn"}
                      </p>
                    </div>
                  </div>

                  {/* Quick actions */}
                  <div className="hidden lg:flex items-center gap-3">
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

                {/* Mobile Quick Actions */}
                <div className="flex lg:hidden gap-3 mb-6">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-teal-300 text-teal-700 hover:bg-teal-50 hover:text-teal-900 rounded-xl"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Tìm đối thủ
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-teal-600 hover:bg-teal-700 text-white rounded-xl"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Đặt sân
                  </Button>
                </div>
              </div>

              {/* Tab Content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <ActiveComponent user={user} />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Compact Icon Sidebar */}
            <div className="w-full lg:w-16 lg:pt-40 mr-10 order-1 lg:order-2">
              <div className="sticky top-24">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                  <nav
                    className="p-2"
                    role="tablist"
                    aria-label="Profile sections"
                  >
                    {tabs.map((tab, index) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <motion.button
                          key={tab.id}
                          role="tab"
                          aria-selected={isActive}
                          onClick={() => setActiveTab(tab.id)}
                          title={tab.label}
                          className={`w-full flex items-center justify-center p-3 rounded-xl transition-all duration-200 mb-1 group relative ${
                            isActive
                              ? "bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-md"
                              : "text-gray-500 hover:bg-gray-50 hover:text-teal-600"
                          }`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Icon className="w-5 h-5" />

                          {/* Tooltip */}
                          <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                            {tab.label}
                            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
