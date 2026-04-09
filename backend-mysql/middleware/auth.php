<?php
/**
 * JWT Authentication Middleware for MySQL Backend
 */

class JWT {
    private static $alg = 'HS256';
    
    public static function encode($payload, $secret) {
        $header = ['typ' => 'JWT', 'alg' => self::$alg];
        
        $segments = [];
        $segments[] = self::base64UrlEncode(json_encode($header));
        $segments[] = self::base64UrlEncode(json_encode($payload));
        
        $signingInput = implode('.', $segments);
        $signature = self::sign($signingInput, $secret);
        $segments[] = self::base64UrlEncode($signature);
        
        return implode('.', $segments);
    }
    
    public static function decode($token, $secret) {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            throw new Exception('Invalid token format');
        }
        
        list($header64, $payload64, $sig64) = $parts;
        
        $header = json_decode(self::base64UrlDecode($header64), true);
        $payload = json_decode(self::base64UrlDecode($payload64), true);
        $signature = self::base64UrlDecode($sig64);
        
        // Verify signature
        $signingInput = $header64 . '.' . $payload64;
        $expectedSig = self::sign($signingInput, $secret);
        
        if (!hash_equals($expectedSig, $signature)) {
            throw new Exception('Invalid signature');
        }
        
        // Check expiration
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            throw new Exception('Token expired');
        }
        
        return $payload;
    }
    
    private static function sign($input, $secret) {
        return hash_hmac('sha256', $input, $secret, true);
    }
    
    private static function base64UrlEncode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
    
    private static function base64UrlDecode($data) {
        return base64_decode(strtr($data, '-_', '+/'));
    }
}

function generateToken($payload) {
    $payload['iat'] = time();
    $payload['exp'] = time() + JWT_EXPIRY;
    return JWT::encode($payload, JWT_SECRET);
}

function verifyToken() {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    
    if (empty($authHeader) || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        http_response_code(401);
        echo json_encode(['error' => 'No token provided', 'detail' => 'Missing or invalid authorization header']);
        exit();
    }
    
    $token = $matches[1];
    
    try {
        $decoded = JWT::decode($token, JWT_SECRET);
        return $decoded;
    } catch (Exception $e) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid token', 'detail' => $e->getMessage()]);
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
        return JWT::decode($matches[1], JWT_SECRET);
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
        echo json_encode(['error' => 'Access denied', 'detail' => 'Insufficient permissions']);
        exit();
    }
    
    return $payload;
}
