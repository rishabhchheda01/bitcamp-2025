import requests
import json
from pprint import pprint
from flask import Flask, jsonify, request
from flask_cors import CORS
import os
from retell import Retell

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Retell API key - in production, store this in environment variables
RETELL_API_KEY = "key_c658f6ca7a8848afb60a7895641f"

# Initialize the Retell client
retell_client = Retell(api_key=RETELL_API_KEY)

def get_nessie_customers():
    """
    Function to fetch customers from the Nessie API
    """
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

@app.route('/')
def index():
    return "Server is running. Use /api/generate-token to create a Retell access token."

if __name__ == "__main__":
    print("Starting Flask server...")
    app.run(debug=True, port=5000)