import * as T from "three";
// Procedural upper-body character. All geometry and textures are local and original.
const safe = (value, fallback) =>
  /^#[a-f0-9]{6}$/i.test(value || "") ? value : fallback;
function material(color, roughness = 0.82) {
  return new T.MeshStandardMaterial({ color, roughness, metalness: 0 });
}
function oval(parent, mat, pos, scale, segments = 24) {
  const mesh = new T.Mesh(new T.SphereGeometry(1, segments, 16), mat);
  mesh.position.set(...pos);
  mesh.scale.set(...scale);
  parent.add(mesh);
  return mesh;
}
function rod(parent, mat, a, b, r1, r2 = r1) {
  const va = new T.Vector3(...a),
    vb = new T.Vector3(...b),
    v = vb.clone().sub(va);
  const mesh = new T.Mesh(new T.CylinderGeometry(r2, r1, v.length(), 20), mat);
  mesh.position.copy(va.add(vb).multiplyScalar(0.5));
  mesh.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), v.normalize());
  parent.add(mesh);
  return mesh;
}
function line(parent, mat, points, r = 0.006) {
  const curve = new T.CatmullRomCurve3(points.map((p) => new T.Vector3(...p)));
  const mesh = new T.Mesh(new T.TubeGeometry(curve, 20, r, 6, false), mat);
  parent.add(mesh);
  return mesh;
}
function surfaceHair(parent, mat, kind) {
  const short = ["buzz", "crew", "lowfade", "highfade", "curly"].includes(kind),
    height = kind === "buzz" ? 0.003 : kind === "afro" ? 0.04 : 0.014;
  // A fitted scalp cap, clipped over the brow instead of covering the face.
  const cap = new T.Mesh(
    new T.SphereGeometry(1, 32, 20, 0, Math.PI * 2, 0, short ? 1.18 : 1.38),
    mat,
  );
  cap.position.set(0, 1.64, -0.004);
  cap.scale.set(0.145, 0.202 + height, 0.14);
  parent.add(cap);
  if (["lowfade", "crew", "mullet"].includes(kind)) {
    for (const side of [-1, 1])
      oval(parent, mat, [side * 0.137, 1.725, -0.04], [0.021, 0.068, 0.1]);
  }
  if (["curly", "afro", "twists"].includes(kind)) {
    const amount = kind === "afro" ? 64 : kind === "twists" ? 36 : 42;
    for (let i = 0; i < amount; i++) {
      const phi = i * 2.39996,
        theta = Math.acos(1 - (i + 0.5) / amount) * 0.68;
      let x = Math.sin(theta) * Math.cos(phi) * 0.14,
        z = Math.sin(theta) * Math.sin(phi) * 0.14,
        y = 1.69 + Math.cos(theta) * 0.22;
      const mesh = oval(
        parent,
        mat,
        [x, y, z],
        [
          kind === "afro" ? 0.031 : 0.023,
          kind === "twists" ? 0.054 : 0.028,
          0.026,
        ],
        12,
      );
      if (kind === "twists") mesh.rotation.z = phi * 0.15;
    }
  }
  if (kind === "braids") {
    for (let n = -3; n <= 3; n++) {
      const x = n * 0.034;
      line(
        parent,
        mat,
        [
          [x, 1.84, 0.1],
          [x, 1.91, 0.025],
          [x, 1.87, -0.1],
          [x, 1.73, -0.15],
        ],
        0.013,
      );
    }
  }
  if (kind === "long") {
    oval(parent, mat, [0, 1.69, -0.12], [0.145, 0.17, 0.06]);
    oval(parent, mat, [0, 1.66, -0.195], [0.065, 0.057, 0.055]);
    line(
      parent,
      mat,
      [
        [0, 1.65, -0.2],
        [0.015, 1.52, -0.23],
        [0.01, 1.39, -0.22],
      ],
      0.035,
    );
  }
  if (kind === "mullet")
    oval(parent, mat, [0, 1.55, -0.13], [0.123, 0.09, 0.034]);
}
function addTattoo(group, mat, side) {
  // Ink follows the forward surface of the exposed forearm; visible from default camera.
  const sign = side;
  const x = sign * 0.323;
  for (let i = 0; i < 3; i++) {
    const y = 0.75 - i * 0.075;
    line(
      group,
      mat,
      [
        [x - sign * 0.031, y, 0.066],
        [x, y + 0.023, 0.09],
        [x + sign * 0.026, y, 0.078],
        [x, y - 0.029, 0.097],
        [x - sign * 0.031, y, 0.066],
      ],
      0.0036,
    );
  }
  line(
    group,
    mat,
    [
      [x, 0.81, 0.083],
      [x + sign * 0.016, 0.72, 0.09],
      [x - sign * 0.014, 0.63, 0.09],
      [x + sign * 0.015, 0.57, 0.075],
    ],
    0.004,
  );
  for (let n = 0; n < 5; n++)
    line(
      group,
      mat,
      [
        [x - sign * 0.032, 0.57 + n * 0.038, 0.075],
        [x + sign * 0.027, 0.59 + n * 0.038, 0.079],
      ],
      0.0023,
    );
}
function model(person, kit) {
  const a = person.appearance || {},
    group = new T.Group(),
    body = a.body === "slim" ? 0.88 : a.body === "strong" ? 1.13 : 1;
  const skin = material(safe(a.skin, "#bc8660")),
    hair = material(safe(a.hairColor, "#241e1a")),
    lip = material("#925e51"),
    black = material("#192127"),
    white = material("#ece8df"),
    iris = material(safe(a.eyeColor, "#694829")),
    jersey = material(safe(kit.primary, "#d8dee1")),
    trim = material(safe(kit.secondary, "#18222c"));
  // Anatomical neck, jaw, cheeks and head.
  rod(group, skin, [0, 1.29, 0], [0, 1.52, 0], 0.073, 0.067);
  oval(group, skin, [0, 1.64, 0], [0.141, 0.191, 0.132], 32);
  oval(group, skin, [0, 1.535, 0.022], [0.108, 0.087, 0.104]);

  for (const side of [-1, 1]) {
    oval(group, skin, [side * 0.143, 1.63, -0.012], [0.027, 0.046, 0.019]);
    oval(
      group,
      material("#a96d51"),
      [side * 0.157, 1.63, 0.0],
      [0.006, 0.023, 0.01],
    );
    // Natural small eyes, lid ridges and irises.
    oval(group, white, [side * 0.056, 1.68, 0.113], [0.031, 0.014, 0.012]);
    oval(group, iris, [side * 0.056, 1.68, 0.125], [0.009, 0.01, 0.003]);
    oval(group, black, [side * 0.056, 1.68, 0.128], [0.004, 0.007, 0.0018]);
    line(
      group,
      skin,
      [
        [side * 0.086, 1.685, 0.114],
        [side * 0.055, 1.697, 0.125],
        [side * 0.027, 1.685, 0.116],
      ],
      0.005,
    );
    line(
      group,
      hair,
      [
        [side * 0.09, 1.709, 0.109],
        [side * 0.055, 1.716, 0.122],
        [side * 0.025, 1.709, 0.117],
      ],
      0.007,
    );
  }
  oval(group, skin, [0, 1.644, 0.127], [0.018, 0.05, 0.016]);
  oval(group, skin, [0, 1.615, 0.149], [0.024, 0.017, 0.025]);
  for (const side of [-1, 1])
    oval(group, skin, [side * 0.02, 1.609, 0.135], [0.01, 0.01, 0.013]);
  line(
    group,
    lip,
    [
      [-0.029, 1.577, 0.127],
      [0, 1.578, 0.14],
      [0.029, 1.577, 0.127],
    ],
    0.005,
  );
  line(
    group,
    lip,
    [
      [-0.023, 1.573, 0.127],
      [0, 1.569, 0.137],
      [0.023, 1.573, 0.127],
    ],
    0.004,
  );
  if (a.hair !== "bald") surfaceHair(group, hair, a.hair || "lowfade");
  const beard = a.beard || "none";
  if (["short", "full", "stubble"].includes(beard)) {
    const beardMat =
      beard === "stubble"
        ? new T.MeshStandardMaterial({
            color: hair.color,
            transparent: true,
            opacity: 0.5,
            roughness: 1,
          })
        : hair;
    line(
      group,
      beardMat,
      [
        [-0.114, 1.59, 0.051],
        [-0.088, 1.53, 0.081],
        [0, beard === "full" ? 1.477 : 1.492, 0.109],
        [0.088, 1.53, 0.081],
        [0.114, 1.59, 0.051],
      ],
      beard === "full" ? 0.025 : beard === "stubble" ? 0.01 : 0.017,
    );
  }
  if (["full", "short", "mustache", "goatee"].includes(beard)) {
    for (const side of [-1, 1])
      line(
        group,
        hair,
        [
          [side * 0.005, 1.594, 0.143],
          [side * 0.02, 1.593, 0.136],
          [side * 0.036, 1.585, 0.12],
        ],
        0.0065,
      );
  }
  if (beard === "goatee") {
    oval(group, hair, [0, 1.514, 0.111], [0.024, 0.032, 0.006]);
    line(
      group,
      hair,
      [
        [-0.035, 1.579, 0.12],
        [-0.027, 1.54, 0.115],
        [0, 1.512, 0.117],
        [0.027, 1.54, 0.115],
        [0.035, 1.579, 0.12],
      ],
      0.006,
    );
  }
  // Tapered torso and short sleeves. Arms remain exposed down to hands.
  const head = new T.Group();
  while (group.children.length) head.add(group.children[0]);
  head.scale.set(0.88, 0.97, 0.92);
  head.position.y = 0.042;
  group.add(head);
  const rings = [
      [0.65, 0.17, 0.105],
      [0.84, 0.175, 0.115],
      [1.08, 0.205, 0.13],
      [1.21, 0.24, 0.13],
      [1.28, 0.2, 0.11],
      [1.32, 0.085, 0.071],
    ],
    positions = [],
    indices = [],
    segments = 32;
  for (const [y, width, depth] of rings)
    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * Math.PI * 2;
      positions.push(Math.cos(t) * width * body, y, Math.sin(t) * depth);
    }
  for (let r = 0; r < rings.length - 1; r++)
    for (let i = 0; i < segments; i++) {
      const a = r * (segments + 1) + i,
        b = a + segments + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  const torsoGeo = new T.BufferGeometry();
  torsoGeo.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
  torsoGeo.setIndex(indices);
  torsoGeo.computeVertexNormals();
  jersey.side = T.DoubleSide;
  group.add(new T.Mesh(torsoGeo, jersey));
  for (const side of [-1, 1]) {
    const shoulder = [side * 0.225 * body, 1.22, 0],
      elbow = [side * 0.31 * body, 0.88, 0],
      wrist = [side * 0.33 * body, 0.57, 0.035];
    rod(group, skin, shoulder, elbow, 0.054 * body, 0.045 * body);
    rod(group, skin, elbow, wrist, 0.045 * body, 0.029 * body);
    rod(
      group,
      jersey,
      shoulder,
      [side * 0.271 * body, 1.065, 0],
      0.079 * body,
      0.064 * body,
    );
    rod(
      group,
      trim,
      [side * 0.264 * body, 1.085, 0],
      [side * 0.271 * body, 1.055, 0],
      0.065 * body,
      0.064 * body,
    );
    oval(
      group,
      skin,
      [side * 0.333 * body, 0.521, 0.036],
      [0.034, 0.057, 0.022],
    );
    for (let finger = 0; finger < 4; finger++)
      rod(
        group,
        skin,
        [side * 0.313 * body + finger * 0.012, 0.51, 0.042],
        [side * 0.313 * body + finger * 0.012, 0.463, 0.044],
        0.0065,
        0.005,
      );
  }
  // Collar, panel seams, team crest and jersey number texture.
  line(
    group,
    trim,
    [
      [-0.078, 1.304, 0.12],
      [0, 1.263, 0.14],
      [0.078, 1.304, 0.12],
    ],
    0.014,
  );
  for (const side of [-1, 1])
    line(
      group,
      trim,
      [
        [side * 0.18 * body, 1.29, 0.13],
        [side * 0.115 * body, 1.22, 0.151],
      ],
      0.009,
    );
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = kit.primary === "#d8dee1" ? "#263544" : "#fff";
  ctx.font = "bold 180px Arial";
  ctx.textAlign = "center";
  ctx.fillText(
    String(Math.max(1, Math.min(99, Number(person.number) || 10))),
    256,
    315,
  );
  ctx.font = "bold 24px Arial";
  ctx.fillText("PRO LIFE", 256, 385);
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  const patch = new T.Mesh(
    new T.PlaneGeometry(0.15, 0.15),
    new T.MeshStandardMaterial({
      map: texture,
      transparent: true,
      roughness: 1,
      depthWrite: false,
    }),
  );
  patch.position.set(0, 0.94, 0.132);
  group.add(patch);
  const crest = new T.Mesh(new T.CircleGeometry(0.025, 5), trim);
  crest.position.set(-0.125 * body, 1.18, 0.131);
  group.add(crest);
  if (a.tattoo !== "none" && a.tattoo) {
    const ink = material("#293039");
    const inkGroup = new T.Group();
    inkGroup.scale.x = body;
    group.add(inkGroup);
    if (["left", "both"].includes(a.tattoo)) addTattoo(inkGroup, ink, 1);
    if (["right", "both"].includes(a.tattoo)) addTattoo(inkGroup, ink, -1);
  }
  if (a.accessory === "glasses") {
    for (const side of [-1, 1])
      line(
        head,
        black,
        [
          [side * 0.024, 1.692, 0.139],
          [side * 0.024, 1.663, 0.139],
          [side * 0.092, 1.663, 0.13],
          [side * 0.092, 1.692, 0.13],
          [side * 0.024, 1.692, 0.139],
        ],
        0.005,
      );
    rod(head, black, [-0.024, 1.68, 0.14], [0.024, 1.68, 0.14], 0.004);
    for (const side of [-1, 1])
      line(
        head,
        black,
        [
          [side * 0.092, 1.68, 0.13],
          [side * 0.15, 1.68, -0.035],
        ],
        0.004,
      );
  }
  if (a.accessory === "mask") {
    // Protective cheek/nose mask with genuine eye openings; eyes remain visible.
    for (const side of [-1, 1]) {
      line(
        head,
        black,
        [
          [side * 0.025, 1.714, 0.138],
          [side * 0.095, 1.703, 0.124],
          [side * 0.11, 1.65, 0.105],
          [side * 0.076, 1.634, 0.143],
          [side * 0.024, 1.646, 0.144],
        ],
        0.015,
      );
      line(
        head,
        black,
        [
          [side * 0.09, 1.686, 0.144],
          [side * 0.15, 1.68, -0.03],
        ],
        0.007,
      );
    }
    oval(head, black, [0, 1.652, 0.157], [0.021, 0.044, 0.014]);
  }
  return group;
}
let current;
function mount(container, person, kit) {
  if (!container) return null;
  let renderer;
  try {
    renderer = new T.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
    });
  } catch {
    container.dataset.mode = "fallback";
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x171b20, 1);
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  const scene = new T.Scene(),
    camera = new T.PerspectiveCamera(28, 1, 0.1, 20);
  camera.position.set(0, 1.25, 3.9);
  camera.lookAt(0, 1.2, 0);
  scene.add(new T.HemisphereLight(0xffffff, 0x506070, 2.6));
  const key = new T.DirectionalLight(0xffedd9, 3);
  key.position.set(-3, 4, 4);
  scene.add(key);
  const fill = new T.DirectionalLight(0xc6dfff, 2);
  fill.position.set(3, 2, -1);
  scene.add(fill);
  let subject = model(person, kit),
    angle = -0.12,
    dragging = false,
    last = 0;
  scene.add(subject);
  renderer.domElement.className = "avatar-canvas";
  renderer.domElement.setAttribute(
    "aria-label",
    "Personagem 3D com uniforme do clube; arraste para girar",
  );
  renderer.domElement.setAttribute("role", "img");
  container.append(renderer.domElement);
  container.dataset.mode = "3d";
  function draw() {
    subject.rotation.y = angle;
    renderer.render(scene, camera);
  }
  function resize() {
    const width = Math.max(1, container.clientWidth),
      height = Math.max(1, container.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    draw();
  }
  function disposeModel(obj) {
    obj.traverse((mesh) => {
      mesh.geometry?.dispose();
      const mats = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material];
      for (const mat of mats) {
        mat?.map?.dispose();
        mat?.dispose();
      }
    });
  }
  const down = (e) => {
      dragging = true;
      last = e.clientX;
      renderer.domElement.setPointerCapture?.(e.pointerId);
    },
    move = (e) => {
      if (!dragging) return;
      angle += (e.clientX - last) * 0.008;
      last = e.clientX;
      draw();
    },
    up = () => (dragging = false);
  renderer.domElement.addEventListener("pointerdown", down);
  renderer.domElement.addEventListener("pointermove", move);
  renderer.domElement.addEventListener("pointerup", up);
  renderer.domElement.addEventListener("pointercancel", up);
  const observer =
    typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
  observer?.observe(container);
  resize();
  const lost = (e) => {
    e.preventDefault();
    container.dataset.mode = "fallback";
    renderer.domElement.style.display = "none";
  };
  renderer.domElement.addEventListener("webglcontextlost", lost);
  return {
    update(p, k) {
      const next = model(p, k);
      scene.remove(subject);
      disposeModel(subject);
      subject = next;
      scene.add(subject);
      draw();
    },
    dispose() {
      observer?.disconnect();
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      disposeModel(subject);
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
window.ProLifeAvatar3D = {
  mount,
  dispose() {
    current?.dispose();
    current = null;
  },
  show(container, p, k) {
    this.dispose();
    current = mount(container, p, k);
    return current;
  },
};
