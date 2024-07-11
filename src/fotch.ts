import { computed, ref } from "vue";

// Callback for URL construction, this will be called on every request() call.
type UrlConstructor<T> = (a: T) => string;

type MakeFothConfig = {
  defaultRequestInit: RequestInit;
  applyThens: (a: Promise<Response>) => Promise<any>;
};

type FotchSuccessResponse<T> = { err: false, ok: true; data: T; networkError: undefined };
type FotchFailureResponse<T> = { err: true, ok: false; data: T; networkError: undefined };
type FotchNetworkFailureResponse = {
  err: false,
  ok: false;
  data: undefined;
  networkError: string;
};

type FotchResponse<T1, T2> =
  | FotchSuccessResponse<T1>
  | FotchFailureResponse<T2>
  | FotchNetworkFailureResponse;

type SerializeCallback<T> = (data: T) => BodyInit;

type RequestInitFotch<T> = RequestInit & {
  serialize?: SerializeCallback<T>;
};

export function makeFotch(conf: MakeFothConfig) {
  const fotch = <RequestData = any, Success = any, Err = any, UrlParams=RequestData>(
    urlConstructor: UrlConstructor<UrlParams> | string,
    options: RequestInitFotch<RequestData> | undefined = undefined
  ) => {
    const fotchConf: RequestInitFotch<RequestData> = {
      ...conf.defaultRequestInit,
      // overwrite any default options with user provided options
      ...(options ?? {}),
    };

    const data = ref<Success>(); // response data type
    const loading = ref<boolean>(); // request is pending, can be aborted
    const error = ref<Err>(); // response error type
    const statusCode = ref<number>(); // HTTP status code
    const isOk = ref<boolean>(); // ok property from fetch response
    const hasNetworkError = ref<string | undefined>();
    // Convinient computed property to handle error cases in the template.
    const hasError = computed(() => {
      return !loading.value && isOk.value === false;
    });
    let abortCntl: AbortController;
    let _url = typeof urlConstructor === "string" ? urlConstructor : undefined;

    /**
     * Resets state of every variable.
     */
    const reset = () => {
      data.value = undefined;
      loading.value = undefined;
      error.value = undefined;
      statusCode.value = undefined;
      isOk.value = undefined;
      hasNetworkError.value = undefined;
    };


    /**
    * Performs the request to url specified by url callback.
    */
    const request = async (
      payload: RequestData,
    ): Promise<FotchResponse<Success, Err>> => {
      if (_url === undefined) {
        throw new Error(
          "unable to call request without setting url parameters using url()"
        );
      }

      reset(); // start fresh on every new request

      let _isOk = false;

      loading.value = true;

      // Create abort controller with each request
      abortCntl = new AbortController();

      const isGetOrHeadMethod = () => {
        // default method is 'get' when method is undefined
        const m = (fotchConf.method ?? "get").toLocaleLowerCase();
        return m === "get" || m === "head";
      };

      const body = () => {
        if (fotchConf.serialize) return fotchConf.serialize(payload);

        return JSON.stringify(payload);
      };

      const fetchOptions = {
        body: isGetOrHeadMethod() ? undefined : body(),
        signal: abortCntl.signal,
        ...fotchConf,
      };

      try {
        // User will choose what transformation should occur within applyThens.
        // .json(), .blob(), etc. can be called so we let them choose.
        const response = conf.applyThens(
          fetch(_url!, fetchOptions).then((r) => {
            statusCode.value = r.status;
            isOk.value = r.ok;
            _isOk = r.ok;
            return r;
          })
        );

        // Here the response has parsed data, but maybe an error occured, we need to handle that
        await response.then((responseData) => {
          if (statusCode.value! >= 400) {
            error.value = responseData;
            data.value = undefined;
          } else {
            data.value = responseData;
          }
        });
      } catch (err) {
        _isOk = false;
        hasNetworkError.value = err.message;
      }

      loading.value = false;

      return new Promise((res) => {
        if (_isOk) {
          res({
            err: false,
            ok: true,
            data: data.value as Success,
            networkError: undefined,
          });
        } else if (hasNetworkError.value) {
          res({
            err: false,
            ok: false,
            data: undefined,
            networkError: hasNetworkError.value,
          });
        } else {
          res({
            err: true,
            ok: false,
            data: error.value as Err,
            networkError: undefined,
          });
        }
      });
    }

    const url = (p: UrlParams) => {
      if (typeof urlConstructor === "string") {
        _url = urlConstructor;
      } else if (typeof urlConstructor === "function") {
        _url = urlConstructor(p);
      } else {
        throw new Error(
          "Invalid type of url constructor. Use function callback constructor or string"
        );
      }

      return { request };
    }


    /**
     * Aborts request if any and resets the state of all variables.
     */
    const abort = () => {
      // cannot abort non existing request
      if (!abortCntl) return;

      // abort the current request
      abortCntl.abort();
      // back to uninitialized state
      reset();
    };

    return {
      // Methods
      request,
      abort,
      reset,
      url,

      // Data
      data,
      error,
      loading,
      statusCode,
      isOk,
      hasError,
      hasNetworkError,
    };
  };

  return fotch;
}

/**
 * Default fotch instance.
 * You can always create your own wrapper if you need something different.
 */
export const fotch = makeFotch({
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
