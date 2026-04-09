<?php
/**
 * Natural Plylam B2B API - Main Router (GoDaddy Ready)
 */

require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/middleware/auth.php';
require_once __DIR__ . '/helpers.php';

// Get request info
$requestUri = $_SERVER['REQUEST_URI'];
$requestMethod = $_SERVER['REQUEST_METHOD'];

// Parse the path - remove /api prefix and query string
$path = parse_url($requestUri, PHP_URL_PATH);
$path = preg_replace('/^\/api/', '', $path);
$path = rtrim($path, '/');
if (empty($path)) $path = '/';

// Route handlers
$routes = [];

// ==================== HEALTH CHECK ====================
$routes['GET']['/health'] = function() {
    jsonResponse([
        'status' => 'ok',
        'timestamp' => formatDatetime(getCurrentTimestamp()),
        'database' => 'mysql'
    ]);
};

// ==================== AUTH ROUTES ====================
$routes['POST']['/login'] = function() {
    $data = getRequestBody();
    $email = strtolower(trim($data['email'] ?? ''));
    $password = $data['password'] ?? '';
    $appRole = $data['app_role'] ?? '';
    
    if (empty($email) || empty($password)) {
        errorResponse('Email and password required', 400);
    }
    
    $hashedPassword = hashPassword($password);
    
    // Customer login
    if ($appRole === 'Customer') {
        $customer = db()->fetchOne(
            "SELECT * FROM customers WHERE email = ? AND password = ?",
            [$email, $hashedPassword]
        );
        
        if (!$customer) {
            errorResponse('Invalid credentials', 401);
        }
        if ($customer['approval_status'] !== 'Approved') {
            errorResponse('Account not approved', 403);
        }
        if (!$customer['is_active']) {
            errorResponse('Account is inactive', 403);
        }
        
        $token = generateToken([
            'user_id' => 'customer_' . $customer['id'],
            'role' => 'Customer',
            'name' => $customer['name']
        ]);
        
        unset($customer['password']);
        $customer['role'] = 'Customer';
        
        jsonResponse(['token' => $token, 'user' => $customer]);
    }
    
    // Sales Person login
    if ($appRole === 'Sales Person') {
        $user = db()->fetchOne(
            "SELECT * FROM users WHERE email = ? AND password = ? AND role = 'Sales Person'",
            [$email, $hashedPassword]
        );
        
        if (!$user) {
            errorResponse('Invalid credentials', 401);
        }
        
        $token = generateToken([
            'user_id' => $user['email'],
            'role' => $user['role'],
            'name' => $user['name']
        ]);
        
        unset($user['password'], $user['mpin']);
        jsonResponse(['token' => $token, 'user' => $user]);
    }
    
    // Admin/Manager login
    $user = db()->fetchOne(
        "SELECT * FROM users WHERE email = ? AND password = ?",
        [$email, $hashedPassword]
    );
    
    if (!$user) {
        errorResponse('Invalid credentials', 401);
    }
    
    $token = generateToken([
        'user_id' => $user['email'],
        'role' => $user['role'],
        'name' => $user['name']
    ]);
    
    unset($user['password'], $user['mpin']);
    $user['id'] = (string)$user['id'];
    
    jsonResponse(['token' => $token, 'user' => $user]);
};

$routes['POST']['/logout'] = function() {
    jsonResponse(['message' => 'Logged out successfully']);
};

$routes['GET']['/me'] = function() {
    $payload = verifyToken();
    $userId = $payload['user_id'] ?? '';
    
    if (strpos($userId, 'customer_') === 0) {
        $customerId = (int)str_replace('customer_', '', $userId);
        $customer = db()->fetchOne(
            "SELECT * FROM customers WHERE id = ?",
            [$customerId]
        );
        if (!$customer) {
            errorResponse('Customer not found', 404);
        }
        unset($customer['password'], $customer['mpin']);
        $customer['role'] = 'Customer';
        jsonResponse($customer);
    }
    
    $user = db()->fetchOne(
        "SELECT * FROM users WHERE email = ?",
        [$userId]
    );
    
    if (!$user) {
        errorResponse('User not found', 404);
    }
    
    unset($user['password'], $user['mpin']);
    $user['id'] = (string)$user['id'];
    jsonResponse($user);
};

$routes['POST']['/register'] = function() {
    $data = getRequestBody();
    $email = strtolower(trim($data['email'] ?? ''));
    
    $existing = db()->fetchOne("SELECT id FROM customers WHERE email = ?", [$email]);
    if ($existing) {
        errorResponse('Email already registered', 400);
    }
    
    $customerId = db()->insert('customers', [
        'email' => $email,
        'password' => hashPassword($data['password'] ?? ''),
        'name' => $data['name'] ?? '',
        'business_name' => $data['name'] ?? '',
        'contact_person' => $data['contactPerson'] ?? '',
        'phone' => $data['phone'] ?? '',
        'approval_status' => 'Pending',
        'is_active' => 1,
        'pricing_tier' => 1,
        'outstanding_balance' => 0,
        'credit_limit' => 0,
        'created_at' => getCurrentTimestamp(),
        'updated_at' => getCurrentTimestamp()
    ]);
    
    jsonResponse([
        'success' => true,
        'message' => 'Registration successful. Please wait for admin approval.',
        'customer_id' => (int)$customerId
    ], 201);
};

// ==================== MPIN ROUTES ====================
$routes['POST']['/mpin/set'] = function() {
    $payload = verifyToken();
    $data = getRequestBody();
    $mpin = $data['mpin'] ?? '';
    
    if (!preg_match('/^\d{4,6}$/', $mpin)) {
        errorResponse('MPIN must be 4-6 digits', 400);
    }
    
    $hashedMpin = hashPassword($mpin);
    $userId = $payload['user_id'];
    
    if (strpos($userId, 'customer_') === 0) {
        $customerId = (int)str_replace('customer_', '', $userId);
        db()->update('customers', ['mpin' => $hashedMpin, 'updated_at' => getCurrentTimestamp()], 'id = ?', [$customerId]);
    } else {
        db()->update('users', ['mpin' => $hashedMpin, 'updated_at' => getCurrentTimestamp()], 'email = ?', [$userId]);
    }
    
    jsonResponse(['success' => true, 'message' => 'MPIN set successfully']);
};

$routes['POST']['/mpin/login'] = function() {
    $data = getRequestBody();
    $phone = $data['phone'] ?? '';
    $mpinHash = hashPassword($data['mpin'] ?? '');
    
    // Try customer
    $customer = db()->fetchOne(
        "SELECT * FROM customers WHERE phone = ? AND mpin = ?",
        [$phone, $mpinHash]
    );
    
    if ($customer) {
        if ($customer['approval_status'] !== 'Approved') {
            errorResponse('Account not approved', 403);
        }
        if (!$customer['is_active']) {
            errorResponse('Account is inactive', 403);
        }
        
        $token = generateToken([
            'user_id' => 'customer_' . $customer['id'],
            'role' => 'Customer',
            'name' => $customer['name']
        ]);
        
        unset($customer['password'], $customer['mpin']);
        $customer['role'] = 'Customer';
        jsonResponse(['token' => $token, 'user' => $customer]);
    }
    
    // Try user
    $user = db()->fetchOne(
        "SELECT * FROM users WHERE phone = ? AND mpin = ?",
        [$phone, $mpinHash]
    );
    
    if ($user) {
        $token = generateToken([
            'user_id' => $user['email'],
            'role' => $user['role'],
            'name' => $user['name']
        ]);
        
        unset($user['password'], $user['mpin']);
        jsonResponse(['token' => $token, 'user' => $user]);
    }
    
    errorResponse('Invalid phone number or MPIN', 401);
};

$routes['GET']['/mpin/check'] = function() {
    $payload = verifyToken();
    $userId = $payload['user_id'];
    
    if (strpos($userId, 'customer_') === 0) {
        $customerId = (int)str_replace('customer_', '', $userId);
        $customer = db()->fetchOne("SELECT mpin FROM customers WHERE id = ?", [$customerId]);
        jsonResponse(['has_mpin' => !empty($customer['mpin'])]);
    } else {
        $user = db()->fetchOne("SELECT mpin FROM users WHERE email = ?", [$userId]);
        jsonResponse(['has_mpin' => !empty($user['mpin'])]);
    }
};

// ==================== PRODUCT GROUPS ====================
$routes['GET']['/product-groups'] = function() {
    verifyToken();
    $groups = db()->fetchAll("SELECT * FROM product_groups ORDER BY display_order");
    jsonResponse(['groups' => $groups]);
};

// ==================== PRODUCTS V2 ====================
$routes['GET']['/products-v2'] = function() {
    $params = getQueryParams();
    $group = $params['group'] ?? '';
    
    $where = '1=1';
    $whereParams = [];
    
    if ($group) {
        $where .= ' AND group_name = ?';
        $whereParams[] = $group;
    }
    
    $products = db()->fetchAll("SELECT * FROM products WHERE {$where} ORDER BY name", $whereParams);
    
    foreach ($products as &$product) {
        $product['thicknesses'] = getProductThicknesses($product['id']);
        $product['sizes'] = getProductSizes($product['id']);
        $product['pricing_tiers'] = getProductPricing($product['id']);
        $product['images'] = getProductImages($product['id']);
        $product['group'] = $product['group_name'];
        unset($product['group_name']);
    }
    
    jsonResponse(['products' => $products]);
};

$routes['GET']['/products-v2/{id}'] = function($id) {
    $product = getFullProduct($id);
    if (!$product) {
        errorResponse('Product not found', 404);
    }
    jsonResponse(['product' => $product]);
};

$routes['GET']['/products-v2/{id}/stock'] = function($id) {
    $params = getQueryParams();
    $thickness = $params['thickness'] ?? null;
    $size = $params['size'] ?? null;
    
    $where = 'product_id = ?';
    $whereParams = [$id];
    
    if ($thickness) {
        $where .= ' AND thickness = ?';
        $whereParams[] = $thickness;
    }
    if ($size) {
        $where .= ' AND size = ?';
        $whereParams[] = $size;
    }
    
    $stock = db()->fetchAll("SELECT * FROM stock WHERE {$where}", $whereParams);
    jsonResponse(['stock' => $stock]);
};

$routes['POST']['/admin/products-v2'] = function() {
    requireRole(['Super Admin', 'Admin']);
    $data = getRequestBody();
    
    $productId = generateId(substr($data['group'] ?? 'PRD', 0, 3));
    
    db()->insert('products', [
        'id' => $productId,
        'name' => $data['name'] ?? '',
        'group_name' => $data['group'] ?? 'Plywood',
        'description' => $data['description'] ?? '',
        'base_price' => (float)($data['base_price'] ?? 0),
        'price_unit' => $data['price_unit'] ?? 'piece',
        'is_active' => 1,
        'created_at' => getCurrentTimestamp(),
        'updated_at' => getCurrentTimestamp()
    ]);
    
    if (!empty($data['variants'])) {
        foreach ($data['variants'] as $variant) {
            db()->query(
                "INSERT IGNORE INTO product_thicknesses (product_id, thickness) VALUES (?, ?)",
                [$productId, $variant['thickness']]
            );
            db()->query(
                "INSERT IGNORE INTO product_sizes (product_id, size) VALUES (?, ?)",
                [$productId, $variant['size']]
            );
            
            $stockKey = normalizeStockKey($productId, $variant['thickness'], $variant['size']);
            db()->insert('stock', [
                'stock_key' => $stockKey,
                'product_id' => $productId,
                'product_name' => $data['name'],
                'group_name' => $data['group'],
                'thickness' => $variant['thickness'],
                'size' => $variant['size'],
                'quantity' => (int)($variant['stock'] ?? 0),
                'reserved' => 0,
                'updated_at' => getCurrentTimestamp()
            ]);
        }
    }
    
    if (!empty($data['pricing_tiers'])) {
        foreach ($data['pricing_tiers'] as $tier => $price) {
            db()->insert('product_pricing', [
                'product_id' => $productId,
                'tier' => (int)$tier,
                'price' => (float)$price
            ]);
        }
    }
    
    $product = getFullProduct($productId);
    jsonResponse(['success' => true, 'message' => 'Product created', 'product' => $product], 201);
};

$routes['PUT']['/admin/products-v2/{id}'] = function($id) {
    requireRole(['Super Admin', 'Admin']);
    $data = getRequestBody();
    
    $existing = db()->fetchOne("SELECT id FROM products WHERE id = ?", [$id]);
    if (!$existing) {
        errorResponse('Product not found', 404);
    }
    
    $updateData = ['updated_at' => getCurrentTimestamp()];
    $allowedFields = ['name', 'description', 'base_price', 'price_unit', 'is_active'];
    foreach ($allowedFields as $field) {
        if (isset($data[$field])) {
            $updateData[$field] = $data[$field];
        }
    }
    if (isset($data['group'])) {
        $updateData['group_name'] = $data['group'];
    }
    
    db()->update('products', $updateData, 'id = ?', [$id]);
    
    if (!empty($data['variants'])) {
        db()->delete('product_thicknesses', 'product_id = ?', [$id]);
        db()->delete('product_sizes', 'product_id = ?', [$id]);
        db()->delete('stock', 'product_id = ?', [$id]);
        
        foreach ($data['variants'] as $variant) {
            db()->query(
                "INSERT IGNORE INTO product_thicknesses (product_id, thickness) VALUES (?, ?)",
                [$id, $variant['thickness']]
            );
            db()->query(
                "INSERT IGNORE INTO product_sizes (product_id, size) VALUES (?, ?)",
                [$id, $variant['size']]
            );
            
            $stockKey = normalizeStockKey($id, $variant['thickness'], $variant['size']);
            db()->insert('stock', [
                'stock_key' => $stockKey,
                'product_id' => $id,
                'product_name' => $data['name'] ?? '',
                'group_name' => $data['group'] ?? '',
                'thickness' => $variant['thickness'],
                'size' => $variant['size'],
                'quantity' => (int)($variant['stock'] ?? 0),
                'reserved' => 0,
                'updated_at' => getCurrentTimestamp()
            ]);
        }
    }
    
    if (!empty($data['pricing_tiers'])) {
        db()->delete('product_pricing', 'product_id = ?', [$id]);
        foreach ($data['pricing_tiers'] as $tier => $price) {
            db()->insert('product_pricing', [
                'product_id' => $id,
                'tier' => (int)$tier,
                'price' => (float)$price
            ]);
        }
    }
    
    $product = getFullProduct($id);
    jsonResponse(['success' => true, 'message' => 'Product updated', 'product' => $product]);
};

$routes['POST']['/admin/products-v2/{id}/image'] = function($id) {
    requireRole(['Super Admin', 'Admin']);
    
    $product = db()->fetchOne("SELECT id FROM products WHERE id = ?", [$id]);
    if (!$product) {
        errorResponse('Product not found', 404);
    }
    
    if (!isset($_FILES['file'])) {
        errorResponse('No file uploaded', 400);
    }
    
    $file = $_FILES['file'];
    $allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    
    if (!in_array($file['type'], $allowedTypes)) {
        errorResponse('Invalid file type', 400);
    }
    
    if ($file['size'] > 5 * 1024 * 1024) {
        errorResponse('File too large. Max 5MB', 400);
    }
    
    $imageData = file_get_contents($file['tmp_name']);
    $base64 = base64_encode($imageData);
    $imageUrl = 'data:' . $file['type'] . ';base64,' . $base64;
    
    db()->insert('product_images', [
        'product_id' => $id,
        'image_url' => $imageUrl,
        'filename' => $file['name'],
        'uploaded_at' => getCurrentTimestamp()
    ]);
    
    $images = getProductImages($id);
    jsonResponse(['success' => true, 'message' => 'Image uploaded', 'images' => $images]);
};

$routes['DELETE']['/admin/products-v2/{id}/image/{index}'] = function($id, $index) {
    requireRole(['Super Admin', 'Admin']);
    
    $images = db()->fetchAll("SELECT id FROM product_images WHERE product_id = ? ORDER BY id", [$id]);
    
    if (!isset($images[$index])) {
        errorResponse('Invalid image index', 400);
    }
    
    db()->delete('product_images', 'id = ?', [$images[$index]['id']]);
    
    $remainingImages = getProductImages($id);
    jsonResponse(['success' => true, 'message' => 'Image deleted', 'images' => $remainingImages]);
};

// ==================== STOCK ROUTES ====================
$routes['GET']['/stock'] = function() {
    verifyToken();
    $params = getQueryParams();
    
    $where = '1=1';
    $whereParams = [];
    
    if (!empty($params['product_id'])) {
        $where .= ' AND product_id = ?';
        $whereParams[] = $params['product_id'];
    }
    
    $stock = db()->fetchAll("SELECT * FROM stock WHERE {$where}", $whereParams);
    jsonResponse(['stock' => $stock]);
};

$routes['GET']['/stock/check'] = function() {
    verifyToken();
    $params = getQueryParams();
    
    $productId = $params['product_id'] ?? '';
    $thickness = $params['thickness'] ?? '';
    $size = $params['size'] ?? '';
    $quantity = (int)($params['quantity'] ?? 0);
    
    $stockKey = normalizeStockKey($productId, $thickness, $size);
    $stock = db()->fetchOne("SELECT * FROM stock WHERE stock_key = ?", [$stockKey]);
    
    if (!$stock) {
        jsonResponse(['available' => false, 'message' => 'Product variant not found', 'current_stock' => 0]);
    }
    
    $availableQty = $stock['quantity'] - $stock['reserved'];
    $isAvailable = $availableQty >= $quantity;
    
    jsonResponse([
        'available' => $isAvailable,
        'current_stock' => $availableQty,
        'requested' => $quantity,
        'message' => $isAvailable ? 'In Stock' : "Only {$availableQty} available"
    ]);
};

$routes['GET']['/price/calculate'] = function() {
    verifyToken();
    $params = getQueryParams();
    
    $productId = $params['product_id'] ?? '';
    $customerId = (int)($params['customer_id'] ?? 0);
    $quantity = (int)($params['quantity'] ?? 0);
    
    $product = db()->fetchOne("SELECT * FROM products WHERE id = ?", [$productId]);
    if (!$product) {
        errorResponse('Product not found', 404);
    }
    
    $customer = db()->fetchOne("SELECT pricing_tier FROM customers WHERE id = ?", [$customerId]);
    if (!$customer) {
        errorResponse('Customer not found', 404);
    }
    
    $pricingTier = $customer['pricing_tier'];
    $pricing = db()->fetchOne(
        "SELECT price FROM product_pricing WHERE product_id = ? AND tier = ?",
        [$productId, $pricingTier]
    );
    
    $unitPrice = $pricing ? (float)$pricing['price'] : (float)$product['base_price'];
    $totalPrice = $unitPrice * $quantity;
    
    jsonResponse([
        'product_id' => $productId,
        'product_name' => $product['name'],
        'pricing_tier' => (string)$pricingTier,
        'unit_price' => $unitPrice,
        'quantity' => $quantity,
        'total_price' => $totalPrice,
        'price_unit' => $product['price_unit']
    ]);
};

// Include other route files
require_once __DIR__ . '/routes_orders.php';
require_once __DIR__ . '/routes_customers.php';
require_once __DIR__ . '/routes_invoices.php';
require_once __DIR__ . '/routes_admin.php';
require_once __DIR__ . '/routes_sales.php';

// ==================== ROUTE MATCHING ====================
function matchRoute($method, $path) {
    global $routes;
    
    if (isset($routes[$method][$path])) {
        return ['handler' => $routes[$method][$path], 'params' => []];
    }
    
    if (isset($routes[$method])) {
        foreach ($routes[$method] as $routePattern => $handler) {
            $pattern = preg_replace('/\{([^}]+)\}/', '([^/]+)', $routePattern);
            $pattern = '#^' . $pattern . '$#';
            
            if (preg_match($pattern, $path, $matches)) {
                array_shift($matches);
                return ['handler' => $handler, 'params' => $matches];
            }
        }
    }
    
    return null;
}

$match = matchRoute($requestMethod, $path);

if ($match) {
    call_user_func_array($match['handler'], $match['params']);
} else {
    errorResponse('Not found: ' . $requestMethod . ' ' . $path, 404);
}
