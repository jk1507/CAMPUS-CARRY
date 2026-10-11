import React, { useEffect, useRef } from 'react';

export default function LiveMap({ carrierLat, carrierLng, carrierName, requesterLat, requesterLng, requesterName }) {
  const mapRef      = useRef(null);
  const mapInstance = useRef(null);
  const carrierMarker   = useRef(null);
  const requesterMarker = useRef(null);
  const pathPoints  = useRef([]);
  const pathLine    = useRef(null);

  const loadLeaflet = () => new Promise(resolve => {
    if (window.L) return resolve(window.L);
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css'; link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    s.onload = () => resolve(window.L);
    document.head.appendChild(s);
  });

  const makeCarrierIcon = (L, name) => L.divIcon({
    className: '',
    html: `<style>@keyframes ccpulse{0%,100%{opacity:.3;transform:scale(1)}50%{opacity:0;transform:scale(2.2)}}</style>
<div style="position:relative;width:52px;height:52px;display:flex;align-items:center;justify-content:center;">
  <div style="position:absolute;width:52px;height:52px;border-radius:50%;background:rgba(59,130,246,.2);animation:ccpulse 2s infinite;"></div>
  <div style="font-size:28px;z-index:2;filter:drop-shadow(0 3px 10px rgba(59,130,246,.9));">🛵</div>
  <div style="position:absolute;top:-26px;left:50%;transform:translateX(-50%);background:#1e293b;color:#93c5fd;padding:2px 9px;border-radius:6px;font-size:11px;font-weight:700;white-space:nowrap;border:1px solid rgba(59,130,246,.4);z-index:3;">${name || 'Carrier'}</div>
</div>`,
    iconSize: [52, 52], iconAnchor: [26, 26],
  });

  const makeRequesterIcon = (L, name) => L.divIcon({
    className: '',
    html: `<div style="position:relative;display:flex;align-items:center;justify-content:center;">
  <div style="font-size:26px;z-index:2;filter:drop-shadow(0 3px 8px rgba(139,92,246,.8));">📍</div>
  <div style="position:absolute;top:-24px;left:50%;transform:translateX(-50%);background:#1e293b;color:#c4b5fd;padding:2px 9px;border-radius:6px;font-size:11px;font-weight:700;white-space:nowrap;border:1px solid rgba(139,92,246,.4);z-index:3;">${name || 'You'}</div>
</div>`,
    iconSize: [36, 48], iconAnchor: [18, 48],
  });

  useEffect(() => {
    loadLeaflet().then(L => {
      if (!mapRef.current || mapInstance.current) return;
      const cLat = carrierLat || requesterLat || 17.7334;
      const cLng = carrierLng || requesterLng || 83.3179;
      const map = L.map(mapRef.current, { center: [cLat, cLng], zoom: 16 });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap', maxZoom: 19 }).addTo(map);
      mapInstance.current = map;
      if (carrierLat && carrierLng) {
        carrierMarker.current = L.marker([carrierLat, carrierLng], { icon: makeCarrierIcon(L, carrierName), zIndexOffset: 1000 }).addTo(map);
        pathPoints.current = [[carrierLat, carrierLng]];
        pathLine.current = L.polyline(pathPoints.current, { color: '#3b82f6', weight: 5, opacity: 0.85 }).addTo(map);
      }
      if (requesterLat && requesterLng)
        requesterMarker.current = L.marker([requesterLat, requesterLng], { icon: makeRequesterIcon(L, requesterName) }).addTo(map);
      const pts = [];
      if (carrierLat && carrierLng)    pts.push([carrierLat, carrierLng]);
      if (requesterLat && requesterLng) pts.push([requesterLat, requesterLng]);
      if (pts.length === 2) map.fitBounds(pts, { padding: [60, 60], maxZoom: 17 });
    });
    return () => { if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; } };
  }, []);

  useEffect(() => {
    if (!mapInstance.current || !window.L || !carrierLat || !carrierLng) return;
    const pos = [carrierLat, carrierLng];
    if (carrierMarker.current) carrierMarker.current.setLatLng(pos);
    else carrierMarker.current = window.L.marker(pos, { icon: makeCarrierIcon(window.L, carrierName), zIndexOffset: 1000 }).addTo(mapInstance.current);
    pathPoints.current.push(pos);
    if (pathLine.current) pathLine.current.setLatLngs(pathPoints.current);
    else pathLine.current = window.L.polyline(pathPoints.current, { color: '#3b82f6', weight: 5 }).addTo(mapInstance.current);
    mapInstance.current.panTo(pos, { animate: true, duration: 0.8 });
  }, [carrierLat, carrierLng]);

  useEffect(() => {
    if (!mapInstance.current || !window.L || !requesterLat || !requesterLng) return;
    const pos = [requesterLat, requesterLng];
    if (requesterMarker.current) requesterMarker.current.setLatLng(pos);
    else requesterMarker.current = window.L.marker(pos, { icon: makeRequesterIcon(window.L, requesterName) }).addTo(mapInstance.current);
  }, [requesterLat, requesterLng]);

  return (
    <div style={{ position:'relative', borderRadius:'12px', overflow:'hidden', border:'1px solid #334155', height:'300px' }}>
      <div ref={mapRef} style={{ width:'100%', height:'100%' }} />
      <div style={{ position:'absolute', bottom:'12px', left:'12px', background:'rgba(15,23,42,0.92)', border:'1px solid #334155', borderRadius:'10px', padding:'10px 14px', fontSize:'12px', display:'flex', flexDirection:'column', gap:'6px', zIndex:1000 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px', color:'#cbd5e1' }}><span>🛵</span> {carrierName || 'Carrier'}</div>
        <div style={{ display:'flex', alignItems:'center', gap:'8px', color:'#cbd5e1' }}><span>📍</span> {requesterName || 'You'}</div>
        <div style={{ display:'flex', alignItems:'center', gap:'8px', color:'#64748b' }}><span style={{ width:'16px', height:'3px', background:'#3b82f6', display:'inline-block', borderRadius:'2px' }} /> Path</div>
      </div>
    </div>
  );
}
