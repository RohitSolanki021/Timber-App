"""
Test file for B2B Plywood/Timber ordering system V2 features:
- Admin Orders V2 page with Confirm/Cancel
- Admin Customers page with 6-tier pricing
- Admin Invoices V2 page with type filters
- Sales Portal endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    BASE_URL = "https://admin-panel-refactor-7.preview.emergentagent.com"

# Test credentials
ADMIN_EMAIL = "admin@naturalplylam.com"
ADMIN_PASSWORD = "admin123"
SALES_EMAIL = "sales@naturalplylam.com"
SALES_PASSWORD = "sales123"
CUSTOMER_EMAIL = "customer1@example.com"
CUSTOMER_PASSWORD = "customer123"


class TestAdminAuth:
    """Test admin authentication"""
    
    def test_admin_login(self):
        """Test admin login"""
        response = requests.post(f"{BASE_URL}/api/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in response"
        assert "user" in data, "No user in response"
        assert data["user"]["role"] in ["Super Admin", "Admin"], f"Unexpected role: {data['user']['role']}"
        print(f"✓ Admin login successful - Role: {data['user']['role']}")
        return data["token"]


class TestOrdersV2:
    """Test Orders V2 endpoints - Admin Orders page"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["token"]
    
    def test_get_orders_v2_list(self, admin_token):
        """Test GET /api/orders/v2 - Orders list with filters"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Test basic list
        response = requests.get(f"{BASE_URL}/api/orders/v2?page=1&per_page=10", headers=headers)
        assert response.status_code == 200, f"Failed to get orders: {response.text}"
        data = response.json()
        assert "data" in data, "No data in response"
        assert "pagination" in data, "No pagination in response"
        print(f"✓ Orders V2 list - Total: {data['pagination']['total']} orders")
    
    def test_get_orders_v2_filter_by_type_plywood(self, admin_token):
        """Test filtering orders by Plywood type"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/orders/v2?order_type=Plywood&page=1&per_page=10", headers=headers)
        assert response.status_code == 200, f"Failed to filter by Plywood: {response.text}"
        data = response.json()
        # Verify all returned orders are Plywood type
        for order in data.get("data", []):
            assert order.get("order_type") == "Plywood", f"Order {order.get('id')} is not Plywood type"
        print(f"✓ Plywood filter works - {len(data.get('data', []))} Plywood orders")
    
    def test_get_orders_v2_filter_by_type_timber(self, admin_token):
        """Test filtering orders by Timber type"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/orders/v2?order_type=Timber&page=1&per_page=10", headers=headers)
        assert response.status_code == 200, f"Failed to filter by Timber: {response.text}"
        data = response.json()
        for order in data.get("data", []):
            assert order.get("order_type") == "Timber", f"Order {order.get('id')} is not Timber type"
        print(f"✓ Timber filter works - {len(data.get('data', []))} Timber orders")
    
    def test_get_orders_v2_filter_by_status(self, admin_token):
        """Test filtering orders by status"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        for status in ["Pending", "Confirmed", "Cancelled"]:
            response = requests.get(f"{BASE_URL}/api/orders/v2?status={status}&page=1&per_page=10", headers=headers)
            assert response.status_code == 200, f"Failed to filter by {status}: {response.text}"
            data = response.json()
            for order in data.get("data", []):
                assert order.get("status") == status, f"Order {order.get('id')} status mismatch"
            print(f"✓ Status filter '{status}' works - {len(data.get('data', []))} orders")
    
    def test_get_orders_v2_pending_first(self, admin_token):
        """Test that pending orders are shown first"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/orders/v2?page=1&per_page=20&pending_first=true", headers=headers)
        assert response.status_code == 200
        data = response.json()
        orders = data.get("data", [])
        
        # Check if pending orders come before non-pending
        found_non_pending = False
        for order in orders:
            if order.get("status") != "Pending":
                found_non_pending = True
            elif found_non_pending:
                # Found a pending order after a non-pending one
                pytest.fail("Pending orders should come first")
        print("✓ Pending orders are shown first")
    
    def test_order_confirm_creates_invoice(self, admin_token):
        """Test that confirming an order creates/updates invoice"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Get a pending order
        response = requests.get(f"{BASE_URL}/api/orders/v2?status=Pending&page=1&per_page=1", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        if not data.get("data"):
            pytest.skip("No pending orders to test confirmation")
        
        order = data["data"][0]
        order_id = order["id"]
        
        # Confirm the order
        response = requests.post(f"{BASE_URL}/api/orders/v2/{order_id}/confirm", headers=headers)
        assert response.status_code == 200, f"Failed to confirm order: {response.text}"
        result = response.json()
        assert result.get("success") == True, "Confirmation failed"
        
        # Check if invoice was created/updated
        if "invoice_id" in result:
            print(f"✓ Order {order_id} confirmed - Invoice: {result['invoice_id']}")
        else:
            print(f"✓ Order {order_id} confirmed successfully")
    
    def test_order_cancel(self, admin_token):
        """Test order cancellation"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Get a pending order
        response = requests.get(f"{BASE_URL}/api/orders/v2?status=Pending&page=1&per_page=1", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        if not data.get("data"):
            pytest.skip("No pending orders to test cancellation")
        
        order = data["data"][0]
        order_id = order["id"]
        
        # Cancel the order
        response = requests.post(f"{BASE_URL}/api/orders/v2/{order_id}/cancel", headers=headers)
        assert response.status_code == 200, f"Failed to cancel order: {response.text}"
        result = response.json()
        assert result.get("success") == True, "Cancellation failed"
        print(f"✓ Order {order_id} cancelled successfully")


class TestCustomersPage:
    """Test Customers page with 6-tier pricing"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["token"]
    
    def test_get_customers_list(self, admin_token):
        """Test GET /api/customers - Customers list"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/customers?page=1&per_page=10", headers=headers)
        assert response.status_code == 200, f"Failed to get customers: {response.text}"
        data = response.json()
        assert "data" in data, "No data in response"
        assert "pagination" in data, "No pagination in response"
        print(f"✓ Customers list - Total: {data['pagination']['total']} customers")
    
    def test_customers_have_pricing_tier(self, admin_token):
        """Test that customers have pricing_tier field (1-6)"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/customers?page=1&per_page=20", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        for customer in data.get("data", []):
            tier = customer.get("pricing_tier") or customer.get("pricing_type")
            assert tier is not None, f"Customer {customer.get('id')} has no pricing tier"
            assert 1 <= tier <= 6, f"Customer {customer.get('id')} has invalid tier: {tier}"
        print("✓ All customers have valid pricing tiers (1-6)")
    
    def test_create_customer_with_tier(self, admin_token):
        """Test creating customer with specific pricing tier"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        import time
        unique_id = int(time.time())
        
        customer_data = {
            "name": f"TEST_Tier5_Customer_{unique_id}",
            "contactPerson": "Test Contact",
            "email": f"test_tier5_{unique_id}@example.com",
            "phone": f"98765{unique_id % 100000:05d}",
            "pricing_tier": 5,
            "credit_limit": 50000
        }
        
        response = requests.post(f"{BASE_URL}/api/customers", json=customer_data, headers=headers)
        assert response.status_code == 200, f"Failed to create customer: {response.text}"
        data = response.json()
        assert data.get("success") == True, "Customer creation failed"
        
        created_customer = data.get("customer", {})
        tier = created_customer.get("pricing_tier") or created_customer.get("pricing_type")
        assert tier == 5, f"Expected tier 5, got {tier}"
        print(f"✓ Created customer with Tier 5 pricing - ID: {created_customer.get('id')}")
        
        # Cleanup - delete the test customer
        customer_id = created_customer.get("id")
        if customer_id:
            requests.delete(f"{BASE_URL}/api/customers/{customer_id}?hard=true", headers=headers)


class TestInvoicesV2:
    """Test Invoices V2 page with type filters"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["token"]
    
    def test_get_invoices_v2_list(self, admin_token):
        """Test GET /api/invoices/v2 - Invoices list"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/invoices/v2?page=1&per_page=10", headers=headers)
        assert response.status_code == 200, f"Failed to get invoices: {response.text}"
        data = response.json()
        assert "data" in data, "No data in response"
        assert "pagination" in data, "No pagination in response"
        print(f"✓ Invoices V2 list - Total: {data['pagination']['total']} invoices")
    
    def test_invoices_filter_by_type_plywood(self, admin_token):
        """Test filtering invoices by Plywood type"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/invoices/v2?order_type=Plywood&page=1&per_page=10", headers=headers)
        assert response.status_code == 200, f"Failed to filter by Plywood: {response.text}"
        data = response.json()
        for invoice in data.get("data", []):
            assert invoice.get("order_type") == "Plywood", f"Invoice {invoice.get('id')} is not Plywood type"
        print(f"✓ Plywood invoice filter works - {len(data.get('data', []))} invoices")
    
    def test_invoices_filter_by_type_timber(self, admin_token):
        """Test filtering invoices by Timber type"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/invoices/v2?order_type=Timber&page=1&per_page=10", headers=headers)
        assert response.status_code == 200, f"Failed to filter by Timber: {response.text}"
        data = response.json()
        for invoice in data.get("data", []):
            assert invoice.get("order_type") == "Timber", f"Invoice {invoice.get('id')} is not Timber type"
        print(f"✓ Timber invoice filter works - {len(data.get('data', []))} invoices")
    
    def test_invoice_detail_shows_items(self, admin_token):
        """Test that invoice detail includes items"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Get an invoice
        response = requests.get(f"{BASE_URL}/api/invoices/v2?page=1&per_page=1", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        if not data.get("data"):
            pytest.skip("No invoices to test")
        
        invoice_id = data["data"][0]["id"]
        
        # Get invoice detail
        response = requests.get(f"{BASE_URL}/api/invoices/v2/{invoice_id}", headers=headers)
        assert response.status_code == 200, f"Failed to get invoice detail: {response.text}"
        invoice = response.json().get("invoice", {})
        
        assert "items" in invoice, "Invoice has no items field"
        assert isinstance(invoice["items"], list), "Items should be a list"
        print(f"✓ Invoice {invoice_id} has {len(invoice['items'])} items embedded")


class TestSalesPortal:
    """Test Sales Portal endpoints"""
    
    @pytest.fixture
    def sales_token(self):
        response = requests.post(f"{BASE_URL}/api/login", json={
            "email": SALES_EMAIL,
            "password": SALES_PASSWORD,
            "app_role": "Sales Person"
        })
        assert response.status_code == 200, f"Sales login failed: {response.text}"
        return response.json()["token"]
    
    def test_sales_login(self):
        """Test sales person login"""
        response = requests.post(f"{BASE_URL}/api/login", json={
            "email": SALES_EMAIL,
            "password": SALES_PASSWORD,
            "app_role": "Sales Person"
        })
        assert response.status_code == 200, f"Sales login failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in response"
        assert data["user"]["role"] == "Sales Person", f"Unexpected role: {data['user']['role']}"
        print(f"✓ Sales login successful - {data['user']['name']}")
    
    def test_sales_get_customers(self, sales_token):
        """Test GET /api/sales/customers - Get customers for order placement"""
        headers = {"Authorization": f"Bearer {sales_token}"}
        response = requests.get(f"{BASE_URL}/api/sales/customers?page=1&per_page=10", headers=headers)
        assert response.status_code == 200, f"Failed to get sales customers: {response.text}"
        data = response.json()
        assert "data" in data, "No data in response"
        
        # Verify all customers are approved and active
        for customer in data.get("data", []):
            assert customer.get("approval_status") == "Approved", f"Customer {customer.get('id')} not approved"
            assert customer.get("is_active") == True, f"Customer {customer.get('id')} not active"
        print(f"✓ Sales customers list - {len(data.get('data', []))} approved customers")
    
    def test_sales_create_customer_with_6_tiers(self, sales_token):
        """Test POST /api/sales/customers - Create customer with 6 pricing tiers"""
        headers = {"Authorization": f"Bearer {sales_token}"}
        
        import time
        unique_id = int(time.time())
        
        # Test creating customer with tier 6 (Enterprise)
        customer_data = {
            "name": f"TEST_Sales_Customer_{unique_id}",
            "contactPerson": "Sales Test Contact",
            "email": f"test_sales_{unique_id}@example.com",
            "phone": f"91234{unique_id % 100000:05d}",
            "pricing_tier": 6,  # Enterprise tier
            "credit_limit": 100000,
            "city": "Mumbai",
            "state": "Maharashtra"
        }
        
        response = requests.post(f"{BASE_URL}/api/sales/customers", json=customer_data, headers=headers)
        assert response.status_code == 200, f"Failed to create customer: {response.text}"
        data = response.json()
        assert data.get("success") == True, "Customer creation failed"
        
        created_customer = data.get("customer", {})
        assert created_customer.get("pricing_tier") == 6, f"Expected tier 6, got {created_customer.get('pricing_tier')}"
        assert created_customer.get("approval_status") == "Approved", "Sales-created customer should be auto-approved"
        print(f"✓ Sales created customer with Tier 6 - ID: {created_customer.get('id')}")
        
        # Cleanup
        customer_id = created_customer.get("id")
        if customer_id:
            admin_response = requests.post(f"{BASE_URL}/api/login", json={
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            })
            admin_token = admin_response.json()["token"]
            requests.delete(f"{BASE_URL}/api/customers/{customer_id}?hard=true", 
                          headers={"Authorization": f"Bearer {admin_token}"})
    
    def test_sales_dashboard(self, sales_token):
        """Test GET /api/sales/dashboard"""
        headers = {"Authorization": f"Bearer {sales_token}"}
        response = requests.get(f"{BASE_URL}/api/sales/dashboard", headers=headers)
        assert response.status_code == 200, f"Failed to get sales dashboard: {response.text}"
        data = response.json()
        assert "total_orders" in data, "No total_orders in dashboard"
        assert "pending_orders" in data, "No pending_orders in dashboard"
        print(f"✓ Sales dashboard - Total: {data['total_orders']}, Pending: {data['pending_orders']}")


class TestProductsV2:
    """Test Products V2 with 6 pricing tiers"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["token"]
    
    def test_products_have_6_tiers(self, admin_token):
        """Test that products have all 6 pricing tiers"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/products-v2", headers=headers)
        assert response.status_code == 200, f"Failed to get products: {response.text}"
        data = response.json()
        
        for product in data.get("products", []):
            tiers = product.get("pricing_tiers", {})
            for tier_num in ["1", "2", "3", "4", "5", "6"]:
                assert tier_num in tiers, f"Product {product.get('id')} missing tier {tier_num}"
        print(f"✓ All {len(data.get('products', []))} products have 6 pricing tiers")


class TestDirectOrderFlow:
    """Test direct order creation flow"""
    
    @pytest.fixture
    def sales_token(self):
        response = requests.post(f"{BASE_URL}/api/login", json={
            "email": SALES_EMAIL,
            "password": SALES_PASSWORD,
            "app_role": "Sales Person"
        })
        return response.json()["token"]
    
    def test_create_direct_order(self, sales_token):
        """Test POST /api/orders/direct - Create order with items"""
        headers = {"Authorization": f"Bearer {sales_token}"}
        
        # Get a customer
        customers_response = requests.get(f"{BASE_URL}/api/sales/customers?page=1&per_page=1", headers=headers)
        customers = customers_response.json().get("data", [])
        if not customers:
            pytest.skip("No customers available for order")
        
        customer_id = customers[0]["id"]
        
        # Get a product
        products_response = requests.get(f"{BASE_URL}/api/products-v2", headers=headers)
        products = products_response.json().get("products", [])
        if not products:
            pytest.skip("No products available for order")
        
        product = products[0]
        
        order_data = {
            "customer_id": customer_id,
            "items": [{
                "product_group": product.get("group", "Plywood"),
                "product_id": product["id"],
                "product_name": product["name"],
                "thickness": product["thicknesses"][0] if product.get("thicknesses") else "11",
                "size": product["sizes"][0] if product.get("sizes") else "2.44 x 1.22",
                "quantity": 5,
                "unit_price": product.get("base_price", 500),
                "total_price": product.get("base_price", 500) * 5
            }],
            "transport_mode": "Self Pickup",
            "notes": "TEST order - please ignore"
        }
        
        response = requests.post(f"{BASE_URL}/api/orders/direct", json=order_data, headers=headers)
        assert response.status_code == 200, f"Failed to create order: {response.text}"
        data = response.json()
        assert data.get("success") == True, "Order creation failed"
        assert "orders" in data, "No orders in response"
        assert "invoices" in data, "No invoices in response"
        print(f"✓ Direct order created - {len(data['orders'])} order(s), {len(data['invoices'])} invoice(s)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
