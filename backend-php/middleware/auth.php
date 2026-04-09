<?php
/**
 * JWT Authentication Middleware
 */

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

function generateToken($payload) {
    $payload['iat'] = time();
    $payload['exp'] = time() + JWT_EXPIRY;
    return JWT::encode($payload, JWT_SECRET, 'HS256');
}

function verifyToken() {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    
    if (empty($authHeader) || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        http_response_code(401);
        echo json_encode(['error' => 'No token provided']);
        exit();
    }
    
    $token = $matches[1];
    
    try {
        $decoded = JWT::decode($token, new Key(JWT_SECRET, 'HS256'));
        return (array) $decoded;
    } catch (Exception $e) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid token: ' . $e->getMessage()]);
        exit();
    }
}

function optionalAuth() {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    
    if (empty($authHeader) || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        return null;
    }
    
    try {
        $decoded = JWT::decode($matches[1], new Key(JWT_SECRET, 'HS256'));
        return (array) $decoded;
    } catch (Exception $e) {
        return null;
    }
}

function requireRole($allowedRoles) {
    $payload = verifyToken();
    $role = strtolower($payload['role'] ?? '');
    
    $allowed = array_map('strtolower', $allowedRoles);
    if (!in_array($role, $allowed)) {
        http_response_code(403);
        echo json_encode(['error' => 'Access denied']);
        exit();
    }
    
    return $payload;
}
