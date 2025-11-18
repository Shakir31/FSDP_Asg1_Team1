// let commonUrl = "https://sandbox.nets.openapipaas.com/api/v1";

// const _env = (typeof globalThis !== "undefined" && globalThis.process && globalThis.process.env) ? globalThis.process.env : import.meta.env;

// const API_HOST = import.meta.env.VITE_NETS_API_HOST || "https://sandbox.nets.openapipaas.com";
// const API_PREFIX = import.meta.env.VITE_NETS_API_PREFIX ?? "/api"; // try "/api" or empty string

// function build(path) {
//   // ensure no double slashes
//   const host = API_HOST.replace(/\/+$/,"");
//   const prefix = API_PREFIX ? ("/" + API_PREFIX.replace(/^\/+|\/+$/g,"")) : "";
//   const p = path.replace(/^\/+/,"");
//   const url = `${host}${prefix}/${p}`;
//   console.info("API URL ->", url); // logs final URL to console for debugging
//   return url;
// }

// const commonConfigs = {
//     apiUrls: {
//         requestNetsApi: () => build("v1/nets/request"), // POST
//         webhookNetsApi: (txnRetrievalRef) => build(`v1/nets/webhook/stream/${txnRetrievalRef}`), // SSE
//         queryNetsApi: () => build("v1/nets/query"), // POST
//     },
//     apiHeader: {
//         "Content-Type": "application/json",
//         Accept: "application/json",
//         'x-api-key': import.meta.env.VITE_API_KEY
//     },
// };

// console.log("API Key Loaded:", import.meta.env.VITE_API_KEY);

// export default commonConfigs;

// Based on the sample provided
const commonUrl = "https://sandbox.nets.openapipaas.com/api/v1";

const commonConfigs = {
    apiHeader: {
        "Content-Type": "application/json",
        Accept: "application/json",
        // Sample uses "api-key" and "project-id", NOT "x-api-key"
        "api-key": import.meta.env.VITE_API_KEY, 
        "project-id": import.meta.env.VITE_PROJECT_ID 
    },
    apiUrls: {
        // Updated paths to match the sample
        requestNetsApi: () => `${commonUrl}/common/payments/nets-qr/request`,
        queryNetsApi: () => `${commonUrl}/common/payments/nets-qr/query`,
        webhookNetsApi: (txnRetrievalRef) => `${commonUrl}/common/payments/nets/webhook?txn_retrieval_ref=${txnRetrievalRef}`,
    },
};

export default commonConfigs;