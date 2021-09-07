const PROXY_CONFIG = {
  "/deepl": {
    "target": "https://api-free.deepl.com/v2",
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
    "target": "https://lt.frag.jetzt/v2/check",
    "secure": true,
    "changeOrigin": true,
    "pathRewrite": {
      "^/languagetool": ""
    },
    "logLevel": "debug"
  },
  "/spacy": {
    "target": "https://spacy.frag.jetzt/spacy",
    "secure": true,
    "changeOrigin": true,
    "pathRewrite": {
      "^/spacy": ""
    },
    "logLevel": "debug"
  },
  "/api/ws/websocket": {
    "target": "ws://localhost:8080",
    "secure": false,
    "pathRewrite": {
      "^/api": ""
    },
    "ws": true,
    "logLevel": "debug"
  },
  "/api/roomsubscription": {
    "target": "http://localhost:8080",
    "secure": false,
    "pathRewrite": {
      "^/api": ""
    },
    "logLevel": "debug"
  },
  "/api": {
    "target": "http://localhost:8888",
    "secure": false,
    "pathRewrite": {
      "^/api": ""
    },
    "logLevel": "debug"
  }
};

module.exports = PROXY_CONFIG;
