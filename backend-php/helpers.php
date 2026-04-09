<?php
/**
 * Helper Functions
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
    echo json_encode($data);
    exit();
}

function errorResponse($message, $status = 400) {
    http_response_code($status);
    echo json_encode(['error' => $message, 'detail' => $message]);
    exit();
}

function mongoDateToISO($date) {
    if ($date instanceof MongoDB\BSON\UTCDateTime) {
        return $date->toDateTime()->format('c');
    }
    return $date;
}

function documentToArray($doc) {
    if ($doc === null) return null;
    
    $arr = (array) $doc;
    
    // Remove _id or convert to string
    if (isset($arr['_id'])) {
        unset($arr['_id']);
    }
    
    // Convert dates
    foreach ($arr as $key => $value) {
        if ($value instanceof MongoDB\BSON\UTCDateTime) {
            $arr[$key] = $value->toDateTime()->format('c');
        }
    }
    
    return $arr;
}

function documentsToArray($cursor) {
    $result = [];
    foreach ($cursor as $doc) {
        $result[] = documentToArray($doc);
    }
    return $result;
}

function getCurrentTimestamp() {
    return (new DateTime('now', new DateTimeZone('UTC')))->format('c');
}
