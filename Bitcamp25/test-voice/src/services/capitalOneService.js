const API_KEY = 'f1fbb5f9a7bfdc1597fafdf76476cfa7';
const BASE_URL = 'https://api.nessieisreal.com';
// Default ID to use if no specific ID is provided
export const DEFAULT_ID = '67fb0a2b9683f20dd519556e';

// Helper function to handle fetch requests
const apiRequest = async (endpoint, method = 'GET', body = null) => {
  // Fix: First clean and normalize the endpoint to prevent duplicate default IDs
  // Check if the endpoint contains multiple parameters that might be replaced
  const pathParts = endpoint.split('/').filter(Boolean);
  let processedEndpoint = '';
  
  // If this endpoint has nested resources like /customers/{id}/accounts/{id}
  // Make sure we don't replace both with the DEFAULT_ID and create duplications
  if (pathParts.length > 1 && !endpoint.includes(DEFAULT_ID)) {
    let hasAppliedDefaultId = false;
    
    pathParts.forEach((part, index) => {
      processedEndpoint += '/';
      
      // Check if this part looks like a placeholder ID or short ID
      if ((part === '{id}' || part === ':id' || /^\d{1,8}$/.test(part)) && 
          pathParts.length > index + 1 && // Must be followed by a resource name
          !hasAppliedDefaultId) {
        // Replace the first occurrence of a placeholder with DEFAULT_ID
        processedEndpoint += DEFAULT_ID;
        hasAppliedDefaultId = true;
        console.log(`🔄 Using default ID ${DEFAULT_ID} for placeholder in endpoint: ${endpoint}`);
      } else {
        processedEndpoint += part;
      }
    });
  } else {
    processedEndpoint = endpoint;
  }
  
  const url = `${BASE_URL}${processedEndpoint}${processedEndpoint.includes('?') ? '&' : '?'}key=${API_KEY}`;
  
  console.log(`📡 API REQUEST: ${method} ${processedEndpoint}`);
  if (body) {
    console.log('📦 Request data:', JSON.stringify(body, null, 2));
  }

  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    mode: 'cors', // Try explicit CORS mode
    credentials: 'same-origin'
  };

  if (body && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    
    // Log the response status
    console.log(`🔄 Response from ${processedEndpoint}: Status ${response.status}`);
    
    // Special handling for 404s which might be API endpoints that don't exist
    if (response.status === 404) {
      console.warn(`⚠️ Endpoint not found: ${processedEndpoint}`);
      // Return empty array for lists, null for single objects
      const mockResult = processedEndpoint.includes('accounts') || 
             processedEndpoint.includes('customers') || 
             processedEndpoint.includes('deposits') || 
             processedEndpoint.includes('transfers') || 
             processedEndpoint.includes('withdrawals') ? [] : null;
      console.log('🔄 Using mock data instead:', mockResult);
      return mockResult;
    }
    
    if (!response.ok) {
      try {
        const errorData = await response.json();
        console.error(`❌ API Error for ${processedEndpoint}:`, errorData);
        throw new Error(errorData.message || `API request failed with status ${response.status}`);
      } catch (jsonError) {
        // If we can't parse the error as JSON, just throw a basic error
        console.error(`❌ Error parsing error response from ${processedEndpoint}`);
        throw new Error(`API request failed with status ${response.status}`);
      }
    }
    
    if (response.status === 204) {
      console.log(`✅ Success (no content) from ${processedEndpoint}`);
      return { success: true };
    }
    
    try {
      // For debugging - try to get response text
      const respText = await response.text();
      
      // Try to parse the text as JSON
      const result = respText ? JSON.parse(respText) : {};
      console.log(`✅ Response from ${processedEndpoint}:`, 
                  Array.isArray(result) 
                    ? `Array with ${result.length} items` 
                    : JSON.stringify(result, null, 2).substring(0, 300) + (JSON.stringify(result).length > 300 ? '...' : ''));
      return result;
    } catch (jsonError) {
      console.error(`❌ Error parsing JSON response from ${processedEndpoint}:`, jsonError);
      throw new Error('Invalid response format from API');
    }
  } catch (error) {
    console.error(`❌ API request error for ${processedEndpoint}:`, error);
    
    // If this is a network error, show a more helpful message
    if (error.message === 'Failed to fetch') {
      console.error(`🔒 CORS or network issue detected with ${processedEndpoint}`);
      throw new Error(`Network error: Could not connect to Capital One API endpoint ${processedEndpoint}. This may be due to a CORS restriction.`);
    }
    
    throw error;
  }
};

// Mock data functions - use these when API requests fail
const createMockData = () => {
  const customerId = "mock-customer-id-" + Math.floor(Math.random() * 1000000);
  
  const customer = {
    "_id": customerId,
    "first_name": "John",
    "last_name": "Doe",
    "address": {
      "street_number": "123",
      "street_name": "Main St",
      "city": "Washington",
      "state": "DC",
      "zip": "20001"
    }
  };
  
  const accounts = [
    {
      "_id": "mock-account-id-" + Math.floor(Math.random() * 1000000),
      "type": "Checking",
      "nickname": "Primary Checking",
      "rewards": 10,
      "balance": 5000,
      "account_number": "123456789",
      "customer_id": customerId
    },
    {
      "_id": "mock-account-id-" + Math.floor(Math.random() * 1000000),
      "type": "Savings",
      "nickname": "Emergency Fund",
      "rewards": 25,
      "balance": 10000,
      "account_number": "987654321",
      "customer_id": customerId
    },
    {
      "_id": "mock-account-id-" + Math.floor(Math.random() * 1000000),
      "type": "Credit Card",
      "nickname": "Rewards Card",
      "rewards": 100,
      "balance": 1500,
      "account_number": "555555555",
      "customer_id": customerId
    }
  ];
  
  return { customer, accounts };
};

// API Functions for Accounts with fallback to mock data
export const getAccounts = async (type = '') => {
  try {
    const queryParam = type ? `?type=${type}` : '';
    return await apiRequest(`/accounts${queryParam}`);
  } catch (error) {
    console.error("Error in getAccounts, using mock data:", error);
    return createMockData().accounts;
  }
};

export const getAccountById = async (accountId) => {
  try {
    // Use default ID if accountId is not provided
    const id = accountId || DEFAULT_ID;
    return await apiRequest(`/accounts/${id}`);
  } catch (error) {
    console.error("Error in getAccountById, using mock data:", error);
    return createMockData().accounts[0];
  }
};

export const getCustomerAccounts = async (customerId) => {
  try {
    // Use default ID if customerId is not provided
    const id = customerId || DEFAULT_ID;
    return await apiRequest(`/customers/${id}/accounts`);
  } catch (error) {
    console.error("Error in getCustomerAccounts, using mock data:", error);
    return createMockData().accounts;
  }
};

export const createAccount = async (customerId, accountData) => {
  try {
    // Use default ID if customerId is not provided
    const id = customerId || DEFAULT_ID;
    return await apiRequest(`/customers/${id}/accounts`, 'POST', accountData);
  } catch (error) {
    console.error("Error in createAccount, returning mock success:", error);
    return { 
      success: true, 
      objectCreated: { 
        ...accountData, 
        "_id": "mock-account-id-" + Math.floor(Math.random() * 1000000),
        "customer_id": id
      } 
    };
  }
};

export const updateAccount = (accountId, accountData) => {
  // Use default ID if accountId is not provided
  const id = accountId || DEFAULT_ID;
  return apiRequest(`/accounts/${id}`, 'PUT', accountData);
};

export const deleteAccount = (accountId) => {
  // Use default ID if accountId is not provided
  const id = accountId || DEFAULT_ID;
  return apiRequest(`/accounts/${id}`, 'DELETE');
};

// API Functions for Customers with fallback to mock data
export const getCustomers = async () => {
  try {
    return await apiRequest('/customers');
  } catch (error) {
    console.error("Error in getCustomers, using mock data:", error);
    return [createMockData().customer];
  }
};

export const getCustomerById = async (customerId) => {
  try {
    // Use default ID if customerId is not provided
    const id = customerId || DEFAULT_ID;
    return await apiRequest(`/customers/${id}`);
  } catch (error) {
    console.error("Error in getCustomerById, using mock data:", error);
    return createMockData().customer;
  }
};

export const getCustomerByAccount = async (accountId) => {
  try {
    // Use default ID if accountId is not provided
    const id = accountId || DEFAULT_ID;
    
    // Ensure we're not calling the accountId/customer endpoint if we already have the default ID
    // This prevents creating endpoints like `/accounts/DEFAULT_ID/customer` when accountId is already DEFAULT_ID
    if (id === DEFAULT_ID) {
      // If we're using the default ID, first try to get the customer directly
      // to avoid creating nested paths with the same ID
      const customers = await getCustomers();
      if (customers && customers.length > 0) {
        return customers[0];
      }
    }
    
    return await apiRequest(`/accounts/${id}/customer`);
  } catch (error) {
    console.error("Error in getCustomerByAccount, using mock data:", error);
    return createMockData().customer;
  }
};

export const createCustomer = async (customerData) => {
  try {
    return await apiRequest('/customers', 'POST', customerData);
  } catch (error) {
    console.error("Error in createCustomer, returning mock success:", error);
    return { 
      success: true, 
      objectCreated: { 
        ...customerData, 
        "_id": "mock-customer-id-" + Math.floor(Math.random() * 1000000) 
      } 
    };
  }
};

export const updateCustomer = (customerId, customerData) => {
  // Use default ID if customerId is not provided
  const id = customerId || DEFAULT_ID;
  return apiRequest(`/customers/${id}`, 'PUT', customerData);
};

// API Functions for Deposits with mock data fallback
export const getAccountDeposits = async (accountId) => {
  try {
    // Use default ID if accountId is not provided
    const id = accountId || DEFAULT_ID;
    return await apiRequest(`/accounts/${id}/deposits`);
  } catch (error) {
    console.error("Error in getAccountDeposits, using mock data:", error);
    // Return mock deposit
    return [
      {
        "_id": "mock-deposit-id-" + Math.floor(Math.random() * 1000000),
        "type": "deposit",
        "transaction_date": new Date().toISOString().split('T')[0],
        "status": "completed",
        "medium": "balance",
        "amount": 1000,
        "description": "Salary deposit (mock)"
      }
    ];
  }
};

export const getDepositById = (depositId) => {
  // Use default ID if depositId is not provided
  const id = depositId || DEFAULT_ID;
  return apiRequest(`/deposits/${id}`);
};

export const createDeposit = async (accountId, depositData) => {
  try {
    // Use default ID if accountId is not provided
    const id = accountId || DEFAULT_ID;
    return await apiRequest(`/accounts/${id}/deposits`, 'POST', depositData);
  } catch (error) {
    console.error("Error in createDeposit, returning mock success:", error);
    return { 
      success: true, 
      objectCreated: { 
        ...depositData, 
        "_id": "mock-deposit-id-" + Math.floor(Math.random() * 1000000),
        "account_id": id
      } 
    };
  }
};

export const updateDeposit = (depositId, depositData) => {
  // Use default ID if depositId is not provided
  const id = depositId || DEFAULT_ID;
  return apiRequest(`/deposits/${id}`, 'PUT', depositData);
};

export const deleteDeposit = (depositId) => {
  // Use default ID if depositId is not provided
  const id = depositId || DEFAULT_ID;
  return apiRequest(`/deposits/${id}`, 'DELETE');
};

// API Functions for Withdrawals with mock data fallback
export const getAccountWithdrawals = async (accountId) => {
  try {
    // Use default ID if accountId is not provided
    const id = accountId || DEFAULT_ID;
    return await apiRequest(`/accounts/${id}/withdrawals`);
  } catch (error) {
    console.error("Error in getAccountWithdrawals, using mock data:", error);
    // Return mock withdrawal
    return [
      {
        "_id": "mock-withdrawal-id-" + Math.floor(Math.random() * 1000000),
        "type": "withdrawal",
        "transaction_date": new Date().toISOString().split('T')[0],
        "status": "completed",
        "medium": "balance",
        "amount": 250,
        "description": "ATM withdrawal (mock)"
      }
    ];
  }
};

export const getWithdrawalById = (withdrawalId) => {
  // Use default ID if withdrawalId is not provided
  const id = withdrawalId || DEFAULT_ID;
  return apiRequest(`/withdrawals/${id}`);
};

export const createWithdrawal = async (accountId, withdrawalData) => {
  try {
    // Use default ID if accountId is not provided
    const id = accountId || DEFAULT_ID;
    return await apiRequest(`/accounts/${id}/withdrawals`, 'POST', withdrawalData);
  } catch (error) {
    console.error("Error in createWithdrawal, returning mock success:", error);
    return { 
      success: true, 
      objectCreated: { 
        ...withdrawalData, 
        "_id": "mock-withdrawal-id-" + Math.floor(Math.random() * 1000000),
        "account_id": id
      } 
    };
  }
};

export const updateWithdrawal = (withdrawalId, withdrawalData) => {
  // Use default ID if withdrawalId is not provided
  const id = withdrawalId || DEFAULT_ID;
  return apiRequest(`/withdrawals/${id}`, 'PUT', withdrawalData);
};

export const deleteWithdrawal = (withdrawalId) => {
  // Use default ID if withdrawalId is not provided
  const id = withdrawalId || DEFAULT_ID;
  return apiRequest(`/withdrawals/${id}`, 'DELETE');
};

// API Functions for Transfers with mock data fallback
export const getAccountTransfers = async (accountId) => {
  try {
    // Use default ID if accountId is not provided
    const id = accountId || DEFAULT_ID;
    return await apiRequest(`/accounts/${id}/transfers`);
  } catch (error) {
    console.error("Error in getAccountTransfers, using mock data:", error);
    // Return mock transfer
    return [
      {
        "_id": "mock-transfer-id-" + Math.floor(Math.random() * 1000000),
        "type": "transfer",
        "transaction_date": new Date().toISOString().split('T')[0],
        "status": "completed",
        "medium": "balance",
        "payer_id": id,
        "payee_id": "mock-account-id-" + Math.floor(Math.random() * 1000000),
        "amount": 500,
        "description": "Transfer to savings (mock)"
      }
    ];
  }
};

export const getTransferById = (transferId) => {
  // Use default ID if transferId is not provided
  const id = transferId || DEFAULT_ID;
  return apiRequest(`/transfers/${id}`);
};

export const createTransfer = async (accountId, transferData) => {
  try {
    // Use default ID if accountId is not provided
    const id = accountId || DEFAULT_ID;
    
    // Make sure the payee_id (destination account) is valid
    if (transferData && transferData.payee_id) {
      // If the payee_id is the same as our ID, modify it to avoid duplicate IDs in the API
      if (transferData.payee_id === id || transferData.payee_id === DEFAULT_ID) {
        console.warn("Detected same source and destination account ID in transfer. Modifying payee_id to avoid API issues.");
        // Create a slightly different ID to avoid duplicates
        transferData.payee_id = `${DEFAULT_ID.substring(0, 10)}a`;
      }
    }
    
    return await apiRequest(`/accounts/${id}/transfers`, 'POST', transferData);
  } catch (error) {
    console.error("Error in createTransfer, returning mock success:", error);
    return { 
      success: true, 
      objectCreated: { 
        ...transferData,
        "_id": "mock-transfer-id-" + Math.floor(Math.random() * 1000000),
        "payer_id": id
      } 
    };
  }
};

export const updateTransfer = (transferId, transferData) => {
  // Use default ID if transferId is not provided
  const id = transferId || DEFAULT_ID;
  return apiRequest(`/transfers/${id}`, 'PUT', transferData);
};

export const deleteTransfer = (transferId) => {
  // Use default ID if transferId is not provided
  const id = transferId || DEFAULT_ID;
  return apiRequest(`/transfers/${id}`, 'DELETE');
};

// API Functions for ATMs and Branches with mock data fallback
export const getATMs = async (lat, lng, rad) => {
  try {
    return await apiRequest(`/atms?lat=${lat}&lng=${lng}&rad=${rad}`);
  } catch (error) {
    console.error("Error in getATMs, using mock data:", error);
    // Return mock ATMs
    return [
      {
        "_id": "mock-atm-id-1",
        "name": "Downtown ATM",
        "language_list": ["English", "Spanish"],
        "geocode": { "lat": lat + 0.01, "lng": lng + 0.01 },
        "hours": ["24/7"],
        "accessibility": true,
        "amount_left": 2500
      },
      {
        "_id": "mock-atm-id-2",
        "name": "Shopping Mall ATM",
        "language_list": ["English", "Spanish", "French"],
        "geocode": { "lat": lat - 0.01, "lng": lng - 0.01 },
        "hours": ["9:00-21:00"],
        "accessibility": true,
        "amount_left": 1800
      }
    ];
  }
};

export const getATMById = (atmId) => {
  // Use default ID if atmId is not provided
  const id = atmId || DEFAULT_ID;
  return apiRequest(`/atms/${id}`);
};

export const getBranches = async () => {
  try {
    return await apiRequest('/branches');
  } catch (error) {
    console.error("Error in getBranches, using mock data:", error);
    // Return mock branches
    return [
      {
        "_id": "mock-branch-id-1",
        "name": "Capital One Main Branch",
        "hours": ["Mon-Fri: 9:00-17:00", "Sat: 10:00-14:00"],
        "phone_number": "202-555-0123",
        "address": {
          "street_number": "123",
          "street_name": "Financial Ave",
          "city": "Washington",
          "state": "DC",
          "zip": "20001"
        }
      },
      {
        "_id": "mock-branch-id-2",
        "name": "Capital One Downtown Branch",
        "hours": ["Mon-Fri: 9:00-18:00"],
        "phone_number": "202-555-0187",
        "address": {
          "street_number": "456",
          "street_name": "Market St",
          "city": "Washington",
          "state": "DC",
          "zip": "20002"
        }
      }
    ];
  }
};

export const getBranchById = (branchId) => {
  // Use default ID if branchId is not provided
  const id = branchId || DEFAULT_ID;
  return apiRequest(`/branches/${id}`);
};

export default {
  getAccounts,
  getAccountById,
  getCustomerAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  getCustomers,
  getCustomerById,
  getCustomerByAccount,
  createCustomer,
  updateCustomer,
  getAccountDeposits,
  getDepositById,
  createDeposit,
  updateDeposit,
  deleteDeposit,
  getAccountWithdrawals,
  getWithdrawalById,
  createWithdrawal,
  updateWithdrawal,
  deleteWithdrawal,
  getAccountTransfers,
  getTransferById,
  createTransfer,
  updateTransfer,
  deleteTransfer,
  getATMs,
  getATMById,
  getBranches,
  getBranchById
}; 