
export const getCurrentLocation = () => {
  return new Promise((resolve) => {
    console.log('[GEOLOCATION] Starting location request...');

    const fetchIPLocation = async () => {
      console.log('[GEOLOCATION] Attempting IP-based geolocation fallback...');
      
      try {
        console.log('[GEOLOCATION] Fetching from freeipapi.com...');
        const response = await fetch('https://freeipapi.com/api/json', { timeout: 5000 });
        if (response.ok) {
          const data = await response.json();
          if (data && data.latitude && data.longitude) {
            console.log('[GEOLOCATION] SUCCESS (freeipapi) - Lat:', data.latitude, 'Lon:', data.longitude);
            resolve({
              latitude: Number(data.latitude),
              longitude: Number(data.longitude),
              accuracy: 5000, // Approximate accuracy for IP
              city: data.cityName || '',
              region: data.regionName || '',
              country: data.countryName || '',
              isIPBased: true
            });
            return;
          }
        }
      } catch (err) {
        console.warn('[GEOLOCATION] freeipapi.com failed:', err.message);
      }

      try {
        console.log('[GEOLOCATION] Fetching from ipapi.co...');
        const response = await fetch('https://ipapi.co/json/', { timeout: 5000 });
        if (response.ok) {
          const data = await response.json();
          if (data && data.latitude && data.longitude) {
            console.log('[GEOLOCATION] SUCCESS (ipapi.co) - Lat:', data.latitude, 'Lon:', data.longitude);
            resolve({
              latitude: Number(data.latitude),
              longitude: Number(data.longitude),
              accuracy: 10000,
              city: data.city || '',
              region: data.region || '',
              country: data.country_name || '',
              isIPBased: true
            });
            return;
          }
        }
      } catch (err) {
        console.warn('[GEOLOCATION] ipapi.co failed:', err.message);
      }

      console.warn('[GEOLOCATION] All geolocation sources failed. Using default Lahorian coordinates.');
      resolve({
        latitude: 31.5204,
        longitude: 74.3587,
        accuracy: 25000,
        city: 'Lahore',
        region: 'Punjab',
        country: 'Pakistan',
        isIPBased: true,
        isDefaultFallback: true
      });
    };

    if (!navigator.geolocation) {
      console.warn('[GEOLOCATION] Geolocation API not supported by browser. Falling back.');
      fetchIPLocation();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        console.log('[GEOLOCATION] SUCCESS (Browser) - Lat:', latitude.toFixed(4), 'Lon:', longitude.toFixed(4));
        resolve({
          latitude,
          longitude,
          accuracy,
          isIPBased: false
        });
      },
      (error) => {
        console.warn('[GEOLOCATION] Browser Geolocation failed (code: ' + error.code + '). Falling back.');
        fetchIPLocation();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000, // Increased timeout to 10 seconds to allow WiFi/BSSID scanning on desktops
        maximumAge: 300000, // Use cached location up to 5 minutes old to make resolving instant if already queried
      }
    );
  });
};
