import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useMissionStore } from '../../stores/missionStore';
import { LandingSite } from '../../types';
import { 
  Compass, 
  MapPin, 
  RotateCw, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Crosshair,
  ShieldCheck,
  Zap,
  Radio,
  Sparkles
} from 'lucide-react';

interface RealMoonGlobeProps {
  sites: LandingSite[];
  onSelectSite?: (site: LandingSite) => void;
  targetFocusTrigger?: number;
}

export const RealMoonGlobe3D: React.FC<RealMoonGlobeProps> = ({ 
  sites, 
  onSelectSite, 
  targetFocusTrigger = 0 
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const { selectedSite, setSelectedSite } = useMissionStore();

  const [hoveredSite, setHoveredSite] = useState<LandingSite | null>(null);
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const [isFlying, setIsFlying] = useState<boolean>(false);
  const [textureMode, setTextureMode] = useState<'lola_elevation' | 'lola_shade' | 'wac_photo'>('lola_elevation');

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const moonMeshRef = useRef<THREE.Mesh | null>(null);
  const markerGroupRef = useRef<THREE.Group | null>(null);

  // Camera animation target state
  const cameraTargetRef = useRef<{
    pos: THREE.Vector3;
    lookAt: THREE.Vector3;
    progress: number;
    active: boolean;
  }>({
    pos: new THREE.Vector3(0, -10, 10),
    lookAt: new THREE.Vector3(0, 0, 0),
    progress: 1,
    active: false,
  });

  const R = 6.0; // Moon sphere radius

  // Convert Lunar Latitude (-90 to +90) and East-positive Longitude (0 to 360) to 3D Cartesian
  const latLonToVector3 = (latDeg: number, lonDeg: number, radius: number = R): THREE.Vector3 => {
    const latRad = THREE.MathUtils.degToRad(latDeg);
    const lonRad = THREE.MathUtils.degToRad(lonDeg);

    // Standard spherical mapping:
    // Y is North pole (+90 lat = (0, R, 0), -90 lat = (0, -R, 0))
    // X and Z represent equator based on East longitude
    const cosLat = Math.cos(latRad);
    const x = radius * cosLat * Math.cos(lonRad);
    const y = radius * Math.sin(latRad);
    const z = -radius * cosLat * Math.sin(lonRad);
    return new THREE.Vector3(x, y, z);
  };

  // Fly Camera to Latitude / Longitude
  const flyToSite = (lat: number, lon: number, distance: number = 10.5) => {
    if (!cameraRef.current) return;
    const surfacePos = latLonToVector3(lat, lon, R);
    // Camera positioned outward along the surface normal vector
    const camPos = surfacePos.clone().normalize().multiplyScalar(distance);

    cameraTargetRef.current = {
      pos: camPos,
      lookAt: surfacePos.clone().multiplyScalar(0.2), // Look toward center/surface
      progress: 0,
      active: true,
    };
    setIsFlying(true);
    setIsRotating(false);
  };

  // Setup Three.js Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 500;
    const height = container.clientHeight || 450;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x05070a);

    // 2. Camera (Initial view angled toward South Pole)
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(2, -12, 10);
    camera.lookAt(0, -3, 0);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Starfield Background
    const starGeo = new THREE.BufferGeometry();
    const starCount = 2000;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      const rad = 80 + Math.random() * 60;
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      starPos[i] = rad * Math.sin(phi) * Math.cos(theta);
      starPos[i + 1] = rad * Math.sin(phi) * Math.sin(theta);
      starPos[i + 2] = rad * Math.cos(phi);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.8, transparent: true, opacity: 0.85 });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // 5. Scientific Lunar Sphere
    const textureLoader = new THREE.TextureLoader();
    const moonGeo = new THREE.SphereGeometry(R, 64, 64);

    // Initial load: Authentic LOLA Topographic Color Elevation Map
    const initialUrl = textureMode === 'lola_elevation'
      ? '/textures/lola_elevation.jpg'
      : (textureMode === 'lola_shade' ? '/textures/lola_shade.jpg' : '/textures/moon.jpg');

    const moonTex = textureLoader.load(initialUrl, () => {
      renderer.render(scene, camera);
    });
    moonTex.colorSpace = THREE.SRGBColorSpace;

    const moonMat = new THREE.MeshStandardMaterial({
      map: moonTex,
      roughness: 0.85,
      metalness: 0.08,
    });
    const moonMesh = new THREE.Mesh(moonGeo, moonMat);
    scene.add(moonMesh);
    moonMeshRef.current = moonMesh;

    // Soft Atmospheric Limb Rim Glow
    const glowGeo = new THREE.SphereGeometry(R * 1.018, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.12,
      side: THREE.BackSide,
    });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    scene.add(glowMesh);

    // Coordinate Grid Ring at South Pole (-80° Latitude Circle)
    const spRingPoints: THREE.Vector3[] = [];
    for (let deg = 0; deg <= 360; deg += 5) {
      spRingPoints.push(latLonToVector3(-80, deg, R * 1.002));
    }
    const spRingGeo = new THREE.BufferGeometry().setFromPoints(spRingPoints);
    const spRingMat = new THREE.LineBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.4 });
    const spRing = new THREE.Line(spRingGeo, spRingMat);
    scene.add(spRing);

    // Marker Group for Landing Sites & Craters
    const markerGroup = new THREE.Group();
    scene.add(markerGroup);
    markerGroupRef.current = markerGroup;

    // 6. Lighting
    const ambientLight = new THREE.AmbientLight(0x1e293b, 1.4);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffaed, 2.8);
    sunLight.position.set(30, 15, 25);
    scene.add(sunLight);

    // 7. Interactive Mouse / Orbit Controls
    let isMouseDown = false;
    let prevMouse = { x: 0, y: 0 };
    let spherical = { radius: 14.5, theta: 0.4, phi: 2.1 };

    const updateCameraFromSpherical = () => {
      camera.position.x = spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
      camera.position.y = spherical.radius * Math.cos(spherical.phi);
      camera.position.z = spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);
      camera.lookAt(0, 0, 0);
    };
    updateCameraFromSpherical();

    const onMouseDown = (e: MouseEvent) => {
      isMouseDown = true;
      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isMouseDown) return;
      const dx = e.clientX - prevMouse.x;
      const dy = e.clientY - prevMouse.y;
      prevMouse = { x: e.clientX, y: e.clientY };

      spherical.theta -= dx * 0.006;
      spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi - dy * 0.006));
      updateCameraFromSpherical();
      setIsRotating(false);
    };

    const onMouseUp = () => { isMouseDown = false; };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      spherical.radius = Math.max(R + 1.2, Math.min(32, spherical.radius + e.deltaY * 0.015));
      updateCameraFromSpherical();
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('wheel', onWheel, { passive: false });

    // 8. Raycasting for Pin Click & Hover
    const raycaster = new THREE.Raycaster();
    const mouseVector = new THREE.Vector2();

    const onClick = (e: MouseEvent) => {
      const rect = dom.getBoundingClientRect();
      mouseVector.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseVector.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouseVector, camera);
      const intersects = raycaster.intersectObjects(markerGroup.children, true);

      if (intersects.length > 0) {
        const hitObj = intersects[0].object;
        const siteData = hitObj.userData?.site as LandingSite;
        if (siteData) {
          setSelectedSite(siteData);
          if (onSelectSite) onSelectSite(siteData);
          flyToSite(siteData.latitude, siteData.longitude);
        }
      }
    };
    dom.addEventListener('click', onClick);

    // 9. Animation Render Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Handle Smooth Fly-To Camera Transition
      if (cameraTargetRef.current.active) {
        const t = cameraTargetRef.current;
        t.progress += 0.035;
        if (t.progress >= 1) {
          t.progress = 1;
          t.active = false;
          setIsFlying(false);
          // Sync spherical coords
          spherical.radius = camera.position.length();
          spherical.phi = Math.acos(camera.position.y / spherical.radius);
          spherical.theta = Math.atan2(camera.position.x, camera.position.z);
        } else {
          // Smooth easeInOutCubic
          const ease = t.progress < 0.5 
            ? 4 * t.progress * t.progress * t.progress 
            : 1 - Math.pow(-2 * t.progress + 2, 3) / 2;
          camera.position.lerp(t.pos, 0.08);
          camera.lookAt(t.lookAt);
        }
      } else if (isRotating && moonMeshRef.current) {
        // Slow idle Moon rotation
        spherical.theta += 0.0008;
        updateCameraFromSpherical();
      }

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('wheel', onWheel);
      dom.removeEventListener('click', onClick);
      renderer.dispose();
    };
  }, []);

  // Update Moon Texture based on selected scientific mode
  useEffect(() => {
    if (!moonMeshRef.current || !rendererRef.current || !sceneRef.current || !cameraRef.current) return;
    const loader = new THREE.TextureLoader();
    const url = textureMode === 'lola_elevation'
      ? '/textures/lola_elevation.jpg'
      : (textureMode === 'lola_shade' ? '/textures/lola_shade.jpg' : '/textures/moon.jpg');

    loader.load(url, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      const mat = moonMeshRef.current?.material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.map = tex;
        mat.needsUpdate = true;
        rendererRef.current?.render(sceneRef.current!, cameraRef.current!);
      }
    });
  }, [textureMode]);

  // Populate Landing Site Pins on the 3D Moon Sphere
  useEffect(() => {
    const markerGroup = markerGroupRef.current;
    if (!markerGroup || sites.length === 0) return;

    // Clear existing pins
    while (markerGroup.children.length > 0) {
      markerGroup.remove(markerGroup.children[0]);
    }

    sites.forEach((site) => {
      const isSelected = site.id === selectedSite.id;
      const pinPos = latLonToVector3(site.latitude, site.longitude, R * 1.008);

      const pinContainer = new THREE.Group();
      pinContainer.position.copy(pinPos);
      pinContainer.userData = { site };

      // Pin Head Sphere
      const pinSize = isSelected ? 0.22 : 0.12;
      const pinColor = isSelected 
        ? 0x00f0ff 
        : (site.type === 'south_pole_candidate' ? 0xf59e0b : (site.type === 'permanently_shadowed_region' ? 0xa855f7 : 0x10b981));

      const headGeo = new THREE.SphereGeometry(pinSize, 16, 16);
      const headMat = new THREE.MeshBasicMaterial({ color: pinColor });
      const headMesh = new THREE.Mesh(headGeo, headMat);
      headMesh.userData = { site };
      pinContainer.add(headMesh);

      // Pin Ring Halo
      const ringGeo = new THREE.RingGeometry(pinSize * 1.3, pinSize * 1.8, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: pinColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: isSelected ? 0.9 : 0.45,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.lookAt(new THREE.Vector3(0, 0, 0)); // Align with Moon surface normal
      ringMesh.userData = { site };
      pinContainer.add(ringMesh);

      // Target Beacon Beam for Active Site
      if (isSelected) {
        const beamGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.2, 8);
        const beamMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.8 });
        const beamMesh = new THREE.Mesh(beamGeo, beamMat);
        beamMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pinPos.clone().normalize());
        beamMesh.position.copy(pinPos.clone().normalize().multiplyScalar(0.6));
        pinContainer.add(beamMesh);
      }

      markerGroup.add(pinContainer);
    });
  }, [sites, selectedSite]);

  // Trigger Fly-To when selectedSite changes or focus trigger fired
  useEffect(() => {
    if (selectedSite) {
      flyToSite(selectedSite.latitude, selectedSite.longitude);
    }
  }, [selectedSite.id, targetFocusTrigger]);

  return (
    <div className="relative w-full h-full min-h-[380px] overflow-hidden select-none">
      {/* 3D WebGL Canvas */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Right: View Controls */}
      <div className="absolute top-3 right-3 flex flex-col space-y-1 bg-space-900/85 backdrop-blur-md p-2 rounded-lg border border-slate-800 text-xs font-mono shadow-lg z-10">
        <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider px-1 mb-1">
          Globe Layer
        </div>
        <div className="flex flex-col space-y-1">
          <button
            onClick={() => setTextureMode('lola_elevation')}
            className={`px-2 py-1 rounded text-[11px] text-left transition flex items-center justify-between ${
              textureMode === 'lola_elevation'
                ? 'bg-cyan-500/20 border border-cyan-500 text-cyan-300 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-space-800'
            }`}
          >
            <span>LOLA Elevation</span>
            {textureMode === 'lola_elevation' && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 ml-2" />}
          </button>

          <button
            onClick={() => setTextureMode('lola_shade')}
            className={`px-2 py-1 rounded text-[11px] text-left transition flex items-center justify-between ${
              textureMode === 'lola_shade'
                ? 'bg-cyan-500/20 border border-cyan-500 text-cyan-300 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-space-800'
            }`}
          >
            <span>LOLA Shaded Relief</span>
            {textureMode === 'lola_shade' && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 ml-2" />}
          </button>

          <button
            onClick={() => setTextureMode('wac_photo')}
            className={`px-2 py-1 rounded text-[11px] text-left transition flex items-center justify-between ${
              textureMode === 'wac_photo'
                ? 'bg-cyan-500/20 border border-cyan-500 text-cyan-300 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-space-800'
            }`}
          >
            <span>LRO WAC Mosaic</span>
            {textureMode === 'wac_photo' && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 ml-2" />}
          </button>
        </div>

        <div className="border-t border-slate-800 my-1.5" />

        <div className="flex flex-col space-y-1">
          <button
            onClick={() => flyToSite(selectedSite.latitude, selectedSite.longitude)}
            title="Fly to Selected Site"
            className="flex items-center space-x-1.5 px-2 py-1 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition text-[11px]"
          >
            <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
            <span>Fly to Site</span>
          </button>

          <button
            onClick={() => flyToSite(-89.9, 0, 11)}
            title="Focus South Pole"
            className="flex items-center space-x-1.5 px-2 py-1 rounded bg-space-800 hover:bg-space-700 text-slate-300 transition text-[11px]"
          >
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            <span>South Pole</span>
          </button>

          <button
            onClick={() => flyToSite(0, 0, 14)}
            title="Focus Nearside Equator"
            className="flex items-center space-x-1.5 px-2 py-1 rounded bg-space-800 hover:bg-space-700 text-slate-300 transition text-[11px]"
          >
            <Maximize2 className="w-3.5 h-3.5 text-sky-400" />
            <span>Nearside Full</span>
          </button>

          <button
            onClick={() => setIsRotating(!isRotating)}
            title="Toggle Auto Rotation"
            className={`flex items-center space-x-1.5 px-2 py-1 rounded transition text-[11px] ${
              isRotating ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40' : 'bg-space-800 text-slate-400'
            }`}
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin' : ''}`} />
            <span>{isRotating ? 'Rotating' : 'Paused'}</span>
          </button>
        </div>
      </div>

      {/* Bottom Center: Instruction & Interactive Legend */}
      <div className="absolute bottom-4 left-4 right-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-space-900/90 backdrop-blur-md px-4 py-2.5 rounded-xl border border-slate-800 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-4 text-[11px]">
          <span className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-cyan-400 shadow-glow-cyan" />
            <span className="text-cyan-300 font-bold">Selected Target</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-slate-300">Artemis/CLPS Candidate</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
            <span className="text-slate-300">Permanently Shadowed (PSR)</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-slate-300">Historic Landing</span>
          </span>
        </div>

        <div className="text-[11px] text-slate-400 flex items-center space-x-2">
          <span>Click any crater pin to fly directly to it • Drag to orbit • Scroll to zoom</span>
        </div>
      </div>
    </div>
  );
};
