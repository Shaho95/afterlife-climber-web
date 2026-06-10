import * as THREE from 'three';

export const RENDER_ORDER = {
  BACKGROUND: -100,
  BACKGROUND_DETAIL: -80,
  PAD: 20,
  PICKUP: 45,
  HAZARD: 55,
  PLAYER: 100
} as const;

export function applyBackgroundRenderProfile(root: THREE.Object3D, renderOrder = RENDER_ORDER.BACKGROUND): void {
  root.renderOrder = renderOrder;
  root.traverse((object) => {
    object.renderOrder = object === root ? renderOrder : 0;
    if (!(object instanceof THREE.Mesh)) {
      return;
    }

    for (const material of materialsFor(object)) {
      material.depthTest = false;
      material.depthWrite = false;
      material.needsUpdate = true;
    }
  });
}

export function applyForegroundRenderProfile(root: THREE.Object3D, renderOrder: number, forceOpaque = false): void {
  root.renderOrder = renderOrder;
  root.frustumCulled = false;
  root.traverse((object) => {
    object.frustumCulled = false;
    if (!(object instanceof THREE.Mesh)) {
      return;
    }

    for (const material of materialsFor(object)) {
      material.transparent = true;
      material.depthTest = false;
      material.depthWrite = false;
      if (forceOpaque && material.opacity < 1) {
        material.opacity = 1;
      }
      material.needsUpdate = true;
    }
  });
}

function materialsFor(mesh: THREE.Mesh): THREE.Material[] {
  const rawMaterials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  return rawMaterials.filter((material): material is THREE.Material => material instanceof THREE.Material);
}
