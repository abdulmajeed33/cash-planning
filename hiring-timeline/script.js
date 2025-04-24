document.addEventListener("DOMContentLoaded", function () {
  // Set total payroll
  const totalPayroll = 363284;
  document.getElementById(
    "total-payroll"
  ).textContent = `Total payroll: $${totalPayroll.toLocaleString()}`;
  document.getElementById("date-range").textContent =
    "January 01, 2021 – January 01, 2022";

  // Date formatting utilities
  const dateFormat = d3.timeFormat("%b %d, %Y");
  const monthFormat = d3.timeFormat("%b %Y");
  const shortDateFormat = d3.timeFormat("%b %d");
  const dateParse = d3.timeParse("%Y-%m-%d");

  // Define date range for the timeline (full year 2021)
  const startDate = new Date(2021, 0, 1); // Jan 1, 2021
  const endDate = new Date(2022, 0, 1); // Jan 1, 2022


  // Initial data with date property
  let hiringData = [
    {
      id: 1,
      date: new Date(2021, 0, 15),
      role: "Botanist",
      emoji: "👩‍🌾",
      salary: 2500,
      name: "Emma Thompson",
    },
    {
      id: 2,
      date: new Date(2021, 1, 10),
      role: "Sales",
      emoji: "👩‍💼",
      salary: 4500,
      name: "Olivia Martinez",
    },
    {
      id: 3,
      date: new Date(2021, 1, 20),
      role: "Eng",
      emoji: "👩‍🔧",
      salary: 4000,
      name: "James Wilson",
    },
    {
      id: 4,
      date: new Date(2021, 2, 15),
      role: "Design",
      emoji: "👩‍🎨",
      salary: 4000,
      name: "Sophia Garcia",
    },
    {
      id: 5,
      date: new Date(2021, 3, 10),
      role: "Marketing",
      emoji: "👩‍💻",
      salary: 4000,
      name: "Noah Smith",
    },
    {
      id: 6,
      date: new Date(2021, 5, 5),
      role: "Eng",
      emoji: "👨‍🔧",
      salary: 7000,
      name: "William Johnson",
    },
    {
      id: 7,
      date: new Date(2021, 6, 20),
      role: "Intern",
      emoji: "👩‍🎓",
      salary: 2000,
      name: "Ava Brown",
    },
    {
      id: 8,
      date: new Date(2021, 7, 5),
      role: "Writer",
      emoji: "👨‍💻",
      salary: 5000,
      name: "Ethan Davis",
    },
    {
      id: 9,
      date: new Date(2021, 7, 25),
      role: "Painter",
      emoji: "👩‍🎨",
      salary: 5000,
      name: "Isabella Miller",
    },
    {
      id: 10,
      date: new Date(2021, 8, 10),
      role: "Eng",
      emoji: "👩‍🔧",
      salary: 6000,
      name: "Liam Wilson",
    },
    {
      id: 11,
      date: new Date(2021, 9, 15),
      role: "Chef",
      emoji: "👨‍🍳",
      salary: 5000,
      name: "Charlotte Taylor",
    },
    {
      id: 12,
      date: new Date(2021, 11, 10),
      role: "Eng",
      emoji: "👨‍🔧",
      salary: 7500,
      name: "Mason Anderson",
    },
  ];

  // Available roles for new hires
  const availableRoles = [
    { role: "Botanist", emoji: "👩‍🌾", defaultSalary: 2500 },
    { role: "Sales", emoji: "👩‍💼", defaultSalary: 4500 },
    { role: "Eng", emoji: "👩‍🔧", defaultSalary: 6000 },
    { role: "Design", emoji: "👩‍🎨", defaultSalary: 4000 },
    { role: "Marketing", emoji: "👩‍💻", defaultSalary: 4000 },
    { role: "Intern", emoji: "👩‍🎓", defaultSalary: 2000 },
    { role: "Writer", emoji: "👨‍💻", defaultSalary: 5000 },
    { role: "Painter", emoji: "👩‍🎨", defaultSalary: 5000 },
    { role: "Chef", emoji: "👨‍🍳", defaultSalary: 5000 },
  ];

  // Setup visualization dimensions
  const svgWidth = 1200;
  const svgHeight = 150;
  const timelineY = 100;

  // Create SVG container
  const svg = d3
    .select("#timeline-chart")
    .append("svg")
    .attr("width", "100%")
    .attr("height", svgHeight)
    .attr("viewBox", `0 0 ${svgWidth} ${svgHeight}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  // Add drag instructions
  d3.select("#timeline-chart")
    .append("div")
    .attr("class", "instruction-container")
    .html(
      '<div class="drag-arrow">↔</div> Drag to move<br><div class="plus-icon">+</div> Click below line to add'
    );

  // Define timeline positions
  const timelineStart = 80;
  const timelineEnd = svgWidth - 80;
  const timelineLength = timelineEnd - timelineStart;

  // Create time scale for date-based positioning
  const timeScale = d3
    .scaleTime()
    .domain([startDate, endDate])
    .range([timelineStart, timelineEnd]);

  // Create tooltip container with enhanced styling
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

  // Create modal for adding/editing roles
  const modal = d3
    .select("body")
    .append("div")
    .attr("class", "modal")
    .style("display", "none");

  modal.html(`
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2 id="modal-title">Add New Hire</h2>
            <form id="hire-form">
                <div class="form-group">
                    <label for="hire-name">Name:</label>
                    <input type="text" id="hire-name" required>
                </div>
                <div class="form-group">
                    <label for="hire-role">Role:</label>
                    <select id="hire-role" required>
                        ${availableRoles
                          .map(
                            (r) =>
                              `<option value="${r.role}" data-emoji="${r.emoji}" data-salary="${r.defaultSalary}">${r.emoji} ${r.role}</option>`
                          )
                          .join("")}
                    </select>
                </div>
                <div class="form-group">
                    <label for="hire-date">Start Date:</label>
                    <input type="date" id="hire-date" min="2021-01-01" max="2021-12-31" required>
                </div>
                <div class="form-group">
                    <label for="hire-salary">Monthly Salary ($):</label>
                    <input type="number" id="hire-salary" min="1000" required>
                </div>
                <input type="hidden" id="hire-id">
                <button type="submit" class="btn-submit">Save</button>
                <button type="button" class="btn-delete" style="display:none;">Delete</button>
            </form>
        </div>
    `);

  // Function to find date from position on timeline
  function getDateFromPosition(xPos) {
    return timeScale.invert(xPos);
  }

  // Function to validate date is within range
  function isDateInRange(date) {
    return date >= startDate && date < endDate;
  }

  // Close modal when clicking X
  modal.select(".close").on("click", () => {
    modal.style("display", "none");
  });

  // Handle form submission
  document.getElementById("hire-form").addEventListener("submit", function (e) {
    e.preventDefault();

    const name = document.getElementById("hire-name").value;
    const role = document.getElementById("hire-role").value;
    const dateValue = document.getElementById("hire-date").value;
    const date = new Date(dateValue);
    const salary = parseFloat(document.getElementById("hire-salary").value);
    const id = document.getElementById("hire-id").value;
    const emoji =
      document.getElementById("hire-role").options[
        document.getElementById("hire-role").selectedIndex
      ].dataset.emoji;

    if (id) {
      // Edit existing
      const index = hiringData.findIndex((d) => d.id.toString() === id);
      if (index !== -1) {
        hiringData[index] = {
          ...hiringData[index],
          name,
          role,
          date,
          salary,
          emoji,
        };
      }
    } else {
      // Add new
      const newId = Math.max(...hiringData.map((d) => d.id), 0) + 1;
      hiringData.push({ id: newId, name, role, date, emoji, salary });
    }

    updateVisualization();
    modal.style("display", "none");
  });

  // Handle delete button click
  modal.select(".btn-delete").on("click", () => {
    const id = document.getElementById("hire-id").value;
    if (id) {
      hiringData = hiringData.filter((d) => d.id.toString() !== id);
      updateVisualization();
      modal.style("display", "none");
    }
  });

  // When role dropdown changes, update default salary
  document.getElementById("hire-role").addEventListener("change", function () {
    const selectedOption = this.options[this.selectedIndex];
    document.getElementById("hire-salary").value =
      selectedOption.dataset.salary;
  });

  // Function to calculate annual cost based on hire date
  function calculateAnnualCost(hire) {
    // Calculate days employed in the year
    const yearEnd = new Date(2022, 0, 1);
    const daysInYear = 365;
    const millisecondsPerDay = 24 * 60 * 60 * 1000;

    const hireDate = new Date(hire.date);
    const daysEmployed = Math.max(
      0,
      Math.floor((yearEnd - hireDate) / millisecondsPerDay)
    );
    const daysRatio = daysEmployed / daysInYear;

    // Daily rate (monthly salary / 30 days)
    const dailyRate = hire.salary / 30;

    return Math.round(dailyRate * daysEmployed);
  }

  // Function to calculate annual projection
  function calculateAnnualProjection() {
    return hiringData.reduce(
      (total, hire) => total + calculateAnnualCost(hire),
      0
    );
  }

  // Function to animate an element
  function animateElement(element, className, duration = 1000) {
    element.classed(className, true);
    setTimeout(() => element.classed(className, false), duration);
  }

  // Function to draw the timeline with enhanced animations
  function drawTimeline() {
    // Clear previous elements
    svg.selectAll("*").remove();

    // Draw timeline
    svg
      .append("line")
      .attr("class", "timeline")
      .attr("x1", timelineStart)
      .attr("x2", timelineEnd)
      .attr("y1", timelineY)
      .attr("y2", timelineY)
      .attr("stroke", "#ddd")
      .attr("stroke-width", 1);

    // Create time axis with ticks every month
    const timeAxis = d3
      .axisBottom(timeScale)
      .ticks(d3.timeMonth.every(1))
      .tickFormat(d3.timeFormat("%b"))
      .tickSize(5);

    // Add time axis
    svg
      .append("g")
      .attr("class", "time-axis")
      .attr("transform", `translate(0, ${timelineY})`)
      .call(timeAxis)
      .select(".domain")
      .remove();

    // Style tick lines
    svg
      .selectAll(".time-axis line")
      .attr("stroke", "#ccc")
      .attr("stroke-dasharray", "2,2");

    // Style tick text
    svg
      .selectAll(".time-axis text")
      .attr("font-size", "10px")
      .attr("dy", "1em");

    // Add year labels
    svg
      .append("text")
      .attr("class", "year-label")
      .attr("x", timelineStart)
      .attr("y", timelineY + 35)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .text("2021");

    svg
      .append("text")
      .attr("class", "year-label")
      .attr("x", timelineEnd)
      .attr("y", timelineY + 35)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .text("2022");

    // Add click area for adding new roles
    svg
      .append("rect")
      .attr("pointer-events", "all")
      .attr("x", timelineStart)
      .attr("y", timelineY - 10)
      .attr("width", timelineLength)
      .attr("height", 20)
      .attr("fill", "transparent")
      .style("cursor", "copy")
      .on("click", function (event) {
        const coords = d3.pointer(event);
        const clickX = coords[0];

        // Show plus button at click position
        showAddButton(clickX);
      });

    // Group roles by similar dates for better visualization
    const groupedRoles = groupRolesByProximity(hiringData, 14); // 14 days proximity

    // Process the roles with improved visuals
    groupedRoles.forEach((group) => {
      // Get average position for this group
      const avgPosition = timeScale(group.date);

      // Add a blue dot for this group's date
      svg
        .append("circle")
        .attr("class", "timeline-point")
        .attr("cx", avgPosition)
        .attr("cy", timelineY)
        .attr("r", 5)
        .attr("fill", "#1976d2");

      // Add role emojis with proper spacing
      const totalRoles = group.roles.length;
      group.roles.forEach((role, i) => {
        // Determine horizontal offset for multiple roles
        let offsetX = 0;
        if (totalRoles > 1) {
          offsetX = (i - (totalRoles - 1) / 2) * 30;
        }

        // Create a group for the role (emoji + label)
        const roleGroup = svg
          .append("g")
          .attr("data-id", role.id)
          .attr(
            "transform",
            `translate(${avgPosition + offsetX}, ${timelineY - 45})`
          )
          .style("cursor", "pointer");

        // Add invisible circle for better hover area
        roleGroup
          .append("circle")
          .attr("class", "role-hover-area")
          .attr("r", 20)
          .attr("cx", 0)
          .attr("cy", 0)
          .attr("fill", "transparent");

        // Add emoji with subtle animation
        roleGroup
          .append("text")
          .attr("class", "emoji")
          .attr("x", 0)
          .attr("y", 0)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .attr("font-size", "24px")
          .attr("transform", "scale(1.5)") // Doubles the emoji size
          .text(role.emoji)
          .style("opacity", 0)
          .transition()
          .duration(300)
          .style("opacity", 1);

        // Add role label with date
        roleGroup
          .append("text")
          .attr("class", "role-label")
          .attr("x", 0)
          .attr("y", 30)
          .attr("text-anchor", "middle")
          .attr("font-size", "10px")
          .text(role.role);

        // Add enhanced tooltip
        roleGroup
          .on("mouseenter", function (event) {
            // Prevent rapid hover state changes
            event.stopPropagation();

            tooltip
              .transition()
              .duration(200)
              .style("opacity", 0.9)
              .style("transform", "scale(1)");

            // Calculate annual cost for this employee
            const annualCost = calculateAnnualCost(role);

            tooltip
              .html(
                `
                            <strong>${role.name}</strong><br/>
                            Role: <strong>${role.role}</strong><br/>
                            Start date: <strong>${dateFormat(
                              role.date
                            )}</strong><br/>
                            Salary: <strong>$${role.salary.toLocaleString()}/month</strong><br/>
                            Annual cost: <strong>$${annualCost.toLocaleString()}</strong><br/>
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
            showEditModal(role);
          });

        // Make role draggable with improved visual feedback
        roleGroup.call(
          d3
            .drag()
            .on("start", function (event) {
              d3.select(this).style("cursor", "grabbing").raise(); // Bring to front

              // Create the triangle connector
              const connector = svg
                .append("path")
                .attr("class", "drag-connector")
                .attr("stroke", "#1976d2")
                .attr("stroke-width", 2)
                .attr("fill", "none");

              // Add visual indicator for current date
              svg
                .append("circle")
                .attr("class", "current-date-indicator")
                .attr("cx", timeScale(role.date))
                .attr("cy", timelineY)
                .attr("r", 8)
                .attr("fill", "none")
                .attr("stroke", "#1976d2")
                .attr("stroke-width", 1)
                .attr("stroke-dasharray", "3,2");
            })
            .on("drag", function (event) {
              // Update position while dragging
              const x = event.x;
              const y = Math.min(timelineY - 30, event.y); // Keep it above the timeline

              d3.select(this).attr("transform", `translate(${x}, ${y})`);

              // Get target date at current position
              const targetDate = getDateFromPosition(x);

              // Show date label during drag
              dateLabel
                .style("opacity", 1)
                .html(dateFormat(targetDate))
                .style("left", event.sourceEvent.pageX + 10 + "px")
                .style("top", event.sourceEvent.pageY - 30 + "px");

              // Update the connector
              const trianglePath = `M ${x} ${y + 25} L ${timeScale(
                role.date
              )} ${timelineY}`;
              svg.select(".drag-connector").attr("d", trianglePath);

              // Remove previous target indicator
              svg.selectAll(".target-date-indicator").remove();

              // Don't highlight dates beyond the end date
              if (isDateInRange(targetDate)) {
                // Add visual indicator for target date
                svg
                  .append("circle")
                  .attr("class", "target-date-indicator")
                  .attr("cx", timeScale(targetDate))
                  .attr("cy", timelineY)
                  .attr("r", 8)
                  .attr("fill", "rgba(25, 118, 210, 0.2)")
                  .attr("stroke", "#1976d2")
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
                newDate.getTime() !== role.date.getTime() &&
                isDateInRange(newDate)
              ) {
                // Store original date for cost comparison
                const originalDate = new Date(role.date);

                // Update date
                role.date = newDate;

                // Add subtle feedback animation
                d3.select(this)
                  .style("transform", "scale(1.2)")
                  .transition()
                  .duration(300)
                  .style("transform", "scale(1)");

                updateVisualization();

                // Show feedback about change
                tooltip.transition().duration(200).style("opacity", 0.9);

                // Calculate cost change
                const oldCost = calculateAnnualCost({
                  ...role,
                  date: originalDate,
                });
                const newCost = calculateAnnualCost(role);
                const difference = newCost - oldCost;

                tooltip
                  .html(
                    `
                                <strong>Moved to ${dateFormat(
                                  newDate
                                )}</strong><br/>
                                ${
                                  difference > 0
                                    ? `Annual cost increased by <span style="color:red">$${difference.toLocaleString()}</span>`
                                    : `Annual cost reduced by <span style="color:green">$${Math.abs(
                                        difference
                                      ).toLocaleString()}</span>`
                                }
                            `
                  )
                  .style("left", event.sourceEvent.pageX + 10 + "px")
                  .style("top", event.sourceEvent.pageY - 28 + "px");

                setTimeout(() => {
                  tooltip.transition().duration(500).style("opacity", 0);
                }, 3000);
              } else {
                // If no change or invalid target, reset position
                drawTimeline();
              }

              // Remove the connector and indicators
              svg.select(".drag-connector").remove();
              svg.select(".current-date-indicator").remove();
              svg.select(".target-date-indicator").remove();

              // Reset cursor
              d3.select(this).style("cursor", "grab");
            })
        );
      });
    });
  }

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

  // Function to display the plus button at a specific position with animation
  function showAddButton(xPos) {
    // Remove any existing button
    svg.selectAll(".add-button").remove();

    // Get date at the clicked position
    const clickDate = getDateFromPosition(xPos);

    // Only allow adding within the valid date range
    if (!isDateInRange(clickDate)) return;

    // Create plus button group with animation
    const addButton = svg
      .append("g")
      .attr("class", "add-button")
      .attr("transform", `translate(${xPos}, ${timelineY - 20})`)
      .style("cursor", "pointer")
      .on("click", function () {
        // When clicked, show the add modal with this date
        showAddModal(clickDate);
      });

    // Add circle background with pulse animation
    addButton
      .append("circle")
      .attr("r", 0)
      .attr("fill", "#4CAF50")
      .transition()
      .duration(300)
      .attr("r", 10);

    // Add plus sign
    addButton
      .append("text")
      .attr("x", 0)
      .attr("y", 0)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .attr("font-size", "16px")
      .style("opacity", 0)
      .text("+")
      .transition()
      .duration(300)
      .style("opacity", 1);

    // Show date tooltip
    tooltip.transition().duration(200).style("opacity", 0.9);

    tooltip
      .html(
        `
            <strong>Add new hire at</strong><br/>
            ${dateFormat(clickDate)}
        `
      )
      .style("left", event.pageX + 15 + "px")
      .style("top", event.pageY - 15 + "px");

    setTimeout(() => {
      tooltip.transition().duration(500).style("opacity", 0);
    }, 2000);
  }

  // Function to show add modal with improved animation
  function showAddModal(date) {
    // Reset form
    document.getElementById("hire-form").reset();
    document.getElementById("hire-id").value = "";
    document.getElementById("modal-title").textContent = "Add New Hire";

    // Format date for the input field (YYYY-MM-DD)
    const dateStr = date.toISOString().split("T")[0];
    document.getElementById("hire-date").value = dateStr;

    // Update default salary based on first role
    const defaultSalary = availableRoles[0].defaultSalary;
    document.getElementById("hire-salary").value = defaultSalary;

    // Hide delete button for new hires
    modal.select(".btn-delete").style("display", "none");

    // Show modal with animation
    modal.style("display", "block").classed("fade-in", true);
  }

  // Function to show edit modal with improved animation
  function showEditModal(role) {
    // Populate form with existing data
    document.getElementById("hire-name").value = role.name;
    document.getElementById("hire-role").value = role.role;

    // Format date for the input field (YYYY-MM-DD)
    const dateStr = role.date.toISOString().split("T")[0];
    document.getElementById("hire-date").value = dateStr;

    document.getElementById("hire-salary").value = role.salary;
    document.getElementById("hire-id").value = role.id;
    document.getElementById("modal-title").textContent = "Edit Hire";

    // Show delete button
    modal.select(".btn-delete").style("display", "inline-block");

    // Show modal with animation
    modal.style("display", "block").classed("fade-in", true);
  }

  // Function to calculate payroll data by month
  function calculatePayroll() {
    // Create array of months from start to end date
    const months = d3.timeMonth.range(
      d3.timeMonth.floor(startDate),
      d3.timeMonth.offset(d3.timeMonth.floor(endDate), 1)
    );

    // Initialize payroll data structure
    const payrollByMonth = months.map((month) => ({
      month: month,
      value: 0,
      hires: [],
    }));

    // Calculate prorated salary for each hire in each month
    hiringData.forEach((hire) => {
      const hireDate = new Date(hire.date);

      payrollByMonth.forEach((payrollMonth, i) => {
        const monthStart = payrollMonth.month;
        const monthEnd =
          i < payrollByMonth.length - 1
            ? payrollByMonth[i + 1].month
            : d3.timeMonth.offset(monthStart, 1);

        // If hire date is before this month ends
        if (hireDate < monthEnd) {
          // If hired during this month, prorate the salary
          if (hireDate >= monthStart && hireDate < monthEnd) {
            // Calculate days in month
            const daysInMonth = (monthEnd - monthStart) / (24 * 60 * 60 * 1000);

            // Calculate days worked in the first month
            const daysWorked = (monthEnd - hireDate) / (24 * 60 * 60 * 1000);

            // Calculate prorated salary
            const proratedSalary = hire.salary * (daysWorked / daysInMonth);

            payrollMonth.value += proratedSalary;
            payrollMonth.hires.push({
              ...hire,
              prorated: true,
              proratedSalary,
            });
          }
          // If already hired before this month started, add full salary
          else if (hireDate < monthStart) {
            payrollMonth.value += hire.salary;
            payrollMonth.hires.push({ ...hire, prorated: false });
          }
        }
      });
    });

    // Calculate cumulative
    let runningTotal = 0;
    payrollByMonth.forEach((month) => {
      runningTotal += month.value;
      month.cumulative = runningTotal;
    });

    // Convert to display format
    return payrollByMonth.map((month) => ({
      month: month.month,
      value: month.value / 1000, // Convert to thousands
      cumulative: month.cumulative,
      hires: month.hires,
    }));
  }

  // Function to render payroll chart with improved visuals
  function drawPayrollChart() {
    // Clear previous payroll chart
    d3.select("#payroll-chart").html("");

    const payrollData = calculatePayroll();

    const payrollWidth = svgWidth;
    const payrollHeight = 350;

    const payrollSvg = d3
      .select("#payroll-chart")
      .append("svg")
      .attr("width", "100%")
      .attr("height", payrollHeight)
      .attr("viewBox", `0 0 ${payrollWidth} ${payrollHeight}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    // Add y-axis label
    payrollSvg
      .append("text")
      .attr("class", "y-axis-label")
      .attr("transform", "rotate(-90)")
      .attr("x", -180)
      .attr("y", 15)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .text("Monthly Payroll (in thousands)");

    const chartMargin = { top: 60, right: 40, bottom: 40, left: 60 };
    const chartWidth = payrollWidth - chartMargin.left - chartMargin.right;
    const chartHeight = payrollHeight - chartMargin.top - chartMargin.bottom;

    const chart = payrollSvg
      .append("g")
      .attr("transform", `translate(${chartMargin.left}, ${chartMargin.top})`);

    // X scale using time
    const x = d3
      .scaleBand()
      .domain(payrollData.map((d) => d.month))
      .range([0, chartWidth])
      .padding(0.3);

    // Determine max value for y scale (ensure it's at least 50 for consistency)
    const maxValue = Math.max(50, d3.max(payrollData, (d) => d.value) * 1.1);

    // Y scale
    const y = d3.scaleLinear().domain([0, maxValue]).range([chartHeight, 0]);

    // X axis with month format
    chart
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0, ${chartHeight})`)
      .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%b")));

    // Y axis with dollar format
    chart
      .append("g")
      .attr("class", "y-axis")
      .call(
        d3
          .axisLeft(y)
          .tickFormat((d) => `$${d}k`)
          .tickValues(d3.range(0, maxValue + 5, 5))
      )
      .select(".domain") // Select the axis line
      .remove();

    // Add mouseover highlight area
    chart
      .append("rect")
      .attr("width", chartWidth)
      .attr("height", chartHeight)
      .attr("fill", "transparent")
      .on("mousemove", function (event) {
        const [mouseX] = d3.pointer(event);
        const i = Math.floor(mouseX / (chartWidth / payrollData.length));
        if (i >= 0 && i < payrollData.length) {
          // Highlight the appropriate bar
          chart
            .selectAll(".bar-filled, .bar-outline")
            .attr("opacity", (d, idx) => (idx === i ? 1 : 0.7));
        }
      })
      .on("mouseleave", function () {
        // Reset all bars
        chart.selectAll(".bar-filled, .bar-outline").attr("opacity", 1);
      });

    // Add bars with improved visuals
    payrollData.forEach((d, i) => {
      const barElement = chart
        .append("rect")
        .attr("class", i < 5 ? "bar-filled" : "bar-outline")
        .attr("x", x(d.month))
        .attr("y", y(d.value))
        .attr("width", x.bandwidth())
        .attr("height", 0) // Start with 0 height
        .attr("fill", i < 5 ? "#1976d2" : "none")
        .attr("stroke", i < 5 ? "none" : "#1976d2")
        .attr("stroke-width", 2);

      // Animate bars
      barElement
        .transition()
        .duration(500)
        .delay(i * 50)
        .attr("height", chartHeight - y(d.value))
        .on("end", function () {
          // Add interaction after animation
          d3.select(this)
            .on("mouseenter", function (event) {
              tooltip.transition().duration(200).style("opacity", 0.9);

              // Format hires detail for tooltip
              const hiresDetail = d.hires
                .map((h) => {
                  const salaryDisplay = h.prorated
                    ? `$${Math.round(
                        h.proratedSalary
                      ).toLocaleString()} (prorated)`
                    : `$${h.salary.toLocaleString()}`;

                  return `${h.emoji} ${h.name}: ${salaryDisplay}`;
                })
                .join("<br/>");

              tooltip
                .html(
                  `
                                <strong>${d3.timeFormat("%B %Y")(
                                  d.month
                                )} Payroll</strong><br/>
                                Monthly: $${Math.round(
                                  d.value * 1000
                                ).toLocaleString()}<br/>
                                Running total: $${d.cumulative.toLocaleString()}<br/>
                                <hr style="margin: 5px 0; opacity: 0.3">
                                ${hiresDetail || "No hires this month"}
                            `
                )
                .style("left", event.pageX + 10 + "px")
                .style("top", event.pageY - 28 + "px");
            })
            .on("mouseleave", function () {
              tooltip.transition().duration(500).style("opacity", 0);
            });
        });
    });

    // Update total payroll and annual projection in header
    const monthlySumPayroll = Math.round(
      payrollData.reduce((sum, d) => sum + d.value * 1000, 0)
    );
    document.getElementById(
      "total-payroll"
    ).textContent = `Total monthly payroll: $${monthlySumPayroll.toLocaleString()}`;

    const annualProjection = calculateAnnualProjection();
    document.getElementById(
      "annual-projection"
    ).textContent = `Annual projection: $${annualProjection.toLocaleString()}`;
  }

  // Function to update the entire visualization
  function updateVisualization() {
    drawTimeline();
    drawPayrollChart();
  }

  // Predefined scenarios
  const scenarios = {
    startup: [
      {
        id: 1,
        date: new Date(2021, 0, 15),
        role: "Eng",
        emoji: "👩‍🔧",
        salary: 5000,
        name: "Alex Johnson",
      },
      {
        id: 2,
        date: new Date(2021, 1, 10),
        role: "Design",
        emoji: "👩‍🎨",
        salary: 4000,
        name: "Taylor Smith",
      },
      {
        id: 3,
        date: new Date(2021, 2, 15),
        role: "Sales",
        emoji: "👩‍💼",
        salary: 4500,
        name: "Jordan Lee",
      },
    ],
    growth: [
      {
        id: 1,
        date: new Date(2021, 0, 5),
        role: "Eng",
        emoji: "👩‍🔧",
        salary: 7000,
        name: "Alex Johnson",
      },
      {
        id: 2,
        date: new Date(2021, 0, 20),
        role: "Design",
        emoji: "👩‍🎨",
        salary: 6000,
        name: "Taylor Smith",
      },
      {
        id: 3,
        date: new Date(2021, 1, 10),
        role: "Sales",
        emoji: "👩‍💼",
        salary: 5000,
        name: "Jordan Lee",
      },
      {
        id: 4,
        date: new Date(2021, 2, 15),
        role: "Marketing",
        emoji: "👩‍💻",
        salary: 4500,
        name: "Casey Brown",
      },
      {
        id: 5,
        date: new Date(2021, 3, 12),
        role: "Eng",
        emoji: "👨‍🔧",
        salary: 7000,
        name: "Riley Wilson",
      },
      {
        id: 6,
        date: new Date(2021, 5, 7),
        role: "Sales",
        emoji: "👩‍💼",
        salary: 5000,
        name: "Avery Garcia",
      },
    ],
    enterprise: [
      {
        id: 1,
        date: new Date(2021, 0, 4),
        role: "Eng",
        emoji: "👩‍🔧",
        salary: 10000,
        name: "Alex Johnson",
      },
      {
        id: 2,
        date: new Date(2021, 0, 15),
        role: "Design",
        emoji: "👩‍🎨",
        salary: 8000,
        name: "Taylor Smith",
      },
      {
        id: 3,
        date: new Date(2021, 0, 25),
        role: "Sales",
        emoji: "👩‍💼",
        salary: 9000,
        name: "Jordan Lee",
      },
      {
        id: 4,
        date: new Date(2021, 1, 8),
        role: "Marketing",
        emoji: "👩‍💻",
        salary: 7000,
        name: "Casey Brown",
      },
      {
        id: 5,
        date: new Date(2021, 1, 20),
        role: "Eng",
        emoji: "👨‍🔧",
        salary: 10000,
        name: "Riley Wilson",
      },
      {
        id: 6,
        date: new Date(2021, 2, 10),
        role: "Sales",
        emoji: "👩‍💼",
        salary: 9000,
        name: "Avery Garcia",
      },
      {
        id: 7,
        date: new Date(2021, 3, 5),
        role: "Eng",
        emoji: "👩‍🔧",
        salary: 10000,
        name: "Morgan Davis",
      },
      {
        id: 8,
        date: new Date(2021, 4, 12),
        role: "Design",
        emoji: "👩‍🎨",
        salary: 8000,
        name: "Quinn Roberts",
      },
      {
        id: 9,
        date: new Date(2021, 6, 8),
        role: "Eng",
        emoji: "👨‍🔧",
        salary: 12000,
        name: "Skyler Clark",
      },
    ],
  };

  // Scenario button handlers
  document.querySelectorAll(".scenario-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const scenario = this.dataset.scenario;
      if (scenarios[scenario]) {
        // Apply the selected scenario
        hiringData = JSON.parse(JSON.stringify(scenarios[scenario])); // Deep copy

        // Convert date strings back to Date objects
        hiringData.forEach((hire) => {
          hire.date = new Date(hire.date);
        });

        updateVisualization();

        // Show feedback
        tooltip.transition().duration(200).style("opacity", 0.9);

        tooltip
          .html(
            `
                    <strong>${this.textContent} scenario applied</strong><br/>
                    ${hiringData.length} employees<br/>
                    Annual projection: $${calculateAnnualProjection().toLocaleString()}
                `
          )
          .style("left", window.innerWidth / 2 + "px")
          .style("top", "100px");

        setTimeout(() => {
          tooltip.transition().duration(500).style("opacity", 0);
        }, 3000);
      }
    });
  });

  // Clear all button handler
  document
    .getElementById("clear-all-btn")
    .addEventListener("click", function () {
      hiringData = [];
      updateVisualization();
    });

  // Delay hiring button handler
  document
    .getElementById("delay-hiring-btn")
    .addEventListener("click", function () {
      // Move each hire 60 days later (if possible)
      hiringData.forEach((hire) => {
        const currentDate = new Date(hire.date);
        const newDate = new Date(currentDate);
        newDate.setDate(currentDate.getDate() + 60); // Add 60 days

        // Don't go past the end of the year
        if (newDate < endDate) {
          hire.date = newDate;
        }
      });
      updateVisualization();

      // Show savings feedback
      const annualProjection = calculateAnnualProjection();
      tooltip.transition().duration(200).style("opacity", 0.9);

      tooltip
        .html(
          `
            <strong>Hiring delayed by 60 days</strong><br/>
            New annual projection: $${annualProjection.toLocaleString()}<br/>
            <span style="color:green">This could save you money!</span>
        `
        )
        .style("left", window.innerWidth / 2 + "px")
        .style("top", "100px");

      setTimeout(() => {
        tooltip.transition().duration(500).style("opacity", 0);
      }, 3000);
    });

  // Initial render
  updateVisualization();

  // Close modal when clicking outside
  window.addEventListener("click", function (event) {
    if (event.target === modal.node()) {
      modal.style("display", "none");
    }
  });
});
