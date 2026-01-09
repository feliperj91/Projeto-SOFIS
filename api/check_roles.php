<?php
require 'db.php';
$stmt = $pdo->query("SELECT * FROM role_permissions");
$roles = $stmt->fetchAll();
echo json_encode($roles);
?>
