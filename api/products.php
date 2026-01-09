<?php
// api/products.php
require 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $stmt = $pdo->query('SELECT * FROM products ORDER BY name ASC');
        echo json_encode($stmt->fetchAll());
        break;

    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        $sql = "INSERT INTO products (name, version_type) VALUES (?, ?)";
        $stmt = $pdo->prepare($sql);
        try {
            $stmt->execute([
                $input['name'],
                $input['version_type'] ?? 'Pacote'
            ]);
            echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
        } catch (PDOException $e) {
            http_response_code(400);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    case 'PUT':
        $input = json_decode(file_get_contents('php://input'), true);
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'ID missing']);
            exit;
        }
        $sql = "UPDATE products SET name = ?, version_type = ? WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $input['name'],
            $input['version_type'],
            $_GET['id']
        ]);
        echo json_encode(['success' => true]);
        break;

    case 'DELETE':
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'ID missing']);
            exit;
        }
        $stmt = $pdo->prepare("DELETE FROM products WHERE id = ?");
        $stmt->execute([$_GET['id']]);
        echo json_encode(['success' => true]);
        break;
}
?>
