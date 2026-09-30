/**
 * SkyShield – Rotating Earth & Airplane Hero Visual
 * A clean, modest, daylight aviation-themed 3D visual featuring
 * a rotating Earth globe with a modern airliner flying smoothly over it.
 * Designed to look professional, decent, and restrained (not dark mode).
 */

window.SkyShieldGlobe = (function() {
  'use strict';

  var container, scene, camera, renderer;
  var earthMesh, cloudsMesh, atmosphereGlow;
  var airplaneGroup, contrailLine;
  var isRunning = false;
  var animationFrameId = null;

  // Flight path parameters
  var orbitRadius = 14.5;
  var orbitAngle = 0;
  var orbitSpeed = 0.55; // Radians per second
  var trailPositions = [];
  var maxTrailPoints = 40;

  /**
   * Generates a clean, daylight equirectangular Earth texture
   * with serene blue oceans, gentle green/khaki continents, and soft coastlines.
   */
  function createDaylightEarthTexture() {
    var canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    var ctx = canvas.getContext('2d');

    // 1. Serene Ocean Blue Gradient (Aviation daylight style)
    var oceanGrad = ctx.createLinearGradient(0, 0, 0, 512);
    oceanGrad.addColorStop(0, '#1c4d82');   // Arctic
    oceanGrad.addColorStop(0.18, '#1e5a96');
    oceanGrad.addColorStop(0.5, '#2563eb');  // Mid-ocean vibrant aviation blue
    oceanGrad.addColorStop(0.82, '#1e5a96');
    oceanGrad.addColorStop(1, '#1c4d82');   // Antarctic
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, 1024, 512);

    // Coordinate conversion helper
    function mapCoord(lng, lat) {
      return {
        x: ((lng + 180) / 360) * 1024,
        y: ((90 - lat) / 180) * 512
      };
    }

    // Continent coordinates approximations
    var continents = [
      // North America
      [[-168, 65], [-140, 70], [-95, 76], [-65, 58], [-65, 43], [-75, 35], [-80, 25], [-82, 10], [-96, 17], [-115, 30], [-124, 38], [-135, 58], [-168, 65]],
      // South America
      [[-77, 8], [-60, 5], [-35, -5], [-40, -22], [-55, -40], [-65, -53], [-74, -50], [-73, -20], [-80, -5], [-77, 8]],
      // Eurasia
      [[-10, 36], [10, 38], [35, 32], [60, 24], [70, 22], [80, 10], [90, 22], [105, 10], [122, 30], [140, 52], [170, 70], [100, 77], [45, 68], [15, 60], [-5, 58], [-9, 44], [-10, 36]],
      // Africa
      [[-17, 32], [10, 37], [32, 31], [43, 12], [51, 11], [40, -4], [30, -32], [15, -28], [2, 4], [-17, 21], [-17, 32]],
      // Australia
      [[114, -22], [135, -12], [148, -20], [150, -37], [130, -32], [115, -34], [114, -22]],
      // Greenland
      [[-50, 60], [-20, 70], [-20, 80], [-55, 80], [-50, 60]],
      // Antarctica
      [[-180, -75], [180, -75], [180, -90], [-180, -90]]
    ];

    // Draw Shallow Continental Shelves (Light turquoise border)
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 14;
    drawPolys(ctx, continents, mapCoord);
    ctx.stroke();

    // Draw Landmasses (Temperate green & soft khaki earth colors)
    var landGrad = ctx.createLinearGradient(0, 0, 0, 512);
    landGrad.addColorStop(0, '#f8fafc');   // Ice
    landGrad.addColorStop(0.15, '#65a30d'); // Tundra/Forest
    landGrad.addColorStop(0.35, '#16a34a'); // Lush vegetation
    landGrad.addColorStop(0.55, '#ca8a04'); // Savannah / Earth
    landGrad.addColorStop(0.75, '#4ade80');
    landGrad.addColorStop(1, '#f8fafc');   // Antarctic ice
    ctx.fillStyle = landGrad;
    drawPolys(ctx, continents, mapCoord);
    ctx.fill();

    // Soft global flight network routes (White & Sky blue arcs)
    var routes = [
      { from: [-74, 40.7], to: [-0.1, 51.5] },   // JFK to LHR
      { from: [-0.1, 51.5], to: [55.3, 25.2] },   // LHR to DXB
      { from: [55.3, 25.2], to: [139.7, 35.6] },  // DXB to HND
      { from: [139.7, 35.6], to: [-118.2, 34.0] },// HND to LAX
      { from: [-118.2, 34.0], to: [-74, 40.7] },  // LAX to JFK
      { from: [55.3, 25.2], to: [103.8, 1.3] },   // DXB to SIN
      { from: [103.8, 1.3], to: [151.2, -33.8] }  // SIN to SYD
    ];

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1.5;
    routes.forEach(function(r) {
      var p1 = mapCoord(r.from[0], r.from[1]);
      var p2 = mapCoord(r.to[0], r.to[1]);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      var midX = (p1.x + p2.x) / 2;
      var midY = (p1.y + p2.y) / 2 - 25;
      ctx.quadraticCurveTo(midX, midY, p2.x, p2.y);
      ctx.stroke();

      // Hub dot
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(p1.x, p1.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    var texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    return texture;
  }

  function drawPolys(ctx, polys, mapFn) {
    ctx.beginPath();
    polys.forEach(function(poly) {
      if (poly.length === 0) return;
      var start = mapFn(poly[0][0], poly[0][1]);
      ctx.moveTo(start.x, start.y);
      for (var i = 1; i < poly.length; i++) {
        var pt = mapFn(poly[i][0], poly[i][1]);
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.closePath();
    });
  }

  /**
   * Generates gentle white cloud texture
   */
  function createCloudsTexture() {
    var canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 512, 256);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    for (var i = 0; i < 70; i++) {
      var x = Math.random() * 512;
      var y = 40 + Math.random() * 176;
      var rx = 25 + Math.random() * 45;
      var ry = 10 + Math.random() * 20;

      var grad = ctx.createRadialGradient(x, y, 2, x, y, rx);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.65)');
      grad.addColorStop(0.7, 'rgba(255, 255, 255, 0.25)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = grad;

      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    var texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    return texture;
  }

  /**
   * Builds a sleek modern commercial airliner model (Fuselage, wings, engines, tail)
   */
  function buildAirplaneModel() {
    var plane = new THREE.Group();

    // Clean aviation materials
    var whiteBodyMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.25,
      metalness: 0.15
    });

    var navyTrimMat = new THREE.MeshStandardMaterial({
      color: 0x0f2347, // Dark navy trim
      roughness: 0.35,
      metalness: 0.3
    });

    var skyBlueMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Sky blue accent
      roughness: 0.2,
      metalness: 0.4
    });

    // 1. Fuselage
    var fuselageGeo = new THREE.CylinderGeometry(0.24, 0.18, 3.2, 16);
    fuselageGeo.rotateX(Math.PI / 2);
    var fuselage = new THREE.Mesh(fuselageGeo, whiteBodyMat);
    plane.add(fuselage);

    // Nose
    var noseGeo = new THREE.ConeGeometry(0.24, 0.9, 16);
    noseGeo.rotateX(-Math.PI / 2);
    var nose = new THREE.Mesh(noseGeo, whiteBodyMat);
    nose.position.set(0, 0, 1.6 + 0.45);
    plane.add(nose);

    // Cockpit Window
    var windowGeo = new THREE.BoxGeometry(0.26, 0.12, 0.45);
    var windowMesh = new THREE.Mesh(windowGeo, navyTrimMat);
    windowMesh.position.set(0, 0.14, 1.45);
    windowMesh.rotation.x = -0.2;
    plane.add(windowMesh);

    // 2. Wings (Swept design)
    var wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0);
    wingShape.lineTo(2.4, -0.9);
    wingShape.lineTo(2.3, -0.6);
    wingShape.lineTo(0, 0.7);
    wingShape.closePath();

    var wingGeo = new THREE.ExtrudeGeometry(wingShape, { depth: 0.05, bevelEnabled: false });
    wingGeo.rotateX(Math.PI / 2);
    wingGeo.center();

    // Right Wing
    var rightWing = new THREE.Mesh(wingGeo, whiteBodyMat);
    rightWing.position.set(1.2, 0, 0.1);
    plane.add(rightWing);

    // Left Wing
    var leftWing = rightWing.clone();
    leftWing.scale.set(-1, 1, 1);
    leftWing.position.set(-1.2, 0, 0.1);
    plane.add(leftWing);

    // Wingtips (Sky blue winglets)
    var wingletGeo = new THREE.BoxGeometry(0.04, 0.35, 0.2);
    var rightWinglet = new THREE.Mesh(wingletGeo, skyBlueMat);
    rightWinglet.position.set(2.4, 0.18, -0.3);
    plane.add(rightWinglet);

    var leftWinglet = new THREE.Mesh(wingletGeo, skyBlueMat);
    leftWinglet.position.set(-2.4, 0.18, -0.3);
    plane.add(leftWinglet);

    // 3. Tail (Vertical Stabilizer)
    var tailShape = new THREE.Shape();
    tailShape.moveTo(0, 0);
    tailShape.lineTo(-0.7, 0.9);
    tailShape.lineTo(-0.4, 0.9);
    tailShape.lineTo(0.2, 0);
    tailShape.closePath();

    var tailGeo = new THREE.ExtrudeGeometry(tailShape, { depth: 0.04, bevelEnabled: false });
    tailGeo.rotateY(Math.PI / 2);
    tailGeo.center();
    var tail = new THREE.Mesh(tailGeo, navyTrimMat);
    tail.position.set(0, 0.5, -1.35);
    tail.rotation.x = -0.15;
    plane.add(tail);

    // Horizontal Stabilizers
    var hStabGeo = new THREE.BoxGeometry(1.3, 0.04, 0.4);
    var hStab = new THREE.Mesh(hStabGeo, whiteBodyMat);
    hStab.position.set(0, 0.12, -1.45);
    plane.add(hStab);

    // 4. Twin Turbofan Engines
    var engineGeo = new THREE.CylinderGeometry(0.14, 0.12, 0.8, 12);
    engineGeo.rotateX(Math.PI / 2);
    var rightEngine = new THREE.Mesh(engineGeo, navyTrimMat);
    rightEngine.position.set(0.75, -0.18, 0.15);
    plane.add(rightEngine);

    var leftEngine = new THREE.Mesh(engineGeo, navyTrimMat);
    leftEngine.position.set(-0.75, -0.18, 0.15);
    plane.add(leftEngine);

    // Scale overall model for decent proportion over Earth
    plane.scale.set(0.42, 0.42, 0.42);
    return plane;
  }

  /**
   * Initializes the 3D Scene inside containerElement
   */
  function init(containerElement) {
    if (!containerElement) return false;
    container = containerElement;

    // Check WebGL support
    try {
      var canvasTest = document.createElement('canvas');
      var gl = canvasTest.getContext('webgl') || canvasTest.getContext('experimental-webgl');
      if (!gl) return false;
    } catch (e) {
      return false;
    }

    var width = container.clientWidth || 460;
    var height = container.clientHeight || 460;

    // 1. Scene & Camera
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 4.5, 33);
    camera.lookAt(0, 0, 0);

    // 2. Renderer (Light / Transparent background)
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'default'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 3. Daylight Lighting (Clean, natural daylight)
    var ambient = new THREE.AmbientLight(0xf1f5f9, 0.85);
    scene.add(ambient);

    var sunLight = new THREE.DirectionalLight(0xffffff, 1.25);
    sunLight.position.set(15, 12, 18);
    scene.add(sunLight);

    var softSkyFill = new THREE.DirectionalLight(0xe0f2fe, 0.45);
    softSkyFill.position.set(-15, -8, -10);
    scene.add(softSkyFill);

    // 4. Earth Globe (Radius: 10)
    var earthRadius = 10;
    var earthGeo = new THREE.SphereGeometry(earthRadius, 48, 48);
    var earthTex = createDaylightEarthTexture();

    var earthMat = new THREE.MeshStandardMaterial({
      map: earthTex,
      roughness: 0.65,
      metalness: 0.1
    });

    earthMesh = new THREE.Mesh(earthGeo, earthMat);
    scene.add(earthMesh);

    // 5. Cloud Layer
    var cloudsGeo = new THREE.SphereGeometry(earthRadius + 0.12, 40, 40);
    var cloudsTex = createCloudsTexture();
    var cloudsMat = new THREE.MeshLambertMaterial({
      map: cloudsTex,
      transparent: true,
      opacity: 0.55,
      blending: THREE.NormalBlending
    });
    cloudsMesh = new THREE.Mesh(cloudsGeo, cloudsMat);
    scene.add(cloudsMesh);

    // 6. Subtle Daylight Atmospheric Glow Ring
    var atmoGeo = new THREE.RingGeometry(earthRadius + 0.05, earthRadius + 0.7, 48);
    var atmoMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide
    });
    atmosphereGlow = new THREE.Mesh(atmoGeo, atmoMat);
    atmosphereGlow.rotation.x = Math.PI / 2;
    scene.add(atmosphereGlow);

    // 7. Airplane Model
    airplaneGroup = buildAirplaneModel();
    scene.add(airplaneGroup);

    // 8. Subtle Airplane Condensation Trail
    var trailGeo = new THREE.BufferGeometry();
    var trailPositionsArray = new Float32Array(maxTrailPoints * 3);
    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositionsArray, 3));

    var trailMat = new THREE.LineBasicMaterial({
      color: 0x0ea5e9, // Crisp sky blue
      transparent: true,
      opacity: 0.65,
      linewidth: 2
    });
    contrailLine = new THREE.Line(trailGeo, trailMat);
    scene.add(contrailLine);

    // Resize Handler
    window.addEventListener('resize', onWindowResize, false);

    isRunning = true;
    animate();
    return true;
  }

  function onWindowResize() {
    if (!container || !camera || !renderer) return;
    var width = container.clientWidth || 460;
    var height = container.clientHeight || 460;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  var clock = new THREE.Clock();

  function animate() {
    if (!isRunning) return;
    animationFrameId = requestAnimationFrame(animate);

    var delta = clock.getDelta();
    var elapsed = clock.getElapsedTime();

    // 1. Slow, continuous natural Earth rotation
    if (earthMesh) {
      earthMesh.rotation.y += delta * 0.12;
    }
    if (cloudsMesh) {
      cloudsMesh.rotation.y += delta * 0.15;
    }

    // 2. Smooth Circular Flight Path for Airplane
    orbitAngle += delta * orbitSpeed;

    // Inclined circular orbit
    var inclination = 0.35; // ~20 degrees orbital tilt
    var px = Math.sin(orbitAngle) * orbitRadius;
    var py = Math.sin(orbitAngle * 2) * 1.8 + Math.cos(orbitAngle) * orbitRadius * Math.sin(inclination);
    var pz = Math.cos(orbitAngle) * orbitRadius * Math.cos(inclination);

    if (airplaneGroup) {
      airplaneGroup.position.set(px, py, pz);

      // Tangent direction for airplane nose heading
      var nextAngle = orbitAngle + 0.05;
      var nx = Math.sin(nextAngle) * orbitRadius;
      var ny = Math.sin(nextAngle * 2) * 1.8 + Math.cos(nextAngle) * orbitRadius * Math.sin(inclination);
      var nz = Math.cos(nextAngle) * orbitRadius * Math.cos(inclination);

      var dir = new THREE.Vector3(nx - px, ny - py, nz - pz).normalize();
      airplaneGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);

      // Subtle aerodynamic banking into the curve
      airplaneGroup.rotateZ(-0.35);

      // 3. Update Condensation Trail
      trailPositions.unshift(airplaneGroup.position.clone());
      if (trailPositions.length > maxTrailPoints) {
        trailPositions.pop();
      }

      if (contrailLine) {
        var posAttr = contrailLine.geometry.attributes.position;
        var arr = posAttr.array;
        for (var i = 0; i < maxTrailPoints; i++) {
          var pt = trailPositions[i] || airplaneGroup.position;
          arr[i * 3] = pt.x;
          arr[i * 3 + 1] = pt.y;
          arr[i * 3 + 2] = pt.z;
        }
        posAttr.needsUpdate = true;
      }
    }

    renderer.render(scene, camera);
  }

  function destroy() {
    isRunning = false;
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    window.removeEventListener('resize', onWindowResize);
  }

  return {
    init: init,
    destroy: destroy
  };

})();
