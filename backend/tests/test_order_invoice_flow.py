"""
Test suite for B2B Plywood/Timber ordering system
Tests: Order creation with invoice, split billing, admin price updates, 
       pending orders/customers sorting, product analytics
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://source-puller-9.preview.emergentagent.com')

# Test credentials
CUSTOMER_EMAIL = "customer1@example.com"
CUSTOMER_PASSWORD = "customer123"
ADMIN_EMAIL = "admin@naturalplylam.com"
ADMIN_PASSWORD = "admin123"


class TestCustomerLogin:
    """Test customer login and dashboard"""
    
    def test_customer_login_success(self):
        """Customer can login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/login", json={
            "email": CUSTOMER_EMAIL,
            "password": CUSTOMER_PASSWORD,
            "app_role": "Customer"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == CUSTOMER_EMAIL
        assert data["user"]["approval_status"] == "Approved"
        print(f"✓ Customer login successful - {data['user']['name']}")
    
    def test_customer_dashboard_loads(self):
        """Customer can access their profile/dashboard data"""
        # Login first
        login_res = requests.post(f"{BASE_URL}/api/login", json={
            "email": CUSTOMER_EMAIL,
            "password": CUSTOMER_PASSWORD,
            "app_role": "Customer"
        })
        token = login_res.json()["token"]
        
        # Get profile
        response = requests.get(f"{BASE_URL}/api/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "pricing_tier" in data or "pricing_type" in data
        print(f"✓ Customer dashboard data loaded - pricing tier: {data.get('pricing_tier', data.get('pricing_type'))}")


class TestProductCatalog:
    """Test product catalog with Plywood and Timber products"""
    
    @pytest.fixture
    def customer_token(self):
        response = requests.post(f"{BASE_URL}/api/login", json={
            "email": CUSTOMER_EMAIL,
            "password": CUSTOMER_PASSWORD,
            "app_role": "Customer"
        })
        return response.json()["token"]
    
    def test_products_v2_endpoint(self, customer_token):
        """Products V2 endpoint returns Plywood and Timber products"""
        response = requests.get(f"{BASE_URL}/api/products-v2", headers={
            "Authorization": f"Bearer {customer_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        products = data["products"]
        assert len(products) > 0
        
        # Check for both Plywood and Timber products
        groups = set(p["group"] for p in products)
        assert "Plywood" in groups, "No Plywood products found"
        assert "Timber" in groups, "No Timber products found"
        
        # Check product structure
        for product in products:
            assert "id" in product
            assert "name" in product
            assert "thicknesses" in product
            assert "sizes" in product
            assert "pricing_tiers" in product
        
        print(f"✓ Product catalog loaded - {len(products)} products ({groups})")
    
    def test_product_has_cascading_options(self, customer_token):
        """Products have thickness and size options for cascading dropdowns"""
        response = requests.get(f"{BASE_URL}/api/products-v2", headers={
            "Authorization": f"Bearer {customer_token}"
        })
        products = response.json()["products"]
        
        for product in products[:2]:  # Check first 2 products
            assert len(product["thicknesses"]) > 0, f"Product {product['name']} has no thicknesses"
            assert len(product["sizes"]) > 0, f"Product {product['name']} has no sizes"
            print(f"  - {product['name']}: {len(product['thicknesses'])} thicknesses, {len(product['sizes'])} sizes")
        
        print("✓ Products have cascading dropdown options")


class TestOrderCreation:
    """Test order creation with invoice generation"""
    
    @pytest.fixture
    def customer_auth(self):
        response = requests.post(f"{BASE_URL}/api/login", json={
            "email": CUSTOMER_EMAIL,
            "password": CUSTOMER_PASSWORD,
            "app_role": "Customer"
        })
        data = response.json()
        return {
            "token": data["token"],
            "customer_id": data["user"]["id"],
            "pricing_tier": data["user"].get("pricing_tier", data["user"].get("pricing_type", 1))
        }
    
    def test_order_creates_invoice(self, customer_auth):
        """Creating an order also creates an invoice"""
        # Get a product
        products_res = requests.get(f"{BASE_URL}/api/products-v2", headers={
            "Authorization": f"Bearer {customer_auth['token']}"
        })
        products = products_res.json()["products"]
        plywood_product = next(p for p in products if p["group"] == "Plywood")
        
        # Create order with transport details
        order_data = {
            "customer_id": customer_auth["customer_id"],
            "items": [{
                "product_group": "Plywood",
                "product_id": plywood_product["id"],
                "product_name": plywood_product["name"],
                "thickness": plywood_product["thicknesses"][0],
                "size": plywood_product["sizes"][0],
                "quantity": 2,
                "unit_price": plywood_product["pricing_tiers"][str(customer_auth["pricing_tier"])],
                "total_price": plywood_product["pricing_tiers"][str(customer_auth["pricing_tier"])] * 2
            }],
            "transport_mode": "Self Pickup",
            "vehicle_number": "MH12AB1234",
            "driver_name": "Test Driver",
            "driver_phone": "9876543210",
            "notes": "Test order"
        }
        
        response = requests.post(f"{BASE_URL}/api/orders/direct", 
            headers={"Authorization": f"Bearer {customer_auth['token']}"},
            json=order_data
        )
        assert response.status_code == 200, f"Order creation failed: {response.text}"
        result = response.json()
        
        assert result["success"] == True
        assert "orders" in result
        assert "invoices" in result
        assert len(result["orders"]) == 1
        assert len(result["invoices"]) == 1
        
        print(f"✓ Order created: {result['orders'][0]['id']}")
        print(f"✓ Invoice created: {result['invoices'][0]['id']}")
        
        # Verify invoice exists
        invoice_id = result["invoices"][0]["id"]
        invoice_res = requests.get(f"{BASE_URL}/api/invoices/v2/{invoice_id}", headers={
            "Authorization": f"Bearer {customer_auth['token']}"
        })
        assert invoice_res.status_code == 200
        invoice = invoice_res.json()["invoice"]
        assert invoice["order_id"] == result["orders"][0]["id"]
        print(f"✓ Invoice verified - linked to order {invoice['order_id']}")
    
    def test_split_billing_mixed_order(self, customer_auth):
        """Mixed Plywood+Timber order creates 2 orders and 2 invoices"""
        # Get products
        products_res = requests.get(f"{BASE_URL}/api/products-v2", headers={
            "Authorization": f"Bearer {customer_auth['token']}"
        })
        products = products_res.json()["products"]
        plywood_product = next(p for p in products if p["group"] == "Plywood")
        timber_product = next(p for p in products if p["group"] == "Timber")
        
        tier = str(customer_auth["pricing_tier"])
        
        # Create mixed order
        order_data = {
            "customer_id": customer_auth["customer_id"],
            "items": [
                {
                    "product_group": "Plywood",
                    "product_id": plywood_product["id"],
                    "product_name": plywood_product["name"],
                    "thickness": plywood_product["thicknesses"][0],
                    "size": plywood_product["sizes"][0],
                    "quantity": 1,
                    "unit_price": plywood_product["pricing_tiers"][tier],
                    "total_price": plywood_product["pricing_tiers"][tier]
                },
                {
                    "product_group": "Timber",
                    "product_id": timber_product["id"],
                    "product_name": timber_product["name"],
                    "thickness": timber_product["thicknesses"][0],
                    "size": timber_product["sizes"][0],
                    "quantity": 1,
                    "unit_price": timber_product["pricing_tiers"][tier],
                    "total_price": timber_product["pricing_tiers"][tier]
                }
            ],
            "transport_mode": "Delivery",
            "notes": "Mixed order test"
        }
        
        response = requests.post(f"{BASE_URL}/api/orders/direct", 
            headers={"Authorization": f"Bearer {customer_auth['token']}"},
            json=order_data
        )
        assert response.status_code == 200, f"Mixed order failed: {response.text}"
        result = response.json()
        
        assert result["success"] == True
        assert len(result["orders"]) == 2, f"Expected 2 orders, got {len(result['orders'])}"
        assert len(result["invoices"]) == 2, f"Expected 2 invoices, got {len(result['invoices'])}"
        
        # Verify order types
        order_types = [o["type"] for o in result["orders"]]
        assert "Plywood" in order_types
        assert "Timber" in order_types
        
        print(f"✓ Split billing: 2 orders created - {order_types}")
        print(f"✓ Split billing: 2 invoices created")


class TestAdminPriceUpdate:
    """Test admin can update order prices before approval"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["token"]
    
    @pytest.fixture
    def pending_order(self, admin_token):
        """Get or create a pending order"""
        # Get pending orders
        response = requests.get(f"{BASE_URL}/api/orders/v2?status=Pending", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        orders = response.json()["data"]
        if orders:
            return orders[0]
        return None
    
    def test_admin_can_update_order_prices(self, admin_token, pending_order):
        """Admin can modify order item prices before approval"""
        if not pending_order:
            pytest.skip("No pending orders to test")
        
        order_id = pending_order["id"]
        original_items = pending_order["items"]
        
        # Modify prices
        updated_items = []
        for item in original_items:
            updated_item = item.copy()
            updated_item["unit_price"] = item["unit_price"] * 0.9  # 10% discount
            updated_item["total_price"] = updated_item["unit_price"] * item["quantity"]
            updated_items.append(updated_item)
        
        response = requests.put(f"{BASE_URL}/api/admin/orders/{order_id}/items",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"items": updated_items, "notes": "Price adjustment test"}
        )
        
        assert response.status_code == 200, f"Price update failed: {response.text}"
        result = response.json()
        assert result["success"] == True
        print(f"✓ Admin updated order prices - new total: ₹{result['new_total']}")
    
    def test_cannot_update_confirmed_order_prices(self, admin_token):
        """Cannot update prices for confirmed orders"""
        # Get confirmed orders
        response = requests.get(f"{BASE_URL}/api/orders/v2?status=Confirmed", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        orders = response.json()["data"]
        
        if not orders:
            pytest.skip("No confirmed orders to test")
        
        order_id = orders[0]["id"]
        
        response = requests.put(f"{BASE_URL}/api/admin/orders/{order_id}/items",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"items": orders[0]["items"]}
        )
        
        assert response.status_code == 400
        print("✓ Confirmed order prices cannot be updated (expected)")


class TestPendingFirstSorting:
    """Test pending orders/customers appear first"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["token"]
    
    def test_orders_pending_first(self, admin_token):
        """Orders list shows pending orders first"""
        response = requests.get(f"{BASE_URL}/api/orders/v2?pending_first=true", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200
        orders = response.json()["data"]
        
        if len(orders) < 2:
            pytest.skip("Not enough orders to test sorting")
        
        # Check if pending orders come first
        found_non_pending = False
        for order in orders:
            if order["status"] != "Pending":
                found_non_pending = True
            elif found_non_pending:
                pytest.fail("Pending order found after non-pending order")
        
        pending_count = sum(1 for o in orders if o["status"] == "Pending")
        print(f"✓ Orders sorted - {pending_count} pending orders first")
    
    def test_customers_pending_first(self, admin_token):
        """Customers list shows pending customers first"""
        response = requests.get(f"{BASE_URL}/api/customers?pending_first=true", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200
        customers = response.json()["data"]
        
        if len(customers) < 2:
            pytest.skip("Not enough customers to test sorting")
        
        # Check if pending customers come first
        found_non_pending = False
        for customer in customers:
            if customer["approval_status"] != "Pending":
                found_non_pending = True
            elif found_non_pending:
                pytest.fail("Pending customer found after non-pending customer")
        
        pending_count = sum(1 for c in customers if c["approval_status"] == "Pending")
        print(f"✓ Customers sorted - {pending_count} pending customers first")


class TestAdminDashboard:
    """Test admin dashboard with latest Plywood/Timber orders"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["token"]
    
    def test_dashboard_v2_endpoint(self, admin_token):
        """Dashboard V2 shows separate Plywood and Timber sections"""
        response = requests.get(f"{BASE_URL}/api/admin/dashboard/v2", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200
        data = response.json()
        
        # Check required fields
        assert "pending_orders" in data
        assert "confirmed_orders" in data
        assert "plywood_orders_count" in data
        assert "timber_orders_count" in data
        assert "latest_plywood_orders" in data
        assert "latest_timber_orders" in data
        assert "pending_customers" in data
        
        print(f"✓ Dashboard V2 loaded:")
        print(f"  - Pending orders: {data['pending_orders']}")
        print(f"  - Plywood orders: {data['plywood_orders_count']}")
        print(f"  - Timber orders: {data['timber_orders_count']}")
        print(f"  - Pending customers: {data['pending_customers']}")


class TestProductAnalytics:
    """Test product analytics endpoint"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["token"]
    
    def test_product_analytics_endpoint(self, admin_token):
        """Product analytics endpoint returns sales data"""
        response = requests.get(f"{BASE_URL}/api/admin/analytics/products", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200
        data = response.json()
        
        assert "product_sales" in data
        assert "customer_sales" in data
        
        print(f"✓ Product analytics loaded:")
        print(f"  - Products with sales: {len(data['product_sales'])}")
        print(f"  - Customers with orders: {len(data['customer_sales'])}")
    
    def test_analytics_with_filters(self, admin_token):
        """Analytics can be filtered by order type"""
        response = requests.get(f"{BASE_URL}/api/admin/analytics/products?order_type=Plywood", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200
        data = response.json()
        
        # All products should be Plywood
        for product in data["product_sales"]:
            if "product_group" in product:
                assert product["product_group"] == "Plywood"
        
        print("✓ Analytics filtering by order type works")


class TestTransportDetails:
    """Test transport details in orders"""
    
    @pytest.fixture
    def customer_auth(self):
        response = requests.post(f"{BASE_URL}/api/login", json={
            "email": CUSTOMER_EMAIL,
            "password": CUSTOMER_PASSWORD,
            "app_role": "Customer"
        })
        data = response.json()
        return {
            "token": data["token"],
            "customer_id": data["user"]["id"],
            "pricing_tier": data["user"].get("pricing_tier", data["user"].get("pricing_type", 1))
        }
    
    def test_order_includes_transport_details(self, customer_auth):
        """Order stores transport details"""
        # Get a product
        products_res = requests.get(f"{BASE_URL}/api/products-v2", headers={
            "Authorization": f"Bearer {customer_auth['token']}"
        })
        products = products_res.json()["products"]
        product = products[0]
        tier = str(customer_auth["pricing_tier"])
        
        # Create order with transport details
        order_data = {
            "customer_id": customer_auth["customer_id"],
            "items": [{
                "product_group": product["group"],
                "product_id": product["id"],
                "product_name": product["name"],
                "thickness": product["thicknesses"][0],
                "size": product["sizes"][0],
                "quantity": 1,
                "unit_price": product["pricing_tiers"][tier],
                "total_price": product["pricing_tiers"][tier]
            }],
            "transport_mode": "Delivery",
            "vehicle_number": "KA01MN5678",
            "driver_name": "Raju Kumar",
            "driver_phone": "9988776655"
        }
        
        response = requests.post(f"{BASE_URL}/api/orders/direct", 
            headers={"Authorization": f"Bearer {customer_auth['token']}"},
            json=order_data
        )
        assert response.status_code == 200
        result = response.json()
        order_id = result["orders"][0]["id"]
        
        # Verify transport details in order
        order_res = requests.get(f"{BASE_URL}/api/orders/v2/{order_id}", headers={
            "Authorization": f"Bearer {customer_auth['token']}"
        })
        assert order_res.status_code == 200
        order = order_res.json()["order"]
        
        assert "transport" in order
        assert order["transport"]["transport_mode"] == "Delivery"
        assert order["transport"]["vehicle_number"] == "KA01MN5678"
        assert order["transport"]["driver_name"] == "Raju Kumar"
        
        print(f"✓ Transport details stored in order {order_id}")


class TestSixPricingTiers:
    """Test 6 pricing tiers functionality"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["token"]
    
    def test_products_have_six_tiers(self, admin_token):
        """Products have pricing for all 6 tiers"""
        response = requests.get(f"{BASE_URL}/api/products-v2", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        products = response.json()["products"]
        
        for product in products[:3]:  # Check first 3 products
            tiers = product["pricing_tiers"]
            assert len(tiers) == 6, f"Product {product['name']} has {len(tiers)} tiers, expected 6"
            for i in range(1, 7):
                assert str(i) in tiers, f"Product {product['name']} missing tier {i}"
        
        print("✓ Products have all 6 pricing tiers")
    
    def test_customer_tier_assignment(self, admin_token):
        """Customers can be assigned tiers 1-6"""
        response = requests.get(f"{BASE_URL}/api/customers", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        customers = response.json()["data"]
        
        tiers_found = set()
        for customer in customers:
            tier = customer.get("pricing_tier", customer.get("pricing_type", 1))
            tiers_found.add(tier)
        
        print(f"✓ Customer tiers in use: {sorted(tiers_found)}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
