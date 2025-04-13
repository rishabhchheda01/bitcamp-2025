import React from 'react';

const AccountList = ({ accounts, selectedAccount, onSelectAccount }) => {
  return (
    <div className="accounts-list-container">
      <h4>Your Accounts</h4>
      
      {accounts.length === 0 ? (
        <div className="no-accounts">
          <p>No accounts found.</p>
        </div>
      ) : (
        <div className="accounts-grid">
          {accounts.map(account => (
            <div 
              key={account._id}
              className={`account-card ${selectedAccount?._id === account._id ? 'selected' : ''}`}
              onClick={() => onSelectAccount(account)}
            >
              <div className="account-icon">
                {account.type === 'Credit Card' ? '💳' : 
                 account.type === 'Checking' ? '🏦' : '💰'}
              </div>
              <div className="account-details">
                <div className="account-name">{account.nickname || `Account ${account._id.substring(0, 8)}...`}</div>
                <div className="account-type">{account.type}</div>
                <div className="account-balance">${account.balance ? account.balance.toFixed(2) : '0.00'}</div>
                <div className="account-number">
                  Account #: {account.account_number ? 
                    `${account.account_number.substring(0, 4)}...${account.account_number.slice(-4)}` : 
                    'N/A'}
                </div>
              </div>
              {(account.rewards > 0) && (
                <div className="account-rewards">
                  <span className="rewards-label">Rewards</span>
                  <span className="rewards-value">{account.rewards} pts</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      <div className="accounts-summary">
        <div className="summary-card">
          <div className="summary-title">Total Balance</div>
          <div className="summary-value">
            ${accounts.reduce((total, account) => total + (account.balance || 0), 0).toFixed(2)}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-title">Total Accounts</div>
          <div className="summary-value">{accounts.length}</div>
        </div>
        <div className="summary-card">
          <div className="summary-title">Total Rewards</div>
          <div className="summary-value">
            {accounts.reduce((total, account) => total + (account.rewards || 0), 0)} pts
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountList; 