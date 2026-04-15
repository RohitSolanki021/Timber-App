<?php
/**
 * Simple Test Script - Upload this to test PHP is working
 * Access via: http://your-domain/test.php
 */

header('Content-Type: application/json');

echo json_encode([
    'status' => 'PHP is working!',
    'php_version' => phpversion(),
    'server' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
    'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'Unknown',
    'script_path' => __FILE__,
    'timestamp' => date('Y-m-d H:i:s')
], JSON_PRETTY_PRINT);
