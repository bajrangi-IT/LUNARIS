import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useMissionStore } from '../../stores/missionStore';

export const CelestialSphere3D: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const { analysisData, currentTimestampIndex } = useMissionStore();

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  const sunMeshRef = useRef<THREE.Mesh | null>(null);
  const earthMeshRef = useRef<THREE.Mesh | null>(null);
  const sunTrackRef = useRef<THREE.Line | null>(null);
  const earthTrackRef = useRef<THREE.Line | null>(null);
  const terrainHorizonLineRef = useRef<THREE.Line | null>(null);

  // Setup Three.js Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x05070a);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 8, 16);
    camera.lookAt(0, 1, 0);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Starfield background
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 1200;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      const r = 80 + Math.random() * 40;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      starPositions[i] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i + 1] = Math.abs(r * Math.cos(phi)); // Mostly above horizon
      starPositions[i + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.8, transparent: true, opacity: 0.85 });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // 5. Lunar Surface Disc (Grey Regolith)
    const groundGeo = new THREE.CircleGeometry(12, 64);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x1b2332,
      roughness: 0.9,
      metalness: 0.1,
      side: THREE.DoubleSide
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    scene.add(ground);

    // 6. Horizon Compass Ring
    const ringGeo = new THREE.RingGeometry(11.9, 12.05, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0;
    scene.add(ring);

    // Cardinal Azimuth Grid Lines & Markers
    const gridHelper = new THREE.PolarGridHelper(12, 8, 4, 32, 0x00f0ff, 0x1e293b);
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    // 7. Sun Sphere (Target 10)
    const sunGeo = new THREE.SphereGeometry(0.7, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffb703 });
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    scene.add(sunMesh);
    sunMeshRef.current = sunMesh;

    // Solar Glow Halos
    const glowGeo = new THREE.SphereGeometry(1.0, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.35,
      side: THREE.BackSide
    });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    sunMesh.add(glowMesh);

    // 8. Earth Sphere (Target 399)
    const earthGeo = new THREE.SphereGeometry(0.65, 32, 32);
    const earthMat = new THREE.MeshStandardMaterial({
      color: 0x00b4d8,
      roughness: 0.4,
      metalness: 0.2
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    scene.add(earthMesh);
    earthMeshRef.current = earthMesh;

    // Earth Atmosphere Glow
    const earthGlow = new THREE.Mesh(
      new THREE.SphereGeometry(0.75, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.25, side: THREE.BackSide })
    );
    earthMesh.add(earthGlow);

    // Ambient & Directional Lighting
    const ambientLight = new THREE.AmbientLight(0x334155, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff7ed, 1.5);
    dirLight.position.set(10, 20, 15);
    scene.add(dirLight);

    // Basic Mouse Drag Orbit Controls
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };
    let spherical = { radius: 18, theta: Math.PI / 4, phi: Math.PI / 3 };

    const updateCamera = () => {
      camera.position.x = spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
      camera.position.y = spherical.radius * Math.cos(spherical.phi);
      camera.position.z = spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);
      camera.lookAt(0, 0.5, 0);
    };
    updateCamera();

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouse.x;
      const dy = e.clientY - prevMouse.y;
      prevMouse = { x: e.clientX, y: e.clientY };

      spherical.theta -= dx * 0.008;
      spherical.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, spherical.phi - dy * 0.008));
      updateCamera();
    };

    const onMouseUp = () => { isDragging = false; };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      spherical.radius = Math.max(6, Math.min(30, spherical.radius + e.deltaY * 0.02));
      updateCamera();
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('wheel', onWheel, { passive: false });

    // Render loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
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
      renderer.dispose();
    };
  }, []);

  // Update Sun, Earth, Trajectories, and Terrain Horizon Profile when Data changes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !analysisData) return;

    const solarTimeline = analysisData.solar?.timeline || [];
    const commTimeline = analysisData.communication?.timeline || [];
    const horizonProfile = analysisData.terrain?.profile || [];

    const R = 12.0; // Radius of horizon hemisphere

    // Convert Azimuth (deg, 0=N, 90=E) & Elevation (deg) to 3D Cartesian coords
    // North is -Z, East is +X, Up is +Y
    const toCartesian = (azDeg: number, elDeg: number, radius = R) => {
      const azRad = THREE.MathUtils.degToRad(azDeg);
      const elRad = THREE.MathUtils.degToRad(elDeg);
      const x = radius * Math.cos(elRad) * Math.sin(azRad);
      const y = radius * Math.sin(elRad);
      const z = -radius * Math.cos(elRad) * Math.cos(azRad);
      return new THREE.Vector3(x, y, z);
    };

    // 1. Current Sun Position
    const curSolar = solarTimeline[currentTimestampIndex];
    if (curSolar && sunMeshRef.current) {
      const sunPos = toCartesian(curSolar.solar_azimuth_deg, curSolar.solar_elevation_deg, 13.0);
      sunMeshRef.current.position.copy(sunPos);
      sunMeshRef.current.visible = true;
    }

    // 2. Current Earth Position
    const curComm = commTimeline[currentTimestampIndex];
    if (curComm && earthMeshRef.current) {
      const earthPos = toCartesian(curComm.earth_azimuth_deg, curComm.earth_elevation_deg, 13.0);
      earthMeshRef.current.position.copy(earthPos);
      earthMeshRef.current.visible = true;
    }

    // 3. Sun Track Line across timeline
    if (sunTrackRef.current) scene.remove(sunTrackRef.current);
    if (solarTimeline.length > 1) {
      const sunPoints = solarTimeline.map((p) => toCartesian(p.solar_azimuth_deg, p.solar_elevation_deg, 13.0));
      const sunTrackGeo = new THREE.BufferGeometry().setFromPoints(sunPoints);
      const sunTrackMat = new THREE.LineBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.65 });
      const sunTrack = new THREE.Line(sunTrackGeo, sunTrackMat);
      scene.add(sunTrack);
      sunTrackRef.current = sunTrack;
    }

    // 4. Earth Track Line across timeline (Libration wobble path)
    if (earthTrackRef.current) scene.remove(earthTrackRef.current);
    if (commTimeline.length > 1) {
      const earthPoints = commTimeline.map((p) => toCartesian(p.earth_azimuth_deg, p.earth_elevation_deg, 13.0));
      const earthTrackGeo = new THREE.BufferGeometry().setFromPoints(earthPoints);
      const earthTrackMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.65 });
      const earthTrack = new THREE.Line(earthTrackGeo, earthTrackMat);
      scene.add(earthTrack);
      earthTrackRef.current = earthTrack;
    }

    // 5. Terrain Horizon Silhouette Line
    if (terrainHorizonLineRef.current) scene.remove(terrainHorizonLineRef.current);
    if (horizonProfile.length > 0) {
      const horizonPoints = horizonProfile.map((hp) =>
        toCartesian(hp.azimuth_deg, hp.horizon_elevation_deg, 12.0)
      );
      // Close ring
      horizonPoints.push(horizonPoints[0]);
      const hGeo = new THREE.BufferGeometry().setFromPoints(horizonPoints);
      const hMat = new THREE.LineBasicMaterial({
        color: analysisData.terrain?.available ? 0x10b981 : 0x64748b,
        linewidth: 2
      });
      const hLine = new THREE.Line(hGeo, hMat);
      scene.add(hLine);
      terrainHorizonLineRef.current = hLine;
    }
  }, [analysisData, currentTimestampIndex]);

  const curSolar = analysisData?.solar?.timeline?.[currentTimestampIndex];
  const curComm = analysisData?.communication?.timeline?.[currentTimestampIndex];

  return (
    <div className="relative w-full h-full min-h-[460px] rounded-xl overflow-hidden glass-panel border border-slate-800 bg-space-950">
      {/* 3D Canvas Viewport */}
      <div ref={mountRef} className="w-full h-full min-h-[460px] cursor-grab active:cursor-grabbing" />

      {/* Overlay: Cardinal Compass Overlay Badges */}
      <div className="absolute top-3 left-3 bg-space-900/90 backdrop-blur-md p-3 rounded-lg border border-slate-800 text-xs font-mono">
        <div className="text-[10px] uppercase text-cyan-400 font-semibold mb-1">
          Observatory Coordinates
        </div>
        <div className="text-slate-300">
          Target: <span className="text-cyan-300">{useMissionStore.getState().selectedSite.name}</span>
        </div>
        <div className="text-slate-400 text-[11px] mt-0.5">
          Azimuth: 0° (North), 90° (East), 180° (South), 270° (West)
        </div>
        <div className="text-slate-400 text-[11px]">
          Curvature correction: <span className="text-emerald-400">ENABLED (R=1737.4 km)</span>
        </div>
      </div>

      {/* Overlay: Live Celestial Position Readout */}
      <div className="absolute bottom-3 right-3 bg-space-900/90 backdrop-blur-md p-3 rounded-lg border border-slate-800 text-xs font-mono space-y-1.5 min-w-[220px]">
        {/* Sun readout */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-1">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-glow-amber" />
            <span className="font-semibold text-amber-300">SUN</span>
          </div>
          <div className="text-right">
            <div>Az: {curSolar?.solar_azimuth_deg?.toFixed(1) ?? '--'}°</div>
            <div>El: {curSolar?.solar_elevation_deg?.toFixed(2) ?? '--'}°</div>
          </div>
        </div>

        {/* Earth readout */}
        <div className="flex items-center justify-between pt-0.5">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-glow-cyan" />
            <span className="font-semibold text-cyan-300">EARTH</span>
          </div>
          <div className="text-right">
            <div>Az: {curComm?.earth_azimuth_deg?.toFixed(1) ?? '--'}°</div>
            <div>El: {curComm?.earth_elevation_deg?.toFixed(2) ?? '--'}°</div>
          </div>
        </div>

        {/* Legend */}
        <div className="pt-1.5 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
          <span className="flex items-center space-x-1">
            <span className={`w-2 h-0.5 ${analysisData?.terrain?.available ? 'bg-emerald-400' : 'bg-slate-500'}`} />
            <span>{analysisData?.terrain?.available ? 'PGDA LM7 Relief' : 'Spherical Horizon'}</span>
          </span>
          <span className="text-slate-500">Drag to Orbit • Scroll to Zoom</span>
        </div>
      </div>
    </div>
  );
};
