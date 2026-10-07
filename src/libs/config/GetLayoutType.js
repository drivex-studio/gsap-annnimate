const LAYOUT_ROUTES = {
    marketing: [
        "/", "/pricing", "/faq", "/blog", "/privacy-policy", "/tos", "/built-with",
        "/platform", "/starter-pack", "/vue", "/learn", "/patterns", "/tools",
        "/compare", "/alternatives", "/docs", "/developers", "/affiliate", "/packs/landing"
    ],
    auth: [
        "/login", "/auth", "/welcome", "/checkout", "/checkout-success", "/checkout-canceled",
        "/forgot-password", "/oauth/consent", "/confirmed", "/unsubscribe"
    ],
    app: [
        "/animations", "/roadmap", "/settings", "/help", "/onboarding", "/discord",
        "/changelog", "/account/kits"
    ],
    admin: [
        "/admin"
    ],
    standalone: [
        "/newsletter"
    ]
};

const APP_CHROME_CONFIG = {
    "/animations": {
        public: true,
        edgeToEdge: (subPath) => subPath === null || subPath.split("/").length === 1,
        movesTransitionContent: (subPath) => subPath !== null && subPath !== "saved" && subPath.split("/").length === 1
    },
    "/roadmap": { 
        public: true, 
        edgeToEdge: "exact" 
    },
    "/changelog": { 
        public: true, 
        edgeToEdge: "exact", 
        sidebar: true 
    },
    "/help": { 
        edgeToEdge: "exact" 
    },
    "/account/kits": { 
        edgeToEdge: "subtree" 
    }
};

export function getAppChrome(pathname) {
    for (const [basePath, config] of Object.entries(APP_CHROME_CONFIG)) {
        if (pathname !== basePath && !pathname.startsWith(`${basePath}/`)) {
            continue;
        }

        const subPath = pathname === basePath ? null : pathname.slice(basePath.length + 1).replace(/\/$/, "");
        const isEdgeToEdge = typeof config.edgeToEdge === "function" 
            ? !!config.edgeToEdge(subPath) 
            : config.edgeToEdge === "subtree" || (config.edgeToEdge === "exact" && subPath === null);

        return {
            public: !!config.public,
            edgeToEdge: isEdgeToEdge,
            sidebar: !!config.sidebar && subPath === null,
            movesTransitionContent: typeof config.movesTransitionContent === "function" && !!config.movesTransitionContent(subPath)
        };
    }

    return {
        public: false,
        edgeToEdge: false,
        sidebar: false,
        movesTransitionContent: false
    };
}

export function getLayoutType(pathname) {
    for (const [layoutType, paths] of Object.entries(LAYOUT_ROUTES)) {
        for (const route of paths) {
            if (pathname === route || pathname.startsWith(`${route}/`)) {
                return layoutType;
            }
        }
    }
    return "marketing";
}
