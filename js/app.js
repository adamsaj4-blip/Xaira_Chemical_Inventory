(function () {
  "use strict";

  const state = {
    chemicals: [],
    filtered: [],
    activeId: null,
  };

  const els = {
    searchInput: document.getElementById("search-input"),
    resultsList: document.getElementById("results-list"),
    resultCount: document.getElementById("result-count"),
    emptyState: document.getElementById("empty-state"),
    noResults: document.getElementById("no-results"),
    detailPlaceholder: document.getElementById("detail-placeholder"),
    detailContent: document.getElementById("detail-content"),
    dataMeta: document.getElementById("data-meta"),
  };

  const FIELD_LABELS = {
    id: "Inventory ID",
    cas: "CAS Number",
    manufacturer: "Manufacturer / Supplier",
    catalogNumber: "Catalog / Product #",
    physicalState: "Physical State",
    containerSize: "Container Size",
    unit: "Unit",
    containerCount: "# Containers",
    totalQuantity: "Total Quantity",
    building: "Building",
    room: "Room",
    storageLocation: "Storage Location",
    storageSegregationGroup: "Storage Segregation Group",
    storageFlag: "Storage Flag",
    primaryHazardClass: "Primary Hazard Class",
    ghsSignalWord: "GHS Signal Word",
    ghsCodes: "GHS Codes (SDS)",
    particularlyHazardous: "Particularly Hazardous",
    specialRegulatoryFlag: "Special Regulatory Flag",
    sdsOnFile: "SDS on File",
    responsiblePerson: "Responsible Person / PI",
    dateReceived: "Date Received",
    dateOpened: "Date Opened",
    expirationDate: "Expiration Date",
    daysToExpiration: "Days to Expiration",
    expirationStatus: "Expiration Status",
    status: "Status",
    disposalDate: "Disposal Date",
  };

  const SECTIONS = [
    {
      title: "Identification",
      fields: ["cas", "manufacturer", "catalogNumber", "physicalState"],
    },
    {
      title: "Quantity & Container",
      fields: ["containerSize", "unit", "containerCount", "totalQuantity"],
    },
    {
      title: "Storage & Location",
      fields: [
        "building",
        "room",
        "storageLocation",
        "storageSegregationGroup",
        "storageFlag",
      ],
    },
    {
      title: "Hazard Information",
      fields: [
        "primaryHazardClass",
        "ghsSignalWord",
        "ghsCodes",
        "particularlyHazardous",
        "specialRegulatoryFlag",
      ],
    },
    {
      title: "Dates & Status",
      fields: [
        "responsiblePerson",
        "status",
        "dateReceived",
        "dateOpened",
        "expirationDate",
        "daysToExpiration",
        "expirationStatus",
        "disposalDate",
      ],
    },
  ];

  function fieldLabel(key) {
    return FIELD_LABELS[key] || key;
  }

  function fieldValue(value) {
    if (value === null || value === undefined || value === "") return null;
    return value;
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function signalWordBadgeClass(word) {
    if (!word) return "badge-neutral";
    const w = word.toLowerCase();
    if (w === "danger") return "badge-danger";
    if (w === "warning") return "badge-warning";
    return "badge-neutral";
  }

  function statusBadgeClass(status) {
    if (!status) return "badge-neutral";
    const s = status.toLowerCase();
    if (s.includes("disposed") || s.includes("expired")) return "badge-danger";
    if (s.includes("stock")) return "badge-ok";
    return "badge-neutral";
  }

  function normalize(str) {
    return (str || "").toString().toLowerCase();
  }

  function loadData() {
    return fetch("data/chemicals.json")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load chemical data (" + res.status + ")");
        return res.json();
      })
      .then((data) => {
        state.chemicals = data;
        els.dataMeta.textContent =
          data.length + " chemicals in inventory. Data sourced from the lab's EH&S tracker workbook.";
      })
      .catch((err) => {
        els.dataMeta.textContent = "Could not load chemical inventory data: " + err.message;
        els.emptyState.textContent = "Chemical data failed to load. Please refresh or contact EH&S.";
      });
  }

  function search(query) {
    const q = normalize(query.trim());
    if (!q) return [];
    return state.chemicals.filter((c) => {
      return normalize(c.name).includes(q) || normalize(c.cas).includes(q) || normalize(c.id).includes(q);
    });
  }

  function renderResults(results, query) {
    els.resultsList.innerHTML = "";
    const hasQuery = query.trim().length > 0;

    els.emptyState.hidden = hasQuery;
    els.noResults.hidden = !hasQuery || results.length > 0;

    if (!hasQuery) {
      els.resultCount.textContent = "";
      return;
    }

    els.resultCount.textContent = results.length + (results.length === 1 ? " result" : " results");

    results.forEach((chem) => {
      const li = el("li", "result-item");
      li.dataset.id = chem.id;
      li.tabIndex = 0;
      li.setAttribute("role", "button");
      if (chem.id === state.activeId) li.classList.add("active");

      const name = el("span", "result-name", chem.name || "(unnamed chemical)");
      const meta = el("span", "result-meta");
      if (chem.cas) meta.appendChild(el("span", null, "CAS " + chem.cas));
      if (chem.primaryHazardClass) meta.appendChild(el("span", null, chem.primaryHazardClass));
      if (chem.storageLocation) meta.appendChild(el("span", null, chem.storageLocation));

      li.appendChild(name);
      li.appendChild(meta);

      li.addEventListener("click", () => selectChemical(chem.id));
      li.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          selectChemical(chem.id);
        }
      });

      els.resultsList.appendChild(li);
    });
  }

  function buildBadgeRow(chem) {
    const row = el("div", "badge-row");

    if (fieldValue(chem.ghsSignalWord) && normalize(chem.ghsSignalWord) !== "none") {
      row.appendChild(el("span", "badge " + signalWordBadgeClass(chem.ghsSignalWord), chem.ghsSignalWord));
    }
    if (chem.status && fieldValue(chem.status)) {
      row.appendChild(el("span", "badge " + statusBadgeClass(chem.status), chem.status));
    }
    if (fieldValue(chem.particularlyHazardous) && normalize(chem.particularlyHazardous) === "yes") {
      row.appendChild(el("span", "badge badge-danger", "Particularly Hazardous"));
    }
    if (chem.storageFlag && normalize(chem.storageFlag) !== "ok" && fieldValue(chem.storageFlag)) {
      row.appendChild(el("span", "badge badge-warning", "Storage: " + chem.storageFlag));
    }

    return row;
  }

  function buildFieldGrid(chem, fields) {
    const grid = el("div", "field-grid");
    fields.forEach((key) => {
      const value = fieldValue(chem[key]);
      const field = el("div", "field");
      field.appendChild(el("span", "field-label", fieldLabel(key)));
      field.appendChild(el("span", "field-value" + (value ? "" : " empty"), value || "Not recorded"));
      grid.appendChild(field);
    });
    return grid;
  }

  function renderDetail(chem) {
    els.detailPlaceholder.hidden = true;
    els.detailContent.hidden = false;
    els.detailContent.innerHTML = "";

    const header = el("div", "detail-header");
    const titleBlock = el("div");
    titleBlock.appendChild(el("h2", "detail-title", chem.name || "(unnamed chemical)"));
    titleBlock.appendChild(
      el("p", "detail-subtitle", [chem.id, chem.cas ? "CAS " + chem.cas : null].filter(Boolean).join(" · "))
    );
    header.appendChild(titleBlock);
    header.appendChild(buildBadgeRow(chem));
    els.detailContent.appendChild(header);

    SECTIONS.forEach((section) => {
      const sectionEl = el("div", "detail-section");
      sectionEl.appendChild(el("h3", null, section.title));
      sectionEl.appendChild(buildFieldGrid(chem, section.fields));
      els.detailContent.appendChild(sectionEl);
    });

    const sdsSection = el("div", "detail-section");
    sdsSection.appendChild(el("h3", null, "Safety Data Sheet"));
    const sdsGrid = el("div", "field-grid");
    const sdsField = el("div", "field");
    sdsField.appendChild(el("span", "field-label", "SDS on File"));
    sdsField.appendChild(
      el(
        "span",
        "field-value" + (fieldValue(chem.sdsOnFile) ? "" : " empty"),
        fieldValue(chem.sdsOnFile) || "Not recorded"
      )
    );
    sdsGrid.appendChild(sdsField);

    const linkField = el("div", "field");
    linkField.appendChild(el("span", "field-label", "SDS Link"));
    if (fieldValue(chem.sdsLink)) {
      const a = el("a", "sds-link", "View Safety Data Sheet");
      a.href = chem.sdsLink;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      linkField.appendChild(a);
    } else {
      linkField.appendChild(el("span", "field-value empty", "Not recorded"));
    }
    sdsGrid.appendChild(linkField);
    sdsSection.appendChild(sdsGrid);
    els.detailContent.appendChild(sdsSection);

    if (fieldValue(chem.notes)) {
      const notesSection = el("div", "detail-section");
      notesSection.appendChild(el("h3", null, "Notes"));
      notesSection.appendChild(el("div", "notes-box", chem.notes));
      els.detailContent.appendChild(notesSection);
    }
  }

  function selectChemical(id) {
    const chem = state.chemicals.find((c) => c.id === id);
    if (!chem) return;
    state.activeId = id;
    renderDetail(chem);
    document.querySelectorAll(".result-item").forEach((item) => {
      item.classList.toggle("active", item.dataset.id === id);
    });
  }

  function handleSearchInput() {
    const query = els.searchInput.value;
    state.filtered = search(query);
    renderResults(state.filtered, query);
  }

  function init() {
    els.searchInput.addEventListener("input", handleSearchInput);
    loadData();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
