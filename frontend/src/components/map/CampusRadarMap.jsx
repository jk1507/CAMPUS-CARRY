import React, { useEffect, useRef, useState } from 'react';
import {
  Compass,
  Navigation,
  Crosshair,
  MapPin,
  ExternalLink,
  Users,
  Footprints,
  Check,
  Bike,
  Package,
  Layers,
  Radio
} from 'lucide-react';
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
          <div style="position:absolute;width:44px;height:44px;border-radius:50%;background:rgba(255,87,34,0.3);animation:ping 2s infinite;"></div>
          <div style="width:26px;height:26px;border-radius:50%;background:#ff5722;border:3px solid white;box-shadow:0 0 16px rgba(255,87,34,0.8);display:flex;align-items:center;justify-content:center;color:white;font-size:12px;font-weight:bold;">
            👤
          </div>
          <div style="position:absolute;top:-22px;background:#1a1c23;color:#ff8a65;font-weight:700;font-size:10px;padding:2px 8px;border-radius:6px;border:1px solid #ff5722;white-space:nowrap;box-shadow:0 4px 10px rgba(0,0,0,0.5);">
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
          <div style="position:absolute;bottom:-20px;background:#1a1c23;color:#10b981;font-weight:700;font-size:10px;padding:2px 6px;border-radius:4px;border:1px solid #10b981;white-space:nowrap;">
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
          <div style="background:#ff5722;color:white;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(255,87,34,0.7);border:2px solid white;font-size:16px;">
            🏁
          </div>
          <div style="position:absolute;bottom:-20px;background:#1a1c23;color:#ff8a65;font-weight:700;font-size:10px;padding:2px 6px;border-radius:4px;border:1px solid #ff5722;white-space:nowrap;">
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
      color: '#ff5722',
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
    toast.success(`📍 Directions plotted for: ${request.title}`);
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
              };animation:ping 2.5s infinite;"></div>
              <div style="width:28px;height:28px;border-radius:50%;background:${
                isPeerCarrier ? '#3b82f6' : '#10b981'
              };border:2px solid white;box-shadow:0 0 14px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:14px;">
                ${isPeerCarrier ? '🛵' : '📦'}
              </div>
              <div style="position:absolute;top:-22px;background:#1a1c23;color:${
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
    <div className="space-y-4 pb-20 flex flex-col h-full">
      {/* Header Bar */}
      <div className="card p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Live Campus Radar & Turn-by-Turn GPS
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-zipp-ink-900 tracking-tight font-heading">
            Directions & Mutual Live Tracking
          </h1>
          <p className="text-xs text-zipp-ink-500 mt-0.5">
            Click any request to view its walking route and open Google Maps navigation.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={toggleBroadcast}
            className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 ${
              isBroadcasting
                ? 'bg-rose-500/15 text-rose-600 border border-rose-500/30 animate-pulse'
                : 'bg-zipp-primary text-white hover:bg-zipp-primary-dark shadow-zipp'
            }`}
          >
            <Radio size={14} className={isBroadcasting ? 'animate-spin' : ''} />
            {isBroadcasting ? 'Stop Sharing' : 'Share Live GPS'}
          </button>

          <button
            onClick={handleRecenter}
            className="p-2.5 rounded-xl bg-zipp-ink-100 hover:bg-zipp-ink-200 text-zipp-ink-800 border border-zipp-ink-200 text-xs font-semibold"
            title="Re-center on my position"
          >
            <Crosshair size={16} />
          </button>
        </div>
      </div>

      {/* Main Grid: Interactive Map + Delivery Directions Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Map Canvas (2 Columns on Desktop) */}
        <div className="lg:col-span-2 relative min-h-[380px] sm:min-h-[480px] rounded-3xl overflow-hidden border border-zipp-ink-200 shadow-soft bg-zipp-surface">
          <div ref={mapContainerRef} className="w-full h-full z-0" />

          {/* Route Info Badge (Distance & Walking Time) */}
          {routeInfo && (
            <div className="absolute top-4 left-4 z-[400] bg-zipp-surface/95 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-zipp-primary/30 shadow-card text-xs flex items-center gap-2.5">
              <span className="p-1.5 rounded-lg bg-zipp-primary/10 text-zipp-primary text-xs">
                <Footprints size={14} />
              </span>
              <div>
                <span className="text-zipp-ink-900 font-bold block">{routeInfo.distance}</span>
                <span className="text-[11px] text-zipp-primary font-medium">{routeInfo.duration}</span>
              </div>
            </div>
          )}

          {/* Active Peers Counter */}
          <div className="absolute top-4 right-4 z-[400] bg-zipp-surface/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-zipp-ink-200 text-[11px] text-zipp-ink-700 flex items-center gap-2 shadow-soft">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
            <span className="font-semibold">{Object.keys(activePeers).length} Peers Online</span>
          </div>

          {/* Selected Request Floating Google Maps Action Panel */}
          {selectedItem && (
            <div className="absolute bottom-4 left-4 right-4 z-[400] p-4 rounded-2xl bg-zipp-surface/95 backdrop-blur-xl border border-zipp-primary/30 shadow-card space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zipp-primary block">
                    Active Route Selected
                  </span>
                  <h4 className="text-sm font-bold text-zipp-ink-900 line-clamp-1">{selectedItem.title}</h4>
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
                  className="text-zipp-ink-400 hover:text-zipp-ink-800 p-1 text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-zipp-ink-50 border border-zipp-ink-100">
                  <span className="text-emerald-600 text-[10px] block font-bold">PICKUP</span>
                  <span className="text-zipp-ink-800 truncate block text-xs">{selectedItem.pickup_location}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-zipp-ink-50 border border-zipp-ink-100">
                  <span className="text-zipp-primary text-[10px] block font-bold">DROPOFF</span>
                  <span className="text-zipp-ink-800 truncate block text-xs">{selectedItem.dropoff_location}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
                    selectedItem.pickup_location
                  )}&destination=${encodeURIComponent(selectedItem.dropoff_location)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2 px-3 rounded-xl bg-zipp-primary hover:bg-zipp-primary-dark text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <Navigation size={13} />
                  <span>Open in Google Maps</span>
                </a>

                {activeRole === 'carrier' && selectedItem.status === 'open' && (
                  <button
                    onClick={() => handleAcceptMission(selectedItem.id)}
                    className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <Check size={14} /> Accept (₹{selectedItem.reward})
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Requests & Directions Picker Sidebar (1 Column on Desktop) */}
        <div className="p-4 rounded-3xl card flex flex-col gap-3 max-h-[480px] overflow-hidden">
          <div className="flex items-center justify-between border-b border-zipp-ink-100 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zipp-ink-500">
              Deliveries ({displayList.length})
            </span>
            <span className="text-[11px] text-zipp-primary font-semibold">Click to plot route</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {displayList.length === 0 ? (
              <div className="text-center py-16 text-zipp-ink-400 text-xs">
                <Package size={28} className="mx-auto mb-2 opacity-50" />
                <p>No requests right now.</p>
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
                        ? 'bg-zipp-primary/10 border-zipp-primary/40 shadow-sm'
                        : 'bg-zipp-surface hover:bg-zipp-ink-50 border-zipp-ink-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="font-bold text-zipp-ink-900 truncate">{req.title}</span>
                      <span className="text-zipp-primary font-extrabold font-heading text-sm">
                        ₹{req.reward}
                      </span>
                    </div>

                    <div className="text-[11px] text-zipp-ink-500 space-y-0.5 mb-2">
                      <div className="truncate flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <span className="truncate">{req.pickup_location}</span>
                      </div>
                      <div className="truncate flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-zipp-primary shrink-0" />
                        <span className="truncate">{req.dropoff_location}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] pt-2 border-t border-zipp-ink-100 text-zipp-ink-400">
                      <span className="uppercase font-bold text-zipp-primary">
                        {req.status}
                      </span>
                      <span className="text-zipp-primary hover:underline font-semibold flex items-center gap-1">
                        Plot Route →
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
