# Setup Guide

## Installation

```bash
npm install alova
```

## Create Alova Instance

```ts
function createAlova(options?: AlovaOptions): Alova;
```

the following is `AlovaOptions` schame.

| Name           | Type                        | Description                                                                                                                                |
| -------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| requestAdapter | object                      | Request adapter, required, [For Detail](https://alova.js.org/tutorial/advanced/custom/http-adapter)                                        |
| id             | string \| number            | Alova instance id, optional, [For Detail](https://alova.js.org/tutorial/cache/mode#set-alova-id)                                           |
| baseURL        | string                      | Base path, optional, default is empty, [For Detail](https://alova.js.org/tutorial/getting-started/basic/alova)                             |
| statesHook     | object                      | State management hook, optional, [For Detail](https://alova.js.org/tutorial/getting-started/basic/combine-framework)                       |
| timeout        | number                      | Timeout, default is no timeout, [For Detail](https://alova.js.org/tutorial/getting-started/basic/alova)                                    |
| cacheFor       | object                      | Local cache configuration, default GET has 5000ms cache, [For Detail](https://alova.js.org/tutorial/cache/mode)                            |
| l1Cache        | object                      | Level1 cache adapter [For Detail](https://alova.js.org/tutorial/cache/mode)                                                                |
| l2Cache        | object                      | Level2 cache adapter, [For Detail](https://alova.js.org/tutorial/cache/mode)                                                               |
| beforeRequest  | function                    | Before request hook, [For Detail](https://alova.js.org/tutorial/getting-started/basic/global-interceptor)                                  |
| responded      | object \| function          | Request response hook, [For Detail](https://alova.js.org/tutorial/getting-started/basic/global-interceptor)                                |
| shareRequest   | boolean                     | Share request, [For Detail](https://alova.js.org/tutorial/getting-started/basic/alova)                                                     |
| cacheLogger    | boolean \| null \| function | Cache log, [For Detail](https://alova.js.org/tutorial/advanced/in-depth/cache-logger)                                                      |
| snapshots      | number                      | method The number of snapshots is limited, the default is 1000, [For Detail](https://alova.js.org/tutorial/client/in-depth/method-matcher) |

### Example

```js
import { createAlova } from 'alova';
import adapterFetch from 'alova/fetch';
import reactHook from 'alova/react'; // Replace with your framework hook

export const alovaInstance = createAlova({
  baseURL: 'https://api.example.com',
  statesHook: reactHook,
  requestAdapter: adapterFetch(),
  beforeRequest(method) {
    method.config.headers.Authorization = 'Bearer token';
  },
  responded: {
    onSuccess: async (response) => response.json(),
    onError: (error) => console.error(error),
    onComplete: () => console.log('complete'),
  },
});
```

## Built-in states hooks for different frameworks

| Framework    | StatesHook     |
| ------------ | -------------- |
| Vue 3        | `alova/vue`    |
| Nuxt         | `alova/nuxt`   |
| React        | `alova/react`  |
| Next.js      | `alova/react`  |
| React Native | `alova/react`  |
| Expo         | `alova/react`  |
| Svelte       | `alova/svelte` |
| SvelteKit    | `alova/svelte` |
| Solid        | `alova/solid`  |

### Note

When using the stateshook of `alova/nuxt`, make sure to pass in `useNuxtApp` to keep the states on both client and server in sync, and all states are reactive.

```js
createAlova({
  // ...
  statesHook: NuxtHook({
    nuxtApp: useNuxtApp, // mast pass in `useNuxtApp`
  }),
});
```

## Request Adapters

| Adapter | Import                 | Extra Install          | Use Case                    |
| ------- | ---------------------- | ---------------------- | --------------------------- |
| Fetch   | `alova/fetch`          | -                      | Browser, React Native, Expo |
| XHR     | `@alova/adapter-xhr`   | `@alova/adapter-xhr`   | Legacy browsers             |
| Axios   | `@alova/adapter-axios` | `@alova/adapter-axios` | Axios compatibility         |

## Cross-Platform Adapters

| Uniapp | `@alova/adapter-uniapp` | `@alova/adapter-uniapp` | Uniapp |
| Taro | `@alova/adapter-taro` | `@alova/adapter-taro` | Taro |

### Uniapp

extra install `@alova/adapter-uniapp @alova/shared`.

```js
import { createAlova } from 'alova';
import AdapterUniapp from '@alova/adapter-uniapp';

export const alovaInstance = createAlova({
  baseURL: 'https://api.example.com',
  ...AdapterUniapp(),
  responded: {
    onSuccess: (response) => {
      const { statusCode, data } = response;
      // ...
      return data;
    },
  },
});
```

### Taro

extra install `@alova/adapter-taro`.

```js
import { createAlova } from 'alova';
import AdapterTaro from '@alova/adapter-taro'; // or import from '@alova/adapter-taro/vue' in vue3 environment.

export const alovaInstance = createAlova({
  baseURL: 'https://api.example.com',
  ...AdapterTaro(),
  responded: {
    onSuccess: (response) => {
      const { statusCode, data } = response;
      // ...
      return data;
    },
  },
});
```

## Token Authentication Interceptor

Token authentication interceptor provides unified management of token-based login, logout, token assignment, and token refresh, and supports silent token refresh.

Use this interceptor when:

- Your application uses token-based authentication (JWT, Bearer tokens, etc.)
- You need silent token refresh when token expires

📄 [Token Authentication Documentation](https://alova.js.org/tutorial/client/strategy/token-authentication)
