/**
 * SkyShield - Futuristic Airport Runway & Infrastructure Environment
 * Constructs a high-detail aeronautical runway with runway edge lights,
 * centerline LEDs, PAPI glide-slope indicators, distance markers,
 * futuristic ATC tower, rotating ground radar, and atmospheric low mist.
 */

window.SkyShieldRunway = (function() {
  'use strict';

  function createRunwayEnvironment() {
    var runwayGroup = new THREE.Group();

    // Materials
    var tarmacTexture = SkyShieldTextures.createRunwayTarmacTexture();
    var runwayMat = new THREE.MeshStandardMaterial({
      map: tarmacTexture,
      roughness: 0.85,
      metalness: 0.15
    });

    var shoulderMat = new THREE.MeshStandardMaterial({
      color: 0x090d14,
      roughness: 0.95,
      metalness: 0.05
    });

    var terrainMat = new THREE.MeshStandardMaterial({
      color: 0x03060a,
      roughness: 0.98,
      metalness: 0.02
    });

    // 1. Main Runway Tarmac Strip (Width: 44, Length: 1200)
    var runwayLength = 1200;
    var runwayWidth = 44;
    var runwayGeo = new THREE.PlaneGeometry(runwayWidth, runwayLength, 8, 32);
    runwayGeo.rotateX(-Math.PI / 2);
    var runwayMesh = new THREE.Mesh(runwayGeo, runwayMat);
    runwayMesh.position.set(0, 0, -runwayLength / 2 + 50);
    runwayMesh.receiveShadow = true;
    runwayGroup.add(runwayMesh);

    // 2. Concrete Blast Pads & Shoulders
    var shoulderLeftGeo = new THREE.PlaneGeometry(16, runwayLength);
    shoulderLeftGeo.rotateX(-Math.PI / 2);
    var shoulderLeft = new THREE.Mesh(shoulderLeftGeo, shoulderMat);
    shoulderLeft.position.set(-runwayWidth / 2 - 8, -0.01, -runwayLength / 2 + 50);
    runwayGroup.add(shoulderLeft);

    var shoulderRight = shoulderLeft.clone();
    shoulderRight.position.x = runwayWidth / 2 + 8;
    runwayGroup.add(shoulderRight);

    // 3. Vast Outer Ground Terrain Plane
    var terrainGeo = new THREE.PlaneGeometry(1600, 2000);
    terrainGeo.rotateX(-Math.PI / 2);
    var terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.position.set(0, -0.05, -runwayLength / 2);
    runwayGroup.add(terrainMesh);

    // 4. Elevated Runway Edge Lights (Spaced every 25 units)
    var edgeLightsGroup = new THREE.Group();
    var fixtureGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.4, 8);
    var bulbGeo = new THREE.SphereGeometry(0.14, 8, 8);

    var fixtureMat = new THREE.MeshStandardMaterial({ color: 0x111622, metalness: 0.8, roughness: 0.3 });
    var whiteBulbMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    var amberBulbMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    var greenBulbMat = new THREE.MeshBasicMaterial({ color: 0x00ff77 });

    var lightSpacing = 26;
    var numLights = Math.floor(runwayLength / lightSpacing);

    for (var i = 0; i <= numLights; i++) {
      var zPos = 50 - (i * lightSpacing);
      var isRolloutZone = (i > numLights * 0.75); // Last 25% is amber caution zone
      var isThreshold = (i === 0);
      var bulbMat = isThreshold ? greenBulbMat : (isRolloutZone ? amberBulbMat : whiteBulbMat);

      // Left edge light
      var postL = new THREE.Mesh(fixtureGeo, fixtureMat);
      postL.position.set(-runwayWidth / 2 - 0.8, 0.2, zPos);
      var bulbL = new THREE.Mesh(bulbGeo, bulbMat);
      bulbL.position.set(0, 0.22, 0);
      postL.add(bulbL);
      edgeLightsGroup.add(postL);

      // Right edge light
      var postR = new THREE.Mesh(fixtureGeo, fixtureMat);
      postR.position.set(runwayWidth / 2 + 0.8, 0.2, zPos);
      var bulbR = new THREE.Mesh(bulbGeo, bulbMat);
      bulbR.position.set(0, 0.22, 0);
      postR.add(bulbR);
      edgeLightsGroup.add(postR);
    }
    runwayGroup.add(edgeLightsGroup);

    // 5. Inset Runway Centerline Flush Lights
    var centerlineGroup = new THREE.Group();
    var clBulbGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.05, 8);
    var clBulbMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff }); // High-tech aviation cyan

    var clSpacing = 16;
    var numClLights = Math.floor(runwayLength / clSpacing);
    var clLightsArray = [];

    for (var c = 0; c < numClLights; c++) {
      var clZ = 45 - (c * clSpacing);
      var clMesh = new THREE.Mesh(clBulbGeo, clBulbMat);
      clMesh.position.set(0, 0.04, clZ);
      centerlineGroup.add(clMesh);
      clLightsArray.push(clMesh);
    }
    runwayGroup.add(centerlineGroup);

    // 6. PAPI (Precision Approach Path Indicator) Array (Port side at Touchdown Zone)
    var papiGroup = new THREE.Group();
    papiGroup.position.set(-runwayWidth / 2 - 7, 0, -220);
    var papiBoxGeo = new THREE.BoxGeometry(0.8, 0.5, 0.8);
    var papiBoxMat = new THREE.MeshStandardMaterial({ color: 0x242d3d, metalness: 0.8, roughness: 0.3 });

    for (var p = 0; p < 4; p++) {
      var pBox = new THREE.Mesh(papiBoxGeo, papiBoxMat);
      pBox.position.set(-p * 2.2, 0.3, 0);
      var pLightGeo = new THREE.SphereGeometry(0.18, 8, 8);
      // 2 white, 2 red (on glide path indicator)
      var pColor = (p < 2) ? 0xffffff : 0xff1e2b;
      var pBulb = new THREE.Mesh(pLightGeo, new THREE.MeshBasicMaterial({ color: pColor }));
      pBulb.position.set(0, 0.05, 0.42);
      pBox.add(pBulb);
      papiGroup.add(pBox);
    }
    runwayGroup.add(papiGroup);

    // 7. Distance-To-Go Runway Signs (Black signs with illuminated white numbers 5, 4, 3, 2, 1)
    var signGroup = new THREE.Group();
    var signGeo = new THREE.BoxGeometry(1.6, 2.2, 0.3);
    var signMat = new THREE.MeshStandardMaterial({ color: 0x05070c, roughness: 0.5 });

    var distSigns = ['5', '4', '3', '2', '1'];
    distSigns.forEach(function(num, idx) {
      var sZ = -200 - (idx * 180);
      var sMesh = new THREE.Mesh(signGeo, signMat);
      sMesh.position.set(runwayWidth / 2 + 5.5, 1.1, sZ);
      sMesh.rotation.y = -0.3; // Angled towards rolling aircraft

      // Procedural canvas label for number
      var sc = document.createElement('canvas');
      sc.width = 128;
      sc.height = 128;
      var sctx = sc.getContext('2d');
      sctx.fillStyle = '#0a0d14';
      sctx.fillRect(0, 0, 128, 128);
      sctx.fillStyle = '#ffffff';
      sctx.font = 'bold 84px "Rajdhani", sans-serif';
      sctx.textAlign = 'center';
      sctx.textBaseline = 'middle';
      sctx.fillText(num, 64, 64);
      var sTex = new THREE.CanvasTexture(sc);

      var numPlate = new THREE.Mesh(
        new THREE.PlaneGeometry(1.4, 2.0),
        new THREE.MeshBasicMaterial({ map: sTex })
      );
      numPlate.position.set(0, 0, 0.16);
      sMesh.add(numPlate);
      signGroup.add(sMesh);
    });
    runwayGroup.add(signGroup);

    // 8. Futuristic Airport Air Traffic Control (ATC) Tower
    var atcGroup = new THREE.Group();
    atcGroup.position.set(130, 0, -380);

    // Tower Shaft (Hexagonal tapered column)
    var shaftGeo = new THREE.CylinderGeometry(5.5, 8.5, 95, 6);
    var towerMat = new THREE.MeshStandardMaterial({ color: 0x141a26, metalness: 0.85, roughness: 0.25 });
    var shaft = new THREE.Mesh(shaftGeo, towerMat);
    shaft.position.y = 47.5;
    shaft.castShadow = true;
    atcGroup.add(shaft);

    // Vertical Cyan Accent Light Strips on Tower
    var stripGeo = new THREE.BoxGeometry(0.2, 90, 0.3);
    var stripMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    for (var s = 0; s < 6; s++) {
      var angle = (s / 6) * Math.PI * 2;
      var str = new THREE.Mesh(stripGeo, stripMat);
      str.position.set(Math.cos(angle) * 7.1, 48, Math.sin(angle) * 7.1);
      atcGroup.add(str);
    }

    // ATC Observation Cab (Cantilevered 360-degree glass gallery)
    var cabGeo = new THREE.CylinderGeometry(13.5, 8.5, 12, 12);
    var cabMat = new THREE.MeshPhysicalMaterial({
      color: 0x002f54,
      emissive: 0x00172e,
      metalness: 0.9,
      roughness: 0.1,
      transparent: true,
      opacity: 0.85
    });
    var cab = new THREE.Mesh(cabGeo, cabMat);
    cab.position.y = 96;
    atcGroup.add(cab);

    // Roof & Radome Array
    var roofGeo = new THREE.CylinderGeometry(14, 13.5, 2.5, 12);
    var roof = new THREE.Mesh(roofGeo, towerMat);
    roof.position.y = 103;
    atcGroup.add(roof);

    var radomeGeo = new THREE.SphereGeometry(3.2, 16, 16);
    var radomeMat = new THREE.MeshStandardMaterial({ color: 0xe6edf8, roughness: 0.4 });
    var radome = new THREE.Mesh(radomeGeo, radomeMat);
    radome.position.set(0, 106.5, 0);
    atcGroup.add(radome);

    // Rotating ATC Beacon Light
    var beaconGroup = new THREE.Group();
    beaconGroup.position.set(0, 110.5, 0);
    var beaconBulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.8, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x00ff88 })
    );
    beaconGroup.add(beaconBulb);

    var beaconLight = new THREE.SpotLight(0x00ff88, 3.5, 300, Math.PI / 6, 0.4);
    beaconLight.position.set(0, 0, 0);
    beaconGroup.add(beaconLight);
    beaconLight.target.position.set(60, -80, 0);
    beaconGroup.add(beaconLight.target);

    atcGroup.add(beaconGroup);
    runwayGroup.add(atcGroup);

    // 9. Ground Surveillance Radar Station (Rotating curved parabolic dish)
    var radarGroup = new THREE.Group();
    radarGroup.position.set(-110, 0, -280);

    var radarStandGeo = new THREE.CylinderGeometry(1.5, 3.0, 18, 8);
    var radarStand = new THREE.Mesh(radarStandGeo, towerMat);
    radarStand.position.y = 9;
    radarGroup.add(radarStand);

    var radarDishGroup = new THREE.Group();
    radarDishGroup.position.y = 19;

    var dishGeo = new THREE.CylinderGeometry(8.5, 8.5, 1.2, 16, 1, true, 0, Math.PI);
    dishGeo.rotateZ(Math.PI / 2);
    var dishMat = new THREE.MeshStandardMaterial({ color: 0x222e42, metalness: 0.8, roughness: 0.3, side: THREE.DoubleSide });
    var dish = new THREE.Mesh(dishGeo, dishMat);
    radarDishGroup.add(dish);

    var radarFeedGeo = new THREE.CylinderGeometry(0.12, 0.12, 3.5);
    radarFeedGeo.rotateX(Math.PI / 2);
    var radarFeed = new THREE.Mesh(radarFeedGeo, fixtureMat);
    radarFeed.position.set(0, 0, 2.5);
    radarDishGroup.add(radarFeed);

    var radarTip = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff3b30 }));
    radarTip.position.set(0, 0, 4.2);
    radarDishGroup.add(radarTip);

    radarGroup.add(radarDishGroup);
    runwayGroup.add(radarGroup);

    // 10. Low-Altitude Atmospheric Runway Mist Layer
    var mistGeo = new THREE.PlaneGeometry(runwayWidth * 3.5, runwayLength);
    mistGeo.rotateX(-Math.PI / 2);
    var mistMat = new THREE.MeshBasicMaterial({
      color: 0x0a1e38,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    var mistMesh = new THREE.Mesh(mistGeo, mistMat);
    mistMesh.position.set(0, 0.6, -runwayLength / 2 + 50);
    runwayGroup.add(mistMesh);

    return {
      group: runwayGroup,
      update: function(time) {
        // Rotate ground surveillance radar smoothly
        radarDishGroup.rotation.y = time * 1.8;

        // Rotate ATC beacon light
        beaconGroup.rotation.y = time * 2.2;

        // Subtle forward pulse on centerline lights
        var pulseOffset = (time * 8) % clSpacing;
        for (var i = 0; i < clLightsArray.length; i++) {
          var lightZ = clLightsArray[i].position.z;
          var wave = Math.sin((lightZ + pulseOffset) * 0.08);
          var brightness = 0.5 + 0.5 * Math.max(0, wave);
          clLightsArray[i].material.color.setRGB(0, brightness * 0.94, brightness);
        }
      }
    };
  }

  return {
    createRunwayEnvironment: createRunwayEnvironment
  };

})();
