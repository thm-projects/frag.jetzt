import 'zone.js/node';

import { APP_BASE_HREF } from '@angular/common';
import { ngExpressEngine } from '@nguniversal/express-engine';
import * as express from 'express';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { AppServerModule } from './src/main.server';
import { createProxyServer } from 'http-proxy';

// The Express app is exported so that it can be used by serverless Functions.
export function app(): express.Express {
  const server = express();
  const proxy = createProxyServer();
  proxy.on('error', (e) => console.error(e));
  const distFolder = join(
    process.cwd(),
    'dist/arsnova-angular-frontend/browser',
  );
  const indexHtml = existsSync(join(distFolder, 'index.original.html'))
    ? 'index.original.html'
    : 'index';

  server.use((req, res, next) => {
    console.log('Try to access: ' + req.path);
    next();
  });

  // Our Universal express-engine (found @ https://github.com/angular/universal/tree/main/modules/express-engine)
  server.engine(
    'html',
    ngExpressEngine({
      bootstrap: AppServerModule,
    }),
  );

  server.set('view engine', 'html');
  server.set('views', distFolder);

  // Example Express Rest API endpoints
  // server.get('/api/**', (req, res) => { });
  // Serve static files from /browser
  server.get(
    '*.*',
    express.static(distFolder, {
      maxAge: '1y',
    }),
  );

  server.all('/matomo/*', (req, res) => {
    req.url = req.url.substring(7);
    proxy.web(req, res, {
      target: 'https://stats.frag.jetzt',
      secure: true,
      changeOrigin: false,
    });
  });

  server.all('/antworte-jetzt', (req, res) => {
    res.statusCode = 301;
    res.statusMessage = 'Moved Permanently';
    res.header('Location', 'https://staging.antworte.jetzt');
    res.send();
  });

  server.all('/deepl/*', (req, res) => {
    req.url = req.url.substring(6);
    req.headers.authorization = 'DeepL-Auth-Key DEEPL_API_KEY';
    proxy.web(req, res, {
      target: process.env.DEEPL_ADDRESS || 'https://api-free.deepl.com/v2',
      secure: true,
      changeOrigin: true,
    });
  });

  server.all('/languagetool/*', (req, res) => {
    req.url = req.url.substring(13);
    proxy.web(req, res, {
      target: process.env.LT_ADDRESS || 'https://frag.jetzt/languagetool',
      secure: true,
      changeOrigin: true,
    });
  });

  server.all('/spacy/*', (req, res) => {
    req.url = req.url.substring(6);
    proxy.web(req, res, {
      target: process.env.SPACY_ADDRESS || 'https://frag.jetzt/spacy',
      secure: true,
      changeOrigin: true,
    });
  });

  server.all('/lemmatize/*', (req, res) => {
    req.url = req.url.substring(10);
    proxy.web(req, res, {
      target: process.env.LEMMATIZE_ADDRESS || 'https://frag.jetzt/lemmatize',
      secure: true,
      changeOrigin: true,
    });
  });

  let wsHeaders = null;
  const wsOrigin = process.env.WS_GATEWAY_WS_ORIGIN;
  if (wsOrigin) {
    wsHeaders = {
      headers: {
        host: wsOrigin.substring(wsOrigin.indexOf('//') + 2),
        origin: wsOrigin,
      },
    };
  }
  server.all('/gateway/ws/websocket/*', (req, res) => {
    console.log(123);
    const rewrite = process.env.WS_GATEWAY_WS_REWRITE  || '^/gateway';
    req.url = req.url.substring(rewrite.length - 1);
    proxy.ws(req, res, {
      target: process.env.WS_GATEWAY_HTTP_ADDRESS || 'http://localhost:8080',
      secure: Boolean(process.env.BACKEND_SECURE || false),
      ws: true,
      ...wsHeaders,
    });
  });

  server.all('/gateway-api/*', (req, res) => {
    const rewrite = process.env.WS_GATEWAY_HTTP_REWRITE || '^/gateway-api';
    req.url = req.url.substring(rewrite.length - 1);
    proxy.web(req, res, {
      target: process.env.WS_GATEWAY_HTTP_ADDRESS || 'http://localhost:8080',
      secure: Boolean(process.env.BACKEND_SECURE || false),
      changeOrigin: Boolean(process.env.BACKEND_CHANGE_ORIGIN || false),
    });
  });

  server.all('/api/*', (req, res) => {
    req.url = req.url.substring(4);
    proxy.web(req, res, {
      target: process.env.BACKEND_ADDRESS || 'http://localhost:8888',
      secure: false,
      changeOrigin: true,
    }, (e, req, res, target) => {
      console.log(e, req, res, target);
    });
  });

  // All regular routes use the Universal engine
  server.get('*', (req, res) => {
    if (req.path === '/favicon.ico') {
      res.sendStatus(404);
      return;
    }
    res.render(indexHtml, {
      req,
      providers: [{ provide: APP_BASE_HREF, useValue: req.baseUrl }],
    });
  });

  return server;
}

function run(): void {
  const port = process.env['PORT'] || 4000;

  // Start up the Node server
  const server = app();
  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

// Webpack will replace 'require' with '__webpack_require__'
// '__non_webpack_require__' is a proxy to Node 'require'
// The below code is to ensure that the server is run only when not requiring the bundle.
declare const __non_webpack_require__: NodeRequire;
const mainModule = __non_webpack_require__.main;
const moduleFilename = (mainModule && mainModule.filename) || '';
if (moduleFilename === __filename || moduleFilename.includes('iisnode')) {
  run();
}

export * from './src/main.server';
