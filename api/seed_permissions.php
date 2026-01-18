<?php
require 'db.php';

// role_permissions uses: role_name, module, can_view, can_create, can_edit, can_delete

$roles = [
    'ADMINISTRADOR' => [
        'Logs e Atividades'            => [1,1,1,1],
        'Gestão de Clientes'           => [1,1,1,1], // Was 'Clientes e Contatos', renamed to be specific to client entity
        'Dados de Contato'             => [1,1,1,1],
        'Dados de Acesso (SQL)'        => [1,1,1,1],
        'Dados de Acesso (VPN)'        => [1,1,1,1],
        'URLs'                         => [1,1,1,1],
        'Gestão de Usuários'           => [1,1,1,1],
        'Usuários'                     => [1,1,1,1],
        'Permissões'                   => [1,1,1,1],
        'Logs de Auditoria'            => [1,1,1,1],
        'Reset de Senha'               => [1,1,1,1],
        'Controle de Versões'          => [1,1,1,1],
        'Produtos' => [1,1,1,1]
    ],
    'TECNICO' => [
        'Logs e Atividades'            => [1,0,0,0],
        'Gestão de Clientes'           => [1,1,1,0],
        'Dados de Contato'             => [1,1,1,0],
        'Dados de Acesso (SQL)'        => [1,1,1,0],
        'Dados de Acesso (VPN)'        => [1,1,1,0],
        'URLs'                         => [1,1,1,0],
        'Gestão de Usuários'           => [0,0,0,0],
        'Usuários'                     => [0,0,0,0],
        'Permissões'                   => [0,0,0,0],
        'Logs de Auditoria'            => [0,0,0,0],
        'Reset de Senha'               => [0,0,0,0],
        'Controle de Versões'          => [1,1,1,0],
        'Produtos' => [1,1,1,0]
    ],
    'ANALISTA' => [
        'Logs e Atividades'            => [1,1,0,0],
        'Gestão de Clientes'           => [1,1,1,0],
        'Dados de Contato'             => [1,1,1,0],
        'Dados de Acesso (SQL)'        => [1,0,0,0],
        'Dados de Acesso (VPN)'        => [1,0,0,0],
        'URLs'                         => [1,0,0,0],
        'Gestão de Usuários'           => [0,0,0,0],
        'Usuários'                     => [0,0,0,0],
        'Permissões'                   => [0,0,0,0],
        'Logs de Auditoria'            => [0,0,0,0],
        'Reset de Senha'               => [0,0,0,0],
        'Controle de Versões'          => [1,1,1,0],
        'Produtos' => [1,1,1,0]
    ]
];

$sql = "INSERT INTO role_permissions (role_name, module, can_view, can_create, can_edit, can_delete) 
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT (role_name, module) DO UPDATE 
        SET can_view=EXCLUDED.can_view, can_create=EXCLUDED.can_create, can_edit=EXCLUDED.can_edit, can_delete=EXCLUDED.can_delete";

$stmt = $pdo->prepare($sql);

foreach ($roles as $roleName => $modules) {
    foreach ($modules as $modName => $perms) {
        $stmt->execute([
            $roleName, 
            $modName, 
            $perms[0] ? 't' : 'f', 
            $perms[1] ? 't' : 'f', 
            $perms[2] ? 't' : 'f', 
            $perms[3] ? 't' : 'f'
        ]);
    }
}

echo "Permissions seeded successfully (Granular Schema).";
?>
