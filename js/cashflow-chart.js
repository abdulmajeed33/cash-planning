document.addEventListener("DOMContentLoaded", function () {
  // Initialize database variables and structure
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

  // Date formatting utilities
  const dateFormat = d3.timeFormat("%b %d, %Y");
  const inputDateFormat = d3.timeFormat("%Y-%m-%d");
  
  // Get current year's date range
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const currentDay = new Date().getDate();

  // Define initial date range for the timeline (current year by default)
  let startDate = new Date(currentYear, currentMonth, currentDay); // Today
  let endDate = new Date(currentYear + 1, currentMonth, currentDay); // One year from today

  // Setup visualization dimensions
  const svgWidth = 1200;
  const svgHeight = 150;
  const timelineY = 100;

  // Define timeline positions
  const timelineStart = 80;
  const timelineEnd = svgWidth - 80;
  const timelineLength = timelineEnd - timelineStart;

  // Initialize time scale
  let timeScale = d3
    .scaleTime()
    .domain([startDate, endDate])
    .range([timelineStart, timelineEnd]);

  // Cash flow transaction emojis/icons
  const transactionEmojis = {
    "recurringPayment": "💼",
    "nonRecurringPayment": "📋",
    "invoice": "📥",
    "supplierPayment": "📤"
  };

  // Color scheme for different transaction types
  const transactionColors = {
    "recurringPayment": "#3498db", // Blue
    "nonRecurringPayment": "#e74c3c", // Red
    "invoice": "#2ecc71", // Green
    "supplierPayment": "#f39c12"  // Orange
  };

  // Initialize date inputs with current range
  function initializeDateInputs() {
    d3.select("#cashflow-start-date").property("value", inputDateFormat(startDate));
    d3.select("#cashflow-end-date").property("value", inputDateFormat(endDate));
    
    // Set the initial value of the opening balance input
    d3.select("#cashflow-opening-balance").property("value", openingBalance);
  }

  // Add event listeners for date preset buttons
  function setupEventListeners() {
    d3.select("#cashflow-btn-1-month").on("click", set1Month);
    d3.select("#cashflow-btn-3-months").on("click", set3Months);
    d3.select("#cashflow-btn-6-months").on("click", set6Months);
    d3.select("#cashflow-btn-1-year").on("click", set1Year);
    
    // Add event listeners for opening balance
    d3.select("#cashflow-apply-opening-balance").on("click", updateOpeningBalance);
    
    // Add keypress event listener to the opening balance input
    d3.select("#cashflow-opening-balance").on("keypress", function(event) {
      if (event.key === "Enter") {
        updateOpeningBalance();
        event.preventDefault();
      }
    });
    
    // Add event listeners for date range controls
    d3.select("#cashflow-apply-dates").on("click", updateDateRange);
    
    // Handle keypress events on the inputs
    d3.select("#cashflow-start-date").on("keypress", function (event) {
      if (event.key === "Enter") {
        updateDateRange();
        event.preventDefault();
      }
    });
    
    d3.select("#cashflow-end-date").on("keypress", function (event) {
      if (event.key === "Enter") {
        updateDateRange();
        event.preventDefault();
      }
    });
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
    d3.select("#cashflow-start-date").property("value", inputDateFormat(startDate));
    d3.select("#cashflow-end-date").property("value", inputDateFormat(endDate));
    
    // Update chart
    updateDateRange();
  }

  // Function to update date range
  function updateDateRange() {
    // Get the input date values
    const startDateValue = d3.select("#cashflow-start-date").property("value");
    const endDateValue = d3.select("#cashflow-end-date").property("value");
    
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
    updateCashFlowVisualization();
  }

  // Function to update the opening balance
  function updateOpeningBalance() {
    const openingBalanceInput = document.getElementById("cashflow-opening-balance");
    const newBalance = parseFloat(openingBalanceInput.value);
    
    if (!isNaN(newBalance)) {
      openingBalance = newBalance;
      // Update the chart with the new opening balance
      updateCashFlowVisualization();
    } else {
      alert("Please enter a valid number for opening balance");
    }
  }

  // Function to find date from position on timeline
  function getDateFromPosition(xPos) {
    return timeScale.invert(xPos);
  }

  // Function to check if date is within range
  function isDateInRange(date) {
    return date >= startDate && date <= endDate;
  }

  // Initialize the database connection
  function initDatabase() {
    return new Promise((resolve, reject) => {
      // Check if db is already initialized (could be initialized by main.js or investment-chart.js)
      if (window.db) {
        console.log("Database already initialized, using existing connection");
        db = window.db;
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
        window.db = db; // Make it globally available
        console.log("Database initialized successfully");
        resolve(db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create our additional object stores if they don't exist
        if (!db.objectStoreNames.contains(STORES.recurringPayments)) {
          const recurringPaymentsStore = db.createObjectStore(STORES.recurringPayments, {
            keyPath: "id",
            autoIncrement: true,
          });
          recurringPaymentsStore.createIndex("description", "description", { unique: false });
        }
        
        if (!db.objectStoreNames.contains(STORES.nonRecurringPayments)) {
          const nonRecurringPaymentsStore = db.createObjectStore(STORES.nonRecurringPayments, {
            keyPath: "id",
            autoIncrement: true,
          });
          nonRecurringPaymentsStore.createIndex("description", "description", { unique: false });
        }
        
        if (!db.objectStoreNames.contains(STORES.invoices)) {
          const invoicesStore = db.createObjectStore(STORES.invoices, {
            keyPath: "id",
            autoIncrement: true,
          });
          invoicesStore.createIndex("invoice_code", "invoice_code", { unique: false });
        }
        
        if (!db.objectStoreNames.contains(STORES.supplierPayments)) {
          const supplierPaymentsStore = db.createObjectStore(STORES.supplierPayments, {
            keyPath: "id",
            autoIncrement: true,
          });
          supplierPaymentsStore.createIndex("invoice_code", "invoice_code", { unique: false });
        }
        
        console.log("Operational cash flow stores created");
      };
    });
  }

  // Main function to initialize the cash flow chart
  async function initCashFlowChart() {
    try {
      // Initialize tooltips and UI elements
      createUIElements();
      
      // Initialize the database
      await initDatabase();
      
      // Comment out the sample data generation to prevent auto-populating data
      // await ensureSampleCashFlowData();
      
      // Initialize date inputs
      initializeDateInputs();
      
      // Setup event listeners
      setupEventListeners();
      
      // Fetch data and render the chart
      await fetchCashFlowData();
      updateCashFlowVisualization();
      
    } catch (error) {
      console.error("Error initializing cash flow chart:", error);
      
      // Show error message
      const cashflowChart = d3.select("#cashflow-chart");
      cashflowChart.html(`
        <div class="error-message">
          <p>Error loading cash flow data: ${error.message}</p>
          <button id="retry-load-btn">Retry</button>
        </div>
      `);
      
      // Add retry button event listener
      d3.select("#retry-load-btn").on("click", () => {
        initCashFlowChart();
      });
    }
  }

  // Create tooltip and other UI elements
  function createUIElements() {
    // Create tooltip container if it doesn't exist already
    if (!d3.select("body").select(".cashflow-tooltip").node()) {
      d3.select("body")
        .append("div")
        .attr("class", "cashflow-tooltip tooltip")
        .style("opacity", 0)
        .style("transform", "scale(0.95)")
        .style("position", "absolute")
        .style("background", "rgba(50, 50, 50, 0.95)")
        .style("color", "white")
        .style("border-radius", "5px")
        .style("padding", "10px 15px")
        .style("font-size", "13px")
        .style("line-height", "1.4")
        .style("pointer-events", "none")
        .style("z-index", "1000")
        .style("box-shadow", "0 2px 10px rgba(0,0,0,0.3)")
        .style("border", "1px solid rgba(255,255,255,0.3)")
        .style("max-width", "300px");
    }
    
    // Create date label for dragging if it doesn't exist
    if (!d3.select("body").select(".cashflow-date-label").node()) {
      d3.select("body")
        .append("div")
        .attr("class", "cashflow-date-label date-label")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background", "rgba(0,0,0,0.7)")
        .style("color", "white")
        .style("padding", "4px 8px")
        .style("border-radius", "4px")
        .style("font-size", "12px")
        .style("pointer-events", "none")
        .style("z-index", "1000");
    }
  }

  // Storage for our cash flow data
  let recurringPaymentsData = [];
  let nonRecurringPaymentsData = [];
  let invoicesData = [];
  let supplierPaymentsData = [];
  
  // Combined data array for visualization
  let cashFlowEvents = [];

  // Fetch all cash flow data from IndexedDB
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

  // Calculate running balance over time based on cash flow events
  function calculateRunningBalance(events, initialBalance) {
    if (!events || events.length === 0) {
      return [
        { date: startDate, balance: initialBalance },
        { date: endDate, balance: initialBalance }
      ];
    }
    
    // Sort events by date
    const sortedEvents = [...events].sort((a, b) => a.date.getTime() - b.date.getTime());
    
    let runningBalance = initialBalance;
    const balanceData = [];
    
    // Add the starting point with initial balance
    balanceData.push({
      date: startDate,
      balance: runningBalance
    });
    
    // Calculate running balance for each event
    sortedEvents.forEach(event => {
      if (event.date >= startDate && event.date <= endDate) {
        runningBalance += event.amount;
        
        balanceData.push({
          date: event.date,
          balance: runningBalance,
          event: event // Store reference to the event
        });
      }
    });
    
    // Add final point with ending balance
    balanceData.push({
      date: endDate,
      balance: runningBalance
    });
    
    return balanceData;
  }

  // Function to update the cash flow visualization
  function updateCashFlowVisualization() {
    // Ensure we have data to work with
    if (!cashFlowEvents) {
      console.warn("No cash flow data available for visualization");
      return;
    }
    
    // Filter events to the selected date range
    const visibleEvents = cashFlowEvents.filter(event => 
      event.date >= startDate && event.date <= endDate
    );
    
    // Clear previous chart elements
    const cashflowChart = d3.select("#cashflow-chart");
    cashflowChart.html("");
    
    // If no events to show, display a message
    if (visibleEvents.length === 0) {
      cashflowChart.append("div")
        .attr("class", "no-data-message")
        .text("No operational cash flow events in the selected range. Click anywhere on the timeline below to add a new transaction.");
      
      // Create the legend at the top of the chart section even when there's no data
      const legendItems = [
        { type: "recurringPayment", label: "Recurring Payment" },
        { type: "nonRecurringPayment", label: "Non-Recurring Payment" },
        { type: "invoice", label: "Invoice" },
        { type: "supplierPayment", label: "Supplier Payment" }
      ];

      // Populate the legend at the top
      const topLegend = d3.select("#cashflow-legend");
      topLegend.html(""); // Clear any existing content

      legendItems.forEach((item) => {
        const legendItem = topLegend.append("div").attr("class", "legend-item");

        legendItem
          .append("div")
          .attr("class", "color-box")
          .style("background-color", transactionColors[item.type]);

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
      
      // Continue rendering the empty chart timeline instead of returning
      // First, create the timeline for cash flows at the top of the chart
      const timelineHeight = 150;
      const cashflowSvg = d3
        .select("#cashflow-chart")
        .append("svg")
        .attr("width", "100%")
        .attr("height", timelineHeight)
        .attr("viewBox", `0 0 ${svgWidth} ${timelineHeight}`)
        .attr("preserveAspectRatio", "xMidYMid meet");

      const cashflowTimelineY = 60;

      // Draw timeline
      cashflowSvg
        .append("line")
        .attr("class", "timeline")
        .attr("x1", timelineStart)
        .attr("x2", timelineEnd)
        .attr("y1", cashflowTimelineY)
        .attr("y2", cashflowTimelineY)
        .attr("stroke", "#ddd")
        .attr("stroke-width", 1);
      
      // Add "Today" indicator if current date is within the visible range
      const today = new Date();
      
      // Create date-only versions (without time) for comparison
      const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
      
      if (todayDateOnly >= startDateOnly && todayDateOnly <= endDateOnly) {
        const todayX = timeScale(today);

        // Add vertical line for today
        cashflowSvg
          .append("line")
          .attr("class", "today-line")
          .attr("x1", todayX)
          .attr("x2", todayX)
          .attr("y1", cashflowTimelineY - 25)
          .attr("y2", cashflowTimelineY + 25)
          .attr("stroke", "#FF5722")
          .attr("stroke-width", 1.5)
          .attr("stroke-dasharray", "4,3");

        // Add "Today" label
        cashflowSvg
          .append("text")
          .attr("class", "today-label")
          .attr("x", todayX)
          .attr("y", cashflowTimelineY - 30)
          .attr("text-anchor", "middle")
          .attr("font-size", "11px")
          .attr("font-weight", "bold")
          .attr("fill", "#FF5722")
          .text("Today");

        // Add dot on timeline
        cashflowSvg
          .append("circle")
          .attr("class", "today-dot")
          .attr("cx", todayX)
          .attr("cy", cashflowTimelineY)
          .attr("r", 4)
          .attr("fill", "#FF5722")
          .attr("stroke", "white")
          .attr("stroke-width", 1)
          .on("mouseover", function (event) {
            d3.select(".cashflow-tooltip")
              .transition()
              .duration(200)
              .style("opacity", 0.9);
            
            d3.select(".cashflow-tooltip")
              .html(`Today: ${dateFormat(today)}`)
              .style("left", event.pageX + 10 + "px")
              .style("top", event.pageY - 28 + "px");
          })
          .on("mouseout", function () {
            d3.select(".cashflow-tooltip")
              .transition()
              .duration(500)
              .style("opacity", 0);
          });
      }

      // Create time axis with ticks
      const timeAxis = d3
        .axisBottom(timeScale)
        .ticks(10)
        .tickFormat(d3.timeFormat("%b %d"))
        .tickSize(5);

      // Add time axis
      cashflowSvg
        .append("g")
        .attr("class", "time-axis")
        .attr("transform", `translate(0, ${cashflowTimelineY})`)
        .call(timeAxis)
        .select(".domain")
        .remove();

      // Style tick lines
      cashflowSvg
        .selectAll(".time-axis line")
        .attr("stroke", "#ccc")
        .attr("stroke-dasharray", "2,2");

      // Style tick text
      cashflowSvg
        .selectAll(".time-axis text")
        .attr("font-size", "10px")
        .attr("dy", "1em");

      // Add year labels
      const startYear = startDate.getFullYear();
      const endYear = endDate.getFullYear();

      // Add start year label
      cashflowSvg
        .append("text")
        .attr("class", "year-label")
        .attr("x", timelineStart)
        .attr("y", cashflowTimelineY + 35)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .text(startYear);

      // Add end year label if different
      if (startYear !== endYear) {
        cashflowSvg
          .append("text")
          .attr("class", "year-label")
          .attr("x", timelineEnd)
          .attr("y", cashflowTimelineY + 35)
          .attr("text-anchor", "middle")
          .attr("font-size", "12px")
          .text(endYear);
      }
      
      // Add click area for adding new transactions
      cashflowSvg
        .append("rect")
        .attr("pointer-events", "all")
        .attr("x", timelineStart)
        .attr("y", cashflowTimelineY - 10)
        .attr("width", timelineEnd - timelineStart)
        .attr("height", 20)
        .attr("fill", "transparent")
        .style("cursor", "copy")
        .on("click", function (event) {
          const coords = d3.pointer(event);
          const clickX = coords[0];
          const clickDate = getDateFromPosition(clickX);
          
          if (isDateInRange(clickDate)) {
            // Add code here to open a form/modal to add a new cash flow transaction
            alert(`Add a new cash flow transaction on ${dateFormat(clickDate)}`);
            // This will be replaced with actual functionality to add new transactions
          }
        });
    } else {
      // Draw the chart with events
      drawCashFlowChart(visibleEvents);
    }
  }

  // Function to draw the cash flow chart
  function drawCashFlowChart(visibleEvents) {
    // Create the legend at the top of the chart section
    const legendItems = [
      { type: "recurringPayment", label: "Recurring Payment" },
      { type: "nonRecurringPayment", label: "Non-Recurring Payment" },
      { type: "invoice", label: "Invoice" },
      { type: "supplierPayment", label: "Supplier Payment" }
    ];

    // Populate the legend at the top
    const topLegend = d3.select("#cashflow-legend");
    topLegend.html(""); // Clear any existing content

    legendItems.forEach((item) => {
      const legendItem = topLegend.append("div").attr("class", "legend-item");

      legendItem
        .append("div")
        .attr("class", "color-box")
        .style("background-color", transactionColors[item.type]);

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

    // Create a timeline for cash flows at the top of the chart
    const timelineHeight = 150;
    const cashflowSvg = d3
      .select("#cashflow-chart")
      .append("svg")
      .attr("width", "100%")
      .attr("height", timelineHeight)
      .attr("viewBox", `0 0 ${svgWidth} ${timelineHeight}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    const cashflowTimelineY = 60;

    // Draw timeline
    cashflowSvg
      .append("line")
      .attr("class", "timeline")
      .attr("x1", timelineStart)
      .attr("x2", timelineEnd)
      .attr("y1", cashflowTimelineY)
      .attr("y2", cashflowTimelineY)
      .attr("stroke", "#ddd")
      .attr("stroke-width", 1);

    // Add "Today" indicator if current date is within the visible range
    const today = new Date();
    
    // Create date-only versions (without time) for comparison
    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    
    if (todayDateOnly >= startDateOnly && todayDateOnly <= endDateOnly) {
      const todayX = timeScale(today);

      // Add vertical line for today
      cashflowSvg
        .append("line")
        .attr("class", "today-line")
        .attr("x1", todayX)
        .attr("x2", todayX)
        .attr("y1", cashflowTimelineY - 25)
        .attr("y2", cashflowTimelineY + 25)
        .attr("stroke", "#FF5722")
        .attr("stroke-width", 1.5)
        .attr("stroke-dasharray", "4,3");

      // Add "Today" label
      cashflowSvg
        .append("text")
        .attr("class", "today-label")
        .attr("x", todayX)
        .attr("y", cashflowTimelineY - 30)
        .attr("text-anchor", "middle")
        .attr("font-size", "11px")
        .attr("font-weight", "bold")
        .attr("fill", "#FF5722")
        .text("Today");

      // Add dot on timeline
      cashflowSvg
        .append("circle")
        .attr("class", "today-dot")
        .attr("cx", todayX)
        .attr("cy", cashflowTimelineY)
        .attr("r", 4)
        .attr("fill", "#FF5722")
        .attr("stroke", "white")
        .attr("stroke-width", 1)
        .on("mouseover", function (event) {
          d3.select(".cashflow-tooltip")
            .transition()
            .duration(200)
            .style("opacity", 0.9);
          
          d3.select(".cashflow-tooltip")
            .html(`Today: ${dateFormat(today)}`)
            .style("left", event.pageX + 10 + "px")
            .style("top", event.pageY - 28 + "px");
        })
        .on("mouseout", function () {
          d3.select(".cashflow-tooltip")
            .transition()
            .duration(500)
            .style("opacity", 0);
        });
    }

    // Create time axis with ticks
    const timeAxis = d3
      .axisBottom(timeScale)
      .ticks(10)
      .tickFormat(d3.timeFormat("%b %d"))
      .tickSize(5);

    // Add time axis
    cashflowSvg
      .append("g")
      .attr("class", "time-axis")
      .attr("transform", `translate(0, ${cashflowTimelineY})`)
      .call(timeAxis)
      .select(".domain")
      .remove();

    // Style tick lines
    cashflowSvg
      .selectAll(".time-axis line")
      .attr("stroke", "#ccc")
      .attr("stroke-dasharray", "2,2");

    // Style tick text
    cashflowSvg
      .selectAll(".time-axis text")
      .attr("font-size", "10px")
      .attr("dy", "1em");

    // Add year labels (dynamically based on date range)
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();

    // Add start year label
    cashflowSvg
      .append("text")
      .attr("class", "year-label")
      .attr("x", timelineStart)
      .attr("y", cashflowTimelineY + 35)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .text(startYear);

    // Add end year label if different
    if (startYear !== endYear) {
      cashflowSvg
        .append("text")
        .attr("class", "year-label")
        .attr("x", timelineEnd)
        .attr("y", cashflowTimelineY + 35)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .text(endYear);
    }

    // Group cash flow events by date for visualization
    const groupedEvents = groupEventsByProximity(visibleEvents, 7); // 7 days proximity

    // Process the cash flow events on the timeline
    groupedEvents.forEach((group) => {
      // Get position for this group's date
      const position = timeScale(group.date);

      // Add a dot for this group's date
      cashflowSvg
        .append("circle")
        .attr("class", "timeline-point cashflow-point")
        .attr("cx", position)
        .attr("cy", cashflowTimelineY)
        .attr("r", 5)
        .attr("fill", "#666")
        .attr("data-date", group.date.toISOString())
        .datum(group) // Store the group data with the point for tooltip
        .on("mouseenter", function (event, d) {
          // Highlight the point
          d3.select(this).attr("r", 7);
          
          // Get event count
          const eventCount = d.events.length;
          
          // Count each type of event for the tooltip
          const eventTypes = {};
          d.events.forEach(e => {
            eventTypes[e.type] = (eventTypes[e.type] || 0) + 1;
          });
          
          // Create event type breakdown for tooltip
          let eventBreakdown = '';
          Object.keys(eventTypes).forEach(type => {
            let typeName = type;
            switch(type) {
              case 'recurringPayment': typeName = 'Recurring Payments'; break;
              case 'nonRecurringPayment': typeName = 'Non-Recurring Payments'; break;
              case 'invoice': typeName = 'Invoices'; break;
              case 'supplierPayment': typeName = 'Supplier Payments'; break;
            }
            eventBreakdown += `<div style="display:flex; justify-content:space-between; margin:2px 0">
              <span>${typeName}:</span> 
              <span>${eventTypes[type]}</span>
            </div>`;
          });
          
          // Create financial summary
          const netFlowColor = d.netFlow >= 0 ? "#2ecc71" : "#e74c3c";
          
          d3.select(".cashflow-tooltip")
            .transition()
            .duration(200)
            .style("opacity", 0.9);
            
          d3.select(".cashflow-tooltip")
            .html(`
              <div style="border-bottom:1px solid rgba(255,255,255,0.2); margin-bottom:6px; padding-bottom:6px">
                <strong style="font-size:15px">${dateFormat(d.date)}</strong>
              </div>
              <div style="display:flex; justify-content:space-between; font-weight:bold; margin-bottom:6px">
                <span>Total Events:</span> 
                <span>${eventCount}</span>
              </div>
              
              ${eventBreakdown}
              
              <div style="border-top:1px solid rgba(255,255,255,0.2); margin-top:6px; padding-top:6px">
                <div style="display:flex; justify-content:space-between; margin:2px 0">
                  <span>Total Inflows:</span> 
                  <span style="color:#2ecc71">$${d.totalInflow.toLocaleString()}</span>
                </div>
                <div style="display:flex; justify-content:space-between; margin:2px 0">
                  <span>Total Outflows:</span> 
                  <span style="color:#e74c3c">$${d.totalOutflow.toLocaleString()}</span>
                </div>
                <div style="display:flex; justify-content:space-between; margin:5px 0; font-weight:bold">
                  <span>Net Cash Flow:</span> 
                  <span style="color:${netFlowColor}">$${Math.abs(d.netFlow).toLocaleString()}${d.netFlow >= 0 ? ' (+)' : ' (-)'}</span>
                </div>
              </div>
            `)
            .style("left", event.pageX + 10 + "px")
            .style("top", event.pageY - 28 + "px");
        })
        .on("mouseleave", function () {
          // Reset point size
          d3.select(this).attr("r", 5);
          
          d3.select(".cashflow-tooltip")
            .transition()
            .duration(500)
            .style("opacity", 0);
        });

      // Add cash flow emojis with proper spacing
      const totalEvents = group.events.length;
      group.events.forEach((event, i) => {
        // Determine horizontal offset for multiple events
        let offsetX = 0;
        if (totalEvents > 1) {
          offsetX = (i - (totalEvents - 1) / 2) * 30;
        }

        // Get emoji type
        const emoji = transactionEmojis[event.type] || "💰";

        // Determine vertical position based on transaction type
        // Outgoing payments go above the line, incoming payments go below
        const verticalPosition = event.amount < 0
          ? cashflowTimelineY - 45 // Above the timeline (outgoing)
          : cashflowTimelineY + 35; // Below the timeline (incoming)

        // Create a group for the event (emoji + label)
        const eventGroup = cashflowSvg
          .append("g")
          .attr("data-id", event.id)
          .attr("transform", `translate(${position + offsetX}, ${verticalPosition})`)
          .style("cursor", "pointer")
          .datum(event); // Attach event data to the group

        // Add invisible circle for better hover area
        eventGroup
          .append("circle")
          .attr("class", "cashflow-hover-area")
          .attr("r", 20)
          .attr("cx", 0)
          .attr("cy", 0)
          .attr("fill", "transparent");

        // Add emoji with subtle animation
        eventGroup
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

        // Add event label
        eventGroup
          .append("text")
          .attr("class", "cashflow-label")
          .attr("x", 0)
          .attr("y", 30)
          .attr("text-anchor", "middle")
          .attr("font-size", "10px")
          .text(event.description.length > 15 
                ? event.description.substring(0, 15) + "..." 
                : event.description);

        // Add tooltip for more details
        eventGroup
          .on("mouseenter", function (event, d) {
            d3.select(".cashflow-tooltip")
              .transition()
              .duration(200)
              .style("opacity", 0.9)
              .style("transform", "scale(1)");

            // d is the event data
            const eventData = d;
            // Format event type for display
            let eventType = "";
            let eventTypeIcon = "";
            switch (eventData.type) {
              case "recurringPayment":
                eventType = "Recurring Payment";
                eventTypeIcon = "💼";
                break;
              case "nonRecurringPayment":
                eventType = "Non-Recurring Payment";
                eventTypeIcon = "📋";
                break;
              case "invoice":
                eventType = "Invoice";
                eventTypeIcon = "📥";
                break;
              case "supplierPayment":
                eventType = "Supplier Payment";
                eventTypeIcon = "📤";
                break;
              default:
                eventType = "Cash Flow Event";
                eventTypeIcon = "💰";
            }
            // Format amount with color based on direction (incoming/outgoing)
            const amountColor = eventData.amount >= 0 ? "#2ecc71" : "#e74c3c";
            const amountText = eventData.amount >= 0 ? "Incoming" : "Outgoing";
            // Get original data details based on event type
            let additionalDetails = "";
            if (eventData.originalData) {
              if (eventData.type === "recurringPayment") {
                additionalDetails = `
                  <div style="margin-top:8px; border-top:1px solid rgba(255,255,255,0.2); padding-top:8px">
                    <div>Monthly on day ${eventData.originalData.day_of_month}</div>
                  </div>
                `;
              } else if (eventData.type === "invoice") {
                additionalDetails = `
                  <div style="margin-top:8px; border-top:1px solid rgba(255,255,255,0.2); padding-top:8px">
                    <div>Client: ${eventData.originalData.client_name}</div>
                    <div>Invoice: ${eventData.originalData.invoice_code}</div>
                  </div>
                `;
              } else if (eventData.type === "supplierPayment") {
                additionalDetails = `
                  <div style="margin-top:8px; border-top:1px solid rgba(255,255,255,0.2); padding-top:8px">
                    <div>Supplier: ${eventData.originalData.supplier_name}</div>
                    <div>Invoice: ${eventData.originalData.invoice_code}</div>
                  </div>
                `;
              }
            }
            // Get days from today calculation
            const today = new Date();
            const diffTime = Math.abs(eventData.date - today);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const isPast = eventData.date < today;
            const daysText = isPast 
              ? `<div style="margin-top:8px; font-style:italic; opacity:0.8">${diffDays} days ago</div>` 
              : `<div style="margin-top:8px; font-style:italic; opacity:0.8">In ${diffDays} days</div>`;
            d3.select(".cashflow-tooltip")
              .html(`
                <div style="border-bottom:1px solid rgba(255,255,255,0.2); margin-bottom:8px; padding-bottom:6px">
                  <div style="font-size:16px; font-weight:bold; display:flex; align-items:center">
                    <span style="margin-right:8px">${eventTypeIcon}</span>
                    <span>${eventData.description}</span>
                  </div>
                  <div style="font-size:13px; opacity:0.9">${eventType}</div>
                </div>
                
                <div style="margin:5px 0">
                  <div>Date: <strong>${dateFormat(eventData.date)}</strong></div>
                  ${daysText}
                </div>
                
                <div style="display:flex; justify-content:space-between; align-items:center; margin:10px 0; padding:5px; background:rgba(0,0,0,0.2); border-radius:4px">
                  <span>Amount:</span>
                  <span style="color:${amountColor}; font-weight:bold; font-size:16px">
                    $${Math.abs(eventData.amount).toLocaleString()} 
                    <span style="font-size:12px">(${amountText})</span>
                  </span>
                </div>
                
                ${additionalDetails}
              `)
              .style("left", event.pageX + 15 + "px")
              .style("top", event.pageY - 100 + "px");
          })
          .on("mouseleave", function () {
            d3.select(".cashflow-tooltip")
              .transition()
              .duration(300)
              .style("opacity", 0)
              .style("transform", "scale(0.95)");
          });
      });
    });

    // Now draw the bar chart below the timeline
    const margin = { top: 20, right: 50, bottom: 80, left: 60 };
    const width = 1000 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    // Create SVG for bar chart
    const barChartSvg = d3
      .select("#cashflow-chart")
      .append("svg")
      .attr("width", "100%")
      .attr("height", height + margin.top + margin.bottom)
      .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Group events by type and date for the bar chart
    const eventsDataByDate = d3.groups(visibleEvents, d => d.date.toDateString());

    // Calculate cumulative values for stacked bars
    eventsDataByDate.forEach(dateGroup => {
      const date = dateGroup[0];
      const events = dateGroup[1];

      // Separate events into inflows and outflows
      const inflows = events.filter(e => e.amount > 0);
      const outflows = events.filter(e => e.amount < 0);

      // Sort events by type
      inflows.sort((a, b) => a.type.localeCompare(b.type));
      outflows.sort((a, b) => a.type.localeCompare(b.type));

      // Calculate cumulative positions
      let cumulativeInflow = 0;
      inflows.forEach(event => {
        event.stackStart = cumulativeInflow;
        cumulativeInflow += event.amount;
        event.stackEnd = cumulativeInflow;
      });

      let cumulativeOutflow = 0;
      outflows.forEach(event => {
        event.stackStart = cumulativeOutflow;
        cumulativeOutflow += Math.abs(event.amount);
        event.stackEnd = cumulativeOutflow;
      });
    });

    // Calculate min and max values for Y axis
    const maxInflow = d3.max(visibleEvents.filter(e => e.amount > 0), d => d.amount) || 0;
    const maxOutflow = d3.max(visibleEvents.filter(e => e.amount < 0), d => Math.abs(d.amount)) || 0;
    const maxValue = Math.max(maxInflow, maxOutflow) * 1.1;

    // Create Y scale
    const y = d3
      .scaleLinear()
      .domain([-maxValue, maxValue]) // Negative for outflows, positive for inflows
      .range([height, 0]);

    // Calculate zero line position
    const zeroLineY = y(0);

    // Create X scale (time-based)
    const xTime = d3
      .scaleTime()
      .domain([startDate, endDate])
      .range([0, width]);

    // Create time axis
    const barTimeAxis = d3
      .axisBottom(xTime)
      .ticks(10)
      .tickFormat(d3.timeFormat("%b %d"))
      .tickSize(5);

    // Add X axis
    barChartSvg
      .append("g")
      .attr("class", "time-axis")
      .attr("transform", `translate(0,${zeroLineY})`)
      .call(barTimeAxis);

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
    barChartSvg
      .append("g")
      .call(d3.axisLeft(y).tickFormat(d => `$${Math.abs(d)}`));

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

    // Add Y axis labels
    barChartSvg
      .append("text")
      .attr("x", -50)
      .attr("y", y(maxValue / 2))
      .attr("text-anchor", "end")
      .attr("font-size", "12px")
      .attr("fill", "#2ecc71")
      .text("Inflows");

    barChartSvg
      .append("text")
      .attr("x", -50)
      .attr("y", y(-maxValue / 2))
      .attr("text-anchor", "end")
      .attr("font-size", "12px")
      .attr("fill", "#e74c3c")
      .text("Outflows");

    // Add horizontal grid lines at regular intervals
    const yGridValues = [];
    const yTickCount = 8; // Number of horizontal grid lines

    // Calculate nice dollar values for grid lines
    const maxDisplayValue = Math.ceil(maxValue / 10000) * 10000; // Round to nearest $10,000
    const yTickStep = (maxDisplayValue * 2) / yTickCount;

    // Generate values for both inflows and outflows
    for (let i = 1; i <= yTickCount/2; i++) {
      // Positive values (inflows)
      yGridValues.push(i * yTickStep / 2);
      // Negative values (outflows)
      yGridValues.push(-i * yTickStep / 2);
    }

    // Add horizontal grid lines (behind everything else)
    yGridValues.forEach(value => {
      // Skip if too close to zero
      if (Math.abs(value) < yTickStep / 4) return;
      
      // Make gridlines darker for major divisions
      const isDivisibleBy10000 = Math.abs(value) % 10000 < 0.1;
      
      barChartSvg
        .append("line")
        .attr("class", "horizontal-grid-line")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", y(value))
        .attr("y2", y(value))
        .attr("stroke", isDivisibleBy10000 ? "#ddd" : "#eee") // Darker for major lines
        .attr("stroke-width", isDivisibleBy10000 ? 1 : 0.5)
        .attr("stroke-dasharray", isDivisibleBy10000 ? "3,3" : "2,4")
        .attr("opacity", 0.7);
    });

    // Calculate width for each bar based on the SAME groupedEvents used for timeline
    const uniqueDatesCount = groupedEvents.length;
    
    // Calculate bar width based on available space and date count
    const barWidthFactor = 0.5; // 50% of available space for bars (leaving more space between)
    const barWidth = Math.min(
      (width / Math.max(uniqueDatesCount, 12)) * barWidthFactor, 
      20  // Maximum bar width of 20px for clearer spacing
    );
    
    // Add spacing between bars
    const barSpacing = Math.min(barWidth * 0.4, 8); // More space between bars
    
    console.log(`Bar dimensions: ${uniqueDatesCount} dates, width=${barWidth}px, spacing=${barSpacing}px`);

    // Draw bars for each date group - using the SAME grouped events as the timeline
    groupedEvents.forEach(group => {
      const date = group.date; // Use the exact same date as the timeline point
      const events = group.events;
      const barX = xTime(date) - (barWidth / 2);

      // Draw inflow bars (positive values)
      events.filter(e => e.amount > 0).forEach(event => {
        const barHeight = y(0) - y(event.amount);
        
        barChartSvg
          .append("rect")
          .datum(event)
          .attr("class", "cashflow-bar-inflow")
          .attr("x", barX + barSpacing/2)
          .attr("y", y(event.amount))
          .attr("width", barWidth - barSpacing)
          .attr("height", barHeight)
          .attr("fill", transactionColors[event.type])
          .attr("opacity", 0.8)
          .attr("stroke", "#fff")
          .attr("stroke-width", 0.5)
          .attr("data-id", event.id)
          .attr("data-type", event.type)
          .attr("data-amount", event.amount)
          .attr("data-date", date.toISOString())
          .on("mouseenter", function (event, d) {
            const eventData = d;
            const dateStr = dateFormat(new Date(event.currentTarget.getAttribute("data-date")));
            
            d3.select(".cashflow-tooltip")
              .transition()
              .duration(200)
              .style("opacity", 0.9);
            
            // Get days from today calculation
            const today = new Date();
            const eventDate = new Date(event.currentTarget.getAttribute("data-date"));
            const diffTime = Math.abs(eventDate - today);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const isPast = eventDate < today;
            
            // Format additional details based on type
            let additionalDetails = "";
            
            if (eventData.originalData) {
              if (eventData.type === "invoice") {
                additionalDetails = `
                  <div style="border-top:1px solid rgba(255,255,255,0.2); margin-top:8px; padding-top:8px">
                    <div>Client: ${eventData.originalData.client_name}</div>
                    <div>Invoice: ${eventData.originalData.invoice_code}</div>
                    <div>Due date: ${dateFormat(new Date(eventData.originalData.due_date))}</div>
                  </div>
                `;
              }
            }
              
            d3.select(".cashflow-tooltip")
              .html(`
                <div style="border-bottom:1px solid rgba(255,255,255,0.2); margin-bottom:8px; padding-bottom:6px">
                  <div style="font-size:16px; font-weight:bold; display:flex; align-items:center">
                    <span style="margin-right:8px">📥</span>
                    <span>${eventData.description}</span>
                  </div>
                </div>
                
                <div>Date: <strong>${dateStr}</strong></div>
                <div style="font-style:italic; opacity:0.8; margin-bottom:8px">
                  ${isPast ? `${diffDays} days ago` : `In ${diffDays} days`}
                </div>
                
                <div style="display:flex; justify-content:space-between; align-items:center; margin:10px 0; padding:5px; background:rgba(46, 204, 113, 0.2); border-radius:4px">
                  <span>Amount:</span>
                  <span style="color:#2ecc71; font-weight:bold; font-size:16px">
                    $${Math.abs(eventData.amount).toLocaleString()} 
                    <span style="font-size:12px">(Incoming)</span>
                  </span>
                </div>
                
                ${additionalDetails}
              `)
              .style("left", event.pageX + 10 + "px")
              .style("top", event.pageY - 28 + "px");
          })
          .on("mouseleave", function () {
            d3.select(".cashflow-tooltip")
              .transition()
              .duration(500)
              .style("opacity", 0);
          });
      });

      // Draw outflow bars (negative values) 
      events.filter(e => e.amount < 0).forEach(event => {
        const barHeight = y(event.amount) - y(0);
        
        barChartSvg
          .append("rect")
          .datum(event)
          .attr("class", "cashflow-bar-outflow")
          .attr("x", barX + barSpacing/2)
          .attr("y", y(0))
          .attr("width", barWidth - barSpacing)
          .attr("height", barHeight)
          .attr("fill", transactionColors[event.type])
          .attr("opacity", 0.8)
          .attr("stroke", "#fff")
          .attr("stroke-width", 0.5)
          .attr("data-id", event.id)
          .attr("data-type", event.type)
          .attr("data-amount", event.amount)
          .attr("data-date", date.toISOString())
          .on("mouseenter", function (event, d) {
            const eventData = d;
            const dateStr = dateFormat(new Date(event.currentTarget.getAttribute("data-date")));
            
            d3.select(".cashflow-tooltip")
              .transition()
              .duration(200)
              .style("opacity", 0.9);
            
            // Get days from today calculation
            const today = new Date();
            const eventDate = new Date(event.currentTarget.getAttribute("data-date"));
            const diffTime = Math.abs(eventDate - today);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const isPast = eventDate < today;
            
            // Format additional details based on type
            let additionalDetails = "";
            let icon = "📤";
            
            if (eventData.originalData) {
              if (eventData.type === "recurringPayment") {
                icon = "💼";
                additionalDetails = `
                  <div style="border-top:1px solid rgba(255,255,255,0.2); margin-top:8px; padding-top:8px">
                    <div>Monthly on day ${eventData.originalData.day_of_month}</div>
                  </div>
                `;
              } else if (eventData.type === "supplierPayment") {
                additionalDetails = `
                  <div style="border-top:1px solid rgba(255,255,255,0.2); margin-top:8px; padding-top:8px">
                    <div>Supplier: ${eventData.originalData.supplier_name}</div>
                    <div>Invoice: ${eventData.originalData.invoice_code}</div>
                    <div>Due date: ${dateFormat(new Date(eventData.originalData.due_date))}</div>
                  </div>
                `;
              } else if (eventData.type === "nonRecurringPayment") {
                icon = "📋";
                additionalDetails = `
                  <div style="border-top:1px solid rgba(255,255,255,0.2); margin-top:8px; padding-top:8px">
                    <div>Payment date: ${dateFormat(new Date(eventData.originalData.payment_date))}</div>
                  </div>
                `;
              }
            }
              
            d3.select(".cashflow-tooltip")
              .html(`
                <div style="border-bottom:1px solid rgba(255,255,255,0.2); margin-bottom:8px; padding-bottom:6px">
                  <div style="font-size:16px; font-weight:bold; display:flex; align-items:center">
                    <span style="margin-right:8px">${icon}</span>
                    <span>${eventData.description}</span>
                  </div>
                </div>
                
                <div>Date: <strong>${dateStr}</strong></div>
                <div style="font-style:italic; opacity:0.8; margin-bottom:8px">
                  ${isPast ? `${diffDays} days ago` : `In ${diffDays} days`}
                </div>
                
                <div style="display:flex; justify-content:space-between; align-items:center; margin:10px 0; padding:5px; background:rgba(231, 76, 60, 0.2); border-radius:4px">
                  <span>Amount:</span>
                  <span style="color:#e74c3c; font-weight:bold; font-size:16px">
                    $${Math.abs(eventData.amount).toLocaleString()} 
                    <span style="font-size:12px">(Outgoing)</span>
                  </span>
                </div>
                
                ${additionalDetails}
              `)
              .style("left", event.pageX + 10 + "px")
              .style("top", event.pageY - 28 + "px");
          })
          .on("mouseleave", function () {
            d3.select(".cashflow-tooltip")
              .transition()
              .duration(500)
              .style("opacity", 0);
          });
      });

      // Add date label
      barChartSvg
        .append("text")
        .attr("class", "date-label")
        .attr("x", barX + barWidth / 2)
        .attr("y", height + 15)
        .attr("text-anchor", "middle")
        .attr("font-size", "9px")
        .attr("fill", "#333")
        .text(d3.timeFormat("%b %d")(date));
    });

    // Add a transparent overlay to the timeline for better interaction
    cashflowSvg
      .append("rect")
      .attr("x", timelineStart)
      .attr("y", cashflowTimelineY - 10)
      .attr("width", timelineEnd - timelineStart)
      .attr("height", 20)
      .attr("fill", "transparent");
  }

  // Initialize the chart when the DOM is loaded
  // Initialize the chart when the cash flow tab is shown on page load or clicked
  const cashflowTabButton = document.querySelector(".tab-button[data-tab='cashflow-timeline']");
  
  // Add tab switching initialization
  cashflowTabButton.addEventListener("click", function() {
    if (!this.classList.contains("initialized")) {
      initCashFlowChart();
      this.classList.add("initialized");
    }
  });
  
  // If the cash flow tab is already active on page load, initialize the chart
  if (cashflowTabButton.classList.contains("active")) {
    initCashFlowChart();
    cashflowTabButton.classList.add("initialized");
  }
  
  // Ensure we have tab switching functionality
  if (!window.tabSwitchingInitialized) {
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
        
        // Initialize the appropriate chart based on the tab
        if (tabId === "investment-timeline" && typeof initInvestmentChart === "function") {
          initInvestmentChart();
        } else if (tabId === "cashflow-timeline") {
          initCashFlowChart();
        }
      });
    });
    
    // Mark tab switching as initialized
    window.tabSwitchingInitialized = true;
  }

  // Create sample data for testing
  /*
  async function ensureSampleCashFlowData() {
    try {
      // Check if stores are empty
      const recurringPayments = await getAllData(STORES.recurringPayments);
      const nonRecurringPayments = await getAllData(STORES.nonRecurringPayments);
      const invoices = await getAllData(STORES.invoices);
      const supplierPayments = await getAllData(STORES.supplierPayments);
      
      // Only seed data if all stores are empty
      if (recurringPayments.length === 0 && 
          nonRecurringPayments.length === 0 && 
          invoices.length === 0 && 
          supplierPayments.length === 0) {
        console.log("Cash flow data stores are empty, adding sample data...");
        await seedSampleCashFlowData();
      } else {
        console.log("Cash flow data already exists, skipping sample data creation");
      }
    } catch (error) {
      console.error("Error checking or creating sample data:", error);
    }
  }

  // Add sample cash flow data
  async function seedSampleCashFlowData() {
    // Sample recurring monthly payments
    const sampleRecurringPayments = [
      {
        description: "Staff Salaries",
        amount: "15000",
        day_of_month: "1"
      },
    ];
    
    // Sample non-recurring payments
    const currentDate = new Date();
    const sampleNonRecurringPayments = [
      {
        description: "Annual Insurance",
        amount: "12000",
        payment_date: new Date(currentYear, currentMonth, currentDay + 45)
      },
    ];
    
    // Sample invoices (incoming payments)
    const sampleInvoices = [
      {
        invoice_code: "INV-001",
        client_name: "ABC Corporation",
        amount: "25000",
        due_date: new Date(currentYear, currentMonth, currentDay + 20)
      },
     
    ];
    
    // Sample supplier payments
    const sampleSupplierPayments = [
      {
        invoice_code: "SUP-001",
        supplier_name: "Office Supplies Co",
        amount: "2800",
        due_date: new Date(currentYear, currentMonth, currentDay + 10)
      },
      {
        invoice_code: "SUP-002",
        supplier_name: "Tech Hardware Inc",
        amount: "14500",
        due_date: new Date(currentYear, currentMonth, currentDay + 30)
      },
    ];
    
    // Add all sample data to database
    try {
      await Promise.all([
        ...sampleRecurringPayments.map(payment => addData(STORES.recurringPayments, payment)),
        ...sampleNonRecurringPayments.map(payment => addData(STORES.nonRecurringPayments, payment)),
        ...sampleInvoices.map(invoice => addData(STORES.invoices, invoice)),
        ...sampleSupplierPayments.map(payment => addData(STORES.supplierPayments, payment))
      ]);
      console.log("Sample cash flow data added successfully");
    } catch (error) {
      console.error("Error adding sample cash flow data:", error);
    }
  }
  */

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
        console.error(`Error getting data from ${storeName}:`, event.target.error);
        reject(event.target.error);
      };
    });
  }
}) 