import React, { useEffect, useRef, useState } from 'react';
import useAuthStore from '../../store/authStore.js';
import useRequestStore from '../../store/requestStore.js';
import { getSocket } from '../../socket/socket.js';
import client from '../../api/client.js';
import toast from 'react-hot-toast';

// Leaflet Loader
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

export default function CampusRadarMap() {
  const { user, activeRole } = useAuthStore();
  const { feed, carrying, myRequests, fetchFeed, fetchCarrying, fetchMine, acceptRequest } = useRequestStore();

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const userMarkerRef = useRef(null);
  const peerMarkersRef = useRef({});
  const activeRoutePolylineRef = useRef(null);
  const routeMarkersRef = useRef([]);

  const [myCoords, setMyCoords] = useState(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [activePeers, setActivePeers] = useState({});
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeTab, setActiveTab] = useState('missions'); // 'missions' | 'radar'
  const [routeInfo, setRouteInfo] = useState(null);
  const [isDrawingRoute, setIsDrawingRoute] = useState(false);
  const watchIdRef = useRef(null);

  // Load initial requests
  useEffect(() => {
    fetchFeed(user?.campus);
    fetchCarrying();
    fetchMine();
  }, [user?.campus]);

  // Socket listener for mutual live location tracking
  useEffect(() => {
    const socket = getSocket();
    if (user?.campus) {
      socket.emit('join:campus', user.campus);
    }

    const handleLocationUpdate = (data) => {
      if (data.userId === user?.id) return;
      setActivePeers((prev) => ({
        ...prev,
        [data.userId]: {
          ...data,
          updatedAt: Date.now(),
        },
      }));
    };

    socket.on('location:update', handleLocationUpdate);
    return () => {
      socket.off('location:update', handleLocationUpdate);
    };
  }, [user?.campus, user?.id]);

  // Initialize Map
  useEffect(() => {
    loadLeaflet().then((L) => {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const initialCenter = [17.7288, 83.3175];
      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: 15,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      // Locate User initially
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            setMyCoords({ lat: latitude, lng: longitude });
            map.setView([latitude, longitude], 16);
            updateUserMarker(L, map, latitude, longitude);
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

  // Update User Marker
  const updateUserMarker = (L, map, lat, lng) => {
    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([lat, lng]);
      return;
    }

    const icon = L.divIcon({
      className: '',
      html: `
        <div style="position:relative;display:flex;align-items:center;justify-content:center;">
          <div style="position:absolute;width:44px;height:44px;border-radius:50%;background:rgba(139,92,246,0.3);animation:pulseGlow 2s infinite;"></div>
          <div style="width:26px;height:26px;border-radius:50%;background:#8b5cf6;border:3px solid white;box-shadow:0 0 16px rgba(139,92,246,0.8);display:flex;align-items:center;justify-content:center;color:white;font-size:12px;font-weight:bold;">
            👤
          </div>
          <div style="position:absolute;top:-22px;background:#030712;color:#c4b5fd;font-weight:700;font-size:10px;padding:2px 8px;border-radius:6px;border:1px solid #8b5cf6;white-space:nowrap;box-shadow:0 4px 10px rgba(0,0,0,0.5);">
            You (${user?.name?.split(' ')[0] || 'Me'})
          </div>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });

    userMarkerRef.current = L.marker([lat, lng], { icon, zIndexOffset: 1000 }).addTo(map);
  };

  // Geocode an address string to coordinates
  const geocodeAddress = async (addr) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          addr + (user?.campus ? ', ' + user.campus : '')
        )}`
      );
      const data = await res.json();
      if (data && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      }
    } catch (e) {
      console.warn('Geocoding error', e);
    }
    // Fallback: slight random delta near user or default campus center
    const baseLat = myCoords ? myCoords.lat : 17.7288;
    const baseLng = myCoords ? myCoords.lng : 83.3175;
    return {
      lat: baseLat + (Math.random() - 0.5) * 0.008,
      lng: baseLng + (Math.random() - 0.5) * 0.008,
    };
  };

  // Draw Directions Route on the Map between Pickup & Dropoff
  const drawRouteForRequest = async (request) => {
    const L = window.L;
    const map = mapInstanceRef.current;
    if (!L || !map) return;

    setIsDrawingRoute(true);
    setSelectedItem(request);

    // Clear previous route & pins
    if (activeRoutePolylineRef.current) {
      map.removeLayer(activeRoutePolylineRef.current);
      activeRoutePolylineRef.current = null;
    }
    routeMarkersRef.current.forEach((m) => map.removeLayer(m));
    routeMarkersRef.current = [];

    // Geocode both points
    const pCoords = await geocodeAddress(request.pickup_location);
    const dCoords = await geocodeAddress(request.dropoff_location);

    // Pickup Marker
    const pickupIcon = L.divIcon({
      className: '',
      html: `
        <div style="position:relative;display:flex;align-items:center;justify-content:center;">
          <div style="background:#10b981;color:white;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(16,185,129,0.7);border:2px solid white;font-size:16px;">
            📍
          </div>
          <div style="position:absolute;bottom:-20px;background:#030712;color:#10b981;font-weight:700;font-size:10px;padding:2px 6px;border-radius:4px;border:1px solid #10b981;white-space:nowrap;">
            Pickup
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const dropoffIcon = L.divIcon({
      className: '',
      html: `
        <div style="position:relative;display:flex;align-items:center;justify-content:center;">
          <div style="background:#8b5cf6;color:white;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(139,92,246,0.7);border:2px solid white;font-size:16px;">
            🏁
          </div>
          <div style="position:absolute;bottom:-20px;background:#030712;color:#c4b5fd;font-weight:700;font-size:10px;padding:2px 6px;border-radius:4px;border:1px solid #8b5cf6;white-space:nowrap;">
            Dropoff
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const pMarker = L.marker([pCoords.lat, pCoords.lng], { icon: pickupIcon }).addTo(map);
    const dMarker = L.marker([dCoords.lat, dCoords.lng], { icon: dropoffIcon }).addTo(map);
    routeMarkersRef.current = [pMarker, dMarker];

    // Try fetching actual walking routing from OSRM
    let routePoints = [
      [pCoords.lat, pCoords.lng],
      [dCoords.lat, dCoords.lng],
    ];

    try {
      const osrmRes = await fetch(
        `https://router.project-osrm.org/route/v1/walking/${pCoords.lng},${pCoords.lat};${dCoords.lng},${dCoords.lat}?overview=full&geometries=geojson`
      );
      const osrmData = await osrmRes.json();
      if (osrmData?.routes?.[0]) {
        const route = osrmData.routes[0];
        routePoints = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
        const distKm = (route.distance / 1000).toFixed(2);
        const mins = Math.round(route.duration / 60);
        setRouteInfo({ distance: `${distKm} km`, duration: `${mins} min walk` });
      } else {
        setRouteInfo({ distance: '~1.2 km', duration: '~15 min walk' });
      }
    } catch {
      setRouteInfo({ distance: 'Direct Route', duration: '5-15 min' });
    }

    // Polyline
    activeRoutePolylineRef.current = L.polyline(routePoints, {
      color: '#8b5cf6',
      weight: 5,
      opacity: 0.9,
      lineCap: 'round',
      dashArray: '10, 8',
    }).addTo(map);

    map.fitBounds(
      [
        [pCoords.lat, pCoords.lng],
        [dCoords.lat, dCoords.lng],
      ],
      { padding: [50, 50], maxZoom: 17 }
    );

    setIsDrawingRoute(false);
    toast.success(`📍 Directions plotted on map for: ${request.title}`);
  };

  // Toggle Live Broadcast
  const toggleBroadcast = () => {
    if (!navigator.geolocation) return toast.error('Geolocation is not supported by your browser');

    if (isBroadcasting) {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setIsBroadcasting(false);
      toast('Live tracking broadcast stopped');
    } else {
      setIsBroadcasting(true);
      toast.success('📍 Live GPS Tracking Broadcast Active!');

      const socket = getSocket();
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setMyCoords({ lat: latitude, lng: longitude });

          const L = window.L;
          if (L && mapInstanceRef.current) {
            updateUserMarker(L, mapInstanceRef.current, latitude, longitude);
          }

          socket.emit('location:send', {
            lat: latitude,
            lng: longitude,
            name: user?.name,
            role: activeRole,
          });

          client.post('/location/update', { lat: latitude, lng: longitude }).catch(() => {});
        },
        (err) => {
          console.warn('Geolocation error:', err);
          setIsBroadcasting(false);
          toast.error('Unable to access GPS location');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 3000 }
      );
    }
  };

  // Peer Markers Sync
  useEffect(() => {
    const L = window.L;
    const map = mapInstanceRef.current;
    if (!L || !map) return;

    Object.entries(activePeers).forEach(([peerId, peerData]) => {
      const isPeerCarrier = peerData.role === 'carrier';
      if (peerMarkersRef.current[peerId]) {
        peerMarkersRef.current[peerId].setLatLng([peerData.lat, peerData.lng]);
      } else {
        const peerIcon = L.divIcon({
          className: '',
          html: `
            <div style="position:relative;display:flex;align-items:center;justify-content:center;">
              <div style="position:absolute;width:40px;height:40px;border-radius:50%;background:${
                isPeerCarrier ? 'rgba(59,130,246,0.3)' : 'rgba(16,185,129,0.3)'
              };animation:pulseGlow 2.5s infinite;"></div>
              <div style="width:28px;height:28px;border-radius:50%;background:${
                isPeerCarrier ? '#3b82f6' : '#10b981'
              };border:2px solid white;box-shadow:0 0 14px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:14px;">
                ${isPeerCarrier ? '🛵' : '📦'}
              </div>
              <div style="position:absolute;top:-22px;background:#030712;color:${
                isPeerCarrier ? '#93c5fd' : '#a7f3d0'
              };font-weight:700;font-size:10px;padding:2px 8px;border-radius:6px;border:1px solid ${
            isPeerCarrier ? '#3b82f6' : '#10b981'
          };white-space:nowrap;">
                ${peerData.name || 'Peer'}
              </div>
            </div>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });

        const marker = L.marker([peerData.lat, peerData.lng], { icon: peerIcon }).addTo(map);
        peerMarkersRef.current[peerId] = marker;
      }
    });
  }, [activePeers]);

  // Center on user
  const handleRecenter = () => {
    if (myCoords && mapInstanceRef.current) {
      mapInstanceRef.current.setView([myCoords.lat, myCoords.lng], 16, { animate: true });
    }
  };

  const handleAcceptMission = async (reqId) => {
    const res = await acceptRequest(reqId);
    if (res.success) {
      toast.success('🛵 Request Accepted! Active on your radar route.');
      fetchCarrying();
    } else {
      toast.error(res.error || 'Failed to accept');
    }
  };

  const displayList = activeRole === 'carrier' ? feed : myRequests;

  return (
    <div className="space-y-4 pb-12 flex flex-col h-full">
      {/* Header Bar */}
      <div className="p-4 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Live Campus Radar & Turn-by-Turn GPS
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white font-['Syne']">
            Directions & Mutual Live Tracking
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Click any request to view its visual path, walking distance, and open Google Maps navigation.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={toggleBroadcast}
            className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 ${
              isBroadcasting
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
            }`}
          >
            <span>{isBroadcasting ? '⏹' : '📍'}</span>
            {isBroadcasting ? 'Stop Sharing' : 'Share Live GPS'}
          </button>

          <button
            onClick={handleRecenter}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold"
            title="Re-center on my position"
          >
            🎯
          </button>
        </div>
      </div>

      {/* Main Grid: Interactive Map + Delivery Directions Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Map Canvas (2 Columns on Desktop) */}
        <div className="lg:col-span-2 relative min-h-[420px] sm:min-h-[500px] rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
          <div ref={mapContainerRef} className="w-full h-full z-0" />

          {/* Route Info Badge (Distance & Walking Time) */}
          {routeInfo && (
            <div className="absolute top-4 left-4 z-[400] bg-slate-950/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-purple-500/40 shadow-xl text-xs flex items-center gap-3">
              <span className="p-1 rounded-lg bg-purple-500/20 text-purple-400 text-sm">🚶</span>
              <div>
                <span className="text-white font-bold block">{routeInfo.distance}</span>
                <span className="text-[11px] text-purple-300">{routeInfo.duration}</span>
              </div>
            </div>
          )}

          {/* Active Peers Counter */}
          <div className="absolute top-4 right-4 z-[400] bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-[11px] text-slate-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
            <span>{Object.keys(activePeers).length} Peers Online</span>
          </div>

          {/* Selected Request Floating Google Maps Action Panel */}
          {selectedItem && (
            <div className="absolute bottom-4 left-4 right-4 z-[400] p-4 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-purple-500/40 shadow-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 block">
                    Active Route Selected
                  </span>
                  <h4 className="text-sm font-bold text-white line-clamp-1">{selectedItem.title}</h4>
                </div>
                <button
                  onClick={() => {
                    setSelectedItem(null);
                    setRouteInfo(null);
                    if (activeRoutePolylineRef.current && mapInstanceRef.current) {
                      mapInstanceRef.current.removeLayer(activeRoutePolylineRef.current);
                      activeRoutePolylineRef.current = null;
                    }
                    routeMarkersRef.current.forEach((m) => mapInstanceRef.current?.removeLayer(m));
                    routeMarkersRef.current = [];
                  }}
                  className="text-slate-400 hover:text-white p-1 text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                  <span className="text-emerald-400 text-[10px] block font-semibold">📍 PICKUP</span>
                  <span className="text-slate-200 truncate block">{selectedItem.pickup_location}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                  <span className="text-purple-400 text-[10px] block font-semibold">🏁 DROPOFF</span>
                  <span className="text-slate-200 truncate block">{selectedItem.dropoff_location}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
                    selectedItem.pickup_location
                  )}&destination=${encodeURIComponent(selectedItem.dropoff_location)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-purple-600/30"
                >
                  <span>🗺</span> Open Turn-by-Turn in Google Maps
                </a>

                {activeRole === 'carrier' && selectedItem.status === 'open' && (
                  <button
                    onClick={() => handleAcceptMission(selectedItem.id)}
                    className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 transition-all"
                  >
                    <span>🛵</span> Accept (₹{selectedItem.reward})
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Requests & Directions Picker Sidebar (1 Column on Desktop) */}
        <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col gap-3 max-h-[500px] overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Campus Deliveries ({displayList.length})
            </span>
            <span className="text-[11px] text-purple-400">Click to plot route</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {displayList.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-xs">
                <span>📭</span>
                <p className="mt-1">No requests right now.</p>
              </div>
            ) : (
              displayList.map((req) => {
                const isSelected = selectedItem?.id === req.id;
                return (
                  <div
                    key={req.id}
                    onClick={() => drawRouteForRequest(req)}
                    className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-purple-950/40 border-purple-500/60 shadow-lg'
                        : 'bg-slate-950/60 hover:bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="font-bold text-slate-100 truncate">{req.title}</span>
                      <span className="text-purple-400 font-extrabold font-['Syne']">
                        ₹{req.reward}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 space-y-0.5 mb-2">
                      <div className="truncate">📍 {req.pickup_location}</div>
                      <div className="truncate">🏁 {req.dropoff_location}</div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] pt-2 border-t border-slate-800/80 text-slate-400">
                      <span className="uppercase font-semibold text-purple-300">
                        {req.status}
                      </span>
                      <span className="text-purple-400 hover:underline font-semibold flex items-center gap-1">
                        🗺 Show Route & Directions →
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
