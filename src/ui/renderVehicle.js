import { vehicleList } from "../data/vehicleData.js";

export function renderVehicle(vehicle, callbacks = {}) {
  document.documentElement.style.setProperty("--accent", vehicle.colors[0].hex);
  setText('[data-vehicle-field="heroLabel"]', vehicle.heroLabel);
  setText('[data-vehicle-field="name"]', vehicle.name);
  setText('[data-vehicle-field="tagline"]', vehicle.tagline);
  setText('[data-vehicle-field="description"]', vehicle.description);
  setText('[data-vehicle-field="powerShort"]', vehicle.powerShort);
  setText('[data-vehicle-field="accelerationShort"]', vehicle.accelerationShort);
  setText('[data-vehicle-field="generation"]', vehicle.generation);
  setText('[data-vehicle-field="imageCaption"]', vehicle.image.caption);
  updateWhatsAppLinks(vehicle);

  const image = document.querySelector("[data-vehicle-image]");
  const heroImage = document.querySelector("[data-hero-image]");
  if (image) {
    image.classList.add("is-switching");
    window.setTimeout(() => {
      image.classList.remove("is-switching");
    }, 420);
    image.src = vehicle.image.src;
    image.alt = vehicle.image.alt;
  }

  if (heroImage) {
    heroImage.classList.add("is-switching");
    window.setTimeout(() => {
      heroImage.classList.remove("is-switching");
    }, 420);
    heroImage.src = vehicle.image.src;
  }

  renderModelSelector(vehicle, callbacks);
  renderSpecs(vehicle);
  renderStory(vehicle);
  renderHotspots(vehicle, callbacks);
  renderDetailLabels(vehicle);
  renderColors(vehicle, callbacks);
  renderChecks(vehicle);
}

function setText(selector, text) {
  document.querySelectorAll(selector).forEach((node) => {
    node.textContent = text;
  });
}

function renderModelSelector(activeVehicle, callbacks) {
  const selector = document.querySelector("[data-model-selector]");
  if (!selector) return;
  selector.innerHTML = "";

  vehicleList.forEach((vehicle) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `model-button${vehicle.id === activeVehicle.id ? " is-active" : ""}`;
    button.setAttribute("aria-pressed", vehicle.id === activeVehicle.id ? "true" : "false");
    button.innerHTML = `
      <span>
        <strong>${vehicle.shortName}</strong>
        <span>${vehicle.generation} · ${vehicle.drivetrain}</span>
      </span>
      <em>${vehicle.id.toUpperCase()}</em>
    `;
    button.addEventListener("click", () => callbacks.onVehicleSelect?.(vehicle.id));
    selector.appendChild(button);
  });
}

function renderSpecs(vehicle) {
  const grid = document.querySelector("[data-spec-grid]");
  if (!grid) return;
  grid.innerHTML = "";

  vehicle.specs.forEach((spec) => {
    const item = document.createElement("article");
    item.className = "spec-item reveal is-visible";
    item.innerHTML = `
      <span>${spec.label}</span>
      <strong>${spec.value}</strong>
      <p>${spec.detail}</p>
    `;
    grid.appendChild(item);
  });
}

function renderStory(vehicle) {
  const storyRail = document.querySelector("[data-story-rail]");
  if (!storyRail) return;
  storyRail.innerHTML = "";

  vehicle.story.forEach((item) => {
    const section = document.createElement("article");
    section.className = "story-panel reveal";
    section.dataset.cameraKey = item.id;
    section.innerHTML = `
      <p class="eyebrow">${item.kicker}</p>
      <h2>${item.title}</h2>
      <p>${item.text}</p>
    `;
    storyRail.appendChild(section);
  });
}

function renderHotspots(vehicle, callbacks) {
  const list = document.querySelector("[data-hotspot-list]");
  if (!list) return;
  list.setAttribute("aria-label", `${vehicle.shortName} feature hotspots`);
  list.innerHTML = "";

  vehicle.hotspots.forEach((hotspot, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `hotspot-button${index === 0 ? " is-active" : ""}`;
    button.textContent = hotspot.label;
    button.addEventListener("click", () => {
      list.querySelectorAll(".hotspot-button").forEach((item) => item.classList.remove("is-active"));
      button.classList.add("is-active");
      updateHotspotPanel(hotspot);
      callbacks.onHotspotFocus?.(index);
    });
    list.appendChild(button);
  });

  updateHotspotPanel(vehicle.hotspots[0]);
}

function updateHotspotPanel(hotspot) {
  const panel = document.querySelector("[data-hotspot-panel]");
  if (!panel || !hotspot) return;
  panel.classList.remove("is-collapsed");
  panel.innerHTML = `
    <button class="panel-close" type="button" aria-label="Close feature panel">×</button>
    <span>${hotspot.label}</span>
    <h3>${hotspot.title}</h3>
    <p>${hotspot.description}</p>
  `;

  panel.querySelector(".panel-close").addEventListener("click", () => {
    panel.classList.toggle("is-collapsed");
  });
}

function renderDetailLabels(vehicle) {
  const detailList = document.querySelector("[data-detail-list]");
  if (!detailList) return;

  detailList.setAttribute("aria-label", `${vehicle.shortName} exterior detail labels`);
  detailList.innerHTML = "";

  vehicle.hotspots.forEach((hotspot) => {
    const label = document.createElement("span");
    label.textContent = hotspot.label;
    detailList.appendChild(label);
  });
}

function renderColors(vehicle, callbacks) {
  const colorList = document.querySelector("[data-color-list]");
  if (!colorList) return;
  colorList.innerHTML = "";

  vehicle.colors.forEach((color) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "color-chip";
    chip.setAttribute("aria-label", `${color.name}, verified color asset`);
    chip.innerHTML = `
      <span class="swatch" style="background:${color.hex}"></span>
      <strong>${color.name}</strong>
      <span class="verified-tag">Selected</span>
    `;
    chip.addEventListener("click", () => {
      document.documentElement.style.setProperty("--accent", color.hex);
      callbacks.onColorSelect?.(color);
    });
    colorList.appendChild(chip);
  });
}

function renderChecks(vehicle) {
  const checkList = document.querySelector("[data-check-list]");
  if (!checkList || !vehicle.checks) return;
  checkList.innerHTML = "";

  vehicle.checks.forEach((check) => {
    const item = document.createElement("li");
    item.innerHTML = `<strong>Checked:</strong> ${check}`;
    checkList.appendChild(item);
  });
}

function updateWhatsAppLinks(vehicle) {
  const phoneNumber = "201001234567";
  const messages = {
    "test-drive": `I want to book a ${vehicle.name} test drive`,
    contact: `I want to contact BMW M Showroom Egypt about the ${vehicle.name}`,
  };

  document.querySelectorAll("[data-vehicle-whatsapp]").forEach((link) => {
    const message = messages[link.dataset.vehicleWhatsapp] || messages.contact;
    link.href = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    link.setAttribute("aria-label", `${link.textContent.trim()} for ${vehicle.name}`);
  });
}
