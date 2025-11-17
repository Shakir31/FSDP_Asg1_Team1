let commonUrl = "https://sandbox.nets.openapipaas.com/api/v1";

const _env = (typeof globalThis !== "undefined" && globalThis.process && globalThis.process.env) ? globalThis.process.env : import.meta.env;

export const API_BASE = _env.VITE_API_BASE || "http://localhost:3000";
export const SOME_FLAG = (_env.VITE_SOME_FLAG === "true");

const commonConfigs = {
    apiHeader: {
        "api-key": `${_env.VITE_SANDBOX_API_KEY || _env.REACT_APP_SANDBOX_API_KEY || ""}`,
        "project-id": `${_env.VITE_SANDBOX_PROJECT_ID || _env.REACT_APP_SANDBOX_PROJECT_ID || ""}`
    },
    apiUrls: {
        requestNetsApi: () => `${commonUrl}/common/payments/nets-qr/request`,
        queryNetsApi: () => `${commonUrl}/common/payments/nets-qr/query`,
        webhookNetsApi: (txnRetrieval_ref) => `${commonUrl}/common/payments/nets/webhook?txn_retrieval_ref=${txnRetrieval_ref}`,
    },
};

export default commonConfigs;