/**
 * SkyShield - Procedural Texture Generator
 * Generates photorealistic Earth diffuse, specular, night lights, clouds,
 * and airport runway tarmac textures using off-screen HTML5 Canvases.
 * Zero external image dependencies guarantees 100% offline reliability & instant load.
 */

window.SkyShieldTextures = (function() {
  'use strict';

  // Helper: Simple 2D Perlin-like pseudo noise generator for terrain and clouds
  function createNoise(seed) {
    var p = new Uint8Array(512);
    var permutation = [];
    for (var i = 0; i < 256; i++) permutation[i] = i;
    var s = seed || 42;
    for (var j = 255; j > 0; j--) {
      s = (s * 16807) % 2147483647;
      var k = s % (j + 1);
      var tmp = permutation[j];
      permutation[j] = permutation[k];
      permutation[k] = tmp;
    }
    for (var n = 0; n < 512; n++) p[n] = permutation[n & 255];

    function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
    function lerp(t, a, b) { return a + t * (b - a); }
    function grad(hash, x, y) {
      var h = hash & 7;
      var u = h < 4 ? x : y;
      var v = h < 4 ? y : x;
      return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }

    return function(x, y) {
      var X = Math.floor(x) & 255;
      var Y = Math.floor(y) & 255;
      x -= Math.floor(x);
      y -= Math.floor(y);
      var u = fade(x);
      var v = fade(y);
      var A = p[X] + Y, B = p[X + 1] + Y;
      return lerp(v,
        lerp(u, grad(p[A], x, y), grad(p[B], x - 1, y)),
        lerp(u, grad(p[A + 1], x, y - 1), grad(p[B + 1], x - 1, y - 1))
      );
    };
  }

  var noise = createNoise(12345);

  function fbm(x, y, octaves) {
    var val = 0;
    var amp = 0.5;
    var freq = 1.0;
    for (var i = 0; i < octaves; i++) {
      val += amp * noise(x * freq, y * freq);
      freq *= 2.05;
      amp *= 0.5;
    }
    return val;
  }

  // Major continental outlines approximated with coordinates [lng, lat] normalized to [0,1]
  // In equirectangular projection: x = (lng + 180)/360, y = (90 - lat)/180
  function toMapCoord(lng, lat) {
    return {
      x: (lng + 180) / 360,
      y: (90 - lat) / 180
    };
  }

  // Simplified continent polygons
  var continents = [
    // North America
    [
      [-168, 65], [-160, 71], [-140, 70], [-125, 75], [-95, 76], [-80, 68],
      [-65, 58], [-55, 50], [-65, 43], [-75, 35], [-80, 25], [-82, 10],
      [-77, 8], [-85, 12], [-96, 17], [-105, 23], [-115, 30], [-124, 38],
      [-125, 49], [-135, 58], [-150, 60], [-165, 60]
    ],
    // South America
    [
      [-77, 8], [-70, 11], [-60, 5], [-50, -1], [-35, -5], [-35, -10],
      [-40, -22], [-50, -30], [-55, -40], [-65, -53], [-74, -50], [-72, -40],
      [-73, -20], [-80, -5], [-77, 8]
    ],
    // Eurasia
    [
      [-10, 36], [0, 40], [10, 38], [25, 36], [35, 32], [50, 25],
      [60, 24], [70, 22], [80, 10], [86, 21], [90, 22], [100, 15],
      [105, 10], [108, 18], [118, 22], [122, 30], [125, 40], [132, 43],
      [140, 52], [150, 58], [165, 60], [180, 66], [170, 70], [140, 74],
      [100, 77], [70, 73], [45, 68], [25, 71], [15, 60], [5, 60],
      [-5, 58], [-9, 44], [-10, 36]
    ],
    // Africa
    [
      [-17, 32], [-5, 36], [10, 37], [25, 32], [32, 31], [43, 12],
      [51, 11], [40, -4], [35, -20], [30, -32], [20, -34], [15, -28],
      [10, -5], [2, 4], [-15, 11], [-17, 21], [-17, 32]
    ],
    // Australia
    [
      [114, -22], [120, -15], [135, -12], [142, -11], [148, -20],
      [153, -28], [150, -37], [138, -35], [130, -32], [115, -34],
      [113, -26], [114, -22]
    ],
    // Greenland
    [
      [-50, 60], [-40, 65], [-20, 70], [-20, 80], [-35, 83], [-55, 80], [-55, 70], [-50, 60]
    ]
  ];

  // Key Aviation Hubs for Night Lights & Flight Arcs
  var aviationHubs = [
    { name: "JFK (New York)", lng: -73.78, lat: 40.64, size: 7 },
    { name: "LHR (London)", lng: -0.45, lat: 51.47, size: 8 },
    { name: "CDG (Paris)", lng: 2.55, lat: 49.01, size: 6 },
    { name: "DXB (Dubai)", lng: 55.36, lat: 25.25, size: 8 },
    { name: "HND (Tokyo)", lng: 139.78, lat: 35.55, size: 8 },
    { name: "SIN (Singapore)", lng: 103.99, lat: 1.36, size: 7 },
    { name: "FRA (Frankfurt)", lng: 8.57, lat: 50.03, size: 6 },
    { name: "LAX (Los Angeles)", lng: -118.41, lat: 33.94, size: 7 },
    { name: "ORD (Chicago)", lng: -87.90, lat: 41.97, size: 6 },
    { name: "SYD (Sydney)", lng: 151.18, lat: -33.95, size: 5 },
    { name: "HKG (Hong Kong)", lng: 113.91, lat: 22.31, size: 7 },
    { name: "GRU (São Paulo)", lng: -46.47, lat: -23.43, size: 5 },
    { name: "DEL (New Delhi)", lng: 77.10, lat: 28.56, size: 6 }
  ];

  // Intercontinental Flight Corridor Connections
  var flightCorridors = [
    [0, 1], // JFK - LHR
    [1, 3], // LHR - DXB
    [3, 4], // DXB - HND
    [4, 7], // HND - LAX
    [7, 8], // LAX - ORD
    [8, 0], // ORD - JFK
    [1, 2], // LHR - CDG
    [2, 6], // CDG - FRA
    [6, 3], // FRA - DXB
    [3, 5], // DXB - SIN
    [5, 9], // SIN - SYD
    [5, 10], // SIN - HKG
    [10, 4], // HKG - HND
    [0, 11], // JFK - GRU
    [3, 12]  // DXB - DEL
  ];

  /**
   * Generates the Earth Base Map Canvas Texture
   */
  function createEarthBaseTexture() {
    var width = 2048;
    var height = 1024;
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext('2d');

    // 1. Deep Oceanic Gradient with realistic bathymetry
    var oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
    oceanGrad.addColorStop(0.0, '#061833'); // Arctic
    oceanGrad.addColorStop(0.2, '#030c1d');
    oceanGrad.addColorStop(0.5, '#04132b'); // Equatorial deep water
    oceanGrad.addColorStop(0.8, '#030c1d');
    oceanGrad.addColorStop(1.0, '#051630'); // Antarctic
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Continental Shelf / Shallow Coastal Waters
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0e3a66';
    ctx.lineWidth = 36;
    drawContinents(ctx, width, height);
    ctx.stroke();

    ctx.strokeStyle = '#12487d';
    ctx.lineWidth = 18;
    drawContinents(ctx, width, height);
    ctx.stroke();

    // 3. Fill Landmasses with Terrain Base Color
    var landGrad = ctx.createLinearGradient(0, 0, 0, height);
    landGrad.addColorStop(0.0, '#d2e3eb'); // Polar ice
    landGrad.addColorStop(0.12, '#96b4a5'); // Tundra
    landGrad.addColorStop(0.35, '#2b4d36'); // Temperate forest
    landGrad.addColorStop(0.48, '#4d4627'); // Savannah/Desert belt
    landGrad.addColorStop(0.54, '#1b3f27'); // Tropical rainforest
    landGrad.addColorStop(0.68, '#483f25'); // Southern arid
    landGrad.addColorStop(0.85, '#6a8b7c'); // Subantarctic
    landGrad.addColorStop(1.0, '#ffffff'); // Antarctica ice cap

    ctx.fillStyle = landGrad;
    drawContinents(ctx, width, height);
    ctx.fill();
    ctx.restore();

    // 4. Procedural Mountain Ranges & Fractal Elevation
    var imgData = ctx.getImageData(0, 0, width, height);
    var data = imgData.data;

    // Apply procedural terrain noise only on landmass pixels
    for (var y = 0; y < height; y += 2) {
      for (var x = 0; x < width; x += 2) {
        var idx = (y * width + x) * 4;
        var r = data[idx];
        var g = data[idx + 1];
        var b = data[idx + 2];

        // Check if this pixel is land (g > b * 0.9 and not pure ocean)
        if (g > b * 0.95 && r > 20) {
          var nx = x / 60.0;
          var ny = y / 60.0;
          var elevation = fbm(nx, ny, 3);
          var shade = Math.floor(elevation * 35);

          data[idx] = Math.min(255, Math.max(0, r + shade));
          data[idx + 1] = Math.min(255, Math.max(0, g + shade));
          data[idx + 2] = Math.min(255, Math.max(0, b + shade));

          // Also duplicate to adjacent pixel for speed
          if (x + 1 < width) {
            var nidx = (y * width + (x + 1)) * 4;
            data[nidx] = data[idx];
            data[nidx + 1] = data[idx + 1];
            data[nidx + 2] = data[idx + 2];
          }
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // 5. Major Aviation Hubs Night Lights & Network Grid
    ctx.save();
    aviationHubs.forEach(function(hub) {
      var coord = toMapCoord(hub.lng, hub.lat);
      var cx = coord.x * width;
      var cy = coord.y * height;

      // Glow halo
      var halo = ctx.createRadialGradient(cx, cy, 1, cx, cy, hub.size * 3.5);
      halo.addColorStop(0.0, 'rgba(255, 235, 170, 0.95)');
      halo.addColorStop(0.3, 'rgba(255, 175, 40, 0.7)');
      halo.addColorStop(0.7, 'rgba(0, 240, 255, 0.3)');
      halo.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(cx, cy, hub.size * 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Sharp core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx, cy, 1.8, 0, Math.PI * 2);
      ctx.fill();
    });

    // 6. Glowing Flight Corridors (Aviation Arcs)
    ctx.lineWidth = 1.6;
    flightCorridors.forEach(function(pair) {
      var h1 = aviationHubs[pair[0]];
      var h2 = aviationHubs[pair[1]];
      var p1 = toMapCoord(h1.lng, h1.lat);
      var p2 = toMapCoord(h2.lng, h2.lat);

      var x1 = p1.x * width;
      var y1 = p1.y * height;
      var x2 = p2.x * width;
      var y2 = p2.y * height;

      // Draw arc curved towards equator or pole
      var mx = (x1 + x2) / 2;
      var my = (y1 + y2) / 2 - 40;

      ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.quadraticCurveTo(mx, my, x2, y2);
      ctx.stroke();
    });
    ctx.restore();

    var texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.anisotropy = 8;
    return texture;
  }

  // Draw continent polygons onto canvas
  function drawContinents(ctx, width, height) {
    ctx.beginPath();
    continents.forEach(function(poly) {
      if (poly.length === 0) return;
      var start = toMapCoord(poly[0][0], poly[0][1]);
      ctx.moveTo(start.x * width, start.y * height);
      for (var i = 1; i < poly.length; i++) {
        var pt = toMapCoord(poly[i][0], poly[i][1]);
        ctx.lineTo(pt.x * width, pt.y * height);
      }
      ctx.closePath();
    });
  }

  /**
   * Generates Specular Map (Oceans shiny white, land matte black)
   */
  function createEarthSpecularTexture() {
    var width = 1024;
    var height = 512;
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext('2d');

    // Oceans = reflective white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Continents = dark matte
    ctx.fillStyle = '#0a0a0a';
    drawContinents(ctx, width, height);
    ctx.fill();

    var texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }

  /**
   * Generates Earth Clouds Texture with soft swirling patterns
   */
  function createEarthCloudsTexture() {
    var width = 1024;
    var height = 512;
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, width, height);
    var imgData = ctx.createImageData(width, height);
    var data = imgData.data;

    for (var y = 0; y < height; y++) {
      var latFactor = Math.sin((y / height) * Math.PI); // Thicker at equator and mid-latitudes
      for (var x = 0; x < width; x++) {
        var nx = (x / width) * 7.0;
        var ny = (y / height) * 3.5;
        var val = fbm(nx, ny, 4);

        // Swirling bands threshold
        var density = val * 0.85 + (latFactor * 0.35) - 0.25;
        if (density > 0) {
          var alpha = Math.min(240, Math.floor(density * 320));
          var idx = (y * width + x) * 4;
          data[idx] = 250;     // R
          data[idx + 1] = 252; // G
          data[idx + 2] = 255; // B
          data[idx + 3] = alpha; // Alpha
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);

    var texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }

  /**
   * Generates High-Tech Runway Tarmac & Markings Canvas Texture
   * Includes asphalt grain, rain grooves, threshold piano keys,
   * touchdown bars, distance signs, and glowing centerline LED slots.
   */
  function createRunwayTarmacTexture() {
    var width = 512;
    var height = 2048; // Long aspect ratio along runway length
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext('2d');

    // 1. Dark aeronautical asphalt base
    ctx.fillStyle = '#12151c';
    ctx.fillRect(0, 0, width, height);

    // 2. Micro asphalt noise grain & rain grooves
    ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
    for (var i = 0; i < 4000; i++) {
      var rx = Math.random() * width;
      var ry = Math.random() * height;
      ctx.fillRect(rx, ry, Math.random() * 2 + 1, Math.random() * 2 + 1);
    }

    // Longitudinal transverse rain grooves
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    for (var g = 0; g < height; g += 8) {
      ctx.fillRect(30, g, width - 60, 2);
    }

    // 3. Runway Edge Solid White Stripes
    ctx.fillStyle = '#e8ecf4';
    ctx.fillRect(36, 0, 8, height);
    ctx.fillRect(width - 44, 0, 8, height);

    // 4. Threshold Piano Keys (Start of Runway)
    var keys = 10;
    var keyWidth = 18;
    var keySpacing = (width - 120) / keys;
    for (var k = 0; k < keys; k++) {
      ctx.fillRect(60 + k * keySpacing, height - 260, keyWidth, 140);
    }

    // 5. Runway Designation Identifier: "09L"
    ctx.save();
    ctx.translate(width / 2, height - 320);
    ctx.rotate(Math.PI); // Facing approaching aircraft
    ctx.fillStyle = '#f0f4fc';
    ctx.font = '900 80px "Rajdhani", "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('09L', 0, 0);
    ctx.restore();

    // 6. Touchdown Zone Barrettes
    var tdzY = height - 520;
    for (var t = 0; t < 4; t++) {
      var currentY = tdzY - t * 240;
      if (currentY > 100) {
        // Left barrette
        ctx.fillRect(80, currentY, 40, 70);
        ctx.fillRect(130, currentY, 40, 70);
        // Right barrette
        ctx.fillRect(width - 170, currentY, 40, 70);
        ctx.fillRect(width - 120, currentY, 40, 70);
      }
    }

    // 7. Dashed Centerline Stripes
    ctx.fillStyle = '#f8fafc';
    var dashLength = 110;
    var gapLength = 90;
    var cycle = dashLength + gapLength;
    for (var cy = 0; cy < height - 360; cy += cycle) {
      ctx.fillRect(width / 2 - 5, cy, 10, dashLength);
    }

    // 8. Cyan High-Tech Inset Centerline LED Guides
    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 10;
    for (var led = 0; led < height; led += 60) {
      ctx.beginPath();
      ctx.arc(width / 2, led, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    var texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 4);
    texture.anisotropy = 8;
    return texture;
  }

  /**
   * Custom Atmospheric Rayleigh Edge Glow Shader Material
   */
  function createAtmosphereShaderMaterial() {
    var vertexShader = [
      'varying vec3 vNormal;',
      'varying vec3 vViewPosition;',
      'void main() {',
      '  vNormal = normalize(normalMatrix * normal);',
      '  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);',
      '  vViewPosition = -mvPosition.xyz;',
      '  gl_Position = projectionMatrix * mvPosition;',
      '}'
    ].join('\n');

    var fragmentShader = [
      'varying vec3 vNormal;',
      'varying vec3 vViewPosition;',
      'uniform vec3 uColor;',
      'uniform float uPower;',
      'uniform float uIntensity;',
      'void main() {',
      '  vec3 normal = normalize(vNormal);',
      '  vec3 viewDir = normalize(vViewPosition);',
      '  float rim = 1.0 - max(dot(viewDir, normal), 0.0);',
      '  float glow = pow(rim, uPower) * uIntensity;',
      '  gl_FragColor = vec4(uColor, glow);',
      '}'
    ].join('\n');

    return new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: {
        uColor: { value: new THREE.Color(0x00d4ff) }, // Vivid aeronautical cyan
        uPower: { value: 2.8 },
        uIntensity: { value: 1.5 }
      },
      blending: THREE.AdditiveBlending,
      side: THREE.FrontSide,
      transparent: true,
      depthWrite: false
    });
  }

  return {
    createEarthBaseTexture: createEarthBaseTexture,
    createEarthSpecularTexture: createEarthSpecularTexture,
    createEarthCloudsTexture: createEarthCloudsTexture,
    createRunwayTarmacTexture: createRunwayTarmacTexture,
    createAtmosphereShaderMaterial: createAtmosphereShaderMaterial
  };

})();
