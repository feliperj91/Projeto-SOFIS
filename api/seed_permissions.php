<?php
require 'db.php';

$permissions_admin = json_encode(['can_view_users' => true, 'can_edit_users' => true, 'can_delete_users' => true, 'can_view_clients' => true, 'can_edit_clients' => true, 'can_delete_clients' => true]);
$permissions_tecnico = json_encode(['can_view_users' => false, 'can_edit_users' => false, 'can_delete_users' => false, 'can_view_clients' => true, 'can_edit_clients' => true, 'can_delete_clients' => false]);

// Upsert for ADMINISTRADOR
$sql = "INSERT INTO role_permissions (role, permissions) VALUES ('ADMINISTRADOR', '$permissions_admin') 
        ON CONFLICT (role) DO UPDATE SET permissions = '$permissions_admin'";
$pdo->exec($sql);

// Upsert for TECNICO
$sql = "INSERT INTO role_permissions (role, permissions) VALUES ('TECNICO', '$permissions_tecnico') 
        ON CONFLICT (role) DO UPDATE SET permissions = '$permissions_tecnico'";
$pdo->exec($sql);

echo "Permissions seeded successfully.";
?>
