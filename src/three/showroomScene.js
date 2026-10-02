import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { cameraKeyframes } from "./cameraKeyframes.js";

export function createShowroomScene({ canvas, vehicle, onProgress, onReady }) {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x05070b, 8, 28);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.fromArray(cameraKeyframes.hero.camera);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.enablePan = false;
  controls.minDistance = 5.8;
  controls.maxDistance = 10.2;
  controls.maxPolarAngle = Math.PI * 0.57;
  controls.minPolarAngle = Math.PI * 0.3;
  controls.target.fromArray(cameraKeyframes.hero.target);

  const stage = new THREE.Group();
  const rings = new THREE.Group();
  const hotspotMarkers = new THREE.Group();
  const lightRig = new THREE.Group();
  scene.add(stage, rings, hotspotMarkers, lightRig);
  let imagePlane = null;

  const frameMaterial = new THREE.MeshStandardMaterial({
    color: 0x0b1018,
    metalness: 0.7,
    roughness: 0.22,
  });

  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0x77b8ff,
    transparent: true,
    opacity: 0.22,
    side: THREE.DoubleSide,
  });

  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0x0c1320,
    metalness: 0.64,
    roughness: 0.28,
    transparent: true,
    opacity: 0.78,
  });

  const frame = new THREE.Mesh(new THREE.BoxGeometry(6.18, 6.18, 0.08), frameMaterial);
  frame.position.set(1.55, 0.48, -0.45);
  frame.rotation.y = -0.18;
  stage.add(frame);

  const floor = new THREE.Mesh(new THREE.CylinderGeometry(4.4, 4.7, 0.08, 96), floorMaterial);
  floor.position.set(1.4, -2.58, -0.15);
  floor.receiveShadow = true;
  stage.add(floor);

  for (let i = 0; i < 5; i += 1) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(3.45 + i * 0.28, 0.01, 12, 128),
      glowMaterial.clone()
    );
    ring.position.set(1.25, -2.48 + i * 0.015, -0.1);
    ring.rotation.x = Math.PI / 2.05;
    ring.material.opacity = 0.2 - i * 0.025;
    rings.add(ring);
  }

  const grid = new THREE.GridHelper(16, 26, 0x1a73d8, 0x27374e);
  grid.position.set(1.2, -2.54, -0.1);
  grid.material.transparent = true;
  grid.material.opacity = 0.24;
  scene.add(grid);

  createHotspotMarkers(hotspotMarkers);
  createLights(scene, lightRig);
  loadVehicleTexture(vehicle, renderer, onProgress, (texture) => {
    imagePlane = createImagePlane(texture);
    stage.add(imagePlane);
    window.__BMW_IMAGE_TEXTURE_READY = true;
    onReady?.();
  });

  function resize() {
    const { clientWidth, clientHeight } = canvas.parentElement;
    renderer.setSize(clientWidth, clientHeight, false);
    camera.aspect = clientWidth / Math.max(clientHeight, 1);
    camera.updateProjectionMatrix();

    if (clientWidth < 720) {
      camera.position.set(1.35, 1.25, 9.2);
      controls.target.set(1.18, 0.25, 0);
    }
  }

  function focusHotspot(index) {
    const focusTargets = [
      new THREE.Vector3(1.0, 0.2, 0),
      new THREE.Vector3(2.25, -0.75, 0),
      new THREE.Vector3(2.55, -1.0, 0),
      new THREE.Vector3(1.25, 1.08, 0),
    ];
    controls.target.copy(focusTargets[index] || focusTargets[0]);
  }

  function setVehicle(nextVehicle) {
    const loader = new THREE.TextureLoader();
    loader.load(nextVehicle.image.src, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      if (!imagePlane) {
        imagePlane = createImagePlane(texture);
        stage.add(imagePlane);
        return;
      }

      if (imagePlane.material.map) {
        imagePlane.material.map.dispose();
      }
      imagePlane.material.map = texture;
      imagePlane.material.needsUpdate = true;
      stage.scale.setScalar(0.965);
      window.setTimeout(() => stage.scale.setScalar(1), 220);
    });
  }

  function setCameraKey(key, mix = 0.08) {
    const keyframe = cameraKeyframes[key] || cameraKeyframes.hero;
    camera.position.lerp(new THREE.Vector3(...keyframe.camera), mix);
    controls.target.lerp(new THREE.Vector3(...keyframe.target), mix);
    stage.rotation.y = THREE.MathUtils.lerp(stage.rotation.y, keyframe.stageRotationY, mix);
  }

  function setIntroProgress(progress) {
    const eased = 1 - Math.pow(1 - progress, 3);
    stage.position.y = THREE.MathUtils.lerp(-0.18, 0, eased);
    stage.scale.setScalar(THREE.MathUtils.lerp(0.92, 1, eased));
    lightRig.children.forEach((light, index) => {
      light.intensity = light.userData.baseIntensity * THREE.MathUtils.lerp(0.15, 1, eased) + index * 0.02;
    });
  }

  const clock = new THREE.Clock();
  let firstFrameRendered = false;

  function animate() {
    const elapsed = clock.getElapsedTime();

    if (!prefersReducedMotion) {
      stage.position.y += (Math.sin(elapsed * 0.9) * 0.035 - stage.position.y) * 0.025;
      rings.rotation.z = -elapsed * 0.08;
      hotspotMarkers.children.forEach((marker, index) => {
        const pulse = 1 + Math.sin(elapsed * 2.2 + index) * 0.22;
        marker.scale.setScalar(pulse);
      });
    }

    controls.update();
    renderer.render(scene, camera);

    if (!firstFrameRendered) {
      firstFrameRendered = true;
      window.__BMW_SCENE_READY = true;
    }

    requestAnimationFrame(animate);
  }

  resize();
  setIntroProgress(prefersReducedMotion ? 1 : 0);
  animate();

  return {
    resize,
    focusHotspot,
    setVehicle,
    setCameraKey,
    setIntroProgress,
    renderer,
  };
}

function createImagePlane(texture) {
  const imagePlane = new THREE.Mesh(
    new THREE.PlaneGeometry(5.95, 5.95),
    new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      toneMapped: false,
    })
  );
  imagePlane.name = "selected-bmw-model-image-plane";
  imagePlane.position.set(1.55, 0.48, -0.38);
  imagePlane.rotation.y = -0.18;
  return imagePlane;
}

function createHotspotMarkers(hotspotMarkers) {
  const markerMaterial = new THREE.MeshBasicMaterial({
    color: 0x77b8ff,
    transparent: true,
    opacity: 0.88,
  });

  const markerPositions = [
    [0.65, 0.18, 0.05],
    [2.36, -1.18, 0.05],
    [2.85, -0.98, 0.05],
    [1.34, 1.55, 0.05],
  ];

  markerPositions.forEach((position, index) => {
    const marker = new THREE.Mesh(new THREE.SphereGeometry(0.055, 20, 20), markerMaterial.clone());
    marker.position.set(position[0], position[1], position[2]);
    marker.name = `hotspot-${index}`;
    hotspotMarkers.add(marker);
  });

  hotspotMarkers.position.set(1.0, 0, 0.45);
  hotspotMarkers.rotation.y = -0.18;
}

function createLights(scene, lightRig) {
  scene.add(new THREE.HemisphereLight(0xcfe7ff, 0x05070b, 1.35));

  const lights = [
    new THREE.DirectionalLight(0xffffff, 2.2),
    new THREE.PointLight(0x2d7fff, 9, 12),
    new THREE.PointLight(0xffffff, 5, 10),
  ];

  lights[0].position.set(0, 6, 4);
  lights[1].position.set(-3.2, 1.6, 3.2);
  lights[2].position.set(4.4, 2.2, -3.2);

  lights.forEach((light) => {
    light.userData.baseIntensity = light.intensity;
    lightRig.add(light);
  });
}

function loadVehicleTexture(vehicle, renderer, onProgress, onLoad) {
  const manager = new THREE.LoadingManager();
  manager.onProgress = (_url, loaded, total) => {
    onProgress?.(Math.round((loaded / Math.max(total, 1)) * 100));
  };
  manager.onLoad = () => {
    onProgress?.(100);
  };

  const textureLoader = new THREE.TextureLoader(manager);
  textureLoader.load(vehicle.image.src, (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    onLoad?.(texture);
  });
}
