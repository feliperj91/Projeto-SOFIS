document.addEventListener('DOMContentLoaded', async () => {
    const user = JSON.parse(localStorage.getItem('sofis_user') || '{}');
    const managementTabBtn = document.getElementById('btnUserManagement');

    // Guarda de Autenticação para Aba de Gestão
    document.addEventListener('permissions-loaded', checkUserManagementAccess);
    // Verificar se já carregou
    if (window.Permissions && window.Permissions.rules) checkUserManagementAccess();

    // Guarda de Autenticação para Aba de Gestão e Controles Internos
    function checkUserManagementAccess() {
        if (window.Permissions) {
            // Main tab access
            if (managementTabBtn) {
                const canAccess = window.Permissions.can('Gestão de Usuários', 'can_view');
                managementTabBtn.style.display = canAccess ? 'block' : 'none';
            }

            // Visibilidade do Botão de Impressão PDF
            const btnPrintLogs = document.getElementById('btnPrintLogs');
            if (btnPrintLogs) {
                // Check permission to export PDF (uses view permission)
                const canExportPDF = window.Permissions.can('Logs de Auditoria', 'can_view');
                if (canExportPDF) {
                    btnPrintLogs.classList.remove('hidden');
                    btnPrintLogs.style.display = 'flex';
                } else {
                    btnPrintLogs.classList.add('hidden');
                    btnPrintLogs.style.display = 'none';
                }
            }
        }
    }

    // --- Estado & Constantes ---
    let usersList = [];
    let rolesList = []; // Nova lista dinâmica de grupos
    let currentMngTab = 'users';
    let currentSelectedRole = 'ADMINISTRADOR';
    let editingUserId = null;
    let logsPage = 1;
    const logsPerPage = 10;

    const permissionSchema = [
        {
            type: 'guide',
            title: 'Guia Clientes e Contatos',
            items: [
                { module: 'Gestão de Clientes', isHeader: true },
                { module: 'Servidores' },
                { module: 'Dados de Acesso (SQL)' },
                { module: 'Dados de Acesso (VPN)' },
                { module: 'URLs' },
                { module: 'Dados de Contato' },
                { module: 'Logs e Atividades' }
            ]
        },
        {
            type: 'guide',
            title: 'Guia Controle de Versões',
            items: [
                { module: 'Controle de Versões', isHeader: true },
                { module: 'Dashboard' },
                { module: 'Produtos' }
            ]
        },
        {
            type: 'guide',
            title: 'Guia Gerenciamento de Usuários',
            items: [
                { module: 'Gestão de Usuários', label: 'Gerenciamento de Usuários', isHeader: true },
                { module: 'Usuários' },
                { module: 'Permissões' },
                { module: 'Logs de Auditoria' },
                { module: 'Reset de Senha' }
            ]
        }
    ];

    // --- DOM Elements ---
    // --- DOM Elements ---
    const usersContainer = document.getElementById('users-container');
    const permissionsContainer = document.getElementById('permissions-container');
    const mngSubTabBtns = document.querySelectorAll('.mng-tab-btn');
    // Note: mngControlsGroups are mostly gone in new layout using visibility toggles
    const roleTextBtns = document.querySelectorAll('.role-text-btn'); // Renamed from pill
    const roleSelector = document.getElementById('shared-mng-controls');
    const usersListEl = document.getElementById('usersList');
    const permissionsTableBody = document.getElementById('permissionsTableBody');
    const userSearchInput = document.getElementById('userSearchInput');
    const userSearchGroup = document.getElementById('user-search-group');
    const savePermissionsBtn = document.getElementById('savePermissionsBtn');
    const addNewUserBtn = document.getElementById('addNewUserBtn');

    // Logs Controls
    const logsControls = document.getElementById('logs-controls');
    const logSearchInput = document.getElementById('logSearchInput');
    const logStartDate = document.getElementById('logStartDate');
    const logEndDate = document.getElementById('logEndDate');
    const logTypeSelect = document.getElementById('logTypeSelect');
    const btnSearchLogs = document.getElementById('btnSearchLogs');

    // Alternar Visibilidade da Senha
    const toggleUserPasswordBtn = document.getElementById('toggleUserPasswordBtn');
    const userPasswordInput = document.getElementById('userPassword');

    if (toggleUserPasswordBtn && userPasswordInput) {
        toggleUserPasswordBtn.addEventListener('click', () => {
            const type = userPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            userPasswordInput.setAttribute('type', type);

            const icon = toggleUserPasswordBtn.querySelector('i');
            if (type === 'text') {
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    }

    // --- Initialization ---
    // --- Groups (Roles) Management ---
    async function loadRoles() {
        if (!window.api || !window.api.roles) return;
        try {
            const data = await window.api.roles.list();
            rolesList = data || [];
            renderRoleControls();
        } catch (err) {
            console.error('Erro ao carregar grupos:', err.message);
        }
    }

    function renderRoleControls() {
        const roleDropdown = document.getElementById('roleSelectDropdown');
        const userRoleSelect = document.getElementById('userRoleSelect');
        const btnDelete = document.getElementById('btnDeleteSelectedRole');

        if (roleDropdown) {
            roleDropdown.innerHTML = '';
            rolesList.forEach(role => {
                const opt = document.createElement('option');
                opt.value = role.name;
                opt.textContent = role.name;
                roleDropdown.appendChild(opt);
            });
            roleDropdown.value = currentSelectedRole;

            const isSystemRole = ['ADMINISTRADOR', 'TECNICO', 'ANALISTA'].includes(currentSelectedRole);

            // Gerenciar Visibilidade dos Botões de Ação
            const btnDelete = document.getElementById('btnDeleteSelectedRole');
            const btnEdit = document.getElementById('btnEditRoleName');
            const btnCopy = document.getElementById('btnCopyPermissions');

            if (btnDelete) btnDelete.classList.toggle('hidden', isSystemRole);
            if (btnEdit) btnEdit.classList.toggle('hidden', isSystemRole);
            if (btnCopy) btnCopy.classList.remove('hidden');

            if (btnDelete) btnDelete.onclick = () => window.deleteRole(currentSelectedRole);
            if (btnEdit) btnEdit.onclick = () => window.editRoleName(currentSelectedRole);
            if (btnCopy) btnCopy.onclick = () => window.openCopyPermModal(currentSelectedRole);

            roleDropdown.onchange = async (e) => {
                currentSelectedRole = e.target.value;
                const isSys = ['ADMINISTRADOR', 'TECNICO', 'ANALISTA'].includes(currentSelectedRole);

                if (btnDelete) btnDelete.classList.toggle('hidden', isSys);
                if (btnEdit) btnEdit.classList.toggle('hidden', isSys);

                if (currentMngTab === 'users') {
                    const filtered = usersList.filter(u => u.role === currentSelectedRole);
                    renderUsers(filtered);
                } else {
                    await loadPermissions(currentSelectedRole);
                    if (savePermissionsBtn) savePermissionsBtn.disabled = true;
                }
            };
        }

        if (userRoleSelect) {
            const currentVal = userRoleSelect.value;
            userRoleSelect.innerHTML = '<option value="" disabled>Selecione o nível de acesso...</option>';
            rolesList.forEach(role => {
                const opt = document.createElement('option');
                opt.value = role.name;
                opt.textContent = role.name.charAt(0) + role.name.slice(1).toLowerCase();
                userRoleSelect.appendChild(opt);
            });
            if (currentVal) userRoleSelect.value = currentVal;
        }
    }

    window.deleteRole = async function (roleName) {
        const confirmed = await window.showConfirm(
            `Deseja realmente excluir o grupo "${roleName}"? Todas as permissões deste grupo serão removidas. Os usuários deste grupo precisarão ser reatribuídos.`,
            'Excluir Grupo',
            'fa-trash'
        );

        if (confirmed) {
            try {
                await window.api.roles.delete(roleName);
                window.showToast(`Grupo ${roleName} excluído.`, 'success');
                if (currentSelectedRole === roleName) currentSelectedRole = 'TECNICO';
                await loadRoles();
                if (currentMngTab === 'permissions') await loadPermissions(currentSelectedRole);
                if (currentMngTab === 'users') await loadUsers();
            } catch (err) {
                window.showToast(err.message, 'danger');
            }
        }
    };

    // --- Lógica de Edição e Cópia ---
    window.editRoleName = function (roleName) {
        const role = rolesList.find(r => r.name === roleName);
        if (!role) return;

        document.getElementById('roleModalTitle').innerText = 'Editar Nome do Grupo';
        document.getElementById('editRoleOldName').value = roleName;
        document.getElementById('roleName').value = roleName;
        document.getElementById('roleDescGroup').classList.add('hidden'); // Esconder desc na edição por simplicidade
        document.getElementById('btnSubmitRole').innerText = 'Salvar Alteração';

        if (roleModal) roleModal.classList.remove('hidden');
    };

    window.openCopyPermModal = function (targetRole) {
        const copyPermModal = document.getElementById('copyPermModal');
        const copySourceSelect = document.getElementById('copySourceRole');
        const targetLabel = document.getElementById('copyTargetName');

        if (!copyPermModal || !copySourceSelect) return;

        targetLabel.innerText = targetRole;
        copySourceSelect.innerHTML = '';

        rolesList.forEach(role => {
            if (role.name !== targetRole) {
                const opt = document.createElement('option');
                opt.value = role.name;
                opt.textContent = role.name;
                copySourceSelect.appendChild(opt);
            }
        });

        copyPermModal.classList.remove('hidden');
    };

    const confirmCopyBtn = document.getElementById('btnConfirmCopyPerm');
    if (confirmCopyBtn) {
        confirmCopyBtn.onclick = async () => {
            const from = document.getElementById('copySourceRole').value;
            const to = document.getElementById('copyTargetName').innerText;

            try {
                // Fetch permissions from source group
                const sourcePermData = await window.api.permissions.list(from);

                // Load these permissions into the UI for the current target group
                renderPermissionsTable(to, sourcePermData);

                // Enable "Salvar" button so user can review and then save
                if (savePermissionsBtn) {
                    savePermissionsBtn.disabled = false;
                    savePermissionsBtn.classList.remove('hidden');
                }

                window.showToast(`Permissões carregadas de ${from}. Revise e clique em 'Salvar' para aplicar ao grupo ${to}.`, 'info');
                document.getElementById('copyPermModal').classList.add('hidden');
            } catch (err) {
                window.showToast('Erro ao carregar permissões: ' + err.message, 'danger');
            }
        };
    }

    // Modal Create/Edit Role Logic
    const roleModal = document.getElementById('roleModal');
    const roleForm = document.getElementById('roleForm');
    const btnAddNewRole = document.getElementById('btnAddNewRole');

    if (btnAddNewRole) {
        btnAddNewRole.addEventListener('click', () => {
            document.getElementById('roleModalTitle').innerText = 'Novo Grupo de Acesso';
            document.getElementById('editRoleOldName').value = '';
            document.getElementById('roleName').value = '';
            document.getElementById('roleDescription').value = '';
            document.getElementById('roleDescGroup').classList.remove('hidden');
            document.getElementById('btnSubmitRole').innerText = 'Criar Grupo';
            if (roleModal) roleModal.classList.remove('hidden');
        });
    }

    if (roleForm) {
        roleForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const oldName = document.getElementById('editRoleOldName').value;
            const name = document.getElementById('roleName').value.trim().toUpperCase();
            const description = document.getElementById('roleDescription').value;

            try {
                if (oldName) {
                    // Update
                    await window.api.roles.update(oldName, name);
                    window.showToast(`Grupo renomeado para ${name}!`, 'success');
                    if (currentSelectedRole === oldName) currentSelectedRole = name;
                } else {
                    // Create
                    await window.api.roles.create({ name, description });
                    window.showToast(`Grupo ${name} criado com sucesso!`, 'success');
                }

                roleModal.classList.add('hidden');
                roleForm.reset();
                await loadRoles();
            } catch (err) {
                window.showToast(err.message, 'danger');
            }
        });
    }

    // --- Inicialização ---
    async function initUserManagement() {
        await loadRoles(); // Carregar grupos dinâmicos primeiro

        // Initial button state
        const canCreateUsers = window.Permissions.can('Usuários', 'can_create');
        if (addNewUserBtn) {
            addNewUserBtn.style.display = (currentMngTab === 'users' && canCreateUsers) ? 'flex' : 'none';
        }

        // Verificar visibilidade das sub-abas
        // Mapear todas as sub-features para a permissão principal
        const canViewUsers = window.Permissions.can('Usuários', 'can_view');
        const canViewPerms = window.Permissions.can('Permissões', 'can_view');
        const canViewLogs = window.Permissions.can('Logs de Auditoria', 'can_view'); // Correct module name for System Audit Logs

        const tabUsers = document.querySelector('[data-mng-tab="users"]');
        const tabPerms = document.querySelector('[data-mng-tab="permissions"]');
        const tabLogs = document.querySelector('[data-mng-tab="logs"]');

        if (tabUsers) {
            tabUsers.style.display = canViewUsers ? '' : 'none';
            if (!canViewUsers && currentMngTab === 'users') {
                // If cannot view users, switch to permissions if allowed, or logs
                if (canViewPerms) tabPerms.click();
                else if (canViewLogs) tabLogs?.click();
                else usersContainer.classList.add('hidden');
            }
        }

        if (tabPerms) tabPerms.style.display = canViewPerms ? '' : 'none';
        if (tabLogs) tabLogs.style.display = canViewLogs ? '' : 'none';

        if (canViewUsers && currentMngTab === 'users') await loadUsers();
        if (canViewPerms && currentMngTab === 'permissions') await loadPermissions(currentSelectedRole);
        // logs will load manually via search button, but we might want to ensure empty state
        if (canViewLogs && currentMngTab === 'logs') {
            if (addNewUserBtn) addNewUserBtn.style.display = 'none'; // Force hide on init if logs
            if (logsTableBody) {
                logsTableBody.innerHTML = `
                    <tr>
                        <td colspan="5" style="text-align: center; padding: 40px; color: var(--text-secondary);">
                            <i class="fa-solid fa-magnifying-glass" style="font-size: 2rem; margin-bottom: 10px;"></i>
                            <br>
                            Utilize os filtros acima e clique em buscar para visualizar os logs.
                        </td>
                    </tr>`;
            }
        }
    }

    // --- Lógica de Abas ---
    mngSubTabBtns.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            currentMngTab = btn.dataset.mngTab;

            // Switch Tab Buttons
            mngSubTabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Hide all containers specific to Management
            if (usersContainer) usersContainer.classList.add('hidden');
            if (permissionsContainer) permissionsContainer.classList.add('hidden');
            if (logsContainer) logsContainer.classList.add('hidden');

            // Reset Common Controls
            if (savePermissionsBtn) savePermissionsBtn.classList.add('hidden');
            if (roleSelector) roleSelector.classList.add('hidden');
            // Hide/Show "Novo Usuário" button based on tab and permission
            const canCreateUsersData = window.Permissions.can('Usuários', 'can_create');
            if (addNewUserBtn) {
                addNewUserBtn.style.display = (currentMngTab === 'users' && canCreateUsersData) ? 'flex' : 'none';
            }
            // Hide User Search Group
            if (userSearchGroup) userSearchGroup.classList.add('hidden');
            // Hide Logs Controls
            if (logsControls) logsControls.classList.add('hidden');

            if (currentMngTab === 'users') {
                if (usersContainer) usersContainer.classList.remove('hidden');

                if (roleSelector) roleSelector.classList.add('hidden');
                if (userSearchGroup) userSearchGroup.classList.remove('hidden');

                renderUsers(usersList);

            } else if (currentMngTab === 'permissions') {
                if (permissionsContainer) permissionsContainer.classList.remove('hidden');

                // Check if user can edit permissions
                const canEditPermissions = window.Permissions.can('Permissões', 'can_edit');

                if (savePermissionsBtn) {
                    // Show button only if user can edit
                    if (canEditPermissions) {
                        savePermissionsBtn.classList.remove('hidden');
                        savePermissionsBtn.disabled = true;
                    } else {
                        savePermissionsBtn.classList.add('hidden');
                    }
                }
                if (roleSelector) roleSelector.classList.remove('hidden');

                await loadPermissions(currentSelectedRole);

            } else if (currentMngTab === 'logs') {
                if (logsContainer) logsContainer.classList.remove('hidden');
                if (logsControls) logsControls.classList.remove('hidden');

                // Hide "Novo Usuário" on Logs tab
                if (addNewUserBtn) addNewUserBtn.style.display = 'none';

                // DO NOT load logs automatically
                // Reset table to empty state or instructions
                if (logsTableBody) {
                    logsTableBody.innerHTML = `
                        <tr>
                            <td colspan="5" style="text-align: center; padding: 40px; color: var(--text-secondary);">
                                <i class="fa-solid fa-magnifying-glass" style="font-size: 2rem; margin-bottom: 10px;"></i>
                                <br>
                                Utilize os filtros acima e clique em buscar para visualizar os logs.
                            </td>
                        </tr>`;
                }
                if (logsPageInfo) logsPageInfo.innerText = '';
                if (prevLogsBtn) prevLogsBtn.disabled = true;
                if (nextLogsBtn) nextLogsBtn.disabled = true;
            }
        });
    });

    // Lógica de Clique nos Textos de Role (REMOVIDO - Agora é dinâmico em renderRoleControls)

    // --- CRUD de Usuários ---
    function renderSkeletons() {
        if (!usersListEl) return;
        usersListEl.innerHTML = '';
        for (let i = 0; i < 6; i++) {
            const sk = document.createElement('div');
            sk.className = 'skeleton-user-card';
            usersListEl.appendChild(sk);
        }
    }

    async function loadUsers() {
        if (!window.api || !window.api.users) return;
        renderSkeletons();
        try {
            const data = await window.api.users.list();
            // API returns array directly
            usersList = data || [];
            console.log('📊 Usuários carregados:', usersList.length);
            renderUsers(usersList);
        } catch (err) {
            console.error('Erro ao carregar usuários:', err.message);
            if (window.showToast) window.showToast('Erro ao carregar usuários.', 'error');
        }
    }

    function renderUsers(list) {
        if (!usersListEl) return;
        usersListEl.innerHTML = '';

        console.log('🎨 Renderizando usuários:', list.length);

        const P = window.Permissions;
        // Use granular permissions
        const canEdit = P && P.can('Usuários', 'can_edit');
        const canDelete = P && P.can('Usuários', 'can_delete');

        if (list.length === 0) {
            usersListEl.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-users-slash"></i>
                    <p>Nenhum usuário encontrado.</p>
                </div>`;
            return;
        }

        list.forEach(u => {
            const card = document.createElement('div');
            card.className = 'user-card'; // Restaurado de user-card-item para user-card

            const knownRoles = ['administrador', 'tecnico', 'analista'];
            const roleClass = knownRoles.includes(u.role?.toLowerCase())
                ? `badge-${u.role.toLowerCase()}`
                : 'badge-custom';
            const creationDate = u.created_at ? new Date(u.created_at).toLocaleDateString('pt-BR') : 'N/A';

            // Get Initials
            const initials = (u.full_name || u.username)
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .substring(0, 2);

            let actionsHtml = '';

            // Edit Button (Permission Check)
            if (canEdit) {
                actionsHtml += `
                    <button class="btn-icon" onclick="window.editUser('${u.id}')" title="Editar">
                        <i class="fa-solid fa-pencil"></i>
                    </button>`;
            }

            // Delete Button (Permission Check + Admin Protection)
            if (canDelete && u.username !== 'admin') {
                actionsHtml += `
                    <button class="btn-icon" onclick="window.deleteUser('${u.id}')" title="Excluir" style="color: var(--danger)">
                        <i class="fa-solid fa-trash"></i>
                    </button>`;
            }

            // Status Indicators
            const activeStatusHtml = u.is_active ?
                '<span class="user-status-indicator active" title="Conta Ativa"></span>' :
                '<span class="user-status-indicator inactive" title="Conta Inativa"></span>';

            const resetStatusHtml = u.force_password_reset ?
                '<span class="badge-reset-status" title="Senha Resetada/Troca Pendente"><i class="fa-solid fa-triangle-exclamation"></i> Senha Pendente</span>' : '';

            // Restaurada a estrutura original
            card.innerHTML = `
                <div class="user-info-top">
                    <div class="user-card-header">
                        <div class="user-avatar">
                            ${initials}
                        </div>
                        <div class="user-name-group">
                            <h3>${activeStatusHtml} ${u.full_name || 'N/A'}</h3>
                            <span class="user-handle">Login: ${u.username}</span>
                        </div>
                    </div>
                    <div class="user-card-actions">
                        ${actionsHtml}
                    </div>
                </div>
                <div class="user-info-bottom">
                    <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                        <span class="badge-role ${roleClass}">${u.role || 'TÉCNICO'}</span>
                        ${resetStatusHtml}
                    </div>
                </div>
            `;
            usersListEl.appendChild(card);
        });
    }


    // Search functionality with clear button
    const clearUserSearchBtn = document.getElementById('clearUserSearch');

    userSearchInput?.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();

        // Show/hide clear button
        if (clearUserSearchBtn) {
            if (query) {
                clearUserSearchBtn.classList.remove('hidden');
            } else {
                clearUserSearchBtn.classList.add('hidden');
            }
        }

        const filtered = usersList.filter(u =>
            u.full_name?.toLowerCase().includes(query) ||
            u.username?.toLowerCase().includes(query)
        );
        renderUsers(filtered);
    });

    // Clear search button
    clearUserSearchBtn?.addEventListener('click', () => {
        userSearchInput.value = '';
        clearUserSearchBtn.classList.add('hidden');
        renderUsers(usersList);
        userSearchInput.focus();
    });


    // Modal Handlers
    window.editUser = async function (id) {
        console.log('Editando usuário ID:', id);
        const u = usersList.find(x => x.id == id);
        if (!u) {
            console.error('Usuário não encontrado na lista local:', id);
            return;
        }

        editingUserId = id;
        userModalTitle.innerText = 'Editar Usuário';
        if (document.getElementById('userIdInput')) document.getElementById('userIdInput').value = u.id;
        if (document.getElementById('userFullName')) document.getElementById('userFullName').value = u.full_name || '';
        if (document.getElementById('userUsername')) document.getElementById('userUsername').value = u.username;

        // Status Toggle & Force Reset
        const isActiveChk = document.getElementById('userIsActive');
        if (isActiveChk) isActiveChk.checked = !!u.is_active;

        const forceResetChk = document.getElementById('userForceReset');
        if (forceResetChk) forceResetChk.checked = !!u.force_password_reset;

        // Reset Password Button Logic
        const btnReset = document.getElementById('btnResetPassword');
        if (btnReset) {
            // Check Permission - Uses View permission as established in schema
            const canReset = window.Permissions.can('Reset de Senha', 'can_view');

            if (canReset) {
                btnReset.classList.remove('hidden');
            } else {
                btnReset.classList.add('hidden');
            }

            btnReset.onclick = async () => {
                const confirmed = await window.showConfirm(
                    `No próximo login, o sistema identificará o reset e solicitará ao usuário a criação de uma nova senha.`,
                    'Resetar Senha',
                    'fa-rotate'
                );
                if (confirmed) {
                    try {
                        const res = await window.api.users.update(u.id, { set_reset_mode: true });
                        window.showToast('Conta resetada. O usuário deverá redefinir a senha no login.', 'success');

                        // Update hidden checkbox to prevent overwriting on save
                        const forceResetChk = document.getElementById('userForceReset');
                        if (forceResetChk) forceResetChk.checked = true;

                        // window.closeUserModal(); // Keep open as requested
                        await loadUsers(); // Refresh to show reset icon if needed
                    } catch (err) {
                        console.error('Erro reset:', err);
                        window.showToast('Erro ao resetar conta.', 'error');
                    }
                }
            };
        }

        // Password field always empty on edit for security by default
        if (document.getElementById('userPassword')) {
            document.getElementById('userPassword').value = '';
            document.getElementById('userPassword').required = false; // Not required on edit
            if (document.getElementById('userPasswordRequired'))
                document.getElementById('userPasswordRequired').classList.add('hidden');
        }

        if (document.getElementById('userRoleSelect')) document.getElementById('userRoleSelect').value = u.role || 'TECNICO';

        userModal.classList.remove('hidden');
    };

    window.closeUserModal = () => {
        userModal.classList.add('hidden');
        userForm.reset();
        editingUserId = null;
        // Clear hidden ID field
        if (document.getElementById('userIdInput')) {
            document.getElementById('userIdInput').value = '';
        }
    };

    document.getElementById('addNewUserBtn')?.addEventListener('click', () => {
        editingUserId = null;
        userModalTitle.innerText = 'Novo Usuário';
        userForm.reset();

        // Default to active and force reset for new users
        if (document.getElementById('userIsActive')) document.getElementById('userIsActive').checked = true;
        if (document.getElementById('userForceReset')) document.getElementById('userForceReset').checked = true;

        // Hide Reset Password button
        if (document.getElementById('btnResetPassword')) document.getElementById('btnResetPassword').classList.add('hidden');

        // Ensure Password is required for new user
        if (document.getElementById('userPassword')) {
            document.getElementById('userPassword').required = false;
            if (document.getElementById('userPasswordRequired'))
                document.getElementById('userPasswordRequired').classList.add('hidden');
        }

        // Ensure ID field is cleared for new user
        if (document.getElementById('userIdInput')) {
            document.getElementById('userIdInput').value = '';
        }
        userModal.classList.remove('hidden');
    });

    userForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('userIdInput').value;
        const currentFullName = document.getElementById('userFullName').value;
        const currentUsername = document.getElementById('userUsername').value;
        const currentPassword = document.getElementById('userPassword').value;
        const currentRole = document.getElementById('userRoleSelect').value;
        const currentIsActive = document.getElementById('userIsActive').checked;
        const currentForceReset = document.getElementById('userForceReset').checked;

        const formData = {
            full_name: currentFullName,
            username: currentUsername,
            password: currentPassword, // Send plain password, API handles hashing
            role: currentRole,
            is_active: currentIsActive,
            force_password_reset: currentForceReset
        };

        // If editing admin, block username change
        if (id) {
            const oldUser = usersList.find(x => x.id == id);
            if (oldUser && oldUser.username === 'admin' && formData.username !== 'admin') {
                window.showToast('O usuário admin não pode ter o login alterado.', 'danger');
                return;
            }
        }

        try {
            let res;
            let actionText = id ? 'Editou usuário' : 'Criou novo usuário';
            let oldVal = null;
            let details = '';

            if (id) {
                oldVal = usersList.find(x => x.id == id);
                // Update via API
                // Note: API only updates password if provided and not empty
                const updateData = { ...formData };
                if (!updateData.password) delete updateData.password; // If empty, don't send (though API checks !empty)

                res = await window.api.users.update(id, updateData);

                // Generate Diff Details
                const changes = [];
                if (oldVal.username !== formData.username) changes.push(`Usuário: '${oldVal.username}' -> '${formData.username}'`);
                if (oldVal.role !== formData.role) changes.push(`Role: '${oldVal.role}' -> '${formData.role}'`);
                if (updateData.password) changes.push('Senha alterada manualmente');
                if (!!oldVal.is_active !== !!formData.is_active) changes.push(formData.is_active ? 'Conta Reativada' : 'Conta Desativada');
                if (!!oldVal.force_password_reset !== !!formData.force_password_reset && formData.force_password_reset) changes.push('Reset de Senha Solicitado');

                details = `Alterações: ${changes.join(', ')}`;

            } else {
                // Check username uniqueness? API handles it (UNIQUE constraint) but we can catch error

                res = await window.api.users.create(formData);
                details = `Novo usuário: ${formData.full_name} (${formData.role})`;
            }

            // Check API response success? API methods throw if not ok, or return json
            // My api-service.js methods return res.json().
            // If create/update returns success: true, we differ.
            // But api-service.js throws on res.ok === false.
            // So if we are here, it succeeded.

            // Audit Log
            if (window.registerAuditLog) {
                // Fix oldVal passed to audit (should be clean object)
                await window.registerAuditLog(
                    'SECURITY',
                    actionText,
                    `${actionText}: ${formData.full_name} (@${formData.username}). ${details}`,
                    oldVal,
                    { ...formData, password: '***' }
                );
            }

            if (res.error) throw res.error;

            window.showToast('Usuário salvo com sucesso!', 'success');
            window.closeUserModal();

            // Wait a bit for Supabase to process the insert/update
            await new Promise(resolve => setTimeout(resolve, 300));

            // Force reload users list
            await loadUsers();

            // If current user edited themselves, update localStorage
            const localUser = JSON.parse(localStorage.getItem('sofis_user') || '{}');
            if (localUser.id === id || localUser.username === formData.username) {
                localStorage.setItem('sofis_user', JSON.stringify({ ...localUser, ...formData }));
                if (window.updateUserDisplay) window.updateUserDisplay();
            }

        } catch (err) {
            console.error('Erro ao salvar usuário:', err.message);
            window.showToast('Erro ao salvar usuário.', 'danger');
        }
    });

    window.deleteUser = async (id) => {
        // Security Check
        if (!window.Permissions.can('Usuários', 'can_delete')) {
            window.showToast('🚫 Acesso negado: Você não tem permissão para excluir usuários.', 'error');
            return;
        }

        const u = usersList.find(x => x.id == id);
        if (!u) return;
        if (u.username === 'admin') {
            window.showToast('O usuário administrador central não pode ser removido.', 'danger');
            return;
        }

        const confirmed = await window.showConfirm(
            `Deseja realmente remover o usuário ${u.full_name} (@${u.username})?`,
            'Confirmar Exclusão',
            'fa-trash'
        );

        if (!confirmed) return;

        try {
            if (window.api && window.api.users) {
                await window.api.users.delete(id);
            } else {
                throw new Error("API unavailable");
            }

            // Audit Log
            if (window.registerAuditLog) {
                await window.registerAuditLog(
                    'SECURITY',
                    'Removeu usuário',
                    `Removeu usuário: ${u.full_name} (@${u.username})`,
                    u,
                    null
                );
            }

            window.showToast('Usuário removido.', 'success');
            await loadUsers();
        } catch (err) {
            console.error('Erro ao excluir usuário:', err.message);
            window.showToast('Erro ao excluir usuário.', 'danger');
        }
    };

    // --- Lógica de Permissões ---
    async function loadPermissions(role) {
        if (!window.api || !window.api.permissions) return;
        try {
            const data = await window.api.permissions.list(role);
            renderPermissionsTable(role, data || []);
        } catch (err) {
            console.error('Erro ao carregar permissões:', err.message);
        }
    }

    function renderPermissionsTable(role, permData) {
        if (!permissionsTableBody) return;
        permissionsTableBody.innerHTML = '';

        permissionSchema.forEach((guide, gIdx) => {
            // Guide Row Removed as per user request
            // We just render the items directly now
            guide.items.forEach(item => {
                const mod = item.module;
                const label = item.label || mod;



                const p = permData.find(x => x.module === mod) || {
                    can_view: false, can_create: false, can_edit: false, can_delete: false
                };

                // Add spacer before new headers (except the first one)
                if (item.isHeader && gIdx > 0) {
                    const spacer = document.createElement('tr');
                    spacer.innerHTML = '<td colspan="6" style="height: 35px; border: none; background: transparent;"></td>';
                    permissionsTableBody.appendChild(spacer);
                }

                const roleClass = `badge-${role.toLowerCase()}`;
                const indentClass = item.isHeader ? 'permission-header-item' : 'permission-sub-item';

                // Restrições específicas:
                // - Dashboard: Apenas Visualizar
                // - Cabeçalho "Gerenciamento de Usuários": Apenas Visualizar (sub-itens são funcionais)
                // - Permissões: Apenas Visualizar e Editar
                // - Logs de Auditoria: Apenas Visualizar
                // - Reset de Senha: Apenas Visualizar (que permite visualizar e resetar)
                const isDashboard = mod === 'Dashboard';
                const isUserManagementHeader = (mod === 'Gerenciamento de Usuários' || mod === 'Gestão de Usuários') && item.isHeader;
                const isClientsHeader = mod === 'Gestão de Clientes' && item.isHeader;
                const isPermissions = mod === 'Permissões';
                const isLogs = mod === 'Logs de Auditoria';
                const isResetPassword = mod === 'Reset de Senha';

                // Criar e Excluir desabilitados para: Dashboard, Cabeçalhos, Permissões, Logs e Reset
                const shouldDisableAll = isDashboard || isUserManagementHeader || isLogs || isResetPassword;
                const shouldDisableCreateDelete = shouldDisableAll || isPermissions;

                const disabledCreate = shouldDisableCreateDelete ? 'disabled class="perm-checkbox-disabled"' : 'class="perm-checkbox"';
                const disabledEdit = shouldDisableAll ? 'disabled class="perm-checkbox-disabled"' : 'class="perm-checkbox"';
                const disabledDelete = shouldDisableCreateDelete ? 'disabled class="perm-checkbox-disabled"' : 'class="perm-checkbox"';

                const tr = document.createElement('tr');
                tr.className = item.isHeader ? 'permission-header-row' : 'permission-row';
                tr.innerHTML = `
                    <td class="${indentClass}">${label}</td>
                    <td><span class="badge-role ${roleClass}">${role}</span></td>
                    <td><input type="checkbox" class="perm-checkbox" data-mod="${mod}" data-prop="can_view" ${p.can_view ? 'checked' : ''}></td>
                    <td><input type="checkbox" ${disabledCreate} data-mod="${mod}" data-prop="can_create" ${!shouldDisableCreateDelete && p.can_create ? 'checked' : ''}></td>
                    <td><input type="checkbox" ${disabledEdit} data-mod="${mod}" data-prop="can_edit" ${!shouldDisableAll && p.can_edit ? 'checked' : ''}></td>
                    <td><input type="checkbox" ${disabledDelete} data-mod="${mod}" data-prop="can_delete" ${!shouldDisableCreateDelete && p.can_delete ? 'checked' : ''}></td>
                `;
                permissionsTableBody.appendChild(tr);
            });
        });

        // Add Listeners for Changes
        document.querySelectorAll('.perm-checkbox').forEach(chk => {
            chk.addEventListener('change', (e) => {
                const checkbox = e.target;
                const prop = checkbox.dataset.prop;

                // If unchecking "can_view", also uncheck create, edit, delete
                if (prop === 'can_view' && !checkbox.checked) {
                    const row = checkbox.closest('tr');
                    const mod = checkbox.dataset.mod;

                    // Uncheck all other permissions in the same row
                    row.querySelectorAll('.perm-checkbox').forEach(cb => {
                        if (cb.dataset.mod === mod && cb.dataset.prop !== 'can_view') {
                            cb.checked = false;
                        }
                    });
                }

                const saveBtn = document.getElementById('savePermissionsBtn');
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.style.opacity = '1';
                }
            });
        });
    }

    document.getElementById('savePermissionsBtn')?.addEventListener('click', async () => {
        // Permission Check
        if (!window.Permissions.can('Permissões', 'can_edit')) {
            window.showToast('🚫 Acesso negado: Você não tem permissão para editar permissões.', 'error');
            return;
        }

        const btn = document.getElementById('savePermissionsBtn');
        if (btn) btn.disabled = true; // Prevent double click

        const rows = document.querySelectorAll('#permissionsTableBody tr');
        const updateData = [];

        rows.forEach(row => {
            const chk = row.querySelector('.perm-checkbox');
            if (!chk) return; // Skip guide rows

            const mod = chk.dataset.mod;
            const checkboxes = row.querySelectorAll('.perm-checkbox');
            const rowObj = { role_name: currentSelectedRole, module: mod };
            checkboxes.forEach(cb => {
                rowObj[cb.dataset.prop] = cb.checked;
            });
            updateData.push(rowObj);
        });

        try {
            // 1. Fetch OLD permissions state BEFORE update
            const oldData = await window.api.permissions.list(currentSelectedRole);

            // 2. Perform Update via API
            await window.api.permissions.update(updateData);

            // 3. Compare and Generate Log Diff
            const changes = [];
            const propLabels = {
                can_view: 'Visualizar',
                can_create: 'Criar',
                can_edit: 'Editar',
                can_delete: 'Excluir'
            };

            updateData.forEach(newItem => {
                const oldItem = (oldData || []).find(o => o.module === newItem.module) || {
                    can_view: false, can_create: false, can_edit: false, can_delete: false
                };

                const added = [];
                const removed = [];

                ['can_view', 'can_create', 'can_edit', 'can_delete'].forEach(p => {
                    const oldVal = !!oldItem[p];
                    const newVal = !!newItem[p];
                    if (oldVal !== newVal) {
                        if (newVal) added.push(propLabels[p]);
                        else removed.push(propLabels[p]);
                    }
                });

                if (added.length > 0 || removed.length > 0) {
                    let desc = `Item '${newItem.module}':`;
                    if (added.length > 0) desc += ` Permitido[${added.join(', ')}]`;
                    if (removed.length > 0) desc += ` Removido[${removed.join(', ')}]`;
                    changes.push(desc);
                }
            });

            if (changes.length > 0 && window.api && window.api.logs) {
                await window.api.logs.create({
                    username: JSON.parse(localStorage.getItem('sofis_user')).username || 'Sistema',
                    operation_type: 'SECURITY',
                    action: `Alterou permissões de ${currentSelectedRole}`,
                    details: changes.join('; '),
                    old_value: oldData,
                    new_value: updateData
                });
            }

            window.showToast('Permissões atualizadas!', 'success');
            if (btn) btn.disabled = true; // Keep disabled until next change

        } catch (err) {
            console.error('Erro ao salvar permissões:', err.message);
            window.showToast('Erro ao salvar permissões.', 'danger');
            if (btn) btn.disabled = false;
        }
    });

    // --- Audit Logs Logic ---
    const logsContainer = document.getElementById('logs-container');
    const logsTableBody = document.getElementById('logsTableBody');
    const prevLogsBtn = document.getElementById('prevLogsBtn');
    const nextLogsBtn = document.getElementById('nextLogsBtn');
    const logsPageInfo = document.getElementById('logsPageInfo');
    const btnPrintLogs = document.getElementById('btnPrintLogs'); // Print Button

    let currentAuditLogs = []; // Store currently displayed logs for printing

    async function loadAuditLogs(page = 1) {
        if (!window.api || !window.api.logs) return;
        logsPage = page;

        // Validation: Require Date Range? User said "somente após o usuário informar o período".
        const startDate = logStartDate ? logStartDate.value : null;
        const endDate = logEndDate ? logEndDate.value : null;

        if (!startDate || !endDate) {
            window.showToast?.('Por favor, informe o período (data inicial e final).', 'warning');
            return;
        }

        // Show loading state
        if (logsTableBody) {
            logsTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Carregando logs...</td></tr>';
        }

        // Hide print button during load
        if (btnPrintLogs) btnPrintLogs.classList.add('hidden');

        try {
            // Prepare Filters
            const filters = {
                limit: logsPerPage,
                offset: (page - 1) * logsPerPage,
                start: `${startDate} 00:00:00`,
                end: `${endDate} 23:59:59`
            };

            if (logSearchInput && logSearchInput.value.trim()) {
                filters.user = logSearchInput.value.trim(); // API handles this as search term
            }

            if (logTypeSelect && logTypeSelect.value) {
                // Map select values to DB logic if needed
                let typeVal = logTypeSelect.value;
                if (typeVal === 'CRIACAO') filters.type = 'CRIAÇÃO'; // loose matching handled in API or precise?
                // API uses LIKE or = check. The UI sends specific codes.
                // In API: if ($type) { $sql .= " AND operation_type = ?"; }
                // So I need to send exact string stored in DB.
                // LogTypeSelect values: CRIACAO, EDICAO, EXCLUSAO, SECURITY
                // DB Values (from logs): 'CRIAÇÃO', 'EDIÇÃO', 'EXCLUSÃO', 'SECURITY'
                // I should map them.
                if (typeVal === 'CRIACAO') filters.type = 'CRIAÇÃO';
                else if (typeVal === 'EDICAO') filters.type = 'EDIÇÃO';
                else if (typeVal === 'EXCLUSAO') filters.type = 'EXCLUSÃO';
                else if (typeVal === 'SECURITY') filters.type = 'SECURITY';
            }

            const data = await window.api.logs.list(filters);

            currentAuditLogs = data || []; // Update current logs
            renderAuditLogs(currentAuditLogs);

            // Pagination count not returned by simple API list yet.
            // For now, assume if less than limit, it's last page.
            // Or update API to return { data: [], total: N }.
            // I'll skip complex pagination count for now in API.
            updatePaginationControls(currentAuditLogs.length === logsPerPage ? 999 : (logsPage * logsPerPage));
        } catch (err) {
            console.error('Erro ao carregar logs:', err.message);
            if (logsTableBody) {
                logsTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--danger);">Erro ao carregar logs.</td></tr>';
            }
        }
    }

    if (btnSearchLogs) {
        btnSearchLogs.addEventListener('click', () => {
            loadAuditLogs(1);
        });
    }

    // Print Handler
    // Print Handler with Fetch All Logic
    if (btnPrintLogs) {
        btnPrintLogs.addEventListener('click', async () => {
            // Double-check permission on click
            if (!window.Permissions.can('Logs de Auditoria', 'can_view')) {
                window.showToast('🚫 Acesso negado: Você não tem permissão para visualizar logs.', 'error');
                return;
            }
            // Re-fetch ALL logs matching current filters (without pagination)
            // We use the input values directly as they represent what the user presumably wants to print based on what they see or filtered last.
            // Ideally we should use the values from the *last search*, but using current input is standard behavior for "Print what I configured".

            const startDate = logStartDate ? logStartDate.value : null;
            const endDate = logEndDate ? logEndDate.value : null;

            if (!startDate || !endDate) {
                window.showToast('Por favor, informe o período para gerar o relatório.', 'warning');
                return;
            }

            // Show loading toast because this might take a moment
            window.showToast('Gerando relatório...', 'info');

            try {
                // Prepare Filters for Print (No limit/pagination)
                const filters = {
                    limit: 1000, // Reasonable limit for print
                    start: `${startDate} 00:00:00`,
                    end: `${endDate} 23:59:59`
                };

                if (logSearchInput && logSearchInput.value.trim()) {
                    filters.user = logSearchInput.value.trim();
                }

                if (logTypeSelect && logTypeSelect.value) {
                    let typeVal = logTypeSelect.value;
                    if (typeVal === 'CRIACAO') filters.type = 'CRIAÇÃO';
                    else if (typeVal === 'EDICAO') filters.type = 'EDIÇÃO';
                    else if (typeVal === 'EXCLUSAO') filters.type = 'EXCLUSÃO';
                    else if (typeVal === 'SECURITY') filters.type = 'SECURITY';
                }

                // Execute Query via API
                const allLogs = await window.api.logs.list(filters);

                if (!allLogs || allLogs.length === 0) {
                    window.showToast('Nenhum log encontrado para impressão.', 'warning');
                    return;
                }

                // Proceed to Print
                const printWindow = window.open('', '_blank');
                const opTypeMap = {
                    'security': 'SEGURANÇA',
                    'criação': 'CRIAÇÃO',
                    'criacao': 'CRIAÇÃO',
                    'edição': 'EDIÇÃO',
                    'edicao': 'EDIÇÃO',
                    'exclusão': 'EXCLUSÃO',
                    'exclusao': 'EXCLUSÃO',
                    'geral': 'GERAL'
                };

                const rows = allLogs.map(log => {
                    const d = new Date(log.created_at);
                    const dateStr = d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR');
                    const opTypeRaw = (log.operation_type || 'geral').toLowerCase();
                    const typeLabel = opTypeMap[opTypeRaw] || opTypeRaw.toUpperCase();

                    return `
                        <tr>
                            <td>${dateStr}</td>
                            <td>${log.username || '-'}</td>
                            <td>${log.action || '-'}</td>
                            <td>${formatLogDetails(log.details || '-')}</td>
                            <td>${typeLabel}</td>
                        </tr>
                    `;
                }).join('');

                // Filter Info Calculation
                let filterInfo = [];
                if (logSearchInput && logSearchInput.value.trim()) {
                    filterInfo.push(`Termo: "${logSearchInput.value.trim()}"`);
                }
                if (logTypeSelect && logTypeSelect.value) {
                    const selText = logTypeSelect.options[logTypeSelect.selectedIndex].text;
                    filterInfo.push(`Tipo: "${selText}"`);
                }
                const filterStr = filterInfo.length > 0 ? `<br>Filtros: ${filterInfo.join(' | ')}` : '';

                // Date Formatting (String Split to avoid timezone shift)
                const formatDateStr = (str) => {
                    if (!str) return '-';
                    const parts = str.split('-');
                    if (parts.length !== 3) return str;
                    return `${parts[2]}/${parts[1]}/${parts[0]}`;
                };

                const content = `
                    <!DOCTYPE html>
                    <html lang="pt-BR">
                    <head>
                        <meta charset="UTF-8">
                        <title>Relatório de Auditoria - Sofis</title>
                        <style>
                            @media print {
                                body { margin: 10px; }
                                button { display: none; }
                            }
                            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #333; }
                            h1 { color: #2c3e50; text-align: center; margin-bottom: 5px; }
                            .meta { text-align: center; color: #7f8c8d; margin-bottom: 30px; font-size: 0.9rem; line-height: 1.5; }
                            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 0.85rem; }
                            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                            th { background-color: #f2f2f2; color: #2c3e50; font-weight: 600; }
                            tr:nth-child(even) { background-color: #f9f9f9; }
                            .footer { text-align: center; font-size: 0.8rem; color: #95a5a6; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px; }
                        </style>
                    </head>
                    <body>
                        <h1>Relatório de Logs de Auditoria</h1>
                        <div class="meta">
                            Gerado em: ${new Date().toLocaleString('pt-BR')} <br>
                            Período: ${formatDateStr(startDate)} a ${formatDateStr(endDate)}
                            ${filterStr}
                        </div>
                        <table>
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Usuário</th>
                                    <th>Ação</th>
                                    <th>Detalhes</th>
                                    <th>Tipo</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rows}
                            </tbody>
                        </table>
                        <div class="footer">Este documento é confidencial e para uso interno. Registros totais: ${allLogs.length}</div>
                        <script>
                            window.onload = function() {
                                setTimeout(function() {
                                    window.print();
                                }, 500);
                            }
                        </script>
                    </body>
                    </html>
                `;

                printWindow.document.write(content);
                printWindow.document.close();

            } catch (err) {
                console.error('Erro ao gerar relatório:', err);
                window.showToast('Erro ao gerar relatório de impressão.', 'danger');
            }
        });
    }

    function formatLogDetails(details) {
        if (!details || details === '-') return '-';

        // 1. Context vs Changes
        const parts = details.split(' | Alt:');

        // Format Context (Left part)
        // Bold keys like "Cliente:", "Sistema:"
        let contextHtml = parts[0].trim().replace(/([a-zA-ZãõçÃÕÇ ]+):/g, '<b>$1:</b>');

        let changesHtml = '';

        // Format Changes (Right part)
        if (parts.length > 1) {
            let diffRaw = parts[1].trim();
            // Remove outer []
            if (diffRaw.startsWith('[') && diffRaw.endsWith(']')) {
                diffRaw = diffRaw.substring(1, diffRaw.length - 1);
            }

            // Split by comma respecting quotes
            // Regex explain: Match comma only if not followed by odd number of quotes (simple approach)
            const splitRegex = /,(?=(?:(?:[^']*'){2})*[^']*$)/;
            const changes = diffRaw.split(splitRegex).map(c => c.trim()).filter(c => c);

            const keyMap = {
                'user': 'Usuário',
                'password': 'Senha',
                'pass': 'Senha',
                'notes': 'Obs',
                'environment': 'Ambiente',
                'system': 'Produto',
                'bridgeDataAccess': 'Bridge',
                'bootstrap': 'Bootstrap',
                'execUpdate': 'Exec Update',
                'sqlServer': 'Servidor SQL',
                'webLaudo': 'WebLaudo',
                'url': 'URL'
            };

            if (changes.length > 0) {
                // Use a flex container for chips
                changesHtml += '<div style="margin-top:4px; display:flex; flex-wrap:wrap; gap:4px;">';

                changes.forEach(change => {
                    // change is like "key: val" or "key: 'old' -> 'new'"
                    // Extract key
                    const keyMatch = change.match(/^([^:]+):/);
                    if (keyMatch) {
                        const rawKey = keyMatch[1].trim();
                        const content = change.substring(rawKey.length + 1).trim();

                        // Map key
                        const label = keyMap[rawKey] || rawKey.charAt(0).toUpperCase() + rawKey.slice(1);

                        // Clean quotes from content for display
                        // e.g. "'old' -> 'new'" => "old -> new"
                        const cleanContent = content.replace(/'/g, '');

                        // Style chip
                        changesHtml += `<span style="background:rgba(0,0,0,0.05); border:1px solid rgba(0,0,0,0.1); padding:2px 6px; border-radius:4px; font-size:0.85em; white-space:nowrap;">
                            <b>${label}:</b> ${cleanContent}
                        </span>`;
                    } else {
                        // Fallback
                        changesHtml += `<span style="font-size:0.85em;">${change}</span>`;
                    }
                });
                changesHtml += '</div>';
            }
        }

        return `<div class="log-formatted">${contextHtml}${changesHtml}</div>`;
    }

    function renderAuditLogs(logs) {
        if (!logsTableBody) return;
        logsTableBody.innerHTML = '';

        // Toggle Print Button
        if (btnPrintLogs) {
            if (logs.length > 0) btnPrintLogs.classList.remove('hidden');
            else btnPrintLogs.classList.add('hidden');
        }

        if (logs.length === 0) {
            logsTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Nenhum log encontrado.</td></tr>';
            return;
        }

        logs.forEach(log => {
            const tr = document.createElement('tr');

            // Format Date
            const d = new Date(log.created_at);
            const dateStr = d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR');

            // Format Type Badge
            let typeClass = '';
            const opTypeRaw = (log.operation_type || 'geral').toLowerCase();
            const opTypeMap = {
                'security': 'SEGURANÇA',
                'criação': 'CRIAÇÃO',
                'criacao': 'CRIAÇÃO',
                'edição': 'EDIÇÃO',
                'edicao': 'EDIÇÃO',
                'exclusão': 'EXCLUSÃO',
                'exclusao': 'EXCLUSÃO',
                'geral': 'GERAL' // Added for default case
            };
            const opLabel = opTypeMap[opTypeRaw] || opTypeRaw.toUpperCase();

            if (opLabel === 'SEGURANÇA') typeClass = 'type-security';
            else if (opLabel === 'CRIAÇÃO') typeClass = 'type-create';
            else if (opLabel === 'EDIÇÃO') typeClass = 'type-edit';
            else if (opLabel === 'EXCLUSÃO') typeClass = 'type-delete'; // Assuming a 'type-delete' class exists or can be added
            else typeClass = 'type-general'; // Default class for 'Geral' or unmapped types

            const badgeHtml = `<span class="log-type-badge ${typeClass}">${opLabel}</span>`;

            tr.innerHTML = `
                <td><span class="log-date">${dateStr}</span></td>
                <td><span class="log-user">@${log.username}</span></td>
                <td><span class="log-action">${log.action}</span></td>
                <td><div class="log-details" title="${(log.details || '').replace(/"/g, '&quot;')}">${formatLogDetails(log.details || '-')}</div></td>
                <td>${badgeHtml}</td>
            `;
            logsTableBody.appendChild(tr);
        });
    }

    function updatePaginationControls(totalCount) {
        const totalPages = Math.ceil(totalCount / logsPerPage);
        if (logsPageInfo) logsPageInfo.innerText = `Página ${logsPage} de ${totalPages || 1}`;

        if (prevLogsBtn) prevLogsBtn.disabled = logsPage <= 1;
        if (nextLogsBtn) nextLogsBtn.disabled = logsPage >= totalPages;
    }

    if (prevLogsBtn) {
        prevLogsBtn.addEventListener('click', () => {
            if (logsPage > 1) loadAuditLogs(logsPage - 1);
        });
    }

    if (nextLogsBtn) {
        nextLogsBtn.addEventListener('click', () => {
            // We rely on the disabled state, but double check is fine
            loadAuditLogs(logsPage + 1);
        });
    }

    // Make init global if needed for tab switching
    window.loadManagementTab = initUserManagement;
});
