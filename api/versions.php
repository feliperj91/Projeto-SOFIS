<?php
// api/versions.php
require 'db.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method === 'GET') {
    if ($action === 'history') {
        // Fetch history for specific versions
        if (!isset($_GET['client_id'])) {
             echo json_encode([]); exit;
        }
        // Simplified Logic: Get history for all versions of this client
        $sql = "
            SELECT vh.*, vc.system, vc.environment, vc.updated_at as vc_updated_at,
                   COALESCE(u.full_name, vh.updated_by) as updated_by_name
            FROM version_history vh
            JOIN version_controls vc ON vh.version_control_id = vc.id
            LEFT JOIN users u ON vh.updated_by = u.username
            WHERE vc.client_id = ?
            ORDER BY vh.created_at DESC
        ";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$_GET['client_id']]);
        $results = $stmt->fetchAll();
        
        // Restructure to match frontend expectations
        $formatted = [];
        foreach ($results as $row) {
            $formatted[] = [
                'id' => $row['id'],
                'version_control_id' => $row['version_control_id'],
                'new_version' => $row['new_version'],
                'updated_by' => $row['updated_by'],  // Keep original for ownership check
                'updated_by_name' => $row['updated_by_name'], // Display name
                'notes' => $row['notes'],
                'created_at' => $row['created_at'],
                'version_controls' => [
                    'system' => $row['system'],
                    'environment' => $row['environment'],
                    'updated_at' => $row['vc_updated_at'],
                    'client_id' => $_GET['client_id']
                ]
            ];
        }
        
        echo json_encode($formatted);

    } else {
        // List main versions
        // Supports basic filtering via query params if needed
        $sql = "
            SELECT vc.*, c.name as client_name 
            FROM version_controls vc
            LEFT JOIN clients c ON vc.client_id = c.id
            ORDER BY vc.updated_at DESC
        ";
        $stmt = $pdo->query($sql);
        $data = $stmt->fetchAll();
        
        // Structure data to match expected frontend format (client object nested)
        foreach ($data as &$row) {
            $row['clients'] = ['id' => $row['client_id'], 'name' => $row['client_name']];
        }
        echo json_encode($data);
    }
} elseif ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Auto-fill updated_at if not present
    $updatedAt = $input['updated_at'] ?? date('Y-m-d H:i:s');

    $sql = "INSERT INTO version_controls (client_id, system, version, environment, updated_at, responsible, notes, has_alert) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $input['client_id'],
        $input['system'],
        $input['version'],
        $input['environment'],
        $updatedAt,
        $input['responsible'],
        $input['notes'],
        ($input['has_alert'] ? 'true' : 'false')
    ]);
    
    $newId = $pdo->lastInsertId();

    // Log History
    $histSql = "INSERT INTO version_history (version_control_id, new_version, updated_by, notes) VALUES (?, ?, ?, ?)";
    $histStmt = $pdo->prepare($histSql);
    $histStmt->execute([
        $newId,
        $input['version'],
        $input['responsible'],
        $input['notes']
    ]);

    echo json_encode(['success' => true, 'id' => $newId]);

} elseif ($method === 'PUT') {
    // Update existing version
    $input = json_decode(file_get_contents('php://input'), true);
    if (!isset($_GET['id'])) {
        http_response_code(400); echo json_encode(['error' => 'ID missing']); exit;
    }

    $sql = "UPDATE version_controls SET client_id=?, system=?, version=?, environment=?, updated_at=?, responsible=?, notes=?, has_alert=? WHERE id=?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $input['client_id'],
        $input['system'],
        $input['version'],
        $input['environment'],
        $input['updated_at'],
        $input['responsible'],
        $input['notes'],
         ($input['has_alert'] ? 'true' : 'false'),
        $_GET['id']
    ]);
    
    // Log History
    $histSql = "INSERT INTO version_history (version_control_id, new_version, updated_by, notes) VALUES (?, ?, ?, ?)";
    $histStmt = $pdo->prepare($histSql);
    $histStmt->execute([
        $_GET['id'],
        $input['version'],
        $input['responsible'],
        $input['notes']
    ]);

    echo json_encode(['success' => true]);

} elseif ($method === 'DELETE') {
    // Handle Smart Delete
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Check if we are doing a smart delete (by matching fields) or simple ID
    if (isset($_GET['smart']) && isset($_GET['client_id'])) {
        $sql = "DELETE FROM version_controls WHERE client_id = ? AND system = ? AND environment = ? AND version = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $_GET['client_id'],
            $_GET['system'],
            $_GET['environment'],
            $_GET['version']
        ]);
    } else {
        if (!isset($_GET['id'])) {
            http_response_code(400); echo json_encode(['error' => 'ID missing']); exit;
        }
        $stmt = $pdo->prepare("DELETE FROM version_controls WHERE id = ?");
        $stmt->execute([$_GET['id']]);
    }
    
    echo json_encode(['success' => true]);
}
?>
