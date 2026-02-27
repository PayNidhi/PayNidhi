import axios from "axios";

const API_URL = "http://localhost:5001/api/admin";

const adminApi = axios.create({
    baseURL: API_URL,
    withCredentials: true,
});

export const getStats = () => adminApi.get("/stats");
export const getSellers = () => adminApi.get("/sellers");
export const getLenders = () => adminApi.get("/lenders");
export const getPendingNOAs = () => adminApi.get("/invoices/pending-noa");
export const verifyNOA = (id, data) => adminApi.patch(`/invoice/${id}/verify-noa`, data);
export const settleInvoice = (id) => adminApi.post(`/invoice/${id}/settle`);
export const toggleUser = (role, id, data) => adminApi.patch(`/user/${role}/${id}/toggle`, data);
export const getTransactions = () => adminApi.get("/transactions");
export const getFinances = () => adminApi.get("/finances");
export const getLedger = () => adminApi.get("/ledger");

export default adminApi;
