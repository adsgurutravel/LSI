/**
 * AmriTravel System - Redirect Script
 * 
 * This script handles page redirections based on user actions and URL parameters.
 * It also tracks the user's journey through the site for analytics purposes.
 */

(function() {
    // Initialize the redirect module
    const RedirectManager = {
        /**
         * Initialize the redirect manager
         */
        init: function() {
            this.trackPageView();
            this.handleUrlParameters();
            this.setupEventListeners();
        },

        /**
         * Track page view for analytics
         */
        trackPageView: function() {
            const currentPage = window.location.pathname;
            const referrer = document.referrer;
            const timestamp = new Date().toISOString();
            
            // Store page view in session storage for journey tracking
            const journeyData = JSON.parse(sessionStorage.getItem('userJourney') || '[]');
            journeyData.push({
                page: currentPage,
                referrer: referrer,
                timestamp: timestamp
            });
            sessionStorage.setItem('userJourney', JSON.stringify(journeyData));
            
            // If analytics script is loaded, track the page view
            if (typeof trackAnalytics === 'function') {
                trackAnalytics('pageView', {
                    page: currentPage,
                    referrer: referrer
                });
            }
        },

        /**
         * Handle URL parameters for redirections and tracking
         */
        handleUrlParameters: function() {
            const urlParams = new URLSearchParams(window.location.search);
            
            // Handle UTM parameters for ad tracking
            if (urlParams.has('utm_source') || urlParams.has('utm_medium') || urlParams.has('utm_campaign')) {
                this.handleUtmParameters(urlParams);
            }
            
            // Handle redirect parameters
            if (urlParams.has('redirect')) {
                const redirectTo = urlParams.get('redirect');
                // Store the redirect target for later use
                sessionStorage.setItem('redirectAfterAction', redirectTo);
            }
            
            // Handle booking flow parameters
            if (urlParams.has('vehicleId')) {
                this.storeBookingData(urlParams);
            }
        },

        /**
         * Handle UTM parameters for ad tracking
         * @param {URLSearchParams} urlParams - The URL parameters
         */
        handleUtmParameters: function(urlParams) {
            const utmData = {
                source: urlParams.get('utm_source') || '',
                medium: urlParams.get('utm_medium') || '',
                campaign: urlParams.get('utm_campaign') || '',
                term: urlParams.get('utm_term') || '',
                content: urlParams.get('utm_content') || ''
            };
            
            // Store UTM data in local storage for cross-session tracking
            localStorage.setItem('utmData', JSON.stringify(utmData));
            
            // If ad tracking script is loaded, track the UTM data
            if (typeof trackAds === 'function') {
                trackAds('utmCapture', utmData);
            }
        },

        /**
         * Store booking data from URL parameters
         * @param {URLSearchParams} urlParams - The URL parameters
         */
        storeBookingData: function(urlParams) {
            const bookingData = {
                vehicleId: urlParams.get('vehicleId') || '',
                pickupDate: urlParams.get('pickupDate') || '',
                returnDate: urlParams.get('returnDate') || '',
                pickupLocation: urlParams.get('pickupLocation') || '',
                returnLocation: urlParams.get('returnLocation') || ''
            };
            
            // Store booking data in session storage
            sessionStorage.setItem('bookingData', JSON.stringify(bookingData));
        },

        /**
         * Set up event listeners for redirect-related actions
         */
        setupEventListeners: function() {
            // Handle form submissions that should redirect
            document.querySelectorAll('form[data-redirect]').forEach(form => {
                form.addEventListener('submit', this.handleFormRedirect.bind(this));
            });
            
            // Handle buttons that should redirect
            document.querySelectorAll('[data-redirect]').forEach(element => {
                if (element.tagName !== 'FORM') {
                    element.addEventListener('click', this.handleButtonRedirect.bind(this));
                }
            });
        },

        /**
         * Handle form submission redirects
         * @param {Event} event - The form submission event
         */
        handleFormRedirect: function(event) {
            const form = event.currentTarget;
            const redirectUrl = form.getAttribute('data-redirect');
            
            if (redirectUrl) {
                // Allow the form to submit normally if it's not an AJAX form
                if (!form.hasAttribute('data-ajax')) {
                    // Store form data for the target page if needed
                    if (form.hasAttribute('data-store-data')) {
                        const formData = new FormData(form);
                        const formDataObj = {};
                        
                        for (const [key, value] of formData.entries()) {
                            formDataObj[key] = value;
                        }
                        
                        sessionStorage.setItem('formData', JSON.stringify(formDataObj));
                    }
                    
                    // If there's a delay attribute, wait before redirecting
                    if (form.hasAttribute('data-redirect-delay')) {
                        const delay = parseInt(form.getAttribute('data-redirect-delay'), 10) || 0;
                        
                        event.preventDefault();
                        setTimeout(() => {
                            window.location.href = redirectUrl;
                        }, delay);
                    }
                }
            }
        },

        /**
         * Handle button click redirects
         * @param {Event} event - The click event
         */
        handleButtonRedirect: function(event) {
            const element = event.currentTarget;
            const redirectUrl = element.getAttribute('data-redirect');
            
            if (redirectUrl) {
                event.preventDefault();
                
                // If there's a delay attribute, wait before redirecting
                if (element.hasAttribute('data-redirect-delay')) {
                    const delay = parseInt(element.getAttribute('data-redirect-delay'), 10) || 0;
                    
                    setTimeout(() => {
                        window.location.href = redirectUrl;
                    }, delay);
                } else {
                    window.location.href = redirectUrl;
                }
            }
        },

        /**
         * Redirect to a URL with parameters
         * @param {string} url - The URL to redirect to
         * @param {Object} params - The parameters to add to the URL
         */
        redirectWithParams: function(url, params = {}) {
            const urlObj = new URL(url, window.location.origin);
            
            // Add parameters to the URL
            Object.keys(params).forEach(key => {
                urlObj.searchParams.append(key, params[key]);
            });
            
            window.location.href = urlObj.toString();
        },

        /**
         * Get stored booking data
         * @returns {Object} The booking data
         */
        getBookingData: function() {
            return JSON.parse(sessionStorage.getItem('bookingData') || '{}');
        },

        /**
         * Get stored UTM data
         * @returns {Object} The UTM data
         */
        getUtmData: function() {
            return JSON.parse(localStorage.getItem('utmData') || '{}');
        },

        /**
         * Get user journey data
         * @returns {Array} The user journey data
         */
        getUserJourney: function() {
            return JSON.parse(sessionStorage.getItem('userJourney') || '[]');
        }
    };

    // Initialize the redirect manager
    RedirectManager.init();

    // Expose the redirect manager to the global scope
    window.RedirectManager = RedirectManager;
})();
