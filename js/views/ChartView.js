// This is a simplified version of the chart view that will be connected
// to the original investment-chart.js functionality
class ChartView {
    constructor() {
        this.tabButtons = document.querySelectorAll(".tab-button");
        this.tabContents = document.querySelectorAll(".tab-content");
        this.startDateInput = document.getElementById('start-date');
        this.endDateInput = document.getElementById('end-date');
        this.applyDatesButton = document.getElementById('apply-dates');
        this.chartContainer = document.getElementById('investment-chart');
    }

    // Tab switching functionality
    bindTabSwitching(handler) {
        this.tabButtons.forEach((button) => {
            button.addEventListener("click", () => {
                const tabId = button.getAttribute("data-tab");
                
                // Update active button
                this.tabButtons.forEach((btn) => btn.classList.remove("active"));
                button.classList.add("active");
                
                // Update active content
                this.tabContents.forEach((content) => content.classList.remove("active"));
                document.getElementById(tabId).classList.add("active");
                
                // Call the handler when switching to the investment timeline tab
                if (tabId === "investment-timeline") {
                    handler();
                }
            });
        });
    }

    // Date range functionality
    bindDateRangeUpdate(handler) {
        this.applyDatesButton.addEventListener('click', () => {
            const startDate = this.startDateInput.value ? new Date(this.startDateInput.value) : null;
            const endDate = this.endDateInput.value ? new Date(this.endDateInput.value) : null;
            
            if (startDate && endDate) {
                handler(startDate, endDate);
            }
        });
    }

    // Set date range inputs
    setDateRange(startDate, endDate) {
        this.startDateInput.value = this.formatDateForInput(startDate);
        this.endDateInput.value = this.formatDateForInput(endDate);
    }

    // Format date for input field (YYYY-MM-DD)
    formatDateForInput(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}

// Singleton instance
const chartView = new ChartView();
export default chartView;
