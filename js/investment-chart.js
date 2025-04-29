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
        // Refresh the page after seeding data to properly display it
        console.log("Sample data added, refreshing page to display seeded data...");
        window.location.reload();
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
        amount: "60000", // Full cash_investment from Tech Growth Fund
        transaction_date: new Date(currentYear, 0, 15),
        notes: "Full investment",
      },
      {
        id: 2,
        entity_id: 2,
        entity_type: "investment",
        transaction_type: "buy",
        amount: "52500", // Full cash_investment from Renewable Energy Fund
        transaction_date: new Date(currentYear, 3, 10),
        notes: "Full investment",
      },
     
      {
        id: 3,
        entity_id: 1,
        entity_type: "investment",
        transaction_type: "sale",
        amount: "60000", // Full sale of Tech Growth Fund
        transaction_date: new Date(currentYear, 7, 12),
        notes: "Full exit",
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
        investmentType: tx.entity_type === "investment" ? "fund" : "land"
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
    "fund-sale": "💹",
    "land-buy": "🏞️",
    "land-sale": "🏙️",
  };

  // Initialize date inputs with current year dates
  d3.select("#start-date").property("value", inputDateFormat(startDate));
  d3.select("#end-date").property("value", inputDateFormat(endDate));

  // Add date preset buttons
  const dateRangeControl = d3.select(".date-range-control");

  // Create date presets container using safer DOM manipulation
  let datePresets;
  try {
    // Instead of using insert, append the element and move it to the first position
    datePresets = dateRangeControl
      .append("div")
      .attr("class", "date-presets");
    
    // If the parent element has children, move our element to the first position
    const parent = dateRangeControl.node();
    if (parent && parent.firstChild && datePresets.node()) {
      parent.insertBefore(datePresets.node(), parent.firstChild);
    }
  } catch (e) {
    console.error("Error creating date presets:", e);
    // Fallback - just append if insertion fails
    datePresets = dateRangeControl
      .append("div")
      .attr("class", "date-presets");
  }

  // Only proceed if datePresets was successfully created
  if (datePresets) {
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
          relatedEntity = mappedInvestments.find((inv) => inv.id === tx.entity_id);
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
      if (typeof updateModalInvestmentOptions === 'function') {
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
      if (typeof updateModalInvestmentOptions === 'function') {
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
            transactionDateParse(transaction.date) || new Date(transaction.date);
        }

        // Validate if this is a sale transaction - only check if buys exist
        if (transaction.transactionType === "sale") {
          // Get the entity ID and type
          const entityId = Number(transaction.entity_id);
          const entityType = transaction.investmentType === "fund" ? "investment" : "land";
          
          console.log(`Validating sale transaction for entity ID ${entityId}, type: ${entityType}`);
          
          // Filter all transactions for this specific entity (excluding this one being updated)
          // IMPORTANT: Check both entity_id AND entity_type to prevent mix-ups between funds and lands
          const entityTransactions = transactionData.filter(
            t => Number(t.entity_id) === entityId && 
                 t.investmentType === transaction.investmentType &&
                 Number(t.id) !== Number(transaction.id)
          );
          
          console.log(`Found ${entityTransactions.length} existing transactions for this entity`);
          
          // Get buy transactions before this sale date
          const buyTransactions = entityTransactions.filter(
            t => t.transactionType === "buy" && t.date <= transaction.date
          );
          
          console.log(`Buy transactions: ${buyTransactions.length}`);
          
          // Calculate total amount bought
          const totalBought = d3.sum(buyTransactions, d => Math.abs(d.amount));
          
          console.log(`Total bought: ${totalBought}`);
          
          // Find entity name for better error messages
          const entity = investmentData.find(inv => Number(inv.id) === entityId);
          const entityName = entity ? entity.name : "this investment";
          
          // Check if any purchases have been made for this specific entity
          if (totalBought <= 0) {
            const errorMsg = `Error: You must purchase ${entityName} before selling it.`;
            console.error(errorMsg);
            alert(errorMsg);
            return this;
          }
          
          console.log("Sale transaction validation passed");
        }

        // Format transaction for IndexedDB
        const dbTransaction = {
          entity_id: transaction.entity_id,
          // Always ensure entity_type is correctly set based on investmentType
          entity_type: transaction.investmentType === "fund" ? "investment" : "land",
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
      } catch (error) {
        console.error("Error adding transaction:", error);
        alert("Error adding transaction: " + error.message);
      }
      return this; // For chaining
    },
    
    // Function to update a transaction
    updateTransaction: async function(transaction) {
      try {
        console.log("Updating transaction:", transaction);
        
        // Process date if it's a string
        if (typeof transaction.date === "string") {
          transaction.date = 
            transactionDateParse(transaction.date) || new Date(transaction.date);
        }
        
        // Validate if this is a sale transaction - only check if buys exist
        if (transaction.transactionType === "sale") {
          // Get the entity ID and type
          const entityId = Number(transaction.entity_id);
          const entityType = transaction.investmentType === "fund" ? "investment" : "land";
          
          console.log(`Validating sale update for entity ID ${entityId}, type: ${entityType}`);
          
          // Filter all transactions for this specific entity (excluding this one being updated)
          const entityTransactions = transactionData.filter(
            t => Number(t.entity_id) === entityId && 
                 t.investmentType === transaction.investmentType &&
                 Number(t.id) !== Number(transaction.id)
          );
          
          // Get buy transactions before this sale date
          const buyTransactions = entityTransactions.filter(
            t => t.transactionType === "buy" && t.date <= transaction.date
          );
          
          // Calculate total amount bought
          const totalBought = d3.sum(buyTransactions, d => Math.abs(d.amount));
          
          // Find entity name for better error messages
          const entity = investmentData.find(inv => Number(inv.id) === entityId);
          const entityName = entity ? entity.name : "this investment";
          
          // Check if any purchases have been made for this specific entity
          if (totalBought <= 0) {
            const errorMsg = `Error: You must purchase ${entityName} before selling it.`;
            console.error(errorMsg);
            alert(errorMsg);
            return this;
          }
        }
        
        // Format transaction for IndexedDB
        const dbTransaction = {
          id: transaction.id,
          entity_id: transaction.entity_id,
          // Always ensure entity_type is correctly set based on investmentType
          entity_type: transaction.investmentType === "fund" ? "investment" : "land",
          transaction_type: transaction.transactionType,
          amount: transaction.amount.toString(),
          transaction_date: transaction.date,
          notes: transaction.notes || "",
        };
        
        // Update in database
        await updateData(STORES.transactions, dbTransaction);
        
        // Update in local array
        const index = transactionData.findIndex(t => Number(t.id) === Number(transaction.id));
        if (index !== -1) {
          transactionData[index] = {...transaction};
        } else {
          // If not found, just add it
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
    removeTransaction: async function(transaction) {
      try {
        console.log("Removing transaction:", transaction);
        
        if (!transaction.id) {
          console.error("Cannot remove transaction without ID");
          return this;
        }
        
        // Delete from database
        await deleteData(STORES.transactions, transaction.id);
        
        // Remove from local array
        transactionData = transactionData.filter(t => Number(t.id) !== Number(transaction.id));
        
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
        .style("border", "1px solid #ddd");
      
      // Move it after the date range control if possible
      const dateRangeEl = document.querySelector(dateRangeSelector);
      if (dateRangeEl && dateRangeEl.nextSibling && filterControls.node()) {
        dateRangeEl.parentNode.insertBefore(filterControls.node(), dateRangeEl.nextSibling);
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
      filterControls.append("h4")
        .text("Filter by Transaction Amount:")
        .style("margin-top", "0");

      // Create amount filter row
      const amountFilterRow = filterControls.append("div")
        .style("display", "flex")
        .style("align-items", "center")
        .style("gap", "10px")
        .style("margin-bottom", "10px");

      // Add checkbox to enable/disable filter
      amountFilterRow.append("input")
        .attr("type", "checkbox")
        .attr("id", "enable-amount-filter")
        .style("margin", "0");

      amountFilterRow.append("label")
        .attr("for", "enable-amount-filter")
        .text("Enable Amount Filter")
        .style("margin", "0");

      // Create amount inputs row
      const amountInputsRow = filterControls.append("div")
        .style("display", "flex")
        .style("gap", "10px")
        .style("margin-bottom", "10px");

      // Add min amount input
      amountInputsRow.append("div")
        .style("flex", "1")
        .html(`
          <label for="min-amount">Min Amount ($)</label>
          <input type="number" id="min-amount" min="0" value="0" class="form-control" style="width: 100%">
        `);

      // Add max amount input
      amountInputsRow.append("div")
        .style("flex", "1")
        .html(`
          <label for="max-amount">Max Amount ($)</label>
          <input type="number" id="max-amount" min="0" value="" placeholder="No maximum" class="form-control" style="width: 100%">
        `);

      // Add apply button
      filterControls.append("button")
        .attr("id", "apply-amount-filter")
        .attr("class", "btn btn-primary")
        .text("Apply Amount Filter")
        .style("margin-right", "10px");

      // Add reset button
      filterControls.append("button")
        .attr("id", "reset-amount-filter")
        .attr("class", "btn btn-secondary")
        .text("Reset");
        
      // Add event listeners for amount filter controls
      d3.select("#apply-amount-filter").on("click", updateAmountFilter);
      d3.select("#reset-amount-filter").on("click", resetAmountFilter);
    }
  }

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
    amountFilterActive = document.getElementById("enable-amount-filter").checked;
    minAmount = parseFloat(document.getElementById("min-amount").value) || 0;
    
    const maxInput = document.getElementById("max-amount");
    maxAmount = maxInput && maxInput.value ? parseFloat(maxInput.value) : Infinity;
    
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
    
    // Add divider line explanation to legend
    const dividerLegendItem = topLegend.append("div")
      .attr("class", "legend-item")
      .style("margin-top", "8px");
      
    // Create a small line to demonstrate the divider
    dividerLegendItem
      .append("div")
      .attr("class", "color-box")
      .html(`<div style="width: 100%; height: 2px; background: white; border-top: 1px dashed #666; margin-top: 8px;"></div>`)
      .style("background", "transparent");
      
    dividerLegendItem
      .append("span")
      .html(`<small>Dashed lines separate transactions on different dates</small>`);

    // Filter transactions based on selected date range AND amount filter
    const visibleTransactions = filterTransactions(transactionData);

    // Create filter status message
    const filterCheckbox = document.getElementById("enable-amount-filter");
    const isFilterActive = filterCheckbox ? filterCheckbox.checked : amountFilterActive;
    
    if (isFilterActive) {
      const filterMin = document.getElementById("min-amount") ? 
        parseFloat(document.getElementById("min-amount").value) || 0 : minAmount;
      
      const maxInput = document.getElementById("max-amount");
      const filterMax = (maxInput && maxInput.value) ? 
        parseFloat(maxInput.value) : maxAmount;
      
      const filterMsg = investmentChart
        .append("div")
        .attr("class", "filter-status")
        .style("margin-bottom", "10px")
        .style("padding", "5px 10px")
        .style("background", "#e8f5e9")
        .style("border-left", "4px solid #4CAF50")
        .style("border-radius", "2px");
      
      filterMsg.append("strong")
        .text("Amount filter active: ");
      
      const maxDisplay = filterMax === Infinity ? "No maximum" : `$${filterMax.toLocaleString()}`;
      filterMsg.append("span")
        .text(`$${filterMin.toLocaleString()} to ${maxDisplay}`);
      
      filterMsg.append("span")
        .text(` (Showing ${visibleTransactions.length} transactions)`);
    }
    
    // Add sorting control above the chart
    const sortingControl = investmentChart
      .append("div")
      .attr("class", "sorting-control")
      .style("margin-bottom", "20px")
      .style("display", "flex")
      .style("justify-content", "flex-end")
      .style("align-items", "center");
      
    sortingControl.append("span")
      .text("Sort by: ")
      .style("margin-right", "10px")
      .style("font-size", "14px");
      
    // Create radio button for date sorting
    const dateSortLabel = sortingControl.append("label")
      .style("margin-right", "15px")
      .style("display", "inline-flex")
      .style("align-items", "center")
      .style("cursor", "pointer");
      
    dateSortLabel.append("input")
      .attr("type", "radio")
      .attr("name", "chart-sort")
      .attr("value", "date")
      .property("checked", sortBarsByDate)
      .style("margin-right", "5px")
      .on("change", function() {
        if (this.checked) {
          updateBarSorting(true);
        }
      });
      
    dateSortLabel.append("span")
      .text("Date (Oldest First)")
      .style("font-size", "14px");
      
    // Create radio button for amount sorting
    const amountSortLabel = sortingControl.append("label")
      .style("display", "inline-flex")
      .style("align-items", "center")
      .style("cursor", "pointer");
      
    amountSortLabel.append("input")
      .attr("type", "radio")
      .attr("name", "chart-sort")
      .attr("value", "amount")
      .property("checked", !sortBarsByDate)
      .style("margin-right", "5px")
      .on("change", function() {
        if (this.checked) {
          updateBarSorting(false);
        }
      });
      
    amountSortLabel.append("span")
      .text("Amount (Highest First)")
      .style("font-size", "14px");
    
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
      .ticks(10) // Use fixed number of ticks instead of month-based ticks
      .tickFormat(d3.timeFormat("%b %d")) // Show date with month
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
            if (group.transactions.length > 0) {
              // Ensure we're working with a transaction that has a numeric ID
              const transactionCopy = { ...transaction };
              if (transactionCopy.id) {
                transactionCopy.id = Number(transactionCopy.id);
              }
              showTransactionModal(transaction.date, transactionCopy);
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
      const transactionsByEntity = d3.groups(visibleTransactions, d => d.name);
      
      // Calculate total buy and sale amounts for each entity
      const entityData = transactionsByEntity.map(group => {
        const name = group[0];
        const transactions = group[1];
        
        // Get investment type (fund or land)
        const investmentType = transactions[0].investmentType;
        
        // Calculate buy and sale totals
        const buyTotal = d3.sum(
          transactions.filter(t => t.transactionType === "buy"),
          d => Math.abs(d.amount)
        );
        
        const saleTotal = d3.sum(
          transactions.filter(t => t.transactionType === "sale"),
          d => Math.abs(d.amount)
        );
        
        // Find earliest transaction date for sorting
        const dates = transactions.map(t => new Date(t.date));
        const earliestDate = new Date(Math.min(...dates.map(d => d.getTime())));
        
        return {
          name,
          investmentType,
          buyTotal,
          saleTotal,
          total: buyTotal + saleTotal,
          earliestDate,
          transactions
        };
      });
      
      // Sort based on user preference - either by date or by amount
      if (sortBarsByDate) {
        // Sort by earliest transaction date (chronological order)
        entityData.sort((a, b) => a.earliestDate - b.earliestDate);
      } else {
        // Sort by total amount descending
        entityData.sort((a, b) => b.total - a.total);
      }

      // Create x scale based on entity names
      const x = d3
        .scaleBand()
        .domain(entityData.map(d => d.name))
        .range([0, width])
        .padding(0.3);

      // Get max value for y axis
      const maxValue = d3.max(entityData, d => d.total);

      const y = d3
        .scaleLinear()
        .domain([0, maxValue * 1.1]) // Add 10% padding
        .range([height, 0]);

      // Replace with time axis for x-axis
      // Create a time-based x scale instead of entity names
      const xTime = d3
        .scaleTime()
        .domain([startDate, endDate])
        .range([0, width]);

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
      barChartSvg.append("g").call(d3.axisLeft(y).tickFormat(d => `$${d}`));
        
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
      
      // Continue using the original x scale for the bars
      entityData.forEach(entity => {
        const barGroup = barChartSvg
          .append("g")
          .attr("class", "investment-entity-group");
        
        // Base position for the bar
        const barX = x(entity.name);
        const barWidth = x.bandwidth();
        
        // First draw the buy amount (bottom part of stack)
        if (entity.buyTotal > 0) {
          const buyHeight = height - y(entity.buyTotal);
          const buyY = height - buyHeight;
          
          // Group buy transactions by date
          const buyTransactionsByDate = d3.groups(
            entity.transactions.filter(t => t.transactionType === "buy"),
            d => d.date.toDateString()
          );
          
          let currentBuyHeight = 0;
          
          // Draw a segment for each date's transactions
          buyTransactionsByDate.forEach((dateGroup, i) => {
            const transactions = dateGroup[1];
            const dateTotal = d3.sum(transactions, d => Math.abs(d.amount));
            const segmentHeight = (dateTotal / entity.buyTotal) * buyHeight;
            
            barGroup
              .append("rect")
              .attr("class", "buy-bar-segment")
              .attr("x", barX)
              .attr("y", height - currentBuyHeight - segmentHeight)
              .attr("width", barWidth)
              .attr("height", segmentHeight)
              .attr("fill", entity.investmentType === "fund" ? "#4CAF50" : "#2196F3") // Green for fund buys, blue for land buys
              .attr("opacity", 0.8)
              .attr("stroke", "#fff")
              .attr("stroke-width", 0.5)
              .on("mouseenter", function(event) {
                // Show tooltip
                tooltip.transition().duration(200).style("opacity", 0.9);
                
                // Format transactions for display
                const transactionsList = transactions
                  .map(t => `${dateFormat(t.date)}: $${Math.abs(t.amount).toLocaleString()}`)
                  .join("<br>");
                
                tooltip
                  .html(`
                    <strong>${entity.name}</strong><br>
                    <strong>Purchases on ${dateFormat(transactions[0].date)}</strong><br>
                    <strong>Total: $${dateTotal.toLocaleString()}</strong><br>
                    <hr style="margin: 5px 0; opacity: 0.3">
                    ${transactionsList}
                  `)
                  .style("left", event.pageX + 10 + "px")
                  .style("top", event.pageY - 28 + "px");
              })
              .on("mouseleave", function() {
                tooltip.transition().duration(500).style("opacity", 0);
              })
              .on("click", function() {
                if (transactions.length > 0) {
                  showTransactionModal(new Date(), transactions[0]);
                }
              });
              
            // Add divider line between date segments (except after the last one)
            if (i < buyTransactionsByDate.length - 1) {
              barGroup
                .append("line")
                .attr("x1", barX)
                .attr("x2", barX + barWidth)
                .attr("y1", height - currentBuyHeight - segmentHeight)
                .attr("y2", height - currentBuyHeight - segmentHeight)
                .attr("stroke", "#ffffff")
                .attr("stroke-width", 1)
                .attr("stroke-dasharray", "2,1");
            }
            
            currentBuyHeight += segmentHeight;
          });
        }
        
        // Then draw the sale amount (top part of stack)
        if (entity.saleTotal > 0) {
          // Position the sale bar on top of the buy bar
          const buyHeight = entity.buyTotal > 0 ? (height - y(entity.buyTotal)) : 0;
          const saleStart = height - buyHeight;
          const saleHeight = height - y(entity.saleTotal);
          
          // Group sale transactions by date
          const saleTransactionsByDate = d3.groups(
            entity.transactions.filter(t => t.transactionType === "sale"),
            d => d.date.toDateString()
          );
          
          let currentSaleHeight = 0;
          
          // Draw a segment for each date's transactions
          saleTransactionsByDate.forEach((dateGroup, i) => {
            const transactions = dateGroup[1];
            const dateTotal = d3.sum(transactions, d => Math.abs(d.amount));
            const segmentHeight = (dateTotal / entity.saleTotal) * saleHeight;
            
            barGroup
              .append("rect")
              .attr("class", "sale-bar-segment")
              .attr("x", barX)
              .attr("y", saleStart - currentSaleHeight - segmentHeight)
              .attr("width", barWidth)
              .attr("height", segmentHeight)
              .attr("fill", entity.investmentType === "fund" ? "#F44336" : "#FF9800") // Red for fund sales, orange for land sales
              .attr("opacity", 0.8)
              .attr("stroke", "#fff")
              .attr("stroke-width", 0.5)
              .on("mouseenter", function(event) {
                // Show tooltip
                tooltip.transition().duration(200).style("opacity", 0.9);
                
                // Format transactions for display
                const transactionsList = transactions
                  .map(t => `${dateFormat(t.date)}: $${Math.abs(t.amount).toLocaleString()}`)
                  .join("<br>");
                
                tooltip
                  .html(`
                    <strong>${entity.name}</strong><br>
                    <strong>Sales on ${dateFormat(transactions[0].date)}</strong><br>
                    <strong>Total: $${dateTotal.toLocaleString()}</strong><br>
                    <hr style="margin: 5px 0; opacity: 0.3">
                    ${transactionsList}
                  `)
                  .style("left", event.pageX + 10 + "px")
                  .style("top", event.pageY - 28 + "px");
              })
              .on("mouseleave", function() {
                tooltip.transition().duration(500).style("opacity", 0);
              })
              .on("click", function() {
                if (transactions.length > 0) {
                  showTransactionModal(new Date(), transactions[0]);
                }
              });
              
            // Add divider line between date segments (except after the last one)
            if (i < saleTransactionsByDate.length - 1) {
              barGroup
                .append("line")
                .attr("x1", barX)
                .attr("x2", barX + barWidth)
                .attr("y1", saleStart - currentSaleHeight - segmentHeight)
                .attr("y2", saleStart - currentSaleHeight - segmentHeight)
                .attr("stroke", "#ffffff")
                .attr("stroke-width", 1)
                .attr("stroke-dasharray", "2,1");
            }
            
            currentSaleHeight += segmentHeight;
          });
        }
        
        // Add total amount label at the top of the stack
        const totalLabelY = Math.min(
          y(entity.buyTotal + entity.saleTotal) - 10,
          height - 10
        );
        
        barGroup
          .append("text")
          .attr("class", "total-label")
          .attr("x", barX + barWidth / 2)
          .attr("y", totalLabelY)
          .attr("text-anchor", "middle")
          .attr("fill", "#000")
          .attr("font-size", "10px")
          .attr("font-weight", "bold")
          .text(`$${entity.total.toLocaleString()}`);
      });


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

  // Function to show transaction modal for a specific date
  function showTransactionModal(date, transaction = null) {
    console.log("Showing transaction modal for date:", date);
    
    // Format date for the input
    const formattedDate = date.toISOString().split("T")[0];
    
    // Make sure the modal is initialized
    if (!document.getElementById("transaction-form")) {
      if (typeof initTransactionModal === 'function') {
        initTransactionModal();
      } else {
        console.error("Transaction modal initialization function not found!");
        return;
      }
    }
    
    // Set modal title based on whether we're adding or editing
    const modalTitle = document.getElementById("transaction-modal-title");
    if (modalTitle) {
      modalTitle.textContent = transaction 
        ? "Edit Investment Transaction" 
        : "Add Investment Transaction";
    }
    
    // Add or remove a class on the modal based on whether we're editing
    if (transaction) {
      investmentModal.classed("editing-transaction", true);
    } else {
      investmentModal.classed("editing-transaction", false);
    }
    
    // Reset form
    const form = document.getElementById("transaction-form");
    if (form) form.reset();
    
    // Set the transaction ID field (hidden)
    const idField = document.getElementById("transaction-id");
    if (idField) idField.value = transaction ? transaction.id : "";
    
    // Set the date field
    const dateField = document.getElementById("transaction-date");
    if (dateField) dateField.value = formattedDate;
    
    // If editing a transaction, populate the fields
    if (transaction) {
      // Set investment selector
      const investmentField = document.getElementById("investment-name");
      if (investmentField) {
        // Find option with matching entity_id and set it as selected
        for (let i = 0; i < investmentField.options.length; i++) {
          if (investmentField.options[i].value == transaction.entity_id) {
            investmentField.selectedIndex = i;
            break;
          }
        }
      }
      
      // Set transaction type
      const typeField = document.getElementById("transaction-type");
      if (typeField) {
        // Find the option that matches the transaction type and select it
        for (let i = 0; i < typeField.options.length; i++) {
          if (typeField.options[i].value === transaction.transactionType) {
            typeField.selectedIndex = i;
            break;
          }
        }
      }
      
      // Set amount and notes
      const amountField = document.getElementById("transaction-amount");
      if (amountField) {
        amountField.value = Math.abs(transaction.amount);
        
        // Make readonly only if transaction type is 'buy'
        const typeField = document.getElementById("transaction-type");
        if (typeField && typeField.value === 'buy') {
          amountField.setAttribute("readonly", true);
        } else {
          amountField.removeAttribute("readonly");
        }
      }
      
      const notesField = document.getElementById("transaction-notes");
      if (notesField) notesField.value = transaction.notes || "";
      
      // Show delete button
      const deleteBtn = document.querySelector(".btn-delete");
      if (deleteBtn) deleteBtn.style.display = "inline-block";
    } else {
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
          if (!investmentField.value || investmentField.options[investmentField.selectedIndex].disabled) {
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
            const event = new Event('change');
            investmentField.dispatchEvent(event);
          }
        }
      }, 100); // Small delay to ensure the modal is fully initialized
    }
    
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
    const submitButton = document.querySelector("#transaction-form .btn-submit");
    const errorMsg = document.getElementById("sale-validation-error") || 
                    document.createElement("div");
    
    console.log(`Transaction type: ${transactionType}, Investment ID: ${investmentId}, Transaction ID: ${transactionId}`);
    
    // Only validate if this is a sale transaction
    if (transactionType === "sale" && investmentId) {
      // Get all transactions for this investment
      const entityId = Number(investmentId);
      const currentTransactionId = transactionId ? Number(transactionId) : null;
      
      // Get the investment type (fund or land)
      const selectedOption = document.getElementById("investment-name").selectedOptions[0];
      const entityType = selectedOption.dataset.type; // "investment" or "land"
      const investmentType = entityType === "investment" ? "fund" : "land";
      
      console.log(`Validating sale for entity ID ${entityId}, type: ${investmentType}, current transaction ID: ${currentTransactionId}`);
      
      // Filter transactions for this specific entity (excluding this one being updated)
      // IMPORTANT: Check both entity_id AND entity_type to prevent mix-ups between funds and lands
      const entityTransactions = transactionData.filter(
        t => Number(t.entity_id) === entityId && 
             t.investmentType === investmentType &&
             (!currentTransactionId || Number(t.id) !== currentTransactionId)
      );
      
      console.log(`Found ${entityTransactions.length} related transactions (excluding current)`, entityTransactions);
      
      // Calculate total buy amount up to current date
      const dateInput = document.getElementById("transaction-date");
      const transactionDate = dateInput.value ? new Date(dateInput.value) : new Date();
      
      console.log(`Transaction date: ${transactionDate.toISOString()}`);
      
      // Get buy transactions that happened before this sale date
      const buyTransactions = entityTransactions.filter(
        t => t.transactionType === "buy" && t.date <= transactionDate
      );
      
      // Get sale transactions that happened before this sale date
      const saleTransactions = entityTransactions.filter(
        t => t.transactionType === "sale" && t.date <= transactionDate
      );
      
      console.log(`Buy transactions: ${buyTransactions.length}`, buyTransactions);
      console.log(`Sale transactions: ${saleTransactions.length}`, saleTransactions);
      
      // Calculate available amount to sell
      const totalBought = d3.sum(buyTransactions, d => Math.abs(d.amount));
      const totalSold = d3.sum(saleTransactions, d => Math.abs(d.amount));
      // const availableToSell = totalBought - totalSold;
      
      // console.log(`Total bought: ${totalBought}, Total sold: ${totalSold}, Available to sell: ${availableToSell}`);
      
      // Debug logging
      console.log('Sale Validation Summary:', {
        entityId,
        entityType,
        investmentType,
        entityTransactions: entityTransactions.length,
        buyTransactions: buyTransactions.length,
        saleTransactions: saleTransactions.length,
        totalBought,
        totalSold,
        // availableToSell,
        currentTransactionId
      });
      
      // Add or update the error message element
      if (!document.getElementById("sale-validation-error")) {
        errorMsg.id = "sale-validation-error";
        errorMsg.style.color = "red";
        errorMsg.style.marginTop = "5px";
        errorMsg.style.fontSize = "12px";
        document.getElementById("transaction-amount").parentNode.appendChild(errorMsg);
        console.log("Created new error message element");
      }
      
      // Get the investment name for better error messages
      const investmentName = document.getElementById("investment-name").selectedOptions[0]?.textContent || "this investment";
      
      // Check if any purchases have been made for this specific entity
      if (totalBought <= 0) {
        const errorText = `Error: You must purchase ${investmentName} before selling it.`;
        console.error(errorText);
        errorMsg.textContent = errorText;
        errorMsg.style.display = "block";
        amountInput.max = 0;
        submitButton.disabled = true;
        return false;
      }
      
      // Check if all purchased amount has already been sold
      if (totalSold > 0) {
        const errorText = `Error: ${investmentName} has already been sold.`;
        console.error(errorText);
        errorMsg.textContent = errorText;
        errorMsg.style.display = "block";
        amountInput.max = 0;
        submitButton.disabled = true;
        return false;
      }
      
      /* 
      // Comment out partial transaction logic since we only support full transactions
      // Set maximum sale amount to remaining balance
      amountInput.max = availableToSell;
      
      // Check current input value against available amount
      const currentAmount = parseFloat(amountInput.value) || 0;
      console.log(`Current amount: ${currentAmount}, Max allowed: ${availableToSell}`);
      
      if (currentAmount > availableToSell) {
        const errorText = `Warning: You can only sell up to $${availableToSell.toLocaleString()} of ${investmentName} (remaining balance of purchases).`;
        console.error(errorText);
        errorMsg.textContent = errorText;
        errorMsg.style.display = "block";
        submitButton.disabled = true;
        return false;
      }
      */
      
      console.log("Sale validation passed");
      errorMsg.style.display = "none";
      submitButton.disabled = false;
      return true;
    } else {
      // For buy transactions, remove any validation messages
      if (document.getElementById("sale-validation-error")) {
        document.getElementById("sale-validation-error").style.display = "none";
      }
      
      /* 
      // Comment out partial transaction logic
      // Reset any max value constraint for buy transactions
      if (amountInput) {
        amountInput.removeAttribute("max");
      }
      */
      
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
    const isFilterActive = filterCheckbox ? filterCheckbox.checked : amountFilterActive;
    
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
    
    return transactions.filter(transaction => {
      // Make sure transaction object is valid
      if (!transaction || !transaction.date) {
        return false;
      }
      
      // Date filter
      const dateInRange = transaction.date >= startDate && transaction.date <= endDate;
      
      // Amount filter (only apply if active)
      const amountInRange = !isFilterActive || 
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
    console.log("Initializing transaction modal with investment data length:", investmentData.length);
    
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
    
    console.log(`Available investments: ${fundItems.length} funds, ${landItems.length} lands`);

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

    console.log("Transaction modal HTML created, attaching event listeners");

    // Add event listener for form submission
    document
      .getElementById("transaction-form")
      .addEventListener("submit", async function (e) {
        e.preventDefault();
        
        console.log("Transaction form submitted");

        // Get investment type from selected option FIRST
        const selectedOption = document.getElementById("investment-name").selectedOptions[0];
        if (!selectedOption || !selectedOption.dataset.type) {
          console.error("Selected option doesn't have a data-type attribute");
          alert("Error: Invalid investment selection. Please select a valid investment.");
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
          name: selectedOption.textContent
        };

        console.log("Form data:", formData);
        
        // Log explicitly for debugging
        console.log(`Transaction type info: entity_type=${entityType}, investmentType=${investmentType}`);
        
        // For sale transactions, only check if there are any buys, no amount validation
        if (formData.transactionType === "sale") {
          console.log("Sale transaction detected - validating existence only...");
          
          // Check if there are any buy transactions for this investment
          const entityId = Number(formData.entity_id);
          const existingTransactions = transactionData.filter(
            t => Number(t.entity_id) === entityId && 
                 t.investmentType === formData.investmentType
          );
          
          const buyTransactions = existingTransactions.filter(
            t => t.transactionType === "buy" && t.date <= formData.date
          );
          
          const totalBought = d3.sum(buyTransactions, d => Math.abs(d.amount));
          
          // Only check if any purchase exists, not checking amount
          if (totalBought <= 0) {
            const errorMsg = `Error: You must purchase ${formData.name} before selling it.`;
            console.error("Sale validation failed:", errorMsg);
            alert(errorMsg);
            return; // Prevent submission
          }
        }

        try {
          // Log transaction data before saving
          console.log("Saving transaction with data:", {
            id: formData.id,
            entity_id: formData.entity_id,
            investmentType: formData.investmentType,
            entity_type: formData.investmentType === "fund" ? "investment" : "land",
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
      typeSelect.addEventListener("change", function() {
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
            const event = new Event('change');
            investmentField.dispatchEvent(event);
          }
        } else if (this.value === "sale") {
          // For sale, allow manual editing
          if (amountInput) {
            amountInput.removeAttribute("readonly");
          }
        }
        
        // Only run validation for existence of buys, not amount validation
        if (this.value === "sale") {
          validateSaleExistence();
        }
      });
    } else {
      console.error("Transaction type select not found!");
    }
    
    if (investmentSelect) {
      investmentSelect.addEventListener("change", async function() {
        console.log("Investment changed to:", this.value);
        
        // Always set the full cash value for the selected investment
        if (this.value) {
          const entityId = parseInt(this.value);
          const entityType = this.selectedOptions[0].dataset.type;
          const amountInput = document.getElementById("transaction-amount");
          const transactionType = document.getElementById("transaction-type").value;
          
          // Fetch the investment details from IndexedDB
          try {
            const store = entityType === "investment" ? STORES.investments : STORES.lands;
            const transaction = db.transaction(store, "readonly");
            const objectStore = transaction.objectStore(store);
            const request = objectStore.get(entityId);
            
            request.onsuccess = function(event) {
              const entity = event.target.result;
              
              if (entity) {
                // For investments, use cash_investment, for lands use cash_injection
                const cashValue = entityType === "investment" ? 
                  parseFloat(entity.cash_investment) : 
                  parseFloat(entity.cash_injection);
                
                // Always set the exact cash value - no partial transactions
                if (amountInput && !isNaN(cashValue)) {
                  amountInput.value = cashValue;
                  console.log(`Set amount to exact ${entityType} cash value: ${cashValue}`);
                }
              }
            };
            
            request.onerror = function(event) {
              console.error("Error fetching entity details:", event.target.error);
            };
          } catch (error) {
            console.error("Error setting amount:", error);
          }
        }
        
        // If this is a sale type, immediately validate
        if (typeSelect && typeSelect.value === "sale") {
          // Add a slight delay to ensure the value is properly updated
          setTimeout(validateSaleExistence, 50);
        }
      });
    } else {
      console.error("Investment select not found!");
    }
    
    if (amountInput) {
      amountInput.addEventListener("input", validateSaleExistence);
    } else {
      console.error("Amount input not found!");
    }
    
    if (dateInput) {
      dateInput.addEventListener("change", validateSaleExistence);
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
  function validateSaleTransaction() {
    const typeSelect = document.getElementById("transaction-type");
    const investmentSelect = document.getElementById("investment-name");
    const dateInput = document.getElementById("transaction-date");
    
    // If we're not in a sale transaction, no validation needed
    if (!typeSelect || typeSelect.value !== "sale") {
      return true;
    }
    
    // If any required fields are empty, we can't validate yet
    if (!investmentSelect || !investmentSelect.value || !dateInput || !dateInput.value) {
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
    
    // Find all buy transactions for this investment
    const existingTransactions = transactionData.filter(
      t => Number(t.entity_id) === entityId && 
           t.investmentType === investmentType
    );
    
    // Only count buy transactions that happened before or on the sale date
    const buyTransactions = existingTransactions.filter(
      t => t.transactionType === "buy" && t.date <= saleDate
    );
    
    // Calculate total amount bought
    const totalBought = d3.sum(buyTransactions, d => Math.abs(d.amount));
    
    console.log("Sale validation details:", {
      buyTransactions: buyTransactions.length,
      totalBought
    });
    
    // Only check if any purchases exist, not the amount
    if (totalBought <= 0) {
      // Show an error message
      alert(`Error: You must purchase ${selectedOption.textContent} before selling it.`);
      return false;
    }
    
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

  // Function that only validates that a sale transaction has previous buys
  function validateSaleExistence() {
    const typeSelect = document.getElementById("transaction-type");
    const investmentSelect = document.getElementById("investment-name");
    const dateInput = document.getElementById("transaction-date");
    
    // If we're not in a sale transaction, no validation needed
    if (!typeSelect || typeSelect.value !== "sale") {
      return true;
    }
    
    // If any required fields are empty, we can't validate yet
    if (!investmentSelect || !investmentSelect.value || !dateInput || !dateInput.value) {
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
    
    // Find all buy transactions for this investment
    const existingTransactions = transactionData.filter(
      t => Number(t.entity_id) === entityId && 
           t.investmentType === investmentType
    );
    
    // Only count buy transactions that happened before or on the sale date
    const buyTransactions = existingTransactions.filter(
      t => t.transactionType === "buy" && t.date <= saleDate
    );
    
    // Calculate total amount bought
    const totalBought = d3.sum(buyTransactions, d => Math.abs(d.amount));
    
    console.log("Sale validation details:", {
      buyTransactions: buyTransactions.length,
      totalBought
    });
    
    // Only check if any purchases exist, not the amount
    if (totalBought <= 0) {
      // Show an error message
      alert(`Error: You must purchase ${selectedOption.textContent} before selling it.`);
      return false;
    }
    
    // If we get here, the sale is valid
    return true;
  }

  // Update the form submission handler around line 2680
  // For sale transactions, remove amount validation but keep existence validation
  if (formData.transactionType === "sale") {
    console.log("Sale transaction detected - validating existence only...");
    
    // Force validation regardless of any previous checks
    const isValid = validateSaleExistence();
    console.log("Validation result:", isValid);
    
    if (!isValid) {
      console.log("Sale validation failed, stopping form submission");
      return; // Stop if validation fails
    }
    
    // Extra safety check - manually check if there are buy transactions
    const entityId = Number(formData.entity_id);
    const existingTransactions = transactionData.filter(
      t => Number(t.entity_id) === entityId && 
           t.investmentType === formData.investmentType
    );
    
    const buyTransactions = existingTransactions.filter(
      t => t.transactionType === "buy" && t.date <= formData.date
    );
    
    const totalBought = d3.sum(buyTransactions, d => Math.abs(d.amount));
    
    if (totalBought <= 0) {
      const errorMsg = `Error: You must purchase ${formData.name} before selling it.`;
      console.error("FINAL SAFETY CHECK FAILED:", errorMsg);
      alert(errorMsg);
      return; // Prevent submission
    }
  }
});
