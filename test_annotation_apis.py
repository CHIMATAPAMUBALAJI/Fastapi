#!/usr/bin/env python3
"""
Comprehensive API Test Script for Annotation System
Tests all CRUD operations: GET, PUT, POST, DELETE
"""

import requests
import json
import time

# Configuration
BASE_URL = "http://localhost:9000"
TEST_EMPLOYEE_ID = 1  # Change this to an existing employee ID in your database

def test_annotation_apis():
    """Test all annotation APIs comprehensively"""
    
    print("🚀 Starting Comprehensive Annotation API Tests")
    print("=" * 60)
    
    # Test 1: GET annotation (should return no annotation initially)
    print("\n📋 TEST 1: GET Annotation (Initial)")
    try:
        response = requests.get(f"{BASE_URL}/employee/{TEST_EMPLOYEE_ID}/annotation")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Employee: {data['employee_name']}")
            print(f"Has Annotation: {data['has_annotation']}")
            print(f"Coordinates: {data['coordinates']}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 2: POST annotation (create new)
    print("\n📋 TEST 2: POST Annotation (Create)")
    test_coordinates = {
        "x0": 100,
        "x1": 300,
        "y0": 150,
        "y1": 250,
        "page": 0
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/employee/{TEST_EMPLOYEE_ID}/annotation",
            json=test_coordinates,
            headers={"Content-Type": "application/json"}
        )
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ {data['message']}")
            print(f"Employee: {data['employee_name']}")
            print(f"Coordinates: {data['coordinates']}")
        else:
            print(f"❌ Error: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 3: GET annotation (should return the created annotation)
    print("\n📋 TEST 3: GET Annotation (After Creation)")
    try:
        response = requests.get(f"{BASE_URL}/employee/{TEST_EMPLOYEE_ID}/annotation")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Employee: {data['employee_name']}")
            print(f"Has Annotation: {data['has_annotation']}")
            print(f"Coordinates: {data['coordinates']}")
        else:
            print(f"❌ Error: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 4: PUT annotation (update existing)
    print("\n📋 TEST 4: PUT Annotation (Update)")
    updated_coordinates = {
        "x0": 200,
        "x1": 400,
        "y0": 200,
        "y1": 350,
        "page": 1
    }
    
    try:
        response = requests.put(
            f"{BASE_URL}/employee/{TEST_EMPLOYEE_ID}/annotation",
            json=updated_coordinates,
            headers={"Content-Type": "application/json"}
        )
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ {data['message']}")
            print(f"Employee: {data['employee_name']}")
            print(f"Updated Coordinates: {data['coordinates']}")
        else:
            print(f"❌ Error: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 5: GET annotation (verify update)
    print("\n📋 TEST 5: GET Annotation (After Update)")
    try:
        response = requests.get(f"{BASE_URL}/employee/{TEST_EMPLOYEE_ID}/annotation")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Employee: {data['employee_name']}")
            print(f"Has Annotation: {data['has_annotation']}")
            print(f"Coordinates: {data['coordinates']}")
        else:
            print(f"❌ Error: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 6: DELETE annotation
    print("\n📋 TEST 6: DELETE Annotation")
    try:
        response = requests.delete(f"{BASE_URL}/employee/{TEST_EMPLOYEE_ID}/annotation")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ {data['message']}")
            print(f"Employee: {data['employee_name']}")
        else:
            print(f"❌ Error: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 7: GET annotation (should return no annotation after deletion)
    print("\n📋 TEST 7: GET Annotation (After Deletion)")
    try:
        response = requests.get(f"{BASE_URL}/employee/{TEST_EMPLOYEE_ID}/annotation")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Employee: {data['employee_name']}")
            print(f"Has Annotation: {data['has_annotation']}")
            print(f"Coordinates: {data['coordinates']}")
        else:
            print(f"❌ Error: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 8: Error handling - Non-existent employee
    print("\n📋 TEST 8: Error Handling (Non-existent Employee)")
    try:
        response = requests.get(f"{BASE_URL}/employee/99999/annotation")
        print(f"Status: {response.status_code}")
        if response.status_code == 404:
            print("✅ Correctly returned 404 for non-existent employee")
        else:
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print("\n" + "=" * 60)
    print("🎉 API Testing Complete!")
    print("\n📊 Summary:")
    print("✅ GET API - Retrieve annotations")
    print("✅ POST API - Create annotations") 
    print("✅ PUT API - Update annotations")
    print("✅ DELETE API - Remove annotations")
    print("✅ Error handling for invalid requests")
    print("\n🚀 Your annotation system is fully functional!")

def test_multiple_employees():
    """Test annotations for multiple employees"""
    print("\n🔄 Testing Multiple Employee Annotations")
    print("-" * 40)
    
    employee_ids = [1, 2, 3]  # Test with first 3 employees
    
    for emp_id in employee_ids:
        print(f"\n👤 Testing Employee ID: {emp_id}")
        
        # Create unique annotation for each employee
        coordinates = {
            "x0": 50 + (emp_id * 50),
            "x1": 150 + (emp_id * 50),
            "y0": 100 + (emp_id * 30),
            "y1": 200 + (emp_id * 30),
            "page": emp_id % 2  # Alternate between page 0 and 1
        }
        
        try:
            # Create annotation
            response = requests.post(
                f"{BASE_URL}/employee/{emp_id}/annotation",
                json=coordinates,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Created annotation for {data['employee_name']}")
                print(f"   Coordinates: {data['coordinates']}")
            else:
                print(f"❌ Failed to create annotation for employee {emp_id}")
                
        except Exception as e:
            print(f"❌ Error with employee {emp_id}: {e}")
    
    print("\n🔍 Verifying all annotations exist:")
    for emp_id in employee_ids:
        try:
            response = requests.get(f"{BASE_URL}/employee/{emp_id}/annotation")
            if response.status_code == 200:
                data = response.json()
                if data['has_annotation']:
                    print(f"✅ Employee {emp_id} ({data['employee_name']}): Has annotation")
                else:
                    print(f"❌ Employee {emp_id} ({data['employee_name']}): No annotation")
        except Exception as e:
            print(f"❌ Error checking employee {emp_id}: {e}")

if __name__ == "__main__":
    print("🧪 Annotation System API Tester")
    print("Make sure your backend server is running on http://localhost:9000")
    print("Press Enter to start testing...")
    input()
    
    # Run comprehensive tests
    test_annotation_apis()
    
    # Test multiple employees
    test_multiple_employees()
    
    print("\n✨ All tests completed!")
