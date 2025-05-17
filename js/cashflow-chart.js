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
    
    endDate = new Date(now);
    startDate = new Date(now);
    startDate.setMonth(now.getMonth() - 1); // Go back 1 month
    
    updateInputsAndChart();
  }
  
  function set3Months() {
    const now = new Date();
    
    endDate = new Date(now);
    startDate = new Date(now);
    startDate.setMonth(now.getMonth() - 3); // Go back 3 months
    
    updateInputsAndChart();
  }
  
  function set6Months() {
    const now = new Date();
    
    endDate = new Date(now);
    startDate = new Date(now);
    startDate.setMonth(now.getMonth() - 6); // Go back 6 months
    
    updateInputsAndChart();
  }
  
  function set1Year() {
    const now = new Date();
    
    endDate = new Date(now);
    startDate = new Date(now);
    startDate.setFullYear(now.getFullYear() - 1); // Go back 1 year
    
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
        .style("transform", "scale(0.95)");
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

  // Group cash flow events by date proximity for visualization
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
        };
        groups.push(currentGroup);
      } else {
        // Check if this event is close to the current group
        const groupAvgTime = currentGroup.date.getTime();
        const daysDiff = Math.abs(eventTime - groupAvgTime) / (1000 * 60 * 60 * 24);
        
        if (daysDiff <= dayThreshold) {
          // Add to current group
          currentGroup.events.push(event);
          
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
          };
          groups.push(currentGroup);
        }
      }
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
        .text("No cash flow events in the selected period.");
      return;
    }
    
    // Draw the chart
    drawCashFlowChart(visibleEvents);
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
        .attr("data-date", group.date.toISOString());

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
          .style("cursor", "pointer");

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
          .on("mouseenter", function (event) {
            d3.select(".cashflow-tooltip")
              .transition()
              .duration(200)
              .style("opacity", 0.9)
              .style("transform", "scale(1)");

            // Format event type for display
            let eventType = "";
            switch (event.currentTarget.__data__.type) {
              case "recurringPayment":
                eventType = "Recurring Payment";
                break;
              case "nonRecurringPayment":
                eventType = "Non-Recurring Payment";
                break;
              case "invoice":
                eventType = "Invoice";
                break;
              case "supplierPayment":
                eventType = "Supplier Payment";
                break;
              default:
                eventType = "Cash Flow Event";
            }

            d3.select(".cashflow-tooltip")
              .html(`
                <strong>${event.currentTarget.__data__.description}</strong><br/>
                Type: <strong>${eventType}</strong><br/>
                Date: <strong>${dateFormat(event.currentTarget.__data__.date)}</strong><br/>
                Amount: <strong>$${Math.abs(event.currentTarget.__data__.amount).toLocaleString()}</strong>
                ${event.currentTarget.__data__.amount < 0 ? " (Outgoing)" : " (Incoming)"}
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
      .attr("x", -25)
      .attr("y", y(maxValue / 2))
      .attr("text-anchor", "end")
      .attr("font-size", "12px")
      .attr("fill", "#2ecc71")
      .text("Inflows");

    barChartSvg
      .append("text")
      .attr("x", -25)
      .attr("y", y(-maxValue / 2))
      .attr("text-anchor", "end")
      .attr("font-size", "12px")
      .attr("fill", "#e74c3c")
      .text("Outflows");

    // Calculate width for each bar
    const barWidthFactor = 0.8; // 80% of available space
    const barWidth = Math.min(width / (visibleEvents.length + 1) * barWidthFactor, 60);

    // Draw bars for each date group
    eventsDataByDate.forEach(dateGroup => {
      const dateStr = dateGroup[0];
      const events = dateGroup[1];
      const date = events[0].date; // All events in this group have the same date
      const barX = xTime(date) - barWidth / 2;

      // Draw inflow bars (positive values)
      events.filter(e => e.amount > 0).forEach(event => {
        const barHeight = y(0) - y(event.amount);
        
        barChartSvg
          .append("rect")
          .attr("class", "cashflow-bar-inflow")
          .attr("x", barX)
          .attr("y", y(event.amount))
          .attr("width", barWidth)
          .attr("height", barHeight)
          .attr("fill", transactionColors[event.type])
          .attr("opacity", 0.8)
          .attr("stroke", "#fff")
          .attr("stroke-width", 0.5)
          .attr("data-id", event.id)
          .attr("data-type", event.type)
          .attr("data-amount", event.amount)
          .attr("data-date", date.toISOString())
          .on("mouseenter", function (event) {
            d3.select(".cashflow-tooltip")
              .transition()
              .duration(200)
              .style("opacity", 0.9);
              
            d3.select(".cashflow-tooltip")
              .html(`
                <strong>${event.currentTarget.__data__.description}</strong><br>
                <strong>Date: ${dateFormat(date)}</strong><br>
                <strong>Amount: $${Math.abs(event.currentTarget.__data__.amount).toLocaleString()} (Incoming)</strong>
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
          .attr("class", "cashflow-bar-outflow")
          .attr("x", barX)
          .attr("y", y(0))
          .attr("width", barWidth)
          .attr("height", barHeight)
          .attr("fill", transactionColors[event.type])
          .attr("opacity", 0.8)
          .attr("stroke", "#fff")
          .attr("stroke-width", 0.5)
          .attr("data-id", event.id)
          .attr("data-type", event.type)
          .attr("data-amount", event.amount)
          .attr("data-date", date.toISOString())
          .on("mouseenter", function (event) {
            d3.select(".cashflow-tooltip")
              .transition()
              .duration(200)
              .style("opacity", 0.9);
              
            d3.select(".cashflow-tooltip")
              .html(`
                <strong>${event.currentTarget.__data__.description}</strong><br>
                <strong>Date: ${dateFormat(date)}</strong><br>
                <strong>Amount: $${Math.abs(event.currentTarget.__data__.amount).toLocaleString()} (Outgoing)</strong>
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

    // Calculate running balance
    const balanceData = calculateRunningBalance(visibleEvents, openingBalance);

    // Create a line generator for the balance
    const line = d3.line()
      .x(d => xTime(d.date))
      .y(d => y(d.balance))
      .curve(d3.curveMonotoneX);

    // Draw the balance line
    barChartSvg
      .append("path")
      .datum(balanceData)
      .attr("class", "closing-balance-line")
      .attr("d", line);

    // Add balance data points
    barChartSvg
      .selectAll(".balance-point")
      .data(balanceData.filter(d => d.event)) // Only add points for actual events
      .enter()
      .append("circle")
      .attr("class", "balance-point")
      .attr("cx", d => xTime(d.date))
      .attr("cy", d => y(d.balance))
      .attr("r", 4)
      .attr("fill", "#FF9800")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .on("mouseenter", function (event, d) {
        d3.select(".cashflow-tooltip")
          .transition()
          .duration(200)
          .style("opacity", 0.9);
          
        d3.select(".cashflow-tooltip")
          .html(`
            <strong>Date: ${dateFormat(d.date)}</strong><br>
            <strong>Balance: $${d.balance.toLocaleString()}</strong><br>
            <hr style="margin: 5px 0; opacity: 0.3">
            <span style="font-size: 0.9em;">After ${d.event.amount > 0 ? "receiving" : "paying"} 
            $${Math.abs(d.event.amount).toLocaleString()} for ${d.event.description}</span>
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