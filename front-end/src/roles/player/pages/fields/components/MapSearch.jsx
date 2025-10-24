import { useState, useEffect, useRef } from 'react';
import { MapPin, Search, X } from 'lucide-react';
import { Button, Input } from '../../../../../shared/components/ui';
import { fetchComplexes } from '../../../../../shared';

const MapSearch = ({ onLocationSelect, onClose, isOpen }) => {
     const [searchQuery, setSearchQuery] = useState('');
     const [suggestions, setSuggestions] = useState([]);
     const [selectedLocation, setSelectedLocation] = useState(null);
     const [map, setMap] = useState(null);
     const [markers, setMarkers] = useState([]);
     const [searchRadius, setSearchRadius] = useState(5); // km
     const [filteredFields, setFilteredFields] = useState([]);
     const mapRef = useRef(null);
     // const autocompleteRef = useRef(null);

     // Format price
     const formatPrice = (price) => {
          return new Intl.NumberFormat('vi-VN', {
               style: 'currency',
               currency: 'VND'
          }).format(price).replace('₫', 'đ');
     };

     // Calculate distance between two points
     const calculateDistance = (lat1, lon1, lat2, lon2) => {
          const R = 6371; // Radius of the Earth in kilometers
          const dLat = (lat2 - lat1) * Math.PI / 180;
          const dLon = (lon2 - lon1) * Math.PI / 180;
          const a =
               Math.sin(dLat / 2) * Math.sin(dLat / 2) +
               Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
               Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = R * c;
          return distance;
     };

     // Filter fields by radius
     const filterFieldsByRadius = (centerLat, centerLng, radius) => {
          return mockFields.filter(field => {
               const distance = calculateDistance(centerLat, centerLng, field.lat, field.lng);
               return distance <= radius;
          }).sort((a, b) => {
               const distanceA = calculateDistance(centerLat, centerLng, a.lat, a.lng);
               const distanceB = calculateDistance(centerLat, centerLng, b.lat, b.lng);
               return distanceA - distanceB;
          });
     };

     // Dynamic list based on services
     const [mockFields, setMockFields] = useState([]);

     useEffect(() => {
          fetchComplexes({}).then((list) => {
               const mapped = (list || []).map((c, i) => ({
                    id: c.complexId || i,
                    name: c.name,
                    location: 'Hà Nội',
                    address: c.address,
                    lat: c.lat,
                    lng: c.lng,
                    price: c.minPriceForSelectedSlot || 0,
                    rating: c.rating || 0,
                    availableSlots: c.availableFields || 0,
               })).filter(x => typeof x.lat === 'number' && typeof x.lng === 'number');
               setMockFields(mapped);
          }).catch(() => { });
     }, []);

     // Initialize map
     useEffect(() => {
          if (isOpen && !map) {
               const initMap = () => {
                    const mapInstance = new window.google.maps.Map(mapRef.current, {
                         center: { lat: 21.0285, lng: 105.8542 }, // Hà Nội center
                         zoom: 13,
                         mapTypeControl: true,
                         streetViewControl: true,
                         fullscreenControl: true,
                         zoomControl: true,
                         scaleControl: true,
                         rotateControl: true,
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
                    const fieldsToShow = filteredFields.length > 0 ? filteredFields : mockFields;
                    const fieldMarkers = fieldsToShow.map(field => {
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
                    const existing = document.getElementById('gmaps-script');
                    const apiKey = "AIzaSyCacoGIE6Qci-WIdKjjz2LF6hNDAnBwZWw";
                    if (!apiKey) {
                         // eslint-disable-next-line no-console
                         console.warn('Missing REACT_APP_GOOGLE_MAPS_API_KEY in environment');
                    }
                    const load = () => {
                         if (window.google && window.google.maps) initMap();
                    };
                    if (existing) {
                         existing.addEventListener('load', load, { once: true });
                    } else {
                         const script = document.createElement('script');
                         script.id = 'gmaps-script';
                         script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey || ''}&libraries=places&v=weekly&language=vi&region=VN`;
                         script.async = true;
                         script.defer = true;
                         script.onload = load;
                         document.head.appendChild(script);
                    }
               }
          }
          // eslint-disable-next-line react-hooks/exhaustive-deps
     }, [isOpen, map, onLocationSelect, filteredFields]);

     // Update markers when filtered fields change
     useEffect(() => {
          if (map) {
               // Clear existing markers
               markers.forEach(marker => marker.setMap(null));

               // Add new markers based on filtered fields
               const fieldsToShow = filteredFields.length > 0 ? filteredFields : mockFields;
               const newMarkers = fieldsToShow.map(field => {
                    const marker = new window.google.maps.Marker({
                         position: { lat: field.lat, lng: field.lng },
                         map: map,
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

               setMarkers(newMarkers);
          }
          // eslint-disable-next-line react-hooks/exhaustive-deps
     }, [filteredFields, map, onLocationSelect, mockFields]);

     // Handle search input
     const handleSearchChange = (e) => {
          const query = e.target.value;
          setSearchQuery(query);

          if (query.length > 2) {
               // Use Google Places API for autocomplete
               if (window.google && window.google.maps && window.google.maps.places) {
                    const service = new window.google.maps.places.AutocompleteService();
                    service.getPlacePredictions({
                         input: query,
                         componentRestrictions: { country: 'vn' },
                         types: ['establishment', 'geocode']
                    }, (predictions, status) => {
                         if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
                              const placesSuggestions = predictions.slice(0, 5).map(prediction => ({
                                   id: prediction.place_id,
                                   name: prediction.structured_formatting.main_text,
                                   address: prediction.structured_formatting.secondary_text || prediction.description,
                                   place_id: prediction.place_id
                              }));

                              // Combine with field suggestions
                              const fieldSuggestions = mockFields.filter(field =>
                                   field.name.toLowerCase().includes(query.toLowerCase()) ||
                                   field.location.toLowerCase().includes(query.toLowerCase()) ||
                                   field.address.toLowerCase().includes(query.toLowerCase())
                              ).slice(0, 3);

                              setSuggestions([...placesSuggestions, ...fieldSuggestions]);
                         } else {
                              // Fallback to mock suggestions
                              const filteredSuggestions = mockFields.filter(field =>
                                   field.name.toLowerCase().includes(query.toLowerCase()) ||
                                   field.location.toLowerCase().includes(query.toLowerCase()) ||
                                   field.address.toLowerCase().includes(query.toLowerCase())
                              ).slice(0, 5);
                              setSuggestions(filteredSuggestions);
                         }
                    });
               } else {
                    // Mock suggestions based on search query
                    const filteredSuggestions = mockFields.filter(field =>
                         field.name.toLowerCase().includes(query.toLowerCase()) ||
                         field.location.toLowerCase().includes(query.toLowerCase()) ||
                         field.address.toLowerCase().includes(query.toLowerCase())
                    ).slice(0, 5);
                    setSuggestions(filteredSuggestions);
               }
          } else {
               setSuggestions([]);
          }
     };

     // Handle suggestion selection
     const handleSuggestionClick = (suggestion) => {
          if (suggestion.place_id) {
               // Handle Google Places suggestion
               const geocoder = new window.google.maps.Geocoder();
               geocoder.geocode({ placeId: suggestion.place_id }, (results, status) => {
                    if (status === 'OK' && results[0]) {
                         const location = results[0].geometry.location;
                         const address = results[0].formatted_address;

                         setSelectedLocation({
                              lat: location.lat(),
                              lng: location.lng(),
                              address: address,
                              name: suggestion.name,
                              place_id: suggestion.place_id
                         });
                         setSearchQuery(suggestion.name);
                         setSuggestions([]);

                         // Move map to selected location
                         if (map) {
                              map.setCenter({ lat: location.lat(), lng: location.lng() });
                              map.setZoom(16);

                              // Clear previous user location markers
                              if (window.userLocationMarkers) {
                                   window.userLocationMarkers.forEach(marker => {
                                        if (marker.setMap) marker.setMap(null);
                                   });
                                   window.userLocationMarkers = [];
                              }
                         }

                         // Filter fields by radius
                         const nearbyFields = filterFieldsByRadius(location.lat(), location.lng(), searchRadius);
                         setFilteredFields(nearbyFields);
                    }
               });
          } else {
               // Handle field suggestion
               setSelectedLocation({
                    lat: suggestion.lat,
                    lng: suggestion.lng,
                    address: suggestion.address,
                    name: suggestion.name,
                    field: suggestion
               });
               setSearchQuery(suggestion.name);
               setSuggestions([]);

               // Move map to selected location
               if (map) {
                    map.setCenter({ lat: suggestion.lat, lng: suggestion.lng });
                    map.setZoom(16);

                    // Clear previous user location markers
                    if (window.userLocationMarkers) {
                         window.userLocationMarkers.forEach(marker => {
                              if (marker.setMap) marker.setMap(null);
                         });
                         window.userLocationMarkers = [];
                    }
               }

               // Filter fields by radius
               const nearbyFields = filterFieldsByRadius(suggestion.lat, suggestion.lng, searchRadius);
               setFilteredFields(nearbyFields);
          }
     };

     // Handle current location
     const handleCurrentLocation = () => {
          if (navigator.geolocation) {
               // Show loading state
               const loadingToast = document.createElement('div');
               loadingToast.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg z-50';
               loadingToast.textContent = 'Đang lấy vị trí...';
               document.body.appendChild(loadingToast);

               const options = {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 60000
               };

               navigator.geolocation.getCurrentPosition(
                    (position) => {
                         document.body.removeChild(loadingToast);
                         const { latitude, longitude, accuracy } = position.coords;

                         // Create a more accurate location object
                         const location = {
                              lat: latitude,
                              lng: longitude,
                              address: `Vị trí hiện tại (độ chính xác: ±${Math.round(accuracy)}m)`,
                              name: "Vị trí hiện tại của bạn",
                              accuracy: accuracy
                         };
                         setSelectedLocation(location);

                         if (map) {
                              // Center map on user location
                              map.setCenter({ lat: latitude, lng: longitude });
                              map.setZoom(16); // Higher zoom for current location

                              // Add user location marker
                              const userMarker = new window.google.maps.Marker({
                                   position: { lat: latitude, lng: longitude },
                                   map: map,
                                   title: "Vị trí của bạn",
                                   icon: {
                                        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                                             <svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
                                                  <circle cx="15" cy="15" r="12" fill="#3b82f6" stroke="white" stroke-width="3"/>
                                                  <circle cx="15" cy="15" r="6" fill="white"/>
                                             </svg>
                                        `)}`,
                                        scaledSize: new window.google.maps.Size(30, 30),
                                        anchor: new window.google.maps.Point(15, 15)
                                   }
                              });

                              // Add accuracy circle
                              const accuracyCircle = new window.google.maps.Circle({
                                   strokeColor: "#3b82f6",
                                   strokeOpacity: 0.8,
                                   strokeWeight: 2,
                                   fillColor: "#3b82f6",
                                   fillOpacity: 0.1,
                                   map: map,
                                   center: { lat: latitude, lng: longitude },
                                   radius: accuracy
                              });

                              // Store references to remove later
                              if (!window.userLocationMarkers) {
                                   window.userLocationMarkers = [];
                              }
                              window.userLocationMarkers.push(userMarker, accuracyCircle);
                         }

                         // Filter fields by radius
                         const nearbyFields = filterFieldsByRadius(latitude, longitude, searchRadius);
                         setFilteredFields(nearbyFields);

                         // Show success message
                         const successToast = document.createElement('div');
                         successToast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg z-50';
                         successToast.textContent = `Đã lấy vị trí! Tìm thấy ${nearbyFields.length} sân gần đây`;
                         document.body.appendChild(successToast);
                         setTimeout(() => document.body.removeChild(successToast), 3000);
                    },
                    (error) => {
                         document.body.removeChild(loadingToast);
                         console.error('Error getting location:', error);

                         let errorMessage = 'Không thể lấy vị trí hiện tại';
                         switch (error.code) {
                              case error.PERMISSION_DENIED:
                                   errorMessage = 'Bạn đã từ chối quyền truy cập vị trí';
                                   break;
                              case error.POSITION_UNAVAILABLE:
                                   errorMessage = 'Vị trí không khả dụng';
                                   break;
                              case error.TIMEOUT:
                                   errorMessage = 'Hết thời gian chờ lấy vị trí';
                                   break;
                              default:
                                   break;
                         }

                         const errorToast = document.createElement('div');
                         errorToast.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg z-50';
                         errorToast.textContent = errorMessage;
                         document.body.appendChild(errorToast);
                         setTimeout(() => document.body.removeChild(errorToast), 5000);
                    },
                    options
               );
          } else {
               const errorToast = document.createElement('div');
               errorToast.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg z-50';
               errorToast.textContent = 'Trình duyệt không hỗ trợ định vị';
               document.body.appendChild(errorToast);
               setTimeout(() => document.body.removeChild(errorToast), 3000);
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
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2">
               <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
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
                    <div className="p-4 border-b border-gray-200">
                         <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal-500 w-5 h-5" />
                              <Input
                                   type="text"
                                   placeholder="Tìm kiếm sân bóng, địa chỉ, quận..."
                                   value={searchQuery}
                                   onChange={handleSearchChange}
                                   className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all"
                              />
                              {searchQuery && (
                                   <Button
                                        onClick={() => {
                                             setSearchQuery('');
                                             setSuggestions([]);
                                        }}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-0 h-auto bg-transparent border-0 hover:bg-transparent"
                                   >
                                        <X className="w-5 h-5" />
                                   </Button>
                              )}
                         </div>

                         {/* Suggestions */}
                         {suggestions.length > 0 && (
                              <div className="mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                                   {suggestions.map((suggestion) => (
                                        <div
                                             key={suggestion.id || suggestion.place_id}
                                             onClick={() => handleSuggestionClick(suggestion)}
                                             className="p-3 hover:bg-teal-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                                        >
                                             <div className="flex items-center">
                                                  <MapPin className="w-4 h-4 text-teal-500 mr-2 flex-shrink-0" />
                                                  <div className="flex-1 min-w-0">
                                                       <div className="font-semibold text-gray-900 truncate">{suggestion.name}</div>
                                                       <div className="text-sm text-gray-600 truncate">{suggestion.address}</div>
                                                       {suggestion.place_id && (
                                                            <div className="text-xs text-blue-600 mt-1">📍 Địa điểm từ Google</div>
                                                       )}
                                                       {!suggestion.place_id && suggestion.price && (
                                                            <div className="text-xs text-teal-600 mt-1">
                                                                 ⚽ Sân bóng • {formatPrice(suggestion.price)}/trận
                                                            </div>
                                                       )}
                                                  </div>
                                             </div>
                                        </div>
                                   ))}
                              </div>
                         )}

                         {/* Control Panel */}
                         <div className="mt-2 flex items-center justify-between space-y-3">
                              {/* Location Controls */}
                              <div className="flex flex-col sm:flex-row gap-3">
                                   <Button
                                        onClick={handleCurrentLocation}
                                        variant="outline"
                                        className="flex items-center justify-center rounded-xl gap-2 border-teal-200 text-teal-600 hover:bg-teal-50 px-4 py-2 flex-1 sm:flex-none"
                                   >
                                        <MapPin className="w-4 h-4" />
                                        Vị trí hiện tại
                                   </Button>

                                   <Button
                                        onClick={() => {
                                             if (map) {
                                                  map.setCenter({ lat: 21.0285, lng: 105.8542 });
                                                  map.setZoom(13);
                                                  setFilteredFields([]);
                                                  setSelectedLocation(null);
                                                  setSearchQuery('');
                                                  setSuggestions([]);
                                                  // Clear user location markers
                                                  if (window.userLocationMarkers) {
                                                       window.userLocationMarkers.forEach(marker => {
                                                            if (marker.setMap) marker.setMap(null);
                                                       });
                                                       window.userLocationMarkers = [];
                                                  }
                                             }
                                        }}
                                        variant="outline"
                                        className="flex items-center rounded-xl gap-2 border-gray-200 text-gray-600 hover:bg-gray-50 px-4 py-2 flex-1 sm:flex-none"
                                   >
                                        <MapPin className="w-4 h-4" />
                                        Xem toàn bộ
                                   </Button>
                              </div>

                              {/* Radius Control */}
                              <div className="flex items-center gap-3">
                                   <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Bán kính tìm kiếm:</label>
                                   <select
                                        value={searchRadius}
                                        onChange={(e) => {
                                             const newRadius = Number(e.target.value);
                                             setSearchRadius(newRadius);
                                             // Re-filter if location is selected
                                             if (selectedLocation) {
                                                  const nearbyFields = filterFieldsByRadius(selectedLocation.lat, selectedLocation.lng, newRadius);
                                                  setFilteredFields(nearbyFields);
                                             }
                                        }}
                                        className="px-3 py-2 border rounded-xl border-gray-300 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-200 outline-none bg-white flex-1 sm:flex-none"
                                   >
                                        <option value={1}>1 km</option>
                                        <option value={2}>2 km</option>
                                        <option value={3}>3 km</option>
                                        <option value={5}>5 km</option>
                                        <option value={10}>10 km</option>
                                        <option value={15}>15 km</option>
                                        <option value={20}>20 km</option>
                                        <option value={30}>30 km</option>
                                   </select>

                                   {filteredFields.length > 0 && (
                                        <div className="text-sm text-teal-600 font-medium bg-teal-50 px-3 py-1 rounded-full">
                                             {filteredFields.length} sân
                                        </div>
                                   )}
                              </div>
                         </div>
                    </div>

                    {/* Map Container */}
                    <div className="flex-1 relative">
                         <div ref={mapRef} className="w-full h-full rounded-b-2xl" />

                         {/* Selected Location Info */}
                         {selectedLocation && (
                              <div className="absolute bottom-4 left-4 right-4 bg-white rounded-xl shadow-lg p-4 border border-gray-200 max-w-md">
                                   <div className="flex items-center justify-between mb-3">
                                        <div className="flex-1">
                                             <div className="font-semibold text-gray-900 text-lg">{selectedLocation.name}</div>
                                             <div className="text-sm text-gray-600">{selectedLocation.address}</div>
                                             {selectedLocation.accuracy && (
                                                  <div className="text-xs text-blue-600 mt-1 flex items-center">
                                                       <MapPin className="w-3 h-3 mr-1" />
                                                       Độ chính xác: ±{Math.round(selectedLocation.accuracy)}m
                                                  </div>
                                             )}
                                        </div>
                                        <div className="flex gap-2 ml-3">
                                             <Button
                                                  onClick={() => {
                                                       setSelectedLocation(null);
                                                       setFilteredFields([]);
                                                  }}
                                                  variant="outline"
                                                  className="px-3 py-2 text-gray-600 hover:bg-gray-50"
                                             >
                                                  Hủy
                                             </Button>
                                             <Button
                                                  onClick={handleConfirm}
                                                  className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 font-semibold"
                                             >
                                                  Chọn
                                             </Button>
                                        </div>
                                   </div>

                                   {/* Nearby Fields List */}
                                   {filteredFields.length > 0 && (
                                        <div className="border-t border-gray-200 pt-3">
                                             <div className="flex items-center justify-between mb-2">
                                                  <div className="text-sm font-medium text-gray-700">
                                                       Sân bóng gần đây ({filteredFields.length} sân):
                                                  </div>
                                                  <div className="text-xs text-gray-500">
                                                       Bán kính: {searchRadius}km
                                                  </div>
                                             </div>
                                             <div className="max-h-40 overflow-y-auto space-y-2">
                                                  {filteredFields.slice(0, 6).map((field) => {
                                                       const distance = calculateDistance(
                                                            selectedLocation.lat, selectedLocation.lng,
                                                            field.lat, field.lng
                                                       );
                                                       return (
                                                            <div key={field.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                                                                 onClick={() => handleSuggestionClick(field)}
                                                            >
                                                                 <div className="flex-1">
                                                                      <div className="text-sm font-medium text-gray-900">{field.name}</div>
                                                                      <div className="text-xs text-gray-600">{field.address}</div>
                                                                      <div className="text-xs text-gray-500">
                                                                           {formatPrice(field.price)}/trận • ⭐ {field.rating}
                                                                      </div>
                                                                 </div>
                                                                 <div className="text-xs text-teal-600 font-medium bg-teal-50 px-2 py-1 rounded">
                                                                      {distance.toFixed(1)} km
                                                                 </div>
                                                            </div>
                                                       );
                                                  })}
                                             </div>
                                             {filteredFields.length > 6 && (
                                                  <div className="text-xs text-gray-500 text-center mt-2">
                                                       Và {filteredFields.length - 6} sân khác...
                                                  </div>
                                             )}
                                        </div>
                                   )}

                                   {filteredFields.length === 0 && selectedLocation && (
                                        <div className="border-t border-gray-200 pt-3">
                                             <div className="text-center py-4">
                                                  <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                                  <div className="text-sm text-gray-600">
                                                       Không có sân bóng nào trong bán kính {searchRadius}km
                                                  </div>
                                                  <div className="text-xs text-gray-500 mt-1">
                                                       Thử tăng bán kính tìm kiếm
                                                  </div>
                                             </div>
                                        </div>
                                   )}
                              </div>
                         )}
                    </div>
               </div>
          </div>
     );
};

export default MapSearch;
