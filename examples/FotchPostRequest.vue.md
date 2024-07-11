```vue
<script setup lang="ts">
import { fotch } from './fotch'; /* our fotch instance created with makeFotch() */

type UserCreate = { // Expected  success response type
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

interface User extends UserCreate {
    id: number;
}

type Err = { // Error response when status code is >= 400
  message: string
}

// Create Fotch instance for GET request
const createUser = fotch<UserCreate, User, Err>('https://jsonplaceholder.typicode.com/users', {
  method: 'POST',
});

// Or use destructuring and vue will auto unwrap refs in <template>
// const { data, loading, url, ...r } = fotch<UserCreate, User, Err>('https://jsonplaceholder.typicode.com/users');

// Function to fetch data
const handleCreateUser = () => {
  createUser.request({
    name: '...',
    // all fields required by UserCreate type
  }).then(({ ok, err, data, networkErr }) => {
    // You can work with response data here if you need.

    if (ok) {
        // data is type of User here
    }
    if (err) {
        // status code >= 400
        // data  is type of Err here
    }
    if (!ok && !err) {
        // we encountered network error
        // networkErr is available here as string
    }
  })
};
</script>

<template>
  <div>
    <button @click="handleCreateUser">Create user</button>
        
    <div v-if="createUser.loading.value">Loading...</div>
    <div v-else-if="createUser.hasError.value">Error: {{ createUser.error.value }}</div>
    <div v-else-if="createUser.data.value">Data: {{ createUser.data.value }}</div>
  </div>
</template>
```