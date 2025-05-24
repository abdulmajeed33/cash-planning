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
    recurringPayments: "recurringPayments",
    nonRecurringPayments: "nonRecurringPayments",
    invoices: "invoices",
    supplierPayments: "supplierPayments"
  };

  let db;
  
  // Variable for opening cash balance
  let openingBalance = 50000; // Default opening balance

  // Cash flow data arrays
  let cashFlowEvents = [];
  let recurringPaymentsData = [];
  let nonRecurringPaymentsData = [];
  let invoicesData = [];
  let supplierPaymentsData = [];

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

        if (!db.objectStoreNames.contains(STORES.recurringPayments)) {
          const recurringPaymentsStore = db.createObjectStore(STORES.recurringPayments, {
            keyPath: "id",
            autoIncrement: true,
          });
          recurringPaymentsStore.createIndex("name", "name", { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.nonRecurringPayments)) {
          const nonRecurringPaymentsStore = db.createObjectStore(STORES.nonRecurringPayments, {
            keyPath: "id",
            autoIncrement: true,
          });
          nonRecurringPaymentsStore.createIndex("name", "name", { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.invoices)) {
          const invoicesStore = db.createObjectStore(STORES.invoices, {
            keyPath: "id",
            autoIncrement: true,
          });
          invoicesStore.createIndex("name", "name", { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.supplierPayments)) {
          const supplierPaymentsStore = db.createObjectStore(STORES.supplierPayments, {
            keyPath: "id",
            autoIncrement: true,
          });
          supplierPaymentsStore.createIndex("name", "name", { unique: false });
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

    // Sample cash flow data
    const sampleRecurringPayments = [
      {
        id: 1,
        description: "Office Rent",
        amount: "5000",
        day_of_month: 1
      },
      {
        id: 2,
        description: "Employee Salaries",
        amount: "25000",
        day_of_month: 15
      }
    ];

    const sampleNonRecurringPayments = [
      {
        id: 1,
        description: "Equipment Purchase",
        amount: "15000",
        payment_date: new Date(currentYear, currentMonth, currentDay + 30)
      },
      {
        id: 2,
        description: "Marketing Campaign",
        amount: "8000",
        payment_date: new Date(currentYear, currentMonth, currentDay + 90)
      }
    ];

    const sampleInvoices = [
      {
        id: 1,
        invoice_code: "INV-001",
        client_name: "ABC Corp",
        amount: "45000",
        due_date: new Date(currentYear, currentMonth, currentDay + 45)
      },
      {
        id: 2,
        invoice_code: "INV-002",
        client_name: "XYZ Ltd",
        amount: "32000",
        due_date: new Date(currentYear, currentMonth, currentDay + 75)
      }
    ];

    const sampleSupplierPayments = [
      {
        id: 1,
        invoice_code: "SUP-001",
        supplier_name: "Tech Supplies Inc",
        amount: "12000",
        due_date: new Date(currentYear, currentMonth, currentDay + 20)
      },
      {
        id: 2,
        invoice_code: "SUP-002",
        supplier_name: "Office Solutions",
        amount: "3500",
        due_date: new Date(currentYear, currentMonth, currentDay + 50)
      }
    ];

    // Add all sample data to database
    try {
      await Promise.all([
        ...sampleInvestments.map((inv) => addData(STORES.investments, inv)),
        ...sampleLands.map((land) => addData(STORES.lands, land)),
        ...sampleTransactions.map((tx) => addData(STORES.transactions, tx)),
        ...sampleRecurringPayments.map((payment) => addData(STORES.recurringPayments, payment)),
        ...sampleNonRecurringPayments.map((payment) => addData(STORES.nonRecurringPayments, payment)),
        ...sampleInvoices.map((invoice) => addData(STORES.invoices, invoice)),
        ...sampleSupplierPayments.map((payment) => addData(STORES.supplierPayments, payment)),
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

  // Cash flow data fetching functions
  async function fetchCashFlowData() {
    try {
      console.log("Fetching cash flow data from IndexedDB...");
      
      // Fetch all data types in parallel
      const [recurringPayments, nonRecurringPayments, invoices, supplierPayments] = 
        await Promise.all([
          getAllData(STORES.recurringPayments),
          getAllData(STORES.nonRecurringPayments),
          getAllData(STORES.invoices),
          getAllData(STORES.supplierPayments)
        ]);
      
      console.log("Recurring payments:", recurringPayments);
      console.log("Non-recurring payments:", nonRecurringPayments);
      console.log("Invoices:", invoices);
      console.log("Supplier payments:", supplierPayments);
      
      // Process recurring payments (create instances for the date range)
      recurringPaymentsData = processRecurringPayments(recurringPayments, startDate, endDate);
      
      // Format non-recurring payments
      nonRecurringPaymentsData = nonRecurringPayments.map(payment => ({
        id: payment.id,
        type: 'nonRecurringPayment',
        description: payment.description,
        amount: -parseFloat(payment.amount), // Negative for outgoing payments
        date: new Date(payment.payment_date),
        originalData: payment
      }));
      
      // Format invoices
      invoicesData = invoices.map(invoice => ({
        id: invoice.id,
        type: 'invoice',
        description: `${invoice.invoice_code} - ${invoice.client_name}`,
        amount: parseFloat(invoice.amount), // Positive for incoming payments
        date: new Date(invoice.due_date),
        originalData: invoice
      }));
      
      // Format supplier payments
      supplierPaymentsData = supplierPayments.map(payment => ({
        id: payment.id,
        type: 'supplierPayment',
        description: `${payment.invoice_code} - ${payment.supplier_name}`,
        amount: -parseFloat(payment.amount), // Negative for outgoing payments
        date: new Date(payment.due_date),
        originalData: payment
      }));
      
      // Combine all data into a single array for visualization
      cashFlowEvents = [
        ...recurringPaymentsData,
        ...nonRecurringPaymentsData,
        ...invoicesData,
        ...supplierPaymentsData
      ];
      
      console.log("Combined cash flow events:", cashFlowEvents);
      
      return cashFlowEvents;
    } catch (error) {
      console.error("Error fetching cash flow data:", error);
      return [];
    }
  }

  // Process recurring payments and create instances for each month in the date range
  function processRecurringPayments(recurringPayments, startDate, endDate) {
    const instances = [];
    
    recurringPayments.forEach(payment => {
      const dayOfMonth = parseInt(payment.day_of_month);
      const amount = parseFloat(payment.amount);
      
      // Calculate all occurrences within the date range
      let currentDate = new Date(startDate);
      // Set to first day of month to avoid issues with month length
      currentDate.setDate(1);
      
      while (currentDate <= endDate) {
        // Create a date for this month's payment
        const paymentDate = new Date(currentDate);
        
        // Set the day of month, handling month length
        const lastDayOfMonth = new Date(
          paymentDate.getFullYear(), 
          paymentDate.getMonth() + 1, 
          0
        ).getDate();
        
        // Use the specified day, but don't exceed month length
        const actualDay = Math.min(dayOfMonth, lastDayOfMonth);
        paymentDate.setDate(actualDay);
        
        // Only add if it's within our date range
        if (paymentDate >= startDate && paymentDate <= endDate) {
          instances.push({
            id: `recurring-${payment.id}-${paymentDate.getTime()}`, // Create unique ID
            type: 'recurringPayment',
            description: payment.description,
            amount: -amount, // Negative for outgoing payments
            date: new Date(paymentDate),
            originalData: payment,
            recurringId: payment.id
          });
        }
        
        // Move to next month
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    });
    
    return instances;
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
    // Cash flow emojis
    "recurringPayment": "💼",
    "nonRecurringPayment": "📋",
    "invoice": "📥",
    "supplierPayment": "📤"
  };

  // Cash flow transaction colors
  const cashFlowColors = {
    "recurringPayment": "#3498db", // Blue
    "nonRecurringPayment": "#e74c3c", // Red
    "invoice": "#2ecc71", // Green
    "supplierPayment": "#f39c12"  // Orange
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
  let cashFlowTimelineInstance = null;

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

  // Filter cash flow events based on selected date range and amount filter
  function filterCashFlowEvents(events) {
    if (!events || !Array.isArray(events)) {
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

    return events.filter((event) => {
      // Make sure event object is valid
      if (!event || !event.date) {
        return false;
      }

      // Date filter
      const dateInRange =
        event.date >= startDate && event.date <= endDate;

      // Amount filter (only apply if active)
      const amountInRange =
        !isFilterActive ||
        (Math.abs(event.amount) >= filterMin &&
          Math.abs(event.amount) <= filterMax);

      return dateInRange && amountInRange;
    });
  }

  // Function to fetch all required data for the investment chart
  async function fetchChartData() {
    try {
      console.log("Fetching chart data from IndexedDB...");

      // Ensure database is initialized
      if (!db) {
        await initDatabase();
        await seedDatabaseIfEmpty();
      }

      // Fetch investments, lands, transactions, and cash flow data in parallel
      const [investments, lands, transactions] = await Promise.all([
        fetchInvestments(),
        fetchLands(),
        fetchTransactions(),
      ]);

      // Fetch cash flow data separately
      await fetchCashFlowData();

      console.log("Investments:", investments);
      console.log("Lands:", lands);
      console.log("Transactions:", transactions);
      console.log("Cash flow events:", cashFlowEvents);

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
        cashFlowEvents: cashFlowEvents
      };
    } catch (error) {
      console.error("Error fetching chart data:", error);
      return { investments: [], transactions: [], cashFlowEvents: [] };
    }
  }

  // Group cash flow events by date for visualization
  function groupEventsByProximity(events, dayThreshold = 7) {
    if (!events || events.length === 0) return [];
    
    const sortedEvents = [...events].sort((a, b) => a.date - b.date);
    const groups = [];
    let currentGroup = null;
    
    sortedEvents.forEach((event) => {
      const eventTime = event.date.getTime();
      
      if (!currentGroup) {
        // Start first group
        currentGroup = {
          date: event.date,
          events: [event],
          totalInflow: event.amount > 0 ? event.amount : 0,
          totalOutflow: event.amount < 0 ? Math.abs(event.amount) : 0
        };
        groups.push(currentGroup);
      } else {
        // Check if this event is close to the current group
        const groupAvgTime = currentGroup.date.getTime();
        const daysDiff = Math.abs(eventTime - groupAvgTime) / (1000 * 60 * 60 * 24);
        
        if (daysDiff <= dayThreshold) {
          // Add to current group
          currentGroup.events.push(event);
          
          // Update totals
          if (event.amount > 0) {
            currentGroup.totalInflow += event.amount;
          } else {
            currentGroup.totalOutflow += Math.abs(event.amount);
          }
          
          // Update group date as the average
          const totalTime = currentGroup.events.reduce(
            (sum, e) => sum + e.date.getTime(),
            0
          );
          currentGroup.date = new Date(totalTime / currentGroup.events.length);
        } else {
          // Start a new group
          currentGroup = {
            date: event.date,
            events: [event],
            totalInflow: event.amount > 0 ? event.amount : 0,
            totalOutflow: event.amount < 0 ? Math.abs(event.amount) : 0
          };
          groups.push(currentGroup);
        }
      }
    });
    
    // Calculate net flow for each group
    groups.forEach(group => {
      group.netFlow = group.totalInflow - group.totalOutflow;
    });
    
    return groups;
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
      // Cash flow legend items
      { type: "recurringPayment", label: "Recurring Payment" },
      { type: "nonRecurringPayment", label: "Non-Recurring Payment" },
      { type: "invoice", label: "Invoice" },
      { type: "supplierPayment", label: "Supplier Payment" },
    ];

    // Color scale for different investment types (defined early so it can be used in legend)
    const color = d3
      .scaleOrdinal()
      .domain(["fund-buy", "fund-sale", "land-buy", "land-sale", "recurringPayment", "nonRecurringPayment", "invoice", "supplierPayment"])
      .range(["#F44336", "#4CAF50", "#FF9800", "#2196F3", "#3498db", "#e74c3c", "#2ecc71", "#f39c12"]);

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

    // Filter transactions and cash flow events based on selected date range AND amount filter
    const visibleTransactions = filterTransactions(transactionData);
    const visibleCashFlowEvents = filterCashFlowEvents(cashFlowEvents);

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
        .text(` (Showing ${visibleTransactions.length} investment transactions, ${visibleCashFlowEvents.length} cash flow events)`);
    }

    // Add section header for investment timeline
    investmentChart
      .append("h3")
      .attr("class", "section-header")
      .style("margin", "20px 0 10px 0")
      .style("color", "#333")
      .text("Investment Timeline");

    // Process the investment transaction data for display
    if (visibleTransactions.length === 0) {
      investmentChart
        .append("div")
        .attr("class", "no-data-message")
        .style("margin-bottom", "20px")
        .text(
          "No investment transactions in the selected range. Click anywhere on the timeline below to add a new transaction."
        );
    }

    // Clean up any existing timeline instance
    if (timelineInstance) {
      timelineInstance.destroy();
      timelineInstance = null;
    }

    // Create investment timeline container
    const investmentTimelineContainer = investmentChart
      .append("div")
      .attr("id", "investment-timeline-container")
      .style("margin-bottom", "30px");

    // Create investment timeline using the component
    timelineInstance = createInvestmentTimeline({
      containerId: "investment-timeline-container",
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

    // Add section header for cash flow timeline
    investmentChart
      .append("h3")
      .attr("class", "section-header")
      .style("margin", "20px 0 10px 0")
      .style("color", "#333")
      .text("Cash Flow Timeline");

    // Process the cash flow data for display
    if (visibleCashFlowEvents.length === 0) {
      investmentChart
        .append("div")
        .attr("class", "no-data-message")
        .style("margin-bottom", "20px")
        .text(
          "No cash flow events in the selected range."
        );
    }

    // Clean up any existing cash flow timeline instance
    if (cashFlowTimelineInstance) {
      cashFlowTimelineInstance.destroy();
      cashFlowTimelineInstance = null;
    }

    // Create cash flow timeline container
    const cashFlowTimelineContainer = investmentChart
      .append("div")
      .attr("id", "cashflow-timeline-container")
      .style("margin-bottom", "30px");

    // Create cash flow timeline using the component
    cashFlowTimelineInstance = createCashFlowTimeline({
      containerId: "cashflow-timeline-container",
      events: visibleCashFlowEvents,
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
      transactionColors: cashFlowColors,
      dateFormat: dateFormat,
      getDateFromPosition: getDateFromPosition,
      isDateInRange: isDateInRange,
      groupEventsByProximity: groupEventsByProximity,
      deleteCashFlowEvent: deleteCashFlowEvent,
      updateCashFlowEvent: updateCashFlowEvent,
      updateCashFlowVisualization: updateInvestmentVisualization
    });

    // Now draw the combined bar chart below both timelines
    drawCombinedBarChart(visibleTransactions, visibleCashFlowEvents);
  }

  // Function to draw combined bar chart showing both investment transactions and cash flow events
  function drawCombinedBarChart(visibleTransactions, visibleCashFlowEvents) {
    if (visibleTransactions.length === 0 && visibleCashFlowEvents.length === 0) {
      return; // No data to display
    }

    // Clear any existing content in the combined chart container
    const combinedChart = d3.select("#combined-chart");
    combinedChart.selectAll("*").remove();

    // Add combined chart section header to the combined chart container
    combinedChart
      .append("h3")
      .attr("class", "section-header")
      .style("margin", "30px 0 10px 0")
      .style("color", "#333")
      .text("Combined Financial Overview");

    // Set chart dimensions
    const margin = { top: 20, right: 50, bottom: 80, left: 60 };
    const width = 1000 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Create SVG for combined bar chart
    const barChartSvg = combinedChart
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

    // Combine all financial events
    const allEvents = [
      ...visibleTransactions.map(t => ({
        ...t,
        category: 'investment',
        type: `${t.investmentType}-${t.transactionType}`
      })),
      ...visibleCashFlowEvents.map(e => ({
        ...e,
        category: 'cashflow',
        type: e.type
      }))
    ];

    // Sort all events by date
    allEvents.sort((a, b) => a.date - b.date);

    // Calculate the min and max values for the y-axis
    const maxValue = Math.max(
      d3.max(allEvents.filter(e => e.amount > 0), d => d.amount) || 0,
      d3.max(visibleTransactions.filter(t => t.transactionType === "sale"), d => d.amount) || 0
    ) * 1.1;

    const minValue = Math.min(
      d3.min(allEvents.filter(e => e.amount < 0), d => d.amount) || 0,
      d3.min(visibleTransactions.filter(t => t.transactionType === "buy"), d => d.amount) || 0
    ) * 1.1;

    // Create y scale that includes negative values
    const y = d3
      .scaleLinear()
      .domain([minValue, maxValue])
      .range([height, 0]);

    // Calculate the position of the zero line
    const zeroLineY = y(0);

    // Create a time-based x scale
    const xTime = d3
      .scaleTime()
      .domain([startDate, endDate])
      .range([0, width]);

    // Calculate bar width based on time scale
    const calculateBarWidth = (date) => {
      const currentMonth = new Date(date);
      const nextMonth = new Date(date);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      if (nextMonth > endDate) {
        nextMonth.setTime(endDate.getTime());
      }

      const monthWidth = xTime(nextMonth) - xTime(currentMonth);
      return Math.min(Math.max(monthWidth * 0.6, 15), 60);
    };

    // Create time axis
    const timeAxis = d3
      .axisBottom(xTime)
      .ticks(10)
      .tickFormat(d3.timeFormat("%b %d"))
      .tickSize(5);

    // Add X axis
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
    barChartSvg.append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(y).tickFormat((d) => `$${d.toLocaleString()}`));

    // Add horizontal line at y=0
    barChartSvg
      .append("line")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", zeroLineY)
      .attr("y2", zeroLineY)
      .attr("stroke", "#000")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "4,4");

    // Add Y axis label
    barChartSvg
      .append("text")
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .attr("y", -margin.left)
      .attr("x", -height / 2)
      .text("Amount ($)")
      .style("font-size", "12px");

    // Group events by date for stacking
    const eventsByDate = d3.groups(allEvents, d => d.date.toDateString());

    // Draw bars for each date group
    eventsByDate.forEach(([dateString, events]) => {
      const date = new Date(dateString);
      const barX = xTime(date) - calculateBarWidth(date) / 2;
      const barWidth = calculateBarWidth(date);

      // Separate positive and negative amounts
      const positiveEvents = events.filter(e => e.amount > 0);
      const negativeEvents = events.filter(e => e.amount < 0);

      // Draw positive bars (stacked above zero line)
      let positiveStackTop = 0;
      positiveEvents.forEach((event, index) => {
        const barHeight = y(positiveStackTop) - y(positiveStackTop + event.amount);
        const barY = y(positiveStackTop + event.amount);

        const color = getEventColor(event);

        barChartSvg
          .append("rect")
          .attr("class", `${event.category}-bar-segment`)
          .attr("x", barX)
          .attr("y", barY)
          .attr("width", barWidth)
          .attr("height", barHeight)
          .attr("fill", color)
          .attr("opacity", 0.8)
          .attr("stroke", "#fff")
          .attr("stroke-width", 0.5)
          .attr("data-amount", event.amount)
          .attr("data-stack-position", positiveStackTop)
          .on("mouseenter", function (mouseEvent) {
            tooltip.transition().duration(200).style("opacity", 0.9);
            tooltip
              .html(getEventTooltipContent(event))
              .style("left", mouseEvent.pageX + 10 + "px")
              .style("top", mouseEvent.pageY - 28 + "px");
          })
          .on("mouseleave", function () {
            tooltip.transition().duration(500).style("opacity", 0);
          });

        positiveStackTop += event.amount;
      });

      // Draw negative bars (stacked below zero line)
      let negativeStackBottom = 0;
      negativeEvents.forEach((event, index) => {
        const barHeight = y(negativeStackBottom + event.amount) - y(negativeStackBottom);
        const barY = y(negativeStackBottom);

        const color = getEventColor(event);

        barChartSvg
          .append("rect")
          .attr("class", `${event.category}-bar-segment`)
          .attr("x", barX)
          .attr("y", barY)
          .attr("width", barWidth)
          .attr("height", Math.abs(barHeight))
          .attr("fill", color)
          .attr("opacity", 0.8)
          .attr("stroke", "#fff")
          .attr("stroke-width", 0.5)
          .attr("data-amount", event.amount)
          .attr("data-stack-position", negativeStackBottom)
          .on("mouseenter", function (mouseEvent) {
            tooltip.transition().duration(200).style("opacity", 0.9);
            tooltip
              .html(getEventTooltipContent(event))
              .style("left", mouseEvent.pageX + 10 + "px")
              .style("top", mouseEvent.pageY - 28 + "px");
          })
          .on("mouseleave", function () {
            tooltip.transition().duration(500).style("opacity", 0);
          });

        negativeStackBottom += event.amount;
      });
    });

    // Calculate and draw running balance line
    let runningBalance = openingBalance;
    const balanceData = [{ date: startDate, balance: runningBalance }];

    allEvents.forEach(event => {
      runningBalance += event.amount;
      balanceData.push({ date: event.date, balance: runningBalance });
    });

    balanceData.push({ date: endDate, balance: runningBalance });

    // Update Y scale to include balance data
    const maxBalance = Math.max(maxValue, d3.max(balanceData, d => d.balance) || 0);
    const minBalance = Math.min(minValue, d3.min(balanceData, d => d.balance) || 0);
    y.domain([minBalance, maxBalance * 1.1]);

    // Redraw Y axis with updated scale
    barChartSvg.select(".y-axis").remove();
    barChartSvg.append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(y).tickFormat((d) => `$${d.toLocaleString()}`));

    // Update the zero line position with new scale
    const newZeroLineY = y(0);
    barChartSvg.select("line[stroke-dasharray='4,4']")
      .attr("y1", newZeroLineY)
      .attr("y2", newZeroLineY);

    // Reposition all existing bars with the updated Y scale
    barChartSvg.selectAll("rect").each(function() {
      const rect = d3.select(this);
      const originalAmount = parseFloat(rect.attr("data-amount"));
      const originalStackPosition = parseFloat(rect.attr("data-stack-position")) || 0;
      
      if (!isNaN(originalAmount)) {
        if (originalAmount > 0) {
          // Positive bars
          const newBarHeight = y(originalStackPosition) - y(originalStackPosition + originalAmount);
          const newBarY = y(originalStackPosition + originalAmount);
          rect.attr("y", newBarY).attr("height", newBarHeight);
        } else {
          // Negative bars
          const newBarHeight = y(originalStackPosition + originalAmount) - y(originalStackPosition);
          const newBarY = y(originalStackPosition);
          rect.attr("y", newBarY).attr("height", Math.abs(newBarHeight));
        }
      }
    });

    // Create line generator for balance
    const line = d3.line()
      .x(d => xTime(d.date))
      .y(d => y(d.balance))
      .curve(d3.curveMonotoneX);

    // Draw balance line
    barChartSvg.append("path")
      .datum(balanceData)
      .attr("class", "closing-balance-line")
      .attr("d", line)
      .attr("fill", "none")
      .attr("stroke", "#FF9800")
      .attr("stroke-width", 3)
      .attr("opacity", 0.8);

    // Add balance points
    barChartSvg.selectAll(".balance-point")
      .data(balanceData.slice(1, -1))
      .enter()
      .append("circle")
      .attr("class", "balance-point")
      .attr("cx", d => xTime(d.date))
      .attr("cy", d => y(d.balance))
      .attr("r", 4)
      .attr("fill", "#FF9800")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .on("mouseenter", function (mouseEvent, d) {
        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip
          .html(`Date: ${dateFormat(d.date)}<br>Balance: $${d.balance.toLocaleString()}`)
          .style("left", mouseEvent.pageX + 10 + "px")
          .style("top", mouseEvent.pageY - 28 + "px");
      })
      .on("mouseleave", function () {
        tooltip.transition().duration(500).style("opacity", 0);
      });
  }

  // Helper function to get color for events
  function getEventColor(event) {
    if (event.category === 'investment') {
      const colorMap = {
        'fund-buy': '#F44336',
        'fund-sale': '#4CAF50',
        'land-buy': '#FF9800',
        'land-sale': '#2196F3'
      };
      return colorMap[event.type] || '#666';
    } else {
      return cashFlowColors[event.type] || '#666';
    }
  }

  // Helper function to get tooltip content for events
  function getEventTooltipContent(event) {
    if (event.category === 'investment') {
      return `
        <strong>${event.name}</strong><br>
        <strong>Type:</strong> ${event.investmentType} ${event.transactionType}<br>
        <strong>Amount:</strong> $${event.amount.toLocaleString()}<br>
        <strong>Date:</strong> ${dateFormat(event.date)}<br>
        ${event.notes ? `<strong>Notes:</strong> ${event.notes}` : ''}
      `;
    } else {
      return `
        <strong>${event.description}</strong><br>
        <strong>Type:</strong> ${getEventTypeLabel(event.type)}<br>
        <strong>Amount:</strong> ${event.amount >= 0 ? '+' : ''}$${event.amount.toLocaleString()}<br>
        <strong>Date:</strong> ${dateFormat(event.date)}
      `;
    }
  }

  // Helper function to get event type labels
  function getEventTypeLabel(type) {
    const typeLabels = {
      'recurringPayment': 'Recurring Payment',
      'nonRecurringPayment': 'Non-Recurring Payment',
      'invoice': 'Invoice',
      'supplierPayment': 'Supplier Payment'
    };
    return typeLabels[type] || type;
  }

  // Helper function to calculate bar width based on time scale
  function calculateBarWidth(date) {
    const currentMonth = new Date(date);
    const nextMonth = new Date(date);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    if (nextMonth > endDate) {
      nextMonth.setTime(endDate.getTime());
    }

    const monthWidth = timeScale(nextMonth) - timeScale(currentMonth);
    return Math.min(Math.max(monthWidth * 0.6, 15), 60);
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

    // Investment modal close button
    investmentModal.select(".close").on("click", function () {
      investmentModal.style("display", "none");
    });

    console.log("Transaction modal initialization complete");
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

  // Function to delete a cash flow event directly without opening a modal
  async function deleteCashFlowEvent(event) {
    try {
      // Confirm deletion with the user
      if (!confirm("Are you sure you want to delete this cash flow event?")) {
        return false;
      }

      // Determine which store to delete from based on event type
      let storeName;
      switch (event.type) {
        case 'recurringPayment':
          storeName = STORES.recurringPayments;
          break;
        case 'nonRecurringPayment':
          storeName = STORES.nonRecurringPayments;
          break;
        case 'invoice':
          storeName = STORES.invoices;
          break;
        case 'supplierPayment':
          storeName = STORES.supplierPayments;
          break;
        default:
          console.error("Unknown cash flow event type:", event.type);
          return false;
      }

      // Delete the event from the database
      await deleteData(storeName, Number(event.id));

      // Refresh the chart data and redraw
      await fetchChartData();
      drawInvestmentChart();

      return true;
    } catch (error) {
      console.error("Error deleting cash flow event:", error);
      alert("Failed to delete cash flow event: " + error.message);
      return false;
    }
  }

  // Function to update a cash flow event
  async function updateCashFlowEvent(event) {
    try {
      // Determine which store to update based on event type
      let storeName;
      let updateDataObj;
      
      switch (event.type) {
        case 'recurringPayment':
          storeName = STORES.recurringPayments;
          updateDataObj = {
            ...event.originalData,
            // Update the relevant date field for recurring payments
            // Note: Recurring payments typically use day_of_month, so we might need special handling
          };
          break;
        case 'nonRecurringPayment':
          storeName = STORES.nonRecurringPayments;
          updateDataObj = {
            ...event.originalData,
            payment_date: event.date.toISOString().split('T')[0]
          };
          break;
        case 'invoice':
          storeName = STORES.invoices;
          updateDataObj = {
            ...event.originalData,
            due_date: event.date.toISOString().split('T')[0]
          };
          break;
        case 'supplierPayment':
          storeName = STORES.supplierPayments;
          updateDataObj = {
            ...event.originalData,
            due_date: event.date.toISOString().split('T')[0]
          };
          break;
        default:
          console.error("Unknown cash flow event type:", event.type);
          return false;
      }

      // Update the event in the database
      await updateData(storeName, updateDataObj);

      return true;
    } catch (error) {
      console.error("Error updating cash flow event:", error);
      alert("Failed to update cash flow event: " + error.message);
      return false;
    }
  }

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
