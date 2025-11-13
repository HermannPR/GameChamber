/**
 * DreamEngine - Core 3D rendering engine
 *
 * Main engine class that manages Three.js scene, camera, renderer,
 * and orchestrates all systems.
 */

import * as THREE from 'three';
import type { DreamDefinition, DreamState } from '../../utils/types';

export class DreamEngine {
  // Three.js core
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private clock: THREE.Clock;

  // State
  private dreamDefinition: DreamDefinition | null = null;
  private state: DreamState;
  private isRunning: boolean = false;
  private isPaused: boolean = false;

  // Canvas
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.clock = new THREE.Clock();

    // Initialize state
    this.state = {
      elapsed_time: 0,
      player_position: [0, 1.7, 0],
      triggered_moments: new Set(),
    };

    // Initialize Three.js renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
    });

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;

    // Initialize scene
    this.scene = new THREE.Scene();

    // Initialize camera
    this.camera = new THREE.PerspectiveCamera(
      75,  // FOV
      window.innerWidth / window.innerHeight,  // Aspect
      0.1,  // Near
      1000  // Far
    );

    console.log('✅ DreamEngine initialized');
  }

  /**
   * Load a dream definition and build the world
   */
  async loadDream(dream: DreamDefinition): Promise<void> {
    console.log('📋 Loading dream:', dream.meta.title);

    this.dreamDefinition = dream;

    // Clear existing scene
    this.clearScene();

    // Set up camera from dream definition
    this.setupCamera(dream);

    // Build the world
    await this.buildWorld(dream);

    console.log('✅ Dream loaded successfully');
  }

  /**
   * Set up camera based on dream definition
   */
  private setupCamera(dream: DreamDefinition): void {
    const cameraConfig = dream.camera;

    // Set initial position
    const [x, y, z] = cameraConfig.start_position;
    this.camera.position.set(x, y, z);

    // Set initial rotation if provided
    if (cameraConfig.start_rotation) {
      const [rx, ry, rz] = cameraConfig.start_rotation;
      this.camera.rotation.set(rx, ry, rz);
    }

    // Update state
    this.state.player_position = [x, y, z];

    console.log(`📷 Camera positioned at (${x}, ${y}, ${z})`);
  }

  /**
   * Build the world from dream definition
   */
  private async buildWorld(dream: DreamDefinition): Promise<void> {
    console.log('🏗️ Building world...');

    // 1. Set up lighting
    this.setupLighting(dream);

    // 2. Set up sky/background
    this.setupSky(dream);

    // 3. Create terrain (for now, simple plane)
    this.createBasicTerrain(dream);

    // 4. Add some basic geometry for testing
    this.addTestGeometry();

    console.log('✅ World built');
  }

  /**
   * Set up lighting based on atmosphere config
   */
  private setupLighting(dream: DreamDefinition): void {
    const atmosphere = dream.atmosphere;

    // Ambient light
    const ambientIntensity = atmosphere.ambient_intensity ?? 0.4;
    const ambientLight = new THREE.AmbientLight(0xffffff, ambientIntensity);
    this.scene.add(ambientLight);

    // Directional light (sun)
    const sunIntensity = atmosphere.sun_intensity ?? 0.6;
    const sunLight = new THREE.DirectionalLight(0xffffff, sunIntensity);

    // Position based on time of day
    const timeOfDay = atmosphere.time ?? 'day';
    switch (timeOfDay) {
      case 'dawn':
        sunLight.position.set(-50, 20, -50);
        sunLight.color.setHex(0xffd4a3);  // Warm orange
        break;
      case 'day':
        sunLight.position.set(0, 100, 0);
        sunLight.color.setHex(0xffffff);  // White
        break;
      case 'dusk':
      case 'golden_hour':
        sunLight.position.set(50, 20, 50);
        sunLight.color.setHex(0xffa566);  // Golden orange
        break;
      case 'twilight':
        sunLight.position.set(80, 10, 80);
        sunLight.color.setHex(0xff6633);  // Deep orange
        break;
      case 'night':
        sunLight.position.set(0, -50, 0);
        sunLight.color.setHex(0x4466ff);  // Moon blue
        sunLight.intensity *= 0.2;  // Much dimmer
        break;
      default:
        sunLight.position.set(0, 100, 0);
    }

    // Enable shadows
    sunLight.castShadow = true;
    sunLight.shadow.camera.near = 0.1;
    sunLight.shadow.camera.far = 500;
    sunLight.shadow.camera.left = -100;
    sunLight.shadow.camera.right = 100;
    sunLight.shadow.camera.top = 100;
    sunLight.shadow.camera.bottom = -100;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;

    this.scene.add(sunLight);

    console.log('💡 Lighting set up:', timeOfDay);
  }

  /**
   * Set up sky/background
   */
  private setupSky(dream: DreamDefinition): void {
    const atmosphere = dream.atmosphere;
    const backgroundColor = dream.world.backgroundColor ?? '#87CEEB';

    if (atmosphere.sky?.type === 'gradient' && atmosphere.sky.colors) {
      // Gradient sky (we'll implement proper gradient later)
      // For now, just use the first color
      this.scene.background = new THREE.Color(atmosphere.sky.colors[0]);
    } else {
      // Solid color
      this.scene.background = new THREE.Color(backgroundColor);
    }

    // Add fog if enabled
    if (atmosphere.fog?.enabled) {
      const fogColor = new THREE.Color(atmosphere.fog.color ?? backgroundColor);
      const fogDensity = atmosphere.fog.density ?? 0.0015;
      this.scene.fog = new THREE.FogExp2(fogColor, fogDensity * 0.01);
      console.log('🌫️ Fog enabled');
    }
  }

  /**
   * Create basic terrain (placeholder for now)
   */
  private createBasicTerrain(dream: DreamDefinition): void {
    const world = dream.world;
    const width = world.width ?? 200;
    const depth = world.depth ?? 200;

    // Create a simple ground plane
    const geometry = new THREE.PlaneGeometry(width, depth, 100, 100);
    const material = new THREE.MeshStandardMaterial({
      color: 0x4a7c59,  // Forest green
      roughness: 0.8,
      metalness: 0.2,
    });

    const ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = -Math.PI / 2;  // Rotate to horizontal
    ground.receiveShadow = true;

    this.scene.add(ground);

    console.log(`🌍 Terrain created: ${width}x${depth}m`);
  }

  /**
   * Add test geometry for development
   */
  private addTestGeometry(): void {
    // Add a few test cubes
    const cubeGeometry = new THREE.BoxGeometry(2, 2, 2);
    const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });

    for (let i = 0; i < 5; i++) {
      const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
      cube.position.set(
        (Math.random() - 0.5) * 50,
        1,
        (Math.random() - 0.5) * 50
      );
      cube.castShadow = true;
      cube.receiveShadow = true;
      this.scene.add(cube);
    }

    console.log('🎲 Test geometry added');
  }

  /**
   * Clear the scene
   */
  private clearScene(): void {
    while (this.scene.children.length > 0) {
      const object = this.scene.children[0];
      this.scene.remove(object);

      // Dispose geometries and materials
      if (object instanceof THREE.Mesh) {
        object.geometry?.dispose();
        if (Array.isArray(object.material)) {
          object.material.forEach(m => m.dispose());
        } else {
          object.material?.dispose();
        }
      }
    }
  }

  /**
   * Start the render loop
   */
  start(): void {
    if (this.isRunning) {
      console.warn('DreamEngine is already running');
      return;
    }

    this.isRunning = true;
    this.isPaused = false;
    this.clock.start();
    this.animate();

    console.log('▶️ DreamEngine started');
  }

  /**
   * Main animation loop
   */
  private animate = (): void => {
    if (!this.isRunning) return;

    requestAnimationFrame(this.animate);

    if (this.isPaused) return;

    // Get delta time
    const deltaTime = this.clock.getDelta();
    this.state.elapsed_time += deltaTime;

    // Update systems
    this.update(deltaTime);

    // Render
    this.renderer.render(this.scene, this.camera);
  };

  /**
   * Update all systems
   */
  private update(deltaTime: number): void {
    // Update camera/controls (will implement proper controls later)
    // For now, just a simple orbit for testing
    const time = this.state.elapsed_time;
    this.camera.position.x = Math.sin(time * 0.1) * 10;
    this.camera.position.z = Math.cos(time * 0.1) * 10;
    this.camera.lookAt(0, 0, 0);
  }

  /**
   * Pause the dream
   */
  pause(): void {
    this.isPaused = true;
    console.log('⏸️ Paused');
  }

  /**
   * Resume the dream
   */
  resume(): void {
    this.isPaused = false;
    console.log('▶️ Resumed');
  }

  /**
   * Toggle pause state
   */
  togglePause(): void {
    if (this.isPaused) {
      this.resume();
    } else {
      this.pause();
    }
  }

  /**
   * Handle window resize
   */
  handleResize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    console.log(`📐 Resized to ${width}x${height}`);
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.isRunning = false;
    this.clearScene();
    this.renderer.dispose();
    console.log('🗑️ DreamEngine disposed');
  }
}
