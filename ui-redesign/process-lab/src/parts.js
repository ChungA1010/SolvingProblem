// Console parts shared by the equipment of the process lab: cabinet, touch screen, dial, quarter-turn valve,
// push button, signal tower, and the glow of hot parts. Each returns what the equipment needs to move it every frame.
const HEAT = [[500, 0x200000, 0], [700, 0x8a1500, 0.22], [900, 0xff3c00, 0.55], [1100, 0xff8a1a, 0.85], [1200, 0xffb347, 1]];   // glow by temperature (C)

export function makeParts(kit) {
  const { THREE, mat, add, small, ghost, decal, cyl, cube, box, facing, plate, label, control, info } = kit, root = kit.root;
  const cold = new THREE.Color(), hot = new THREE.Color();

  /** Strength (0..1) of the glow at a temperature in C; the colour is written into `into`. */
  function heat(celsius, into) {
    if (celsius <= HEAT[0][0]) { into.setHex(0x000000); return 0; }
    for (let i = 1; i < HEAT.length; i++) if (celsius <= HEAT[i][0]) {
      const k = (celsius - HEAT[i - 1][0]) / (HEAT[i][0] - HEAT[i - 1][0]);
      into.copy(cold.setHex(HEAT[i - 1][1])).lerp(hot.setHex(HEAT[i][1]), k);
      return HEAT[i - 1][2] + (HEAT[i][2] - HEAT[i - 1][2]) * k;
    }
    into.setHex(HEAT.at(-1)[1]); return 1;
  }

  /** Painted console standing on the floor. `front` is the z of its front face. */
  function cabinet(x, front, { w = 0.40, h = 1.50, d = 0.46 } = {}) {
    add(box(w, h, d, 0.012), mat.paint, root, [x, h / 2, front - d / 2]);
    add(box(w + 0.01, 0.08, d + 0.01, 0.006), mat.graphite, root, [x, 0.04, front - d / 2]);
  }

  /** Touch screen that the page draws on (1024 x 640). Registers the info part 'hmi'. */
  function screen(x, y, z, w = 0.31) {
    const g = new THREE.Group(); g.position.set(x, y, z); root.add(g);
    add(box(w + 0.03, w * 0.626 + 0.032, 0.02, 0.006), mat.anodized, g, [0, 0, 0.008]);
    const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 640;
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 8;
    decal(add(new THREE.PlaneGeometry(w, w * 0.626), new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }), g, [0, 0, 0.0186])).receiveShadow = false;
    info('hmi', g, new THREE.Vector3(x, y, z + 0.02));
    return { canvas, refresh() { texture.needsUpdate = true; }, at: [x, y, z + 0.02] };
  }

  /** Rotary dial with a printed scale (270 degrees from min to max) and a readout above it. Registers the control `name`.
   *  `format` writes a value; `tick` (on the scale) and `readout` (above the dial) can each write it differently. */
  function dial(name, x, y, z, { min, max, major, minor, unit, perPixel, wheel, title = 'SET', format = v => String(Math.round(v)), tick = format, readout = v => `${format(v)} ${unit}` }) {
    const g = new THREE.Group(); g.position.set(x, y, z); root.add(g);
    plate(0.19, 0.19, (c, w) => {
      c.fillStyle = '#f3f4f6'; c.fillRect(0, 0, w, w); c.translate(w / 2, w / 2); c.strokeStyle = '#1f2933'; c.fillStyle = '#1f2933'; c.textAlign = 'center'; c.textBaseline = 'middle';
      for (let t = min; t <= max + 1e-9; t += minor) {
        const a = (-225 + (t - min) / (max - min) * 270) * Math.PI / 180, big = Math.abs(t / major - Math.round(t / major)) < 1e-6, r1 = w * 0.36, r2 = w * (big ? 0.42 : 0.395);
        c.lineWidth = big ? w * 0.014 : w * 0.008; c.beginPath(); c.moveTo(Math.cos(a) * r1, Math.sin(a) * r1); c.lineTo(Math.cos(a) * r2, Math.sin(a) * r2); c.stroke();
        if (big) { c.font = `600 ${w * 0.058}px "Segoe UI", Arial, sans-serif`; c.fillText(tick(t), Math.cos(a) * w * 0.455, Math.sin(a) * w * 0.455 + (Math.abs(t - min) < 1e-6 || Math.abs(t - max) < 1e-6 ? w * 0.03 : 0)); }
      }
      c.font = `700 ${w * 0.058}px "Segoe UI", Arial, sans-serif`; c.fillText(unit, 0, w * 0.43);
    }, g, [0, 0, 0.0012]);
    const knob = new THREE.Group(); knob.position.z = 0.002; g.add(knob);
    facing(add(cyl(0.05, 0.054, 0.012, 40), mat.anodized, knob, [0, 0, 0.006]), 'z');
    facing(add(cyl(0.038, 0.042, 0.034, 40), mat.aluminum, knob, [0, 0, 0.029]), 'z');
    small(cube(0.006, 0.03, 0.004), mat.red, knob, [0, 0.026, 0.047]);
    control(name, g, new THREE.Vector3(x, y, z + 0.05), { drag: 'slide', perPixel, wheel });
    const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 80;
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    decal(add(new THREE.PlaneGeometry(0.13, 0.0406), new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }), root, [x, y + 0.127, z + 0.0012]));
    let shown = null;
    return {
      at: [x, y, z + 0.05],
      set(value) {
        knob.rotation.z = (135 - (value - min) / (max - min) * 270) * Math.PI / 180;
        if (value === shown) return;
        shown = value;
        const c = canvas.getContext('2d'); c.fillStyle = '#0f172a'; c.fillRect(0, 0, 256, 80);
        c.fillStyle = '#7dd3fc'; c.font = '600 22px "Segoe UI", Arial, sans-serif'; c.textBaseline = 'middle'; c.textAlign = 'left'; c.fillText(title, 12, 42);
        c.fillStyle = '#f8fafc'; c.font = '700 40px "Segoe UI", Arial, sans-serif'; c.textAlign = 'right'; c.fillText(readout(value), 246, 43);
        texture.needsUpdate = true;
      },
    };
  }

  /** Quarter-turn valve with a lever, a printed name and a lamp. A click opens or closes it. Registers the control `name`. */
  function valve(name, text, x, y, z, lever = mat.anodized) {
    const g = new THREE.Group(); g.position.set(x + 0.03, y, z); root.add(g);
    facing(add(cyl(0.03, 0.03, 0.04, 6), mat.stainless, g, [0, 0, 0.02]), 'z');
    facing(small(cyl(0.012, 0.012, 0.024, 14), mat.satin, g, [0, 0, 0.05]), 'z');
    const arm = new THREE.Group(); arm.position.z = 0.066; g.add(arm);
    add(box(0.13, 0.026, 0.014, 0.005), lever, arm, [0.04, 0, 0]);
    const lamp = ghost(facing(add(cyl(0.009, 0.009, 0.004, 14), new THREE.MeshStandardMaterial({ color: 0x1f8a4c, emissive: 0x22c55e, emissiveIntensity: 0.05, roughness: 0.4 }), root, [x + 0.155, y, z + 0.002]), 'z'));
    plate(0.085, 0.05, label([text], { bg: '#f3f4f6', fg: '#1f2933', size: 0.62 }), root, [x - 0.115, y, z + 0.0012]);
    control(name, g, new THREE.Vector3(x + 0.05, y, z + 0.07), { click: true });
    let angle = 0;
    return { at: [x + 0.06, y, z + 0.07], set(open, dt) { angle += ((open ? Math.PI / 2 : 0) - angle) * Math.min(1, dt * 10); arm.rotation.z = angle; lamp.material.emissiveIntensity = open ? 1.6 : 0.05; } };
  }

  /** Lit push button with a printed name. A click presses it. Registers the control `name`. */
  function button(name, text, x, y, z, color = 0x22c55e) {
    const g = new THREE.Group(); g.position.set(x, y, z); root.add(g);
    facing(add(cyl(0.034, 0.034, 0.012, 28), mat.anodized, g, [0, 0, 0.006]), 'z');
    const cap = facing(add(cyl(0.026, 0.026, 0.016, 28), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.08, roughness: 0.35 }), g, [0, 0, 0.02]), 'z');
    cap.userData.fixed = true;
    plate(0.11, 0.04, label([text], { bg: '#f3f4f6', fg: '#1f2933', size: 0.6 }), root, [x, y - 0.062, z + 0.0012]);
    let down = 0;                                              // s the cap still has to stay in
    control(name, g, new THREE.Vector3(x, y, z + 0.03), { click: true, press() { down = 0.25; } });   // the cap goes in under the finger, whether the machine answers the press or not
    return { at: [x, y, z + 0.03], set(lit, dt, pressed) { if (pressed) down = 0.25; down = Math.max(0, down - dt); cap.position.z = 0.02 - 0.007 * Math.min(1, down / 0.1); cap.material.emissiveIntensity = lit ? 1.5 : 0.08; } };
  }

  /** Signal tower: green (running), yellow (waiting), red (alarm, blinking). Registers the info part 'tower'. */
  function tower(x, y, z) {
    const g = new THREE.Group(); g.position.set(x, y, z); root.add(g);
    add(cyl(0.03, 0.034, 0.012, 20), mat.anodized, g, [0, 0.006, 0]); add(cyl(0.011, 0.011, 0.06, 12), mat.stainless, g, [0, 0.04, 0]);
    const lamps = ['#22c55e', '#f5b301', '#ef4444'].map((color, i) => add(cyl(0.028, 0.028, 0.046, 24), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.05, roughness: 0.3, transparent: true, opacity: 0.94 }), g, [0, 0.095 + i * 0.05, 0]));
    for (const lamp of lamps) { lamp.userData.fixed = true; lamp.castShadow = false; }
    add(cyl(0.029, 0.029, 0.01, 24), mat.anodized, g, [0, 0.248, 0]);
    info('tower', g, new THREE.Vector3(x, y + 0.145, z));
    const level = [0.05, 0.05, 0.05];
    return { set(state, dt, clock) { lamps.forEach((lamp, i) => { const want = i === state ? (i === 2 ? 1.6 + Math.sin(clock * 10) : 1.5) : 0.04; level[i] += (want - level[i]) * Math.min(1, dt * 10); lamp.material.emissiveIntensity = level[i]; }); } };
  }

  return { heat, cabinet, screen, dial, valve, button, tower };
}
