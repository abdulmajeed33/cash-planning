/**
 * Sidebar Navigation Component
 * Handles sidebar navigation, mobile responsiveness, and section switching
 */

class SidebarManager {
    constructor() {
        this.sidebar = null;
        this.sidebarToggle = null;
        this.overlay = null;
        this.navLinks = [];
        this.contentSections = [];
        this.currentSection = 'data-entry';
        this.isMobile = false;
        
        this.init();
    }

    /**
     * Initialize the sidebar component
     */
    init() {
        this.setupElements();
        this.setupEventListeners();
        this.setupResponsive();
        this.createOverlay();
        this.setInitialState();
        
        console.log('Sidebar Manager initialized');
    }

    /**
     * Setup DOM elements
     */
    setupElements() {
        this.sidebar = document.getElementById('sidebar');
        this.sidebarToggle = document.getElementById('sidebar-toggle');
        this.navLinks = document.querySelectorAll('.nav-link');
        this.contentSections = document.querySelectorAll('.content-section');
        
        console.log('Sidebar elements setup:');
        console.log('- Sidebar element:', this.sidebar ? 'Found' : 'NOT FOUND');
        console.log('- Toggle button:', this.sidebarToggle ? 'Found' : 'NOT FOUND');
        console.log('- Nav links:', this.navLinks.length, 'found');
        console.log('- Content sections:', this.contentSections.length, 'found');
        
        if (!this.sidebar) {
            console.error('Sidebar element not found');
            return;
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Navigation link clicks
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('data-section');
                this.switchSection(section);
                
                // Close sidebar on mobile after navigation
                if (this.isMobile) {
                    this.closeSidebar();
                }
            });
        });

        // Sidebar toggle for mobile
        if (this.sidebarToggle) {
            this.sidebarToggle.addEventListener('click', () => {
                this.toggleSidebar();
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
    }

    /**
     * Setup responsive behavior
     */
    setupResponsive() {
        this.checkMobile();
        
        console.log('Sidebar responsive setup - window width:', window.innerWidth, 'isMobile:', this.isMobile);
        
        // Initial responsive setup
        if (this.isMobile) {
            this.sidebar.classList.remove('open');
            console.log('Mobile detected - sidebar hidden');
        } else {
            // Ensure sidebar is visible on desktop
            this.sidebar.classList.remove('open'); // Remove mobile class
            console.log('Desktop detected - sidebar should be visible');
        }
    }

    /**
     * Create overlay for mobile
     */
    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'sidebar-overlay';
        document.body.appendChild(this.overlay);
        
        // Close sidebar when overlay is clicked
        this.overlay.addEventListener('click', () => {
            this.closeSidebar();
        });
    }

    /**
     * Set initial state
     */
    setInitialState() {
        // Set initial active section
        this.switchSection(this.currentSection, false);
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
        
        // If switching from mobile to desktop, ensure sidebar is visible
        if (wasMobile && !this.isMobile) {
            this.sidebar.classList.remove('open');
            this.overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
        
        // If switching from desktop to mobile, hide sidebar
        if (!wasMobile && this.isMobile) {
            this.closeSidebar();
        }
    }

    /**
     * Toggle sidebar visibility (mobile)
     */
    toggleSidebar() {
        if (!this.isMobile) return;
        
        if (this.sidebar.classList.contains('open')) {
            this.closeSidebar();
        } else {
            this.openSidebar();
        }
    }

    /**
     * Open sidebar (mobile)
     */
    openSidebar() {
        if (!this.isMobile) return;
        
        this.sidebar.classList.add('open');
        this.overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Animate toggle button
        this.animateToggleButton(true);
    }

    /**
     * Close sidebar (mobile)
     */
    closeSidebar() {
        if (!this.isMobile) return;
        
        this.sidebar.classList.remove('open');
        this.overlay.classList.remove('active');
        document.body.style.overflow = '';
        
        // Animate toggle button
        this.animateToggleButton(false);
    }

    /**
     * Animate hamburger toggle button
     */
    animateToggleButton(isOpen) {
        const spans = this.sidebarToggle.querySelectorAll('span');
        
        if (isOpen) {
            spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
            spans[1].style.opacity = '0';
            spans[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
        } else {
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
        }
    }

    /**
     * Switch between content sections
     */
    switchSection(sectionId, updateHistory = true) {
        if (!sectionId || sectionId === this.currentSection) return;
        
        console.log(`Switching to section: ${sectionId}`);
        
        // Update navigation active state
        this.updateNavigation(sectionId);
        
        // Update content sections
        this.updateContentSections(sectionId);
        
        // Update current section
        this.currentSection = sectionId;
        
        // Handle section-specific initialization
        this.handleSectionInit(sectionId);
        
        // Update browser history
        if (updateHistory) {
            this.updateHistory(sectionId);
        }
        
        // Emit custom event for other components
        this.emitSectionChangeEvent(sectionId);
    }

    /**
     * Update navigation active state
     */
    updateNavigation(sectionId) {
        this.navLinks.forEach(link => {
            const linkSection = link.getAttribute('data-section');
            
            if (linkSection === sectionId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    /**
     * Update content sections visibility
     */
    updateContentSections(sectionId) {
        this.contentSections.forEach(section => {
            if (section.id === sectionId) {
                section.classList.add('active');
                
                // Add loading state briefly for smooth transition
                section.classList.add('loading');
                setTimeout(() => {
                    section.classList.remove('loading');
                }, 150);
            } else {
                section.classList.remove('active');
            }
        });
    }

    /**
     * Handle section-specific initialization
     */
    handleSectionInit(sectionId) {
        switch (sectionId) {
            case 'planning':
                // Initialize investment chart when switching to planning
                this.initializeInvestmentChart();
                break;
            case 'data-entry':
                // Any data entry specific initialization
                break;
            case 'cash-flow-planner':
                // Initialize cash flow planner when switching to this section
                this.initializeCashFlowPlanner();
                break;
            default:
                console.warn(`Unknown section: ${sectionId}`);
        }
    }

    /**
     * Initialize investment chart for capital transactions section
     */
    initializeInvestmentChart() {
        // Check if the investment chart initialization function exists
        if (typeof window.initInvestmentChart === 'function') {
            console.log('Initializing investment chart via window...');
            // Small delay to ensure DOM is ready
            setTimeout(() => {
                window.initInvestmentChart();
            }, 100);
        } else if (typeof initInvestmentChart === 'function') {
            console.log('Initializing investment chart directly...');
            // Small delay to ensure DOM is ready
            setTimeout(() => {
                initInvestmentChart();
            }, 100);
        } else {
            console.warn('Investment chart initialization function not found');
            // Try to manually trigger chart initialization
            setTimeout(() => {
                // Check if there's a chart container and try to initialize
                const chartContainer = document.getElementById('investment-chart');
                if (chartContainer) {
                    console.log('Chart container found, attempting manual initialization...');
                    // Dispatch a custom event that the chart script might listen for
                    const event = new CustomEvent('initializeChart');
                    document.dispatchEvent(event);
                }
            }, 200);
        }
    }

    /**
     * Initialize cash flow planner
     */
    initializeCashFlowPlanner() {
        // Initialize or refresh the cash flow planner
        if (window.cashFlowPlanner) {
            window.cashFlowPlanner.refresh();
        } else {
            // Small delay to ensure DOM is ready
            setTimeout(() => {
                if (typeof CashFlowPlanner === 'function') {
                    window.cashFlowPlanner = new CashFlowPlanner();
                }
            }, 100);
        }
    }

    /**
     * Update browser history
     */
    updateHistory(sectionId) {
        const url = new URL(window.location);
        url.searchParams.set('section', sectionId);
        window.history.pushState({ section: sectionId }, '', url);
    }

    /**
     * Emit custom event for section change
     */
    emitSectionChangeEvent(sectionId) {
        const eventDetail = {
            section: sectionId,
            previousSection: this.currentSection
        };
        
        // Emit both event names for compatibility
        const sectionChangeEvent = new CustomEvent('sectionChange', {
            detail: eventDetail
        });
        document.dispatchEvent(sectionChangeEvent);
        
        const sectionChangedEvent = new CustomEvent('sectionChanged', {
            detail: eventDetail
        });
        document.dispatchEvent(sectionChangedEvent);
    }

    /**
     * Handle keyboard navigation
     */
    handleKeyboardNavigation(e) {
        // ESC key closes sidebar on mobile
        if (e.key === 'Escape' && this.isMobile) {
            this.closeSidebar();
        }
        
        // Alt + number keys for quick navigation
        if (e.altKey) {
            switch (e.key) {
                case '1':
                    e.preventDefault();
                    this.switchSection('data-entry');
                    break;
                case '2':
                    e.preventDefault();
                    this.switchSection('planning');
                    break;
                case '3':
                    e.preventDefault();
                    this.switchSection('cash-flow-planner');
                    break;
            }
        }
    }

    /**
     * Get current section
     */
    getCurrentSection() {
        return this.currentSection;
    }

    /**
     * Check if sidebar is open (mobile)
     */
    isSidebarOpen() {
        return this.sidebar.classList.contains('open');
    }

    /**
     * Add new navigation item programmatically
     */
    addNavItem(id, icon, text, section) {
        const navList = this.sidebar.querySelector('.nav-list');
        const navItem = document.createElement('li');
        navItem.className = 'nav-item';
        
        const navLink = document.createElement('a');
        navLink.href = '#';
        navLink.className = 'nav-link';
        navLink.setAttribute('data-section', section);
        
        navLink.innerHTML = `
            <span class="nav-icon">${icon}</span>
            <span class="nav-text">${text}</span>
        `;
        
        navItem.appendChild(navLink);
        navList.appendChild(navItem);
        
        // Add event listener
        navLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.switchSection(section);
            
            if (this.isMobile) {
                this.closeSidebar();
            }
        });
        
        // Update nav links array
        this.navLinks = document.querySelectorAll('.nav-link');
    }

    /**
     * Remove navigation item
     */
    removeNavItem(section) {
        const navLink = document.querySelector(`[data-section="${section}"]`);
        if (navLink) {
            const navItem = navLink.closest('.nav-item');
            navItem.remove();
            
            // Update nav links array
            this.navLinks = document.querySelectorAll('.nav-link');
        }
    }

    /**
     * Destroy the sidebar component
     */
    destroy() {
        // Remove event listeners
        this.navLinks.forEach(link => {
            link.removeEventListener('click', this.handleNavClick);
        });
        
        if (this.sidebarToggle) {
            this.sidebarToggle.removeEventListener('click', this.toggleSidebar);
        }
        
        window.removeEventListener('resize', this.handleResize);
        document.removeEventListener('keydown', this.handleKeyboardNavigation);
        
        // Remove overlay
        if (this.overlay) {
            this.overlay.remove();
        }
        
        console.log('Sidebar Manager destroyed');
    }
}

// Initialize sidebar when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create global sidebar manager instance
    window.sidebarManager = new SidebarManager();
    
    // Handle browser back/forward buttons
    window.addEventListener('popstate', (e) => {
        if (e.state && e.state.section) {
            window.sidebarManager.switchSection(e.state.section, false);
        }
    });
    
    // Check URL parameters for initial section
    const urlParams = new URLSearchParams(window.location.search);
    const initialSection = urlParams.get('section');
    
    if (initialSection && ['data-entry', 'planning', 'cash-flow-planner'].includes(initialSection)) {
        window.sidebarManager.switchSection(initialSection, false);
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SidebarManager;
} 