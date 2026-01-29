<?php
// api/auth.php
require 'db.php';

// Set session lifetime to 12 hours (43200 seconds)
ini_set('session.gc_maxlifetime', 43200);
ini_set('session.cookie_lifetime', 43200);
session_set_cookie_params(43200);
session_start();

$action = $_GET['action'] ?? '';

if ($action === 'login') {
    $input = json_decode(file_get_contents('php://input'), true);
    $username = $input['username'] ?? '';
    $password = $input['password'] ?? '';

    try {
        $stmt = $pdo->prepare('SELECT id, username, full_name, password_hash, roles, permissions, is_active, force_password_reset FROM users WHERE username = ?');
        $stmt->execute([$username]);
        $user = $stmt->fetch();
        
        if ($user) {
            $user['roles'] = str_replace(['{', '}', '"'], '', $user['roles']);
            $user['roles'] = explode(',', $user['roles']);
        }

        if ($user && password_verify($password, $user['password_hash'])) {
            // Security: Prevent session fixation
            session_regenerate_id(true);

            if (!$user['is_active']) {
                http_response_code(403); // Forbidden
                echo json_encode(['error' => 'Sua conta está desativada. Entre em contato com o administrador.']);
                exit;
            }

            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['roles'] = $user['roles'];
            $_SESSION['permissions'] = $user['permissions'];
            $_SESSION['full_name'] = $user['full_name'];

            echo json_encode(['success' => true, 'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'full_name' => $user['full_name'],
                'roles' => $user['roles'],
                'permissions' => json_decode($user['permissions']),
                'force_password_reset' => (bool)$user['force_password_reset']
            ]]);
        } else {
            http_response_code(401); // Unauthorized
            echo json_encode(['error' => 'Usuário ou senha inválidos']);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Erro de banco de dados: ' . $e->getMessage()]);
    }
} elseif ($action === 'logout') {
    session_destroy();
    echo json_encode(['success' => true]);
} elseif ($action === 'check') {
    if (isset($_SESSION['user_id'])) {
        try {
            // Reload permissions from database on every check
            // This allows instant permission updates with just F5
            $stmt = $pdo->prepare('SELECT roles, permissions FROM users WHERE id = ?');
            $stmt->execute([$_SESSION['user_id']]);
            $user = $stmt->fetch();

            if ($user) {
                $user['roles'] = str_replace(['{', '}', '"'], '', $user['roles']);
                $user['roles'] = explode(',', $user['roles']);
            }
            
            // Update session with fresh roles and permissions
            if ($user) {
                if ($user['permissions']) $_SESSION['permissions'] = $user['permissions'];
                if ($user['roles']) $_SESSION['roles'] = $user['roles'];
            }
            
            echo json_encode(['authenticated' => true, 'user' => [
                'id' => $_SESSION['user_id'],
                'username' => $_SESSION['username'],
                'full_name' => $_SESSION['full_name'],
                'roles' => $_SESSION['roles'],
                'permissions' => json_decode($_SESSION['permissions'] ?? '{}')
            ]]);
        } catch (PDOException $e) {
            // Fallback to cached permissions if DB query fails
            echo json_encode(['authenticated' => true, 'user' => [
                'id' => $_SESSION['user_id'],
                'username' => $_SESSION['username'],
                'full_name' => $_SESSION['full_name'],
                'role' => $_SESSION['role'],
                'permissions' => json_decode($_SESSION['permissions'] ?? '{}')
            ]]);
        }
    } else {
        echo json_encode(['authenticated' => false]);
    }
} elseif ($action === 'check_reset') {
    $username = $_GET['username'] ?? '';
    try {
        $stmt = $pdo->prepare('SELECT password_hash FROM users WHERE username = ?');
        $stmt->execute([$username]);
        $user = $stmt->fetch();
        
        if ($user && $user['password_hash'] === 'RESET_PENDING') {
            echo json_encode(['status' => 'reset_pending']);
        } else {
            echo json_encode(['status' => 'normal']);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
} elseif ($action === 'complete_reset') {
    $input = json_decode(file_get_contents('php://input'), true);
    $username = $input['username'] ?? '';
    $newPassword = $input['new_password'] ?? '';
    
    if (empty($username) || empty($newPassword)) {
        http_response_code(400);
        echo json_encode(['error' => 'Dados incompletos']);
        exit;
    }
    
    try {
        // Double check status
        $stmt = $pdo->prepare('SELECT id, password_hash, roles, full_name, permissions, is_active FROM users WHERE username = ?');
        $stmt->execute([$username]);
        $user = $stmt->fetch();
        
        if (!$user || $user['password_hash'] !== 'RESET_PENDING') {
            http_response_code(403);
            echo json_encode(['error' => 'Esta conta não está em modo de redefinição ou não existe.']);
            exit;
        }
        
        // Update Password and Clear Reset Flag
        $newHash = password_hash($newPassword, PASSWORD_BCRYPT);
        // Force reset becomes false because user just defined the password
        $upd = $pdo->prepare('UPDATE users SET password_hash = ?, force_password_reset = FALSE WHERE id = ?');
        $upd->execute([$newHash, $user['id']]);
        
        // Auto-login logic
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $username;
        
        $user['roles'] = str_replace(['{', '}', '"'], '', $user['roles']);
        $user['roles'] = explode(',', $user['roles']);
        
        $_SESSION['roles'] = $user['roles'];
        $_SESSION['permissions'] = $user['permissions'];
        $_SESSION['full_name'] = $user['full_name'];
        
        echo json_encode(['success' => true, 'user' => [
            'id' => $user['id'],
            'username' => $username,
            'full_name' => $user['full_name'],
            'roles' => $user['roles'],
            'permissions' => json_decode($user['permissions'])
        ]]);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
} else {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid action']);
}
?>
