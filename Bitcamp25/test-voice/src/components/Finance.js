import React, { useState, useEffect } from 'react';
import capitalOneService from '../services/capitalOneService';
import AccountList from './finance/AccountList';
import CustomerInfo from './finance/CustomerInfo';
import TransactionHistory from './finance/TransactionHistory';
import AccountActions from './finance/AccountActions';
import BranchLocator from './finance/BranchLocator';

const Finance = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [activeView, setActiveView] = useState('accounts'); // accounts, customer, transactions, actions, branches
  const [initializingData, setInitializingData] = useState(false);
  // API status display
  const [apiStatus, setApiStatus] = useState(null);
  // Add a state to track the current endpoint
  const [currentEndpoint, setCurrentEndpoint] = useState('');

  // Listen for API status messages
  useEffect(() => {
    const handleApiStatusMessage = (event) => {
      if (event.data && event.data.type === 'API_STATUS') {
        setApiStatus({
          ...event.data,
          timestamp: new Date()
        });
        
        // Extract and set the current endpoint
        if (event.data.status === 'request') {
          const message = event.data.message;
          const match = message.match(/API REQUEST: \w+ (\/[^\s]+)/);
          if (match && match[1]) {
            setCurrentEndpoint(match[1]);
          }
        }
        
        // Clear status after 5 seconds
        setTimeout(() => {
          setApiStatus(null);
        }, 5000);
      }
    };
    
    // Add listener for postMessage events
    window.addEventListener('message', handleApiStatusMessage);
    
    // Set up console.log override to capture API calls
    const originalConsoleLog = console.log;
    console.log = function() {
      // Call the original console.log
      originalConsoleLog.apply(console, arguments);
      
      // Check if this is an API request log
      const args = Array.from(arguments).join(' ');
      if (args.includes('API REQUEST:')) {
        window.postMessage({
          type: 'API_STATUS',
          status: 'request',
          message: args
        }, '*');
      } else if (args.includes('Response from')) {
        window.postMessage({
          type: 'API_STATUS',
          status: 'response',
          message: args
        }, '*');
      } else if (args.includes('API Error') || args.includes('CORS or network issue')) {
        window.postMessage({
          type: 'API_STATUS',
          status: 'error',
          message: args
        }, '*');
      }
    };
    
    // Cleanup
    return () => {
      window.removeEventListener('message', handleApiStatusMessage);
      console.log = originalConsoleLog;
    };
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
        // First, try to get the account with the default ID
        let defaultAccount = null;
        try {
          // Get the default account directly using the constant from the service
          defaultAccount = await capitalOneService.getAccountById();
          console.log("Got default account:", defaultAccount);
        } catch (err) {
          console.log("Could not fetch default account, will try to get all accounts");
        }
        
        // Fetch accounts and customers
        let accountsData = await capitalOneService.getAccounts();
        let customersData = await capitalOneService.getCustomers();
        
        // Check if we need to create test data
        if ((!accountsData || accountsData.length === 0) || (!customersData || customersData.length === 0)) {
          // Show initializing status
          setInitializingData(true);
          
          // Create test data if no data exists
          const testData = await createTestData();
          if (testData) {
            accountsData = testData.accounts;
            customersData = testData.customers;
          }
        }
        
        setAccounts(accountsData || []);
        setCustomers(customersData || []);
        
        // Decide which account to select
        let selectedAccountObj = null;
        
        // First preference: Use the default account if it exists
        if (defaultAccount) {
          selectedAccountObj = defaultAccount;
        } 
        // Second preference: Use the first account from the list
        else if (accountsData && accountsData.length > 0) {
          selectedAccountObj = accountsData[0];
        }
        
        // If we have an account to select
        if (selectedAccountObj) {
          console.log("Selected account:", selectedAccountObj);
          setSelectedAccount(selectedAccountObj);
          
          try {
            // Get the customer associated with this account
            const customerData = await capitalOneService.getCustomerByAccount(selectedAccountObj._id);
            setSelectedCustomer(customerData);
          } catch (err) {
            console.log("Could not fetch customer for account, using first customer instead");
            if (customersData && customersData.length > 0) {
              setSelectedCustomer(customersData[0]);
            }
          }
          
          // Get transactions (deposits, withdrawals, transfers) for this account
          await fetchTransactions(selectedAccountObj._id);
        }
        
        setInitializingData(false);
        setLoading(false);
      } catch (err) {
        console.error("Error in fetchInitialData:", err);
        setError(err.message || 'Failed to fetch data');
        setInitializingData(false);
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, []);
  
  // Function to create test data if none exists
  const createTestData = async () => {
    try {
      console.log("Creating test data...");
      
      // Create a test customer
      const customerData = {
        first_name: "John",
        last_name: "Doe",
        address: {
          street_number: "123",
          street_name: "Main St",
          city: "Washington",
          state: "DC",
          zip: "20001"
        }
      };
      
      const customerResponse = await capitalOneService.createCustomer(customerData);
      console.log("Created customer:", customerResponse);
      
      // Get the customer ID from the response
      let customerId;
      if (customerResponse && customerResponse.objectCreated) {
        customerId = customerResponse.objectCreated._id;
      } else if (customerResponse && customerResponse._id) {
        customerId = customerResponse._id;
      } else {
        // Try to get first customer if we couldn't create one
        const customers = await capitalOneService.getCustomers();
        if (customers && customers.length > 0) {
          customerId = customers[0]._id;
        } else {
          throw new Error("Failed to create or find a customer");
        }
      }
      
      // Create a checking account
      const checkingAccountData = {
        type: "Checking",
        nickname: "Primary Checking",
        rewards: 10,
        balance: 5000,
        account_number: "123456789"
      };
      
      const savingsAccountData = {
        type: "Savings",
        nickname: "Emergency Fund",
        rewards: 25,
        balance: 10000,
        account_number: "987654321"
      };
      
      const creditAccountData = {
        type: "Credit Card",
        nickname: "Rewards Card",
        rewards: 100,
        balance: 1500,
        account_number: "555555555"
      };
      
      // Create accounts
      const checkingResponse = await capitalOneService.createAccount(customerId, checkingAccountData);
      const savingsResponse = await capitalOneService.createAccount(customerId, savingsAccountData);
      const creditResponse = await capitalOneService.createAccount(customerId, creditAccountData);
      
      console.log("Created accounts:", checkingResponse, savingsResponse, creditResponse);
      
      // Get created accounts
      const accounts = await capitalOneService.getCustomerAccounts(customerId);
      const customers = await capitalOneService.getCustomers();
      
      // Create some sample transactions if accounts were created
      if (accounts && accounts.length > 0) {
        // Create deposit
        await capitalOneService.createDeposit(accounts[0]._id, {
          medium: "balance",
          transaction_date: new Date().toISOString().split('T')[0],
          status: "completed",
          amount: 1000,
          description: "Salary deposit"
        });
        
        // Create withdrawal
        await capitalOneService.createWithdrawal(accounts[0]._id, {
          medium: "balance",
          transaction_date: new Date().toISOString().split('T')[0],
          status: "completed",
          amount: 250,
          description: "ATM withdrawal"
        });
        
        // Create transfer between accounts if we have multiple
        if (accounts.length > 1) {
          await capitalOneService.createTransfer(accounts[0]._id, {
            medium: "balance",
            payee_id: accounts[1]._id,
            transaction_date: new Date().toISOString().split('T')[0],
            status: "completed",
            amount: 500,
            description: "Transfer to savings"
          });
        }
      }
      
      return {
        accounts,
        customers
      };
    } catch (err) {
      console.error("Error creating test data:", err);
      return null;
    }
  };
  
  const fetchTransactions = async (accountId) => {
    try {
      // Check if accountId looks like a mock ID and use the default ID if needed
      const isMockId = accountId && (accountId.includes('mock') || accountId.length < 20);
      const id = isMockId ? undefined : accountId; // Use undefined to trigger the default ID in the API service
      
      console.log(`Fetching transactions for account: ${isMockId ? 'Using DEFAULT_ID (mock detected)' : accountId}`);
      
      // Fetch deposits, withdrawals, and transfers for the account
      let deposits = [];
      let withdrawals = [];
      let transfers = [];
      
      try {
        deposits = await capitalOneService.getAccountDeposits(id);
      } catch (e) {
        console.log("Error fetching deposits:", e);
      }
      
      try {
        withdrawals = await capitalOneService.getAccountWithdrawals(id);
      } catch (e) {
        console.log("Error fetching withdrawals:", e);
      }
      
      try {
        transfers = await capitalOneService.getAccountTransfers(id);
      } catch (e) {
        console.log("Error fetching transfers:", e);
      }
      
      // Combine and format transactions
      const allTransactions = [
        ...(Array.isArray(deposits) ? deposits.map(d => ({ ...d, type: 'deposit' })) : []),
        ...(Array.isArray(withdrawals) ? withdrawals.map(w => ({ ...w, type: 'withdrawal' })) : []),
        ...(Array.isArray(transfers) ? transfers.map(t => ({ ...t, type: 'transfer' })) : [])
      ];
      
      // Sort by date (newest first)
      allTransactions.sort((a, b) => {
        const dateA = new Date(a.transaction_date || a.payment_date || 0);
        const dateB = new Date(b.transaction_date || b.payment_date || 0);
        return dateB - dateA;
      });
      
      setTransactions(allTransactions);
    } catch (err) {
      console.error("Error in fetchTransactions:", err);
      setError(err.message || 'Failed to fetch transactions');
    }
  };
  
  const handleAccountSelect = async (account) => {
    setSelectedAccount(account);
    
    try {
      // Get customer for this account
      try {
        const isMockId = account._id && (account._id.includes('mock') || account._id.length < 20);
        const accountId = isMockId ? undefined : account._id; // Use undefined to trigger default ID
        
        const customerData = await capitalOneService.getCustomerByAccount(accountId);
        setSelectedCustomer(customerData);
      } catch (err) {
        console.log("Could not fetch customer for account:", err);
        // If we can't get the customer by account, just use the first customer
        if (customers && customers.length > 0) {
          setSelectedCustomer(customers[0]);
        }
      }
      
      // Get transactions for this account
      await fetchTransactions(account._id);
    } catch (err) {
      console.error("Error in handleAccountSelect:", err);
      setError(err.message || 'Failed to fetch account details');
    }
  };
  
  const handleCreateDeposit = async (depositData) => {
    try {
      // Check if we're using a mock account ID
      const isMockId = selectedAccount._id && 
          (selectedAccount._id.includes('mock') || selectedAccount._id.length < 20);
      const accountId = isMockId ? undefined : selectedAccount._id;
      
      await capitalOneService.createDeposit(accountId, depositData);
      
      // Refresh account data and transactions
      const updatedAccount = await capitalOneService.getAccountById(accountId);
      setSelectedAccount(updatedAccount);
      
      await fetchTransactions(accountId);
      
      return { success: true };
    } catch (err) {
      console.error("Error creating deposit:", err);
      setError(err.message || 'Failed to create deposit');
      return { success: false, error: err.message };
    }
  };
  
  const handleCreateWithdrawal = async (withdrawalData) => {
    try {
      // Check if we're using a mock account ID
      const isMockId = selectedAccount._id && 
          (selectedAccount._id.includes('mock') || selectedAccount._id.length < 20);
      const accountId = isMockId ? undefined : selectedAccount._id;
      
      await capitalOneService.createWithdrawal(accountId, withdrawalData);
      
      // Refresh account data and transactions
      const updatedAccount = await capitalOneService.getAccountById(accountId);
      setSelectedAccount(updatedAccount);
      
      await fetchTransactions(accountId);
      
      return { success: true };
    } catch (err) {
      console.error("Error creating withdrawal:", err);
      setError(err.message || 'Failed to create withdrawal');
      return { success: false, error: err.message };
    }
  };
  
  const handleCreateTransfer = async (transferData) => {
    try {
      // Check if we're using a mock account ID
      const isMockId = selectedAccount._id && 
          (selectedAccount._id.includes('mock') || selectedAccount._id.length < 20);
      const accountId = isMockId ? undefined : selectedAccount._id;
      
      // Also check if payee_id is a mock ID
      if (transferData.payee_id && 
          (transferData.payee_id.includes('mock') || transferData.payee_id.length < 20)) {
        console.log("Converting mock payee_id to default ID");
        // Use the default ID with a small modification to avoid having same source and destination
        transferData.payee_id = `${capitalOneService.DEFAULT_ID || '67fb040c9683f20dd5195559'}a`;
      }
      
      await capitalOneService.createTransfer(accountId, transferData);
      
      // Refresh account data and transactions
      const updatedAccount = await capitalOneService.getAccountById(accountId);
      setSelectedAccount(updatedAccount);
      
      await fetchTransactions(accountId);
      
      return { success: true };
    } catch (err) {
      console.error("Error creating transfer:", err);
      setError(err.message || 'Failed to create transfer');
      return { success: false, error: err.message };
    }
  };
  
  return (
    <div className="finance-dashboard">
      <h3 className="section-title">Capital One Banking Dashboard</h3>
      
      {/* Current API Endpoint Indicator */}
      <div className="api-endpoint-display">
        <div className="endpoint-container">
          <span className="endpoint-label">Current API Endpoint:</span>
          <span className="endpoint-value">{currentEndpoint || 'None'}</span>
        </div>
        <div className="api-key-container">
          <span className="api-key-label">API Key:</span>
          <span className="api-key-value">f1fbb5f9a7bfdc1597fafdf76476cfa7</span>
        </div>
      </div>
      
      {/* API Status Indicator */}
      {apiStatus && (
        <div className={`api-status-indicator status-${apiStatus.status}`}>
          <div className="status-icon">
            {apiStatus.status === 'request' ? '🔄' : 
             apiStatus.status === 'response' ? '✅' : '❌'}
          </div>
          <div className="status-content">
            <div className="status-message">
              {apiStatus.message}
            </div>
            <div className="status-time">
              {apiStatus.timestamp.toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}
      
      {/* Navigation Tabs */}
      <div className="finance-tabs">
        <button 
          className={`finance-tab ${activeView === 'accounts' ? 'active' : ''}`}
          onClick={() => setActiveView('accounts')}
        >
          Accounts
        </button>
        <button 
          className={`finance-tab ${activeView === 'customer' ? 'active' : ''}`}
          onClick={() => setActiveView('customer')}
        >
          Customer Info
        </button>
        <button 
          className={`finance-tab ${activeView === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveView('transactions')}
        >
          Transactions
        </button>
        <button 
          className={`finance-tab ${activeView === 'actions' ? 'active' : ''}`}
          onClick={() => setActiveView('actions')}
        >
          Account Actions
        </button>
        <button 
          className={`finance-tab ${activeView === 'branches' ? 'active' : ''}`}
          onClick={() => setActiveView('branches')}
        >
          Branch Locator
        </button>
      </div>
      
      {/* Current Account Summary */}
      {selectedAccount && (
        <div className="account-summary">
          <h4>Selected Account: {selectedAccount.nickname || selectedAccount._id}</h4>
          <div className="account-balance">
            Balance: ${selectedAccount.balance ? selectedAccount.balance.toFixed(2) : '0.00'}
          </div>
          <div className="account-type">
            Type: {selectedAccount.type}
          </div>
        </div>
      )}
      
      {/* Show error state if there's an error */}
      {error && (
        <div className="error-container">
          <p>Error: {error}</p>
          <button className="retry-button" onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}
      
      {/* Show loading state */}
      {(loading || initializingData) && (
        <div className="loading-overlay">
          <div className="spinner-container">
            {initializingData ? 'Creating sample data...' : 'Loading...'}
          </div>
        </div>
      )}
      
      {/* Content based on active view */}
      <div className="finance-content-container">
        {activeView === 'accounts' && (
          <AccountList 
            accounts={accounts} 
            selectedAccount={selectedAccount}
            onSelectAccount={handleAccountSelect}
          />
        )}
        
        {activeView === 'customer' && selectedCustomer && (
          <CustomerInfo customer={selectedCustomer} />
        )}
        
        {activeView === 'transactions' && (
          <TransactionHistory 
            transactions={transactions}
            accountId={selectedAccount?._id}
          />
        )}
        
        {activeView === 'actions' && (
          <AccountActions 
            account={selectedAccount}
            onCreateDeposit={handleCreateDeposit}
            onCreateWithdrawal={handleCreateWithdrawal}
            onCreateTransfer={handleCreateTransfer}
            accounts={accounts}
          />
        )}
        
        {activeView === 'branches' && (
          <BranchLocator />
        )}
      </div>
    </div>
  );
};

export default Finance; 