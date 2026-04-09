<?php
/**
 * Customer Routes - MySQL Version
 */

global $routes;

// ==================== CUSTOMERS ====================
$routes['GET']['/customers'] = function() {
    verifyToken();
    $params = getQueryParams();
    
    $page = (int)($params['page'] ?? 1);
    $perPage = (int)($params['per_page'] ?? 20);
    $status = $params['status'] ?? '';
    $search = $params['search'] ?? '';
    $salesPersonId = $params['sales_person_id'] ?? '';
    
    $where = '1=1';
    $whereParams = [];
    
    if ($status) {
        $where .= ' AND approval_status = ?';
        $whereParams[] = $status;
    }
    
    if ($search) {
        $where .= ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ? OR business_name LIKE ?)';
        $whereParams[] = "%{$search}%";
        $whereParams[] = "%{$search}%";
        $whereParams[] = "%{$search}%";
        $whereParams[] = "%{$search}%";
    }
    
    if ($salesPersonId) {
        $where .= ' AND sales_person_id = ?';
        $whereParams[] = (int)$salesPersonId;
    }
    
    $total = db()->fetchOne("SELECT COUNT(*) as cnt FROM customers WHERE {$where}", $whereParams)['cnt'];
    $skip = ($page - 1) * $perPage;
    
    $customers = db()->fetchAll(
        "SELECT * FROM customers WHERE {$where} ORDER BY created_at DESC LIMIT ? OFFSET ?",
        array_merge($whereParams, [$perPage, $skip])
    );
    
    // Remove sensitive data
    foreach ($customers as &$customer) {
        unset($customer['password'], $customer['mpin']);
        $customer['contactPerson'] = $customer['contact_person'];
    }
    
    jsonResponse([
        'data' => $customers,
        'pagination' => paginate($page, $perPage, $total)
    ]);
};

$routes['GET']['/customers/{id}'] = function($id) {
    verifyToken();
    
    $customer = db()->fetchOne("SELECT * FROM customers WHERE id = ?", [(int)$id]);
    if (!$customer) {
        errorResponse('Customer not found', 404);
    }
    
    unset($customer['password'], $customer['mpin']);
    $customer['contactPerson'] = $customer['contact_person'];
    
    jsonResponse($customer);
};

$routes['POST']['/customers'] = function() {
    $payload = requireRole(['Super Admin', 'Admin', 'Sales Person']);
    $data = getRequestBody();
    
    $email = strtolower(trim($data['email'] ?? ''));
    
    $existing = db()->fetchOne("SELECT id FROM customers WHERE email = ?", [$email]);
    if ($existing) {
        errorResponse('Customer with this email already exists', 400);
    }
    
    // Get sales person info if applicable
    $salesPersonId = null;
    $salesPersonName = null;
    if (!empty($data['sales_person_id'])) {
        $salesPerson = db()->fetchOne("SELECT id, name FROM users WHERE id = ?", [(int)$data['sales_person_id']]);
        if ($salesPerson) {
            $salesPersonId = $salesPerson['id'];
            $salesPersonName = $salesPerson['name'];
        }
    }
    
    $customerId = db()->insert('customers', [
        'email' => $email,
        'password' => hashPassword($data['password'] ?? 'customer123'),
        'name' => $data['name'] ?? '',
        'business_name' => $data['business_name'] ?? $data['name'] ?? '',
        'contact_person' => $data['contactPerson'] ?? '',
        'phone' => $data['phone'] ?? '',
        'gst_number' => $data['gst_number'] ?? null,
        'address' => $data['address'] ?? null,
        'city' => $data['city'] ?? null,
        'state' => $data['state'] ?? null,
        'pincode' => $data['pincode'] ?? null,
        'pricing_tier' => (int)($data['pricing_tier'] ?? 1),
        'outstanding_balance' => 0,
        'credit_limit' => (float)($data['credit_limit'] ?? 50000),
        'approval_status' => $data['approval_status'] ?? 'Approved',
        'is_active' => 1,
        'sales_person_id' => $salesPersonId,
        'sales_person_name' => $salesPersonName,
        'notes' => $data['notes'] ?? null,
        'created_at' => getCurrentTimestamp(),
        'updated_at' => getCurrentTimestamp()
    ]);
    
    $customer = db()->fetchOne("SELECT * FROM customers WHERE id = ?", [$customerId]);
    unset($customer['password'], $customer['mpin']);
    $customer['contactPerson'] = $customer['contact_person'];
    
    jsonResponse(['success' => true, 'customer' => $customer], 201);
};

$routes['PUT']['/customers/{id}'] = function($id) {
    requireRole(['Super Admin', 'Admin', 'Sales Person']);
    $data = getRequestBody();
    
    $customer = db()->fetchOne("SELECT id FROM customers WHERE id = ?", [(int)$id]);
    if (!$customer) {
        errorResponse('Customer not found', 404);
    }
    
    $updateData = ['updated_at' => getCurrentTimestamp()];
    
    $allowedFields = [
        'name', 'business_name', 'phone', 'gst_number', 'address', 
        'city', 'state', 'pincode', 'pricing_tier', 'credit_limit',
        'approval_status', 'is_active', 'notes'
    ];
    
    foreach ($allowedFields as $field) {
        if (isset($data[$field])) {
            $updateData[$field] = $data[$field];
        }
    }
    
    if (isset($data['contactPerson'])) {
        $updateData['contact_person'] = $data['contactPerson'];
    }
    
    // Update sales person if provided
    if (isset($data['sales_person_id'])) {
        $salesPerson = db()->fetchOne("SELECT id, name FROM users WHERE id = ?", [(int)$data['sales_person_id']]);
        if ($salesPerson) {
            $updateData['sales_person_id'] = $salesPerson['id'];
            $updateData['sales_person_name'] = $salesPerson['name'];
        }
    }
    
    db()->update('customers', $updateData, 'id = ?', [(int)$id]);
    
    $customer = db()->fetchOne("SELECT * FROM customers WHERE id = ?", [(int)$id]);
    unset($customer['password'], $customer['mpin']);
    $customer['contactPerson'] = $customer['contact_person'];
    
    jsonResponse(['success' => true, 'customer' => $customer]);
};

$routes['PUT']['/admin/customers/{id}'] = function($id) {
    requireRole(['Super Admin', 'Admin']);
    $data = getRequestBody();
    
    $customer = db()->fetchOne("SELECT id FROM customers WHERE id = ?", [(int)$id]);
    if (!$customer) {
        errorResponse('Customer not found', 404);
    }
    
    $updateData = ['updated_at' => getCurrentTimestamp()];
    
    $allowedFields = [
        'name', 'business_name', 'phone', 'gst_number', 'address', 
        'city', 'state', 'pincode', 'pricing_tier', 'credit_limit',
        'approval_status', 'is_active', 'notes', 'pricing_type'
    ];
    
    foreach ($allowedFields as $field) {
        if (isset($data[$field])) {
            $updateData[$field] = $data[$field];
        }
    }
    
    if (isset($data['contactPerson'])) {
        $updateData['contact_person'] = $data['contactPerson'];
    }
    
    if (isset($data['sales_person_id'])) {
        $salesPerson = db()->fetchOne("SELECT id, name FROM users WHERE id = ?", [(int)$data['sales_person_id']]);
        if ($salesPerson) {
            $updateData['sales_person_id'] = $salesPerson['id'];
            $updateData['sales_person_name'] = $salesPerson['name'];
        }
    }
    
    db()->update('customers', $updateData, 'id = ?', [(int)$id]);
    
    $customer = db()->fetchOne("SELECT * FROM customers WHERE id = ?", [(int)$id]);
    unset($customer['password'], $customer['mpin']);
    $customer['contactPerson'] = $customer['contact_person'];
    
    jsonResponse(['success' => true, 'customer' => $customer]);
};

$routes['POST']['/customers/{id}/approve'] = function($id) {
    requireRole(['Super Admin', 'Admin']);
    
    $result = db()->update('customers', [
        'approval_status' => 'Approved',
        'updated_at' => getCurrentTimestamp()
    ], 'id = ?', [(int)$id]);
    
    if ($result === 0) {
        errorResponse('Customer not found', 404);
    }
    
    jsonResponse(['success' => true, 'message' => 'Customer approved']);
};

$routes['POST']['/admin/customers/approve'] = function() {
    requireRole(['Super Admin', 'Admin']);
    $data = getRequestBody();
    
    $customerId = $data['customer_id'] ?? 0;
    
    $result = db()->update('customers', [
        'approval_status' => 'Approved',
        'updated_at' => getCurrentTimestamp()
    ], 'id = ?', [(int)$customerId]);
    
    if ($result === 0) {
        errorResponse('Customer not found', 404);
    }
    
    jsonResponse(['success' => true, 'message' => 'Customer approved']);
};

$routes['DELETE']['/customers/{id}'] = function($id) {
    requireRole(['Super Admin', 'Admin']);
    
    $result = db()->delete('customers', 'id = ?', [(int)$id]);
    
    if ($result === 0) {
        errorResponse('Customer not found', 404);
    }
    
    jsonResponse(['success' => true, 'message' => 'Customer deleted']);
};

// Customer balance update
$routes['PUT']['/customers/{id}/balance'] = function($id) {
    requireRole(['Super Admin', 'Admin']);
    $data = getRequestBody();
    
    $customer = db()->fetchOne("SELECT id FROM customers WHERE id = ?", [(int)$id]);
    if (!$customer) {
        errorResponse('Customer not found', 404);
    }
    
    $amount = (float)($data['amount'] ?? 0);
    $action = $data['action'] ?? 'add'; // 'add' or 'subtract'
    
    if ($action === 'subtract') {
        db()->query(
            "UPDATE customers SET outstanding_balance = outstanding_balance - ? WHERE id = ?",
            [$amount, (int)$id]
        );
    } else {
        db()->query(
            "UPDATE customers SET outstanding_balance = outstanding_balance + ? WHERE id = ?",
            [$amount, (int)$id]
        );
    }
    
    $customer = db()->fetchOne("SELECT outstanding_balance FROM customers WHERE id = ?", [(int)$id]);
    
    jsonResponse(['success' => true, 'new_balance' => (float)$customer['outstanding_balance']]);
};
