#!/usr/bin/env python3
"""
Invoice Status Update Test - Tests the specific invoice status editing functionality
"""

import requests
import sys
import json
from datetime import datetime

class InvoiceStatusTester:
    def __init__(self, base_url="https://source-puller-9.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.test_invoice_id = None
        
    def log(self, message: str, status: str = "INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {status}: {message}")

    def run_test(self, name: str, test_func) -> bool:
        self.tests_run += 1
        self.log(f"🔍 Testing: {name}")
        
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

    def make_request(self, method: str, endpoint: str, data: dict = None, expected_status: int = 200):
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

    def test_login(self) -> bool:
        """Test admin login"""
        credentials = {"email": "admin@naturalplylam.com", "password": "admin123"}
        success, response = self.make_request('POST', '/login', credentials, 200)
        if success and 'token' in response:
            self.token = response['token']
            self.log(f"Logged in as: {response.get('user', {}).get('name', 'Unknown')}")
            return True
        return False

    def test_get_invoices_for_status_testing(self) -> bool:
        """Get available invoices and select one for testing"""
        success, response = self.make_request('GET', '/admin?resource=invoices')
        if success and 'data' in response:
            invoices = response['data']
            self.log(f"Found {len(invoices)} invoices available for testing")
            
            if invoices:
                # Find a non-Cancelled invoice to test with
                for invoice in invoices:
                    if invoice.get('status') != 'Cancelled':
                        self.test_invoice_id = invoice['id']
                        self.log(f"Selected invoice {self.test_invoice_id} (current status: {invoice.get('status')})")
                        return True
                
                # If all are cancelled, use the first one anyway
                self.test_invoice_id = invoices[0]['id']
                self.log(f"Using invoice {self.test_invoice_id} for testing")
                return True
            else:
                self.log("No invoices found for testing")
                return True  # Not a failure - just no data
        return False

    def test_invoice_status_pending(self) -> bool:
        """Test updating invoice status to Pending"""
        if not self.test_invoice_id:
            return False
            
        update_data = {"status": "Pending"}
        success, response = self.make_request('PUT', f'/invoices/{self.test_invoice_id}', update_data, 200)
        if success and response.get('success'):
            updated_invoice = response.get('data', {})
            if updated_invoice.get('status') == 'Pending':
                self.log(f"✓ Invoice status updated to: Pending")
                return True
            else:
                self.log(f"✗ Status not updated correctly: {updated_invoice.get('status')}")
                return False
        return False

    def test_invoice_status_paid(self) -> bool:
        """Test updating invoice status to Paid"""
        if not self.test_invoice_id:
            return False
            
        update_data = {"status": "Paid"}
        success, response = self.make_request('PUT', f'/invoices/{self.test_invoice_id}', update_data, 200)
        if success and response.get('success'):
            updated_invoice = response.get('data', {})
            if updated_invoice.get('status') == 'Paid':
                self.log(f"✓ Invoice status updated to: Paid")
                return True
            else:
                self.log(f"✗ Status not updated correctly: {updated_invoice.get('status')}")
                return False
        return False

    def test_invoice_status_overdue(self) -> bool:
        """Test updating invoice status to Overdue"""
        if not self.test_invoice_id:
            return False
            
        update_data = {"status": "Overdue"}
        success, response = self.make_request('PUT', f'/invoices/{self.test_invoice_id}', update_data, 200)
        if success and response.get('success'):
            updated_invoice = response.get('data', {})
            if updated_invoice.get('status') == 'Overdue':
                self.log(f"✓ Invoice status updated to: Overdue")
                return True
            else:
                self.log(f"✗ Status not updated correctly: {updated_invoice.get('status')}")
                return False
        return False

    def test_invoice_status_partially_paid(self) -> bool:
        """Test updating invoice status to Partially Paid"""
        if not self.test_invoice_id:
            return False
            
        update_data = {"status": "Partially Paid"}
        success, response = self.make_request('PUT', f'/invoices/{self.test_invoice_id}', update_data, 200)
        if success and response.get('success'):
            updated_invoice = response.get('data', {})
            if updated_invoice.get('status') == 'Partially Paid':
                self.log(f"✓ Invoice status updated to: Partially Paid")
                return True
            else:
                self.log(f"✗ Status not updated correctly: {updated_invoice.get('status')}")
                return False
        return False

    def test_invoice_status_cancelled(self) -> bool:
        """Test updating invoice status to Cancelled"""
        if not self.test_invoice_id:
            return False
            
        update_data = {"status": "Cancelled"}
        success, response = self.make_request('PUT', f'/invoices/{self.test_invoice_id}', update_data, 200)
        if success and response.get('success'):
            updated_invoice = response.get('data', {})
            if updated_invoice.get('status') == 'Cancelled':
                self.log(f"✓ Invoice status updated to: Cancelled")
                return True
            else:
                self.log(f"✗ Status not updated correctly: {updated_invoice.get('status')}")
                return False
        return False

    def test_invalid_invoice_status(self) -> bool:
        """Test that invalid status values are rejected"""
        if not self.test_invoice_id:
            return False
            
        update_data = {"status": "Invalid_Status"}
        success, response = self.make_request('PUT', f'/invoices/{self.test_invoice_id}', update_data, 400)
        if success:  # Should fail with 400 status
            self.log("✓ Invalid status correctly rejected")
            return True
        else:
            self.log("✗ Invalid status was not rejected")
            return False

    def test_get_invoice_details(self) -> bool:
        """Test retrieving invoice details to verify status"""
        if not self.test_invoice_id:
            return False
            
        success, response = self.make_request('GET', f'/invoices?id={self.test_invoice_id}')
        if success:
            invoice = response.get('data', response)
            if invoice.get('id') == self.test_invoice_id:
                self.log(f"✓ Retrieved invoice details - Status: {invoice.get('status')}")
                return True
            else:
                self.log("✗ Could not retrieve invoice details")
                return False
        return False

    def run_all_tests(self):
        """Run all invoice status tests"""
        self.log("🚀 Starting Invoice Status Test Suite")
        self.log(f"Base URL: {self.base_url}")
        
        # Login first
        self.run_test("Admin Login", self.test_login)
        
        if not self.token:
            self.log("❌ Authentication failed - cannot proceed")
            return
        
        # Get test invoice
        self.run_test("Get Invoices for Testing", self.test_get_invoices_for_status_testing)
        
        if not self.test_invoice_id:
            self.log("❌ No invoice available for testing")
            return
        
        # Test all valid status values
        self.run_test("Update Status to Pending", self.test_invoice_status_pending)
        self.run_test("Update Status to Paid", self.test_invoice_status_paid)
        self.run_test("Update Status to Overdue", self.test_invoice_status_overdue)
        self.run_test("Update Status to Partially Paid", self.test_invoice_status_partially_paid)
        self.run_test("Update Status to Cancelled", self.test_invoice_status_cancelled)
        
        # Test invalid status rejection
        self.run_test("Reject Invalid Status", self.test_invalid_invoice_status)
        
        # Final verification
        self.run_test("Get Invoice Details", self.test_get_invoice_details)
        
        # Results
        self.print_results()

    def print_results(self):
        print("\n" + "="*50)
        print("📊 INVOICE STATUS TEST RESULTS")
        print("="*50)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {len(self.failed_tests)}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "0%")
        
        if self.failed_tests:
            print(f"\n❌ Failed Tests:")
            for test in self.failed_tests:
                print(f"  - {test}")
        
        print("="*50)


def main():
    tester = InvoiceStatusTester()
    tester.run_all_tests()
    return 0 if len(tester.failed_tests) == 0 else 1


if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)