/**
 * Chart Options Sidebar Component
 * Manages the chart options sidebar, mobile responsiveness, and control organization
 */

class ChartSidebarManager {
    constructor() {
        this.sidebar = null;
        this.sidebarClose = null;
        this.overlay = null;
        this.container = null;
        this.isOpen = false;
        this.isMobile = false;
        this.currentSection = 'data-entry'; // Default section
        this.isActive = false; // Only active in planning section
        this.justOpened = false; // Flag to prevent immediate closing
        
        this.init();
    }

    /**
     * Initialize the chart sidebar component
     */
    init() {
        this.setupElements();
        this.setupEventListeners();
        this.setupResponsive();
        this.createOverlay();
        
        // Hide sidebar by default on initialization
        this.hideSidebar();
        
        // Check current section after a short delay to ensure main sidebar is ready
        setTimeout(() => {
            this.checkCurrentSection();
        }, 100);
        
        console.log('Chart Sidebar Manager initialized');
    }

    /**
     * Setup DOM elements
     */
    setupElements() {
        this.sidebar = document.getElementById('chart-sidebar');
        this.sidebarClose = document.getElementById('chart-sidebar-close');
        this.container = document.getElementById('chart-controls-container');
        
        console.log('Chart sidebar elements setup:');
        console.log('- Sidebar element:', this.sidebar ? 'Found' : 'NOT FOUND');
        console.log('- Close button:', this.sidebarClose ? 'Found' : 'NOT FOUND');
        console.log('- Container:', this.container ? 'Found' : 'NOT FOUND');
        
        if (!this.sidebar) {
            console.error('Chart sidebar element not found');
            return;
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Sidebar close button
        if (this.sidebarClose) {
            this.sidebarClose.addEventListener('click', () => {
                this.closeSidebar();
            });
        }

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardNavigation(e);
        });

        // Window resize handling
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Click outside to close sidebar (only when active)
        document.addEventListener('click', (e) => {
            if (this.isActive) {
                this.handleClickOutside(e);
            }
        });

        // Listen for section changes
        document.addEventListener('sectionChange', (e) => {
            this.handleSectionChange(e.detail.section);
        });

        // Also listen for the alternative event name
        document.addEventListener('sectionChanged', (e) => {
            this.handleSectionChange(e.detail.section);
        });
    }

    /**
     * Setup responsive behavior
     */
    setupResponsive() {
        this.checkMobile();
        
        console.log('Chart sidebar responsive setup - window width:', window.innerWidth, 'isMobile:', this.isMobile);
        
        // Don't set initial state here - let checkCurrentSection handle it
        // This prevents the sidebar from showing before we know the current section
    }

    /**
     * Create overlay for mobile
     */
    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'chart-sidebar-overlay';
        document.body.appendChild(this.overlay);
        
        // Close sidebar when overlay is clicked
        this.overlay.addEventListener('click', () => {
            this.closeSidebar();
        });
    }

    /**
     * Check if device is mobile
     */
    checkMobile() {
        this.isMobile = window.innerWidth <= 768;
        console.log('Mobile check - width:', window.innerWidth, 'isMobile:', this.isMobile);
    }

    /**
     * Handle window resize
     */
    handleResize() {
        const wasMobile = this.isMobile;
        this.checkMobile();
        
        // If switching from mobile to desktop, hide overlay
        if (wasMobile && !this.isMobile) {
            this.overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
        
        // If switching from desktop to mobile and sidebar is open, show overlay
        if (!wasMobile && this.isMobile && this.isOpen) {
            this.overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    /**
     * Check current section on initialization
     */
    checkCurrentSection() {
        // Wait for sidebar manager to be ready
        if (!window.sidebarManager) {
            // If sidebar manager not ready, try again after a short delay
            setTimeout(() => {
                this.checkCurrentSection();
            }, 50);
            return;
        }

        // Get current section from sidebar manager
        this.currentSection = window.sidebarManager.getCurrentSection();
        
        // Double-check with DOM if needed
        if (!this.currentSection) {
            const activeSection = document.querySelector('.content-section.active');
            if (activeSection) {
                this.currentSection = activeSection.id;
            } else {
                // If no active section found, default to data-entry
                this.currentSection = 'data-entry';
            }
        }
        
        this.updateActiveState();
        console.log('Chart sidebar current section:', this.currentSection, 'isActive:', this.isActive);
    }

    /**
     * Handle section changes
     */
    handleSectionChange(newSection) {
        console.log('Chart sidebar section change:', newSection);
        this.currentSection = newSection;
        this.updateActiveState();
    }

    /**
     * Update active state based on current section
     */
    updateActiveState() {
        const wasActive = this.isActive;
        this.isActive = this.currentSection === 'planning';
        
        if (this.isActive && !wasActive) {
            // Entering planning section - show sidebar
            this.showSidebar();
            console.log('Chart sidebar activated for planning section');
        } else if (!this.isActive && wasActive) {
            // Leaving planning section - hide sidebar
            this.hideSidebar();
            console.log('Chart sidebar deactivated - left planning section');
        }
    }

    /**
     * Show the sidebar (make it visible in DOM)
     */
    showSidebar() {
        if (this.sidebar) {
            this.sidebar.style.display = 'block';
            
            // Automatically open the sidebar when entering planning section
            this.sidebar.classList.add('open');
            this.isOpen = true;
            this.justOpened = true; // Set flag to prevent immediate closing
            
            // Clear the flag after a short delay
            setTimeout(() => {
                this.justOpened = false;
            }, 500);
            
            // Handle mobile overlay if needed
            if (this.isMobile) {
                this.overlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        }
        
        // Show chart options button
        this.showChartOptionsButton();
        
        // Initialize chart sidebar controls when entering planning section
        this.initializeChartControls();
    }

    /**
     * Initialize chart controls when entering planning section
     */
    initializeChartControls() {
        // Check if the chart sidebar initialization function exists
        if (typeof window.initializeChartSidebar === 'function') {
            console.log('Initializing chart sidebar controls via window...');
            setTimeout(() => {
                window.initializeChartSidebar();
            }, 50);
        } else if (typeof initializeChartSidebar === 'function') {
            console.log('Initializing chart sidebar controls directly...');
            setTimeout(() => {
                initializeChartSidebar();
            }, 50);
        } else {
            console.log('Chart sidebar initialization function not found, checking if chart is already initialized...');
            
            // Check if the chart container has content (chart already initialized)
            const chartContainer = document.getElementById('investment-chart');
            if (chartContainer && chartContainer.innerHTML.trim() !== '') {
                console.log('Chart already initialized, just initializing sidebar controls...');
                // Chart is already there, just try to initialize sidebar controls
                setTimeout(() => {
                    if (typeof window.initializeChartSidebar === 'function') {
                        window.initializeChartSidebar();
                    }
                }, 100);
            } else {
                console.log('Chart not initialized, calling initInvestmentChart...');
                // Chart not initialized, need to initialize it
                setTimeout(() => {
                    if (typeof window.initInvestmentChart === 'function') {
                        console.log('Calling initInvestmentChart as fallback...');
                        window.initInvestmentChart();
                    } else if (typeof initInvestmentChart === 'function') {
                        console.log('Calling initInvestmentChart directly as fallback...');
                        initInvestmentChart();
                    } else {
                        console.warn('No chart initialization functions found');
                    }
                }, 100);
            }
        }
    }

    /**
     * Hide the sidebar (remove from DOM visibility)
     */
    hideSidebar() {
        if (this.sidebar) {
            this.sidebar.style.display = 'none';
            this.sidebar.classList.remove('open');
            this.isOpen = false;
            
            // Hide overlay if active
            if (this.overlay) {
                this.overlay.classList.remove('active');
            }
            document.body.style.overflow = '';
        }
        
        // Hide chart options button
        this.hideChartOptionsButton();
    }

    /**
     * Show the chart options button
     */
    showChartOptionsButton() {
        const chartOptionsBtn = document.getElementById('chart-options-btn');
        if (chartOptionsBtn) {
            chartOptionsBtn.style.display = 'flex';
            console.log('Chart options button shown');
        }
    }

    /**
     * Hide the chart options button
     */
    hideChartOptionsButton() {
        const chartOptionsBtn = document.getElementById('chart-options-btn');
        if (chartOptionsBtn) {
            chartOptionsBtn.style.display = 'none';
            console.log('Chart options button hidden');
        }
    }

    /**
     * Open sidebar (only works when active)
     */
    openSidebar() {
        if (!this.isActive) {
            console.log('Chart sidebar not active - cannot open outside planning section');
            return;
        }
        
        this.isOpen = true;
        this.sidebar.classList.add('open');
        
        if (this.isMobile) {
            this.overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
        
        console.log('Chart sidebar opened');
    }

    /**
     * Close sidebar
     */
    closeSidebar() {
        // Prevent closing if just opened
        if (this.justOpened) {
            console.log('Chart sidebar close prevented - just opened');
            return;
        }
        
        this.isOpen = false;
        this.sidebar.classList.remove('open');
        this.overlay.classList.remove('active');
        document.body.style.overflow = '';
        
        console.log('Chart sidebar closed');
    }

    /**
     * Handle keyboard navigation (only when active)
     */
    handleKeyboardNavigation(e) {
        // Close sidebar on Escape key (only when active and open)
        if (e.key === 'Escape' && this.isActive && this.isOpen) {
            this.closeSidebar();
        }
    }

    /**
     * Handle clicks outside the sidebar to close it
     */
    handleClickOutside(e) {
        // Only work when sidebar is active and open
        if (!this.isActive || !this.isOpen) return;

        // Prevent closing if just opened
        if (this.justOpened) {
            console.log('Chart sidebar click outside ignored - just opened');
            return;
        }

        // Don't close if clicking on the chart options button (to open sidebar)
        const chartOptionsBtn = document.getElementById('chart-options-btn');
        if (chartOptionsBtn && (e.target === chartOptionsBtn || chartOptionsBtn.contains(e.target))) {
            return;
        }

        // Don't close if clicking inside the sidebar
        if (this.sidebar && (e.target === this.sidebar || this.sidebar.contains(e.target))) {
            return;
        }

        // Don't close if clicking on the overlay (overlay has its own click handler)
        if (this.overlay && (e.target === this.overlay || this.overlay.contains(e.target))) {
            return;
        }

        // Close the sidebar if clicking outside
        console.log('Chart sidebar closing due to click outside');
        this.closeSidebar();
    }

    /**
     * Add a control section to the sidebar
     */
    addControlSection(id, title, description, content) {
        if (!this.container) return;

        const section = document.createElement('div');
        section.className = 'chart-controls-section';
        section.id = id;

        const titleElement = document.createElement('h4');
        titleElement.textContent = title;
        section.appendChild(titleElement);

        if (description) {
            const descElement = document.createElement('p');
            descElement.textContent = description;
            section.appendChild(descElement);
        }

        if (content) {
            if (typeof content === 'string') {
                section.insertAdjacentHTML('beforeend', content);
            } else if (content instanceof HTMLElement) {
                section.appendChild(content);
            }
        }

        this.container.appendChild(section);
        return section;
    }

    /**
     * Remove a control section from the sidebar
     */
    removeControlSection(id) {
        if (!this.container) return;

        const section = document.getElementById(id);
        if (section) {
            section.remove();
        }
    }

    /**
     * Clear all control sections
     */
    clearControls() {
        if (this.container) {
            this.container.innerHTML = '';
        }
    }

    /**
     * Get the controls container
     */
    getContainer() {
        return this.container;
    }

    /**
     * Check if sidebar is open
     */
    isSidebarOpen() {
        return this.isOpen;
    }

    /**
     * Destroy the sidebar manager
     */
    destroy() {
        // Remove event listeners
        if (this.sidebarClose) {
            this.sidebarClose.removeEventListener('click', this.closeSidebar);
        }

        // Remove overlay
        if (this.overlay) {
            this.overlay.remove();
        }

        // Reset body styles
        document.body.style.overflow = '';

        console.log('Chart Sidebar Manager destroyed');
    }
}

// Create global instance
window.chartSidebarManager = new ChartSidebarManager(); 