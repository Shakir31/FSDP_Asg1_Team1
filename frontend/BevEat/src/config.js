const commonUrl = "https://sandbox.nets.openapipaas.com/api/v1";

const commonConfigs = {
    apiUrl: "http://localhost:3000",
    apiHeader: {
        "Content-Type": "application/json",
        Accept: "application/json",
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