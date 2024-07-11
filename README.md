# Vue Fotch

Simple and small fetching library for vue3 projects.

Fetching data comes with managing state - showing loading indicator, rendering data after data arrives and handling error states.

```sh
npm install vue-fotch
```

**Provides**:
- data/loading/error variables of the request that can be used in the template
- setup the request first, perform the request later
- aborting request
- full typing support for the request: `Payload, SuccessResponse, ErrorResponse, UrlParams`
- By default serializes to JSON, but can be changed

## How to?

#### Step 1: crate fotch instance that shares configuration

```ts
import { makeFotch } from "vue-fotch";

// Configuration for Fotch
const fotchConfig = {
  defaultRequestInit: {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }
  },
  applyThens: (responsePromise: Promise<Response>) => responsePromise.then(res => res.json())
};

export const fotch = makeFotch(fotchConfig);
```

#### Step 2: use it inside vue component
```vue
<script setup lang="ts">
// Create Fotch instance for GET request
const createUser = fotch<UserCreate, User, Err>('https://jsonplaceholder.typicode.com/users', {
  method: 'POST',
});

const handleCreateUser = () => {
  createUser.request({
    name: '...',
    // all fields required by UserCreate type
  }).then(({ ok, err, data, networkErr }) => {
    // You can work with response data here if you need.
    if (ok) { /* data is type of User here */ }
    if (err) { /* (status code >= 400) data  is type of Err here */ }
    if (!ok && !err) { /* we encountered network error networkErr is available here as string */ }
  })
};

</script>
<template>
  <button @click="handleCreateUser">Create user</button>
  <!-- We need to manually unwrap the values because we are not destructuring them. -->
  <div v-if="createUser.loading.value">Loading...</div>
  <div v-else-if="createUser.hasError.value">Error: {{ createUser.error.value }}</div>
  <div v-else-if="createUser.data.value">Data: {{ createUser.data.value }}</div>
</template>
```


## More examples

- [Get request example full vue app](./examples/FotchGetRequest.vue.md)
- [Post request example full vue app](./examples/FotchPostRequest.vue.md)
- [Posting payload other than JSON, excerpt from tests](./test/fotch.spec.ts?plain=1#56)


## Development


- `npm run build` To build library for local development and testing
- `npm test` Run test suite with current build
- `npm run build-lib` To build library for publishing (ESM and CJS outpus)

## Comparison against useFetch

**vue-fotch** aims to be explicit when it comes to refetching the resource. And demands explicit calls to either `request(payload)` or `url(urlParams).request(payload)`. That means you can always set the fetcher in your setup script and build the request later.

**useFetch** is [leaning on reactivity and effects](https://vueuse.org/core/useFetch/#refetching-on-url-change) to handle refetching. Also useFetch has much larger api surface supporting request intercepting and more.
