import React, { useState, useEffect } from 'react';
import capitalOneService from '../../services/capitalOneService';

const BranchLocator = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [branches, setBranches] = useState([]);
  const [atms, setAtms] = useState([]);
  const [activeTab, setActiveTab] = useState('branches'); // branches, atms
  const [searchLocation, setSearchLocation] = useState({
    lat: 38.9072,
    lng: -77.0369,
    rad: 20
  });
  const [searchRadius, setSearchRadius] = useState(5);
  
  useEffect(() => {
    fetchLocations();
  }, []);
  
  const fetchLocations = async () => {
    try {
      setLoading(true);
      
      // Fetch branches
      const branchesData = await capitalOneService.getBranches();
      setBranches(branchesData);
      
      // Fetch ATMs near default location
      const atmsData = await capitalOneService.getATMs(
        searchLocation.lat,
        searchLocation.lng,
        searchRadius
      );
      setAtms(atmsData);
      
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to fetch locations');
      setLoading(false);
    }
  };
  
  const handleSearchATMs = async () => {
    try {
      setLoading(true);
      
      const atmsData = await capitalOneService.getATMs(
        searchLocation.lat,
        searchLocation.lng,
        searchRadius
      );
      setAtms(atmsData);
      
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to search ATMs');
      setLoading(false);
    }
  };
  
  // Function to handle changes to latitude
  const handleLatChange = (e) => {
    setSearchLocation(prev => ({
      ...prev,
      lat: parseFloat(e.target.value)
    }));
  };
  
  // Function to handle changes to longitude
  const handleLngChange = (e) => {
    setSearchLocation(prev => ({
      ...prev,
      lng: parseFloat(e.target.value)
    }));
  };
  
  // Function to handle changes to radius
  const handleRadiusChange = (e) => {
    setSearchRadius(parseInt(e.target.value));
  };
  
  if (loading) {
    return (
      <div className="branch-locator-container">
        <h4>Branch & ATM Locator</h4>
        <div className="loading">Loading location data...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="branch-locator-container">
        <h4>Branch & ATM Locator</h4>
        <div className="error-message">
          <p>Error: {error}</p>
          <button onClick={fetchLocations}>Retry</button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="branch-locator-container">
      <h4>Branch & ATM Locator</h4>
      
      <div className="locator-tabs">
        <button 
          className={`locator-tab ${activeTab === 'branches' ? 'active' : ''}`}
          onClick={() => setActiveTab('branches')}
        >
          Branches
        </button>
        <button 
          className={`locator-tab ${activeTab === 'atms' ? 'active' : ''}`}
          onClick={() => setActiveTab('atms')}
        >
          ATMs
        </button>
      </div>
      
      {activeTab === 'atms' && (
        <div className="atm-search">
          <h5>Find ATMs Near You</h5>
          <div className="search-form">
            <div className="form-row">
              <div className="form-group">
                <label>Latitude</label>
                <input 
                  type="number" 
                  step="0.0001" 
                  value={searchLocation.lat}
                  onChange={handleLatChange}
                />
              </div>
              <div className="form-group">
                <label>Longitude</label>
                <input 
                  type="number" 
                  step="0.0001" 
                  value={searchLocation.lng}
                  onChange={handleLngChange}
                />
              </div>
              <div className="form-group">
                <label>Radius (miles)</label>
                <input 
                  type="number" 
                  min="1" 
                  max="50" 
                  value={searchRadius}
                  onChange={handleRadiusChange}
                />
              </div>
            </div>
            <button className="search-button" onClick={handleSearchATMs}>
              Search ATMs
            </button>
          </div>
        </div>
      )}
      
      <div className="location-results">
        {activeTab === 'branches' ? (
          <>
            <h5>Capital One Branches ({branches.length})</h5>
            {branches.length === 0 ? (
              <p>No branches found.</p>
            ) : (
              <div className="location-grid">
                {branches.map(branch => (
                  <div key={branch._id} className="location-card">
                    <div className="location-icon branch">🏦</div>
                    <div className="location-details">
                      <div className="location-name">{branch.name}</div>
                      <div className="location-address">
                        {branch.address && (
                          <>
                            {branch.address.street_number} {branch.address.street_name}<br />
                            {branch.address.city}, {branch.address.state} {branch.address.zip}
                          </>
                        )}
                      </div>
                      {branch.phone_number && (
                        <div className="location-phone">
                          <span className="label">Phone:</span> {branch.phone_number}
                        </div>
                      )}
                      {branch.hours && branch.hours.length > 0 && (
                        <div className="location-hours">
                          <span className="label">Hours:</span> {branch.hours.join(', ')}
                        </div>
                      )}
                    </div>
                    <div className="location-actions">
                      <button className="directions-btn">Get Directions</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <h5>ATMs Near You ({atms.length})</h5>
            {atms.length === 0 ? (
              <p>No ATMs found in the specified area.</p>
            ) : (
              <div className="location-grid">
                {atms.map(atm => (
                  <div key={atm._id} className="location-card">
                    <div className="location-icon atm">💵</div>
                    <div className="location-details">
                      <div className="location-name">{atm.name || `ATM ${atm._id.substring(0, 8)}`}</div>
                      {atm.geocode && (
                        <div className="location-coords">
                          <span className="label">Coordinates:</span> {atm.geocode.lat.toFixed(4)}, {atm.geocode.lng.toFixed(4)}
                        </div>
                      )}
                      <div className="atm-features">
                        {atm.accessibility && (
                          <span className="atm-feature accessible">♿ Accessible</span>
                        )}
                        {atm.amount_left && (
                          <span className="atm-feature">💰 Cash: ${atm.amount_left}</span>
                        )}
                        {atm.language_list && atm.language_list.length > 0 && (
                          <span className="atm-feature">🌐 Languages: {atm.language_list.join(', ')}</span>
                        )}
                      </div>
                      {atm.hours && atm.hours.length > 0 && (
                        <div className="location-hours">
                          <span className="label">Hours:</span> {atm.hours.join(', ')}
                        </div>
                      )}
                    </div>
                    <div className="location-actions">
                      <button className="directions-btn">Get Directions</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BranchLocator; 