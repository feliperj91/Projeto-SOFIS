<?php
// restore_admin.php
require 'api/db.php';

try {
    // JSON string for full administrator permissions
    $adminPermissions = json_encode([
        "view_client" => true,
        "create_client" => true, 
        "edit_client" => true,
        "delete_client" => true,
        "view_users" => true,
        "manage_users" => true
    ]);

    // Force update for all users with role ADMINISTRADOR
    $stmt = $pdo->prepare("UPDATE users SET permissions = ? WHERE role = 'ADMINISTRADOR'");
    $stmt->execute([$adminPermissions]);

    echo "✅ Sucesso! Permissões de ADMINISTRADOR restauradas.\n";
    echo "Agora você pode logar novamente para ver o acesso completo.";

} catch (PDOException $e) {
    echo "❌ Erro ao atualizar: " . $e->getMessage();
}
?>
