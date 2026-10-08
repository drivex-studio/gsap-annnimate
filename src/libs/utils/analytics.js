let eventQueue = [];
let flushInterval = null;
let queueTimeout = 0;

const flushQueue = () => {
    const ph = window.posthog;
    
    if (!ph || typeof ph.capture !== 'function') {
        if (Date.now() > queueTimeout) {
            eventQueue = [];
            clearInterval(flushInterval);
            flushInterval = null;
        }
        return;
    }
    
    const queueCopy = eventQueue;
    eventQueue = [];
    clearInterval(flushInterval);
    flushInterval = null;
    
    for (const { eventName, properties, options, at } of queueCopy) {
        try {
            ph.capture(eventName, properties, {
                ...(options || {}),
                timestamp: at
            });
        } catch (err) {}
    }
};

const captureEvent = (eventName, properties = {}, options) => {
    const ph = window.posthog;
    
    if (ph && typeof ph.capture === 'function') {
        if (eventQueue.length) {
            flushQueue();
        }
        try {
            ph.capture(eventName, properties, options);
        } catch (err) {}
        return;
    }
    
    if (!(eventQueue.length >= 30)) {
        eventQueue.push({
            eventName,
            properties,
            options,
            at: new Date()
        });
    }
    
    if (!flushInterval) {
        queueTimeout = Date.now() + 20000;
        flushInterval = setInterval(flushQueue, 200);
    }
};

export const analytics = {
    identify: (userId, traits = {}) => {
        const ph = window.posthog;
        if (ph && typeof ph.identify === 'function') {
            try {
                ph.identify(userId, {
                    ...traits,
                    identified_at: new Date().toISOString()
                });
            } catch (err) {}
        }
    },
    reset: () => {
        const ph = window.posthog;
        if (ph && typeof ph.reset === 'function') {
            try {
                ph.reset();
            } catch (err) {}
        }
    },
    animation: {
        viewed: (animationId, animationName, category, tags = []) => {
            captureEvent('animation_viewed', {
                animation_id: animationId,
                animation_name: animationName,
                category,
                tags,
                timestamp: new Date().toISOString()
            });
        },
        copied: (animationId, animationName, platform, category) => {
            captureEvent('animation_copied', {
                animation_id: animationId,
                animation_name: animationName,
                platform,
                category,
                timestamp: new Date().toISOString()
            });
        },
        saved: (animationId, animationName, category) => {
            captureEvent('animation_saved', {
                animation_id: animationId,
                animation_name: animationName,
                category,
                timestamp: new Date().toISOString()
            });
        },
        unsaved: (animationId, animationName, category) => {
            captureEvent('animation_unsaved', {
                animation_id: animationId,
                animation_name: animationName,
                category,
                timestamp: new Date().toISOString()
            });
        }
    },
    features: {
        voted: (featureId, featureTitle, voteAction, featureCategory) => {
            captureEvent('feature_voted', {
                feature_id: featureId,
                feature_title: featureTitle,
                vote_action: voteAction,
                feature_category: featureCategory,
                timestamp: new Date().toISOString()
            });
        },
        submitted: (featureId, featureTitle, featureCategory) => {
            captureEvent('feature_submitted', {
                feature_id: featureId,
                feature_title: featureTitle,
                feature_category: featureCategory,
                timestamp: new Date().toISOString()
            });
        }
    },
    search: {
        performed: (query, resultsCount, filters = {}) => {
            captureEvent('search_performed', {
                query,
                results_count: resultsCount,
                filters,
                timestamp: new Date().toISOString()
            });
        },
        filtered: (filters, resultsCount) => {
            captureEvent('filters_applied', {
                filters,
                results_count: resultsCount,
                timestamp: new Date().toISOString()
            });
        }
    },
    askAi: {
        clicked: (platform) => {
            captureEvent('ask_ai_clicked', {
                platform,
                timestamp: new Date().toISOString()
            });
        }
    },
    user: {
        signedIn: (method = 'email') => {
            captureEvent('user_signed_in', {
                method,
                timestamp: new Date().toISOString()
            });
        },
        signedOut: () => {
            captureEvent('user_signed_out', {
                timestamp: new Date().toISOString()
            });
        },
        profileUpdated: (updatedFields = []) => {
            captureEvent('profile_updated', {
                updated_fields: updatedFields,
                timestamp: new Date().toISOString()
            });
        },
        themeChanged: (theme) => {
            captureEvent('theme_changed', {
                theme,
                timestamp: new Date().toISOString()
            });
        }
    },
    activation: {
        onboardingCompleted: (totalTimeMs, stepsCompleted) => {
            captureEvent('onboarding_completed', {
                total_time_ms: totalTimeMs,
                steps_completed: stepsCompleted,
                timestamp: new Date().toISOString()
            });
        }
    },
    revenue: {
        checkoutStarted: (plan, price, billingCycle) => {
            captureEvent('checkout_started', {
                plan,
                price,
                billing_cycle: billingCycle,
                timestamp: new Date().toISOString()
            });
        },
        checkoutAbandoned: (reason = 'user_canceled') => {
            captureEvent('checkout_abandoned', {
                reason,
                timestamp: new Date().toISOString()
            });
        }
    },
    feature: {
        codeViewerOpened: (animationId, platform) => {
            captureEvent('code_viewer_opened', {
                animation_id: animationId,
                platform,
                timestamp: new Date().toISOString()
            });
        },
        supportContacted: (method) => {
            captureEvent('support_contacted', {
                method,
                timestamp: new Date().toISOString()
            });
        }
    },
    error: {
        occurred: (errorType, errorMessage, context = {}) => {
            captureEvent('error_occurred', {
                error_type: errorType,
                error_message: errorMessage,
                context,
                timestamp: new Date().toISOString()
            });
        },
        exception: (error, context = {}) => {
            const ph = window.posthog;
            if (ph && typeof ph.captureException === 'function') {
                try {
                    ph.captureException(error, {
                        $exception_level: 'error',
                        $exception_type: error?.name || 'Error',
                        $exception_message: error?.message || String(error),
                        ...context
                    });
                } catch (err) {}
            }
            captureEvent('error_occurred', {
                error_type: error?.name || 'Error',
                error_message: error?.message || String(error),
                context,
                timestamp: new Date().toISOString()
            });
        }
    },
    track: (eventName, properties = {}, options) => {
        captureEvent(
            eventName,
            {
                ...properties,
                timestamp: new Date().toISOString()
            },
            options
        );
    },
    isFeatureEnabled: (featureFlag) => {
        const ph = window.posthog;
        if (ph && typeof ph.isFeatureEnabled === 'function') {
            try {
                return ph.isFeatureEnabled(featureFlag);
            } catch (err) {}
        }
        return false;
    },
    getFeatureFlag: (featureFlag) => {
        const ph = window.posthog;
        if (ph && typeof ph.getFeatureFlag === 'function') {
            try {
                return ph.getFeatureFlag(featureFlag);
            } catch (err) {}
        }
        return null;
    }
};

export const trackRetention = (userId, signupDateString) => {
    const daysSinceSignup = Math.floor((new Date() - new Date(signupDateString)) / 86400000);
    
    if (daysSinceSignup === 7) {
        analytics.track('week_1_retention', {
            user_id: userId,
            days_since_signup: daysSinceSignup
        });
    } else if (daysSinceSignup === 14) {
        analytics.track('week_2_retention', {
            user_id: userId,
            days_since_signup: daysSinceSignup
        });
    } else if (daysSinceSignup === 30) {
        analytics.track('month_1_retention', {
            user_id: userId,
            days_since_signup: daysSinceSignup
        });
    }
};

export default analytics;
