document.addEventListener('DOMContentLoaded', async () => {
    const user = JSON.parse(localStorage.getItem('sofis_user') || '{}');
    const managementTabBtn = document.getElementById('btnUserManagement');

    // Auth Guard for Management Tab
    // Using a list of admins or checking role if available
    if (user && (user.username === 'admin' || (user.role && user.role === 'ADMINISTRADOR'))) {
        if (managementTabBtn) managementTabBtn.style.display = 'block';
    }

    // --- State & Constants ---
    let usersList = [];
    let currentMngTab = 'users';
    let currentSelectedRole = 'ADMINISTRADOR';
    let editingUserId = null;

    const modules = [
        'Logs e Atividades',
        'Clientes e Contatos',
        'Infraestruturas',
        'Gestão de Usuários',
        'Controle de Versões'
    ];

    // --- DOM Elements ---
    const usersContainer = document.getElementById('users-container');
    const permissionsContainer = document.getElementById('permissions-container');
    const mngSubTabBtns = document.querySelectorAll('.mng-tab-btn');
    const mngControlsGroups = document.querySelectorAll('.mng-controls-group');
    const rolePillBtns = document.querySelectorAll('.role-pill-btn');
    const usersListEl = document.getElementById('usersList');
    const permissionsTableBody = document.getElementById('permissionsTableBody');
    const userSearchInput = document.getElementById('userSearchInput');
    const userModal = document.getElementById('userModal');
    const userForm = document.getElementById('userForm');
    const userModalTitle = document.getElementById('userModalTitle');

    // --- Initialization ---
    async function initUserManagement() {
        await loadUsers();
        await loadPermissions('ADMINISTRADOR');
    }

    // --- Tab Logic ---
    mngSubTabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            currentMngTab = btn.dataset.mngTab;

            // Switch Buttons
            mngSubTabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Switch Containers & Controls
            const usersCtrl = document.getElementById('users-mng-controls');
            const permsCtrl = document.getElementById('permissions-mng-controls');

            if (currentMngTab === 'users') {
                usersContainer.classList.remove('hidden');
                permissionsContainer.classList.add('hidden');

                if (usersCtrl) usersCtrl.classList.remove('hidden');
                if (permsCtrl) permsCtrl.classList.add('hidden');

                // Apply current role filter to users list
                if (currentSelectedRole) {
                    const filtered = usersList.filter(u => u.role === currentSelectedRole);
                    renderUsers(filtered);
                } else {
                    renderUsers(usersList);
                }
            } else {
                usersContainer.classList.add('hidden');
                permissionsContainer.classList.remove('hidden');

                if (usersCtrl) usersCtrl.classList.add('hidden');
                if (permsCtrl) permsCtrl.classList.remove('hidden');

                // Reload permissions to ensure freshness
                loadPermissions(currentSelectedRole);
            }
        });
    });

    // Role Pills Logic
    rolePillBtns.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            // Update active state
            rolePillBtns.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');

            // Update role
            const newRole = e.currentTarget.dataset.role;
            console.log('🔄 Trocando perfil para:', newRole);
            currentSelectedRole = newRole;

            if (currentMngTab === 'users') {
                // Filter Users List
                const filtered = usersList.filter(u => u.role === newRole);
                renderUsers(filtered);
            } else {
                // Load new permissions
                await loadPermissions(currentSelectedRole);
            }
        });
    });

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

        if (list.length === 0) {
            usersListEl.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-secondary);">Nenhum usuário encontrado.</div>';
            return;
        }

        list.forEach(u => {
            const roleClass = `badge-${u.role?.toLowerCase() || 'tecnico'}`;
            const creationDate = u.created_at ? new Date(u.created_at).toLocaleDateString('pt-BR') : 'N/A';

            // Get Initials
            const initials = (u.full_name || u.username)
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .substring(0, 2);

            const card = document.createElement('div');
            card.className = 'user-card';
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
                        <button class="btn-icon" onclick="window.editUser('${u.id}')" title="Editar">
                            <i class="fa-solid fa-pencil"></i>
                        </button>
                        ${u.username !== 'admin' ? `
                            <button class="btn-icon" onclick="window.deleteUser('${u.id}')" title="Excluir" style="color: var(--danger)">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        ` : ''}
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

            if (id) {
                oldVal = usersList.find(x => x.id === id);
                res = await window.supabaseClient.from('users').update(formData).eq('id', id);
            } else {
                // Check username uniqueness
                const { data: existing } = await window.supabaseClient.from('users').select('id').eq('username', formData.username).maybeSingle();
                if (existing) {
                    window.showToast('Este usuário já existe!', 'danger');
                    return;
                }
                res = await window.supabaseClient.from('users').insert([formData]);
            }

            if (res.error) throw res.error;

            // Audit Log
            if (window.registerAuditLog) {
                await window.registerAuditLog(
                    'SECURITY',
                    actionText,
                    `${actionText}: ${formData.full_name} (@${formData.username})`,
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
        const u = usersList.find(x => x.id === id);
        if (!u) return;
        if (u.username === 'admin') {
            window.showToast('O usuário administrador central não pode ser removido.', 'danger');
            return;
        }

        if (!confirm(`Deseja realmente remover o usuário ${u.full_name} (@${u.username})?`)) return;

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

        modules.forEach(mod => {
            const p = permData.find(x => x.module === mod) || {
                can_view: false, can_create: false, can_edit: false, can_delete: false
            };

            const roleClass = `badge-${role.toLowerCase()}`;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${mod}</td>
                <td><span class="badge-role ${roleClass}">${role}</span></td>
                <td><input type="checkbox" class="perm-checkbox" data-mod="${mod}" data-prop="can_view" ${p.can_view ? 'checked' : ''}></td>
                <td><input type="checkbox" class="perm-checkbox" data-mod="${mod}" data-prop="can_create" ${p.can_create ? 'checked' : ''}></td>
                <td><input type="checkbox" class="perm-checkbox" data-mod="${mod}" data-prop="can_edit" ${p.can_edit ? 'checked' : ''}></td>
                <td><input type="checkbox" class="perm-checkbox" data-mod="${mod}" data-prop="can_delete" ${p.can_delete ? 'checked' : ''}></td>
            `;
            permissionsTableBody.appendChild(tr);
        });
    }

    document.getElementById('savePermissionsBtn')?.addEventListener('click', async () => {
        const rows = document.querySelectorAll('#permissionsTableBody tr');
        const updateData = [];

        rows.forEach(row => {
            const mod = row.querySelector('td:first-child').innerText;
            const checkboxes = row.querySelectorAll('.perm-checkbox');
            const rowObj = { role_name: currentSelectedRole, module: mod };
            checkboxes.forEach(cb => {
                rowObj[cb.dataset.prop] = cb.checked;
            });
            updateData.push(rowObj);
        });

        try {
            const { error } = await window.supabaseClient
                .from('role_permissions')
                .upsert(updateData, { onConflict: 'role_name,module' });

            if (error) throw error;
            window.showToast('Permissões atualizadas!', 'success');
        } catch (err) {
            console.error('Erro ao salvar permissões:', err.message);
            window.showToast('Erro ao salvar permissões.', 'danger');
        }
    });

    // Make init global if needed for tab switching
    window.loadManagementTab = initUserManagement;
});
