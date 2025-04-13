import React, { useState } from 'react';

const AccountActions = ({ account, onCreateDeposit, onCreateWithdrawal, onCreateTransfer, accounts }) => {
  const [activeAction, setActiveAction] = useState('deposit'); // deposit, withdrawal, transfer
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [targetAccount, setTargetAccount] = useState('');
  const [status, setStatus] = useState('');
  
  if (!account) {
    return (
      <div className="account-actions-container">
        <h4>Account Actions</h4>
        <div className="account-actions-empty">
          <div className="empty-icon">🏦</div>
          <p>Please select an account to perform actions.</p>
        </div>
      </div>
    );
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      setStatus({ type: 'error', message: 'Please enter a valid amount' });
      return;
    }
    
    // Clear previous status
    setStatus({ type: 'loading', message: 'Processing your request...' });
    
    const amountValue = parseFloat(amount);
    
    try {
      let result;
      
      if (activeAction === 'deposit') {
        result = await onCreateDeposit({
          medium: 'balance',
          transaction_date: new Date().toISOString().split('T')[0],
          status: 'pending',
          amount: amountValue,
          description: description || 'Deposit transaction'
        });
      } else if (activeAction === 'withdrawal') {
        // Check if account has sufficient balance
        if (amountValue > (account.balance || 0)) {
          setStatus({ type: 'error', message: 'Insufficient funds for withdrawal' });
          return;
        }
        
        result = await onCreateWithdrawal({
          medium: 'balance',
          transaction_date: new Date().toISOString().split('T')[0],
          status: 'pending',
          amount: amountValue,
          description: description || 'Withdrawal transaction'
        });
      } else if (activeAction === 'transfer') {
        if (!targetAccount) {
          setStatus({ type: 'error', message: 'Please select a destination account' });
          return;
        }
        
        // Check if account has sufficient balance
        if (amountValue > (account.balance || 0)) {
          setStatus({ type: 'error', message: 'Insufficient funds for transfer' });
          return;
        }
        
        result = await onCreateTransfer({
          medium: 'balance',
          payee_id: targetAccount,
          transaction_date: new Date().toISOString().split('T')[0],
          status: 'pending',
          amount: amountValue,
          description: description || 'Transfer transaction'
        });
      }
      
      if (result && result.success) {
        setStatus({ type: 'success', message: `${activeAction.charAt(0).toUpperCase() + activeAction.slice(1)} completed successfully` });
        // Reset form
        setAmount('');
        setDescription('');
        setTargetAccount('');
      } else {
        throw new Error(result.error || 'Transaction failed');
      }
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Failed to process transaction' });
    }
  };
  
  // Get action-specific icons and helper text
  const getActionDetails = () => {
    switch (activeAction) {
      case 'deposit':
        return {
          icon: '⬇️',
          title: 'Make a Deposit',
          description: 'Add funds to your account',
          buttonText: 'Deposit Funds',
          amountLabel: 'Deposit Amount'
        };
      case 'withdrawal':
        return {
          icon: '⬆️',
          title: 'Make a Withdrawal',
          description: 'Withdraw funds from your account',
          buttonText: 'Withdraw Funds',
          amountLabel: 'Withdrawal Amount'
        };
      case 'transfer':
        return {
          icon: '↔️',
          title: 'Transfer Funds',
          description: 'Transfer money between accounts',
          buttonText: 'Transfer Funds',
          amountLabel: 'Transfer Amount'
        };
      default:
        return {
          icon: '🔄',
          title: 'Account Action',
          description: '',
          buttonText: 'Submit',
          amountLabel: 'Amount'
        };
    }
  };
  
  const actionDetails = getActionDetails();
  
  return (
    <div className="account-actions-container">
      <h4>Account Actions</h4>
      
      <div className="action-tabs">
        <button 
          className={`action-tab ${activeAction === 'deposit' ? 'active' : ''}`}
          onClick={() => setActiveAction('deposit')}
        >
          ⬇️ Deposit
        </button>
        <button 
          className={`action-tab ${activeAction === 'withdrawal' ? 'active' : ''}`}
          onClick={() => setActiveAction('withdrawal')}
        >
          ⬆️ Withdrawal
        </button>
        <button 
          className={`action-tab ${activeAction === 'transfer' ? 'active' : ''}`}
          onClick={() => setActiveAction('transfer')}
        >
          ↔️ Transfer
        </button>
      </div>
      
      <div className="action-form-container">
        <h5>
          {actionDetails.icon} {actionDetails.title}
        </h5>
        <div className="action-description">{actionDetails.description}</div>
        
        <form className="action-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="amount">{actionDetails.amountLabel}</label>
            <div className="amount-input">
              <span className="currency-symbol">$</span>
              <input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="form-hint">
              {activeAction !== 'deposit' && (
                <span>Available balance: ${account.balance ? account.balance.toFixed(2) : '0.00'}</span>
              )}
            </div>
          </div>
          
          {activeAction === 'transfer' && (
            <div className="form-group">
              <label htmlFor="target-account">Destination Account</label>
              <select
                id="target-account"
                value={targetAccount}
                onChange={(e) => setTargetAccount(e.target.value)}
                required
              >
                <option value="">Select an account</option>
                {accounts
                  .filter(acc => acc._id !== account._id) // Filter out current account
                  .map(acc => (
                    <option key={acc._id} value={acc._id}>
                      {acc.nickname || `Account ${acc._id.substring(0, 8)}...`} ({acc.type})
                    </option>
                  ))
                }
              </select>
              {accounts.filter(acc => acc._id !== account._id).length === 0 && (
                <div className="form-hint error">No other accounts available for transfer</div>
              )}
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="description">Description (Optional)</label>
            <input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter a description..."
            />
          </div>
          
          {status && (
            <div className={`status-message ${status.type}`}>
              {status.type === 'error' && '❌ '}
              {status.type === 'success' && '✅ '}
              {status.type === 'loading' && '🔄 '}
              {status.message}
            </div>
          )}
          
          <button 
            type="submit" 
            className="submit-button"
            disabled={status && status.type === 'loading'}
          >
            {status && status.type === 'loading' ? '🔄 Processing...' : actionDetails.buttonText}
          </button>
        </form>
      </div>
      
      <div className="action-info">
        <h5>Account Information</h5>
        <div className="info-grid">
          <div className="info-item">
            <div className="info-label">Current Balance</div>
            <div className="info-value">${account.balance ? account.balance.toFixed(2) : '0.00'}</div>
          </div>
          <div className="info-item">
            <div className="info-label">Account Type</div>
            <div className="info-value">{account.type}</div>
          </div>
          <div className="info-item">
            <div className="info-label">Account Nickname</div>
            <div className="info-value">{account.nickname || 'No nickname'}</div>
          </div>
          {account.rewards > 0 && (
            <div className="info-item">
              <div className="info-label">Rewards Points</div>
              <div className="info-value">{account.rewards} pts</div>
            </div>
          )}
        </div>
        
        <div className="recent-activity">
          <h5>Recent Activity</h5>
          <div className="activity-placeholder">
            <span>Most recent transactions will appear here after processing.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountActions; 