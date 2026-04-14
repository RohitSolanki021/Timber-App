<?php
/**
 * Simple PHP Router for IIS - No URL Rewrite Required
 * Access API via: /api/router.php?path=login
 */

// Set the path from query parameter
$_SERVER['REQUEST_URI'] = '/api/' . ($_GET['path'] ?? 'health');

// Include the main API
require_once __DIR__ . '/index.php';
