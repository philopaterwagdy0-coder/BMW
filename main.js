import { primaryVehicle, vehicleList, vehicles } from "./src/data/vehicleData.js";
import { renderVehicle } from "./src/ui/renderVehicle.js";
import { createShowroomScene } from "./src/three/showroomScene.js";
import { initCursor, initScrollExperience } from "./src/animations/scrollAnimations.js";

window.__VEHICLE_DATA__ = vehicles;
let selectedVehicle = primaryVehicle;

const loadingScreen = document.querySelector("[data-loading-screen]");
const loadingValue = document.querySelector("[data-loading-value]");
const intro = document.querySelector("[data-intro]");
const skipIntro = document.querySelector("[data-skip-intro]");
const canvas = document.querySelector("#bmw-canvas");

const sceneController = createShowroomScene({
  canvas,
  vehicle: primaryVehicle,
  onProgress: (value) => {
    loadingValue.textContent = `${value}%`;
  },
  onReady: () => {
    loadingScreen.classList.add("is-hidden");
    runIntro();
  },
});

renderVehicle(primaryVehicle, {
  onVehicleSelect: selectVehicle,
  onHotspotFocus: sceneController.focusHotspot,
  onColorSelect: () => sceneController.setCameraKey("hero", 0.12),
});

initScrollExperience({ sceneController });
initCursor();

window.addEventListener("resize", sceneController.resize, { passive: true });

function runIntro() {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) {
    finishIntro();
    sceneController.setIntroProgress(1);
    return;
  }

  let startTime = null;
  const duration = 1600;

  function step(timestamp) {
    if (!startTime) startTime = timestamp;
    const progress = Math.min((timestamp - startTime) / duration, 1);
    sceneController.setIntroProgress(progress);
    intro.style.setProperty("--intro-progress", progress);

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      finishIntro();
    }
  }

  requestAnimationFrame(step);
}

function finishIntro() {
  intro.classList.add("is-complete");
}

function selectVehicle(vehicleId) {
  const nextVehicle = vehicleList.find((vehicle) => vehicle.id === vehicleId);
  if (!nextVehicle || nextVehicle.id === selectedVehicle.id) return;

  selectedVehicle = nextVehicle;
  document.body.classList.add("is-vehicle-switching");
  sceneController.setVehicle(nextVehicle);
  renderVehicle(nextVehicle, {
    onVehicleSelect: selectVehicle,
    onHotspotFocus: sceneController.focusHotspot,
    onColorSelect: () => sceneController.setCameraKey("hero", 0.12),
  });
  sceneController.setCameraKey("hero", 0.18);
  window.setTimeout(() => document.body.classList.remove("is-vehicle-switching"), 520);
}

skipIntro.addEventListener("click", () => {
  sceneController.setIntroProgress(1);
  finishIntro();
});
