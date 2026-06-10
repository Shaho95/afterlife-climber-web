import * as THREE from 'three';
import { GAME_CONFIG } from '../config/GameConfig';
import { BiomeDefinition } from '../config/BiomeConfig';
import { RENDER_ORDER } from '../render/RenderLayers';

export class SceneManager {
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(GAME_CONFIG.camera.fov, 1, 0.1, 120);
  readonly renderer: THREE.WebGLRenderer;
  readonly worldRoot = new THREE.Group();

  private readonly ambientLight = new THREE.AmbientLight(0xffd7a4, 1.45);
  private readonly keyLight = new THREE.DirectionalLight(0xffc17a, 2.2);
  private readonly backgroundPlane: THREE.Mesh;
  private readonly backgroundMaterial: THREE.ShaderMaterial;
  private readonly tempTopColor = new THREE.Color();
  private readonly tempBottomColor = new THREE.Color();
  private readonly tempFogColor = new THREE.Color();
  private readonly blendFromColor = new THREE.Color();
  private readonly blendToColor = new THREE.Color();

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.keyLight.position.set(-3, 8, 6);
    this.scene.add(this.ambientLight, this.keyLight, this.worldRoot);

    this.backgroundMaterial = new THREE.ShaderMaterial({
      depthWrite: false,
      depthTest: false,
      uniforms: {
        topColor: { value: new THREE.Color(0x260711) },
        bottomColor: { value: new THREE.Color(0x7b1d13) }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        void main() {
          gl_FragColor = vec4(mix(bottomColor, topColor, vUv.y), 1.0);
        }
      `
    });

    this.backgroundPlane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.backgroundMaterial);
    this.backgroundPlane.frustumCulled = false;
    this.backgroundPlane.renderOrder = RENDER_ORDER.BACKGROUND - 20;
    this.scene.add(this.backgroundPlane);
    this.scene.fog = new THREE.Fog(0x17070a, 18, 58);
  }

  resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  applyBiome(biome: BiomeDefinition): void {
    if (this.scene.fog instanceof THREE.Fog) {
      this.scene.fog.color.setHex(biome.fogColor);
    }
    this.backgroundMaterial.uniforms.topColor.value.setHex(biome.backgroundTop);
    this.backgroundMaterial.uniforms.bottomColor.value.setHex(biome.backgroundBottom);
  }

  applyBiomeBlend(from: BiomeDefinition, to: BiomeDefinition, transition: number): void {
    this.tempTopColor.lerpColors(
      this.blendFromColor.setHex(from.backgroundTop),
      this.blendToColor.setHex(to.backgroundTop),
      transition
    );
    this.tempBottomColor.lerpColors(
      this.blendFromColor.setHex(from.backgroundBottom),
      this.blendToColor.setHex(to.backgroundBottom),
      transition
    );
    this.tempFogColor.lerpColors(
      this.blendFromColor.setHex(from.fogColor),
      this.blendToColor.setHex(to.fogColor),
      transition
    );

    if (this.scene.fog instanceof THREE.Fog) {
      this.scene.fog.color.copy(this.tempFogColor);
    }
    this.backgroundMaterial.uniforms.topColor.value.copy(this.tempTopColor);
    this.backgroundMaterial.uniforms.bottomColor.value.copy(this.tempBottomColor);
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    this.renderer.dispose();
    this.backgroundPlane.geometry.dispose();
    this.backgroundMaterial.dispose();
  }
}
