#!/usr/bin/env python3
import requests
import json
import sys
from datetime import datetime

class CustomerCRUDTester:
    def __init__(self):
        self.base_url = "https://7cc857b1-bccb-4094-be05-21237c0824fe.preview.emergentagent.com/api"
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.created_customer_id = None

    def log_test(self, name, success, details=""):
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            self.failed_tests.append({"name": name, "details": details})
            print(f"❌ {name} - {details}")

    def make_request(self, method, endpoint, data=None, auth_required=True):
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        headers = {'Content-Type': 'application/json'}
        
        if auth_required and self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)
            else:
                return False, f"Unsupported method: {method}"
            
            return True, response
        except Exception as e:
            return False, str(e)

    def test_admin_login(self):
        """Test admin login with provided credentials"""
        login_data = {
            "email": "admin@naturalplylam.com",
            "password": "admin123"
        }
        
        success, response = self.make_request('POST', '/login', login_data, auth_required=False)
        if success and response.status_code == 200:
            data = response.json()
            if 'token' in data:
                self.token = data['token']
                user_info = data.get('user', {})
                self.log_test("Admin Login", True, f"Role: {user_info.get('role', 'Unknown')}")
                return True
            else:
                self.log_test("Admin Login", False, "No token in response")
                return False
        else:
            error_msg = f"Status: {response.status_code}" if success else "Connection error"
            self.log_test("Admin Login", False, error_msg)
            return False

    def test_create_customer(self):
        """Test creating a new customer"""
        customer_data = {
            "name": "Test Company Ltd",
            "contactPerson": "John Test",
            "email": f"test_customer_{datetime.now().strftime('%H%M%S')}@example.com",
            "phone": "9876543999",
            "gst_number": "27AABCT9999R1ZM",
            "address": "Test Address",
            "city": "Test City",
            "state": "Test State",
            "pincode": "123456",
            "pricing_type": 2,
            "credit_limit": 50000,
            "notes": "Test customer for CRUD operations",
            "approval_status": "Approved",
            "is_active": True
        }
        
        success, response = self.make_request('POST', '/customers', customer_data)
        if success and response.status_code == 200:
            data = response.json()
            if data.get('success') and 'data' in data:
                customer = data['data']
                self.created_customer_id = customer.get('id')
                self.log_test("Create Customer", True, f"Created customer ID: {self.created_customer_id}")
                return True
            else:
                self.log_test("Create Customer", False, "Success not true or no data in response")
                return False
        else:
            error_msg = f"Status: {response.status_code}" if success else "Connection error"
            if success:
                try:
                    error_detail = response.text
                    error_msg += f" - {error_detail}"
                except:
                    pass
            self.log_test("Create Customer", False, error_msg)
            return False

    def test_get_customer_detail(self):
        """Test getting customer detail by ID"""
        if not self.created_customer_id:
            self.log_test("Get Customer Detail", False, "No customer ID to test with")
            return False
        
        success, response = self.make_request('GET', f'/customers/{self.created_customer_id}')
        if success and response.status_code == 200:
            data = response.json()
            if 'data' in data:
                customer = data['data']
                self.log_test("Get Customer Detail", True, f"Retrieved customer: {customer.get('name', 'Unknown')}")
                return True
            else:
                self.log_test("Get Customer Detail", False, "No data field in response")
                return False
        else:
            error_msg = f"Status: {response.status_code}" if success else "Connection error"
            self.log_test("Get Customer Detail", False, error_msg)
            return False

    def test_update_customer(self):
        """Test updating customer details"""
        if not self.created_customer_id:
            self.log_test("Update Customer", False, "No customer ID to test with")
            return False
        
        update_data = {
            "name": "Updated Test Company Ltd",
            "notes": "Updated notes for testing",
            "credit_limit": 75000,
            "is_active": True
        }
        
        success, response = self.make_request('PUT', f'/customers/{self.created_customer_id}', update_data)
        if success and response.status_code == 200:
            data = response.json()
            if data.get('success'):
                self.log_test("Update Customer", True, f"Updated customer ID: {self.created_customer_id}")
                return True
            else:
                self.log_test("Update Customer", False, "Success not true in response")
                return False
        else:
            error_msg = f"Status: {response.status_code}" if success else "Connection error"
            self.log_test("Update Customer", False, error_msg)
            return False

    def test_customer_approval_actions(self):
        """Test customer approval/rejection actions"""
        if not self.created_customer_id:
            self.log_test("Customer Approval Actions", False, "No customer ID to test with")
            return False
        
        # Test approve action (should be idempotent since customer is already approved)
        approval_data = {"customer_id": self.created_customer_id}
        success, response = self.make_request('POST', '/admin?action=approve_customer', approval_data)
        if success and response.status_code == 200:
            self.log_test("Customer Approval Action", True, f"Approval action for customer {self.created_customer_id}")
            return True
        else:
            error_msg = f"Status: {response.status_code}" if success else "Connection error"
            self.log_test("Customer Approval Action", False, error_msg)
            return False

    def test_toggle_customer_status(self):
        """Test toggling customer active status"""
        if not self.created_customer_id:
            self.log_test("Toggle Customer Status", False, "No customer ID to test with")
            return False
        
        # Test deactivate
        toggle_data = {"customer_id": self.created_customer_id, "is_active": False}
        success, response = self.make_request('POST', '/admin?action=toggle_customer_status', toggle_data)
        if success and response.status_code == 200:
            # Test reactivate
            toggle_data = {"customer_id": self.created_customer_id, "is_active": True}
            success, response = self.make_request('POST', '/admin?action=toggle_customer_status', toggle_data)
            if success and response.status_code == 200:
                self.log_test("Toggle Customer Status", True, f"Toggled status for customer {self.created_customer_id}")
                return True
        
        error_msg = f"Status: {response.status_code}" if success else "Connection error"
        self.log_test("Toggle Customer Status", False, error_msg)
        return False

    def test_customer_search_filter(self):
        """Test customer search and filtering"""
        # Test search
        success, response = self.make_request('GET', '/admin?resource=customers&search=Test&page=1&per_page=10')
        if success and response.status_code == 200:
            data = response.json()
            customers = data.get('data', [])
            self.log_test("Customer Search", True, f"Found {len(customers)} customers matching 'Test'")
        else:
            self.log_test("Customer Search", False, f"Status: {response.status_code if success else 'Connection error'}")
            return False
        
        # Test status filter
        success, response = self.make_request('GET', '/admin?resource=customers&status=active&page=1&per_page=10')
        if success and response.status_code == 200:
            data = response.json()
            customers = data.get('data', [])
            self.log_test("Customer Status Filter", True, f"Found {len(customers)} active customers")
            return True
        else:
            self.log_test("Customer Status Filter", False, f"Status: {response.status_code if success else 'Connection error'}")
            return False

    def test_customer_pagination_sort(self):
        """Test customer pagination and sorting"""
        # Test pagination
        success, response = self.make_request('GET', '/admin?resource=customers&page=1&per_page=5')
        if success and response.status_code == 200:
            data = response.json()
            customers = data.get('data', [])
            pagination = data.get('pagination', {})
            self.log_test("Customer Pagination", True, f"Page 1: {len(customers)} customers, Total: {pagination.get('total', 'Unknown')}")
        else:
            self.log_test("Customer Pagination", False, f"Status: {response.status_code if success else 'Connection error'}")
            return False
        
        # Test sorting
        success, response = self.make_request('GET', '/admin?resource=customers&sort_by=name&sort_order=asc&page=1&per_page=5')
        if success and response.status_code == 200:
            data = response.json()
            customers = data.get('data', [])
            self.log_test("Customer Sorting", True, f"Sorted by name: {len(customers)} customers")
            return True
        else:
            self.log_test("Customer Sorting", False, f"Status: {response.status_code if success else 'Connection error'}")
            return False

    def test_delete_customer_archive(self):
        """Test customer soft delete (archive)"""
        if not self.created_customer_id:
            self.log_test("Delete Customer (Archive)", False, "No customer ID to test with")
            return False
        
        success, response = self.make_request('DELETE', f'/customers/{self.created_customer_id}?hard_delete=false')
        if success and response.status_code == 200:
            data = response.json()
            if data.get('success'):
                self.log_test("Delete Customer (Archive)", True, f"Archived customer ID: {self.created_customer_id}")
                return True
            else:
                self.log_test("Delete Customer (Archive)", False, "Success not true in response")
                return False
        else:
            error_msg = f"Status: {response.status_code}" if success else "Connection error"
            self.log_test("Delete Customer (Archive)", False, error_msg)
            return False

    def run_all_tests(self):
        print(f"\n🔥 Starting Customer CRUD Tests")
        print(f"Backend URL: {self.base_url}")
        print("=" * 60)
        
        # Login first
        if not self.test_admin_login():
            print("❌ Login failed. Cannot continue with tests.")
            return self.generate_report()
        
        # CRUD operations
        if not self.test_create_customer():
            print("❌ Customer creation failed. Stopping CRUD tests.")
            return self.generate_report()
        
        self.test_get_customer_detail()
        self.test_update_customer()
        
        # Admin actions
        self.test_customer_approval_actions()
        self.test_toggle_customer_status()
        
        # Search and filter
        self.test_customer_search_filter()
        self.test_customer_pagination_sort()
        
        # Archive (soft delete)
        self.test_delete_customer_archive()
        
        return self.generate_report()

    def generate_report(self):
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for test in self.failed_tests:
                print(f"  - {test['name']}: {test['details']}")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"\n✅ Success Rate: {success_rate:.1f}%")
        
        return {
            "tests_run": self.tests_run,
            "tests_passed": self.tests_passed,
            "success_rate": success_rate,
            "failed_tests": self.failed_tests
        }

if __name__ == "__main__":
    tester = CustomerCRUDTester()
    report = tester.run_all_tests()
    
    # Exit with non-zero code if tests failed
    if report["tests_passed"] != report["tests_run"]:
        sys.exit(1)
    else:
        sys.exit(0)