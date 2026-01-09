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

    $sql = "SELECT * FROM audit_logs WHERE 1=1";
    $params = [];

    if ($user) { $sql .= " AND (username LIKE ? OR details LIKE ?)"; $params[] = "%$user%"; $params[] = "%$user%"; }
    if ($type) { $sql .= " AND operation_type = ?"; $params[] = $type; }
    if ($start) { $sql .= " AND created_at >= ?"; $params[] = $start; }
    if ($end) { $sql .= " AND created_at <= ?"; $params[] = $end; }

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
}
?>
