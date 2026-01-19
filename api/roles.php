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
            $modules = [
                'Gestão de Clientes', 'Servidores', 'Dados de Acesso (SQL)', 
                'Dados de Acesso (VPN)', 'URLs', 'Dados de Contato', 'Logs e Atividades',
                'Controle de Versões', 'Dashboard', 'Produtos',
                'Gestão de Usuários', 'Grupos de Acesso', 'Usuários', 'Permissões', 'Logs de Auditoria', 'Reset de Senha'
            ];
            
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

    case 'PUT':
        $input = json_decode(file_get_contents('php://input'), true);
        $oldName = $_GET['name'] ?? '';
        $newName = strtoupper($input['name'] ?? '');

        if (empty($oldName) || empty($newName)) {
            http_response_code(400);
            echo json_encode(['error' => 'Nomes atual e novo são obrigatórios']);
            exit;
        }

        if (in_array($oldName, ['ADMINISTRADOR', 'TECNICO'])) {
            http_response_code(403);
            echo json_encode(['error' => 'Não é permitido renomear grupos do sistema']);
            exit;
        }

        try {
            $pdo->beginTransaction();

            // 1. Atualizar user_roles (name e description)
            $stmt1 = $pdo->prepare("UPDATE user_roles SET name = ?, description = ? WHERE name = ?");
            $stmt1->execute([$newName, $input['description'] ?? '', $oldName]);

            // 2. Atualizar role_permissions
            $stmt2 = $pdo->prepare("UPDATE role_permissions SET role_name = ? WHERE role_name = ?");
            $stmt2->execute([$newName, $oldName]);

            // 3. Atualizar tabela users (coluna roles que é text[])
            // Usamos array_replace para trocar o nome do cargo dentro do array de cargos dos usuários
            $stmt3 = $pdo->prepare("UPDATE users SET roles = array_replace(roles, ?, ?) WHERE ? = ANY(roles)");
            $stmt3->execute([$oldName, $newName, $oldName]);

            $pdo->commit();
            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    case 'DELETE':
        $name = $_GET['name'] ?? null;
        if (!$name) {
            http_response_code(400);
            echo json_encode(['error' => 'Nome do grupo ausente']);
            exit;
        }

        if (in_array(strtoupper($name), ['ADMINISTRADOR', 'TECNICO', 'ANALISTA'])) {
            http_response_code(403);
            echo json_encode(['error' => 'Grupos do sistema não podem ser removidos']);
            exit;
        }

        try {
            // Verificar se existem usuários vinculados (usando a nova coluna roles text[])
            $checkUsers = $pdo->prepare("SELECT count(*) FROM users WHERE ? = ANY(roles)");
            $checkUsers->execute([$name]);
            $count = $checkUsers->fetchColumn();
            
            if ($count > 0) {
                http_response_code(409);
                echo json_encode(['error' => "Não é possível excluir: Este grupo possui $count usuário(s) vinculado(s)."]);
                exit;
            }

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
