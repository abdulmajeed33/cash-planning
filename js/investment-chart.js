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
  const DB_VERSION = 2;
  const STORES = {
    investments: "investments",
    lands: "lands",
    transactions: "transactions",
  };

  let db;
  
  // Variable for opening cash balance
  let openingBalance = 50000; // Default opening balance

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

  // Function to reset the database (clear all data)
  async function resetDatabase() {
    return new Promise((resolve, reject) => {
      console.log("Resetting database...");

      // Delete the database completely
      const deleteRequest = indexedDB.deleteDatabase(DB_NAME);

      deleteRequest.onsuccess = () => {
        console.log("Database deleted successfully");

        // Re-initialize the database
        db = null;
        initDatabase()
          .then(() => {
            console.log("Database re-initialized after reset");
            resolve();
          })
          .catch((err) => {
            console.error("Error re-initializing database:", err);
            reject(err);
          });
      };

      deleteRequest.onerror = (event) => {
        console.error("Error deleting database:", event.target.error);
        reject(event.target.error);
      };
    });
  }

  // Check if database is empty and add sample data if needed
  async function seedDatabaseIfEmpty() {
    try {
      const investments = await getAllData(STORES.investments);
      const lands = await getAllData(STORES.lands);
      const transactions = await getAllData(STORES.transactions);

      // Check if we have proper transactions with correct sign convention
      const hasIncorrectTransactions = transactions.some((tx) => {
        // Buy transactions should be negative, sale transactions should be positive
        const amount = parseFloat(tx.amount);
        return (
          (tx.transaction_type === "buy" && amount > 0) ||
          (tx.transaction_type === "sale" && amount < 0)
        );
      });

      if (investments.length === 0 && lands.length === 0) {
        console.log("Database is empty, adding sample data...");
        await seedSampleData();
        // Refresh the page after seeding data to properly display it
        console.log(
          "Sample data added, refreshing page to display seeded data..."
        );
        window.location.reload();
      } else if (hasIncorrectTransactions) {
        console.log(
          "Found transactions with incorrect sign convention, resetting database..."
        );
        await resetDatabase();
        await seedSampleData();
        console.log(
          "Database reset and reseeded with correct data, refreshing page..."
        );
        window.location.reload();
      } else {
        console.log(
          "Database already has correctly formatted data, skipping seed"
        );
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
        amount: "-60000", // IMPORTANT: Buy transactions should be negative
        transaction_date: new Date(currentYear, currentMonth, currentDay + 60), // 60 days after current date
        notes: "Full investment in Tech Growth Fund",
      },
      {
        id: 2,
        entity_id: 2,
        entity_type: "investment",
        transaction_type: "buy",
        amount: "-52500", // IMPORTANT: Buy transactions should be negative
        transaction_date: new Date(currentYear, currentMonth, currentDay + 120), // 120 days after current date
        notes: "Full investment in Renewable Energy Fund",
      },
      {
        id: 3,
        entity_id: 1,
        entity_type: "investment",
        transaction_type: "sale",
        amount: "60000", // IMPORTANT: Sale transactions should be positive
        transaction_date: new Date(currentYear, currentMonth, currentDay + 180), // 180 days after current date
        notes: "Full exit from Tech Growth Fund",
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
      // Ensure transaction_date is a Date object and entity_type is properly mapped
      return transactions.map((tx) => ({
        ...tx,
        transaction_date: new Date(tx.transaction_date),
        // Make sure investmentType is explicitly set based on entity_type
        investmentType: tx.entity_type === "investment" ? "fund" : "land",
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
  const currentMonth = new Date().getMonth();
  const currentDay = new Date().getDate();

  // Define initial date range for the timeline (current year by default)
  let startDate = new Date(currentYear, currentMonth, currentDay); // Jan 1, current year
  let endDate = new Date(currentYear + 1, currentMonth, currentDay); // Jan 1, next year

  // Define initial amount range filter (initially inactive)
  let minAmount = 0;
  let maxAmount = Infinity;
  let amountFilterActive = false;

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
    "fund-sale": "📈",
    "land-buy": "🏞️",
    "land-sale": "🏞️",
  };

  // Initialize date inputs with current year dates
  d3.select("#start-date").property("value", inputDateFormat(startDate));
  d3.select("#end-date").property("value", inputDateFormat(endDate));

  // Add date preset buttons
  const dateRangeControl = d3.select(".date-range-control");

  // Use the existing date-presets from HTML instead of creating it dynamically
  const datePresets = d3.select(".date-presets");

  // Global variable to store timeline instance
  let timelineInstance = null;

  // Only proceed if datePresets exists in the HTML
  if (datePresets.node()) {
    // Add event listeners to the existing HTML buttons
    d3.select("#btn-1-month").on("click", set1Month);
    d3.select("#btn-3-months").on("click", set3Months);
    d3.select("#btn-6-months").on("click", set6Months);
    d3.select("#btn-1-year").on("click", set1Year);
    
    // Set the initial value of the opening balance input to match the JS variable
    d3.select("#opening-balance").property("value", openingBalance);
    
    // Add event listeners for opening balance
    d3.select("#apply-opening-balance").on("click", updateOpeningBalance);
    
    // Add keypress event listener to the opening balance input
    d3.select("#opening-balance").on("keypress", function(event) {
      if (event.key === "Enter") {
        updateOpeningBalance();
        event.preventDefault();
      }
    });
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

        // Find the related entity by both ID and type
        let relatedEntity;

        if (isInvestmentType) {
          // Only search among investments when entity_type is investment
          relatedEntity = mappedInvestments.find(
            (inv) => inv.id === tx.entity_id
          );
        } else {
          // Only search among lands when entity_type is land
          relatedEntity = mappedLands.find((land) => land.id === tx.entity_id);
        }

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

      // Update the internal arrays directly (safer approach)
      investmentData = combinedInvestmentData;
      transactionData = mappedTransactions;

      // Also update modal options if needed
      if (typeof updateModalInvestmentOptions === "function") {
        updateModalInvestmentOptions();
      }

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
      if (typeof updateModalInvestmentOptions === "function") {
        updateModalInvestmentOptions();
      }
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
      try {
        console.log("Adding transaction:", transaction);

        // Process date if it's a string
        if (typeof transaction.date === "string") {
          transaction.date =
            transactionDateParse(transaction.date) ||
            new Date(transaction.date);
        }

        // Validation is now done at form submission time
        // No validation checks here

        // Apply correct sign based on transaction type - FIX: Ensure correct sign
        let amountValue = parseFloat(transaction.amount);
        // Make buy transactions negative and sale transactions positive
        if (transaction.transactionType === "buy" && amountValue > 0) {
          amountValue = -amountValue;
        } else if (transaction.transactionType === "sale" && amountValue < 0) {
          amountValue = Math.abs(amountValue);
        }

        // Format transaction for IndexedDB
        const dbTransaction = {
          entity_id: transaction.entity_id,
          // Always ensure entity_type is correctly set based on investmentType
          entity_type:
            transaction.investmentType === "fund" ? "investment" : "land",
          transaction_type: transaction.transactionType,
          amount: amountValue.toString(),
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

        // Update amount in local object
        transaction.amount = amountValue;

        // Add to local array
        transactionData.push(transaction);

        // Refresh visualization if it's already initialized
        if (document.querySelector("#investment-chart svg")) {
          updateInvestmentVisualization();
        }
      } catch (error) {
        console.error("Error adding transaction:", error);
        alert("Error adding transaction: " + error.message);
      }
      return this; // For chaining
    },

    // Function to update a transaction
    updateTransaction: async function (transaction) {
      try {
        console.log("Updating transaction:", transaction);

        // Process date if it's a string
        if (typeof transaction.date === "string") {
          transaction.date =
            transactionDateParse(transaction.date) ||
            new Date(transaction.date);
        }

        // Validation is now done at form submission time
        // No validation checks here

        // Update amount sign based on transaction type - FIX: Ensure correct sign
        let amountValue = parseFloat(transaction.amount);
        // Make buy transactions negative and sale transactions positive
        if (transaction.transactionType === "buy" && amountValue > 0) {
          amountValue = -amountValue;
        } else if (transaction.transactionType === "sale" && amountValue < 0) {
          amountValue = Math.abs(amountValue);
        }

        // Format transaction for IndexedDB
        const dbTransaction = {
          id: transaction.id,
          entity_id: transaction.entity_id,
          // Always ensure entity_type is correctly set based on investmentType
          entity_type:
            transaction.investmentType === "fund" ? "investment" : "land",
          transaction_type: transaction.transactionType,
          amount: amountValue.toString(),
          transaction_date: transaction.date,
          notes: transaction.notes || "",
        };

        // Update in database
        await updateData(STORES.transactions, dbTransaction);

        // Update in local array
        const index = transactionData.findIndex(
          (t) => Number(t.id) === Number(transaction.id)
        );
        if (index !== -1) {
          // Update with proper sign
          transaction.amount = amountValue;
          transactionData[index] = { ...transaction };
        } else {
          // If not found, just add it with proper sign
          transaction.amount = amountValue;
          transactionData.push(transaction);
        }

        // Refresh visualization
        updateInvestmentVisualization();
      } catch (error) {
        console.error("Error updating transaction:", error);
        alert("Error updating transaction: " + error.message);
      }
      return this; // For chaining
    },

    // Function to remove a transaction
    removeTransaction: async function (transaction) {
      try {
        console.log("Removing transaction:", transaction);

        if (!transaction.id) {
          console.error("Cannot remove transaction without ID");
          return this;
        }

        // Delete from database
        await deleteData(STORES.transactions, transaction.id);

        // Remove from local array
        transactionData = transactionData.filter(
          (t) => Number(t.id) !== Number(transaction.id)
        );

        // Refresh visualization
        updateInvestmentVisualization();
        console.log("Transaction removed successfully");
      } catch (error) {
        console.error("Error removing transaction:", error);
        alert("Error removing transaction: " + error.message);
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
  };

  // Create amount range filter container - only if element exists, using safer methods
  const timelineEl = d3.select("#investment-timeline");
  const dateRangeSelector = ".date-range-control";

  // Only add the filter controls if the timeline element exists
  let filterControls;
  if (timelineEl.node()) {
    try {
      // Simply append the filter controls after the date range control
      // instead of trying to use insertBefore with a complex selector
      filterControls = timelineEl
        .append("div")
        .attr("class", "amount-range-control")
        .style("margin", "20px 0")
        .style("padding", "15px")
        .style("background", "#f5f5f5")
        .style("border-radius", "8px")
        .style("border", "1px solid #ddd")
        .style("display", "none"); // Hide the amount filter for now

      // Move it after the date range control if possible
      const dateRangeEl = document.querySelector(dateRangeSelector);
      if (dateRangeEl && dateRangeEl.nextSibling && filterControls.node()) {
        dateRangeEl.parentNode.insertBefore(
          filterControls.node(),
          dateRangeEl.nextSibling
        );
      }
    } catch (e) {
      console.error("Error creating amount filter controls:", e);
      // Fallback - just append to the timeline
      filterControls = timelineEl
        .append("div")
        .attr("class", "amount-range-control")
        .style("margin", "20px 0")
        .style("padding", "15px")
        .style("background", "#f5f5f5")
        .style("border-radius", "8px")
        .style("border", "1px solid #ddd");
    }

    // Only proceed if filterControls was successfully created
    if (filterControls) {
      // Add title
      filterControls
        .append("h4")
        .text("Filter by Transaction Amount:")
        .style("margin-top", "0");

      // Create amount filter row
      const amountFilterRow = filterControls
        .append("div")
        .style("display", "flex")
        .style("align-items", "center")
        .style("gap", "10px")
        .style("margin-bottom", "10px");

      // Add checkbox to enable/disable filter
      amountFilterRow
        .append("input")
        .attr("type", "checkbox")
        .attr("id", "enable-amount-filter")
        .style("margin", "0");

      amountFilterRow
        .append("label")
        .attr("for", "enable-amount-filter")
        .text("Enable Amount Filter")
        .style("margin", "0");

      // Create amount inputs row
      const amountInputsRow = filterControls
        .append("div")
        .style("display", "flex")
        .style("gap", "10px")
        .style("margin-bottom", "10px");

      // Add min amount input
      amountInputsRow.append("div").style("flex", "1").html(`
          <label for="min-amount">Min Amount ($)</label>
          <input type="number" id="min-amount" min="0" value="0" class="form-control" style="width: 100%">
        `);

      // Add max amount input
      amountInputsRow.append("div").style("flex", "1").html(`
          <label for="max-amount">Max Amount ($)</label>
          <input type="number" id="max-amount" min="0" value="" placeholder="No maximum" class="form-control" style="width: 100%">
        `);

      // Add apply button
      filterControls
        .append("button")
        .attr("id", "apply-amount-filter")
        .attr("class", "btn btn-primary")
        .text("Apply Amount Filter")
        .style("margin-right", "10px");

      // Add reset button
      filterControls
        .append("button")
        .attr("id", "reset-amount-filter")
        .attr("class", "btn btn-secondary")
        .text("Reset");

      // Add event listeners for amount filter controls
      d3.select("#apply-amount-filter").on("click", updateAmountFilter);
      d3.select("#reset-amount-filter").on("click", resetAmountFilter);
    }
  }

  // Date preset handler functions
  function set1Month() {
    const now = new Date();
    
    // Set start date to half a month before now, and end date to half a month after now
    // This places today roughly in the middle of the timeline
    startDate = new Date(now);
    startDate.setDate(now.getDate() - 15); // Go back half a month
    
    endDate = new Date(now);
    endDate.setDate(now.getDate() + 15); // Go forward half a month
    
    updateInputsAndChart();
  }

  function set3Months() {
    const now = new Date();
    
    // Set start date to 1.5 months before now, and end date to 1.5 months after now
    // This places today roughly in the middle of the timeline
    startDate = new Date(now);
    startDate.setMonth(now.getMonth() - 1.5); // Go back 1.5 months
    
    endDate = new Date(now);
    endDate.setMonth(now.getMonth() + 1.5); // Go forward 1.5 months
    
    updateInputsAndChart();
  }

  function set6Months() {
    const now = new Date();
    
    // Set start date to 3 months before now, and end date to 3 months after now
    // This places today roughly in the middle of the timeline
    startDate = new Date(now);
    startDate.setMonth(now.getMonth() - 3); // Go back 3 months
    
    endDate = new Date(now);
    endDate.setMonth(now.getMonth() + 3); // Go forward 3 months
    
    updateInputsAndChart();
  }

  function set1Year() {
    const now = new Date();
    
    // Set start date to 6 months before now, and end date to 6 months after now
    // This places today roughly in the middle of the timeline
    startDate = new Date(now);
    startDate.setMonth(now.getMonth() - 6); // Go back 6 months
    
    endDate = new Date(now);
    endDate.setMonth(now.getMonth() + 6); // Go forward 6 months
    
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

  // Function to update amount range filter
  function updateAmountFilter() {
    // Get values from inputs
    amountFilterActive = document.getElementById(
      "enable-amount-filter"
    ).checked;
    minAmount = parseFloat(document.getElementById("min-amount").value) || 0;

    const maxInput = document.getElementById("max-amount");
    maxAmount =
      maxInput && maxInput.value ? parseFloat(maxInput.value) : Infinity;

    // Ensure min <= max
    if (minAmount > maxAmount && maxAmount !== Infinity) {
      alert("Minimum amount must be less than or equal to maximum amount");
      return;
    }

    // Apply filter
    updateInvestmentVisualization();
  }

  // Function to reset amount filter
  function resetAmountFilter() {
    // Reset filter values
    document.getElementById("enable-amount-filter").checked = false;
    document.getElementById("min-amount").value = "0";
    document.getElementById("max-amount").value = "";

    // Reset internal state
    amountFilterActive = false;
    minAmount = 0;
    maxAmount = Infinity;

    // Update visualization
    updateInvestmentVisualization();
  }

  // Function to update the investment visualization
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
      .range(["#F44336", "#4CAF50", "#FF9800", "#2196F3"]);

    // Populate the legend at the top
    const topLegend = d3.select("#investment-legend");
    topLegend.html(""); // Clear any existing content

    legendItems.forEach((item) => {
      const legendItem = topLegend.append("div").attr("class", "legend-item");

      legendItem
        .append("div")
        .attr("class", "color-box")
        .style("background-color", color(item.type));


      legendItem
        .append("span")
        .html(`${item.label}`);
    });

    // Add closing balance to legend
    const balanceLegendItem = topLegend
      .append("div")
      .attr("class", "legend-item balance-legend-item");

    balanceLegendItem
      .append("div")
      .attr("class", "color-box")
      .style("background-color", "#FF9800");

    balanceLegendItem
      .append("span")
      .html(`Closing Balance`);

    // Add divider line explanation to legend
    const dividerLegendItem = topLegend
      .append("div")
      .attr("class", "legend-item")
      .style("margin-top", "8px");

    // Create a small line to demonstrate the divider
    dividerLegendItem
      .append("div")
      .attr("class", "color-box")
      .html(
        `<div style="width: 100%; height: 2px; background: white; border-top: 1px dashed #666; margin-top: 8px;"></div>`
      )
      .style("background", "transparent");

    dividerLegendItem
      .append("span")
      .html(
        `<small>Dashed lines separate transactions on different dates</small>`
      );

    // Filter transactions based on selected date range AND amount filter
    const visibleTransactions = filterTransactions(transactionData);

    // Create filter status message
    const filterCheckbox = document.getElementById("enable-amount-filter");
    const isFilterActive = filterCheckbox
      ? filterCheckbox.checked
      : amountFilterActive;

    if (isFilterActive) {
      const filterMin = document.getElementById("min-amount")
        ? parseFloat(document.getElementById("min-amount").value) || 0
        : minAmount;

      const maxInput = document.getElementById("max-amount");
      const filterMax =
        maxInput && maxInput.value ? parseFloat(maxInput.value) : maxAmount;

      const filterMsg = investmentChart
        .append("div")
        .attr("class", "filter-status")
        .style("margin-bottom", "10px")
        .style("padding", "5px 10px")
        .style("background", "#e8f5e9")
        .style("border-left", "4px solid #4CAF50")
        .style("border-radius", "2px");

      filterMsg.append("strong").text("Amount filter active: ");

      const maxDisplay =
        filterMax === Infinity
          ? "No maximum"
          : `$${filterMax.toLocaleString()}`;
      filterMsg
        .append("span")
        .text(`$${filterMin.toLocaleString()} to ${maxDisplay}`);

      filterMsg
        .append("span")
        .text(` (Showing ${visibleTransactions.length} transactions)`);
    }

    // Process the transaction data for display
    if (visibleTransactions.length === 0) {
      investmentChart
        .append("div")
        .attr("class", "no-data-message")
        .text(
          "No investment transactions in the selected range. Click anywhere on the timeline below to add a new transaction."
        );
      // Continue rendering the chart instead of returning
    }

    // Clean up any existing timeline instance
    if (timelineInstance) {
      timelineInstance.destroy();
      timelineInstance = null;
    }

    // Create investment timeline using the component
    timelineInstance = createInvestmentTimeline({
      containerId: "investment-chart",
      transactions: visibleTransactions,
      timeScale: timeScale,
      startDate: startDate,
      endDate: endDate,
      dimensions: {
        svgWidth: svgWidth,
        timelineStart: timelineStart,
        timelineEnd: timelineEnd,
        timelineLength: timelineLength
      },
      tooltip: tooltip,
      dateLabel: dateLabel,
      transactionEmojis: transactionEmojis,
      dateFormat: dateFormat,
      getDateFromPosition: getDateFromPosition,
      isDateInRange: isDateInRange,
      groupTransactionsByProximity: groupTransactionsByProximity,
      showTransactionModal: showTransactionModal,
      deleteTransaction: deleteTransaction,
      updateInvestmentVisualization: updateInvestmentVisualization,
      highlightBarSegmentForTransaction: highlightBarSegmentForTransaction
    });

    // Now draw the bar chart below the timeline - only if we have transactions
    if (visibleTransactions.length > 0) {
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

      // Group transactions by entity (fund/land name)
      const transactionsByEntity = d3.groups(
        visibleTransactions,
        (d) => d.name
      );

      // Calculate total buy and sale amounts for each entity
      const entityData = transactionsByEntity.map((group) => {
        const name = group[0];
        const transactions = group[1];

        // Get investment type (fund or land)
        const investmentType = transactions[0].investmentType;

        // Calculate buy and sale totals - FIX: Use signed values
        const buyTotal = d3.sum(
          transactions.filter((t) => t.transactionType === "buy"),
          (d) => -d.amount // Buy is negative, so negate to get positive value for display
        );

        const saleTotal = d3.sum(
          transactions.filter((t) => t.transactionType === "sale"),
          (d) => d.amount // Sale is already positive
        );

        // Find earliest transaction date for sorting
        const dates = transactions.map((t) => new Date(t.date));
        const earliestDate = new Date(
          Math.min(...dates.map((d) => d.getTime()))
        );

        return {
          name,
          investmentType,
          buyTotal,
          saleTotal,
          total: buyTotal + saleTotal,
          earliestDate,
          transactions,
        };
      });

      // Sort by earliest transaction date (chronological order)
      entityData.sort((a, b) => a.earliestDate - b.earliestDate);

      // Calculate the min and max values for the y-axis
      const maxValue = (d3.max(entityData, d => d.saleTotal) || 0) * 1.1;

      // For buys, we want the actual negative values
      const minValue = (d3.min(
        visibleTransactions.filter(t => t.transactionType === "buy"),
        d => d.amount
      ) || 0) * 1.1;
      

      // Create y scale that includes negative values for buys
      const y = d3
        .scaleLinear()
        .domain([minValue, maxValue]) // Range from min (negative) to max (positive)
        .range([height, 0]);

      // Calculate the position of the zero line
      const zeroLineY = y(0);

      // Create a time-based x scale
      const xTime = d3
        .scaleTime()
        .domain([startDate, endDate])
        .range([0, width]);

      // Calculate the width for each month based on the time scale
      const calculateMonthWidth = (date) => {
        // Calculate a reasonable bar width based on month length
        const currentMonth = new Date(date);
        const nextMonth = new Date(date);
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        // Account for date range boundary
        if (nextMonth > endDate) {
          nextMonth.setTime(endDate.getTime());
        }

        // Calculate width based on time scale
        const monthWidth = xTime(nextMonth) - xTime(currentMonth);

        // Set a reasonable width - not too narrow and not too wide
        return Math.min(Math.max(monthWidth * 0.6, 15), 60);
      };

      // Create time axis with appropriate ticks
      const timeAxis = d3
        .axisBottom(xTime)
        .ticks(10)
        .tickFormat(d3.timeFormat("%b %d"))
        .tickSize(5);

      // Add X axis with time scale
      barChartSvg
        .append("g")
        .attr("class", "time-axis")
        .attr("transform", `translate(0,${height})`)
        .call(timeAxis);

      // Style tick lines
      barChartSvg
        .selectAll(".time-axis line")
        .attr("stroke", "#ccc")
        .attr("stroke-dasharray", "2,2");

      // Style tick text
      barChartSvg
        .selectAll(".time-axis text")
        .attr("font-size", "10px")
        .attr("dy", "1em");

      // Add Y axis
      barChartSvg.append("g").call(d3.axisLeft(y).tickFormat((d) => `$${d}`));

      // Add a horizontal line at y=0 to separate buy and sale transactions

      barChartSvg
        .append("line")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", zeroLineY)
        .attr("y2", zeroLineY)
        .attr("stroke", "#000")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "4,4");

      // Add a small label at the zero line
      barChartSvg
        .append("text")
        .attr("x", -25)
        .attr("y", zeroLineY + 4)
        .attr("text-anchor", "end")
        .attr("font-size", "10px")
        .attr("fill", "#666")
        .text("$0");

      // Add Y axis label
      barChartSvg
        .append("text")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left)
        .attr("x", -height / 2)
        .text("Amount ($)")
        .style("font-size", "12px");

      // Add year labels if the range spans multiple years
      const startYear = startDate.getFullYear();
      const endYear = endDate.getFullYear();

      if (startYear !== endYear) {
        // Add start year label
        barChartSvg
          .append("text")
          .attr("class", "year-label")
          .attr("x", 0)
          .attr("y", height + 50)
          .attr("text-anchor", "middle")
          .attr("font-size", "12px")
          .text(startYear);

        // Add end year label
        barChartSvg
          .append("text")
          .attr("class", "year-label")
          .attr("x", width)
          .attr("y", height + 50)
          .attr("text-anchor", "middle")
          .attr("font-size", "12px")
          .text(endYear);

        // Add intermediate year labels
        for (let year = startYear + 1; year < endYear; year++) {
          const yearDate = new Date(year, 0, 1);
          if (yearDate >= startDate && yearDate <= endDate) {
            const xPos = xTime(yearDate);

            barChartSvg
              .append("text")
              .attr("class", "year-label")
              .attr("x", xPos)
              .attr("y", height + 50)
              .attr("text-anchor", "middle")
              .attr("font-size", "12px")
              .text(year);
          }
        }
      }

      // Draw bars for each entity
      entityData.forEach((entity) => {
        const barGroup = barChartSvg
          .append("g")
          .attr("class", "investment-entity-group")
          .datum(entity);

        // Group buy transactions by date
        const buyTransactionsByDate = d3.groups(
          entity.transactions.filter((t) => t.transactionType === "buy"),
          (d) => d.date.toDateString()
        );

        // Draw buy transaction segments
        buyTransactionsByDate.forEach((dateGroup, i) => {
          const transactions = dateGroup[1];
          const transactionDate = transactions[0].date;

          // Calculate bar position and width based on date
          const barX =
            xTime(transactionDate) - calculateMonthWidth(transactionDate) / 2;
          const barWidth = calculateMonthWidth(transactionDate);

          // Calculate bar position and height for negative values (buys)
          const buyTotal = d3.sum(transactions, (d) => d.amount); // Use actual negative amount
          const barY = y(0); // Start at zero line
          const barHeight = y(buyTotal) - y(0); // Height going down from zero

          barGroup
            .append("rect")
            .attr("class", "buy-bar-segment")
            .attr("x", barX)
            .attr("y", barY) // Position at zero line
            .attr("width", barWidth)
            .attr("height", Math.abs(barHeight)) // Use absolute height value
            .attr(
              "fill",
              entity.investmentType === "fund" ? "#F44336" : "#FF9800"
            ) // Green for fund buys, blue for land buys
            .attr("opacity", 0.8)
            .attr("stroke", "#fff")
            .attr("stroke-width", 0.5)
            .attr("data-entity-name", entity.name)
            .attr("data-transaction-type", "buy")
            .attr("data-date", transactions[0].date.toISOString())
            .attr(
              "data-transaction-ids",
              transactions.map((t) => t.id).join(",")
            )
            .on("mouseenter", function (event) {
              // Show tooltip
              tooltip.transition().duration(200).style("opacity", 0.9);

              // Format transactions for display, showing negative values
              const transactionsList = transactions
                .map(
                  (t) => `${dateFormat(t.date)}: $${t.amount.toLocaleString()}`
                )
                .join("<br>");

              tooltip
                .html(
                  `
                  <strong>${entity.name}</strong><br>
                  <strong>Purchases on ${dateFormat(
                    transactions[0].date
                  )}</strong><br>
                  <strong>Total: $${buyTotal.toLocaleString()}</strong><br>
                  <hr style="margin: 5px 0; opacity: 0.3">
                  ${transactionsList}
                `
                )
                .style("left", event.pageX + 10 + "px")
                .style("top", event.pageY - 28 + "px");
            })
            .on("mouseleave", function () {
              tooltip.transition().duration(500).style("opacity", 0);
            })
            .on("click", function () {
              if (transactions.length > 0) {
                // Modal opening removed
              }
            });

          // Add a small label on bottom of the bar (for buy transactions)
          barGroup
            .append("text")
            .attr("class", "bar-label")
            .attr("x", barX + barWidth / 2)
            .attr("y", barY + Math.abs(barHeight) + 15) // Position below the bar
            .attr("text-anchor", "middle")
            .attr("font-size", "9px")
            .attr("fill", "#333")
            .text(entity.name);
        });
        const saleTransactionsByDate = d3.groups(
          entity.transactions.filter((t) => t.transactionType === "sale"),
          (d) => d.date.toDateString()
        );

        // Draw sale transaction segments
        saleTransactionsByDate.forEach((dateGroup, i) => {
          const transactions = dateGroup[1];
          const transactionDate = transactions[0].date;

          // Calculate bar position and width based on date
          const barX =
            xTime(transactionDate) - calculateMonthWidth(transactionDate) / 2;
          const barWidth = calculateMonthWidth(transactionDate);

          // Calculate heights for positive values (sales)
          const saleTotal = d3.sum(transactions, (d) => d.amount);
          const barHeight = y(0) - y(saleTotal);

          // For sales, position at y(saleTotal) which will be above zero line
          barGroup
            .append("rect")
            .attr("class", "sale-bar-segment")
            .attr("x", barX)
            .attr("y", y(saleTotal)) // Position bars above zero line
            .attr("width", barWidth)
            .attr("height", barHeight)
            .attr(
              "fill",
              entity.investmentType === "fund" ? "#4CAF50" : "#2196F3"
            ) // Red for fund sales, orange for land sales
            .attr("opacity", 0.8)
            .attr("stroke", "#fff")
            .attr("stroke-width", 0.5)
            .attr("data-entity-name", entity.name)
            .attr("data-transaction-type", "sale")
            .attr("data-date", transactions[0].date.toISOString())
            .attr(
              "data-transaction-ids",
              transactions.map((t) => t.id).join(",")
            )
            .on("mouseenter", function (event) {
              // Show tooltip
              tooltip.transition().duration(200).style("opacity", 0.9);

              // Format transactions for display, showing positive values
              const transactionsList = transactions
                .map(
                  (t) => `${dateFormat(t.date)}: $${t.amount.toLocaleString()}`
                )
                .join("<br>");

              tooltip
                .html(
                  `
                  <strong>${entity.name}</strong><br>
                  <strong>Sales on ${dateFormat(
                    transactions[0].date
                  )}</strong><br>
                  <strong>Total: $${saleTotal.toLocaleString()}</strong><br>
                  <hr style="margin: 5px 0; opacity: 0.3">
                  ${transactionsList}
                `
                )
                .style("left", event.pageX + 10 + "px")
                .style("top", event.pageY - 28 + "px");
            })
            .on("mouseleave", function () {
              tooltip.transition().duration(500).style("opacity", 0);
            })
            .on("click", function () {
              if (transactions.length > 0) {
                // Modal opening removed
              }
            });

          // Add a small label on top of the bar (for sale transactions)
          barGroup
            .append("text")
            .attr("class", "bar-label")
            .attr("x", barX + barWidth / 2)
            .attr("y", y(saleTotal) - 5) // Position above the bar
            .attr("text-anchor", "middle")
            .attr("font-size", "9px")
            .attr("fill", "#333")
            .text(entity.name);
        });
      });

      // Calculate running balance for each transaction
      // First, sort transactions by date
      const sortedTransactions = [...visibleTransactions].sort((a, b) => 
        a.date.getTime() - b.date.getTime()
      );
      
      let runningBalance = openingBalance;
      const balanceData = [];
      
      // Add the starting point (first date with opening balance)
      balanceData.push({
        date: startDate,
        balance: runningBalance
      });
      
      // Calculate running balance over time
      sortedTransactions.forEach(transaction => {
        // For buy transactions (negative amounts), subtract from balance
        // For sale transactions (positive amounts), add to balance
        runningBalance += transaction.amount;
        
        balanceData.push({
          date: transaction.date,
          balance: runningBalance
        });
      });
      
      // Add final point (end date with last balance)
      balanceData.push({
        date: endDate,
        balance: runningBalance
      });
      
      // Create a line generator for the balance line
      const line = d3.line()
        .x(d => xTime(d.date))
        .y(d => y(d.balance))
        .curve(d3.curveMonotoneX);
      
      // Calculate the Y domain including the balance data
      const maxBalance = Math.max(maxValue, d3.max(balanceData, d => d.balance) || 0);
      const minBalance = Math.min(minValue, d3.min(balanceData, d => d.balance) || 0);
      
      // Update the Y scale to include balance data
      y.domain([minBalance, maxBalance * 1.1]);
      
      // Draw the closing balance line
      barChartSvg.append("path")
        .datum(balanceData)
        .attr("class", "closing-balance-line")
        .attr("d", line);
      
      // Add data points on the line
      barChartSvg.selectAll(".balance-point")
        .data(balanceData.slice(1, -1)) // Skip first and last point (start and end dates)
        .enter()
        .append("circle")
        .attr("class", "balance-point")
        .attr("cx", d => xTime(d.date))
        .attr("cy", d => y(d.balance))
        .attr("r", 4)
        .attr("fill", "#FF9800")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .append("title")
        .text(d => `Date: ${dateFormat(d.date)}\nClosing Balance: $${d.balance.toLocaleString()}`);
    }
  }

  // Function to show transaction modal for a specific date
  function showTransactionModal(date, transaction = null) {
    console.log("Showing transaction modal for date:", date);

    // Format date for the input
    const formattedDate = date.toISOString().split("T")[0];

    // Make sure the modal is initialized
    if (!document.getElementById("transaction-form")) {
      if (typeof initTransactionModal === "function") {
        initTransactionModal();
      } else {
        console.error("Transaction modal initialization function not found!");
        return;
      }
    }

    // Always set modal title to Add transaction
    const modalTitle = document.getElementById("transaction-modal-title");
    if (modalTitle) {
      modalTitle.textContent = "Add Transaction";
    }

    // Always treat as new transaction
    investmentModal.classed("editing-transaction", false);

    // Reset form
    const form = document.getElementById("transaction-form");
    if (form) form.reset();

    // Clear the transaction ID field (hidden)
    const idField = document.getElementById("transaction-id");
    if (idField) idField.value = "";

    // Set the date field
    const dateField = document.getElementById("transaction-date");
    if (dateField) dateField.value = formattedDate;

    // For new transaction, hide delete button
    const deleteBtn = document.querySelector(".btn-delete");
    if (deleteBtn) deleteBtn.style.display = "none";

    // Ensure amount field is readonly
    const amountField = document.getElementById("transaction-amount");
    if (amountField) {
      amountField.setAttribute("readonly", true);
    }

    // For new transactions, select first real investment option (not disabled options)
    setTimeout(() => {
      const investmentField = document.getElementById("investment-name");
      if (investmentField) {
        // If no value is selected or the first option is disabled, try to select first valid option
        if (
          !investmentField.value ||
          investmentField.options[investmentField.selectedIndex].disabled
        ) {
          // Find first non-disabled option
          for (let i = 0; i < investmentField.options.length; i++) {
            if (!investmentField.options[i].disabled) {
              investmentField.selectedIndex = i;
              break;
            }
          }
        }

        // Manually trigger the change event to set amount
        if (investmentField.value) {
          const event = new Event("change");
          investmentField.dispatchEvent(event);
        }
      }
    }, 100); // Small delay to ensure the modal is fully initialized

    // Show the modal
    investmentModal.style("display", "block");

    // Return true to indicate the modal was shown
    return true;
  }

  // Function to validate sale transactions
  function validateSaleTransaction() {
    console.log("Running validateSaleTransaction");

    const transactionType = document.getElementById("transaction-type").value;
    const investmentId = document.getElementById("investment-name").value;
    const transactionId = document.getElementById("transaction-id").value;
    const amountInput = document.getElementById("transaction-amount");
    const submitButton = document.querySelector(
      "#transaction-form .btn-submit"
    );
    const errorMsg =
      document.getElementById("sale-validation-error") ||
      document.createElement("div");

    console.log(
      `Transaction type: ${transactionType}, Investment ID: ${investmentId}, Transaction ID: ${transactionId}`
    );

    // Only validate if this is a sale transaction
    if (transactionType === "sale" && investmentId) {
      // Get all transactions for this investment
      const entityId = Number(investmentId);
      const currentTransactionId = transactionId ? Number(transactionId) : null;

      // Get the investment type (fund or land)
      const selectedOption =
        document.getElementById("investment-name").selectedOptions[0];
      const entityType = selectedOption.dataset.type; // "investment" or "land"
      const investmentType = entityType === "investment" ? "fund" : "land";

      console.log(
        `Validating sale for entity ID ${entityId}, type: ${investmentType}, current transaction ID: ${currentTransactionId}`
      );

      // Filter transactions for this specific entity (excluding this one being updated)
      // IMPORTANT: Check both entity_id AND entity_type to prevent mix-ups between funds and lands
      const entityTransactions = transactionData.filter(
        (t) =>
          Number(t.entity_id) === entityId &&
          t.investmentType === investmentType &&
          (!currentTransactionId || Number(t.id) !== currentTransactionId)
      );

      console.log(
        `Found ${entityTransactions.length} related transactions (excluding current)`,
        entityTransactions
      );

      // Calculate total buy amount up to current date
      const dateInput = document.getElementById("transaction-date");
      const transactionDate = dateInput.value
        ? new Date(dateInput.value)
        : new Date();

      console.log(`Transaction date: ${transactionDate.toISOString()}`);

      // Get buy transactions that happened before this sale date
      const buyTransactions = entityTransactions.filter(
        (t) => t.transactionType === "buy" && t.date <= transactionDate
      );

      // Get sale transactions that happened before this sale date
      const saleTransactions = entityTransactions.filter(
        (t) => t.transactionType === "sale" && t.date <= transactionDate
      );

      console.log(
        `Buy transactions: ${buyTransactions.length}`,
        buyTransactions
      );
      console.log(
        `Sale transactions: ${saleTransactions.length}`,
        saleTransactions
      );

      // Calculate available amount to sell
      const totalBought = d3.sum(buyTransactions, (d) => -d.amount); // Buy is negative, use negative sign to get positive value
      const totalSold = d3.sum(saleTransactions, (d) => d.amount); // Sale is already positive

      // Get the entity info to determine cash injection amount based on investment type
      // Ensure we find the correct entity by filtering on both ID and type
      const entity = investmentData.find((inv) => {
        // First check if IDs match
        const idMatches = Number(inv.id) === entityId;

        // Then check if the type matches based on investment name
        // Funds have "Fund" in their name, Lands have "Land" in their name
        const isCorrectType =
          investmentType === "fund"
            ? inv.name && inv.name.includes("Fund")
            : inv.name && inv.name.includes("Land");

        return idMatches && isCorrectType;
      });

      if (!entity) {
        console.error(
          `Could not find entity with ID ${entityId} and type ${investmentType}`
        );
        return false;
      }

      // Get cash injection amount based on entity type
      let cashInjection;
      if (investmentType === "fund") {
        // For funds, use cash_investment property
        cashInjection = parseFloat(entity.cash_investment || entity.val6);
      } else if (investmentType === "land") {
        // For lands, use cash_injection property
        cashInjection = parseFloat(entity.cash_injection || entity.val6);
      } else {
        console.error(`Invalid investment type: ${investmentType}`);
        return false;
      }

      if (isNaN(cashInjection) || cashInjection <= 0) {
        console.error(
          `Invalid cash injection amount for entity ID ${entityId}: ${cashInjection}`
        );
        // Check for mapped fields from fetchChartData
        if (entity.val6 && !isNaN(parseFloat(entity.val6))) {
          cashInjection = parseFloat(entity.val6);
          console.log(
            `Using val6 (${cashInjection}) as fallback for cash injection amount`
          );
        } else {
          return false;
        }
      }

      // Debug logging
      console.log("Sale Validation Summary:", {
        entityId,
        entityType,
        investmentType,
        entity: entity.name,
        cashInjection,
        entityTransactions: entityTransactions.length,
        buyTransactions: buyTransactions.length,
        saleTransactions: saleTransactions.length,
        totalBought,
        totalSold,
        availableToSell: cashInjection - totalSold,
        currentTransactionId,
      });

      // Add or update the error message element
      if (!document.getElementById("sale-validation-error")) {
        errorMsg.id = "sale-validation-error";
        errorMsg.style.color = "red";
        errorMsg.style.marginTop = "5px";
        errorMsg.style.fontSize = "12px";
        document
          .getElementById("transaction-amount")
          .parentNode.appendChild(errorMsg);
        console.log("Created new error message element");
      }

      // Get the investment name for better error messages
      const investmentName =
        document.getElementById("investment-name").selectedOptions[0]
          ?.textContent || "this investment";

      // Purchase is not mandatory to sell - remove check

      // Enable partial sales - remove block on already sold investments
      // Instead, uncomment the partial transaction logic to validate sale amounts

      // Set maximum sale amount to remaining balance
      const availableToSell = cashInjection - totalSold;
      amountInput.max = availableToSell;

      // Check current input value against available amount
      const currentAmount = parseFloat(amountInput.value) || 0;
      console.log(
        `Current amount: ${currentAmount}, Max allowed: ${availableToSell}`
      );

      if (currentAmount > availableToSell) {
        const errorText = `Warning: You can only sell up to $${availableToSell.toLocaleString()} of ${investmentName} (remaining balance of purchases).`;
        console.error(errorText);
        errorMsg.textContent = errorText;
        errorMsg.style.display = "block";
        submitButton.disabled = true;
        return false;
      }

      console.log("Sale validation passed");
      errorMsg.style.display = "none";
      submitButton.disabled = false;
      return true;
    } else {
      // For buy transactions, remove any validation messages
      if (document.getElementById("sale-validation-error")) {
        document.getElementById("sale-validation-error").style.display = "none";
      }

      // Reset max value constraint for buy transactions
      if (amountInput) {
        amountInput.removeAttribute("max");
      }

      // Enable submit button for buy transactions
      if (submitButton) {
        submitButton.disabled = false;
      }

      console.log("Buy transaction - validation not needed");
      return true;
    }
  }

  // Filter transactions based on selected date range and amount filter
  function filterTransactions(transactions) {
    if (!transactions || !Array.isArray(transactions)) {
      return [];
    }

    // Check if amount filter is enabled - use the checkbox if it exists,
    // otherwise use the amountFilterActive variable
    const filterCheckbox = document.getElementById("enable-amount-filter");
    const isFilterActive = filterCheckbox
      ? filterCheckbox.checked
      : amountFilterActive;

    // If filter is active, get current min/max values from inputs if available
    let filterMin = minAmount;
    let filterMax = maxAmount;

    if (isFilterActive) {
      const minInput = document.getElementById("min-amount");
      const maxInput = document.getElementById("max-amount");

      if (minInput) {
        filterMin = parseFloat(minInput.value) || 0;
      }

      if (maxInput && maxInput.value) {
        filterMax = parseFloat(maxInput.value);
      }
    }

    return transactions.filter((transaction) => {
      // Make sure transaction object is valid
      if (!transaction || !transaction.date) {
        return false;
      }

      // Date filter
      const dateInRange =
        transaction.date >= startDate && transaction.date <= endDate;

      // Amount filter (only apply if active)
      const amountInRange =
        !isFilterActive ||
        (Math.abs(transaction.amount) >= filterMin &&
          Math.abs(transaction.amount) <= filterMax);

      return dateInRange && amountInRange;
    });
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

  // Add event listeners for amount filter controls
  d3.select("#apply-amount-filter").on("click", updateAmountFilter);
  d3.select("#reset-amount-filter").on("click", resetAmountFilter);

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
    console.log(
      "Initializing transaction modal with investment data length:",
      investmentData.length
    );

    if (!investmentData.length) return;

    // Build options HTML
    let optionsHtml =
      '<option value="" disabled selected>Select a Transaction</option>';

    // Get fund and land items
    const fundItems = investmentData.filter(
      (item) => item.name && item.name.includes("Fund")
    );
    const landItems = investmentData.filter(
      (item) => item.name && item.name.includes("Land")
    );

    console.log(
      `Available investments: ${fundItems.length} funds, ${landItems.length} lands`
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
                    <label for="investment-name">Select Transaction</label>
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

    console.log("Transaction modal HTML created, attaching event listeners");

    // Add event listener for form submission
    document
      .getElementById("transaction-form")
      .addEventListener("submit", async function (e) {
        e.preventDefault();

        console.log("Transaction form submitted");

        // Get investment type from selected option FIRST
        const selectedOption =
          document.getElementById("investment-name").selectedOptions[0];
        if (!selectedOption || !selectedOption.dataset.type) {
          console.error("Selected option doesn't have a data-type attribute");
          alert(
            "Error: Invalid investment selection. Please select a valid investment."
          );
          return; // Prevent submission without proper type information
        }

        const entityType = selectedOption.dataset.type;
        const investmentType = entityType === "investment" ? "fund" : "land";

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
          // Add investmentType explicitly
          investmentType: investmentType,
          name: selectedOption.textContent,
        };

        console.log("Form data:", formData);

        // CENTRALIZED VALIDATION - All validation happens here at form submission time
        const transactionType = formData.transactionType;
        const entityId = formData.entity_id;

        // Validation for BUY transactions - ensure each entity can only be purchased once
        if (transactionType === "buy") {
          // Check if there are any existing buy transactions for this entity
          const existingBuyTransactions = transactionData.filter(
            (t) =>
              Number(t.entity_id) === entityId &&
              t.investmentType === investmentType &&
              t.transactionType === "buy" &&
              (!formData.id || Number(t.id) !== Number(formData.id)) // Exclude current transaction if editing
          );

          if (existingBuyTransactions.length > 0) {
            const errorMsg = `Error: This ${investmentType} has already been purchased. Each ${investmentType} can only be purchased once.`;
            console.error(errorMsg);
            alert(errorMsg);
            return; // Prevent submission
          }
        }

        // Validation for SALE transactions
        if (transactionType === "sale") {
          // 1. Get all transactions for this investment (excluding current if editing)
          const existingTransactions = transactionData.filter(
            (t) =>
              Number(t.entity_id) === entityId &&
              t.investmentType === investmentType &&
              (!formData.id || Number(t.id) !== Number(formData.id))
          );

          // 2. Check sale amount validations
          const saleAmount = formData.amount;

          // Get entity info
          const entity = investmentData.find((inv) => {
            // Match by ID and type to avoid confusion between funds and lands
            const idMatches = Number(inv.id) === entityId;
            const typeMatches =
              entityType === "investment"
                ? inv.name && inv.name.includes("Fund")
                : inv.name && inv.name.includes("Land");
            return idMatches && typeMatches;
          });

          if (!entity) {
            alert(
              `Error: Could not find ${investmentType} with ID ${entityId}.`
            );
            return; // Prevent submission
          }

          // Get cash injection value based on entity type
          const cashInjection =
            entityType === "investment"
              ? parseFloat(entity.cash_investment || entity.val6)
              : parseFloat(entity.cash_injection || entity.val6);

          if (isNaN(cashInjection) || cashInjection <= 0) {
            alert(
              `Error: Invalid cash injection amount for this ${investmentType}.`
            );
            return;
          }

          // Get existing sales
          const saleTransactions = existingTransactions.filter(
            (t) => t.transactionType === "sale" && t.date <= formData.date
          );

          // Calculate total sold
          const totalSold = d3.sum(saleTransactions, (d) => d.amount);

          // Do NOT block if entity has already been sold - allow partial sales

          // Check if amount exceeds cash injection
          if (saleAmount > cashInjection) {
            alert(
              `Error: You can't sell more than the cash injection amount of ${cashInjection}.`
            );
            return;
          }

          // For consistency with the saved cash value, calculate available amount
          const available = cashInjection - totalSold;

          // Check if amount exceeds available (cash injection minus already sold)
          if (saleAmount > available) {
            alert(
              `Error: You've already sold ${totalSold} of this investment. You can only sell up to ${available} more.`
            );
            return;
          }
        }

        // If we got here, validation passed
        console.log("All validation passed, proceeding with save");

        try {
          // Log transaction data before saving
          console.log("Saving transaction with data:", {
            id: formData.id,
            entity_id: formData.entity_id,
            investmentType: formData.investmentType,
            entity_type:
              formData.investmentType === "fund" ? "investment" : "land",
            transactionType: formData.transactionType,
            amount: formData.amount,
            date: formData.date,
          });

          // Save to IndexedDB via the investmentChart object
          if (formData.id) {
            console.log("Updating existing transaction ID:", formData.id);
            await window.investmentChart.updateTransaction(formData);
          } else {
            console.log("Adding new transaction");
            await window.investmentChart.addTransaction(formData);
          }

          // Close the modal
          investmentModal.style("display", "none");
        } catch (error) {
          console.error("Error saving transaction:", error);
          alert("Error saving transaction: " + error.message);
        }
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

    // Add event listeners for form fields to trigger validation
    console.log("Adding validation event listeners");

    // We need to be careful to check if elements exist before adding event listeners
    const typeSelect = document.getElementById("transaction-type");
    const investmentSelect = document.getElementById("investment-name");
    const amountInput = document.getElementById("transaction-amount");
    const dateInput = document.getElementById("transaction-date");

    if (typeSelect) {
      typeSelect.addEventListener("change", function () {
        console.log("Type changed to:", this.value);

        const amountInput = document.getElementById("transaction-amount");

        // If changed to "buy", prefill with cash injection value and make readonly
        if (this.value === "buy") {
          if (amountInput) {
            amountInput.setAttribute("readonly", true);
          }

          const investmentField = document.getElementById("investment-name");
          if (investmentField && investmentField.value) {
            // Trigger the change event on the investment field to prefill the amount
            const event = new Event("change");
            investmentField.dispatchEvent(event);
          }
        } else if (this.value === "sale") {
          // For sale, allow manual editing
          if (amountInput) {
            amountInput.removeAttribute("readonly");
          }
        }

        // No validation on change - only validate on form submission
      });
    } else {
      console.error("Transaction type select not found!");
    }

    if (investmentSelect) {
      investmentSelect.addEventListener("change", async function () {
        console.log("Investment changed to:", this.value);

        // Reset any previous validation errors when selection changes
        const errorElement = document.getElementById("sale-validation-error");
        if (errorElement) {
          errorElement.style.display = "none";
          errorElement.textContent = "";
        }

        // Re-enable submit button which might have been disabled by previous validation
        const submitButton = document.querySelector(
          "#transaction-form .btn-submit"
        );
        if (submitButton) {
          submitButton.disabled = false;
        }

        // Always set the full cash value for the selected investment
        if (this.value) {
          const entityId = parseInt(this.value);
          const entityType = this.selectedOptions[0].dataset.type;
          const amountInput = document.getElementById("transaction-amount");
          const transactionType =
            document.getElementById("transaction-type").value;

          // Store the current selection in a data attribute to help track changes
          this.setAttribute("data-last-selected", entityId);
          this.setAttribute("data-last-type", entityType);

          // Fetch the investment details from IndexedDB
          try {
            const store =
              entityType === "investment" ? STORES.investments : STORES.lands;
            const transaction = db.transaction(store, "readonly");
            const objectStore = transaction.objectStore(store);
            const request = objectStore.get(entityId);

            request.onsuccess = function (event) {
              const entity = event.target.result;

              if (entity) {
                // For investments, use cash_investment, for lands use cash_injection
                const cashValue =
                  entityType === "investment"
                    ? parseFloat(entity.cash_investment)
                    : parseFloat(entity.cash_injection);

                // Always set the exact cash value - no partial transactions
                if (amountInput && !isNaN(cashValue)) {
                  amountInput.value = cashValue;
                  console.log(
                    `Set amount to exact ${entityType} cash value: ${cashValue}`
                  );

                  // Store the cash value in a data attribute for validation
                  amountInput.setAttribute("data-cash-value", cashValue);
                }
              }
            };

            request.onerror = function (event) {
              console.error(
                "Error fetching entity details:",
                event.target.error
              );
            };
          } catch (error) {
            console.error("Error setting amount:", error);
          }
        }

        // No validation on change - only validate on form submission
      });
    } else {
      console.error("Investment select not found!");
    }

    if (amountInput) {
      // No validation on input change - only validate on form submission
    } else {
      console.error("Amount input not found!");
    }

    if (dateInput) {
      // No validation on date change - only validate on form submission
    } else {
      console.error("Date input not found!");
    }

    // Investment modal close button
    investmentModal.select(".close").on("click", function () {
      investmentModal.style("display", "none");
    });

    console.log("Transaction modal initialization complete");
  }

  // Function to update the modal's investment options
  function updateModalInvestmentOptions() {
    const select = document.getElementById("investment-name");
    if (!select) return;

    // Clear existing options
    select.innerHTML = "";

    // Add placeholder option
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Select a transaction";
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
        option.dataset.type = "investment"; // Ensure correct data-type is set
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
        option.dataset.type = "land"; // Ensure correct data-type is set
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

  // Function to validate that a sale transaction has previous buys only (no amount validation)
  function validateSaleExistenceOnly() {
    const typeSelect = document.getElementById("transaction-type");
    const investmentSelect = document.getElementById("investment-name");
    const dateInput = document.getElementById("transaction-date");

    // If we're not in a sale transaction, no validation needed
    if (!typeSelect || typeSelect.value !== "sale") {
      return true;
    }

    // If any required fields are empty, we can't validate yet
    if (
      !investmentSelect ||
      !investmentSelect.value ||
      !dateInput ||
      !dateInput.value
    ) {
      return false;
    }

    console.log("Validating sale transaction existence");

    // Get the selected investment id and the date of the transaction
    const entityId = Number(investmentSelect.value);
    const saleDate = new Date(dateInput.value);

    // Get investment type from selected option
    const selectedOption = investmentSelect.selectedOptions[0];
    if (!selectedOption || !selectedOption.dataset.type) {
      console.error("Selected option doesn't have a data-type attribute");
      return false;
    }

    const entityType = selectedOption.dataset.type;
    const investmentType = entityType === "investment" ? "fund" : "land";

    // Log entity information for debugging
    console.log(
      `Validating existence for entity ID=${entityId}, type=${entityType}, investmentType=${investmentType}`
    );

    // Find all transactions for this investment (with correct investment type)
    const existingTransactions = transactionData.filter(
      (t) =>
        Number(t.entity_id) === entityId && t.investmentType === investmentType
    );

    // Only count buy transactions that happened before or on the sale date
    const buyTransactions = existingTransactions.filter(
      (t) => t.transactionType === "buy" && t.date <= saleDate
    );

    // Calculate total amount bought
    const totalBought = d3.sum(buyTransactions, (d) => -d.amount);

    console.log("Sale validation details:", {
      entityId: entityId,
      entityType: entityType,
      investmentType: investmentType,
      buyTransactions: buyTransactions.length,
      totalBought,
    });

    // No need to check if purchases exist - purchase is no longer mandatory to sell

    // If we get here, the sale is valid
    return true;
  }

  // Add global sorting preference variable - default to date-based sorting
  let sortBarsByDate = true;

  // Function to update bar chart sorting
  function updateBarSorting(byDate) {
    sortBarsByDate = byDate;
    updateInvestmentVisualization();
  }

  // Function to calculate available sale amount for a given entity
  function getEntityAvailableSaleAmount(entityId, investmentType) {
    console.log(
      `Getting available amount for entityId=${entityId}, investmentType=${investmentType}`
    );

    // Find the entity to get the cash injection amount
    // Ensure we filter by both ID and the correct type to avoid confusion between funds and lands
    const entity = investmentData.find((inv) => {
      // First check if IDs match
      const idMatches = Number(inv.id) === Number(entityId);

      // Then check if the type matches based on investment name
      // Funds have "Fund" in their name, Lands have "Land" in their name
      const isCorrectType =
        investmentType === "fund"
          ? inv.name && inv.name.includes("Fund")
          : inv.name && inv.name.includes("Land");

      return idMatches && isCorrectType;
    });

    if (!entity) {
      console.error(
        `Could not find entity with ID ${entityId} and type ${investmentType}`
      );
      return {
        error: "Entity not found",
        available: 0,
        cashInjection: 0,
        sold: 0,
      };
    }

    console.log("Found entity:", entity);

    // Get the cash injection amount (different property name depending on type)
    let cashInjection;

    if (investmentType === "fund") {
      // For funds, use cash_investment property
      cashInjection = parseFloat(entity.cash_investment || entity.val6);
    } else if (investmentType === "land") {
      // For lands, use cash_injection property
      cashInjection = parseFloat(entity.cash_injection || entity.val6);
    } else {
      console.error(`Invalid investment type: ${investmentType}`);
      return {
        error: "Invalid investment type",
        available: 0,
        cashInjection: 0,
        sold: 0,
      };
    }

    console.log(`Cash injection amount determined: ${cashInjection}`);

    if (isNaN(cashInjection) || cashInjection <= 0) {
      console.error(
        `Invalid cash injection amount for entity ID ${entityId}: ${cashInjection}`
      );
      // Check for mapped fields from fetchChartData
      if (entity.val6 && !isNaN(parseFloat(entity.val6))) {
        cashInjection = parseFloat(entity.val6);
        console.log(
          `Using val6 (${cashInjection}) as fallback for cash injection amount`
        );
      } else {
        return {
          error: "Invalid cash injection amount",
          available: 0,
          cashInjection: 0,
          sold: 0,
        };
      }
    }

    // Get all sale transactions for this entity
    const entitySales = transactionData.filter(
      (t) =>
        Number(t.entity_id) === Number(entityId) &&
        t.investmentType === investmentType &&
        t.transactionType === "sale"
    );

    console.log(
      `Found ${entitySales.length} sale transactions for this entity`
    );

    // Calculate total sold so far
    const totalSold = d3.sum(entitySales, (d) => d.amount); // Sale amounts are positive

    // Calculate available amount to sell
    const availableToSell = cashInjection - totalSold;

    console.log(
      `Cash injection: ${cashInjection}, Total sold: ${totalSold}, Available: ${availableToSell}`
    );

    return {
      entity: entity,
      cashInjection: cashInjection,
      sold: totalSold,
      available: availableToSell,
    };
  }

  // Function that only validates that a sale transaction has previous buys
  function validateSaleExistence() {
    const typeSelect = document.getElementById("transaction-type");
    const investmentSelect = document.getElementById("investment-name");
    const dateInput = document.getElementById("transaction-date");
    const amountField = document.getElementById("transaction-amount");

    // If we're not in a sale transaction, no validation needed
    if (!typeSelect || typeSelect.value !== "sale") {
      return true;
    }

    // If any required fields are empty, we can't validate yet
    if (
      !investmentSelect ||
      !investmentSelect.value ||
      !dateInput ||
      !dateInput.value ||
      !amountField ||
      !amountField.value
    ) {
      return false;
    }

    console.log("Validating sale transaction amount");

    // Get the selected investment id, amount, and the date of the transaction
    const entityId = Number(investmentSelect.value);
    const saleDate = new Date(dateInput.value);
    const saleAmount = parseFloat(amountField.value);

    // Get investment type from selected option
    const selectedOption = investmentSelect.selectedOptions[0];
    if (!selectedOption || !selectedOption.dataset.type) {
      console.error("Selected option doesn't have a data-type attribute");
      return false;
    }

    const entityType = selectedOption.dataset.type;
    const investmentType = entityType === "investment" ? "fund" : "land";

    // Check if there was a change in selection
    const lastSelected = investmentSelect.getAttribute("data-last-selected");
    const lastType = investmentSelect.getAttribute("data-last-type");
    const selectionChanged =
      lastSelected &&
      (Number(lastSelected) !== entityId || lastType !== entityType);

    if (selectionChanged) {
      console.log(
        `Selection changed from ID=${lastSelected} (${lastType}) to ID=${entityId} (${entityType})`
      );
    }

    // Get entity info and available amount to sell
    const entityInfo = getEntityAvailableSaleAmount(entityId, investmentType);

    if (entityInfo.error) {
      alert(`${entityInfo.error} for ${investmentType} with ID ${entityId}`);
      return false;
    }

    // If we have a saved cash value in the amount field, use it for validation
    // This helps prevent stale comparisons when changing selections
    const savedCashValue = amountField.getAttribute("data-cash-value");
    let cashInjection = entityInfo.cashInjection;

    if (savedCashValue && !isNaN(parseFloat(savedCashValue))) {
      // Use the saved cash value from the amount field's data attribute
      // This is especially important when the selection has changed
      cashInjection = parseFloat(savedCashValue);
      console.log(`Using saved cash value for validation: ${cashInjection}`);
    }

    console.log("Sale validation details:", {
      entityId: entityId,
      investmentType: investmentType,
      cashInjection: cashInjection,
      savedCashValue: savedCashValue,
      entityInfoCashInjection: entityInfo.cashInjection,
      totalSold: entityInfo.sold,
      available: entityInfo.available,
      saleAmount: saleAmount,
    });

    // Check if amount exceeds cash injection
    if (saleAmount > cashInjection) {
      alert(
        `Error: You can't sell more than the cash injection amount of ${cashInjection}.`
      );
      return false;
    }

    // For consistency with the saved cash value, calculate available amount
    const available = cashInjection - entityInfo.sold;

    // Check if amount exceeds available (cash injection minus already sold)
    if (saleAmount > available) {
      alert(
        `Error: You've already sold ${entityInfo.sold} of this investment. You can only sell up to ${available} more.`
      );
      return false;
    }

    // If we get here, the sale is valid
    return true;
  }

  // Update the form submission handler around line 2680
  // Function to highlight the bar segment corresponding to a dragged transaction
  function highlightBarSegmentForTransaction(transaction) {
    // Find all bar segments
    const barSegments = d3.selectAll(".buy-bar-segment, .sale-bar-segment");

    // Exit if no segments found
    if (barSegments.empty()) return;

    // Convert transaction date to string format for comparison
    const transactionDateStr = transaction.date.toISOString();
    const transactionId = transaction.id;

    // Find the corresponding bar segment using data attributes
    barSegments.each(function () {
      const segment = d3.select(this);

      // Get segment data from attributes
      const entityName = segment.attr("data-entity-name");
      const transactionType = segment.attr("data-transaction-type");
      const segmentDate = segment.attr("data-date");
      const transactionIds = segment.attr("data-transaction-ids");

      // Skip if no data attributes found
      if (!entityName || !transactionType || !segmentDate) return;

      // Check if this is the matching segment
      const matchesName = entityName === transaction.entityName;
      const matchesType = transaction.transactionType === transactionType;

      // Match either by direct date comparison or by ID inclusion in the segment
      const matchesDate = segmentDate === transactionDateStr;
      const matchesId =
        transactionId &&
        transactionIds &&
        transactionIds.split(",").includes(String(transactionId));

      // If we have a match
      if (matchesName && matchesType && (matchesDate || matchesId)) {
        // Store original color
        const originalFill = segment.attr("fill");
        const originalOpacity = segment.attr("opacity");

        // Highlight with pulsing animation
        segment
          .transition()
          .duration(300)
          .attr("fill", "#FFD700") // Gold
          .attr("opacity", 1)
          .attr("stroke", "#FF5722") // Accent color
          .attr("stroke-width", 2)
          .transition()
          .duration(300)
          .attr("fill", originalFill)
          .attr("opacity", originalOpacity)
          .attr("stroke", "#fff")
          .attr("stroke-width", 0.5)
          .transition()
          .duration(300)
          .attr("fill", "#FFD700")
          .attr("opacity", 1)
          .attr("stroke", "#FF5722")
          .attr("stroke-width", 2)
          .transition()
          .duration(300)
          .attr("fill", originalFill)
          .attr("opacity", originalOpacity)
          .attr("stroke", "#fff")
          .attr("stroke-width", 0.5);
      }
    });
  }

  // Function to delete a transaction directly without opening a modal
  async function deleteTransaction(transactionId) {
    try {
      // Confirm deletion with the user
      if (!confirm("Are you sure you want to delete this transaction?")) {
        return false;
      }

      // Delete the transaction from the database
      await deleteData(STORES.transactions, Number(transactionId));

      // Refresh the chart data and redraw
      await fetchChartData();
      drawInvestmentChart();

      return true;
    } catch (error) {
      console.error("Error deleting transaction:", error);
      alert("Failed to delete transaction: " + error.message);
      return false;
    }
  }

  // Function to update the opening balance
  function updateOpeningBalance() {
    const openingBalanceInput = document.getElementById("opening-balance");
    const newBalance = parseFloat(openingBalanceInput.value);
    
    if (!isNaN(newBalance)) {
      openingBalance = newBalance;
      // Update the chart with the new opening balance
      updateInvestmentVisualization();
    } else {
      alert("Please enter a valid number for opening balance");
    }
  }
  
  // Add event listener for opening balance apply button
  d3.select("#apply-opening-balance").on("click", updateOpeningBalance);
  
  // Handle keypress event on the opening balance input
  d3.select("#opening-balance").on("keypress", function (event) {
    if (event.key === "Enter") {
      updateOpeningBalance();
      event.preventDefault();
    }
  });

  // Initialize the chart when the investment timeline tab is shown on page load
  if (
    document.querySelector(".tab-button[data-tab='investment-timeline']")
      .classList.contains("active")
  ) {
    initInvestmentChart();
  }
});
