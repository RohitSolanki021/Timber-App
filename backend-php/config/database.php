<?php
/**
 * Database Connection
 */

require_once __DIR__ . '/../vendor/autoload.php';

use MongoDB\Client;

class Database {
    private static $instance = null;
    private $client;
    private $db;

    private function __construct() {
        try {
            $this->client = new Client(MONGO_URL);
            $this->db = $this->client->selectDatabase(DB_NAME);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
            exit();
        }
    }

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function getDB() {
        return $this->db;
    }

    public function getCollection($name) {
        return $this->db->selectCollection($name);
    }
}

// Helper function to get database
function getDB() {
    return Database::getInstance()->getDB();
}

function getCollection($name) {
    return Database::getInstance()->getCollection($name);
}
