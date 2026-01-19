<?php
// api/version-history.php
// Suppress warnings/notices to prevent HTML output breaking JSON
error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING);
ini_set('display_errors', 0);

header('Content-Type: application/json');

try {
    require 'db.php';

    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'DELETE') {
        session_start();
        
        $historyId = $_GET['id'] ?? null;
        if (!$historyId) {
            http_response_code(400);
            echo json_encode(['error' => 'History ID is required']);
            exit;
        }
        
        $currentUser = $_SESSION['username'] ?? null;
        $userRole = $_SESSION['role'] ?? null;
        if (!$currentUser) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized']);
            exit;
        }
        
        // Verify ownership
        $stmt = $pdo->prepare("SELECT updated_by FROM version_history WHERE id = ?");
        $stmt->execute([$historyId]);
        $history = $stmt->fetch();
        
        if (!$history) {
            http_response_code(404);
            echo json_encode(['error' => 'History record not found']);
            exit;
        }
        
        if ($history['updated_by'] !== $currentUser && $userRole !== 'ADMINISTRADOR') {
            http_response_code(403);
            echo json_encode(['error' => 'Sua permissão não permite excluir registros de outros usuários.']);
            exit;
        }
        
        // Delete
        $stmt = $pdo->prepare("DELETE FROM version_history WHERE id = ?");
        $stmt->execute([$historyId]);
        
        echo json_encode(['success' => true]);

    } elseif ($method === 'PUT') {
        session_start();
        
        $historyId = $_GET['id'] ?? null;
        if (!$historyId) {
            http_response_code(400);
            echo json_encode(['error' => 'History ID is required']);
            exit;
        }
        
        $currentUser = $_SESSION['username'] ?? null;
        $userRole = $_SESSION['role'] ?? null;
        if (!$currentUser) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized']);
            exit;
        }
        
        // Verify ownership
        $stmt = $pdo->prepare("SELECT updated_by FROM version_history WHERE id = ?");
        $stmt->execute([$historyId]);
        $history = $stmt->fetch();
        
        if (!$history) {
            http_response_code(404);
            echo json_encode(['error' => 'History record not found']);
            exit;
        }
        
        if ($history['updated_by'] !== $currentUser && $userRole !== 'ADMINISTRADOR') {
            http_response_code(403);
            echo json_encode(['error' => 'Sua permissão não permite editar registros de outros usuários.']);
            exit;
        }
        
        // Update
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Update version_history table
        $stmt = $pdo->prepare("UPDATE version_history SET new_version = ?, notes = ? WHERE id = ?");
        $stmt->execute([
            $input['new_version'],
            $input['notes'],
            $historyId
        ]);
        
        // Update version_controls table
        if (isset($input['version_control_id'])) {
            $controlStmt = $pdo->prepare("UPDATE version_controls SET system = ?, environment = ?, updated_at = ? WHERE id = ?");
            $controlStmt->execute([
                $input['system'],
                $input['environment'],
                $input['updated_at'],
                $input['version_control_id']
            ]);
        }
        
        echo json_encode(['success' => true]);
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Internal Server Error: ' . $e->getMessage()]);
}
