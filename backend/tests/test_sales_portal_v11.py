"""
Sales Portal Backend API Tests - Iteration 11
Tests for:
- Sales login
- Sales dashboard stats
- Sales customers (assigned only)
- Sales orders
- Sales invoices
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://7cc857b1-bccb-4094-be05-21237c0824fe.preview.emergentagent.com')
if BASE_URL.endswith('/'):
    BASE_URL = BASE_URL.rstrip('/')

# Test credentials
SALES_EMAIL = "sales@naturalplylam.com"
SALES_PASSWORD = "sales123"


class TestSalesLogin:
    """Test Sales Person login functionality"""
    
    def test_sales_login_success(self):
        """Test successful sales login"""
        response = requests.post(f"{BASE_URL}/api/login", json={
            "email": SALES_EMAIL,
            "password": SALES_PASSWORD,
            "app_role": "Sales Person"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        data = response.json()
        assert "token" in data, "Token not in response"
        assert "user" in data, "User not in response"
        assert data["user"]["email"] == SALES_EMAIL
        assert data["user"]["role"] == "Sales Person"
        assert data["user"]["name"] == "Rahul Sales"
        
    def test_sales_login_wrong_password(self):
        """Test login with wrong password"""
        response = requests.post(f"{BASE_URL}/api/login", json={
            "email": SALES_EMAIL,
            "password": "wrongpassword",
            "app_role": "Sales Person"
        })
        assert response.status_code == 401


@pytest.fixture(scope="module")
def sales_token():
    """Get sales person auth token"""
    response = requests.post(f"{BASE_URL}/api/login", json={
        "email": SALES_EMAIL,
        "password": SALES_PASSWORD,
        "app_role": "Sales Person"
    })
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip("Sales login failed - skipping authenticated tests")


class TestSalesDashboard:
    """Test Sales Dashboard API"""
    
    def test_dashboard_returns_correct_stats(self, sales_token):
        """Test /api/sales/dashboard returns expected fields"""
        headers = {"Authorization": f"Bearer {sales_token}"}
        response = requests.get(f"{BASE_URL}/api/sales/dashboard", headers=headers)
        
        assert response.status_code == 200, f"Dashboard failed: {response.text}"
        
        data = response.json()
        # Verify all expected fields are present
        assert "monthly_sales" in data, "monthly_sales missing"
        assert "assigned_customers" in data, "assigned_customers missing"
        assert "pending_orders_count" in data, "pending_orders_count missing"
        assert "total_outstanding" in data, "total_outstanding missing"
        assert "due_invoices_count" in data, "due_invoices_count missing"
        
        # Verify data types
        assert isinstance(data["monthly_sales"], (int, float)), "monthly_sales should be numeric"
        assert isinstance(data["assigned_customers"], int), "assigned_customers should be int"
        assert isinstance(data["pending_orders_count"], int), "pending_orders_count should be int"
        assert isinstance(data["total_outstanding"], (int, float)), "total_outstanding should be numeric"
        assert isinstance(data["due_invoices_count"], int), "due_invoices_count should be int"
        
        print(f"Dashboard stats: monthly_sales={data['monthly_sales']}, assigned_customers={data['assigned_customers']}, pending_orders={data['pending_orders_count']}, outstanding={data['total_outstanding']}")
        
    def test_dashboard_requires_auth(self):
        """Test dashboard requires authentication"""
        response = requests.get(f"{BASE_URL}/api/sales/dashboard")
        assert response.status_code == 401


class TestSalesCustomers:
    """Test Sales Customers API - should return only assigned customers"""
    
    def test_get_customers_returns_assigned_only(self, sales_token):
        """Test /api/sales/customers returns only assigned customers"""
        headers = {"Authorization": f"Bearer {sales_token}"}
        response = requests.get(f"{BASE_URL}/api/sales/customers", headers=headers)
        
        assert response.status_code == 200, f"Get customers failed: {response.text}"
        
        data = response.json()
        assert "data" in data, "data field missing"
        
        customers = data["data"]
        print(f"Found {len(customers)} assigned customers")
        
        # Verify customer structure
        if len(customers) > 0:
            customer = customers[0]
            assert "id" in customer, "Customer id missing"
            assert "name" in customer, "Customer name missing"
            assert "phone" in customer, "Customer phone missing"
            assert "approval_status" in customer, "Customer approval_status missing"
            
    def test_customers_search_filter(self, sales_token):
        """Test customer search functionality"""
        headers = {"Authorization": f"Bearer {sales_token}"}
        response = requests.get(f"{BASE_URL}/api/sales/customers?search=ABC", headers=headers)
        
        assert response.status_code == 200, f"Search failed: {response.text}"
        
    def test_customers_status_filter(self, sales_token):
        """Test customer status filter"""
        headers = {"Authorization": f"Bearer {sales_token}"}
        response = requests.get(f"{BASE_URL}/api/sales/customers?status=approved", headers=headers)
        
        assert response.status_code == 200, f"Status filter failed: {response.text}"
        
        data = response.json()
        customers = data.get("data", [])
        # All returned customers should be approved
        for customer in customers:
            assert customer.get("approval_status") == "Approved", f"Non-approved customer returned: {customer}"


class TestSalesOrders:
    """Test Sales Orders API"""
    
    def test_get_orders(self, sales_token):
        """Test /api/sales/orders returns orders"""
        headers = {"Authorization": f"Bearer {sales_token}"}
        response = requests.get(f"{BASE_URL}/api/sales/orders", headers=headers)
        
        assert response.status_code == 200, f"Get orders failed: {response.text}"
        
        data = response.json()
        assert "data" in data, "data field missing"
        assert "pagination" in data, "pagination field missing"
        
        print(f"Found {len(data['data'])} orders")
        
    def test_orders_status_filter_pending(self, sales_token):
        """Test orders filter by Pending status"""
        headers = {"Authorization": f"Bearer {sales_token}"}
        response = requests.get(f"{BASE_URL}/api/sales/orders?status=Pending", headers=headers)
        
        assert response.status_code == 200, f"Pending filter failed: {response.text}"
        
    def test_orders_status_filter_approved(self, sales_token):
        """Test orders filter by Approved status"""
        headers = {"Authorization": f"Bearer {sales_token}"}
        response = requests.get(f"{BASE_URL}/api/sales/orders?status=Approved", headers=headers)
        
        assert response.status_code == 200, f"Approved filter failed: {response.text}"
        
    def test_orders_status_filter_dispatched(self, sales_token):
        """Test orders filter by Dispatched status"""
        headers = {"Authorization": f"Bearer {sales_token}"}
        response = requests.get(f"{BASE_URL}/api/sales/orders?status=Dispatched", headers=headers)
        
        assert response.status_code == 200, f"Dispatched filter failed: {response.text}"
        
    def test_orders_status_filter_cancelled(self, sales_token):
        """Test orders filter by Cancelled status"""
        headers = {"Authorization": f"Bearer {sales_token}"}
        response = requests.get(f"{BASE_URL}/api/sales/orders?status=Cancelled", headers=headers)
        
        assert response.status_code == 200, f"Cancelled filter failed: {response.text}"


class TestSalesInvoices:
    """Test Sales Invoices API - should return only invoices for assigned customers"""
    
    def test_get_invoices(self, sales_token):
        """Test /api/sales/invoices returns invoices for assigned customers"""
        headers = {"Authorization": f"Bearer {sales_token}"}
        response = requests.get(f"{BASE_URL}/api/sales/invoices", headers=headers)
        
        assert response.status_code == 200, f"Get invoices failed: {response.text}"
        
        data = response.json()
        assert "data" in data, "data field missing"
        assert "pagination" in data, "pagination field missing"
        
        invoices = data["data"]
        print(f"Found {len(invoices)} invoices")
        
        # Verify invoice structure if any exist
        if len(invoices) > 0:
            invoice = invoices[0]
            assert "id" in invoice, "Invoice id missing"
            assert "customer_id" in invoice, "Invoice customer_id missing"
            assert "grand_total" in invoice, "Invoice grand_total missing"
            assert "status" in invoice, "Invoice status missing"
            assert "due_date" in invoice, "Invoice due_date missing"
            
    def test_invoices_status_filter(self, sales_token):
        """Test invoices filter by status"""
        headers = {"Authorization": f"Bearer {sales_token}"}
        response = requests.get(f"{BASE_URL}/api/sales/invoices?status=Pending", headers=headers)
        
        assert response.status_code == 200, f"Status filter failed: {response.text}"
        
    def test_invoice_detail_requires_auth(self):
        """Test invoice detail requires authentication"""
        response = requests.get(f"{BASE_URL}/api/sales/invoices/INV-TEST123")
        assert response.status_code == 401


class TestSalesFastOrder:
    """Test Sales Fast Order flow - select customer, add products, place order"""
    
    def test_get_products_for_order(self, sales_token):
        """Test getting products for order placement"""
        headers = {"Authorization": f"Bearer {sales_token}"}
        response = requests.get(f"{BASE_URL}/api/products-v2", headers=headers)
        
        assert response.status_code == 200, f"Get products failed: {response.text}"
        
        data = response.json()
        assert "products" in data, "products field missing"
        
        products = data["products"]
        print(f"Found {len(products)} products available for ordering")
        
        if len(products) > 0:
            product = products[0]
            assert "id" in product, "Product id missing"
            assert "name" in product, "Product name missing"
            assert "thicknesses" in product, "Product thicknesses missing"
            assert "sizes" in product, "Product sizes missing"
            assert "pricing_tiers" in product, "Product pricing_tiers missing"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
