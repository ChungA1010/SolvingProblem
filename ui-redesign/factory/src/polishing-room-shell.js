import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Surfaces share coordinates with the bench, wall-mounted purchases and installation preview.
export function createPolishingRoomShell({ plaster, mint, trim, metal }) {
  const root = new THREE.Group();
  const floor = -3.05, roof = 7.1, halfWidth = 11.6, rear = -8.44, front = 12;
  const depth = front - rear, midZ = (front + rear) / 2;
  const joint = new THREE.MeshStandardMaterial({ color: 0x849188, roughness: .85 });
  const aluminium = new THREE.MeshStandardMaterial({ color: 0xb5beb7, metalness: .42, roughness: .52 });
  const tile = new THREE.MeshStandardMaterial({ color: 0xe5e6da, roughness: .91 });
  const diffuser = new THREE.MeshStandardMaterial({ color: 0xf7f4e5, emissive: 0xece8d5, emissiveIntensity: .75 });

  function assembly(name, build) {
    const group = new THREE.Group();
    group.name = name;
    const batches = new Map();
    build((material, width, height, depth, x, y, z) => {
      if (!batches.has(material)) batches.set(material, []);
      batches.get(material).push(new THREE.BoxGeometry(width, height, depth).translate(x, y, z));
    });
    for (const [material, shapes] of batches) {
      const mesh = new THREE.Mesh(mergeGeometries(shapes), material);
      mesh.receiveShadow = true;
      group.add(mesh);
      shapes.forEach(shape => shape.dispose());
    }
    root.add(group);
    return group;
  }

  function wall(name, width, count, rearWall = false) {
    return assembly(name, box => {
      const pitch = width / count, split = .55;
      box(joint, width, roof - floor, .14, 0, (roof + floor) / 2, -.07);
      for (let i = 0; i < count; i++) {
        const x = -width / 2 + pitch * (i + .5);
        box(plaster, pitch - .025, roof - split - .035, .075, x, (roof + split) / 2, .035);
        box(mint, pitch - .025, split - floor - .035, .075, x, (split + floor) / 2, .035);
      }
      box(aluminium, width, .18, .12, 0, floor + .09, .065);
      box(trim, width, .09, .105, 0, split, .07);
      box(aluminium, width, .12, .16, 0, roof - .06, .08);
      if (rearWall) {
        // Flush service access with a perforated intake and recessed latch, clear of the decor slots.
        box(joint, 2.1, 2.25, .075, -5.85, 2.55, .088);
        box(tile, 2.035, 2.18, .06, -5.85, 2.55, .132);
        for (let i = 0; i < 8; i++)
          box(aluminium, 1.52, .032, .027, -5.85, 3.23 - .085 * i, .169);
        box(metal, .11, .22, .03, -5.04, 2.08, .166);
      }
    });
  }

  const back = wall('Process room · back wall', halfWidth * 2, 8, true);
  back.position.z = rear;
  const left = wall('Process room · left return', depth, 7);
  left.rotation.y = Math.PI / 2;
  left.position.set(-halfWidth, 0, midZ);
  const right = wall('Process room · right return', depth, 7);
  right.rotation.y = -Math.PI / 2;
  right.position.set(halfWidth, 0, midZ);

  const ceiling = assembly('Process room · closed ceiling', box => {
    const pitchX = halfWidth * 2 / 8, pitchZ = depth / 7;
    box(aluminium, halfWidth * 2, .13, depth, 0, roof + .12, midZ);
    for (let i = 0; i < 8; i++) for (let j = 0; j < 7; j++) {
      const x = -halfWidth + pitchX * (i + .5), z = rear + pitchZ * (j + .5);
      box(tile, pitchX - .035, .07, pitchZ - .035, x, roof + .025, z);
      if ((i === 2 || i === 5) && (j === 1 || j === 4)) {
        box(joint, 1.42, .075, 2.56, x, roof - .033, z);
        box(diffuser, 1.31, .025, 2.45, x, roof - .079, z);
      } else if ((i === 1 || i === 6) && j === 2) {
        box(joint, 1.72, .05, 1.72, x, roof - .048, z);
        for (let k = 0; k < 10; k++)
          box(aluminium, 1.59, .037, .075, x, roof - .088, z - .7 + k * .155);
      }
    }
  });
  // Show the interior normally; lift the near surface when orbiting outside or looking down.
  function updateCamera(camera) {
    ceiling.visible = camera.position.y < roof - .15;
    left.visible = camera.position.x > -halfWidth + .12;
    right.visible = camera.position.x < halfWidth - .12;
  }
  return { root, updateCamera };
}
