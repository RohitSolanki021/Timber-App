#!/usr/bin/env python3
import requests
import json
import sys
from datetime import datetime

class NaturalPlylamAdminTester:
    def __init__(self):
        self.base_url = "https://7cc857b1-bccb-4094-be05-21237c0824fe.preview.emergentagent.com/api"
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

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
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers, timeout=10)
            else:
                return False, f"Unsupported method: {method}"
            
            return True, response
        except Exception as e:
            return False, str(e)

    def test_health_check(self):
        """Test if the backend is running"""
        success, response = self.make_request('GET', '/health', auth_required=False)
        if success and response.status_code == 200:
            data = response.json()
            self.log_test("Health Check", True, f"Status: {data.get('status', 'unknown')}")
            return True
        else:
            self.log_test("Health Check", False, f"Failed to connect or returned {response.status_code if success else 'connection error'}")
            return False

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
            if success:
                try:
                    error_detail = response.text
                    error_msg += f" - {error_detail}"
                except:
                    pass
            self.log_test("Admin Login", False, error_msg)
            return False

    def test_get_profile(self):
        """Test getting user profile"""
        success, response = self.make_request('GET', '/me')
        if success and response.status_code == 200:
            data = response.json()
            self.log_test("Get User Profile", True, f"User: {data.get('name', 'Unknown')}")
            return True
        else:
            self.log_test("Get User Profile", False, f"Status: {response.status_code if success else 'Connection error'}")
            return False

    def test_dashboard_kpis(self):
        """Test dashboard KPI data retrieval"""
        success, response = self.make_request('GET', '/admin?resource=dashboard')
        if success and response.status_code == 200:
            data = response.json()
            pending_orders = data.get('pending_orders_count', 0)
            new_orders = data.get('new_orders_week', 0)
            due_invoices = data.get('due_invoices_count', 0)
            self.log_test("Dashboard KPIs", True, f"Pending: {pending_orders}, New: {new_orders}, Due: {due_invoices}")
            return True
        else:
            self.log_test("Dashboard KPIs", False, f"Status: {response.status_code if success else 'Connection error'}")
            return False

    def test_get_customers(self):
        """Test customers listing and pagination"""
        success, response = self.make_request('GET', '/admin?resource=customers&page=1&per_page=10')
        if success and response.status_code == 200:
            data = response.json()
            customers = data.get('data', [])
            pagination = data.get('pagination', {})
            self.log_test("Get Customers", True, f"Count: {len(customers)}, Total: {pagination.get('total', 'Unknown')}")
            return True, customers
        else:
            self.log_test("Get Customers", False, f"Status: {response.status_code if success else 'Connection error'}")
            return False, []

    def test_customer_approval(self, customers):
        """Test customer approval workflow"""
        # Find a customer that needs approval
        pending_customer = None
        for customer in customers:
            if customer.get('approval_status', '').lower() == 'pending':
                pending_customer = customer
                break
        
        if not pending_customer:
            self.log_test("Customer Approval", True, "No pending customers to approve")
            return True
        
        # Test approval
        approval_data = {"customer_id": pending_customer.get('id')}
        success, response = self.make_request('POST', '/admin?action=approve_customer', approval_data)
        if success and response.status_code == 200:
            self.log_test("Customer Approval", True, f"Approved customer {pending_customer.get('id')}")
            return True
        else:
            self.log_test("Customer Approval", False, f"Status: {response.status_code if success else 'Connection error'}")
            return False

    def test_get_orders(self):
        """Test orders listing"""
        success, response = self.make_request('GET', '/admin?resource=orders&page=1&per_page=10')
        if success and response.status_code == 200:
            data = response.json()
            orders = data.get('data', [])
            pagination = data.get('pagination', {})
            self.log_test("Get Orders", True, f"Count: {len(orders)}, Total: {pagination.get('total', 'Unknown')}")
            return True, orders
        else:
            self.log_test("Get Orders", False, f"Status: {response.status_code if success else 'Connection error'}")
            return False, []

    def test_order_detail(self, orders):
        """Test individual order retrieval"""
        if not orders:
            self.log_test("Order Detail", True, "No orders to test")
            return True
        
        order_id = orders[0].get('id')
        success, response = self.make_request('GET', f'/orders?id={order_id}')
        if success and response.status_code == 200:
            data = response.json()
            self.log_test("Order Detail", True, f"Order {order_id} retrieved")
            return True
        else:
            self.log_test("Order Detail", False, f"Status: {response.status_code if success else 'Connection error'}")
            return False

    def test_update_order_status(self, orders):
        """Test order status update"""
        if not orders:
            self.log_test("Update Order Status", True, "No orders to test")
            return True
        
        order = orders[0]
        order_id = order.get('id')
        current_status = order.get('status', '')
        
        # Try to update to a different status
        new_status = "Approved" if current_status.lower() != "approved" else "Created"
        
        update_data = {"order_id": order_id, "status": new_status}
        success, response = self.make_request('POST', '/admin?action=update_order_status', update_data)
        if success and response.status_code == 200:
            self.log_test("Update Order Status", True, f"Order {order_id} status updated to {new_status}")
            return True
        else:
            self.log_test("Update Order Status", False, f"Status: {response.status_code if success else 'Connection error'}")
            return False

    def test_get_invoices(self):
        """Test invoices listing"""
        success, response = self.make_request('GET', '/admin?resource=invoices&page=1&per_page=10')
        if success and response.status_code == 200:
            data = response.json()
            invoices = data.get('data', [])
            pagination = data.get('pagination', {})
            self.log_test("Get Invoices", True, f"Count: {len(invoices)}, Total: {pagination.get('total', 'Unknown')}")
            return True, invoices
        else:
            self.log_test("Get Invoices", False, f"Status: {response.status_code if success else 'Connection error'}")
            return False, []

    def test_invoice_detail(self, invoices):
        """Test individual invoice retrieval"""
        if not invoices:
            self.log_test("Invoice Detail", True, "No invoices to test")
            return True
        
        invoice_id = invoices[0].get('id')
        success, response = self.make_request('GET', f'/invoices?id={invoice_id}')
        if success and response.status_code == 200:
            data = response.json()
            self.log_test("Invoice Detail", True, f"Invoice {invoice_id} retrieved")
            return True
        else:
            self.log_test("Invoice Detail", False, f"Status: {response.status_code if success else 'Connection error'}")
            return False

    def test_mark_invoice_paid(self, invoices):
        """Test marking invoice as paid"""
        # Find an unpaid invoice
        unpaid_invoice = None
        for invoice in invoices:
            if invoice.get('status', '').lower() != 'paid':
                unpaid_invoice = invoice
                break
        
        if not unpaid_invoice:
            self.log_test("Mark Invoice Paid", True, "No unpaid invoices to test")
            return True
        
        invoice_id = unpaid_invoice.get('id')
        payment_data = {"invoice_id": invoice_id}
        success, response = self.make_request('POST', '/admin?action=mark_invoice_paid', payment_data)
        if success and response.status_code == 200:
            self.log_test("Mark Invoice Paid", True, f"Invoice {invoice_id} marked as paid")
            return True
        else:
            self.log_test("Mark Invoice Paid", False, f"Status: {response.status_code if success else 'Connection error'}")
            return False

    def test_get_products(self):
        """Test products listing"""
        success, response = self.make_request('GET', '/products')
        if success and response.status_code == 200:
            data = response.json()
            products = data.get('data', data.get('products', []))
            self.log_test("Get Products", True, f"Count: {len(products)}")
            return True
        else:
            self.log_test("Get Products", False, f"Status: {response.status_code if success else 'Connection error'}")
            return False

    def test_logout(self):
        """Test logout"""
        success, response = self.make_request('POST', '/logout')
        if success and response.status_code == 200:
            self.log_test("Logout", True, "Successfully logged out")
            return True
        else:
            self.log_test("Logout", False, f"Status: {response.status_code if success else 'Connection error'}")
            return False

    def run_all_tests(self):
        print(f"\n🔥 Starting Natural Plylam Admin Panel Backend Tests")
        print(f"Backend URL: {self.base_url}")
        print("=" * 60)
        
        # Health check first
        if not self.test_health_check():
            print("❌ Backend is not accessible. Stopping tests.")
            return self.generate_report()
        
        # Authentication
        if not self.test_admin_login():
            print("❌ Login failed. Cannot continue with authenticated tests.")
            return self.generate_report()
        
        # Basic profile test
        self.test_get_profile()
        
        # Dashboard and KPIs
        self.test_dashboard_kpis()
        
        # Customer management
        success, customers = self.test_get_customers()
        if success:
            self.test_customer_approval(customers)
        
        # Order management
        success, orders = self.test_get_orders()
        if success:
            self.test_order_detail(orders)
            self.test_update_order_status(orders)
        
        # Invoice management
        success, invoices = self.test_get_invoices()
        if success:
            self.test_invoice_detail(invoices)
            self.test_mark_invoice_paid(invoices)
        
        # Products
        self.test_get_products()
        
        # Logout
        self.test_logout()
        
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
    tester = NaturalPlylamAdminTester()
    report = tester.run_all_tests()
    
    # Exit with non-zero code if tests failed
    if report["tests_passed"] != report["tests_run"]:
        sys.exit(1)
    else:
        sys.exit(0)