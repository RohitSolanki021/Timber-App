<?php
/**
 * Admin Routes - MySQL Version
 */

global $routes;

// ==================== ADMIN DASHBOARD ====================
$routes['GET']['/admin/dashboard'] = function() {
    requireRole(['Super Admin', 'Admin', 'Manager']);
    
    // Order counts
    $totalOrders = db()->count('orders');
    $pendingOrders = db()->count('orders', 'status = ?', ['Pending']);
    $plywoodOrders = db()->count('orders', 'order_type = ?', ['Plywood']);
    $timberOrders = db()->count('orders', 'order_type = ?', ['Timber']);
    
    // Customer counts
    $totalCustomers = db()->count('customers');
    $pendingApprovals = db()->count('customers', 'approval_status = ?', ['Pending']);
    
    // Invoice counts
    $pendingInvoices = db()->count('invoices', 'status = ?', ['Pending']);
    
    // Latest plywood orders
    $latestPlywood = db()->fetchAll(
        "SELECT * FROM orders WHERE order_type = 'Plywood' ORDER BY created_at DESC LIMIT 5"
    );
    foreach ($latestPlywood as &$order) {
        $order['items'] = getOrderItems($order['id']);
        $order['customerName'] = $order['customer_name'];
    }
    
    // Latest timber orders
    $latestTimber = db()->fetchAll(
        "SELECT * FROM orders WHERE order_type = 'Timber' ORDER BY created_at DESC LIMIT 5"
    );
    foreach ($latestTimber as &$order) {
        $order['items'] = getOrderItems($order['id']);
        $order['customerName'] = $order['customer_name'];
    }
    
    // Pending plywood orders
    $pendingPlywood = db()->fetchAll(
        "SELECT * FROM orders WHERE order_type = 'Plywood' AND status = 'Pending' ORDER BY created_at DESC LIMIT 10"
    );
    foreach ($pendingPlywood as &$order) {
        $order['items'] = getOrderItems($order['id']);
        $order['customerName'] = $order['customer_name'];
    }
    
    // Pending timber orders
    $pendingTimber = db()->fetchAll(
        "SELECT * FROM orders WHERE order_type = 'Timber' AND status = 'Pending' ORDER BY created_at DESC LIMIT 10"
    );
    foreach ($pendingTimber as &$order) {
        $order['items'] = getOrderItems($order['id']);
        $order['customerName'] = $order['customer_name'];
    }
    
    jsonResponse([
        'total_orders' => $totalOrders,
        'pending_orders' => $pendingOrders,
        'total_customers' => $totalCustomers,
        'pending_approvals' => $pendingApprovals,
        'plywood_orders_count' => $plywoodOrders,
        'timber_orders_count' => $timberOrders,
        'latest_plywood_orders' => $latestPlywood,
        'latest_timber_orders' => $latestTimber,
        'pending_plywood_orders' => $pendingPlywood,
        'pending_timber_orders' => $pendingTimber,
        'pending_invoices' => $pendingInvoices
    ]);
};

// ==================== BANNERS ====================
$routes['GET']['/banners'] = function() {
    $banners = db()->fetchAll(
        "SELECT * FROM banners WHERE is_active = 1 ORDER BY display_order ASC"
    );
    jsonResponse(['banners' => $banners]);
};

$routes['GET']['/admin/banners'] = function() {
    requireRole(['Super Admin', 'Admin']);
    
    $banners = db()->fetchAll("SELECT * FROM banners ORDER BY display_order ASC");
    jsonResponse(['banners' => $banners]);
};

$routes['POST']['/admin/banners'] = function() {
    requireRole(['Super Admin', 'Admin']);
    $data = getRequestBody();
    
    $bannerId = generateId('BNR');
    
    db()->insert('banners', [
        'id' => $bannerId,
        'title' => $data['title'] ?? '',
        'description' => $data['description'] ?? null,
        'image_url' => $data['image_url'] ?? null,
        'link_url' => $data['link_url'] ?? null,
        'is_active' => isset($data['is_active']) ? (int)$data['is_active'] : 1,
        'display_order' => (int)($data['display_order'] ?? 0),
        'created_at' => getCurrentTimestamp(),
        'updated_at' => getCurrentTimestamp()
    ]);
    
    $banner = db()->fetchOne("SELECT * FROM banners WHERE id = ?", [$bannerId]);
    
    jsonResponse(['success' => true, 'banner' => $banner], 201);
};

$routes['PUT']['/admin/banners/{id}'] = function($id) {
    requireRole(['Super Admin', 'Admin']);
    $data = getRequestBody();
    
    $banner = db()->fetchOne("SELECT id FROM banners WHERE id = ?", [$id]);
    if (!$banner) {
        errorResponse('Banner not found', 404);
    }
    
    $updateData = ['updated_at' => getCurrentTimestamp()];
    $allowedFields = ['title', 'description', 'image_url', 'link_url', 'is_active', 'display_order'];
    
    foreach ($allowedFields as $field) {
        if (isset($data[$field])) {
            $updateData[$field] = $data[$field];
        }
    }
    
    db()->update('banners', $updateData, 'id = ?', [$id]);
    
    $banner = db()->fetchOne("SELECT * FROM banners WHERE id = ?", [$id]);
    jsonResponse(['success' => true, 'banner' => $banner]);
};

$routes['DELETE']['/admin/banners/{id}'] = function($id) {
    requireRole(['Super Admin', 'Admin']);
    
    $result = db()->delete('banners', 'id = ?', [$id]);
    
    if ($result === 0) {
        errorResponse('Banner not found', 404);
    }
    
    jsonResponse(['success' => true, 'message' => 'Banner deleted']);
};

// ==================== USERS/STAFF MANAGEMENT ====================
$routes['GET']['/admin/users'] = function() {
    requireRole(['Super Admin']);
    
    $users = db()->fetchAll(
        "SELECT id, email, name, role, phone, is_active, created_at, updated_at 
         FROM users 
         WHERE role IN ('Admin', 'Sales Person', 'Manager')
         ORDER BY created_at DESC"
    );
    
    jsonResponse(['users' => $users]);
};

$routes['GET']['/admin/users/{id}'] = function($id) {
    requireRole(['Super Admin']);
    
    $user = db()->fetchOne(
        "SELECT id, email, name, role, phone, is_active, created_at, updated_at 
         FROM users WHERE id = ?",
        [(int)$id]
    );
    
    if (!$user) {
        errorResponse('User not found', 404);
    }
    
    jsonResponse(['user' => $user]);
};

$routes['POST']['/admin/users'] = function() {
    requireRole(['Super Admin']);
    $data = getRequestBody();
    
    $email = strtolower(trim($data['email'] ?? ''));
    
    $existing = db()->fetchOne("SELECT id FROM users WHERE email = ?", [$email]);
    if ($existing) {
        errorResponse('User with this email already exists', 400);
    }
    
    db()->insert('users', [
        'email' => $email,
        'password' => hashPassword($data['password'] ?? 'password123'),
        'name' => $data['name'] ?? '',
        'role' => $data['role'] ?? 'Admin',
        'phone' => $data['phone'] ?? null,
        'is_active' => 1,
        'created_at' => getCurrentTimestamp(),
        'updated_at' => getCurrentTimestamp()
    ]);
    
    $user = db()->fetchOne(
        "SELECT id, email, name, role, phone, is_active FROM users WHERE email = ?",
        [$email]
    );
    
    jsonResponse(['success' => true, 'user' => $user], 201);
};

$routes['PUT']['/admin/users/{id}'] = function($id) {
    requireRole(['Super Admin']);
    $data = getRequestBody();
    
    $user = db()->fetchOne("SELECT id FROM users WHERE id = ?", [(int)$id]);
    if (!$user) {
        errorResponse('User not found', 404);
    }
    
    $updateData = ['updated_at' => getCurrentTimestamp()];
    $allowedFields = ['name', 'role', 'phone', 'is_active'];
    
    foreach ($allowedFields as $field) {
        if (isset($data[$field])) {
            $updateData[$field] = $data[$field];
        }
    }
    
    if (!empty($data['password'])) {
        $updateData['password'] = hashPassword($data['password']);
    }
    
    db()->update('users', $updateData, 'id = ?', [(int)$id]);
    
    $user = db()->fetchOne(
        "SELECT id, email, name, role, phone, is_active FROM users WHERE id = ?",
        [(int)$id]
    );
    
    jsonResponse(['success' => true, 'user' => $user]);
};

$routes['DELETE']['/admin/users/{id}'] = function($id) {
    requireRole(['Super Admin']);
    
    // Prevent deleting the main admin
    $user = db()->fetchOne("SELECT email FROM users WHERE id = ?", [(int)$id]);
    if ($user && $user['email'] === 'admin@naturalplylam.com') {
        errorResponse('Cannot delete the main admin account', 400);
    }
    
    $result = db()->delete('users', 'id = ?', [(int)$id]);
    
    if ($result === 0) {
        errorResponse('User not found', 404);
    }
    
    jsonResponse(['success' => true, 'message' => 'User deleted']);
};

// ==================== SALES PERSONS LIST ====================
$routes['GET']['/sales-persons'] = function() {
    verifyToken();
    
    $salesPersons = db()->fetchAll(
        "SELECT id, email, name, phone FROM users WHERE role = 'Sales Person' AND is_active = 1 ORDER BY name"
    );
    
    jsonResponse(['data' => $salesPersons]);
};
