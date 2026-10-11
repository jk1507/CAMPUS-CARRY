import React, { useEffect, useRef, useState } from 'react';

// OpenStreetMap & Leaflet loader
const loadLeaflet = () =>
  new Promise((resolve) => {
    if (window.L) return resolve(window.L);
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    s.onload = () => resolve(window.L);
    document.head.appendChild(s);
  });

export default function LocationPickerMap({
  initialPickup,
  initialDropoff,
  onPickupSelect,
  onDropoffSelect,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const pickupMarkerRef = useRef(null);
  const dropoffMarkerRef = useRef(null);
  const routeLineRef = useRef(null);

  const [activeMode, setActiveMode] = useState('pickup'); // 'pickup' | 'dropoff'
  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropoffCoords, setDropoffCoords] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Initialize Map
  useEffect(() => {
    loadLeaflet().then((L) => {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      // Default center around user or common coordinate (e.g. Visakhapatnam / India default)
      const defaultCenter = [17.7288, 83.3175];
      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 15,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      // Map Click Handler for Setting Pins
      map.on('click', async (e) => {
        const { lat, lng } = e.latlng;
        handlePinSelect(lat, lng, activeMode);
      });

      // Attempt initial browser location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            map.setView([latitude, longitude], 16);
          },
          () => {}
        );
      }
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update line connecting pickup and dropoff
  const updateRouteLine = (pCoords, dCoords) => {
    const L = window.L;
    if (!L || !mapInstanceRef.current) return;

    if (routeLineRef.current) {
      mapInstanceRef.current.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }

    if (pCoords && dCoords) {
      routeLineRef.current = L.polyline(
        [
          [pCoords.lat, pCoords.lng],
          [dCoords.lat, dCoords.lng],
        ],
        {
          color: '#8b5cf6',
          weight: 4,
          opacity: 0.8,
          dashArray: '8, 8',
        }
      ).addTo(mapInstanceRef.current);

      mapInstanceRef.current.fitBounds([
        [pCoords.lat, pCoords.lng],
        [dCoords.lat, dCoords.lng],
      ], { padding: [50, 50] });
    }
  };

  // Reverse Geocode
  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await res.json();
      if (data && data.display_name) {
        // Shorten long addresses
        const parts = data.display_name.split(',');
        return parts.slice(0, 3).join(',').trim();
      }
    } catch (e) {
      console.warn('Geocoding error', e);
    }
    return `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
  };

  const handlePinSelect = async (lat, lng, mode) => {
    const L = window.L;
    if (!L || !mapInstanceRef.current) return;

    const address = await reverseGeocode(lat, lng);

    if (mode === 'pickup') {
      setPickupCoords({ lat, lng });
      if (pickupMarkerRef.current) mapInstanceRef.current.removeLayer(pickupMarkerRef.current);

      const pickupIcon = L.divIcon({
        className: '',
        html: `
          <div style="display:flex;align-items:center;justify-content:center;position:relative;">
            <div style="background:#10b981;color:white;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(16,185,129,0.6);border:2px solid white;font-size:16px;">
              📍
            </div>
            <div style="position:absolute;bottom:-22px;background:#0f172a;color:#10b981;font-weight:700;font-size:10px;padding:2px 6px;border-radius:4px;border:1px solid #10b981;white-space:nowrap;">
              Pickup
            </div>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      pickupMarkerRef.current = L.marker([lat, lng], { icon: pickupIcon }).addTo(mapInstanceRef.current);
      onPickupSelect?.(address, { lat, lng });
      updateRouteLine({ lat, lng }, dropoffCoords);
      // Automatically toggle to dropoff next
      setActiveMode('dropoff');
    } else {
      setDropoffCoords({ lat, lng });
      if (dropoffMarkerRef.current) mapInstanceRef.current.removeLayer(dropoffMarkerRef.current);

      const dropoffIcon = L.divIcon({
        className: '',
        html: `
          <div style="display:flex;align-items:center;justify-content:center;position:relative;">
            <div style="background:#8b5cf6;color:white;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(139,92,246,0.6);border:2px solid white;font-size:16px;">
              🏁
            </div>
            <div style="position:absolute;bottom:-22px;background:#0f172a;color:#c4b5fd;font-weight:700;font-size:10px;padding:2px 6px;border-radius:4px;border:1px solid #8b5cf6;white-space:nowrap;">
              Dropoff
            </div>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      dropoffMarkerRef.current = L.marker([lat, lng], { icon: dropoffIcon }).addTo(mapInstanceRef.current);
      onDropoffSelect?.(address, { lat, lng });
      updateRouteLine(pickupCoords, { lat, lng });
    }
  };

  // Detect current location
  const handleDetectCurrent = () => {
    if (!navigator.geolocation) return;
    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsDetecting(false);
        const { latitude, longitude } = pos.coords;
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 17);
        }
        handlePinSelect(latitude, longitude, activeMode);
      },
      () => {
        setIsDetecting(false);
      }
    );
  };

  // Search Address on Map
  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const first = data[0];
        const lat = parseFloat(first.lat);
        const lng = parseFloat(first.lon);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lng], 17);
        }
        handlePinSelect(lat, lng, activeMode);
      }
    } catch (err) {
      console.warn('Search failed', err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-900/90 rounded-xl border border-slate-800">
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-lg border border-slate-800/80">
          <button
            type="button"
            onClick={() => setActiveMode('pickup')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeMode === 'pickup'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>📍</span> Set Pickup Pin
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('dropoff')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeMode === 'dropoff'
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🏁</span> Set Dropoff Pin
          </button>
        </div>

        <button
          type="button"
          onClick={handleDetectCurrent}
          disabled={isDetecting}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 flex items-center gap-1.5 transition-all"
        >
          {isDetecting ? (
            <span className="inline-block w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <span>🎯</span>
          )}
          Detect My Location
        </button>
      </div>

      {/* Map Search input */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
          placeholder={`Search landmark or building for ${activeMode}...`}
          className="flex-1 bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={isSearching}
          className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl transition-all"
        >
          {isSearching ? '...' : 'Search'}
        </button>
      </div>

      {/* Interactive Map Canvas */}
      <div className="relative w-full h-56 rounded-2xl overflow-hidden border border-slate-800 shadow-inner bg-slate-950">
        <div ref={mapContainerRef} className="w-full h-full z-0" />
        
        {/* Floating Instruction overlay */}
        <div className="absolute top-3 left-3 z-[400] bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 text-[11px] text-slate-300 flex items-center gap-1.5 pointer-events-none">
          <span className="w-2 h-2 rounded-full animate-ping bg-purple-400" />
          Click anywhere on the map to place <b>{activeMode}</b>
        </div>
      </div>
    </div>
  );
}
