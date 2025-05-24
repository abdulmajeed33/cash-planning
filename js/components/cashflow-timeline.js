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
 * @param {Function} config.deleteCashFlowEvent - Function to delete cash flow event
 * @param {Function} config.updateCashFlowEvent - Function to update cash flow event
 * @param {Function} config.updateCashFlowVisualization - Function to update visualization
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
    groupEventsByProximity,
    deleteCashFlowEvent,
    updateCashFlowEvent,
    updateCashFlowVisualization
  } = config;

  const { svgWidth, timelineStart, timelineEnd, timelineLength } = dimensions;
  const cashFlowTimelineHeight = 200;
  const cashFlowTimelineY = 100;

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
      renderEventGroup(group, groupIndex, eventGroups);
    });
  }

  function renderEventGroup(group, groupIndex, eventGroups) {
    const groupX = timeScale(group.date);
    const totalEvents = group.events.length;

    // // Add divider line between groups (except for first group)
    // if (groupIndex > 0) {
    //   const prevGroupX = timeScale(eventGroups[groupIndex - 1].date);
    //   const dividerX = (prevGroupX + groupX) / 2;

    //   // Extend divider lines to accommodate events above and below timeline
    //   const dividerTop = cashFlowTimelineY - 80; // Extended above for positive events
    //   const dividerBottom = cashFlowTimelineY + 80; // Extended below for negative events

    //   cashFlowSvg
    //     .append("line")
    //     .attr("class", "group-divider")
    //     .attr("x1", dividerX)
    //     .attr("x2", dividerX)
    //     .attr("y1", dividerTop)
    //     .attr("y2", dividerBottom)
    //     .attr("stroke", "#666")
    //     .attr("stroke-width", 1)
    //     .attr("stroke-dasharray", "3,3")
    //     .attr("opacity", 0.5);
    // }

    // Render each event in the group
    group.events.forEach((event, eventIndex) => {
      renderEvent(event, eventIndex, totalEvents, groupX);
    });
  }

  function renderEvent(event, index, totalEvents, position) {
    // Calculate vertical position based on amount sign
    const isPositive = event.amount > 0;
    const stackHeight = 25;
    const maxStackSize = 3;
    const stackIndex = index % maxStackSize;
    
    // Position above timeline for positive amounts, below for negative amounts
    let verticalOffset;
    if (isPositive) {
      // Above the timeline (negative Y offset)
      verticalOffset = -(stackIndex + 1) * stackHeight;
    } else {
      // Below the timeline (positive Y offset)
      verticalOffset = (stackIndex + 1) * stackHeight;
    }
    
    const verticalPosition = cashFlowTimelineY + verticalOffset;

    // Create event group
    const eventGroup = cashFlowSvg
      .append("g")
      .attr("class", "cashflow-event-group")
      .attr("data-event-id", event.id)
      .attr("data-event-type", event.type)
      .attr("transform", `translate(${position}, ${verticalPosition})`)
      .style("cursor", "pointer");

    // Add invisible circle for better hover area
    eventGroup
      .append("circle")
      .attr("class", "cashflow-hover-area")
      .attr("r", 20)
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("fill", "transparent");

    // Add event circle
    const eventCircle = eventGroup
      .append("circle")
      .attr("class", "cashflow-event-circle")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", 8)
      .attr("fill", transactionColors[event.type] || "#666")
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .attr("opacity", 0.9);

    // Add event emoji/icon
    eventGroup
      .append("text")
      .attr("class", "cashflow-event-emoji")
      .attr("x", 0)
      .attr("y", 1)
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("dy", "0.35em")
      .text(transactionEmojis[event.type] || "💰");

    // Add amount label - position based on whether event is above or below timeline
    const amountText = event.amount >= 0 ? `+$${event.amount.toLocaleString()}` : `-$${Math.abs(event.amount).toLocaleString()}`;
    const labelYOffset = isPositive ? -15 : 20; // Above circle for positive, below for negative
    
    eventGroup
      .append("text")
      .attr("class", "cashflow-event-amount")
      .attr("x", 0)
      .attr("y", labelYOffset)
      .attr("text-anchor", "middle")
      .attr("font-size", "9px")
      .attr("font-weight", "bold")
      .attr("fill", event.amount >= 0 ? "#2ecc71" : "#e74c3c")
      .text(amountText);

    // Add delete button functionality
    addDeleteButton(eventGroup, event);

    // Add tooltip functionality
    addTooltip(eventGroup, event);

    // Make event draggable
    addDragBehavior(eventGroup, event, position, verticalPosition);
  }

  function addDeleteButton(eventGroup, event) {
    // Determine if this is a positive (above timeline) or negative (below timeline) event
    const isPositive = event.amount > 0;
    
    // Position delete button appropriately - above for positive events, below for negative events
    const deleteButtonX = 24;
    const deleteButtonY = isPositive ? -18 : 18;
    
    // Add delete button (only visible on hover)
    const deleteButton = eventGroup
      .append("g")
      .attr("class", "delete-button-group")
      .attr("transform", `translate(${deleteButtonX}, ${deleteButtonY})`)
      .style("opacity", 0)
      .style("pointer-events", "none") // Initially disabled until hover
      .style("cursor", "pointer")
      .attr("data-fixed-position", "true") // Mark as fixed position element
      .raise(); // Ensure delete button stays on top

    // Add white background circle for the delete icon
    deleteButton
      .append("circle")
      .attr("r", 12)
      .attr("fill", "white")
      .attr("stroke", "#E53935")
      .attr("stroke-width", 1.5);

    // Add delete icon (X symbol) instead of emoji
    deleteButton
      .append("text")
      .attr("class", "delete-icon")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("font-size", "14px")
      .attr("font-weight", "bold")
      .attr("fill", "#E53935")
      .text("×")
      .style("pointer-events", "none");

    // Add click handler to the delete button group with stopImmediatePropagation
    deleteButton.on("click", function (clickEvent) {
      clickEvent.stopPropagation(); // Prevent triggering parent click events
      clickEvent.preventDefault();
      clickEvent.stopImmediatePropagation();
      deleteCashFlowEvent(event);
    });

    return deleteButton;
  }

  function addTooltip(eventGroup, event) {
    const deleteButton = eventGroup.select(".delete-button-group");

    eventGroup
      .on("mouseenter", function (mouseEvent) {
        // Prevent event bubbling
        mouseEvent.stopPropagation();

        // Stop any ongoing transitions to prevent juggling
        deleteButton.interrupt();

        // Show delete button on hover with no animation
        deleteButton.style("opacity", 1).style("pointer-events", "all");

        tooltip
          .interrupt() // Stop any ongoing tooltip transitions
          .transition()
          .duration(200)
          .style("opacity", 0.9)
          .style("transform", "scale(1)");

        const tooltipContent = `
          <strong>${event.description}</strong><br>
          <strong>Type:</strong> ${getEventTypeLabel(event.type)}<br>
          <strong>Amount:</strong> ${event.amount >= 0 ? '+' : ''}$${event.amount.toLocaleString()}<br>
          <strong>Date:</strong> ${dateFormat(event.date)}
          <br/><span style="font-size: 0.8em; color: #666;">(Click × to delete)</span>
        `;

        tooltip
          .html(tooltipContent)
          .style("left", mouseEvent.pageX + 30 + "px")
          .style("top", mouseEvent.pageY - 108 + "px");
      })
      .on("mouseleave", function () {
        // Stop any ongoing transitions
        deleteButton.interrupt();

        // Hide delete button when not hovering with no animation
        deleteButton.style("opacity", 0).style("pointer-events", "none");

        tooltip
          .interrupt() // Stop any ongoing tooltip transitions
          .transition()
          .duration(300)
          .style("opacity", 0)
          .style("transform", "scale(0.95)");
      });
  }

  function addDragBehavior(eventGroup, event, position, verticalPosition) {
    // Make event draggable
    eventGroup.call(
      d3
        .drag()
        .filter(function (dragEvent) {
          // Only initiate drag if not clicking on the delete button
          return (
            !dragEvent.target.closest(".delete-button-group") &&
            !dragEvent.target.closest(".delete-icon")
          );
        })
        .on("start", function (dragEvent) {
          // Prevent browser's default drag behavior
          dragEvent.sourceEvent.preventDefault();
          dragEvent.sourceEvent.stopPropagation();

          // Hide all delete buttons during drag to prevent interference
          d3.selectAll(".delete-button-group")
            .style("opacity", 0)
            .style("pointer-events", "none");

          d3.select(this)
            .style("cursor", "grabbing")
            .raise() // Bring to front
            .classed("dragging", true); // Add class for styles

          // Get connector color based on event type
          const connectorColor = transactionColors[event.type] || "#666";

          // Create the triangle connector
          const connector = cashFlowSvg
            .append("path")
            .attr("class", "drag-connector")
            .attr("stroke", connectorColor)
            .attr("stroke-width", 2)
            .attr("fill", "none");

          // Add visual indicator for current date
          cashFlowSvg
            .append("circle")
            .attr("class", "current-date-indicator")
            .attr("cx", timeScale(event.date))
            .attr("cy", cashFlowTimelineY)
            .attr("r", 8)
            .attr("fill", "none")
            .attr("stroke", connectorColor)
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "3,2");
        })
        .on("drag", function (dragEvent) {
          // Update position while dragging
          const x = dragEvent.x;
          const y = dragEvent.y;

          d3.select(this).attr("transform", `translate(${x}, ${y})`);

          // Get target date at current position
          const targetDate = getDateFromPosition(x);

          // Show date label during drag
          dateLabel
            .style("opacity", 1)
            .html(dateFormat(targetDate))
            .style("left", dragEvent.sourceEvent.pageX + 10 + "px")
            .style("top", dragEvent.sourceEvent.pageY - 30 + "px");

          // Update the connector
          const trianglePath = `M ${x} ${y} L ${timeScale(event.date)} ${cashFlowTimelineY}`;
          cashFlowSvg.select(".drag-connector").attr("d", trianglePath);

          // Remove previous target indicator
          cashFlowSvg.selectAll(".target-date-indicator").remove();

          // Don't highlight dates beyond the end date
          if (isDateInRange(targetDate)) {
            // Get color based on event type
            const indicatorColor = transactionColors[event.type] || "#666";
            const fillColor = `rgba(${parseInt(indicatorColor.slice(1, 3), 16)}, ${parseInt(indicatorColor.slice(3, 5), 16)}, ${parseInt(indicatorColor.slice(5, 7), 16)}, 0.2)`;

            // Add visual indicator for target date
            cashFlowSvg
              .append("circle")
              .attr("class", "target-date-indicator")
              .attr("cx", timeScale(targetDate))
              .attr("cy", cashFlowTimelineY)
              .attr("r", 8)
              .attr("fill", fillColor)
              .attr("stroke", indicatorColor)
              .attr("stroke-width", 1.5);
          }
        })
        .on("end", function (dragEvent) {
          // Hide date label
          dateLabel.style("opacity", 0);

          // Determine date at drop position
          const newDate = getDateFromPosition(dragEvent.x);

          // Update data if date changed and is in range
          if (
            newDate.getTime() !== event.date.getTime() &&
            isDateInRange(newDate)
          ) {
            // Store original date for comparison
            const originalDate = new Date(event.date);

            // Update date
            event.date = new Date(newDate);

            // Add subtle feedback animation
            d3.select(this)
              .style("transform", "scale(1.2)")
              .transition()
              .duration(300)
              .style("transform", "scale(1)");

            // Clear any existing timeouts
            if (window.cashFlowUpdateTimeout) {
              clearTimeout(window.cashFlowUpdateTimeout);
            }

            // Update the cash flow event in the database
            if (updateCashFlowEvent) {
              updateCashFlowEvent(event);
            }

            // Force complete redraw with a small delay to ensure animations complete
            window.cashFlowUpdateTimeout = setTimeout(() => {
              updateCashFlowVisualization();
            }, 50);

            // Show feedback about change
            tooltip.transition().duration(200).style("opacity", 0.9);
            tooltip
              .html(
                `
                  <strong>Moved to ${dateFormat(newDate)}</strong><br/>
                  Event date updated
                `
              )
              .style("left", dragEvent.sourceEvent.pageX + 10 + "px")
              .style("top", dragEvent.sourceEvent.pageY - 28 + "px");

            setTimeout(() => {
              tooltip.transition().duration(500).style("opacity", 0);
            }, 3000);
          } else if (isDateInRange(newDate)) {
            // If only the vertical position changed but date is the same,
            // we still want to force a redraw to ensure proper position
            updateCashFlowVisualization();
          } else {
            // If no change or invalid target, reset position
            updateCashFlowVisualization();
          }

          // Remove the connector and indicators
          cashFlowSvg.select(".drag-connector").remove();
          cashFlowSvg.select(".current-date-indicator").remove();
          cashFlowSvg.select(".target-date-indicator").remove();

          // Reset cursor
          d3.select(this).style("cursor", "grab");
        })
    );
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
      config.events = newEvents;
      renderCashFlowEvents();
    },
    
    destroy: function() {
      cashFlowSvg.remove();
    },
    
    getSvg: function() {
      return cashFlowSvg;
    }
  };
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createCashFlowTimeline };
} 