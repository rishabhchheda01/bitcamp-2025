#!/usr/bin/env python3
import requests
import json
import sys
import time
import random
from datetime import datetime, timedelta

# Base URL for the API
BASE_URL = "https://retell-custom-functions-api-2.azurewebsites.net/api"
# BASE_URL = "http://127.0.0.1:5000/api"

# Function to make API requests
def make_request(method, endpoint, data=None, params=None, path_params=None):
    """
    Helper function to make API requests
    """
    url = f"{BASE_URL}{endpoint}"
    
    # Replace path parameters
    if path_params:
        for key, value in path_params.items():
            url = url.replace(f"{{{key}}}", value)
            
    print(url)
    
    headers = {"Content-Type": "application/json"}
    
    print("method: ", method) ###
    
    try:
        if method == "GET":
            response = requests.get(url, params=params, headers=headers)
        elif method == "POST":
            response = requests.post(url, json=data, params=params, headers=headers)
        elif method == "PUT":
            response = requests.put(url, json=data, params=params, headers=headers)
        elif method == "DELETE":
            response = requests.delete(url, params=params, headers=headers)
        else:
            print(f"Unsupported method: {method}")
            return None, 400
            
        # Try to parse JSON response
        try:
            response_data = response.json()
        except:
            response_data = response.text
            
        return response_data, response.status_code
    except requests.exceptions.ConnectionError:
        print(f"\nConnection Error: Failed to connect to {url}")
        print("Make sure the Flask server is running.")
        return None, 500
    except Exception as e:
        print(f"\nUnexpected error: {str(e)}")
        return None, 500

# Function to print response
def print_response(data, status_code, message=None):
    """
    Helper function to print API response
    """
    if message:
        print(f"\n{message}")
    
    print(f"Status Code: {status_code}")
    
    if isinstance(data, (dict, list)):
        print(json.dumps(data, indent=2))
    else:
        print(data)
    
    print("-" * 80)

# Test the original get_customers endpoint
def test_get_customers():
    """
    Test the /api/get-customers endpoint
    """
    print("\n🔍 Testing /api/get-customers endpoint...")
    
    # Changed from POST to GET since the endpoint supports both methods
    # and the server implementation primarily uses GET for this endpoint
    data, status_code = make_request("GET", "/get-customers")
    print_response(data, status_code, "Initial customers from Nessie API:")
    
    return data if status_code == 200 else None

# ==========================================================
# BUSINESS SCENARIO SIMULATION: LAKESIDE COMMUNITY BANK
# ==========================================================
def run_business_scenario():
    """
    Simulate a realistic banking scenario for Lakeside Community Bank
    
    In this simulation, we'll create:
    1. A business owner (Maria) with a business account
    2. Customers with various account types
    3. Process transactions between accounts
    4. Generate financial reports
    
    This simulates how a call agent might use these APIs to help customers
    """
    print("\n" + "=" * 80)
    print("🏦 LAKESIDE COMMUNITY BANK - BUSINESS SCENARIO SIMULATION")
    print("=" * 80)
    
    # Clear any existing data (optional)
    print("\n🧹 Clearing any existing data...")
    clear_data()
    
    # 1. Create business owner - Maria's Bakery
    print("\n👩‍💼 Creating business owner - Maria...")
    maria = create_business_owner()
    
    # 2. Create business account
    print("\n💼 Creating business account for Maria's Bakery...")
    business_account = create_business_account(maria["objectCreated"]["_id"])
    
    # 3. Create regular customers
    print("\n👥 Creating regular customers for the bank...")
    customers = create_regular_customers()
    
    # 4. Create accounts for customers
    print("\n💳 Creating accounts for customers...")
    customer_accounts = create_customer_accounts(customers)
    
    # 5. Simulate deposits for all accounts
    print("\n💰 Processing initial deposits for all accounts...")
    process_initial_deposits(customer_accounts + [business_account])
    
    # 6. Simulate business scenario: Customer purchasing from Maria's Bakery
    print("\n🧁 Simulating customer purchases from Maria's Bakery...")
    simulate_purchases(customer_accounts, business_account)
    
    # 7. Simulate Maria paying bills
    print("\n📝 Simulating Maria paying business bills...")
    simulate_bill_payments(business_account)
    
    # 8. Simulate Maria taking a business loan
    print("\n💸 Simulating Maria taking a business loan...")
    simulate_business_loan(business_account)
    
    # 9. Simulate ATM and branch lookups
    print("\n🏧 Simulating ATM and branch lookups...")
    simulate_atm_branch_lookups()
    
    # 10. Generate summary report
    print("\n📊 Generating account summary for Maria's business...")
    generate_business_summary(business_account, maria["objectCreated"]["_id"])

# Clear existing data
def clear_data():
    """
    Clear existing data in the API
    """
    # Delete all data with required type parameter
    # Types can be: accounts, bills, deposits, loans, transfers, withdrawals, purchases
    types = ["accounts", "customers", "bills", "deposits", "loans", "transfers", "withdrawals", "purchases"]
    all_cleared = True
    
    for data_type in types:
        params = {"type": data_type}
        data, status_code = make_request("DELETE", "/data", params=params)
        print_response(data, status_code, f"Clearing {data_type} data:")
        if status_code != 200 and status_code != 202 and status_code != 404:
            all_cleared = False
    
    return all_cleared

# Create business owner
def create_business_owner():
    """
    Create a business owner - Maria Rodriguez, owner of Maria's Bakery
    """
    # Customer data for Maria
    business_owner_data = {
        "first_name": "Maria",
        "last_name": "Rodriguez",
        "address": {
            "street_number": "123",
            "street_name": "Main St",
            "city": "Lakeside",
            "state": "CA",
            "zip": "90210"
        }
    }
    
    # Create business owner
    data, status_code = make_request("POST", "/customers", business_owner_data)
    print_response(data, status_code, "Creating business owner (Maria Rodriguez):")
    
    # Call agent script: "I've created an account for you, Ms. Rodriguez. Let me set up your business account now."
    print("🎭 Call Agent: \"I've created an account for you, Ms. Rodriguez. Let me set up your business account now.\"")
    
    return data

# Create business account
def create_business_account(owner_id):
    """
    Create a business checking account for Maria's Bakery
    """
    # Account data for Maria's Bakery - removed account_number field which causes validation errors
    business_account_data = {
        "type": "Checking",
        "nickname": "Maria's Bakery",
        "rewards": 0,
        "balance": 5000
    }
    
    # Create business account
    endpoint = f"/customers/{owner_id}/accounts"
    data, status_code = make_request("POST", endpoint, business_account_data)
    print_response(data, status_code, "Creating business account (Maria's Bakery):")
    
    # Call agent script: "Your business checking account has been set up with an initial balance of $5,000."
    print(f"🎭 Call Agent: \"Your business checking account has been set up with an initial balance of $5,000.\"")
    
    # Return the created account or None if there was an error
    if status_code == 201 or status_code == 200:
        return data["objectCreated"]
    else:
        print("Failed to create business account. Stopping simulation.")
        sys.exit(1)

# Create regular customers
def create_regular_customers():
    """
    Create several regular customers for the bank
    """
    # List of customers to create
    customers_data = [
        {
            "first_name": "John",
            "last_name": "Smith",
            "address": {
                "street_number": "456",
                "street_name": "Oak Ave",
                "city": "Lakeside",
                "state": "CA",
                "zip": "90210"
            }
        },
        {
            "first_name": "Emily",
            "last_name": "Johnson",
            "address": {
                "street_number": "789",
                "street_name": "Pine Rd",
                "city": "Lakeside",
                "state": "CA",
                "zip": "90210"
            }
        },
        {
            "first_name": "Michael",
            "last_name": "Garcia",
            "address": {
                "street_number": "101",
                "street_name": "Maple Blvd",
                "city": "Lakeside",
                "state": "CA",
                "zip": "90210"
            }
        }
    ]
    
    created_customers = []
    
    # Create each customer
    for customer_data in customers_data:
        data, status_code = make_request("POST", "/customers", customer_data)
        print_response(data, status_code, f"Creating customer ({customer_data['first_name']} {customer_data['last_name']}):")
        
        if status_code == 201 or status_code == 200:
            created_customers.append(data["objectCreated"])
    
    # Call agent script: "I've set up several sample customers to test transactions with your business."
    print("🎭 Call Agent: \"I've set up several sample customers to test transactions with your business.\"")
    
    return created_customers

# Create customer accounts
def create_customer_accounts(customers):
    """
    Create different types of accounts for customers
    """
    account_types = ["Checking", "Savings", "Credit Card"]
    created_accounts = []
    
    for customer in customers:
        # Randomly choose 1-2 account types for each customer
        num_accounts = random.randint(1, 2)
        selected_types = random.sample(account_types, num_accounts)
        
        for account_type in selected_types:
            account_data = {
                "type": account_type,
                "nickname": f"{customer['first_name']}'s {account_type}",
                "rewards": random.randint(0, 100) if account_type == "Credit Card" else 0,
                "balance": random.randint(1000, 8000)
                # Removed account_number field which causes validation errors
            }
            
            endpoint = f"/customers/{customer['_id']}/accounts"
            data, status_code = make_request("POST", endpoint, account_data)
            print_response(data, status_code, f"Creating {account_type} account for {customer['first_name']} {customer['last_name']}:")
            
            if status_code == 201 or status_code == 200:
                created_accounts.append(data["objectCreated"])
    
    # Call agent script: "I've created various accounts for our customers. Now they can interact with your business."
    print("🎭 Call Agent: \"I've created various accounts for our customers. Now they can interact with your business.\"")
    
    return created_accounts

# Process initial deposits
def process_initial_deposits(accounts):
    """
    Process initial deposits for all accounts
    """
    for account in accounts:
        # Create a deposit
        deposit_data = {
            "medium": "balance",
            "transaction_date": datetime.now().strftime("%Y-%m-%d"),
            "status": "completed",
            "amount": account.get("balance", 1000),
            "description": "Initial deposit"
        }
        
        endpoint = f"/accounts/{account['_id']}/deposits"
        data, status_code = make_request("POST", endpoint, deposit_data)
        print_response(data, status_code, f"Processing initial deposit for account {account.get('nickname', 'Unknown')}:")
    
    # Call agent script: "I've processed the initial deposits for all accounts. Your business account and customer accounts are now funded."
    print("🎭 Call Agent: \"I've processed the initial deposits for all accounts. Your business account and customer accounts are now funded.\"")

# Simulate purchases
def simulate_purchases(customer_accounts, business_account):
    """
    Simulate customers making purchases from Maria's Bakery
    """
    # Create a merchant for Maria's Bakery
    merchant_data = {
        "name": "Maria's Bakery",
        "category": "Food",
        "address": {
            "street_number": "123",
            "street_name": "Main St",
            "city": "Lakeside",
            "state": "CA",
            "zip": "90210"
        },
        "geocode": {
            "lat": 34.0522,
            "lng": -118.2437
        }
    }
    
    merchant_response, merchant_status = make_request("POST", "/merchants", merchant_data)
    print_response(merchant_response, merchant_status, "Creating merchant for Maria's Bakery:")
    
    if merchant_status != 201 and merchant_status != 200:
        print("Failed to create merchant, skipping purchase simulation.")
        return
    
    merchant_id = merchant_response["objectCreated"]["_id"]
    
    # Simulate purchases from each customer account
    for account in customer_accounts:
        # Skip credit card accounts
        if account.get("type") == "Credit Card":
            continue
            
        # Create a purchase
        purchase_amount = random.randint(20, 100)
        purchase_data = {
            "merchant_id": merchant_id,
            "medium": "balance",
            "purchase_date": datetime.now().strftime("%Y-%m-%d"),
            "amount": purchase_amount,
            "status": "completed",
            "description": "Purchase at Maria's Bakery"
        }
        
        endpoint = f"/accounts/{account['_id']}/purchases"
        data, status_code = make_request("POST", endpoint, purchase_data)
        print_response(data, status_code, f"Processing purchase from {account.get('nickname', 'Unknown')} at Maria's Bakery:")
        
        # Simulate money going into Maria's business account
        if status_code == 201 or status_code == 200:
            # Create a deposit to Maria's business account
            deposit_data = {
                "medium": "balance",
                "transaction_date": datetime.now().strftime("%Y-%m-%d"),
                "status": "completed",
                "amount": purchase_amount,
                "description": f"Payment from {account.get('nickname', 'customer')}"
            }
            
            endpoint = f"/accounts/{business_account['_id']}/deposits"
            data, status_code = make_request("POST", endpoint, deposit_data)
            print_response(data, status_code, f"Processing deposit to Maria's business account:")
    
    # Call agent script: "I've simulated several customers making purchases at your bakery. The funds have been transferred to your business account."
    print("🎭 Call Agent: \"I've simulated several customers making purchases at your bakery. The funds have been transferred to your business account.\"")

# Simulate bill payments
def simulate_bill_payments(business_account):
    """
    Simulate Maria paying business bills
    """
    bills = [
        {"name": "Rent", "amount": 1200},
        {"name": "Utilities", "amount": 350},
        {"name": "Ingredients Supplier", "amount": 800}
    ]
    
    for bill in bills:
        # Create a bill
        bill_data = {
            "status": "pending",
            "payee": bill["name"],
            "nickname": bill["name"],
            "payment_date": (datetime.now() + timedelta(days=15)).strftime("%Y-%m-%d"),
            "recurring_date": 15,
            "payment_amount": bill["amount"]
        }
        
        endpoint = f"/accounts/{business_account['_id']}/bills"
        data, status_code = make_request("POST", endpoint, bill_data)
        print_response(data, status_code, f"Creating bill for {bill['name']}:")
        
        if status_code == 201 or status_code == 200:
            bill_id = data["objectCreated"]["_id"]
            
            # Create a withdrawal to pay the bill
            withdrawal_data = {
                "medium": "balance",
                "transaction_date": datetime.now().strftime("%Y-%m-%d"),
                "status": "completed",
                "amount": bill["amount"],
                "description": f"Payment for {bill['name']}"
            }
            
            endpoint = f"/accounts/{business_account['_id']}/withdrawals"
            data, status_code = make_request("POST", endpoint, withdrawal_data)
            print_response(data, status_code, f"Processing payment for {bill['name']}:")
            
            # Update bill status to completed
            if status_code == 201 or status_code == 200:
                update_bill_data = {
                    "status": "completed"
                }
                
                endpoint = f"/bills/{bill_id}"
                data, status_code = make_request("PUT", endpoint, update_bill_data)
                print_response(data, status_code, f"Updating bill status for {bill['name']}:")
    
    # Call agent script: "I've set up your regular business bills and processed the payments. Your business expenses are now up to date."
    print("🎭 Call Agent: \"I've set up your regular business bills and processed the payments. Your business expenses are now up to date.\"")

# Simulate business loan
def simulate_business_loan(business_account):
    """
    Simulate Maria taking a business loan for bakery expansion
    """
    # Create a loan
    loan_data = {
        "type": "small business",  # Changed from "business" to "small business"
        "status": "approved",
        "credit_score": 720,
        "monthly_payment": 1500,
        "amount": 50000,
        "description": "Bakery expansion loan"
    }
    
    endpoint = f"/accounts/{business_account['_id']}/loans"
    data, status_code = make_request("POST", endpoint, loan_data)
    print_response(data, status_code, "Creating business expansion loan:")
    
    if status_code == 201 or status_code == 200:
        loan_id = data["objectCreated"]["_id"]
        
        # Create a deposit for the loan amount
        deposit_data = {
            "medium": "balance",
            "transaction_date": datetime.now().strftime("%Y-%m-%d"),
            "status": "completed",
            "amount": 50000,
            "description": "Business loan deposit"
        }
        
        endpoint = f"/accounts/{business_account['_id']}/deposits"
        data, status_code = make_request("POST", endpoint, deposit_data)
        print_response(data, status_code, "Processing loan deposit to business account:")
    
    # Call agent script: "Congratulations! Your business loan for bakery expansion has been approved. The $50,000 has been deposited into your business account."
    print("🎭 Call Agent: \"Congratulations! Your business loan for bakery expansion has been approved. The $50,000 has been deposited into your business account.\"")

# Simulate ATM and branch lookups
def simulate_atm_branch_lookups():
    """
    Simulate looking up ATMs and branches near the business
    """
    # Look up ATMs near Maria's Bakery
    params = {
        "lat": 34.0522,
        "lng": -118.2437,
        "rad": 5  # 5 miles radius
    }
    
    data, status_code = make_request("GET", "/atms", params=params)
    print_response(data, status_code, "Finding ATMs near Maria's Bakery:")
    
    # Get all branches
    data, status_code = make_request("GET", "/branches")
    print_response(data, status_code, "Finding all bank branches:")
    
    # Call agent script: "I've found several ATMs near your bakery for convenient cash deposits. I can also see the closest bank branch is on Maple Street, just 1 mile away."
    print("🎭 Call Agent: \"I've found several ATMs near your bakery for convenient cash deposits. I can also see the closest bank branch is on Maple Street, just 1 mile away.\"")

# Generate business summary
def generate_business_summary(business_account, owner_id):
    """
    Generate a summary report for Maria's business
    """
    # Get account details
    endpoint = f"/accounts/{business_account['_id']}"
    account_data, account_status = make_request("GET", endpoint)
    print_response(account_data, account_status, "Getting business account details:")
    
    # Get customer details
    endpoint = f"/customers/{owner_id}"
    customer_data, customer_status = make_request("GET", endpoint)
    print_response(customer_data, customer_status, "Getting business owner details:")
    
    # Get all deposits
    endpoint = f"/accounts/{business_account['_id']}/deposits"
    deposits_data, deposits_status = make_request("GET", endpoint)
    print_response(deposits_data, deposits_status, "Getting all deposits:")
    
    # Get all withdrawals
    endpoint = f"/accounts/{business_account['_id']}/withdrawals"
    withdrawals_data, withdrawals_status = make_request("GET", endpoint)
    print_response(withdrawals_data, withdrawals_status, "Getting all withdrawals:")
    
    # Get all bills
    endpoint = f"/accounts/{business_account['_id']}/bills"
    bills_data, bills_status = make_request("GET", endpoint)
    print_response(bills_data, bills_status, "Getting all bills:")
    
    # Get all loans
    endpoint = f"/accounts/{business_account['_id']}/loans"
    loans_data, loans_status = make_request("GET", endpoint)
    print_response(loans_data, loans_status, "Getting all loans:")
    
    # Call agent script: "Here's a summary of your business finances, Ms. Rodriguez. Your current balance is $XX,XXX with $XX,XXX in recent income and $X,XXX in expenses. Your business loan has a balance of $50,000 with monthly payments of $1,500."
    print("🎭 Call Agent: \"Here's a summary of your business finances, Ms. Rodriguez. Your current balance, recent income, expenses, and loan details are shown above.\"")

# Test individual endpoints
def test_all_endpoints():
    """
    Test all individual endpoints
    """
    print("\n" + "=" * 80)
    print("🧪 TESTING INDIVIDUAL ENDPOINTS")
    print("=" * 80)
    
    # Test customer endpoints
    test_customer_endpoints()
    
    # Test account endpoints
    test_account_endpoints()
    
    # Test bill endpoints
    test_bill_endpoints()
    
    # Test deposit endpoints
    test_deposit_endpoints()
    
    # Test loan endpoints
    test_loan_endpoints()
    
    # Test transfer endpoints
    test_transfer_endpoints()
    
    # Test withdrawal endpoints
    test_withdrawal_endpoints()
    
    # Test purchase endpoints
    test_purchase_endpoints()
    
    # Test merchant endpoints
    test_merchant_endpoints()
    
    # Test ATM and branch endpoints
    test_atm_branch_endpoints()

# Test customer endpoints
def test_customer_endpoints():
    """Test customer-related endpoints"""
    print("\n📋 Testing Customer Endpoints...")
    
    # Create a test customer
    customer_data = {
        "first_name": "Test",
        "last_name": "Customer",
        "address": {
            "street_number": "123",
            "street_name": "Test St",
            "city": "Testville",
            "state": "TS",
            "zip": "12345"
        }
    }
    
    # Test create customer
    data, status_code = make_request("POST", "/customers", customer_data)
    print_response(data, status_code, "Creating test customer:")
    
    if status_code == 201 or status_code == 200:
        customer_id = data["objectCreated"]["_id"]
        
        # Test get all customers
        data, status_code = make_request("GET", "/customers")
        print_response(data, status_code, "Getting all customers:")
        
        # Test get customer by ID
        data, status_code = make_request("GET", f"/customers/{customer_id}")
        print_response(data, status_code, "Getting customer by ID:")
        
        # Test update customer
        update_data = {
            "address": {
                "street_number": "456",
                "street_name": "Updated St",
                "city": "Testville",
                "state": "TS",
                "zip": "12345"
            }
        }
        data, status_code = make_request("PUT", f"/customers/{customer_id}", update_data)
        print_response(data, status_code, "Updating customer:")

# Test the customer-details endpoint specifically
def test_customer_details():
    """
    Test the /api/customer-details endpoint with various parameters
    """
    print("\n" + "=" * 80)
    print("🔍 TESTING CUSTOMER-DETAILS ENDPOINT")
    print("=" * 80)
    
    # First create a test customer to ensure we have valid data
    customer_data = {
        "first_name": "Jane",
        "last_name": "Doe",
        "address": {
            "street_number": "789",
            "street_name": "Test Ave",
            "city": "TestCity",
            "state": "TC",
            "zip": "54321"
        }
    }
    
    # Use this customer ID or create a new one if needed
    customer_id = "67f9ed6f9683f20dd5194d2d"
    
    # Test 1: Get customer details by ID using POST
    print("\n🔍 Test 1: Get customer details by ID using POST")
    
    # For POST requests, the data should be structured properly
    # Option 1: Direct structure
    request_data = {
            "args": {
                "customer_id": customer_id
            }
        }
    
    print("POST request data:", request_data)
    data, status_code = make_request("POST", "/customer-details-post", data=request_data)
    print_response(data, status_code, "Getting customer details by ID (direct structure):")
    
    # Option 2: Nested structure if the first option doesn't work
    if status_code != 200:
        request_data = {
            "args": {
                "customer_id": customer_id
            }
        }
        print("POST request data (nested structure):", request_data)
        data, status_code = make_request("POST", "/customer-details-post", data=request_data)
        print_response(data, status_code, "Getting customer details by ID (nested structure):")
    
    # Test 2: Get customer details with GET request
    print("\n🔍 Test 2: Get customer details with GET request")
    params = {"customer_id": customer_id}
    data, status_code = make_request("GET", "/customer-details", params=params)
    print_response(data, status_code, "Getting customer details by ID (GET):")
    
    print("\n✅ Customer-details endpoint test completed.")

# Test account endpoints (and remaining tests would follow the same pattern)
def test_account_endpoints():
    """Test account-related endpoints"""
    print("\n💳 Testing Account Endpoints...")
    
    # First create a customer to own the account
    customer_data = {
        "first_name": "Account",
        "last_name": "Tester",
        "address": {
            "street_number": "123",
            "street_name": "Account St",
            "city": "Testville",
            "state": "TS",
            "zip": "12345"
        }
    }
    
    customer_response, customer_status = make_request("POST", "/customers", customer_data)
    if customer_status != 201 and customer_status != 200:
        print("Failed to create customer, skipping account tests.")
        return
    
    customer_id = customer_response["objectCreated"]["_id"]
    
    # Test create account
    account_data = {
        "type": "Checking",
        "nickname": "Test Account",
        "rewards": 0,
        "balance": 1000,
        "account_number": f"TEST-{random.randint(10000, 99999)}"
    }
    
    data, status_code = make_request("POST", f"/customers/{customer_id}/accounts", account_data)
    print_response(data, status_code, "Creating test account:")
    
    if status_code == 201 or status_code == 200:
        account_id = data["objectCreated"]["_id"]
        
        # Test get all accounts
        data, status_code = make_request("GET", "/accounts")
        print_response(data, status_code, "Getting all accounts:")
        
        # Test get account by ID
        data, status_code = make_request("GET", f"/accounts/{account_id}")
        print_response(data, status_code, "Getting account by ID:")
        
        # Test get customer accounts
        data, status_code = make_request("GET", f"/customers/{customer_id}/accounts")
        print_response(data, status_code, "Getting customer accounts:")
        
        # Test update account
        update_data = {
            "nickname": "Updated Test Account"
        }
        data, status_code = make_request("PUT", f"/accounts/{account_id}", update_data)
        print_response(data, status_code, "Updating account:")
        
        # Test get account owner
        data, status_code = make_request("GET", f"/accounts/{account_id}/customer")
        print_response(data, status_code, "Getting account owner:")

# Tests for remaining endpoints would follow similar patterns but are omitted for brevity

# Test bill endpoints
def test_bill_endpoints():
    """Test bill-related endpoints (abbreviated)"""
    print("\n📝 Testing Bill Endpoints (abbreviated)...")

# Test deposit endpoints
def test_deposit_endpoints():
    """Test deposit-related endpoints (abbreviated)"""
    print("\n💰 Testing Deposit Endpoints (abbreviated)...")

# Test loan endpoints
def test_loan_endpoints():
    """Test loan-related endpoints (abbreviated)"""
    print("\n💸 Testing Loan Endpoints (abbreviated)...")

# Test transfer endpoints
def test_transfer_endpoints():
    """Test transfer-related endpoints (abbreviated)"""
    print("\n↔️ Testing Transfer Endpoints (abbreviated)...")

# Test withdrawal endpoints
def test_withdrawal_endpoints():
    """Test withdrawal-related endpoints (abbreviated)"""
    print("\n💸 Testing Withdrawal Endpoints (abbreviated)...")

# Test purchase endpoints
def test_purchase_endpoints():
    """Test purchase-related endpoints (abbreviated)"""
    print("\n🛍️ Testing Purchase Endpoints (abbreviated)...")

# Test merchant endpoints
def test_merchant_endpoints():
    """Test merchant-related endpoints (abbreviated)"""
    print("\n🏪 Testing Merchant Endpoints (abbreviated)...")

# Test ATM and branch endpoints
def test_atm_branch_endpoints():
    """Test ATM and branch-related endpoints (abbreviated)"""
    print("\n🏧 Testing ATM and Branch Endpoints (abbreviated)...")

if __name__ == "__main__":
    print("🏦 Lakeside Community Bank API Test Script")
    print("========================================")
    
    # Check if Flask server is likely running (optional)
    try:
        requests.get("http://localhost:5000", timeout=1)
        print("✅ Flask server appears to be running.")
    except requests.exceptions.ConnectionError:
        print("⚠️ Warning: Flask server doesn't appear to be running.")
        print("Start the server by running 'python app.py' in another terminal.")
        response = input("Continue anyway? (y/n): ")
        if response.lower() != 'y':
            sys.exit(1)
    
    # Determine what to test
    print("\nSelect testing mode:")
    print("1. Run full business scenario simulation")
    print("2. Test individual endpoints")
    print("3. Run original get_customers test")
    print("4. Test customer-details endpoint specifically")
    
    try:
        choice = input("Enter choice (1-4, default=1): ") or "1"
        
        if choice == "1":
            run_business_scenario()
        elif choice == "2":
            test_all_endpoints()
        elif choice == "3":
            test_get_customers()
        elif choice == "4":
            test_customer_details()
        else:
            print("Invalid choice. Running business scenario by default.")
            run_business_scenario()
            
    except KeyboardInterrupt:
        print("\n\nTest script interrupted.")
    except Exception as e:
        print(f"\n\nError in test script: {str(e)}")
    
    print("\n✅ Tests completed.")
