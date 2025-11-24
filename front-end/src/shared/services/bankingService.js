import axios from "axios";
import {
     clearPersistedAuth,
     getValidToken
} from "../utils/tokenManager";

// Create axios instance for banking API calls
const apiClient = axios.create({
     timeout: 10000,
     headers: {
          "Content-Type": "application/json",
     },
});

// Add request interceptor to include auth token if available
apiClient.interceptors.request.use(
     (config) => {
          const token = getValidToken();

          if (!token) {
               return Promise.reject(
                    new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.")
               );
          }

          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
          return config;
     },
     (error) => {
          return Promise.reject(error);
     }
);

apiClient.interceptors.response.use(
     (response) => response,
     (error) => {
          if (error.response?.status === 401) {
               clearPersistedAuth();
               error.message =
                    error.response?.data?.message ||
                    "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
          }
          return Promise.reject(error);
     }
);

// Helper function to get bank short code from bank name
const getBankShortCode = (bankName) => {
     const bankCodes = {
          'Vietcombank': 'VCB',
          'VietinBank': 'CTG',
          'BIDV': 'BIDV',
          'Agribank': 'VBA',
          'Techcombank': 'TCB',
          'MB Bank': 'MB',
          'ACB': 'ACB',
          'VPBank': 'VPB',
          'TPBank': 'TPB',
          'Sacombank': 'STB',
          'HDBank': 'HDB',
          'VIB': 'VIB',
          'SHB': 'SHB',
          'OCB': 'OCB',
          'LienVietPostBank': 'LPB',
          'SeABank': 'SEAB',
          'ABBANK': 'ABB',
          'NCB': 'NCB',
          'Kienlongbank': 'KLB',
          'PGBank': 'PGB'
     };
     return bankCodes[bankName] || bankName.substring(0, 3).toUpperCase();
};

export const bankingService = {
     // Get all bank accounts for a user
     getBankAccounts: async (userID) => {
          try {
               const response = await apiClient.get(`https://sep490-g19-zxph.onrender.com/api/PlayerBankAccount?userID=${userID}`);
               return {
                    ok: true,
                    accounts: response.data || []
               };
          } catch (error) {
               console.error('Error fetching bank accounts:', error);
               return {
                    ok: false,
                    reason: error.response?.data?.message || 'Không thể tải danh sách tài khoản ngân hàng'
               };
          }
     },

     // Get a specific bank account
     getBankAccount: async (accountID) => {
          try {
               const response = await apiClient.get(`https://sep490-g19-zxph.onrender.com/api/PlayerBankAccount/${accountID}`);
               return {
                    ok: true,
                    account: response.data
               };
          } catch (error) {
               console.error('Error fetching bank account:', error);
               return {
                    ok: false,
                    reason: error.response?.data?.message || 'Không thể tải thông tin tài khoản ngân hàng'
               };
          }
     },

     // Create a new bank account
     createBankAccount: async (accountData) => {
          try {
               // Prepare data according to API schema
               const requestData = {
                    userID: accountData.userID,
                    bankName: accountData.bankName,
                    bankShortCode: getBankShortCode(accountData.bankName),
                    accountNumber: accountData.accountNumber,
                    accountHolder: accountData.accountHolderName, // Map accountHolderName to accountHolder
                    isDefault:
                         typeof accountData.isDefault === "boolean"
                              ? accountData.isDefault
                              : true // Default to true if not specified
               };

               console.log('Creating bank account with data:', requestData);

               const response = await apiClient.post('https://sep490-g19-zxph.onrender.com/api/PlayerBankAccount', requestData);
               return {
                    ok: true,
                    account: response.data,
                    message: 'Thêm tài khoản ngân hàng thành công'
               };
          } catch (error) {
               console.error('Error creating bank account:', error);
               return {
                    ok: false,
                    reason: error.response?.data?.message || 'Không thể thêm tài khoản ngân hàng'
               };
          }
     },

     // Update a bank account
     updateBankAccount: async (accountID, accountData) => {
          try {
               // Prepare data according to API schema
               const requestData = {
                    userID: accountData.userID,
                    bankName: accountData.bankName,
                    bankShortCode: getBankShortCode(accountData.bankName),
                    accountNumber: accountData.accountNumber,
                    accountHolder: accountData.accountHolderName, // Map accountHolderName to accountHolder
                    isDefault:
                         typeof accountData.isDefault === "boolean"
                              ? accountData.isDefault
                              : false
               };

               console.log('Updating bank account with data:', requestData);

               const response = await apiClient.put(`https://sep490-g19-zxph.onrender.com/api/PlayerBankAccount/${accountID}`, requestData);
               return {
                    ok: true,
                    account: response.data,
                    message: 'Cập nhật tài khoản ngân hàng thành công'
               };
          } catch (error) {
               console.error('Error updating bank account:', error);
               return {
                    ok: false,
                    reason: error.response?.data?.message || 'Không thể cập nhật tài khoản ngân hàng'
               };
          }
     },

     // Delete a bank account
     deleteBankAccount: async (accountID) => {
          try {
               await apiClient.delete(`https://sep490-g19-zxph.onrender.com/api/PlayerBankAccount/${accountID}`);
               return {
                    ok: true,
                    message: 'Xóa tài khoản ngân hàng thành công'
               };
          } catch (error) {
               console.error('Error deleting bank account:', error);
               return {
                    ok: false,
                    reason: error.response?.data?.message || 'Không thể xóa tài khoản ngân hàng'
               };
          }
     },

     // Set default bank account
     setDefaultBankAccount: async (accountID, userID) => {
          try {
               // First get all accounts to unset other defaults
               const accountsResult = await bankingService.getBankAccounts(userID);
               if (!accountsResult.ok) {
                    throw new Error('Không thể tải danh sách tài khoản');
               }

               // Update all accounts to set isDefault = false, then set the selected one to true
               const updatePromises = accountsResult.accounts.map(account => {
                    const isDefault = account.accountID === accountID;
                    return bankingService.updateBankAccount(account.accountID, {
                         ...account,
                         userID: userID,
                         accountHolderName: account.accountHolder || account.accountHolderName,
                         isDefault: isDefault
                    });
               });

               await Promise.all(updatePromises);

               return {
                    ok: true,
                    message: 'Đã đặt tài khoản mặc định thành công'
               };
          } catch (error) {
               console.error('Error setting default bank account:', error);
               return {
                    ok: false,
                    reason: error.message || 'Không thể đặt tài khoản mặc định'
               };
          }
     }
};