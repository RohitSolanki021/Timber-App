<?php
/**
 * Sales Portal Routes - MySQL Version
 */

global $routes;

// ==================== SALES DASHBOARD ====================
$routes['GET']['/sales/dashboard'] = function() {
    $payload = verifyToken();
    
    $salesPersonEmail = $payload['user_id'];
    $salesPerson = db()->fetchOne("SELECT id, name FROM users WHERE email = ?", [$salesPersonEmail]);
    $salesPersonId = $salesPerson ? $salesPerson['id'] : null;
    $salesPersonName = $salesPerson ? $salesPerson['name'] : '';
    
    // Get assigned customer IDs
    $customerIds = [];
    if ($salesPersonId) {
        $customers = db()->fetchAll(
            "SELECT id FROM customers WHERE sales_person_id = ?",
            [$salesPersonId]
        );
        $customerIds = array_column($customers, 'id');
    }
    
    $assignedCustomersCount = count($customerIds);
    
    // Orders filter - by sales person or assigned customers
    $orderWhere = "placed_by = ? OR placed_by = ?";
    $orderParams = [$salesPersonName, $salesPersonEmail];
    
    if (!empty($customerIds)) {
        $placeholders = implode(',', array_fill(0, count($customerIds), '?'));
        $orderWhere .= " OR customer_id IN ({$placeholders})";
        $orderParams = array_merge($orderParams, $customerIds);
    }
    
    $totalOrders = db()->fetchOne(
        "SELECT COUNT(*) as cnt FROM orders WHERE {$orderWhere}",
        $orderParams
    )['cnt'];
    
    $pendingOrders = db()->fetchOne(
        "SELECT COUNT(*) as cnt FROM orders WHERE ({$orderWhere}) AND status = 'Pending'",
        $orderParams
    )['cnt'];
    
    // Monthly sales
    $startOfMonth = (new DateTime('first day of this month'))->format('Y-m-d');
    $monthlySales = db()->fetchOne(
        "SELECT COALESCE(SUM(grand_total), 0) as total FROM orders WHERE ({$orderWhere}) AND created_at >= ?",
        array_merge($orderParams, [$startOfMonth])
    )['total'];
    
    // Outstanding invoices for assigned customers
    $totalOutstanding = 0;
    $dueInvoicesCount = 0;
    
    if (!empty($customerIds)) {
        $placeholders = implode(',', array_fill(0, count($customerIds), '?'));
        $invoices = db()->fetchAll(
            "SELECT grand_total FROM invoices WHERE customer_id IN ({$placeholders}) AND status IN ('Pending', 'Overdue')",
            $customerIds
        );
        
        foreach ($invoices as $invoice) {
            $totalOutstanding += (float)$invoice['grand_total'];
            $dueInvoicesCount++;
        }
    }
    
    jsonResponse([
        'monthly_sales' => (float)$monthlySales,
        'new_orders_week' => 0,
        'assigned_customers' => $assignedCustomersCount,
        'pending_orders_count' => (int)$pendingOrders,
        'total_outstanding' => $totalOutstanding,
        'due_invoices_count' => $dueInvoicesCount,
        'total_orders' => (int)$totalOrders
    ]);
};

// ==================== SALES CUSTOMERS ====================
$routes['GET']['/sales/customers'] = function() {
    $payload = verifyToken();
    $params = getQueryParams();
    
    $salesPersonEmail = $payload['user_id'];
    $salesPerson = db()->fetchOne("SELECT id FROM users WHERE email = ?", [$salesPersonEmail]);
    $salesPersonId = $salesPerson ? $salesPerson['id'] : null;
    
    $where = 'sales_person_id = ?';
    $whereParams = [$salesPersonId];
    
    $status = $params['status'] ?? '';
    if ($status && $status !== 'All') {
        $where .= ' AND approval_status = ?';
        $whereParams[] = $status;
    }
    
    $search = $params['search'] ?? '';
    if ($search) {
        $where .= ' AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)';
        $whereParams[] = "%{$search}%";
        $whereParams[] = "%{$search}%";
        $whereParams[] = "%{$search}%";
    }
    
    $customers = db()->fetchAll(
        "SELECT * FROM customers WHERE {$where} ORDER BY name",
        $whereParams
    );
    
    foreach ($customers as &$customer) {
        unset($customer['password'], $customer['mpin']);
        $customer['contactPerson'] = $customer['contact_person'];
    }
    
    jsonResponse(['data' => $customers]);
};

// ==================== SALES ORDERS ====================
$routes['GET']['/sales/orders'] = function() {
    $payload = verifyToken();
    $params = getQueryParams();
    
    $salesPersonEmail = $payload['user_id'];
    $salesPerson = db()->fetchOne("SELECT id, name FROM users WHERE email = ?", [$salesPersonEmail]);
    $salesPersonId = $salesPerson ? $salesPerson['id'] : null;
    $salesPersonName = $salesPerson ? $salesPerson['name'] : '';
    
    // Get assigned customer IDs
    $customerIds = [];
    if ($salesPersonId) {
        $customers = db()->fetchAll(
            "SELECT id FROM customers WHERE sales_person_id = ?",
            [$salesPersonId]
        );
        $customerIds = array_column($customers, 'id');
    }
    
    // Build filter
    $where = "(placed_by = ? OR placed_by = ?";
    $whereParams = [$salesPersonName, $salesPersonEmail];
    
    if (!empty($customerIds)) {
        $placeholders = implode(',', array_fill(0, count($customerIds), '?'));
        $where .= " OR customer_id IN ({$placeholders})";
        $whereParams = array_merge($whereParams, $customerIds);
    }
    $where .= ")";
    
    $status = $params['status'] ?? '';
    if ($status && $status !== 'All') {
        $where .= ' AND status = ?';
        $whereParams[] = $status;
    }
    
    $page = (int)($params['page'] ?? 1);
    $perPage = (int)($params['per_page'] ?? 20);
    $skip = ($page - 1) * $perPage;
    
    $total = db()->fetchOne("SELECT COUNT(*) as cnt FROM orders WHERE {$where}", $whereParams)['cnt'];
    
    $orders = db()->fetchAll(
        "SELECT * FROM orders WHERE {$where} ORDER BY created_at DESC LIMIT ? OFFSET ?",
        array_merge($whereParams, [$perPage, $skip])
    );
    
    foreach ($orders as &$order) {
        $order['items'] = getOrderItems($order['id']);
        $order['customerName'] = $order['customer_name'];
    }
    
    jsonResponse([
        'data' => $orders,
        'pagination' => paginate($page, $perPage, $total)
    ]);
};

// ==================== SALES INVOICES ====================
$routes['GET']['/sales/invoices'] = function() {
    $payload = verifyToken();
    $params = getQueryParams();
    
    $salesPersonEmail = $payload['user_id'];
    $salesPerson = db()->fetchOne("SELECT id FROM users WHERE email = ?", [$salesPersonEmail]);
    $salesPersonId = $salesPerson ? $salesPerson['id'] : null;
    
    // Get assigned customer IDs
    $customerIds = [];
    if ($salesPersonId) {
        $customers = db()->fetchAll(
            "SELECT id FROM customers WHERE sales_person_id = ?",
            [$salesPersonId]
        );
        $customerIds = array_column($customers, 'id');
    }
    
    if (empty($customerIds)) {
        jsonResponse([
            'data' => [],
            'pagination' => paginate(1, 20, 0)
        ]);
        return;
    }
    
    $placeholders = implode(',', array_fill(0, count($customerIds), '?'));
    $where = "customer_id IN ({$placeholders})";
    $whereParams = $customerIds;
    
    $status = $params['status'] ?? '';
    if ($status && $status !== 'All') {
        $where .= ' AND status = ?';
        $whereParams[] = $status;
    }
    
    $page = (int)($params['page'] ?? 1);
    $perPage = (int)($params['per_page'] ?? 20);
    $skip = ($page - 1) * $perPage;
    
    $total = db()->fetchOne("SELECT COUNT(*) as cnt FROM invoices WHERE {$where}", $whereParams)['cnt'];
    
    $invoices = db()->fetchAll(
        "SELECT * FROM invoices WHERE {$where} ORDER BY created_at DESC LIMIT ? OFFSET ?",
        array_merge($whereParams, [$perPage, $skip])
    );
    
    foreach ($invoices as &$invoice) {
        $invoice['items'] = getInvoiceItems($invoice['id']);
        $invoice['customerName'] = $invoice['customer_name'];
    }
    
    jsonResponse([
        'data' => $invoices,
        'pagination' => paginate($page, $perPage, $total)
    ]);
};

// ==================== SALES INVOICE DETAIL ====================
$routes['GET']['/sales/invoices/{id}'] = function($id) {
    $payload = verifyToken();
    
    $salesPersonEmail = $payload['user_id'];
    $salesPerson = db()->fetchOne("SELECT id FROM users WHERE email = ?", [$salesPersonEmail]);
    $salesPersonId = $salesPerson ? $salesPerson['id'] : null;
    
    // Get assigned customer IDs
    $customerIds = [];
    if ($salesPersonId) {
        $customers = db()->fetchAll(
            "SELECT id FROM customers WHERE sales_person_id = ?",
            [$salesPersonId]
        );
        $customerIds = array_column($customers, 'id');
    }
    
    $invoice = db()->fetchOne("SELECT * FROM invoices WHERE id = ?", [$id]);
    if (!$invoice) {
        errorResponse('Invoice not found', 404);
    }
    
    // Verify this invoice belongs to an assigned customer
    if (!in_array($invoice['customer_id'], $customerIds)) {
        errorResponse('Access denied', 403);
    }
    
    $invoice['items'] = getInvoiceItems($id);
    $invoice['customerName'] = $invoice['customer_name'];
    
    // Get customer details
    $customer = db()->fetchOne("SELECT * FROM customers WHERE id = ?", [$invoice['customer_id']]);
    if ($customer) {
        $invoice['customer'] = [
            'name' => $customer['name'],
            'business_name' => $customer['business_name'],
            'email' => $customer['email'],
            'phone' => $customer['phone'],
            'gst_number' => $customer['gst_number'],
            'address' => $customer['address'],
            'city' => $customer['city'],
            'state' => $customer['state'],
            'pincode' => $customer['pincode']
        ];
    }
    
    jsonResponse(['invoice' => $invoice, 'data' => $invoice]);
};
