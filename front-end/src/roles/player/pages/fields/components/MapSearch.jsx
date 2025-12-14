import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Search, X } from 'lucide-react';
import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../../shared/components/ui';
import { fetchComplexes } from '../../../../../shared';
import * as GoongMap from '@goongmaps/goong-js';
import '@goongmaps/goong-js/dist/goong-js.css';

const MapSearch = ({ onLocationSelect, onClose, isOpen }) => {
     const [searchQuery, setSearchQuery] = useState('');
     const [suggestions, setSuggestions] = useState([]);
     const [selectedLocation, setSelectedLocation] = useState(null);
     const [map, setMap] = useState(null);
     const [searchRadius, setSearchRadius] = useState(5); // km
     const [filteredFields, setFilteredFields] = useState([]);
     const mapRef = useRef(null);
     const markersRef = useRef([]);
     const userLocationMarkerRef = useRef(null);
     const accuracyCircleRef = useRef(null);

     const displayLocation = selectedLocation?.field || selectedLocation;

     // Goong API Keys
     // Maptiles Key để hiển thị bản đồ
     const GOONG_API_KEY = process.env.REACT_APP_GOONG_API_KEY || "tnV2EmQTmY2Vqez3KWtC5DHadHJQllNegQXV3lOV";
     // REST API Key cho các dịch vụ API khác (autocomplete, geocoding, etc.)
     const GOONG_REST_API_KEY = process.env.REACT_APP_GOONG_REST_API_KEY || "89P5FAoUGyO5vDpUIeLtXDZ6Xti5NSlKQBJSR6Yu";

     const GOONG_AUTOCOMPLETE_URL = 'https://rsapi.goong.io/Place/AutoComplete';
     const GOONG_PLACE_DETAIL_URL = 'https://rsapi.goong.io/Place/Detail';

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

     // Add field markers to map
     const addFieldMarkers = useCallback((mapInstance) => {
          if (!mapInstance) return;

          // Clear existing markers
          markersRef.current.forEach(marker => {
               try {
                    marker.remove();
               } catch (e) {
                    console.warn('Error removing marker:', e);
               }
          });
          markersRef.current = [];

          const fieldsToShow = filteredFields.length > 0 ? filteredFields : mockFields;
          if (fieldsToShow.length === 0) {
               console.log('No fields to show on map');
               return;
          }

          console.log(`Adding ${fieldsToShow.length} markers to map`);

          const newMarkers = fieldsToShow
               .filter(field => {
                    // Filter out invalid coordinates
                    return field.lng && field.lat && !isNaN(field.lng) && !isNaN(field.lat);
               })
               .map(field => {
                    // Create custom marker element with better styling
                    const el = document.createElement('div');
                    el.className = 'field-marker';
                    el.innerHTML = `
                    <svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                         <circle cx="24" cy="24" r="20" fill="#14b8a6" stroke="white" stroke-width="3" opacity="0.9"/>
                         <circle cx="24" cy="24" r="16" fill="#10b981" opacity="0.8"/>
                         <text x="24" y="30" text-anchor="middle" fill="white" font-size="18" font-weight="bold">⚽</text>
                         <circle cx="24" cy="24" r="20" fill="none" stroke="#ffffff" stroke-width="1" opacity="0.5"/>
                    </svg>
               `;
                    el.style.cursor = 'pointer';
                    // Set fixed size to prevent jumping
                    el.style.width = '48px';
                    el.style.height = '48px';
                    el.style.display = 'flex';
                    el.style.alignItems = 'center';
                    el.style.justifyContent = 'center';
                    el.style.opacity = '1';
                    el.style.pointerEvents = 'auto';

                    // Disable hover effect completely to prevent opacity flashing/jumping
                    // The cursor pointer is enough visual feedback

                    try {
                         const marker = new GoongMap.Marker({
                              element: el,
                              anchor: 'center',
                              // Prevent marker from moving when element size changes
                              offset: [0, 0]
                         })
                              .setLngLat([field.lng, field.lat])
                              .addTo(mapInstance);

                         // Add click listener with popup
                         el.addEventListener('click', () => {
                              // Fly to location
                              mapInstance.flyTo({
                                   center: [field.lng, field.lat],
                                   zoom: 16,
                                   duration: 1000,
                              });

                              const pickedLocation = {
                                   lat: field.lat,
                                   lng: field.lng,
                                   address: field.address,
                                   name: field.name,
                                   field: field
                              };

                              // Keep internal selection so detail card shows up
                              setSelectedLocation(pickedLocation);
                              onLocationSelect(pickedLocation);
                         });

                         return marker;
                    } catch (error) {
                         console.error(`Error creating marker for ${field.name}:`, error);
                         return null;
                    }
               })
               .filter(marker => marker !== null); // Remove null markers

          if (newMarkers.length > 0) {
               console.log(`Successfully added ${newMarkers.length} markers to map`);
          } else {
               console.warn('No valid markers were created. Check field coordinates.');
          }
          markersRef.current = newMarkers;
     }, [filteredFields, mockFields, onLocationSelect]);

     useEffect(() => {
          fetchComplexes({}).then((list) => {
               const mapped = (list || []).map((c, i) => ({
                    id: c.complexId || i,
                    name: c.name,
                    location: c.province || c.district || 'Hà Nội',
                    address: c.address || '',
                    lat: c.lat || c.latitude,
                    lng: c.lng || c.longitude,
                    price: c.minPriceForSelectedSlot || 0,
                    rating: c.rating || 0,
                    availableSlots: c.availableFields || c.totalFields || 0,
                    complexId: c.complexId,
                    imageUrl: c.imageUrl,
                    totalFields: c.totalFields || 0,
                    ward: c.ward,
                    district: c.district,
                    province: c.province,
               })).filter(x =>
                    typeof x.lat === 'number' &&
                    typeof x.lng === 'number' &&
                    !isNaN(x.lat) &&
                    !isNaN(x.lng) &&
                    x.lat !== 0 &&
                    x.lng !== 0
               );
               setMockFields(mapped);

               // If map is already loaded, update markers
               if (map && map.loaded() && mapped.length > 0) {
                    addFieldMarkers(map);
               }
          }).catch((error) => {
               console.error('Error fetching complexes:', error);
          });
     }, [map, addFieldMarkers]);

     // Initialize Goong Map
     useEffect(() => {
          if (isOpen && !map) {
               const initMap = () => {
                    if (!mapRef.current) {
                         console.warn('Map container ref is not available');
                         return;
                    }

                    // Check if Maptiles Key is configured
                    if (!GOONG_API_KEY || GOONG_API_KEY === "YOUR_GOONG_API_KEY_HERE") {
                         console.error('Goong Maptiles Key chưa được cấu hình! Vui lòng thêm REACT_APP_GOONG_API_KEY vào file .env');
                         return;
                    }

                    try {
                         // Set access token globally for Goong GL JS
                         if (GoongMap && typeof GoongMap !== 'undefined') {
                              if (typeof GoongMap.accessToken !== 'undefined') {
                                   GoongMap.accessToken = GOONG_API_KEY;
                              }
                         }

                         const mapOptions = {
                              container: mapRef.current,
                              style: 'https://tiles.goong.io/assets/goong_map_web.json',
                              center: [105.8542, 21.0285], // [lng, lat] for Goong - Hà Nội center
                              zoom: 13,
                         };

                         // Add accessToken to options if not set globally
                         if (!GoongMap.accessToken) {
                              mapOptions.accessToken = GOONG_API_KEY;
                         }

                         const mapInstance = new GoongMap.Map(mapOptions);

                         mapInstance.on('load', () => {
                              console.log('Goong Map loaded successfully');
                              // Wait a bit for map to fully render, then add markers
                              setTimeout(() => {
                                   if (mockFields.length > 0) {
                                        addFieldMarkers(mapInstance);
                                   }

                                   // Automatically get and display user's current location
                                   if (navigator.geolocation) {
                                        navigator.geolocation.getCurrentPosition(
                                             (position) => {
                                                  const { latitude, longitude } = position.coords;

                                                  // Center map on user location
                                                  mapInstance.flyTo({
                                                       center: [longitude, latitude],
                                                       zoom: 14,
                                                       duration: 1000,
                                                  });

                                                  // Clear previous user location markers
                                                  if (userLocationMarkerRef.current) {
                                                       try {
                                                            userLocationMarkerRef.current.remove();
                                                       } catch (e) {
                                                            console.warn('Error removing user marker:', e);
                                                       }
                                                  }

                                                  // Add user location marker with better design
                                                  const userEl = document.createElement('div');
                                                  userEl.innerHTML = `
                                                       <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                                                            <!-- Outer pulsing circle -->
                                                            <circle cx="20" cy="20" r="18" fill="#3b82f6" opacity="0.3" class="pulse-circle"/>
                                                            <!-- Middle circle -->
                                                            <circle cx="20" cy="20" r="14" fill="#3b82f6" opacity="0.5"/>
                                                            <!-- Inner circle -->
                                                            <circle cx="20" cy="20" r="10" fill="#3b82f6" stroke="white" stroke-width="2.5"/>
                                                            <!-- Center dot -->
                                                            <circle cx="20" cy="20" r="5" fill="white"/>
                                                       </svg>
                                                  `;
                                                  userEl.style.cursor = 'pointer';
                                                  userEl.style.transition = 'transform 0.2s ease';
                                                  userEl.style.width = '40px';
                                                  userEl.style.height = '40px';

                                                  // Add hover effect
                                                  userEl.addEventListener('mouseenter', () => {
                                                       userEl.style.transform = 'scale(1.15)';
                                                  });
                                                  userEl.addEventListener('mouseleave', () => {
                                                       userEl.style.transform = 'scale(1)';
                                                  });

                                                  // Add click handler to fly to and zoom in
                                                  userEl.addEventListener('click', (e) => {
                                                       e.stopPropagation();
                                                       mapInstance.flyTo({
                                                            center: [longitude, latitude],
                                                            zoom: 16,
                                                            duration: 1000,
                                                       });
                                                  });

                                                  try {
                                                       const userMarker = new GoongMap.Marker({
                                                            element: userEl,
                                                            anchor: 'center',
                                                            offset: [0, 0]
                                                       })
                                                            .setLngLat([longitude, latitude])
                                                            .addTo(mapInstance);

                                                       userLocationMarkerRef.current = userMarker;

                                                       console.log('User location displayed on map');
                                                  } catch (error) {
                                                       console.error('Error creating user location marker:', error);
                                                  }
                                             },
                                             (error) => {
                                                  console.log('Could not get user location automatically:', error);
                                                  // Continue without user location
                                             },
                                             {
                                                  enableHighAccuracy: true,
                                                  timeout: 5000,
                                                  maximumAge: 60000
                                             }
                                        );
                                   }
                              }, 500);
                         });

                         mapInstance.on('error', (e) => {
                              console.error('Goong Map error:', e);
                         });

                         setMap(mapInstance);
                    } catch (error) {
                         console.error('Error initializing Goong Map:', error);
                    }
               };

               // Initialize map after a short delay to ensure container is ready
               const timer = setTimeout(initMap, 100);
               return () => clearTimeout(timer);
          }
          // eslint-disable-next-line react-hooks/exhaustive-deps
     }, [isOpen, map, addFieldMarkers, mockFields]);


     // Update markers when filtered fields or mockFields change
     useEffect(() => {
          if (map && map.loaded()) {
               // Wait a bit to ensure map is fully ready
               const timer = setTimeout(() => {
                    if (mockFields.length > 0 || filteredFields.length > 0) {
                         addFieldMarkers(map);
                    }
               }, 100);
               return () => clearTimeout(timer);
          }
     }, [filteredFields, map, mockFields, addFieldMarkers]);

     // Handle search input with Goong Autocomplete
     const handleSearchChange = async (e) => {
          const query = e.target.value;
          setSearchQuery(query);

          if (query.length > 2) {
               try {
                    // Use Goong Autocomplete API
                    const response = await fetch(
                         `${GOONG_AUTOCOMPLETE_URL}?api_key=${GOONG_REST_API_KEY}&input=${encodeURIComponent(query)}&location=21.0285,105.8542&radius=50000&limit=5`
                    );
                    const data = await response.json();

                    if (data.predictions && data.predictions.length > 0) {
                         const placesSuggestions = data.predictions.map(prediction => ({
                              id: prediction.place_id,
                              name: prediction.structured_formatting?.main_text || prediction.description,
                              address: prediction.structured_formatting?.secondary_text || prediction.description,
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
               } catch (error) {
                    console.error('Error fetching autocomplete:', error);
                    // Fallback to mock suggestions
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
     const handleSuggestionClick = async (suggestion) => {
          if (suggestion.place_id) {
               // Handle Goong Places suggestion
               try {
                    const response = await fetch(
                         `${GOONG_PLACE_DETAIL_URL}?api_key=${GOONG_REST_API_KEY}&place_id=${suggestion.place_id}`
                    );
                    const data = await response.json();

                    if (data.result) {
                         const place = data.result;
                         const location = {
                              lat: place.geometry?.location?.lat || place.lat,
                              lng: place.geometry?.location?.lng || place.lng,
                         };
                         const address = place.formatted_address || place.name || place.address;

                         setSelectedLocation({
                              lat: location.lat,
                              lng: location.lng,
                              address: address,
                              name: suggestion.name,
                              place_id: suggestion.place_id
                         });
                         setSearchQuery(suggestion.name);
                         setSuggestions([]);

                         // Move map to selected location
                         if (map) {
                              map.flyTo({
                                   center: [location.lng, location.lat],
                                   zoom: 16,
                              });

                              // Clear previous user location markers
                              if (userLocationMarkerRef.current) {
                                   userLocationMarkerRef.current.remove();
                                   userLocationMarkerRef.current = null;
                              }
                              if (accuracyCircleRef.current) {
                                   accuracyCircleRef.current.remove();
                                   accuracyCircleRef.current = null;
                              }
                         }

                         // Filter fields by radius
                         const nearbyFields = filterFieldsByRadius(location.lat, location.lng, searchRadius);
                         setFilteredFields(nearbyFields);
                    }
               } catch (error) {
                    console.error('Error fetching place details:', error);
               }
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
                    map.flyTo({
                         center: [suggestion.lng, suggestion.lat],
                         zoom: 16,
                    });

                    // Clear previous user location markers
                    if (userLocationMarkerRef.current) {
                         userLocationMarkerRef.current.remove();
                         userLocationMarkerRef.current = null;
                    }
                    if (accuracyCircleRef.current) {
                         accuracyCircleRef.current.remove();
                         accuracyCircleRef.current = null;
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

                         if (map && map.loaded()) {
                              // Wait a bit to ensure map is ready
                              setTimeout(() => {
                                   // Center map on user location
                                   map.flyTo({
                                        center: [longitude, latitude],
                                        zoom: 16,
                                        duration: 1000,
                                   });

                                   // Clear previous user location markers
                                   if (userLocationMarkerRef.current) {
                                        try {
                                             userLocationMarkerRef.current.remove();
                                        } catch (e) {
                                             console.warn('Error removing user marker:', e);
                                        }
                                   }
                                   if (accuracyCircleRef.current) {
                                        try {
                                             accuracyCircleRef.current.remove();
                                        } catch (e) {
                                             console.warn('Error removing accuracy circle:', e);
                                        }
                                   }

                                   // Add user location marker with better design
                                   const userEl = document.createElement('div');
                                   userEl.innerHTML = `
                                        <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                                             <!-- Outer pulsing circle -->
                                             <circle cx="20" cy="20" r="18" fill="#3b82f6" opacity="0.3" class="pulse-circle"/>
                                             <!-- Middle circle -->
                                             <circle cx="20" cy="20" r="14" fill="#3b82f6" opacity="0.5"/>
                                             <!-- Inner circle -->
                                             <circle cx="20" cy="20" r="10" fill="#3b82f6" stroke="white" stroke-width="2.5"/>
                                             <!-- Center dot -->
                                             <circle cx="20" cy="20" r="5" fill="white"/>
                                        </svg>
                                   `;
                                   userEl.style.cursor = 'pointer';
                                   userEl.style.transition = 'transform 0.2s ease';
                                   userEl.style.width = '40px';
                                   userEl.style.height = '40px';

                                   // Add hover effect
                                   userEl.addEventListener('mouseenter', () => {
                                        userEl.style.transform = 'scale(1.15)';
                                   });
                                   userEl.addEventListener('mouseleave', () => {
                                        userEl.style.transform = 'scale(1)';
                                   });

                                   // Add click handler to fly to and zoom in
                                   userEl.addEventListener('click', (e) => {
                                        e.stopPropagation();
                                        map.flyTo({
                                             center: [longitude, latitude],
                                             zoom: 16,
                                             duration: 1000,
                                        });
                                   });

                                   try {
                                        const userMarker = new GoongMap.Marker({
                                             element: userEl,
                                             anchor: 'center',
                                             offset: [0, 0]
                                        })
                                             .setLngLat([longitude, latitude])
                                             .addTo(map);

                                        userLocationMarkerRef.current = userMarker;
                                   } catch (error) {
                                        console.error('Error creating user location marker:', error);
                                   }
                              }, 100);
                         } else if (!map) {
                              console.warn('Map is not initialized yet');
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

     // Cleanup on unmount
     useEffect(() => {
          return () => {
               if (map) {
                    map.remove();
               }
               markersRef.current.forEach(marker => marker.remove());
               if (userLocationMarkerRef.current) {
                    userLocationMarkerRef.current.remove();
               }
               if (accuracyCircleRef.current) {
                    accuracyCircleRef.current.remove();
               }
          };
     }, [map]);

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
                              className="p-1 h-7 w-7 rounded-full hover:bg-teal-100 text-teal-400 hover:text-teal-600 transition-colors"
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
                                        className="absolute right-3 rounded-full top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-0 h-auto bg-transparent border-0 hover:bg-transparent"
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
                                                            <div className="text-xs text-blue-600 mt-1">📍 Địa điểm từ Goong</div>
                                                       )}
                                                       {!suggestion.place_id && suggestion.price && (
                                                            <div className="text-xs text-orange-600 mt-1">
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
                         <div className="mt-1 flex items-center justify-between space-y-1">
                              {/* Location Controls */}
                              <div className="flex flex-col sm:flex-row gap-3">
                                   <Button
                                        onClick={handleCurrentLocation}
                                        variant="outline"
                                        className="flex items-center justify-center rounded-2xl gap-2 border-blue-200 hover:text-blue-600 text-blue-600 hover:bg-gray-50 px-4 py-0.5 flex-1 sm:flex-none"
                                   >
                                        <MapPin className="w-4 h-4" />
                                        Vị trí hiện tại
                                   </Button>

                                   <Button
                                        onClick={() => {
                                             if (map && map.loaded()) {
                                                  // Calculate bounds to fit all markers
                                                  if (mockFields.length > 0) {
                                                       const validFields = mockFields.filter(f =>
                                                            f.lng && f.lat &&
                                                            !isNaN(f.lng) && !isNaN(f.lat) &&
                                                            f.lng !== 0 && f.lat !== 0
                                                       );

                                                       if (validFields.length > 0) {
                                                            // Calculate bounds
                                                            const lngs = validFields.map(f => f.lng);
                                                            const lats = validFields.map(f => f.lat);
                                                            const minLng = Math.min(...lngs);
                                                            const maxLng = Math.max(...lngs);
                                                            const minLat = Math.min(...lats);
                                                            const maxLat = Math.max(...lats);

                                                            // Calculate center and zoom
                                                            const centerLng = (minLng + maxLng) / 2;
                                                            const centerLat = (minLat + maxLat) / 2;

                                                            // Calculate zoom level based on bounds
                                                            const lngDiff = maxLng - minLng;
                                                            const latDiff = maxLat - minLat;
                                                            const maxDiff = Math.max(lngDiff, latDiff);

                                                            // Determine zoom level (smaller diff = higher zoom)
                                                            let zoom = 13;
                                                            if (maxDiff < 0.01) zoom = 15;
                                                            else if (maxDiff < 0.05) zoom = 14;
                                                            else if (maxDiff < 0.1) zoom = 13;
                                                            else if (maxDiff < 0.2) zoom = 12;
                                                            else if (maxDiff < 0.5) zoom = 11;
                                                            else zoom = 10;

                                                            // Fly to calculated center with appropriate zoom
                                                            map.flyTo({
                                                                 center: [centerLng, centerLat],
                                                                 zoom: zoom,
                                                                 duration: 1000,
                                                            });
                                                       } else {
                                                            // Fallback to default center if no valid fields
                                                            map.flyTo({
                                                                 center: [105.8542, 21.0285],
                                                                 zoom: 13,
                                                                 duration: 1000,
                                                            });
                                                       }
                                                  } else {
                                                       // Fallback to default center
                                                       map.flyTo({
                                                            center: [105.8542, 21.0285],
                                                            zoom: 13,
                                                            duration: 1000,
                                                       });
                                                  }

                                                  setFilteredFields([]);
                                                  setSelectedLocation(null);
                                                  setSearchQuery('');
                                                  setSuggestions([]);

                                                  // Clear user location markers
                                                  if (userLocationMarkerRef.current) {
                                                       try {
                                                            userLocationMarkerRef.current.remove();
                                                       } catch (e) {
                                                            console.warn('Error removing user marker:', e);
                                                       }
                                                       userLocationMarkerRef.current = null;
                                                  }
                                                  if (accuracyCircleRef.current) {
                                                       try {
                                                            accuracyCircleRef.current.remove();
                                                       } catch (e) {
                                                            console.warn('Error removing accuracy circle:', e);
                                                       }
                                                       accuracyCircleRef.current = null;
                                                  }
                                             }
                                        }}
                                        variant="outline"
                                        className="flex items-center rounded-2xl gap-2 border-gray-200 hover:text-teal-600 text-teal-600 hover:bg-gray-50 px-4 py-0.5 flex-1 sm:flex-none"
                                   >
                                        <MapPin className="w-4 h-4" />
                                        Xem toàn bộ
                                   </Button>
                              </div>

                              {/* Radius Control */}
                              <div className="flex items-center gap-3">
                                   <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Bán kính tìm kiếm:</label>
                                   <Select
                                        value={searchRadius.toString()}
                                        onValueChange={(value) => {
                                             const newRadius = Number(value);
                                             setSearchRadius(newRadius);
                                             // Re-filter if location is selected
                                             if (selectedLocation) {
                                                  const nearbyFields = filterFieldsByRadius(selectedLocation.lat, selectedLocation.lng, newRadius);
                                                  setFilteredFields(nearbyFields);
                                             }
                                        }}
                                   >
                                        <SelectTrigger className="w-[120px] h-10 border-gray-300 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-200 rounded-xl">
                                             <SelectValue placeholder="Chọn bán kính" />
                                        </SelectTrigger>
                                        <SelectContent>
                                             <SelectItem value="1">1 km</SelectItem>
                                             <SelectItem value="2">2 km</SelectItem>
                                             <SelectItem value="3">3 km</SelectItem>
                                             <SelectItem value="5">5 km</SelectItem>
                                             <SelectItem value="10">10 km</SelectItem>
                                             <SelectItem value="15">15 km</SelectItem>
                                             <SelectItem value="20">20 km</SelectItem>
                                             <SelectItem value="30">30 km</SelectItem>
                                        </SelectContent>
                                   </Select>

                                   {filteredFields.length > 0 && (
                                        <div className="text-sm text-teal-600 font-medium bg-teal-50 px-3 py-1 rounded-full">
                                             {filteredFields.length} sân
                                        </div>
                                   )}
                              </div>
                         </div>
                    </div>

                    {/* Map Container */}
                    <div className="flex-1 relative min-h-[400px]">
                         <div ref={mapRef} className="w-full h-full rounded-b-2xl min-h-[400px]" />

                         {/* Selected Location Info */}
                         {selectedLocation && (
                              <div className="absolute bottom-3 left-3 right-3 bg-white rounded-2xl shadow-lg p-3 border border-gray-200 max-w-md">
                                   <div className="flex items-center gap-3 mb-3">
                                        {displayLocation?.imageUrl && (
                                             <div className="w-20 h-20 rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                                                  <img
                                                       src={displayLocation.imageUrl}
                                                       alt={displayLocation.name}
                                                       className="w-full h-full object-cover"
                                                  />
                                             </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                             <div className="font-semibold text-gray-900 text-lg truncate">
                                                  {selectedLocation.name}
                                             </div>
                                             <div className="text-xs text-gray-600 line-clamp-2">
                                                  {selectedLocation.address || displayLocation?.location}
                                             </div>
                                             {selectedLocation.accuracy && (
                                                  <div className="text-xs text-blue-600 mt-1 flex items-center">
                                                       <MapPin className="w-3 h-3 mr-1" />
                                                       Độ chính xác: ±{Math.round(selectedLocation.accuracy)}m
                                                  </div>
                                             )}
                                             {displayLocation && (
                                                  <div className="flex flex-wrap gap-2 mt-2 text-xs">
                                                       {displayLocation.rating !== undefined && (
                                                            <span className="px-2 py-1 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-100">
                                                                 ⭐ {displayLocation.rating}
                                                            </span>
                                                       )}
                                                       {displayLocation.price !== undefined && (
                                                            <span className="px-2 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-100">
                                                                 {formatPrice(displayLocation.price)}
                                                            </span>
                                                       )}
                                                       {displayLocation.totalFields !== undefined && (
                                                            <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                                                                 {displayLocation.totalFields} sân
                                                            </span>
                                                       )}

                                                  </div>
                                             )}

                                        </div>
                                        <div className="flex items-center justify-end gap-2">
                                             <Button
                                                  onClick={() => {
                                                       setSelectedLocation(null);
                                                       setFilteredFields([]);
                                                  }}
                                                  variant="outline"
                                                  className="px-2 py-0.5 h-7 hover:text-teal-600 text-xs rounded-2xl text-gray-600 hover:bg-gray-50"
                                             >
                                                  Hủy
                                             </Button>
                                             <Button
                                                  onClick={handleConfirm}
                                                  className="bg-teal-500 h-7 text-xs hover:bg-teal-600 text-white px-2 py-0.5 font-semibold rounded-2xl"
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
                                                            <div key={field.id} className="flex items-center justify-between p-2 border border-teal-200 bg-teal-50 rounded-xl hover:bg-teal-100 transition-colors cursor-pointer"
                                                                 onClick={() => handleSuggestionClick(field)}
                                                            >
                                                                 <div className="flex-1">
                                                                      <div className="text-sm font-medium text-gray-900">{field.name}</div>
                                                                      <div className="text-xs text-gray-600">{field.address}</div>
                                                                      <div className="text-xs text-orange-600">
                                                                           ⭐ {field.rating}
                                                                      </div>
                                                                 </div>
                                                                 <div className="text-xs text-teal-600 font-medium bg-teal-200 px-2 py-1 rounded-xl">
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
