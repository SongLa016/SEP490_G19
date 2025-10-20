import { useState } from "react";
import { User, Settings, BarChart3, Eye, Code, Copy, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import UserProfile from "./UserProfile";
import ProfileSettings from "./ProfileSettings";
import ProfileStats from "./ProfileStats";

export default function ProfileDemo() {
     const [activeDemo, setActiveDemo] = useState("profile");
     const [showCode, setShowCode] = useState(false);
     const [copied, setCopied] = useState(false);

     const demos = [
          { id: "profile", label: "Hồ sơ cá nhân", icon: User, component: UserProfile },
          { id: "settings", label: "Cài đặt", icon: Settings, component: ProfileSettings },
          { id: "stats", label: "Thống kê", icon: BarChart3, component: ProfileStats }
     ];

     const activeDemoData = demos.find(demo => demo.id === activeDemo);
     const ActiveComponent = activeDemoData?.component || UserProfile;

     const copyToClipboard = async (text) => {
          try {
               await navigator.clipboard.writeText(text);
               setCopied(true);
               setTimeout(() => setCopied(false), 2000);
          } catch (err) {
               console.error('Failed to copy: ', err);
          }
     };

     const features = [
          "🎨 Màu chủ đạo teal-white với gradient đẹp mắt",
          "📱 Responsive design hoàn hảo trên mọi thiết bị",
          "🔧 Sử dụng đầy đủ Shadcn UI components",
          "🎯 Bo góc round-2xl hiện đại",
          "✨ Icon phong phú làm rõ thông tin",
          "🎭 Hiệu ứng hover và transition mượt mà",
          "🔒 Form validation và error handling",
          "📊 Thống kê và thành tích trực quan",
          "⚙️ Cài đặt chi tiết và bảo mật",
          "🖼️ Upload avatar với preview"
     ];

     return (
          <div className="min-h-screen bg-gradient-to-br from-teal-50 to-white">
               {/* Demo Header */}
               <div className="bg-white/80 backdrop-blur-sm border-b border-teal-100">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                         <div className="py-8">
                              <div className="flex items-center justify-between">
                                   <div>
                                        <div className="flex items-center mb-4">
                                             <div className="p-3 bg-teal-100 rounded-2xl mr-4">
                                                  <User className="w-8 h-8 text-teal-600" />
                                             </div>
                                             <div>
                                                  <h1 className="text-4xl font-bold text-teal-900">Profile Components</h1>
                                                  <p className="text-teal-600 text-lg">Thiết kế hiện đại với Shadcn UI</p>
                                             </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                             {features.slice(0, 5).map((feature, index) => (
                                                  <span key={index} className="px-3 py-1 bg-teal-100 text-teal-700 rounded-xl text-sm font-medium">
                                                       {feature}
                                                  </span>
                                             ))}
                                        </div>
                                   </div>
                                   <div className="flex items-center space-x-4">
                                        <Button
                                             variant="outline"
                                             onClick={() => setShowCode(!showCode)}
                                             className="border-teal-300 text-teal-700 hover:bg-teal-50 rounded-xl"
                                        >
                                             <Code className="w-4 h-4 mr-2" />
                                             {showCode ? 'Ẩn' : 'Hiện'} Code
                                        </Button>
                                        <Button
                                             variant="outline"
                                             onClick={() => copyToClipboard('import ProfileIndex from "./pages/profile"')}
                                             className="border-teal-300 text-teal-700 hover:bg-teal-50 rounded-xl"
                                        >
                                             {copied ? <CheckCircle className="w-4 h-4 mr-2 text-green-600" /> : <Copy className="w-4 h-4 mr-2" />}
                                             {copied ? 'Đã copy!' : 'Copy Import'}
                                        </Button>
                                   </div>
                              </div>

                              {/* Demo Navigation */}
                              <div className="mt-8">
                                   <div className="flex space-x-2 bg-teal-100 p-2 rounded-2xl">
                                        {demos.map((demo) => {
                                             const Icon = demo.icon;
                                             return (
                                                  <button
                                                       key={demo.id}
                                                       onClick={() => setActiveDemo(demo.id)}
                                                       className={`flex items-center px-6 py-3 text-sm font-medium rounded-xl transition-all duration-300 ${activeDemo === demo.id
                                                                 ? 'bg-white text-teal-700 shadow-md'
                                                                 : 'text-teal-600 hover:text-teal-800 hover:bg-teal-50'
                                                            }`}
                                                  >
                                                       <div className={`p-2 rounded-lg mr-3 ${activeDemo === demo.id ? 'bg-teal-100' : 'bg-teal-200'
                                                            }`}>
                                                            <Icon className="w-4 h-4" />
                                                       </div>
                                                       {demo.label}
                                                  </button>
                                             );
                                        })}
                                   </div>
                              </div>
                         </div>
                    </div>
               </div>

               {/* Demo Content */}
               <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {showCode && (
                         <Card className="mb-8 border-0 shadow-xl bg-white/90 backdrop-blur-sm rounded-2xl">
                              <CardHeader className="bg-gradient-to-r from-teal-50 to-teal-100 rounded-t-2xl">
                                   <CardTitle className="flex items-center text-teal-900">
                                        <div className="p-2 bg-teal-200 rounded-xl mr-3">
                                             <Code className="w-5 h-5 text-teal-700" />
                                        </div>
                                        Database Schema & Features
                                   </CardTitle>
                              </CardHeader>
                              <CardContent className="p-6">
                                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div>
                                             <h4 className="font-semibold text-teal-800 mb-3">Database Schema</h4>
                                             <pre className="bg-teal-900 text-teal-100 p-4 rounded-xl overflow-x-auto text-sm">
                                                  {`-- Users Table
CREATE TABLE Users (
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    Email NVARCHAR(255) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    FullName NVARCHAR(100) NOT NULL,
    Phone NVARCHAR(20),
    Avatar VARBINARY(MAX) NULL,
    Status NVARCHAR(20) DEFAULT 'Active',
    CreatedAt DATETIME2 DEFAULT GETDATE()
);

-- UserProfiles Table
CREATE TABLE UserProfiles (
    ProfileID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT UNIQUE FOREIGN KEY REFERENCES Users(UserID),
    DateOfBirth DATE,
    Gender NVARCHAR(10),
    Address NVARCHAR(500),
    PreferredPositions NVARCHAR(100),
    SkillLevel NVARCHAR(20),
    Bio NVARCHAR(500)
);`}
                                             </pre>
                                        </div>
                                        <div>
                                             <h4 className="font-semibold text-teal-800 mb-3">Tính năng chính</h4>
                                             <div className="space-y-2">
                                                  {features.map((feature, index) => (
                                                       <div key={index} className="flex items-center p-2 bg-teal-50 rounded-xl">
                                                            <span className="text-sm text-teal-800">{feature}</span>
                                                       </div>
                                                  ))}
                                             </div>
                                        </div>
                                   </div>
                              </CardContent>
                         </Card>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                         {/* Component Info */}
                         <div className="lg:col-span-1">
                              <Card className="sticky top-8 border-0 shadow-xl bg-white/80 backdrop-blur-sm rounded-2xl">
                                   <CardHeader className="bg-gradient-to-r from-teal-50 to-teal-100 rounded-t-2xl">
                                        <CardTitle className="flex items-center text-teal-900">
                                             <div className="p-2 bg-teal-200 rounded-xl mr-3">
                                                  <Eye className="w-5 h-5 text-teal-700" />
                                             </div>
                                             Thông tin Component
                                        </CardTitle>
                                   </CardHeader>
                                   <CardContent className="space-y-4 p-6">
                                        <div>
                                             <h4 className="font-semibold text-teal-900 mb-2">Shadcn UI Components:</h4>
                                             <ul className="text-sm text-teal-700 space-y-1">
                                                  <li>• Card, CardHeader, CardContent</li>
                                                  <li>• Button với variants</li>
                                                  <li>• Input, Textarea</li>
                                                  <li>• Select, SelectContent</li>
                                                  <li>• Avatar component</li>
                                             </ul>
                                        </div>
                                        <div>
                                             <h4 className="font-semibold text-teal-900 mb-2">Styling Features:</h4>
                                             <ul className="text-sm text-teal-700 space-y-1">
                                                  <li>• Teal color scheme</li>
                                                  <li>• Rounded-2xl borders</li>
                                                  <li>• Gradient backgrounds</li>
                                                  <li>• Backdrop blur effects</li>
                                                  <li>• Shadow & hover effects</li>
                                             </ul>
                                        </div>
                                        <div>
                                             <h4 className="font-semibold text-teal-900 mb-2">Icons Used:</h4>
                                             <ul className="text-sm text-teal-700 space-y-1">
                                                  <li>• User, Mail, Phone</li>
                                                  <li>• Calendar, MapPin</li>
                                                  <li>• Shield, Settings</li>
                                                  <li>• Star, Award, Target</li>
                                                  <li>• Heart, Clock, Camera</li>
                                             </ul>
                                        </div>
                                   </CardContent>
                              </Card>
                         </div>

                         {/* Component Preview */}
                         <div className="lg:col-span-3">
                              <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
                                   <ActiveComponent />
                              </Card>
                         </div>
                    </div>
               </div>
          </div>
     );
}