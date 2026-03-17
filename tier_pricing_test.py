#!/usr/bin/env python3
"""
Manual Tier Pricing Test - Tests the specific tier pricing functionality
"""

import requests
import sys
import json
from datetime import datetime

class TierPricingTester:
    def __init__(self, base_url="https://7cc857b1-bccb-4094-be05-21237c0824fe.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.created_product_id = None
        
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

    def test_create_product_with_custom_tier_pricing(self) -> bool:
        """Test creating product with custom tier pricing"""
        test_product = {
            "name": f"Tier Pricing Test Product {datetime.now().strftime('%H%M%S')}",
            "category": "Plywood",
            "price": 100.00,
            "priceUnit": "ea",
            "stock_status": "in_stock", 
            "stock_quantity": 50,
            "description": "Product for testing tier pricing",
            "pricing_rates": {
                "1": 100.00,  # Tier 1 (Standard)
                "2": 90.00,   # Tier 2 (Wholesale) - custom price
                "3": 80.00    # Tier 3 (Premium) - custom price
            }
        }
        
        success, response = self.make_request('POST', '/products', test_product, 200)
        if success and response.get('success'):
            created_product = response.get('data', {})
            product_id = created_product.get('id')
            if product_id:
                self.created_product_id = product_id
                self.log(f"Created product {product_id} with custom tier pricing")
                
                # Verify tier pricing was set correctly
                pricing_rates = created_product.get('pricing_rates', {})
                if (pricing_rates.get('1') == 100.00 and 
                    pricing_rates.get('2') == 90.00 and 
                    pricing_rates.get('3') == 80.00):
                    self.log("✓ Custom tier pricing values set correctly")
                    return True
                else:
                    self.log(f"✗ Tier pricing incorrect: {pricing_rates}")
                    return False
        return False

    def test_auto_calculate_tier_pricing(self) -> bool:
        """Test creating product with auto-calculated tier pricing"""
        test_product = {
            "name": f"Auto Tier Test Product {datetime.now().strftime('%H%M%S')}",
            "category": "Timber",
            "price": 200.00,
            "priceUnit": "ea",
            "stock_status": "in_stock", 
            "stock_quantity": 30,
            "description": "Product for testing auto-calculated tier pricing",
            # Don't provide pricing_rates - should auto-calculate
        }
        
        success, response = self.make_request('POST', '/products', test_product, 200)
        if success and response.get('success'):
            created_product = response.get('data', {})
            product_id = created_product.get('id')
            if product_id:
                self.log(f"Created product {product_id} with auto-calculated tier pricing")
                
                # Verify tier pricing was auto-calculated correctly
                pricing_rates = created_product.get('pricing_rates', {})
                expected_tier2 = 200.00 * 0.95  # 5% off
                expected_tier3 = 200.00 * 0.90  # 10% off
                
                if (pricing_rates.get('1') == 200.00 and 
                    pricing_rates.get('2') == expected_tier2 and 
                    pricing_rates.get('3') == expected_tier3):
                    self.log("✓ Auto-calculated tier pricing correct (Tier 2: 5% off, Tier 3: 10% off)")
                    # Clean up this test product
                    self.make_request('DELETE', f'/products/{product_id}')
                    return True
                else:
                    self.log(f"✗ Auto-calculated pricing incorrect: {pricing_rates}")
                    self.log(f"Expected: Tier1=200, Tier2={expected_tier2}, Tier3={expected_tier3}")
                    return False
        return False

    def test_update_tier_pricing(self) -> bool:
        """Test updating tier pricing on existing product"""
        if not self.created_product_id:
            return False
        
        updated_pricing = {
            "pricing_rates": {
                "1": 120.00,  # Updated Tier 1
                "2": 105.00,  # Updated Tier 2 
                "3": 95.00    # Updated Tier 3
            }
        }
        
        success, response = self.make_request('PUT', f'/products/{self.created_product_id}', updated_pricing, 200)
        if success and response.get('success'):
            updated_product = response.get('data', {})
            pricing_rates = updated_product.get('pricing_rates', {})
            
            if (pricing_rates.get('1') == 120.00 and 
                pricing_rates.get('2') == 105.00 and 
                pricing_rates.get('3') == 95.00):
                self.log("✓ Tier pricing updated successfully")
                return True
            else:
                self.log(f"✗ Updated tier pricing incorrect: {pricing_rates}")
                return False
        return False

    def test_retrieve_product_with_tier_pricing(self) -> bool:
        """Test retrieving product shows tier pricing correctly"""
        if not self.created_product_id:
            return False
            
        success, response = self.make_request('GET', f'/products/{self.created_product_id}')
        if success and response.get('data'):
            product = response['data']
            pricing_rates = product.get('pricing_rates', {})
            
            self.log(f"Retrieved product tier pricing: {pricing_rates}")
            
            # Should have all three tiers
            if ('1' in pricing_rates and '2' in pricing_rates and '3' in pricing_rates):
                self.log("✓ All tier pricing levels present")
                return True
            else:
                self.log("✗ Missing tier pricing levels")
                return False
        return False

    def cleanup(self):
        """Clean up test product"""
        if self.created_product_id:
            try:
                success, _ = self.make_request('DELETE', f'/products/{self.created_product_id}')
                if success:
                    self.log(f"Cleaned up test product: {self.created_product_id}")
            except:
                pass

    def run_all_tests(self):
        """Run all tier pricing tests"""
        self.log("🚀 Starting Tier Pricing Test Suite")
        self.log(f"Base URL: {self.base_url}")
        
        # Login first
        self.run_test("Admin Login", self.test_login)
        
        if not self.token:
            self.log("❌ Authentication failed - cannot proceed")
            return
        
        # Tier pricing specific tests
        self.run_test("Create Product with Custom Tier Pricing", self.test_create_product_with_custom_tier_pricing)
        self.run_test("Auto-Calculate Tier Pricing", self.test_auto_calculate_tier_pricing)
        self.run_test("Update Tier Pricing", self.test_update_tier_pricing)
        self.run_test("Retrieve Product with Tier Pricing", self.test_retrieve_product_with_tier_pricing)
        
        # Cleanup
        self.cleanup()
        
        # Results
        self.print_results()

    def print_results(self):
        print("\n" + "="*50)
        print("📊 TIER PRICING TEST RESULTS")
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
    tester = TierPricingTester()
    tester.run_all_tests()
    return 0 if len(tester.failed_tests) == 0 else 1


if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)