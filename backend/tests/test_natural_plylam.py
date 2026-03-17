"""
Comprehensive API Tests for Natural Plylam - Admin Panel and Customer Portal
Tests: Authentication, Dashboard, Customers CRUD, Products (tier pricing), 
       Cart, Checkout, Orders, Invoices, and Profile endpoints
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthCheck:
    """API Health check"""
    
    def test_api_health(self):
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✓ API health check passed")


class TestAdminAuthentication:
    """Admin Panel authentication tests"""
    
    def test_admin_login_success(self):
        """Admin login with admin@naturalplylam.com / admin123"""
        response = requests.post(f"{BASE_URL}/api/login", json={
            "email": "admin@naturalplylam.com",
            "password": "admin123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == "admin@naturalplylam.com"
        assert data["user"]["role"] == "Super Admin"
        print("✓ Admin login successful")
        return data["token"]
    
    def test_admin_login_invalid_credentials(self):
        """Admin login with wrong credentials"""
        response = requests.post(f"{BASE_URL}/api/login", json={
            "email": "admin@naturalplylam.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Admin invalid login rejected correctly")
    
    def test_get_admin_profile(self):
        """Get admin profile with token"""
        token = self.test_admin_login_success()
        response = requests.get(f"{BASE_URL}/api/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "admin@naturalplylam.com"
        print("✓ Admin profile retrieved")


class TestAdminDashboard:
    """Admin Dashboard stats tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        response = requests.post(f"{BASE_URL}/api/login", json={
            "email": "admin@naturalplylam.com",
            "password": "admin123"
        })
        self.token = response.json()["token"]
    
    def test_dashboard_stats(self):
        """Dashboard shows stats (pending orders, customers, invoices)"""
        response = requests.get(f"{BASE_URL}/api/admin", params={
            "resource": "dashboard"
        }, headers={"Authorization": f"Bearer {self.token}"})
        
        assert response.status_code == 200
        data = response.json()
        
        # Check required dashboard fields
        assert "pending_orders_count" in data
        assert "new_orders_week" in data
        assert "due_invoices_count" in data
        assert "pending_customers" in data
        assert "total_customers" in data
        assert "active_customers" in data
        
        # Verify they are numbers
        assert isinstance(data["pending_orders_count"], int)
        assert isinstance(data["total_customers"], int)
        print(f"✓ Dashboard stats: {data['pending_orders_count']} pending orders, {data['total_customers']} total customers")


class TestAdminCustomers:
    """Admin Customers CRUD operations"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        response = requests.post(f"{BASE_URL}/api/login", json={
            "email": "admin@naturalplylam.com",
            "password": "admin123"
        })
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_list_customers(self):
        """List all customers"""
        response = requests.get(f"{BASE_URL}/api/customers", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Listed {len(data)} customers")
    
    def test_list_customers_paginated(self):
        """List customers with pagination via admin endpoint"""
        response = requests.get(f"{BASE_URL}/api/admin", params={
            "resource": "customers",
            "page": 1,
            "per_page": 5
        }, headers=self.headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "pagination" in data
        assert data["pagination"]["page"] == 1
        print(f"✓ Paginated customers: {len(data['data'])} items, total: {data['pagination']['total']}")
    
    def test_create_customer(self):
        """Create a new customer"""
        unique_email = f"test_customer_{int(time.time())}@example.com"
        response = requests.post(f"{BASE_URL}/api/customers", 
            json={
                "name": "TEST_New Customer Ltd",
                "contactPerson": "Test Person",
                "email": unique_email,
                "phone": "9999999999",
                "pricing_type": 2,
                "credit_limit": 50000
            },
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["data"]["email"] == unique_email
        print(f"✓ Created customer: {data['data']['name']}")
        return data["data"]["id"]
    
    def test_get_customer_detail(self):
        """Get customer detail"""
        customer_id = self.test_create_customer()
        response = requests.get(f"{BASE_URL}/api/customers/{customer_id}", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert data["data"]["id"] == customer_id
        print(f"✓ Got customer detail for ID: {customer_id}")
    
    def test_update_customer(self):
        """Update customer"""
        customer_id = self.test_create_customer()
        response = requests.put(f"{BASE_URL}/api/customers/{customer_id}",
            json={
                "name": "TEST_Updated Customer Name",
                "pricing_type": 3
            },
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["data"]["name"] == "TEST_Updated Customer Name"
        assert data["data"]["pricing_type"] == 3
        print(f"✓ Updated customer ID: {customer_id}")
    
    def test_approve_customer(self):
        """Approve pending customer"""
        # Create a pending customer
        unique_email = f"test_pending_{int(time.time())}@example.com"
        create_resp = requests.post(f"{BASE_URL}/api/customers", 
            json={
                "name": "TEST_Pending Customer",
                "contactPerson": "Pending Person",
                "email": unique_email,
                "phone": "8888888888",
                "approval_status": "Pending"
            },
            headers=self.headers
        )
        customer_id = create_resp.json()["data"]["id"]
        
        # Approve the customer
        response = requests.post(f"{BASE_URL}/api/admin", params={
            "action": "approve_customer"
        }, json={
            "customer_id": customer_id
        }, headers=self.headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"✓ Approved customer ID: {customer_id}")
    
    def test_delete_customer(self):
        """Delete (archive) customer"""
        customer_id = self.test_create_customer()
        response = requests.delete(f"{BASE_URL}/api/customers/{customer_id}", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"✓ Archived customer ID: {customer_id}")


class TestAdminProducts:
    """Admin Products with tier pricing tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        response = requests.post(f"{BASE_URL}/api/login", json={
            "email": "admin@naturalplylam.com",
            "password": "admin123"
        })
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_list_products(self):
        """List all products"""
        response = requests.get(f"{BASE_URL}/api/products", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert "data" in data or "products" in data
        products = data.get("data") or data.get("products") or []
        print(f"✓ Listed {len(products)} products")
    
    def test_product_with_tier_pricing(self):
        """Product has tier pricing (pricing_rates)"""
        response = requests.get(f"{BASE_URL}/api/products/PLY-001", headers=self.headers)
        assert response.status_code == 200
        data = response.json()["data"]
        
        # Check tier pricing
        assert "pricing_rates" in data
        assert "1" in data["pricing_rates"]
        assert "2" in data["pricing_rates"]
        assert "3" in data["pricing_rates"]
        
        # Tier 2 should be less than Tier 1, Tier 3 less than Tier 2
        tier1 = float(data["pricing_rates"]["1"])
        tier2 = float(data["pricing_rates"]["2"])
        tier3 = float(data["pricing_rates"]["3"])
        assert tier1 >= tier2 >= tier3
        print(f"✓ Product tier pricing: Tier1=${tier1}, Tier2=${tier2}, Tier3=${tier3}")
    
    def test_create_product_with_custom_tier_pricing(self):
        """Create product with custom tier pricing"""
        product_name = f"TEST_Product_{int(time.time())}"
        response = requests.post(f"{BASE_URL}/api/products",
            json={
                "name": product_name,
                "category": "Plywood",
                "price": 100,
                "priceUnit": "ea",
                "stock_quantity": 50,
                "pricing_rates": {
                    "1": 100,
                    "2": 90,
                    "3": 80
                }
            },
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["data"]["pricing_rates"]["1"] == 100
        assert data["data"]["pricing_rates"]["2"] == 90
        assert data["data"]["pricing_rates"]["3"] == 80
        print(f"✓ Created product with custom tier pricing: {product_name}")
        return data["data"]["id"]
    
    def test_update_product_tier_pricing(self):
        """Update product tier pricing"""
        product_id = self.test_create_product_with_custom_tier_pricing()
        response = requests.put(f"{BASE_URL}/api/products/{product_id}",
            json={
                "pricing_rates": {
                    "1": 110,
                    "2": 95,
                    "3": 85
                }
            },
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["data"]["pricing_rates"]["1"] == 110
        print(f"✓ Updated product tier pricing for: {product_id}")
    
    def test_delete_product(self):
        """Delete product"""
        product_id = self.test_create_product_with_custom_tier_pricing()
        response = requests.delete(f"{BASE_URL}/api/products/{product_id}", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"✓ Deleted product: {product_id}")


class TestAdminOrders:
    """Admin Orders tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        response = requests.post(f"{BASE_URL}/api/login", json={
            "email": "admin@naturalplylam.com",
            "password": "admin123"
        })
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_list_orders(self):
        """List all orders"""
        response = requests.get(f"{BASE_URL}/api/orders", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Listed {len(data)} orders")
    
    def test_list_orders_paginated(self):
        """List orders with pagination via admin endpoint"""
        response = requests.get(f"{BASE_URL}/api/admin", params={
            "resource": "orders",
            "page": 1,
            "per_page": 5
        }, headers=self.headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "pagination" in data
        print(f"✓ Paginated orders: {len(data['data'])} items")
    
    def test_update_order_status(self):
        """Update order status"""
        # Get first order
        response = requests.get(f"{BASE_URL}/api/orders", headers=self.headers)
        orders = response.json()
        if len(orders) > 0:
            order_id = orders[0]["id"]
            
            # Update status
            response = requests.post(f"{BASE_URL}/api/admin", params={
                "action": "update_order_status"
            }, json={
                "order_id": order_id,
                "status": "Approved"
            }, headers=self.headers)
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] == True
            print(f"✓ Updated order {order_id} status to Approved")
        else:
            print("⚠ No orders to test status update")


class TestAdminInvoices:
    """Admin Invoices tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        response = requests.post(f"{BASE_URL}/api/login", json={
            "email": "admin@naturalplylam.com",
            "password": "admin123"
        })
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_list_invoices(self):
        """List all invoices"""
        response = requests.get(f"{BASE_URL}/api/invoices", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Listed {len(data)} invoices")
    
    def test_list_invoices_paginated(self):
        """List invoices with pagination via admin endpoint"""
        response = requests.get(f"{BASE_URL}/api/admin", params={
            "resource": "invoices",
            "page": 1,
            "per_page": 5
        }, headers=self.headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "pagination" in data
        print(f"✓ Paginated invoices: {len(data['data'])} items")
    
    def test_mark_invoice_paid(self):
        """Mark invoice as paid"""
        response = requests.get(f"{BASE_URL}/api/invoices", headers=self.headers)
        invoices = response.json()
        
        pending_invoice = next((inv for inv in invoices if inv.get("status") != "Paid"), None)
        if pending_invoice:
            response = requests.post(f"{BASE_URL}/api/admin", params={
                "action": "mark_invoice_paid"
            }, json={
                "invoice_id": pending_invoice["id"]
            }, headers=self.headers)
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] == True
            print(f"✓ Marked invoice {pending_invoice['id']} as paid")
        else:
            print("⚠ No pending invoices to test")


class TestCustomerAuthentication:
    """Customer Portal authentication tests"""
    
    def test_customer_login_success(self):
        """Customer login with customer1@example.com / customer123"""
        response = requests.post(f"{BASE_URL}/api/login", json={
            "email": "customer1@example.com",
            "password": "customer123",
            "app_role": "Customer"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == "customer1@example.com"
        assert data["user"]["role"] == "Customer"
        assert data["user"]["approval_status"] == "Approved"
        print("✓ Customer login successful")
        return data["token"]
    
    def test_customer_login_invalid_credentials(self):
        """Customer login with wrong credentials"""
        response = requests.post(f"{BASE_URL}/api/login", json={
            "email": "customer1@example.com",
            "password": "wrongpassword",
            "app_role": "Customer"
        })
        assert response.status_code == 401
        print("✓ Customer invalid login rejected correctly")
    
    def test_get_customer_profile(self):
        """Get customer profile via /me endpoint"""
        token = self.test_customer_login_success()
        response = requests.get(f"{BASE_URL}/api/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "customer1@example.com"
        assert "pricing_type" in data
        print(f"✓ Customer profile retrieved, pricing_type: {data['pricing_type']}")


class TestCustomerDashboard:
    """Customer Dashboard tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        response = requests.post(f"{BASE_URL}/api/login", json={
            "email": "customer1@example.com",
            "password": "customer123",
            "app_role": "Customer"
        })
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_customer_orders(self):
        """Customer dashboard shows customer orders"""
        response = requests.get(f"{BASE_URL}/api/customer/orders", 
            params={"page": 1, "per_page": 10},
            headers=self.headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "pagination" in data
        print(f"✓ Customer has {data['pagination']['total']} orders")
    
    def test_get_customer_invoices(self):
        """Customer dashboard shows customer invoices"""
        response = requests.get(f"{BASE_URL}/api/customer/invoices",
            params={"page": 1, "per_page": 10},
            headers=self.headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        print(f"✓ Customer has {len(data['data'])} invoices")


class TestCustomerProducts:
    """Customer Products with tier-based pricing tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        response = requests.post(f"{BASE_URL}/api/login", json={
            "email": "customer1@example.com",
            "password": "customer123",
            "app_role": "Customer"
        })
        data = response.json()
        self.token = data["token"]
        self.pricing_type = data["user"].get("pricing_type", 1)
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_list_products_for_customer(self):
        """Customer can list products"""
        response = requests.get(f"{BASE_URL}/api/products", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        products = data.get("data") or data.get("products") or []
        assert len(products) > 0
        print(f"✓ Customer sees {len(products)} products")
    
    def test_products_show_tier_pricing(self):
        """Products show tier-based pricing rates"""
        response = requests.get(f"{BASE_URL}/api/products/PLY-001", headers=self.headers)
        assert response.status_code == 200
        data = response.json()["data"]
        
        assert "pricing_rates" in data
        customer_price = data["pricing_rates"].get(str(self.pricing_type))
        print(f"✓ Customer pricing_type: {self.pricing_type}, price for PLY-001: ${customer_price}")


class TestCustomerCart:
    """Customer Cart functionality tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        response = requests.post(f"{BASE_URL}/api/login", json={
            "email": "customer1@example.com",
            "password": "customer123",
            "app_role": "Customer"
        })
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
        
        # Clear cart before tests
        requests.delete(f"{BASE_URL}/api/cart", headers=self.headers)
    
    def test_get_empty_cart(self):
        """Get empty cart"""
        response = requests.get(f"{BASE_URL}/api/cart", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Cart has {len(data)} items")
    
    def test_add_to_cart(self):
        """Add product to cart"""
        response = requests.post(f"{BASE_URL}/api/cart",
            json={
                "product_id": "PLY-001",
                "quantity": 5
            },
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print("✓ Added PLY-001 to cart (qty: 5)")
    
    def test_cart_shows_items(self):
        """Cart shows added items"""
        # Add item first
        requests.post(f"{BASE_URL}/api/cart",
            json={"product_id": "PLY-002", "quantity": 3},
            headers=self.headers
        )
        
        # Get cart
        response = requests.get(f"{BASE_URL}/api/cart", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        
        # Verify item details
        item = data[0]
        assert "product_id" in item
        assert "name" in item
        assert "quantity" in item
        assert "price" in item
        print(f"✓ Cart shows {len(data)} items with correct details")
    
    def test_remove_from_cart(self):
        """Remove item from cart"""
        # Add then remove
        requests.post(f"{BASE_URL}/api/cart",
            json={"product_id": "TIM-001", "quantity": 2},
            headers=self.headers
        )
        
        response = requests.delete(f"{BASE_URL}/api/cart",
            params={"product_id": "TIM-001"},
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print("✓ Removed item from cart")
    
    def test_clear_cart(self):
        """Clear entire cart"""
        # Add items
        requests.post(f"{BASE_URL}/api/cart",
            json={"product_id": "PLY-001", "quantity": 1},
            headers=self.headers
        )
        
        # Clear cart
        response = requests.delete(f"{BASE_URL}/api/cart", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        
        # Verify cart is empty
        cart_resp = requests.get(f"{BASE_URL}/api/cart", headers=self.headers)
        cart_data = cart_resp.json()
        assert len(cart_data) == 0
        print("✓ Cart cleared successfully")


class TestCustomerCheckout:
    """Customer Checkout tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        response = requests.post(f"{BASE_URL}/api/login", json={
            "email": "customer1@example.com",
            "password": "customer123",
            "app_role": "Customer"
        })
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
        
        # Clear cart first
        requests.delete(f"{BASE_URL}/api/cart", headers=self.headers)
    
    def test_checkout_creates_order(self):
        """Checkout creates order from cart items"""
        # Add items to cart
        requests.post(f"{BASE_URL}/api/cart",
            json={"product_id": "PLY-001", "quantity": 2},
            headers=self.headers
        )
        requests.post(f"{BASE_URL}/api/cart",
            json={"product_id": "TIM-001", "quantity": 5},
            headers=self.headers
        )
        
        # Checkout
        response = requests.post(f"{BASE_URL}/api/checkout",
            json={"shipping_address": "Test Address, Mumbai"},
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "order_id" in data
        
        # Verify order was created
        order_resp = requests.get(f"{BASE_URL}/api/customer/orders/{data['order_id']}", 
            headers=self.headers)
        assert order_resp.status_code == 200
        order = order_resp.json()
        assert order["status"] == "Created"
        assert len(order["items"]) == 2
        print(f"✓ Checkout created order: {data['order_id']}")
    
    def test_checkout_empty_cart_fails(self):
        """Checkout with empty cart should fail"""
        response = requests.post(f"{BASE_URL}/api/checkout",
            json={"shipping_address": "Test Address"},
            headers=self.headers
        )
        assert response.status_code == 400
        print("✓ Checkout with empty cart correctly rejected")


class TestCustomerOrders:
    """Customer Orders page tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        response = requests.post(f"{BASE_URL}/api/login", json={
            "email": "customer1@example.com",
            "password": "customer123",
            "app_role": "Customer"
        })
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_customer_orders_list(self):
        """Customer can view their orders"""
        response = requests.get(f"{BASE_URL}/api/customer/orders",
            params={"page": 1, "per_page": 10},
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "pagination" in data
        
        # Verify order structure
        if len(data["data"]) > 0:
            order = data["data"][0]
            assert "id" in order
            assert "status" in order
            assert "amount" in order or "grand_total" in order
        print(f"✓ Customer orders page shows {data['pagination']['total']} orders")
    
    def test_customer_order_detail(self):
        """Customer can view order detail"""
        # Get orders first
        orders_resp = requests.get(f"{BASE_URL}/api/customer/orders", headers=self.headers)
        orders = orders_resp.json()["data"]
        
        if len(orders) > 0:
            order_id = orders[0]["id"]
            response = requests.get(f"{BASE_URL}/api/customer/orders/{order_id}", 
                headers=self.headers)
            assert response.status_code == 200
            order = response.json()
            assert order["id"] == order_id
            assert "items" in order
            print(f"✓ Customer can view order detail: {order_id}")
        else:
            print("⚠ No orders to test detail view")


class TestCustomerProfile:
    """Customer Profile page tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        response = requests.post(f"{BASE_URL}/api/login", json={
            "email": "customer1@example.com",
            "password": "customer123",
            "app_role": "Customer"
        })
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_profile(self):
        """Customer can view profile"""
        response = requests.get(f"{BASE_URL}/api/me", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        # Check profile fields
        assert "email" in data
        assert "name" in data
        assert "phone" in data
        assert "pricing_type" in data
        print(f"✓ Customer profile: {data['name']}, pricing_type: {data['pricing_type']}")
    
    def test_update_profile(self):
        """Customer can update profile"""
        response = requests.patch(f"{BASE_URL}/api/customer/profile",
            json={
                "phone": "9876500001"
            },
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print("✓ Customer profile updated successfully")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
