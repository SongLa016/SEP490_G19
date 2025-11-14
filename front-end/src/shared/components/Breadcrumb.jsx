import React from "react";
import { useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import { Home, Search, Calendar, User, Users, MapPin } from "lucide-react";
import {
     Breadcrumb,
     BreadcrumbList,
     BreadcrumbItem,
     BreadcrumbLink,
     BreadcrumbPage,
     BreadcrumbSeparator,
} from "./ui";

export default function AppBreadcrumb() {
     const location = useLocation();
     const paths = location.pathname.split('/').filter(Boolean);

     // Route mapping với labels và icons tiếng Việt
     const routeConfig = {
          'home': { label: 'Trang chủ', icon: Home },
          'search': { label: 'Tìm sân', icon: Search },
          'dashboard': { label: 'Bảng điều khiển', icon: null },
          'bookings': { label: 'Lịch đặt sân', icon: Calendar },
          'profile': { label: 'Hồ sơ', icon: User },
          'community': { label: 'Cộng đồng', icon: Users },
          'complex': { label: 'Khu sân', icon: MapPin },
          'field': { label: 'Sân bóng', icon: MapPin },
          'booking': { label: 'Đặt sân', icon: Calendar },
     };

     // Không hiển thị breadcrumb ở trang chủ hoặc landing
     if (location.pathname === '/' || location.pathname === '/home') {
          return null;
     }

     const breadcrumbItems = [
          {
               label: 'Trang chủ',
               path: '/home',
               icon: Home,
          },
     ];

     // Build breadcrumb từ paths
     let currentPath = '';
     paths.forEach((path, index) => {
          currentPath += `/${path}`;

          // Check if this is a numeric ID (route param)
          const isNumericId = !isNaN(Number(path)) && path !== '';

          if (isNumericId) {
               // Đây là ID (như /complex/123, /field/456)
               const previousPath = paths[index - 1];
               if (previousPath === 'complex') {
                    breadcrumbItems.push({
                         label: 'Chi tiết khu sân',
                         path: currentPath,
                         icon: MapPin,
                    });
               } else if (previousPath === 'field') {
                    breadcrumbItems.push({
                         label: 'Chi tiết sân',
                         path: currentPath,
                         icon: MapPin,
                    });
               } else if (previousPath === 'booking') {
                    breadcrumbItems.push({
                         label: 'Chi tiết đặt sân',
                         path: currentPath,
                         icon: Calendar,
                    });
               } else {
                    // Generic ID
                    breadcrumbItems.push({
                         label: 'Chi tiết',
                         path: currentPath,
                         icon: null,
                    });
               }
          } else {
               // Đây là route name
               const config = routeConfig[path];
               if (config) {
                    breadcrumbItems.push({
                         label: config.label,
                         path: currentPath,
                         icon: config.icon,
                    });
               } else {
                    // Fallback: capitalize first letter
                    const label = path.charAt(0).toUpperCase() + path.slice(1);
                    breadcrumbItems.push({
                         label: label,
                         path: currentPath,
                         icon: null,
                    });
               }
          }
     });

     // Check if current page has hero section (pages with hero typically have specific paths)
     const hasHeroSection = location.pathname === '/search' || location.pathname.startsWith('/complex/') || location.pathname.startsWith('/field/');

     return (
          <div className={`${hasHeroSection
               ? 'absolute top-24 left-0 right-0 z-50 pl-10 py-4 bg-transparent'
               : 'sticky top-16 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 py-2.5 shadow-sm'
               }`}>
               <div className="max-w-7xl mx-auto">
                    <Breadcrumb>
                         <BreadcrumbList className={hasHeroSection ? "text-white" : ""}>
                              {breadcrumbItems.map((item, index) => {
                                   const isLast = index === breadcrumbItems.length - 1;
                                   const Icon = item.icon;

                                   return (
                                        <React.Fragment key={`${item.path}-${index}`}>
                                             {index > 0 && (
                                                  <BreadcrumbSeparator className={hasHeroSection ? "[&>svg]:text-white/70" : ""} />
                                             )}
                                             <BreadcrumbItem>
                                                  {isLast ? (
                                                       <BreadcrumbPage className={`flex items-center gap-1.5 ${hasHeroSection
                                                            ? 'text-white font-semibold  drop-shadow-lg'
                                                            : 'text-gray-700'}`}>
                                                            {Icon && (
                                                                 <Icon className={`w-4 h-4 ${hasHeroSection ? 'text-white' : 'text-teal-600'}`} />
                                                            )}
                                                            <span className="line-clamp-1">{item.label}</span>
                                                       </BreadcrumbPage>
                                                  ) : (
                                                       <BreadcrumbLink asChild>
                                                            <Link
                                                                 to={item.path}
                                                                 className={`flex items-center gap-1.5 transition-colors ${hasHeroSection
                                                                      ? 'text-white/90  hover:text-teal-600 drop-shadow-md hover:drop-shadow-lg'
                                                                      : 'text-teal-600  hover:text-teal-700'
                                                                      }`}
                                                            >
                                                                 {Icon && <Icon className="w-4 h-4" />}
                                                                 <span className="line-clamp-1">{item.label}</span>
                                                            </Link>
                                                       </BreadcrumbLink>
                                                  )}
                                             </BreadcrumbItem>
                                        </React.Fragment>
                                   );
                              })}
                         </BreadcrumbList>
                    </Breadcrumb>
               </div>
          </div>
     );
}

