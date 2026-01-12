<?php
// api/db.php - Database Connection
// Simple connection file without request handling

// Tentar carregar configuração externa (produção)
$configFile = __DIR__ . '/../config/database.php';

if (file_exists($configFile)) {
    require_once $configFile;
    $pdo = getDBConnection();
} else {
    // Configuração de Desenvolvimento Local
    $host = 'localhost';
    $dbname = 'sofis_db';
    $user = 'sofis_user';
    $password = 'sofis123';
    $port = '5432';

    $dsn = "pgsql:host=$host;port=$port;dbname=$dbname";

    try {
        $pdo = new PDO($dsn, $user, $password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
        exit;
    }
}
