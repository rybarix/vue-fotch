```vue
<script setup lang="ts">
import { fotch } from './fotch'; /* our fotch instance created with makeFotch() */

type User = { // Expected  success response type
  id: number;
  name: string;
  username: string;
  email: string;
  address: {
    street: string;
    suite: string;
    city: string;
    zipcode: string
    geo: {
      lat: number;
      lng: number;
    }
  },
  phone: string;
  website: string;
  company: {
    name: string;
    catchPhrase: string;
    bs: string;
  }
}

type Err = { // Error response when status code is >= 400
  message: string
}

// Create Fotch instance for GET request
const fetchUser = fotch<void, User, Err, number>((id) => 'https://jsonplaceholder.typicode.com/users/' + id );
//                      ^^^^ no payload, ^^^^^^...^^ is the type of the url callback param

// Or use destructuring and vue will auto unwrap refs in <template>
// const { data, loading, url, ...r } = fotch<void, User, Err, number>((id) => 'https://jsonplaceholder.typicode.com/users/' + id );

// Function to fetch data
const fetchData = () => {
  fetchUser.url(1).request();
  //       ^^^^^^^
  //       Note that if we provide callback for url in the fotch call.
  //       Then we need to call .url() before request() to build url we want to fotch.
};
</script>

<template>
  <div>
    <button @click="fetchData">Fetch Data</button>
    <!-- We need to manually unwrap the values because we are not destructuring them. -->
    <div v-if="fetchUser.loading.value">Loading...</div>
    <div v-else-if="fetchUser.hasError.value">Error: {{ fetchUser.error.value }}</div>
    <div v-else-if="fetchUser.data.value">Data: {{ fetchUser.data.value }}</div>
  </div>
</template>
```