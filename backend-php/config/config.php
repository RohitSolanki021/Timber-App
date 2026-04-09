<?php
/**
 * Natural Plylam B2B API - Configuration
 */

// Load environment variables
if (file_exists(__DIR__ . '/../.env')) {
    $lines = file(__DIR__ . '/../.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '#') === 0) continue;
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $_ENV[trim($key)] = trim($value);
            putenv(trim($key) . '=' . trim($value));
        }
    }
}

// Configuration constants
define('MONGO_URL', getenv('MONGO_URL') ?: 'mongodb://localhost:27017');
define('DB_NAME', getenv('DB_NAME') ?: 'plylam_admin');
define('JWT_SECRET', getenv('JWT_SECRET') ?: 'plylam_secret_key_2024');
define('JWT_EXPIRY', 86400 * 7); // 7 days

// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
