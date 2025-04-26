document.addEventListener("DOMContentLoaded", function () {
  // Tab switching logic
  const tabButtons = document.querySelectorAll(".tab-button");
  const tabContents = document.querySelectorAll(".tab-content");

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const tabId = button.getAttribute("data-tab");

      // Update active button
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      // Update active content
      tabContents.forEach((content) => content.classList.remove("active"));
      document.getElementById(tabId).classList.add("active");

      // Initialize investment chart when switching to that tab
      if (tabId === "investment-timeline") {
        initInvestmentChart();
      }
    });
  });

  // IndexedDB setup
  const DB_NAME = "investmentTracker";
  const DB_VERSION = 1;
  const STORES = {
    investments: "investments",
    lands: "lands",
    transactions: "transactions",
  };

  let db;

  // Initialize the database
  function initDatabase() {
    return new Promise((resolve, reject) => {
      // First check if db is already initialized (could be initialized by main.js)
      if (db) {
        console.log("Database already initialized, using existing connection");
        resolve(db);
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (event) => {
        console.error("IndexedDB error:", event.target.error);
        reject("Error opening database");
      };

      request.onsuccess = (event) => {
        db = event.target.result;
        console.log("Database initialized successfully");
        resolve(db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object stores
        if (!db.objectStoreNames.contains(STORES.investments)) {
          const investmentsStore = db.createObjectStore(STORES.investments, {
            keyPath: "id",
            autoIncrement: true,
          });
          investmentsStore.createIndex("name", "name", { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.lands)) {
          const landsStore = db.createObjectStore(STORES.lands, {
            keyPath: "id",
            autoIncrement: true,
          });
          landsStore.createIndex("land_name", "land_name", { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.transactions)) {
          const transactionsStore = db.createObjectStore(STORES.transactions, {
            keyPath: "id",
            autoIncrement: true,
          });
          transactionsStore.createIndex("entity_id", "entity_id", {
            unique: false,
          });
          transactionsStore.createIndex(
            "transaction_date",
            "transaction_date",
            { unique: false }
          );
        }

        console.log("Database schema created");
      };
    });
  }

  // Check if database is empty and add sample data if needed
  async function seedDatabaseIfEmpty() {
    try {
      const investments = await getAllData(STORES.investments);
      const lands = await getAllData(STORES.lands);

      if (investments.length === 0 && lands.length === 0) {
        console.log("Database is empty, adding sample data...");
        await seedSampleData();
      } else {
        console.log("Database already has data, skipping seed");
      }
    } catch (error) {
      console.error("Error checking database:", error);
    }
  }

  // Add sample data to database
  async function seedSampleData() {
    // Sample investments
    const sampleInvestments = [
      {
        id: 1,
        name: "Tech Growth Fund",
        size: "500000",
        share_percentage: "15",
        investment_amount: "75000",
        debt_percentage: "20",
        debt_amount: "15000",
        cash_investment: "60000",
      },
      {
        id: 2,
        name: "Renewable Energy Fund",
        size: "750000",
        share_percentage: "10",
        investment_amount: "75000",
        debt_percentage: "30",
        debt_amount: "22500",
        cash_investment: "52500",
      },
    ];

    // Sample lands
    const sampleLands = [
      {
        id: 1,
        land_name: "Downtown Land",
        size_sqm: "1200",
        price_per_sqm: "500",
        value: "600000",
        debt_percentage: "40",
        debt_amount: "240000",
        cash_injection: "360000",
      },
      {
        id: 2,
        land_name: "Suburban Land",
        size_sqm: "5000",
        price_per_sqm: "100",
        value: "500000",
        debt_percentage: "25",
        debt_amount: "125000",
        cash_injection: "375000",
      },
    ];

    // Sample transactions
    const currentYear = new Date().getFullYear();
    const sampleTransactions = [
      {
        id: 1,
        entity_id: 1,
        entity_type: "investment",
        transaction_type: "buy",
        amount: "30000",
        transaction_date: new Date(currentYear, 0, 15),
        notes: "Initial investment",
      },
      {
        id: 2,
        entity_id: 1,
        entity_type: "investment",
        transaction_type: "buy",
        amount: "20000",
        transaction_date: new Date(currentYear, 3, 10),
        notes: "Additional investment",
      },
      {
        id: 3,
        entity_id: 2,
        entity_type: "investment",
        transaction_type: "buy",
        amount: "50000",
        transaction_date: new Date(currentYear, 5, 20),
        notes: "Initial investment",
      },
      {
        id: 4,
        entity_id: 1,
        entity_type: "land",
        transaction_type: "buy",
        amount: "120000",
        transaction_date: new Date(currentYear, 2, 8),
        notes: "Land acquisition",
      },
      {
        id: 5,
        entity_id: 1,
        entity_type: "land",
        transaction_type: "sale",
        amount: "50000",
        transaction_date: new Date(currentYear, 2, 8),
        notes: "Land acquisition",
      },
      {
        id: 6,
        entity_id: 1,
        entity_type: "investment",
        transaction_type: "sale",
        amount: "15000",
        transaction_date: new Date(currentYear, 7, 12),
        notes: "Partial exit",
      },
    ];

    // Add all sample data to database
    try {
      await Promise.all([
        ...sampleInvestments.map((inv) => addData(STORES.investments, inv)),
        ...sampleLands.map((land) => addData(STORES.lands, land)),
        ...sampleTransactions.map((tx) => addData(STORES.transactions, tx)),
      ]);
      console.log("Sample data added successfully");
    } catch (error) {
      console.error("Error adding sample data:", error);
    }
  }

  // Generic function to add data to a store
  function addData(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);

      const request = store.add(data);

      request.onsuccess = (event) => {
        resolve(event.target.result);
      };

      request.onerror = (event) => {
        console.error(`Error adding data to ${storeName}:`, event.target.error);
        reject(event.target.error);
      };
    });
  }

  // Generic function to get all data from a store
  function getAllData(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);

      const request = store.getAll();

      request.onsuccess = (event) => {
        resolve(event.target.result);
      };

      request.onerror = (event) => {
        console.error(
          `Error getting data from ${storeName}:`,
          event.target.error
        );
        reject(event.target.error);
      };
    });
  }

  // Generic function to update data in a store
  function updateData(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);

      const request = store.put(data);

      request.onsuccess = (event) => {
        resolve(event.target.result);
      };

      request.onerror = (event) => {
        console.error(
          `Error updating data in ${storeName}:`,
          event.target.error
        );
        reject(event.target.error);
      };
    });
  }

  // Generic function to delete data from a store
  function deleteData(storeName, id) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);

      const request = store.delete(id);

      request.onsuccess = (event) => {
        resolve();
      };

      request.onerror = (event) => {
        console.error(
          `Error deleting data from ${storeName}:`,
          event.target.error
        );
        reject(event.target.error);
      };
    });
  }

  // Replace the API fetch functions with IndexedDB functions
  async function fetchInvestments() {
    try {
      return await getAllData(STORES.investments);
    } catch (error) {
      console.error("Error fetching investments:", error);
      return [];
    }
  }

  async function fetchLands() {
    try {
      return await getAllData(STORES.lands);
    } catch (error) {
      console.error("Error fetching lands:", error);
      return [];
    }
  }

  async function fetchTransactions() {
    try {
      const transactions = await getAllData(STORES.transactions);
      // Ensure transaction_date is a Date object
      return transactions.map((tx) => ({
        ...tx,
        transaction_date: new Date(tx.transaction_date),
      }));
    } catch (error) {
      console.error("Error fetching transactions:", error);
      return [];
    }
  }

  // Date formatting utilities
  const dateFormat = d3.timeFormat("%b %d, %Y");
  const inputDateFormat = d3.timeFormat("%Y-%m-%d");
  const transactionDateParse = d3.timeParse("%m/%d/%y");

  // Get current year's date range
  const currentYear = new Date().getFullYear();

  // Define initial date range for the timeline (current year by default)
  let startDate = new Date(currentYear, 0, 1); // Jan 1, current year
  let endDate = new Date(currentYear + 1, 0, 1); // Jan 1, next year

  // Setup visualization dimensions
  const svgWidth = 1200;
  const svgHeight = 150;
  const timelineY = 100;

  // // Define timeline positions
  const timelineStart = 80;
  const timelineEnd = svgWidth - 80;
  const timelineLength = timelineEnd - timelineStart;

  // Initialize time scale
  let timeScale = d3
    .scaleTime()
    .domain([startDate, endDate])
    .range([timelineStart, timelineEnd]);

  // Investment transaction emojis
  const transactionEmojis = {
    "fund-buy": "📈",
    "fund-sale": "💹",
    "land-buy": "🏞️",
    "land-sale": "🏙️",
  };

  // Initialize date inputs with current year dates
  d3.select("#start-date").property("value", inputDateFormat(startDate));
  d3.select("#end-date").property("value", inputDateFormat(endDate));

  // Add date preset buttons
  const dateRangeControl = d3.select(".date-range-control");

  // Create date presets container
  const datePresets = dateRangeControl
    .insert("div", ":first-child")
    .attr("class", "date-presets");

  // Add title
  datePresets.append("h4").text("Quick Select:");

  // Add preset buttons
  const presetButtons = [
    { text: "Current Year", handler: setCurrentYear },
    { text: "Last 12 Months", handler: setLast12Months },
    { text: "Next 12 Months", handler: setNext12Months },
    { text: "2 Years", handler: set2Years },
    { text: "5 Years", handler: set5Years },
  ];

  presetButtons.forEach((btn) => {
    datePresets
      .append("button")
      .attr("type", "button")
      .attr("class", "date-preset-btn")
      .text(btn.text)
      .on("click", btn.handler);
  });

  // Date preset handler functions
  function setCurrentYear() {
    const now = new Date();
    const year = now.getFullYear();

    startDate = new Date(year, 0, 1); // Jan 1 of current year
    endDate = new Date(year + 1, 0, 1); // Jan 1 of next year

    updateInputsAndChart();
  }

  function setLast12Months() {
    const now = new Date();

    endDate = new Date(now);
    startDate = new Date(now);
    startDate.setFullYear(now.getFullYear() - 1);

    updateInputsAndChart();
  }

  function setNext12Months() {
    const now = new Date();

    startDate = new Date(now);
    endDate = new Date(now);
    endDate.setFullYear(now.getFullYear() + 1);

    updateInputsAndChart();
  }

  function set2Years() {
    const now = new Date();
    const year = now.getFullYear();

    startDate = new Date(year, 0, 1);
    endDate = new Date(year + 2, 0, 1);

    updateInputsAndChart();
  }

  function set5Years() {
    const now = new Date();
    const year = now.getFullYear();

    startDate = new Date(year, 0, 1);
    endDate = new Date(year + 5, 0, 1);

    updateInputsAndChart();
  }

  // Helper function to update inputs and refresh chart
  function updateInputsAndChart() {
    // Update input fields
    d3.select("#start-date").property("value", inputDateFormat(startDate));
    d3.select("#end-date").property("value", inputDateFormat(endDate));

    // Update chart
    updateDateRange();
  }

  // Investment data array - now can be dynamically updated
  let investmentData = [];

  // Transaction data array - now can be dynamically updated
  let transactionData = [];

  // Function to fetch all required data for the investment chart
  async function fetchChartData() {
    try {
      console.log("Fetching chart data from IndexedDB...");

      // Ensure database is initialized
      if (!db) {
        await initDatabase();
        await seedDatabaseIfEmpty();
      }

      // Fetch investments, lands, and transactions in parallel
      const [investments, lands, transactions] = await Promise.all([
        fetchInvestments(),
        fetchLands(),
        fetchTransactions(),
      ]);

      console.log("Investments:", investments);
      console.log("Lands:", lands);
      console.log("Transactions:", transactions);

      // Map investments to the expected format
      const mappedInvestments = investments.map((inv) => ({
        id: inv.id,
        name: inv.name,
        val1: parseFloat(inv.size),
        val2: `${inv.share_percentage}%`,
        val3: parseFloat(inv.investment_amount),
        val4: `${inv.debt_percentage}%`,
        val5: parseFloat(inv.debt_amount),
        val6: parseFloat(inv.cash_investment),
      }));

      // Map lands to the expected format
      const mappedLands = lands.map((land) => ({
        id: land.id,
        name: land.land_name,
        val1: parseFloat(land.size_sqm),
        val2: parseFloat(land.price_per_sqm),
        val3: parseFloat(land.value),
        val4: `${land.debt_percentage}%`,
        val5: parseFloat(land.debt_amount),
        val6: parseFloat(land.cash_injection),
      }));

      // Combine investments and lands
      const combinedInvestmentData = [...mappedInvestments, ...mappedLands];
      console.log("Combined investment data:", combinedInvestmentData);

      // Map transactions to the expected format
      const mappedTransactions = transactions.map((tx) => {
        const isInvestmentType = tx.entity_type === "investment";

        // Find the related entity
        const relatedEntity = isInvestmentType
          ? mappedInvestments.find((inv) => inv.id === tx.entity_id)
          : mappedLands.find((land) => land.id === tx.entity_id);

        const name = relatedEntity
          ? relatedEntity.name
          : `Unknown ${tx.entity_type} (ID: ${tx.entity_id})`;

        return {
          id: tx.id,
          entity_id: tx.entity_id,
          name: name,
          investmentType: tx.entity_type === "investment" ? "fund" : "land",
          transactionType: tx.transaction_type,
          amount: parseFloat(tx.amount),
          date: new Date(tx.transaction_date),
          notes: tx.notes,
        };
      });

      console.log("Mapped transactions:", mappedTransactions);

      // Update the chart data
      window.investmentChart.setInvestmentData(combinedInvestmentData);
      window.investmentChart.setTransactionData(mappedTransactions);

      return {
        investments: combinedInvestmentData,
        transactions: mappedTransactions,
      };
    } catch (error) {
      console.error("Error fetching chart data:", error);
      return { investments: [], transactions: [] };
    }
  }

  // Expose these functions to the global scope to allow for dynamic data loading
  window.investmentChart = {
    // Function to update investment data
    setInvestmentData: function (newData) {
      investmentData = newData;
      // If modal exists, update its investment options
      updateModalInvestmentOptions();
      return this; // For chaining
    },

    // Function to update transaction data
    setTransactionData: function (newData) {
      // Process incoming transaction data to ensure dates are Date objects
      transactionData = newData.map((transaction) => {
        if (typeof transaction.date === "string") {
          transaction.date =
            transactionDateParse(transaction.date) ||
            new Date(transaction.date);
        }
        return transaction;
      });

      // Refresh visualization if it's already initialized
      if (document.querySelector("#investment-chart svg")) {
        updateInvestmentVisualization();
      }
      return this; // For chaining
    },

    // Function to add a single transaction
    addTransaction: async function (transaction) {
      // Process date if it's a string
      if (typeof transaction.date === "string") {
        transaction.date =
          transactionDateParse(transaction.date) || new Date(transaction.date);
      }

      // Format transaction for IndexedDB
      const dbTransaction = {
        entity_id: transaction.entity_id,
        entity_type:
          transaction.investmentType === "fund" ? "investment" : "land",
        transaction_type: transaction.transactionType,
        amount: transaction.amount.toString(),
        transaction_date: transaction.date,
        notes: transaction.notes || "",
      };

      // If it has an ID, it's an update
      if (transaction.id) {
        dbTransaction.id = transaction.id;
        await updateData(STORES.transactions, dbTransaction);
      } else {
        // Add to database
        const newId = await addData(STORES.transactions, dbTransaction);
        transaction.id = newId;
      }

      // Add to local array
      transactionData.push(transaction);

      // Refresh visualization if it's already initialized
      if (document.querySelector("#investment-chart svg")) {
        updateInvestmentVisualization();
      }
      return this; // For chaining
    },

    // Function to update a transaction
    updateTransaction: async function (transaction) {
      // Ensure transaction.id is a number
      if (transaction.id) {
        transaction.id = Number(transaction.id);
      }

      // Find the transaction in our array - ensure we compare as numbers
      const index = transactionData.findIndex(
        (t) => Number(t.id) === Number(transaction.id)
      );

      if (index >= 0) {
        // Process date if it's a string
        if (typeof transaction.date === "string") {
          transaction.date =
            transactionDateParse(transaction.date) ||
            new Date(transaction.date);
        }

        // Update in memory
        transactionData[index] = transaction;

        // Format transaction for IndexedDB
        const dbTransaction = {
          id: transaction.id,
          entity_id: transaction.entity_id,
          entity_type:
            transaction.investmentType === "fund" ? "investment" : "land",
          transaction_type: transaction.transactionType,
          amount: transaction.amount.toString(),
          transaction_date: transaction.date,
          notes: transaction.notes || "",
        };

        // Update in database
        await updateData(STORES.transactions, dbTransaction);

        // Refresh visualization
        updateInvestmentVisualization();
      } else {
        console.warn(
          "Transaction with ID",
          transaction.id,
          "not found in local data"
        );
      }

      return this; // For chaining
    },

    // Function to remove a transaction by ID
    removeTransaction: async function (idOrIndex) {
      let id, index;

      if (typeof idOrIndex === "object" && idOrIndex.id) {
        id = Number(idOrIndex.id);
        index = transactionData.findIndex((t) => Number(t.id) === id);
      } else if (typeof idOrIndex === "number") {
        index = idOrIndex;
        id = transactionData[index]?.id
          ? Number(transactionData[index].id)
          : null;
      }

      if (index >= 0 && index < transactionData.length && id) {
        // Remove from array
        transactionData.splice(index, 1);

        // Remove from database
        await deleteData(STORES.transactions, id);

        // Refresh visualization
        updateInvestmentVisualization();
      } else {
        console.warn("Failed to remove transaction:", idOrIndex);
      }

      return this; // For chaining
    },

    // Method to initialize or refresh the chart
    refreshChart: function () {
      updateInvestmentVisualization();
      return this; // For chaining
    },

    // Get current data
    getInvestmentData: function () {
      return [...investmentData];
    },

    getTransactionData: function () {
      return [...transactionData];
    },

    // Method to reload data from IndexedDB
    reloadData: async function () {
      await fetchChartData();
      return this; // For chaining
    },

    // Add new investment to IndexedDB
    addInvestment: async function (investment) {
      // Format for database
      const dbInvestment = {
        name: investment.name,
        size: investment.size.toString(),
        share_percentage: investment.share_percentage.toString(),
        investment_amount: investment.investment_amount.toString(),
        debt_percentage: investment.debt_percentage.toString(),
        debt_amount: investment.debt_amount.toString(),
        cash_investment: investment.cash_investment.toString(),
      };

      // Add to database
      const newId = await addData(STORES.investments, dbInvestment);

      // Add to memory with proper format
      const newInvestment = {
        id: newId,
        name: investment.name,
        val1: parseFloat(investment.size),
        val2: `${investment.share_percentage}%`,
        val3: parseFloat(investment.investment_amount),
        val4: `${investment.debt_percentage}%`,
        val5: parseFloat(investment.debt_amount),
        val6: parseFloat(investment.cash_investment),
      };

      investmentData.push(newInvestment);
      updateModalInvestmentOptions();

      return newId;
    },

    // Add new land to IndexedDB
    addLand: async function (land) {
      // Format for database
      const dbLand = {
        land_name: land.land_name,
        size_sqm: land.size_sqm.toString(),
        price_per_sqm: land.price_per_sqm.toString(),
        value: land.value.toString(),
        debt_percentage: land.debt_percentage.toString(),
        debt_amount: land.debt_amount.toString(),
        cash_injection: land.cash_injection.toString(),
      };

      // Add to database
      const newId = await addData(STORES.lands, dbLand);

      // Add to memory with proper format
      const newLand = {
        id: newId,
        name: land.land_name,
        val1: parseFloat(land.size_sqm),
        val2: parseFloat(land.price_per_sqm),
        val3: parseFloat(land.value),
        val4: `${land.debt_percentage}%`,
        val5: parseFloat(land.debt_amount),
        val6: parseFloat(land.cash_injection),
      };

      investmentData.push(newLand);
      updateModalInvestmentOptions();

      return newId;
    },
  };

  // Function to update the modal's investment options
  function updateModalInvestmentOptions() {
    const select = document.getElementById("investment-name");
    if (!select) return;

    // Clear existing options
    select.innerHTML = "";

    // Add placeholder option
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Select an investment";
    placeholder.disabled = true;
    placeholder.selected = true;
    select.appendChild(placeholder);

    // Simple arrays to hold fund and land options
    const fundOptions = [];
    const landOptions = [];

    // Add options to appropriate arrays first
    investmentData.forEach((item) => {
      if (!item || !item.name) return; // Skip items without a name

      if (item.name.includes("Fund")) {
        fundOptions.push({
          id: item.id,
          name: item.name,
          type: "investment",
        });
      } else if (item.name.includes("Land")) {
        landOptions.push({
          id: item.id,
          name: item.name,
          type: "land",
        });
      }
    });

    // Add a fund header if we have fund options
    if (fundOptions.length > 0) {
      const fundHeader = document.createElement("option");
      fundHeader.disabled = true;
      fundHeader.textContent = "--- Funds ---";
      select.appendChild(fundHeader);

      // Add all fund options
      fundOptions.forEach((fund) => {
        const option = document.createElement("option");
        option.value = fund.id;
        option.textContent = fund.name;
        option.dataset.type = fund.type;
        select.appendChild(option);
      });
    }

    // Add a land header if we have land options
    if (landOptions.length > 0) {
      const landHeader = document.createElement("option");
      landHeader.disabled = true;
      landHeader.textContent = "--- Lands ---";
      select.appendChild(landHeader);

      // Add all land options
      landOptions.forEach((land) => {
        const option = document.createElement("option");
        option.value = land.id;
        option.textContent = land.name;
        option.dataset.type = land.type;
        select.appendChild(option);
      });
    }

    // If no options were added, show a message
    if (fundOptions.length === 0 && landOptions.length === 0) {
      const noOptions = document.createElement("option");
      noOptions.value = "";
      noOptions.textContent = "No investments or lands available";
      noOptions.disabled = true;
      select.appendChild(noOptions);
    }
  }

  // // Create tooltip container with enhanced styling
  const tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)
    .style("transform", "scale(0.95)");

  // Create date label for dragging
  const dateLabel = d3
    .select("body")
    .append("div")
    .attr("class", "date-label")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("background", "rgba(0,0,0,0.7)")
    .style("color", "white")
    .style("padding", "4px 8px")
    .style("border-radius", "4px")
    .style("font-size", "12px")
    .style("pointer-events", "none")
    .style("z-index", "1000");

  // Create investment transaction modal - initially empty, will be populated when needed
  const investmentModal = d3
    .select("body")
    .append("div")
    .attr("class", "modal")
    .style("display", "none");

  // Initialization function to populate the modal when investmentData is available
  function initTransactionModal() {
    if (!investmentData.length) return;

    // Build options HTML
    let optionsHtml =
      '<option value="" disabled selected>Select an investment</option>';

    // Get fund and land items
    const fundItems = investmentData.filter(
      (item) => item.name && item.name.includes("Fund")
    );
    const landItems = investmentData.filter(
      (item) => item.name && item.name.includes("Land")
    );

    // Add fund options
    if (fundItems.length > 0) {
      optionsHtml += "<option disabled>--- Funds ---</option>";
      fundItems.forEach((item) => {
        optionsHtml += `<option value="${item.id}" data-type="investment">${item.name}</option>`;
      });
    }

    // Add land options
    if (landItems.length > 0) {
      optionsHtml += "<option disabled>--- Lands ---</option>";
      landItems.forEach((item) => {
        optionsHtml += `<option value="${item.id}" data-type="land">${item.name}</option>`;
      });
    }

    // If no options, add a message
    if (fundItems.length === 0 && landItems.length === 0) {
      optionsHtml += "<option disabled>No investments available</option>";
    }

    investmentModal.html(`
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2 id="transaction-modal-title">Add Investment Transaction</h2>
            <form id="transaction-form">
                <input type="hidden" id="transaction-id">
                <div class="form-group">
                    <label for="investment-name">Investment</label>
                    <select id="investment-name" required>
                        ${optionsHtml}
                    </select>
                </div>
                <div class="form-group">
                    <label for="transaction-type">Transaction Type</label>
                    <select id="transaction-type" required>
                        <option value="buy">Buy</option>
                        <option value="sale">Sale</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="transaction-amount">Amount</label>
                    <input type="number" id="transaction-amount" min="1" required>
                </div>
                <div class="form-group">
                    <label for="transaction-date">Date</label>
                    <input type="date" id="transaction-date" required>
                </div>
                <div class="form-group">
                    <label for="transaction-notes">Notes (Optional)</label>
                    <textarea id="transaction-notes" rows="3"></textarea>
                </div>
                <button type="submit" class="btn-submit">Save</button>
                <button type="button" class="btn-delete">Delete</button>
            </form>
        </div>
    `);

    // Add event listener for form submission
    document
      .getElementById("transaction-form")
      .addEventListener("submit", async function (e) {
        e.preventDefault();

        // Get form values
        const formData = {
          id: document.getElementById("transaction-id").value
            ? parseInt(document.getElementById("transaction-id").value)
            : undefined,
          entity_id: parseInt(document.getElementById("investment-name").value),
          transactionType: document.getElementById("transaction-type").value,
          amount: parseFloat(
            document.getElementById("transaction-amount").value
          ),
          date: new Date(document.getElementById("transaction-date").value),
          notes: document.getElementById("transaction-notes").value,
        };

        // Get investment type from selected option
        const selectedOption =
          document.getElementById("investment-name").selectedOptions[0];
        const entityType = selectedOption.dataset.type;
        formData.investmentType = entityType === "investment" ? "fund" : "land";
        formData.name = selectedOption.textContent;

        // Save to IndexedDB via the investmentChart object
        if (formData.id) {
          await window.investmentChart.updateTransaction(formData);
        } else {
          await window.investmentChart.addTransaction(formData);
        }

        // Close the modal
        investmentModal.style("display", "none");
      });

    // Investment modal delete button
    document
      .querySelector("#transaction-form .btn-delete")
      .addEventListener("click", async function () {
        const id = document.getElementById("transaction-id").value;

        if (id) {
          // Confirm deletion
          if (confirm("Are you sure you want to delete this transaction?")) {
            await window.investmentChart.removeTransaction({ id: Number(id) });

            // Close the modal
            investmentModal.style("display", "none");
          }
        } else {
          // Just close the modal for new transactions
          investmentModal.style("display", "none");
        }
      });

    // Investment modal close button
    investmentModal.select(".close").on("click", function () {
      investmentModal.style("display", "none");
    });
  }

  // Function to find date from position on timeline
  function getDateFromPosition(xPos) {
    return timeScale.invert(xPos);
  }

  // Function to validate date is within range
  function isDateInRange(date) {
    return date >= startDate && date < endDate;
  }

  // Close modal when clicking on X or outside
  d3.selectAll(".close").on("click", function () {
    d3.selectAll(".modal").style("display", "none");
  });

  window.addEventListener("click", function (event) {
    if (event.target.classList.contains("modal")) {
      d3.selectAll(".modal").style("display", "none");
    }
  });

  // Function to group roles by date proximity
  function groupRolesByProximity(roles, dayThreshold = 10) {
    const sortedRoles = [...roles].sort((a, b) => a.date - b.date);
    const groups = [];
    let currentGroup = null;

    sortedRoles.forEach((role) => {
      const roleTime = role.date.getTime();

      if (!currentGroup) {
        // Start first group
        currentGroup = {
          date: role.date,
          roles: [role],
        };
        groups.push(currentGroup);
      } else {
        // Check if this role is close to the average of the current group
        const groupAvgTime = currentGroup.date.getTime();
        const daysDiff =
          Math.abs(roleTime - groupAvgTime) / (1000 * 60 * 60 * 24);

        if (daysDiff <= dayThreshold) {
          // Add to current group and update average date
          currentGroup.roles.push(role);

          // Recalculate group date as the average
          const totalTime = currentGroup.roles.reduce(
            (sum, r) => sum + r.date.getTime(),
            0
          );
          currentGroup.date = new Date(totalTime / currentGroup.roles.length);
        } else {
          // Start a new group
          currentGroup = {
            date: role.date,
            roles: [role],
          };
          groups.push(currentGroup);
        }
      }
    });

    return groups;
  }

  // Function to group investment transactions by date proximity
  function groupTransactionsByProximity(transactions, dayThreshold = 10) {
    const sortedTransactions = [...transactions].sort(
      (a, b) => a.date - b.date
    );
    const groups = [];
    let currentGroup = null;

    sortedTransactions.forEach((transaction) => {
      const transactionTime = transaction.date.getTime();

      if (!currentGroup) {
        // Start first group
        currentGroup = {
          date: transaction.date,
          transactions: [transaction],
        };
        groups.push(currentGroup);
      } else {
        // Check if this transaction is close to the average of the current group
        const groupAvgTime = currentGroup.date.getTime();
        const daysDiff =
          Math.abs(transactionTime - groupAvgTime) / (1000 * 60 * 60 * 24);

        if (daysDiff <= dayThreshold) {
          // Add to current group and update average date
          currentGroup.transactions.push(transaction);

          // Recalculate group date as the average
          const totalTime = currentGroup.transactions.reduce(
            (sum, t) => sum + t.date.getTime(),
            0
          );
          currentGroup.date = new Date(
            totalTime / currentGroup.transactions.length
          );
        } else {
          // Start a new group
          currentGroup = {
            date: transaction.date,
            transactions: [transaction],
          };
          groups.push(currentGroup);
        }
      }
    });

    return groups;
  }

  // Function to update only the investment visualization
  function updateInvestmentVisualization() {
    // Ensure we have investment data to work with
    if (!investmentData.length) {
      console.warn("No investment data available for visualization");
    }

    // If modal hasn't been initialized yet, do it now
    if (!document.getElementById("transaction-form")) {
      initTransactionModal();
    }

    // First fully clear the investment chart to ensure complete redraw
    const investmentChart = d3.select("#investment-chart");

    // Use selectAll and remove to ensure complete DOM cleanup
    investmentChart.selectAll("*").remove();

    // Then redraw the chart
    drawInvestmentChart();
  }

  // Function to update date range
  function updateDateRange() {
    // Get the input date values
    const startDateValue = d3.select("#start-date").property("value");
    const endDateValue = d3.select("#end-date").property("value");

    // Parse dates
    const newStartDate = startDateValue ? new Date(startDateValue) : startDate;
    const newEndDate = endDateValue ? new Date(endDateValue) : endDate;

    // Validate dates
    if (newStartDate >= newEndDate) {
      alert("Start date must be before end date");
      return;
    }

    // Update dates
    startDate = newStartDate;
    endDate = newEndDate;

    // Update the time scale
    timeScale.domain([startDate, endDate]);

    // Redraw the chart
    updateInvestmentVisualization();
  }

  // Add event listeners for date range controls
  d3.select("#apply-dates").on("click", updateDateRange);

  // Handle keypress events on the inputs
  d3.select("#start-date").on("keypress", function (event) {
    if (event.key === "Enter") {
      updateDateRange();
      event.preventDefault();
    }
  });

  d3.select("#end-date").on("keypress", function (event) {
    if (event.key === "Enter") {
      updateDateRange();
      event.preventDefault();
    }
  });

  // Main function to initialize investment chart
  async function initInvestmentChart() {
    try {
      // Show loading indicator
      const investmentChart = d3.select("#investment-chart");
      investmentChart.html(
        '<div class="loading-indicator">Loading investment data...</div>'
      );

      // Initialize IndexedDB
      if (!db) {
        await initDatabase();
        await seedDatabaseIfEmpty();
      }

      // Fetch data from IndexedDB
      await fetchChartData();

      // Initialize the visualization with the fetched data
      updateDateRange();
    } catch (error) {
      console.error("Error initializing investment chart:", error);

      // Show error message
      const investmentChart = d3.select("#investment-chart");
      investmentChart.html(`
        <div class="error-message">
          <p>Error loading investment data: ${error.message}</p>
          <button id="retry-load-btn">Retry</button>
        </div>
      `);

      // Add retry button event listener
      d3.select("#retry-load-btn").on("click", () => {
        initInvestmentChart();
      });
    }
  }

  // Function to draw the investment chart
  function drawInvestmentChart() {
    // Clear previous chart completely
    const investmentChart = d3.select("#investment-chart");
    investmentChart.html("");

    // Create the legend at the top of the chart section
    const legendItems = [
      { type: "fund-buy", label: "Fund Purchase" },
      { type: "fund-sale", label: "Fund Sale" },
      { type: "land-buy", label: "Land Purchase" },
      { type: "land-sale", label: "Land Sale" },
    ];

    // Color scale for different investment types (defined early so it can be used in legend)
    const color = d3
      .scaleOrdinal()
      .domain(["fund-buy", "fund-sale", "land-buy", "land-sale"])
      .range(["#4CAF50", "#F44336", "#2196F3", "#FF9800"]);

    // Populate the legend at the top
    const topLegend = d3.select("#investment-legend");
    topLegend.html(""); // Clear any existing content

    legendItems.forEach((item) => {
      const legendItem = topLegend.append("div").attr("class", "legend-item");

      legendItem
        .append("div")
        .attr("class", "color-box")
        .style("background-color", color(item.type));

      // Add indicator for position (above/below timeline)
      const positionIndicator = item.type.includes("-sale")
        ? "↓ Below"
        : "↑ Above";

      legendItem
        .append("span")
        .html(`${item.label} <small>(${positionIndicator})</small>`);
    });

    // Filter transactions based on selected date range
    const visibleTransactions = transactionData.filter(
      (transaction) =>
        transaction.date >= startDate && transaction.date <= endDate
    );

    // Process the transaction data for display
    if (visibleTransactions.length === 0) {
      investmentChart
        .append("div")
        .attr("class", "no-data-message")
        .text(
          "No investment transactions in the selected date range. Click anywhere on the timeline below to add a new transaction."
        );
      // Continue rendering the chart instead of returning
    }

    // Create a timeline for investments at the top of the chart
    const investmentTimelineHeight = 150;
    const investmentSvg = d3
      .select("#investment-chart")
      .append("svg")
      .attr("width", "100%")
      .attr("height", investmentTimelineHeight)
      .attr("viewBox", `0 0 ${svgWidth} ${investmentTimelineHeight}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    const investmentTimelineY = 60;

    // Draw timeline
    investmentSvg
      .append("line")
      .attr("class", "timeline")
      .attr("x1", timelineStart)
      .attr("x2", timelineEnd)
      .attr("y1", investmentTimelineY)
      .attr("y2", investmentTimelineY)
      .attr("stroke", "#ddd")
      .attr("stroke-width", 1);

    // Add "Today" indicator if current date is within the visible range
    const today = new Date();
    if (today >= startDate && today <= endDate) {
      const todayX = timeScale(today);

      // Add vertical line for today
      investmentSvg
        .append("line")
        .attr("class", "today-line")
        .attr("x1", todayX)
        .attr("x2", todayX)
        .attr("y1", investmentTimelineY - 25)
        .attr("y2", investmentTimelineY + 25)
        .attr("stroke", "#FF5722")
        .attr("stroke-width", 1.5)
        .attr("stroke-dasharray", "4,3");

      // Add "Today" label
      investmentSvg
        .append("text")
        .attr("class", "today-label")
        .attr("x", todayX)
        .attr("y", investmentTimelineY - 30)
        .attr("text-anchor", "middle")
        .attr("font-size", "11px")
        .attr("font-weight", "bold")
        .attr("fill", "#FF5722")
        .text("Today");

      // Add dot on timeline
      investmentSvg
        .append("circle")
        .attr("class", "today-dot")
        .attr("cx", todayX)
        .attr("cy", investmentTimelineY)
        .attr("r", 4)
        .attr("fill", "#FF5722")
        .attr("stroke", "white")
        .attr("stroke-width", 1)
        .on("mouseover", function (event) {
          tooltip.transition().duration(200).style("opacity", 0.9);
          tooltip
            .html(`Today: ${dateFormat(today)}`)
            .style("left", event.pageX + 10 + "px")
            .style("top", event.pageY - 28 + "px");
        })
        .on("mouseout", function () {
          tooltip.transition().duration(500).style("opacity", 0);
        });
    }

    // Create time axis with ticks every month
    const timeAxis = d3
      .axisBottom(timeScale)
      .ticks(d3.timeMonth.every(1))
      .tickFormat(d3.timeFormat("%b"))
      .tickSize(5);

    // Add time axis
    investmentSvg
      .append("g")
      .attr("class", "time-axis")
      .attr("transform", `translate(0, ${investmentTimelineY})`)
      .call(timeAxis)
      .select(".domain")
      .remove();

    // Style tick lines
    investmentSvg
      .selectAll(".time-axis line")
      .attr("stroke", "#ccc")
      .attr("stroke-dasharray", "2,2");

    // Style tick text
    investmentSvg
      .selectAll(".time-axis text")
      .attr("font-size", "10px")
      .attr("dy", "1em");

    // Add year labels (dynamically based on date range)
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();

    // Add start year label
    investmentSvg
      .append("text")
      .attr("class", "year-label")
      .attr("x", timelineStart)
      .attr("y", investmentTimelineY + 35)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .text(startYear);

    // Add end year label
    if (startYear !== endYear) {
      investmentSvg
        .append("text")
        .attr("class", "year-label")
        .attr("x", timelineEnd)
        .attr("y", investmentTimelineY + 35)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .text(endYear);

      // Add intermediate year labels if the range spans multiple years
      for (let year = startYear + 1; year < endYear; year++) {
        const yearDate = new Date(year, 0, 1);
        // Only add label if the year falls within our visible range
        if (yearDate >= startDate && yearDate <= endDate) {
          const xPos = timeScale(yearDate);

          investmentSvg
            .append("text")
            .attr("class", "year-label")
            .attr("x", xPos)
            .attr("y", investmentTimelineY + 35)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .text(year);
        }
      }
    }

    // Add click area for adding new transactions
    investmentSvg
      .append("rect")
      .attr("pointer-events", "all")
      .attr("x", timelineStart)
      .attr("y", investmentTimelineY - 10)
      .attr("width", timelineLength)
      .attr("height", 20)
      .attr("fill", "transparent")
      .style("cursor", "copy")
      .on("click", function (event) {
        const coords = d3.pointer(event);
        const clickX = coords[0];
        const clickDate = getDateFromPosition(clickX);

        if (isDateInRange(clickDate)) {
          showTransactionModal(clickDate);
        }
      });

    // Group investment transactions by date for visualization
    const groupedTransactions = groupTransactionsByProximity(
      visibleTransactions,
      14
    ); // 14 days proximity

    // Process the investment transactions on the timeline
    groupedTransactions.forEach((group) => {
      // Get position for this group's date
      const position = timeScale(group.date);

      // Determine dot color based on transaction types in this group
      let dotColor = "#4CAF50"; // Default green for buys

      // Check if the group has any sale transactions
      const hasSales = group.transactions.some(
        (t) => t.transactionType === "sale"
      );
      const hasBuys = group.transactions.some(
        (t) => t.transactionType === "buy"
      );

      if (hasSales && hasBuys) {
        dotColor = "#9C27B0"; // Purple for mixed transaction types
      } else if (hasSales) {
        dotColor = "#F44336"; // Red for sales
      }

      // Add a colored dot for this group's date
      investmentSvg
        .append("circle")
        .attr("class", "timeline-point transaction-point")
        .attr("cx", position)
        .attr("cy", investmentTimelineY)
        .attr("r", 5)
        .attr("fill", dotColor);

      // Add transaction emojis with proper spacing
      const totalTransactions = group.transactions.length;
      group.transactions.forEach((transaction, i) => {
        // Determine horizontal offset for multiple transactions
        let offsetX = 0;
        if (totalTransactions > 1) {
          offsetX = (i - (totalTransactions - 1) / 2) * 30;
        }

        // Get emoji type
        const emojiType = `${transaction.investmentType}-${transaction.transactionType}`;
        const emoji = transactionEmojis[emojiType] || "💰";

        // Determine vertical position based on transaction type
        // Buy transactions go above the line, sale transactions go below
        const verticalPosition =
          transaction.transactionType === "buy"
            ? investmentTimelineY - 45 // Above the timeline
            : investmentTimelineY + 35; // Slightly closer to timeline for sales

        // Create a group for the transaction (emoji + label)
        const transactionGroup = investmentSvg
          .append("g")
          .attr(
            "data-id",
            transaction.id
              ? Number(transaction.id)
              : transactionData.indexOf(transaction)
          )
          .attr(
            "transform",
            `translate(${position + offsetX}, ${verticalPosition})`
          )
          .style("cursor", "pointer");

        // Add invisible circle for better hover area
        transactionGroup
          .append("circle")
          .attr("class", "transaction-hover-area")
          .attr("r", 20)
          .attr("cx", 0)
          .attr("cy", 0)
          .attr("fill", "transparent");

        // Add emoji with subtle animation
        transactionGroup
          .append("text")
          .attr("class", "emoji")
          .attr("x", 0)
          .attr("y", 0)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .attr("font-size", "24px")
          .attr("transform", "scale(1.5)") // Doubles the emoji size
          .text(emoji)
          .style("opacity", 0)
          .transition()
          .duration(300)
          .style("opacity", 1);

        // Add transaction label - position adjusted for buy/sale
        transactionGroup
          .append("text")
          .attr("class", "transaction-label")
          .attr("x", 0)
          .attr("y", 30) // Both types now have labels below the emoji
          .attr("text-anchor", "middle")
          .attr("font-size", "10px")
          .text(transaction.name);

        // Add enhanced tooltip
        transactionGroup
          .on("mouseenter", function (event) {
            // Prevent rapid hover state changes
            event.stopPropagation();

            tooltip
              .transition()
              .duration(200)
              .style("opacity", 0.9)
              .style("transform", "scale(1)");

            const transactionType =
              transaction.transactionType === "buy" ? "Purchase" : "Sale";
            const investmentType =
              transaction.investmentType.charAt(0).toUpperCase() +
              transaction.investmentType.slice(1);

            tooltip
              .html(
                `
                  <strong>${transaction.name}</strong><br/>
                  Type: <strong>${investmentType} ${transactionType}</strong><br/>
                  Date: <strong>${dateFormat(transaction.date)}</strong><br/>
                  Amount: <strong>$${Math.abs(
                    transaction.amount
                  ).toLocaleString()}</strong><br/>
                  <small>(Click to edit)</small>
                `
              )
              .style("left", event.pageX + 30 + "px")
              .style("top", event.pageY - 108 + "px");
          })
          .on("mouseleave", function () {
            tooltip
              .transition()
              .duration(300)
              .style("opacity", 0)
              .style("transform", "scale(0.95)");
          })
          .on("click", function () {
            // When clicked, open the modal to edit the transaction
            // For simplicity, just open it with the first item in this group
            if (items.length > 0) {
              // Ensure we're working with a transaction that has a numeric ID
              const transactionCopy = { ...items[0] };
              if (transactionCopy.id) {
                transactionCopy.id = Number(transactionCopy.id);
              }
              showTransactionModal(items[0].date, transactionCopy);
            }
          });

        // Make transaction draggable
        transactionGroup.call(
          d3
            .drag()
            .on("start", function (event) {
              // Prevent browser's default drag behavior
              event.sourceEvent.preventDefault();
              event.sourceEvent.stopPropagation();

              d3.select(this)
                .style("cursor", "grabbing")
                .raise() // Bring to front
                .classed("dragging", true); // Add class for styles

              // Get connector color based on transaction type
              const connectorColor =
                transaction.transactionType === "buy" ? "#4CAF50" : "#F44336";

              // Create the triangle connector
              const connector = investmentSvg
                .append("path")
                .attr("class", "drag-connector")
                .attr("stroke", connectorColor)
                .attr("stroke-width", 2)
                .attr("fill", "none");

              // Add visual indicator for current date
              investmentSvg
                .append("circle")
                .attr("class", "current-date-indicator")
                .attr("cx", timeScale(transaction.date))
                .attr("cy", investmentTimelineY)
                .attr("r", 8)
                .attr("fill", "none")
                .attr("stroke", connectorColor)
                .attr("stroke-width", 1)
                .attr("stroke-dasharray", "3,2");
            })
            .on("drag", function (event) {
              // Update position while dragging
              const x = event.x;

              // Determine y position based on transaction type
              const isSale = transaction.transactionType === "sale";
              const yPos = isSale
                ? Math.max(investmentTimelineY + 30, event.y) // Keep sales below timeline
                : Math.min(investmentTimelineY - 30, event.y); // Keep buys above timeline

              d3.select(this).attr("transform", `translate(${x}, ${yPos})`);

              // Get target date at current position
              const targetDate = getDateFromPosition(x);

              // Show date label during drag
              dateLabel
                .style("opacity", 1)
                .html(dateFormat(targetDate))
                .style("left", event.sourceEvent.pageX + 10 + "px")
                .style("top", event.sourceEvent.pageY - 30 + "px");

              // Update the connector - change path based on transaction type
              const trianglePath = isSale
                ? `M ${x} ${yPos - 15} L ${timeScale(
                    transaction.date
                  )} ${investmentTimelineY}`
                : `M ${x} ${yPos + 15} L ${timeScale(
                    transaction.date
                  )} ${investmentTimelineY}`;

              investmentSvg.select(".drag-connector").attr("d", trianglePath);

              // Remove previous target indicator
              investmentSvg.selectAll(".target-date-indicator").remove();

              // Don't highlight dates beyond the end date
              if (isDateInRange(targetDate)) {
                // Get color based on transaction type
                const indicatorColor =
                  transaction.transactionType === "buy" ? "#4CAF50" : "#F44336";
                const fillColor =
                  transaction.transactionType === "buy"
                    ? "rgba(76, 175, 80, 0.2)"
                    : "rgba(244, 67, 54, 0.2)";

                // Add visual indicator for target date
                investmentSvg
                  .append("circle")
                  .attr("class", "target-date-indicator")
                  .attr("cx", timeScale(targetDate))
                  .attr("cy", investmentTimelineY)
                  .attr("r", 8)
                  .attr("fill", fillColor)
                  .attr("stroke", indicatorColor)
                  .attr("stroke-width", 1.5);
              }
            })
            .on("end", function (event) {
              // Hide date label
              dateLabel.style("opacity", 0);

              // Determine date at drop position
              const newDate = getDateFromPosition(event.x);

              // Update data if date changed and is in range
              if (
                newDate.getTime() !== transaction.date.getTime() &&
                isDateInRange(newDate)
              ) {
                // Store original date for comparison
                const originalDate = new Date(transaction.date);

                // Update date
                transaction.date = new Date(newDate);

                // Add subtle feedback animation
                d3.select(this)
                  .style("transform", "scale(1.2)")
                  .transition()
                  .duration(300)
                  .style("transform", "scale(1)");

                // Clear any existing timeouts
                if (window.investmentUpdateTimeout) {
                  clearTimeout(window.investmentUpdateTimeout);
                }

                // Force complete redraw with a small delay to ensure animations complete
                window.investmentUpdateTimeout = setTimeout(() => {
                  updateInvestmentVisualization();
                }, 50);

                // Show feedback about change
                tooltip.transition().duration(200).style("opacity", 0.9);
                tooltip
                  .html(
                    `
                      <strong>Moved to ${dateFormat(newDate)}</strong><br/>
                      Transaction date updated
                    `
                  )
                  .style("left", event.sourceEvent.pageX + 10 + "px")
                  .style("top", event.sourceEvent.pageY - 28 + "px");

                setTimeout(() => {
                  tooltip.transition().duration(500).style("opacity", 0);
                }, 3000);
              } else if (isDateInRange(newDate)) {
                // If only the vertical position changed but date is the same,
                // we still want to force a redraw to ensure proper position
                updateInvestmentVisualization();
              } else {
                // If no change or invalid target, reset position
                drawInvestmentChart();
              }

              // Remove the connector and indicators
              investmentSvg.select(".drag-connector").remove();
              investmentSvg.select(".current-date-indicator").remove();
              investmentSvg.select(".target-date-indicator").remove();

              // Reset cursor
              d3.select(this).style("cursor", "grab");
            })
        );
      });
    });

    // Now draw the bar chart below the timeline - only if we have transactions
    if (visibleTransactions.length > 0) {
      // Sort transactions by date
      const sortedTransactions = [...visibleTransactions].sort(
        (a, b) => a.date - b.date
      );

      // Group transactions by date
      const transactions = d3.groups(sortedTransactions, (d) => {
        const date = d.date;
        return `${date.getMonth() + 1}/${date.getDate()}/${date
          .getFullYear()
          .toString()
          .substr(-2)}`;
      });

      // Set chart dimensions
      const margin = { top: 20, right: 50, bottom: 80, left: 60 };
      const width = 1000 - margin.left - margin.right;
      const height = 300 - margin.top - margin.bottom;

      // Create SVG for bar chart
      const barChartSvg = d3
        .select("#investment-chart")
        .append("svg")
        .attr("width", "100%")
        .attr("height", height + margin.top + margin.bottom)
        .attr(
          "viewBox",
          `0 0 ${width + margin.left + margin.right} ${
            height + margin.top + margin.bottom
          }`
        )
        .attr("preserveAspectRatio", "xMidYMid meet")
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      // Create scales
      const x = d3
        .scaleBand()
        .domain(transactions.map((d) => d[0]))
        .range([0, width])
        .padding(0.3);

      // Get max value for y axis
      const maxValue = d3.max(transactions, (d) => {
        return d3.sum(d[1], (t) => Math.abs(t.amount));
      });

      const y = d3
        .scaleLinear()
        .domain([0, maxValue * 1.1]) // Add 10% padding
        .range([height, 0]);

      // Add X axis
      barChartSvg
        .append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-45)");

      // Add Y axis
      barChartSvg.append("g").call(d3.axisLeft(y).tickFormat((d) => `$${d}`));

      // Draw stacked bars
      transactions.forEach((transaction) => {
        const date = transaction[0];
        const entries = transaction[1];

        let yPos = height;

        // Group by investment type and transaction type
        const byType = d3.groups(
          entries,
          (d) => `${d.investmentType}-${d.transactionType}`
        );

        byType.forEach((group) => {
          const type = group[0];
          const items = group[1];

          // Get total amount for this group
          const totalAmount = d3.sum(items, (d) => Math.abs(d.amount));
          const barHeight = height - y(totalAmount);

          // Create group for each bar segment
          const barGroup = barChartSvg
            .append("g")
            .attr("class", "investment-bar")
            .attr("data-date", date)
            .attr("data-type", type);

          // Draw the bar segment
          barGroup
            .append("rect")
            .attr("x", x(date))
            .attr("y", yPos - barHeight)
            .attr("width", x.bandwidth())
            .attr("height", barHeight)
            .attr("fill", color(type))
            .attr("opacity", 0.8)
            .on("mouseenter", function (event) {
              // Show tooltip
              tooltip.transition().duration(200).style("opacity", 0.9);

              // Format the items for display
              const itemsList = items
                .map(
                  (item) =>
                    `${item.name}: ${
                      item.transactionType === "buy" ? "+" : "-"
                    }$${Math.abs(item.amount)}`
                )
                .join("<br>");

              tooltip
                .html(
                  `
                <strong>${date}</strong><br>
                <strong>${
                  type.split("-")[0].charAt(0).toUpperCase() +
                  type.split("-")[0].slice(1)
                } 
                ${type.split("-")[1]}</strong><br>
                Total: $${totalAmount}<br>
                <hr style="margin: 5px 0; opacity: 0.3">
                ${itemsList}
              `
                )
                .style("left", event.pageX + 10 + "px")
                .style("top", event.pageY - 28 + "px");
            })
            .on("mouseleave", function () {
              tooltip.transition().duration(500).style("opacity", 0);
            })
            .on("click", function () {
              // When clicked, open the modal to edit the transaction
              // For simplicity, just open it with the first item in this group
              if (items.length > 0) {
                // Ensure we're working with a transaction that has a numeric ID
                const transactionCopy = { ...items[0] };
                if (transactionCopy.id) {
                  transactionCopy.id = Number(transactionCopy.id);
                }
                showTransactionModal(items[0].date, transactionCopy);
              }
            });

          // Update position for next segment
          yPos -= barHeight;
        });
      });

      // Add X axis label
      barChartSvg
        .append("text")
        .attr("text-anchor", "middle")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 5)
        .text("Transaction Date")
        .style("font-size", "12px");

      // Add Y axis label
      barChartSvg
        .append("text")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left)
        .attr("x", -height / 2)
        .text("Amount ($)")
        .style("font-size", "12px");
    }
  }

  // Function to show transaction modal
  function showTransactionModal(date, transaction = null) {
    // Ensure modal is initialized
    if (!document.getElementById("transaction-form")) {
      initTransactionModal();
    }

    // Reset form
    document.getElementById("transaction-form").reset();
    document.getElementById("transaction-id").value = "";
    document.getElementById("transaction-modal-title").textContent = transaction
      ? "Edit Transaction"
      : "Add Investment Transaction";

    if (transaction) {
      // Find the correct investment option in the dropdown
      let foundOption = false;

      // First try to find by name
      if (transaction.name) {
        const options = Array.from(
          document.getElementById("investment-name").options
        );
        const matchingOption = options.find(
          (option) =>
            option.textContent === transaction.name && !option.disabled
        );

        if (matchingOption) {
          document.getElementById("investment-name").value =
            matchingOption.value;
          foundOption = true;
        }
      }

      // If not found by name and we have an ID, try by ID
      if (!foundOption && transaction.id) {
        const investmentSelect = document.getElementById("investment-name");

        // Ensure we're comparing numeric IDs
        const transactionId = Number(transaction.id);
        const entityId = transaction.entity_id
          ? Number(transaction.entity_id)
          : null;

        // Look for matching investment in our data
        const matchingInvestment = investmentData.find(
          (inv) =>
            Number(inv.id) === transactionId ||
            (entityId && Number(inv.id) === entityId)
        );

        if (matchingInvestment) {
          // Find the option with this ID
          const options = Array.from(investmentSelect.options);
          const matchingOption = options.find(
            (option) =>
              Number(option.value) === Number(matchingInvestment.id) &&
              !option.disabled
          );

          if (matchingOption) {
            investmentSelect.value = matchingOption.value;
            foundOption = true;
          }
        }
      }

      document.getElementById("transaction-type").value =
        transaction.transactionType;
      document.getElementById("transaction-amount").value = Math.abs(
        transaction.amount
      );

      // Add notes if available
      if (transaction.notes) {
        document.getElementById("transaction-notes").value = transaction.notes;
      }

      // Format date for the input field (YYYY-MM-DD)
      const dateStr = transaction.date.toISOString().split("T")[0];
      document.getElementById("transaction-date").value = dateStr;
      document.getElementById("transaction-id").value = Number(transaction.id);
    } else {
      // Set default values for new transaction
      const dateStr = date.toISOString().split("T")[0];
      document.getElementById("transaction-date").value = dateStr;
      document.getElementById("transaction-type").value = "buy";
    }

    // Show delete button only for existing transactions
    document.querySelector("#transaction-form .btn-delete").style.display =
      transaction ? "inline-block" : "none";

    // Show modal
    investmentModal.style("display", "block");
  }

  // Initialize the IndexedDB when the page loads
  initDatabase()
    .then(() => {
      console.log(
        "Database initialized, checking if data needs to be seeded..."
      );
      return seedDatabaseIfEmpty();
    })
    .catch((error) => {
      console.error("Error initializing database:", error);
    });
});
