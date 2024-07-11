import assert from "node:assert";
import { makeFotch } from "../src/fotch";
import { run, shutdown } from "./server";

const fotch = makeFotch({
  // Default params for our fetch request
  defaultRequestInit: {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  },
  // these must be called at the end: .json(), .blob(), .text(), .formData(),
  applyThens: (fetchPromise) => fetchPromise.then((r) => r.json()),
});

const testGet = async () => {
  const getReq = fotch<void, { hello: "world" }>("http://localhost:3000/get");

  await getReq.request().then(({ ok, data }) => {
    assert(ok);
    if (ok) {
      assert(data.hello === "world");
    }
  });
};

const testGetNetworkError = async () => {
  // invalid url passed
  const getReq = fotch<void, { hello: "world" }>("http//localhost:3000/get");

  await getReq.request().then(({ ok, networkError }) => {
    assert(!ok);
    assert(!!networkError);
  });
};

const testPost = async () => {
  const getReq = fotch<{ email: string }, { id: number; email: string }>("http://localhost:3000/post",
    {
      method: "POST",
    }
  );

  await getReq
    .request({ email: "example@example.com" })
    .then(({ ok, data }) => {
      assert(ok);
      if (ok) {
        assert(data.id === 1);
        assert(data.email === "example@example.com");
      }
    });
};

const testPostFormData = async () => {
  const postFD = fotch<{ email: string }, { id: number; email: string }>("http://localhost:3000/post",
    {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      serialize: (data) => {
        return new URLSearchParams({
          email: data.email,
        });
      },
    }
  );

  await postFD
    .request({ email: "example@example.com" })
    .then(({ ok, data }) => {
      assert(ok);
      if (ok) {
        assert(data.id === 1);
        assert(data.email === "example@example.com");
      }
    });
};

const testGetVueVars = async () => {
  const getReq = fotch<void, { hello: "world" }>("http://localhost:3000/get");

  assert(getReq.loading.value === undefined);

  await getReq.request().then(({ ok, data }) => {
    assert(ok);
    if (ok) {
      assert(JSON.stringify(getReq.data.value) === JSON.stringify(data));
      assert(data.hello === "world");
    }
  });
};

const testAbortRequest = async () => {
  const getReq = fotch<void, { hello: "world" }>("http://localhost:3000/get");

  getReq.request().then(() => {
    setTimeout(() => assert(getReq.data.value === undefined));
  });
  assert(getReq.loading.value);
  getReq.abort();
  assert(getReq.data.value === undefined);
  assert(getReq.loading.value === undefined);
};

const testGetWithUrlParams = async () => {
  type A = { id: number; };
  const getReq = fotch<void, { id: number }, void, A>(
    (a) => `http://localhost:3000/get/${a.id}`,
  );
  const expectId = 100;
  let expectAssert = false;
  await getReq
    .url({ id: expectId })
    .request()
    .then(({ ok, data }) => {
      assert(ok);
      expectAssert = true;
      if (ok) {
        assert(data.id === expectId);
      }
    });
  assert(expectAssert)
};

const report = async <T>(prom: Promise<T>, name: string) => {
  return prom
    .then(() => console.log(`PASSED - ${name}`))
    .catch((e) => { console.log(`FAILED - ${name} | ${e}`); return Promise.reject(e); })
}

async function runTests() {
  // start test api server to test against
  await run();

  const tests = [
    report(testGetNetworkError(), 'testGetNetworkError'),
    report(testGet(), 'testGet'),
    report(testPost(), 'testPost'),
    report(testPostFormData(), 'testPostFormData'),
    report(testGetVueVars(), 'testGetVueVars'),
    report(testAbortRequest(), 'testAbortRequest'),
    report(testGetWithUrlParams(), 'testGetWithUrlParams'),
  ];

  const results = await Promise.allSettled(tests);
  const fullfilled = results.reduce((acc, c) => { if ( c.status === 'fulfilled') { return acc+1; } return acc; }, 0)
  console.log(`RESULT ${fullfilled} / ${results.length}`);

  // shutdown everything
  shutdown();
}

runTests();
