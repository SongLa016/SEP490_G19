import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, X, Search, Loader2 } from 'lucide-react';
import { Input, Button } from './ui';
import goongjs from '@goongmaps/goong-js';
import '@goongmaps/goong-js/dist/goong-js.css';

const AddressPicker = ({ value, onChange, placeholder = "Nhập địa chỉ hoặc chọn trên bản đồ", onLocationSelect }) => {
  const [address, setAddress] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [mapSuggestions, setMapSuggestions] = useState([]);
  const [showMapSuggestions, setShowMapSuggestions] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [selectedAddressInfo, setSelectedAddressInfo] = useState(null);
  const mapRef = useRef(null);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const mapSearchRef = useRef(null);
  const mapSuggestionsRef = useRef(null);
  const markerRef = useRef(null);
  const popupRef = useRef(null);
  const circleRef = useRef(null);

  // Goong API Key - Maptiles Key để hiển thị bản đồ
  // Lấy từ https://account.goong.io/
  const GOONG_API_KEY = process.env.REACT_APP_GOONG_API_KEY || "tnV2EmQTmY2Vqez3KWtC5DHadHJQllNegQXV3lOV";

  // REST API Key cho các dịch vụ API khác (autocomplete, geocoding, etc.)
  const GOONG_REST_API_KEY = process.env.REACT_APP_GOONG_REST_API_KEY || "89P5FAoUGyO5vDpUIeLtXDZ6Xti5NSlKQBJSR6Yu";

  // Goong API endpoints
  const GOONG_AUTOCOMPLETE_URL = 'https://rsapi.goong.io/Place/AutoComplete';
  const GOONG_PLACE_DETAIL_URL = 'https://rsapi.goong.io/Place/Detail';
  const GOONG_REVERSE_GEOCODE_URL = 'https://rsapi.goong.io/Geocode';

  // Handle address input change with Goong Autocomplete
  const handleAddressChange = async (e) => {
    const query = e.target.value;
    setAddress(query);

    if (onChange) {
      onChange(query);
    }

    if (query.length > 2) {
      try {
        const response = await fetch(
          `${GOONG_AUTOCOMPLETE_URL}?api_key=${GOONG_REST_API_KEY}&input=${encodeURIComponent(query)}&location=21.0285,105.8542&radius=50000&limit=5`
        );
        const data = await response.json();

        if (data.predictions && data.predictions.length > 0) {
          setSuggestions(data.predictions);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (error) {
        console.error('Error fetching autocomplete suggestions:', error);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Helper function to extract address components from Goong API response
  const extractAddressComponents = (addressComponents) => {
    let ward = '';
    let district = '';
    let province = '';

    if (Array.isArray(addressComponents)) {
      addressComponents.forEach((component) => {
        const types = component.types || [];
        if (types.includes('ward') || types.includes('sublocality')) {
          ward = component.long_name || component.short_name || '';
        } else if (types.includes('administrative_area_level_2') || types.includes('district')) {
          district = component.long_name || component.short_name || '';
        } else if (types.includes('administrative_area_level_1') || types.includes('province')) {
          province = component.long_name || component.short_name || '';
        }
      });
    }

    return { ward, district, province };
  };

  // Helper function to update popup content
  const updatePopupContent = useCallback((popupInstance, location, addressText) => {
    if (!popupInstance || !location) return;

    const addressDisplay = selectedAddressInfo?.address || addressText || 'Đang lấy địa chỉ...';
    const ward = selectedAddressInfo?.ward || '';
    const district = selectedAddressInfo?.district || '';
    const province = selectedAddressInfo?.province || '';

    const popupHTML = `
      <div style="min-width: 200px; max-width: 300px;">
        <div style="font-weight: 600; color: #1f2937; margin-bottom: 8px; font-size: 14px;">
          📍 Vị trí đã chọn
        </div>
        <div style="font-size: 13px; color: #374151; margin-bottom: 8px; line-height: 1.4;">
          ${addressDisplay}
        </div>
        ${(ward || district || province) ? `
          <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 8px;">
            ${ward ? `<span style="padding: 2px 8px; background: #dbeafe; color: #1e40af; border-radius: 4px; font-size: 11px; border: 1px solid #93c5fd;">${ward}</span>` : ''}
            ${district ? `<span style="padding: 2px 8px; background: #d1fae5; color: #065f46; border-radius: 4px; font-size: 11px; border: 1px solid #6ee7b7;">${district}</span>` : ''}
            ${province ? `<span style="padding: 2px 8px; background: #e9d5ff; color: #6b21a8; border-radius: 4px; font-size: 11px; border: 1px solid #c084fc;">${province}</span>` : ''}
          </div>
        ` : ''}
        <div style="font-size: 11px; color: #6b7280; padding-top: 8px; border-top: 1px solid #e5e7eb;">
          <div>Lat: <span style="font-family: monospace;">${location.lat.toFixed(6)}</span></div>
          <div>Lng: <span style="font-family: monospace;">${location.lng.toFixed(6)}</span></div>
        </div>
      </div>
    `;

    popupInstance.setHTML(popupHTML);
  }, [selectedAddressInfo]);

  // Helper function to add/update circle on map
  const addCircle = (mapInstance, location) => {
    if (!mapInstance || !location) return;

    const updateCircleData = () => {
      try {
        // Check if source exists
        if (mapInstance.getSource('circle-source')) {
          // Update existing source data
          const source = mapInstance.getSource('circle-source');
          if (source) {
            source.setData({
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [location.lng, location.lat]
              }
            });
          }
        } else {
          // Create new source and layer
          mapInstance.addSource('circle-source', {
            type: 'geojson',
            data: {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [location.lng, location.lat]
              }
            }
          });

          // Only add layer if it doesn't exist
          if (!mapInstance.getLayer('circle-layer')) {
            mapInstance.addLayer({
              id: 'circle-layer',
              type: 'circle',
              source: 'circle-source',
              paint: {
                'circle-radius': 8,
                'circle-color': '#10b981',
                'circle-stroke-width': 2,
                'circle-stroke-color': '#ffffff',
                'circle-opacity': 0.6,
              }
            });
          }
        }
        circleRef.current = true;
      } catch (error) {
        console.warn('Error updating circle:', error);
      }
    };

    // If map is already loaded, update immediately
    if (mapInstance.loaded()) {
      updateCircleData();
    } else {
      // Wait for map to load
      mapInstance.once('load', () => {
        updateCircleData();
      });
    }
  };

  // Handle suggestion selection
  const handleSuggestionClick = async (placeId) => {
    try {
      // Get place details from Goong API
      const response = await fetch(
        `${GOONG_PLACE_DETAIL_URL}?api_key=${GOONG_REST_API_KEY}&place_id=${placeId}`
      );
      const data = await response.json();

      if (data.result) {
        const place = data.result;
        const location = {
          lat: place.geometry?.location?.lat || place.lat,
          lng: place.geometry?.location?.lng || place.lng,
        };
        const formattedAddress = place.formatted_address || place.name || place.address;

        // Extract address components
        const addressComponents = place.address_components || [];
        const { ward, district, province } = extractAddressComponents(addressComponents);

        setAddress(formattedAddress);
        setSelectedLocation(location);
        setShowSuggestions(false);

        if (onChange) {
          onChange(formattedAddress);
        }
        if (onLocationSelect) {
          onLocationSelect({
            address: formattedAddress,
            lat: location.lat,
            lng: location.lng,
            latitude: location.lat,
            longitude: location.lng,
            ward,
            district,
            province,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
    }
  };

  // Reverse geocode (convert lat/lng to address) using Goong API
  const reverseGeocode = async (location) => {
    setIsGeocoding(true);
    try {
      const response = await fetch(
        `${GOONG_REVERSE_GEOCODE_URL}?api_key=${GOONG_REST_API_KEY}&latlng=${location.lat},${location.lng}`
      );
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        const formattedAddress = result.formatted_address;

        // Extract address components
        const addressComponents = result.address_components || [];
        const { ward, district, province } = extractAddressComponents(addressComponents);

        setAddress(formattedAddress);
        setSelectedAddressInfo({
          address: formattedAddress,
          ward,
          district,
          province,
        });

        // Update popup if map is open
        if (map && popupRef.current) {
          updatePopupContent(popupRef.current, location, formattedAddress);
          popupRef.current.setLngLat([location.lng, location.lat]).addTo(map);
        }

        // Update circle
        if (map) {
          addCircle(map, location);
        }

        if (onChange) {
          onChange(formattedAddress);
        }
        if (onLocationSelect) {
          onLocationSelect({
            address: formattedAddress,
            lat: location.lat,
            lng: location.lng,
            latitude: location.lat,
            longitude: location.lng,
            ward,
            district,
            province,
          });
        }
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
    } finally {
      setIsGeocoding(false);
    }
  };

  // Handle map search input change
  const handleMapSearchChange = async (e) => {
    const query = e.target.value;
    setMapSearchQuery(query);

    if (query.length > 2) {
      try {
        const response = await fetch(
          `${GOONG_AUTOCOMPLETE_URL}?api_key=${GOONG_REST_API_KEY}&input=${encodeURIComponent(query)}&location=21.0285,105.8542&radius=50000&limit=8`
        );
        const data = await response.json();

        if (data.predictions && data.predictions.length > 0) {
          setMapSuggestions(data.predictions);
          setShowMapSuggestions(true);
        } else {
          setMapSuggestions([]);
          setShowMapSuggestions(false);
        }
      } catch (error) {
        console.error('Error fetching map search suggestions:', error);
        setMapSuggestions([]);
        setShowMapSuggestions(false);
      }
    } else {
      setMapSuggestions([]);
      setShowMapSuggestions(false);
    }
  };

  // Handle map search suggestion click
  const handleMapSuggestionClick = async (placeId) => {
    try {
      const response = await fetch(
        `${GOONG_PLACE_DETAIL_URL}?api_key=${GOONG_REST_API_KEY}&place_id=${placeId}`
      );
      const data = await response.json();

      if (data.result) {
        const place = data.result;
        const location = {
          lat: place.geometry?.location?.lat || place.lat,
          lng: place.geometry?.location?.lng || place.lng,
        };
        const formattedAddress = place.formatted_address || place.name || place.address;

        // Extract address components
        const addressComponents = place.address_components || [];
        const { ward, district, province } = extractAddressComponents(addressComponents);

        setMapSearchQuery(formattedAddress);
        setShowMapSuggestions(false);
        setSelectedLocation(location);
        setAddress(formattedAddress);
        setSelectedAddressInfo({
          address: formattedAddress,
          ward,
          district,
          province,
        });

        // Fly to location on map
        if (map) {
          map.flyTo({
            center: [location.lng, location.lat],
            zoom: 16,
            duration: 1000,
          });

          // Update or create marker
          if (markerRef.current) {
            markerRef.current.setLngLat([location.lng, location.lat]);

            // Update marker click handler
            const markerElement = markerRef.current.getElement();
            if (markerElement) {
              markerElement.onclick = () => {
                updatePopupContent(popupRef.current, location, formattedAddress);
                popupRef.current.setLngLat([location.lng, location.lat]).addTo(map);
              };
            }
          } else {
            const el = document.createElement('div');
            el.className = 'custom-marker';
            el.style.width = '32px';
            el.style.height = '32px';
            // Use inline SVG for marker instead of external image
            el.innerHTML = `
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#ef4444"/>
              </svg>
            `;
            el.style.cursor = 'pointer';

            const newMarker = new goongjs.Marker({
              element: el,
              anchor: 'bottom',
              draggable: true,
            })
              .setLngLat([location.lng, location.lat])
              .addTo(map);

            // Add click event to marker
            el.addEventListener('click', () => {
              updatePopupContent(popupRef.current, location, formattedAddress);
              popupRef.current.setLngLat([location.lng, location.lat]).addTo(map);
            });

            newMarker.on('dragend', () => {
              const position = newMarker.getLngLat();
              const newLocation = {
                lat: position.lat,
                lng: position.lng,
              };
              setSelectedLocation(newLocation);
              reverseGeocode(newLocation);
              // Update popup and circle
              if (popupRef.current) {
                updatePopupContent(popupRef.current, newLocation, address);
                popupRef.current.setLngLat([newLocation.lng, newLocation.lat]).addTo(map);
              }
              addCircle(map, newLocation);
            });

            markerRef.current = newMarker;
            setMarker(newMarker);
          }

          // Update circle and popup
          addCircle(map, location);
          if (popupRef.current) {
            updatePopupContent(popupRef.current, location, formattedAddress);
            popupRef.current.setLngLat([location.lng, location.lat]).addTo(map);
          }
        }

        if (onChange) {
          onChange(formattedAddress);
        }
        if (onLocationSelect) {
          onLocationSelect({
            address: formattedAddress,
            lat: location.lat,
            lng: location.lng,
            latitude: location.lat,
            longitude: location.lng,
            ward,
            district,
            province,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
    }
  };

  // Initialize Goong Map when shown
  useEffect(() => {
    if (!showMap || map) return; // Don't initialize if modal is closed or map already exists

    // Wait a bit for the container to render
    const timer = setTimeout(() => {
      const initMap = () => {
        if (!mapRef.current) {
          console.warn('Map container ref is not available');
          return;
        }

        // Check container dimensions
        const rect = mapRef.current.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
          console.warn('Map container has no dimensions:', rect);
          return;
        }

        // Check if Maptiles Key is configured
        if (!GOONG_API_KEY || GOONG_API_KEY === "YOUR_GOONG_API_KEY_HERE") {
          console.error('Goong Maptiles Key chưa được cấu hình! Vui lòng thêm REACT_APP_GOONG_API_KEY vào file .env hoặc cập nhật trong code.');
          alert('Goong Maptiles Key chưa được cấu hình! Vui lòng cấu hình API key để sử dụng bản đồ.');
          return;
        }

        try {
          console.log('Initializing Goong Map...');
          console.log('API Key (first 10 chars):', GOONG_API_KEY.substring(0, 10));
          console.log('Container element:', mapRef.current);
          console.log('Container dimensions:', rect);
          console.log('Goong JS:', typeof goongjs, goongjs);

          // Set access token globally for Goong GL JS
          if (goongjs && typeof goongjs !== 'undefined') {
            if (typeof goongjs.accessToken !== 'undefined') {
              goongjs.accessToken = GOONG_API_KEY;
              console.log('Access token set globally');
            } else {
              console.warn('goongjs.accessToken is not available');
            }
          } else {
            console.error('goongjs is not defined!');
            return;
          }

          const mapOptions = {
            container: mapRef.current,
            style: 'https://tiles.goong.io/assets/goong_map_web.json',
            center: selectedLocation ? [selectedLocation.lng, selectedLocation.lat] : [105.8542, 21.0285], // [lng, lat] for Goong
            zoom: selectedLocation ? 15 : 13,
          };

          // Add accessToken to options if not set globally
          if (!goongjs.accessToken) {
            mapOptions.accessToken = GOONG_API_KEY;
            console.log('Access token added to map options');
          }

          console.log('Creating map with options:', { ...mapOptions, accessToken: '***' });
          const mapInstance = new goongjs.Map(mapOptions);

          // Wait for map to load
          mapInstance.on('load', () => {
            console.log('✅ Goong Map loaded successfully');
          });

          mapInstance.on('error', (e) => {
            console.error('❌ Goong Map error:', e);
            console.error('Error details:', {
              error: e.error,
              message: e.error?.message,
              type: e.error?.type
            });
          });

          mapInstance.on('style.load', () => {
            console.log('Map style loaded');
          });

          setMap(mapInstance);

          // Add marker if location is selected
          if (selectedLocation) {
            const el = document.createElement('div');
            el.className = 'custom-marker';
            el.style.width = '32px';
            el.style.height = '32px';
            // Use inline SVG for marker instead of external image
            el.innerHTML = `
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#ef4444"/>
              </svg>
            `;
            el.style.cursor = 'pointer';

            const markerInstance = new goongjs.Marker({
              element: el,
              anchor: 'bottom',
            })
              .setLngLat([selectedLocation.lng, selectedLocation.lat])
              .addTo(mapInstance);

            markerRef.current = markerInstance;
            setMarker(markerInstance);
          }

          // Add click listener to map
          mapInstance.on('click', (event) => {
            const clickedLocation = {
              lat: event.lngLat.lat,
              lng: event.lngLat.lng,
            };
            setSelectedLocation(clickedLocation);
            reverseGeocode(clickedLocation);

            // Update or create marker
            if (markerRef.current) {
              markerRef.current.setLngLat([clickedLocation.lng, clickedLocation.lat]);

              // Update marker click handler
              const markerElement = markerRef.current.getElement();
              if (markerElement) {
                markerElement.onclick = () => {
                  updatePopupContent(popupRef.current, clickedLocation, address);
                  popupRef.current.setLngLat([clickedLocation.lng, clickedLocation.lat]).addTo(mapInstance);
                };
              }
            } else {
              const el = document.createElement('div');
              el.className = 'custom-marker';
              el.style.width = '32px';
              el.style.height = '32px';
              // Use inline SVG for marker instead of external image
              el.innerHTML = `
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#ef4444"/>
              </svg>
            `;
              el.style.cursor = 'pointer';

              const newMarker = new goongjs.Marker({
                element: el,
                anchor: 'bottom',
                draggable: true,
              })
                .setLngLat([clickedLocation.lng, clickedLocation.lat])
                .addTo(mapInstance);

              // Add click event to marker
              el.addEventListener('click', () => {
                updatePopupContent(popupRef.current, clickedLocation, address);
                popupRef.current.setLngLat([clickedLocation.lng, clickedLocation.lat]).addTo(mapInstance);
              });

              newMarker.on('dragend', () => {
                const position = newMarker.getLngLat();
                const newLocation = {
                  lat: position.lat,
                  lng: position.lng,
                };
                setSelectedLocation(newLocation);
                reverseGeocode(newLocation);
                // Update popup position
                if (popupRef.current) {
                  updatePopupContent(popupRef.current, newLocation, address);
                  popupRef.current.setLngLat([newLocation.lng, newLocation.lat]).addTo(mapInstance);
                }
              });

              markerRef.current = newMarker;
              setMarker(newMarker);
            }

            // Update circle position
            addCircle(mapInstance, clickedLocation);

            // Close map search suggestions when clicking on map
            setShowMapSuggestions(false);
          });

          // Make marker draggable if it exists
          if (markerRef.current) {
            markerRef.current.setDraggable(true);

            // Add click event to existing marker
            const markerElement = markerRef.current.getElement();
            if (markerElement) {
              markerElement.addEventListener('click', () => {
                const position = markerRef.current.getLngLat();
                const location = {
                  lat: position.lat,
                  lng: position.lng,
                };
                updatePopupContent(popupRef.current, location, address);
                popupRef.current.setLngLat([location.lng, location.lat]).addTo(mapInstance);
              });
            }

            markerRef.current.on('dragend', () => {
              const position = markerRef.current.getLngLat();
              const newLocation = {
                lat: position.lat,
                lng: position.lng,
              };
              setSelectedLocation(newLocation);
              reverseGeocode(newLocation);
              // Update popup and circle
              if (popupRef.current) {
                updatePopupContent(popupRef.current, newLocation, address);
                popupRef.current.setLngLat([newLocation.lng, newLocation.lat]).addTo(mapInstance);
              }
              addCircle(mapInstance, newLocation);
            });
          }
        } catch (error) {
          console.error('Error initializing Goong Map:', error);
          console.error('Error stack:', error.stack);
          alert('Không thể khởi tạo bản đồ. Vui lòng kiểm tra API key và kết nối mạng. Chi tiết: ' + error.message);
        }
      };

      // Initialize map after a short delay to ensure container is ready
      initMap();
    }, 100); // Small delay to ensure container is rendered

    return () => {
      clearTimeout(timer);
    };
  }, [showMap, selectedLocation]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup map when modal closes
  useEffect(() => {
    if (!showMap) {
      if (map) {
        try {
          // Remove circle layer and source safely
          if (map.getLayer && map.getLayer('circle-layer')) {
            try {
              map.removeLayer('circle-layer');
            } catch (e) {
              console.warn('Error removing circle layer:', e);
            }
          }
          if (map.getSource && map.getSource('circle-source')) {
            try {
              map.removeSource('circle-source');
            } catch (e) {
              console.warn('Error removing circle source:', e);
            }
          }
        } catch (error) {
          console.warn('Error during circle cleanup:', error);
        }

        // Remove popup
        if (popupRef.current) {
          try {
            popupRef.current.remove();
          } catch (e) {
            console.warn('Error removing popup:', e);
          }
        }

        try {
          map.remove();
        } catch (e) {
          console.warn('Error removing map:', e);
        }
        setMap(null);
      }
      if (marker) {
        try {
          marker.remove();
        } catch (e) {
          console.warn('Error removing marker:', e);
        }
        setMarker(null);
      }
      markerRef.current = null;
      popupRef.current = null;
      circleRef.current = null;
    }
  }, [showMap, map, marker]);

  // Update marker position when selectedLocation changes (after map is initialized)
  useEffect(() => {
    if (map && markerRef.current && selectedLocation) {
      markerRef.current.setLngLat([selectedLocation.lng, selectedLocation.lat]);
      map.flyTo({
        center: [selectedLocation.lng, selectedLocation.lat],
        zoom: 15,
      });

      // Update circle
      addCircle(map, selectedLocation);

      // Update popup if exists
      if (popupRef.current) {
        updatePopupContent(popupRef.current, selectedLocation, address);
        popupRef.current.setLngLat([selectedLocation.lng, selectedLocation.lat]).addTo(map);
      }
    }
  }, [selectedLocation, map, address, updatePopupContent]);

  // Handle confirm selection from map
  const handleConfirmLocation = () => {
    if (selectedLocation) {
      setShowMap(false);
      setMapSearchQuery('');
      setShowMapSuggestions(false);
      if (onLocationSelect && selectedLocation) {
        // Use selectedAddressInfo if available, otherwise use current address
        const finalAddress = selectedAddressInfo?.address || address;
        onLocationSelect({
          address: finalAddress,
          lat: selectedLocation.lat,
          lng: selectedLocation.lng,
          latitude: selectedLocation.lat,
          longitude: selectedLocation.lng,
          ward: selectedAddressInfo?.ward || '',
          district: selectedAddressInfo?.district || '',
          province: selectedAddressInfo?.province || '',
        });
      }
    }
  };

  // Close map suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        mapSuggestionsRef.current &&
        !mapSuggestionsRef.current.contains(event.target) &&
        mapSearchRef.current &&
        !mapSearchRef.current.contains(event.target)
      ) {
        setShowMapSuggestions(false);
      }
    };

    if (showMap) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showMap]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Sync value prop
  useEffect(() => {
    if (value !== undefined && value !== address) {
      setAddress(value);
    }
  }, [value, address]);

  return (
    <div className="relative w-full">
      <div className="relative">
        <Input
          ref={inputRef}
          value={address}
          onChange={handleAddressChange}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder={placeholder}
          className="pr-20"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowMap(true);
              setMapSearchQuery('');
              setMapSuggestions([]);
              setShowMapSuggestions(false);
            }}
            className="h-8 px-2"
            title="Chọn trên bản đồ"
          >
            <MapPin className="w-4 h-4 text-teal-600" />
          </Button>
        </div>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.place_id}
              type="button"
              onClick={() => handleSuggestionClick(suggestion.place_id)}
              className="w-full text-left px-4 py-2 hover:bg-teal-50 transition-colors flex items-start gap-2"
            >
              <MapPin className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-sm text-gray-900">{suggestion.structured_formatting?.main_text || suggestion.description}</div>
                <div className="text-xs text-gray-500">{suggestion.structured_formatting?.secondary_text || suggestion.description}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Map Modal */}
      {showMap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-3 border-b space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Chọn vị trí trên bản đồ</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowMap(false);
                    setMapSearchQuery('');
                    setShowMapSuggestions(false);
                  }}
                  className="h-8 w-8 p-0 rounded-2xl"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Search Box */}
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 rounded-2xl" />
                  <Input
                    ref={mapSearchRef}
                    value={mapSearchQuery}
                    onChange={handleMapSearchChange}
                    onFocus={() => {
                      if (mapSuggestions.length > 0) {
                        setShowMapSuggestions(true);
                      }
                    }}
                    placeholder="Tìm kiếm địa chỉ..."
                    className="pl-10 pr-4 rounded-2xl"
                  />
                </div>

                {/* Map Search Suggestions */}
                {showMapSuggestions && mapSuggestions.length > 0 && (
                  <div
                    ref={mapSuggestionsRef}
                    className="absolute rounded-2xl z-50 w-full mt-1 bg-white border border-gray-200 shadow-lg max-h-60 overflow-y-auto"
                  >
                    {mapSuggestions.map((suggestion) => (
                      <button
                        key={suggestion.place_id}
                        type="button"
                        onClick={() => handleMapSuggestionClick(suggestion.place_id)}
                        className="w-full text-left px-4 py-2 hover:bg-teal-50 transition-colors flex items-start gap-2"
                      >
                        <MapPin className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="font-medium text-sm text-gray-900">
                            {suggestion.structured_formatting?.main_text || suggestion.description}
                          </div>
                          <div className="text-xs text-gray-500">
                            {suggestion.structured_formatting?.secondary_text || suggestion.description}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Map Container */}
            <div className="flex-1 relative min-h-[400px]">
              <div ref={mapRef} className="w-full h-full min-h-[400px] rounded-2xl" />

              {/* Selected Location Card */}
              {selectedLocation && (
                <div className="absolute top-3 left-3 bg-white p-3 rounded-2xl shadow-lg max-w-xs border border-teal-200">
                  <div className="flex items-start justify-between mb-1">
                    <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-teal-600" />
                      Vị trí đã chọn
                    </div>
                    {isGeocoding && (
                      <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                    )}
                  </div>

                  {isGeocoding ? (
                    <div className="text-xs text-gray-500">Đang lấy địa chỉ...</div>
                  ) : (
                    <>
                      <div className="text-xs text-gray-700 mb-1 font-medium">
                        {selectedAddressInfo?.address || address || 'Chưa có địa chỉ'}
                      </div>

                      {(selectedAddressInfo?.ward || selectedAddressInfo?.district || selectedAddressInfo?.province) && (
                        <div className="flex flex-wrap gap-1 mb-1">
                          {selectedAddressInfo.ward && (
                            <span className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded border border-blue-200">
                              {selectedAddressInfo.ward}
                            </span>
                          )}
                          {selectedAddressInfo.district && (
                            <span className="px-2 py-0.5 text-xs bg-green-50 text-green-700 rounded border border-green-200">
                              {selectedAddressInfo.district}
                            </span>
                          )}
                          {selectedAddressInfo.province && (
                            <span className="px-2 py-0.5 text-xs bg-purple-50 text-purple-700 rounded border border-purple-200">
                              {selectedAddressInfo.province}
                            </span>
                          )}
                        </div>
                      )}

                    </>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="py-1 px-3 border-t flex items-center justify-between bg-gray-50">
              <div className="text-xs text-gray-600">
                <p className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-teal-600" />
                  Nhấp vào bản đồ, tìm kiếm địa chỉ hoặc kéo marker để chọn vị trí
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowMap(false);
                    setMapSearchQuery('');
                    setShowMapSuggestions(false);
                  }}
                  className="rounded-2xl py-0.5"
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleConfirmLocation}
                  disabled={!selectedLocation || isGeocoding}
                  className="bg-teal-600 rounded-2xl hover:bg-teal-700 py-0.5"
                >
                  {isGeocoding ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    'Xác nhận'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressPicker;
