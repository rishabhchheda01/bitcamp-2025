import requests
import json

# Base URL for the API
BASE_URL = "http://127.0.0.1:5000"

# Test data for creating resources
test_customer = {
    "first_name": "John",
    "last_name": "Tester",
    "address": {
        "street_number": "123",
        "street_name": "Test Street",
        "city": "Testville",
        "state": "TS",
        "zip": "12345"
    }
}

test_account = {
    "type": "Checking",
    "nickname": "Test Checking",
    "rewards": 0,
    "balance": 1000
}

test_bill = {
    "status": "pending",
    "payee": "Test Utility Company",
    "nickname": "Test Bill",
    "payment_date": "2025-04-20",
    "payment_amount": 50
}

test_deposit = {
    "medium": "balance",
    "amount": 100,
    "description": "Test Deposit"
}

test_loan = {
    "type": "home",
    "status": "pending",
    "credit_score": 700,
    "monthly_payment": 200,
    "amount": 10000,
    "description": "Test Loan"
}

test_transfer = {
    "medium": "balance",
    "payee_id": "placeholder",  # Will be filled with a real account ID
    "amount": 50,
    "transaction_date": "2025-04-20",
    "description": "Test Transfer"
}

test_withdrawal = {
    "medium": "balance",
    "amount": 25,
    "description": "Test Withdrawal"
}

test_purchase = {
    "merchant_id": "placeholder",  # Will be filled with a real merchant ID
    "medium": "balance",
    "purchase_date": "2025-04-20",
    "amount": 75,
    "description": "Test Purchase"
}

test_merchant = {
    "name": "Test Merchant",
    "category": ["Test"],
    "address": {
        "street_number": "456",
        "street_name": "Merchant Avenue",
        "city": "Merchantville",
        "state": "MS",
        "zip": "67890"
    },
    "geocode": {
        "lat": 38.9072,
        "lng": -77.0369
    }
}

def make_api_request(endpoint, method="POST", data=None):
    """Make API request to the specified endpoint"""
    url = f"{BASE_URL}{endpoint}"
    
    # Print the request details
    print(f"Making {method} request to {url}")
    if data:
        print(f"Payload: {json.dumps(data, indent=2)}")
    else:
        print("No payload")
    
    # Make the request with the appropriate method
    if method == "GET":
        response = requests.get(url)
    elif method == "POST":
        response = requests.post(url, json=data)
    elif method == "PUT":
        response = requests.put(url, json=data)
    elif method == "DELETE":
        response = requests.delete(url)
    
    # Print response
    print(f"Status code: {response.status_code}")
    try:
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except:
        print(f"Response: {response.text}")
    
    print("-" * 50)
    
    # Return the response
    return response

def test_customer_endpoints():
    """Test customer-related endpoints"""
    print("\n=== TESTING CUSTOMER ENDPOINTS ===\n")
    
    # Test getting all customers
    print("Testing GET /api/customers endpoint...")
    customers_response = make_api_request("/api/customers", method="GET")
    
    # Test creating a customer
    print("Testing POST /api/customers endpoint (create customer)...")
    create_response = make_api_request("/api/customers", method="POST", data=test_customer)
    
    # Extract customer ID from response if successful
    customer_id = None
    if create_response.status_code == 201 or create_response.status_code == 200:
        try:
            response_data = create_response.json()
            if isinstance(response_data, dict):
                if "objectCreated" in response_data:
                    customer_id = response_data["objectCreated"]["_id"]
                elif "_id" in response_data:
                    customer_id = response_data["_id"]
                print(f"Created customer with ID: {customer_id}")
        except:
            print("Could not extract customer ID from response")
    
    # If we have a customer ID, test the customer detail endpoint
    if customer_id:
        print(f"Testing GET /api/customers/{customer_id} endpoint...")
        make_api_request(f"/api/customers/{customer_id}", method="GET")
        
        # Test updating a customer
        print(f"Testing PUT /api/customers/{customer_id} endpoint...")
        update_data = {"first_name": "Jane"}
        make_api_request(f"/api/customers/{customer_id}", method="PUT", data=update_data)
    
    return customer_id

def test_account_endpoints(customer_id=None):
    """Test account-related endpoints"""
    print("\n=== TESTING ACCOUNT ENDPOINTS ===\n")
    
    # Test getting all accounts
    print("Testing GET /api/accounts endpoint...")
    make_api_request("/api/accounts", method="GET")
    
    # If we have a customer ID, test customer-specific endpoints
    account_id = None
    if customer_id:
        # Get customer accounts
        print(f"Testing GET /api/customers/{customer_id}/accounts endpoint...")
        accounts_response = make_api_request(f"/api/customers/{customer_id}/accounts", method="GET")
        
        # Create an account for the customer
        print(f"Testing POST /api/customers/{customer_id}/accounts endpoint...")
        create_response = make_api_request(f"/api/customers/{customer_id}/accounts", method="POST", data=test_account)
        
        # Extract account ID from response if successful
        if create_response.status_code == 201 or create_response.status_code == 200:
            try:
                response_data = create_response.json()
                if isinstance(response_data, dict):
                    if "objectCreated" in response_data:
                        account_id = response_data["objectCreated"]["_id"]
                    elif "_id" in response_data:
                        account_id = response_data["_id"]
                    print(f"Created account with ID: {account_id}")
            except:
                print("Could not extract account ID from response")
    
    # If we have an account ID, test the account detail endpoint
    if account_id:
        print(f"Testing GET /api/accounts/{account_id} endpoint...")
        make_api_request(f"/api/accounts/{account_id}", method="GET")
        
        # Test updating an account
        print(f"Testing PUT /api/accounts/{account_id} endpoint...")
        update_data = {"nickname": "Updated Test Account"}
        make_api_request(f"/api/accounts/{account_id}", method="PUT", data=update_data)
        
        # Test getting the account's customer
        print(f"Testing GET /api/accounts/{account_id}/customer endpoint...")
        make_api_request(f"/api/accounts/{account_id}/customer", method="GET")
    
    return account_id

def test_bill_endpoints(account_id=None):
    """Test bill-related endpoints"""
    print("\n=== TESTING BILL ENDPOINTS ===\n")
    
    # If we have an account ID, test account-specific endpoints
    bill_id = None
    if account_id:
        # Get account bills
        print(f"Testing GET /api/accounts/{account_id}/bills endpoint...")
        make_api_request(f"/api/accounts/{account_id}/bills", method="GET")
        
        # Create a bill for the account
        print(f"Testing POST /api/accounts/{account_id}/bills endpoint...")
        create_response = make_api_request(f"/api/accounts/{account_id}/bills", method="POST", data=test_bill)
        
        # Extract bill ID from response if successful
        if create_response.status_code == 201 or create_response.status_code == 200:
            try:
                response_data = create_response.json()
                if isinstance(response_data, dict):
                    if "objectCreated" in response_data:
                        bill_id = response_data["objectCreated"]["_id"]
                    elif "_id" in response_data:
                        bill_id = response_data["_id"]
                    print(f"Created bill with ID: {bill_id}")
            except:
                print("Could not extract bill ID from response")
    
    # If we have a bill ID, test the bill detail endpoint
    if bill_id:
        print(f"Testing GET /api/bills/{bill_id} endpoint...")
        make_api_request(f"/api/bills/{bill_id}", method="GET")
        
        # Test updating a bill
        print(f"Testing PUT /api/bills/{bill_id} endpoint...")
        update_data = {"status": "completed"}
        make_api_request(f"/api/bills/{bill_id}", method="PUT", data=update_data)
    
    return bill_id

def test_deposit_endpoints(account_id=None):
    """Test deposit-related endpoints"""
    print("\n=== TESTING DEPOSIT ENDPOINTS ===\n")
    
    # If we have an account ID, test account-specific endpoints
    deposit_id = None
    if account_id:
        # Get account deposits
        print(f"Testing GET /api/accounts/{account_id}/deposits endpoint...")
        make_api_request(f"/api/accounts/{account_id}/deposits", method="GET")
        
        # Create a deposit for the account
        print(f"Testing POST /api/accounts/{account_id}/deposits endpoint...")
        create_response = make_api_request(f"/api/accounts/{account_id}/deposits", method="POST", data=test_deposit)
        
        # Extract deposit ID from response if successful
        if create_response.status_code == 201 or create_response.status_code == 200:
            try:
                response_data = create_response.json()
                if isinstance(response_data, dict):
                    if "objectCreated" in response_data:
                        deposit_id = response_data["objectCreated"]["_id"]
                    elif "_id" in response_data:
                        deposit_id = response_data["_id"]
                    print(f"Created deposit with ID: {deposit_id}")
            except:
                print("Could not extract deposit ID from response")
    
    # If we have a deposit ID, test the deposit detail endpoint
    if deposit_id:
        print(f"Testing GET /api/deposits/{deposit_id} endpoint...")
        make_api_request(f"/api/deposits/{deposit_id}", method="GET")
        
        # Test updating a deposit
        print(f"Testing PUT /api/deposits/{deposit_id} endpoint...")
        update_data = {"description": "Updated Test Deposit"}
        make_api_request(f"/api/deposits/{deposit_id}", method="PUT", data=update_data)
    
    return deposit_id

def test_loan_endpoints(account_id=None):
    """Test loan-related endpoints"""
    print("\n=== TESTING LOAN ENDPOINTS ===\n")
    
    # If we have an account ID, test account-specific endpoints
    loan_id = None
    if account_id:
        # Get account loans
        print(f"Testing GET /api/accounts/{account_id}/loans endpoint...")
        make_api_request(f"/api/accounts/{account_id}/loans", method="GET")
        
        # Create a loan for the account
        print(f"Testing POST /api/accounts/{account_id}/loans endpoint...")
        create_response = make_api_request(f"/api/accounts/{account_id}/loans", method="POST", data=test_loan)
        
        # Extract loan ID from response if successful
        if create_response.status_code == 201 or create_response.status_code == 200:
            try:
                response_data = create_response.json()
                if isinstance(response_data, dict):
                    if "objectCreated" in response_data:
                        loan_id = response_data["objectCreated"]["_id"]
                    elif "_id" in response_data:
                        loan_id = response_data["_id"]
                    print(f"Created loan with ID: {loan_id}")
            except:
                print("Could not extract loan ID from response")
    
    # If we have a loan ID, test the loan detail endpoint
    if loan_id:
        print(f"Testing GET /api/loans/{loan_id} endpoint...")
        make_api_request(f"/api/loans/{loan_id}", method="GET")
        
        # Test updating a loan
        print(f"Testing PUT /api/loans/{loan_id} endpoint...")
        update_data = {"status": "approved"}
        make_api_request(f"/api/loans/{loan_id}", method="PUT", data=update_data)
    
    return loan_id

def test_transfer_endpoints(account_id=None, second_account_id=None):
    """Test transfer-related endpoints"""
    print("\n=== TESTING TRANSFER ENDPOINTS ===\n")
    
    # If we have an account ID, test account-specific endpoints
    transfer_id = None
    if account_id:
        # Get account transfers
        print(f"Testing GET /api/accounts/{account_id}/transfers endpoint...")
        make_api_request(f"/api/accounts/{account_id}/transfers", method="GET")
        
        # If we have a second account ID, create a transfer between accounts
        if second_account_id:
            # Create a transfer for the account
            transfer_data = test_transfer.copy()
            transfer_data["payee_id"] = second_account_id
            print(f"Testing POST /api/accounts/{account_id}/transfers endpoint...")
            create_response = make_api_request(f"/api/accounts/{account_id}/transfers", method="POST", data=transfer_data)
        else:
            # Create a transfer for the account (to same account for testing purposes)
            transfer_data = test_transfer.copy()
            transfer_data["payee_id"] = account_id
            print(f"Testing POST /api/accounts/{account_id}/transfers endpoint...")
            create_response = make_api_request(f"/api/accounts/{account_id}/transfers", method="POST", data=transfer_data)
        
        # Extract transfer ID from response if successful
        if create_response.status_code == 201 or create_response.status_code == 200:
            try:
                response_data = create_response.json()
                if isinstance(response_data, dict):
                    if "objectCreated" in response_data:
                        transfer_id = response_data["objectCreated"]["_id"]
                    elif "_id" in response_data:
                        transfer_id = response_data["_id"]
                    print(f"Created transfer with ID: {transfer_id}")
            except:
                print("Could not extract transfer ID from response")
    
    # If we have a transfer ID, test the transfer detail endpoint
    if transfer_id:
        print(f"Testing GET /api/transfers/{transfer_id} endpoint...")
        make_api_request(f"/api/transfers/{transfer_id}", method="GET")
        
        # Test updating a transfer
        print(f"Testing PUT /api/transfers/{transfer_id} endpoint...")
        update_data = {"description": "Updated Test Transfer"}
        make_api_request(f"/api/transfers/{transfer_id}", method="PUT", data=update_data)
    
    return transfer_id

def test_withdrawal_endpoints(account_id=None):
    """Test withdrawal-related endpoints"""
    print("\n=== TESTING WITHDRAWAL ENDPOINTS ===\n")
    
    # If we have an account ID, test account-specific endpoints
    withdrawal_id = None
    if account_id:
        # Get account withdrawals
        print(f"Testing GET /api/accounts/{account_id}/withdrawals endpoint...")
        make_api_request(f"/api/accounts/{account_id}/withdrawals", method="GET")
        
        # Create a withdrawal for the account
        print(f"Testing POST /api/accounts/{account_id}/withdrawals endpoint...")
        create_response = make_api_request(f"/api/accounts/{account_id}/withdrawals", method="POST", data=test_withdrawal)
        
        # Extract withdrawal ID from response if successful
        if create_response.status_code == 201 or create_response.status_code == 200:
            try:
                response_data = create_response.json()
                if isinstance(response_data, dict):
                    if "objectCreated" in response_data:
                        withdrawal_id = response_data["objectCreated"]["_id"]
                    elif "_id" in response_data:
                        withdrawal_id = response_data["_id"]
                    print(f"Created withdrawal with ID: {withdrawal_id}")
            except:
                print("Could not extract withdrawal ID from response")
    
    # If we have a withdrawal ID, test the withdrawal detail endpoint
    if withdrawal_id:
        print(f"Testing GET /api/withdrawals/{withdrawal_id} endpoint...")
        make_api_request(f"/api/withdrawals/{withdrawal_id}", method="GET")
        
        # Test updating a withdrawal
        print(f"Testing PUT /api/withdrawals/{withdrawal_id} endpoint...")
        update_data = {"description": "Updated Test Withdrawal"}
        make_api_request(f"/api/withdrawals/{withdrawal_id}", method="PUT", data=update_data)
    
    return withdrawal_id

def test_merchant_endpoints():
    """Test merchant-related endpoints"""
    print("\n=== TESTING MERCHANT ENDPOINTS ===\n")
    
    # Test getting all merchants
    print("Testing GET /api/merchants endpoint...")
    merchants_response = make_api_request("/api/merchants", method="GET")
    
    # Test creating a merchant
    print("Testing POST /api/merchants endpoint...")
    create_response = make_api_request("/api/merchants", method="POST", data=test_merchant)
    
    # Extract merchant ID from response if successful
    merchant_id = None
    if create_response.status_code == 201 or create_response.status_code == 200:
        try:
            response_data = create_response.json()
            if isinstance(response_data, dict):
                if "objectCreated" in response_data:
                    merchant_id = response_data["objectCreated"]["_id"]
                elif "_id" in response_data:
                    merchant_id = response_data["_id"]
                print(f"Created merchant with ID: {merchant_id}")
        except:
            print("Could not extract merchant ID from response")
    
    # If we have a merchant ID, test the merchant detail endpoint
    if merchant_id:
        print(f"Testing GET /api/merchants/{merchant_id} endpoint...")
        make_api_request(f"/api/merchants/{merchant_id}", method="GET")
        
        # Test updating a merchant
        print(f"Testing PUT /api/merchants/{merchant_id} endpoint...")
        update_data = {"name": "Updated Test Merchant"}
        make_api_request(f"/api/merchants/{merchant_id}", method="PUT", data=update_data)
    
    return merchant_id

def test_purchase_endpoints(account_id=None, merchant_id=None):
    """Test purchase-related endpoints"""
    print("\n=== TESTING PURCHASE ENDPOINTS ===\n")
    
    # If we have an account ID and merchant ID, test purchase endpoints
    purchase_id = None
    if account_id and merchant_id:
        # Get account purchases
        print(f"Testing GET /api/accounts/{account_id}/purchases endpoint...")
        make_api_request(f"/api/accounts/{account_id}/purchases", method="GET")
        
        # Create a purchase for the account
        purchase_data = test_purchase.copy()
        purchase_data["merchant_id"] = merchant_id
        print(f"Testing POST /api/accounts/{account_id}/purchases endpoint...")
        create_response = make_api_request(f"/api/accounts/{account_id}/purchases", method="POST", data=purchase_data)
        
        # Extract purchase ID from response if successful
        if create_response.status_code == 201 or create_response.status_code == 200:
            try:
                response_data = create_response.json()
                if isinstance(response_data, dict):
                    if "objectCreated" in response_data:
                        purchase_id = response_data["objectCreated"]["_id"]
                    elif "_id" in response_data:
                        purchase_id = response_data["_id"]
                    print(f"Created purchase with ID: {purchase_id}")
            except:
                print("Could not extract purchase ID from response")
        
        # Get merchant purchases
        print(f"Testing GET /api/merchants/{merchant_id}/purchases endpoint...")
        make_api_request(f"/api/merchants/{merchant_id}/purchases", method="GET")
        
        # Get merchant account purchases
        print(f"Testing GET /api/merchants/{merchant_id}/accounts/{account_id}/purchases endpoint...")
        make_api_request(f"/api/merchants/{merchant_id}/accounts/{account_id}/purchases", method="GET")
    
    # If we have a purchase ID, test the purchase detail endpoint
    if purchase_id:
        print(f"Testing GET /api/purchases/{purchase_id} endpoint...")
        make_api_request(f"/api/purchases/{purchase_id}", method="GET")
        
        # Test updating a purchase
        print(f"Testing PUT /api/purchases/{purchase_id} endpoint...")
        update_data = {"description": "Updated Test Purchase"}
        make_api_request(f"/api/purchases/{purchase_id}", method="PUT", data=update_data)
    
    return purchase_id

def test_atm_branch_endpoints():
    """Test ATM and branch related endpoints"""
    print("\n=== TESTING ATM & BRANCH ENDPOINTS ===\n")
    
    # Test getting all ATMs
    print("Testing GET /api/atms endpoint...")
    atms_response = make_api_request("/api/atms", method="GET")
    
    # Get ATM by ID if any exist
    if atms_response.status_code == 200:
        try:
            atms = atms_response.json()
            if atms and len(atms) > 0 and isinstance(atms, list):
                atm_id = atms[0].get("_id")
                if atm_id:
                    print(f"Testing GET /api/atms/{atm_id} endpoint...")
                    make_api_request(f"/api/atms/{atm_id}", method="GET")
        except:
            print("Could not extract ATM ID from response")
    
    # Test getting all branches
    print("Testing GET /api/branches endpoint...")
    branches_response = make_api_request("/api/branches", method="GET")
    
    # Get branch by ID if any exist
    if branches_response.status_code == 200:
        try:
            branches = branches_response.json()
            if branches and len(branches) > 0 and isinstance(branches, list):
                branch_id = branches[0].get("_id")
                if branch_id:
                    print(f"Testing GET /api/branches/{branch_id} endpoint...")
                    make_api_request(f"/api/branches/{branch_id}", method="GET")
        except:
            print("Could not extract branch ID from response")

def run_all_tests():
    """Run all API endpoint tests"""
    print("\n===================================")
    print("STARTING API ENDPOINT TESTS")
    print("===================================\n")
    
    # Test customer endpoints - returns customer_id if successful
    customer_id = test_customer_endpoints()
    
    # Test account endpoints - returns account_id if successful
    account_id = test_account_endpoints(customer_id)
    
    # Create a second account for transfer tests if we have a customer
    second_account_id = None
    if customer_id and account_id:
        print("\nCreating second test account for transfers...")
        second_account_data = test_account.copy()
        second_account_data["nickname"] = "Second Test Account"
        create_response = make_api_request(f"/api/customers/{customer_id}/accounts", method="POST", data=second_account_data)
        if create_response.status_code == 201 or create_response.status_code == 200:
            try:
                response_data = create_response.json()
                if isinstance(response_data, dict):
                    if "objectCreated" in response_data:
                        second_account_id = response_data["objectCreated"]["_id"]
                    elif "_id" in response_data:
                        second_account_id = response_data["_id"]
                    print(f"Created second account with ID: {second_account_id}")
            except:
                print("Could not extract second account ID from response")
    
    # Test merchant endpoints - returns merchant_id if successful
    merchant_id = test_merchant_endpoints()
    
    # Test remaining endpoints if we have necessary IDs
    if account_id:
        test_bill_endpoints(account_id)
        test_deposit_endpoints(account_id)
        test_loan_endpoints(account_id)
        test_withdrawal_endpoints(account_id)
        test_transfer_endpoints(account_id, second_account_id)
        
        if merchant_id:
            test_purchase_endpoints(account_id, merchant_id)
    
    # Test ATM and branch endpoints
    test_atm_branch_endpoints()
    
    print("\n===================================")
    print("ALL API ENDPOINT TESTS COMPLETED")
    print("===================================\n")

if __name__ == "__main__":
    run_all_tests()