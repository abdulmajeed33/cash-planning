/**
 * Cash Flow Timeline Component
 * A reusable component for rendering operational cash flow timelines with interactive features
 */

/**
 * Creates and renders a cash flow timeline with events
 * @param {Object} config - Configuration object
 * @param {string} config.containerId - ID of the container element
 * @param {Array} config.events - Array of cash flow event data
 * @param {Object} config.timeScale - D3 time scale function
 * @param {Date} config.startDate - Start date of the timeline
 * @param {Date} config.endDate - End date of the timeline
 * @param {Object} config.dimensions - Dimensions object with svgWidth, timelineStart, timelineEnd, timelineLength
 * @param {Object} config.tooltip - D3 tooltip element
 * @param {Object} config.dateLabel - D3 date label element for dragging
 * @param {Object} config.transactionEmojis - Emoji mapping for transaction types
 * @param {Object} config.transactionColors - Color mapping for transaction types
 * @param {Function} config.dateFormat - Date formatting function
 * @param {Function} config.getDateFromPosition - Function to get date from x position
 * @param {Function} config.isDateInRange - Function to check if date is in range
 * @param {Function} config.groupEventsByProximity - Function to group events by proximity
 * @returns {Object} - Object with update and destroy methods
 */
function createCashFlowTimeline(config) {
  const {
    containerId,
    events: visibleEvents,
    timeScale,
    startDate,
    endDate,
    dimensions,
    tooltip,
    dateLabel,
    transactionEmojis,
    transactionColors,
    dateFormat,
    getDateFromPosition,
    isDateInRange,
    groupEventsByProximity
  } = config;

  const { svgWidth, timelineStart, timelineEnd, timelineLength } = dimensions;
  const cashFlowTimelineHeight = 150;
  const cashFlowTimelineY = 60;

  // Create SVG for cash flow timeline
  const cashFlowSvg = d3
    .select(`#${containerId}`)
    .append("svg")
    .attr("width", "100%")
    .attr("height", cashFlowTimelineHeight)
    .attr("viewBox", `0 0 ${svgWidth} ${cashFlowTimelineHeight}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .attr("class", "cashflow-timeline-svg");

  // Draw main timeline
  cashFlowSvg
    .append("line")
    .attr("class", "timeline")
    .attr("x1", timelineStart)
    .attr("x2", timelineEnd)
    .attr("y1", cashFlowTimelineY)
    .attr("y2", cashFlowTimelineY)
    .attr("stroke", "#ddd")
    .attr("stroke-width", 1);

  // Add "Today" indicator if current date is within the visible range
  addTodayIndicator();

  // Create and add time axis
  createTimeAxis();

  // Add year labels
  addYearLabels();

  // Process and render cash flow events
  renderCashFlowEvents();

  function addTodayIndicator() {
    const today = new Date();
    
    // Create date-only versions (without time) for comparison
    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    
    if (todayDateOnly >= startDateOnly && todayDateOnly <= endDateOnly) {
      const todayX = timeScale(today);

      // Add vertical line for today
      cashFlowSvg
        .append("line")
        .attr("class", "today-line")
        .attr("x1", todayX)
        .attr("x2", todayX)
        .attr("y1", cashFlowTimelineY - 25)
        .attr("y2", cashFlowTimelineY + 25)
        .attr("stroke", "#FF5722")
        .attr("stroke-width", 1.5)
        .attr("stroke-dasharray", "4,3");

      // Add "Today" label
      cashFlowSvg
        .append("text")
        .attr("class", "today-label")
        .attr("x", todayX)
        .attr("y", cashFlowTimelineY - 30)
        .attr("text-anchor", "middle")
        .attr("font-size", "11px")
        .attr("font-weight", "bold")
        .attr("fill", "#FF5722")
        .text("Today");

      // Add dot on timeline
      cashFlowSvg
        .append("circle")
        .attr("class", "today-dot")
        .attr("cx", todayX)
        .attr("cy", cashFlowTimelineY)
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
  }

  function createTimeAxis() {
    // Create time axis with ticks every month
    const timeAxis = d3
      .axisBottom(timeScale)
      .ticks(10) // Use fixed number of ticks instead of month-based ticks
      .tickFormat(d3.timeFormat("%b %d")) // Show date with month
      .tickSize(5);

    // Add time axis
    cashFlowSvg
      .append("g")
      .attr("class", "time-axis")
      .attr("transform", `translate(0, ${cashFlowTimelineY})`)
      .call(timeAxis)
      .select(".domain")
      .remove();

    // Style tick lines
    cashFlowSvg
      .selectAll(".time-axis line")
      .attr("stroke", "#ccc")
      .attr("stroke-dasharray", "2,2");

    // Style tick text
    cashFlowSvg
      .selectAll(".time-axis text")
      .attr("font-size", "10px")
      .attr("dy", "1em");
  }

  function addYearLabels() {
    // Add year labels (dynamically based on date range)
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();

    // Add start year label
    cashFlowSvg
      .append("text")
      .attr("class", "year-label")
      .attr("x", timelineStart)
      .attr("y", cashFlowTimelineY + 35)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .text(startYear);

    // Add end year label
    if (startYear !== endYear) {
      cashFlowSvg
        .append("text")
        .attr("class", "year-label")
        .attr("x", timelineEnd)
        .attr("y", cashFlowTimelineY + 35)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .text(endYear);

      // Add intermediate year labels
      for (let year = startYear + 1; year < endYear; year++) {
        const yearDate = new Date(year, 0, 1);
        if (yearDate >= startDate && yearDate <= endDate) {
          const xPos = timeScale(yearDate);

          cashFlowSvg
            .append("text")
            .attr("class", "year-label")
            .attr("x", xPos)
            .attr("y", cashFlowTimelineY + 35)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .text(year);
        }
      }
    }
  }

  function renderCashFlowEvents() {
    if (!visibleEvents || visibleEvents.length === 0) {
      return;
    }

    // Group events by proximity
    const eventGroups = groupEventsByProximity(visibleEvents, 7); // 7 day threshold

    // Render each group
    eventGroups.forEach((group, groupIndex) => {
      renderEventGroup(group, groupIndex);
    });
  }

  function renderEventGroup(group, groupIndex) {
    const groupX = timeScale(group.date);
    const totalEvents = group.events.length;

    // Add divider line between groups (except for first group)
    if (groupIndex > 0) {
      const prevGroupX = timeScale(eventGroups[groupIndex - 1].date);
      const dividerX = (prevGroupX + groupX) / 2;

      cashFlowSvg
        .append("line")
        .attr("class", "group-divider")
        .attr("x1", dividerX)
        .attr("x2", dividerX)
        .attr("y1", cashFlowTimelineY - 40)
        .attr("y2", cashFlowTimelineY + 40)
        .attr("stroke", "#666")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "3,3")
        .attr("opacity", 0.5);
    }

    // Render each event in the group
    group.events.forEach((event, eventIndex) => {
      renderEvent(event, eventIndex, totalEvents, groupX);
    });
  }

  function renderEvent(event, index, totalEvents, position) {
    // Calculate vertical position for stacking
    const stackHeight = 25;
    const maxStackSize = 3;
    const stackIndex = index % maxStackSize;
    const verticalOffset = (stackIndex - Math.floor(maxStackSize / 2)) * stackHeight;
    const verticalPosition = cashFlowTimelineY + verticalOffset;

    // Create event group
    const eventGroup = cashFlowSvg
      .append("g")
      .attr("class", "cashflow-event-group")
      .attr("data-event-id", event.id)
      .attr("data-event-type", event.type);

    // Add event circle
    const eventCircle = eventGroup
      .append("circle")
      .attr("class", "cashflow-event-circle")
      .attr("cx", position)
      .attr("cy", verticalPosition)
      .attr("r", 8)
      .attr("fill", transactionColors[event.type] || "#666")
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .attr("opacity", 0.9);

    // Add event emoji/icon
    eventGroup
      .append("text")
      .attr("class", "cashflow-event-emoji")
      .attr("x", position)
      .attr("y", verticalPosition + 1)
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("dy", "0.35em")
      .text(transactionEmojis[event.type] || "💰");

    // Add amount label
    const amountText = event.amount >= 0 ? `+$${event.amount.toLocaleString()}` : `-$${Math.abs(event.amount).toLocaleString()}`;
    eventGroup
      .append("text")
      .attr("class", "cashflow-event-amount")
      .attr("x", position)
      .attr("y", verticalPosition + (verticalOffset > 0 ? 20 : -15))
      .attr("text-anchor", "middle")
      .attr("font-size", "9px")
      .attr("font-weight", "bold")
      .attr("fill", event.amount >= 0 ? "#2ecc71" : "#e74c3c")
      .text(amountText);

    // Add tooltip
    addTooltip(eventGroup, event);

    // Add hover effects
    eventGroup
      .on("mouseenter", function () {
        d3.select(this).select(".cashflow-event-circle")
          .transition()
          .duration(200)
          .attr("r", 10)
          .attr("opacity", 1);
      })
      .on("mouseleave", function () {
        d3.select(this).select(".cashflow-event-circle")
          .transition()
          .duration(200)
          .attr("r", 8)
          .attr("opacity", 0.9);
      });
  }

  function addTooltip(eventGroup, event) {
    eventGroup
      .on("mouseover", function (mouseEvent) {
        tooltip.transition().duration(200).style("opacity", 0.9);

        const tooltipContent = `
          <strong>${event.description}</strong><br>
          <strong>Type:</strong> ${getEventTypeLabel(event.type)}<br>
          <strong>Amount:</strong> ${event.amount >= 0 ? '+' : ''}$${event.amount.toLocaleString()}<br>
          <strong>Date:</strong> ${dateFormat(event.date)}
        `;

        tooltip
          .html(tooltipContent)
          .style("left", mouseEvent.pageX + 10 + "px")
          .style("top", mouseEvent.pageY - 28 + "px");
      })
      .on("mouseout", function () {
        tooltip.transition().duration(500).style("opacity", 0);
      });
  }

  function getEventTypeLabel(type) {
    const typeLabels = {
      'recurringPayment': 'Recurring Payment',
      'nonRecurringPayment': 'Non-Recurring Payment',
      'invoice': 'Invoice',
      'supplierPayment': 'Supplier Payment'
    };
    return typeLabels[type] || type;
  }

  // Return object with methods for external control
  return {
    update: function(newEvents) {
      // Remove existing events
      cashFlowSvg.selectAll(".cashflow-event-group").remove();
      cashFlowSvg.selectAll(".group-divider").remove();
      
      // Update events and re-render
      visibleEvents = newEvents;
      renderCashFlowEvents();
    },
    
    destroy: function() {
      cashFlowSvg.remove();
    }
  };
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createCashFlowTimeline };
} 