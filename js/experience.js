/**
 * SkyShield - 3D Cinematic Experience Engine
 * Manages Three.js renderer, Earth, Space environment, Airplane, Runway,
 * and the continuous 7-stage camera transition from Space to Runway walking.
 * 
 * Journey: SPACE (0.00) -> EARTH ZOOM (0.20) -> ATMOSPHERE (0.40) -> 
 *          BREAKOUT & TOUCHDOWN (0.58) -> RUNWAY PERSPECTIVE (0.70) -> 
 *          WALKING DOWN RUNWAY (0.72 - 1.00)
 */

window.SkyShieldExperience = (function() {
  'use strict';

  var container, canvas;
  var scene, camera, renderer;
  var spaceGroup, runwayGroup;
  var earthMesh, earthCloudsMesh, atmosphereMesh, starfieldMesh;
  var airplaneObj, runwayObj;
  var cloudParticles;

  // Animation & Scroll variables
  var scrollProgress = 0;
  var targetScrollProgress = 0;
  var clock = new THREE.Clock();
  var isInitialized = false;
  var hasWebGL = true;

  // Camera targets & vectors
  var cameraLookAt = new THREE.Vector3(0, 0, 0);
  var targetLookAt = new THREE.Vector3(0, 0, 0);

  // Mouse Parallax variables
  var mouseX = 0;
  var mouseY = 0;
  var targetMouseX = 0;
  var targetMouseY = 0;

  // Fallback detection
  function checkWebGLSupport() {
    try {
      var testCanvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && 
        (testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }

  function init(containerElement) {
    container = containerElement;
    if (!checkWebGLSupport()) {
      hasWebGL = false;
      document.body.classList.add('no-webgl');
      console.warn("WebGL not supported; activating 2D fallback mode.");
      return false;
    }

    // 1. Scene & Renderer setup
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x030712, 0.002);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0, 12, 120);

    renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);
    canvas = renderer.domElement;

    // 2. Lighting Setup
    setupLighting();

    // 3. Build Space Environment (Earth, Clouds, Atmosphere, Stars)
    setupSpaceEnvironment();

    // 4. Build 3D Airplane & Contrails
    setupAirplane();

    // 5. Build Atmospheric Stratum Particle Deck
    setupAtmosphereParticles();

    // 6. Build Runway Environment
    setupRunwayEnvironment();

    // 7. Event Listeners
    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('mousemove', onMouseMove, false);

    isInitialized = true;
    animate();
    return true;
  }

  function onMouseMove(e) {
    targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  }

  /**
   * Cinematic Lighting: Sun in space, ambient fill, and runway illumination
   */
  function setupLighting() {
    // Ambient cosmic fill
    var ambientLight = new THREE.AmbientLight(0x0c1526, 1.4);
    scene.add(ambientLight);

    // Primary Solar Directional Light
    var sunLight = new THREE.DirectionalLight(0xffffff, 2.2);
    sunLight.position.set(160, 80, 120);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 400;
    sunLight.shadow.camera.left = -60;
    sunLight.shadow.camera.right = 60;
    sunLight.shadow.camera.top = 60;
    sunLight.shadow.camera.bottom = -60;
    scene.add(sunLight);

    // Subtle blue fill from deep cosmos
    var cosmicFill = new THREE.DirectionalLight(0x00d4ff, 0.6);
    cosmicFill.position.set(-120, -40, -80);
    scene.add(cosmicFill);
  }

  /**
   * Space Environment: Procedural Earth, Specular Oceans, City Lights, Clouds, Atmosphere & Starfield
   */
  function setupSpaceEnvironment() {
    spaceGroup = new THREE.Group();
    scene.add(spaceGroup);

    var earthRadius = 40;

    // 1. Starfield Particles (3000 distant stars)
    var starGeo = new THREE.BufferGeometry();
    var starCount = 3000;
    var starPositions = new Float32Array(starCount * 3);
    var starColors = new Float32Array(starCount * 3);

    for (var i = 0; i < starCount; i++) {
      var r = 700 + Math.random() * 500;
      var theta = Math.random() * Math.PI * 2;
      var phi = Math.acos(2 * Math.random() - 1);

      starPositions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = r * Math.cos(phi);

      // Star colors: cold white, subtle cyan, slight amber
      var cType = Math.random();
      if (cType < 0.6) {
        starColors[i * 3] = 0.95; starColors[i * 3 + 1] = 0.98; starColors[i * 3 + 2] = 1.0;
      } else if (cType < 0.85) {
        starColors[i * 3] = 0.4;  starColors[i * 3 + 1] = 0.85; starColors[i * 3 + 2] = 1.0;
      } else {
        starColors[i * 3] = 1.0;  starColors[i * 3 + 1] = 0.85; starColors[i * 3 + 2] = 0.55;
      }
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    var starMat = new THREE.PointsMaterial({
      size: 1.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      sizeAttenuation: false
    });
    starfieldMesh = new THREE.Points(starGeo, starMat);
    spaceGroup.add(starfieldMesh);

    // 2. Earth Base Sphere (Continents, night lights & reflective oceans)
    var earthGeo = new THREE.SphereGeometry(earthRadius, 64, 64);
    var earthBaseTex = SkyShieldTextures.createEarthBaseTexture();
    var earthSpecTex = SkyShieldTextures.createEarthSpecularTexture();

    var earthMat = new THREE.MeshPhongMaterial({
      map: earthBaseTex,
      specularMap: earthSpecTex,
      specular: new THREE.Color(0x336699),
      shininess: 24,
      bumpScale: 0.05
    });
    earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthMesh.rotation.y = 1.8; // Position Americas/Atlantic in view initially
    spaceGroup.add(earthMesh);

    // 3. Earth Clouds Sphere
    var cloudsGeo = new THREE.SphereGeometry(earthRadius * 1.014, 64, 64);
    var cloudsTex = SkyShieldTextures.createEarthCloudsTexture();
    var cloudsMat = new THREE.MeshLambertMaterial({
      map: cloudsTex,
      transparent: true,
      opacity: 0.88,
      blending: THREE.NormalBlending,
      depthWrite: false
    });
    earthCloudsMesh = new THREE.Mesh(cloudsGeo, cloudsMat);
    spaceGroup.add(earthCloudsMesh);

    // 4. Atmospheric Rayleigh Edge Glow
    var atmoGeo = new THREE.SphereGeometry(earthRadius * 1.06, 64, 64);
    var atmoMat = SkyShieldTextures.createAtmosphereShaderMaterial();
    atmosphereMesh = new THREE.Mesh(atmoGeo, atmoMat);
    spaceGroup.add(atmosphereMesh);

    // 5. Terrestrial Landing Target Coordinates HUD Reticle
    var reticleGeo = new THREE.RingGeometry(1.6, 2.0, 32);
    var reticleMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75
    });
    var landingReticle = new THREE.Mesh(reticleGeo, reticleMat);
    // Align with designated runway coordinates on Earth's surface
    landingReticle.position.set(0, 0, earthRadius + 0.3);
    earthMesh.add(landingReticle);
  }

  /**
   * Airplane & Contrail System
   */
  function setupAirplane() {
    airplaneObj = SkyShieldAirplane.createAirplane();
    scene.add(airplaneObj.mesh);
    scene.add(airplaneObj.trail.group);

    // Default orbital position
    airplaneObj.mesh.position.set(0, 6, 56);
  }

  /**
   * Atmospheric Stratum Volumetric Particles
   * Streaks past camera during Stage 3 (Cloud penetration)
   */
  function setupAtmosphereParticles() {
    var pCount = 1200;
    var pGeo = new THREE.BufferGeometry();
    var pPositions = new Float32Array(pCount * 3);
    var pSizes = new Float32Array(pCount);

    for (var i = 0; i < pCount; i++) {
      // Stratum zone in front of camera
      pPositions[i * 3]     = (Math.random() - 0.5) * 60;
      pPositions[i * 3 + 1] = (Math.random() - 0.5) * 40;
      pPositions[i * 3 + 2] = 20 + Math.random() * 50; // Along approach corridor
      pSizes[i] = 1.0 + Math.random() * 2.5;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    pGeo.setAttribute('size', new THREE.BufferAttribute(pSizes, 1));

    var pMat = new THREE.PointsMaterial({
      color: 0xd6eeff,
      size: 2.2,
      transparent: true,
      opacity: 0.0, // Fades in only during atmospheric ingress
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    cloudParticles = new THREE.Points(pGeo, pMat);
    scene.add(cloudParticles);
  }

  /**
   * Runway Environment Setup
   */
  function setupRunwayEnvironment() {
    runwayObj = SkyShieldRunway.createRunwayEnvironment();
    runwayGroup = runwayObj.group;
    scene.add(runwayGroup);

    // Initially hide runway group until descent break-through
    runwayGroup.visible = false;
  }

  function onWindowResize() {
    if (!camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  /**
   * Updates target scroll progress (called from ScrollTrigger / window scroll)
   * normalized 0.0 to 1.0
   */
  function setScrollProgress(prog) {
    targetScrollProgress = Math.max(0, Math.min(1, prog));
  }

  /**
   * Main Render Loop & Cinematic Camera Choreography
   */
  function animate() {
    requestAnimationFrame(animate);

    var delta = clock.getDelta();
    var time = clock.getElapsedTime();

    // Smooth Lerp of scroll progress for buttery fluid transition
    scrollProgress += (targetScrollProgress - scrollProgress) * 0.075;
    var p = scrollProgress;

    // Smooth Lerp of mouse parallax
    mouseX += (targetMouseX - mouseX) * 0.05;
    mouseY += (targetMouseY - mouseY) * 0.05;

    // 1. Background Earth & Clouds Idle Rotation
    if (earthMesh) {
      // Base rotation + subtle scroll alignment
      earthMesh.rotation.y = 1.8 + time * 0.03 + p * 0.4;
      earthCloudsMesh.rotation.y = 1.8 + time * 0.038 + p * 0.44;
      earthCloudsMesh.rotation.x = Math.sin(time * 0.05) * 0.02;
    }

    // 2. Continuous 7-Stage Camera & World Journey
    updateCinematicJourney(p, time);

    // 3. Update Runway Systems
    if (runwayObj && runwayGroup.visible) {
      runwayObj.update(time);
    }

    // 4. Update Airplane Lights
    if (airplaneObj) {
      airplaneObj.updateLights(time);
    }

    // 5. Render Scene
    camera.lookAt(cameraLookAt);
    renderer.render(scene, camera);
  }

  /**
   * Orchestrates the 7 stages of the continuous journey
   */
  function updateCinematicJourney(p, time) {
    // -------------------------------------------------------------
    // STAGE 1 & 2: SPACE TO EARTH ORBITAL APPROACH (p: 0.00 -> 0.38)
    // -------------------------------------------------------------
    if (p < 0.38) {
      spaceGroup.visible = true;
      runwayGroup.visible = false;
      cloudParticles.material.opacity = 0.0;

      // Normalize stage sub-progress
      var s1 = p / 0.38;

      // Camera pushes in towards Earth
      var camZ = THREE.MathUtils.lerp(120, 58, s1);
      var camY = THREE.MathUtils.lerp(12, 5, s1);
      var camX = THREE.MathUtils.lerp(0, 3.5, s1);
      camera.position.set(camX + mouseX * 2.2, camY - mouseY * 1.4, camZ);

      cameraLookAt.set(0, 0, 0);

      // Airplane orbital flight mechanics
      var orbitRadius = 52 - s1 * 5;
      var orbitSpeed = 0.65;
      var orbitAngle = time * orbitSpeed + s1 * 1.5;

      var planeX = Math.sin(orbitAngle) * orbitRadius;
      var planeY = Math.cos(orbitAngle * 0.8) * 12 + Math.sin(s1 * Math.PI) * 4;
      var planeZ = Math.cos(orbitAngle) * orbitRadius;

      airplaneObj.mesh.position.set(planeX, planeY, planeZ);

      // Tangent vector for airplane heading & banking
      var nextAngle = orbitAngle + 0.05;
      var nextX = Math.sin(nextAngle) * orbitRadius;
      var nextY = Math.cos(nextAngle * 0.8) * 12 + Math.sin(s1 * Math.PI) * 4;
      var nextZ = Math.cos(nextAngle) * orbitRadius;

      var forwardVec = new THREE.Vector3(nextX - planeX, nextY - planeY, nextZ - planeZ).normalize();
      airplaneObj.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), forwardVec);

      // Banking into the orbital turn
      airplaneObj.mesh.rotateZ(-0.45);

      // Update Contrail Trails behind engines
      airplaneObj.mesh.updateMatrixWorld(true);
      var worldLeftExhaust = airplaneObj.leftExhaustPos.clone().applyMatrix4(airplaneObj.mesh.matrixWorld);
      var worldRightExhaust = airplaneObj.rightExhaustPos.clone().applyMatrix4(airplaneObj.mesh.matrixWorld);
      airplaneObj.trail.update(worldLeftExhaust, worldRightExhaust);

      // Space Fog
      scene.fog.density = 0.0018;
      scene.fog.color.setHex(0x030712);
    }
    // -------------------------------------------------------------
    // STAGE 3: ATMOSPHERIC STRATUM PENETRATION (p: 0.38 -> 0.56)
    // -------------------------------------------------------------
    else if (p < 0.56) {
      spaceGroup.visible = true;
      runwayGroup.visible = false;

      var s2 = (p - 0.38) / (0.56 - 0.38);

      // Camera dives directly into upper cloud deck
      var camZ = THREE.MathUtils.lerp(58, 42.5, s2);
      var camY = THREE.MathUtils.lerp(5, 1.2, s2);
      var camX = THREE.MathUtils.lerp(3.5, 0.5, s2);
      camera.position.set(camX + mouseX * 1.2, camY - mouseY * 0.8, camZ);

      cameraLookAt.set(0, 0, 30);

      // Airplane establishes direct landing corridor vector ahead of camera
      var planeX = THREE.MathUtils.lerp(3.5, 0.2, s2);
      var planeY = THREE.MathUtils.lerp(4.5, 0.8, s2);
      var planeZ = THREE.MathUtils.lerp(50, 36, s2);

      airplaneObj.mesh.position.set(planeX, planeY, planeZ);
      airplaneObj.mesh.rotation.set(-0.25, 0, 0); // Nose down descent pitch

      // Contrails
      airplaneObj.mesh.updateMatrixWorld(true);
      var worldLeftExhaust = airplaneObj.leftExhaustPos.clone().applyMatrix4(airplaneObj.mesh.matrixWorld);
      var worldRightExhaust = airplaneObj.rightExhaustPos.clone().applyMatrix4(airplaneObj.mesh.matrixWorld);
      airplaneObj.trail.update(worldLeftExhaust, worldRightExhaust);

      // Atmospheric Fog & Cloud particles density spike
      var fogDensity = THREE.MathUtils.lerp(0.0018, 0.065, Math.sin(s2 * Math.PI));
      scene.fog.density = fogDensity;
      scene.fog.color.setRGB(0.06 + s2 * 0.08, 0.12 + s2 * 0.14, 0.22 + s2 * 0.18);

      // Cloud particles rush past camera
      cloudParticles.material.opacity = Math.sin(s2 * Math.PI) * 0.85;
      var posArr = cloudParticles.geometry.attributes.position.array;
      for (var cp = 0; cp < posArr.length; cp += 3) {
        posArr[cp + 2] += 1.8; // Move towards camera
        if (posArr[cp + 2] > 65) posArr[cp + 2] = 20;
      }
      cloudParticles.geometry.attributes.position.needsUpdate = true;
    }
    // -------------------------------------------------------------
    // STAGE 4 & 5: CEILING BREAKOUT, TOUCHDOWN & RUNWAY PERSPECTIVE (p: 0.56 -> 0.72)
    // -------------------------------------------------------------
    else if (p < 0.72) {
      spaceGroup.visible = false;
      runwayGroup.visible = true;
      cloudParticles.material.opacity = 0.0;

      var s3 = (p - 0.56) / (0.72 - 0.56);

      // Dissipating ground mist into crisp runway lights
      scene.fog.density = THREE.MathUtils.lerp(0.045, 0.0035, s3);
      scene.fog.color.setHex(0x040813);

      // Airplane touches down on runway centerline ahead of user
      var planeTouchdownZ = THREE.MathUtils.lerp(30, -180, s3);
      var planeTouchdownY = THREE.MathUtils.lerp(8.0, 0.65, Math.min(1, s3 * 1.5));
      airplaneObj.mesh.position.set(0, planeTouchdownY, planeTouchdownZ);

      // Flair and level rollout
      airplaneObj.mesh.rotation.set(0, Math.PI, 0); // Facing down the runway

      // Contrails
      airplaneObj.mesh.updateMatrixWorld(true);
      var worldLeftExhaust = airplaneObj.leftExhaustPos.clone().applyMatrix4(airplaneObj.mesh.matrixWorld);
      var worldRightExhaust = airplaneObj.rightExhaustPos.clone().applyMatrix4(airplaneObj.mesh.matrixWorld);
      airplaneObj.trail.update(worldLeftExhaust, worldRightExhaust);

      // Camera drops from approach height to human walking viewpoint (Y: 1.75m)
      var camY = THREE.MathUtils.lerp(14, 1.75, s3);
      var camZ = THREE.MathUtils.lerp(55, 10, s3);
      var camX = THREE.MathUtils.lerp(0.5, 0.0, s3);
      camera.position.set(camX + mouseX * 0.6, camY - mouseY * 0.4, camZ);

      // Camera looks straight down the runway into infinite horizon
      cameraLookAt.set(0, 1.6, -400);
    }
    // -------------------------------------------------------------
    // STAGE 6 & 7: WALKING FORWARD DOWN THE FUTURISTIC RUNWAY (p: 0.72 -> 1.00)
    // -------------------------------------------------------------
    else {
      spaceGroup.visible = false;
      runwayGroup.visible = true;
      cloudParticles.material.opacity = 0.0;

      var s4 = (p - 0.72) / (1.00 - 0.72);

      // Camera glides down the runway along -Z axis (from Z: 10 down to -520)
      var walkDistance = THREE.MathUtils.lerp(10, -520, s4);

      // Human walking kinematics: delicate vertical bobbing & lateral sway
      var walkBob = Math.sin(walkDistance * 0.28) * 0.06;
      var walkSway = Math.cos(walkDistance * 0.14) * 0.03;

      camera.position.set(walkSway + mouseX * 0.4, 1.75 + walkBob - mouseY * 0.25, walkDistance);

      // Camera looks forward along runway centerline
      cameraLookAt.set(0, 1.65, walkDistance - 250);

      // Airplane rolls forward into the distance ahead
      var planeRollZ = THREE.MathUtils.lerp(-180, -780, s4);
      airplaneObj.mesh.position.set(0, 0.65, planeRollZ);
      airplaneObj.mesh.rotation.set(0, Math.PI, 0);

      // Clear, atmospheric night airport fog
      scene.fog.density = 0.0032;
      scene.fog.color.setHex(0x040813);
    }
  }

  return {
    init: init,
    setScrollProgress: setScrollProgress,
    getScrollProgress: function() { return scrollProgress; },
    hasWebGL: function() { return hasWebGL; }
  };

})();
