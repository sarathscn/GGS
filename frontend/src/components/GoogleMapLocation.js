import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, ExternalLink, Search, Crosshair, Loader2, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { toast } from 'sonner';
import { parseReverseGeocode, getKeralaCoordinates } from '../lib/keralaLocations';

// Global cache for Google Maps script loader
let googleMapsScriptPromise = null;

function loadGoogleMapsScript(apiKey) {
  if (typeof window !== 'undefined' && window.google && window.google.maps) {
    return Promise.resolve(window.google.maps);
  }
  if (!googleMapsScriptPromise) {
    googleMapsScriptPromise = new Promise((resolve, reject) => {
      if (!apiKey) {
        reject(new Error('Google Maps API key not provided'));
        return;
      }
      const existingScript = document.getElementById('google-maps-script');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(window.google.maps));
        existingScript.addEventListener('error', (e) => reject(e));
        return;
      }
      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.crossOrigin = 'anonymous';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places,geometry`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.google && window.google.maps) {
          resolve(window.google.maps);
        } else {
          reject(new Error('Google Maps SDK loaded but window.google.maps is undefined'));
        }
      };
      script.onerror = (err) => reject(err);
      document.head.appendChild(script);
    });
  }
  return googleMapsScriptPromise;
}

// Global cache for Leaflet (fallback when Google Maps API key is not configured)
let leafletScriptPromise = null;

function loadLeaflet() {
  if (typeof window !== 'undefined' && window.L) {
    return Promise.resolve(window.L);
  }
  if (!leafletScriptPromise) {
    leafletScriptPromise = new Promise((resolve, reject) => {
      try {
        if (!document.getElementById('leaflet-css')) {
          const link = document.createElement('link');
          link.id = 'leaflet-css';
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }
        const script = document.createElement('script');
        script.id = 'leaflet-script';
        script.crossOrigin = 'anonymous';
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.async = true;
        script.onload = () => {
          if (window.L) {
            resolve(window.L);
          } else {
            reject(new Error('Leaflet loaded but window.L is undefined'));
          }
        };
        script.onerror = (err) => reject(err);
        document.head.appendChild(script);
      } catch (e) {
        reject(e);
      }
    });
  }
  return leafletScriptPromise;
}

export default function GoogleMapLocation({
  latitude,
  longitude,
  locationName = '',
  addressDetails = '',
  districtName = '',
  talukName = '',
  areaName = '',
  interactive = false, // true for Post/Edit Ad picker, false for Listing Detail read-only
  onChange, // callback ({ latitude, longitude, address, district, taluk, area, formattedAddress, isKerala })
  height = 'h-64 sm:h-72',
  className = ''
}) {
  const mapContainerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Map instance references
  const googleMapRef = useRef(null);
  const googleMarkerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const leafletMarkerRef = useRef(null);
  const mapTypeRef = useRef('none');

  // Request ID ref to prevent asynchronous race conditions
  const requestIdRef = useRef(0);

  const [loading, setLoading] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [resolvedDisplay, setResolvedDisplay] = useState(locationName || '');
  const [isOutsideKerala, setIsOutsideKerala] = useState(false);
  const [coords, setCoords] = useState({
    lat: Number.isFinite(Number(latitude)) ? Number(latitude) : 9.9312,
    lng: Number.isFinite(Number(longitude)) ? Number(longitude) : 76.2673
  });

  const apiKey =
    process.env.REACT_APP_GOOGLE_MAPS_API_KEY ||
    process.env.VITE_GOOGLE_MAPS_API_KEY ||
    process.env.REACT_APP_GOOGLE_MAPS_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    '';

  // Reverse Geocoding Handler using Google Geocoder or OSM Nominatim with strict request-ID cancellation
  const performReverseGeocode = useCallback(
    async (lat, lng, targetReqId) => {
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

      try {
        // 1. Try Google Maps Geocoder if Google Maps SDK is active
        if (window.google && window.google.maps && window.google.maps.Geocoder) {
          const geocoder = new window.google.maps.Geocoder();
          const response = await new Promise((resolve) => {
            geocoder.geocode({ location: { lat, lng } }, (results, status) => {
              if (status === 'OK' && results && results[0]) {
                resolve(results[0]);
              } else {
                resolve(null);
              }
            });
          });

          // Check for stale asynchronous request
          if (targetReqId !== undefined && targetReqId !== requestIdRef.current) {
            return null;
          }

          if (response) {
            const parsed = parseReverseGeocode(response);
            const formatted = parsed.address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            setResolvedDisplay(formatted);
            setIsOutsideKerala(!parsed.isKerala);

            if (onChange) {
              onChange({
                latitude: Number(lat.toFixed(6)),
                longitude: Number(lng.toFixed(6)),
                address: parsed.address,
                district: parsed.isKerala ? parsed.district : '',
                taluk: parsed.isKerala ? parsed.taluk : '',
                area: parsed.isKerala ? parsed.area : '',
                formattedAddress: formatted,
                isKerala: parsed.isKerala
              });
            }
            return parsed;
          }
        }

        // 2. OpenStreetMap Nominatim reverse geocode (fallback)
        const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`;
        const res = await fetch(nominatimUrl, {
          headers: { 'Accept-Language': 'en' }
        });

        // Check for stale asynchronous request
        if (targetReqId !== undefined && targetReqId !== requestIdRef.current) {
          return null;
        }

        if (res.ok) {
          const data = await res.json();
          const parsed = parseReverseGeocode(data);
          const formatted = parsed.address || data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
          setResolvedDisplay(formatted);
          setIsOutsideKerala(!parsed.isKerala);

          if (onChange) {
            onChange({
              latitude: Number(lat.toFixed(6)),
              longitude: Number(lng.toFixed(6)),
              address: parsed.address,
              district: parsed.isKerala ? parsed.district : '',
              taluk: parsed.isKerala ? parsed.taluk : '',
              area: parsed.isKerala ? parsed.area : '',
              formattedAddress: formatted,
              isKerala: parsed.isKerala
            });
          }
          return parsed;
        }
      } catch (err) {
        console.warn('Reverse geocode error:', err.message);
      }

      if (targetReqId !== undefined && targetReqId !== requestIdRef.current) {
        return null;
      }

      // If reverse geocoding fails, clear district state defensively
      if (onChange) {
        onChange({
          latitude: Number(lat.toFixed(6)),
          longitude: Number(lng.toFixed(6)),
          district: '',
          taluk: '',
          area: '',
          isKerala: false
        });
      }
      return null;
    },
    [onChange]
  );

  // Sync coords, marker, and zoom from parent props when selection changes
  useEffect(() => {
    if (
      latitude !== undefined &&
      longitude !== undefined &&
      latitude !== null &&
      longitude !== null &&
      Number.isFinite(Number(latitude)) &&
      Number.isFinite(Number(longitude))
    ) {
      const newLat = Number(latitude);
      const newLng = Number(longitude);
      setCoords({ lat: newLat, lng: newLng });

      let zoom = 11;
      if (areaName) zoom = 14;
      else if (talukName) zoom = 13;
      else if (districtName) zoom = 11;
      else zoom = 12;

      if (googleMapRef.current && googleMarkerRef.current) {
        try {
          googleMapRef.current.setCenter({ lat: newLat, lng: newLng });
          googleMapRef.current.setZoom(zoom);
          googleMarkerRef.current.setPosition({ lat: newLat, lng: newLng });
        } catch (e) {}
      }

      if (leafletMapRef.current && leafletMarkerRef.current) {
        try {
          leafletMapRef.current.setView([newLat, newLng], zoom);
          leafletMarkerRef.current.setLatLng([newLat, newLng]);
        } catch (e) {}
      }
    }
  }, [latitude, longitude, districtName, talukName, areaName]);

  // Sync locationName from parent props
  useEffect(() => {
    if (locationName) {
      setResolvedDisplay(locationName);
    }
  }, [locationName]);

  // Initialize Map safely (Google Maps or Leaflet Fallback)
  useEffect(() => {
    let isMounted = true;

    const cleanupCurrentMap = () => {
      if (leafletMapRef.current) {
        try {
          leafletMapRef.current.remove();
        } catch (e) {}
        leafletMapRef.current = null;
      }
      if (googleMapRef.current) {
        googleMapRef.current = null;
        googleMarkerRef.current = null;
      }
      if (mapContainerRef.current) {
        mapContainerRef.current._leaflet_id = null;
        mapContainerRef.current.innerHTML = '';
      }
    };

    const initMap = async () => {
      if (!mapContainerRef.current) return;
      cleanupCurrentMap();
      setLoading(true);

      const centerPos = {
        lat: Number.isFinite(Number(latitude)) ? Number(latitude) : 9.9312,
        lng: Number.isFinite(Number(longitude)) ? Number(longitude) : 76.2673
      };
      
      let initialZoom = 11;
      if (areaName) initialZoom = 14;
      else if (talukName) initialZoom = 13;
      else if (districtName) initialZoom = 11;
      else initialZoom = 10;

      // 1. Try Google Maps if API key is provided
      if (apiKey) {
        try {
          const maps = await loadGoogleMapsScript(apiKey);
          if (!isMounted || !mapContainerRef.current) return;

          mapTypeRef.current = 'google';

          const map = new maps.Map(mapContainerRef.current, {
            center: centerPos,
            zoom: initialZoom,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
            zoomControl: true,
            gestureHandling: interactive ? 'auto' : 'cooperative',
            styles: [
              {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
              }
            ]
          });
          googleMapRef.current = map;

          const marker = new maps.Marker({
            position: centerPos,
            map: map,
            draggable: interactive,
            title: locationName || 'Selected Location',
            animation: maps.Animation.DROP
          });
          googleMarkerRef.current = marker;

          if (interactive) {
            // Click on map
            map.addListener('click', (e) => {
              const lat = e.latLng.lat();
              const lng = e.latLng.lng();
              marker.setPosition({ lat, lng });
              setCoords({ lat, lng });
              const currentReqId = ++requestIdRef.current;
              performReverseGeocode(lat, lng, currentReqId);
            });

            // Drag marker
            marker.addListener('dragend', () => {
              const pos = marker.getPosition();
              const lat = pos.lat();
              const lng = pos.lng();
              setCoords({ lat, lng });
              const currentReqId = ++requestIdRef.current;
              performReverseGeocode(lat, lng, currentReqId);
            });

            // Google Places Autocomplete
            if (searchInputRef.current && maps.places) {
              const autocomplete = new maps.places.Autocomplete(searchInputRef.current, {
                componentRestrictions: { country: 'in' },
                fields: ['geometry', 'formatted_address', 'address_components', 'name']
              });
              autocomplete.bindTo('bounds', map);

              autocomplete.addListener('place_changed', () => {
                const place = autocomplete.getPlace();
                if (!place.geometry || !place.geometry.location) return;

                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();

                map.setCenter({ lat, lng });
                map.setZoom(15);
                marker.setPosition({ lat, lng });
                setCoords({ lat, lng });

                const parsed = parseReverseGeocode(place);
                const formatted = place.formatted_address || place.name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
                setResolvedDisplay(formatted);
                setIsOutsideKerala(!parsed.isKerala);

                if (onChange) {
                  onChange({
                    latitude: Number(lat.toFixed(6)),
                    longitude: Number(lng.toFixed(6)),
                    address: parsed.address || formatted,
                    district: parsed.isKerala ? parsed.district : '',
                    taluk: parsed.isKerala ? parsed.taluk : '',
                    area: parsed.isKerala ? parsed.area : '',
                    formattedAddress: formatted,
                    isKerala: parsed.isKerala
                  });
                }
              });
            }
          }

          setLoading(false);
          return;
        } catch (err) {
          console.warn('Google Maps failed, using interactive fallback:', err.message);
        }
      }

      // 2. Leaflet + OpenStreetMap Fallback
      try {
        const L = await loadLeaflet();
        if (!isMounted || !mapContainerRef.current) return;

        cleanupCurrentMap();

        mapTypeRef.current = 'leaflet';

        const map = L.map(mapContainerRef.current, {
          center: [centerPos.lat, centerPos.lng],
          zoom: initialZoom,
          zoomControl: true,
          attributionControl: false,
          dragging: interactive,
          scrollWheelZoom: interactive ? 'center' : false
        });
        leafletMapRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19
        }).addTo(map);

        const customIcon = L.divIcon({
          className: 'custom-map-pin',
          html: `<div style="transform: translate(-50%, -100%); display: flex; flex-direction: column; align-items: center;">
            <div style="background: #7c3aed; color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4); border: 2px solid white;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
            <div style="width: 4px; height: 6px; background: #7c3aed; margin-top: -2px;"></div>
          </div>`,
          iconSize: [34, 40],
          iconAnchor: [17, 40]
        });

        const marker = L.marker([centerPos.lat, centerPos.lng], {
          draggable: interactive,
          icon: customIcon
        }).addTo(map);
        leafletMarkerRef.current = marker;

        if (interactive) {
          map.on('click', (e) => {
            const { lat, lng } = e.latlng;
            marker.setLatLng([lat, lng]);
            setCoords({ lat, lng });
            const currentReqId = ++requestIdRef.current;
            performReverseGeocode(lat, lng, currentReqId);
          });

          marker.on('dragend', () => {
            const { lat, lng } = marker.getLatLng();
            setCoords({ lat, lng });
            const currentReqId = ++requestIdRef.current;
            performReverseGeocode(lat, lng, currentReqId);
          });
        }

        setLoading(false);
      } catch (err) {
        console.error('Leaflet initialization error:', err);
        setLoading(false);
      }
    };

    initMap();

    return () => {
      isMounted = false;
      cleanupCurrentMap();
    };
  }, [apiKey, interactive, performReverseGeocode]);

  // "Locate Me" Workflow
  const handleLocateMe = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }

    if (isLocating) return;
    setIsLocating(true);

    const currentReqId = ++requestIdRef.current;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        if (currentReqId !== requestIdRef.current) return;

        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        setCoords({ lat, lng });

        if (googleMapRef.current && googleMarkerRef.current) {
          try {
            googleMapRef.current.setCenter({ lat, lng });
            googleMapRef.current.setZoom(15);
            googleMarkerRef.current.setPosition({ lat, lng });
          } catch (err) {}
        }

        if (leafletMapRef.current && leafletMarkerRef.current) {
          try {
            leafletMapRef.current.setView([lat, lng], 15);
            leafletMarkerRef.current.setLatLng([lat, lng]);
          } catch (err) {}
        }

        const result = await performReverseGeocode(lat, lng, currentReqId);

        setIsLocating(false);

        if (result) {
          if (!result.isKerala) {
            setIsOutsideKerala(true);
            toast.warning(`Your detected location is outside Kerala (${result.country || 'International'}). Please search or select a location within Kerala.`);
          } else {
            setIsOutsideKerala(false);
            toast.success(`Location detected: ${result.district || 'Kerala'}${result.taluk ? ', ' + result.taluk : ''}`);
          }
        }
      },
      (err) => {
        setIsLocating(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            toast.error('Location permission was denied. Please allow location access and try again.');
            break;
          case err.POSITION_UNAVAILABLE:
            toast.error('Location information is unavailable. Please search for your location manually.');
            break;
          case err.TIMEOUT:
            toast.error('Location request timed out. Please try again or search manually.');
            break;
          default:
            toast.error('Unable to determine your location. Please search for your location manually.');
            break;
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Search Location Handler (NO form submission)
  const handleSearchSubmit = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    const currentReqId = ++requestIdRef.current;

    try {
      // 1. Google Geocoder
      if (window.google && window.google.maps && window.google.maps.Geocoder) {
        const geocoder = new window.google.maps.Geocoder();
        const fullQuery = searchQuery.toLowerCase().includes('kerala')
          ? searchQuery
          : `${searchQuery}, Kerala, India`;

        geocoder.geocode(
          {
            address: fullQuery,
            componentRestrictions: { country: 'in' }
          },
          (results, status) => {
            if (currentReqId !== requestIdRef.current) return;
            setIsSearching(false);

            if (status === 'OK' && results && results[0]) {
              const place = results[0];
              const lat = place.geometry.location.lat();
              const lng = place.geometry.location.lng();

              setCoords({ lat, lng });

              if (googleMapRef.current && googleMarkerRef.current) {
                try {
                  googleMapRef.current.setCenter({ lat, lng });
                  googleMapRef.current.setZoom(15);
                  googleMarkerRef.current.setPosition({ lat, lng });
                } catch (err) {}
              }

              const parsed = parseReverseGeocode(place);
              const formatted = place.formatted_address || searchQuery;
              setResolvedDisplay(formatted);
              setIsOutsideKerala(!parsed.isKerala);

              if (onChange) {
                onChange({
                  latitude: Number(lat.toFixed(6)),
                  longitude: Number(lng.toFixed(6)),
                  address: parsed.address || formatted,
                  district: parsed.isKerala ? parsed.district : '',
                  taluk: parsed.isKerala ? parsed.taluk : '',
                  area: parsed.isKerala ? parsed.area : '',
                  formattedAddress: formatted,
                  isKerala: parsed.isKerala
                });
              }

              if (!parsed.isKerala) {
                toast.warning('Selected location is outside Kerala. Please select a location within Kerala.');
              } else {
                toast.success(`Found: ${parsed.district ? parsed.district + ', ' : ''}Kerala`);
              }
            } else {
              toast.error('Location not found. Please try searching another city or landmark in Kerala.');
            }
          }
        );
        return;
      }

      // 2. OpenStreetMap Nominatim Geocoder Search
      const searchUrl = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
        searchQuery + ', Kerala, India'
      )}&limit=1&addressdetails=1`;

      const res = await fetch(searchUrl, {
        headers: { 'Accept-Language': 'en' }
      });

      if (currentReqId !== requestIdRef.current) return;
      setIsSearching(false);

      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const item = data[0];
          const lat = parseFloat(item.lat);
          const lng = parseFloat(item.lon);

          setCoords({ lat, lng });

          if (leafletMapRef.current && leafletMarkerRef.current) {
            try {
              leafletMapRef.current.setView([lat, lng], 15);
              leafletMarkerRef.current.setLatLng([lat, lng]);
            } catch (err) {}
          }

          const parsed = parseReverseGeocode(item);
          const formatted = item.display_name || searchQuery;
          setResolvedDisplay(formatted);
          setIsOutsideKerala(!parsed.isKerala);

          if (onChange) {
            onChange({
              latitude: Number(lat.toFixed(6)),
              longitude: Number(lng.toFixed(6)),
              address: parsed.address || formatted,
              district: parsed.isKerala ? parsed.district : '',
              taluk: parsed.isKerala ? parsed.taluk : '',
              area: parsed.isKerala ? parsed.area : '',
              formattedAddress: formatted,
              isKerala: parsed.isKerala
            });
          }

          if (!parsed.isKerala) {
            toast.warning('Selected location is outside Kerala. Please select a location within Kerala.');
          } else {
            toast.success(`Found: ${parsed.district ? parsed.district + ', ' : ''}Kerala`);
          }
        } else {
          toast.error('Location not found. Please try searching another city or landmark in Kerala.');
        }
      } else {
        toast.error('Search request failed. Please try again.');
      }
    } catch (err) {
      if (currentReqId !== requestIdRef.current) return;
      setIsSearching(false);
      toast.error('Error searching location: ' + err.message);
    }
  };

  const getGoogleMapsExternalUrl = () => {
    if (coords.lat && coords.lng) {
      return `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`;
    }
    const q = [locationName, addressDetails, 'Kerala, India'].filter(Boolean).join(', ');
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Interactive Search & Locate Me Bar for Post/Edit Listing */}
      {interactive && (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Search location or city in Kerala (e.g. MG Road, Kochi)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSearchSubmit(e);
                }
              }}
              className="pl-9 text-xs sm:text-sm bg-card"
              data-testid="location-search-input"
            />
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleSearchSubmit}
            disabled={isSearching || !searchQuery.trim()}
            className="h-10 px-3 text-xs"
            data-testid="location-search-btn"
          >
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleLocateMe}
            disabled={isLocating}
            title="Use My Current Location"
            className="shrink-0 text-xs gap-1.5 h-10 px-3 border-violet-500/30 hover:bg-violet-500/10 hover:text-violet-500 transition-colors"
            data-testid="locate-me-btn"
          >
            {isLocating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                <span>Locating...</span>
              </>
            ) : (
              <>
                <Crosshair className="w-4 h-4 text-violet-500" />
                <span className="hidden sm:inline">Locate Me</span>
              </>
            )}
          </Button>
        </div>
      )}

      {/* Map Container */}
      <div 
        className={`relative w-full ${height} rounded-xl overflow-hidden border border-border bg-muted/40 shadow-inner`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Map Canvas */}
        <div ref={mapContainerRef} className="w-full h-full z-0" data-testid="google-map-canvas" />

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 z-10">
            <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
            <p className="text-xs text-muted-foreground font-medium">Loading Map...</p>
          </div>
        )}

        {/* Floating Google Maps External Link */}
        {!loading && (
          <a
            href={getGoogleMapsExternalUrl()}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-2.5 right-2.5 bg-background/90 hover:bg-background backdrop-blur-md px-2.5 py-1 rounded-md text-xs font-medium border border-border shadow-sm flex items-center gap-1 transition-colors z-10"
            title="Open in Google Maps"
          >
            <span className="text-[11px]">Google Maps</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {/* Selected Location Pill & Coordinate Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <MapPin className="w-3.5 h-3.5 text-violet-500 shrink-0" />
          <p className="text-xs text-foreground font-medium truncate" data-testid="selected-location-display">
            {resolvedDisplay || locationName || 'Kerala, India'}
          </p>
        </div>

        {coords.lat && coords.lng && (
          <span className="text-[11px] font-mono text-muted-foreground shrink-0 bg-muted/50 px-2 py-0.5 rounded border border-border/50">
            {Number(coords.lat).toFixed(4)}° N, {Number(coords.lng).toFixed(4)}° E
          </span>
        )}
      </div>

      {/* Outside Kerala Warning Badge */}
      {isOutsideKerala && (
        <div className="flex items-center gap-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-600 dark:text-amber-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>This pinned location is outside Kerala. Please select your Kerala district manually or search for your city in Kerala.</span>
        </div>
      )}

      {/* Helper Note for Interactive Picker */}
      {interactive && !isOutsideKerala && (
        <p className="text-[11px] text-muted-foreground">
          Tip: Click or drag the pin anywhere in Kerala, search a place, or click <strong>Locate Me</strong> to automatically fill your district and taluk.
        </p>
      )}
    </div>
  );
}
