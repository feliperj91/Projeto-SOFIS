<?php
// api/sync_users_permissions.php
require 'db.php';

header('Content-Type: application/json');

try {
    // 1. Fetch all role permissions first to minimize DB hits
    $stmt = $pdo->query("SELECT role_name, module, can_view, can_create, can_edit, can_delete FROM role_permissions");
    $rawPermissions = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $rolePermissions = [];
    foreach ($rawPermissions as $row) {
        $role = $row['role_name'];
        if (!isset($rolePermissions[$role])) {
            $rolePermissions[$role] = [];
        }
        $rolePermissions[$role][$row['module']] = [
            'can_view' => (bool)$row['can_view'],
            'can_create' => (bool)$row['can_create'],
            'can_edit' => (bool)$row['can_edit'],
            'can_delete' => (bool)$row['can_delete']
        ];
    }

    // 2. Fetch all users
    $stmtUsers = $pdo->query("SELECT id, username, role FROM users");
    $users = $stmtUsers->fetchAll(PDO::FETCH_ASSOC);

    $updatedCount = 0;

    foreach ($users as $user) {
        $role = $user['role'];
        if (isset($rolePermissions[$role])) {
            $newPermissions = $rolePermissions[$role];
            $jsonPermissions = json_encode($newPermissions);

            $updateStmt = $pdo->prepare("UPDATE users SET permissions = ? WHERE id = ?");
            $updateStmt->execute([$jsonPermissions, $user['id']]);
            $updatedCount++;
        }
    }

    echo json_encode([
        'success' => true,
        'message' => "Permissions synced for $updatedCount users.",
        'details' => "Updated users based on their roles: " . implode(', ', array_keys($rolePermissions))
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error: ' . $e->getMessage()]);
}
