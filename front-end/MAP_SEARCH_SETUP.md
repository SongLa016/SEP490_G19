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
REACT_APP_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

### 3. Features

- **Interactive Map**: Click on field markers to view details
- **Search by Location**: Type to search for fields by name or address
- **Current Location**: Get your current location automatically
- **Field Markers**: Visual representation of all available fields
- **Responsive Design**: Works on desktop and mobile

### 4. Usage

1. Click "Tìm bằng bản đồ" button in the search header
2. Use the search bar to find specific fields
3. Click on map markers to select fields
4. Use "Vị trí hiện tại" to center map on your location
5. Click "Chọn vị trí này" to confirm selection

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
