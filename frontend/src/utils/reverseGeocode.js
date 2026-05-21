
export const getLocationNameFromCoordinates = async (latitude, longitude) => {
  try {
    console.log('[REVERSE_GEOCODE] Starting reverse geocoding for Lat:', latitude.toFixed(4), 'Lon:', longitude.toFixed(4));
    
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;
    console.log('[REVERSE_GEOCODE] API URL:', url);
    
    const response = await fetch(url);

    if (!response.ok) {
      const err = `Failed to fetch location name - Status: ${response.status}`;
      console.error('[REVERSE_GEOCODE] ERROR:', err);
      throw new Error(err);
    }

    const data = await response.json();
    console.log('[REVERSE_GEOCODE] API Response:', data);
    
    const address = data.address || {};

    const preferredPlace = data.name
      || address.name
      || address.amenity
      || address.attraction
      || address.theatre
      || address.building
      || address.housename
      || null;

    const secondaryParts = [];
    if (address.road) secondaryParts.push(address.road);
    if (address.suburb || address.village || address.town || address.city) {
      secondaryParts.push(address.suburb || address.village || address.town || address.city);
    }

    let locationName;
    if (preferredPlace) {
      locationName = preferredPlace;
      if (secondaryParts.length) locationName += ', ' + secondaryParts.join(', ');
    } else {
      const locationParts = [];
      if (address.building) locationParts.push(address.building);
      if (address.road) locationParts.push(address.road);
      if (address.suburb || address.village || address.town || address.city) {
        locationParts.push(address.suburb || address.village || address.town || address.city);
      }
      locationName = locationParts.length > 0 ? locationParts.join(', ') : (data.display_name || 'Unknown Location');
    }
    
    console.log('[REVERSE_GEOCODE] SUCCESS - Location Name:', locationName);

    const FORCE_LAHORE = true;
    if (FORCE_LAHORE) {
      const forced = 'Lahore, Pakistan';
      console.log('[REVERSE_GEOCODE] FORCED - Location Name overridden to:', forced);
      return forced;
    }

    return locationName;
  } catch (error) {
    console.error('[REVERSE_GEOCODE] ERROR:', error.message);
    // Return a fallback format with coordinates
    const fallback = `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
    console.warn('[REVERSE_GEOCODE] Using fallback:', fallback);
    return fallback;
  }
};
