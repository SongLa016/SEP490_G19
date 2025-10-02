import { useState, useEffect, useRef } from 'react';
import { MapPin, Search, X } from 'lucide-react';
import { Button } from './ui';

const MapSearch = ({ onLocationSelect, onClose, isOpen }) => {
     const [searchQuery, setSearchQuery] = useState('');
     const [suggestions, setSuggestions] = useState([]);
     const [selectedLocation, setSelectedLocation] = useState(null);
     const [map, setMap] = useState(null);
     const [markers, setMarkers] = useState([]);
     const mapRef = useRef(null);
     const autocompleteRef = useRef(null);

     // Mock field data with coordinates
     const mockFields = [
          {
               id: 1,
               name: "Sân bóng đá ABC",
               location: "Quận 1, TP.HCM",
               address: "123 Đường ABC, Phường Bến Nghé",
               lat: 10.7769,
               lng: 106.7009,
               price: 200000,
               rating: 4.8,
               availableSlots: 3
          },
          {
               id: 2,
               name: "Sân thể thao XYZ",
               location: "Quận 2, TP.HCM",
               address: "456 Đường XYZ, Phường Thủ Thiêm",
               lat: 10.7870,
               lng: 106.7485,
               price: 180000,
               rating: 4.6,
               availableSlots: 5
          },
          {
               id: 3,
               name: "Sân bóng đá DEF",
               location: "Quận 3, TP.HCM",
               address: "789 Đường DEF, Phường Võ Thị Sáu",
               lat: 10.7829,
               lng: 106.6881,
               price: 220000,
               rating: 4.9,
               availableSlots: 2
          },
          {
               id: 4,
               name: "Sân thể thao GHI",
               location: "Quận 7, TP.HCM",
               address: "321 Đường GHI, Phường Tân Phong",
               lat: 10.7374,
               lng: 106.7223,
               price: 160000,
               rating: 4.4,
               availableSlots: 8
          },
          {
               id: 5,
               name: "Sân bóng đá JKL",
               location: "Quận 10, TP.HCM",
               address: "654 Đường JKL, Phường 15",
               lat: 10.7679,
               lng: 106.6668,
               price: 190000,
               rating: 4.7,
               availableSlots: 4
          },
          {
               id: 6,
               name: "Sân thể thao MNO",
               location: "Quận 1, TP.HCM",
               address: "987 Đường MNO, Phường Đa Kao",
               lat: 10.7889,
               lng: 106.6969,
               price: 250000,
               rating: 4.9,
               availableSlots: 1
          }
     ];

     // Initialize map
     useEffect(() => {
          if (isOpen && !map) {
               const initMap = () => {
                    const mapInstance = new window.google.maps.Map(mapRef.current, {
                         center: { lat: 10.7769, lng: 106.7009 }, // Ho Chi Minh City center
                         zoom: 12,
                         mapTypeControl: false,
                         streetViewControl: false,
                         fullscreenControl: false,
                         styles: [
                              {
                                   featureType: "poi",
                                   elementType: "labels",
                                   stylers: [{ visibility: "off" }]
                              }
                         ]
                    });

                    setMap(mapInstance);

                    // Add field markers
                    const fieldMarkers = mockFields.map(field => {
                         const marker = new window.google.maps.Marker({
                              position: { lat: field.lat, lng: field.lng },
                              map: mapInstance,
                              title: field.name,
                              icon: {
                                   url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                                        <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                                             <circle cx="20" cy="20" r="18" fill="#14b8a6" stroke="white" stroke-width="2"/>
                                             <text x="20" y="26" text-anchor="middle" fill="white" font-size="12" font-weight="bold">⚽</text>
                                        </svg>
                                   `)}`,
                                   scaledSize: new window.google.maps.Size(40, 40),
                                   anchor: new window.google.maps.Point(20, 20)
                              }
                         });

                         // Add click listener
                         marker.addListener('click', () => {
                              onLocationSelect({
                                   lat: field.lat,
                                   lng: field.lng,
                                   address: field.address,
                                   name: field.name,
                                   field: field
                              });
                         });

                         return marker;
                    });

                    setMarkers(fieldMarkers);
               };

               // Load Google Maps script if not already loaded
               if (window.google && window.google.maps) {
                    initMap();
               } else {
                    const script = document.createElement('script');
                    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places`;
                    script.async = true;
                    script.defer = true;
                    script.onload = initMap;
                    document.head.appendChild(script);
               }
          }
     }, [isOpen, map, onLocationSelect]);

     // Handle search input
     const handleSearchChange = (e) => {
          const query = e.target.value;
          setSearchQuery(query);

          if (query.length > 2) {
               // Mock suggestions based on search query
               const filteredSuggestions = mockFields.filter(field =>
                    field.name.toLowerCase().includes(query.toLowerCase()) ||
                    field.location.toLowerCase().includes(query.toLowerCase()) ||
                    field.address.toLowerCase().includes(query.toLowerCase())
               ).slice(0, 5);

               setSuggestions(filteredSuggestions);
          } else {
               setSuggestions([]);
          }
     };

     // Handle suggestion selection
     const handleSuggestionClick = (field) => {
          setSelectedLocation({
               lat: field.lat,
               lng: field.lng,
               address: field.address,
               name: field.name,
               field: field
          });
          setSearchQuery(field.name);
          setSuggestions([]);

          // Move map to selected location
          if (map) {
               map.setCenter({ lat: field.lat, lng: field.lng });
               map.setZoom(15);
          }
     };

     // Handle current location
     const handleCurrentLocation = () => {
          if (navigator.geolocation) {
               navigator.geolocation.getCurrentPosition(
                    (position) => {
                         const { latitude, longitude } = position.coords;
                         const location = {
                              lat: latitude,
                              lng: longitude,
                              address: "Vị trí hiện tại của bạn",
                              name: "Vị trí hiện tại"
                         };
                         setSelectedLocation(location);

                         if (map) {
                              map.setCenter({ lat: latitude, lng: longitude });
                              map.setZoom(15);
                         }
                    },
                    (error) => {
                         console.error('Error getting location:', error);
                         alert('Không thể lấy vị trí hiện tại');
                    }
               );
          } else {
               alert('Trình duyệt không hỗ trợ định vị');
          }
     };

     // Handle confirm selection
     const handleConfirm = () => {
          if (selectedLocation) {
               onLocationSelect(selectedLocation);
               onClose();
          }
     };

     if (!isOpen) return null;

     return (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
               <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                         <h2 className="text-2xl font-bold text-teal-800">Tìm kiếm bằng bản đồ</h2>
                         <Button
                              variant="outline"
                              onClick={onClose}
                              className="p-2 rounded-full hover:bg-gray-100"
                         >
                              <X className="w-5 h-5" />
                         </Button>
                    </div>

                    {/* Search Bar */}
                    <div className="p-6 border-b border-gray-200">
                         <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                              <input
                                   type="text"
                                   placeholder="Tìm kiếm sân bóng hoặc địa chỉ..."
                                   value={searchQuery}
                                   onChange={handleSearchChange}
                                   className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none"
                              />
                         </div>

                         {/* Suggestions */}
                         {suggestions.length > 0 && (
                              <div className="mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                                   {suggestions.map((field) => (
                                        <div
                                             key={field.id}
                                             onClick={() => handleSuggestionClick(field)}
                                             className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                        >
                                             <div className="flex items-center">
                                                  <MapPin className="w-4 h-4 text-teal-500 mr-2" />
                                                  <div>
                                                       <div className="font-semibold text-gray-900">{field.name}</div>
                                                       <div className="text-sm text-gray-600">{field.address}</div>
                                                  </div>
                                             </div>
                                        </div>
                                   ))}
                              </div>
                         )}

                         {/* Current Location Button */}
                         <div className="mt-4 flex gap-3">
                              <Button
                                   onClick={handleCurrentLocation}
                                   variant="outline"
                                   className="flex items-center gap-2 border-teal-200 text-teal-600 hover:bg-teal-50"
                              >
                                   <MapPin className="w-4 h-4" />
                                   Vị trí hiện tại
                              </Button>
                         </div>
                    </div>

                    {/* Map Container */}
                    <div className="flex-1 relative">
                         <div ref={mapRef} className="w-full h-full rounded-b-2xl" />

                         {/* Selected Location Info */}
                         {selectedLocation && (
                              <div className="absolute bottom-4 left-4 right-4 bg-white rounded-xl shadow-lg p-4 border border-gray-200">
                                   <div className="flex items-center justify-between">
                                        <div>
                                             <div className="font-semibold text-gray-900">{selectedLocation.name}</div>
                                             <div className="text-sm text-gray-600">{selectedLocation.address}</div>
                                        </div>
                                        <Button
                                             onClick={handleConfirm}
                                             className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-2 rounded-lg font-semibold"
                                        >
                                             Chọn vị trí này
                                        </Button>
                                   </div>
                              </div>
                         )}
                    </div>
               </div>
          </div>
     );
};

export default MapSearch;
