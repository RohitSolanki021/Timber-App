<?php
/**
 * Natural Plylam B2B API - Main Router
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../helpers.php';

// Get request info
$requestUri = $_SERVER['REQUEST_URI'];
$requestMethod = $_SERVER['REQUEST_METHOD'];

// Parse the path - remove /api prefix and query string
$path = parse_url($requestUri, PHP_URL_PATH);
$path = preg_replace('/^\/api/', '', $path);
$path = rtrim($path, '/');

// Route handlers
$routes = [];

// Health check
$routes['GET']['/health'] = function() {
    jsonResponse([
        'status' => 'ok',
        'timestamp' => getCurrentTimestamp()
    ]);
};

// ==================== AUTH ====================
$routes['POST']['/login'] = function() {
    $data = getRequestBody();
    $email = $data['email'] ?? '';
    $password = $data['password'] ?? '';
    $appRole = $data['app_role'] ?? '';
    
    if (empty($email) || empty($password)) {
        errorResponse('Email and password required', 400);
    }
    
    $users = getCollection('users');
    $user = $users->findOne(['email' => strtolower($email)]);
    
    if (!$user) {
        errorResponse('Invalid credentials', 401);
    }
    
    $hashedPassword = hashPassword($password);
    if ($user['password'] !== $hashedPassword) {
        errorResponse('Invalid credentials', 401);
    }
    
    // Check role if specified
    if ($appRole && strtolower($user['role']) !== strtolower($appRole)) {
        errorResponse('Access denied for this portal', 403);
    }
    
    $token = generateToken([
        'user_id' => $user['email'],
        'role' => $user['role'],
        'name' => $user['name'] ?? ''
    ]);
    
    jsonResponse([
        'token' => $token,
        'user' => [
            'email' => $user['email'],
            'name' => $user['name'] ?? '',
            'role' => $user['role']
        ]
    ]);
};

$routes['GET']['/me'] = function() {
    $payload = verifyToken();
    $users = getCollection('users');
    $user = $users->findOne(['email' => $payload['user_id']], ['projection' => ['_id' => 0, 'password' => 0]]);
    
    if (!$user) {
        errorResponse('User not found', 404);
    }
    
    jsonResponse(documentToArray($user));
};

// ==================== CUSTOMERS ====================
$routes['GET']['/customers'] = function() {
    verifyToken();
    $params = getQueryParams();
    $page = (int)($params['page'] ?? 1);
    $perPage = (int)($params['per_page'] ?? 20);
    $status = $params['status'] ?? '';
    $search = $params['search'] ?? '';
    
    $filter = [];
    if ($status) $filter['approval_status'] = $status;
    if ($search) {
        $filter['$or'] = [
            ['name' => ['$regex' => $search, '$options' => 'i']],
            ['email' => ['$regex' => $search, '$options' => 'i']],
            ['phone' => ['$regex' => $search, '$options' => 'i']]
        ];
    }
    
    $customers = getCollection('customers');
    $total = $customers->countDocuments($filter);
    $skip = ($page - 1) * $perPage;
    
    $cursor = $customers->find($filter, [
        'projection' => ['_id' => 0],
        'skip' => $skip,
        'limit' => $perPage,
        'sort' => ['created_at' => -1]
    ]);
    
    jsonResponse([
        'data' => documentsToArray($cursor),
        'pagination' => [
            'page' => $page,
            'per_page' => $perPage,
            'total' => $total,
            'total_pages' => ceil($total / $perPage)
        ]
    ]);
};

$routes['POST']['/customers'] = function() {
    $payload = requireRole(['Super Admin', 'Admin', 'Sales Person']);
    $data = getRequestBody();
    
    $customers = getCollection('customers');
    
    // Check if email exists
    $existing = $customers->findOne(['email' => strtolower($data['email'] ?? '')]);
    if ($existing) {
        errorResponse('Customer with this email already exists', 400);
    }
    
    // Get next customer ID
    $lastCustomer = $customers->findOne([], ['sort' => ['id' => -1]]);
    $nextId = ($lastCustomer['id'] ?? 0) + 1;
    
    $customer = [
        'id' => $nextId,
        'name' => $data['name'] ?? '',
        'email' => strtolower($data['email'] ?? ''),
        'phone' => $data['phone'] ?? '',
        'business_name' => $data['business_name'] ?? '',
        'address' => $data['address'] ?? '',
        'pricing_tier' => (int)($data['pricing_tier'] ?? 1),
        'pricing_type' => (int)($data['pricing_type'] ?? $data['pricing_tier'] ?? 1),
        'approval_status' => $data['approval_status'] ?? 'Pending',
        'outstanding_balance' => 0,
        'sales_person_id' => $data['sales_person_id'] ?? null,
        'created_at' => getCurrentTimestamp(),
        'updated_at' => getCurrentTimestamp()
    ];
    
    // Create user account for customer
    $users = getCollection('users');
    $existingUser = $users->findOne(['email' => $customer['email']]);
    if (!$existingUser) {
        $users->insertOne([
            'email' => $customer['email'],
            'password' => hashPassword($data['password'] ?? 'customer123'),
            'name' => $customer['name'],
            'role' => 'Customer',
            'phone' => $customer['phone'],
            'pricing_type' => $customer['pricing_type'],
            'mpin' => $data['mpin'] ?? '1234',
            'created_at' => getCurrentTimestamp()
        ]);
    }
    
    $customers->insertOne($customer);
    unset($customer['_id']);
    
    jsonResponse(['success' => true, 'customer' => $customer], 201);
};

// ==================== PRODUCTS V2 ====================
$routes['GET']['/products-v2'] = function() {
    $params = getQueryParams();
    $group = $params['group'] ?? '';
    
    $filter = [];
    if ($group) $filter['group'] = $group;
    
    $products = getCollection('products_v2');
    $cursor = $products->find($filter, [
        'projection' => ['_id' => 0],
        'sort' => ['name' => 1]
    ]);
    
    jsonResponse(['products' => documentsToArray($cursor)]);
};

$routes['POST']['/admin/products-v2'] = function() {
    requireRole(['Super Admin', 'Admin']);
    $data = getRequestBody();
    
    $products = getCollection('products_v2');
    
    $product = [
        'id' => generateId('PRD'),
        'name' => $data['name'] ?? '',
        'group' => $data['group'] ?? 'Plywood',
        'description' => $data['description'] ?? '',
        'thicknesses' => $data['thicknesses'] ?? [],
        'sizes' => $data['sizes'] ?? [],
        'pricing_tiers' => $data['pricing_tiers'] ?? [],
        'base_price' => (float)($data['base_price'] ?? 0),
        'is_active' => true,
        'images' => [],
        'created_at' => getCurrentTimestamp(),
        'updated_at' => getCurrentTimestamp()
    ];
    
    $products->insertOne($product);
    unset($product['_id']);
    
    jsonResponse(['success' => true, 'product' => $product], 201);
};

// ==================== ORDERS V2 ====================
$routes['GET']['/orders/v2'] = function() {
    verifyToken();
    $params = getQueryParams();
    $page = (int)($params['page'] ?? 1);
    $perPage = (int)($params['per_page'] ?? 20);
    $status = $params['status'] ?? '';
    $customerId = $params['customer_id'] ?? '';
    
    $filter = [];
    if ($status) $filter['status'] = $status;
    if ($customerId) $filter['customer_id'] = (int)$customerId;
    
    $orders = getCollection('orders_v2');
    $total = $orders->countDocuments($filter);
    $skip = ($page - 1) * $perPage;
    
    $cursor = $orders->find($filter, [
        'projection' => ['_id' => 0],
        'skip' => $skip,
        'limit' => $perPage,
        'sort' => ['created_at' => -1]
    ]);
    
    $ordersList = documentsToArray($cursor);
    
    // Add customer names
    $customers = getCollection('customers');
    foreach ($ordersList as &$order) {
        $customer = $customers->findOne(['id' => $order['customer_id'] ?? 0]);
        $order['customerName'] = $customer['name'] ?? 'Unknown';
        $order['pricing_tier'] = $customer['pricing_tier'] ?? 1;
    }
    
    jsonResponse([
        'data' => $ordersList,
        'pagination' => [
            'page' => $page,
            'per_page' => $perPage,
            'total' => $total,
            'total_pages' => ceil($total / $perPage)
        ]
    ]);
};

$routes['POST']['/orders/direct'] = function() {
    $payload = verifyToken();
    $data = getRequestBody();
    
    $orders = getCollection('orders_v2');
    $customers = getCollection('customers');
    
    // Get customer
    $customerId = $data['customer_id'] ?? null;
    if (!$customerId) {
        // Try to get from token (for customer portal)
        $user = getCollection('users')->findOne(['email' => $payload['user_id']]);
        $customer = $customers->findOne(['email' => $payload['user_id']]);
        $customerId = $customer['id'] ?? null;
    } else {
        $customer = $customers->findOne(['id' => (int)$customerId]);
    }
    
    if (!$customer) {
        errorResponse('Customer not found', 404);
    }
    
    $items = $data['items'] ?? [];
    $totalQty = 0;
    $grandTotal = 0;
    
    // Determine order type
    $hasPlywood = false;
    $hasTimber = false;
    
    foreach ($items as &$item) {
        $totalQty += (int)($item['quantity'] ?? 0);
        $grandTotal += (float)($item['total_price'] ?? 0);
        
        if (($item['product_group'] ?? '') === 'Plywood') {
            $hasPlywood = true;
        } else {
            $hasTimber = true;
        }
    }
    
    $orderType = 'Mixed';
    if ($hasPlywood && !$hasTimber) $orderType = 'Plywood';
    if ($hasTimber && !$hasPlywood) $orderType = 'Timber';
    
    $order = [
        'id' => generateId('ORD'),
        'customer_id' => $customer['id'],
        'items' => $items,
        'status' => 'Pending',
        'order_type' => $orderType,
        'total_quantity' => $totalQty,
        'grand_total' => $grandTotal,
        'estimated_total' => $grandTotal,
        'pricing_tier' => $customer['pricing_tier'] ?? 1,
        'placed_by' => $payload['name'] ?? $payload['user_id'],
        'placed_by_role' => $payload['role'] ?? 'Customer',
        'photo_url' => $data['photo_url'] ?? null,
        'transport_type' => $data['transport_type'] ?? 'Delivery',
        'notes' => $data['notes'] ?? '',
        'created_at' => getCurrentTimestamp(),
        'updated_at' => getCurrentTimestamp()
    ];
    
    $orders->insertOne($order);
    unset($order['_id']);
    
    jsonResponse(['success' => true, 'order' => $order], 201);
};

$routes['PUT']['/orders/v2/{id}/approve'] = function($id) {
    requireRole(['Super Admin', 'Admin']);
    
    $orders = getCollection('orders_v2');
    $order = $orders->findOne(['id' => $id]);
    
    if (!$order) {
        errorResponse('Order not found', 404);
    }
    
    $orders->updateOne(
        ['id' => $id],
        ['$set' => ['status' => 'Approved', 'updated_at' => getCurrentTimestamp()]]
    );
    
    // Create invoice for Timber orders
    if ($order['order_type'] === 'Timber' || $order['order_type'] === 'Mixed') {
        $invoices = getCollection('invoices_v2');
        $invoice = [
            'id' => generateId('INV'),
            'order_id' => $id,
            'customer_id' => $order['customer_id'],
            'items' => $order['items'],
            'sub_total' => $order['grand_total'],
            'grand_total' => $order['grand_total'],
            'status' => 'Pending',
            'issue_date' => getCurrentTimestamp(),
            'due_date' => (new DateTime('+30 days'))->format('c'),
            'created_at' => getCurrentTimestamp()
        ];
        $invoices->insertOne($invoice);
    }
    
    jsonResponse(['success' => true, 'message' => 'Order approved']);
};

$routes['PUT']['/orders/v2/{id}/cancel'] = function($id) {
    requireRole(['Super Admin', 'Admin']);
    
    $orders = getCollection('orders_v2');
    $result = $orders->updateOne(
        ['id' => $id],
        ['$set' => ['status' => 'Cancelled', 'updated_at' => getCurrentTimestamp()]]
    );
    
    if ($result->getModifiedCount() === 0) {
        errorResponse('Order not found', 404);
    }
    
    jsonResponse(['success' => true, 'message' => 'Order cancelled']);
};

// ==================== INVOICES ====================
$routes['GET']['/invoices/v2'] = function() {
    verifyToken();
    $params = getQueryParams();
    $page = (int)($params['page'] ?? 1);
    $perPage = (int)($params['per_page'] ?? 20);
    $status = $params['status'] ?? '';
    $customerId = $params['customer_id'] ?? '';
    
    $filter = [];
    if ($status) $filter['status'] = $status;
    if ($customerId) $filter['customer_id'] = (int)$customerId;
    
    $invoices = getCollection('invoices_v2');
    $total = $invoices->countDocuments($filter);
    $skip = ($page - 1) * $perPage;
    
    $cursor = $invoices->find($filter, [
        'projection' => ['_id' => 0],
        'skip' => $skip,
        'limit' => $perPage,
        'sort' => ['created_at' => -1]
    ]);
    
    $invoicesList = documentsToArray($cursor);
    
    // Add customer names
    $customers = getCollection('customers');
    foreach ($invoicesList as &$invoice) {
        $customer = $customers->findOne(['id' => $invoice['customer_id'] ?? 0]);
        $invoice['customerName'] = $customer['name'] ?? 'Unknown';
    }
    
    jsonResponse([
        'data' => $invoicesList,
        'pagination' => [
            'page' => $page,
            'per_page' => $perPage,
            'total' => $total,
            'total_pages' => ceil($total / $perPage)
        ]
    ]);
};

// ==================== BANNERS ====================
$routes['GET']['/banners'] = function() {
    $banners = getCollection('banners');
    $cursor = $banners->find(['is_active' => true], [
        'projection' => ['_id' => 0],
        'sort' => ['display_order' => 1]
    ]);
    
    jsonResponse(['banners' => documentsToArray($cursor)]);
};

$routes['GET']['/admin/banners'] = function() {
    requireRole(['Super Admin', 'Admin']);
    
    $banners = getCollection('banners');
    $cursor = $banners->find([], [
        'projection' => ['_id' => 0],
        'sort' => ['display_order' => 1]
    ]);
    
    jsonResponse(['banners' => documentsToArray($cursor)]);
};

$routes['POST']['/admin/banners'] = function() {
    requireRole(['Super Admin', 'Admin']);
    $data = getRequestBody();
    
    $banners = getCollection('banners');
    
    $banner = [
        'id' => generateId('BNR'),
        'title' => $data['title'] ?? '',
        'description' => $data['description'] ?? '',
        'image_url' => $data['image_url'] ?? '',
        'link_url' => $data['link_url'] ?? '',
        'is_active' => $data['is_active'] ?? true,
        'display_order' => (int)($data['display_order'] ?? 0),
        'created_at' => getCurrentTimestamp()
    ];
    
    $banners->insertOne($banner);
    unset($banner['_id']);
    
    jsonResponse(['success' => true, 'banner' => $banner], 201);
};

// ==================== DASHBOARD ====================
$routes['GET']['/admin/dashboard'] = function() {
    requireRole(['Super Admin', 'Admin']);
    
    $orders = getCollection('orders_v2');
    $customers = getCollection('customers');
    $invoices = getCollection('invoices_v2');
    
    // Counts
    $totalOrders = $orders->countDocuments([]);
    $pendingOrders = $orders->countDocuments(['status' => 'Pending']);
    $totalCustomers = $customers->countDocuments([]);
    $pendingApprovals = $customers->countDocuments(['approval_status' => 'Pending']);
    
    // Orders by type
    $plywoodOrders = $orders->countDocuments(['order_type' => 'Plywood']);
    $timberOrders = $orders->countDocuments(['order_type' => 'Timber']);
    
    // Latest orders
    $latestPlywood = documentsToArray($orders->find(
        ['order_type' => 'Plywood'],
        ['projection' => ['_id' => 0], 'sort' => ['created_at' => -1], 'limit' => 5]
    ));
    
    $latestTimber = documentsToArray($orders->find(
        ['order_type' => 'Timber'],
        ['projection' => ['_id' => 0], 'sort' => ['created_at' => -1], 'limit' => 5]
    ));
    
    // Add customer names
    foreach ($latestPlywood as &$order) {
        $customer = $customers->findOne(['id' => $order['customer_id'] ?? 0]);
        $order['customerName'] = $customer['name'] ?? 'Unknown';
    }
    foreach ($latestTimber as &$order) {
        $customer = $customers->findOne(['id' => $order['customer_id'] ?? 0]);
        $order['customerName'] = $customer['name'] ?? 'Unknown';
    }
    
    // Pending invoices
    $pendingInvoices = $invoices->countDocuments(['status' => 'Pending']);
    
    jsonResponse([
        'total_orders' => $totalOrders,
        'pending_orders' => $pendingOrders,
        'total_customers' => $totalCustomers,
        'pending_approvals' => $pendingApprovals,
        'plywood_orders_count' => $plywoodOrders,
        'timber_orders_count' => $timberOrders,
        'latest_plywood_orders' => $latestPlywood,
        'latest_timber_orders' => $latestTimber,
        'pending_invoices' => $pendingInvoices
    ]);
};

// ==================== SALES PORTAL ====================
$routes['GET']['/sales/customers'] = function() {
    $payload = verifyToken();
    
    $users = getCollection('users');
    $salesPerson = $users->findOne(['email' => $payload['user_id']]);
    $salesPersonId = $salesPerson ? (string)$salesPerson['_id'] : null;
    
    $customers = getCollection('customers');
    $cursor = $customers->find(
        ['sales_person_id' => $salesPersonId],
        ['projection' => ['_id' => 0], 'sort' => ['name' => 1]]
    );
    
    jsonResponse(['data' => documentsToArray($cursor)]);
};

$routes['GET']['/sales/orders'] = function() {
    $payload = verifyToken();
    $params = getQueryParams();
    
    $users = getCollection('users');
    $salesPerson = $users->findOne(['email' => $payload['user_id']]);
    $salesPersonId = $salesPerson ? (string)$salesPerson['_id'] : null;
    $salesPersonName = $salesPerson['name'] ?? '';
    
    // Get assigned customer IDs
    $customers = getCollection('customers');
    $assignedCustomers = $customers->find(['sales_person_id' => $salesPersonId], ['projection' => ['id' => 1]]);
    $customerIds = [];
    foreach ($assignedCustomers as $c) {
        $customerIds[] = $c['id'];
    }
    
    $filter = [
        '$or' => [
            ['placed_by' => $salesPersonName],
            ['placed_by' => $payload['user_id']],
            ['customer_id' => ['$in' => $customerIds]]
        ]
    ];
    
    if (!empty($params['status'])) {
        $filter['status'] = $params['status'];
    }
    
    $page = (int)($params['page'] ?? 1);
    $perPage = (int)($params['per_page'] ?? 20);
    $skip = ($page - 1) * $perPage;
    
    $orders = getCollection('orders_v2');
    $total = $orders->countDocuments($filter);
    $cursor = $orders->find($filter, [
        'projection' => ['_id' => 0],
        'skip' => $skip,
        'limit' => $perPage,
        'sort' => ['created_at' => -1]
    ]);
    
    $ordersList = documentsToArray($cursor);
    
    // Add customer names
    foreach ($ordersList as &$order) {
        $customer = $customers->findOne(['id' => $order['customer_id'] ?? 0]);
        $order['customerName'] = $customer['name'] ?? 'Unknown';
    }
    
    jsonResponse([
        'data' => $ordersList,
        'pagination' => [
            'page' => $page,
            'per_page' => $perPage,
            'total' => $total,
            'total_pages' => ceil($total / $perPage)
        ]
    ]);
};

$routes['GET']['/sales/invoices'] = function() {
    $payload = verifyToken();
    $params = getQueryParams();
    
    $users = getCollection('users');
    $salesPerson = $users->findOne(['email' => $payload['user_id']]);
    $salesPersonId = $salesPerson ? (string)$salesPerson['_id'] : null;
    
    // Get assigned customer IDs
    $customers = getCollection('customers');
    $assignedCustomers = $customers->find(['sales_person_id' => $salesPersonId], ['projection' => ['id' => 1]]);
    $customerIds = [];
    foreach ($assignedCustomers as $c) {
        $customerIds[] = $c['id'];
    }
    
    $filter = ['customer_id' => ['$in' => $customerIds]];
    
    if (!empty($params['status'])) {
        $filter['status'] = $params['status'];
    }
    
    $page = (int)($params['page'] ?? 1);
    $perPage = (int)($params['per_page'] ?? 20);
    $skip = ($page - 1) * $perPage;
    
    $invoices = getCollection('invoices_v2');
    $total = $invoices->countDocuments($filter);
    $cursor = $invoices->find($filter, [
        'projection' => ['_id' => 0],
        'skip' => $skip,
        'limit' => $perPage,
        'sort' => ['created_at' => -1]
    ]);
    
    $invoicesList = documentsToArray($cursor);
    
    // Add customer names
    foreach ($invoicesList as &$invoice) {
        $customer = $customers->findOne(['id' => $invoice['customer_id'] ?? 0]);
        $invoice['customerName'] = $customer['name'] ?? 'Unknown';
    }
    
    jsonResponse([
        'data' => $invoicesList,
        'pagination' => [
            'page' => $page,
            'per_page' => $perPage,
            'total' => $total,
            'total_pages' => ceil($total / $perPage)
        ]
    ]);
};

$routes['GET']['/sales/dashboard'] = function() {
    $payload = verifyToken();
    
    $users = getCollection('users');
    $salesPerson = $users->findOne(['email' => $payload['user_id']]);
    $salesPersonId = $salesPerson ? (string)$salesPerson['_id'] : null;
    $salesPersonName = $salesPerson['name'] ?? '';
    
    $customers = getCollection('customers');
    $orders = getCollection('orders_v2');
    $invoices = getCollection('invoices_v2');
    
    // Assigned customers count
    $assignedCustomersCount = $customers->countDocuments(['sales_person_id' => $salesPersonId]);
    
    // Get customer IDs
    $assignedCustomers = $customers->find(['sales_person_id' => $salesPersonId], ['projection' => ['id' => 1]]);
    $customerIds = [];
    foreach ($assignedCustomers as $c) {
        $customerIds[] = $c['id'];
    }
    
    // Orders filter
    $orderFilter = [
        '$or' => [
            ['placed_by' => $salesPersonName],
            ['placed_by' => $payload['user_id']],
            ['customer_id' => ['$in' => $customerIds]]
        ]
    ];
    
    $totalOrders = $orders->countDocuments($orderFilter);
    $pendingOrders = $orders->countDocuments(array_merge($orderFilter, ['status' => 'Pending']));
    
    // Monthly sales
    $startOfMonth = (new DateTime('first day of this month'))->format('c');
    $monthlyOrderFilter = array_merge($orderFilter, ['created_at' => ['$gte' => $startOfMonth]]);
    $monthlyCursor = $orders->find($monthlyOrderFilter, ['projection' => ['grand_total' => 1]]);
    $monthlySales = 0;
    foreach ($monthlyCursor as $o) {
        $monthlySales += $o['grand_total'] ?? 0;
    }
    
    // Outstanding invoices
    $invoiceFilter = [
        'customer_id' => ['$in' => $customerIds],
        'status' => ['$in' => ['Pending', 'Overdue']]
    ];
    $pendingInvoicesCursor = $invoices->find($invoiceFilter, ['projection' => ['grand_total' => 1]]);
    $totalOutstanding = 0;
    $dueInvoicesCount = 0;
    foreach ($pendingInvoicesCursor as $i) {
        $totalOutstanding += $i['grand_total'] ?? 0;
        $dueInvoicesCount++;
    }
    
    jsonResponse([
        'monthly_sales' => $monthlySales,
        'new_orders_week' => 0,
        'assigned_customers' => $assignedCustomersCount,
        'pending_orders_count' => $pendingOrders,
        'total_outstanding' => $totalOutstanding,
        'due_invoices_count' => $dueInvoicesCount,
        'total_orders' => $totalOrders
    ]);
};

// ==================== STOCK ====================
$routes['GET']['/stock'] = function() {
    verifyToken();
    $params = getQueryParams();
    
    $filter = [];
    if (!empty($params['product_id'])) {
        $filter['product_id'] = $params['product_id'];
    }
    
    $stock = getCollection('stock');
    $cursor = $stock->find($filter, ['projection' => ['_id' => 0]]);
    
    jsonResponse(['stock' => documentsToArray($cursor)]);
};

// ==================== ADDITIONAL CUSTOMER ENDPOINTS ====================
$routes['POST']['/customers/{id}/approve'] = function($id) {
    requireRole(['Super Admin', 'Admin']);
    
    $customers = getCollection('customers');
    $result = $customers->updateOne(
        ['id' => (int)$id],
        ['$set' => ['approval_status' => 'Approved', 'updated_at' => getCurrentTimestamp()]]
    );
    
    if ($result->getModifiedCount() === 0) {
        errorResponse('Customer not found', 404);
    }
    
    jsonResponse(['success' => true, 'message' => 'Customer approved']);
};

$routes['PUT']['/admin/customers/{id}'] = function($id) {
    requireRole(['Super Admin', 'Admin']);
    $data = getRequestBody();
    
    $customers = getCollection('customers');
    
    $updateData = ['updated_at' => getCurrentTimestamp()];
    
    $allowedFields = ['name', 'phone', 'business_name', 'address', 'pricing_tier', 'pricing_type', 'approval_status', 'sales_person_id'];
    foreach ($allowedFields as $field) {
        if (isset($data[$field])) {
            $updateData[$field] = $data[$field];
        }
    }
    
    $result = $customers->updateOne(['id' => (int)$id], ['$set' => $updateData]);
    
    if ($result->getMatchedCount() === 0) {
        errorResponse('Customer not found', 404);
    }
    
    $customer = $customers->findOne(['id' => (int)$id], ['projection' => ['_id' => 0]]);
    jsonResponse(['success' => true, 'customer' => documentToArray($customer)]);
};

// ==================== ADDITIONAL PRODUCT ENDPOINTS ====================
$routes['GET']['/products-v2/{id}'] = function($id) {
    $products = getCollection('products_v2');
    $product = $products->findOne(['id' => $id], ['projection' => ['_id' => 0]]);
    
    if (!$product) {
        errorResponse('Product not found', 404);
    }
    
    jsonResponse(documentToArray($product));
};

$routes['PUT']['/admin/products-v2/{id}'] = function($id) {
    requireRole(['Super Admin', 'Admin']);
    $data = getRequestBody();
    
    $products = getCollection('products_v2');
    
    $updateData = ['updated_at' => getCurrentTimestamp()];
    
    $allowedFields = ['name', 'group', 'description', 'thicknesses', 'sizes', 'pricing_tiers', 'base_price', 'is_active', 'images'];
    foreach ($allowedFields as $field) {
        if (isset($data[$field])) {
            $updateData[$field] = $data[$field];
        }
    }
    
    $result = $products->updateOne(['id' => $id], ['$set' => $updateData]);
    
    if ($result->getMatchedCount() === 0) {
        errorResponse('Product not found', 404);
    }
    
    $product = $products->findOne(['id' => $id], ['projection' => ['_id' => 0]]);
    jsonResponse(['success' => true, 'product' => documentToArray($product)]);
};

$routes['POST']['/admin/products-v2/{id}/image'] = function($id) {
    requireRole(['Super Admin', 'Admin']);
    
    if (!isset($_FILES['file'])) {
        errorResponse('No file uploaded', 400);
    }
    
    $file = $_FILES['file'];
    $allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    
    if (!in_array($file['type'], $allowedTypes)) {
        errorResponse('Invalid file type', 400);
    }
    
    if ($file['size'] > 5 * 1024 * 1024) {
        errorResponse('File too large (max 5MB)', 400);
    }
    
    $products = getCollection('products_v2');
    $product = $products->findOne(['id' => $id]);
    
    if (!$product) {
        errorResponse('Product not found', 404);
    }
    
    // Read and encode image
    $imageData = file_get_contents($file['tmp_name']);
    $base64 = base64_encode($imageData);
    $imageUrl = 'data:' . $file['type'] . ';base64,' . $base64;
    
    $images = $product['images'] ?? [];
    $images[] = [
        'url' => $imageUrl,
        'filename' => $file['name'],
        'uploaded_at' => getCurrentTimestamp()
    ];
    
    $products->updateOne(['id' => $id], ['$set' => ['images' => $images, 'updated_at' => getCurrentTimestamp()]]);
    
    jsonResponse(['success' => true, 'images' => $images]);
};

// ==================== ADDITIONAL ORDER ENDPOINTS ====================
$routes['GET']['/orders/v2/{id}'] = function($id) {
    verifyToken();
    
    $orders = getCollection('orders_v2');
    $order = $orders->findOne(['id' => $id], ['projection' => ['_id' => 0]]);
    
    if (!$order) {
        errorResponse('Order not found', 404);
    }
    
    $customers = getCollection('customers');
    $customer = $customers->findOne(['id' => $order['customer_id'] ?? 0]);
    $order['customerName'] = $customer['name'] ?? 'Unknown';
    
    jsonResponse(documentToArray($order));
};

$routes['PUT']['/orders/v2/{id}'] = function($id) {
    requireRole(['Super Admin', 'Admin']);
    $data = getRequestBody();
    
    $orders = getCollection('orders_v2');
    
    $updateData = ['updated_at' => getCurrentTimestamp()];
    
    $allowedFields = ['items', 'grand_total', 'estimated_total', 'notes', 'transport_type'];
    foreach ($allowedFields as $field) {
        if (isset($data[$field])) {
            $updateData[$field] = $data[$field];
        }
    }
    
    // Recalculate totals if items changed
    if (isset($data['items'])) {
        $totalQty = 0;
        $grandTotal = 0;
        foreach ($data['items'] as $item) {
            $totalQty += (int)($item['quantity'] ?? 0);
            $grandTotal += (float)($item['total_price'] ?? 0);
        }
        $updateData['total_quantity'] = $totalQty;
        $updateData['grand_total'] = $grandTotal;
    }
    
    $result = $orders->updateOne(['id' => $id], ['$set' => $updateData]);
    
    if ($result->getMatchedCount() === 0) {
        errorResponse('Order not found', 404);
    }
    
    $order = $orders->findOne(['id' => $id], ['projection' => ['_id' => 0]]);
    jsonResponse(['success' => true, 'order' => documentToArray($order)]);
};

$routes['PUT']['/orders/v2/{id}/dispatch'] = function($id) {
    requireRole(['Super Admin', 'Admin']);
    
    $orders = getCollection('orders_v2');
    $result = $orders->updateOne(
        ['id' => $id],
        ['$set' => ['status' => 'Dispatched', 'updated_at' => getCurrentTimestamp()]]
    );
    
    if ($result->getModifiedCount() === 0) {
        errorResponse('Order not found', 404);
    }
    
    jsonResponse(['success' => true, 'message' => 'Order dispatched']);
};

// ==================== ADDITIONAL INVOICE ENDPOINTS ====================
$routes['GET']['/invoices/v2/{id}'] = function($id) {
    verifyToken();
    
    $invoices = getCollection('invoices_v2');
    $invoice = $invoices->findOne(['id' => $id], ['projection' => ['_id' => 0]]);
    
    if (!$invoice) {
        errorResponse('Invoice not found', 404);
    }
    
    $customers = getCollection('customers');
    $customer = $customers->findOne(['id' => $invoice['customer_id'] ?? 0]);
    $invoice['customerName'] = $customer['name'] ?? 'Unknown';
    
    jsonResponse(documentToArray($invoice));
};

$routes['PUT']['/invoices/{id}'] = function($id) {
    requireRole(['Super Admin', 'Admin']);
    $data = getRequestBody();
    
    $invoices = getCollection('invoices_v2');
    
    $updateData = ['updated_at' => getCurrentTimestamp()];
    
    if (isset($data['status'])) {
        $updateData['status'] = $data['status'];
    }
    
    $result = $invoices->updateOne(['id' => $id], ['$set' => $updateData]);
    
    if ($result->getMatchedCount() === 0) {
        errorResponse('Invoice not found', 404);
    }
    
    jsonResponse(['success' => true, 'message' => 'Invoice updated']);
};

// ==================== ADDITIONAL BANNER ENDPOINTS ====================
$routes['PUT']['/admin/banners/{id}'] = function($id) {
    requireRole(['Super Admin', 'Admin']);
    $data = getRequestBody();
    
    $banners = getCollection('banners');
    
    $updateData = ['updated_at' => getCurrentTimestamp()];
    
    $allowedFields = ['title', 'description', 'image_url', 'link_url', 'is_active', 'display_order'];
    foreach ($allowedFields as $field) {
        if (isset($data[$field])) {
            $updateData[$field] = $data[$field];
        }
    }
    
    $result = $banners->updateOne(['id' => $id], ['$set' => $updateData]);
    
    if ($result->getMatchedCount() === 0) {
        errorResponse('Banner not found', 404);
    }
    
    jsonResponse(['success' => true, 'message' => 'Banner updated']);
};

$routes['DELETE']['/admin/banners/{id}'] = function($id) {
    requireRole(['Super Admin', 'Admin']);
    
    $banners = getCollection('banners');
    $result = $banners->deleteOne(['id' => $id]);
    
    if ($result->getDeletedCount() === 0) {
        errorResponse('Banner not found', 404);
    }
    
    jsonResponse(['success' => true, 'message' => 'Banner deleted']);
};

// ==================== USERS/STAFF MANAGEMENT ====================
$routes['GET']['/admin/users'] = function() {
    requireRole(['Super Admin']);
    
    $users = getCollection('users');
    $cursor = $users->find(
        ['role' => ['$in' => ['Admin', 'Sales Person']]],
        ['projection' => ['_id' => 0, 'password' => 0]]
    );
    
    jsonResponse(['users' => documentsToArray($cursor)]);
};

$routes['POST']['/admin/users'] = function() {
    requireRole(['Super Admin']);
    $data = getRequestBody();
    
    $users = getCollection('users');
    
    $existing = $users->findOne(['email' => strtolower($data['email'] ?? '')]);
    if ($existing) {
        errorResponse('User with this email already exists', 400);
    }
    
    $user = [
        'email' => strtolower($data['email'] ?? ''),
        'password' => hashPassword($data['password'] ?? 'password123'),
        'name' => $data['name'] ?? '',
        'role' => $data['role'] ?? 'Admin',
        'phone' => $data['phone'] ?? '',
        'is_active' => true,
        'created_at' => getCurrentTimestamp()
    ];
    
    $users->insertOne($user);
    unset($user['password'], $user['_id']);
    
    jsonResponse(['success' => true, 'user' => $user], 201);
};

// ==================== ROUTE MATCHING ====================

// Function to match routes with parameters
function matchRoute($method, $path) {
    global $routes;
    
    // Exact match first
    if (isset($routes[$method][$path])) {
        return ['handler' => $routes[$method][$path], 'params' => []];
    }
    
    // Pattern matching for routes with parameters
    if (isset($routes[$method])) {
        foreach ($routes[$method] as $routePattern => $handler) {
            // Convert {param} to regex
            $pattern = preg_replace('/\{([^}]+)\}/', '([^/]+)', $routePattern);
            $pattern = '#^' . $pattern . '$#';
            
            if (preg_match($pattern, $path, $matches)) {
                array_shift($matches); // Remove full match
                return ['handler' => $handler, 'params' => $matches];
            }
        }
    }
    
    return null;
}

// Route the request
$match = matchRoute($requestMethod, $path);

if ($match) {
    call_user_func_array($match['handler'], $match['params']);
} else {
    errorResponse('Not found: ' . $requestMethod . ' ' . $path, 404);
}
