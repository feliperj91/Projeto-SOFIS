<?php
// api/audit.php
require 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Optional: Fetch logs for display
    $limit = $_GET['limit'] ?? 50;
    $offset = $_GET['offset'] ?? 0;
    $user = $_GET['user'] ?? null;
    $type = $_GET['type'] ?? null;
    $start = $_GET['start'] ?? null;
    $end = $_GET['end'] ?? null;
    $clientName = $_GET['client_name'] ?? null;

    $sql = "SELECT * FROM audit_logs WHERE 1=1";
    $params = [];

    if ($user) { 
        // Case-insensitive search across username, details, and action
        $sql .= " AND (username ILIKE ? OR details ILIKE ? OR action ILIKE ?)"; 
        $params[] = "%$user%"; 
        $params[] = "%$user%"; 
        $params[] = "%$user%"; 
    }
    if ($type) { $sql .= " AND operation_type = ?"; $params[] = $type; }
    if ($start) { $sql .= " AND created_at >= ?"; $params[] = $start; }
    if ($end) { $sql .= " AND created_at <= ?"; $params[] = $end; }
    if ($clientName) { $sql .= " AND client_name = ?"; $params[] = $clientName; }

    $sql .= " ORDER BY created_at DESC LIMIT $limit OFFSET $offset";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    echo json_encode($stmt->fetchAll());

} elseif ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $sql = "INSERT INTO audit_logs (username, operation_type, action, details, client_name, old_value, new_value) VALUES (?, ?, ?, ?, ?, ?, ?)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $input['username'] ?? 'Sistema',
        $input['operation_type'],
        $input['action'],
        $input['details'],
        $input['client_name'] ?? null,
        json_encode($input['old_value'] ?? null),
        json_encode($input['new_value'] ?? null)
    ]);
    
    echo json_encode(['success' => true]);

} elseif ($method === 'DELETE') {
    session_start();
    
    $logId = $_GET['id'] ?? null;
    if (!$logId) {
        http_response_code(400);
        echo json_encode(['error' => 'Log ID is required']);
        exit;
    }
    
    $currentUser = $_SESSION['username'] ?? null;
    if (!$currentUser) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }
    
    // Verify ownership - only allow deleting own logs
    $stmt = $pdo->prepare("SELECT username FROM audit_logs WHERE id = ?");
    $stmt->execute([$logId]);
    $log = $stmt->fetch();
    
    if (!$log) {
        http_response_code(404);
        echo json_encode(['error' => 'Log not found']);
        exit;
    }
    
    if ($log['username'] !== $currentUser) {
        http_response_code(403);
        echo json_encode(['error' => 'You can only delete your own logs']);
        exit;
    }
    
    // Delete the log
    $stmt = $pdo->prepare("DELETE FROM audit_logs WHERE id = ?");
    $stmt->execute([$logId]);
    
    echo json_encode(['success' => true]);
}
?>
