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

        // Click outside to close sidebar
        document.addEventListener('click', (e) => {
            this.handleClickOutside(e);
        });
    }

    /**
     * Setup responsive behavior
     */
    setupResponsive() {
        this.checkMobile();
        
        console.log('Chart sidebar responsive setup - window width:', window.innerWidth, 'isMobile:', this.isMobile);
        
        // Initial responsive setup
        if (this.isMobile) {
            this.sidebar.classList.remove('open');
            this.isOpen = false;
            console.log('Mobile detected - chart sidebar hidden');
        } else {
            // On desktop, open sidebar by default
            this.sidebar.classList.add('open');
            this.isOpen = true;
            console.log('Desktop detected - chart sidebar opened by default');
        }
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
     * Open sidebar
     */
    openSidebar() {
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
        this.isOpen = false;
        this.sidebar.classList.remove('open');
        this.overlay.classList.remove('active');
        document.body.style.overflow = '';
        
        console.log('Chart sidebar closed');
    }

    /**
     * Handle keyboard navigation
     */
    handleKeyboardNavigation(e) {
        // Close sidebar on Escape key
        if (e.key === 'Escape' && this.isOpen) {
            this.closeSidebar();
        }
    }

    /**
     * Handle clicks outside the sidebar to close it
     */
    handleClickOutside(e) {
        // Only close if sidebar is open
        if (!this.isOpen) return;

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