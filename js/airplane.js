/**
 * SkyShield - 3D Airplane Model & Flight Dynamics
 * Constructs a procedural modern commercial/supersonic jet with
 * twin turbofans, navigation lights, glowing HUD cockpit, and dynamic light contrails.
 */

window.SkyShieldAirplane = (function() {
  'use strict';

  function createAirplane() {
    var planeGroup = new THREE.Group();

    // Materials
    var hullMaterial = new THREE.MeshStandardMaterial({
      color: 0xe6edf8,
      metalness: 0.82,
      roughness: 0.28,
      envMapIntensity: 1.2
    });

    var darkTrimMaterial = new THREE.MeshStandardMaterial({
      color: 0x0c1424,
      metalness: 0.9,
      roughness: 0.2
    });

    var cyanEmissiveMaterial = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00d4ff,
      emissiveIntensity: 1.8,
      roughness: 0.1
    });

    var glassCockpitMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x002b4d,
      emissive: 0x001f3f,
      metalness: 0.9,
      roughness: 0.1,
      transparent: true,
      opacity: 0.85
    });

    // 1. Aerodynamic Fuselage (Multi-stage tapered cylinder)
    var fuselageGeo = new THREE.CylinderGeometry(0.7, 0.45, 8.5, 24);
    fuselageGeo.rotateX(Math.PI / 2);
    var fuselage = new THREE.Mesh(fuselageGeo, hullMaterial);
    fuselage.castShadow = true;
    fuselage.receiveShadow = true;
    planeGroup.add(fuselage);

    // Streamlined Nose Cone
    var noseGeo = new THREE.ConeGeometry(0.7, 2.4, 24);
    noseGeo.rotateX(-Math.PI / 2);
    var nose = new THREE.Mesh(noseGeo, hullMaterial);
    nose.position.set(0, 0, 4.25 + 1.2);
    nose.castShadow = true;
    planeGroup.add(nose);

    // Chiseled Cockpit Canopy
    var cockpitGeo = new THREE.BoxGeometry(0.72, 0.5, 1.8);
    cockpitGeo.scale(0.85, 0.7, 1.1);
    var cockpit = new THREE.Mesh(cockpitGeo, glassCockpitMaterial);
    cockpit.position.set(0, 0.55, 3.8);
    cockpit.rotation.x = -0.15;
    planeGroup.add(cockpit);

    // 2. Swept Main Wings
    var wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0);
    wingShape.lineTo(6.8, -2.4);  // Wingtip trailing edge
    wingShape.lineTo(6.6, -1.8);  // Wingtip leading edge
    wingShape.lineTo(0, 1.6);     // Wing root leading edge
    wingShape.closePath();

    var wingExtrudeSettings = { depth: 0.14, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.04, bevelThickness: 0.04 };
    var wingGeo = new THREE.ExtrudeGeometry(wingShape, wingExtrudeSettings);
    wingGeo.rotateX(Math.PI / 2);
    wingGeo.center();

    // Right Wing
    var rightWing = new THREE.Mesh(wingGeo, hullMaterial);
    rightWing.position.set(3.4, -0.05, 0.2);
    rightWing.rotation.z = -0.04; // Subtle dihedral angle
    rightWing.castShadow = true;
    planeGroup.add(rightWing);

    // Left Wing (Mirrored)
    var leftWing = rightWing.clone();
    leftWing.scale.set(-1, 1, 1);
    leftWing.position.set(-3.4, -0.05, 0.2);
    leftWing.rotation.z = 0.04;
    leftWing.castShadow = true;
    planeGroup.add(leftWing);

    // Winglets (Vertical canted aerodynamic tips)
    var wingletGeo = new THREE.BoxGeometry(0.08, 0.9, 0.6);
    var rightWinglet = new THREE.Mesh(wingletGeo, darkTrimMaterial);
    rightWinglet.position.set(6.7, 0.45, -0.9);
    rightWinglet.rotation.z = 0.25;
    planeGroup.add(rightWinglet);

    var leftWinglet = new THREE.Mesh(wingletGeo, darkTrimMaterial);
    leftWinglet.position.set(-6.7, 0.45, -0.9);
    leftWinglet.rotation.z = -0.25;
    planeGroup.add(leftWinglet);

    // 3. Tail Section
    // Vertical Stabilizer (Fin)
    var finShape = new THREE.Shape();
    finShape.moveTo(0, 0);
    finShape.lineTo(-1.8, 2.2);
    finShape.lineTo(-1.2, 2.2);
    finShape.lineTo(0.5, 0);
    finShape.closePath();

    var finGeo = new THREE.ExtrudeGeometry(finShape, { depth: 0.1, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02 });
    finGeo.rotateY(Math.PI / 2);
    finGeo.center();
    var fin = new THREE.Mesh(finGeo, darkTrimMaterial);
    fin.position.set(0, 1.25, -3.4);
    fin.rotation.x = -0.2;
    fin.castShadow = true;
    planeGroup.add(fin);

    // Horizontal Stabilizers (Elevators)
    var hStabGeo = new THREE.BoxGeometry(3.6, 0.08, 0.9);
    var hStab = new THREE.Mesh(hStabGeo, hullMaterial);
    hStab.position.set(0, 0.4, -3.8);
    hStab.castShadow = true;
    planeGroup.add(hStab);

    // 4. Twin Turbofan Jet Engines
    var engineGeo = new THREE.CylinderGeometry(0.42, 0.38, 2.2, 18);
    engineGeo.rotateX(Math.PI / 2);

    // Right Engine
    var rightEngine = new THREE.Mesh(engineGeo, darkTrimMaterial);
    rightEngine.position.set(2.1, -0.5, 0.3);
    rightEngine.castShadow = true;
    planeGroup.add(rightEngine);

    // Right Exhaust Glow (Cyan plasma core)
    var exhaustGeo = new THREE.CylinderGeometry(0.3, 0.32, 0.3, 16);
    exhaustGeo.rotateX(Math.PI / 2);
    var rightExhaust = new THREE.Mesh(exhaustGeo, cyanEmissiveMaterial);
    rightExhaust.position.set(2.1, -0.5, -0.9);
    planeGroup.add(rightExhaust);

    // Left Engine
    var leftEngine = new THREE.Mesh(engineGeo, darkTrimMaterial);
    leftEngine.position.set(-2.1, -0.5, 0.3);
    leftEngine.castShadow = true;
    planeGroup.add(leftEngine);

    var leftExhaust = new THREE.Mesh(exhaustGeo, cyanEmissiveMaterial);
    leftExhaust.position.set(-2.1, -0.5, -0.9);
    planeGroup.add(leftExhaust);

    // 5. Aeronautical Navigation Light Beacons
    // Red beacon (Port / Left wingtip)
    var redBeaconGeo = new THREE.SphereGeometry(0.08, 8, 8);
    var redBeaconMat = new THREE.MeshBasicMaterial({ color: 0xff1e38 });
    var redBeacon = new THREE.Mesh(redBeaconGeo, redBeaconMat);
    redBeacon.position.set(-6.75, 0.85, -0.9);
    planeGroup.add(redBeacon);

    // Green beacon (Starboard / Right wingtip)
    var greenBeaconGeo = new THREE.SphereGeometry(0.08, 8, 8);
    var greenBeaconMat = new THREE.MeshBasicMaterial({ color: 0x00ff66 });
    var greenBeacon = new THREE.Mesh(greenBeaconGeo, greenBeaconMat);
    greenBeacon.position.set(6.75, 0.85, -0.9);
    planeGroup.add(greenBeacon);

    // White strobe (Tail fin top)
    var tailStrobeGeo = new THREE.SphereGeometry(0.07, 8, 8);
    var tailStrobeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    var tailStrobe = new THREE.Mesh(tailStrobeGeo, tailStrobeMat);
    tailStrobe.position.set(0, 2.3, -4.1);
    planeGroup.add(tailStrobe);

    // Scale overall jet model to a suitable proportion
    planeGroup.scale.set(0.65, 0.65, 0.65);

    // 6. Contrail Light Ribbon System
    var trailData = createContrailSystem();

    return {
      mesh: planeGroup,
      trail: trailData,
      leftExhaustPos: new THREE.Vector3(-2.1 * 0.65, -0.5 * 0.65, -0.9 * 0.65),
      rightExhaustPos: new THREE.Vector3(2.1 * 0.65, -0.5 * 0.65, -0.9 * 0.65),
      updateLights: function(time) {
        // Pulse tail strobe every second
        var strobeIntensity = (Math.sin(time * 6) > 0.85) ? 1.0 : 0.05;
        tailStrobeMat.color.setRGB(strobeIntensity, strobeIntensity, strobeIntensity);
      }
    };
  }

  /**
   * Dual Contrail Ribbon System (Subtle, luminous light trails behind engines)
   */
  function createContrailSystem() {
    var maxPoints = 80;
    var positionsL = new Float32Array(maxPoints * 3);
    var positionsR = new Float32Array(maxPoints * 3);
    var alphas = new Float32Array(maxPoints);

    var historyL = [];
    var historyR = [];

    // Geometry & Material for Light Ribbon Trails
    var geoL = new THREE.BufferGeometry();
    geoL.setAttribute('position', new THREE.BufferAttribute(positionsL, 3));

    var geoR = new THREE.BufferGeometry();
    geoR.setAttribute('position', new THREE.BufferAttribute(positionsR, 3));

    var trailMat = new THREE.LineBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      linewidth: 2
    });

    var lineL = new THREE.Line(geoL, trailMat);
    var lineR = new THREE.Line(geoR, trailMat);
    lineL.frustumCulled = false;
    lineR.frustumCulled = false;

    var trailGroup = new THREE.Group();
    trailGroup.add(lineL);
    trailGroup.add(lineR);

    return {
      group: trailGroup,
      update: function(pL, pR) {
        // Prepend latest points
        historyL.unshift(pL.clone());
        historyR.unshift(pR.clone());

        if (historyL.length > maxPoints) historyL.pop();
        if (historyR.length > maxPoints) historyR.pop();

        var posArrL = geoL.attributes.position.array;
        var posArrR = geoR.attributes.position.array;

        for (var i = 0; i < maxPoints; i++) {
          var ptL = historyL[i] || historyL[historyL.length - 1] || pL;
          var ptR = historyR[i] || historyR[historyR.length - 1] || pR;

          posArrL[i * 3]     = ptL.x;
          posArrL[i * 3 + 1] = ptL.y;
          posArrL[i * 3 + 2] = ptL.z;

          posArrR[i * 3]     = ptR.x;
          posArrR[i * 3 + 1] = ptR.y;
          posArrR[i * 3 + 2] = ptR.z;
        }

        geoL.attributes.position.needsUpdate = true;
        geoR.attributes.position.needsUpdate = true;
      }
    };
  }

  return {
    createAirplane: createAirplane
  };

})();
