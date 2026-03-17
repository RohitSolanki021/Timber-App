#!/usr/bin/env python3
"""
Backend API Test Suite for Natural Plylam Admin Panel
Tests Product CRUD and Invoice Status Update functionality
"""

import requests
import sys
import json
from datetime import datetime
from typing import Dict, List, Any, Optional

class AdminPanelAPITester:
    def __init__(self, base_url="https://7cc857b1-bccb-4094-be05-21237c0824fe.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.created_products = []  # Track created products for cleanup
        self.admin_credentials = {
            "email": "admin@naturalplylam.com", 
            "password": "admin123"
        }

    def log(self, message: str, status: str = "INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {status}: {message}")

    def run_test(self, name: str, test_func) -> bool:
        """Run a single test and track results"""
        self.tests_run += 1
        self.log(f"🔍 Running: {name}")
        
        try:
            success = test_func()
            if success:
                self.tests_passed += 1
                self.log(f"✅ PASSED: {name}", "PASS")
                return True
            else:
                self.failed_tests.append(name)
                self.log(f"❌ FAILED: {name}", "FAIL")
                return False
        except Exception as e:
            self.failed_tests.append(name)
            self.log(f"❌ ERROR in {name}: {str(e)}", "ERROR")
            return False

    def make_request(self, method: str, endpoint: str, data: Dict = None, expected_status: int = 200) -> tuple[bool, Dict]:
        """Make HTTP request with auth headers"""
        url = f"{self.base_url}{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")

            success = response.status_code == expected_status
            response_data = {}
            
            try:
                response_data = response.json()
            except:
                response_data = {"text": response.text}

            if not success:
                self.log(f"HTTP {response.status_code} (expected {expected_status}): {response.text[:200]}")

            return success, response_data

        except requests.RequestException as e:
            self.log(f"Request failed: {str(e)}")
            return False, {}

    def test_admin_login(self) -> bool:
        """Test admin login functionality"""
        success, response = self.make_request(
            'POST', '/login', self.admin_credentials, 200
        )
        if success and 'token' in response:
            self.token = response['token']
            self.log(f"Admin login successful, user: {response.get('user', {}).get('name', 'Unknown')}")
            return True
        return False

    def test_get_products(self) -> bool:
        """Test retrieving products list"""
        success, response = self.make_request('GET', '/products')
        if success and ('data' in response or 'products' in response):
            products = response.get('data', response.get('products', []))
            self.log(f"Retrieved {len(products)} products")
            return len(products) >= 0  # Accept empty list
        return False

    def test_search_products(self) -> bool:
        """Test product search functionality"""
        success, response = self.make_request('GET', '/products?search=birch')
        if success:
            products = response.get('data', response.get('products', []))
            self.log(f"Search 'birch' returned {len(products)} products")
            # Verify search works - should find products containing 'birch'
            for product in products:
                if 'birch' in product.get('name', '').lower():
                    return True
            return len(products) == 0  # Accept no matches for search
        return False

    def test_filter_products_by_category(self) -> bool:
        """Test product category filtering"""
        success, response = self.make_request('GET', '/products?category=Plywood')
        if success:
            products = response.get('data', response.get('products', []))
            self.log(f"Category filter 'Plywood' returned {len(products)} products")
            # All products should be Plywood category
            for product in products:
                if product.get('category') != 'Plywood':
                    self.log(f"Found non-Plywood product: {product.get('name')}")
                    return False
            return True
        return False

    def test_create_product(self) -> bool:
        """Test creating a new product"""
        test_product = {
            "name": f"Test Product {datetime.now().strftime('%H%M%S')}",
            "category": "Plywood",
            "price": 99.99,
            "priceUnit": "ea",
            "stock_status": "in_stock", 
            "stock_quantity": 50,
            "description": "Test product for API testing",
            "primary_image": "https://example.com/test.jpg"
        }
        
        success, response = self.make_request('POST', '/products', test_product, 200)
        if success and response.get('success'):
            created_product = response.get('data', {})
            product_id = created_product.get('id')
            if product_id:
                self.created_products.append(product_id)
                self.log(f"Created product: {product_id}")
                return True
        return False

    def test_get_single_product(self) -> bool:
        """Test retrieving a single product"""
        # Use the first created product or fallback to existing one
        product_id = self.created_products[0] if self.created_products else "PLY-001"
        
        success, response = self.make_request('GET', f'/products/{product_id}')
        if success and response.get('data'):
            product = response['data']
            self.log(f"Retrieved product: {product.get('name', 'Unknown')}")
            return product.get('id') == product_id
        return False

    def test_update_product(self) -> bool:
        """Test updating an existing product"""
        product_id = self.created_products[0] if self.created_products else "PLY-001"
        
        update_data = {
            "name": f"Updated Test Product {datetime.now().strftime('%H%M%S')}",
            "price": 149.99,
            "description": "Updated description for testing"
        }
        
        success, response = self.make_request('PUT', f'/products/{product_id}', update_data, 200)
        if success and response.get('success'):
            updated_product = response.get('data', {})
            self.log(f"Updated product: {updated_product.get('name')}")
            return updated_product.get('price') == 149.99
        return False

    def test_get_invoices(self) -> bool:
        """Test retrieving invoices list"""
        success, response = self.make_request('GET', '/admin?resource=invoices')
        if success and 'data' in response:
            invoices = response['data']
            self.log(f"Retrieved {len(invoices)} invoices")
            return len(invoices) >= 0
        return False

    def test_get_single_invoice(self) -> bool:
        """Test retrieving a single invoice"""
        # Get invoices list first to get a valid invoice ID
        success, response = self.make_request('GET', '/admin?resource=invoices')
        if not success or not response.get('data'):
            return False
            
        invoices = response['data']
        if not invoices:
            self.log("No invoices found to test with")
            return True  # No invoices is acceptable
        
        invoice_id = invoices[0]['id']
        success, response = self.make_request('GET', f'/invoices?id={invoice_id}')
        if success:
            invoice = response.get('data', response)
            self.log(f"Retrieved invoice: {invoice.get('id')} - Status: {invoice.get('status')}")
            return invoice.get('id') == invoice_id
        return False

    def test_update_invoice_status(self) -> bool:
        """Test updating invoice status"""
        # Get invoices list first to get a valid invoice ID
        success, response = self.make_request('GET', '/admin?resource=invoices')
        if not success or not response.get('data'):
            return False
            
        invoices = response['data']
        if not invoices:
            self.log("No invoices found to test status update")
            return True  # No invoices is acceptable
        
        # Find a non-Paid invoice to test status change
        test_invoice = None
        for invoice in invoices:
            if invoice.get('status') != 'Paid':
                test_invoice = invoice
                break
        
        if not test_invoice:
            self.log("All invoices are already Paid, creating test scenario...")
            # Try to update first invoice to Pending then to Paid
            test_invoice = invoices[0]
        
        invoice_id = test_invoice['id']
        original_status = test_invoice.get('status')
        new_status = 'Paid' if original_status != 'Paid' else 'Pending'
        
        update_data = {"status": new_status}
        success, response = self.make_request('PUT', f'/invoices/{invoice_id}', update_data, 200)
        if success and response.get('success'):
            updated_invoice = response.get('data', {})
            self.log(f"Invoice {invoice_id} status: {original_status} → {updated_invoice.get('status')}")
            return updated_invoice.get('status') == new_status
        return False

    def test_invoice_status_values(self) -> bool:
        """Test all valid invoice status values"""
        # Get an invoice to test with
        success, response = self.make_request('GET', '/admin?resource=invoices')
        if not success or not response.get('data'):
            return False
            
        invoices = response['data']
        if not invoices:
            return True  # No invoices is acceptable
        
        invoice_id = invoices[0]['id']
        valid_statuses = ['Pending', 'Paid', 'Overdue', 'Cancelled', 'Partially Paid']
        
        for status in valid_statuses:
            update_data = {"status": status}
            success, response = self.make_request('PUT', f'/invoices/{invoice_id}', update_data, 200)
            if not success:
                self.log(f"Failed to set status to {status}")
                return False
            
            updated_invoice = response.get('data', {})
            if updated_invoice.get('status') != status:
                self.log(f"Status not updated correctly: expected {status}, got {updated_invoice.get('status')}")
                return False
        
        self.log("All invoice status values work correctly")
        return True

    def test_delete_product(self) -> bool:
        """Test deleting a product (only created test products)"""
        if not self.created_products:
            self.log("No test products to delete")
            return True
        
        product_id = self.created_products.pop()  # Remove and get last created product
        success, response = self.make_request('DELETE', f'/products/{product_id}', expected_status=200)
        if success and response.get('success'):
            self.log(f"Deleted product: {product_id}")
            return True
        return False

    def cleanup_test_products(self):
        """Clean up any remaining test products"""
        for product_id in self.created_products:
            try:
                success, _ = self.make_request('DELETE', f'/products/{product_id}')
                if success:
                    self.log(f"Cleaned up product: {product_id}")
            except:
                pass  # Ignore cleanup errors

    def run_all_tests(self):
        """Run the complete test suite"""
        self.log("🚀 Starting Backend API Test Suite")
        self.log(f"Base URL: {self.base_url}")
        
        # Authentication Tests
        self.run_test("Admin Login", self.test_admin_login)
        
        if not self.token:
            self.log("❌ Authentication failed - cannot proceed with other tests")
            return
        
        # Products CRUD Tests
        self.run_test("Get Products List", self.test_get_products)
        self.run_test("Search Products", self.test_search_products)
        self.run_test("Filter Products by Category", self.test_filter_products_by_category)
        self.run_test("Create Product", self.test_create_product)
        self.run_test("Get Single Product", self.test_get_single_product)
        self.run_test("Update Product", self.test_update_product)
        
        # Invoice Status Update Tests
        self.run_test("Get Invoices List", self.test_get_invoices)
        self.run_test("Get Single Invoice", self.test_get_single_invoice)
        self.run_test("Update Invoice Status", self.test_update_invoice_status)
        self.run_test("Test All Invoice Status Values", self.test_invoice_status_values)
        
        # Cleanup Tests (delete test products)
        self.run_test("Delete Test Product", self.test_delete_product)
        
        # Final cleanup
        self.cleanup_test_products()
        
        # Print Results
        self.print_results()

    def print_results(self):
        """Print test summary"""
        print("\n" + "="*60)
        print(f"📊 TEST RESULTS SUMMARY")
        print("="*60)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {len(self.failed_tests)}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "0%")
        
        if self.failed_tests:
            print(f"\n❌ Failed Tests:")
            for test in self.failed_tests:
                print(f"  - {test}")
        
        print(f"\n🏁 Test suite completed at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("="*60)


def main():
    """Run the test suite"""
    tester = AdminPanelAPITester()
    tester.run_all_tests()
    
    # Return exit code based on test results
    return 0 if len(tester.failed_tests) == 0 else 1


if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)