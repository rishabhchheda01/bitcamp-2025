import React, { useState } from 'react';

const TransactionHistory = ({ transactions, accountId }) => {
  const [filter, setFilter] = useState('all'); // all, deposits, withdrawals, transfers
  const [searchTerm, setSearchTerm] = useState('');
  
  if (!transactions || transactions.length === 0) {
    return (
      <div className="transaction-history-container">
        <h4>Transaction History</h4>
        <div className="no-transactions">
          <p>No transactions found for this account.</p>
        </div>
      </div>
    );
  }
  
  // Filter transactions based on type and search term
  const filteredTransactions = transactions.filter(transaction => {
    // Filter by type
    if (filter !== 'all' && transaction.type !== filter) {
      return false;
    }
    
    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const descriptionMatches = transaction.description && 
        transaction.description.toLowerCase().includes(searchLower);
      const statusMatches = transaction.status && 
        transaction.status.toLowerCase().includes(searchLower);
      const idMatches = transaction._id && 
        transaction._id.toLowerCase().includes(searchLower);
        
      return descriptionMatches || statusMatches || idMatches;
    }
    
    return true;
  });
  
  // Format date string
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (err) {
      return 'Invalid Date';
    }
  };
  
  // Get transaction icon based on type
  const getTransactionIcon = (transaction) => {
    if (transaction.type === 'deposit') return '⬇️';
    if (transaction.type === 'withdrawal') return '⬆️';
    if (transaction.type === 'transfer') return '↔️';
    return '🔄';
  };
  
  // Get transaction amount (deposits are positive, withdrawals are negative)
  const getTransactionAmount = (transaction) => {
    const amount = transaction.amount || 0;
    
    if (transaction.type === 'deposit') {
      return amount;
    }
    if (transaction.type === 'withdrawal') {
      return -1 * amount;
    }
    if (transaction.type === 'transfer') {
      // If this account is the payer, amount is negative
      // If this account is the payee, amount is positive
      if (transaction.payer_id === accountId) {
        return -1 * amount;
      } else {
        return amount;
      }
    }
    return 0;
  };
  
  return (
    <div className="transaction-history-container">
      <h4>Transaction History</h4>
      
      <div className="transaction-filters">
        <div className="filter-buttons">
          <button 
            className={`filter-button ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            className={`filter-button ${filter === 'deposit' ? 'active' : ''}`}
            onClick={() => setFilter('deposit')}
          >
            Deposits
          </button>
          <button 
            className={`filter-button ${filter === 'withdrawal' ? 'active' : ''}`}
            onClick={() => setFilter('withdrawal')}
          >
            Withdrawals
          </button>
          <button 
            className={`filter-button ${filter === 'transfer' ? 'active' : ''}`}
            onClick={() => setFilter('transfer')}
          >
            Transfers
          </button>
        </div>
        
        <div className="search-filter">
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="transactions-list">
        {filteredTransactions.length === 0 ? (
          <div className="no-transactions">
            <p>No matching transactions found.</p>
          </div>
        ) : (
          filteredTransactions.map(transaction => (
            <div key={transaction._id} className="transaction-card">
              <div className="transaction-icon">
                {getTransactionIcon(transaction)}
              </div>
              
              <div className="transaction-content">
                <div className="transaction-header">
                  <div className="transaction-type">
                    {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                  </div>
                  <div className="transaction-date">
                    {formatDate(transaction.transaction_date || transaction.payment_date)}
                  </div>
                </div>
                
                <div className="transaction-description">
                  {transaction.description || `${transaction.type} transaction`}
                </div>
                
                <div className="transaction-details">
                  <div className="transaction-status">
                    Status: {transaction.status || 'Completed'}
                  </div>
                  
                  {transaction.type === 'transfer' && (
                    <div className="transaction-participants">
                      {transaction.payer_id === accountId ? 
                        `To: ${transaction.payee_id}` : 
                        `From: ${transaction.payer_id}`}
                    </div>
                  )}
                </div>
              </div>
              
              <div className={`transaction-amount ${getTransactionAmount(transaction) >= 0 ? 'positive' : 'negative'}`}>
                {getTransactionAmount(transaction) >= 0 ? '+' : ''}
                ${Math.abs(getTransactionAmount(transaction)).toFixed(2)}
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="transactions-summary">
        <div className="summary-card">
          <div className="summary-title">Total Deposits</div>
          <div className="summary-value positive">
            +${transactions
              .filter(t => t.type === 'deposit')
              .reduce((total, t) => total + (t.amount || 0), 0)
              .toFixed(2)
            }
          </div>
        </div>
        
        <div className="summary-card">
          <div className="summary-title">Total Withdrawals</div>
          <div className="summary-value negative">
            -${transactions
              .filter(t => t.type === 'withdrawal')
              .reduce((total, t) => total + (t.amount || 0), 0)
              .toFixed(2)
            }
          </div>
        </div>
        
        <div className="summary-card">
          <div className="summary-title">Net Change</div>
          <div className={`summary-value ${
            transactions.reduce((total, t) => {
              if (t.type === 'deposit') return total + (t.amount || 0);
              if (t.type === 'withdrawal') return total - (t.amount || 0);
              return total;
            }, 0) >= 0 ? 'positive' : 'negative'
          }`}>
            ${transactions
              .reduce((total, t) => {
                if (t.type === 'deposit') return total + (t.amount || 0);
                if (t.type === 'withdrawal') return total - (t.amount || 0);
                return total;
              }, 0)
              .toFixed(2)
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionHistory; 