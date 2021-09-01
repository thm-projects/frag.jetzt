const PROXY_CONFIG = {
  "/deepl": {
    "target": "https://api-free.deepl.com/v2",
    "secure": true,
    "changeOrigin": true,
    "logLevel": "debug",
    "router": function (req) {
      const DEEPL_API_KEY = 'DEEPL_API_KEY';
      req.url = req.url.substr(6) + '&auth_key=' + DEEPL_API_KEY;
      return 'https://api-free.deepl.com/v2';
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
