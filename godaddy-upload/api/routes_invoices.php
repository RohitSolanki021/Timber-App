<?php
/**
 * Invoice Routes - MySQL Version
 */

global $routes;

// ==================== INVOICES ====================
$routes['GET']['/invoices/v2'] = function() {
    verifyToken();
    $params = getQueryParams();
    
    $page = (int)($params['page'] ?? 1);
    $perPage = (int)($params['per_page'] ?? 20);
    $status = $params['status'] ?? '';
    $customerId = $params['customer_id'] ?? '';
    $orderType = $params['order_type'] ?? '';
    $search = $params['search'] ?? '';
    
    $where = '1=1';
    $whereParams = [];
    
    if ($status) {
        $where .= ' AND status = ?';
        $whereParams[] = $status;
    }
    
    if ($customerId) {
        $where .= ' AND customer_id = ?';
        $whereParams[] = (int)$customerId;
    }
    
    if ($orderType && $orderType !== 'all') {
        $where .= ' AND order_type = ?';
        $whereParams[] = $orderType;
    }
    
    if ($search) {
        $where .= ' AND (id LIKE ? OR customer_name LIKE ?)';
        $whereParams[] = "%{$search}%";
        $whereParams[] = "%{$search}%";
    }
    
    $total = db()->fetchOne("SELECT COUNT(*) as cnt FROM invoices WHERE {$where}", $whereParams)['cnt'];
    $skip = ($page - 1) * $perPage;
    
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

$routes['GET']['/invoices/v2/{id}'] = function($id) {
    verifyToken();
    
    $invoice = db()->fetchOne("SELECT * FROM invoices WHERE id = ?", [$id]);
    if (!$invoice) {
        errorResponse('Invoice not found', 404);
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

$routes['PUT']['/invoices/{id}'] = function($id) {
    requireRole(['Super Admin', 'Admin']);
    $data = getRequestBody();
    
    $invoice = db()->fetchOne("SELECT * FROM invoices WHERE id = ?", [$id]);
    if (!$invoice) {
        errorResponse('Invoice not found', 404);
    }
    
    $updateData = ['updated_at' => getCurrentTimestamp()];
    
    if (isset($data['status'])) {
        $updateData['status'] = $data['status'];
        
        // If marking as paid, update customer balance
        if ($data['status'] === 'Paid' && $invoice['status'] !== 'Paid') {
            $updateData['paid_date'] = getCurrentTimestamp();
            db()->query(
                "UPDATE customers SET outstanding_balance = outstanding_balance - ? WHERE id = ?",
                [$invoice['grand_total'], $invoice['customer_id']]
            );
        }
    }
    
    if (isset($data['notes'])) {
        $updateData['notes'] = $data['notes'];
    }
    
    db()->update('invoices', $updateData, 'id = ?', [$id]);
    
    jsonResponse(['success' => true, 'message' => 'Invoice updated']);
};

$routes['POST']['/invoices/v2/{id}/mark-paid'] = function($id) {
    requireRole(['Super Admin', 'Admin']);
    
    $invoice = db()->fetchOne("SELECT * FROM invoices WHERE id = ?", [$id]);
    if (!$invoice) {
        errorResponse('Invoice not found', 404);
    }
    
    if ($invoice['status'] === 'Paid') {
        errorResponse('Invoice is already paid', 400);
    }
    
    db()->update('invoices', [
        'status' => 'Paid',
        'paid_date' => getCurrentTimestamp(),
        'updated_at' => getCurrentTimestamp()
    ], 'id = ?', [$id]);
    
    // Update customer balance
    db()->query(
        "UPDATE customers SET outstanding_balance = outstanding_balance - ? WHERE id = ?",
        [$invoice['grand_total'], $invoice['customer_id']]
    );
    
    jsonResponse(['success' => true, 'message' => 'Invoice marked as paid']);
};

// Customer-specific invoice endpoints
$routes['GET']['/customer/invoices'] = function() {
    $payload = verifyToken();
    $params = getQueryParams();
    
    $userId = $payload['user_id'] ?? '';
    
    if (strpos($userId, 'customer_') === 0) {
        $customerId = (int)str_replace('customer_', '', $userId);
    } else {
        $customer = db()->fetchOne("SELECT id FROM customers WHERE email = ?", [$userId]);
        if (!$customer) {
            errorResponse('Customer not found', 404);
        }
        $customerId = $customer['id'];
    }
    
    $page = (int)($params['page'] ?? 1);
    $perPage = (int)($params['per_page'] ?? 10);
    $status = $params['status'] ?? '';
    
    $where = 'customer_id = ?';
    $whereParams = [$customerId];
    
    if ($status && $status !== 'all' && $status !== 'All') {
        $where .= ' AND status = ?';
        $whereParams[] = $status;
    }
    
    $total = db()->fetchOne("SELECT COUNT(*) as cnt FROM invoices WHERE {$where}", $whereParams)['cnt'];
    $skip = ($page - 1) * $perPage;
    
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

$routes['GET']['/customer/invoices/{id}'] = function($id) {
    $payload = verifyToken();
    $userId = $payload['user_id'] ?? '';
    
    if (strpos($userId, 'customer_') === 0) {
        $customerId = (int)str_replace('customer_', '', $userId);
    } else {
        $customer = db()->fetchOne("SELECT id FROM customers WHERE email = ?", [$userId]);
        if (!$customer) {
            errorResponse('Customer not found', 404);
        }
        $customerId = $customer['id'];
    }
    
    $invoice = db()->fetchOne("SELECT * FROM invoices WHERE id = ? AND customer_id = ?", [$id, $customerId]);
    if (!$invoice) {
        errorResponse('Invoice not found', 404);
    }
    
    $invoice['items'] = getInvoiceItems($id);
    $invoice['customerName'] = $invoice['customer_name'];
    
    jsonResponse(['invoice' => $invoice, 'data' => $invoice]);
};
