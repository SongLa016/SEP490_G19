# Map Search Integration

## Setup Instructions

### 1. Google Maps API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Enable the following APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
4. Create credentials (API Key)
5. Restrict the API key to your domain for security

### 2. Environment Variables

Create a `.env` file in the root directory:

```env
REACT_APP_GOOGLE_MAPS_API_KEY=AIzaSyA0Mdo-7p3D4zwP8QSCn55Rj8rTy-PCJ8o
```

**Note**: The API key is already configured in the MapSearch component for immediate use.

### 3. Features

- **Interactive Map**: Click on field markers to view details
- **Google Places Autocomplete**: Real-time search suggestions from Google Places API
- **Current Location**: Get your current location automatically
- **Radius Search**: Filter fields within customizable radius (1-20 km)
- **Field Markers**: Visual representation of all available fields
- **Nearby Fields List**: Shows fields within selected radius with distances
- **Smart Filtering**: Automatically applies location filters to main search
- **Responsive Design**: Works on desktop and mobile

### 4. Usage

1. Click "Tìm bằng bản đồ" button in the search header
2. Use the search bar to find specific fields or locations (Google Places autocomplete)
3. Adjust search radius using the dropdown (1-20 km)
4. Click on map markers to select fields
5. Use "Vị trí hiện tại" to center map on your location
6. View nearby fields list with distances
7. Click "Chọn vị trí này" to confirm selection and apply filters

### 5. Customization

You can customize the map by modifying:
- Map center coordinates
- Default zoom level
- Marker icons and colors
- Map styles
- Search radius

### 6. Security Notes

- Always restrict your API key to specific domains
- Monitor API usage in Google Cloud Console
- Consider implementing rate limiting for production use
