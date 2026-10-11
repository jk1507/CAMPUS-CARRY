import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import useRequestStore from '../../store/requestStore.js';
import useAuthStore from '../../store/authStore.js';

const BUILDINGS = [
  { name:'Main Gate',  x:0,   z:0,   w:3,  h:8,  d:3,  color:0x7c3aed },
  { name:'Library',    x:-8,  z:-5,  w:5,  h:6,  d:4,  color:0x6366f1 },
  { name:'Hostel A',   x:8,   z:-5,  w:4,  h:12, d:4,  color:0x22d3ee },
  { name:'Hostel B',   x:13,  z:-5,  w:4,  h:10, d:4,  color:0x22d3ee },
  { name:'Canteen',    x:0,   z:-10, w:6,  h:3,  d:5,  color:0x4ade80 },
  { name:'Lab Block',  x:-12, z:-10, w:5,  h:9,  d:5,  color:0xa78bfa },
  { name:'Admin',      x:0,   z:8,   w:4,  h:7,  d:4,  color:0xf59e0b },
  { name:'Sports',     x:10,  z:8,   w:8,  h:2,  d:6,  color:0x34d399 },
  { name:'Dept Block', x:-6,  z:6,   w:5,  h:5,  d:4,  color:0xf472b6 },
];

export default function CampusMap3D() {
  const mountRef = useRef(null);
  const { feed, fetchFeed } = useRequestStore();
  const { user } = useAuthStore();

  useEffect(() => { fetchFeed(user?.campus); }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020817);
    scene.fog = new THREE.FogExp2(0x020817, 0.018);

    const camera = new THREE.PerspectiveCamera(55, mount.clientWidth / mount.clientHeight, 0.1, 200);
    camera.position.set(0, 22, 28);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    const sun = new THREE.DirectionalLight(0xfff5e0, 1.4);
    sun.position.set(25, 50, 25); sun.castShadow = true;
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0x4040ff, 0.25);
    fill.position.set(-20, 10, -20); scene.add(fill);
    const pointLight = new THREE.PointLight(0x7c3aed, 3, 25);
    pointLight.position.set(0, 8, 0); scene.add(pointLight);

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshStandardMaterial({ color: 0x0d0d18, roughness: 1 }));
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
    scene.add(ground);
    scene.add(new THREE.GridHelper(100, 50, 0x1a1a2e, 0x16162a));

    BUILDINGS.forEach(b => {
      const geo = new THREE.BoxGeometry(b.w, b.h, b.d);
      const mat = new THREE.MeshStandardMaterial({ color: b.color, roughness: 0.55, metalness: 0.25, transparent: true, opacity: 0.88 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(b.x, b.h / 2, b.z);
      mesh.castShadow = true; mesh.receiveShadow = true;
      scene.add(mesh);
      const top = new THREE.Mesh(new THREE.BoxGeometry(b.w + 0.05, 0.08, b.d + 0.05), new THREE.MeshBasicMaterial({ color: b.color, transparent: true, opacity: 0.6 }));
      top.position.set(b.x, b.h + 0.04, b.z); scene.add(top);
      const line = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: b.color, transparent: true, opacity: 0.25 }));
      line.position.copy(mesh.position); scene.add(line);
    });

    const pinObjs = [];
    feed.slice(0, 12).forEach((req, i) => {
      const angle = (i / Math.max(feed.length, 1)) * Math.PI * 2;
      const radius = 5 + (i % 3) * 3;
      const x = Math.cos(angle) * radius, z = Math.sin(angle) * radius;
      const pin = new THREE.Mesh(new THREE.SphereGeometry(0.45, 10, 10), new THREE.MeshStandardMaterial({ color: 0x7c3aed, emissive: 0x7c3aed, emissiveIntensity: 0.6 }));
      pin.position.set(x, 1.6, z); scene.add(pin); pinObjs.push(pin);
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.8, 20), new THREE.MeshBasicMaterial({ color: 0x7c3aed, transparent: true, opacity: 0.35, side: THREE.DoubleSide }));
      ring.rotation.x = -Math.PI / 2; ring.position.set(x, 0.02, z); scene.add(ring);
    });

    let isDragging = false, prevMouse = { x: 0, y: 0 }, theta = 0.3, phi = 0.9, radius = 35;
    const onDown = e => { isDragging = true; prevMouse = { x: e.clientX, y: e.clientY }; };
    const onUp   = () => { isDragging = false; };
    const onMove = e => {
      if (!isDragging) return;
      theta -= (e.clientX - prevMouse.x) * 0.012;
      phi = Math.max(0.25, Math.min(1.3, phi + (e.clientY - prevMouse.y) * 0.012));
      prevMouse = { x: e.clientX, y: e.clientY };
    };
    const onWheel = e => { radius = Math.max(12, Math.min(65, radius + e.deltaY * 0.06)); };

    mount.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('mousemove', onMove);
    mount.addEventListener('wheel', onWheel);

    const clock = new THREE.Clock();
    let raf;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      if (!isDragging) theta += 0.0025;
      camera.position.x = radius * Math.sin(phi) * Math.sin(theta);
      camera.position.y = radius * Math.cos(phi);
      camera.position.z = radius * Math.sin(phi) * Math.cos(theta);
      camera.lookAt(0, 0, 0);
      pinObjs.forEach((pin, i) => { pin.position.y = 1.6 + Math.sin(t * 2 + i) * 0.25; });
      pointLight.intensity = 2.5 + Math.sin(t * 1.5) * 0.8;
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      mount.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('mousemove', onMove);
      mount.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', onResize);
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [feed]);

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' }}>
        <div>
          <h1 style={{ fontFamily:'Syne, sans-serif', fontWeight:800, fontSize:'24px', color:'white' }}>3D Campus Map</h1>
          <p style={{ color:'#64748b', fontSize:'13px', marginTop:'2px' }}>{user?.campus}</p>
        </div>
        <span style={{ fontSize:'12px', color:'#a78bfa', background:'rgba(124,58,237,0.1)', border:'1px solid rgba(124,58,237,0.2)', padding:'4px 12px', borderRadius:'50px', fontFamily:'monospace' }}>{feed.length} open requests</span>
      </div>

      <motion.div initial={{ opacity:0, scale:0.98 }} animate={{ opacity:1, scale:1 }}
        style={{ position:'relative', borderRadius:'20px', overflow:'hidden', border:'1px solid #1e293b', height:'68vh' }}>
        <div ref={mountRef} style={{ width:'100%', height:'100%' }} />
        <div style={{ position:'absolute', bottom:'16px', left:'16px', background:'rgba(9,14,28,0.9)', border:'1px solid #1e293b', borderRadius:'12px', padding:'12px 16px', fontSize:'12px', display:'flex', flexDirection:'column', gap:'6px', zIndex:10 }}>
          {[['#a78bfa','Open Request'],['#6366f1','Library'],['#22d3ee','Hostels'],['#4ade80','Canteen'],['#a78bfa','Lab Block']].map(([c,l]) => (
            <div key={l} style={{ display:'flex', alignItems:'center', gap:'8px', color:'#94a3b8' }}>
              <span style={{ width:'10px', height:'10px', borderRadius:'50%', background:c, display:'inline-block', flexShrink:0 }} />{l}
            </div>
          ))}
        </div>
        <div style={{ position:'absolute', top:'16px', right:'16px', background:'rgba(9,14,28,0.9)', border:'1px solid #1e293b', borderRadius:'10px', padding:'8px 14px', fontSize:'12px', color:'#64748b', zIndex:10 }}>
          🖱 Drag · Scroll to zoom
        </div>
      </motion.div>
    </div>
  );
}
