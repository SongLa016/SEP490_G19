import { useState } from "react";
import { User, Settings, BarChart3, Users, Calendar } from "lucide-react";
import { Button } from "../../components/ui/button";
import UserProfile from "./UserProfile";
import ProfileSettings from "./ProfileSettings";
import ProfileStats from "./ProfileStats";
import { Container } from "../../components/ui";

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
    <div className="min-h-screen ">
      {/* Profile Navigation */}
      <div className="bg-white/80 sticky top-0 z-10 pt-14 backdrop-blur-sm border-b border-teal-100">
        <Container>
          <div className="flex items-center z-50 justify-between py-4">
            <div className="flex space-x-2 w-full justify-center">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <Button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center text-sm font-medium rounded-2xl transition-all duration-300 ${
                      activeTab === tab.id
                        ? "bg-teal-600 text-white hover:bg-teal-900"
                        : "text-teal-700 border border-teal-300 hover:text-teal-900 bg-transparent hover:bg-teal-100"
                    }`}
                  >
                    <div className="rounded-xl  flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </div>
                  </Button>
                );
              })}
            </div>
            <div className="flex items-center space-x-4">
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
                className="bg-teal-600 hover:bg-teal-900 hover:text-white rounded-xl"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Đặt sân
              </Button>
            </div>
          </div>
        </Container>
      </div>

      {/* Profile Content */}
      <ActiveComponent user={user} />
    </div>
  );
}
