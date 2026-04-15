# Server-Side Request Patterns: BFF to API Gateway

This guide will lead you through the process of building a BFF layer and API gateway with alova.

## Request Flow Overview

```plaintext
Client (Browser/App)
    → Node.js BFF Layer (data transformation)
    → API Gateway (auth, rate limiting, routing)
    → Backend Microservices
```

## BFF Layer: Request Forwarding

Use `async_hooks` to capture request context and auto-forward user headers.

```js
import { createAlova } from 'alova';
import adapterFetch from '@alova/fetch';
import express from 'express';
import { AsyncLocalStorage } from 'node:async_hooks';

const asyncLocalStorage = new AsyncLocalStorage();

const alovaInstance = createAlova({
  requestAdapter: adapterFetch(),
  beforeRequest(method) {
    const context = asyncLocalStorage.getStore();
    if (context && context.headers) {
      method.config.headers = {
        ...method.config.headers,
        ...context.headers,
      };
    }
  },
  responded: {
    onSuccess(response) {
      return {
        data: response.data,
        timestamp: Date.now(),
        transformed: true,
      };
    },
    onError(error) {
      console.error('Request failed:', error);
      throw error;
    },
  },
});

const app = express();

app.use((req, res, next) => {
  const context = {
    userId: req.headers['x-user-id'],
    token: req.headers['authorization'],
  };
  asyncLocalStorage.run(context, next);
});

app.get('/api/user-profile', async (req, res) => {
  const [userInfo, orders] = await Promise.all([
    alovaInstance.Get('http://gateway.com/user/profile'),
    alovaInstance.Get('http://gateway.com/order/recent'),
  ]);

  res.json({ user: userInfo.data, orders: orders.data });
});
```

## API Gateway: Authentication with Redis Cache

Cache auth tokens in Redis to avoid repeated authentication requests.

```js
import { createAlova } from 'alova';
import RedisStorageAdapter from '@alova/storage-redis';
import adapterFetch from '@alova/fetch';
import express from 'express';

const redisAdapter = new RedisStorageAdapter({
  host: 'localhost',
  port: '6379',
  username: 'default',
  password: 'my-top-secret',
  db: 0,
});

const gatewayAlova = createAlova({
  requestAdapter: adapterFetch(),
  async beforeRequest(method) {
    const newToken = await authRequest(
      method.config.headers['Authorization'],
      method.config.headers['UserId']
    );
    method.config.headers['Authorization'] = `Bearer ${newToken}`;
  },
  l2Cache: redisAdapter,
});

const authRequest = (token, userId) =>
  gatewayAlova.Post('http://auth.com/auth/token', null, {
    cacheFor: { mode: 'restore', expire: 3 * 3600 * 1000 },
    headers: {
      'x-user-id': userId,
      Authorization: `Bearer ${token}`,
    },
  });

const app = express();
const methods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'];

methods.forEach((method) => {
  app[method]('*', async (req, res) => {
    const { method, originalUrl, headers, body, query } = req;
    const response = await gatewayAlova.Request({
      method: method.toLowerCase(),
      url: originalUrl,
      params: query,
      data: body,
      headers,
    });
    for (const [key, value] of response.headers.entries()) {
      res.setHeader(key, value);
    }
    res.status(response.status).send(await response.json());
  });
});
```

## Rate Limiting

Use `createRateLimiter` for distributed rate limiting.

```js
import { createRateLimiter } from 'alova/server';

const rateLimit = createRateLimiter({
  duration: 60 * 1000, // reset interval (ms)
  points: 4, // max requests per duration
  keyPrefix: 'user-rate-limit', // namespace
  blockDuration: 24 * 60 * 60 * 1000, // lock duration when exceeded
});

methods.forEach((method) => {
  app[method]('*', async (req, res) => {
    const methodInstance = gatewayAlova.Request({
      method: method.toLowerCase(),
      url: originalUrl,
      params: query,
      data: body,
      headers,
    });
    const response = await rateLimit(methodInstance, { key: req.ip });
  });
});
```

## Third-Party Integration: Auto Token Management

Use `atomize` for atomic access_token updates across distributed processes.

```js
import { createAlova, queryCache } from 'alova';
import RedisStorageAdapter from '@alova/storage-redis';
import adapterFetch from '@alova/fetch';
import { atomize } from 'alova/server';

const redisAdapter = new RedisStorageAdapter({
  host: 'localhost',
  port: '6379',
  username: 'default',
  password: 'my-top-secret',
  db: 0,
});

const thirdPartyAlova = createAlova({
  requestAdapter: adapterFetch(),
  async beforeRequest(method) {
    if (method.meta?.isThirdPartyApi) {
      const accessTokenGetMethod = getAccessToken();
      let accessToken = await queryCache(accessTokenGetMethod);
      if (!accessToken) {
        accessToken = await atomize(accessTokenGetMethod);
      }
      method.config.params.access_token = accessToken;
    }
  },
  l2Cache: redisAdapter,
});

const getAccessToken = () =>
  thirdPartyAlova.Get('http://third-party.com/token', {
    params: {
      grant_type: 'client_credentials',
      client_id: process.env.THIRD_PARTY_CLIENT_ID,
      client_secret: process.env.THIRD_PARTY_CLIENT_SECRET,
    },
    cacheFor: { mode: 'restore', expire: 1 * 3600 * 1000 },
  });

const getThirdPartyUserInfo = (userId) =>
  thirdPartyAlova.Get('http://third-party.com/user/info', {
    params: { userId },
    meta: { isThirdPartyApi: true },
  });
```

## Cluster Mode Cache

Use Redis as L2 cache for multi-process environments:

```js
import { RedisStorageAdapter } from '@alova/storage-redis';

const alovaInstance = createAlova({
  baseURL: 'http://internal-api',
  cacheFor: {
    GET: { mode: 'restore', expire: 60 * 1000 },
  },
  l2Cache: new RedisStorageAdapter({ host: 'localhost', port: 6379 }),
});
```
