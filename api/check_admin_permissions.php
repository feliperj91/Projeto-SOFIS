<?php
require 'db.php';
header('Content-Type: application/json');

$stmt = $pdo->query("SELECT username, permissions FROM users WHERE username = 'admin' OR username = 'felipe'");
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($users);
?>
