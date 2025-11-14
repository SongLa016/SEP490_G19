import { useState, useEffect, useRef } from 'react';
import { MapPin, X } from 'lucide-react';
import { Input, Button } from './ui';

const AddressPicker = ({ value, onChange, placeholder = "Nhập địa chỉ hoặc chọn trên bản đồ", onLocationSelect }) => {
  const [address, setAddress] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const autocompleteService = useRef(null);
  const placesService = useRef(null);
  const geocoder = useRef(null);
  const mapRef = useRef(null);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Google Maps API Key (from existing MapSearch component)
  const GOOGLE_MAPS_API_KEY = "AIzaSyCacoGIE6Qci-WIdKjjz2LF6hNDAnBwZWw";

  // Load Google Maps script
  useEffect(() => {
    if (window.google && window.google.maps) {
      initServices();
    } else {
      const existing = document.getElementById('gmaps-script');
      if (!existing) {
        const script = document.createElement('script');
        script.id = 'gmaps-script';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&v=weekly&language=vi&region=VN`;
        script.async = true;
        script.defer = true;
        script.onload = () => initServices();
        document.head.appendChild(script);
      } else {
        existing.addEventListener('load', () => initServices(), { once: true });
        if (existing.onload) initServices();
      }
    }
  }, []);

  const initServices = () => {
    if (window.google && window.google.maps) {
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
      placesService.current = new window.google.maps.places.PlacesService(document.createElement('div'));
      geocoder.current = new window.google.maps.Geocoder();
    }
  };

  // Initialize map when shown
  useEffect(() => {
    if (!showMap || map) return; // Don't initialize if modal is closed or map already exists

    const initMap = () => {
      if (!mapRef.current || !window.google?.maps) return;

      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center: selectedLocation || { lat: 21.0285, lng: 105.8542 }, // Hà Nội
        zoom: selectedLocation ? 15 : 13,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true,
      });

      setMap(mapInstance);
      let currentMarker = null;

      // Add marker if location is selected
      if (selectedLocation) {
        currentMarker = new window.google.maps.Marker({
          position: selectedLocation,
          map: mapInstance,
          draggable: true,
        });

        currentMarker.addListener('dragend', () => {
          const position = currentMarker.getPosition();
          const newLocation = {
            lat: position.lat(),
            lng: position.lng(),
          };
          setSelectedLocation(newLocation);
          reverseGeocode(newLocation);
        });

        setMarker(currentMarker);
      }

      // Add click listener to map
      mapInstance.addListener('click', (event) => {
        const clickedLocation = {
          lat: event.latLng.lat(),
          lng: event.latLng.lng(),
        };
        setSelectedLocation(clickedLocation);
        reverseGeocode(clickedLocation);

        if (currentMarker) {
          currentMarker.setPosition(clickedLocation);
        } else {
          const newMarker = new window.google.maps.Marker({
            position: clickedLocation,
            map: mapInstance,
            draggable: true,
          });

          newMarker.addListener('dragend', () => {
            const position = newMarker.getPosition();
            const newLocation = {
              lat: position.lat(),
              lng: position.lng(),
            };
            setSelectedLocation(newLocation);
            reverseGeocode(newLocation);
          });

          setMarker(newMarker);
          currentMarker = newMarker;
        }
      });
    };

    // Wait for Google Maps to be fully loaded
    if (window.google?.maps?.Map) {
      setTimeout(initMap, 100);
    } else {
      // If Google Maps isn't loaded yet, wait a bit
      const checkInterval = setInterval(() => {
        if (window.google?.maps?.Map) {
          clearInterval(checkInterval);
          setTimeout(initMap, 100);
        }
      }, 100);
      return () => clearInterval(checkInterval);
    }
  }, [showMap]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup map when modal closes
  useEffect(() => {
    if (!showMap) {
      setMap(null);
      setMarker(null);
    }
  }, [showMap]);

  // Update marker position when selectedLocation changes (after map is initialized)
  useEffect(() => {
    if (map && marker && selectedLocation) {
      marker.setPosition(selectedLocation);
      map.setCenter(selectedLocation);
    }
  }, [selectedLocation, map, marker]);

  // Handle address input change
  const handleAddressChange = (e) => {
    const query = e.target.value;
    setAddress(query);

    if (onChange) {
      onChange(query);
    }

    if (query.length > 2 && autocompleteService.current) {
      autocompleteService.current.getPlacePredictions(
        {
          input: query,
          componentRestrictions: { country: 'vn' },
        },
        (predictions, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSuggestions(predictions.slice(0, 5));
            setShowSuggestions(true);
          } else {
            setSuggestions([]);
            setShowSuggestions(false);
          }
        }
      );
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle suggestion selection
  const handleSuggestionClick = (placeId) => {
    if (placesService.current) {
      placesService.current.getDetails(
        { placeId, fields: ['formatted_address', 'geometry', 'name'] },
        (place, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
            const location = {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
            };
            setAddress(place.formatted_address || place.name);
            setSelectedLocation(location);
            setShowSuggestions(false);
            if (onChange) {
              onChange(place.formatted_address || place.name);
            }
            if (onLocationSelect) {
              onLocationSelect({
                address: place.formatted_address || place.name,
                lat: location.lat,
                lng: location.lng,
              });
            }
          }
        }
      );
    }
  };

  // Reverse geocode (convert lat/lng to address)
  const reverseGeocode = (location) => {
    if (geocoder.current) {
      geocoder.current.geocode({ location }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const formattedAddress = results[0].formatted_address;
          setAddress(formattedAddress);
          if (onChange) {
            onChange(formattedAddress);
          }
          if (onLocationSelect) {
            onLocationSelect({
              address: formattedAddress,
              lat: location.lat,
              lng: location.lng,
            });
          }
        }
      });
    }
  };

  // Handle confirm selection from map
  const handleConfirmLocation = () => {
    if (selectedLocation) {
      setShowMap(false);
      if (onLocationSelect && selectedLocation) {
        onLocationSelect({
          address: address,
          lat: selectedLocation.lat,
          lng: selectedLocation.lng,
        });
      }
    }
  };

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
  }, [value]);

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
            onClick={() => setShowMap(true)}
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
                <div className="font-medium text-sm text-gray-900">{suggestion.structured_formatting.main_text}</div>
                <div className="text-xs text-gray-500">{suggestion.structured_formatting.secondary_text}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Map Modal */}
      {showMap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Chọn vị trí trên bản đồ</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMap(false)}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Map Container */}
            <div className="flex-1 relative">
              <div ref={mapRef} className="w-full h-full" />
              {selectedLocation && (
                <div className="absolute top-4 left-4 bg-white p-3 rounded-lg shadow-lg max-w-xs">
                  <div className="text-sm font-medium text-gray-900 mb-1">Vị trí đã chọn:</div>
                  <div className="text-xs text-gray-600 mb-2">{address || 'Đang lấy địa chỉ...'}</div>
                  <div className="text-xs text-gray-500">
                    Lat: {selectedLocation.lat.toFixed(6)}, Lng: {selectedLocation.lng.toFixed(6)}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <p>Nhấp vào bản đồ hoặc kéo marker để chọn vị trí</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowMap(false)}>
                  Hủy
                </Button>
                <Button onClick={handleConfirmLocation} disabled={!selectedLocation}>
                  Xác nhận
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

