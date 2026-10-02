export function initScrollExperience({ sceneController }) {
  const progressBar = document.querySelector("[data-scroll-progress]");
  const header = document.querySelector("[data-header]");
  const storyPanels = [...document.querySelectorAll("[data-camera-key]")];
  const revealItems = [...document.querySelectorAll(".reveal")];

  const update = () => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
    progressBar.style.transform = `scaleX(${Math.min(Math.max(progress, 0), 1)})`;
    header.classList.toggle("is-scrolled", window.scrollY > 16);

    const activePanel = storyPanels.find((panel) => {
      const rect = panel.getBoundingClientRect();
      return rect.top < window.innerHeight * 0.6 && rect.bottom > window.innerHeight * 0.26;
    });

    if (activePanel) {
      sceneController.setCameraKey(activePanel.dataset.cameraKey);
    } else if (window.scrollY < window.innerHeight * 0.8) {
      sceneController.setCameraKey("hero", 0.045);
    }
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle("is-visible", entry.isIntersecting);
      });
    },
    { threshold: 0.22 }
  );

  revealItems.forEach((item) => observer.observe(item));
  window.addEventListener("scroll", update, { passive: true });
  update();

  return {
    update,
  };
}

export function initCursor() {
  const cursor = document.querySelector("[data-cursor]");
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  if (!cursor || !finePointer) return;

  window.addEventListener("pointermove", (event) => {
    cursor.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
  });

  document.querySelectorAll("a, button, canvas").forEach((element) => {
    element.addEventListener("pointerenter", () => {
      cursor.classList.add("is-active");
      cursor.textContent = element.tagName === "CANVAS" ? "DRAG" : "VIEW";
    });
    element.addEventListener("pointerleave", () => {
      cursor.classList.remove("is-active");
      cursor.textContent = "";
    });
  });
}
