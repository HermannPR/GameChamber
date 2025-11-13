/**
 * DreamExplorer - Main Entry Point
 *
 * Initializes the 3D engine and loads the first dream experience.
 */

import { DreamEngine } from './engine/core/DreamEngine';
import type { DreamDefinition } from './utils/types';

// ============================================================================
// Main Application
// ============================================================================

class DreamExplorerApp {
  private engine: DreamEngine | null = null;
  private canvas: HTMLCanvasElement;
  private loadingScreen: HTMLElement;

  constructor() {
    this.canvas = document.getElementById('dream-canvas') as HTMLCanvasElement;
    this.loadingScreen = document.getElementById('loading-screen') as HTMLElement;

    if (!this.canvas) {
      throw new Error('Canvas element #dream-canvas not found');
    }

    this.init();
  }

  private async init(): Promise<void> {
    try {
      console.log('🌌 DreamExplorer initializing...');

      // Show loading screen
      this.showLoading('Initializing dream engine...');

      // Create dream engine
      this.engine = new DreamEngine(this.canvas);

      // Load default dream (Forest Walk for now)
      this.showLoading('Loading Forest of Solitude...');
      const dream = await this.loadDream('/examples/meditation/forest-walk.toml');

      // Generate dream world
      this.showLoading('Generating your dream world...');
      await this.engine.loadDream(dream);

      // Hide loading screen
      this.hideLoading();

      // Start the dream
      this.engine.start();

      console.log('✨ Dream started successfully!');

      // Set up event listeners
      this.setupEventListeners();

    } catch (error) {
      console.error('❌ Failed to initialize DreamExplorer:', error);
      this.showError('Failed to load dream. Please refresh the page.');
    }
  }

  private async loadDream(path: string): Promise<DreamDefinition> {
    try {
      // Fetch the TOML file
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`Failed to fetch dream: ${response.statusText}`);
      }

      const tomlText = await response.text();

      // Parse TOML (we'll implement the parser next)
      const { parseTOML } = await import('./validation/TOMLParser');
      const dream = parseTOML(tomlText);

      // Update title in UI
      const titleElement = document.getElementById('dream-title');
      if (titleElement && dream.meta.title) {
        titleElement.textContent = dream.meta.title;
      }

      return dream;

    } catch (error) {
      console.error('Failed to load dream:', error);
      throw error;
    }
  }

  private showLoading(message: string): void {
    this.loadingScreen.classList.remove('hidden');
    const textElement = this.loadingScreen.querySelector('.loading-text');
    if (textElement) {
      textElement.textContent = message;
    }
  }

  private hideLoading(): void {
    setTimeout(() => {
      this.loadingScreen.classList.add('hidden');
    }, 500);
  }

  private showError(message: string): void {
    this.loadingScreen.classList.remove('hidden');
    const textElement = this.loadingScreen.querySelector('.loading-text');
    if (textElement) {
      textElement.textContent = `❌ ${message}`;
      textElement.style.color = '#ff6b6b';
    }
    const loader = this.loadingScreen.querySelector('.loader');
    if (loader) {
      (loader as HTMLElement).style.display = 'none';
    }
  }

  private setupEventListeners(): void {
    // ESC key - pause menu
    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        if (this.engine) {
          this.engine.togglePause();
        }
      }
    });

    // Handle window resize
    window.addEventListener('resize', () => {
      if (this.engine) {
        this.engine.handleResize();
      }
    });

    // Handle visibility change (pause when tab is hidden)
    document.addEventListener('visibilitychange', () => {
      if (this.engine) {
        if (document.hidden) {
          this.engine.pause();
        } else {
          this.engine.resume();
        }
      }
    });

    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
      if (this.engine) {
        this.engine.dispose();
      }
    });
  }
}

// ============================================================================
// Initialize when DOM is ready
// ============================================================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new DreamExplorerApp();
  });
} else {
  new DreamExplorerApp();
}

// ============================================================================
// HMR (Hot Module Replacement) support for development
// ============================================================================

if (import.meta.hot) {
  import.meta.hot.accept(() => {
    console.log('🔄 Hot reloading...');
    window.location.reload();
  });
}
