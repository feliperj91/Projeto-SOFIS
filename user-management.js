document.addEventListener('DOMContentLoaded', async () => {
    const user = JSON.parse(localStorage.getItem('sofis_user') || '{}');
    const managementTabBtn = document.getElementById('btnUserManagement');

    // Auth Guard for Management Tab
    function checkUserManagementAccess() {
        if (managementTabBtn && window.Permissions) {
            // Main tab access
            const canAccess = window.Permissions.can('Gestão de Usuários', 'can_view');
            managementTabBtn.style.display = canAccess ? 'block' : 'none';
        }
    }

    document.addEventListener('permissions-loaded', checkUserManagementAccess);
    // Check if already loaded
    if (window.Permissions && window.Permissions.rules) checkUserManagementAccess();

    // --- State & Constants ---
    let usersList = [];
    let currentMngTab = 'users';
    let currentSelectedRole = 'ADMINISTRADOR';
    let editingUserId = null;
    let logsPage = 1;
    const logsPerPage = 10;

    const permissionSchema = [
        {
            type: 'guide',
            title: 'Guia Contatos e Conexões',
            items: [
                { module: 'Gestão de Clientes', isHeader: true },
                { module: 'Logs e Atividades' },
                { module: 'Contatos' },
                { module: 'Banco de Dados' },
                { module: 'VPN' },
                { module: 'URLs' }
            ]
        },
        {
            type: 'guide',
            title: 'Guia Controle de Versões',
            items: [
                { module: 'Controle de Versões', isHeader: true },
                { module: 'Controle de Versões - Dashboard', label: 'Dashboard' },
                { module: 'Controle de Versões - Histórico', label: 'Histórico' },
                { module: 'Controle de Versões - Produtos', label: 'Produtos' }
            ]
        },
        {
            type: 'guide',
            title: 'Guia Gerenciamento de Usuários',
            items: [
                { module: 'Gestão de Usuários', isHeader: true },
                { module: 'Gestão de Usuários - Usuários', label: 'Usuários' },
                { module: 'Gestão de Usuários - Permissões', label: 'Permissões' },
                { module: 'Gestão de Usuários - Logs', label: 'Logs e Auditoria' }
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

    // Toggle Password Visibility
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
    // --- Initialization ---
    async function initUserManagement() {
        // Now checks specific sub-module for user creation
        const canCreateUsers = window.Permissions.can('Gestão de Usuários - Usuários', 'can_create');
        if (addNewUserBtn) addNewUserBtn.style.display = canCreateUsers ? 'flex' : 'none';

        // Check sub-tab visibility
        const canViewUsers = window.Permissions.can('Gestão de Usuários - Usuários', 'can_view');
        const canViewPerms = window.Permissions.can('Gestão de Usuários - Permissões', 'can_view');
        const canViewLogs = window.Permissions.can('Gestão de Usuários - Logs', 'can_view');

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

    // --- Tab Logic ---
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
            // Hide User Search Group
            if (userSearchGroup) userSearchGroup.classList.add('hidden');
            // Hide Logs Controls
            if (logsControls) logsControls.classList.add('hidden');

            // Reset Add User Btn visibility (default to flex if perm allows, but hide on specific tabs)
            const canCreateUsersData = window.Permissions.can('Gestão de Usuários - Usuários', 'can_create');
            if (addNewUserBtn) addNewUserBtn.style.display = canCreateUsersData ? 'flex' : 'none';

            if (currentMngTab === 'users') {
                if (usersContainer) usersContainer.classList.remove('hidden');

                if (roleSelector) roleSelector.classList.add('hidden');
                if (userSearchGroup) userSearchGroup.classList.remove('hidden');

                renderUsers(usersList);

            } else if (currentMngTab === 'permissions') {
                if (permissionsContainer) permissionsContainer.classList.remove('hidden');

                if (savePermissionsBtn) {
                    savePermissionsBtn.classList.remove('hidden');
                    savePermissionsBtn.disabled = true;
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

    // Role Text Click Logic
    if (roleTextBtns) {
        roleTextBtns.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                // Update active state
                roleTextBtns.forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');

                // Update role
                const newRole = e.currentTarget.dataset.role;
                currentSelectedRole = newRole;

                if (currentMngTab === 'users') {
                    const filtered = usersList.filter(u => u.role === newRole);
                    renderUsers(filtered);
                } else {
                    await loadPermissions(currentSelectedRole);
                    // Reset save button on role switch
                    if (savePermissionsBtn) savePermissionsBtn.disabled = true;
                }
            });
        });
    }

    // --- User CRUD ---
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
        if (!window.supabaseClient) return;
        renderSkeletons();
        try {
            const { data, error } = await window.supabaseClient
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            usersList = data || [];
            console.log('📊 Usuários carregados:', usersList.length, usersList);
            renderUsers(usersList);
        } catch (err) {
            console.error('Erro ao carregar usuários:', err.message);
        }
    }

    function renderUsers(list) {
        if (!usersListEl) return;
        usersListEl.innerHTML = '';

        console.log('🎨 Renderizando usuários:', list.length);

        const P = window.Permissions;
        // Use granular permissions
        const canEdit = P && P.can('Gestão de Usuários - Usuários', 'can_edit');
        const canDelete = P && P.can('Gestão de Usuários - Usuários', 'can_delete');

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

            const roleClass = `badge-${u.role?.toLowerCase() || 'tecnico'}`;
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

            // Restaurada a estrutura original
            card.innerHTML = `
                <div class="user-info-top">
                    <div class="user-card-header">
                        <div class="user-avatar">${initials}</div>
                        <div class="user-name-group">
                            <h3>${u.full_name || 'N/A'}</h3>
                            <span class="user-handle">@${u.username}</span>
                        </div>
                    </div>
                    <div class="user-card-actions">
                        ${actionsHtml}
                    </div>
                </div>
                <div class="user-info-bottom">
                    <span class="badge-role ${roleClass}">${u.role || 'TÉCNICO'}</span>
                    <span class="user-date"><i class="fa-solid fa-calendar-days" style="color: var(--accent);"></i> ${creationDate}</span>
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
        const u = usersList.find(x => x.id === id);
        if (!u) {
            console.error('Usuário não encontrado na lista local:', id);
            return;
        }

        editingUserId = id;
        userModalTitle.innerText = 'Editar Usuário';
        if (document.getElementById('userIdInput')) document.getElementById('userIdInput').value = u.id;
        if (document.getElementById('userFullName')) document.getElementById('userFullName').value = u.full_name || '';
        if (document.getElementById('userUsername')) document.getElementById('userUsername').value = u.username;

        // Decrypt password for editing
        const decryptedPass = await Security.decrypt(u.password);
        if (document.getElementById('userPassword')) document.getElementById('userPassword').value = decryptedPass;

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

        // Determine if password is changed (simple check vs original if available, but here we assume if it's diff from what we loaded or just always re-encrypt)
        // Actually, for edit, we only re-encrypt if changed. But here we encrypt always.
        // Let's assume passed password is the raw one.

        const formData = {
            full_name: currentFullName,
            username: currentUsername,
            password: await Security.encrypt(currentPassword),
            role: currentRole
        };

        // If editing admin, block username change
        if (id) {
            const oldUser = usersList.find(x => x.id === id);
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
                oldVal = usersList.find(x => x.id === id);
                res = await window.supabaseClient.from('users').update(formData).eq('id', id);

                // Generate Diff Details
                const changes = [];
                if (oldVal.username !== formData.username) changes.push(`Usuário de '${oldVal.username}' para '${formData.username}'`);
                if (oldVal.role !== formData.role) changes.push(`Cargo de '${oldVal.role}' para '${formData.role}'`);

                // Password check: We compare encrypted values if possible, or assume change if input was interacted with.
                // Since we treat the input as the source of truth and encrypt it, checking equality of ciphertexts is tricky due to IVs.
                // However, we can check if the displayed 'decrypted' password in the UI was different.
                // Simplified: If the user clicked save, and the password field has value, we log it was updated (safest).
                // Or better: In a real app we wouldn't show the password.
                // Let's just say "Senha atualizada" if it's an edit.
                // Warning: Current implementation encrypts every save, changing the hash.
                changes.push('Dados/Senha atualizados');

                details = `Alterações: ${changes.join(', ')}`;

            } else {
                // Check username uniqueness
                const { data: existing } = await window.supabaseClient.from('users').select('id').eq('username', formData.username).maybeSingle();
                if (existing) {
                    window.showToast('Este usuário já existe!', 'danger');
                    return;
                }
                res = await window.supabaseClient.from('users').insert([formData]);
                details = `Novo usuário: ${formData.full_name} (${formData.role})`;
            }

            if (res.error) throw res.error;

            // Audit Log
            if (window.registerAuditLog) {
                await window.registerAuditLog(
                    'SECURITY',
                    actionText,
                    `${actionText}: ${formData.full_name} (@${formData.username}). ${details}`,
                    oldVal,
                    formData
                );
            }

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
        if (!window.Permissions.can('Gestão de Usuários - Usuários', 'can_delete')) {
            window.showToast('🚫 Acesso negado: Você não tem permissão para excluir usuários.', 'error');
            return;
        }

        const u = usersList.find(x => x.id === id);
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
            const { error } = await window.supabaseClient.from('users').delete().eq('id', id);
            if (error) throw error;

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

    // --- Permissions Logic ---
    async function loadPermissions(role) {
        if (!window.supabaseClient) return;
        try {
            const { data, error } = await window.supabaseClient
                .from('role_permissions')
                .select('*')
                .eq('role_name', role);

            if (error) throw error;
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

                const tr = document.createElement('tr');
                tr.className = item.isHeader ? 'permission-header-row' : 'permission-row';
                tr.innerHTML = `
                    <td class="${indentClass}">${label}</td>
                    <td><span class="badge-role ${roleClass}">${role}</span></td>
                    <td><input type="checkbox" class="perm-checkbox" data-mod="${mod}" data-prop="can_view" ${p.can_view ? 'checked' : ''}></td>
                    <td><input type="checkbox" class="perm-checkbox" data-mod="${mod}" data-prop="can_create" ${p.can_create ? 'checked' : ''}></td>
                    <td><input type="checkbox" class="perm-checkbox" data-mod="${mod}" data-prop="can_edit" ${p.can_edit ? 'checked' : ''}></td>
                    <td><input type="checkbox" class="perm-checkbox" data-mod="${mod}" data-prop="can_delete" ${p.can_delete ? 'checked' : ''}></td>
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
            const { data: oldData } = await window.supabaseClient
                .from('role_permissions')
                .select('*')
                .eq('role_name', currentSelectedRole);

            // 2. Perform Update
            const { error } = await window.supabaseClient
                .from('role_permissions')
                .upsert(updateData, { onConflict: 'role_name,module' });

            if (error) throw error;

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

            if (changes.length > 0 && window.registerAuditLog) {
                await window.registerAuditLog(
                    'SECURITY',
                    `Alterou permissões de ${currentSelectedRole}`,
                    changes.join('; '),
                    oldData,
                    updateData
                );
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
        if (!window.supabaseClient) return;
        logsPage = page;

        // Validation: Require Date Range? User said "somente após o usuário informar o período".
        // Let's require at least a date inputs or just let them search.
        // Good practice: Check if dates are valid.
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

        const from = (page - 1) * logsPerPage;
        const to = from + logsPerPage - 1;

        try {
            let query = window.supabaseClient
                .from('audit_logs')
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(from, to);

            // Apply Filters

            // Date Range (Inclusive)
            // Start date 00:00:00
            const startISO = new Date(startDate + 'T00:00:00').toISOString();
            // End date 23:59:59
            const endISO = new Date(endDate + 'T23:59:59.999').toISOString();

            query = query.gte('created_at', startISO).lte('created_at', endISO);

            // Search Text (User OR Details)
            if (logSearchInput && logSearchInput.value.trim()) {
                const term = logSearchInput.value.trim();
                // ILIKE for case insensitive partial match
                query = query.or(`username.ilike.%${term}%,details.ilike.%${term}%`);
            }

            // Operation Type
            if (logTypeSelect && logTypeSelect.value) {
                // Mapping select values to DB logic if needed, or simple partial match
                // DB has "operation_type" or sometimes it's null, we might need to search in 'action' too if types aren't consistent.
                // But let's assume operation_type is what we want.
                // As per previous logs, operation_type can be 'SECURITY', 'EDIÇÃO', 'CRIAÇÃO'.
                // If the select value is 'CRIACAO', we check against 'CRIAÇÃO' or similar. 
                // Let's try to match loosely.
                let typeVal = logTypeSelect.value;
                if (typeVal === 'CRIACAO') query = query.ilike('operation_type', '%CRIA%'); // Catches CRIAÇÃO, CRIACAO, CRIAR
                else if (typeVal === 'EDICAO') query = query.ilike('operation_type', '%EDI%'); // Catches EDIÇÃO, EDICAO, EDITAR
                else if (typeVal === 'EXCLUSAO') query = query.ilike('operation_type', '%EXCLU%');
                else if (typeVal === 'SECURITY') query = query.eq('operation_type', 'SECURITY');
            }

            const { data, error, count } = await query;

            if (error) throw error;

            currentAuditLogs = data || []; // Update current logs
            renderAuditLogs(currentAuditLogs);
            updatePaginationControls(count);
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
    if (btnPrintLogs) {
        btnPrintLogs.addEventListener('click', () => {
            if (!currentAuditLogs || currentAuditLogs.length === 0) return;

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

            const rows = currentAuditLogs.map(log => {
                const d = new Date(log.created_at);
                const dateStr = d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR');
                const opTypeRaw = (log.operation_type || 'geral').toLowerCase();
                const typeLabel = opTypeMap[opTypeRaw] || opTypeRaw.toUpperCase();

                return `
                    <tr>
                        <td>${dateStr}</td>
                        <td>${log.username || '-'}</td>
                        <td>${log.action || '-'}</td>
                        <td>${log.details || '-'}</td>
                        <td>${typeLabel}</td>
                    </tr>
                `;
            }).join('');

            const content = `
                <html>
                <head>
                    <title>Relatório de Auditoria - Sofis</title>
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #333; }
                        h1 { color: #2c3e50; text-align: center; margin-bottom: 10px; }
                        .meta { text-align: center; color: #7f8c8d; margin-bottom: 30px; font-size: 0.9rem; }
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
                        Sistema SOFIS - Controle de Versões
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
                    <div class="footer">Este documento é confidencial e para uso interno.</div>
                    <script>
                        window.onload = function() { window.print(); }
                    </script>
                </body>
                </html>
            `;

            printWindow.document.write(content);
            printWindow.document.close();
        });
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
                <td><div class="log-details" title="${log.details || ''}">${log.details || '-'}</div></td>
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
