<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
header('Content-Type: text/plain');

try {
    require 'db.php';
    echo "Connected successfully.\n";
    
    $stmt = $pdo->query("SELECT * FROM clients LIMIT 1");
    if ($stmt) {
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo "Read success. Rows: " . count($data) . "\n";
        print_r($data);
    } else {
        echo "Query failed.\n";
    }
} catch (Throwable $e) {
    echo "Error: " . $e->getMessage();
}
