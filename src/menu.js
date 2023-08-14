import debug from "./utils/debug.js";
import { translations, localStorageUserlangKey } from "./config/constants.js";

const userlang = localStorage.getItem(localStorageUserlangKey) || navigator.language || navigator.userLanguage;
let lang = userlang.substr(0, 2).toLowerCase();
if (!(lang in translations)) {
  lang = "en";
}

function changeBtnColor(n) {
  document.querySelector(".translationBtn").style.color = n;
}

function changeBtnState(newState = "none") {
  document.querySelector(".translationBtn").dataset.state = newState;
}

function changeIconBackground(type = "none") {
  let iconBackgroundColor;
  switch (type) {
    case "error":
      iconBackgroundColor = "#7A7A7D";
      break;
    case "success":
      iconBackgroundColor = "#A36EFF";
      break;
    default:
      iconBackgroundColor = "#FFFFFF";
      break;
  }

  document.querySelector(".translateIcon").style.fill = iconBackgroundColor;
}

function transformBtn(type = "none", text) {
  switch (type) {
    case "error":
      changeIconBackground(type);
      changeBtnColor("#7A7A7D");
      changeBtnState(type);
      break;
    case "success":
      changeIconBackground(type);
      changeBtnColor("#A36EFF");
      changeBtnState(type);
      break;
    default:
      changeIconBackground("none");
      changeBtnColor("#FFFFFF");
      changeBtnState("none");
      break;
  }

  document.querySelector(".translationBtn").innerText = text;
}

// Add translation buttton block
function addTranslationBlock(element) {
  if (!element || element.querySelector(".translationBlock")) return;

  const block = document.createElement("div");
  block.classList.add("translationBlock");
  block.innerHTML = `
    <span class = "translationArea" role = "button">
      <span class = "translationITranslate" tabindex = "-1">
        <svg class="translateIcon" width="24" height="24" viewBox="0 0 32 32" fill="#fff" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M17.605 19.703c.794-.13 1.647-.476 2.47-.983.695 1.013 1.255 1.546 1.306 1.593l1.166-1.207c-.011-.01-.504-.48-1.124-1.401.277-.25.547-.512.797-.798a12.1 12.1 0 0 0 2.268-3.826c.383.216.761.541.96 1.027.68 1.649-.301 3.557-1.215 4.385l1.152 1.22c1.52-1.378 2.571-3.959 1.638-6.227-.368-.892-1.077-1.59-2.064-2.037.162-.763.216-1.38.233-1.785h-1.698c-.017.307-.06.762-.173 1.323-1.325-.187-2.818-.006-4.248.508a25.994 25.994 0 0 1-.313-2.547c5.092-.287 8.098-1.488 8.237-1.546l-.654-1.533c-.03.013-2.875 1.14-7.65 1.418-.001-.405-.008-.666-.012-.85-.008-.339-.01-.423.03-.67L17.01 5.75c-.026.283-.024.573-.018 1.278l.002.318c-.026 0-.051 0-.077.002l-.08.001a39.286 39.286 0 0 1-3.27-.14L13.25 8.89c.5.043 2.023.122 3.397.122h.1a19.457 19.457 0 0 1 .208-.003l.106-.002c.067.948.196 2.034.421 3.22a8.05 8.05 0 0 0-2.267 1.963l.811 1.871c.327-.732.995-1.51 1.856-2.111a16.762 16.762 0 0 0 1.33 3.346c-.811.514-1.64.818-2.301.804l.694 1.603Zm2.953-3.488a8.18 8.18 0 0 0 .374-.389 10.465 10.465 0 0 0 1.927-3.224c-.198-.021-.4-.031-.606-.031-.907 0-1.885.199-2.834.574.31 1.209.718 2.23 1.14 3.07ZM9.769 11.688 4.25 24.438h2.259l1.357-3.407h5.582l1.357 3.407h2.258l-5.52-12.75H9.77Zm.887 2.624 2.056 5H8.6l2.056-5Z"></path>
        </svg>
      </span>
      <span class = "translationBtn" tabindex = "0">${translations[lang].translateVideo}</span>
    </span>
    <span class = "translationMenu" tabindex = "0" role = "button">
      <svg class = "translationMenuIcon" height="15" width="5" fill="#fff" xmlns="http://www.w3.org/2000/svg">
        <path d="M3.5 1.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM3.5 7.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM3.5 13.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"></path>
      </svg>
    </span>
  `;

  element.appendChild(block);
  debug.log("VOT: Added translation button to ", element);
}

function createTranslationMenu() {
  const container = document.createElement("div");
  container.classList.add("translationMenuContent");
  container.innerHTML = `
    <p class = "translationMainHeader">${translations[lang].translationSettings}</p>
    <div class="translationMenuOptions"></div>
    <div class="translationMenuFunctional">
      <a class = "translationDownload">
        <svg width="24px" height="24px" data-darkreader-inline-stroke="" fill="none" stroke="currentColor" style="--darkreader-inline-stroke: currentColor;" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
        </svg>
      </a>
      <button class = "translationDropDB">${translations[lang].resetSettings}</button>
    </div>
  `;

  container.onclick = (event) => event.stopPropagation();
  return container;
}

// Create checkbox for menu
function createMenuCheckbox(id, valueToCheck, content) {
  const checkboxContainer = document.createElement("div");
  const checkbox = document.createElement("input");
  const checkboxLabel = document.createElement("label");

  checkbox.type = "checkbox";
  checkbox.id = id;
  checkbox.checked = Boolean(valueToCheck);

  checkboxLabel.htmlFor = id;
  checkboxLabel.innerHTML = content;

  checkboxContainer.classList.add("translationMenuContainer");
  checkboxContainer.appendChild(checkbox);
  checkboxContainer.appendChild(checkboxLabel);

  return checkboxContainer;
}

// Create slider for menu
function createMenuSlider(id, sliderValue, content) {
  const sliderContainer = document.createElement("div");
  const slider = document.createElement("input");
  const sliderLabel = document.createElement("label");

  slider.type = "range";
  slider.id = id;
  slider.classList.add("VOTMenuSlider");
  slider.min = 0;
  slider.max = 100;
  slider.value = sliderValue;

  sliderLabel.htmlFor = id;
  sliderLabel.classList.add("translationHeader");
  sliderLabel.innerHTML = content;

  sliderContainer.classList.add("translationMenuContainer");
  sliderContainer.appendChild(sliderLabel);
  sliderContainer.appendChild(slider);

  return sliderContainer;
}

// Create select for menu
function createMenuSelect(id, selectOptions) {
  // selectOptions structure:
  // [
  //     {
  //         label: string,
  //         value: string,
  //         selected: boolean,
  //         disabled: boolean
  //     }
  // ]
  const selectContainer = document.createElement("div");
  const select = document.createElement("select");

  select.id = id;
  select.classList.add("VOTMenuSelect");

  for (const option of selectOptions) {
    const optionElement = document.createElement("option");
    optionElement.innerText = option.label;
    optionElement.value = option.value;
    if (
      Object.prototype.hasOwnProperty.call(option, "selected") &&
      option.selected
    ) {
      optionElement.setAttribute("selected", "selected");
    }

    if (Object.prototype.hasOwnProperty.call(option, "disabled")) {
      optionElement.disabled = option.disabled;
    }

    select.appendChild(optionElement);
  }

  selectContainer.classList.add("translationMenuContainer");
  selectContainer.appendChild(select);

  return selectContainer;
}

function genOptionsByOBJ(obj, conditionString) {
  return Object.entries(obj).map(([key, value]) => ({
    label: translations[lang][value],
    value: key,
    selected: conditionString === key,
  }));
}

export {
  transformBtn,
  addTranslationBlock,
  createTranslationMenu,
  createMenuCheckbox,
  createMenuSlider,
  createMenuSelect,
  genOptionsByOBJ,
  lang,
};
