import { BIOMES, BiomeDefinition, BiomeId } from '../config/BiomeConfig';

export interface BiomeVisualState {
  active: BiomeDefinition;
  from: BiomeDefinition;
  to: BiomeDefinition;
  transition: number;
}

export class BiomeManager {
  private current: BiomeDefinition = BIOMES[0];
  private debugBiome: BiomeDefinition | null = null;
  private readonly transitionRange = 90;

  constructor() {
    const params = new URLSearchParams(window.location.search);
    const debugBiomeId = params.get('debugBiome') as BiomeId | null;
    this.debugBiome = BIOMES.find((biome) => biome.id === debugBiomeId) ?? null;
  }

  update(height: number): BiomeDefinition {
    if (this.debugBiome) {
      this.current = this.debugBiome;
      return this.current;
    }

    for (let i = BIOMES.length - 1; i >= 0; i -= 1) {
      if (height >= BIOMES[i].startHeight) {
        this.current = BIOMES[i];
        return this.current;
      }
    }

    return this.current;
  }

  getVisualState(height: number): BiomeVisualState {
    const active = this.update(height);

    if (this.debugBiome) {
      return {
        active,
        from: active,
        to: active,
        transition: 0
      };
    }

    for (let i = 1; i < BIOMES.length; i += 1) {
      const boundary = BIOMES[i].startHeight;
      const start = boundary - this.transitionRange;

      if (height >= start && height < boundary) {
        const raw = (height - start) / this.transitionRange;
        const transition = raw * raw * (3 - 2 * raw);

        return {
          active,
          from: BIOMES[i - 1],
          to: BIOMES[i],
          transition
        };
      }
    }

    return {
      active,
      from: active,
      to: active,
      transition: 0
    };
  }

  get activeBiome(): BiomeDefinition {
    return this.current;
  }
}
