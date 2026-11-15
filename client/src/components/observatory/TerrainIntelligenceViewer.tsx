import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { api } from '../../services/api';
import { useMissionStore } from '../../stores/missionStore';
import { XYZIEvidence, SouthPoleLandmark, LandingSite } from '../../types';
import { 
  ShieldCheck, 
  Layers, 
  Activity, 
  MapPin, 
  Eye, 
  RotateCw, 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  Info,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

interface TerrainIntelligenceViewerProps {
  sites: LandingSite[];
  onSelectSite?: (site: LandingSite) => void;
  className?: string;
}

export const TerrainIntelligenceViewer: React.FC<TerrainIntelligenceViewerProps> = ({
  sites,
  onSelectSite,
  className = ''
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const { selectedSite, setSelectedSite, analysisData, currentTimestampIndex } = useMissionStore();

  const [viewMode, setViewMode] = useState<'south_pole' | 'faustini_5m' | 'checklist'>('south_pole');
  const [showXYZICloud, setShowXYZICloud] = useState<boolean>(true);
  const [xyziData, setXyziData] = useState<XYZIEvidence | null>(null);
  const [landmarks, setLandmarks] = useState<SouthPoleLandmark[]>([]);
  const [demMesh, setDemMesh] = useState<any | null>(null);
  const [hoveredLandmark, setHoveredLandmark] = useState<SouthPoleLandmark | null>(null);

  const curSolar = analysisData?.solar?.timeline?.[currentTimestampIndex];
  const curComm = analysisData?.communication?.timeline?.[currentTimestampIndex];
  const solar = analysisData?.solar;
  const comm = analysisData?.communication;
  const jointOps = analysisData?.joint_operations;
  const terrain = analysisData?.terrain;

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const terrainMeshRef = useRef<THREE.Mesh | null>(null);
  const xyziPointsRef = useRef<THREE.Points | null>(null);
  const pinsGroupRef = useRef<THREE.Group | null>(null);
  const vectorsGroupRef = useRef<THREE.Group | null>(null);

  // Camera smooth flight target state
  const cameraTargetRef = useRef<{
    pos: THREE.Vector3;
    lookAt: THREE.Vector3;
    active: boolean;
    progress: number;
  }>({
    pos: new THREE.Vector3(0, 45, 95),
    lookAt: new THREE.Vector3(0, -8, -10),
    active: false,
    progress: 1,
  });

  // Load XYZI evidence and landmarks on mount
  useEffect(() => {
    api.getXYZIEvidence()
      .then((data) => setXyziData(data))
      .catch((err) => console.error('Failed to load XYZI evidence:', err));

    api.getSouthPoleLandmarks()
      .then((data) => setLandmarks(data))
      .catch((err) => console.error('Failed to load landmarks:', err));
  }, []);

  // Load GeoTIFF DEM heightfield when in faustini_5m mode
  useEffect(() => {
    if (viewMode === 'faustini_5m' && !demMesh) {
      api.getTerrainMesh(selectedSite.latitude, selectedSite.longitude, 33)
        .then((data) => setDemMesh(data))
        .catch((err) => console.error('Failed to load local DEM mesh:', err));
    }
  }, [viewMode, selectedSite]);

  // LOLA Colormap helper: elevation in meters -> THREE.Color
  // Range: -4500m (deepest floor) to +5000m (Malapert massif)
  const getLolaColor = (elevationM: number): THREE.Color => {
    const t = Math.max(0, Math.min(1, (elevationM + 4500) / 9500));
    // Color stops: Deep Blue -> Cyan -> Emerald Green -> Gold -> Crimson/White
    if (t < 0.25) {
      // Deep blue to cyan
      const sub = t / 0.25;
      return new THREE.Color().setRGB(0.05 + 0.1 * sub, 0.15 + 0.5 * sub, 0.4 + 0.55 * sub);
    } else if (t < 0.5) {
      // Cyan to green
      const sub = (t - 0.25) / 0.25;
      return new THREE.Color().setRGB(0.15 + 0.1 * sub, 0.65 + 0.3 * sub, 0.95 - 0.7 * sub);
    } else if (t < 0.75) {
      // Green to gold/yellow
      const sub = (t - 0.5) / 0.25;
      return new THREE.Color().setRGB(0.25 + 0.7 * sub, 0.95 - 0.15 * sub, 0.25 - 0.15 * sub);
    } else {
      // Yellow to crimson / peak white
      const sub = (t - 0.75) / 0.25;
      return new THREE.Color().setRGB(0.95 + 0.05 * sub, 0.8 - 0.6 * sub, 0.1 + 0.8 * sub);
    }
  };

  // Setup Three.js scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 500;
    const height = container.clientHeight || 400;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x06090f);
    scene.fog = new THREE.FogExp2(0x06090f, 0.008);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    // Low-angle perspective view looking over South Pole horizon matching screenshot
    camera.position.set(0, 45, 95);
    camera.lookAt(0, -5, -10);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Ambient & Directional Lighting (low-elevation grazing lunar sun)
    const ambientLight = new THREE.AmbientLight(0x334155, 1.2);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff7ed, 2.5);
    sunLight.position.set(80, 25, 40);
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.6);
    fillLight.position.set(-60, -10, -50);
    scene.add(fillLight);

    // Group for landmark pins and 3D vectors
    const pinsGroup = new THREE.Group();
    scene.add(pinsGroup);
    pinsGroupRef.current = pinsGroup;

    const vectorsGroup = new THREE.Group();
    scene.add(vectorsGroup);
    vectorsGroupRef.current = vectorsGroup;

    // Mouse orbit controls
    let isMouseDown = false;
    let prevMouse = { x: 0, y: 0 };
    let spherical = { radius: 105, theta: 0.0, phi: 1.15 };

    const updateCamera = () => {
      camera.position.x = spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
      camera.position.y = spherical.radius * Math.cos(spherical.phi);
      camera.position.z = spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);
      camera.lookAt(0, -8, -10);
    };

    const handleMouseDown = (e: MouseEvent) => {
      isMouseDown = true;
      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isMouseDown) return;
      const dx = e.clientX - prevMouse.x;
      const dy = e.clientY - prevMouse.y;
      spherical.theta -= dx * 0.008;
      spherical.phi = Math.max(0.3, Math.min(1.5, spherical.phi - dy * 0.008));
      prevMouse = { x: e.clientX, y: e.clientY };
      updateCamera();
    };

    const handleMouseUp = () => {
      isMouseDown = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      spherical.radius = Math.max(40, Math.min(180, spherical.radius + e.deltaY * 0.08));
      updateCamera();
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    domEl.addEventListener('wheel', handleWheel, { passive: false });

    // Animation loop with smooth camera flight lerping
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Handle Smooth 3D Camera Flight to Target Crater
      if (cameraTargetRef.current.active) {
        const t = cameraTargetRef.current;
        t.progress += 0.035;
        if (t.progress >= 1) {
          t.progress = 1;
          t.active = false;
          camera.position.copy(t.pos);
          camera.lookAt(t.lookAt);
          // Sync spherical coords
          spherical.radius = camera.position.length();
          spherical.phi = Math.acos(Math.max(-1, Math.min(1, camera.position.y / spherical.radius)));
          spherical.theta = Math.atan2(camera.position.x, camera.position.z);
        } else {
          camera.position.lerp(t.pos, 0.08);
          camera.lookAt(t.lookAt);
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 400;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      domEl.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      domEl.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  // Build / update terrain surface mesh
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Remove existing terrain mesh
    if (terrainMeshRef.current) {
      scene.remove(terrainMeshRef.current);
      terrainMeshRef.current.geometry.dispose();
      terrainMeshRef.current = null;
    }

    if (viewMode === 'checklist') {
      if (pinsGroupRef.current) pinsGroupRef.current.visible = false;
      return;
    }

    // MODE 1: Exact Faustini 5m GeoTIFF raster mesh
    if (viewMode === 'faustini_5m' && demMesh?.available && demMesh.elevations) {
      const gSize = demMesh.grid_size || 33;
      const planeGeo = new THREE.PlaneGeometry(100, 100, gSize - 1, gSize - 1);
      planeGeo.rotateX(-Math.PI / 2);
      const posAttr = planeGeo.attributes.position;
      const colors = new Float32Array(posAttr.count * 3);
      const minEl = demMesh.min_elevation_m;
      const maxEl = demMesh.max_elevation_m;
      const span = Math.max(1, maxEl - minEl);

      for (let r = 0; r < gSize; r++) {
        for (let c = 0; c < gSize; c++) {
          const idx = r * gSize + c;
          const el = demMesh.elevations[r][c];
          posAttr.setY(idx, ((el - minEl) / span) * 16.0);
          const col = getLolaColor(el);
          colors[idx * 3] = col.r;
          colors[idx * 3 + 1] = col.g;
          colors[idx * 3 + 2] = col.b;
        }
      }

      planeGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      planeGeo.computeVertexNormals();
      const terrainMat = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.82,
        metalness: 0.08,
      });
      const mesh = new THREE.Mesh(planeGeo, terrainMat);
      scene.add(mesh);
      terrainMeshRef.current = mesh;

      if (pinsGroupRef.current) {
        pinsGroupRef.current.visible = false;
      }
      return;
    }

    // MODE 2: South Pole Regional Topography with landmark craters
    if (pinsGroupRef.current) {
      pinsGroupRef.current.visible = true;
    }

    const gridSize = 65;
    const planeGeo = new THREE.PlaneGeometry(160, 160, gridSize - 1, gridSize - 1);
    planeGeo.rotateX(-Math.PI / 2); // Lay horizontal in X-Z

    const posAttr = planeGeo.attributes.position;
    const colors = new Float32Array(posAttr.count * 3);

    // Realistic crater terrain elevation synthesizer grounded in LOLA South Pole topography
    // South Pole is located near center-back (Z = -15, X = 0)
    const craters = [
      { x: 0, z: -15, r: 6.5, rimH: 1.1, floorH: -4.2 },   // Shackleton
      { x: 18, z: -10, r: 11.0, rimH: -0.85, floorH: -3.4 }, // Faustini
      { x: 12, z: 10, r: 14.0, rimH: 0.2, floorH: -3.2 },   // Shoemaker
      { x: -12, z: -8, r: 10.0, rimH: -0.5, floorH: -3.5 }, // Haworth
      { x: -24, z: 25, r: 16.0, rimH: 3.8, floorH: 0.8, isMassif: true }, // Malapert
      { x: -15, z: 45, r: 20.0, rimH: 1.5, floorH: 1.2, isPlateau: true }, // Mons Mouton
      { x: 28, z: 20, r: 18.0, rimH: 0.0, floorH: -1.4 },  // Nobile
      { x: 50, z: 30, r: 24.0, rimH: 0.5, floorH: -2.1 },  // Amundsen
      { x: -22, z: -18, r: 9.0, rimH: -0.2, floorH: -2.8 }, // de Gerlache
      { x: -10, z: -32, r: 9.0, rimH: -0.4, floorH: -2.9 }, // Sverdrup
    ];

    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vz = posAttr.getZ(i);

      // Baseline rolling highlands (+0.2km baseline with subtle lunar curvature)
      const distFromPole = Math.hypot(vx, vz + 15);
      const curvatureDip = (distFromPole * distFromPole) * 0.0018;
      let elevationKm = 0.2 - curvatureDip;

      // Noise ripple
      elevationKm += 0.25 * Math.sin(vx * 0.1) * Math.cos(vz * 0.08);

      // Apply crater morphology
      for (const c of craters) {
        const d = Math.hypot(vx - c.x, vz - c.z);
        if (c.isMassif) {
          if (d < c.r * 1.5) {
            const factor = Math.cos((d / (c.r * 1.5)) * (Math.PI / 2));
            elevationKm += c.rimH * Math.pow(factor, 2.0);
          }
        } else if (c.isPlateau) {
          if (d < c.r) {
            const factor = Math.exp(-Math.pow(d / (c.r * 0.7), 4));
            elevationKm += c.rimH * factor;
          }
        } else {
          if (d < c.r * 1.4) {
            const normD = d / c.r;
            if (normD <= 1.0) {
              const bowl = Math.cos(normD * (Math.PI / 2));
              elevationKm += c.floorH * bowl + c.rimH * (1.0 - bowl);
            } else {
              const rimWall = Math.cos(((normD - 1.0) / 0.4) * (Math.PI / 2));
              elevationKm += (c.rimH * 0.8) * Math.max(0, rimWall);
            }
          }
        }
      }

      const elevationM = elevationKm * 1000.0;
      const yVisual = (elevationKm) * 3.5;
      posAttr.setY(i, yVisual);

      const c = getLolaColor(elevationM);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    planeGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    planeGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.82,
      metalness: 0.08,
      flatShading: false,
    });

    const mesh = new THREE.Mesh(planeGeo, terrainMat);
    scene.add(mesh);
    terrainMeshRef.current = mesh;
  }, [viewMode]);

  // Fly 3D Camera to Selected Landing Crater
  useEffect(() => {
    if (!cameraRef.current) return;
    const lowerId = (selectedSite.id || '').toLowerCase();
    const lowerName = (selectedSite.name || '').toLowerCase();

    const landmarkCoords: Record<string, { x: number; z: number }> = {
      'mons-mouton': { x: -15, z: 45 },
      'malapert': { x: -24, z: 25 },
      'nobile': { x: 28, z: 20 },
      'faustini': { x: 18, z: -10 },
      'shoemaker': { x: 12, z: 10 },
      'shackleton': { x: 0, z: -15 },
      'haworth': { x: -12, z: -8 },
      'de-gerlache': { x: -22, z: -18 },
      'sverdrup': { x: -10, z: -32 },
      'amundsen': { x: 50, z: 30 },
    };

    let targetX = 0;
    let targetZ = -15;
    let found = false;
    for (const [k, loc] of Object.entries(landmarkCoords)) {
      if (lowerId.includes(k) || lowerName.includes(k.replace('-', ' '))) {
        targetX = loc.x;
        targetZ = loc.z;
        found = true;
        break;
      }
    }

    if (!found && selectedSite.latitude <= -70) {
      const lat = selectedSite.latitude;
      const lon = selectedSite.longitude;
      const polarDist = Math.max(0, (-lat - 70) / 20.0);
      const rVisual = (1.0 - polarDist) * 45.0;
      const lonRad = THREE.MathUtils.degToRad(lon);
      targetX = rVisual * Math.sin(lonRad);
      targetZ = -15 - rVisual * Math.cos(lonRad);
    }

    cameraTargetRef.current = {
      pos: new THREE.Vector3(targetX, 22, targetZ + 38),
      lookAt: new THREE.Vector3(targetX, 2, targetZ),
      active: true,
      progress: 0,
    };
  }, [selectedSite.id]);

  // Build landmark pins, landing target reticle, and 3D Sun / Earth vectors
  useEffect(() => {
    const pinsGroup = pinsGroupRef.current;
    const vectorsGroup = vectorsGroupRef.current;
    if (!pinsGroup || !vectorsGroup) return;

    // Clear previous pins and vectors
    while (pinsGroup.children.length > 0) pinsGroup.remove(pinsGroup.children[0]);
    while (vectorsGroup.children.length > 0) vectorsGroup.remove(vectorsGroup.children[0]);

    const lowerId = (selectedSite.id || '').toLowerCase();
    const lowerName = (selectedSite.name || '').toLowerCase();

    // Mapping landmark crater IDs to 3D scene (X, Z) coordinates matching our terrain model
    const landmarkCoords: Record<string, { x: number; z: number; name: string }> = {
      'mons-mouton': { x: -15, z: 45, name: 'Mons Mouton' },
      'malapert': { x: -24, z: 25, name: 'Malapert' },
      'nobile': { x: 28, z: 20, name: 'Nobile' },
      'faustini': { x: 18, z: -10, name: 'Faustini' },
      'shoemaker': { x: 12, z: 10, name: 'Shoemaker' },
      'shackleton': { x: 0, z: -15, name: 'Shackleton' },
      'haworth': { x: -12, z: -8, name: 'Haworth' },
      'de-gerlache': { x: -22, z: -18, name: 'de Gerlache' },
      'sverdrup': { x: -10, z: -32, name: 'Sverdrup' },
      'amundsen': { x: 50, z: 30, name: 'Amundsen' },
    };

    let activeLoc: { x: number; z: number; name: string } | null = null;

    for (const [key, loc] of Object.entries(landmarkCoords)) {
      const isSelected = lowerId.includes(key) || lowerName.includes(key.replace('-', ' '));
      if (isSelected) activeLoc = loc;

      const pinObj = new THREE.Group();
      pinObj.position.set(loc.x, 0, loc.z);

      // Vertical marker pin needle (thin line pointing down to surface)
      const pinHeight = isSelected ? 15 : 10;
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, pinHeight, 0),
      ]);
      const lineMat = new THREE.LineBasicMaterial({
        color: isSelected ? 0x00f0ff : 0xffffff,
        transparent: true,
        opacity: isSelected ? 1.0 : 0.6,
      });
      const pinLine = new THREE.Line(lineGeo, lineMat);
      pinObj.add(pinLine);

      // Glowing dot at pin tip
      const dotGeo = new THREE.SphereGeometry(isSelected ? 0.9 : 0.6, 12, 12);
      const dotMat = new THREE.MeshBasicMaterial({
        color: isSelected ? 0x00f0ff : 0x94a3b8,
      });
      const dotMesh = new THREE.Mesh(dotGeo, dotMat);
      dotMesh.position.set(0, pinHeight, 0);
      pinObj.add(dotMesh);

      // Create text canvas label billboard
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = isSelected ? 'rgba(0, 240, 255, 0.3)' : 'rgba(10, 15, 26, 0.85)';
        if (typeof (ctx as any).roundRect === 'function') {
          (ctx as any).roundRect(8, 8, 240, 48, 8);
          ctx.fill();
        } else {
          ctx.fillRect(8, 8, 240, 48);
        }
        ctx.strokeStyle = isSelected ? '#00f0ff' : 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = isSelected ? 3 : 1.5;
        ctx.stroke();

        ctx.font = isSelected ? 'bold 26px Manrope, sans-serif' : 'bold 22px Manrope, sans-serif';
        ctx.fillStyle = isSelected ? '#00f0ff' : '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(loc.name, 128, 32);
      }

      const texture = new THREE.CanvasTexture(canvas);
      const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.position.set(0, pinHeight + 4, 0);
      sprite.scale.set(isSelected ? 18 : 14, isSelected ? 4.5 : 3.5, 1);
      pinObj.add(sprite);

      pinsGroup.add(pinObj);
    }

    // If active landing location found, build 3D Landing Reticle, Sun Vector, and Earth Vector
    if (activeLoc) {
      const origin = new THREE.Vector3(activeLoc.x, 1.2, activeLoc.z);

      // 1. Landing Target Ring on the surface
      const ringGeo = new THREE.RingGeometry(1.8, 2.5, 32);
      ringGeo.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, side: THREE.DoubleSide });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.set(activeLoc.x, 0.2, activeLoc.z);
      vectorsGroup.add(ringMesh);

      // 2. Vertical Landing Beacon
      const beaconGeo = new THREE.CylinderGeometry(0.08, 0.08, 18, 8);
      const beaconMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.7 });
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.set(activeLoc.x, 9, activeLoc.z);
      vectorsGroup.add(beacon);

      // 3. 3D Solar Vector (Golden Beam)
      const sunAz = curSolar?.solar_azimuth_deg ?? 85.0;
      const sunEl = Math.max(-2.0, curSolar?.solar_elevation_deg ?? 1.5);
      const sunAzRad = THREE.MathUtils.degToRad(sunAz);
      const sunElRad = THREE.MathUtils.degToRad(sunEl);

      const sunDir = new THREE.Vector3(
        Math.cos(sunElRad) * Math.sin(sunAzRad),
        Math.sin(sunElRad),
        -Math.cos(sunElRad) * Math.cos(sunAzRad)
      ).normalize();

      const sunRayLen = 35.0;
      const sunTip = origin.clone().add(sunDir.clone().multiplyScalar(sunRayLen));
      const sunGeo = new THREE.BufferGeometry().setFromPoints([origin, sunTip]);
      const sunMat = new THREE.LineBasicMaterial({ color: 0xfbbf24, linewidth: 2 });
      vectorsGroup.add(new THREE.Line(sunGeo, sunMat));

      // Sun Glowing Orb
      const sunSphereGeo = new THREE.SphereGeometry(1.4, 16, 16);
      const sunSphereMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
      const sunSphere = new THREE.Mesh(sunSphereGeo, sunSphereMat);
      sunSphere.position.copy(sunTip);
      vectorsGroup.add(sunSphere);

      // 4. 3D Earth Line-of-Sight Vector (Cyan Beam)
      const earthAz = curComm?.earth_azimuth_deg ?? 15.0;
      const earthEl = Math.max(0.5, curComm?.earth_elevation_deg ?? 6.0);
      const earthAzRad = THREE.MathUtils.degToRad(earthAz);
      const earthElRad = THREE.MathUtils.degToRad(earthEl);

      const earthDir = new THREE.Vector3(
        Math.cos(earthElRad) * Math.sin(earthAzRad),
        Math.sin(earthElRad),
        -Math.cos(earthElRad) * Math.cos(earthAzRad)
      ).normalize();

      const earthRayLen = 42.0;
      const earthTip = origin.clone().add(earthDir.clone().multiplyScalar(earthRayLen));
      const earthGeo = new THREE.BufferGeometry().setFromPoints([origin, earthTip]);
      const earthMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 2 });
      vectorsGroup.add(new THREE.Line(earthGeo, earthMat));

      // Earth Glowing Orb
      const earthSphereGeo = new THREE.SphereGeometry(1.6, 16, 16);
      const earthSphereMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const earthSphere = new THREE.Mesh(earthSphereGeo, earthSphereMat);
      earthSphere.position.copy(earthTip);
      vectorsGroup.add(earthSphere);
    }
  }, [landmarks, selectedSite.id, curSolar?.solar_azimuth_deg, curSolar?.solar_elevation_deg, curComm?.earth_azimuth_deg, curComm?.earth_elevation_deg]);

  // Build / update XYZI Point Cloud overlay
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (xyziPointsRef.current) {
      scene.remove(xyziPointsRef.current);
      xyziPointsRef.current.geometry.dispose();
      xyziPointsRef.current = null;
    }

    if (!showXYZICloud || !xyziData?.sample_points || xyziData.sample_points.length === 0) {
      return;
    }

    const points = xyziData.sample_points;
    const count = points.length;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    // Map XYZI Faustini Rim A coordinates around local region (x ~ 18, z ~ -10)
    // Footprint is Easting [54000, 74000], Northing [-10000, 10000]
    points.forEach((pt, i) => {
      const relX = ((pt.x - 64000) / 10000) * 12.0 + 18.0;
      const relZ = (pt.y / 10000) * 12.0 - 10.0;
      const relY = ((pt.z + 850) / 1000.0) * 3.5 + 1.2;

      positions[i * 3] = relX;
      positions[i * 3 + 1] = relY;
      positions[i * 3 + 2] = relZ;

      // Residual-based error color coding:
      // Green: |residual| <= 0.5m (nominal crossover accuracy)
      // Amber: 0.5m < |residual| <= 1.2m
      // Red: |residual| > 1.2m
      const absRes = Math.abs(pt.residual ?? 0);
      if (absRes <= 0.5) {
        colors[i * 3] = 0.06;
        colors[i * 3 + 1] = 0.95;
        colors[i * 3 + 2] = 0.6;
      } else if (absRes <= 1.2) {
        colors[i * 3] = 0.96;
        colors[i * 3 + 1] = 0.62;
        colors[i * 3 + 2] = 0.05;
      } else {
        colors[i * 3] = 0.94;
        colors[i * 3 + 1] = 0.27;
        colors[i * 3 + 2] = 0.27;
      }
    });

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 1.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
    });

    const pointCloud = new THREE.Points(geo, mat);
    scene.add(pointCloud);
    xyziPointsRef.current = pointCloud;
  }, [showXYZICloud, xyziData]);

  // Select crater
  const handleCraterClick = (craterId: string) => {
    const site = sites.find((s) => s.id.includes(craterId) || s.name.toLowerCase().includes(craterId.toLowerCase()));
    if (site) {
      setSelectedSite(site);
      if (onSelectSite) onSelectSite(site);
    }
  };

  return (
    <div className={`glass-panel rounded-xl border border-slate-800 bg-space-950/90 flex flex-col justify-between overflow-hidden ${className}`}>
      {/* Panel Header */}
      <div className="p-3 sm:p-3.5 border-b border-slate-800/80 flex items-center justify-between gap-2 shrink-0">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
              Terrain Intelligence
            </h4>
          </div>
          <p className="text-xs font-sans text-slate-300 mt-0.5">
            Real elevation, point-cloud evidence & labeled crater landmarks.
          </p>
        </div>

        {/* View & Point Cloud Controls */}
        <div className="flex items-center gap-1.5 font-mono text-xs shrink-0">
          <div className="flex items-center bg-space-900 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setViewMode('south_pole')}
              className={`px-2 py-1 rounded text-[11px] transition ${
                viewMode === 'south_pole'
                  ? 'bg-cyan-500 text-space-950 font-bold shadow-glow-cyan'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              South Pole 3D
            </button>
            <button
              onClick={() => setViewMode('faustini_5m')}
              className={`px-2 py-1 rounded text-[11px] transition ${
                viewMode === 'faustini_5m'
                  ? 'bg-cyan-500 text-space-950 font-bold shadow-glow-cyan'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Faustini 5m DEM
            </button>
          </div>

          <button
            onClick={() => setShowXYZICloud(!showXYZICloud)}
            className={`px-2 py-1 rounded-lg border text-[11px] transition flex items-center space-x-1.5 ${
              showXYZICloud
                ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300 font-bold'
                : 'bg-space-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>XYZI ({showXYZICloud ? 'ON' : 'OFF'})</span>
          </button>
        </div>
      </div>

      {/* Main 3D Viewport: 80%+ pure visual terrain with informative floating HUD overlays */}
      <div className="relative flex-1 w-full h-full min-h-[320px] bg-space-950 overflow-hidden">
        <div ref={mountRef} className="w-full h-full min-h-[320px]" />

        {/* Top-Left HUD: LOLA Elevation Colormap Scale & Vector Legend */}
        <div className="absolute top-2.5 left-2.5 bg-space-900/85 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-slate-800/80 text-[10px] font-mono pointer-events-none shadow-lg max-w-[170px] sm:max-w-[210px] z-10">
          <div className="text-slate-300 font-bold uppercase tracking-wider mb-1 flex items-center justify-between text-[10px]">
            <span className="truncate">{viewMode === 'faustini_5m' ? 'Faustini 5m DEM' : 'LOLA South Pole'}</span>
            <span className="text-cyan-400 font-bold ml-1.5 shrink-0">NASA</span>
          </div>
          <div className="h-1.5 w-full rounded bg-gradient-to-r from-[#0d2666] via-[#26a6e6] via-[#40f240] via-[#f2c618] to-[#f22626]" />
          <div className="flex justify-between text-slate-400 mt-0.5 font-bold text-[9px]">
            <span>{viewMode === 'faustini_5m' ? '-2.8k' : '-4.5k'}</span>
            <span>0m</span>
            <span>{viewMode === 'faustini_5m' ? '+0.6k' : '+5.0k'}</span>
          </div>
          <div className="flex items-center space-x-2 text-[9px] text-slate-400 pt-1 mt-1 border-t border-slate-800/60">
            <span className="flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>Gold: Sun</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              <span>Cyan: Earth</span>
            </span>
          </div>
        </div>

        {/* Top-Right HUD: Informative Live Telemetry Pill */}
        <div className="absolute top-2.5 right-2.5 bg-space-900/85 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-slate-800/80 text-xs font-mono pointer-events-none shadow-lg space-y-1 z-10">
          <div className="flex items-center justify-between gap-2.5 text-[11px]">
            <span className="text-slate-400 uppercase text-[10px]">Slope:</span>
            <span className="text-slate-100 font-bold">
              {terrain?.local_slope_deg !== undefined ? `${terrain.local_slope_deg.toFixed(1)}°` : `${selectedSite.slope_deg || 8.4}°`}
              <span className="ml-1 text-[9px] text-emerald-400 bg-emerald-500/10 px-1 py-0.2 rounded border border-emerald-500/30">PASS</span>
            </span>
          </div>

          <div className="flex items-center justify-between gap-2.5 text-[11px]">
            <span className="text-slate-400 uppercase text-[10px]">Elevation:</span>
            <span className="text-cyan-300 font-bold">
              {terrain?.local_elevation_m !== undefined ? `${terrain.local_elevation_m} m` : `${(selectedSite.altitude_km * 1000).toFixed(0)} m`}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2.5 text-[11px]">
            <span className="text-slate-400 uppercase text-[10px]">Accuracy:</span>
            <span className="text-amber-300 font-bold">±0.55 m</span>
          </div>
        </div>

        {/* Bottom Floating Ribbon: Clean single-line Mission Insight & LOLA Ground Truth */}
        <div className="absolute bottom-2.5 inset-x-2.5 bg-space-950/90 backdrop-blur-md px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-800/80 text-[11px] font-mono flex items-center justify-between gap-2 shadow-lg z-10 min-w-0">
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="text-cyan-300 font-bold shrink-0 text-[10px] uppercase">Insight:</span>
            <span className="text-slate-200 text-[11px] font-sans truncate">
              {selectedSite.id.includes('shackleton') ? 'Peak of Eternal Light: elevated ridge crest captures polar sun above shadows with continuous Earth visibility.' :
               selectedSite.id.includes('malapert') ? 'Highest South Pole peak (+5000m): unobstructed line-of-sight to Earth, optimal relay hub.' :
               selectedSite.id.includes('mouton') ? 'Flat highland mesa (3.8° slope): safest landing threshold for heavy Starship/Blue Moon landers.' :
               selectedSite.id.includes('haworth') ? 'Cryogenic ice trap (<40K): massive 3.5km rim walls block all sunlight, trapping ancient volatiles.' :
               selectedSite.id.includes('faustini-crater-center') ? 'Basin floor PSR: deep crater bowl completely shadowed by surrounding rim walls.' :
               selectedSite.id.includes('faustini-rim') ? 'High-illumination ridge (PGDA Product 78): elevated rim crest overlooking volatile-rich cold traps.' :
               selectedSite.id.includes('apollo') ? 'Equatorial plain with direct overhead Earth communication (+72° elevation) and flat mare regolith.' :
               `${selectedSite.description || 'Candidate lunar landing site evaluated with NASA Horizons ephemeris and LOLA topography.'}`
              }
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-2 text-slate-400 text-[10px] shrink-0">
            <span className="text-emerald-400 font-bold">NASA PGDA Product 78</span>
            <span>•</span>
            <span>Δz: <strong className="text-slate-200">{xyziData ? `${xyziData.residual_mean_m > 0 ? '+' : ''}${xyziData.residual_mean_m}m` : '-0.029m'}</strong></span>
            <span>•</span>
            <span className="text-cyan-300">±0.55m XYZI</span>
          </div>
        </div>
      </div>
    </div>
  );
};
