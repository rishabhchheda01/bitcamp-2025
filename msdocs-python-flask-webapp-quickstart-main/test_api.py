import requests
import json

# Base URL for the API (change if deployed elsewhere)
BASE_URL = "http://127.0.0.1:5000"  # Default Flask development server67fb8c0d9683f20dd51956d3
# BASE_URL = "https://retell-custom-functions-api-2.azurewebsites.net"

customer_id = "67fb5ebe9683f20dd5195646"
account_id = "67fb5f929683f20dd5195647"
loan_id = "67fb611d9683f20dd5195648"
credit_card_account_id = "67fb8ef39683f20dd51956f2"

def add_args(json_data):
    """Add args to the JSON data"""
    if "args" not in json_data:
        json_data = {
          "args": json_data
          }
    return json_data

def test_get_customers():
    """Test the /api/customers endpoint"""
    print("\n=== Testing GET /api/customers ===")
    response = requests.get(f"{BASE_URL}/api/customers")
    if response.status_code == 200:
        print(f"SUCCESS: Status code {response.status_code}")
        customers = response.json()
        print(f"Found {len(customers)} customers")
        if len(customers) > 0:
            # Print a sample customer
            print(f"Sample customer: {json.dumps(customers[0], indent=2)}")
    else:
        print(f"ERROR: Status code {response.status_code}")
        print(response.text)
    
    print("\n=== Testing POST /api/customers ===")
    print(f"{BASE_URL}/api/customers")
    response = requests.post(
        f"{BASE_URL}/api/customers", 
        json={"args": {"some_filter": "value"}}
    )
    if response.status_code == 200:
        print(f"SUCCESS: Status code {response.status_code}")
        data = response.json()
        print(f"Found {len(data)} customers")
        print("Here's the data")
        for i in data:
          print(json.dumps(i, indent=2))
    else:
        print(f"ERROR: Status code {response.status_code}")
        print(response.text)

def test_get_customer_details():
    """Test the /api/customer-details endpoint"""
    print("\n=== Testing GET /api/customer-details ===")
    
    # For testing, you would need a valid customer ID
    # This is just a placeholder
    # customer_id = "67fb040c9683f20dd5195559"  # Replace with a valid customer ID
    
    response = requests.get(f"{BASE_URL}/api/customer-details?customer_id={customer_id}")
    if response.status_code == 200:
        print(f"SUCCESS: Status code {response.status_code}")
        customer = response.json()
        print(f"Customer details: {json.dumps(customer, indent=2)}")
    else:
        print(f"ERROR: Status code {response.status_code}")
        print(response.text)
    
    print("\n=== Testing POST /api/customer-details ===")
    response = requests.post(
        f"{BASE_URL}/api/customer-details", 
        json={"customer_id": customer_id}
    )
    if response.status_code == 200:
        print(f"SUCCESS: Status code {response.status_code}")
        customer = response.json()
        print(f"Customer details: {json.dumps(customer, indent=2)}")
    else:
        print(f"ERROR: Status code {response.status_code}")
        print(response.text)

def test_customer_details_post_only():
    """Test the /api/customer-details-post endpoint"""
    print("\n=== Testing POST /api/customer-details-post ===")
    
    # For testing, you would need a valid customer ID
    # customer_id = "67fb040c9683f20dd5195559"  # Replace with a valid customer ID
    
    response = requests.post(
        f"{BASE_URL}/api/customer-details-post", 
        json={"customer_id": customer_id}
    )
    if response.status_code == 200:
        print(f"SUCCESS: Status code {response.status_code}")
        customer = response.json()
        print(f"Customer details: {json.dumps(customer, indent=2)}")
    else:
        print(f"ERROR: Status code {response.status_code}")
        print(response.text)

def test_customer_details_names_post():
    """Test the /api/customer-details-names-post endpoint"""
    print("\n=== Testing POST /api/customer-details-names-post ===")
    
    # For testing with sample names
    first_name = "john"
    last_name = "shim"
    
    response = requests.post(
        f"{BASE_URL}/api/customer-details-names-post", 
        json={"args": {"fName": first_name, "lName": last_name}}
    )
    if response.status_code == 200:
        print(f"SUCCESS: Status code {response.status_code}")
        result = response.json()
        print(f"Found {result['count']} customers with name {first_name} {last_name}")
        if result['count'] > 0:
            print(f"Customers found: {json.dumps(result['customers'], indent=2)}")
    else:
        print(f"ERROR: Status code {response.status_code}")
        print(response.text)

def test_create_customer():
    """Test the /api/create-customer endpoint"""
    print("\n=== Testing POST /api/create-customer ===")
    
    # Sample new customer data
    new_customer = {
        "first_name": "New",
        "last_name": "Customer",
        "address": {
            "street_number": "789",
            "street_name": "Pine St",
            "city": "Newtown",
            "state": "CA",
            "zip": "54321"
        }
    }
    
    response = requests.post(
        f"{BASE_URL}/api/create-customer", 
        json=new_customer
    )
    if response.status_code in [200, 201]:
        print(f"SUCCESS: Status code {response.status_code}")
        result = response.json()
        print(f"Created customer: {json.dumps(result, indent=2)}")
        
        # If successful, you could use the new customer ID for further tests
        if "objectCreated" in result and "_id" in result["objectCreated"]:
            new_customer_id = result["objectCreated"]["_id"]
            print(f"New customer ID: {new_customer_id}")
    else:
        print(f"ERROR: Status code {response.status_code}")
        print(response.text)

def test_retell_agent():
    """Test the /api/retell-agent endpoint"""
    print("\n=== Testing POST /api/retell-agent ===")
    
    # Sample data for the retell agent
    sample_data = {
        "agent_id": "agent_99a678a68a9e21fc5694977ffc"
    }
    
    response = requests.post(
        f"{BASE_URL}/api/generate-token", 
        json=sample_data
    )
    if response.status_code == 200:
        print(f"SUCCESS: Status code {response.status_code}")
        result = response.json()
        print(f"Response from retell agent: {json.dumps(result, indent=2)}")
    else:
        print(f"ERROR: Status code {response.status_code}")
        print(response.text)

def test_upcoming_loans():
    """Test the /api/upcoming-loans endpoint"""
    print("\n=== Testing POST /api/upcoming-loans ===")
    
    # For testing, you would need a valid customer ID
    # customer_id = "67fb040c9683f20dd5195559"  # Replace with a valid customer ID
    
    response = requests.post(
        f"{BASE_URL}/api/upcoming-loans",
        json={"args": {"customer_id": customer_id}}
    )
    
    if response.status_code == 200:
        print(f"SUCCESS: Status code {response.status_code}")
        result = response.json()
        print(f"Found {result.get('count', 0)} upcoming loans")
        loans = result.get('upcoming_loans', [])
        if loans:
            print(f"Sample loan: {json.dumps(loans[0], indent=2)}")
        else:
            print("No upcoming loans found for this customer.")
    else:
        print(f"ERROR: Status code {response.status_code}")
        print(response.text)
    
    # Test error case - missing customer_id
    print("\n=== Testing error case - missing customer_id ===")
    error_response = requests.post(
        f"{BASE_URL}/api/upcoming-loans",
        json={"args": {}}  # Empty args, no customer_id
    )
    
    if error_response.status_code == 400:
        print(f"Expected error received: Status code {error_response.status_code}")
        print(error_response.text)
    else:
        print(f"Unexpected response: Status code {error_response.status_code}")
        print(error_response.text)

def test_pay_loan():
  """Test the /api/pay-loan endpoint"""
  print("\n=== Testing POST /api/pay-loan ===")
  
  # Test successful payment
  print("\n--- Testing successful loan payment ---")
  payment_data = {
    "args": {
      "loan_id": loan_id,
      "amount": 1000
    }
  }
  
  response = requests.post(
    f"{BASE_URL}/api/pay-loan",
    json=payment_data
  )
  
  if response.status_code == 200:
    print(f"SUCCESS: Status code {response.status_code}")
    result = response.json()
    print(f"Payment result: {json.dumps(result, indent=2)}")
    print(f"Previous amount: {result.get('previous_amount')}")
    print(f"New amount: {result.get('new_amount')}")
    print(f"Loan paid off: {result.get('loan_paid_off')}")
  else:
    print(f"ERROR: Status code {response.status_code}")
    print(response.text)
  
  # Test missing loan_id
  print("\n--- Testing error case - missing loan_id ---")
  error_response = requests.post(
    f"{BASE_URL}/api/pay-loan",
    json={"args": {"amount": 100.00}}
  )
  
  if error_response.status_code == 400:
    print(f"Expected error received: Status code {error_response.status_code}")
    print(error_response.text)
  else:
    print(f"Unexpected response: Status code {error_response.status_code}")
    print(error_response.text)
  
  # Test missing amount
  print("\n--- Testing error case - missing amount ---")
  error_response = requests.post(
    f"{BASE_URL}/api/pay-loan",
    json={"args": {"loan_id": loan_id}}
  )
  
  if error_response.status_code == 400:
    print(f"Expected error received: Status code {error_response.status_code}")
    print(error_response.text)
  else:
    print(f"Unexpected response: Status code {error_response.status_code}")
    print(error_response.text)
  
  # Test invalid amount (string instead of number)
  print("\n--- Testing error case - invalid amount ---")
  error_response = requests.post(
    f"{BASE_URL}/api/pay-loan",
    json={"args": {"loan_id": loan_id, "amount": "invalid"}}
  )
  
  if error_response.status_code == 400:
    print(f"Expected error received: Status code {error_response.status_code}")
    print(error_response.text)
  else:
    print(f"Unexpected response: Status code {error_response.status_code}")
    print(error_response.text)

def test_customer_accounts():
  """Test the /api/customer-accounts endpoint"""
  print("\n=== Testing POST /api/customer-accounts ===")
  
  # Test successful case
  print("\n--- Testing successful account retrieval ---")
  response = requests.post(
    f"{BASE_URL}/api/customer-accounts",
    json={"args": {"customer_id": customer_id}}
  )
  
  if response.status_code == 200:
    print(f"SUCCESS: Status code {response.status_code}")
    result = response.json()
    print(f"Found {result.get('count', 0)} accounts for customer")
    accounts = result.get('accounts', [])
    if accounts:
      for acc in accounts:
        print(f"Sample account: {json.dumps(acc, indent=2)}")
    else:
      print("No accounts found for this customer.")
  else:
    print(f"ERROR: Status code {response.status_code}")
    print(response.text)
  
  # Test error case - missing customer_id
  print("\n--- Testing error case - missing customer_id ---")
  error_response = requests.post(
    f"{BASE_URL}/api/customer-accounts",
    json={"args": {}}  # Empty args, no customer_id
  )
  
  if error_response.status_code == 400:
    print(f"Expected error received: Status code {error_response.status_code}")
    print(error_response.text)
  else:
    print(f"Unexpected response: Status code {error_response.status_code}")
    print(error_response.text)
  
  # Test with invalid customer_id
  print("\n--- Testing with invalid customer_id ---")
  invalid_response = requests.post(
    f"{BASE_URL}/api/customer-accounts",
    json={"args": {"customer_id": "invalid_id_12345"}}
  )
  
  # Print the response (could be 404 or other error code)
  print(f"Status code with invalid ID: {invalid_response.status_code}")
  print(invalid_response.text)

def test_pay_credit_card():
  """Test the /api/pay-credit-card endpoint"""
  print("\n=== Testing POST /api/pay-credit-card ===")
  
  # Test successful payment
  print("\n--- Testing successful credit card payment ---")
  payment_data = {
    "args": {
      "credit_card_id": credit_card_account_id,
      "bank_account_id": account_id,
      "amount": 500
    }
  }
  
  response = requests.post(
    f"{BASE_URL}/api/pay-credit-card",
    json=payment_data
  )
  
  if response.status_code == 200:
    print(f"SUCCESS: Status code {response.status_code}")
    result = response.json()
    print(f"Payment result: {json.dumps(result, indent=2)}")
    print(f"Amount paid: {result.get('amount_paid')}")
    print(f"Credit card ID: {result.get('credit_card_id')}")
    print(f"Bank account ID: {result.get('bank_account_id')}")
  else:
    print(f"ERROR: Status code {response.status_code}")
    print(response.text)
  
  # Test missing credit_card_id
  print("\n--- Testing error case - missing credit_card_id ---")
  error_response = requests.post(
    f"{BASE_URL}/api/pay-credit-card",
    json={"args": {"bank_account_id": account_id, "amount": 100.00}}
  )
  
  if error_response.status_code == 400:
    print(f"Expected error received: Status code {error_response.status_code}")
    print(error_response.text)
  else:
    print(f"Unexpected response: Status code {error_response.status_code}")
    print(error_response.text)
  
  # Test missing bank_account_id
  print("\n--- Testing error case - missing bank_account_id ---")
  error_response = requests.post(
    f"{BASE_URL}/api/pay-credit-card",
    json={"args": {"credit_card_id": credit_card_account_id, "amount": 100.00}}
  )
  
  if error_response.status_code == 400:
    print(f"Expected error received: Status code {error_response.status_code}")
    print(error_response.text)
  else:
    print(f"Unexpected response: Status code {error_response.status_code}")
    print(error_response.text)
  
  # Test missing amount
  print("\n--- Testing error case - missing amount ---")
  error_response = requests.post(
    f"{BASE_URL}/api/pay-credit-card",
    json={"args": {"credit_card_id": credit_card_account_id, "bank_account_id": account_id}}
  )
  
  if error_response.status_code == 400:
    print(f"Expected error received: Status code {error_response.status_code}")
    print(error_response.text)
  else:
    print(f"Unexpected response: Status code {error_response.status_code}")
    print(error_response.text)
  
  # Test invalid amount (negative value)
  print("\n--- Testing error case - negative amount ---")
  error_response = requests.post(
    f"{BASE_URL}/api/pay-credit-card",
    json={"args": {"credit_card_id": credit_card_account_id, "bank_account_id": account_id, "amount": -100}}
  )
  
  if error_response.status_code == 400:
    print(f"Expected error received: Status code {error_response.status_code}")
    print(error_response.text)
  else:
    print(f"Unexpected response: Status code {error_response.status_code}")
    print(error_response.text)
  
  # Test invalid amount (string instead of number)
  print("\n--- Testing error case - invalid amount type ---")
  error_response = requests.post(
    f"{BASE_URL}/api/pay-credit-card",
    json={"args": {"credit_card_id": credit_card_account_id, "bank_account_id": account_id, "amount": "invalid"}}
  )
  
  if error_response.status_code == 400:
    print(f"Expected error received: Status code {error_response.status_code}")
    print(error_response.text)
  else:
    print(f"Unexpected response: Status code {error_response.status_code}")
    print(error_response.text)

def test_account_transactions():
  """Test the /api/account-transactions endpoint"""
  print("\n=== Testing POST /api/account-transactions ===")
  
  # Test successful retrieval of transactions
  print("\n--- Testing successful transaction retrieval ---")
  response = requests.post(
    f"{BASE_URL}/api/account-transactions",
    json={"args": {"account_id": account_id, "n": 5}}
  )
  
  if response.status_code == 200:
    print(f"SUCCESS: Status code {response.status_code}")
    result = response.json()
    print(f"Found {result.get('count', 0)} transactions for account")
    transactions = result.get('transactions', [])
    if transactions:
      for tr in transactions:
        print(f"Sample transaction: {json.dumps(tr, indent=2)}")
    else:
      print("No transactions found for this account.")
  else:
    print(f"ERROR: Status code {response.status_code}")
    print(response.text)
  
  # Test with default number of transactions (no n specified)
  print("\n--- Testing with default count parameter ---")
  response = requests.post(
    f"{BASE_URL}/api/account-transactions",
    json={"args": {"account_id": account_id}}
  )
  
  if response.status_code == 200:
    print(f"SUCCESS: Status code {response.status_code}")
    result = response.json()
    print(f"Default retrieval returned {result.get('count', 0)} transactions")
  else:
    print(f"ERROR: Status code {response.status_code}")
    print(response.text)
  
  # Test error case - missing account_id
  print("\n--- Testing error case - missing account_id ---")
  error_response = requests.post(
    f"{BASE_URL}/api/account-transactions",
    json={"args": {"n": 5}}
  )
  
  if error_response.status_code == 400:
    print(f"Expected error received: Status code {error_response.status_code}")
    print(error_response.text)
  else:
    print(f"Unexpected response: Status code {error_response.status_code}")
    print(error_response.text)
  
  # Test error case - invalid n parameter
  print("\n--- Testing error case - invalid n parameter ---")
  error_response = requests.post(
    f"{BASE_URL}/api/account-transactions",
    json={"args": {"account_id": account_id, "n": "invalid"}}
  )
  
  if error_response.status_code == 400:
    print(f"Expected error received: Status code {error_response.status_code}")
    print(error_response.text)
  else:
    print(f"Unexpected response: Status code {error_response.status_code}")
    print(error_response.text)


if __name__ == "__main__":
    print("Starting API tests...")
    
    # Uncomment the tests you want to run
    # test_get_customers()
    # test_get_customer_details()
    # test_customer_details_post_only()
    # test_customer_details_names_post()
    # test_create_customer()
    # test_upcoming_loans()  # Run the new test for upcoming loans
    # test_retell_agent()
    # test_pay_loan()
    # test_customer_accounts()
    # test_pay_credit_card()
    test_account_transactions()
    
    
    
    
    print("\nAll tests completed!")