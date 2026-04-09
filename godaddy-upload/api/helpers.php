<?php
/**
 * Helper Functions for PHP MySQL Backend
 */

function generateId($prefix = '') {
    $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    $id = '';
    for ($i = 0; $i < 8; $i++) {
        $id .= $chars[random_int(0, strlen($chars) - 1)];
    }
    return $prefix ? $prefix . '-' . $id : $id;
}

function hashPassword($password) {
    return hash('sha256', $password);
}

function getRequestBody() {
    $json = file_get_contents('php://input');
    return json_decode($json, true) ?: [];
}

function getQueryParams() {
    return $_GET;
}

function jsonResponse($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit();
}

function errorResponse($message, $status = 400) {
    http_response_code($status);
    echo json_encode(['error' => $message, 'detail' => $message]);
    exit();
}

function getCurrentTimestamp() {
    return (new DateTime('now', new DateTimeZone('UTC')))->format('Y-m-d H:i:s');
}

function formatDatetime($datetime) {
    if (empty($datetime)) return null;
    $dt = new DateTime($datetime);
    return $dt->format('c'); // ISO 8601 format
}

function sanitizeString($str) {
    return htmlspecialchars(strip_tags(trim($str)), ENT_QUOTES, 'UTF-8');
}

function paginate($page, $perPage, $total) {
    return [
        'page' => (int)$page,
        'per_page' => (int)$perPage,
        'total' => (int)$total,
        'total_pages' => (int)ceil($total / $perPage)
    ];
}

function buildSearchCondition($fields, $search) {
    if (empty($search)) return ['1=1', []];
    
    $conditions = [];
    $params = [];
    foreach ($fields as $field) {
        $conditions[] = "{$field} LIKE ?";
        $params[] = "%{$search}%";
    }
    return ['(' . implode(' OR ', $conditions) . ')', $params];
}

// Get product thicknesses as array
function getProductThicknesses($productId) {
    $thicknesses = db()->fetchAll(
        "SELECT thickness FROM product_thicknesses WHERE product_id = ? ORDER BY CAST(thickness AS DECIMAL(10,2))",
        [$productId]
    );
    return array_column($thicknesses, 'thickness');
}

// Get product sizes as array
function getProductSizes($productId) {
    $sizes = db()->fetchAll(
        "SELECT size FROM product_sizes WHERE product_id = ? ORDER BY size",
        [$productId]
    );
    return array_column($sizes, 'size');
}

// Get product pricing tiers as associative array
function getProductPricing($productId) {
    $pricing = db()->fetchAll(
        "SELECT tier, price FROM product_pricing WHERE product_id = ?",
        [$productId]
    );
    $result = [];
    foreach ($pricing as $p) {
        $result[(string)$p['tier']] = (float)$p['price'];
    }
    return $result;
}

// Get product images
function getProductImages($productId) {
    return db()->fetchAll(
        "SELECT image_url as url, filename, uploaded_at FROM product_images WHERE product_id = ? ORDER BY id",
        [$productId]
    );
}

// Get full product with all related data
function getFullProduct($productId) {
    $product = db()->fetchOne("SELECT * FROM products WHERE id = ?", [$productId]);
    if (!$product) return null;
    
    $product['thicknesses'] = getProductThicknesses($productId);
    $product['sizes'] = getProductSizes($productId);
    $product['pricing_tiers'] = getProductPricing($productId);
    $product['images'] = getProductImages($productId);
    $product['group'] = $product['group_name']; // Alias for frontend compatibility
    unset($product['group_name']);
    
    return $product;
}

// Get order items
function getOrderItems($orderId) {
    return db()->fetchAll(
        "SELECT product_group, product_id, product_name, thickness, size, quantity, unit_price, total_price 
         FROM order_items WHERE order_id = ?",
        [$orderId]
    );
}

// Get invoice items
function getInvoiceItems($invoiceId) {
    return db()->fetchAll(
        "SELECT product_group, product_id, product_name, thickness, size, quantity, unit_price, total_price 
         FROM invoice_items WHERE invoice_id = ?",
        [$invoiceId]
    );
}

// Insert order items
function insertOrderItems($orderId, $items) {
    foreach ($items as $item) {
        db()->insert('order_items', [
            'order_id' => $orderId,
            'product_group' => $item['product_group'] ?? '',
            'product_id' => $item['product_id'] ?? '',
            'product_name' => $item['product_name'] ?? '',
            'thickness' => $item['thickness'] ?? '',
            'size' => $item['size'] ?? '',
            'quantity' => (int)($item['quantity'] ?? 0),
            'unit_price' => (float)($item['unit_price'] ?? 0),
            'total_price' => (float)($item['total_price'] ?? 0)
        ]);
    }
}

// Insert invoice items
function insertInvoiceItems($invoiceId, $items) {
    foreach ($items as $item) {
        db()->insert('invoice_items', [
            'invoice_id' => $invoiceId,
            'product_group' => $item['product_group'] ?? '',
            'product_id' => $item['product_id'] ?? '',
            'product_name' => $item['product_name'] ?? '',
            'thickness' => $item['thickness'] ?? '',
            'size' => $item['size'] ?? '',
            'quantity' => (int)($item['quantity'] ?? 0),
            'unit_price' => (float)($item['unit_price'] ?? 0),
            'total_price' => (float)($item['total_price'] ?? 0)
        ]);
    }
}

// Delete and re-insert order items
function updateOrderItems($orderId, $items) {
    db()->delete('order_items', 'order_id = ?', [$orderId]);
    insertOrderItems($orderId, $items);
}

// Get stock variant pricing
function getStockPricing($stockId) {
    $pricing = db()->fetchAll(
        "SELECT tier, price FROM stock_pricing WHERE stock_id = ?",
        [$stockId]
    );
    $result = [];
    foreach ($pricing as $p) {
        $result[(string)$p['tier']] = (float)$p['price'];
    }
    return $result;
}

// Normalize stock key
function normalizeStockKey($productId, $thickness, $size) {
    $sizeNormalized = str_replace([' ', 'x'], ['', 'X'], $size);
    return "{$productId}_{$thickness}_{$sizeNormalized}";
}
