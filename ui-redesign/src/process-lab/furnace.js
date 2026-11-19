// Vertical oxidation furnace of the process lab, drawn cut open at the front so the boat and the heater can be seen.
// Proportions of a 300 mm vertical furnace; it is not a drawing of a real tool, and the label VF-01 is made up.
// Parts: boat (lifted into the tube), setpoint (temperature dial), n2 / o2 / h2o (quarter-turn gas valves) are controls;
// tube, heater, hmi, tower and exhaust only show their card. State comes from dist/process-lab/oxidation-model.js.
const DECK = 1.30, TRAVEL = 1.06, FLANGE_DOWN = 0.30;         // top of the loading area, travel of the boat elevator, flange height when lowered
const W = 1.10, D = 1.20, TOP = 2.72;                         // footprint and height of the frame
const CONSOLE = { x: 0.80, front: 0.54 };
const VALVES = { n2: 0.80, o2: 0.64, h2o: 0.48 };             // height of each valve on the console
const HEAT = [[500, 0x200000, 0], [700, 0x8a1500, 0.22], [900, 0xff3c00, 0.55], [1100, 0xff8a1a, 0.85], [1200, 0xffb347, 1]];   // glow of hot parts by temperature

export function buildFurnace(kit) {
  const { THREE, mat, std, add, small, ghost, decal, cyl, cube, box, facing, tube, plate, label, shade, control, info } = kit, root = kit.root;
  const glowColor = new THREE.Color(), cold = new THREE.Color(), hot = new THREE.Color();
  /** Colour and strength (0..1) of the glow at a temperature in C. */
  function heat(celsius) {
    if (celsius <= HEAT[0][0]) return 0;
    for (let i = 1; i < HEAT.length; i++) if (celsius <= HEAT[i][0]) {
      const k = (celsius - HEAT[i - 1][0]) / (HEAT[i][0] - HEAT[i - 1][0]);
      glowColor.copy(cold.setHex(HEAT[i - 1][1])).lerp(hot.setHex(HEAT[i][1]), k);
      return HEAT[i - 1][2] + (HEAT[i][2] - HEAT[i - 1][2]) * k;
    }
    glowColor.setHex(HEAT.at(-1)[1]); return 1;
  }

  // ----- frame: plinth, posts, panels, the deck between the loading area and the heater -----
  add(box(W + 0.04, 0.12, D + 0.04, 0.01), mat.graphite, root, [0, 0.06, 0]);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(box(0.06, TOP - 0.12, 0.06, 0.006), mat.paint, root, [sx * (W / 2 - 0.03), (TOP + 0.12) / 2, sz * (D / 2 - 0.03)]);
  add(box(W - 0.12, TOP - 0.12, 0.02, 0.004), mat.paint, root, [0, (TOP + 0.12) / 2, -D / 2 + 0.02]);
  add(box(0.02, TOP - 0.12, D - 0.12, 0.004), mat.paint, root, [-W / 2 + 0.02, (TOP + 0.12) / 2, 0]);
  ghost(add(cube(0.008, TOP - 0.12, D - 0.12), mat.glass, root, [W / 2 - 0.02, (TOP + 0.12) / 2, 0]));               // viewing window on the right
  add(box(W + 0.04, 0.08, D + 0.04, 0.01), mat.paint, root, [0, TOP + 0.04, 0]);
  add(box(W, 0.14, 0.04, 0.006), mat.paint, root, [0, TOP - 0.07, D / 2 - 0.02]);
  add(box(W, 0.07, 0.04, 0.006), mat.paint, root, [0, DECK + 0.005, D / 2 - 0.02]);
  plate(0.52, 0.075, label(['VF-01', 'VERTICAL FURNACE · OXIDATION'], { bg: '#24272c', fg: '#e9edf3', size: 0.82 }), root, [-0.24, TOP - 0.07, D / 2 + 0.001]);
  const deckShape = new THREE.Shape();
  deckShape.moveTo(-W / 2 + 0.06, -D / 2 + 0.06); deckShape.lineTo(W / 2 - 0.06, -D / 2 + 0.06); deckShape.lineTo(W / 2 - 0.06, D / 2 - 0.06); deckShape.lineTo(-W / 2 + 0.06, D / 2 - 0.06); deckShape.closePath();
  const opening = new THREE.Path(); opening.absarc(0, 0, 0.285, 0, Math.PI * 2, true); deckShape.holes.push(opening);
  const deck = add(new THREE.ExtrudeGeometry(deckShape, { depth: 0.04, bevelEnabled: false, curveSegments: 48 }), mat.stainless);
  deck.rotation.x = -Math.PI / 2; deck.position.y = DECK - 0.04;
  shade(W + 1.5, D + 0.9, 0.2, 0.0008, 0, 0.42);

  // ----- heater: insulation shell (back half), coil rings, the quartz process tube inside -----
  const heater = new THREE.Group(); root.add(heater);
  add(new THREE.CylinderGeometry(0.40, 0.40, 1.22, 48, 1, true, Math.PI / 2, Math.PI), std(0xefece4, 0, 0.92, { side: THREE.DoubleSide }), heater, [0, DECK + 0.63, 0]);
  for (const sx of [-1, 1]) add(cube(0.03, 1.22, 0.02), mat.stainless, heater, [sx * 0.405, DECK + 0.63, 0]);
  add(cyl(0.42, 0.42, 0.04), mat.stainless, heater, [0, DECK + 1.26, 0]);
  const coilMaterial = std(0x5a544c, 0.4, 0.6, { emissive: 0xff5a14, emissiveIntensity: 0 });
  const coils = new THREE.InstancedMesh(new THREE.TorusGeometry(0.30, 0.011, 10, 72), coilMaterial, 21), m4 = new THREE.Matrix4(), flat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
  for (let i = 0; i < 21; i++) { m4.compose(new THREE.Vector3(0, DECK + 0.12 + i * 0.045, 0), flat, new THREE.Vector3(1, 1, 1)); coils.setMatrixAt(i, m4); }
  ghost(coils); root.add(coils);                                                                                    // the boat is picked through the coils
  info('heater', heater, new THREE.Vector3(-0.30, DECK + 0.9, 0.05));

  const quartz = std(0xe9f1f6, 0, 0.08, { transparent: true, opacity: 0.2, depthWrite: false, side: THREE.DoubleSide });
  ghost(add(cyl(0.215, 0.215, 0.94, 48, true), quartz, root, [0, DECK + 0.51, 0]));                                  // wall of the tube: see-through to the pointer too
  const tubeTop = new THREE.Group(); root.add(tubeTop);
  add(new THREE.SphereGeometry(0.215, 48, 20, 0, Math.PI * 2, 0, Math.PI / 2), std(0xe9f1f6, 0, 0.08, { transparent: true, opacity: 0.32, depthWrite: false }), tubeTop, [0, DECK + 0.98, 0]).castShadow = false;
  small(new THREE.TorusGeometry(0.222, 0.012, 10, 64), mat.quartz, tubeTop, [0, DECK + 0.035, 0]).rotation.x = Math.PI / 2;
  small(cyl(0.03, 0.03, 0.06, 20), mat.quartz, tubeTop, [0, DECK + 1.215, 0]);
  info('tube', tubeTop, new THREE.Vector3(0, DECK + 1.1, 0.16));
  const inner = ghost(add(cyl(0.205, 0.205, 0.93, 40, true), new THREE.MeshBasicMaterial({ color: 0xff7a1a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.BackSide }), root, [0, DECK + 0.51, 0]));
  const ember = new THREE.PointLight(0xff8a3a, 0, 3.2, 1.6); ember.position.set(0, DECK + 0.6, 0.2); root.add(ember);

  // ----- boat on its elevator: flange that closes the tube, heat barrier, quartz boat with 25 wafers -----
  const lift = new THREE.Group(); lift.position.y = FLANGE_DOWN; root.add(lift);
  add(cyl(0.27, 0.27, 0.03, 56), mat.stainless, lift, [0, -0.015, 0]);
  small(new THREE.TorusGeometry(0.236, 0.006, 8, 56), mat.rubber, lift, [0, 0.003, 0]).rotation.x = Math.PI / 2;
  add(cyl(0.16, 0.17, 0.16, 40), mat.ceramic, lift, [0, 0.08, 0]);
  for (const y of [0.045, 0.085, 0.125]) small(cyl(0.176, 0.176, 0.005, 40), mat.quartz, lift, [0, y, 0]);
  for (const y of [0.172, 0.885]) small(cyl(0.168, 0.168, 0.012, 48), mat.quartz, lift, [0, y, 0]);
  for (const deg of [-90, -155, -25]) { const a = deg * Math.PI / 180; small(cyl(0.008, 0.008, 0.70, 12), mat.quartz, lift, [Math.cos(a) * 0.16, 0.53, Math.sin(a) * 0.16]); }
  const waferMaterial = std(0x8d97a6, 0.55, 0.28, { emissive: 0xff5a14, emissiveIntensity: 0 });
  const wafers = new THREE.InstancedMesh(cyl(0.150, 0.150, 0.0026, 64), waferMaterial, 25);
  for (let i = 0; i < 25; i++) { m4.makeTranslation(0, 0.20 + i * 0.026, 0); wafers.setMatrixAt(i, m4); }
  wafers.castShadow = true; wafers.userData.fixed = true; lift.add(wafers);                                          // its colour follows the oxide, not the hover
  // The stack is mostly gaps between thin wafers. An unseen cylinder around it gives the pointer something to hold.
  const grip = add(cyl(0.156, 0.156, 0.66, 32), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }), lift, [0, 0.512, 0]);
  grip.castShadow = grip.receiveShadow = false; grip.userData.fixed = true;
  add(box(0.09, 0.05, 0.46, 0.006), mat.anodized, lift, [0, -0.055, -0.25]);                                         // carriage arm
  add(box(0.18, 0.13, 0.07, 0.008), mat.anodized, lift, [0, -0.055, -0.455]);
  add(box(0.12, DECK - 0.16, 0.07, 0.006), mat.aluminum, root, [0, (DECK + 0.08) / 2, -0.505]);                       // elevator column and lead screw
  small(cyl(0.012, 0.012, DECK - 0.2, 12), mat.stainless, root, [0.10, (DECK + 0.12) / 2, -0.50]);
  control('boat', lift, new THREE.Vector3(0, FLANGE_DOWN + 0.5, 0.16), { drag: 'lift', travel: TRAVEL, value: view => view?.boat ?? 0 });

  // ----- operator console: screen, temperature dial, three gas valves -----
  const c = CONSOLE;
  add(box(0.40, 1.50, 0.46, 0.012), mat.paint, root, [c.x, 0.75, c.front - 0.23]);
  add(box(0.41, 0.08, 0.47, 0.006), mat.graphite, root, [c.x, 0.04, c.front - 0.23]);
  const hmi = new THREE.Group(); hmi.position.set(c.x, 1.30, c.front); root.add(hmi);
  add(box(0.34, 0.226, 0.02, 0.006), mat.anodized, hmi, [0, 0, 0.008]);
  const screenCanvas = document.createElement('canvas'); screenCanvas.width = 1024; screenCanvas.height = 640;
  const screenTexture = new THREE.CanvasTexture(screenCanvas); screenTexture.colorSpace = THREE.SRGBColorSpace; screenTexture.anisotropy = 8;
  decal(add(new THREE.PlaneGeometry(0.31, 0.194), new THREE.MeshBasicMaterial({ map: screenTexture, toneMapped: false }), hmi, [0, 0, 0.0186])).receiveShadow = false;
  info('hmi', hmi, new THREE.Vector3(c.x, 1.30, c.front + 0.02));

  const dial = new THREE.Group(); dial.position.set(c.x, 1.03, c.front); root.add(dial);
  plate(0.19, 0.19, (x, w, h) => {                                                                                    // scale of the dial: 600 to 1200 C over 270 degrees
    x.fillStyle = '#f3f4f6'; x.fillRect(0, 0, w, h); x.translate(w / 2, h / 2); x.strokeStyle = '#1f2933'; x.fillStyle = '#1f2933'; x.textAlign = 'center'; x.textBaseline = 'middle';
    for (let t = 600; t <= 1200; t += 50) {
      const a = (-225 + (t - 600) / 600 * 270) * Math.PI / 180, major = t % 200 === 0, r1 = w * 0.36, r2 = w * (major ? 0.42 : 0.395);
      x.lineWidth = major ? w * 0.014 : w * 0.008; x.beginPath(); x.moveTo(Math.cos(a) * r1, Math.sin(a) * r1); x.lineTo(Math.cos(a) * r2, Math.sin(a) * r2); x.stroke();
      if (major) { x.font = `600 ${w * 0.062}px "Segoe UI", Arial, sans-serif`; x.fillText(String(t), Math.cos(a) * w * 0.455, Math.sin(a) * w * 0.455 + (t === 600 || t === 1200 ? w * 0.03 : 0)); }
    }
    x.font = `700 ${w * 0.06}px "Segoe UI", Arial, sans-serif`; x.fillText('°C', 0, w * 0.43);
  }, dial, [0, 0, 0.0012]);
  const knob = new THREE.Group(); knob.position.z = 0.002; dial.add(knob);
  facing(add(cyl(0.05, 0.054, 0.012, 40), mat.anodized, knob, [0, 0, 0.006]), 'z');
  facing(add(cyl(0.038, 0.042, 0.034, 40), mat.aluminum, knob, [0, 0, 0.029]), 'z');
  small(cube(0.006, 0.03, 0.004), mat.red, knob, [0, 0.026, 0.047]);                                                  // pointer
  control('setpoint', dial, new THREE.Vector3(c.x, 1.03, c.front + 0.05), { drag: 'slide', perPixel: 1.5, wheel: 5 });
  const readCanvas = document.createElement('canvas'); readCanvas.width = 256; readCanvas.height = 80;
  const readTexture = new THREE.CanvasTexture(readCanvas); readTexture.colorSpace = THREE.SRGBColorSpace;
  decal(add(new THREE.PlaneGeometry(0.11, 0.0344), new THREE.MeshBasicMaterial({ map: readTexture, toneMapped: false }), root, [c.x, 1.157, c.front + 0.0012]));   // between the screen and the dial
  let shownSet = null;
  function drawSet(value) {
    const x = readCanvas.getContext('2d'); x.fillStyle = '#0f172a'; x.fillRect(0, 0, 256, 80);
    x.fillStyle = '#7dd3fc'; x.font = '600 26px "Segoe UI", Arial, sans-serif'; x.textBaseline = 'middle'; x.textAlign = 'left'; x.fillText('SET', 16, 42);
    x.fillStyle = '#f8fafc'; x.font = '700 46px "Segoe UI", Arial, sans-serif'; x.textAlign = 'right'; x.fillText(`${value} °C`, 242, 43);
    readTexture.needsUpdate = true; shownSet = value;
  }
  drawSet(700);

  const valves = {};
  for (const [name, text, lever] of [['n2', 'N₂', mat.anodized], ['o2', 'O₂', mat.blue], ['h2o', 'H₂O', mat.red]]) {
    const y = VALVES[name], g = new THREE.Group(); g.position.set(c.x + 0.03, y, c.front); root.add(g);
    facing(add(cyl(0.03, 0.03, 0.04, 6), mat.stainless, g, [0, 0, 0.02]), 'z');
    facing(small(cyl(0.012, 0.012, 0.024, 14), mat.satin, g, [0, 0, 0.05]), 'z');
    const arm = new THREE.Group(); arm.position.z = 0.066; g.add(arm);
    add(box(0.13, 0.026, 0.014, 0.005), lever, arm, [0.04, 0, 0]);
    const lamp = ghost(facing(add(cyl(0.009, 0.009, 0.004, 14), new THREE.MeshStandardMaterial({ color: 0x1f8a4c, emissive: 0x22c55e, emissiveIntensity: 0.05, roughness: 0.4 }), root, [c.x + 0.155, y, c.front + 0.002]), 'z'));
    plate(0.085, 0.05, label([text], { bg: '#f3f4f6', fg: '#1f2933', size: 0.62 }), root, [c.x - 0.115, y, c.front + 0.0012]);
    control(name, g, new THREE.Vector3(c.x + 0.05, y, c.front + 0.07), { click: true });
    valves[name] = { arm, lamp, angle: 0 };
  }
  tube([[c.x - 0.08, 1.50, 0.20], [c.x - 0.08, 1.60, 0.20], [0.50, 1.60, 0.10], [0.30, DECK + 0.07, 0.03]], 0.009, mat.stainless, root, 32).castShadow = false;   // gas line to the injector

  // ----- signal tower and exhaust on the roof -----
  const tower = new THREE.Group(); tower.position.set(-0.42, TOP + 0.08, 0.45); root.add(tower);
  add(cyl(0.03, 0.034, 0.012, 20), mat.anodized, tower, [0, 0.006, 0]); add(cyl(0.011, 0.011, 0.06, 12), mat.stainless, tower, [0, 0.04, 0]);
  const lamps = ['#22c55e', '#f5b301', '#ef4444'].map((color, i) => add(cyl(0.028, 0.028, 0.046, 24), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.05, roughness: 0.3, transparent: true, opacity: 0.94 }), tower, [0, 0.095 + i * 0.05, 0]));
  for (const lampMesh of lamps) { lampMesh.userData.fixed = true; lampMesh.castShadow = false; }
  add(cyl(0.029, 0.029, 0.01, 24), mat.anodized, tower, [0, 0.248, 0]);
  info('tower', tower, new THREE.Vector3(-0.42, TOP + 0.22, 0.45));
  const exhaust = new THREE.Group(); exhaust.position.set(0, TOP + 0.08, -0.22); root.add(exhaust);
  add(cyl(0.075, 0.075, 0.30, 32), mat.stainless, exhaust, [0, 0.15, 0]); add(cyl(0.095, 0.095, 0.016, 32), mat.satin, exhaust, [0, 0.30, 0]); add(cyl(0.095, 0.095, 0.016, 32), mat.satin, exhaust, [0, 0.008, 0]);
  info('exhaust', exhaust, new THREE.Vector3(0, TOP + 0.3, -0.22));

  const lampLevel = [0.05, 0.05, 0.05], silicon = new THREE.Color(0x8d97a6), film = new THREE.Color();
  let coilLevel = 0;
  /** `view`: boat (0..1), tube and wafer temperature (C), controls { setpoint, n2, o2, h2o }, growing, filmColor [r, g, b], alarm. */
  function update(view, dt, clock) {
    lift.position.y = FLANGE_DOWN + TRAVEL * view.boat;
    kit.partAnchor('boat').set(0, lift.position.y + 0.5, 0.16);
    const level = heat(view.tube);
    coilLevel += (level - coilLevel) * Math.min(1, dt * 6);
    coilMaterial.emissive.copy(level > 0 ? glowColor : cold.setHex(0x000000)); coilMaterial.emissiveIntensity = coilLevel * 2.4;
    inner.material.opacity = coilLevel * 0.28; ember.intensity = coilLevel * 2.2; if (level > 0) { inner.material.color.copy(glowColor); ember.color.copy(glowColor); }
    const glow = heat(view.wafer);                                                    // hot wafers glow; the film colour shows once they have cooled
    waferMaterial.emissive.copy(glow > 0 ? glowColor : cold.setHex(0x000000)); waferMaterial.emissiveIntensity = glow * 1.6;
    film.setRGB(view.filmColor[0] / 255, view.filmColor[1] / 255, view.filmColor[2] / 255, THREE.SRGBColorSpace);
    waferMaterial.color.copy(silicon).lerp(film, view.filmStrength);
    if (view.controls.setpoint !== shownSet) drawSet(view.controls.setpoint);
    knob.rotation.z = (135 - (view.controls.setpoint - 600) / 600 * 270) * Math.PI / 180;
    for (const [name, v] of Object.entries(valves)) {
      const open = view.controls[name] ? 1 : 0;
      v.angle += (open * Math.PI / 2 - v.angle) * Math.min(1, dt * 10); v.arm.rotation.z = v.angle;
      v.lamp.material.emissiveIntensity = open ? 1.6 : 0.05;
    }
    const state = view.alarm ? 2 : view.growing ? 0 : 1;
    lamps.forEach((lampMesh, i) => { const want = i === state ? (i === 2 ? 1.6 + Math.sin(clock * 10) : 1.5) : 0.04; lampLevel[i] += (want - lampLevel[i]) * Math.min(1, dt * 10); lampMesh.material.emissiveIntensity = lampLevel[i]; });
  }

  return {
    update, screenCanvas, refreshScreen() { screenTexture.needsUpdate = true; },
    views: { home: [[3.0, 1.95, 5.0], [0.22, 1.36, 0.05]], boat: [[1.55, 1.05, 2.9], [0, 0.78, 0]], tube: [[1.75, 2.25, 3.0], [0, 1.9, 0]], panel: [[1.2, 1.0, 2.3], [c.x, 0.9, c.front]], screen: [[c.x, 1.32, c.front + 0.85], [c.x, 1.30, c.front]] },
    layout: {
      deck: DECK, travel: TRAVEL, flangeDown: FLANGE_DOWN, boatGrip: [0, 0.52, 0.15],     // boatGrip is measured from the flange: add the flange height
      dial: [c.x, 1.03, c.front + 0.05], hmi: [c.x, 1.30, c.front + 0.02],
      valves: Object.fromEntries(Object.entries(VALVES).map(([name, y]) => [name, [c.x + 0.06, y, c.front + 0.07]])),
    },
  };
}
