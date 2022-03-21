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
  "/antworte-jetzt": {
    "target": "https://staging.antworte.jetzt",
    "secure": true,
    "changeOrigin": true,
    "pathRewrite": {
      "^/antworte-jetzt": ""
    },
    "logLevel": "debug",
    "onProxyRes": function (proxyRes) {
      proxyRes.statusCode = 301;
      proxyRes.statusMessage = 'Moved Permanently';
      proxyRes.headers['Location'] = 'https://staging.antworte.jetzt';
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
    "target": process.env.LT_ADDRESS || "https://lt.frag.jetzt/v2/check",
    "secure": true,
    "changeOrigin": true,
    "pathRewrite": {
      "^/languagetool": ""
    },
    "logLevel": "debug"
  },
  "/spacy": {
    "target": process.env.SPACY_ADDRESS || "https://spacy.frag.jetzt/spacy",
    "secure": true,
    "changeOrigin": true,
    "pathRewrite": {
      "^/spacy": ""
    },
    "logLevel": "debug"
  },
  "/api/ws/websocket": {
    "target": process.env.WS_GATEWAY_WS_ADDRESS || "ws://localhost:8080",
    "secure": process.env.BACKEND_SECURE || false,
    "pathRewrite": {
      [process.env.WS_GATEWAY_WS_REWRITE || "^/api"]: ""
    },
    ...wsHeaders,
    "ws": true,
    "logLevel": "debug"
  },
  "/api/roomsubscription": {
    "target": process.env.WS_GATEWAY_HTTP_ADDRESS || "http://localhost:8080",
    "secure": process.env.BACKEND_SECURE || false,
    "changeOrigin": process.env.BACKEND_CHANGE_ORIGIN || false,
    "pathRewrite": {
      [process.env.WS_GATEWAY_HTTP_REWRITE || "^/api"]: ""
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
  }
};

module.exports = PROXY_CONFIG;
