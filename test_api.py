
import requests
import os

BASE_URL = "http://localhost:8001"

def test_api():
    # Debug: Check routes
    try:
        resp = requests.get(f"{BASE_URL}/openapi.json")
        if resp.status_code == 200:
            paths = resp.json().get("paths", {}).keys()
            print("Available paths:")
            for p in paths:
                print(p)
        else:
            print(f"Failed to get openapi.json: {resp.status_code}")
    except Exception as e:
        print(f"OpenAPI check error: {e}")

    # 1. Login
    login_data = {
        "email": "priya.official@assam.gov.in",
        "password": "gov123456"
    }
    print(f"Logging in as {login_data['email']}...")
    try:
        resp = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
        if resp.status_code != 200:
            print(f"Login failed: {resp.status_code} {resp.text}")
            return
        
        token = resp.json()["access_token"]
        print("Login successful. Token received.")
    except Exception as e:
        print(f"Login error: {e}")
        return

    # 2. Get Users
    headers = {"Authorization": f"Bearer {token}"}
    print("Fetching users...")
    try:
        resp = requests.get(f"{BASE_URL}/api/users/list", headers=headers)
        print(f"Status: {resp.status_code}")
        if resp.status_code == 200:
            users = resp.json()
            print(f"Users found: {len(users)}")
            print(users)
        else:
            print(f"Error: {resp.text}")
    except Exception as e:
        print(f"Fetch error: {e}")

if __name__ == "__main__":
    test_api()
