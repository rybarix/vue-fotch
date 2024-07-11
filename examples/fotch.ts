/**
 * Example of fotch configured for JSON APIs.
 */
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