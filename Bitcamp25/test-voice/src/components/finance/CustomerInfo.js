import React from 'react';

const CustomerInfo = ({ customer }) => {
  if (!customer) {
    return (
      <div className="customer-info-container">
        <h4>Customer Information</h4>
        <p>No customer information available.</p>
      </div>
    );
  }

  return (
    <div className="customer-info-container">
      <h4>Customer Information</h4>
      
      <div className="customer-profile">
        <div className="customer-avatar">
          {customer.first_name?.charAt(0)}{customer.last_name?.charAt(0)}
        </div>
        
        <div className="customer-details">
          <div className="customer-name">
            {customer.first_name} {customer.last_name}
          </div>
          
          <div className="customer-id">
            <span className="label">Customer ID:</span>
            <span className="value">{customer._id}</span>
          </div>
          
          {customer.address && (
            <div className="customer-address">
              <h5>Address</h5>
              <p>
                {customer.address.street_number} {customer.address.street_name}<br />
                {customer.address.city}, {customer.address.state} {customer.address.zip}
              </p>
            </div>
          )}
        </div>
      </div>
      
      <div className="customer-actions">
        <button className="action-button">Contact Customer</button>
        <button className="action-button">Update Information</button>
        <button className="action-button">View Credit Score</button>
      </div>
      
      <div className="customer-insights">
        <h5>Customer Insights</h5>
        <div className="insights-grid">
          <div className="insight-card">
            <div className="insight-icon">📈</div>
            <div className="insight-title">Account Activity</div>
            <div className="insight-value">High</div>
          </div>
          <div className="insight-card">
            <div className="insight-icon">💰</div>
            <div className="insight-title">Investment Potential</div>
            <div className="insight-value">Medium</div>
          </div>
          <div className="insight-card">
            <div className="insight-icon">📊</div>
            <div className="insight-title">Financial Health</div>
            <div className="insight-value">Good</div>
          </div>
          <div className="insight-card">
            <div className="insight-icon">⭐</div>
            <div className="insight-title">Customer Since</div>
            <div className="insight-value">2023</div>
          </div>
        </div>
      </div>
      
      <div className="recommendations">
        <h5>Recommendations</h5>
        <ul className="recommendations-list">
          <li>Offer premium credit card with higher rewards</li>
          <li>Suggest retirement account options</li>
          <li>Provide information on mortgage refinancing</li>
        </ul>
      </div>
    </div>
  );
};

export default CustomerInfo; 