#!/usr/bin/env python3
import requests
import json
import sys

def test_get_customers():
    """
    Test the /api/get-customers endpoint
    """
    print("Testing /api/get-customers endpoint...")
    
    # The URL for the API endpoint (assuming default Flask port)
    url = "http://127.0.0.1:5000/api/get-customers"
    
    try:
        # Make the POST request to the API endpoint
        response = requests.post(url)
        
        # Check if the request was successful
        if response.status_code == 200:
            # Parse the JSON response
            data = response.json()
            
            # Pretty print the JSON response
            print("\nSuccessful response (200):")
            print(json.dumps(data, indent=2))
            
            # Print the number of customers returned
            if isinstance(data, list):
                print(f"\nTotal customers returned: {len(data)}")
            
            return True
        else:
            print(f"\nError: HTTP {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("\nConnection Error: Failed to connect to the server.")
        print("Make sure the Flask server is running on http://localhost:5000")
        return False
    except Exception as e:
        print(f"\nUnexpected error: {str(e)}")
        return False

if __name__ == "__main__":
    print("API Test Script")
    print("==============")
    
    # Check if Flask server is likely running
    try:
        requests.get("http://localhost:5000", timeout=1)
    except requests.exceptions.ConnectionError:
        print("Warning: Flask server doesn't appear to be running.")
        print("Start the server by running 'python app.py' in another terminal.")
        response = input("Continue anyway? (y/n): ")
        if response.lower() != 'y':
            sys.exit(1)
    
    # Run tests
    test_get_customers()
    
    print("\nTests completed.")