const header = document.querySelector("[data-header]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const modal = document.querySelector("[data-modal]");
const modalTitle = document.querySelector("#modal-title");
const modalDialog = document.querySelector(".modal-dialog");
let lastFocusedElement = null;

const updateHeader = () => {
  if (!header) return;
  header.classList.toggle("scrolled", window.scrollY > 10);
};

const closeMenu = () => {
  if (!header || !menuToggle) return;
  header.classList.remove("menu-open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Открыть меню");
};

window.addEventListener("scroll", updateHeader, { passive: true });
updateHeader();

if (menuToggle && header) {
  menuToggle.addEventListener("click", () => {
    const isOpen = header.classList.toggle("menu-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Закрыть меню" : "Открыть меню");
  });

  header.querySelectorAll("a, button").forEach((item) => {
    if (item === menuToggle) return;
    item.addEventListener("click", closeMenu);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 760) closeMenu();
  });
}

const revealItems = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("visible"));
}

const getFocusableElements = (container) =>
  [...container.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')];

const openModal = (title = "Заказать звонок", opener = document.activeElement) => {
  if (!modal || !modalTitle) return;
  lastFocusedElement = opener;
  modalTitle.textContent = title;
  modal.hidden = false;
  document.body.classList.add("modal-open");

  const form = modal.querySelector("form");
  if (form) {
    form.reset();
    form.querySelectorAll(".form-success").forEach((message) => {
      message.hidden = true;
    });
  }

  const focusable = getFocusableElements(modal);
  if (focusable.length) focusable[0].focus();
};

const closeModal = () => {
  if (!modal) return;
  modal.hidden = true;
  document.body.classList.remove("modal-open");
  if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
    lastFocusedElement.focus();
  }
};

document.querySelectorAll("[data-open-modal]").forEach((button) => {
  button.addEventListener("click", () => {
    openModal(button.dataset.modalTitle || "Заказать звонок", button);
  });
});

document.querySelectorAll("[data-close-modal]").forEach((button) => {
  button.addEventListener("click", closeModal);
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMenu();
    if (modal && !modal.hidden) closeModal();
  }

  if (event.key !== "Tab" || !modal || modal.hidden || !modalDialog) return;

  const focusable = getFocusableElements(modalDialog);
  if (!focusable.length) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

const serializeForm = (form) => {
  const data = new FormData(form);
  const result = {};

  data.forEach((value, key) => {
    if (result[key]) {
      result[key] = Array.isArray(result[key]) ? [...result[key], value] : [result[key], value];
    } else {
      result[key] = value;
    }
  });

  return result;
};

document.querySelectorAll("[data-form]").forEach((form) => {
  if (form.hasAttribute("data-quiz")) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!form.reportValidity()) return;

    const payload = {
      form: form.dataset.formName || "form",
      ...serializeForm(form),
    };

    console.log("Форма отправлена:", payload);

    form.querySelectorAll(".form-success").forEach((message) => {
      message.hidden = false;
    });
    form.reset();
  });
});

document.querySelectorAll(".faq-list details").forEach((item) => {
  item.addEventListener("toggle", () => {
    if (!item.open) return;

    item.parentElement.querySelectorAll("details").forEach((otherItem) => {
      if (otherItem !== item) otherItem.open = false;
    });
  });
});

const quiz = document.querySelector("[data-quiz]");

if (quiz) {
  const steps = [...quiz.querySelectorAll(".quiz-step")];
  const nextButton = quiz.querySelector("[data-next]");
  const prevButton = quiz.querySelector("[data-prev]");
  const submitButton = quiz.querySelector("[data-submit]");
  const stepLabel = quiz.querySelector("[data-quiz-step-label]");
  const progress = quiz.querySelector("[data-progress]");
  const error = quiz.querySelector("[data-quiz-error]");
  const success = quiz.querySelector("[data-quiz-success]");
  let currentStep = 0;

  const updateQuiz = () => {
    steps.forEach((step, index) => {
      step.classList.toggle("active", index === currentStep);
    });

    if (stepLabel) stepLabel.textContent = `Шаг ${currentStep + 1} из ${steps.length}`;
    if (progress) progress.style.width = `${((currentStep + 1) / steps.length) * 100}%`;
    if (prevButton) prevButton.disabled = currentStep === 0;
    if (nextButton) nextButton.hidden = currentStep === steps.length - 1;
    if (submitButton) submitButton.hidden = false;
    if (error) error.hidden = true;
  };

  const validateStep = () => {
    const fields = [...steps[currentStep].querySelectorAll("input, select, textarea")];
    const groups = new Map();

    for (const field of fields) {
      if (!field.required) continue;

      if (field.type === "radio") {
        groups.set(field.name, field);
        continue;
      }

      if (!field.checkValidity()) {
        field.reportValidity();
        if (error) error.hidden = false;
        return false;
      }
    }

    for (const [name, field] of groups) {
      const hasCheckedOption = [...quiz.querySelectorAll('input[type="radio"]')].some((input) => input.name === name && input.checked);

      if (!hasCheckedOption) {
        field.reportValidity();
        if (error) error.hidden = false;
        return false;
      }
    }

    return true;
  };

  nextButton?.addEventListener("click", () => {
    if (!validateStep()) return;
    currentStep = Math.min(currentStep + 1, steps.length - 1);
    updateQuiz();
  });

  prevButton?.addEventListener("click", () => {
    currentStep = Math.max(currentStep - 1, 0);
    updateQuiz();
  });

  submitButton?.addEventListener("click", (event) => {
    if (currentStep === steps.length - 1) return;

    event.preventDefault();
    if (!validateStep()) return;
    currentStep = Math.min(currentStep + 1, steps.length - 1);
    updateQuiz();
  });

  quiz.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!validateStep() || !quiz.reportValidity()) return;

    const payload = {
      form: quiz.dataset.formName || "valuation-quiz",
      ...serializeForm(quiz),
    };

    console.log("Квиз отправлен:", payload);

    if (success) success.hidden = false;
    quiz.reset();
    currentStep = 0;
    updateQuiz();
  });

  updateQuiz();
}

document.querySelectorAll(".cases .case-grid, .documents-block .docs-grid").forEach((slider) => {
  const cards = [...slider.children].filter((card) => card.matches(".case-card, article"));
  if (!cards.length) return;

  let centers = [];
  let frame = 0;
  let activeIndex = -1;

  const measureCases = () => {
    centers = cards.map((card) => card.offsetLeft + card.offsetWidth / 2);
  };

  const updateCaseScale = () => {
    frame = 0;
    const sliderCenter = slider.scrollLeft + slider.clientWidth / 2;
    const fadeDistance = Math.max(slider.clientWidth * 0.9, 300);
    let centerIndex = 0;
    let closestDistance = Infinity;

    centers.forEach((cardCenter, index) => {
      const distance = Math.abs(cardCenter - sliderCenter);
      const depth = Math.min(distance / fadeDistance, 1);
      const opacity = 0.3 + Math.pow(1 - depth, 1.18) * 0.7;
      const brightness = 0.48 + opacity * 0.52;
      const saturation = 0.68 + opacity * 0.32;

      cards[index].style.setProperty("--case-opacity", opacity.toFixed(3));
      cards[index].style.setProperty("--case-brightness", brightness.toFixed(3));
      cards[index].style.setProperty("--case-saturation", saturation.toFixed(3));

      if (distance < closestDistance) {
        closestDistance = distance;
        centerIndex = index;
      }
    });

    if (centerIndex === activeIndex) return;
    activeIndex = centerIndex;

    cards.forEach((card, index) => {
      card.classList.toggle("is-center", index === centerIndex);
    });
  };

  const scheduleCaseScale = () => {
    if (frame) return;
    frame = requestAnimationFrame(updateCaseScale);
  };

  slider.addEventListener("scroll", scheduleCaseScale, { passive: true });
  window.addEventListener("resize", () => {
    measureCases();
    scheduleCaseScale();
  });

  if ("ResizeObserver" in window) {
    const caseObserver = new ResizeObserver(() => {
      measureCases();
      scheduleCaseScale();
    });
    caseObserver.observe(slider);
  }

  measureCases();
  updateCaseScale();
});
