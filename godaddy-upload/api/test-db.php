<?php
/**
 * Database Connection Test
 * Access via: http://your-domain/api/test-db.php
 * 
 * EDIT THE VALUES BELOW WITH YOUR ACTUAL DATABASE CREDENTIALS
 */

header('Content-Type: application/json');

// ========== EDIT THESE VALUES ==========
$DB_HOST = 'localhost';
$DB_NAME = 'your_database_name';  // Change this
$DB_USER = 'your_username';        // Change this
$DB_PASS = 'your_password';        // Change this
// =======================================

$response = [
    'step1_php' => 'OK - PHP is working',
    'step2_pdo' => 'Testing...',
    'step3_connection' => 'Testing...',
    'step4_tables' => 'Testing...'
];

// Check PDO extension
if (!extension_loaded('pdo_mysql')) {
    $response['step2_pdo'] = 'FAILED - PDO MySQL extension not loaded';
    echo json_encode($response, JSON_PRETTY_PRINT);
    exit;
}
$response['step2_pdo'] = 'OK - PDO MySQL extension loaded';

// Try to connect
try {
    $dsn = "mysql:host={$DB_HOST};dbname={$DB_NAME};charset=utf8mb4";
    $pdo = new PDO($dsn, $DB_USER, $DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
    $response['step3_connection'] = 'OK - Connected to database';
    
    // Check if users table exists
    $stmt = $pdo->query("SHOW TABLES LIKE 'users'");
    if ($stmt->rowCount() > 0) {
        $response['step4_tables'] = 'OK - Tables exist (schema imported)';
        
        // Check for admin user
        $stmt = $pdo->query("SELECT email FROM users WHERE email = 'admin@naturalplylam.com'");
        if ($stmt->rowCount() > 0) {
            $response['step5_admin'] = 'OK - Admin user exists';
        } else {
            $response['step5_admin'] = 'WARNING - Admin user not found. Re-import schema.sql';
        }
    } else {
        $response['step4_tables'] = 'FAILED - No tables found. Import schema.sql first!';
    }
    
} catch (PDOException $e) {
    $response['step3_connection'] = 'FAILED - ' . $e->getMessage();
}

echo json_encode($response, JSON_PRETTY_PRINT);
