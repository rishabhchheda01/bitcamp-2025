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

@app.route('/api/get-customers', methods=['POST'])
def get_nessie_customers():
    """
    Function to fetch customers from the Nessie API
    """
    # Print the data that the user sent in the request
    print("Request data:", request.get_json())
    
    url = "http://api.nessieisreal.com/customers"
    
    # API key as a query parameter
    params = {
        "key": "f1fbb5f9a7bfdc1597fafdf76476cfa7"
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
        return None

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
