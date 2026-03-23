// === ABOUT PAGE — Language & Interactivity ===

const LANGUAGE_STORAGE_KEY = "mew3_lang";
const SUPPORTED_LANGUAGES = ["fr", "en"];
let currentLanguage = "fr";

const I18N_ABOUT = {
  fr: {
    pageTitle: "MEW3 — QUI SOMMES-NOUS ?",
    langLabel: "Langue",
    backLink: "← RETOUR",
    aboutTitle: "QUI SOMMES-NOUS ?",
    historyTitle: "> HISTOIRE",
    historyText:
      "MEW3 est né d'une envie simple : créer un espace où la musique électronique underground " +
      "peut exister librement, sans compromis. Fondé à Nantes, le collectif rassemble des " +
      "passionnés de son, d'arts visuels, de technologie et de cultures alternatives ( Comme la Free party)." +
      "<br><br>" +
      "Ce qui a commencé comme des soirées entre amis s'est transformé en un mouvement : " +
      "des événements immersifs, une identité visuelle, et une communauté qui grandit " +
      "dans l'ombre. Connectée, engagée, curieuse.",
    valuesTitle: "> VALEURS",
    value1: "Underground avant tout  La création est au centre. Pas les ego, pas le marketing.",
    value2: "Communauté  Chaque personne présente fait partie de l'expérience.",
    value3: "Accessibilité  Des événements ouverts, des prix justes, un espace safe.",
    value4: "Expérimentation  Mélanger les genres, casser les codes, explorer les limites.",
    value5: "Transparence  On partage ce qu'on fait, comment et pourquoi.",
    foundersTitle: "> FONDATEURS",
    membersTitle: "> MEMBRES",
    adherentsTitle: "> ADHÉRENTS",
    adherentsText:
      "Le collectif, c'est aussi tous ceux qui nous suivent, qui partagent nos valeurs et " +
      "participent à nos événements. Vous êtes le cœur de MEW3.",
    adherentsLabel: "SUJETS DANS LE RÉSEAU",
    djsTitle: "> DJs & ARTISTES",
    djsIntro: "Ceux qui ont partagé leur son avec nous.",
    contactTitle: "> CONTACT",
    footerLine: "MEW3 — VOUS ÊTES OBSERVÉ MAINTENANT"
  },
  en: {
    pageTitle: "MEW3 — WHO ARE WE?",
    langLabel: "Language",
    backLink: "← BACK",
    aboutTitle: "WHO ARE WE?",
    historyTitle: "> HISTORY",
    historyText:
      "MEW3 was born from a simple desire: to create a space where underground electronic music " +
      "can exist freely, without compromise. Founded in Nantes, the collective brings together " +
      "enthusiasts of sound, visual arts, technology and alternative cultures (such as Free parties)." +
      "<br><br>" +
      "What started as parties between friends turned into a movement: " +
      "immersive events, a visual identity, and a community growing " +
      "in the shadows. Connected, engaged, curious.",
    valuesTitle: "> VALUES",
    value1: "Underground first — Music is at the center. Not egos, not marketing.",
    value2: "Community — Every person present is part of the experience.",
    value3: "Accessibility — Open events, fair prices, a safe space.",
    value4: "Experimentation — Blending genres, breaking norms, pushing boundaries.",
    value5: "Transparency — We share what we do, how and why.",
    foundersTitle: "> FOUNDERS",
    membersTitle: "> MEMBERS",
    adherentsTitle: "> SUPPORTERS",
    adherentsText:
      "The collective is also everyone who follows us, shares our values and " +
      "attends our events. You are the heart of MEW3.",
    adherentsLabel: "SUBJECTS IN THE NETWORK",
    djsTitle: "> DJs & ARTISTS",
    djsIntro: "Those who shared their sound with us.",
    contactTitle: "> CONTACT",
    footerLine: "MEW3 — YOU ARE WATCHING NOW"
  }
};

function t(key) {
  return (I18N_ABOUT[currentLanguage] && I18N_ABOUT[currentLanguage][key]) || I18N_ABOUT.fr[key] || key;
}

function detectLanguage() {
  const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (saved && SUPPORTED_LANGUAGES.includes(saved)) {
    return saved;
  }
  const browserLang = (navigator.language || "fr").slice(0, 2).toLowerCase();
  return SUPPORTED_LANGUAGES.includes(browserLang) ? browserLang : "fr";
}

function applyLanguage(lang) {
  currentLanguage = SUPPORTED_LANGUAGES.includes(lang) ? lang : "fr";
  localStorage.setItem(LANGUAGE_STORAGE_KEY, currentLanguage);
  document.documentElement.lang = currentLanguage;
  document.title = t("pageTitle");

  // Simple text
  const textMap = {
    langLabel: "langLabel",
    backLink: "backLink",
    aboutTitle: "aboutTitle",
    historyTitle: "historyTitle",
    valuesTitle: "valuesTitle",
    foundersTitle: "foundersTitle",
    membersTitle: "membersTitle",
    adherentsTitle: "adherentsTitle",
    adherentsLabel: "adherentsLabel",
    djsTitle: "djsTitle",
    djsIntro: "djsIntro",
    contactTitle: "contactTitle"
  };

  for (const [id, key] of Object.entries(textMap)) {
    const el = document.getElementById(id);
    if (el) el.innerText = t(key);
  }

  // HTML content
  const htmlMap = {
    historyText: "historyText",
    adherentsText: "adherentsText"
  };

  for (const [id, key] of Object.entries(htmlMap)) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = t(key);
  }

  // Values with icons
  for (let i = 1; i <= 5; i++) {
    const el = document.getElementById("value" + i);
    if (el) {
      el.innerHTML = '<span class="value-icon">▣</span> ' + t("value" + i).replace(/^([^—]+)—/, "<strong>$1</strong>—");
    }
  }

  // Footer
  const footer = document.querySelector(".footer-line");
  if (footer) footer.innerText = t("footerLine");

  // Lang selector sync
  const langSelect = document.getElementById("langSelect");
  if (langSelect) langSelect.value = currentLanguage;
}

document.addEventListener("DOMContentLoaded", function () {
  currentLanguage = detectLanguage();

  const langSelect = document.getElementById("langSelect");
  if (langSelect) {
    langSelect.value = currentLanguage;
    langSelect.addEventListener("change", function () {
      applyLanguage(this.value);
    });
  }

  applyLanguage(currentLanguage);

  // Load person photos from data-photo attribute (local files in photos/)
  document.querySelectorAll(".person-card").forEach(function (card) {
    var photoDiv = card.querySelector(".person-photo");
    if (!photoDiv) return;
    var img = photoDiv.querySelector("img");
    if (!img) return;
    var photoSrc = card.getAttribute("data-photo");
    if (photoSrc) {
      img.setAttribute("src", photoSrc);
      img.onerror = function () {
        this.removeAttribute("src");
      };
    }
  });
});
