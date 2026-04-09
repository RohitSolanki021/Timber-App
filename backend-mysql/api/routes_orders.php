<?php
/**
 * Order Routes - MySQL Version
 */

global $routes;

// ==================== DIRECT ORDERS ====================
$routes['POST']['/orders/direct'] = function() {
    $payload = verifyToken();
    $data = getRequestBody();
    
    $customerId = $data['customer_id'] ?? null;
    $userId = $payload['user_id'] ?? '';
    
    // Get customer ID from token if not provided
    if (!$customerId && strpos($userId, 'customer_') === 0) {
        $customerId = (int)str_replace('customer_', '', $userId);
    }
    
    // Validate customer
    $customer = db()->fetchOne("SELECT * FROM customers WHERE id = ?", [$customerId]);
    if (!$customer) {
        errorResponse('Customer not found', 404);
    }
    
    if ($customer['approval_status'] !== 'Approved') {
        errorResponse('Customer account not approved', 403);
    }
    
    $pricingTier = $customer['pricing_tier'];
    $items = $data['items'] ?? [];
    $processedItems = [];
    $hasPlywood = false;
    $hasTimber = false;
    
    foreach ($items as $item) {
        // Get product
        $product = db()->fetchOne("SELECT * FROM products WHERE id = ?", [$item['product_id']]);
        if (!$product) {
            $product = db()->fetchOne("SELECT * FROM products WHERE name = ?", [$item['product_name']]);
        }
        
        $actualProductId = $product ? $product['id'] : $item['product_id'];
        
        // Get tier price
        if ($product) {
            $pricing = db()->fetchOne(
                "SELECT price FROM product_pricing WHERE product_id = ? AND tier = ?",
                [$actualProductId, $pricingTier]
            );
            $tierPrice = $pricing ? (float)$pricing['price'] : (float)$product['base_price'];
            
            $item['product_id'] = $actualProductId;
            $item['unit_price'] = $tierPrice;
            $item['total_price'] = $tierPrice * (int)$item['quantity'];
        }
        
        $processedItems[] = $item;
        
        if (strtolower($item['product_group'] ?? '') === 'plywood') {
            $hasPlywood = true;
        } else {
            $hasTimber = true;
        }
    }
    
    // Determine order type
    $orderType = 'Mixed';
    if ($hasPlywood && !$hasTimber) $orderType = 'Plywood';
    if ($hasTimber && !$hasPlywood) $orderType = 'Timber';
    
    // Get placer info
    $placerName = null;
    $placerRole = $payload['role'] ?? '';
    
    if (strpos($userId, 'customer_') === 0) {
        $placerName = $customer['contact_person'] ?: $customer['name'];
    } else {
        $user = db()->fetchOne("SELECT name FROM users WHERE email = ?", [$userId]);
        $placerName = $user ? $user['name'] : $userId;
    }
    
    // Calculate totals
    $totalAmount = array_sum(array_column($processedItems, 'total_price'));
    $totalQty = array_sum(array_column($processedItems, 'quantity'));
    
    $orderId = generateId('ORD');
    $currentTime = getCurrentTimestamp();
    
    // Insert order
    db()->insert('orders', [
        'id' => $orderId,
        'customer_id' => $customerId,
        'customer_name' => $customer['name'],
        'order_type' => $orderType,
        'status' => 'Pending',
        'total_quantity' => $totalQty,
        'sub_total' => $totalAmount,
        'grand_total' => $totalAmount,
        'pricing_tier' => $pricingTier,
        'photo_reference' => $data['photo_reference'] ?? null,
        'notes' => $data['notes'] ?? null,
        'placed_by' => $placerName,
        'placed_by_role' => $placerRole,
        'transport_mode' => $data['transport_mode'] ?? null,
        'vehicle_number' => $data['vehicle_number'] ?? null,
        'driver_name' => $data['driver_name'] ?? null,
        'driver_phone' => $data['driver_phone'] ?? null,
        'is_editable' => 1,
        'has_plywood' => $hasPlywood ? 1 : 0,
        'has_timber' => $hasTimber ? 1 : 0,
        'is_estimated' => $hasPlywood ? 1 : 0,
        'order_date' => $currentTime,
        'created_at' => $currentTime,
        'updated_at' => $currentTime
    ]);
    
    // Insert order items
    insertOrderItems($orderId, $processedItems);
    
    jsonResponse([
        'success' => true,
        'message' => "Order {$orderId} placed successfully.",
        'orders' => [['id' => $orderId, 'type' => $orderType, 'total' => $totalAmount, 'is_estimated' => $hasPlywood]],
        'total_amount' => $totalAmount
    ], 201);
};

// ==================== GET ORDERS V2 ====================
$routes['GET']['/orders/v2'] = function() {
    $payload = verifyToken();
    $params = getQueryParams();
    
    $page = (int)($params['page'] ?? 1);
    $perPage = (int)($params['per_page'] ?? 10);
    $orderType = $params['order_type'] ?? '';
    $status = $params['status'] ?? '';
    $customerId = $params['customer_id'] ?? '';
    $search = $params['search'] ?? '';
    $productName = $params['product_name'] ?? '';
    $dateFrom = $params['date_from'] ?? '';
    $dateTo = $params['date_to'] ?? '';
    
    $userId = $payload['user_id'] ?? '';
    
    $where = '1=1';
    $whereParams = [];
    
    // Customer can only see their orders
    if (strpos($userId, 'customer_') === 0) {
        $custId = (int)str_replace('customer_', '', $userId);
        $where .= ' AND o.customer_id = ?';
        $whereParams[] = $custId;
    } elseif ($customerId) {
        $where .= ' AND o.customer_id = ?';
        $whereParams[] = (int)$customerId;
    }
    
    if ($orderType && $orderType !== 'all') {
        $where .= ' AND o.order_type = ?';
        $whereParams[] = $orderType;
    }
    
    if ($status && $status !== 'all' && $status !== 'All') {
        $where .= ' AND o.status = ?';
        $whereParams[] = $status;
    }
    
    if ($search) {
        $where .= ' AND (o.id LIKE ? OR o.customer_name LIKE ?)';
        $whereParams[] = "%{$search}%";
        $whereParams[] = "%{$search}%";
    }
    
    if ($dateFrom) {
        $where .= ' AND o.created_at >= ?';
        $whereParams[] = $dateFrom;
    }
    if ($dateTo) {
        $where .= ' AND o.created_at <= ?';
        $whereParams[] = $dateTo . ' 23:59:59';
    }
    
    // Count total
    $total = db()->fetchOne("SELECT COUNT(*) as cnt FROM orders o WHERE {$where}", $whereParams)['cnt'];
    
    $skip = ($page - 1) * $perPage;
    
    // Fetch orders with pending first
    $orders = db()->fetchAll(
        "SELECT o.*, 
                CASE WHEN o.status = 'Pending' THEN 0 ELSE 1 END as sort_priority
         FROM orders o 
         WHERE {$where}
         ORDER BY sort_priority ASC, o.created_at DESC
         LIMIT ? OFFSET ?",
        array_merge($whereParams, [$perPage, $skip])
    );
    
    // Add items to each order
    foreach ($orders as &$order) {
        $order['items'] = getOrderItems($order['id']);
        $order['customerName'] = $order['customer_name'];
        unset($order['sort_priority']);
    }
    
    jsonResponse([
        'data' => $orders,
        'pagination' => paginate($page, $perPage, $total)
    ]);
};

$routes['GET']['/orders/v2/{id}'] = function($id) {
    verifyToken();
    
    $order = db()->fetchOne("SELECT * FROM orders WHERE id = ?", [$id]);
    if (!$order) {
        errorResponse('Order not found', 404);
    }
    
    $order['items'] = getOrderItems($id);
    $order['customerName'] = $order['customer_name'];
    
    jsonResponse(['order' => $order]);
};

$routes['PUT']['/orders/v2/{id}'] = function($id) {
    verifyToken();
    $data = getRequestBody();
    
    $order = db()->fetchOne("SELECT * FROM orders WHERE id = ?", [$id]);
    if (!$order) {
        errorResponse('Order not found', 404);
    }
    
    if (!$order['is_editable']) {
        errorResponse('Order is locked and cannot be edited', 403);
    }
    
    $items = $data['items'] ?? [];
    
    // Recalculate
    $total = 0;
    $totalQty = 0;
    foreach ($items as &$item) {
        $item['total_price'] = (float)$item['unit_price'] * (int)$item['quantity'];
        $total += $item['total_price'];
        $totalQty += (int)$item['quantity'];
    }
    
    db()->update('orders', [
        'total_quantity' => $totalQty,
        'sub_total' => $total,
        'cgst' => round($total * 0.09, 2),
        'sgst' => round($total * 0.09, 2),
        'grand_total' => round($total * 1.18, 2),
        'updated_at' => getCurrentTimestamp()
    ], 'id = ?', [$id]);
    
    updateOrderItems($id, $items);
    
    jsonResponse(['success' => true, 'message' => 'Order updated successfully']);
};

$routes['PUT']['/orders/v2/{id}/items'] = function($id) {
    $payload = requireRole(['Super Admin', 'Admin', 'Manager', 'Sales Person']);
    $data = getRequestBody();
    
    $order = db()->fetchOne("SELECT * FROM orders WHERE id = ?", [$id]);
    if (!$order) {
        errorResponse('Order not found', 404);
    }
    
    if ($order['status'] !== 'Pending') {
        errorResponse('Can only update pending orders', 400);
    }
    
    $items = $data['items'] ?? [];
    
    $total = 0;
    $totalQty = 0;
    foreach ($items as $item) {
        $itemTotal = $item['total_price'] ?? ((float)$item['unit_price'] * (int)$item['quantity']);
        $total += $itemTotal;
        $totalQty += (int)$item['quantity'];
    }
    
    db()->update('orders', [
        'total_quantity' => $totalQty,
        'sub_total' => $total,
        'cgst' => round($total * 0.09, 2),
        'sgst' => round($total * 0.09, 2),
        'grand_total' => round($total * 1.18, 2),
        'price_modified_by' => $payload['user_id'],
        'price_modified_at' => getCurrentTimestamp(),
        'admin_notes' => $data['notes'] ?? null,
        'updated_at' => getCurrentTimestamp()
    ], 'id = ?', [$id]);
    
    updateOrderItems($id, $items);
    
    jsonResponse(['success' => true, 'message' => 'Order prices updated', 'new_total' => round($total * 1.18, 2)]);
};

$routes['PUT']['/admin/orders/{id}/items'] = function($id) {
    $payload = requireRole(['Super Admin', 'Admin', 'Manager']);
    $data = getRequestBody();
    
    $order = db()->fetchOne("SELECT * FROM orders WHERE id = ?", [$id]);
    if (!$order) {
        errorResponse('Order not found', 404);
    }
    
    if ($order['status'] !== 'Pending') {
        errorResponse('Can only update pending orders', 400);
    }
    
    $items = $data['items'] ?? [];
    
    $total = 0;
    $totalQty = 0;
    foreach ($items as $item) {
        $itemTotal = $item['total_price'] ?? ((float)$item['unit_price'] * (int)$item['quantity']);
        $total += $itemTotal;
        $totalQty += (int)$item['quantity'];
    }
    
    db()->update('orders', [
        'total_quantity' => $totalQty,
        'sub_total' => $total,
        'cgst' => round($total * 0.09, 2),
        'sgst' => round($total * 0.09, 2),
        'grand_total' => round($total * 1.18, 2),
        'price_modified_by' => $payload['user_id'],
        'price_modified_at' => getCurrentTimestamp(),
        'admin_notes' => $data['notes'] ?? null,
        'updated_at' => getCurrentTimestamp()
    ], 'id = ?', [$id]);
    
    updateOrderItems($id, $items);
    
    jsonResponse(['success' => true, 'message' => 'Order prices updated', 'new_total' => round($total * 1.18, 2)]);
};

$routes['PUT']['/orders/v2/{id}/approve'] = function($id) {
    requireRole(['Super Admin', 'Admin']);
    
    $order = db()->fetchOne("SELECT * FROM orders WHERE id = ?", [$id]);
    if (!$order) {
        errorResponse('Order not found', 404);
    }
    
    db()->update('orders', [
        'status' => 'Approved',
        'is_editable' => 0,
        'updated_at' => getCurrentTimestamp()
    ], 'id = ?', [$id]);
    
    // Create invoice for Timber orders
    if (in_array($order['order_type'], ['Timber', 'Mixed'])) {
        $invoiceId = generateId('INV');
        $dueDate = (new DateTime('+30 days'))->format('Y-m-d H:i:s');
        
        db()->insert('invoices', [
            'id' => $invoiceId,
            'order_id' => $id,
            'customer_id' => $order['customer_id'],
            'customer_name' => $order['customer_name'],
            'order_type' => $order['order_type'],
            'sub_total' => $order['sub_total'],
            'cgst' => $order['cgst'],
            'sgst' => $order['sgst'],
            'grand_total' => $order['grand_total'],
            'status' => 'Pending',
            'issue_date' => getCurrentTimestamp(),
            'due_date' => $dueDate,
            'created_at' => getCurrentTimestamp(),
            'updated_at' => getCurrentTimestamp()
        ]);
        
        // Copy items to invoice
        $items = getOrderItems($id);
        insertInvoiceItems($invoiceId, $items);
        
        // Update customer outstanding balance
        db()->query(
            "UPDATE customers SET outstanding_balance = outstanding_balance + ? WHERE id = ?",
            [$order['grand_total'], $order['customer_id']]
        );
    }
    
    jsonResponse(['success' => true, 'message' => 'Order approved']);
};

$routes['PUT']['/orders/v2/{id}/cancel'] = function($id) {
    requireRole(['Super Admin', 'Admin']);
    
    $result = db()->update('orders', [
        'status' => 'Cancelled',
        'is_editable' => 0,
        'updated_at' => getCurrentTimestamp()
    ], 'id = ?', [$id]);
    
    if ($result === 0) {
        errorResponse('Order not found', 404);
    }
    
    jsonResponse(['success' => true, 'message' => 'Order cancelled']);
};

$routes['PUT']['/orders/v2/{id}/dispatch'] = function($id) {
    requireRole(['Super Admin', 'Admin']);
    
    $result = db()->update('orders', [
        'status' => 'Dispatched',
        'updated_at' => getCurrentTimestamp()
    ], 'id = ?', [$id]);
    
    if ($result === 0) {
        errorResponse('Order not found', 404);
    }
    
    jsonResponse(['success' => true, 'message' => 'Order dispatched']);
};

// Customer-specific order endpoints
$routes['GET']['/customer/orders'] = function() {
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
    $orderType = $params['order_type'] ?? '';
    $status = $params['status'] ?? '';
    
    $where = 'customer_id = ?';
    $whereParams = [$customerId];
    
    if ($orderType && $orderType !== 'all') {
        $where .= ' AND order_type = ?';
        $whereParams[] = $orderType;
    }
    if ($status && $status !== 'all' && $status !== 'All') {
        $where .= ' AND status = ?';
        $whereParams[] = $status;
    }
    
    $total = db()->fetchOne("SELECT COUNT(*) as cnt FROM orders WHERE {$where}", $whereParams)['cnt'];
    $skip = ($page - 1) * $perPage;
    
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

$routes['GET']['/customer/orders/{id}'] = function($id) {
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
    
    $order = db()->fetchOne("SELECT * FROM orders WHERE id = ? AND customer_id = ?", [$id, $customerId]);
    if (!$order) {
        errorResponse('Order not found', 404);
    }
    
    $order['items'] = getOrderItems($id);
    $order['customerName'] = $order['customer_name'];
    
    jsonResponse(['order' => $order, 'data' => $order]);
};
