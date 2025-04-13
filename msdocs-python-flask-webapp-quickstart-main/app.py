import requests
import json
from flask import Flask, redirect, request, session, jsonify
from flask_cors import CORS
import os
from retell import Retell

app = Flask(__name__)
CORS(app)

# Retell API key - in production, store this in environment variables
RETELL_API_KEY = "key_8b4cb3a3d82ca7bb3a100e558ce8"

# Initialize the Retell client
retell_client = Retell(api_key=RETELL_API_KEY)

# Nessie API key - in production, store this in environment variables
NESSIE_API_KEY = "f1fbb5f9a7bfdc1597fafdf76476cfa7"
NESSIE_BASE_URL = "http://api.nessieisreal.com"


# @app.route('/api/get-customers', methods=['GET', 'POST'])
# def get_nessie_customers():
#     """
#     Function to fetch customers from the Nessie API
#     """
#     # Handle both GET and POST requests equally
#     # No need to process the request body for this endpoint
    
#     url = "http://api.nessieisreal.com/customers"
    
#     # API key as a query parameter
#     params = {
#         "key": NESSIE_API_KEY
#     }
    
#     # Set headers to accept JSON
#     headers = {
#         "Accept": "application/json"
#     }
    
#     # Make the GET request
#     response = requests.get(url, params=params, headers=headers)
    
#     # Check if the request was successful
#     if response.status_code == 200:
#         # Parse and return the JSON data
#         return response.json()
#     else:
#         print(f"Error: {response.status_code}")
#         print(response.text)
#         return jsonify({"error": f"Error {response.status_code}", "message": response.text}), response.status_code


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
# CUSTOMER MANAGEMENT ENDPOINTS -- Rishabh
# =============================================

@app.route('/api/customers', methods=['GET', 'POST'])
def get_customers(): ## Done
    """List all active customers"""
    # Simply call the Nessie API without verification
    if request.method == 'POST':
        # Extract any filters from request body if needed
        post_data = request.json or {}
        args = post_data.get("args", {})
        # Could use args for filtering if needed
    
    # Proceed with the API request regardless of method
    return nessie_request("GET", "/customers")

@app.route('/api/customer-details', methods=['GET', 'POST'])
def get_customer_details(): ## Done 
    """Get detailed information for a specific customer from request body or query parameters"""
    try:
        # Debug information
        print(f"Request method: {request.method}")
        print(f"Request headers: {request.headers}")
        print(f"Request endpoint: {request.path}")
        
        customer_id = None
        
        # Handle POST request
        if request.method == 'POST':
            print("Getting POST data")
            post_data = request.json or {}
            print("POST data received:", post_data)
            
            # Handle both direct customer_id and nested args structure
            if 'customer_id' in post_data:
                customer_id = post_data.get('customer_id')
            elif 'args' in post_data and 'customer_id' in post_data.get('args', {}):
                customer_id = post_data['args'].get('customer_id')
        # Handle GET request
        else:
            print("Processing as GET request")
            customer_id = request.args.get("customer_id")
            
        if not customer_id:
            return jsonify({"error": "customer_id is required"}), 400
                
        return nessie_request("GET", f"/customers/{customer_id}")
    except Exception as err:
        print(f"Error in get_customer_details: {err}")
        return jsonify({"message": "Internal Server Error"}), 500

@app.route('/api/customer-details-post', methods=['POST'])
def get_customer_details_post_only(): ## Done
    """POST-only endpoint for customer details to avoid Azure proxy issues"""
    try:
        print("POST-only endpoint called")
        print(f"Request method: {request.method}")
        print(f"Request headers: {request.headers}")
        
        post_data = request.json or {}
        print("POST data received:", post_data)
        
        # Handle both direct customer_id and nested args structure
        customer_id = None
        if 'customer_id' in post_data:
            customer_id = post_data.get('customer_id')
        elif 'args' in post_data and 'customer_id' in post_data.get('args', {}):
            customer_id = post_data['args'].get('customer_id')
            
        if not customer_id:
            return jsonify({"error": "customer_id is required"}), 400
                
        return nessie_request("GET", f"/customers/{customer_id}")
    except Exception as err:
        print(f"Error in get_customer_details_post_only: {err}")
        return jsonify({"message": f"Internal Server Error: {str(err)}"}), 500

@app.route('/api/customer-details-names-post', methods=['POST'])
def get_customer_details_names_post(): ## Done
    """POST-only endpoint for customer details to avoid Azure proxy issues"""
    try:
        print("POST-only endpoint called")
        print(f"Request method: {request.method}")
        print(f"Request headers: {request.headers}")
        
        post_data = request.json or {}
        print("POST data received:", post_data)
        
        # Handle both direct customer_id and nested args structure
        fName, lName = None, None

        if 'fName' in post_data.get('args', {}) and 'lName' in post_data.get('args', {}):
            fName = post_data['args'].get('fName')
            lName = post_data['args'].get('lName')
            
        if not fName or not lName:
            return jsonify({"error": "fName or lName is required"}), 400
                
        data_from_nessie, status_code =  nessie_request("GET", f"/customers")
        
        # Filter customers with matching first name and last name
        filtered_customers = []
        if status_code == 200 and data_from_nessie:
            filtered_customers = [customer for customer in data_from_nessie 
                                 if customer.get('first_name').lower() == fName.lower() and customer.get('last_name').lower() == lName.lower()]
        
        # Return in the correct form required
        result = {
            "customers": filtered_customers,
            "count": len(filtered_customers)
        }
        
        return jsonify(result), 200

    except Exception as err:
        print(f"Error in get_customer_details_post_only: {err}")
        return jsonify({"message": f"Internal Server Error: {str(err)}"}), 500

@app.route('/api/create-customer', methods=['POST'])
def create_customer():
    """Create a new customer"""
    try:
        post_data = request.json or {}
        
        # Get customer data from args if it exists
        if "args" in post_data:
            body = post_data.get("args", {})
        else:
            # Use the request body directly if no args structure
            body = post_data
        
        # Make the request to create a customer
        response, status_code = nessie_request("POST", "/customers", body=body)
        
        # Return a consistently formatted response
        if status_code == 201 or status_code == 200:
            if isinstance(response, dict) and not response.get('objectCreated'):
                # Format the response with objectCreated if it's not already there
                return jsonify({"objectCreated": response}), status_code
                
        return response, status_code
    except Exception as err:
        print(f"Error in create_customer: {err}")
        return jsonify({"message": "Internal Server Error"}), 500

@app.route('/api/upcoming-loans', methods=['POST'])
def get_upcoming_loans():
    """Get upcoming loans for a customer"""
    try:
        post_data = request.json or {}
        
        # Extract customer ID from args
        args = post_data.get("args", {})
        customer_id = args.get("customer_id")
        
        if not customer_id:
            return jsonify({"error": "customer_id is required"}), 400
        
        # Get customer accounts
        accounts_response, status_code = nessie_request("GET", f"/customers/{customer_id}/accounts")
        if status_code != 200:
            return jsonify({"error": "Could not fetch accounts"}), 400
        
        # Collect loans from all accounts
        upcoming_loans = []
        for account in accounts_response:
            loans_data, loan_status = nessie_request("GET", f"/accounts/{account['_id']}/loans")
            if loan_status == 200 and loans_data:
                upcoming_loans.extend(loans_data)
        
        return jsonify({"upcoming_loans": upcoming_loans, "count": len(upcoming_loans)}), 200
    
    except Exception as err:
        return jsonify({"error": str(err)}), 500

@app.route('/api/pay-loan', methods=['POST'])
def pay_loan():
    """Endpoint to pay off a loan by specified amount"""
    try:
        post_data = request.json or {}
        
        # Extract loan ID and payment amount from args
        args = post_data.get("args", {})
        loan_id = args.get("loan_id")
        payment_amount = args.get("amount")
        
        if not loan_id:
            return jsonify({"error": "loan_id is required"}), 400
        
        if not payment_amount or not isinstance(payment_amount, (int, float)):
            return jsonify({"error": "Valid payment amount is required"}), 400
        
        # First get current loan details
        loan_response, status_code = nessie_request("GET", f"/loans/{loan_id}")
        if status_code != 200:
            return jsonify({"error": "Could not fetch loan details"}), 400
        
        # Calculate new amount after payment
        current_amount = loan_response.get("amount", 0)
        new_amount = int(max(0, current_amount - payment_amount))
        
        account_id = loan_response.get("account_id")
        
        # Create a withdrawal to account for the loan payment
        withdrawal_data = {
            "medium": "balance",
            "amount": payment_amount,
            "description": f"Loan payment for loan {loan_id}"
        }
                
        # Make the withdrawal request
        withdrawal_response, withdrawal_status = nessie_request(
            "POST", 
            f"/accounts/{account_id}/withdrawals", 
            body=withdrawal_data
        )

        # # Check if withdrawal was successful
        # if withdrawal_status != 201 and withdrawal_status != 200:
        #     return jsonify({
        #         "error": "Failed to process loan payment withdrawal",
        #         "withdrawal_status": withdrawal_status
        #     }), 400
        
        print(new_amount)
        
        # If new amount is 0, delete the loan, otherwise update it
        if new_amount == 0:
            # Delete the loan since it's paid off
            delete_response, delete_status = nessie_request("DELETE", f"/loans/{loan_id}")
            
            if delete_status == 200 or delete_status == 202 or delete_status == 204:
                return jsonify({
                    "success": True,
                    "previous_amount": current_amount,
                    "payment_amount": payment_amount,
                    "new_amount": 0,
                    "loan_paid_off": True
                }), 200
            else:
                return jsonify({"error": "Failed to delete paid off loan"}), delete_status
        else:
            # Update the loan with the new amount
            update_data = {"amount": new_amount}
            update_response, update_status = nessie_request("PUT", f"/loans/{loan_id}", body=update_data)
            
            if update_status == 200 or update_status == 202:
                return jsonify({
                    "success": True,
                    "previous_amount": current_amount,
                    "payment_amount": payment_amount,
                    "new_amount": new_amount,
                    "loan_paid_off": False
                }), 200
            else:
                return jsonify({"error": "Failed to update loan"}), update_status
    
    except Exception as err:
        return jsonify({"error": str(err)}), 500

@app.route('/api/customer-accounts', methods=['POST'])
def get_customer_accounts():
    """Get all accounts for a specific customer"""
    try:
        post_data = request.json or {}
        
        # Extract customer ID from args
        args = post_data.get("args", {})
        customer_id = args.get("customer_id")
        
        if not customer_id:
            return jsonify({"error": "customer_id is required"}), 400
        
        # Get customer accounts from Nessie API
        accounts_response, status_code = nessie_request("GET", f"/customers/{customer_id}/accounts")
        
        if status_code == 200:
            return jsonify({
                "accounts": accounts_response,
                "count": len(accounts_response)
            }), 200
        else:
            return accounts_response, status_code
    
    except Exception as err:
        print(f"Error in get_customer_accounts: {err}")
        return jsonify({"error": str(err)}), 500

@app.route('/api/transfer-money', methods=['POST'])
def transfer_money():
    """Transfer money between accounts"""
    try:
        post_data = request.json or {}
        
        # Extract transfer details from args
        args = post_data.get("args", {})
        payer_id = args.get("payer_id")
        payee_id = args.get("payee_id")
        amount = args.get("amount")
        
        # Validate required fields
        if not payer_id:
            return jsonify({"error": "payer_id is required"}), 400
        if not payee_id:
            return jsonify({"error": "payee_id is required"}), 400
        if not amount or not isinstance(amount, (int, float)) or amount <= 0:
            return jsonify({"error": "A positive amount is required"}), 400
        
        # Prepare the transfer data
        transfer_data = {
            "medium": "balance",  # Always use balance as medium
            "payee_id": payee_id,
            "amount": amount,
            "description": f"Transfer from account {payer_id} to account {payee_id}"
        }
        
        # Make the transfer request to Nessie API
        response, status_code = nessie_request(
            "POST", 
            f"/accounts/{payer_id}/transfers", 
            body=transfer_data
        )
        
        if status_code == 201 or status_code == 200:
            return jsonify({
                "success": True,
                "transfer": response,
                "from": payer_id,
                "to": payee_id,
                "amount": amount
            }), 200
        else:
            return response, status_code
    
    except Exception as err:
        print(f"Error in transfer_money: {err}")
        return jsonify({"error": str(err)}), 500

@app.route('/api/pay-credit-card', methods=['POST'])
def pay_credit_card():
    """Pay off a credit card from a specified bank account"""
    try:
        post_data = request.json or {}
        
        # Extract details from args
        args = post_data.get("args", {})
        credit_card_id = args.get("credit_card_id")
        bank_account_id = args.get("bank_account_id")
        amount = args.get("amount")
        
        # Validate required fields
        if not credit_card_id:
            return jsonify({"error": "credit_card_id is required"}), 400
        if not bank_account_id:
            return jsonify({"error": "bank_account_id is required"}), 400
        if not amount or not isinstance(amount, (int, float)) or amount <= 0:
            return jsonify({"error": "A positive amount is required"}), 400
        
        # Step 1: Get the credit card account details
        cc_details, cc_status = nessie_request("GET", f"/accounts/{credit_card_id}")
        if cc_status != 200:
            return jsonify({
                "error": "Failed to retrieve credit card details",
                "status": cc_status
            }), 400
        
        # Extract needed details from the credit card account
        current_balance = cc_details.get("balance", 0)
        customer_id = cc_details.get("customer_id")
        nickname = cc_details.get("nickname", "Credit Card")
        rewards = cc_details.get("rewards", 0)
        account_type = "Credit Card"
        
        # Calculate new balance
        new_balance = int(max(0, current_balance - amount))
        
        # Step 2: Process withdrawal from bank account
        bank_withdrawal_data = {
            "medium": "balance",
            "amount": amount,
            "description": f"Payment toward credit card {credit_card_id}"
        }
        
        bank_response, bank_status = nessie_request(
            "POST", 
            f"/accounts/{bank_account_id}/withdrawals", 
            body=bank_withdrawal_data
        )
        
        if bank_status != 201 and bank_status != 200:
            return jsonify({
                "error": "Failed to process bank account withdrawal",
                "status": bank_status,
                "response": bank_response
            }), 400
        
        # Step 3: Delete the old credit card account
        delete_response, delete_status = nessie_request("DELETE", f"/accounts/{credit_card_id}")
        
        if delete_status != 200 and delete_status != 202 and delete_status != 204:
            return jsonify({
                "error": "Failed to delete old credit card account",
                "status": delete_status,
                "note": "Bank withdrawal was successful, but credit card update failed"
            }), 400
        
        # Step 4: Create a new credit card account with updated balance
        new_cc_data = {
            "type": account_type,
            "nickname": nickname,
            "rewards": rewards,
            "balance": new_balance
        }
        
        new_cc_response, new_cc_status = nessie_request(
            "POST", 
            f"/customers/{customer_id}/accounts", 
            body=new_cc_data
        )
        
        if new_cc_status != 201 and new_cc_status != 200:
            return jsonify({
                "error": "Failed to create new credit card account",
                "status": new_cc_status,
                "note": "Bank withdrawal and old card deletion were successful, but new card creation failed"
            }), 400
        
        # Extract the new credit card ID
        new_credit_card_id = new_cc_response.get("objectCreated", {}).get("_id")
        
        # Success response
        return jsonify({
            "success": True,
            "amount_paid": amount,
            "previous_balance": current_balance,
            "new_balance": new_balance,
            "old_credit_card_id": credit_card_id,
            "new_credit_card_id": new_credit_card_id,
            "bank_account_id": bank_account_id,
            "bank_transaction": bank_response,
            "fully_paid": new_balance == 0
        }), 200
    
    except Exception as err:
        print(f"Error in pay_credit_card: {err}")
        return jsonify({"error": str(err)}), 500

@app.route('/api/account-transactions', methods=['POST'])
def get_account_transactions():
    """Get the last N transactions (deposits and withdrawals) for an account"""
    try:
        post_data = request.json or {}
        
        # Extract account ID and number of transactions from args
        args = post_data.get("args", {})
        account_id = args.get("account_id")
        n = args.get("n", 10)  # Default to 10 transactions if not specified
        
        # Validate required fields
        if not account_id:
            return jsonify({"error": "account_id is required"}), 400
        
        # Convert n to integer if it's a string
        try:
            n = int(n)
        except (ValueError, TypeError):
            return jsonify({"error": "n must be a valid integer"}), 400
        
        # Get deposits
        deposits_response, deposits_status = nessie_request("GET", f"/accounts/{account_id}/deposits")
        
        # Get withdrawals
        withdrawals_response, withdrawals_status = nessie_request("GET", f"/accounts/{account_id}/withdrawals")
        
        # Handle potential errors
        if deposits_status != 200:
            return jsonify({"error": "Failed to fetch deposits", "status": deposits_status}), 400
        
        if withdrawals_status != 200:
            return jsonify({"error": "Failed to fetch withdrawals", "status": withdrawals_status}), 400
        
        # Combine deposits and withdrawals
        deposits = deposits_response if isinstance(deposits_response, list) else []
        withdrawals = withdrawals_response if isinstance(withdrawals_response, list) else []
        
        # Add transaction type to each transaction
        for deposit in deposits:
            deposit["transaction_type"] = "deposit"
        
        for withdrawal in withdrawals:
            withdrawal["transaction_type"] = "withdrawal"
        
        # Combine all transactions
        all_transactions = deposits + withdrawals
        
        # Sort by transaction date in descending order
        # Note: This assumes transactions have a 'transaction_date' field
        # Modify the sorting key if the field name is different
        all_transactions.sort(key=lambda x: x.get("transaction_date", ""), reverse=True)
        
        # Get only the last N transactions
        last_n_transactions = all_transactions[:n]
        
        return jsonify({
            "transactions": last_n_transactions,
            "count": len(last_n_transactions),
            "account_id": account_id
        }), 200
        
    except Exception as err:
        print(f"Error in get_account_transactions: {err}")
        return jsonify({"error": str(err)}), 500


# =============================================
# retell connector for aadesh
# =============================================

@app.route('/api/generate-token', methods=['POST'])
def generate_token():
    try:
        data = request.json
        agent_id = data.get('agent_id')
        
        if not agent_id:
            return jsonify({"error": "agent_id is required"}), 400
        
        # Use Retell SDK to create a web call
        web_call_response = retell_client.call.create_web_call(
            agent_id=agent_id,
        )
        
        # Convert the response to a dictionary
        response_dict = web_call_response.model_dump()
        
        return jsonify(response_dict)
            
    except Exception as e:
        print(f"Error generating token: {str(e)}")
        return jsonify({"error": str(e)}), 500



if __name__ == '__main__':
    app.run()
