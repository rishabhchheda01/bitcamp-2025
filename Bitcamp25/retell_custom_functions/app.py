import requests
import json
from flask import Flask, jsonify, request
from flask_cors import CORS
import os
from retell import Retell

app = Flask(__name__)
CORS(app)

# Retell API key - in production, store this in environment variables
RETELL_API_KEY = "key_c658f6ca7a8848afb60a7895641f"

# Initialize the Retell client
retell_client = Retell(api_key=RETELL_API_KEY)

# Nessie API key - in production, store this in environment variables
NESSIE_API_KEY = "f1fbb5f9a7bfdc1597fafdf76476cfa7"
NESSIE_BASE_URL = "http://api.nessieisreal.com"

@app.route('/api/get-customers', methods=['GET', 'POST'])
def get_nessie_customers():
    """
    Function to fetch customers from the Nessie API
    """
    # Handle both GET and POST requests equally
    # No need to process the request body for this endpoint
    
    url = "http://api.nessieisreal.com/customers"
    
    # API key as a query parameter
    params = {
        "key": NESSIE_API_KEY
    }
    
    # Set headers to accept JSON
    headers = {
        "Accept": "application/json"
    }
    
    # Make the GET request
    response = requests.get(url, params=params, headers=headers)
    
    # Check if the request was successful
    if response.status_code == 200:
        # Parse and return the JSON data
        return response.json()
    else:
        print(f"Error: {response.status_code}")
        print(response.text)
        return jsonify({"error": f"Error {response.status_code}", "message": response.text}), response.status_code


# Helper function for Nessie API requests
def nessie_request(method, endpoint, body=None, params=None):
    """Helper function to make requests to the Nessie API"""
    if params is None:
        params = {}
    
    # Always include API key
    params["key"] = NESSIE_API_KEY
    
    # Set headers
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json"
    }
    
    url = f"{NESSIE_BASE_URL}{endpoint}"
    
    if method == "GET":
        response = requests.get(url, params=params, headers=headers)
    elif method == "POST":
        response = requests.post(url, json=body, params=params, headers=headers)
    elif method == "PUT":
        response = requests.put(url, json=body, params=params, headers=headers)
    elif method == "DELETE":
        response = requests.delete(url, params=params, headers=headers)
    else:
        return jsonify({"error": "Invalid method"}), 400
    
    if response.status_code >= 200 and response.status_code < 300:
        if response.text:  # Check if response body exists
            return response.json(), response.status_code
        return {}, response.status_code
    else:
        return jsonify({"error": f"Error {response.status_code}", "message": response.text}), response.status_code


# =============================================
# CUSTOMER MANAGEMENT ENDPOINTS
# =============================================

@app.route('/api/customers', methods=['GET'])
def get_customers():
    """List all active customers"""
    return nessie_request("GET", "/customers")

@app.route('/api/customers/<customer_id>', methods=['GET'])
def get_customer(customer_id):
    """Get detailed information for a specific customer"""
    return nessie_request("GET", f"/customers/{customer_id}")

@app.route('/api/customers', methods=['POST'])
def create_customer():
    """Create a new customer"""
    body = request.get_json()
    return nessie_request("POST", "/customers", body=body)

@app.route('/api/customers/<customer_id>', methods=['PUT'])
def update_customer(customer_id):
    """Update customer information"""
    body = request.get_json()
    return nessie_request("PUT", f"/customers/{customer_id}", body=body)


# =============================================
# ACCOUNT MANAGEMENT ENDPOINTS
# =============================================

@app.route('/api/accounts', methods=['GET'])
def get_accounts():
    """List all accounts"""
    account_type = request.args.get('type', '')
    params = {}
    if account_type:
        params["type"] = account_type
    return nessie_request("GET", "/accounts", params=params)

@app.route('/api/accounts/<account_id>', methods=['GET'])
def get_account(account_id):
    """Get account details"""
    return nessie_request("GET", f"/accounts/{account_id}")

@app.route('/api/customers/<customer_id>/accounts', methods=['GET'])
def get_customer_accounts(customer_id):
    """Get accounts for a specific customer"""
    return nessie_request("GET", f"/customers/{customer_id}/accounts")

@app.route('/api/customers/<customer_id>/accounts', methods=['POST'])
def create_customer_account(customer_id):
    """Create a new account for a customer"""
    body = request.get_json()
    return nessie_request("POST", f"/customers/{customer_id}/accounts", body=body)

@app.route('/api/accounts/<account_id>', methods=['PUT'])
def update_account(account_id):
    """Update account details"""
    body = request.get_json()
    return nessie_request("PUT", f"/accounts/{account_id}", body=body)

@app.route('/api/accounts/<account_id>', methods=['DELETE'])
def delete_account(account_id):
    """Delete an account"""
    return nessie_request("DELETE", f"/accounts/{account_id}")

@app.route('/api/accounts/<account_id>/customer', methods=['GET'])
def get_account_customer(account_id):
    """Get customer who owns the account"""
    return nessie_request("GET", f"/accounts/{account_id}/customer")


# =============================================
# BILL MANAGEMENT ENDPOINTS
# =============================================

@app.route('/api/accounts/<account_id>/bills', methods=['GET'])
def get_account_bills(account_id):
    """Get all bills for a specific account"""
    return nessie_request("GET", f"/accounts/{account_id}/bills")

@app.route('/api/bills/<bill_id>', methods=['GET'])
def get_bill(bill_id):
    """Get bill details"""
    return nessie_request("GET", f"/bills/{bill_id}")

@app.route('/api/customers/<customer_id>/bills', methods=['GET'])
def get_customer_bills(customer_id):
    """Get bills for a specific customer"""
    return nessie_request("GET", f"/customers/{customer_id}/bills")

@app.route('/api/accounts/<account_id>/bills', methods=['POST'])
def create_bill(account_id):
    """Create a bill"""
    body = request.get_json()
    return nessie_request("POST", f"/accounts/{account_id}/bills", body=body)

@app.route('/api/bills/<bill_id>', methods=['PUT'])
def update_bill(bill_id):
    """Update a bill"""
    body = request.get_json()
    return nessie_request("PUT", f"/bills/{bill_id}", body=body)

@app.route('/api/bills/<bill_id>', methods=['DELETE'])
def delete_bill(bill_id):
    """Delete a bill"""
    return nessie_request("DELETE", f"/bills/{bill_id}")


# =============================================
# DEPOSIT MANAGEMENT ENDPOINTS
# =============================================

@app.route('/api/accounts/<account_id>/deposits', methods=['GET'])
def get_account_deposits(account_id):
    """Get all deposits for a specific account"""
    return nessie_request("GET", f"/accounts/{account_id}/deposits")

@app.route('/api/deposits/<deposit_id>', methods=['GET'])
def get_deposit(deposit_id):
    """Get deposit details"""
    return nessie_request("GET", f"/deposits/{deposit_id}")

@app.route('/api/accounts/<account_id>/deposits', methods=['POST'])
def create_deposit(account_id):
    """Create a deposit"""
    body = request.get_json()
    return nessie_request("POST", f"/accounts/{account_id}/deposits", body=body)

@app.route('/api/deposits/<deposit_id>', methods=['PUT'])
def update_deposit(deposit_id):
    """Update a deposit"""
    body = request.get_json()
    return nessie_request("PUT", f"/deposits/{deposit_id}", body=body)

@app.route('/api/deposits/<deposit_id>', methods=['DELETE'])
def delete_deposit(deposit_id):
    """Delete a deposit"""
    return nessie_request("DELETE", f"/deposits/{deposit_id}")


# =============================================
# LOAN MANAGEMENT ENDPOINTS
# =============================================

@app.route('/api/accounts/<account_id>/loans', methods=['GET'])
def get_account_loans(account_id):
    """Get all loans for a specific account"""
    return nessie_request("GET", f"/accounts/{account_id}/loans")

@app.route('/api/loans/<loan_id>', methods=['GET'])
def get_loan(loan_id):
    """Get loan details"""
    return nessie_request("GET", f"/loans/{loan_id}")

@app.route('/api/accounts/<account_id>/loans', methods=['POST'])
def create_loan(account_id):
    """Create a loan for a business account"""
    body = request.get_json()
    return nessie_request("POST", f"/accounts/{account_id}/loans", body=body)

@app.route('/api/loans/<loan_id>', methods=['PUT'])
def update_loan(loan_id):
    """Update a loan"""
    body = request.get_json()
    return nessie_request("PUT", f"/loans/{loan_id}", body=body)

@app.route('/api/loans/<loan_id>', methods=['DELETE'])
def delete_loan(loan_id):
    """Delete a loan"""
    return nessie_request("DELETE", f"/loans/{loan_id}")


# =============================================
# TRANSFER MANAGEMENT ENDPOINTS
# =============================================

@app.route('/api/accounts/<account_id>/transfers', methods=['GET'])
def get_account_transfers(account_id):
    """Get all transfers for a specific account"""
    transfer_type = request.args.get('type', '')
    params = {}
    if transfer_type:
        params["type"] = transfer_type
    return nessie_request("GET", f"/accounts/{account_id}/transfers", params=params)

@app.route('/api/transfers/<transfer_id>', methods=['GET'])
def get_transfer(transfer_id):
    """Get transfer details"""
    return nessie_request("GET", f"/transfers/{transfer_id}")

@app.route('/api/accounts/<account_id>/transfers', methods=['POST'])
def create_transfer(account_id):
    """Create a transfer"""
    body = request.get_json()
    return nessie_request("POST", f"/accounts/{account_id}/transfers", body=body)

@app.route('/api/transfers/<transfer_id>', methods=['PUT'])
def update_transfer(transfer_id):
    """Update a transfer"""
    body = request.get_json()
    return nessie_request("PUT", f"/transfers/{transfer_id}", body=body)

@app.route('/api/transfers/<transfer_id>', methods=['DELETE'])
def delete_transfer(transfer_id):
    """Delete a transfer"""
    return nessie_request("DELETE", f"/transfers/{transfer_id}")


# =============================================
# WITHDRAWAL MANAGEMENT ENDPOINTS
# =============================================

@app.route('/api/accounts/<account_id>/withdrawals', methods=['GET'])
def get_account_withdrawals(account_id):
    """Get all withdrawals for a specific account"""
    return nessie_request("GET", f"/accounts/{account_id}/withdrawals")

@app.route('/api/withdrawals/<withdrawal_id>', methods=['GET'])
def get_withdrawal(withdrawal_id):
    """Get withdrawal details"""
    return nessie_request("GET", f"/withdrawals/{withdrawal_id}")

@app.route('/api/accounts/<account_id>/withdrawals', methods=['POST'])
def create_withdrawal(account_id):
    """Create a withdrawal"""
    body = request.get_json()
    return nessie_request("POST", f"/accounts/{account_id}/withdrawals", body=body)

@app.route('/api/withdrawals/<withdrawal_id>', methods=['PUT'])
def update_withdrawal(withdrawal_id):
    """Update a withdrawal"""
    body = request.get_json()
    return nessie_request("PUT", f"/withdrawals/{withdrawal_id}", body=body)

@app.route('/api/withdrawals/<withdrawal_id>', methods=['DELETE'])
def delete_withdrawal(withdrawal_id):
    """Delete a withdrawal"""
    return nessie_request("DELETE", f"/withdrawals/{withdrawal_id}")


# =============================================
# PURCHASE MANAGEMENT ENDPOINTS
# =============================================

@app.route('/api/accounts/<account_id>/purchases', methods=['GET'])
def get_account_purchases(account_id):
    """Get all purchases for a specific account"""
    return nessie_request("GET", f"/accounts/{account_id}/purchases")

@app.route('/api/merchants/<merchant_id>/purchases', methods=['GET'])
def get_merchant_purchases(merchant_id):
    """Get all purchases for a specific merchant"""
    return nessie_request("GET", f"/merchants/{merchant_id}/purchases")

@app.route('/api/merchants/<merchant_id>/accounts/<account_id>/purchases', methods=['GET'])
def get_merchant_account_purchases(merchant_id, account_id):
    """Get all purchases for a specific merchant and account"""
    return nessie_request("GET", f"/merchants/{merchant_id}/accounts/{account_id}/purchases")

@app.route('/api/purchases/<purchase_id>', methods=['GET'])
def get_purchase(purchase_id):
    """Get purchase details"""
    return nessie_request("GET", f"/purchases/{purchase_id}")

@app.route('/api/accounts/<account_id>/purchases', methods=['POST'])
def create_purchase(account_id):
    """Create a purchase"""
    body = request.get_json()
    return nessie_request("POST", f"/accounts/{account_id}/purchases", body=body)

@app.route('/api/purchases/<purchase_id>', methods=['PUT'])
def update_purchase(purchase_id):
    """Update a purchase"""
    body = request.get_json()
    return nessie_request("PUT", f"/purchases/{purchase_id}", body=body)

@app.route('/api/purchases/<purchase_id>', methods=['DELETE'])
def delete_purchase(purchase_id):
    """Delete a purchase"""
    return nessie_request("DELETE", f"/purchases/{purchase_id}")


# =============================================
# MERCHANT MANAGEMENT ENDPOINTS
# =============================================

@app.route('/api/merchants', methods=['GET'])
def get_merchants():
    """Get all merchants"""
    lat = request.args.get('lat')
    lng = request.args.get('lng')
    rad = request.args.get('rad')
    
    params = {}
    if lat:
        params["lat"] = lat
    if lng:
        params["lng"] = lng
    if rad:
        params["rad"] = rad
        
    return nessie_request("GET", "/merchants", params=params)

@app.route('/api/merchants/<merchant_id>', methods=['GET'])
def get_merchant(merchant_id):
    """Get merchant details"""
    return nessie_request("GET", f"/merchants/{merchant_id}")

@app.route('/api/merchants', methods=['POST'])
def create_merchant():
    """Create a merchant"""
    body = request.get_json()
    return nessie_request("POST", "/merchants", body=body)

@app.route('/api/merchants/<merchant_id>', methods=['PUT'])
def update_merchant(merchant_id):
    """Update a merchant"""
    body = request.get_json()
    return nessie_request("PUT", f"/merchants/{merchant_id}", body=body)


# =============================================
# ATM & BRANCH MANAGEMENT ENDPOINTS
# =============================================

@app.route('/api/atms', methods=['GET'])
def get_atms():
    """Get all ATMs"""
    lat = request.args.get('lat')
    lng = request.args.get('lng')
    rad = request.args.get('rad')
    
    params = {}
    if lat:
        params["lat"] = lat
    if lng:
        params["lng"] = lng
    if rad:
        params["rad"] = rad
        
    return nessie_request("GET", "/atms", params=params)

@app.route('/api/atms/<atm_id>', methods=['GET'])
def get_atm(atm_id):
    """Get ATM details"""
    return nessie_request("GET", f"/atms/{atm_id}")

@app.route('/api/branches', methods=['GET'])
def get_branches():
    """Get all branches"""
    return nessie_request("GET", "/branches")

@app.route('/api/branches/<branch_id>', methods=['GET'])
def get_branch(branch_id):
    """Get branch details"""
    return nessie_request("GET", f"/branches/{branch_id}")


# =============================================
# DATA MANAGEMENT ENDPOINTS
# =============================================

@app.route('/api/data', methods=['DELETE'])
def delete_data():
    """Delete data"""
    data_type = request.args.get('type', '')
    params = {}
    if data_type:
        params["type"] = data_type
    return nessie_request("DELETE", "/data", params=params)


if __name__ == '__main__':
    app.run()
