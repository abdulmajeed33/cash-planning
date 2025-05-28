/**
 * Investment Timeline Component
 * A reusable component for rendering investment transaction timelines with interactive features
 */

/**
 * Creates and renders an investment timeline with transactions
 * @param {Object} config - Configuration object
 * @param {string} config.containerId - ID of the container element
 * @param {Array} config.transactions - Array of transaction data
 * @param {Object} config.timeScale - D3 time scale function
 * @param {Date} config.startDate - Start date of the timeline
 * @param {Date} config.endDate - End date of the timeline
 * @param {Object} config.dimensions - Dimensions object with svgWidth, timelineStart, timelineEnd, timelineLength
 * @param {Object} config.tooltip - D3 tooltip element
 * @param {Object} config.dateLabel - D3 date label element for dragging
 * @param {Object} config.transactionEmojis - Emoji mapping for transaction types
 * @param {Function} config.dateFormat - Date formatting function
 * @param {Function} config.getDateFromPosition - Function to get date from x position
 * @param {Function} config.isDateInRange - Function to check if date is in range
 * @param {Function} config.groupTransactionsByProximity - Function to group transactions by proximity
 * @param {Function} config.showTransactionModal - Function to show transaction modal
 * @param {Function} config.deleteTransaction - Function to delete transaction
 * @param {Function} config.updateInvestmentVisualization - Function to update visualization
 * @param {Function} config.highlightBarSegmentForTransaction - Function to highlight bar segment
 * @returns {Object} - Object with update and destroy methods
 */
function createInvestmentTimeline(config) {
  const {
    containerId,
    transactions: visibleTransactions,
    timeScale,
    startDate,
    endDate,
    dimensions,
    tooltip,
    dateLabel,
    transactionEmojis,
    dateFormat,
    getDateFromPosition,
    isDateInRange,
    groupTransactionsByProximity,
    showTransactionModal,
    deleteTransaction,
    updateInvestmentVisualization,
    highlightBarSegmentForTransaction
  } = config;

  const { svgWidth, timelineStart, timelineEnd, timelineLength } = dimensions;
  const investmentTimelineHeight = 150;
  const investmentTimelineY = 60;

  // Create SVG for investment timeline
  const investmentSvg = d3
    .select(`#${containerId}`)
    .append("svg")
    .attr("width", "100%")
    .attr("height", investmentTimelineHeight)
    .attr("viewBox", `0 0 ${svgWidth} ${investmentTimelineHeight}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .attr("class", "investment-timeline-svg");

  // Draw main timeline
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
  addTodayIndicator();

  // Create and add time axis
  createTimeAxis();

  // Add year labels
  addYearLabels();

  // Add click area for adding new transactions
  addClickArea();

  // Process and render transactions
  renderTransactions();

  function addTodayIndicator() {
    const today = new Date();
    
    // Create date-only versions (without time) for comparison
    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    
    if (todayDateOnly >= startDateOnly && todayDateOnly <= endDateOnly) {
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
  }

  function createTimeAxis() {
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
  }

  function addYearLabels() {
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
  }

  function addClickArea() {
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
  }

  function renderTransactions() {
    // Group investment transactions by date for visualization
    const groupedTransactions = groupTransactionsByProximity(
      visibleTransactions,
      14
    ); // 14 days proximity

    // Process the investment transactions on the timeline
    groupedTransactions.forEach((group) => {
      renderTransactionGroup(group);
    });
  }

  function renderTransactionGroup(group) {
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
      .attr("fill", dotColor)
      .attr("data-entity-name", group.transactions[0].name)
      .attr("data-transaction-id", group.transactions[0].id)
      .attr("data-date", group.date.toISOString())
      .attr("data-id", group.transactions[0].id);

    // Add transaction emojis with proper spacing
    const totalTransactions = group.transactions.length;
    group.transactions.forEach((transaction, i) => {
      renderTransaction(transaction, i, totalTransactions, position);
    });
  }

  function renderTransaction(transaction, index, totalTransactions, position) {
    // Determine horizontal offset for multiple transactions
    let offsetX = 0;
    if (totalTransactions > 1) {
      offsetX = (index - (totalTransactions - 1) / 2) * 30;
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
        transaction.id ? Number(transaction.id) : index
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

    // Add delete button functionality
    addDeleteButton(transactionGroup, transaction);

    // Add tooltip functionality
    addTooltip(transactionGroup, transaction);

    // Make transaction draggable
    addDragBehavior(transactionGroup, transaction, position, verticalPosition);
  }

  function addDeleteButton(transactionGroup, transaction) {
    // Add delete button (only visible on hover)
    const deleteButton = transactionGroup
      .append("g")
      .attr("class", "delete-button-group")
      .attr("transform", "translate(24, -18)")
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
    deleteButton.on("click", function (event) {
      event.stopPropagation(); // Prevent triggering parent click events
      event.preventDefault();
      event.stopImmediatePropagation();
      deleteTransaction(transaction.id);
    });

    return deleteButton;
  }

  function addTooltip(transactionGroup, transaction) {
    const deleteButton = transactionGroup.select(".delete-button-group");

    // Add enhanced tooltip
    transactionGroup
      .on("mouseenter", function (event) {
        // Prevent event bubbling
        event.stopPropagation();

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
              ).toLocaleString()}</strong>
              <br/><span style="font-size: 0.8em; color: #666;">(Click × to delete)</span>
            `
          )
          .style("left", event.pageX + 30 + "px")
          .style("top", event.pageY - 108 + "px");
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

  function addDragBehavior(transactionGroup, transaction, position, verticalPosition) {
    // Make transaction draggable
    transactionGroup.call(
      d3
        .drag()
        .filter(function (event) {
          // Only initiate drag if not clicking on the delete button
          return (
            !event.target.closest(".delete-button-group") &&
            !event.target.closest(".delete-icon")
          );
        })
        .on("start", function (event) {
          // Prevent browser's default drag behavior
          event.sourceEvent.preventDefault();
          event.sourceEvent.stopPropagation();

          // Hide all delete buttons during drag to prevent interference
          d3.selectAll(".delete-button-group")
            .style("opacity", 0)
            .style("pointer-events", "none");

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

            // Update date in the transaction object
            transaction.date = new Date(newDate);

            // Calculate the final position for the transaction
            const finalX = timeScale(newDate);
            const isSale = transaction.transactionType === "sale";
            const stackHeight = 30;
            const verticalOffset = isSale ? stackHeight : -stackHeight;
            const finalY = investmentTimelineY + verticalOffset;

            // Smooth transition to final position
            d3.select(this)
              .transition()
              .duration(300)
              .ease(d3.easeBackOut.overshoot(1.1))
              .attr("transform", `translate(${finalX}, ${finalY})`)
              .on("end", function() {
                // Update any related timeline dots position
                updateTimelineDot(transaction, newDate);
                
                // Update database asynchronously without affecting UI
                updateDatabaseInBackground(transaction, originalDate);
              });

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
            }, 2000);

          } else if (!isDateInRange(newDate)) {
            // If dropped outside valid date range, smoothly return to original position
            d3.select(this)
              .transition()
              .duration(200)
              .ease(d3.easeBackOut)
              .attr("transform", `translate(${timeScale(transaction.date)}, ${verticalPosition})`);
          }

          // Remove the connector and indicators
          investmentSvg.select(".drag-connector").remove();
          investmentSvg.select(".current-date-indicator").remove();
          investmentSvg.select(".target-date-indicator").remove();

          // Reset cursor and remove dragging class
          d3.select(this)
            .style("cursor", "grab")
            .classed("dragging", false);

          // Restore delete buttons smoothly
          setTimeout(() => {
            d3.selectAll(".delete-button-group")
              .transition()
              .duration(150)
              .style("opacity", 1)
              .style("pointer-events", "auto");
          }, 100);
        })
    );
  }

  // Helper function to update timeline dot position smoothly
  function updateTimelineDot(transaction, newDate) {
    const newX = timeScale(newDate);
    
    // Find and update the corresponding timeline dot
    investmentSvg.selectAll(".timeline-point")
      .filter(function() {
        const dotTransactionId = d3.select(this).attr("data-transaction-id");
        return dotTransactionId == transaction.id;
      })
      .transition()
      .duration(300)
      .ease(d3.easeBackOut)
      .attr("cx", newX);
  }

  // Helper function to update database in background without affecting UI
  function updateDatabaseInBackground(transaction, originalDate) {
    // Save the transaction to the database
    if (window.investmentChart && window.investmentChart.updateTransaction) {
      try {
        window.investmentChart.updateTransaction(transaction);
        
        // Create transaction info for potential bar segment highlighting
        const transactionToHighlight = {
          id: transaction.id,
          entityId: transaction.entity_id,
          entityName: transaction.name,
          transactionType: transaction.transactionType,
          date: new Date(transaction.date),
          amount: transaction.amount,
        };

        // Delay bar segment highlighting to avoid interference with drag animations
        setTimeout(() => {
          if (highlightBarSegmentForTransaction) {
            highlightBarSegmentForTransaction(transactionToHighlight);
          }
        }, 400);

      } catch (error) {
        console.error("Error updating transaction:", error);
        
        // Revert the date change if database update fails
        transaction.date = originalDate;
        
        // Smoothly move back to original position
        const originalX = timeScale(originalDate);
        const isSale = transaction.transactionType === "sale";
        const stackHeight = 30;
        const verticalOffset = isSale ? stackHeight : -stackHeight;
        const originalY = investmentTimelineY + verticalOffset;
        
        const transactionGroup = investmentSvg.select(`[data-transaction-id="${transaction.id}"]`);
        if (!transactionGroup.empty()) {
          transactionGroup
            .transition()
            .duration(300)
            .ease(d3.easeBackOut)
            .attr("transform", `translate(${originalX}, ${originalY})`);
        }
        
        // Show error feedback
        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip
          .html(`<strong>Error:</strong> Failed to update transaction`)
          .style("background", "#f8d7da")
          .style("color", "#721c24");
        
        setTimeout(() => {
          tooltip.transition().duration(500).style("opacity", 0);
        }, 3000);
      }
    }
  }

  // Return API for external control
  return {
    update: function(newTransactions) {
      // Clear existing transactions and re-render
      investmentSvg.selectAll(".timeline-point").remove();
      investmentSvg.selectAll("g[data-id]").remove();
      
      // Update the transactions reference
      config.transactions = newTransactions;
      
      // Re-render with new data
      renderTransactions();
    },
    
    destroy: function() {
      // Remove the entire timeline SVG
      investmentSvg.remove();
    },
    
    getSvg: function() {
      return investmentSvg;
    }
  };
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createInvestmentTimeline };
} 