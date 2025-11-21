import React, { useState, useEffect, useCallback, useRef } from 'react';
  import { Card, Row, Col, Select, Button, Space, Switch, Statistic, Tooltip } from 'antd';
  import { 
    PlayCircleOutlined,
    PauseOutlined,
    GlobalOutlined,
    CloudOutlined,
    ThunderboltOutlined,
    CompassOutlined,
    EyeOutlined,
    EyeInvisibleOutlined
  } from '@ant-design/icons';
  import * as THREE from 'three';
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
  import { useLanguage } from '../contexts/LanguageContext';
  import { useTheme } from '../components/ThemeProvider';
  import './Map.css';
  import LeafletMap from '../components/LeafletMap';

  const { Option } = Select;

// 3D Earth Configuration
const EARTH_RADIUS = 1;

export interface MapLocation {
    id: string;
    name: string;
    coordinates: [number, number];
    type: 'water_source' | 'health_facility' | 'outbreak' | 'safe_zone' | 'monitoring_station' | 'treatment_plant';
    status: 'safe' | 'warning' | 'danger' | 'critical';
    details: {
      description: string;
      lastUpdated: string;
      cases?: number;
      waterQuality?: string;
      phLevel?: number;
      turbidity?: number;
      contamination?: string[];
      population?: number;
      weatherCondition?: string;
      temperature?: number;
      humidity?: number;
      audioGuide?: string;
      category?: string;
    };
  }

  interface WeatherData {
    temperature: number;
    humidity: number;
    condition: string;
    windSpeed: number;
    description: string;
  }

  // Comprehensive data for Northeast India water monitoring and health surveillance
  const mockLocations: MapLocation[] = [
    // Assam Locations
    {
      id: '1',
      name: 'Guwahati Water Treatment Plant',
      coordinates: [26.1445, 91.7362],
      type: 'treatment_plant',
      status: 'safe',
      details: {
        description: 'Primary water treatment facility serving Guwahati metropolitan area with advanced filtration systems',
        lastUpdated: '2024-01-15T10:30:00Z',
        waterQuality: 'Excellent',
        phLevel: 7.2,
        turbidity: 0.5,
        contamination: [],
        population: 1200000,
        category: 'Critical Infrastructure'
      }
    },
    {
      id: '2',
      name: 'Brahmaputra River Monitoring Station',
      coordinates: [26.1833, 91.7500],
      type: 'monitoring_station',
      status: 'warning',
      details: {
        description: 'Real-time water quality monitoring station on Brahmaputra River',
        lastUpdated: '2024-01-15T11:45:00Z',
        waterQuality: 'Fair',
        phLevel: 6.8,
        turbidity: 12.5,
        contamination: ['Industrial runoff', 'Agricultural pesticides'],
        category: 'Environmental Monitoring'
      }
    },
    {
      id: '3',
      name: 'Dispur Medical College Hospital',
      coordinates: [26.1433, 91.7898],
      type: 'health_facility',
      status: 'safe',
      details: {
        description: 'State medical college hospital with specialized water-borne disease treatment unit',
        lastUpdated: '2024-01-15T08:15:00Z',
        cases: 5,
        category: 'Healthcare'
      }
    },
    {
      id: '4',
      name: 'Chandmari Village Cholera Outbreak',
      coordinates: [26.1875, 91.7467],
      type: 'outbreak',
      status: 'critical',
      details: {
        description: 'Active cholera outbreak due to contaminated tube well water',
        lastUpdated: '2024-01-14T16:45:00Z',
        cases: 24,
        contamination: ['E. coli', 'Vibrio cholerae'],
        population: 850,
        category: 'Public Health Emergency'
      }
    },
    // Meghalaya Locations
    {
      id: '5',
      name: 'Shillong Water Supply Station',
      coordinates: [25.5788, 91.8933],
      type: 'water_source',
      status: 'safe',
      details: {
        description: 'Natural spring water source serving Shillong city with minimal treatment required',
        lastUpdated: '2024-01-15T09:20:00Z',
        waterQuality: 'Excellent',
        phLevel: 7.5,
        turbidity: 0.3,
        contamination: [],
        population: 400000,
        category: 'Natural Water Source'
      }
    },
    {
      id: '6',
      name: 'East Khasi Hills Health Center',
      coordinates: [25.5623, 91.8808],
      type: 'health_facility',
      status: 'safe',
      details: {
        description: 'District health center with water quality testing laboratory',
        lastUpdated: '2024-01-15T07:30:00Z',
        cases: 2,
        category: 'Healthcare'
      }
    },
    // Manipur Locations
    {
      id: '7',
      name: 'Loktak Lake Monitoring Station',
      coordinates: [24.5595, 93.7996],
      type: 'monitoring_station',
      status: 'warning',
      details: {
        description: 'Crucial freshwater lake monitoring for pollution and biodiversity',
        lastUpdated: '2024-01-15T12:00:00Z',
        waterQuality: 'Fair',
        phLevel: 6.5,
        turbidity: 8.2,
        contamination: ['Phumdis decay', 'Agricultural runoff'],
        category: 'Environmental Conservation'
      }
    },
    {
      id: '8',
      name: 'Imphal Regional Institute of Medical Sciences',
      coordinates: [24.8170, 93.9368],
      type: 'health_facility',
      status: 'safe',
      details: {
        description: 'Premier medical institute with advanced diagnostic facilities',
        lastUpdated: '2024-01-15T14:20:00Z',
        cases: 1,
        category: 'Healthcare'
      }
    },
    // Mizoram Locations
    {
      id: '9',
      name: 'Aizawl Water Treatment Center',
      coordinates: [23.7271, 92.7176],
      type: 'treatment_plant',
      status: 'safe',
      details: {
        description: 'Hill-station water treatment facility with gravity-fed distribution',
        lastUpdated: '2024-01-15T13:15:00Z',
        waterQuality: 'Good',
        phLevel: 7.0,
        turbidity: 2.1,
        contamination: [],
        population: 320000,
        category: 'Municipal Infrastructure'
      }
    },
    // Nagaland Locations
    {
      id: '10',
      name: 'Kohima District Hospital',
      coordinates: [25.6751, 94.1086],
      type: 'health_facility',
      status: 'safe',
      details: {
        description: 'District hospital with emergency response unit for epidemic outbreaks',
        lastUpdated: '2024-01-15T11:00:00Z',
        cases: 0,
        category: 'Healthcare'
      }
    },
    // Tripura Locations
    {
      id: '11',
      name: 'Agartala Safe Water Zone',
      coordinates: [23.8315, 91.2868],
      type: 'safe_zone',
      status: 'safe',
      details: {
        description: 'Designated safe zone with purified water distribution during emergencies',
        lastUpdated: '2024-01-15T10:45:00Z',
        waterQuality: 'Excellent',
        population: 15000,
        category: 'Emergency Response'
      }
    },
    // Arunachal Pradesh Locations
    {
      id: '12',
      name: 'Itanagar Monitoring Station',
      coordinates: [27.0844, 93.6053],
      type: 'monitoring_station',
      status: 'safe',
      details: {
        description: 'High-altitude water quality monitoring for mountain streams',
        lastUpdated: '2024-01-15T15:30:00Z',
        waterQuality: 'Excellent',
        phLevel: 7.8,
        turbidity: 0.2,
        contamination: [],
        category: 'Mountain Water Systems'
      }
    },
    // Sikkim Location
    {
      id: '13',
      name: 'Gangtok Water Quality Lab',
      coordinates: [27.3314, 88.6138],
      type: 'monitoring_station',
      status: 'safe',
      details: {
        description: 'State-of-the-art water testing laboratory for Himalayan water sources',
        lastUpdated: '2024-01-15T16:00:00Z',
        waterQuality: 'Excellent',
        phLevel: 7.6,
        turbidity: 0.1,
        contamination: [],
        category: 'Research & Testing'
      }
    }
  ];

  const Map: React.FC = () => {
    const { currentLanguage } = useLanguage();
    const { isDark } = useTheme();
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isDirectionsModalVisible, setIsDirectionsModalVisible] = useState(false);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  
  // Three.js refs
  const sceneContainerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const earthRef = useRef<THREE.Mesh | null>(null);
  const starsRef = useRef<THREE.Points | null>(null);
  const markersGroupRef = useRef<THREE.Group>(new THREE.Group());
  const animationFrameRef = useRef<number | undefined>(undefined);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const selectedMarkerRef = useRef<THREE.Object3D | null>(null);    // Filter locations based on type and status
  const filteredLocations = mockLocations.filter(location => {
    const typeMatch = filterType === 'all' || location.type === filterType;
    const statusMatch = filterStatus === 'all' || location.status === filterStatus;
    return typeMatch && statusMatch;
  });

  // Convert lat/lon to 3D position
  const latLonTo3D = useCallback((lat: number, lon: number, radius: number = EARTH_RADIUS) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    const x = -radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);
    return new THREE.Vector3(x, y, z);
  }, []);    // Get status color
    const getStatusColor = useCallback((status: string): string => {
      const colors = {
        safe: '#52c41a',
        warning: '#faad14',
        danger: '#ff7a45',
        critical: '#ff4d4f'
      };
      return colors[status as keyof typeof colors] || '#666';
    }, []);

    // Initialize 3D Earth Scene
  useEffect(() => {
    if (!sceneContainerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x02040a); // Deep dark blue/black background
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    // Set initial position to India (default home)
    const initialPos = latLonTo3D(20.5937, 78.9629, 3.5);
    camera.position.copy(initialPos);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    // Clear container and append
    while (sceneContainerRef.current.firstChild) {
      sceneContainerRef.current.removeChild(sceneContainerRef.current.firstChild);
    }
    sceneContainerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = false;
    controls.minDistance = 1.2;
    controls.maxDistance = 10;
    controls.autoRotate = true; // Auto rotate to show it's alive
    controls.autoRotateSpeed = 0.5;
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
    sunLight.position.set(5, 3, 5);
    scene.add(sunLight);

    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(-5, -3, -5);
    scene.add(pointLight);

    // Earth - Robust Base Material
    const geometry = new THREE.SphereGeometry(EARTH_RADIUS, 64, 64);
    const material = new THREE.MeshStandardMaterial({
      color: 0x1E88E5, // Nice blue color
      roughness: 0.6,
      metalness: 0.1,
    });
    const earth = new THREE.Mesh(geometry, material);
    scene.add(earth);
    earthRef.current = earth;

    // Try to load textures (Enhancement)
    const textureLoader = new THREE.TextureLoader();
    const texPath = 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/';
    
    textureLoader.load(texPath + 'earth_atmos_2048.jpg', (texture) => {
      material.map = texture;
      material.color.setHex(0xffffff); // Reset color to white when texture loads
      material.needsUpdate = true;
    }, undefined, (err) => {
      console.warn('Earth texture failed to load, using fallback color');
    });

    textureLoader.load(texPath + 'earth_normal_2048.jpg', (texture) => {
      material.normalMap = texture;
      material.needsUpdate = true;
    });

    // Stars
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.02,
      transparent: true,
      opacity: 0.8
    });
    const starVertices = [];
    for (let i = 0; i < 3000; i++) {
      const x = (Math.random() - 0.5) * 50;
      const y = (Math.random() - 0.5) * 50;
      const z = (Math.random() - 0.5) * 50;
      if (Math.abs(x) + Math.abs(y) + Math.abs(z) > 5) {
        starVertices.push(x, y, z);
      }
    }
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
    starsRef.current = stars;

    // Add markers group
    scene.add(markersGroupRef.current);
    addLocationMarkers3D();

    // Animation loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!camera || !renderer) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (sceneContainerRef.current && renderer.domElement) {
        sceneContainerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      starGeometry.dispose();
      starMaterial.dispose();
    };
  }, [latLonTo3D]);

    // Add 3D markers for locations
  const addLocationMarkers3D = useCallback(() => {
    // Clear existing markers
    while (markersGroupRef.current.children.length > 0) {
      const child = markersGroupRef.current.children[0];
      markersGroupRef.current.remove(child);
    }

    filteredLocations.forEach(location => {
      const position = latLonTo3D(location.coordinates[0], location.coordinates[1], EARTH_RADIUS);

      // Get color based on status
      const getColor = () => {
        switch(location.status) {
          case 'critical': return 0xff4d4f;
          case 'danger': return 0xff7a45;
          case 'warning': return 0xfaad14;
          default: return 0x52c41a;
        }
      };
      const color = getColor();

      // Create Pin Group
      const group = new THREE.Group();
      group.position.copy(position);
      group.lookAt(0, 0, 0); // Z-axis points to center of earth

      // Pin Head (Sphere)
      const headGeo = new THREE.SphereGeometry(0.025, 16, 16);
      const mat = new THREE.MeshStandardMaterial({ 
        color: color,
        roughness: 0.3,
        metalness: 0.2,
        emissive: color,
        emissiveIntensity: 0.2
      });
      const head = new THREE.Mesh(headGeo, mat);
      // Move head away from surface (local -Z is away from center because Z+ points to center)
      head.position.z = -0.06; 

      // Pin Body (Cone)
      const bodyGeo = new THREE.ConeGeometry(0.015, 0.06, 16);
      const body = new THREE.Mesh(bodyGeo, mat);
      // Cone points Y+ by default. Rotate X +90 to point Z+.
      body.rotation.x = Math.PI / 2;
      body.position.z = -0.03;

      group.add(head);
      group.add(body);

      // Store data
      group.userData = { location, originalScale: 1, isMarker: true };
      head.userData = { parentMarker: group };
      body.userData = { parentMarker: group };

      markersGroupRef.current.add(group);
    });
  }, [filteredLocations, latLonTo3D]);  // Update markers when filters change
  useEffect(() => {
    if (markersGroupRef.current) {
      addLocationMarkers3D();
    }
  }, [addLocationMarkers3D]);  // Smooth camera animation to location
  const focusOnLocation3D = useCallback((location: MapLocation, onComplete?: () => void) => {
    if (!cameraRef.current || !controlsRef.current) return;

    // Stop rotation to allow user to inspect the location
    controlsRef.current.autoRotate = false;

    // Move closer (1.2 radius) to see the location clearly
    const targetPos = latLonTo3D(location.coordinates[0], location.coordinates[1], 1.2);
    const startPos = cameraRef.current.position.clone();
    const duration = 2000; // 2 seconds for smoother transition
    const startTime = Date.now();

    const animateCamera = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease in-out cubic
      const eased = progress < 0.5 
        ? 4 * progress * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      cameraRef.current!.position.lerpVectors(startPos, targetPos, eased);
      cameraRef.current!.lookAt(0, 0, 0);

      if (progress < 1) {
        requestAnimationFrame(animateCamera);
      } else {
        if (onComplete) onComplete();
      }
    };

    animateCamera();
  }, [latLonTo3D]);

  // Reset to orbit view
  const resetToOrbitView = useCallback(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    
    // Reset controls target to center
    controlsRef.current.target.set(0, 0, 0);
    // Disable autoRotate during animation to prevent fighting
    controlsRef.current.autoRotate = false;
    controlsRef.current.update();

    // Reset camera to view India (approx lat: 20.5937, lon: 78.9629)
    const targetPos = latLonTo3D(20.5937, 78.9629, 3.5);
    const startPos = cameraRef.current.position.clone();
    const duration = 1000;
    const startTime = Date.now();

    const animateCamera = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      cameraRef.current!.position.lerpVectors(startPos, targetPos, eased);
      cameraRef.current!.lookAt(0, 0, 0);

      if (progress < 1) {
        requestAnimationFrame(animateCamera);
      } else {
        // Re-enable auto-rotate after animation
        if (controlsRef.current) {
          controlsRef.current.autoRotate = true;
          controlsRef.current.update();
        }
      }
    };

    animateCamera();
    setSelectedLocation(null);
    if (selectedMarkerRef.current) {
      selectedMarkerRef.current.scale.setScalar(1);
      selectedMarkerRef.current = null;
    }
    setViewMode('3d');
  }, [latLonTo3D]);

  // Handle audio toggle
  useEffect(() => {
    if (!audioEnabled) {
      speechSynthesis.cancel();
    }
  }, [audioEnabled]);

  // Play audio guide
  const playAudioGuide = useCallback((location: MapLocation) => {
    if (!audioEnabled) return;
    
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(
      `${location.name}. ${location.details.description}. Current status: ${location.status}.`
    );
    utterance.lang = currentLanguage.code === 'hi' ? 'hi-IN' : 'en-US';
    speechSynthesis.speak(utterance);
  }, [audioEnabled, currentLanguage]);  // Handle marker click
  const handleMarkerClick = useCallback((location: MapLocation) => {
    setSelectedLocation(location);
    
    // Animate 3D camera first, then switch to 2D
    focusOnLocation3D(location, () => {
      setViewMode('2d');
    });
    
    if (audioEnabled) {
      playAudioGuide(location);
    }
  }, [audioEnabled, playAudioGuide, focusOnLocation3D]);

  // Handle canvas click with raycasting
  const handleCanvasClick = useCallback((event: MouseEvent) => {
    if (!cameraRef.current || !sceneRef.current || !rendererRef.current) return;

    const canvas = rendererRef.current.domElement;
    const rect = canvas.getBoundingClientRect();
    
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    
    // Recursive intersection to hit parts of the group
    const intersects = raycasterRef.current.intersectObjects(markersGroupRef.current.children, true);
    
    if (intersects.length > 0) {
      // Find the first object that belongs to a marker group
      const hit = intersects.find(i => i.object.userData.parentMarker || i.object.userData.isMarker);
      
      if (hit) {
        const marker = (hit.object.userData.parentMarker || hit.object) as THREE.Object3D;
        
        if (marker.userData.isMarker && marker.userData.location) {
          // Reset previous selection
          if (selectedMarkerRef.current && selectedMarkerRef.current !== marker) {
            selectedMarkerRef.current.scale.setScalar(1);
          }
          
          // Highlight new selection
          marker.scale.setScalar(1.5);
          selectedMarkerRef.current = marker;
          
          // Update selected location
          handleMarkerClick(marker.userData.location);
        }
      }
    }
  }, [handleMarkerClick]);

  // Attach click listener
  useEffect(() => {
    const canvas = rendererRef.current?.domElement;
    if (!canvas) return;

    canvas.addEventListener('click', handleCanvasClick);
    return () => canvas.removeEventListener('click', handleCanvasClick);
  }, [handleCanvasClick]);  // Open Google Maps directions
  const openDirections = useCallback((destination: MapLocation) => {
    const [lat, lon] = destination.coordinates;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
    window.open(url, '_blank');
  }, []);    // Mock weather data fetch
    useEffect(() => {
      const fetchWeatherData = () => {
        setWeatherData({
          temperature: 24,
          humidity: 78,
          condition: 'Partly Cloudy',
          windSpeed: 12,
          description: 'Pleasant weather conditions for field monitoring'
        });
      };

      fetchWeatherData();
    }, []);

    return (
      <div className="map-container" style={{ 
        height: '100vh', 
        background: '#000',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* 3D Scene Container - Always mounted for smooth transitions */}
        <div 
          ref={sceneContainerRef} 
          className="scene-container"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 1,
            opacity: viewMode === '3d' ? 1 : 0,
            transition: 'opacity 1.5s ease-in-out',
            pointerEvents: viewMode === '3d' ? 'auto' : 'none'
          }}
        />

        {/* 2D Leaflet Map - Fades in */}
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 2,
            opacity: viewMode === '2d' ? 1 : 0,
            transition: 'opacity 1.5s ease-in-out',
            pointerEvents: viewMode === '2d' ? 'auto' : 'none'
        }}>
          {selectedLocation && (
            <LeafletMap 
              center={selectedLocation.coordinates}
              zoom={12}
              locations={filteredLocations}
              onSwitchTo3D={() => {
                setViewMode('3d');
                // Start zooming out the 3D camera immediately
                resetToOrbitView();
                // Wait for fade out before unmounting
                setTimeout(() => {
                  setSelectedLocation(null);
                }, 1500);
              }}
            />
          )}
        </div>

        {/* Header Controls */}
        <div className="map-header" style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(10px)',
          padding: '15px 20px',
          borderBottom: `1px solid rgba(255, 255, 255, 0.2)`
        }}>
          <Row gutter={[12, 12]} align="middle">
            <Col xs={24} sm={4} md={3}>
              <h2 style={{ 
                margin: 0, 
                color: '#fff',
                fontSize: '16px',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <GlobalOutlined style={{ color: '#1890ff' }} /> Global Health
              </h2>
            </Col>
            
            <Col xs={12} sm={3} md={2}>
              <Button 
                icon={<CompassOutlined />}
                onClick={resetToOrbitView}
                size="middle"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#fff',
                  width: '100%',
                  borderRadius: '6px'
                }}
              >
                Reset
              </Button>
            </Col>
            
            <Col xs={12} sm={5} md={4}>
              <Select
                value={filterType}
                onChange={setFilterType}
                style={{ width: '100%' }}
                placeholder="Type"
                size="middle"
                dropdownStyle={{ background: 'rgba(0, 0, 0, 0.9)', border: '1px solid rgba(255, 255, 255, 0.2)' }}
              >
                <Option value="all">All Types</Option>
                <Option value="water_source">Water Source</Option>
                <Option value="health_facility">Health Facility</Option>
                <Option value="outbreak">Outbreak</Option>
                <Option value="safe_zone">Safe Zone</Option>
                <Option value="monitoring_station">Monitoring Station</Option>
                <Option value="treatment_plant">Treatment Plant</Option>
              </Select>
            </Col>
            
            <Col xs={12} sm={5} md={4}>
              <Select
                value={filterStatus}
                onChange={setFilterStatus}
                style={{ width: '100%' }}
                placeholder="Status"
                size="middle"
                dropdownStyle={{ background: 'rgba(0, 0, 0, 0.9)', border: '1px solid rgba(255, 255, 255, 0.2)' }}
              >
                <Option value="all">All Statuses</Option>
                <Option value="safe">Safe</Option>
                <Option value="warning">Warning</Option>
                <Option value="danger">Danger</Option>
                <Option value="critical">Critical</Option>
              </Select>
            </Col>
            
            <Col xs={12} sm={4} md={3}>
              <Button
                onClick={() => setAudioEnabled(!audioEnabled)}
                icon={audioEnabled ? <PlayCircleOutlined /> : <PauseOutlined rotate={90} />}
                style={{
                  background: audioEnabled ? 'rgba(24, 144, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                  border: `1px solid ${audioEnabled ? '#1890ff' : 'rgba(255, 255, 255, 0.2)'}`,
                  color: audioEnabled ? '#40a9ff' : '#fff',
                  width: '100%',
                  borderRadius: '6px'
                }}
              >
                {audioEnabled ? 'Audio ON' : 'Audio OFF'}
              </Button>
            </Col>
            
            <Col xs={24} sm={24} md={8}>
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button 
                  icon={<CompassOutlined />} 
                  onClick={() => selectedLocation && openDirections(selectedLocation)}
                  disabled={!selectedLocation}
                  style={{
                    background: selectedLocation ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: selectedLocation ? '#fff' : 'rgba(255, 255, 255, 0.3)',
                    borderRadius: '6px'
                  }}
                >
                  Directions
                </Button>
                <Button 
                  icon={<PlayCircleOutlined />} 
                  onClick={() => selectedLocation && playAudioGuide(selectedLocation)}
                  disabled={!selectedLocation || !audioEnabled}
                  style={{
                    background: (selectedLocation && audioEnabled) ? 'rgba(24, 144, 255, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${(selectedLocation && audioEnabled) ? '#1890ff' : 'rgba(255, 255, 255, 0.2)'}`,
                    color: (selectedLocation && audioEnabled) ? '#fff' : 'rgba(255, 255, 255, 0.3)',
                    borderRadius: '6px'
                  }}
                >
                  Play Guide
                </Button>
              </Space>
            </Col>
          </Row>
        </div>



        {/* Sidebar Toggle Button */}
        <Button
          icon={isSidebarCollapsed ? <EyeOutlined /> : <EyeInvisibleOutlined />}
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          style={{
            position: 'absolute',
            top: '100px',
            right: isSidebarCollapsed ? '20px' : '330px',
            zIndex: 1001,
            background: 'rgba(0, 0, 0, 0.8)',
            borderColor: 'rgba(255, 255, 255, 0.3)',
            color: '#fff',
            transition: 'right 0.3s ease'
          }}
        />

        {/* Locations Sidebar */}
        <div style={{
          position: 'absolute',
          top: '100px',
          right: isSidebarCollapsed ? '-320px' : '20px',
          bottom: '20px',
          width: '300px',
          maxHeight: 'calc(100vh - 120px)',
          background: 'rgba(0, 0, 0, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '12px',
          padding: '20px',
          backdropFilter: 'blur(10px)',
          zIndex: 1000,
          overflowY: 'auto',
          transition: 'right 0.3s ease'
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#fff', fontSize: '1.1rem' }}>
            Locations ({filteredLocations.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredLocations.map(location => (
              <div
                key={location.id}
                onClick={() => handleMarkerClick(location)}
                style={{
                  padding: '14px',
                  background: selectedLocation?.id === location.id 
                    ? 'rgba(79, 195, 247, 0.2)' 
                    : 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${selectedLocation?.id === location.id 
                    ? '#4fc3f7' 
                    : 'rgba(255, 255, 255, 0.1)'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  if (selectedLocation?.id !== location.id) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedLocation?.id !== location.id) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <h4 style={{ margin: 0, color: '#fff', fontSize: '0.95rem' }}>
                    {location.name}
                  </h4>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#fff',
                    background: getStatusColor(location.status)
                  }}>
                    {location.status}
                  </span>
                </div>
                <p style={{ margin: '8px 0', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.85rem' }}>
                  {location.details.description}
                </p>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  marginTop: '8px',
                  paddingTop: '8px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  {location.details.cases && (
                    <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.8rem' }}>
                      🚨 {location.details.cases} cases
                    </span>
                  )}
                  <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.75rem' }}>
                    {new Date(location.details.lastUpdated).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Left Info Panel (Weather + Stats) */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxWidth: '300px'
        }}>
          {/* Weather Widget */}
          {weatherData && (
            <Card
              size="small"
              style={{
                background: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#fff'
              }}
              title={
                <Space>
                  <CloudOutlined style={{ color: '#4fc3f7' }} />
                  <span style={{ color: '#fff' }}>Weather</span>
                </Space>
              }
            >
              <div style={{ color: '#fff' }}>
                <p style={{ margin: '5px 0' }}>
                  <ThunderboltOutlined /> {weatherData.temperature}°C | 💧 {weatherData.humidity}%
                </p>
                <p style={{ margin: '5px 0', fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                  {weatherData.description}
                </p>
              </div>
            </Card>
          )}

          {/* Statistics Panel */}
          <Card
            size="small"
            style={{
              background: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#fff'
            }}
            title={<span style={{ color: '#fff' }}>Monitoring Statistics</span>}
          >
            <Row gutter={[16, 8]}>
              <Col span={12}>
                <Statistic
                  title={<span style={{ color: 'rgba(255,255,255,0.7)' }}>Total</span>}
                  value={filteredLocations.length}
                  valueStyle={{ color: '#1890ff', fontSize: '16px' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title={<span style={{ color: 'rgba(255,255,255,0.7)' }}>Critical</span>}
                  value={filteredLocations.filter(l => l.status === 'critical').length}
                  valueStyle={{ color: '#ff4d4f', fontSize: '16px' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title={<span style={{ color: 'rgba(255,255,255,0.7)' }}>Safe</span>}
                  value={filteredLocations.filter(l => l.status === 'safe').length}
                  valueStyle={{ color: '#52c41a', fontSize: '16px' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title={<span style={{ color: 'rgba(255,255,255,0.7)' }}>Outbreaks</span>}
                  value={filteredLocations.filter(l => l.type === 'outbreak').length}
                  valueStyle={{ color: '#faad14', fontSize: '16px' }}
                />
              </Col>
            </Row>
          </Card>
        </div>

        {/* Instructions */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          right: isSidebarCollapsed ? '20px' : '360px',
          zIndex: 1000,
          padding: '12px 16px',
          background: 'rgba(0, 0, 0, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '8px',
          color: 'rgba(255, 255, 255, 0.8)',
          fontSize: '0.85rem',
          backdropFilter: 'blur(10px)',
          transition: 'right 0.3s ease'
        }}>
          <p style={{ margin: 0 }}>
            <strong style={{ color: '#4fc3f7' }}>Click markers</strong> on globe • Drag to rotate • Scroll to zoom
          </p>
        </div>


      </div>
    );
  };

  export default Map;