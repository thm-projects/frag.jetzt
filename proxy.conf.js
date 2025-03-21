let wsHeaders = null;
const wsOrigin = process.env.WS_GATEWAY_WS_ORIGIN;
if (wsOrigin) {
  wsHeaders = {
    headers: {
      host: wsOrigin.substring(wsOrigin.indexOf('//') + 2),
      origin: wsOrigin
    }
  };
}

const PROXY_CONFIG = {
  "/auth": {
    "target": process.env.KEYCLOAK_ADDRESS || "http://localhost:8081",
    "secure": process.env.KEYCLOAK_SECURE || false,
    "changeOrigin": process.env.KEYCLOAK_CHANGE_ORIGIN || false,
    "logLevel": "debug"
  },
  "/matomo": {
    "target": "https://stats.frag.jetzt",
    "secure": true,
    "changeOrigin": false,
    "pathRewrite": {
      "^/matomo": ""
    },
    "logLevel": "debug"
  },
  "/arsnova-click": {
    "target": "https://arsnova.click",
    "secure": true,
    "changeOrigin": true,
    "pathRewrite": {
      "^/arsnova-click": ""
    },
    "logLevel": "debug",
    "onProxyRes": function (proxyRes) {
      proxyRes.statusCode = 301;
      proxyRes.statusMessage = 'Moved Permanently';
      proxyRes.headers['Location'] = 'https://arsnova.click';
    }
  },
  "/deepl": {
    "target": process.env.DEEPL_ADDRESS || "https://api-free.deepl.com/v2",
    "secure": true,
    "changeOrigin": true,
    "logLevel": "debug",
    "pathRewrite": {
      "^/deepl": ""
    },
    "onProxyReq": function (proxyRes, req, res) {
      proxyRes.setHeader('Authorization', 'DeepL-Auth-Key DEEPL_API_KEY');
    }
  },
  "/languagetool": {
    "target": process.env.LT_ADDRESS || "https://frag.jetzt/languagetool",
    "secure": true,
    "changeOrigin": true,
    "pathRewrite": {
      "^/languagetool": ""
    },
    "logLevel": "debug"
  },
  "/spacy": {
    "target": process.env.SPACY_ADDRESS || "https://frag.jetzt/spacy",
    "secure": true,
    "changeOrigin": true,
    "pathRewrite": {
      "^/spacy": ""
    },
    "logLevel": "debug"
  },
  "/lemmatize": {
    "target": process.env.LEMMATIZE_ADDRESS || "https://frag.jetzt/lemmatize",
    "secure": true,
    "changeOrigin": true,
    "pathRewrite": {
      "^/lemmatize": ""
    },
    "logLevel": "debug"
  },
  "/gateway/ws/websocket": {
    "target": process.env.WS_GATEWAY_WS_ADDRESS || "ws://localhost:8080",
    "secure": process.env.BACKEND_SECURE || false,
    "pathRewrite": {
      [process.env.WS_GATEWAY_WS_REWRITE || "^/gateway"]: ""
    },
    ...wsHeaders,
    "ws": true,
    "logLevel": "debug"
  },
  "/gateway-api": {
    "target": process.env.WS_GATEWAY_HTTP_ADDRESS || "http://localhost:8080",
    "secure": process.env.BACKEND_SECURE || false,
    "changeOrigin": process.env.BACKEND_CHANGE_ORIGIN || false,
    "pathRewrite": {
      [process.env.WS_GATEWAY_HTTP_REWRITE || "^/gateway-api"]: ""
    },
    "logLevel": "debug"
  },
  "/api": {
    "target": process.env.BACKEND_ADDRESS || "http://localhost:8888",
    "secure": process.env.BACKEND_SECURE || false,
    "changeOrigin": process.env.BACKEND_CHANGE_ORIGIN || false,
    "pathRewrite": {
      "^/api": ""
    },
    "logLevel": "debug"
  },
  "/ai": {
    "target": process.env.AI_ADDRESS || "http://localhost:6001",
    "secure": process.env.AI_SECURE || false,
    "changeOrigin": process.env.AI_CHANGE_ORIGIN || false,
    "pathRewrite": {
      "^/ai": ""
    },
    "logLevel": "debug"
  }
};

module.exports = PROXY_CONFIG;
