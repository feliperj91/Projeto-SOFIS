<?php
// api/roles.php
require 'db.php';

header('Content-Type: application/json');
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        try {
            // Retorna todos os grupos da tabela de roles
            $stmt = $pdo->query("SELECT * FROM user_roles ORDER BY name ASC");
            echo json_encode($stmt->fetchAll());
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        if (empty($input['name'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Nome do grupo é obrigatório']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("INSERT INTO user_roles (name, description) VALUES (?, ?)");
            $stmt->execute([strtoupper($input['name']), $input['description'] ?? '']);
            
            // Inicializar permissões vazias para o novo grupo para os módulos conhecidos
            // Isso evita que o grupo apareça sem linhas na tabela de permissões
            $modules = ['Logs e Atividades', 'Clientes e Contatos', 'Infraestruturas', 'Gestão de Usuários', 'Controle de Versões', 'Usuários', 'Permissões', 'Logs de Auditoria', 'Dashboard', 'Produtos', 'Servidores', 'Dados de Acesso (SQL)', 'Dados de Acesso (VPN)', 'URLs', 'Dados de Contato', 'Reset de Senha'];
            
            $permStmt = $pdo->prepare("INSERT INTO role_permissions (role_name, module, can_view, can_create, can_edit, can_delete) VALUES (?, ?, false, false, false, false) ON CONFLICT DO NOTHING");
            foreach ($modules as $mod) {
                $permStmt->execute([strtoupper($input['name']), $mod]);
            }

            echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
        } catch (PDOException $e) {
            if ($e->getCode() == 23505) {
                http_response_code(409);
                echo json_encode(['error' => 'Este grupo já existe']);
            } else {
                http_response_code(500);
                echo json_encode(['error' => $e->getMessage()]);
            }
        }
        break;

    case 'DELETE':
        $name = $_GET['name'] ?? null;
        if (!$name) {
            http_response_code(400);
            echo json_encode(['error' => 'Nome do grupo ausente']);
            exit;
        }

        if (in_array(strtoupper($name), ['ADMINISTRADOR', 'TECNICO'])) {
            http_response_code(403);
            echo json_encode(['error' => 'Grupos do sistema não podem ser removidos']);
            exit;
        }

        try {
            $pdo->beginTransaction();
            
            // Remover permissões personalizadas
            $stmt1 = $pdo->prepare("DELETE FROM role_permissions WHERE role_name = ?");
            $stmt1->execute([$name]);

            // Remover o grupo
            $stmt2 = $pdo->prepare("DELETE FROM user_roles WHERE name = ?");
            $stmt2->execute([$name]);

            $pdo->commit();
            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;
}
?>
