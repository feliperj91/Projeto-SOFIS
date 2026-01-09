<?php
// api/auth.php
require 'db.php';

session_start();

$action = $_GET['action'] ?? '';

if ($action === 'login') {
    $input = json_decode(file_get_contents('php://input'), true);
    $username = $input['username'] ?? '';
    $password = $input['password'] ?? '';

    $stmt = $pdo->prepare('SELECT * FROM users WHERE username = ?');
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password_hash'])) {
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['role'] = $user['role'];
        $_SESSION['permissions'] = $user['permissions'];
        $_SESSION['full_name'] = $user['full_name'];

        echo json_encode(['success' => true, 'user' => [
            'id' => $user['id'],
            'username' => $user['username'],
            'full_name' => $user['full_name'],
            'role' => $user['role'],
            'permissions' => json_decode($user['permissions'])
        ]]);
    } else {
        http_response_code(401); // Unauthorized
        echo json_encode(['error' => 'Usuário ou senha inválidos']);
    }
} elseif ($action === 'logout') {
    session_destroy();
    echo json_encode(['success' => true]);
} elseif ($action === 'check') {
    if (isset($_SESSION['user_id'])) {
        echo json_encode(['authenticated' => true, 'user' => [
            'id' => $_SESSION['user_id'],
            'username' => $_SESSION['username'],
            'full_name' => $_SESSION['full_name'],
            'role' => $_SESSION['role'],
            'permissions' => json_decode($_SESSION['permissions'] ?? '{}')
        ]]);
    } else {
        echo json_encode(['authenticated' => false]);
    }
} else {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid action']);
}
?>
