/**
 * AmriTravel System - Ad Tracking Script
 * 
 * This script handles tracking of ad sources, campaigns, and conversions.
 * It integrates with various ad platforms and analytics services.
 */

(function() {
    // Ad tracking configuration
    const config = {
        // Tracking pixels and conversion IDs
        facebook: {
            pixelId: '',
            conversionApi: false
        },
        google: {
            analyticsId: '',
            adwordsId: '',
            conversionId: ''
        },
        adsumo: {
            trackingId: '',
            apiKey: ''
        },
        // Events to track
        events: {
            pageView: true,
            search: true,
            viewVehicle: true,
            addToCart: true,
            initiateCheckout: true,
            purchase: true
        },
        // Debug mode
        debug: false
    };
    
    // Ad tracking module
    const AdTracker = {
        /**
         * Initialize the ad tracker
         */
        init: function() {
            // Load configuration from environment or data attributes
            this.loadConfig();
            
            // Initialize tracking pixels
            this.initFacebookPixel();
            this.initGoogleAnalytics();
            this.initAdsumoTracking();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Track page view
            this.trackPageView();
            
            // Process UTM parameters
            this.processUtmParameters();
            
            if (config.debug) {
                console.log('Ad tracker initialized with config:', config);
            }
        },
        
        /**
         * Load configuration from environment or data attributes
         */
        loadConfig: function() {
            // Try to get configuration from data attributes
            const scriptTag = document.querySelector('script[data-ad-tracking]');
            
            if (scriptTag) {
                try {
                    const trackingConfig = JSON.parse(scriptTag.getAttribute('data-ad-tracking'));
                    
                    // Merge with default config
                    config.facebook.pixelId = trackingConfig.fbPixelId || config.facebook.pixelId;
                    config.facebook.conversionApi = trackingConfig.fbConversionApi || config.facebook.conversionApi;
                    config.google.analyticsId = trackingConfig.gaId || config.google.analyticsId;
                    config.google.adwordsId = trackingConfig.adwordsId || config.google.adwordsId;
                    config.google.conversionId = trackingConfig.conversionId || config.google.conversionId;
                    config.adsumo.trackingId = trackingConfig.adsumoId || config.adsumo.trackingId;
                    config.adsumo.apiKey = trackingConfig.adsumoKey || config.adsumo.apiKey;
                    
                    // Update events configuration if provided
                    if (trackingConfig.events) {
                        Object.assign(config.events, trackingConfig.events);
                    }
                    
                    // Set debug mode
                    config.debug = trackingConfig.debug || config.debug;
                } catch (error) {
                    console.error('Error parsing ad tracking configuration:', error);
                }
            }
            
            // Try to get configuration from environment variables
            if (typeof process !== 'undefined' && process.env) {
                config.facebook.pixelId = process.env.FB_PIXEL_ID || config.facebook.pixelId;
                config.google.analyticsId = process.env.GA_ID || config.google.analyticsId;
                config.adsumo.trackingId = process.env.ADSUMO_TRACKING_ID || config.adsumo.trackingId;
                config.adsumo.apiKey = process.env.ADSUMO_API_KEY || config.adsumo.apiKey;
            }
        },
        
        /**
         * Initialize Facebook Pixel
         */
        initFacebookPixel: function() {
            if (!config.facebook.pixelId) {
                return;
            }
            
            // Load Facebook Pixel code
            !function(f,b,e,v,n,t,s) {
                if(f.fbq) return;
                n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq) f._fbq=n;
                n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)
            }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
            
            // Initialize pixel
            fbq('init', config.facebook.pixelId);
            
            if (config.debug) {
                console.log('Facebook Pixel initialized with ID:', config.facebook.pixelId);
            }
        },
        
        /**
         * Initialize Google Analytics
         */
        initGoogleAnalytics: function() {
            if (!config.google.analyticsId) {
                return;
            }
            
            // Load Google Analytics code (GA4)
            const script = document.createElement('script');
            script.async = true;
            script.src = `https://www.googletagmanager.com/gtag/js?id=${config.google.analyticsId}`;
            document.head.appendChild(script);
            
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', config.google.analyticsId);
            
            // Store gtag function for later use
            window.gtag = gtag;
            
            if (config.debug) {
                console.log('Google Analytics initialized with ID:', config.google.analyticsId);
            }
        },
        
        /**
         * Initialize Adsumo tracking
         */
        initAdsumoTracking: function() {
            if (!config.adsumo.trackingId || !config.adsumo.apiKey) {
                return;
            }
            
            // Load Adsumo tracking code
            const script = document.createElement('script');
            script.async = true;
            script.src = 'https://cdn.adsumo.com/tracking.js';
            document.head.appendChild(script);
            
            // Initialize Adsumo
            window.adsumoConfig = {
                trackingId: config.adsumo.trackingId,
                apiKey: config.adsumo.apiKey
            };
            
            if (config.debug) {
                console.log('Adsumo tracking initialized with ID:', config.adsumo.trackingId);
            }
        },
        
        /**
         * Set up event listeners for tracking
         */
        setupEventListeners: function() {
            if (config.events.search) {
                // Track search events
                document.querySelectorAll('form.search-form').forEach(form => {
                    form.addEventListener('submit', this.trackSearch.bind(this));
                });
            }
            
            if (config.events.viewVehicle) {
                // Track vehicle view events
                document.querySelectorAll('.vehicle-card a.book-btn').forEach(link => {
                    link.addEventListener('click', this.trackViewVehicle.bind(this));
                });
            }
            
            if (config.events.initiateCheckout) {
                // Track checkout initiation
                document.querySelectorAll('form#booking-form').forEach(form => {
                    form.addEventListener('submit', this.trackInitiateCheckout.bind(this));
                });
            }
        },
        
        /**
         * Process UTM parameters from URL
         */
        processUtmParameters: function() {
            const urlParams = new URLSearchParams(window.location.search);
            const utmParams = {};
            
            // Extract UTM parameters
            if (urlParams.has('utm_source')) utmParams.source = urlParams.get('utm_source');
            if (urlParams.has('utm_medium')) utmParams.medium = urlParams.get('utm_medium');
            if (urlParams.has('utm_campaign')) utmParams.campaign = urlParams.get('utm_campaign');
            if (urlParams.has('utm_term')) utmParams.term = urlParams.get('utm_term');
            if (urlParams.has('utm_content')) utmParams.content = urlParams.get('utm_content');
            
            // Store UTM parameters in local storage if any are present
            if (Object.keys(utmParams).length > 0) {
                localStorage.setItem('utmParams', JSON.stringify(utmParams));
                
                if (config.debug) {
                    console.log('Stored UTM parameters:', utmParams);
                }
            }
        },
        
        /**
         * Get stored UTM parameters
         * @returns {Object} The UTM parameters
         */
        getUtmParameters: function() {
            const utmParams = localStorage.getItem('utmParams');
            return utmParams ? JSON.parse(utmParams) : {};
        },
        
        /**
         * Track page view
         */
        trackPageView: function() {
            if (!config.events.pageView) {
                return;
            }
            
            // Track with Facebook Pixel
            if (window.fbq) {
                fbq('track', 'PageView');
            }
            
            // Track with Google Analytics
            if (window.gtag) {
                gtag('event', 'page_view');
            }
            
            // Track with Adsumo
            if (window.adsumo) {
                window.adsumo.track('pageView');
            }
            
            if (config.debug) {
                console.log('Tracked page view event');
            }
        },
        
        /**
         * Track search event
         * @param {Event} event - The search form submission event
         */
        trackSearch: function(event) {
            const form = event.currentTarget;
            const formData = new FormData(form);
            
            // Extract search parameters
            const searchParams = {};
            for (const [key, value] of formData.entries()) {
                searchParams[key] = value;
            }
            
            // Track with Facebook Pixel
            if (window.fbq) {
                fbq('track', 'Search', searchParams);
            }
            
            // Track with Google Analytics
            if (window.gtag) {
                gtag('event', 'search', {
                    search_term: JSON.stringify(searchParams)
                });
            }
            
            // Track with Adsumo
            if (window.adsumo) {
                window.adsumo.track('search', searchParams);
            }
            
            if (config.debug) {
                console.log('Tracked search event with params:', searchParams);
            }
        },
        
        /**
         * Track view vehicle event
         * @param {Event} event - The vehicle view event
         */
        trackViewVehicle: function(event) {
            const link = event.currentTarget;
            const vehicleCard = link.closest('.vehicle-card');
            
            if (!vehicleCard) {
                return;
            }
            
            // Extract vehicle data
            const vehicleId = new URL(link.href).searchParams.get('id');
            const vehicleName = vehicleCard.querySelector('h5').textContent;
            const vehiclePrice = vehicleCard.querySelector('.discount-price span').textContent;
            
            const vehicleData = {
                content_type: 'vehicle',
                content_ids: [vehicleId],
                content_name: vehicleName,
                value: parseFloat(vehiclePrice.replace(/[^0-9.]/g, '')),
                currency: 'MYR'
            };
            
            // Track with Facebook Pixel
            if (window.fbq) {
                fbq('track', 'ViewContent', vehicleData);
            }
            
            // Track with Google Analytics
            if (window.gtag) {
                gtag('event', 'view_item', {
                    items: [{
                        id: vehicleId,
                        name: vehicleName,
                        price: vehicleData.value
                    }]
                });
            }
            
            // Track with Adsumo
            if (window.adsumo) {
                window.adsumo.track('viewVehicle', vehicleData);
            }
            
            if (config.debug) {
                console.log('Tracked view vehicle event:', vehicleData);
            }
        },
        
        /**
         * Track initiate checkout event
         * @param {Event} event - The checkout initiation event
         */
        trackInitiateCheckout: function(event) {
            // Get booking data from session storage
            const bookingData = sessionStorage.getItem('bookingData');
            
            if (!bookingData) {
                return;
            }
            
            const parsedData = JSON.parse(bookingData);
            
            // Track with Facebook Pixel
            if (window.fbq) {
                fbq('track', 'InitiateCheckout', {
                    content_type: 'vehicle',
                    content_ids: [parsedData.vehicleId],
                    value: parsedData.totalAmount,
                    currency: 'MYR'
                });
            }
            
            // Track with Google Analytics
            if (window.gtag) {
                gtag('event', 'begin_checkout', {
                    items: [{
                        id: parsedData.vehicleId,
                        price: parsedData.totalAmount
                    }]
                });
            }
            
            // Track with Adsumo
            if (window.adsumo) {
                window.adsumo.track('initiateCheckout', parsedData);
            }
            
            if (config.debug) {
                console.log('Tracked initiate checkout event:', parsedData);
            }
        },
        
        /**
         * Track purchase event
         * @param {Object} purchaseData - The purchase data
         */
        trackPurchase: function(purchaseData) {
            // Track with Facebook Pixel
            if (window.fbq) {
                fbq('track', 'Purchase', {
                    content_type: 'vehicle',
                    content_ids: [purchaseData.vehicleId],
                    value: purchaseData.totalAmount,
                    currency: 'MYR',
                    transaction_id: purchaseData.reference
                });
            }
            
            // Track with Google Analytics
            if (window.gtag) {
                gtag('event', 'purchase', {
                    transaction_id: purchaseData.reference,
                    value: purchaseData.totalAmount,
                    currency: 'MYR',
                    items: [{
                        id: purchaseData.vehicleId,
                        price: purchaseData.totalAmount
                    }]
                });
            }
            
            // Track with Adsumo
            if (window.adsumo) {
                window.adsumo.track('purchase', purchaseData);
            }
            
            if (config.debug) {
                console.log('Tracked purchase event:', purchaseData);
            }
        }
    };
    
    // Initialize the ad tracker
    AdTracker.init();
    
    // Expose the ad tracker to the global scope
    window.trackAds = function(eventName, eventData) {
        switch (eventName) {
            case 'pageView':
                AdTracker.trackPageView();
                break;
            case 'search':
                AdTracker.trackSearch(eventData);
                break;
            case 'viewVehicle':
                AdTracker.trackViewVehicle(eventData);
                break;
            case 'initiateCheckout':
                AdTracker.trackInitiateCheckout(eventData);
                break;
            case 'purchase':
                AdTracker.trackPurchase(eventData);
                break;
            case 'utmCapture':
                // Just store the UTM data, no tracking needed
                break;
            default:
                if (config.debug) {
                    console.log(`Tracked custom event ${eventName}:`, eventData);
                }
                break;
        }
    };
})();
