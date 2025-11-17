let commonUrl = "https://sandbox.nets.openapipaas.com/api/v1";

const _env = (typeof globalThis !== "undefined" && globalThis.process && globalThis.process.env) ? globalThis.process.env : import.meta.env;

export const API_BASE = import.meta.env.VITE_NETS_API_BASE || "https://example.com/api"; // set VITE_NETS_API_BASE in your .env
export const SOME_FLAG = (_env.VITE_SOME_FLAG === "true");

const commonConfigs = {
    apiHeader: {
        "api-key": `${_env.VITE_SANDBOX_API_KEY || _env.REACT_APP_SANDBOX_API_KEY || ""}`,
        "project-id": `${_env.VITE_SANDBOX_PROJECT_ID || _env.REACT_APP_SANDBOX_PROJECT_ID || ""}`
    },
    apiUrls: {
        requestNetsApi: () => `${API_BASE}/v1/nets/request`, // POST
        webhookNetsApi: (txnRetrievalRef) =>
            `${API_BASE}/v1/nets/webhook/stream/${txnRetrievalRef}`, // SSE endpoint
        queryNetsApi: () => `${API_BASE}/v1/nets/query`, // POST
    },
};

export default commonConfigs;