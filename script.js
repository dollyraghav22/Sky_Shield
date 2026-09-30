
import * as THREE from "three";

const sceneContainer = document.getElementById("scene");
const stageLabel = document.getElementById("stageLabel");
const progressBar = document.getElementById("progressBar");

const stages = [
  "ORBIT",
  "APPROACH",
  "ATMOSPHERE",
  "ARRIVAL",
  "RUNWAY"
];

let scrollProgress = 0;

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x020611);
scene.fog = new THREE.Fog(0x071321, 20, 72);

const camera = new THREE.PerspectiveCamera(
  42,
  window.innerWidth / window.innerHeight,
  0.1,
  160
);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
  powerPreference: "high-performance"
});

renderer.setPixelRatio(
  Math.min(window.devicePixelRatio, 1.7)
);

renderer.setSize(
  window.innerWidth,
  window.innerHeight
);

renderer.outputColorSpace = THREE.SRGBColorSpace;

sceneContainer.appendChild(renderer.domElement);

/* --------------------------------------------------
   LIGHTING
-------------------------------------------------- */

const ambientLight = new THREE.AmbientLight(
  0x6fa8c8,
  0.45
);

scene.add(ambientLight);

const sun = new THREE.DirectionalLight(
  0xffffff,
  2.5
);

sun.position.set(-8, 4, 10);
scene.add(sun);

/* --------------------------------------------------
   STAR FIELD
-------------------------------------------------- */

const starGeometry = new THREE.BufferGeometry();
const starPositions = new Float32Array(900 * 3);

for (let i = 0; i < 900; i++) {
  const radius = 32 + Math.random() * 50;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);

  starPositions[i * 3] =
    radius * Math.sin(phi) * Math.cos(theta);

  starPositions[i * 3 + 1] =
    radius * Math.cos(phi);

  starPositions[i * 3 + 2] =
    radius * Math.sin(phi) * Math.sin(theta);
}

starGeometry.setAttribute(
  "position",
  new THREE.BufferAttribute(starPositions, 3)
);

const stars = new THREE.Points(
  starGeometry,
  new THREE.PointsMaterial({
    color: 0xa9ddff,
    size: 0.075,
    transparent: true,
    opacity: 0.85
  })
);

scene.add(stars);

/* --------------------------------------------------
   EARTH
-------------------------------------------------- */

const loader = new THREE.TextureLoader();
const earthGroup = new THREE.Group();

const earthTexture = loader.load(
  "https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg"
);

earthTexture.colorSpace = THREE.SRGBColorSpace;

const normalTexture = loader.load(
  "https://threejs.org/examples/textures/planets/earth_normal_2048.jpg"
);

const specularTexture = loader.load(
  "https://threejs.org/examples/textures/planets/earth_specular_2048.jpg"
);

const lightsTexture = loader.load(
  "https://threejs.org/examples/textures/planets/earth_lights_2048.png"
);

lightsTexture.colorSpace = THREE.SRGBColorSpace;

const earthMaterial = new THREE.MeshPhongMaterial({
  map: earthTexture,
  normalMap: normalTexture,
  normalScale: new THREE.Vector2(0.75, 0.75),
  specularMap: specularTexture,
  specular: new THREE.Color(0x4b9ab7),
  shininess: 18
});

const earth = new THREE.Mesh(
  new THREE.SphereGeometry(4.25, 64, 64),
  earthMaterial
);

earthGroup.add(earth);

/* City lights */

const cityLights = new THREE.Mesh(
  new THREE.SphereGeometry(4.265, 64, 64),
  new THREE.MeshBasicMaterial({
    map: lightsTexture,
    color: 0xffc96b,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending
  })
);

earthGroup.add(cityLights);

/* Clouds */

const cloudTexture = loader.load(
  "https://threejs.org/examples/textures/planets/earth_clouds_1024.png"
);

const clouds = new THREE.Mesh(
  new THREE.SphereGeometry(4.34, 64, 64),
  new THREE.MeshPhongMaterial({
    map: cloudTexture,
    transparent: true,
    opacity: 0.22,
    depthWrite: false
  })
);

earthGroup.add(clouds);

/* Atmosphere glow */

const atmosphere = new THREE.Mesh(
  new THREE.SphereGeometry(4.52, 48, 48),
  new THREE.MeshBasicMaterial({
    color: 0x42b8ff,
    transparent: true,
    opacity: 0.14,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending
  })
);

earthGroup.add(atmosphere);

scene.add(earthGroup);

/* --------------------------------------------------
   PHOTOGRAPHIC AIRPLANE
-------------------------------------------------- */

const airplaneGroup = new THREE.Group();

const airplaneTexture = loader.load(
  "https://static.prod-images.emergentagent.com/jobs/84ad7f7e-8980-46e2-9ec7-deb15cb66706/images/e4abf687ad8eae5514d9a0f6d5fc2f5d7e1f004e999682ba5220323de1bcba23.jpeg"
);

airplaneTexture.colorSpace = THREE.SRGBColorSpace;

const airplaneMaterial = new THREE.ShaderMaterial({
  uniforms: {
    map: {
      value: airplaneTexture
    }
  },

  vertexShader: `
    varying vec2 vUv;

    void main() {
      vUv = uv;

      gl_Position =
        projectionMatrix *
        modelViewMatrix *
        vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform sampler2D map;
    varying vec2 vUv;

    void main() {
      vec4 color = texture2D(map, vUv);

      float dx = (vUv.x - 0.5) / 0.49;
      float dy = (vUv.y - 0.52) / 0.27;

      if (dx * dx + dy * dy > 1.0) {
        discard;
      }

      // Remove green chroma-key background
      if (
        color.g > color.r + 0.018 &&
        color.g > color.b + 0.018
      ) {
        discard;
      }

      // Remove blue/sky artifacts
      if (
        color.b > color.r + 0.055 &&
        color.b > color.g + 0.015
      ) {
        discard;
      }

      gl_FragColor = color;
    }
  `,

  transparent: true,
  side: THREE.DoubleSide
});

const airplane = new THREE.Mesh(
  new THREE.PlaneGeometry(1.9, 1.14),
  airplaneMaterial
);

airplaneGroup.add(airplane);
earthGroup.add(airplaneGroup);

/* --------------------------------------------------
   RUNWAY
-------------------------------------------------- */

const runway = new THREE.Group();

/* Ground */

const runwayGround = new THREE.Mesh(
  new THREE.PlaneGeometry(38, 130),
  new THREE.MeshStandardMaterial({
    color: 0x101d29,
    roughness: 0.7,
    metalness: 0.2,
    transparent: true,
    opacity: 0
  })
);

runwayGround.rotation.x = -Math.PI / 2;
runwayGround.position.set(0, -3.8, -38);

runway.add(runwayGround);

/* Center line */

const centerLine = new THREE.Mesh(
  new THREE.PlaneGeometry(0.16, 130),
  new THREE.MeshBasicMaterial({
    color: 0xd6f5ff,
    transparent: true,
    opacity: 0
  })
);

centerLine.rotation.x = -Math.PI / 2;
centerLine.position.set(0, -3.7, -38);

runway.add(centerLine);

/* Edge lines */

const edgeMaterial = new THREE.MeshBasicMaterial({
  color: 0x3de3ff,
  transparent: true,
  opacity: 0
});

[-7.5, 7.5].forEach((x) => {
  const edge = new THREE.Mesh(
    new THREE.PlaneGeometry(0.08, 130),
    edgeMaterial
  );

  edge.rotation.x = -Math.PI / 2;
  edge.position.set(x, -3.68, -38);

  runway.add(edge);
});

/* Runway lights */

for (let i = 0; i < 20; i++) {
  [-7.9, 7.9].forEach((x) => {
    const light = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 8, 8),
      new THREE.MeshBasicMaterial({
        color: 0x46dfff,
        transparent: true,
        opacity: 0
      })
    );

    light.position.set(
      x,
      -3.5,
      22 - i * 6
    );

    runway.add(light);
  });
}

/* Runway towers */

for (let i = 0; i < 10; i++) {
  const tower = new THREE.Mesh(
    new THREE.BoxGeometry(
      0.18,
      5 + (i % 2),
      0.18
    ),
    new THREE.MeshStandardMaterial({
      color: 0x173044,
      transparent: true,
      opacity: 0
    })
  );

  tower.position.set(
    i % 2 ? 12 : -12,
    -1,
    -4 - i * 9
  );

  runway.add(tower);
}

scene.add(runway);

/* --------------------------------------------------
   SCROLL ANIMATION
-------------------------------------------------- */

function updateScrollProgress() {
  const maxScroll =
    window.innerHeight * 2.85;

  scrollProgress = Math.min(
    window.scrollY / maxScroll,
    1
  );

  const stageIndex = Math.min(
    Math.floor(scrollProgress * stages.length),
    stages.length - 1
  );

  stageLabel.textContent = stages[stageIndex];
  progressBar.style.width =
    `${scrollProgress * 100}%`;
}

window.addEventListener(
  "scroll",
  updateScrollProgress,
  { passive: true }
);

updateScrollProgress();

/* --------------------------------------------------
   ANIMATION LOOP
-------------------------------------------------- */

function animate(time) {
  requestAnimationFrame(animate);

  const progress = scrollProgress;

  const approach = Math.min(
    progress / 0.52,
    1
  );

  const runwayProgress = THREE.MathUtils.smoothstep(
    progress,
    0.43,
    1
  );

  /* Earth rotation */

  earth.rotation.y = time * 0.00004;
  cityLights.rotation.y = time * 0.00004;
  clouds.rotation.y = time * 0.000052;

  /* Aircraft orbit */

  const orbit =
    time * 0.00055 + progress * 4.2;

  airplaneGroup.position.set(
    Math.cos(orbit) * 6.9,
    Math.sin(orbit * 0.78) * 1.2,
    Math.sin(orbit) * 6.9
  );

  airplaneGroup.rotation.set(0, 0, 0);

  // Keep image aircraft facing the camera
  airplane.quaternion.copy(camera.quaternion);

  // Aircraft transforms into the user's viewpoint
  airplaneGroup.visible = progress < 0.13;

  /* Earth camera approach */

  earthGroup.scale.setScalar(
    1 + approach * 1.55
  );

  earthGroup.position.z =
    -approach * 8;

  earthGroup.position.y =
    approach * 1.9;

  earthMaterial.transparent = true;
  earthMaterial.opacity = Math.max(
    0,
    1 - runwayProgress * 2.4
  );

  atmosphere.material.opacity =
    Math.max(
      0.03,
      0.14 - runwayProgress * 0.18
    );

  /* Camera enters runway */

  camera.position.set(
    Math.sin(progress * 2.8) *
      2.2 *
      runwayProgress,

    1.1 -
      runwayProgress * 1.7,

    14 -
      runwayProgress * 32
  );

  camera.lookAt(
    0,
    -1.2,
    -18 -
      runwayProgress * 22
  );

  /* Fade runway elements */

  runway.traverse((object) => {
    if (
      object.material &&
      object.material.transparent
    ) {
      object.material.opacity =
        runwayProgress;
    }
  });

  renderer.render(scene, camera);
}

requestAnimationFrame(animate);

/* --------------------------------------------------
   RESPONSIVE RESIZE
-------------------------------------------------- */

window.addEventListener("resize", () => {
  camera.aspect =
    window.innerWidth /
    window.innerHeight;

  camera.updateProjectionMatrix();

  renderer.setSize(
    window.innerWidth,
    window.innerHeight
  );
});

/* --------------------------------------------------
   BUTTONS
-------------------------------------------------- */

document
  .getElementById("beginJourney")
  .addEventListener("click", () => {
    window.scrollTo({
      top: window.innerHeight * 1.2,
      behavior: "smooth"
    });
  });

document
  .getElementById("incidentButton")
  .addEventListener("click", () => {
    alert("Incident reporting workspace ready to connect.");
  });

document
  .getElementById("dashboardButton")
  .addEventListener("click", () => {
    alert("Safety intelligence dashboard ready to connect.");
  });
