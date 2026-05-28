const translations = {
  en: {
    language: "Language",
    currency: "Currency",
    campaignStart: "Campaign Start",
    campaignEnd: "Campaign End",
    totalRevenue: "Total Revenue",
    avgOrderValue: "Avg. Order Value",
    monthlyPlan: "Monthly contacts plan",
    month: "Month",
    prospects: "Prospects",
    leads: "Leads",
    customers: "Customers",
    leadResponseRate: "Lead Response Rate",
    prospectResponseRate: "Prospect Response Rate",
    people: "people",
  },
  bg: {
    language: "Език",
    currency: "Валута",
    campaignStart: "Старт на кампания",
    campaignEnd: "Край на кампания",
    totalRevenue: "Общ оборот",
    avgOrderValue: "Средна поръчка",
    monthlyPlan: "Месечен план контакти",
    month: "Месец",
    prospects: "Контакти",
    leads: "Потенциални клиенти",
    customers: "Клиенти",
    leadResponseRate: "Процент отговори от потенциални клиенти",
    prospectResponseRate: "Процент отговори от контакти",
    people: "души",
  },
};

const elements = {
  language: document.querySelector("#language"),
  currency: document.querySelector("#currency"),
  start: document.querySelector("#campaign-start"),
  end: document.querySelector("#campaign-end"),
  totalRevenue: document.querySelector("#total-revenue"),
  avgOrder: document.querySelector("#avg-order"),
  leadRate: document.querySelector("#lead-rate"),
  prospectRate: document.querySelector("#prospect-rate"),
  leadRateOutput: document.querySelector("#lead-rate-output"),
  prospectRateOutput: document.querySelector("#prospect-rate-output"),
  prospectCount: document.querySelector("#prospect-count"),
  leadCount: document.querySelector("#lead-count"),
  customerCount: document.querySelector("#customer-count"),
  prospectPercent: document.querySelector("#prospect-percent"),
  leadPercent: document.querySelector("#lead-percent"),
  customerPercent: document.querySelector("#customer-percent"),
  prospectBar: document.querySelector("#prospect-bar"),
  leadBar: document.querySelector("#lead-bar"),
  customerBar: document.querySelector("#customer-bar"),
  campaignSummary: document.querySelector("#campaign-summary"),
  chart: document.querySelector("#bar-chart"),
  axis: document.querySelector("#x-axis"),
  currencyPrefixes: document.querySelectorAll("[data-currency-prefix]"),
};

const chartWeights = [0.26, 0.38, 0.48, 0.68, 0.84, 1];
const currencySymbols = {
  USD: "$",
  EUR: "EUR",
  BGN: "BGN",
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getNumber(input, fallback = 0) {
  const value = Number.parseFloat(input.value);
  return Number.isFinite(value) ? value : fallback;
}

function formatCount(value) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: value < 10 ? 1 : 0,
  }).format(value);
}

function formatPercent(value) {
  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value)}%`;
}

function formatDateRange() {
  const language = elements.language.value === "bg" ? "bg-BG" : "en-GB";
  const formatter = new Intl.DateTimeFormat(language, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const start = new Date(`${elements.start.value}T00:00:00`);
  const end = new Date(`${elements.end.value}T00:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "";
  }

  return `${formatter.format(start)} - ${formatter.format(end)}`;
}

function calculateFunnel() {
  const revenue = Math.max(getNumber(elements.totalRevenue), 0);
  const avgOrder = Math.max(getNumber(elements.avgOrder, 1), 1);
  const leadRate = clamp(getNumber(elements.leadRate, 1), 1, 100);
  const prospectRate = clamp(getNumber(elements.prospectRate, 1), 1, 100);

  const customers = revenue / avgOrder;
  const leads = customers * 100 / leadRate;
  const prospects = leads * 100 / prospectRate;

  return {
    customers,
    leads,
    prospects,
    leadRate,
    prospectRate,
    customerRate: prospects > 0 ? customers / prospects * 100 : 0,
  };
}

function renderTranslations() {
  const language = elements.language.value;
  document.documentElement.lang = language;

  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const key = node.dataset.i18n;
    node.textContent = translations[language][key] ?? node.textContent;
  });
}

function renderChart(prospects) {
  const language = elements.language.value;
  const people = translations[language].people;
  const axisStep = prospects <= 140 ? 20 : prospects <= 300 ? 50 : prospects <= 700 ? 100 : Math.ceil(prospects / 6 / 50) * 50;
  const maxValue = Math.max(120, Math.ceil(prospects / axisStep) * axisStep);
  const axisLabels = Array.from({ length: maxValue / axisStep + 1 }, (_, index) => axisStep * index);

  elements.axis.style.gridTemplateColumns = `repeat(${axisLabels.length}, 1fr)`;
  elements.axis.innerHTML = axisLabels.map((label) => `<span>${label}</span>`).join("");

  elements.chart.innerHTML = chartWeights
    .map((weight, index) => {
      const value = Math.round(prospects * weight);
      const width = clamp(value / maxValue * 100, 2, 100);
      return `
        <div class="bar-row">
          <span>${index + 1}</span>
          <div class="bar" tabindex="0" style="--bar-width: ${width}%" data-value="${value} ${people}" aria-label="Month ${index + 1}: ${value} ${people}"></div>
        </div>
      `;
    })
    .join("");
}

function setRangeFill(input) {
  const min = Number(input.min);
  const max = Number(input.max);
  const value = Number(input.value);
  const percentage = (value - min) / (max - min) * 100;
  input.style.setProperty("--fill", `${percentage}%`);
}

function update() {
  const result = calculateFunnel();
  const currency = currencySymbols[elements.currency.value];

  elements.currencyPrefixes.forEach((prefix) => {
    prefix.textContent = currency;
  });

  elements.totalRevenue.setAttribute("aria-label", `${translations[elements.language.value].totalRevenue} (${currency})`);
  elements.avgOrder.setAttribute("aria-label", `${translations[elements.language.value].avgOrderValue} (${currency})`);

  elements.customerCount.textContent = formatCount(result.customers);
  elements.leadCount.textContent = formatCount(result.leads);
  elements.prospectCount.textContent = formatCount(result.prospects);

  elements.prospectPercent.textContent = "100%";
  elements.leadPercent.textContent = formatPercent(result.prospectRate);
  elements.customerPercent.textContent = formatPercent(result.customerRate);

  elements.prospectBar.style.setProperty("--progress", "100%");
  elements.leadBar.style.setProperty("--progress", `${clamp(result.prospectRate, 0, 100)}%`);
  elements.customerBar.style.setProperty("--progress", `${clamp(result.customerRate, 0, 100)}%`);

  elements.leadRateOutput.textContent = `${Number(result.leadRate).toFixed(2)}%`;
  elements.prospectRateOutput.textContent = `${Number(result.prospectRate).toFixed(2)}%`;
  elements.campaignSummary.textContent = formatDateRange();

  setRangeFill(elements.leadRate);
  setRangeFill(elements.prospectRate);
  renderChart(result.prospects);
}

function handleLanguageChange() {
  renderTranslations();
  update();
}

[
  elements.currency,
  elements.start,
  elements.end,
  elements.totalRevenue,
  elements.avgOrder,
  elements.leadRate,
  elements.prospectRate,
].forEach((input) => input.addEventListener("input", update));

elements.language.addEventListener("change", handleLanguageChange);

renderTranslations();
update();
