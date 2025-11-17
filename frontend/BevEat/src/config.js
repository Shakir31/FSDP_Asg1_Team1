let commonUrl = "https://sandbox.nets.openapipaas.com/api/v1";

const _env = (typeof globalThis !== "undefined" && globalThis.process && globalThis.process.env) ? globalThis.process.env : import.meta.env;

const API_HOST = import.meta.env.VITE_NETS_API_HOST || "https://sandbox.nets.openapipaas.com";
const API_PREFIX = import.meta.env.VITE_NETS_API_PREFIX ?? ""; // try "/api" or empty string

function build(path) {
  // ensure no double slashes
  const host = API_HOST.replace(/\/+$/,"");
  const prefix = API_PREFIX ? ("/" + API_PREFIX.replace(/^\/+|\/+$/g,"")) : "";
  const p = path.replace(/^\/+/,"");
  const url = `${host}${prefix}/${p}`;
  console.info("API URL ->", url); // logs final URL to console for debugging
  return url;
}

const commonConfigs = {
    apiUrls: {
        requestNetsApi: () => build("v1/nets/request"), // POST
        webhookNetsApi: (txnRetrievalRef) => build(`v1/nets/webhook/stream/${txnRetrievalRef}`), // SSE
        queryNetsApi: () => build("v1/nets/query"), // POST
    },
    apiHeader: {
        "Content-Type": "application/json",
        Accept: "application/json",
        // add auth headers here if required, e.g. 'x-api-key': import.meta.env.VITE_API_KEY
    },
};

export default commonConfigs;