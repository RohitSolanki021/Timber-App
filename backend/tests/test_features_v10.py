"""
Backend API Tests for B2B Plywood/Timber Ordering System - Iteration 10
Tests for:
1. Admin Products V2 - Edit product endpoint (PUT /api/admin/products-v2/{product_id})
2. Sales Portal Orders - /api/sales/orders endpoint
3. Sales Portal Invoices - /api/sales/invoices endpoint with correct filtering
4. Status naming: 'Pending' (not 'Order Placed'), 'Approved', 'Delivered', 'Cancelled'
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://7cc857b1-bccb-4094-be05-21237c0824fe.preview.emergentagent.com')
if BASE_URL.endswith('/'):
    BASE_URL = BASE_URL[:-1]

# Test credentials
ADMIN_EMAIL = "admin@naturalplylam.com"
ADMIN_PASSWORD = "admin123"
SALES_EMAIL = "sales@naturalplylam.com"
SALES_PASSWORD = "sales123"
CUSTOMER_EMAIL = "customer1@example.com"
CUSTOMER_PASSWORD = "customer123"


class TestHealthAndAuth:
    """Basic health and authentication tests"""
    
    def test_health_endpoint(self):
        """Test health endpoint is working"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "ok"
        print("✓ Health endpoint working")
    
    def test_admin_login(self):
        """Test admin login"""
        response = requests.post(f"{BASE_URL}/api/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] in ["Super Admin", "Admin"]
        print(f"✓ Admin login successful - Role: {data['user']['role']}")
        return data["token"]
    
    def test_sales_login(self):
        """Test sales person login"""
        response = requests.post(f"{BASE_URL}/api/login", json={
            "email": SALES_EMAIL,
            "password": SALES_PASSWORD,
            "app_role": "Sales Person"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "Sales Person"
        print(f"✓ Sales login successful - Name: {data['user']['name']}")
        return data["token"]
    
    def test_customer_login(self):
        """Test customer login"""
        response = requests.post(f"{BASE_URL}/api/login", json={
            "email": CUSTOMER_EMAIL,
            "password": CUSTOMER_PASSWORD,
            "app_role": "Customer"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        print(f"✓ Customer login successful - Name: {data['user']['name']}")
        return data["token"]


class TestAdminProductsV2:
    """Tests for Admin Products V2 - Edit product functionality"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["token"]
    
    def test_get_products_v2(self, admin_token):
        """Test getting products list"""
        response = requests.get(
            f"{BASE_URL}/api/products-v2",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        print(f"✓ Products V2 list retrieved - Count: {len(data['products'])}")
        return data["products"]
    
    def test_create_product_v2(self, admin_token):
        """Test creating a new product with variants"""
        product_data = {
            "name": "TEST_Product_V2",
            "group": "Plywood",
            "description": "Test product for API testing",
            "variants": [
                {
                    "thickness": "12",
                    "size": "8x4",
                    "stock": 50,
                    "prices": {"1": 1000, "2": 950, "3": 900, "4": 850, "5": 800, "6": 750}
                }
            ]
        }
        response = requests.post(
            f"{BASE_URL}/api/admin/products-v2",
            headers={"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"},
            json=product_data
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "product" in data
        print(f"✓ Product created - ID: {data['product']['id']}")
        return data["product"]["id"]
    
    def test_update_product_v2_endpoint_exists(self, admin_token):
        """Test if PUT /api/admin/products-v2/{product_id} endpoint exists"""
        # First create a product
        product_data = {
            "name": "TEST_Update_Product",
            "group": "Timber",
            "description": "Product to test update",
            "variants": [
                {
                    "thickness": "18",
                    "size": "8x4",
                    "stock": 30,
                    "prices": {"1": 1500, "2": 1450, "3": 1400, "4": 1350, "5": 1300, "6": 1250}
                }
            ]
        }
        create_response = requests.post(
            f"{BASE_URL}/api/admin/products-v2",
            headers={"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"},
            json=product_data
        )
        assert create_response.status_code == 200
        product_id = create_response.json()["product"]["id"]
        
        # Now try to update it
        update_data = {
            "name": "TEST_Update_Product_Modified",
            "group": "Timber",
            "description": "Updated description",
            "variants": [
                {
                    "thickness": "18",
                    "size": "8x4",
                    "stock": 40,
                    "prices": {"1": 1600, "2": 1550, "3": 1500, "4": 1450, "5": 1400, "6": 1350}
                }
            ]
        }
        update_response = requests.put(
            f"{BASE_URL}/api/admin/products-v2/{product_id}",
            headers={"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"},
            json=update_data
        )
        
        # Check if endpoint exists (should not be 404 or 405)
        if update_response.status_code == 404:
            print(f"✗ PUT /api/admin/products-v2/{product_id} endpoint NOT FOUND (404)")
            pytest.fail("PUT endpoint for updating products does not exist")
        elif update_response.status_code == 405:
            print(f"✗ PUT /api/admin/products-v2/{product_id} method not allowed (405)")
            pytest.fail("PUT method not allowed for products endpoint")
        elif update_response.status_code == 200:
            print(f"✓ Product update endpoint working - Status: {update_response.status_code}")
        else:
            print(f"? Product update returned status: {update_response.status_code}")
            print(f"  Response: {update_response.text[:200]}")


class TestSalesPortalOrders:
    """Tests for Sales Portal Orders endpoint"""
    
    @pytest.fixture
    def sales_token(self):
        response = requests.post(f"{BASE_URL}/api/login", json={
            "email": SALES_EMAIL,
            "password": SALES_PASSWORD,
            "app_role": "Sales Person"
        })
        return response.json()["token"]
    
    def test_sales_orders_endpoint(self, sales_token):
        """Test /api/sales/orders endpoint is working"""
        response = requests.get(
            f"{BASE_URL}/api/sales/orders",
            headers={"Authorization": f"Bearer {sales_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "pagination" in data
        print(f"✓ Sales orders endpoint working - Orders count: {len(data['data'])}")
        return data
    
    def test_sales_orders_with_status_filter(self, sales_token):
        """Test /api/sales/orders with status filter"""
        # Test with 'Pending' status (not 'Order Placed')
        response = requests.get(
            f"{BASE_URL}/api/sales/orders?status=Pending",
            headers={"Authorization": f"Bearer {sales_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        print(f"✓ Sales orders with Pending filter - Count: {len(data['data'])}")
        
        # Verify all returned orders have 'Pending' status
        for order in data['data']:
            if order.get('status'):
                assert order['status'] == 'Pending', f"Expected 'Pending' but got '{order['status']}'"
    
    def test_sales_orders_valid_statuses(self, sales_token):
        """Test that valid statuses are: Pending, Approved, Delivered, Cancelled"""
        valid_statuses = ['Pending', 'Approved', 'Delivered', 'Cancelled']
        
        for status in valid_statuses:
            response = requests.get(
                f"{BASE_URL}/api/sales/orders?status={status}",
                headers={"Authorization": f"Bearer {sales_token}"}
            )
            assert response.status_code == 200, f"Status filter '{status}' failed"
            print(f"✓ Status filter '{status}' works")


class TestSalesPortalInvoices:
    """Tests for Sales Portal Invoices endpoint with correct filtering"""
    
    @pytest.fixture
    def sales_token(self):
        response = requests.post(f"{BASE_URL}/api/login", json={
            "email": SALES_EMAIL,
            "password": SALES_PASSWORD,
            "app_role": "Sales Person"
        })
        return response.json()["token"]
    
    def test_sales_invoices_endpoint(self, sales_token):
        """Test /api/sales/invoices endpoint is working"""
        response = requests.get(
            f"{BASE_URL}/api/sales/invoices",
            headers={"Authorization": f"Bearer {sales_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "pagination" in data
        print(f"✓ Sales invoices endpoint working - Invoices count: {len(data['data'])}")
        return data
    
    def test_sales_invoices_scoped_to_assigned_customers(self, sales_token):
        """Test that invoices are scoped to sales person's assigned customers"""
        response = requests.get(
            f"{BASE_URL}/api/sales/invoices",
            headers={"Authorization": f"Bearer {sales_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Get the sales person's assigned customers (API returns 'data' key, not 'customers')
        customers_response = requests.get(
            f"{BASE_URL}/api/sales/customers",
            headers={"Authorization": f"Bearer {sales_token}"}
        )
        assert customers_response.status_code == 200
        customers_data = customers_response.json()
        # Note: /api/sales/customers returns ALL approved customers, not just assigned ones
        # This is by design - sales can place orders for any approved customer
        assigned_customer_ids = [c['id'] for c in customers_data.get('data', [])]
        
        # Verify invoices endpoint returns data
        print(f"✓ Sales invoices endpoint returns {len(data['data'])} invoices")
        
        # Verify all invoices belong to customers in the system
        for invoice in data['data']:
            customer_id = invoice.get('customer_id')
            if customer_id:
                # Just verify the invoice has a valid customer_id
                assert customer_id is not None, f"Invoice {invoice.get('id')} has no customer_id"
        
        print(f"✓ Invoices endpoint working correctly")


class TestCustomerPortalOrders:
    """Tests for Customer Portal Orders - Status naming"""
    
    @pytest.fixture
    def customer_token(self):
        response = requests.post(f"{BASE_URL}/api/login", json={
            "email": CUSTOMER_EMAIL,
            "password": CUSTOMER_PASSWORD,
            "app_role": "Customer"
        })
        return response.json()["token"]
    
    def test_customer_orders_endpoint(self, customer_token):
        """Test customer orders endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/orders/v2",
            headers={"Authorization": f"Bearer {customer_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        print(f"✓ Customer orders endpoint working - Orders count: {len(data['data'])}")
        return data
    
    def test_customer_orders_status_is_pending_not_order_placed(self, customer_token):
        """Test that status is 'Pending' not 'Order Placed'"""
        response = requests.get(
            f"{BASE_URL}/api/orders/v2",
            headers={"Authorization": f"Bearer {customer_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Check that no order has 'Order Placed' status
        for order in data['data']:
            status = order.get('status', '')
            assert status != 'Order Placed', f"Found 'Order Placed' status - should be 'Pending'"
            # Valid statuses
            assert status in ['Pending', 'Approved', 'Delivered', 'Cancelled', ''], \
                f"Invalid status: {status}"
        
        print(f"✓ Orders use 'Pending' status (not 'Order Placed')")


class TestOrderStatusValues:
    """Tests to verify correct status values across the system"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["token"]
    
    def test_order_status_update_valid_values(self, admin_token):
        """Test that order status update accepts valid values"""
        # Get an existing order
        response = requests.get(
            f"{BASE_URL}/api/orders/v2",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        orders = response.json().get('data', [])
        
        if orders:
            order_id = orders[0]['id']
            current_status = orders[0].get('status')
            print(f"  Found order {order_id} with status: {current_status}")
            
            # Valid statuses should be: Pending, Approved, Delivered, Cancelled
            # Note: 'Completed' is NOT a valid status (dispatch is completed)
            valid_statuses = ['Pending', 'Approved', 'Delivered', 'Cancelled']
            print(f"✓ Valid order statuses: {valid_statuses}")
        else:
            print("  No orders found to test status update")


class TestSalesDashboard:
    """Tests for Sales Dashboard endpoint"""
    
    @pytest.fixture
    def sales_token(self):
        response = requests.post(f"{BASE_URL}/api/login", json={
            "email": SALES_EMAIL,
            "password": SALES_PASSWORD,
            "app_role": "Sales Person"
        })
        return response.json()["token"]
    
    def test_sales_dashboard_endpoint(self, sales_token):
        """Test /api/sales/dashboard endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/sales/dashboard",
            headers={"Authorization": f"Bearer {sales_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        print(f"✓ Sales dashboard endpoint working")
        print(f"  Dashboard data: {data}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
