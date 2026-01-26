console.log("🚀 VERSÃO APP: CREDENCIAIS_INDIVIDUAIS_V2 CARREGADO");

// Helper para checkbox de privacidade
window.toggleIndividualPrivacy = function (checkbox) {
    const label = checkbox.closest('label');
    if (checkbox.checked) {
        label.style.color = '#ff5252';
        label.style.opacity = '1';
    } else {
        label.style.color = '#ff5252'; // Keep color but maybe verify logic
    }
};

// --- Utilitários Globais de Modal ---
window.openModal = function (modalId) {
    if (modalId === 'clientModal') modalId = 'modal'; // Mapping for compatibility
    const el = document.getElementById(modalId);
    if (el) {
        el.classList.remove('hidden');
        // specialized init if needed
        if (modalId === 'modal') {
            if (document.getElementById('modalTitle')) document.getElementById('modalTitle').innerText = 'Novo Cliente';
            if (document.getElementById('clientForm')) document.getElementById('clientForm').reset();
            if (document.getElementById('clientId')) document.getElementById('clientId').value = '';
            // Clear dynamic fields
            const contactList = document.getElementById('contactList');
            if (contactList) {
                contactList.innerHTML = `
                    <div class="contact-group">
                        <div class="contact-group-header">
                            <input type="text" class="contact-name-input" placeholder="Nome do contato (ex: João Silva, Comercial)">
                            <button type="button" class="btn-remove-contact" onclick="removeContact(this)" title="Remover Contato" tabindex="-1">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                        <div class="contact-details">
                            <div class="contact-section">
                                <label class="section-label">
                                    <i class="fa-solid fa-phone"></i> Telefones
                                    <button type="button" class="btn-add-phone" onclick="addPhone(this)" title="Adicionar Telefone" tabindex="-1"><i class="fa-solid fa-plus"></i></button>
                                </label>
                                <div class="phone-list"><div class="contact-field"><input type="text" class="phone-input" placeholder="(11) 99999-9999" maxlength="15"><button type="button" class="btn-remove-field-small" onclick="removeContactField(this)" tabindex="-1"><i class="fa-solid fa-xmark"></i></button></div></div>
                            </div>
                            <div class="contact-section">
                                <label class="section-label">
                                    <i class="fa-solid fa-envelope"></i> E-mails
                                    <button type="button" class="btn-add-email" onclick="addEmail(this)" title="Adicionar E-mail" tabindex="-1"><i class="fa-solid fa-plus"></i></button>
                                </label>
                                <div class="email-list"><div class="contact-field"><input type="email" class="email-input" placeholder="contato@empresa.com"><button type="button" class="btn-remove-field-small" onclick="removeContactField(this)" tabindex="-1"><i class="fa-solid fa-xmark"></i></button></div></div>
                            </div>
                        </div>
                    </div>`;
            }
        }
    }
};

window.closeModal = function (modalId) {
    if (modalId === 'clientModal') modalId = 'modal';
    const el = document.getElementById(modalId);
    if (el) el.classList.add('hidden');
};

document.addEventListener('DOMContentLoaded', async () => {
    // --- Sistema de Permissões ---
    window.Permissions = {
        userRole: 'TECNICO',
        rules: {},

        async load() {
            try {
                // Check Session via API
                const session = await window.api.auth.checkSession();

                if (session.authenticated && session.user) {
                    // Support for multi-roles
                    this.userRoles = Array.isArray(session.user.roles)
                        ? session.user.roles
                        : (session.user.role ? [session.user.role] : []);

                    this.userRole = this.userRoles.length > 0 ? this.userRoles[0] : (session.user.role || 'Indefinido');
                    // For now, load default rules based on role, or from session if backend provides them
                    // Since backend stores permissions in JSON column, we can use that!
                    // Handle permissions whether they come as object (API decode) or string (raw)
                    if (typeof session.user.permissions === 'string') {
                        try {
                            this.rules = JSON.parse(session.user.permissions);
                        } catch (e) {
                            console.error('Failed to parse permission string:', e);
                            this.rules = {};
                        }
                    } else {
                        this.rules = session.user.permissions || {};
                    }

                    // Sync localStorage with session data
                    localStorage.setItem('sofis_user', JSON.stringify({
                        id: session.user.id,
                        username: session.user.username,
                        full_name: session.user.full_name,
                        role: this.userRole,
                        roles: this.userRoles, // New field for multi-roles
                        permissions: session.user.permissions
                    }));

                    console.log(`🔒 Permissions: [${this.userRole}] loaded via API.`);
                } else {
                    console.warn('🔒 Permissions: No active session or session expired.');
                    localStorage.removeItem('sofis_user');
                    window.location.href = 'login.html';
                    return;
                }

                // Trigger event
                document.dispatchEvent(new CustomEvent('permissions-loaded'));
                if (window.applyPermissions) window.applyPermissions();
            } catch (e) {
                console.error('❌ Permissions: Error during load:', e);
            }
        },

        applyTabPermissions() {
            const P = this;
            const contactsTabBtn = document.querySelector('.tab-btn[data-tab="contacts"]');
            const versionsTabBtn = document.querySelector('.tab-btn[data-tab="versions"]');
            const managementTabBtn = document.getElementById('btnUserManagement');

            if (contactsTabBtn) {
                contactsTabBtn.style.display = P.can('Gestão de Clientes', 'can_view') ? '' : 'none';
            }
            if (versionsTabBtn) {
                versionsTabBtn.style.display = P.can('Controle de Versões', 'can_view') ? '' : 'none';

                // Fine-grained buttons in Version Control Tab
                const pulseBtn = document.getElementById('pulseDashboardBtn');
                const addVersionBtn = document.getElementById('addVersionBtn');

                if (pulseBtn) {
                    pulseBtn.style.display = P.can('Controle de Versões', 'can_view') ? '' : 'none';
                }
                if (addVersionBtn) {
                    addVersionBtn.style.display = P.can('Controle de Versões', 'can_create') ? '' : 'none';
                }
            }
            if (managementTabBtn) {
                managementTabBtn.style.display = P.can('Gestão de Usuários', 'can_view') ? '' : 'none';
            }
        },

        can(moduleName, action) {
            const mod = this.rules[moduleName];
            return mod ? !!mod[action] : false;
        }
    };

    // --- Aplicação Global de Permissões ---
    window.applyPermissions = () => {
        const P = window.Permissions;
        if (!P) return;

        // 1. Logs e Atividades
        const btnActivity = document.getElementById('toggleActivityBtn');
        if (btnActivity) {
            btnActivity.style.display = P.can('Logs e Atividades', 'can_view') ? '' : 'none';
        }

        // 2. Clientes e Contatos (Global) - Create

        // Create Button
        const btnAddClient = document.getElementById('addClientBtn');
        if (btnAddClient) {
            btnAddClient.style.display = P.can('Gestão de Clientes', 'can_create') ? '' : 'none';
        }

        // 3. Controle de Versões - View Tab
        const versionTabBtn = document.querySelector('.tab-btn[data-tab="versions"]');
        if (versionTabBtn) {
            versionTabBtn.style.display = P.can('Controle de Versões', 'can_view') ? '' : 'none';
        }

        // 4. Controle de Versões - Buttons
        const pulseBtn = document.getElementById('pulseDashboardBtn');
        const addVersionBtn = document.getElementById('addVersionBtn');
        if (pulseBtn) pulseBtn.style.display = P.can('Dashboard', 'can_view') ? '' : 'none';
        if (addVersionBtn) addVersionBtn.style.display = P.can('Controle de Versões', 'can_create') ? '' : 'none';

        // 5. User Management - Tab Button
        const userMngBtn = document.getElementById('btnUserManagement');
        if (userMngBtn) {
            userMngBtn.style.display = P.can('Gestão de Usuários', 'can_view') ? '' : 'none';
        }

        // 6. SQL/VPN/URL - Create
        const btnAddServer = document.getElementById('addServerEntryBtn');
        if (btnAddServer) btnAddServer.style.display = P.can('Dados de Acesso (SQL)', 'can_create') ? '' : 'none';

        const btnAddVPN = document.getElementById('addVpnEntryBtn');
        if (btnAddVPN) btnAddVPN.style.display = P.can('Dados de Acesso (VPN)', 'can_create') ? '' : 'none';

        const btnAddURL = document.getElementById('addUrlEntryBtn');
        if (btnAddURL) btnAddURL.style.display = P.can('URLs', 'can_create') ? '' : 'none';

        // 7. Produtos
        const btnMngProducts = document.getElementById('productActionButtons');
        if (btnMngProducts) {
            btnMngProducts.style.display = P.can('Produtos', 'can_view') ? '' : 'none';
        }
    };

    // Re-update display when permissions are loaded/changed
    // --- Modal Utilities (Moved to global scope) ---

    document.addEventListener('permissions-loaded', () => {
        console.log("🔒 Permissions Loaded Event: Applying Visibility...");
        if (window.updateUserDisplay) window.updateUserDisplay();
        window.applyPermissions();
    });

    // Load permissions immediately
    await window.Permissions.load();

    // State Variables
    let clients = [];
    window.clients = clients; // Ensure window.clients is always the current array
    let editingId = null;
    let currentClientFilter = 'all';
    let favoritesCollapsed = JSON.parse(localStorage.getItem('sofis_favorites_collapsed')) || false;
    let regularCollapsed = JSON.parse(localStorage.getItem('sofis_regular_collapsed')) || false;
    let isModalFavorite = false;

    // --- Modal Utilities (Moved to top) ---

    // Close buttons handlers
    document.addEventListener('DOMContentLoaded', () => {
        const closeMain = document.getElementById('closeModal');
        if (closeMain) closeMain.onclick = () => window.closeModal('modal');
        const cancelMain = document.getElementById('cancelBtn');
        if (cancelMain) cancelMain.onclick = () => window.closeModal('modal');
    });

    // User Favorites State
    window.userFavorites = new Set();

    async function loadUserFavorites() {
        const user = JSON.parse(localStorage.getItem('sofis_user') || '{}');
        if (!user.username) return;

        // Use localStorage for favorites in local version
        const key = `sofis_favorites_${user.username}`;
        const stored = JSON.parse(localStorage.getItem(key) || '[]');
        window.userFavorites = new Set(stored);
    }

    // Helper to save favorites
    window.saveUserFavorites = () => {
        const user = JSON.parse(localStorage.getItem('sofis_user') || '{}');
        if (!user.username) return;

        const key = `sofis_favorites_${user.username}`;
        localStorage.setItem(key, JSON.stringify(Array.from(window.userFavorites)));
    };
    let currentView = localStorage.getItem('sofis_view_mode') || 'list'; // 'list' or 'grid'

    // --- Auxiliar de Log de Auditoria ---
    async function registerAuditLog(opType, action, details = '', oldVal = null, newVal = null) {
        const user = JSON.parse(localStorage.getItem('sofis_user') || '{}');
        const username = user.username || 'Sistema';

        // Helper to mask sensitive fields in objects (JSON storage).
        // Relaxed masking: only passwords.
        const sanitize = (obj) => {
            if (!obj || typeof obj !== 'object') return obj;
            try {
                const s = JSON.parse(JSON.stringify(obj)); // Deep copy

                const mask = (item) => {
                    // Mask passwords everywhere
                    if (item.password) item.password = '********';
                    if (item.pass) item.pass = '********';

                    // Specific sub-structures
                    if (item.credentials && Array.isArray(item.credentials)) {
                        item.credentials.forEach(c => {
                            if (c.password) c.password = '********';
                            // Do NOT mask username
                        });
                    }
                    if (item.webLaudo) {
                        if (typeof item.webLaudo === 'object') {
                            if (item.webLaudo.password) item.webLaudo.password = '********';
                        }
                    }
                    // Do NOT mask phones/emails anymore as per requirement for clear logs
                };

                if (Array.isArray(s)) {
                    s.forEach(mask);
                } else {
                    mask(s);
                }
                return s;
            } catch (e) {
                return obj;
            }
        };

        // Helper to generate readable text diff
        const generateDiff = (oldObj, newObj) => {
            if (!oldObj || !newObj) return '';
            const changes = [];

            // Helper to check keys
            const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

            allKeys.forEach(key => {
                // Skip internal keys or irrelevant ones
                if (['credentials', 'vpns', 'servers', 'urls', 'contacts', 'updatedAt'].includes(key)) return;

                const oVal = oldObj[key];
                const nVal = newObj[key];

                if ((typeof nVal !== 'object' && typeof oVal !== 'object') && nVal !== oVal) {
                    // Check for passwords
                    if (key.toLowerCase().includes('password') || key.toLowerCase().includes('senha') || key.toLowerCase().includes('pass')) {
                        changes.push(`${key}: (alterada)`);
                    } else {
                        // Skip empty to empty changes
                        if (!oVal && !nVal) return;
                        changes.push(`${key}: '${oVal || ''}' -> '${nVal || ''}'`);
                    }
                }
            });

            // Specific Array Handling
            // Credentials (SQL)
            if (newObj.credentials && oldObj.credentials) {
                const oCreds = oldObj.credentials || [];
                const nCreds = newObj.credentials || [];
                if (JSON.stringify(oCreds) !== JSON.stringify(nCreds)) {
                    nCreds.forEach((nc, i) => {
                        const oc = oCreds[i];
                        if (!oc) { changes.push(`+ Nova Credencial (${nc.user})`); return; }
                        if (nc.user !== oc.user) changes.push(`User SQL: ${oc.user} -> ${nc.user}`);
                        if (nc.password !== oc.password) changes.push(`Senha SQL (${nc.user}): (alterada)`);
                    });
                    if (oCreds.length > nCreds.length) changes.push(`${oCreds.length - nCreds.length} credencial(is) SQL removida(s)`);
                }
            }

            return changes.join(', ');
        };

        if (window.api && window.api.logs) {
            try {
                let cName = (newVal && newVal.name) || (oldVal && oldVal.name);

                // If not found in objects, try to extract from details string (format: "Cliente: NAME, ...")
                if (!cName && details && details.includes('Cliente: ')) {
                    const match = details.match(/Cliente:\s*([^,]+)/);
                    if (match && match[1]) {
                        cName = match[1].trim();
                    }
                }

                // Auto-generate diff for EDIT operations
                if (opType === 'EDIÇÃO' && oldVal && newVal) {
                    const diff = generateDiff(oldVal, newVal);
                    if (diff) {
                        details += ` | Alt: [${diff}]`;
                    }
                }

                await window.api.logs.create({
                    username: username,
                    operation_type: opType,
                    action: action,
                    details: details,
                    old_value: sanitize(oldVal),
                    new_value: sanitize(newVal),
                    client_name: cName || null
                });

                // Refresh activity feed if sidebar is open or after an action
                if (typeof fetchRecentActivities === 'function') await fetchRecentActivities();
            } catch (err) {
                console.error('Erro ao registrar log:', err);
            }
        }
    }

    // Elementos DOM
    const clientList = document.getElementById('clientList');
    const modal = document.getElementById('modal');
    const form = document.getElementById('clientForm');
    const addBtn = document.getElementById('addClientBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const closeBtn = document.getElementById('closeModal');
    const searchInput = document.getElementById('searchInput');
    const modalTitle = document.getElementById('modalTitle');
    const modalToggleFavorite = document.getElementById('modalToggleFavorite');
    const toast = document.getElementById('toast');
    const clearSearchBtn = document.getElementById('clearSearch');
    const logoutBtn = document.getElementById('logoutBtn');
    const listViewBtn = document.getElementById('listViewBtn');
    const gridViewBtn = document.getElementById('gridViewBtn');

    // Função de Notificação Toast
    function showToast(msg, type = 'success') {
        if (!toast) return;

        toast.textContent = msg;
        toast.className = 'toast';

        if (type === 'error' || type === 'danger') {
            toast.classList.add('toast-error');
        } else if (type === 'warning') {
            toast.classList.add('toast-warning');
        } else {
            toast.classList.add('toast-success');
        }

        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 3000);
    }
    window.showToast = showToast;

    // Exibir usuário atual
    window.updateUserDisplay = () => {
        const userDisplay = document.getElementById('currentUserDisplay');
        const currentUser = JSON.parse(localStorage.getItem('sofis_user') || '{}');
        const P = window.Permissions;

        if (userDisplay && currentUser.username) {
            // Determine Role Label
            let roleLabel = '';
            let roles = [];

            if (P && P.userRoles && P.userRoles.length > 0) {
                roles = P.userRoles;
            } else if (P && P.userRole) {
                roles = [P.userRole];
            } else if (currentUser.roles) {
                roles = currentUser.roles;
            } else if (currentUser.role) {
                roles = [currentUser.role];
            }

            if (roles.length > 1) {
                roleLabel = `[${roles.length} Grupos]`;
            } else if (roles.length === 1) {
                roleLabel = `[${roles[0]}]`;
            }

            const displayName = currentUser.full_name || currentUser.fullName || currentUser.username;

            // Layout with click action
            userDisplay.innerHTML = `
                 <div class="user-info-badge" style="cursor: pointer;" title="Clique para ver detalhes de acesso" onclick="window.showUserRoles()">
                     <i class="fa-solid fa-user"></i> <span>${displayName}</span>
                     <small style="opacity: 0.7; font-size: 0.75rem; margin-left: 5px;">${roleLabel}</small>
                 </div>`;
        }
    };

    window.showUserRoles = () => {
        const P = window.Permissions;
        let roles = (P && P.userRoles) ? P.userRoles : [];

        // Fallback to localStorage if P is not ready or empty
        if (roles.length === 0) {
            const u = JSON.parse(localStorage.getItem('sofis_user') || '{}');
            if (u.roles) roles = u.roles;
            else if (u.role) roles = [u.role];
        }

        if (roles.length === 0) return;

        const roleListStr = roles.join('\n• ');

        window.showConfirm(
            `Você possui acesso aos seguintes grupos:\n\n• ${roleListStr}`,
            'Meus Acessos',
            'fa-id-card',
            true
        );
    };

    window.updateUserDisplay();

    // Re-update display when permissions are loaded/changed
    document.addEventListener('permissions-loaded', () => {
        window.updateUserDisplay();
        if (window.applyPermissions) window.applyPermissions();
    });

    // Sistema Moderno de Confirmação e Alerta
    window.showConfirm = function (message, title = 'Confirmação', icon = 'fa-question', arg4 = false, arg5 = null) {
        return new Promise((resolve) => {
            const modal = document.getElementById('confirmModal');
            const titleEl = document.getElementById('confirmTitle');
            const msgEl = document.getElementById('confirmMessage');
            const iconEl = document.getElementById('confirmIcon');
            const okBtn = document.getElementById('confirmOkBtn');
            const cancelBtn = document.getElementById('confirmCancelBtn');

            let isAlert = false;
            let confirmText = 'Confirmar';
            let cancelText = 'Cancelar';

            if (typeof arg4 === 'boolean') {
                isAlert = arg4;
            } else if (typeof arg4 === 'string') {
                confirmText = arg4;
                if (arg5) cancelText = arg5;
            }

            if (!modal) {
                if (isAlert) alert(message.replace(/<[^>]*>/g, ''));
                else resolve(confirm(message.replace(/<[^>]*>/g, '')));
                return;
            }

            // UI Setup
            titleEl.textContent = title;
            msgEl.innerHTML = message;
            iconEl.className = `fa-solid ${icon}`;

            // If it's just an alert, hide cancel button
            if (isAlert) {
                cancelBtn.style.display = 'none';
                okBtn.style.flex = '1';
                okBtn.innerHTML = `<i class="fa-solid fa-check"></i> ${confirmText === 'Confirmar' ? 'OK' : confirmText}`;
            } else {
                cancelBtn.style.display = 'block';
                cancelBtn.innerHTML = `<i class="fa-solid fa-xmark"></i> ${cancelText}`;
                okBtn.style.flex = '1';
                okBtn.innerHTML = `<i class="fa-solid fa-check"></i> ${confirmText}`;
            }

            modal.classList.remove('hidden');

            const handleOk = () => {
                modal.classList.add('hidden');
                cleanup();
                resolve(true);
            };

            const handleCancel = () => {
                modal.classList.add('hidden');
                cleanup();
                resolve(false);
            };

            const handleEsc = (e) => {
                if (e.key === 'Escape') handleCancel();
            };

            const cleanup = () => {
                okBtn.removeEventListener('click', handleOk);
                cancelBtn.removeEventListener('click', handleCancel);
                document.removeEventListener('keydown', handleEsc);
                // Restore Default State
                cancelBtn.style.display = 'block';
                okBtn.innerHTML = '<i class="fa-solid fa-check"></i> Confirmar';
                cancelBtn.innerHTML = '<i class="fa-solid fa-xmark"></i> Cancelar';
            };

            okBtn.addEventListener('click', handleOk);
            cancelBtn.addEventListener('click', handleCancel);
            document.addEventListener('keydown', handleEsc);
        });
    };

    window.handleBlockedDeletion = async function (owners) {
        const confirm = await window.showConfirm(
            'Este registro possui credenciais de outros usuários e não pode ser excluído.<br><br>Deseja visualizar quem são os usuários?',
            'Exclusão Bloqueada',
            'fa-user-lock',
            'Visualizar',
            'Cancelar'
        );

        if (confirm) {
            let displayNames = owners;
            try {
                if (window.api && window.api.users) {
                    const allUsers = await window.api.users.list();
                    if (Array.isArray(allUsers)) {
                        displayNames = owners.map(username => {
                            const user = allUsers.find(u => u.username === username);
                            return user ? (user.full_name || user.username) : username;
                        });
                    }
                }
            } catch (error) {
                console.error("Erro ao buscar nomes de usuários:", error);
            }

            const listHtml = displayNames.map(name => `<li>${escapeHtml(name)}</li>`).join('');
            await window.showConfirm(
                `<div style="text-align: left;">Os seguintes usuários possuem credenciais neste registro:<ul style="margin-top: 10px; margin-left: 20px;">${listHtml}</ul></div>`,
                'Usuários Vinculados',
                'fa-users',
                true
            );
        }
    };

    window.showAlert = function (message, title = 'Aviso', icon = 'fa-circle-info') {
        return window.showConfirm(message, title, icon, true);
    };

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            const confirmed = await window.showConfirm(
                'Deseja realmente sair do sistema?',
                'Confirmar Saída',
                'fa-right-from-bracket'
            );

            if (confirmed) {
                if (window.api && window.api.auth) {
                    await window.api.auth.signOut();
                } else {
                    localStorage.removeItem('sofis_user');
                    window.location.href = 'login.html';
                }
            }
        });
    }

    // Inputs
    const clientNameInput = document.getElementById('clientName');
    const contactList = document.getElementById('contactList');
    const addContactBtn = document.getElementById('addContactBtn');

    // Server Modal Elements
    const serverModal = document.getElementById('serverModal');
    const serverEntryModal = document.getElementById('serverEntryModal');
    const serverForm = document.getElementById('serverForm');
    const closeServerBtn = document.getElementById('closeServerModal');
    const closeServerEntryBtn = document.getElementById('closeServerEntryModal');
    const cancelServerEntryBtn = document.getElementById('cancelServerEntryBtn');
    const addServerEntryBtn = document.getElementById('addServerEntryBtn');
    const serverClientIdInput = document.getElementById('serverClientId');
    const sqlServerInput = document.getElementById('sqlServerInput');
    const credentialList = document.getElementById('credentialList');
    const addCredentialBtn = document.getElementById('addCredentialBtn');
    const serverNotesInput = document.getElementById('serverNotesInput');
    const serverEntryModalTitle = document.getElementById('serverEntryModalTitle');

    // Client Notes Modal Elements
    const notesModal = document.getElementById('notesModal');
    const notesForm = document.getElementById('notesForm');
    const closeNotesBtn = document.getElementById('closeNotesModal');
    const cancelNotesBtn = document.getElementById('cancelNotesBtn');
    const notesClientIdInput = document.getElementById('notesClientId');
    const clientNoteInput = document.getElementById('clientNoteInput');
    const notesModalTitle = document.getElementById('notesModalTitle');

    // VPN Modal Elements
    const vpnModal = document.getElementById('vpnModal');
    const vpnEntryModal = document.getElementById('vpnEntryModal');
    const vpnForm = document.getElementById('vpnForm');
    const closeVpnBtn = document.getElementById('closeVpnModal');
    const closeVpnEntryBtn = document.getElementById('closeVpnEntryModal');
    const cancelVpnEntryBtn = document.getElementById('cancelVpnEntryBtn');
    const addVpnEntryBtn = document.getElementById('addVpnEntryBtn');
    const vpnClientIdInput = document.getElementById('vpnClientId');
    const vpnUserInput = document.getElementById('vpnUserInput');
    const vpnPassInput = document.getElementById('vpnPassInput');
    const vpnNotesInput = document.getElementById('vpnNotesInput');
    const vpnEntryModalTitle = document.getElementById('vpnEntryModalTitle');
    const closeVpnModalBtn = document.getElementById('closeVpnModalBtn');

    // URL Modal Elements
    const urlModal = document.getElementById('urlModal');
    const urlEntryModal = document.getElementById('urlEntryModal');
    const urlForm = document.getElementById('urlForm');
    const closeUrlBtn = document.getElementById('closeUrlModal');
    const closeUrlEntryBtn = document.getElementById('closeUrlEntryModal');
    const cancelUrlEntryBtn = document.getElementById('cancelUrlEntryBtn');
    const addUrlEntryBtn = document.getElementById('addUrlEntryBtn');
    const urlClientIdInput = document.getElementById('urlClientId');
    const urlEnvironmentSelect = document.getElementById('urlEnvironmentSelect');
    const urlSystemSelect = document.getElementById('urlSystemSelect');
    const bridgeDataAccessInput = document.getElementById('bridgeDataAccessInput');
    const bootstrapInput = document.getElementById('bootstrapInput');
    const execUpdateInput = document.getElementById('execUpdateInput');
    const webLaudoInput = document.getElementById('webLaudoInput');
    const urlNotesInput = document.getElementById('urlNotesInput');
    const urlUserInput = document.getElementById('urlUserInput');
    const urlPassInput = document.getElementById('urlPassInput');
    const saveWebLaudoBtn = document.getElementById('saveWebLaudoBtn');
    const urlEntryModalTitle = document.getElementById('urlEntryModalTitle');
    const closeUrlModalBtn = document.getElementById('closeUrlModalBtn');

    // Custom Filter State
    let currentServerFilter = 'all';
    let currentUrlFilter = 'all';
    let currentUrlProductFilter = 'all';

    const serverFilterBtn = document.getElementById('serverFilterBtn');
    const serverFilterMenu = document.getElementById('serverFilterMenu');
    const urlFilterBtn = document.getElementById('urlFilterBtn');
    const urlFilterMenu = document.getElementById('urlFilterMenu');
    const urlProductFilterBtn = document.getElementById('urlProductFilterBtn');
    const urlProductFilterMenu = document.getElementById('urlProductFilterMenu');
    const urlProductFilterLabel = document.getElementById('urlProductFilterLabel');

    const webLaudoDisplay = document.getElementById('webLaudoDisplay');
    const webLaudoForm = document.getElementById('webLaudoForm');
    const webLaudoText = document.getElementById('webLaudoText');
    const editWebLaudoBtn = document.getElementById('editWebLaudoBtn');

    const deleteWebLaudoBtn = document.getElementById('deleteWebLaudoBtn');

    // Contact Modal Elements
    const contactModal = document.getElementById('contactModal');
    const closeContactBtn = document.getElementById('closeContactModal');
    const closeContactModalBtn = document.getElementById('closeContactModalBtn');
    const contactModalList = document.getElementById('contactModalList');
    const contactModalClientName = document.getElementById('contactModalClientName');
    const contactModalClientId = document.getElementById('contactModalClientId');
    const addContactModalBtn = document.getElementById('addContactModalBtn');
    const contactModalSearch = document.getElementById('contactModalSearch');

    // Activity Sidebar Elements
    const activitySidebar = document.getElementById('activitySidebar');
    const activityList = document.getElementById('activityList');
    const toggleActivityBtn = document.getElementById('toggleActivityBtn');
    const closeActivityBtn = document.getElementById('closeActivityBtn');
    const activityOverlay = document.getElementById('activityOverlay');

    // History Modal Elements
    const historyModal = document.getElementById('historyModal');
    const historyList = document.getElementById('historyList');
    const closeHistoryModalBtn = document.getElementById('closeHistoryModal');
    const historyModalTitle = document.getElementById('historyModalTitle');

    function renderSkeleton() {
        if (!clientList) return;
        clientList.innerHTML = '';
        const skeletonCount = 5;
        for (let i = 0; i < skeletonCount; i++) {
            const skeletonRow = document.createElement('div');
            skeletonRow.className = 'skeleton-row';
            skeletonRow.innerHTML = `
                <div class="skeleton-header">
                    <div class="skeleton-left">
                        <div class="skeleton-star pulse"></div>
                        <div class="skeleton-text pulse" style="width: 150px;"></div>
                    </div>
                    <div class="skeleton-right">
                        <div class="skeleton-icon pulse"></div>
                        <div class="skeleton-icon pulse"></div>
                        <div class="skeleton-icon pulse"></div>
                        <div class="skeleton-icon pulse"></div>
                        <div class="skeleton-icon pulse"></div>
                        <div class="skeleton-icon pulse"></div>
                    </div>
                </div>
            `;
            clientList.appendChild(skeletonRow);
        }
    }

    // Initial Render
    // Global Favorites State
    window.userFavorites = new Set();

    async function loadUserFavorites() {
        const user = JSON.parse(localStorage.getItem('sofis_user') || '{}');
        if (!user.username) {
            console.warn('⚠️ Usuário não identificado para carregar favoritos.');
            return;
        }

        try {
            if (window.api && window.api.favorites) {
                const favs = await window.api.favorites.list(user.username);
                window.userFavorites.clear();
                if (Array.isArray(favs)) {
                    favs.forEach(f => {
                        // PHP fetchAll(PDO::FETCH_COLUMN) returns simple array of values [1, 2, 3]
                        // fetchAll(PDO::FETCH_ASSOC) would return [{client_id: 1}, ...]
                        // Handle both just in case
                        const id = (typeof f === 'object' && f !== null) ? f.client_id : f;
                        window.userFavorites.add(id);
                    });
                }
                console.log(`⭐ Favoritos carregados para [${user.username}]: ${window.userFavorites.size}`, window.userFavorites);
            }
        } catch (e) {
            console.error('❌ Erro ao carregar favoritos:', e);
        }
    }

    // Renderização Inicial
    async function initialLoad() {
        renderSkeleton();

        try {
            // Verificar disponibilidade da API
            if (!window.api || !window.api.clients) {
                console.error('Serviço de API indisponível');
                clients = [];
                return;
            }

            // Fetch all data from API
            const dbClients = await window.api.clients.list();

            if (dbClients && Array.isArray(dbClients)) {

                // Primeiro carrega favoritos para ter o set pronto
                await loadUserFavorites();

                clients = dbClients.map(c => ({
                    id: c.id,
                    name: c.name,
                    seqId: c.seq_id || c.id, // Fallback if no seq_id
                    updatedAt: c.updated_at,
                    isFavorite: window.userFavorites.has(c.id), // Direct check
                    notes: c.notes,
                    webLaudo: c.web_laudo,
                    // arrays are already decoded by API PHP
                    contacts: c.contacts || [],
                    servers: c.servers || [],
                    vpns: c.vpns || [],
                    hosts: c.hosts || [],
                    urls: c.urls || [],
                    inactive_contract: c.inactive_contract || null
                }));

            } else {
                clients = [];
            }
        } catch (err) {
            console.error('Erro ao carregar do API:', err);
            clients = [];
        }

        // Clean duplicates (shouldn't happen with API but good safety)
        const uniqueClients = [];
        const seenIds = new Set();
        clients.forEach(client => {
            if (!seenIds.has(client.id)) {
                seenIds.add(client.id);
                uniqueClients.push(client);
            }
        });
        clients = uniqueClients;
        window.clients = clients; // Sync global variable

        renderClients(clients);
        updateFilterCounts();
        applyViewMode();
        if (typeof fetchRecentActivities === 'function') fetchRecentActivities();
        if (window.populateVersionClientSelect) {
            window.populateVersionClientSelect();
        }
    }

    await initialLoad();

    // Event Listeners
    addBtn.addEventListener('click', openAddModal);
    cancelBtn.addEventListener('click', closeModal);
    closeBtn.addEventListener('click', closeModal);
    form.addEventListener('submit', async (e) => {
        await handleFormSubmit(e);
    });

    // Reset client name field when form is reset
    form.addEventListener('reset', () => {
        if (window.resetClientNameField) {
            window.resetClientNameField();
        }
    });

    if (listViewBtn) {
        listViewBtn.addEventListener('click', () => {
            currentView = 'list';
            localStorage.setItem('sofis_view_mode', 'list');
            applyViewMode();
        });
    }

    if (gridViewBtn) {
        gridViewBtn.addEventListener('click', () => {
            currentView = 'grid';
            localStorage.setItem('sofis_view_mode', 'grid');
            applyViewMode();
        });
    }

    function applyViewMode() {
        if (!clientList) return;

        if (currentView === 'grid') {
            clientList.classList.add('grid-mode');
            if (gridViewBtn) gridViewBtn.classList.add('active');
            if (listViewBtn) listViewBtn.classList.remove('active');
        } else {
            clientList.classList.remove('grid-mode');
            if (listViewBtn) listViewBtn.classList.add('active');
            if (gridViewBtn) gridViewBtn.classList.remove('active');
        }
    }

    if (modalToggleFavorite) {
        modalToggleFavorite.addEventListener('click', () => {
            isModalFavorite = !isModalFavorite;
            updateModalFavoriteUI();
        });
    }



    searchInput.addEventListener('input', (e) => {
        if (e.target.value.length > 0) {
            clearSearchBtn.classList.remove('hidden');
        } else {
            clearSearchBtn.classList.add('hidden');
        }
        applyClientFilter();
    });

    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            searchInput.value = '';
            clearSearchBtn.classList.add('hidden');
            applyClientFilter();
            searchInput.focus();
        });
    }

    addContactBtn.addEventListener('click', () => addContactGroup());

    // Server Modal Listeners
    if (serverForm) serverForm.addEventListener('submit', handleServerSubmit);
    if (closeServerBtn) closeServerBtn.addEventListener('click', closeServerModal);
    if (closeServerEntryBtn) closeServerEntryBtn.addEventListener('click', closeServerEntryModal);
    if (cancelServerEntryBtn) cancelServerEntryBtn.addEventListener('click', closeServerEntryModal);
    if (addServerEntryBtn) addServerEntryBtn.addEventListener('click', openServerEntry);

    const closeServerModalBtn = document.getElementById('closeServerModalBtn');
    if (closeServerModalBtn) closeServerModalBtn.addEventListener('click', closeServerModal);

    if (addCredentialBtn) addCredentialBtn.addEventListener('click', () => addCredentialField());

    // Client Notes Listeners
    if (notesForm) notesForm.addEventListener('submit', handleNotesSubmit);
    if (closeNotesBtn) closeNotesBtn.addEventListener('click', closeNotesModal);
    if (cancelNotesBtn) cancelNotesBtn.addEventListener('click', closeNotesModal);

    // VPN Listeners
    if (vpnForm) vpnForm.addEventListener('submit', handleVpnSubmit);
    if (closeVpnBtn) closeVpnBtn.addEventListener('click', closeVpnModal);
    if (closeVpnEntryBtn) closeVpnEntryBtn.addEventListener('click', closeVpnEntryModal);
    if (cancelVpnEntryBtn) cancelVpnEntryBtn.addEventListener('click', closeVpnEntryModal);
    if (addVpnEntryBtn) addVpnEntryBtn.addEventListener('click', openVpnEntry);
    if (closeVpnModalBtn) closeVpnModalBtn.addEventListener('click', closeVpnModal);


    // URL Listeners
    if (urlForm) urlForm.addEventListener('submit', handleUrlSubmit);
    if (closeUrlBtn) closeUrlBtn.addEventListener('click', closeUrlModal);
    if (closeUrlEntryBtn) closeUrlEntryBtn.addEventListener('click', closeUrlEntryModal);
    if (cancelUrlEntryBtn) cancelUrlEntryBtn.addEventListener('click', closeUrlEntryModal);
    if (addUrlEntryBtn) addUrlEntryBtn.addEventListener('click', openUrlEntry);
    if (closeUrlModalBtn) closeUrlModalBtn.addEventListener('click', closeUrlModal);
    if (saveWebLaudoBtn) saveWebLaudoBtn.addEventListener('click', handleWebLaudoSave);
    if (editWebLaudoBtn) editWebLaudoBtn.addEventListener('click', () => editWebLaudo());
    if (deleteWebLaudoBtn) deleteWebLaudoBtn.addEventListener('click', () => handleDeleteWebLaudo());

    // Contact Modal Listeners
    if (closeContactBtn) closeContactBtn.addEventListener('click', closeContactModal);
    if (closeContactModalBtn) closeContactModalBtn.addEventListener('click', closeContactModal);
    if (addContactModalBtn) {
        addContactModalBtn.addEventListener('click', () => {
            const clientId = contactModalClientId.value;
            if (clientId) {
                addNewContact(clientId);
            }
        });
    }

    if (contactModalSearch) {
        contactModalSearch.addEventListener('input', () => {
            const clientId = contactModalClientId.value;
            const client = clients.find(c => c.id == clientId);
            if (client) {
                renderContactModalList(client);
            }
        });
    }

    if (urlSystemSelect) {
        urlSystemSelect.addEventListener('change', handleUrlSystemChange);
    }







    // --- Changelog Logic Moved to index.html ---
    if (serverFilterBtn) {
        serverFilterBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            serverFilterMenu.classList.toggle('active');
            urlFilterMenu.classList.remove('active');
        });
    }

    if (urlFilterBtn) {
        urlFilterBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            urlFilterMenu.classList.toggle('active');
            serverFilterMenu.classList.remove('active');
        });
    }

    if (urlProductFilterBtn) {
        urlProductFilterBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            urlProductFilterMenu.classList.toggle('active');
            if (urlFilterMenu) urlFilterMenu.classList.remove('active');
            if (serverFilterMenu) serverFilterMenu.classList.remove('active');
        });
    }

    // Close menus on click outside
    document.addEventListener('click', () => {
        if (serverFilterMenu) serverFilterMenu.classList.remove('active');
        if (urlFilterMenu) urlFilterMenu.classList.remove('active');
        if (urlProductFilterMenu) urlProductFilterMenu.classList.remove('active');
    });

    // Handle Filter Item Clicks
    if (serverFilterMenu) {
        serverFilterMenu.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', () => {
                currentServerFilter = item.dataset.value;

                // Update UI state
                serverFilterMenu.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');

                if (currentServerFilter !== 'all') {
                    serverFilterBtn.classList.add('filter-btn-active');
                } else {
                    serverFilterBtn.classList.remove('filter-btn-active');
                }

                const client = clients.find(c => c.id === serverClientIdInput.value);
                if (client) renderServersList(client);
                serverFilterMenu.classList.remove('active');
            });
        });
    }

    if (urlFilterMenu) {
        urlFilterMenu.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', () => {
                currentUrlFilter = item.dataset.value;

                // Update UI state
                urlFilterMenu.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');

                if (currentUrlFilter !== 'all') {
                    urlFilterBtn.classList.add('filter-btn-active');
                } else {
                    urlFilterBtn.classList.remove('filter-btn-active');
                }

                const client = clients.find(c => c.id === urlClientIdInput.value);
                if (client) renderUrlList(client);
                urlFilterMenu.classList.remove('active');
            });
        });
    }

    // Filter Chips Functionality
    const filterChips = document.querySelectorAll('.filter-chip');
    filterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const filterValue = chip.dataset.filter;
            currentClientFilter = filterValue;

            // Update active state
            filterChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');

            // Apply filter
            applyClientFilter();
        });
    });

    function applyClientFilter() {
        const searchTerm = searchInput.value.toLowerCase();
        let filteredClients = clients;

        // Apply search filter first
        if (searchTerm) {
            filteredClients = clients.filter(client => {
                const nameMatch = (client.name || "").toLowerCase().includes(searchTerm);
                const phoneMatch = client.contacts?.some(contact =>
                    contact.phones?.some(phone => phone.includes(searchTerm))
                );
                const emailMatch = client.contacts?.some(contact =>
                    contact.emails?.some(email => (email || "").toLowerCase().includes(searchTerm))
                );
                return nameMatch || phoneMatch || emailMatch;
            });
        }

        // Apply favorite filter
        if (currentClientFilter === 'favorites') {
            filteredClients = filteredClients.filter(c => c.isFavorite);
        } else if (currentClientFilter === 'regular') {
            filteredClients = filteredClients.filter(c => !c.isFavorite);
        }

        renderClients(filteredClients);
        updateFilterCounts();
    }

    function updateFilterCounts() {
        const allCount = clients.length;
        const favoritesCount = clients.filter(c => !!c.isFavorite).length;
        const regularCount = clients.filter(c => !c.isFavorite).length;

        const countAllEl = document.getElementById('countAll');
        const countFavoritesEl = document.getElementById('countFavorites');
        const countRegularEl = document.getElementById('countRegular');

        if (countAllEl) countAllEl.textContent = allCount;
        if (countFavoritesEl) countFavoritesEl.textContent = favoritesCount;
        if (countRegularEl) countRegularEl.textContent = regularCount;
    }

    // --- Functions ---

    function renderClients(clientsToRender) {
        if (!clientList) return;

        // Permissions Check
        const P = window.Permissions;
        const canViewClients = P ? P.can('Gestão de Clientes', 'can_view') : true;

        if (!canViewClients) {
            clientList.innerHTML = `<div class="empty-state" style="padding: 40px; text-align: center; color: var(--text-secondary);"><i class="fa-solid fa-lock" style="font-size: 3rem; margin-bottom: 20px;"></i><p>Você não tem permissão para visualizar clientes.</p></div>`;
            return;
        }

        // Remove skeleton loaders if they exist
        clientList.querySelectorAll('.skeleton-row').forEach(skeleton => skeleton.remove());

        // Separate favorites from regular clients (normalized)
        const favoriteClients = clientsToRender.filter(c => !!c.isFavorite).sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        const regularClients = clientsToRender.filter(c => !c.isFavorite).sort((a, b) => (a.name || "").localeCompare(b.name || ""));

        // Get existing client rows
        const existingRows = {};
        clientList.querySelectorAll('.client-row').forEach(row => {
            const id = row.id.replace('client-row-', '');
            existingRows[id] = row;
        });

        if (clientsToRender.length === 0) {
            let emptyMessage = 'Nenhum cliente encontrado.';
            let emptyIcon = 'fa-folder-open';

            if (currentClientFilter === 'favorites') {
                emptyMessage = 'Nenhum cliente favorito ainda.';
                emptyIcon = 'fa-star';
            } else if (currentClientFilter === 'regular') {
                emptyMessage = 'Nenhum cliente regular encontrado.';
                emptyIcon = 'fa-users';
            } else if (searchInput.value) {
                emptyMessage = 'Nenhum resultado para sua busca.';
                emptyIcon = 'fa-magnifying-glass';
            }

            // Hide all existing rows
            Object.values(existingRows).forEach(row => row.style.display = 'none');

            // Show or create empty state
            let emptyState = clientList.querySelector('.empty-state');
            if (!emptyState) {
                emptyState = document.createElement('div');
                emptyState.className = 'empty-state';
                emptyState.style.cssText = 'grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 40px;';
                clientList.appendChild(emptyState);
            }
            emptyState.innerHTML = `
                <i class="fa-solid ${emptyIcon}" style="font-size: 3rem; margin-bottom: 16px; opacity: 0.5;"></i>
                <p>${emptyMessage}</p>
            `;
            emptyState.style.display = 'block';

            // Hide section headers
            clientList.querySelectorAll('.clients-section-header').forEach(h => h.style.display = 'none');
            return;
        }

        // Hide empty state if exists
        const emptyState = clientList.querySelector('.empty-state');
        if (emptyState) emptyState.style.display = 'none';

        // Track which clients should be visible
        const visibleClientIds = new Set(clientsToRender.map(c => c.id));

        // Hide clients that shouldn't be visible
        Object.entries(existingRows).forEach(([id, row]) => {
            if (!visibleClientIds.has(id)) {
                row.style.display = 'none';
            }
        });

        // Render Favorites Section
        let favoritesHeader = clientList.querySelector('.favorites-header');
        if (favoriteClients.length > 0) {
            if (!favoritesHeader) {
                favoritesHeader = document.createElement('div');
                favoritesHeader.className = `clients-section-header favorites-header ${favoritesCollapsed ? 'section-collapsed' : ''}`;
                favoritesHeader.onclick = toggleFavoritesSection;
                // Prepend to ensure it's at the top
                clientList.prepend(favoritesHeader);
            } else {
                // Ensure it is visually at the top if it already exists
                clientList.prepend(favoritesHeader);
            }
            favoritesHeader.innerHTML = `
                <div class="section-header-content">
                    <i class="fa-solid fa-chevron-down section-chevron"></i>
                    <i class="fa-solid fa-star"></i>
                    <span class="section-title">Clientes Favoritos</span>
                    <span class="section-count">${favoriteClients.length}</span>
                </div>
            `;
            favoritesHeader.className = `clients-section-header favorites-header ${favoritesCollapsed ? 'section-collapsed' : ''}`;
            favoritesHeader.style.display = 'flex';

            if (!favoritesCollapsed) {
                let lastNode = favoritesHeader;
                favoriteClients.forEach(client => {
                    let row = existingRows[client.id];
                    if (!row) {
                        row = createClientRow(client);
                        clientList.appendChild(row); // Temporarily append, will move
                        existingRows[client.id] = row;
                    } else {
                        updateClientRow(row, client);
                    }
                    row.style.display = 'block';
                    // Move specifically after the last node to maintain order [C1, C2, C3]
                    // insertBefore(newNode, referenceNode) -> referenceNode should be lastNode.nextSibling
                    if (clientList.contains(row)) {
                        // If render is clean, nextSibling works well.
                        if (lastNode.nextSibling !== row) {
                            clientList.insertBefore(row, lastNode.nextSibling);
                        }
                    } else {
                        clientList.insertBefore(row, lastNode.nextSibling);
                    }
                    lastNode = row;
                });
            } else {
                favoriteClients.forEach(client => {
                    if (existingRows[client.id]) {
                        existingRows[client.id].style.display = 'none';
                    }
                });
            }
        } else if (favoritesHeader) {
            favoritesHeader.style.display = 'none';
        }

        // Render Regular Clients Section
        let regularHeader = clientList.querySelector('.regular-header');
        if (regularClients.length > 0) {
            if (!regularHeader) {
                regularHeader = document.createElement('div');
                regularHeader.className = `clients-section-header regular-header ${regularCollapsed ? 'section-collapsed' : ''}`;
                regularHeader.onclick = toggleRegularSection;
                clientList.appendChild(regularHeader);
            } else {
                // Move to end (after favorites)
                clientList.appendChild(regularHeader);
            }

            regularHeader.innerHTML = `
                <div class="section-header-content">
                    <i class="fa-solid fa-chevron-down section-chevron"></i>
                    <i class="fa-solid fa-users"></i>
                    <span class="section-title">${favoriteClients.length > 0 ? 'Outros Clientes' : 'Clientes'}</span>
                    <span class="section-count">${regularClients.length}</span>
                </div>
            `;
            regularHeader.className = `clients-section-header regular-header ${regularCollapsed ? 'section-collapsed' : ''}`;
            regularHeader.style.display = 'flex';

            if (!regularCollapsed) {
                let lastNode = regularHeader;
                regularClients.forEach(client => {
                    let row = existingRows[client.id];
                    if (!row) {
                        row = createClientRow(client);
                        clientList.appendChild(row);
                        existingRows[client.id] = row;
                    } else {
                        updateClientRow(row, client);
                    }
                    row.style.display = 'block';

                    if (clientList.contains(row)) {
                        if (lastNode.nextSibling !== row) {
                            clientList.insertBefore(row, lastNode.nextSibling);
                        }
                    } else {
                        clientList.insertBefore(row, lastNode.nextSibling);
                    }
                    lastNode = row;
                });
            } else {
                regularClients.forEach(client => {
                    if (existingRows[client.id]) {
                        existingRows[client.id].style.display = 'none';
                    }
                });
            }
        } else if (regularHeader) {
            regularHeader.style.display = 'none';
        }
    }

    // New function to update existing row without recreating
    function updateClientRow(row, client) {
        const currentUser = JSON.parse(localStorage.getItem('sofis_user') || '{}').username || 'anônimo';

        const hasServers = client.servers && client.servers.length > 0;

        // VPNs are now always counted (restricted message shown in modal if private)
        const visibleVpns = (client.vpns || []);
        const hasVpns = visibleVpns.length > 0;

        const hasHosts = client.hosts && client.hosts.length > 0;

        // URLs are now always counted
        const visibleUrls = (client.urls || []);
        const urlCount = visibleUrls.length + (client.webLaudo ? (typeof client.webLaudo === 'object' ? 1 : (client.webLaudo.trim() !== '' ? 1 : 0)) : 0);
        const hasUrls = urlCount > 0;
        const hasContacts = client.contacts && client.contacts.length > 0;

        // Update favorite status
        const isInactiveContract = client.inactive_contract && client.inactive_contract.active;
        row.className = `client-row ${client.isFavorite ? 'favorite' : ''} ${isInactiveContract ? 'inactive-contract-row' : ''}`;

        // Update favorite button
        const starBtn = row.querySelector('.btn-star');
        if (starBtn) {
            starBtn.className = `btn-icon btn-star ${client.isFavorite ? 'favorite-active' : ''}`;
            starBtn.title = client.isFavorite ? 'Remover Favorito' : 'Favoritar';
            const starIcon = starBtn.querySelector('i');
            if (starIcon) {
                starIcon.className = `fa-${client.isFavorite ? 'solid' : 'regular'} fa-star`;
            }
        }

        // Update client name and note indicator
        const nameContainer = row.querySelector('.client-name-row');
        if (nameContainer) {
            nameContainer.onclick = null; // Remove interaction from name click
            nameContainer.style.cursor = 'default';
            nameContainer.classList.remove('clickable');
            nameContainer.innerHTML = `
                ${escapeHtml(client.name)}
                ${client.notes ? `<i class="fa-solid fa-bell client-note-indicator" style="margin-left: 15px; cursor: pointer;" onclick="window.openClientGeneralNotes('${client.id}'); event.stopPropagation();" title="Possui observações importantes"></i>` : ''}
                ${(client.inactive_contract && client.inactive_contract.active) ? `<span class="inactive-info-icon" title="Contrato Inativo">i</span>` : ''}
            `;
        }

        // Update timestamp
        const updatedInfo = row.querySelector('.client-updated-info');
        if (updatedInfo && client.updatedAt) {
            const dateStr = new Date(client.updatedAt).toLocaleDateString('pt-BR');
            const timeStr = new Date(client.updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            updatedInfo.querySelector('.hover-underline').textContent = `Atualizado: ${dateStr} ${timeStr}`;
        }

        // Update badges
        const updateBadge = (selector, hasData, count) => {
            const btn = row.querySelector(selector);
            if (btn) {
                btn.className = hasData ? 'btn-icon active-success btn-with-badge' : 'btn-icon btn-with-badge';
                const badge = btn.querySelector('.btn-badge');
                if (hasData && count > 0) {
                    if (!badge) {
                        const newBadge = document.createElement('span');
                        newBadge.className = 'btn-badge';
                        newBadge.textContent = count;
                        btn.appendChild(newBadge);
                    } else {
                        badge.textContent = count;
                    }
                } else if (badge) {
                    badge.remove();
                }
            }
        };

        // Update Hosts/Servers Badge (New Module)
        updateBadge('button[title="Servidores"]', hasHosts, client.hosts ? client.hosts.length : 0);

        // Update SQL Badge
        const contactBtn = row.querySelector('.btn-with-badge:has(.contact-icon-img)');
        if (contactBtn) {
            contactBtn.className = hasContacts ? 'btn-icon active-success btn-with-badge' : 'btn-icon btn-with-badge';
            const contactIcon = contactBtn.querySelector('.contact-icon-img');
            if (contactIcon) {
                contactIcon.className = hasContacts ? 'contact-icon-img vpn-icon-success' : 'contact-icon-img';
            }
            const badge = contactBtn.querySelector('.btn-badge');
            if (hasContacts) {
                if (!badge) {
                    const newBadge = document.createElement('span');
                    newBadge.className = 'btn-badge';
                    newBadge.textContent = client.contacts.length;
                    contactBtn.appendChild(newBadge);
                } else {
                    badge.textContent = client.contacts.length;
                }
            } else if (badge) {
                badge.remove();
            }
        }

        // Update server badge
        updateBadge('.btn-with-badge:has(.fa-database)', hasServers, client.servers?.length || 0);

        // Update VPN badge and icon
        const vpnBtn = row.querySelector('.btn-with-badge:has(.vpn-icon-img)');
        if (vpnBtn) {
            vpnBtn.className = hasVpns ? 'btn-icon active-success btn-with-badge' : 'btn-icon btn-with-badge';
            const vpnIcon = vpnBtn.querySelector('.vpn-icon-img');
            if (vpnIcon) {
                vpnIcon.className = hasVpns ? 'vpn-icon-img vpn-icon-success' : 'vpn-icon-img';
            }
            const badge = vpnBtn.querySelector('.btn-badge');
            if (hasVpns) {
                if (!badge) {
                    const newBadge = document.createElement('span');
                    newBadge.className = 'btn-badge';
                    newBadge.textContent = visibleVpns.length;
                    vpnBtn.appendChild(newBadge);
                } else {
                    badge.textContent = visibleVpns.length;
                }
            } else if (badge) {
                badge.remove();
            }
        }

        // Update URL badge
        updateBadge('.btn-with-badge:has(.fa-link)', hasUrls, urlCount);
    }

    // Helper function to create a client row
    function createClientRow(client) {
        const row = document.createElement('div');
        const isInactiveContract = client.inactive_contract && client.inactive_contract.active;
        row.className = `client-row ${client.isFavorite ? 'favorite' : ''} ${isInactiveContract ? 'inactive-contract-row' : ''}`;
        row.id = `client-row-${client.id}`;

        // Permissions
        const P = window.Permissions;
        // Edit/Delete Client itself -> Gestão de Clientes
        const canEdit = P ? P.can('Gestão de Clientes', 'can_edit') : false;
        const canDelete = P ? P.can('Gestão de Clientes', 'can_delete') : false;

        // Granular Permissions for Sub-Modules
        const canViewContactsButton = P ? P.can('Dados de Contato', 'can_view') : false;
        const canViewServers = P ? P.can('Servidores', 'can_view') : false;
        const canViewSQL = P ? P.can('Dados de Acesso (SQL)', 'can_view') : false;
        const canViewVPN = P ? P.can('Dados de Acesso (VPN)', 'can_view') : false;
        const canViewURL = P ? P.can('URLs', 'can_view') : false;
        const canViewLogs = P ? P.can('Logs e Atividades', 'can_view') : false;

        const currentUser = JSON.parse(localStorage.getItem('sofis_user') || '{}').username || 'anônimo';
        const hasServers = client.servers && client.servers.length > 0;

        const visibleVpns = (client.vpns || []);
        const hasVpns = visibleVpns.length > 0;

        const hasHosts = client.hosts && client.hosts.length > 0;

        const visibleUrls = (client.urls || []);
        const urlCount = visibleUrls.length + (client.webLaudo ? (typeof client.webLaudo === 'object' ? 1 : (client.webLaudo.trim() !== '' ? 1 : 0)) : 0);
        const hasUrls = urlCount > 0;
        const hasContacts = client.contacts && client.contacts.length > 0;

        const hasIsbt = client.isbt_code && client.isbt_code.trim() !== '';

        const serverBtnClass = hasServers ? 'btn-icon active-success' : 'btn-icon';
        const vpnBtnClass = hasVpns ? 'btn-icon active-success' : 'btn-icon';
        const hostBtnClass = hasHosts ? 'btn-icon active-success' : 'btn-icon';
        const urlBtnClass = hasUrls ? 'btn-icon active-success' : 'btn-icon';
        const isbtBtnClass = hasIsbt ? 'btn-icon active-success' : 'btn-icon';
        const contactBtnClass = hasContacts ? 'btn-icon active-success' : 'btn-icon';
        const vpnIconClass = hasVpns ? 'vpn-icon-img vpn-icon-success' : 'vpn-icon-img';

        row.innerHTML = `
            <div class="client-row-header">
                <div class="header-left" style="align-items: flex-start;">
                    <button class="btn-icon btn-star ${client.isFavorite ? 'favorite-active' : ''}" onclick="toggleFavorite('${client.id}'); event.stopPropagation();" title="${client.isFavorite ? 'Remover Favorito' : 'Favoritar'}" style="margin-top: 0;">
                        <i class="fa-${client.isFavorite ? 'solid' : 'regular'} fa-star"></i>
                    </button>
                    <div class="client-name-container" style="display: flex; flex-direction: column; justify-content: flex-start;">
                        <div class="client-name-row" title="Nome do Cliente" style="display: flex; align-items: center;">
                            <span style="font-weight: 600;">${escapeHtml(client.name)}</span>
                            ${client.notes ? `<i class="fa-solid fa-bell client-note-indicator" title="Possui observações importantes" style="margin-left: 15px; cursor: pointer;" onclick="window.openClientGeneralNotes('${client.id}'); event.stopPropagation();"></i>` : ''}
                            ${(client.inactive_contract && client.inactive_contract.active) ? `<span class="inactive-info-icon" title="Contrato Inativo">i</span>` : ''}
                        </div>
                        ${client.updatedAt && canViewLogs ? `
                            <div class="client-updated-info clickable" onclick="openClientHistory('${client.id}'); event.stopPropagation();" title="Ver Histórico de Alterações" style="font-size: 0.7rem; color: var(--text-secondary); margin-top: 2px; font-weight: normal; display: flex; align-items: center; gap: 4px; cursor: pointer; width: fit-content;">
                                <i class="fa-solid fa-clock-rotate-left" style="font-size: 0.65rem; color: var(--accent);"></i>
                                <span class="hover-underline">Atualizado: ${new Date(client.updatedAt).toLocaleDateString('pt-BR')} ${new Date(client.updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="header-right">
                     <div class="row-actions">
                          ${canViewContactsButton ? `
                          <button class="${contactBtnClass} btn-with-badge" onclick="event.stopPropagation(); openContactData('${client.id}');" title="Ver Contatos">
                             <img src="assets/images/contact-icon.png" class="contact-icon-img ${hasContacts ? 'vpn-icon-success' : ''}" alt="Contatos">
                             ${hasContacts ? `<span class="btn-badge">${client.contacts.length}</span>` : ''}
                         </button>
                         ` : ''}
                         
                         <!-- Granular Infra Buttons -->
                         ${canViewServers ? `
                          <button class="${hostBtnClass} btn-with-badge perm-infra-server" onclick="openHostData('${client.id}'); event.stopPropagation();" title="Servidores">
                              <i class="fa-solid fa-server"></i>
                              ${hasHosts ? `<span class="btn-badge">${client.hosts.length}</span>` : ''}
                          </button>
                          ` : ''}

                         ${canViewSQL ? `
                          <button class="${serverBtnClass} btn-with-badge perm-infra-sql" onclick="openServerData('${client.id}'); event.stopPropagation();" title="Dados de acesso ao SQL">
                              <i class="fa-solid fa-database"></i>
                              ${hasServers ? `<span class="btn-badge">${client.servers.length}</span>` : ''}
                          </button>
                          ` : ''}

                          ${canViewVPN ? `
                          <button class="${vpnBtnClass} btn-with-badge perm-infra-vpn" onclick="openVpnData('${client.id}'); event.stopPropagation();" title="Dados de Acesso VPN">
                             <img src="assets/images/vpn-icon.png" class="${vpnIconClass}" alt="VPN">
                             ${hasVpns ? `<span class="btn-badge">${visibleVpns.length}</span>` : ''}
                         </button>
                         ` : ''}

                         ${canViewURL ? `
                          <button class="${urlBtnClass} btn-with-badge perm-infra-url" onclick="event.stopPropagation(); openUrlData('${client.id}');" title="URL">
                             <i class="fa-solid fa-link"></i>
                             ${hasUrls ? `<span class="btn-badge">${urlCount}</span>` : ''}
                         </button>
                         ` : ''}

                         <button class="${isbtBtnClass}" onclick="event.stopPropagation(); openIsbtModal('${client.id}');" title="ISBT 128">
                             <i class="fa-solid fa-barcode"></i>
                         </button>

                         <!-- Edit Permission Check -->
                         ${canEdit ? `
                         <button class="btn-icon btn-edit-client perm-edit" onclick="window.openClientInteraction('${client.id}', '${escapeHtml(client.name)}'); event.stopPropagation();" title="Editar Cliente" style="color: var(--text-secondary);">
                             <i class="fa-solid fa-pencil"></i>
                         </button>
                         ` : ''}

                         <!-- Delete Permission Check -->
                         ${canDelete ? `
                         <button class="btn-icon btn-danger btn-delete-client perm-delete" onclick="deleteClient('${client.id}'); event.stopPropagation();" title="Excluir">
                             <i class="fa-solid fa-trash"></i>
                         </button>
                         ` : ''}
                     </div>
                </div>
            </div>
        `;
        return row;
    }

    // --- Contact Modal Functions ---
    window.openContactData = (clientId) => {
        const client = clients.find(c => c.id == clientId);
        if (!client) return;

        if (contactModalClientId) contactModalClientId.value = clientId;
        if (contactModalClientName) contactModalClientName.textContent = client.name;
        if (contactModalSearch) contactModalSearch.value = '';

        // Permission Check for Add Button (Granular)
        if (addContactModalBtn) {
            addContactModalBtn.style.display = window.Permissions.can('Dados de Contato', 'can_create') ? '' : 'none';
        }

        renderContactModalList(client);
        contactModal.classList.remove('hidden');
    };

    function closeContactModal() {
        contactModal.classList.add('hidden');
    }
    window.closeContactModal = closeContactModal;

    window.deleteContact = async (clientId, index) => {
        // Permission Check
        if (window.Permissions && !window.Permissions.can('Dados de Contato', 'can_delete')) {
            showToast('🚫 Acesso negado: Você não tem permissão para excluir contatos.', 'error');
            return;
        }

        const confirmed = await window.showConfirm('Tem certeza que deseja excluir este contato?', 'Excluir Contato', 'fa-address-book');
        if (!confirmed) return;

        const client = clients.find(c => c.id == clientId);
        if (!client || !client.contacts) return;

        client.contacts.splice(index, 1);
        await saveToLocal(client.id);
        renderClients(clients);

        // Re-render modal list if open
        const contactModalClientId = document.getElementById('contactModalClientId');
        if (contactModalClientId && contactModalClientId.value == clientId) {
            renderContactModalList(client);
        }

        showToast(`🗑️ Contato excluído com sucesso!`, 'success');
    };

    function renderContactModalList(client) {
        if (!contactModalList) return;
        contactModalList.innerHTML = '';

        if (!client.contacts || client.contacts.length === 0) {
            contactModalList.innerHTML = `
                <div style="width: 100%; text-align: center; padding: 20px; color: var(--text-secondary);">
                    <i class="fa-solid fa-address-book" style="font-size: 3rem; opacity: 0.3; margin-bottom: 12px;"></i>
                    <p>Nenhum contato cadastrado.</p>
                </div>
            `;
            return;
        }

        const searchTerm = contactModalSearch ? contactModalSearch.value.toLowerCase() : '';
        const cleanSearchTerm = searchTerm.replace(/\D/g, '');

        const filteredContacts = client.contacts.filter(contact => {
            const nameMatch = (contact.name || '').toLowerCase().includes(searchTerm);

            // Flexible phone match: check matches with original formatting OR matching digits only
            const phoneMatch = contact.phones && contact.phones.some(p => {
                const cleanPhone = p.replace(/\D/g, '');
                return p.toLowerCase().includes(searchTerm) || (cleanSearchTerm && cleanPhone.includes(cleanSearchTerm));
            });

            const emailMatch = contact.emails && contact.emails.some(e => e.toLowerCase().includes(searchTerm));
            return nameMatch || phoneMatch || emailMatch;
        });

        if (filteredContacts.length === 0) {
            contactModalList.innerHTML = `
                <div style="width: 100%; text-align: center; padding: 20px; color: var(--text-secondary);">
                    <p>Nenhum contato encontrado para "${searchTerm}".</p>
                </div>
            `;
            return;
        }

        // Reuse the logic from createClientRow for generating contact cards
        const P = window.Permissions;
        const canEditContact = P ? P.can('Dados de Contato', 'can_edit') : false;
        const canDeleteContact = P ? P.can('Dados de Contato', 'can_delete') : false;

        const contactsHTML = filteredContacts.map((contact) => {
            // We need to find the original index for editing
            const originalIndex = client.contacts.indexOf(contact);

            const phonesHTML = contact.phones && contact.phones.length > 0
                ? contact.phones.map(phone => `
                        <div class="contact-item">
                            <i class="fa-solid fa-phone"></i> 
                            <span class="contact-value">${escapeHtml(phone)}</span>
                            <button class="btn-copy-tiny" onclick="copyToClipboard('${escapeHtml(phone).replace(/'/g, "\\'")}')" title="Copiar Telefone">
                                <i class="fa-regular fa-copy"></i>
                            </button>
                        </div>
                    `).join('')
                : '';

            const emailsHTML = contact.emails && contact.emails.length > 0
                ? contact.emails.map(email => `
                        <div class="contact-item">
                            <i class="fa-solid fa-envelope"></i> 
                            <span class="contact-value">${escapeHtml(email)}</span>
                            <button class="btn-copy-tiny" onclick="copyToClipboard('${escapeHtml(email).replace(/'/g, "\\'")}')" title="Copiar E-mail">
                                <i class="fa-regular fa-copy"></i>
                            </button>
                        </div>
                    `).join('')
                : '';

            const nameClickAction = canEditContact ? `onclick="editContact('${client.id}', ${originalIndex});" title="Ver/Editar Contato" class="contact-name-display clickable"` : `class="contact-name-display"`;
            const editButton = canEditContact ? `
                            <button class="btn-icon-card" onclick="editContact('${client.id}', ${originalIndex});" title="Editar Contato">
                                <i class="fa-solid fa-pen"></i>
                            </button>` : '';

            const deleteButton = canDeleteContact ? `
                            <button class="btn-icon-card btn-danger" onclick="deleteContact('${client.id}', ${originalIndex});" title="Excluir Contato">
                                <i class="fa-solid fa-trash"></i>
                            </button>` : '';

            return `
                    <div class="contact-group-display" style="max-width: 100%; flex: 1 1 300px;">
                        <div class="contact-header-display">
                            <div style="display: flex; flex-direction: column; gap: 4px;">
                                <div ${nameClickAction}>
                                    ${escapeHtml(contact.name || 'Sem nome')}
                                </div>
                            </div>
                            <div style="display: flex; gap: 5px;">
                                ${editButton}
                                ${deleteButton}
                            </div>
                        </div>
                        ${phonesHTML}
                        ${emailsHTML}
                    </div>
                `;
        }).join('');

        contactModalList.innerHTML = contactsHTML;
    }

    // Save to API
    async function saveClientToApi(client) {
        try {
            const clientData = {
                name: client.name,
                document: client.document,
                notes: client.notes,
                contacts: client.contacts,
                servers: client.servers,
                vpns: client.vpns,
                hosts: client.hosts,
                urls: client.urls,
                web_laudo: client.webLaudo,
                inactive_contract: client.inactive_contract

            };

            // Timestamp IDs (13 digits) are temporary and should be treated as new creations
            // Timestamp IDs (13 digits) are temporary and should be treated as new creations
            const idStr = String(client.id);
            const isTempId = /^\d{13}$/.test(idStr);
            const isRealId = client.id && !isTempId;

            if (isRealId) {
                await window.api.clients.update(client.id, clientData);
            } else {
                await window.api.clients.create(clientData);
            }

            // Reload clients to ensure everything is synced
            await initialLoad();

        } catch (e) {
            console.error("Erro ao salvar cliente na API:", e);
            throw e;
        }
    }

    // Deprecated: saveToLocal is now just a bridge to API for compatibility with existing calls
    async function saveToLocal(specificClientId = null) {
        if (specificClientId) {
            const client = clients.find(c => c.id === specificClientId);
            if (client) await saveClientToApi(client);
        } else {
            console.warn("saveToLocal called without specificClientId - this might be inefficient");
        }
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        console.log('handleFormSubmit called');
        try {
            const mode = form.dataset.mode;
            console.log('Mode:', mode, 'EditingId:', editingId);
            const editingContactIndex = contactList.dataset.editingContactIndex;

            // Validate Client Name
            const nameValue = clientNameInput.value.trim();
            if (!nameValue) {
                showToast('⚠️ O nome do cliente é obrigatório.', 'error');
                clientNameInput.focus();
                return;
            }

            // Check for duplicate client name
            // Don't check strictly if we are just adding a contact to an existing client (mode === 'addContact')
            // But wait, if mode is addContact, clientNameInput is disabled or readonly usually? 
            // Logic: if we are creating a new client (!editingId) or updating a client name (editingId && mode !== 'addContact')

            if (mode !== 'addContact') {
                const duplicateClient = clients.find(c => c.name.toLowerCase() === nameValue.toLowerCase() && c.id != editingId);
                if (duplicateClient) {
                    showToast('⚠️ Já existe um cliente cadastrado com este nome.', 'error');
                    clientNameInput.focus();
                    return;
                }
            }


            // --- MODE: EDITING A SINGLE CONTACT ---
            if (editingContactIndex !== undefined) {
                const contactGroups = contactList.querySelectorAll('.contact-group');
                if (contactGroups.length !== 1) {
                    showToast('⚠️ Erro ao salvar contato.', 'error');
                    return;
                }

                const group = contactGroups[0];
                const name = group.querySelector('.contact-name-input').value.trim();
                const phones = Array.from(group.querySelectorAll('.phone-input'))
                    .map(input => input.value.trim())
                    .filter(val => val !== '');
                const emails = Array.from(group.querySelectorAll('.email-input'))
                    .map(input => input.value.trim())
                    .filter(val => val !== '');

                if (!name || phones.length === 0) {
                    showToast('⚠️ Nome e pelo menos um telefone são obrigatórios.', 'error');
                    return;
                }

                const client = clients.find(c => c.id == editingId);
                if (!client) return;

                const currentIndex = parseInt(editingContactIndex);

                // Duplicate checks
                if (client.contacts) {
                    for (let i = 0; i < client.contacts.length; i++) {
                        if (i === currentIndex) continue;
                        const existing = client.contacts[i];
                        for (const phone of phones) {
                            if (existing.phones && existing.phones.includes(phone)) {
                                showToast(`❌ Telefone ${phone} já cadastrado em outro contato.`, 'error');
                                return;
                            }
                        }
                    }
                }

                client.contacts[currentIndex] = { name, phones, emails };
                saveToLocal();
                renderClients(clients);

                // Re-render contact modal if visible for this client
                if (!contactModal.classList.contains('hidden') && contactModalClientId.value === editingId) {
                    renderContactModalList(client);
                }

                closeModal();
                delete contactList.dataset.editingContactIndex;
                showToast(`✅ Contato "${name}" do cliente "${client.name}" atualizado com sucesso!`, 'success');
                return;
            }

            // Collect contacts
            const contactGroups = contactList.querySelectorAll('.contact-group');
            const contacts = Array.from(contactGroups).map(group => {
                const name = group.querySelector('.contact-name-input').value.trim();

                const phoneInputs = group.querySelectorAll('.phone-input');
                const phones = Array.from(phoneInputs)
                    .map(input => input.value.trim())
                    .filter(val => val !== '');

                const emailInputs = group.querySelectorAll('.email-input');
                const emails = Array.from(emailInputs)
                    .map(input => input.value.trim())
                    .filter(val => val !== '');

                return { name, phones, emails };
            }).filter(contact => contact.phones.length > 0 || contact.emails.length > 0);


            if (contacts.length === 0) {
                showToast('⚠️ Preencha pelo menos um telefone ou e-mail.', 'error');
                return;
            }

            // Validate Contact Name and Phone (required for new contacts)
            for (let i = 0; i < contacts.length; i++) {
                if (!contacts[i].name) {
                    showToast('⚠️ O nome do contato é obrigatório.', 'error');
                    if (contactGroups[i]) {
                        const input = contactGroups[i].querySelector('.contact-name-input');
                        if (input) {
                            input.focus();
                            input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                    }
                    return;
                }
                if (contacts[i].phones.length === 0) {
                    showToast('⚠️ Pelo menos um telefone é obrigatório.', 'error');
                    if (contactGroups[i]) {
                        const btn = contactGroups[i].querySelector('.btn-add-phone');
                        if (btn) {
                            btn.focus();
                            btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                    }
                    return;
                }
            }

            // Check for duplicate contact names within the same client
            const contactNames = contacts.map(c => c.name.toLowerCase());
            const nameDuplicates = contactNames.filter((name, index) => contactNames.indexOf(name) !== index);
            if (nameDuplicates.length > 0) {
                showToast(`⚠️ Nome de contato duplicado: ${contacts.find(c => c.name.toLowerCase() === nameDuplicates[0]).name}`, 'error');
                return;
            }

            // If editing or adding contact to existing client, check against existing contacts
            // Only do this check when adding a new contact, not when editing the entire client
            if (editingId && mode === 'addContact') {
                const currentClient = clients.find(c => c.id == editingId);
                if (currentClient && currentClient.contacts) {
                    for (const newContact of contacts) {
                        for (const existingContact of currentClient.contacts) {
                            if (existingContact.name.toLowerCase() === newContact.name.toLowerCase()) {
                                showToast(`⚠️ O nome "${newContact.name}" já está cadastrado para este cliente.`, 'error');
                                return;
                            }
                        }
                    }
                }
            }


            // Check for duplicate phones
            const allPhones = contacts.flatMap(c => c.phones);
            const phoneDuplicates = allPhones.filter((phone, index) => allPhones.indexOf(phone) !== index);
            if (phoneDuplicates.length > 0) {
                showToast(`❌ Telefone duplicado: ${phoneDuplicates[0]}`, 'error');
                return;
            }

            // Check for duplicates across other clients (only phones)
            const otherClients = clients.filter(c => c.id != editingId);

            for (const phone of allPhones) {
                for (const client of otherClients) {
                    if (client.contacts) {
                        for (const contact of client.contacts) {
                            if (contact.phones && contact.phones.includes(phone)) {
                                showToast(`❌ Telefone ${phone} já cadastrado para ${client.name}`, 'error');
                                return;
                            }
                        }
                    }
                }
            }

            // If in addContact mode, also check against existing contacts of the SAME client
            if (mode === 'addContact' && editingId) {
                const currentClient = clients.find(c => c.id == editingId);
                if (currentClient && currentClient.contacts) {
                    for (const phone of allPhones) {
                        for (const existingContact of currentClient.contacts) {
                            if (existingContact.phones && existingContact.phones.includes(phone)) {
                                showToast(`❌ Telefone ${phone} já cadastrado neste cliente`, 'error');
                                return;
                            }
                        }
                    }
                }
            }

            const clientBefore = editingId ? JSON.parse(JSON.stringify(clients.find(c => c.id == editingId) || {})) : null;

            const newClient = {
                id: editingId || Date.now().toString(),
                name: clientNameInput.value,
                contacts: contacts,
                isFavorite: isModalFavorite
            };

            // ... updates to clients array ...
            // ... updates to clients array ...
            let addedContactNames = '';
            if (editingId && mode !== 'addContact') {
                const clientToUpdate = clients.find(c => c.id == editingId);

                // Check if only name changed
                const nameChanged = clientToUpdate.name !== newClient.name;
                const contactsChanged = JSON.stringify(clientToUpdate.contacts) !== JSON.stringify(newClient.contacts);
                const favoriteChanged = !!clientToUpdate.isFavorite !== !!newClient.isFavorite;

                // Only update timestamp if contacts or favorite status changed (per user request: excluding name changes from updating "Atualizado")
                if (contactsChanged || favoriteChanged) {
                    newClient.updatedAt = new Date().toISOString();
                } else {
                    newClient.updatedAt = clientToUpdate.updatedAt;
                }

                clients = clients.map(c => c.id == editingId ? newClient : c);
                showToast(`✅ Cliente "${newClient.name}" atualizado com sucesso!`, 'success');
            } else if (editingId && mode === 'addContact') {
                const clientToUpdate = clients.find(c => c.id == editingId);
                if (clientToUpdate) {
                    if (!clientToUpdate.contacts) clientToUpdate.contacts = [];
                    clientToUpdate.contacts.push(...contacts);
                    clientToUpdate.updatedAt = new Date().toISOString();
                    const contactNames = contacts.map(c => c.name).join(', ');
                    addedContactNames = contactNames;
                    showToast(`✅ Contato "${contactNames}" adicionado ao cliente "${clientToUpdate.name}"!`, 'success');
                }
            } else {
                newClient.updatedAt = new Date().toISOString();
                clients.push(newClient);
                showToast(`✅ Cliente "${newClient.name}" adicionado com sucesso!`, 'success');
            }

            await saveToLocal(newClient.id);
            renderClients(clients);

            if (!contactModal.classList.contains('hidden') && contactModalClientId.value == editingId) {
                const clientToRefresh = clients.find(c => c.id == editingId);
                if (clientToRefresh) {
                    renderContactModalList(clientToRefresh);
                }
            }

            closeModal();
            if (typeof populateVersionClientSelect === 'function') {
                populateVersionClientSelect();
            }
            const opType = editingId ? 'EDIÇÃO' : 'CRIAÇÃO';
            const actionLabel = editingId ? (mode === 'addContact' ? 'Adição de Contato' : 'Edição de Cliente') : 'Novo Cliente';
            const clientAfter = JSON.parse(JSON.stringify(clients.find(c => c.id == newClient.id) || newClient));

            let details = `Cliente: ${newClient.name}`;
            if (addedContactNames) details += `, Contato: ${addedContactNames}`;

            // Detect edited contacts if in Edit mode (not Add Contact mode)
            if (editingId && mode !== 'addContact' && clientBefore && clientBefore.contacts) {
                const changedContacts = [];
                newClient.contacts.forEach((curr, i) => {
                    const prev = clientBefore.contacts[i] || {};

                    // Log específico para adição de contato
                    // Assuming pName, cName, pPhones, cPhones, pEmails, cEmails are defined elsewhere or derived from prev/curr
                    // This block was likely intended to compare contact details
                    // For now, we'll just ensure the outer structure is correct after removal.
                    // TODO: Restore logic for logging edited contacts if needed.
                });

                if (changedContacts.length > 0) {
                    // Avoid duplicating if already added via addedContactNames (unlikely overlap but safe)
                    const unique = [...new Set(changedContacts)].filter(name => !addedContactNames.includes(name));
                    if (unique.length > 0) {
                        details += `, Contato: ${unique.join(', ')}`;
                        // Log específico para edição de contato
                        await registerAuditLog('EDIÇÃO', 'Edição de Contato', `Cliente: ${newClient.name}, Contato: ${unique.join(', ')}`, clientBefore.contacts, clientAfter.contacts);
                    }
                }
            }

            // Audit Log for Contact Creation (addContact mode)
            if (mode === 'addContact' && addedContactNames) {
                await registerAuditLog('CRIAÇÃO', 'Criação de Contato', `Cliente: ${newClient.name}, Contato: ${addedContactNames}`, null, newClient.contacts[newClient.contacts.length - 1]);
            }

            await registerAuditLog(opType, actionLabel, details, clientBefore, clientAfter);

        } catch (error) {
            console.error('Erro crítico ao salvar formulário:', error);
            showToast(`❌ Erro ao salvar: ${error.message || 'Erro desconhecido'}`, 'error');
        }
    };

    async function deleteClient(id) {
        // Permission Check
        if (window.Permissions && !window.Permissions.can('Gestão de Clientes', 'can_delete')) {
            showToast('🚫 Acesso negado: Você não tem permissão para excluir clientes.', 'error');
            return;
        }

        const client = clients.find(c => c.id == id);
        if (!client) return;

        const confirmed = await window.showConfirm(`⚠️ EXCLUIR CLIENTE ⚠️\n\nTem certeza que deseja excluir "${client.name}"?`, 'Excluir Cliente', 'fa-triangle-exclamation');
        if (!confirmed) return;

        const clientName = client.name;
        const clientSnapshot = JSON.parse(JSON.stringify(client));

        // Show loading state or at least indicate activity
        const toastId = showToast('⏳ Excluindo cliente...', 'info'); // Assuming showToast returns ID or we just rely on replacement

        try {
            // 1. Delete from API
            await window.api.clients.delete(id);

            // 2. Register Log (Wait for it)
            if (window.registerAuditLog) {
                await registerAuditLog('EXCLUSÃO', 'Exclusão de Cliente', `Cliente: ${clientName}`, clientSnapshot, null);
            }

            // 3. Update Local State and UI
            clients = clients.filter(c => c.id != id);
            window.clients = clients; // Sync global

            await saveToLocal(); // Save allowed clients locally

            // Update UI
            applyClientFilter();

            // Update Version Control UI if exists
            if (window.versionControls) {
                window.versionControls = window.versionControls.filter(vc => vc.client_id != id);
                if (typeof window.renderVersionControls === 'function') {
                    window.renderVersionControls();
                }
            }

            // Dropdown update
            if (typeof populateVersionClientSelect === 'function') {
                populateVersionClientSelect();
            }

            showToast(`🗑️ Cliente "${clientName}" removido com sucesso!`, 'success');

        } catch (err) {
            console.error('Erro ao excluir cliente:', err);
            const msg = err.message || 'Erro desconhecido ao excluir do banco de dados.';
            showToast(`❌ Erro ao excluir: ${msg}`, 'error');
            // Do NOT remove from UI if DB delete failed
        }
    }
    window.deleteClient = deleteClient;

    function editClient(id) {
        // Permission Check
        if (window.Permissions && !window.Permissions.can('Gestão de Clientes', 'can_edit')) {
            showToast('🚫 Acesso negado: Você não tem permissão para editar clientes.', 'error');
            return;
        }

        const client = clients.find(c => c.id == id);
        if (!client) return;

        editingId = id;
        isModalFavorite = client.isFavorite || false;
        updateModalFavoriteUI();
        clientNameInput.value = client.name;
        clientNameInput.disabled = false;
        delete form.dataset.mode;
        delete contactList.dataset.editingContactIndex;

        // Populate contacts
        contactList.innerHTML = '';
        if (client.contacts && client.contacts.length > 0) {
            client.contacts.forEach(contact => {
                addContactGroup(contact.name, contact.phones, contact.emails, contact.addresses);
            });
        } else {
            addContactGroup();
        }

        modalTitle.textContent = 'Editar Cliente';
        openModal();
    }

    function handleSearch(e) {
        const term = e.target.value.toLowerCase();
        const filtered = clients.filter(c => {
            const nameMatch = c.name.toLowerCase().includes(term);

            const contactMatch = c.contacts && c.contacts.some(contact => {
                const contactNameMatch = contact.name && contact.name.toLowerCase().includes(term);
                const phoneMatch = contact.phones && contact.phones.some(phone => phone.toLowerCase().includes(term));
                const emailMatch = contact.emails && contact.emails.some(email => email.toLowerCase().includes(term));

                return contactNameMatch || phoneMatch || emailMatch;
            });

            return nameMatch || contactMatch;
        });
        renderClients(filtered);
    }

    // --- UI Helpers ---

    function addContactGroup(name = '', phones = [], emails = []) {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'contact-group';
        groupDiv.innerHTML = `
            <div class="contact-group-header">
                <h4 class="contact-group-title" style="color: var(--text-primary);">
                    <i class="fa-solid fa-user" style="color: var(--accent);"></i> Informações do Contato
                </h4>
                <button type="button" class="btn-remove-contact" onclick="removeContact(this)" title="Remover Contato" tabindex="-1">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
            
            <div class="contact-details">
                <div class="contact-section">
                    <label class="section-label section-label-left">
                        <span><i class="fa-solid fa-user" style="color: var(--accent);"></i> Nome do Contato <span class="required">*</span></span>
                    </label>
                    <input type="text" class="contact-name-input" placeholder="Ex: João Silva, Comercial" value="${escapeHtml(name)}">
                </div>

                <div class="contact-section">
                    <label class="section-label section-label-left">
                        <span><i class="fa-solid fa-phone" style="color: var(--accent);"></i> Telefones <span class="required">*</span></span>
                        <button type="button" class="btn-add-phone" onclick="addPhone(this)" title="Adicionar Telefone" tabindex="-1">
                            <i class="fa-solid fa-plus"></i>
                        </button>
                    </label>
                    <div class="phone-list"></div>
                </div>

                <div class="contact-section">
                    <label class="section-label section-label-left">
                        <span><i class="fa-solid fa-envelope" style="color: var(--accent);"></i> E-mails</span>
                        <button type="button" class="btn-add-email" onclick="addEmail(this)" title="Adicionar E-mail" tabindex="-1">
                            <i class="fa-solid fa-plus"></i>
                        </button>
                    </label>
                    <div class="email-list"></div>
                </div>

            </div>
        `;
        contactList.appendChild(groupDiv);

        // Add phones
        const phoneListDiv = groupDiv.querySelector('.phone-list');
        if (phones.length > 0) {
            phones.forEach(phone => addPhoneField(phoneListDiv, phone));
        } else {
            addPhoneField(phoneListDiv, '');
        }

        // Add emails
        const emailListDiv = groupDiv.querySelector('.email-list');
        if (emails.length > 0) {
            emails.forEach(email => addEmailField(emailListDiv, email));
        } else {
            addEmailField(emailListDiv, '');
        }


    }

    function addPhoneField(container, value = '') {
        const fieldDiv = document.createElement('div');
        fieldDiv.className = 'contact-field';
        fieldDiv.innerHTML = `
            <input type="text" class="phone-input" placeholder="(11) 99999-9999" maxlength="15" value="${escapeHtml(value)}">
            <button type="button" class="btn-remove-field-small" onclick="removeContactField(this)" title="Remover" tabindex="-1">
                <i class="fa-solid fa-xmark"></i>
            </button>
        `;
        container.appendChild(fieldDiv);

        // Add phone mask
        const phoneInput = fieldDiv.querySelector('.phone-input');
        phoneInput.addEventListener('input', applyPhoneMask);
    }

    function addEmailField(container, value = '') {
        const fieldDiv = document.createElement('div');
        fieldDiv.className = 'contact-field';
        fieldDiv.innerHTML = `
            <input type="email" class="email-input" placeholder="contato@empresa.com" value="${escapeHtml(value)}">
            <button type="button" class="btn-remove-field-small" onclick="removeContactField(this)" title="Remover" tabindex="-1">
                <i class="fa-solid fa-xmark"></i>
            </button>
        `;
        container.appendChild(fieldDiv);
    }



    function applyPhoneMask(e) {
        let value = e.target.value.replace(/\D/g, ''); // Remove non-digits

        // Limit to 13 digits
        if (value.length > 13) {
            value = value.substring(0, 13);
        }

        // Apply mask
        if (value.length <= 10) {
            value = value.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
        } else {
            value = value.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, '($1) $2-$3');
        }

        e.target.value = value.trim();
    }

    function openAddModal() {
        editingId = null;
        isModalFavorite = false;
        updateModalFavoriteUI();
        form.reset();
        clientNameInput.disabled = false;
        delete form.dataset.mode;
        delete contactList.dataset.editingContactIndex;

        // Reset contact list
        contactList.innerHTML = '';
        addContactGroup();

        modalTitle.textContent = 'Novo Cliente';
        openModal();
    }

    function openModal() {
        modal.classList.remove('hidden');
    }

    function updateModalFavoriteUI() {
        if (!modalToggleFavorite) return;
        const icon = modalToggleFavorite.querySelector('i');
        if (isModalFavorite) {
            modalToggleFavorite.classList.add('favorite-active');
            icon.className = 'fa-solid fa-star';
            modalToggleFavorite.title = 'Remover Favorito';
        } else {
            modalToggleFavorite.classList.remove('favorite-active');
            icon.className = 'fa-regular fa-star';
            modalToggleFavorite.title = 'Favoritar';
        }
    }

    function closeModal() {
        modal.classList.add('hidden');
    }

    function showToast(msg, type = 'success') {
        toast.textContent = msg;
        toast.className = 'toast'; // Reset classes

        if (type === 'error') {
            toast.classList.add('toast-error');
        } else if (type === 'warning') {
            toast.classList.add('toast-warning');
        } else {
            toast.classList.add('toast-success');
        }

        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 4000);
    }

    // --- Privacy Toggle Logic ---
    window.toggleIndividualPrivacy = async (checkbox) => {
        const isChecked = checkbox.checked;

        // Reset check first to handle AFTER confirmation
        checkbox.checked = !isChecked;

        if (isChecked) {
            // User wants to ENABLE privacy
            const confirmed = await window.showConfirm(
                'Ao ativar esta opção, SOMENTE VOCÊ terá acesso a essas credenciais. Outros usuários, mesmo administradores, não poderão visualizá-las. Deseja continuar?',
                'Tornar Privado',
                'fa-lock'
            );
            if (confirmed) {
                checkbox.checked = true;
            }
        } else {
            // User wants to DISABLE privacy
            const confirmed = await window.showConfirm(
                'Ao desativar esta opção, TODOS os usuários com permissão poderão visualizar essas credenciais. Deseja continuar?',
                'Tornar Público',
                'fa-lock-open'
            );
            if (confirmed) {
                checkbox.checked = false;
            }
        }
    };

    function escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Expose functions to global scope for HTML onclick attributes
    window.showToast = showToast;
    window.escapeHtml = escapeHtml;
    window.editClient = editClient;
    window.deleteClient = deleteClient;
    window.registerAuditLog = registerAuditLog;

    window.addNewContact = (clientId) => {
        const client = clients.find(c => c.id == clientId);
        if (!client) return;

        editingId = clientId;
        clientNameInput.value = client.name;
        clientNameInput.disabled = true; // Lock client name to focus on contact addition

        // Clear list and add only one empty group for new contact
        contactList.innerHTML = '';
        addContactGroup();

        form.dataset.mode = 'addContact';

        modalTitle.textContent = 'Adicionar Novo Contato';
        openModal();
    };

    window.toggleFavorite = async (id) => {
        const client = clients.find(c => c.id == id);
        if (!client) return;

        const user = JSON.parse(localStorage.getItem('sofis_user') || '{}');
        if (!user.username) {
            showToast('⚠️ Erro ao identificar usuário.', 'warning');
            return;
        }

        const isFav = window.userFavorites.has(id);

        try {
            if (isFav) {
                // Remove
                await window.api.favorites.remove(user.username, id);
                window.userFavorites.delete(id);
                client.isFavorite = false;
                // Removed trivial audit log for favorites
            } else {
                // Add
                await window.api.favorites.add(user.username, id);
                window.userFavorites.add(id);
                client.isFavorite = true;
                // Removed trivial audit log for favorites
            }
            applyClientFilter();
        } catch (e) {
            console.error("Error toggling favorite:", e);
            showToast('❌ Erro ao atualizar favorito.', 'error');
        }
    };

    window.editContact = (clientId, contactIndex) => {
        // Permission Check
        if (window.Permissions && !window.Permissions.can('Dados de Contato', 'can_edit')) {
            showToast('🚫 Acesso negado: Você não tem permissão para editar contatos.', 'error');
            return;
        }

        const client = clients.find(c => c.id == clientId);
        if (!client || !client.contacts || !client.contacts[contactIndex]) return;

        editingId = clientId;
        clientNameInput.value = client.name;
        clientNameInput.readOnly = true; // Lock client name when editing contact
        clientNameInput.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'; // Visual feedback
        clientNameInput.style.cursor = 'not-allowed';

        // Populate only the contact being edited
        contactList.innerHTML = '';
        const contact = client.contacts[contactIndex];
        addContactGroup(contact.name, contact.phones, contact.emails, contact.addresses);

        // Store the contact index for later
        contactList.dataset.editingContactIndex = contactIndex;
        form.dataset.mode = 'editContact'; // Explicitly set mode to avoid 'addContact' behavior

        modalTitle.textContent = 'Editar Contato - ' + client.name;
        openModal();
    };

    // Helper function to reset client name field to editable state
    window.resetClientNameField = () => {
        if (clientNameInput) {
            clientNameInput.readOnly = false;
            clientNameInput.style.backgroundColor = '';
            clientNameInput.style.cursor = '';
        }
    };


























    window.removeContact = async (button) => {
        const contactGroup = button.closest('.contact-group');
        const container = contactGroup.parentElement;

        // Check if we are in "Edit Single Contact" mode
        const editingContactIndex = contactList.dataset.editingContactIndex;

        if (editingContactIndex !== undefined && editingId) {
            const client = clients.find(c => c.id === editingId);

            // Validation: Cannot delete the last contact
            if (client && client.contacts && client.contacts.length <= 1) {
                showToast('⚠️ O cliente deve possuir pelo menos um contato cadastrado.', 'error');
                return;
            }

            // We are editing a specific existing contact. The trash button should DELETE it.
            const confirmed = await window.showConfirm('Tem certeza que deseja excluir este contato?', 'Excluir Contato', 'fa-trash');
            if (confirmed) {
                if (client && client.contacts) {
                    const index = parseInt(editingContactIndex);
                    // Ensure the index is valid
                    if (index >= 0 && index < client.contacts.length) {
                        client.contacts.splice(index, 1); // Remove contact
                        saveToLocal();
                        renderClients(clients);
                        closeModal();
                        delete contactList.dataset.editingContactIndex;
                        showToast('✅ Contato excluído com sucesso!', 'success');
                        await registerAuditLog('EXCLUSÃO', 'Exclusão de Contato', `Cliente: ${client.name}, Contato: ${contact.name}`, contact, null);
                        return;
                    }
                }
            }
            return; // Cancelled
        }

        // Default behavior: just remove the DOM element if there's more than one
        if (container.children.length > 1) {
            contactGroup.remove();
        } else {
            showToast('⚠️ Deve haver pelo menos um contato no formulário.', 'error');
        }
    };

    window.addPhone = (button) => {
        const contactSection = button.closest('.contact-section');
        const phoneList = contactSection.querySelector('.phone-list');
        addPhoneField(phoneList, '');
    };

    window.addEmail = (button) => {
        const contactSection = button.closest('.contact-section');
        const emailList = contactSection.querySelector('.email-list');
        addEmailField(emailList, '');
    };



    window.removeContactField = (button) => {
        const field = button.closest('.contact-field');
        const container = field.parentElement;

        if (container.children.length > 1) {
            field.remove();
        } else {
            // Clear the input instead of removing the last field
            const input = field.querySelector('input');
            if (input) input.value = '';
        }
    };


    window.togglePasswordVisibility = (inputId, btn) => {
        const input = document.getElementById(inputId);
        const icon = btn.querySelector('i');
        if (input.type === 'password') {
            input.type = 'text';
            icon.className = 'fa-solid fa-eye-slash';
        } else {
            input.type = 'password';
            icon.className = 'fa-solid fa-eye';
        }
    };

    window.copyToClipboard = async (textOrElement) => {
        try {
            let text = '';
            if (typeof textOrElement === 'string') {
                text = textOrElement;
            } else if (textOrElement instanceof HTMLElement) {
                text = textOrElement.dataset.raw || textOrElement.textContent;
            }

            const valueToCopy = window.Security.isEncrypted(text)
                ? await window.Security.decrypt(text)
                : text;

            await navigator.clipboard.writeText(valueToCopy);
            showToast('📋 Copiado!', 'success');
        } catch (err) {
            console.error('Falha ao copiar:', err);
            showToast('❌ Erro ao copiar.', 'error');
        }
    };

    window.togglePassword = async (btn) => {
        // Handle both older credential-row style and new WebLaudo style
        const container = btn.closest('.server-info-value') || btn.closest('.credential-field-row') || btn.closest('.credential-row') || btn.closest('.server-info') || btn.closest('.form-group');
        if (!container) return;

        const valueSpan = container.querySelector('.credential-value') ||
            container.querySelector('.field-value') ||
            container.querySelector('.pass-hidden') ||
            document.getElementById('webLaudoPassText');

        if (!valueSpan) return;

        const icon = btn.querySelector('i');
        const isMasked = valueSpan.textContent === '••••••';

        if (isMasked) {
            const rawValue = valueSpan.dataset.raw;
            try {
                const displayValue = window.Security.isEncrypted(rawValue)
                    ? await window.Security.decrypt(rawValue)
                    : rawValue;

                valueSpan.textContent = displayValue;
                icon.className = 'fa-solid fa-eye-slash';
                btn.title = 'Ocultar Senha';
            } catch (err) {
                console.error('Erro ao descriptografar:', err);
                showToast("Erro ao exibir senha", "error");
            }
        } else {
            valueSpan.textContent = '••••••';
            icon.className = 'fa-solid fa-eye';
            btn.title = 'Visualizar Senha';
        }
    };

    // --- Server Data Functions ---

    window.openServerData = (clientId) => {
        console.log("🟢 CLICK: openServerData for", clientId);
        try {
            // Permission Check - View
            if (window.Permissions && !window.Permissions.can('Dados de Acesso (SQL)', 'can_view')) {
                showToast('🚫 Acesso negado: Você não tem permissão para visualizar dados de acesso SQL.', 'error');
                return;
            }

            const client = clients.find(c => c.id == clientId);
            if (!client) {
                console.error("Client not found for ID:", clientId);
                return;
            }

            // Permissions Check
            const P = window.Permissions;
            // Check if Permissions object exists and has 'can' method
            const canCreate = (P && P.can) ? P.can('Dados de Acesso (SQL)', 'can_create') : false;

            // DOM Elements Check
            const sClientIdInput = document.getElementById('serverClientId');
            const sAddBtn = document.getElementById('addServerEntryBtn');
            const sModal = document.getElementById('serverModal');
            const sModalTitle = document.getElementById('serverModalClientName');

            if (sClientIdInput) sClientIdInput.value = clientId;

            if (sAddBtn) {
                sAddBtn.style.display = canCreate ? 'flex' : 'none';
            }

            // Ensure servers array exists
            if (!client.servers) client.servers = [];

            if (sModalTitle) sModalTitle.textContent = client.name;

            // Reset UI State
            if (typeof currentServerFilter !== 'undefined') currentServerFilter = 'all';

            // Helpers
            if (typeof clearServerForm === 'function') clearServerForm();
            if (typeof renderServersList === 'function') renderServersList(client);

            if (sModal) sModal.classList.remove('hidden');

        } catch (e) {
            console.error("❌ CRITICAL ERROR in openServerData:", e);
            alert("Erro interno ao abrir modal de Servidor: " + e.message);
        }
    };

    function closeServerModal() {
        serverModal.classList.add('hidden');
    }

    function openServerEntry() {
        clearServerForm();
        serverEntryModalTitle.textContent = 'Novo Acesso SQL';
        const editingServerIndex = document.getElementById('editingServerIndex');
        if (editingServerIndex) editingServerIndex.value = '';
        serverEntryModal.classList.remove('hidden');
    }

    function closeServerEntryModal() {
        serverEntryModal.classList.add('hidden');
        clearServerForm();
    }

    function clearServerForm() {
        const environmentSelect = document.getElementById('environmentSelect');
        if (environmentSelect) environmentSelect.value = '';
        if (sqlServerInput) sqlServerInput.value = '';
        if (serverNotesInput) serverNotesInput.value = '';

        const editingServerIndex = document.getElementById('editingServerIndex');
        if (editingServerIndex) editingServerIndex.value = '';

        // Clear credentials
        credentialList.innerHTML = '';
        addCredentialField(); // Add one empty credential field
    }

    function renderServersList(client) {
        const serversList = document.getElementById('serversList');
        if (!serversList) return;

        const P = window.Permissions;
        const canEditSQL = P ? P.can('Dados de Acesso (SQL)', 'can_edit') : false;
        const canDeleteSQL = P ? P.can('Dados de Acesso (SQL)', 'can_delete') : false;
        const currentUser = JSON.parse(localStorage.getItem('sofis_user') || '{}').username || 'anônimo';

        const filterValue = currentServerFilter;
        let filteredServers = client.servers || [];

        if (filterValue !== 'all') {
            filteredServers = filteredServers.filter(s => s.environment === filterValue);
        }

        if (filteredServers.length === 0) {
            serversList.innerHTML = `
                <div class="servers-grid-empty">
                    <i class="fa-solid fa-database"></i>
                    <p>${filterValue === 'all' ? 'Nenhum dado de acesso cadastrado ainda.' : 'Nenhum dado de acesso encontrado para este filtro.'}</p>
                </div>
            `;
            return;
        }

        serversList.innerHTML = filteredServers.map((server, index) => {
            // We need the ACTUAL index for editing/deleting, not the filtered one
            const originalIndex = client.servers.indexOf(server);
            const environmentClass = server.environment === 'homologacao' ? 'homologacao' : 'producao';
            const environmentLabel = server.environment === 'homologacao' ? 'Homologação' : 'Produção';

            const filteredCredentials = (server.credentials || []).filter(cred => {
                if (cred.is_private && cred.owner !== currentUser) return false;
                return true;
            });

            const credentialsHTML = filteredCredentials.length > 0
                ? `
                    <div class="server-credentials">
                        <div class="server-credentials-title">
                            <i class="fa-solid fa-key" style="color: var(--accent);"></i> Credenciais
                        </div>
                        ${filteredCredentials.map(cred => {
                    const privacyIcon = cred.is_private ? `<i class="fa-solid fa-lock" style="color: #ff5252; margin-left: 6px;" title="Individual (Privado)"></i>` : '';
                    return `
                            <div class="credential-item">
                                <div class="credential-row">
                                    <span class="credential-label">Usuário: ${privacyIcon}</span>
                                    <span class="credential-value">${escapeHtml(cred.user)}</span>
                                    <button class="btn-copy-small" onclick="copyToClipboard(this.dataset.value)" data-value="${escapeHtml(cred.user)}" title="Copiar Usuário">
                                        <i class="fa-regular fa-copy"></i>
                                    </button>
                                </div>
                                <div class="credential-row">
                                    <span class="credential-label">Senha:</span>
                                    <span class="credential-value" data-raw="${escapeHtml(cred.password)}">••••••</span>
                                    <button class="btn-copy-small" onclick="togglePassword(this)" title="Visualizar Senha" style="margin-right: 4px;">
                                        <i class="fa-solid fa-eye"></i>
                                    </button>
                                    <button class="btn-copy-small" onclick="copyToClipboard(this.dataset.value)" data-value="${escapeHtml(cred.password)}" title="Copiar Senha">
                                        <i class="fa-regular fa-copy"></i>
                                    </button>
                                </div>
                            </div>
                        `}).join('')}
                    </div>
                `
                : (server.credentials && server.credentials.length > 0 ? '<div class="server-credentials"><div style="font-size:0.85rem; opacity:0.6; padding:10px;"><em>Registrado com credenciais individuais.</em></div></div>' : '');

            const notesHTML = server.notes
                ? `<div class="server-notes">
                    <div class="server-notes-title"><i class="fa-solid fa-comment-dots" style="color: var(--accent); margin-right: 6px;"></i> Observações</div>
                    <div class="server-notes-content">${escapeHtml(server.notes)}</div>
                   </div>`
                : '';

            const editButton = canEditSQL ? `
                            <button class="btn-icon-card" onclick="editServerRecord('${client.id}', ${originalIndex})" title="Editar">
                                <i class="fa-solid fa-pen"></i>
                            </button>` : '';

            const deleteButton = canDeleteSQL ? `
                            <button class="btn-icon-card btn-danger" onclick="deleteServerRecord('${client.id}', ${originalIndex})" title="Excluir">
                                <i class="fa-solid fa-trash"></i>
                            </button>` : '';

            return `
                <div class="server-card">
                    <div class="server-card-header">
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <span class="server-environment ${environmentClass}">${environmentLabel}</span>
                        </div>
                        <div class="server-card-actions">
                            ${editButton}
                            ${deleteButton}
                        </div>
                    </div>
                    <div class="server-info">
                        <div class="server-credentials-title">
                            <i class="fa-solid fa-database" style="color: var(--accent);"></i> Nome do servidor
                        </div>
                        <div class="server-info-value" style="display: flex; align-items: center; gap: 8px;">
                            <span data-raw="${server.sqlServer.replace(/"/g, '&quot;')}">${escapeHtml(server.sqlServer)}</span>
                            <button class="btn-copy-small" onclick="const raw = this.previousElementSibling.dataset.raw; copyToClipboard(raw); event.stopPropagation();" title="Copiar Nome do Servidor">
                                <i class="fa-regular fa-copy"></i>
                            </button>
                        </div>
                    </div>
                    ${credentialsHTML}
                    ${notesHTML}
                </div>
            `;
        }).join('');
    }

    window.removeCredentialField = function (btn) {
        const credentialList = document.getElementById('credentialList');
        const groups = credentialList.querySelectorAll('.credential-field-group');

        // Validation: Check for hidden credentials
        const clientId = document.getElementById('serverClientId').value;
        const editingIndex = document.getElementById('editingServerIndex').value;
        let hasHidden = false;

        if (clientId && editingIndex !== '') {
            const client = clients.find(c => c.id == clientId);
            const currentUser = JSON.parse(localStorage.getItem('sofis_user') || '{}').username || 'anônimo';
            if (client && client.servers && client.servers[editingIndex]) {
                const server = client.servers[editingIndex];
                if (server.credentials) {
                    hasHidden = server.credentials.some(c => c.is_private && c.owner !== currentUser);
                }
            }
        }

        if (groups.length <= 1 && !hasHidden) {
            showToast('⚠️ É necessário ter pelo menos um usuário e senha.', 'error');
            return;
        }
        btn.closest('.credential-field-group').remove();
    };

    function addCredentialField(user = '', password = '', isPrivate = false) {
        const div = document.createElement('div');
        div.className = 'credential-field-group';
        div.innerHTML = `
            <div class="credential-fields-container">
                <div class="credential-field-item">
                    <div class="credential-label-row">
                        <label class="credential-label-text"><i class="fa-solid fa-user"></i>Usuário <span class="required">*</span></label>
                    </div>
                    <input type="text" class="server-user-input" placeholder="Digite o usuário" value="${escapeHtml(user)}" required>
                </div>
                
                <div class="credential-field-item">
                    <div class="credential-label-row">
                        <label class="credential-label-text"><i class="fa-solid fa-key"></i>Senha <span class="required">*</span></label>
                        <div class="checkbox-wrapper-individual">
                            <label>
                                <input type="checkbox" class="server-private-check" onchange="window.toggleIndividualPrivacy(this)" ${isPrivate ? 'checked' : ''}>
                                <i class="fa-solid fa-lock"></i> INDIVIDUAL
                            </label>
                        </div>
                    </div>
                    <div style="position: relative; width: 100%;">
                        <input type="password" class="server-pass-input" placeholder="Digite a senha" value="${escapeHtml(password)}" required style="padding-right: 40px;">
                        <button type="button" class="eye-btn" onclick="const i = this.previousElementSibling; i.type = i.type === 'password' ? 'text' : 'password'; this.querySelector('i').className = i.type === 'password' ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash';" tabindex="-1" title="Visualizar Senha">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                    </div>
                </div>

                <button type="button" class="btn-remove-credential" onclick="removeCredentialField(this)" title="Remover Credencial" tabindex="-1">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;
        credentialList.appendChild(div);
    }

    async function handleServerSubmit(e) {
        e.preventDefault();
        const id = serverClientIdInput.value;
        const client = clients.find(c => c.id == id);

        if (!client) return;

        // Initialize servers array if needed
        if (!client.servers) {
            client.servers = [];
        }

        const environmentSelect = document.getElementById('environmentSelect');
        const editingServerIndex = document.getElementById('editingServerIndex');

        // Collect Credentials
        const credDivs = credentialList.querySelectorAll('.credential-field-group');
        const credentials = [];
        const currentUser = JSON.parse(localStorage.getItem('sofis_user') || '{}').username || 'anônimo';

        for (const div of credDivs) {
            const u = div.querySelector('.server-user-input').value.trim();
            const p = div.querySelector('.server-pass-input').value.trim();
            const isPrivate = div.querySelector('.server-private-check')?.checked || false;

            if (u || p) {
                credentials.push({
                    user: u,
                    password: await window.Security.encrypt(p),
                    is_private: isPrivate,
                    owner: currentUser
                });
            }
        }

        const editingIndex = document.getElementById('editingServerIndex').value;

        // Preserve hidden private credentials (other users) that were naturally filtered out from the form
        if (editingIndex !== '') {
            const originalServer = client.servers[parseInt(editingIndex)];
            if (originalServer && originalServer.credentials) {
                const hiddenCredentials = originalServer.credentials.filter(c => c.is_private && c.owner !== currentUser);
                credentials.push(...hiddenCredentials);
            }
        }

        // Validation
        if (!environmentSelect.value) {
            showToast('⚠️ O ambiente é obrigatório.', 'error');
            environmentSelect.focus();
            return;
        }
        if (!sqlServerInput.value.trim()) {
            showToast('⚠️ O nome do servidor é obrigatório.', 'error');
            sqlServerInput.focus();
            return;
        }

        const serverBefore = (editingIndex !== '') ? JSON.parse(JSON.stringify(client.servers[parseInt(editingIndex)])) : null;

        const serverRecord = {
            environment: environmentSelect.value,
            sqlServer: sqlServerInput.value.trim(),
            credentials: credentials,
            notes: serverNotesInput ? serverNotesInput.value.trim() : ''
        };

        if (editingIndex !== '') {
            const index = parseInt(editingIndex);
            client.servers[index] = serverRecord;
            showToast(`✅ Acesso SQL do cliente "${client.name}" atualizado com sucesso!`, 'success');
        } else {
            client.servers.push(serverRecord);
            showToast(`✅ Acesso SQL adicionado ao cliente "${client.name}"!`, 'success');
        }

        // Instant UI update
        client.updatedAt = new Date().toISOString();

        await saveToLocal(client.id);
        renderClients(clients);
        renderServersList(client);
        closeServerEntryModal();
        const opType = (editingIndex !== '') ? 'EDIÇÃO' : 'CRIAÇÃO';
        const actionLabel = (editingIndex !== '') ? 'Edição de Acesso SQL' : 'Adição de Acesso SQL';
        await registerAuditLog(opType, actionLabel, `Cliente: ${client.name}, Ambiente: ${serverRecord.environment}`, serverBefore, serverRecord);
    }

    window.editServerRecord = async (clientId, index) => {
        // Permission Check
        if (window.Permissions && !window.Permissions.can('Dados de Acesso (SQL)', 'can_edit')) {
            showToast('🚫 Acesso negado: Você não tem permissão para editar dados de acesso SQL.', 'error');
            return;
        }

        const client = clients.find(c => c.id == clientId);
        if (!client || !client.servers || !client.servers[index]) return;

        const server = client.servers[index];
        const environmentSelect = document.getElementById('environmentSelect');
        const editingServerIndex = document.getElementById('editingServerIndex');
        const currentUser = JSON.parse(localStorage.getItem('sofis_user') || '{}').username || 'anônimo';

        // Populate form with server data
        if (environmentSelect) environmentSelect.value = server.environment;
        if (sqlServerInput) sqlServerInput.value = server.sqlServer;
        if (serverNotesInput) serverNotesInput.value = server.notes || '';
        if (editingServerIndex) editingServerIndex.value = index;

        // Populate credentials
        credentialList.innerHTML = '';
        if (server.credentials && server.credentials.length > 0) {
            for (const cred of server.credentials) {
                // Skip if private and not owner
                if (cred.is_private && cred.owner !== currentUser) continue;

                const decPass = await window.Security.decrypt(cred.password);
                addCredentialField(cred.user, decPass, cred.is_private);
            }
        } else {
            addCredentialField();
        }

        serverEntryModalTitle.textContent = 'Editar Acesso SQL';
        serverEntryModal.classList.remove('hidden');
    };

    window.deleteServerRecord = async (clientId, index) => {
        // Permission Check
        if (window.Permissions && !window.Permissions.can('Dados de Acesso (SQL)', 'can_delete')) {
            showToast('🚫 Acesso negado: Você não tem permissão para excluir dados de acesso SQL.', 'error');
            return;
        }

        const client = clients.find(c => c.id == clientId);
        if (!client || !client.servers) return;
        const server = client.servers[index];

        // Validation: Check if other users own any credentials
        const currentUser = JSON.parse(localStorage.getItem('sofis_user') || '{}').username || 'anônimo';
        const blockingCreds = (server.credentials || []).filter(c => c.owner && c.owner !== currentUser);

        if (blockingCreds.length > 0) {
            const blockingOwners = [...new Set(blockingCreds.map(c => c.owner))];
            await window.handleBlockedDeletion(blockingOwners);
            return;
        }

        const confirmed = await window.showConfirm('Tem certeza que deseja excluir este servidor?', 'Excluir Servidor', 'fa-server');
        if (!confirmed) return;

        const deletedServer = JSON.parse(JSON.stringify(server));
        client.servers.splice(index, 1);
        await saveToLocal(client.id);
        renderClients(clients);
        renderServersList(client);
        showToast(`🗑️ Acesso SQL do cliente "${client.name}" removido com sucesso!`, 'success');
        await registerAuditLog('EXCLUSÃO', 'Exclusão de Acesso SQL', `Cliente: ${client.name}, Ambiente: ${deletedServer.environment}`, deletedServer, null);
    };

    // --- VPN Data Functions ---
    function closeVpnModal() {
        vpnModal.classList.add('hidden');
    }

    function openVpnEntry() {
        clearVpnForm();
        vpnEntryModalTitle.textContent = 'Novo Acesso VPN';
        document.getElementById('editingVpnIndex').value = '';
        vpnEntryModal.classList.remove('hidden');
    }

    function closeVpnEntryModal() {
        vpnEntryModal.classList.add('hidden');
        clearVpnForm();
    }

    function clearVpnForm() {
        const list = document.getElementById('vpnCredentialList');
        if (list) list.innerHTML = '';
        if (vpnNotesInput) vpnNotesInput.value = '';
        const editIdx = document.getElementById('editingVpnIndex');
        if (editIdx) editIdx.value = '';
    }

    function addVpnCredentialField(user = '', password = '', isPrivate = false) {
        const list = document.getElementById('vpnCredentialList');
        const div = document.createElement('div');
        div.className = 'credential-field-group';
        div.innerHTML = `
            <div class="credential-fields-container">
                <div class="credential-field-item">
                    <label class="credential-label-text"><i class="fa-solid fa-user" style="color: var(--accent); margin-right: 5px;"></i> Usuário<span class="required">*</span></label>
                    <input type="text" class="server-user-input" placeholder="Digite o usuário" value="${escapeHtml(user)}" required>
                </div>
                <div class="credential-field-item">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                        <label class="credential-label-text"><i class="fa-solid fa-key" style="color: var(--accent); margin-right: 5px;"></i> Senha<span class="required">*</span></label>
                        <div class="checkbox-wrapper-individual" style="margin-left: 10px;">
                            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.75rem; font-weight: 700; color: #ff5252;">
                                <input type="checkbox" class="server-private-check" onchange="window.toggleIndividualPrivacy(this)" ${isPrivate ? 'checked' : ''}>
                                <i class="fa-solid fa-lock" style="font-size: 0.7rem;"></i> INDIVIDUAL
                            </label>
                        </div>
                    </div>
                    <div style="position: relative; width: 100%;">
                        <input type="password" class="server-pass-input" placeholder="Digite a senha" value="${escapeHtml(password)}" required style="padding-right: 35px; width: 100%;">
                        <button type="button" onclick="const i = this.previousElementSibling; i.type = i.type === 'password' ? 'text' : 'password'; this.querySelector('i').className = i.type === 'password' ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash';" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-secondary); cursor: pointer;" tabindex="-1" title="Visualizar Senha">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                    </div>
                </div>
                <button type="button" class="btn-remove-credential" onclick="removeVpnCredentialField(this)" title="Remover Credencial" tabindex="-1">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;
        list.appendChild(div);
    }

    window.removeVpnCredentialField = function (btn) {
        const list = document.getElementById('vpnCredentialList');
        const groups = list.querySelectorAll('.credential-field-group');

        // Validation for hidden credentials
        const clientId = document.getElementById('vpnClientId').value;
        const editingIndex = document.getElementById('editingVpnIndex').value;
        let hasHidden = false;

        if (clientId && editingIndex !== '') {
            const client = clients.find(c => c.id == clientId);
            const currentUser = JSON.parse(localStorage.getItem('sofis_user') || '{}').username || 'anônimo';
            if (client && client.vpns && client.vpns[editingIndex]) {
                const vpn = client.vpns[editingIndex];
                if (vpn.credentials) {
                    hasHidden = vpn.credentials.some(c => c.is_private && c.owner !== currentUser);
                }
            }
        }

        if (groups.length <= 1 && !hasHidden) {
            showToast('⚠️ É necessário ter pelo menos um usuário e senha.', 'error');
            return;
        }
        btn.closest('.credential-field-group').remove();
    };

    function renderVpnList(client) {
        const listContainer = document.getElementById('vpnList');
        if (!listContainer) return;

        // Permissions
        const P = window.Permissions;
        const canEdit = P ? P.can('Dados de Acesso (VPN)', 'can_edit') : false;
        const canDelete = P ? P.can('Dados de Acesso (VPN)', 'can_delete') : false;

        if (!client.vpns || client.vpns.length === 0) {
            listContainer.innerHTML = `
                <div class="servers-grid-empty">
                    <img src="assets/images/vpn-icon.png" class="vpn-icon-img" style="width: 48px; height: 48px; opacity: 0.5; margin-bottom: 15px;" alt="VPN">
                    <p>Nenhuma VPN cadastrada ainda.</p>
                </div>
            `;
            return;
        }

        listContainer.innerHTML = client.vpns.map((vpn, index) => {
            const currentUser = JSON.parse(localStorage.getItem('sofis_user') || '{}').username || 'anônimo';

            // Normalize credentials (legacy vs new)
            const allCreds = vpn.credentials || (vpn.user ? [{ user: vpn.user, password: vpn.password, is_private: vpn.is_private, owner: vpn.owner }] : []);

            const filteredCreds = allCreds.filter(c => {
                const isPrivate = c.is_private === true || c.is_private === 'true';
                return !isPrivate || c.owner === currentUser;
            });

            const hasHidden = allCreds.length > filteredCreds.length;

            let credentialsContent = '';

            if (filteredCreds.length === 0 && allCreds.length > 0) {
                credentialsContent = `<div class="server-credentials"><div style="font-size:0.85rem; opacity:0.6; padding:10px;"><em>Registrado com credenciais individuais.</em></div></div>`;
            } else {
                credentialsContent = filteredCreds.map(cred => {
                    const isPrivate = cred.is_private === true || cred.is_private === 'true';
                    const privacyIcon = isPrivate ? `<i class="fa-solid fa-lock" style="color: #ff5252; margin-left: 6px;" title="Individual (Privado)"></i>` : '';

                    return `
                    <div class="credential-item">
                        <div class="credential-row">
                            <span class="credential-label"><i class="fa-solid fa-user" style="color: var(--accent); margin-right: 5px;"></i> Usuário:${privacyIcon}</span>
                            <span class="credential-value">${escapeHtml(cred.user)}</span>
                            <button class="btn-copy-small" onclick="copyToClipboard('${escapeHtml(cred.user).replace(/'/g, "\\'")}')" title="Copiar Usuário">
                                <i class="fa-regular fa-copy"></i>
                            </button>
                        </div>
                        <div class="credential-row">
                            <span class="credential-label"><i class="fa-solid fa-key" style="color: var(--accent); margin-right: 5px;"></i> Senha:</span>
                            <span class="credential-value" data-raw="${escapeHtml(cred.password)}">••••••</span>
                            <button class="btn-copy-small" onclick="togglePassword(this)" title="Visualizar Senha" style="margin-right: 4px;">
                                <i class="fa-solid fa-eye"></i>
                            </button>
                            <button class="btn-copy-small" onclick="copyToClipboard('${escapeHtml(cred.password).replace(/'/g, "\\'")}')" title="Copiar Senha">
                                <i class="fa-regular fa-copy"></i>
                            </button>
                        </div>
                    </div>`;
                }).join('');
            }

            return `
                <div class="server-card">
                    <div class="server-card-header">
                        <div style="display: flex; gap: 8px; align-items: center; width: 100%;">
                            <span class="server-environment producao">VPN</span>
                        </div>
                        <div class="server-card-actions">
                            ${canEdit ? `<button class="btn-icon-card" onclick="editVpnRecord('${client.id}', ${index})" title="Editar"><i class="fa-solid fa-pen"></i></button>` : ''}
                            ${canDelete ? `<button class="btn-icon-card btn-danger" onclick="deleteVpnRecord('${client.id}', ${index})" title="Excluir"><i class="fa-solid fa-trash"></i></button>` : ''}
                        </div>
                    </div>
                    ${credentialsContent}
                    ${vpn.notes ? `
                        <div class="server-notes">
                            <div class="server-notes-title"><i class="fa-solid fa-comment-dots" style="color: var(--accent); margin-right: 6px;"></i> Observações</div>
                            <div class="server-notes-content">${escapeHtml(vpn.notes)}</div>
                        </div>` : ''}
                </div>
            `;
        }).join('');

    }

    async function handleVpnSubmit(e) {
        e.preventDefault();
        const id = vpnClientIdInput.value;
        const client = clients.find(c => c.id == id);
        if (!client) return;

        if (!client.vpns) client.vpns = [];

        const editingIndex = document.getElementById('editingVpnIndex').value;
        const vpnNotes = vpnNotesInput.value.trim();
        const vpnCredentialList = document.getElementById('vpnCredentialList');

        // Collect Credentials
        const credDivs = vpnCredentialList.querySelectorAll('.credential-field-group');
        const credentials = [];
        const currentUser = JSON.parse(localStorage.getItem('sofis_user') || '{}').username || 'anônimo';

        for (const div of credDivs) {
            const u = div.querySelector('.server-user-input').value.trim();
            const p = div.querySelector('.server-pass-input').value.trim();
            const isPrivate = div.querySelector('.server-private-check')?.checked || false;

            if (u || p) {
                credentials.push({
                    user: u,
                    password: await window.Security.encrypt(p),
                    is_private: isPrivate,
                    owner: currentUser
                });
            }
        }

        // Preserve hidden private credentials (other users)
        if (editingIndex !== '') {
            const originalVpn = client.vpns[parseInt(editingIndex)];
            // Handle migration if only legacy fields exist
            const oldCreds = originalVpn.credentials || (originalVpn.user ? [{ user: originalVpn.user, password: originalVpn.password, is_private: originalVpn.is_private, owner: originalVpn.owner }] : []);

            if (oldCreds) {
                const hiddenCredentials = oldCreds.filter(c => c.is_private && c.owner !== currentUser);
                credentials.push(...hiddenCredentials);
            }
        }

        if (credentials.length === 0) {
            showToast('⚠️ É necessário cadastrar pelo menos uma credencial.', 'error');
            return;
        }

        const vpnBefore = (editingIndex !== '') ? JSON.parse(JSON.stringify(client.vpns[parseInt(editingIndex)])) : null;

        const vpnRecord = {
            credentials: credentials,
            notes: vpnNotes
        };

        if (editingIndex !== '') {
            client.vpns[parseInt(editingIndex)] = vpnRecord;
            showToast(`✅ VPN do cliente "${client.name}" atualizada com sucesso!`, 'success');
        } else {
            client.vpns.push(vpnRecord);
            showToast(`✅ VPN adicionada ao cliente "${client.name}"!`, 'success');
        }

        await saveToLocal(client.id);
        renderClients(clients);
        renderVpnList(client);
        closeVpnEntryModal();
        const opType = editingIndex !== '' ? 'EDIÇÃO' : 'CRIAÇÃO';
        const actionLabel = editingIndex !== '' ? 'Edição de Acesso VPN' : 'Adição de Acesso VPN';
        await registerAuditLog(opType, actionLabel, `Cliente: ${client.name}`, vpnBefore, vpnRecord);
    }

    function openVpnData(clientId) {
        // Permission Check - View
        if (window.Permissions && !window.Permissions.can('Dados de Acesso (VPN)', 'can_view')) {
            showToast('🚫 Acesso negado: Você não tem permissão para visualizar dados de acesso VPN.', 'error');
            return;
        }

        const client = clients.find(c => c.id == clientId);
        if (!client) return;

        vpnClientIdInput.value = clientId;

        // Permissions
        const canCreate = window.Permissions.can('Dados de Acesso (VPN)', 'can_create');
        if (addVpnEntryBtn) {
            addVpnEntryBtn.style.display = canCreate ? 'flex' : 'none';
        }

        if (!client.vpns) client.vpns = [];

        // Set client name in subtitle
        const vpnModalClientName = document.getElementById('vpnModalClientName');
        if (vpnModalClientName) vpnModalClientName.textContent = client.name;

        clearVpnForm();
        renderVpnList(client);
        vpnModal.classList.remove('hidden');
    }

    window.editVpnRecord = async (clientId, index) => {
        // Permission Check
        if (window.Permissions && !window.Permissions.can('Dados de Acesso (VPN)', 'can_edit')) {
            showToast('🚫 Acesso negado: Você não tem permissão para editar dados de acesso VPN.', 'error');
            return;
        }

        const client = clients.find(c => c.id == clientId);
        if (!client || !client.vpns || !client.vpns[index]) return;

        const vpn = client.vpns[index];
        const vpnCredentialList = document.getElementById('vpnCredentialList');
        vpnCredentialList.innerHTML = '';

        const currentUser = JSON.parse(localStorage.getItem('sofis_user') || '{}').username || 'anônimo';

        // Populate credentials (support legacy and new)
        const allCreds = vpn.credentials || (vpn.user ? [{ user: vpn.user, password: vpn.password, is_private: vpn.is_private, owner: vpn.owner }] : []);

        if (allCreds.length > 0) {
            for (const c of allCreds) {
                // Skip if private and not owner
                if (c.is_private && c.owner !== currentUser) continue;

                const decPass = await window.Security.decrypt(c.password);
                addVpnCredentialField(c.user, decPass, c.is_private);
            }
        } else {
            addVpnCredentialField();
        }

        if (vpnNotesInput) vpnNotesInput.value = vpn.notes || '';
        document.getElementById('editingVpnIndex').value = index;

        vpnEntryModalTitle.textContent = 'Editar Acesso VPN';
        vpnEntryModal.classList.remove('hidden');
    }

    async function deleteVpnRecord(clientId, index) {
        // Permission Check
        if (window.Permissions && !window.Permissions.can('Dados de Acesso (VPN)', 'can_delete')) {
            showToast('🚫 Acesso negado: Você não tem permissão para excluir dados de acesso VPN.', 'error');
            return;
        }

        const client = clients.find(c => c.id == clientId);
        if (!client || !client.vpns) return;
        const vpn = client.vpns[index];

        // Validation: Check if other users own any credentials (handles legacy as well)
        const currentUser = JSON.parse(localStorage.getItem('sofis_user') || '{}').username || 'anônimo';
        const allCreds = vpn.credentials || (vpn.user ? [{ user: vpn.user, password: vpn.password, is_private: vpn.is_private, owner: vpn.owner }] : []);
        const blockingCreds = allCreds.filter(c => c.owner && c.owner !== currentUser);

        if (blockingCreds.length > 0) {
            const blockingOwners = [...new Set(blockingCreds.map(c => c.owner))];
            await window.handleBlockedDeletion(blockingOwners);
            return;
        }

        const confirmed = await window.showConfirm('Tem certeza que deseja excluir esta VPN?', 'Excluir VPN', 'fa-shield-halved');
        if (!confirmed) return;

        const deletedVpn = JSON.parse(JSON.stringify(vpn));
        client.vpns.splice(index, 1);
        await saveToLocal(client.id);
        renderClients(clients);
        renderVpnList(client);
        showToast(`🗑️ VPN do cliente "${client.name}" removida com sucesso!`, 'success');
        await registerAuditLog('EXCLUSÃO', 'Exclusão de Acesso VPN', `Cliente: ${client.name}`, deletedVpn, null);
    }

    // --- Client Notes Functions ---

    window.openClientNotes = (clientId) => {
        const client = clients.find(c => c.id == clientId);
        if (!client) return;

        notesClientIdInput.value = clientId;
        notesModalTitle.innerHTML = `Observações - <span style="color: var(--accent);">${client.name}</span>`;
        clientNoteInput.value = client.notes || '';

        // Permission Check for Edit (Default to FALSE for security)
        let canEdit = false;
        if (window.Permissions && window.Permissions.can) {
            canEdit = window.Permissions.can('Gestão de Clientes', 'can_edit');
        } else {
            console.warn('🔒 Permissions system not ready, defaulting to DENY for Observações.');
        }

        const notesForm = document.getElementById('notesForm');
        // Ensure we are selecting the buttons container within the form
        const modalActions = notesForm.querySelector('.modal-actions');
        const cancelBtn = document.getElementById('cancelNotesBtn');
        const saveBtn = notesForm.querySelector('button[type="submit"]');

        if (!canEdit) {
            // Read-Only Mode
            if (modalActions) {
                // Force hide the entire actions container
                modalActions.style.setProperty('display', 'none', 'important');
            }
            // Double check hiding individual buttons just in case css overrides container
            if (cancelBtn) cancelBtn.style.display = 'none';
            if (saveBtn) saveBtn.style.display = 'none';

            clientNoteInput.readOnly = true;
            clientNoteInput.classList.add('read-only-field');
        } else {
            // Edit Mode
            if (modalActions) {
                modalActions.style.display = ''; // Reset to default CSS
            }
            if (cancelBtn) cancelBtn.style.display = '';
            if (saveBtn) saveBtn.style.display = '';

            clientNoteInput.readOnly = false;
            clientNoteInput.classList.remove('read-only-field');
        }

        notesModal.classList.remove('hidden');
    };

    function closeNotesModal() {
        notesModal.classList.add('hidden');
    }

    async function handleNotesSubmit(e) {
        e.preventDefault();

        // 🛡️ Security Check at Action Level
        if (window.Permissions && !window.Permissions.can('Gestão de Clientes', 'can_edit')) {
            showToast('🚫 Acesso negado: Você não tem permissão para editar observações.', 'error');
            closeNotesModal(); // Fecha para evitar confusão
            return;
        }

        const id = notesClientIdInput.value;
        const client = clients.find(c => c.id == id);

        if (!client) return;

        const notesBefore = client.notes || '';
        client.notes = clientNoteInput.value.trim();
        await saveToLocal(client.id);
        showToast(`✅ Observações do cliente "${client.name}" salvas com sucesso!`, 'success');
        await registerAuditLog('EDIÇÃO', 'Atualização de Observações', `Cliente: ${client.name}`, notesBefore, client.notes);
        closeNotesModal();
        renderClients(clients);
    }

    // --- Global Function Exports ---
    window.renderClients = renderClients;
    window.editClient = editClient; // Defined earlier in file? Need to check.

    window.addNewContact = addNewContact;
    window.openServerData = openServerData;
    window.removeCredentialField = removeCredentialField;
    window.editServerRecord = editServerRecord;
    window.deleteServerRecord = deleteServerRecord;
    window.openVpnData = openVpnData;
    window.editVpnRecord = editVpnRecord;
    window.deleteVpnRecord = deleteVpnRecord;
    window.openClientNotes = openClientNotes;
    window.copyToClipboard = copyToClipboard;
    window.addPhone = addPhone;
    window.addEmail = addEmail;
    window.removeContactField = removeContactField;
    window.removeContact = removeContact;
    window.editContact = editContact;
    window.openAddModal = openAddModal;
    window.closeModal = closeModal;

    // --- URL Data Functions ---
    window.openUrlData = (clientId) => {
        const client = clients.find(c => c.id == clientId);
        if (!client) return;

        window.currentClient = client;
        urlClientIdInput.value = clientId;

        // Permissions
        const canCreate = window.Permissions.can('URLs', 'can_create');
        if (addUrlEntryBtn) {
            addUrlEntryBtn.style.display = canCreate ? 'flex' : 'none';
        }

        if (!client.urls) client.urls = [];

        const urlModalClientName = document.getElementById('urlModalClientName');
        if (urlModalClientName) urlModalClientName.textContent = client.name;

        // Reset filter state
        currentUrlFilter = 'all';
        currentUrlProductFilter = 'all';
        if (urlProductFilterLabel) urlProductFilterLabel.textContent = 'Todos';
        if (urlProductFilterBtn) {
            urlProductFilterBtn.classList.remove('filter-btn-active');
            urlProductFilterBtn.style.background = 'rgba(255, 255, 255, 0.05)';
        }
        if (urlFilterBtn) urlFilterBtn.classList.remove('filter-btn-active');
        if (urlFilterMenu) {
            urlFilterMenu.querySelectorAll('.dropdown-item').forEach(i => {
                i.classList.toggle('selected', i.dataset.value === 'all');
            });
        }

        // Set WebLaudo
        updateWebLaudoDisplay(client);

        clearUrlForm();
        populateUrlProductFilter(client);
        renderUrlList(client);
        urlModal.classList.remove('hidden');
    };

    async function updateWebLaudoDisplay(client) {
        const display = document.getElementById('webLaudoDisplay');
        const form = document.getElementById('webLaudoForm');
        const actions = document.getElementById('webLaudoActions');
        const text = document.getElementById('webLaudoText');
        const userText = document.getElementById('webLaudoUserText');
        const passText = document.getElementById('webLaudoPassText');
        const userRow = document.getElementById('webLaudoUserRow');

        if (!client.webLaudo || (typeof client.webLaudo === 'string' && !client.webLaudo.trim())) {
            if (display) display.style.display = 'none';
            if (form) form.style.display = 'flex';
            if (actions) actions.style.display = 'none';

            if (document.getElementById('webLaudoInput')) document.getElementById('webLaudoInput').value = '';
            if (document.getElementById('webLaudoUserInput')) document.getElementById('webLaudoUserInput').value = '';
            if (document.getElementById('webLaudoPassInput')) document.getElementById('webLaudoPassInput').value = '';
            return;
        }

        const data = typeof client.webLaudo === 'string' ? JSON.parse(client.webLaudo) : client.webLaudo;

        if (display) display.style.display = 'flex';
        if (form) form.style.display = 'none';
        if (actions) actions.style.display = 'flex';

        // Permission checks for edit/delete buttons
        const P = window.Permissions;
        const canEdit = P ? P.can('URLs', 'can_edit') : false;
        const canDelete = P ? P.can('URLs', 'can_delete') : false;

        const editBtn = document.getElementById('editWebLaudoBtn');
        const deleteBtn = document.getElementById('deleteWebLaudoBtn');

        if (editBtn) editBtn.style.display = canEdit ? '' : 'none';
        if (deleteBtn) deleteBtn.style.display = canDelete ? '' : 'none';

        if (text) text.textContent = data.url || '---';
        if (userText) userText.textContent = data.user || '---';
        if (userRow) userRow.style.display = data.user ? 'flex' : 'none';

        if (passText) {
            passText.textContent = '••••••';
            passText.dataset.raw = data.password || '';
        }

        // Reset eye icons (using class 'btn-weblaudo-action' now)
        document.querySelectorAll('#webLaudoPassRow .btn-weblaudo-action i').forEach(i => {
            i.className = 'fa-solid fa-eye';
        });
    }
    window.updateWebLaudoDisplay = updateWebLaudoDisplay;

    async function editWebLaudo() {
        const display = document.getElementById('webLaudoDisplay');
        const form = document.getElementById('webLaudoForm');
        const actions = document.getElementById('webLaudoActions');
        const client = window.currentClient;

        if (!client || !client.webLaudo) return;

        const data = typeof client.webLaudo === 'string' ? JSON.parse(client.webLaudo) : client.webLaudo;

        document.getElementById('webLaudoInput').value = data.url || '';
        document.getElementById('webLaudoUserInput').value = data.user || '';

        try {
            if (data.password) {
                document.getElementById('webLaudoPassInput').value = await window.Security.decrypt(data.password);
            } else {
                document.getElementById('webLaudoPassInput').value = '';
            }
        } catch (e) {
            console.error("Erro ao descriptografar:", e);
            document.getElementById('webLaudoPassInput').value = '';
        }

        if (display) display.style.display = 'none';
        if (form) form.style.display = 'flex';
        if (actions) actions.style.display = 'none';
        const saveBtn = document.getElementById('saveWebLaudoBtn');
        if (saveBtn) saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk" style="margin-right: 8px;"></i> Atualizar WebLaudo';
    }
    window.editWebLaudo = editWebLaudo;

    function cancelWebLaudoEdit() {
        const client = window.currentClient;
        const display = document.getElementById('webLaudoDisplay');
        const form = document.getElementById('webLaudoForm');
        const actions = document.getElementById('webLaudoActions');

        if (client && client.webLaudo && (typeof client.webLaudo !== 'string' || client.webLaudo.trim() !== '')) {
            if (display) display.style.display = 'flex';
            if (form) form.style.display = 'none';
            if (actions) actions.style.display = 'flex';
        } else {
            document.getElementById('webLaudoInput').value = '';
            document.getElementById('webLaudoUserInput').value = '';
            document.getElementById('webLaudoPassInput').value = '';
        }
        const saveBtn = document.getElementById('saveWebLaudoBtn');
        if (saveBtn) saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk" style="margin-right: 8px;"></i> Salvar WebLaudo';
    }
    window.cancelWebLaudoEdit = cancelWebLaudoEdit;

    async function handleDeleteWebLaudo() {
        if (window.Permissions && !window.Permissions.can('URLs', 'can_delete')) {
            showToast('🚫 Sem permissão para excluir WebLaudo.', 'error');
            return;
        }

        const id = urlClientIdInput.value;
        const client = clients.find(c => c.id == id);
        if (!client || !client.webLaudo) return;

        const confirmed = await window.showConfirm(`Deseja realmente excluir o WebLaudo do cliente "${client.name}"?`, 'Excluir WebLaudo', 'fa-trash');
        if (!confirmed) return;

        const oldWebLaudo = JSON.parse(JSON.stringify(client.webLaudo));
        client.webLaudo = null;
        await saveToLocal(client.id);

        const freshClient = clients.find(c => c.id == id) || client;
        updateWebLaudoDisplay(freshClient);

        applyClientFilter();
        showToast('🗑️ WebLaudo removido com sucesso!', 'success');
        await registerAuditLog('EXCLUSÃO', 'Exclusão de WebLaudo', `Cliente: ${client.name}`, oldWebLaudo, null);
    }
    window.handleDeleteWebLaudo = handleDeleteWebLaudo;

    function handleUrlSystemChange() {
        const execCredentialsContainer = document.getElementById('execCredentialsContainer');
        if (urlSystemSelect.value === 'Hemote Web') {
            bootstrapGroup.style.display = 'none';
            execUpdateGroup.style.display = 'none';
            if (execCredentialsContainer) execCredentialsContainer.style.display = 'none';
        } else {
            bootstrapGroup.style.display = 'block';
            execUpdateGroup.style.display = 'block';
            if (execCredentialsContainer) execCredentialsContainer.style.display = 'block';
        }
    }

    function closeUrlModal() {
        urlModal.classList.add('hidden');
    }

    async function populateUrlProductSelect() {
        const select = document.getElementById('urlSystemSelect');
        if (!select) return;

        try {
            const products = await window.api.products.list();
            const current = select.value;
            select.innerHTML = '<option value="">Selecione...</option>';

            if (products && products.length > 0) {
                products.forEach(p => {
                    const opt = document.createElement('option');
                    opt.value = p.name;
                    opt.textContent = p.name;
                    select.appendChild(opt);
                });
            }

            if (current && Array.from(select.options).some(o => o.value === current)) {
                select.value = current;
            }
        } catch (err) {
            console.error('Error populating URL products:', err);
            select.innerHTML = '<option value="">Erro ao carregar</option>';
        }
    }

    function openUrlEntry() {
        clearUrlForm();
        urlEntryModalTitle.textContent = 'URLs de Produto';
        document.getElementById('editingUrlIndex').value = '';
        urlEntryModal.classList.remove('hidden');

        // Populate and then handle change (might need to wait effectively, but immediate call is safer for UI feeling)
        populateUrlProductSelect().then(() => {
            handleUrlSystemChange();
        });
    }

    function closeUrlEntryModal() {
        urlEntryModal.classList.add('hidden');
        clearUrlForm();
    }

    window.removeUrlCredentialField = function (btn) {
        btn.closest('.credential-field-group').remove();
    };

    function addUrlCredentialField(user = '', password = '', isPrivate = false) {
        const list = document.getElementById('urlCredentialList');
        if (!list) return;

        const div = document.createElement('div');
        div.className = 'credential-field-group';
        div.innerHTML = `
            <div class="credential-fields-container">
                <div class="credential-field-item">
                    <div class="credential-label-row" style="margin-bottom: 5px;">
                        <label class="credential-label-text"><i class="fa-solid fa-user" style="color: var(--accent); margin-right: 5px;"></i> Usuário</label>
                    </div>
                    <input type="text" class="url-user-input" placeholder="Digite o usuário" value="${escapeHtml(user)}" style="height: 45px;">
                </div>
                
                <div class="credential-field-item">
                    <div class="credential-label-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; width: 100%;">
                        <label class="credential-label-text"><i class="fa-solid fa-key" style="color: var(--accent); margin-right: 5px;"></i> Senha</label>
                        <div class="checkbox-wrapper-individual">
                            <label style="display: flex; align-items: center; gap: 5px; cursor: pointer; font-size: 0.85em;">
                                <input type="checkbox" class="url-private-check" onchange="window.toggleIndividualPrivacy(this)" ${isPrivate ? 'checked' : ''}>
                                <i class="fa-solid fa-lock" style="font-size: 0.9em;"></i> INDIVIDUAL
                            </label>
                        </div>
                    </div>
                    <div style="position: relative; width: 100%;">
                        <input type="password" class="url-pass-input" placeholder="Digite a senha" value="${escapeHtml(password)}" style="padding-right: 40px; height: 45px;">
                        <button type="button" class="eye-btn" onclick="const i = this.previousElementSibling; i.type = i.type === 'password' ? 'text' : 'password'; this.querySelector('i').className = i.type === 'password' ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash';" tabindex="-1" title="Visualizar Senha" style="height: 45px; width: 45px; display: flex; align-items: center; justify-content: center; top: 0; right: 0; position: absolute; background: transparent; border: none; cursor: pointer;">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                    </div>
                </div>

                <button type="button" class="btn-remove-credential" onclick="removeUrlCredentialField(this)" title="Remover Credencial" tabindex="-1" style="height: 45px; width: 45px; display: flex; align-items: center; justify-content: center; margin-bottom: 2px;">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;
        list.appendChild(div);
    }

    window.removeExecCredentialField = function (btn) {
        btn.closest('.credential-field-group').remove();
    };

    function addExecCredentialField(user = '', password = '') {
        const list = document.getElementById('execCredentialList');
        if (!list) return;

        const div = document.createElement('div');
        div.className = 'credential-field-group';
        div.innerHTML = `
            <div class="credential-fields-container">
                <div class="credential-field-item">
                    <div class="credential-label-row" style="margin-bottom: 5px;">
                        <label class="credential-label-text"><i class="fa-solid fa-user" style="color: var(--accent); margin-right: 5px;"></i> Usuário</label>
                    </div>
                    <input type="text" class="exec-user-input" placeholder="Digite o usuário" value="${escapeHtml(user)}" style="height: 45px;">
                </div>
                
                <div class="credential-field-item">
                    <div class="credential-label-row" style="margin-bottom: 5px;">
                        <label class="credential-label-text"><i class="fa-solid fa-key" style="color: var(--accent); margin-right: 5px;"></i> Senha</label>
                    </div>
                    <div style="position: relative; width: 100%;">
                        <input type="password" class="exec-pass-input" placeholder="Digite a senha" value="${escapeHtml(password)}" style="padding-right: 40px; height: 45px;">
                        <button type="button" class="eye-btn" onclick="const i = this.previousElementSibling; i.type = i.type === 'password' ? 'text' : 'password'; this.querySelector('i').className = i.type === 'password' ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash';" tabindex="-1" title="Visualizar Senha" style="height: 45px; width: 45px; display: flex; align-items: center; justify-content: center; top: 0; right: 0; position: absolute; background: transparent; border: none; cursor: pointer;">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                    </div>
                </div>

                <button type="button" class="btn-remove-credential" onclick="removeExecCredentialField(this)" title="Remover Credencial" tabindex="-1" style="height: 45px; width: 45px; display: flex; align-items: center; justify-content: center; margin-bottom: 2px;">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;
        list.appendChild(div);
    }

    function clearUrlForm() {
        if (urlEnvironmentSelect) urlEnvironmentSelect.value = '';
        if (urlSystemSelect) urlSystemSelect.value = '';
        if (bridgeDataAccessInput) bridgeDataAccessInput.value = '';
        if (bootstrapInput) bootstrapInput.value = '';
        if (execUpdateInput) execUpdateInput.value = '';
        if (urlNotesInput) urlNotesInput.value = '';

        const urlList = document.getElementById('urlCredentialList');
        if (urlList) {
            urlList.innerHTML = '';
            addUrlCredentialField();
        }

        const execList = document.getElementById('execCredentialList');
        if (execList) {
            execList.innerHTML = '';
            addExecCredentialField();
        }

        const editIdx = document.getElementById('editingUrlIndex');
        if (editIdx) editIdx.value = '';
    }

    function populateUrlProductFilter(client) {
        if (!urlProductFilterMenu) return;

        if (!client.urls || client.urls.length === 0) {
            urlProductFilterMenu.innerHTML = '';
            return;
        }

        // 1. Get unique product names
        const products = [...new Set(client.urls.map(u => u.system).filter(s => s))].sort();

        // 2. Build Menu HTML
        let html = `
            <div class="dropdown-item ${currentUrlProductFilter === 'all' ? 'selected' : ''}" data-value="all">
                <span>Todos</span>
                <i class="fa-solid fa-check check-icon"></i>
            </div>
        `;

        products.forEach(prod => {
            const isSelected = currentUrlProductFilter === prod;
            html += `
                <div class="dropdown-item ${isSelected ? 'selected' : ''}" data-value="${prod}">
                    <span>${prod}</span>
                    <i class="fa-solid fa-check check-icon"></i>
                </div>
            `;
        });

        urlProductFilterMenu.innerHTML = html;

        // 3. Add Listeners
        urlProductFilterMenu.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', () => {
                currentUrlProductFilter = item.dataset.value;

                // Update UI Selected
                urlProductFilterMenu.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');

                // Update Label e Estilo do Botão
                if (urlProductFilterLabel) urlProductFilterLabel.textContent = currentUrlProductFilter === 'all' ? 'Todos' : currentUrlProductFilter;

                if (currentUrlProductFilter !== 'all') {
                    urlProductFilterBtn.classList.add('filter-btn-active');
                    urlProductFilterBtn.style.background = 'var(--primary-dark)';
                } else {
                    urlProductFilterBtn.classList.remove('filter-btn-active');
                    urlProductFilterBtn.style.background = 'rgba(255, 255, 255, 0.05)';
                }

                renderUrlList(client);
                urlProductFilterMenu.classList.remove('active');
            });
        });
    }

    function renderUrlList(client) {
        const listContainer = document.getElementById('urlsList');
        if (!listContainer) return;

        // Permissions
        const P = window.Permissions;
        const canEdit = P ? P.can('URLs', 'can_edit') : false;
        const canDelete = P ? P.can('URLs', 'can_delete') : false;

        const filterValue = currentUrlFilter;
        let filteredUrls = client.urls || [];

        if (filterValue !== 'all') {
            filteredUrls = filteredUrls.filter(u => u.environment === filterValue);
        }

        if (currentUrlProductFilter !== 'all') {
            filteredUrls = filteredUrls.filter(u => u.system === currentUrlProductFilter);
        }

        if (filteredUrls.length === 0) {
            listContainer.innerHTML = `
                <div class="servers-grid-empty">
                    <i class="fa-solid fa-link" style="font-size: 3rem; opacity: 0.3; margin-bottom: 12px; display: block;"></i>
                    <p>${filterValue === 'all' ? 'Nenhum produto cadastrado ainda.' : 'Nenhum produto encontrado para este filtro.'}</p>
                </div>
            `;
            return;
        }

        listContainer.innerHTML = filteredUrls.map(url => {
            const originalIndex = client.urls.indexOf(url);
            const environmentClass = url.environment === 'producao' ? 'producao' : 'homologacao';
            const environmentLabel = url.environment === 'producao' ? 'Produção' : 'Homologação';

            const editButton = canEdit ? `
                            <button class="btn-icon-card" onclick="editUrlRecord('${client.id}', ${originalIndex})" title="Editar">
                                <i class="fa-solid fa-pen"></i>
                            </button>` : '';

            const deleteButton = canDelete ? `
                            <button class="btn-icon-card btn-danger" onclick="deleteUrlRecord('${client.id}', ${originalIndex})" title="Excluir">
                                <i class="fa-solid fa-trash"></i>
                            </button>` : '';

            return `
                <div class="server-card">
                    <div class="server-card-header">
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <span class="server-environment ${environmentClass}">${environmentLabel}</span>
                            <span class="server-client-badge">${escapeHtml(client.name)}</span>
                        </div>
                        <div class="server-card-actions">
                            ${editButton}
                            ${deleteButton}
                        </div>
                    </div>
                    <div class="server-info">
                        <div class="server-info-label">
                            <i class="fa-solid fa-window-maximize" style="color: var(--accent); margin-right: 6px;"></i> Produto
                        </div>
                        <div class="server-info-value" style="font-weight: 600; color: var(--accent);">${escapeHtml(url.system)}</div>
                    </div>
                    ${url.bridgeDataAccess ? `
                        <div class="server-info">
                            <div class="server-info-label">
                                <i class="fa-solid fa-bridge" style="color: var(--accent); margin-right: 6px;"></i> Bridge (_data_access)
                            </div>
                            <div class="server-info-value" style="display: flex; justify-content: space-between; align-items: center; background: rgba(0, 0, 0, 0.2); padding: 10px; border-radius: 8px;">
                                <span style="font-family: monospace; color: var(--text-primary); word-break: break-all; margin-right: 10px; font-size: 0.75rem;">${escapeHtml(url.bridgeDataAccess)}</span>
                                <button class="btn-copy-small" onclick="copyToClipboard('${escapeHtml(url.bridgeDataAccess).replace(/'/g, "\\'")}')" title="Copiar">
                                    <i class="fa-regular fa-copy"></i>
                                </button>
                            </div>
                        </div>` : ''}

                    ${(url.credentials && url.credentials.length > 0) || url.user || url.password ? `
                        <div class="server-info" style="margin-top: 15px; padding-top: 15px;">
                             ${(() => {
                        const allCreds = (url.credentials || (url.user ? [{ user: url.user, password: url.password }] : []));
                        const filteredCreds = allCreds.filter(cred => {
                            const isPrivate = cred.is_private === true || cred.is_private === 'true';
                            const currentUser = JSON.parse(localStorage.getItem('sofis_user') || '{}').username || 'anônimo';
                            return !isPrivate || cred.owner === currentUser;
                        });

                        if (filteredCreds.length === 0 && allCreds.length > 0) {
                            return '<div style="font-size:0.85rem; opacity:0.6; padding:10px; background: rgba(0,0,0,0.2); border-radius: 6px;"><em>Registrado com credenciais individuais.</em></div>';
                        }

                        return filteredCreds.map(cred => {
                            const isPrivate = cred.is_private === true || cred.is_private === 'true';
                            const privacyIcon = isPrivate ? `<i class="fa-solid fa-lock" style="color: #ff5252; font-size: 0.7rem;" title="Individual"></i>` : '';

                            return `
                               <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 10px;">
                                   <div>
                                       <div class="server-info-label" style="display:flex; align-items:center; gap:5px;">
                                           <i class="fa-solid fa-user" style="color: var(--accent);"></i> Usuário
                                           ${privacyIcon}
                                       </div>
                                       <div class="server-info-value" style="display: flex; justify-content: space-between; align-items: center; background: rgba(0, 0, 0, 0.2); padding: 8px 10px; border-radius: 6px;">
                                           <span style="font-size: 0.85rem;">${escapeHtml(cred.user || '')}</span>
                                           <button class="btn-copy-small" onclick="copyToClipboard('${escapeHtml(cred.user || '').replace(/'/g, "\\'")}')" title="Copiar"><i class="fa-regular fa-copy"></i></button>
                                       </div>
                                   </div>
                                   <div>
                                       <div class="server-info-label"><i class="fa-solid fa-key" style="color: var(--accent); margin-right: 6px;"></i> Senha</div>
                                       <div class="server-info-value" style="display: flex; justify-content: space-between; align-items: center; background: rgba(0, 0, 0, 0.2); padding: 8px 10px; border-radius: 6px;">
                                           <span class="credential-value" data-raw="${cred.password || ''}">••••••</span>
                                           <div style="display: flex; gap: 4px;">
                                               <button class="btn-copy-small" onclick="togglePassword(this)" title="Ver Senha"><i class="fa-solid fa-eye"></i></button>
                                               <button class="btn-copy-small" onclick="copyToClipboard(this.parentElement.previousElementSibling.dataset.raw)" title="Copiar Senha"><i class="fa-regular fa-copy"></i></button>
                                           </div>
                                       </div>
                                   </div>
                               </div>
                           `;
                        }).join('');
                    })()}
                        </div>` : ''}

                    <hr style="border: 0; border-top: 1px solid var(--border); margin: 20px 0; opacity: 0.6;">
                    ${url.bootstrap ? `
                        <div class="server-info">
                            <div class="server-info-label">
                                <i class="fa-solid fa-bolt" style="color: var(--accent); margin-right: 6px;"></i> BootStrap (WebUpdate)
                            </div>
                            <div class="server-info-value" style="display: flex; justify-content: space-between; align-items: center; background: rgba(0, 0, 0, 0.2); padding: 10px; border-radius: 8px;">
                                <span style="font-family: monospace; color: var(--text-primary); word-break: break-all; margin-right: 10px; font-size: 0.75rem;">${escapeHtml(url.bootstrap)}</span>
                                <button class="btn-copy-small" onclick="copyToClipboard('${escapeHtml(url.bootstrap).replace(/'/g, "\\'")}')" title="Copiar">
                                    <i class="fa-regular fa-copy"></i>
                                </button>
                            </div>
                        </div>` : ''}

                    ${url.execUpdate ? `
                        <div class="server-info">
                            <div class="server-info-label">
                                <i class="fa-solid fa-download" style="color: var(--accent); margin-right: 6px;"></i> Atualização de Executáveis (Link de Download)
                            </div>
                            <div class="server-info-value" style="display: flex; justify-content: space-between; align-items: center; background: rgba(0, 0, 0, 0.2); padding: 10px; border-radius: 8px;">
                                <span style="font-family: monospace; color: var(--text-primary); word-break: break-all; margin-right: 10px; font-size: 0.75rem;">${escapeHtml(url.execUpdate)}</span>
                                <button class="btn-copy-small" onclick="copyToClipboard('${escapeHtml(url.execUpdate).replace(/'/g, "\\'")}')" title="Copiar">
                                    <i class="fa-regular fa-copy"></i>
                                </button>
                            </div>
                        </div>` : ''}

                    ${(url.execCredentials && url.execCredentials.length > 0) || url.execUser || url.execPassword ? `
                        <div class="server-info" style="margin-top: 15px; padding-top: 15px;">
                            ${(url.execCredentials || (url.execUser ? [{ user: url.execUser, password: url.execPassword }] : [])).map(cred => `
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 10px;">
                                    <div>
                                        <div class="server-info-label"><i class="fa-solid fa-user" style="color: var(--accent); margin-right: 6px;"></i> Usuário</div>
                                        <div class="server-info-value" style="display: flex; justify-content: space-between; align-items: center; background: rgba(0, 0, 0, 0.2); padding: 8px 10px; border-radius: 6px;">
                                            <span style="font-size: 0.85rem;">${escapeHtml(cred.user || '')}</span>
                                            <button class="btn-copy-small" onclick="copyToClipboard('${escapeHtml(cred.user || '').replace(/'/g, "\\'")}')" title="Copiar"><i class="fa-regular fa-copy"></i></button>
                                        </div>
                                    </div>
                                    <div>
                                        <div class="server-info-label"><i class="fa-solid fa-key" style="color: var(--accent); margin-right: 6px;"></i> Senha</div>
                                        <div class="server-info-value" style="display: flex; justify-content: space-between; align-items: center; background: rgba(0, 0, 0, 0.2); padding: 8px 10px; border-radius: 6px;">
                                            <span class="credential-value" data-raw="${cred.password || ''}">••••••</span>
                                            <div style="display: flex; gap: 4px;">
                                                <button class="btn-copy-small" onclick="togglePassword(this)" title="Ver Senha"><i class="fa-solid fa-eye"></i></button>
                                                <button class="btn-copy-small" onclick="copyToClipboard(this.parentElement.previousElementSibling.dataset.raw)" title="Copiar Senha"><i class="fa-regular fa-copy"></i></button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>` : ''}

                    ${url.notes ? `
                        <div class="server-notes">
                            <div class="server-notes-title">
                                <i class="fa-solid fa-comment-dots" style="color: var(--accent); margin-right: 6px;"></i> Observações
                            </div>
                            <div class="server-notes-content">${escapeHtml(url.notes)}</div>
                        </div>` : ''}
                </div>
            `;
        }).join('');
    }

    async function handleUrlSubmit(e) {
        e.preventDefault();
        const id = urlClientIdInput.value;
        const client = clients.find(c => c.id == id);
        if (!client) return;

        // Permissions
        const editingIndex = document.getElementById('editingUrlIndex').value;
        const P = window.Permissions;
        if (editingIndex !== '') {
            if (P && !P.can('URLs', 'can_edit')) {
                showToast('🚫 Sem permissão para editar URLs.', 'error');
                return;
            }
        } else {
            if (P && !P.can('URLs', 'can_create')) {
                showToast('🚫 Sem permissão para criar URLs.', 'error');
                return;
            }
        }

        if (!client.urls) client.urls = [];

        const urlBefore = (editingIndex !== '') ? JSON.parse(JSON.stringify(client.urls[parseInt(editingIndex)])) : null;

        if (!urlEnvironmentSelect.value) {
            showToast('⚠️ O ambiente é obrigatório.', 'error');
            urlEnvironmentSelect.focus();
            return;
        }
        if (!urlSystemSelect.value) {
            showToast('⚠️ O produto é obrigatório.', 'error');
            urlSystemSelect.focus();
            return;
        }
        if (!bridgeDataAccessInput.value.trim()) {
            showToast('⚠️ O Bridge data_access é obrigatório.', 'error');
            bridgeDataAccessInput.focus();
            return;
        }
        // Dynamic Credentials
        const urlCredDivs = document.getElementById('urlCredentialList').querySelectorAll('.credential-field-group');
        const urlCredentials = [];
        const currentUser = JSON.parse(localStorage.getItem('sofis_user') || '{}').username || 'anônimo';

        for (const div of urlCredDivs) {
            const u = div.querySelector('.url-user-input').value.trim();
            const p = div.querySelector('.url-pass-input').value.trim();
            const isPrivate = div.querySelector('.url-private-check')?.checked || false;

            if (u || p) {
                urlCredentials.push({
                    user: u,
                    password: await window.Security.encrypt(p),
                    is_private: isPrivate,
                    owner: currentUser
                });
            }
        }

        // Preserve hidden private credentials (other users) that were filtered out from the form
        if (editingIndex !== '') {
            const originalUrl = client.urls[parseInt(editingIndex)];
            if (originalUrl && originalUrl.credentials) {
                const hiddenCredentials = originalUrl.credentials.filter(c => c.is_private && c.owner !== currentUser);
                urlCredentials.push(...hiddenCredentials);
            }
        }

        const execCredDivs = document.getElementById('execCredentialList').querySelectorAll('.credential-field-group');
        const execCredentials = [];
        for (const div of execCredDivs) {
            const u = div.querySelector('.exec-user-input').value.trim();
            const p = div.querySelector('.exec-pass-input').value.trim();
            if (u || p) {
                execCredentials.push({
                    user: u,
                    password: await window.Security.encrypt(p)
                });
            }
        }

        const urlRecord = {
            environment: urlEnvironmentSelect.value,
            system: urlSystemSelect.value,
            bridgeDataAccess: bridgeDataAccessInput.value.trim(),
            bootstrap: bootstrapInput.value.trim(),
            execUpdate: execUpdateInput ? execUpdateInput.value.trim() : '',
            notes: urlNotesInput ? urlNotesInput.value.trim() : '',
            credentials: urlCredentials,
            execCredentials: execCredentials,
            // Deprecated fields, kept for safety or cleared
            user: null, // urlUserInput ? urlUserInput.value.trim() : '',
            password: null, // urlPassInput ? await window.Security.encrypt(urlPassInput.value) : '',
            execUser: null,
            execPassword: null
        };

        if (editingIndex !== '') {
            client.urls[parseInt(editingIndex)] = urlRecord;
            showToast(`✅ URL do cliente "${client.name}" atualizada com sucesso!`, 'success');
        } else {
            client.urls.push(urlRecord);
            showToast(`✅ URL adicionada ao cliente "${client.name}"!`, 'success');
        }

        await saveToLocal(client.id);
        renderClients(clients);
        renderUrlList(client);
        closeUrlEntryModal();
        const opType = editingIndex !== '' ? 'EDIÇÃO' : 'CRIAÇÃO';
        const actionLabel = editingIndex !== '' ? 'Edição de URL de Produto' : 'Adição de URL de Produto';
        await registerAuditLog(opType, actionLabel, `Cliente: ${client.name}, Produto: ${urlRecord.system}, Ambiente: ${urlRecord.environment} `, urlBefore, urlRecord);
    }

    window.editUrlRecord = async (clientId, index) => {
        // Permission Check
        if (window.Permissions && !window.Permissions.can('URLs', 'can_edit')) {
            showToast('🚫 Sem permissão para editar URLs.', 'error');
            return;
        }
        const client = clients.find(c => c.id == clientId);
        if (!client || !client.urls || !client.urls[index]) return;

        // Ensure list is populated first
        await populateUrlProductSelect();

        const url = client.urls[index];
        urlEnvironmentSelect.value = url.environment;
        urlSystemSelect.value = url.system;
        bridgeDataAccessInput.value = url.bridgeDataAccess || '';
        bootstrapInput.value = url.bootstrap || '';
        execUpdateInput.value = url.execUpdate || '';
        urlNotesInput.value = url.notes || '';

        // Populate URL Credentials
        const urlList = document.getElementById('urlCredentialList');
        urlList.innerHTML = '';
        const currentUser = JSON.parse(localStorage.getItem('sofis_user') || '{}').username || 'anônimo';

        if (url.credentials && url.credentials.length > 0) {
            for (const cred of url.credentials) {
                // Privacy Check: Skip if private and not owner
                if (cred.is_private && cred.owner !== currentUser) continue;

                const decPass = await window.Security.decrypt(cred.password);
                addUrlCredentialField(cred.user, decPass, cred.is_private);
            }
        } else if (url.user || url.password) {
            // Backward compatibility
            const decPass = await window.Security.decrypt(url.password);
            addUrlCredentialField(url.user, decPass, false);
        } else {
            addUrlCredentialField();
        }

        // Populate Exec Credentials
        const execList = document.getElementById('execCredentialList');
        if (execList) {
            execList.innerHTML = '';
            if (url.execCredentials && url.execCredentials.length > 0) {
                for (const cred of url.execCredentials) {
                    const dec = await window.Security.decrypt(cred.password);
                    addExecCredentialField(cred.user, dec);
                }
            } else if (url.execUser || url.execPassword) {
                // Migration support
                const dec = await window.Security.decrypt(url.execPassword);
                addExecCredentialField(url.execUser, dec);
            } else {
                addExecCredentialField();
            }
        }
        document.getElementById('editingUrlIndex').value = index;

        urlEntryModalTitle.textContent = 'URLs de Produto';
        urlEntryModal.classList.remove('hidden');

        // Trigger change to update bootstrap visibility
        handleUrlSystemChange();
    }

    window.deleteUrlRecord = async (clientId, index) => {
        // Permission Check
        if (window.Permissions && !window.Permissions.can('URLs', 'can_delete')) {
            showToast('🚫 Sem permissão para excluir URLs.', 'error');
            return;
        }

        const client = clients.find(c => c.id == clientId);
        if (!client || !client.urls || !client.urls[index]) return;
        const url = client.urls[index];

        // Validation: Check if other users own any credentials
        const currentUser = JSON.parse(localStorage.getItem('sofis_user') || '{}').username || 'anônimo';
        const allCreds = url.credentials || (url.user ? [{ user: url.user, password: url.password, owner: url.owner }] : []);
        const blockingCreds = allCreds.filter(c => c.owner && c.owner !== currentUser);

        if (blockingCreds.length > 0) {
            const blockingOwners = [...new Set(blockingCreds.map(c => c.owner))];
            await window.handleBlockedDeletion(blockingOwners);
            return;
        }

        const confirmed = await window.showConfirm('Tem certeza que deseja excluir este produto?', 'Excluir Produto', 'fa-laptop-code');
        if (!confirmed) return;

        const deletedUrl = JSON.parse(JSON.stringify(url));
        client.urls.splice(index, 1);
        await saveToLocal(client.id);
        renderClients(clients);
        renderUrlList(client);
        showToast(`🗑️ URL do cliente "${client.name}" removida com sucesso!`, 'success');
        await registerAuditLog('EXCLUSÃO', 'Exclusão de URL de Produto', `Cliente: ${client.name}, Produto: ${deletedUrl.system}, Ambiente: ${deletedUrl.environment} `, deletedUrl, null);
    }

    async function handleWebLaudoSave() {
        const saveBtn = document.getElementById('saveWebLaudoBtn');
        const originalBtnContent = saveBtn ? saveBtn.innerHTML : '';

        try {
            const id = urlClientIdInput.value;
            const client = clients.find(c => c.id == id);
            if (!client) return;

            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Salvando...';
            }

            const isNew = !client.webLaudo;
            const P = window.Permissions;

            // Dynamic Permission Check
            if (isNew) {
                if (P && !P.can('URLs', 'can_create')) {
                    showToast('🚫 Sem permissão para cadastrar WebLaudo.', 'error');
                    return;
                }
            } else {
                if (P && !P.can('URLs', 'can_edit')) {
                    showToast('🚫 Sem permissão para editar WebLaudo.', 'error');
                    return;
                }
            }

            const url = webLaudoInput.value.trim();
            if (!url) {
                showToast('⚠️ A URL é obrigatória.', 'warning');
                return;
            }

            const userInput = document.getElementById('webLaudoUserInput');
            const passInput = document.getElementById('webLaudoPassInput');

            const webLaudoBefore = JSON.parse(JSON.stringify(client.webLaudo || {}));

            client.webLaudo = {
                url: url,
                user: userInput ? userInput.value.trim() : '',
                password: (passInput && passInput.value) ? await window.Security.encrypt(passInput.value) : ''
            };

            await saveToLocal(client.id);

            // Re-find client to ensure we have the fresh one from initialLoad (called by saveToLocal)
            const freshClient = clients.find(c => c.id == id) || client;
            updateWebLaudoDisplay(freshClient);

            applyClientFilter();
            showToast('✅ WebLaudo salvo com sucesso!', 'success');
            await registerAuditLog('EDIÇÃO', 'Atualização de WebLaudo', `Cliente: ${client.name} `, webLaudoBefore, freshClient.webLaudo);
        } catch (error) {
            console.error("Erro ao salvar WebLaudo:", error);
            showToast("❌ Erro ao salvar WebLaudo.", "error");
        } finally {
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = originalBtnContent;
            }
        }
    }
    window.handleWebLaudoSave = handleWebLaudoSave;
    window.closeUrlModal = closeUrlModal;
    window.openUrlEntry = openUrlEntry;
    window.closeUrlEntryModal = closeUrlEntryModal;

    function toggleFavoritesSection() {
        favoritesCollapsed = !favoritesCollapsed;
        localStorage.setItem('sofis_favorites_collapsed', favoritesCollapsed);
        applyClientFilter();
    }
    window.toggleFavoritesSection = toggleFavoritesSection;

    function toggleRegularSection() {
        regularCollapsed = !regularCollapsed;
        localStorage.setItem('sofis_regular_collapsed', regularCollapsed);
        applyClientFilter();
    }
    window.toggleRegularSection = toggleRegularSection;

    // Initial render
    applyClientFilter();
    updateFilterCounts();

    // Scroll to Top Button Functionality
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');

    if (scrollToTopBtn) {
        // Show/hide button based on scroll position
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                scrollToTopBtn.classList.add('visible');
            } else {
                scrollToTopBtn.classList.remove('visible');
            }
        });

        // Scroll to top when clicked
        scrollToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // --- Activity Feed Functions ---
    // --- Activity Feed Functions ---
    async function fetchRecentActivities() {
        if (!window.api || !window.api.logs || !activityList) return;

        try {
            const logs = await window.api.logs.list({ limit: 10 });
            renderActivityFeed(logs);
        } catch (err) {
            console.error('Erro ao buscar atividades:', err);
        }
    }

    function renderActivityFeed(activities) {
        if (!activityList) return;
        activityList.innerHTML = '';

        if (!activities || activities.length === 0) {
            activityList.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 20px;">Nenhuma atividade recente.</div>';
            return;
        }

        activities.forEach(activity => {
            const date = new Date(activity.created_at);
            const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            const dateStr = date.toLocaleDateString('pt-BR');

            const item = document.createElement('div');
            item.className = 'activity-item';

            const opClass = `op - ${(activity.operation_type || 'update').toLowerCase()} `;
            const opLabel = activity.operation_type || 'Ação';

            item.innerHTML = `
        <div class="activity-item-header">
                    <span class="activity-user"><i class="fa-solid fa-user"></i> ${escapeHtml(activity.username)}</span>
                    <span class="activity-time">${dateStr} às ${timeStr}</span>
                </div>
        <div class="activity-action">
            <span class="activity-op-badge ${opClass}">${opLabel}</span>
            <div style="display: flex; flex-direction: column; gap: 4px; flex: 1;">
                <span style="font-weight: 500;">${escapeHtml(activity.action)}</span>
                ${activity.client_name ? `
                            <div style="display: flex; align-items: center; gap: 6px;">
                                <span class="server-client-badge" style="font-size: 0.65rem; padding: 2px 6px;">
                                    ${escapeHtml(activity.client_name)}
                                </span>
                            </div>
                        ` : ''}
            </div>
        </div>
                ${activity.details ? `<div class="activity-details">${escapeHtml(activity.details)}</div>` : ''}
    `;
            activityList.appendChild(item);
        });
    }

    function toggleActivitySidebar() {
        activitySidebar.classList.toggle('hidden');
        activityOverlay.classList.toggle('hidden');
        if (!activitySidebar.classList.contains('hidden')) {
            fetchRecentActivities();
        }
    }

    if (toggleActivityBtn) toggleActivityBtn.addEventListener('click', toggleActivitySidebar);
    if (closeActivityBtn) closeActivityBtn.addEventListener('click', toggleActivitySidebar);
    if (activityOverlay) activityOverlay.addEventListener('click', toggleActivitySidebar);

    // --- History Modal Functions ---
    window.openClientHistory = async (clientId) => {
        const client = clients.find(c => c.id == clientId);
        if (!client) return;

        if (historyModal) {
            historyModalTitle.innerHTML = `Histórico: <span style="color: var(--accent); font-weight: bold;">${client.name}</span>`;
            historyList.innerHTML = '<div style="text-align:center; padding: 20px;"><i class="fa-solid fa-circle-notch fa-spin"></i> Carregando...</div>';
            historyModal.dataset.clientId = clientId; // Store for reload
            historyModal.classList.remove('hidden');
        }

        if (!window.api || !window.api.logs) {
            if (historyList) historyList.innerHTML = '<div style="padding: 20px; text-align: center;">Histórico indisponível.</div>';
            return;
        }

        try {
            const data = await window.api.logs.list({ client_name: client.name });
            renderClientHistory(data);

        } catch (err) {
            console.error('Error fetching history:', err);
            if (historyList) historyList.innerHTML = '<div style="color:var(--danger); padding: 20px; text-align: center;">Erro ao carregar histórico.</div>';
        }
    };



    function renderClientHistory(logs) {
        if (!historyList) return;
        historyList.innerHTML = '';

        if (!logs || logs.length === 0) {
            historyList.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 20px;">Nenhuma alteração registrada.</div>';
            return;
        }

        logs.forEach((log) => {
            const date = new Date(log.created_at);
            const dateStr = date.toLocaleDateString('pt-BR');
            const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

            const opTypeRaw = (log.operation_type || 'UPDATE').toLowerCase();
            const opClass = `op - ${opTypeRaw} `;
            const opLabel = (log.operation_type || 'AÇÃO').toUpperCase();

            // Permission checks
            const P = window.Permissions;
            const currentUser = sessionStorage.getItem('username') || localStorage.getItem('username');
            const isOwnLog = log.username === currentUser;
            const canEdit = P && P.can('Logs e Atividades', 'can_edit') && isOwnLog;
            const canDelete = P && P.can('Logs e Atividades', 'can_delete') && isOwnLog;

            const item = document.createElement('div');
            item.className = 'activity-item';

            const actionButtons = (canEdit || canDelete) ? `
        <div class="activity-actions" style="display: flex; gap: 8px;">
            ${canEdit ? `<button class="btn-icon-small" onclick="editClientLog('${log.id}')" title="Editar"><i class="fa-solid fa-pen"></i></button>` : ''}
                    ${canDelete ? `<button class="btn-icon-small btn-danger-outline" onclick="deleteClientLog('${log.id}')" title="Excluir"><i class="fa-solid fa-trash"></i></button>` : ''}
                </div>
        ` : '';

            item.innerHTML = `
        <div class="activity-item-header">
                    <span class="activity-user"><i class="fa-solid fa-user"></i> ${escapeHtml(log.username || 'Sistema')}</span>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        ${actionButtons}
                        <span class="activity-time">${dateStr} às ${timeStr}</span>
                    </div>
                </div>
                <div class="activity-action">
                    <span class="activity-op-badge ${opClass}">${opLabel}</span>
                    ${escapeHtml(log.action)}
                </div>
                <div class="activity-details">
                    ${escapeHtml(log.details.replace(/Cliente:\s*[^,]+(,\s*)?/, ''))}
                </div>
    `;
            historyList.appendChild(item);
        });

    }

    // Edit Client Log
    window.editClientLog = async (logId) => {
        const P = window.Permissions;
        if (!P || !P.can('Logs e Atividades', 'can_edit')) {
            showToast('🚫 Sem permissão para editar logs.', 'error');
            return;
        }

        showToast('⚠️ Funcionalidade em desenvolvimento', 'warning');
        // TODO: Implementar modal de edição
    };

    // Delete Client Log
    window.deleteClientLog = async (logId) => {
        const P = window.Permissions;
        if (!P || !P.can('Logs e Atividades', 'can_delete')) {
            showToast('🚫 Sem permissão para excluir logs.', 'error');
            return;
        }

        const confirmed = await window.showConfirm(
            'Deseja realmente excluir este registro do histórico?',
            'Excluir Log',
            'fa-trash'
        );

        if (!confirmed) return;

        try {
            const response = await fetch(`/ Projeto - SOFIS - 1 / api / audit.php ? id = ${logId} `, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (!response.ok) throw new Error('Falha ao excluir log');

            showToast('🗑️ Log excluído com sucesso!', 'success');

            // Recarrega o histórico do cliente atual
            const currentClientId = historyModal?.dataset?.clientId;
            if (currentClientId) {
                window.openClientHistory(currentClientId);
            }
        } catch (error) {
            console.error('Erro ao excluir log:', error);
            showToast('❌ Erro ao excluir log.', 'error');
        }
    };


    if (closeHistoryModalBtn) {
        closeHistoryModalBtn.addEventListener('click', () => {
            if (historyModal) historyModal.classList.add('hidden');
        });
    }


    // Close on outside click for modals
    window.addEventListener('click', (e) => {
        if (e.target === historyModal) {
            historyModal.classList.add('hidden');
        }
        if (e.target === document.getElementById('versionModal')) {
            closeVersionModal();
        }
        if (e.target === document.getElementById('versionHistoryModal')) {
            document.getElementById('versionHistoryModal').classList.add('hidden');
        }
    });


    // ===================================
    // TAB NAVIGATION LOGIC
    // ===================================
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;

            // Update buttons
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Update content sections
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${tabId}Tab`) {
                    content.classList.add('active');
                }
            });

            // Load tab specific data
            if (tabId === 'versions' && window.loadVersionControls) {
                window.loadVersionControls();
            } else if (tabId === 'management' && window.loadManagementTab) {
                window.loadManagementTab();
            }
        });
    });

    // ===================================
    // VERSION CONTROL INTEGRATION
    // ===================================
    function populateVersionClientSelect() {
        const datalist = document.getElementById('versionClientList');
        const input = document.getElementById('versionClientInput');
        const hiddenSelect = document.getElementById('versionClientSelect');

        if (!datalist || !input || !hiddenSelect) return;

        datalist.innerHTML = '';

        // Get IDs of clients that already have a Version Control entry
        // This prevents creating duplicate cards for the same client
        const existingClientIds = (window.versionControls || []).map(vc => vc.client_id || (vc.clients && vc.clients.id));

        // Sort and add clients, EXCLUDING those who already have a card
        const availableClients = [...clients].filter(c => !existingClientIds.includes(c.id));
        const sortedClients = availableClients.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

        sortedClients.forEach(client => {
            const option = document.createElement('option');
            option.value = client.name;
            datalist.appendChild(option);
        });

        // Add input listener to update hidden ID
        input.addEventListener('input', () => {
            const val = input.value.trim().toLowerCase();
            const client = clients.find(c => (c.name || '').toLowerCase() === val);
            if (client) {
                hiddenSelect.value = client.id;
            } else {
                hiddenSelect.value = '';
            }
        });

        // Input validation on blur
        input.addEventListener('change', () => {
            const val = input.value;
            const client = clients.find(c => c.name === val);
            if (!client && val !== '') {
                // Optional: Clear or warn if invalid client
                // input.setCustomValidity("Selecione um cliente da lista");
            } else {
                // input.setCustomValidity("");
            }
        });
    }

    // Re-expose populate function if needed
    window.populateVersionClientSelect = populateVersionClientSelect;
    populateVersionClientSelect();

    // Version Alert Toggle and Filters are handled by window.setupVersionControlFilters() in version-control.js
    if (window.setupVersionControlFilters) {
        window.setupVersionControlFilters();
    }

    // ===================================
    // CLIENT INTERACTION LOGIC (RENAME/NOTES)
    // ===================================

    let interactionClientId = null;
    let interactionClientName = null;

    window.openClientInteraction = function (id, name) {
        interactionClientId = id;
        interactionClientName = name;

        // Safety check if modal elements exist
        const modal = document.getElementById('clientInteractionModal');
        const title = document.getElementById('clientInteractionTitle');

        if (modal && title) {
            title.textContent = name;
            modal.classList.remove('hidden');
        } else {
            console.error('Client Interaction Modal elements not found');
        }
    };

    window.triggerRenameClient = function () {
        const interactionModal = document.getElementById('clientInteractionModal');
        const renameModal = document.getElementById('quickRenameModal');
        const inputId = document.getElementById('quickRenameId');
        const inputName = document.getElementById('quickRenameInput');

        if (interactionModal) interactionModal.classList.add('hidden');

        if (renameModal && inputId && inputName) {
            inputId.value = interactionClientId;
            inputName.value = interactionClientName;
            renameModal.classList.remove('hidden');
            setTimeout(() => inputName.focus(), 100);
        }
    };

    window.triggerClientNotes = function () {
        const interactionModal = document.getElementById('clientInteractionModal');
        if (interactionModal) interactionModal.classList.add('hidden');

        if (interactionClientId) {
            window.openClientGeneralNotes(interactionClientId);
        }
    };

    window.openClientGeneralNotes = function (id) {
        if (typeof clients === 'undefined') return;
        const client = clients.find(c => c.id == id);
        if (!client) return;

        const modal = document.getElementById('notesModal');
        const idInput = document.getElementById('notesClientId');
        const textInput = document.getElementById('clientNoteInput');

        if (modal && idInput && textInput) {
            idInput.value = id;
            textInput.value = client.notes || '';
            modal.classList.remove('hidden');
        }
    };

    window.submitQuickRename = async function () {
        const id = document.getElementById('quickRenameId').value;
        const newName = document.getElementById('quickRenameInput').value.trim();

        if (!newName) {
            showToast('O nome não pode ser vazio', 'error');
            return;
        }

        if (!clients || clients.length === 0) {
            showToast('Erro: Lista de clientes vazia. Tente recarregar a página.', 'error');
            return;
        }

        const client = clients.find(c => c.id == id);
        if (client) {
            const oldName = client.name;
            client.name = newName;

            // 1. Atualização INSTANTÂNEA na tela atual (Contatos)
            document.getElementById('quickRenameModal').classList.add('hidden');

            try {
                // Removed preserveTimestamp=true so both card date and history date match (are updated)
                await saveToLocal(client.id);
                renderClients(clients);
            } catch (err) {
                console.error('Erro ao salvar localmente:', err);
                showToast('Aviso: Erro ao sincronizar com o servidor', 'warning');
            }

            // 2. Atualização INSTANTÂNEA na outra tela (Controle de Versão)
            if (window.versionControls) {
                // Atualiza o nome do cliente em todos os registros de versão em memória
                window.versionControls.forEach(vc => {
                    if (vc.clients && (vc.clients.id === id || vc.client_id === id)) {
                        vc.clients.name = newName;
                    }
                });

                // Re-renderiza a tela de versões se ela estiver disponível
                if (typeof window.renderVersionControls === 'function') {
                    window.renderVersionControls();
                }
            }

            // 3. Sincronização final
            try {
                if (typeof window.loadVersionControls === 'function') {
                    await window.loadVersionControls();
                }
            } catch (err) {
                console.error('Erro na sincronização final:', err);
            }

            // 4. Update dropdown list immediately
            if (typeof populateVersionClientSelect === 'function') {
                populateVersionClientSelect();
            }

            // Removed redundant audit log - already covered by "Edição de Cliente"
        } else {
            showToast(`Erro: Cliente não encontrado(ID: ${id})`, 'error');
        }
    };

    // ===================================
    // INACTIVE CONTRACT FEATURES
    // ===================================

    window.triggerInactiveContract = function () {
        const modal = document.getElementById('clientInteractionModal');
        if (modal) modal.classList.add('hidden');

        if (interactionClientId) {
            window.openInactiveContractDetails(interactionClientId);
        } else {
            console.error("interactionClientId is null");
        }
    };

    window.openInactiveContractDetails = async function (clientId) {
        const client = clients.find(c => c.id == clientId);
        if (!client) return;

        const modal = document.getElementById('inactiveContractModal');
        if (!modal) return;

        const clientNameEl = document.getElementById('inactiveContractClientName');
        if (clientNameEl) clientNameEl.textContent = client.name;

        const idInput = document.getElementById('inactiveContractClientId');
        if (idInput) idInput.value = client.id;

        const notesInput = document.getElementById('inactiveContractNotes');
        if (notesInput) notesInput.value = '';

        const dateInput = document.getElementById('inactiveContractDate');
        if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

        // Check if already inactive
        const isInactive = client.inactive_contract && client.inactive_contract.active;
        const saveBtn = document.getElementById('saveInactiveContractBtn');
        const reactivateBtn = document.getElementById('reactivateContractBtn');

        if (isInactive) {
            if (dateInput) dateInput.value = client.inactive_contract.date;
            if (notesInput) notesInput.value = client.inactive_contract.notes || '';

            if (saveBtn) saveBtn.classList.add('hidden');
            if (reactivateBtn) reactivateBtn.classList.remove('hidden');
        } else {
            if (saveBtn) saveBtn.classList.remove('hidden');
            if (reactivateBtn) reactivateBtn.classList.add('hidden');
        }

        modal.classList.remove('hidden');
    };

    window.submitInactiveContract = async function () {
        const clientId = document.getElementById('inactiveContractClientId').value;
        const date = document.getElementById('inactiveContractDate').value;
        const notes = document.getElementById('inactiveContractNotes').value;

        if (!date) {
            if (window.showToast) window.showToast('⚠️ Data é obrigatória.', 'warning');
            return;
        }

        const inactiveData = {
            active: true,
            date: date,
            notes: notes,
            markedBy: JSON.parse(localStorage.getItem('sofis_user') || '{}').username || 'Unknown',
            markedAt: new Date().toISOString()
        };

        try {
            const client = clients.find(c => c.id == clientId);
            if (!client) throw new Error("Cliente não encontrado.");

            // Create FULL updated object
            // Spread client to keep existing fields, then override inactive_contract
            const updatedClient = {
                ...client,
                inactive_contract: inactiveData
            };

            console.log("Saving Inactive Contract:", updatedClient);

            // Call API with FULL object
            await window.api.clients.update(clientId, updatedClient);

            if (client) {
                client.inactive_contract = inactiveData; // Optimistic update
                renderClients(clients);
            }

            // Audit Log
            await registerAuditLog('EDIÇÃO', 'Inativação de Contrato', `Cliente: ${client.name} `, null, inactiveData);

            if (window.showToast) window.showToast('Contrato marcado como inativo.', 'success');
            document.getElementById('inactiveContractModal').classList.add('hidden');

        } catch (e) {
            console.error(e);
            if (window.showToast) window.showToast('Erro ao salvar Inatividade: ' + e.message, 'error');
        }
    };

    window.reactivateContract = async function () {
        const clientId = document.getElementById('inactiveContractClientId').value;

        const confirmed = await window.showConfirm('Tem certeza que deseja reativar este contrato?', 'Reativar Contrato', 'fa-rotate-left');
        if (!confirmed) return;

        try {
            const client = clients.find(c => c.id == clientId);
            if (!client) throw new Error("Cliente não encontrado.");

            // Create FULL updated object with null inactive_contract
            const updatedClient = {
                ...client,
                inactive_contract: null
            };

            // API Call with FULL object
            await window.api.clients.update(clientId, updatedClient); // Sending null clears it

            if (client) {
                client.inactive_contract = null;
                renderClients(clients);
            }

            // Audit Log
            await registerAuditLog('EDIÇÃO', 'Reativação de Contrato', `Cliente: ${client.name} `, client.inactive_contract, null);

            if (window.showToast) window.showToast('Contrato reativado com sucesso!', 'success');
            document.getElementById('inactiveContractModal').classList.add('hidden');

        } catch (e) {
            console.error(e);
            if (window.showToast) window.showToast('Erro ao reativar contrato: ' + e.message, 'error');
        }
    };

    // --- Filter Logic Implementation ---
    function setupFilters() {
        const filters = [
            {
                btnId: 'serverFilterBtn',
                menuId: 'serverFilterMenu',
                variable: 'currentServerFilter',
                renderFunc: () => {
                    const id = document.getElementById('serverClientId').value;
                    const client = clients.find(c => c.id == id);
                    if (client) renderServersList(client);
                }
            },
            {
                btnId: 'hostFilterBtn',
                menuId: 'hostFilterMenu',
                variable: 'currentHostFilter',
                renderFunc: () => {
                    const id = document.getElementById('hostClientId').value;
                    const client = clients.find(c => c.id == id);
                    if (client) renderHostsList(client);
                }
            },
            {
                btnId: 'urlFilterBtn',
                menuId: 'urlFilterMenu',
                variable: 'currentUrlFilter',
                renderFunc: () => {
                    const id = document.getElementById('urlClientId').value;
                    const client = clients.find(c => c.id == id);
                    if (client) renderUrlList(client);
                }
            }
        ];

        filters.forEach(filter => {
            const btn = document.getElementById(filter.btnId);
            const menu = document.getElementById(filter.menuId);

            if (!btn || !menu) return;

            // Toggle Menu
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                // Close others
                document.querySelectorAll('.dropdown-menu').forEach(m => {
                    if (m !== menu) m.classList.remove('show');
                });
                menu.classList.toggle('show');
            });

            // Handle Selection
            const items = menu.querySelectorAll('.dropdown-item');
            items.forEach(item => {
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const value = item.dataset.value;

                    // Update Global Variable explicitly
                    if (filter.variable === 'currentServerFilter') currentServerFilter = value;
                    if (filter.variable === 'currentHostFilter') currentHostFilter = value;
                    if (filter.variable === 'currentUrlFilter') currentUrlFilter = value;

                    // Update UI Selection
                    items.forEach(i => i.classList.remove('selected'));
                    item.classList.add('selected');

                    // Update filter button visual state
                    if (value === 'all') {
                        btn.classList.remove('filter-btn-active');
                    } else {
                        btn.classList.add('filter-btn-active');
                    }

                    // Close Menu
                    menu.classList.remove('show');

                    // Re-render
                    if (filter.renderFunc) filter.renderFunc();
                });
            });
        });

        // Close on click outside
        document.addEventListener('click', () => {
            document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show'));
        });
    }

    // Initialize Filters
    setupFilters();


    // --- Host Data (Servidores) Functions ---
    let currentHostFilter = 'all';

    window.openHostData = (clientId) => {
        try {
            const client = clients.find(c => c.id == clientId);
            if (!client) return;

            const P = window.Permissions;
            // Permission Check - View
            if (P && !P.can('Servidores', 'can_view')) {
                showToast('🚫 Acesso negado: Você não tem permissão para visualizar servidores.', 'error');
                return;
            }

            const canCreate = (P && P.can) ? P.can('Servidores', 'can_create') : false;

            const hClientIdInput = document.getElementById('hostClientId');
            const hAddBtn = document.getElementById('addHostEntryBtn');
            const hModal = document.getElementById('hostModal');
            const hModalTitle = document.getElementById('hostModalClientName');

            if (hClientIdInput) hClientIdInput.value = clientId;

            if (hAddBtn) {
                hAddBtn.style.display = canCreate ? 'flex' : 'none';
            }

            if (!client.hosts) client.hosts = [];

            if (hModalTitle) hModalTitle.textContent = client.name;

            currentHostFilter = 'all';

            // Get filter elements
            const hostFilterBtn = document.getElementById('hostFilterBtn');
            const hostFilterMenu = document.getElementById('hostFilterMenu');

            // Setup filter event listeners
            if (hostFilterBtn && hostFilterMenu) {
                // Remove any existing listeners by cloning
                const newBtn = hostFilterBtn.cloneNode(true);
                hostFilterBtn.parentNode.replaceChild(newBtn, hostFilterBtn);

                // Re-get reference after cloning
                const filterBtn = document.getElementById('hostFilterBtn');
                const filterMenu = document.getElementById('hostFilterMenu');

                filterBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    filterMenu.classList.toggle('show');
                });

                // Prevent menu clicks from closing it
                filterMenu.addEventListener('click', (e) => {
                    e.stopPropagation();
                });

                const items = filterMenu.querySelectorAll('.dropdown-item');
                items.forEach(item => {
                    item.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const value = item.dataset.value;
                        currentHostFilter = value;

                        // Update UI Selection
                        items.forEach(i => i.classList.remove('selected'));
                        item.classList.add('selected');

                        // Update filter button visual state
                        if (value === 'all') {
                            filterBtn.classList.remove('filter-btn-active');
                        } else {
                            filterBtn.classList.add('filter-btn-active');
                        }

                        // Close Menu
                        filterMenu.classList.remove('show');

                        // Re-render
                        const currentClient = clients.find(c => c.id == clientId);
                        if (currentClient) renderHostsList(currentClient);
                    });
                });

            }

            // Reset UI State
            if (hostFilterBtn) hostFilterBtn.classList.remove('filter-btn-active');
            if (hostFilterMenu) {
                hostFilterMenu.querySelectorAll('.dropdown-item').forEach(i => {
                    i.classList.toggle('selected', i.dataset.value === 'all');
                });
            }

            // Helpers
            clearHostForm();
            renderHostsList(client);

            if (hModal) hModal.classList.remove('hidden');

        } catch (e) {
            console.error("Error in openHostData:", e);
        }
    };

    function closeHostModal() {
        hostModal.classList.add('hidden');
    }

    function openHostEntry() {
        clearHostForm();
        hostEntryModalTitle.textContent = 'Novo Servidor';
        const editingHostIndex = document.getElementById('editingHostIndex');
        if (editingHostIndex) editingHostIndex.value = '';
        hostEntryModal.classList.remove('hidden');
    }

    function closeHostEntryModal() {
        hostEntryModal.classList.add('hidden');
        clearHostForm();
    }

    function clearHostForm() {
        const environmentSelect = document.getElementById('hostEnvironmentSelect');
        if (environmentSelect) environmentSelect.value = '';
        const hostNameInput = document.getElementById('hostNameInput');
        if (hostNameInput) hostNameInput.value = '';
        const hostNotesInput = document.getElementById('hostNotesInput');
        if (hostNotesInput) hostNotesInput.value = '';

        const editingHostIndex = document.getElementById('editingHostIndex');
        if (editingHostIndex) editingHostIndex.value = '';

        // Clear credentials
        const hostCredentialList = document.getElementById('hostCredentialList');
        if (hostCredentialList) {
            hostCredentialList.innerHTML = '';
            addHostCredentialField();
        }
    }

    function addHostCredentialField(user = '', password = '', isPrivate = false) {
        const hostCredentialList = document.getElementById('hostCredentialList');
        if (!hostCredentialList) return;

        const div = document.createElement('div');
        div.className = 'credential-field-group';
        div.innerHTML = `
        <div class="credential-fields-container">
                <div class="credential-field-item">
                    <label class="credential-label-text"><i class="fa-solid fa-user" style="color: var(--accent); margin-right: 5px;"></i> Usuário<span class="required">*</span></label>
                    <input type="text" class="server-user-input" placeholder="Digite o usuário" value="${escapeHtml(user)}" required>
                </div>
                <div class="credential-field-item">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                        <label class="credential-label-text"><i class="fa-solid fa-key" style="color: var(--accent); margin-right: 5px;"></i> Senha<span class="required">*</span></label>
                        <div class="checkbox-wrapper-individual" style="margin-left: 10px;">
                            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.75rem; font-weight: 700; color: #ff5252;">
                                <input type="checkbox" class="server-private-check" onchange="window.toggleIndividualPrivacy(this)" ${isPrivate ? 'checked' : ''}>
                                <i class="fa-solid fa-lock" style="font-size: 0.7rem;"></i> INDIVIDUAL
                            </label>
                        </div>
                    </div>
                    <div style="position: relative; width: 100%;">
                        <input type="password" class="server-pass-input" placeholder="Digite a senha" value="${escapeHtml(password)}" required style="padding-right: 35px; width: 100%;">
                        <button type="button" onclick="const i = this.previousElementSibling; i.type = i.type === 'password' ? 'text' : 'password'; this.querySelector('i').className = i.type === 'password' ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash';" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-secondary); cursor: pointer;" tabindex="-1" title="Visualizar Senha">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                    </div>
                </div>
                <button type="button" class="btn-remove-credential" onclick="removeHostCredentialField(this)" title="Remover Credencial" tabindex="-1">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;
        hostCredentialList.appendChild(div);
    }

    window.removeHostCredentialField = function (btn) {
        const hostCredentialList = document.getElementById('hostCredentialList');
        const groups = hostCredentialList.querySelectorAll('.credential-field-group');

        // Validation: Check for hidden credentials
        const clientId = document.getElementById('hostClientId').value;
        const editingIndex = document.getElementById('editingHostIndex').value;
        let hasHidden = false;

        if (clientId && editingIndex !== '') {
            const client = clients.find(c => c.id == clientId);
            const currentUser = JSON.parse(localStorage.getItem('sofis_user') || '{}').username || 'anônimo';
            if (client && client.hosts && client.hosts[editingIndex]) {
                const host = client.hosts[editingIndex];
                if (host.credentials) {
                    hasHidden = host.credentials.some(c => c.is_private && c.owner !== currentUser);
                }
            }
        }

        if (groups.length <= 1 && !hasHidden) {
            showToast('⚠️ É necessário ter pelo menos um usuário e senha.', 'error');
            return;
        }
        btn.closest('.credential-field-group').remove();
    };


    function renderHostsList(client) {
        const list = document.getElementById('hostsList');
        if (!list) return;

        const P = window.Permissions;
        const canEdit = P ? P.can('Servidores', 'can_edit') : false;
        const canDelete = P ? P.can('Servidores', 'can_delete') : false;
        const currentUser = JSON.parse(localStorage.getItem('sofis_user') || '{}').username || 'anônimo';

        const filterValue = currentHostFilter;
        let filtered = client.hosts || [];

        if (filterValue !== 'all') {
            filtered = filtered.filter(h => h.environment === filterValue);
        }

        if (filtered.length === 0) {
            list.innerHTML = `
        <div class="servers-grid-empty">
                    <i class="fa-solid fa-server"></i>
                    <p>${filterValue === 'all' ? 'Nenhum servidor cadastrado ainda.' : 'Nenhum servidor encontrado para este filtro.'}</p>
                </div>
        `;
            return;
        }



        if (filtered.length === 0) {
            list.innerHTML = `
        <div class="servers-grid-empty">
                    <i class="fa-solid fa-server"></i>
                    <p>Nenhum servidor visível para você neste filtro.</p>
                </div>
        `;
            return;
        }

        list.innerHTML = filtered.map((host, index) => {
            const originalIndex = client.hosts.indexOf(host);
            const environmentClass = host.environment === 'homologacao' ? 'homologacao' : 'producao';
            const environmentLabel = host.environment === 'homologacao' ? 'Homologação' : 'Produção';

            const filteredCredentials = (host.credentials || []).filter(cred => {
                if (cred.is_private && cred.owner !== currentUser) return false;
                return true;
            });

            const credentialsHTML = filteredCredentials.length > 0
                ? `
        <div class="server-credentials">
            <div class="server-credentials-title">
                <i class="fa-solid fa-key" style="color: var(--accent);"></i> Credenciais
            </div>
                        ${filteredCredentials.map(cred => {
                    const privacyIcon = cred.is_private ? `<i class="fa-solid fa-lock" style="color: #ff5252; margin-left: 6px;" title="Individual (Privado)"></i>` : '';
                    return `
                            <div class="credential-item">
                                <div class="credential-row">
                                    <span class="credential-label">Usuário: ${privacyIcon}</span>
                                    <span class="credential-value">${escapeHtml(cred.user)}</span>
                                    <button class="btn-copy-small" onclick="copyToClipboard('${escapeHtml(cred.user).replace(/'/g, "\\'")}')" title="Copiar Usuário">
                                        <i class="fa-regular fa-copy"></i>
                                    </button>
                                </div>
                                <div class="credential-row">
                                    <span class="credential-label">Senha:</span>
                                    <span class="credential-value" data-raw="${escapeHtml(cred.password)}">••••••</span>
                                    <button class="btn-copy-small" onclick="togglePassword(this)" title="Visualizar Senha" style="margin-right: 4px;">
                                        <i class="fa-solid fa-eye"></i>
                                    </button>
                                    <button class="btn-copy-small" onclick="copyToClipboard('${escapeHtml(cred.password).replace(/'/g, "\\'")}')" title="Copiar Senha">
                                        <i class="fa-regular fa-copy"></i>
                                    </button>
                                </div>
                            </div>
                        `}).join('')}
                    </div>
        `
                : (host.credentials && host.credentials.length > 0 ? '<div class="server-credentials"><div style="font-size:0.85rem; opacity:0.6; padding:10px;"><em>Registrado com credenciais individuais.</em></div></div>' : '');

            const notesHTML = host.notes
                ? `<div class="server-notes">
                    <div class="server-notes-title"><i class="fa-solid fa-comment-dots" style="color: var(--accent); margin-right: 6px;"></i> Observações</div>
                    <div class="server-notes-content">${escapeHtml(host.notes)}</div>
                   </div>`
                : '';

            const editButton = canEdit ? `
        <button class="btn-icon-card" onclick="editHostRecord('${client.id}', ${originalIndex})" title="Editar">
            <i class="fa-solid fa-pen"></i>
                            </button>` : '';

            const deleteButton = canDelete ? `
        <button class="btn-icon-card btn-danger" onclick="deleteHostRecord('${client.id}', ${originalIndex})" title="Excluir">
            <i class="fa-solid fa-trash"></i>
                            </button>` : '';

            return `
        <div class="server-card">
                    <div class="server-card-header">
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <span class="server-environment ${environmentClass}">${environmentLabel}</span>
                        </div>
                        <div class="server-card-actions">
                            ${editButton}
                            ${deleteButton}
                        </div>
                    </div>
                    <div class="server-info">
                        <div class="server-credentials-title">
                            <i class="fa-solid fa-server" style="color: var(--accent);"></i> Nome do Servidor / IP
                        </div>
                        <div class="server-info-value" style="display: flex; align-items: center; gap: 8px;">
                            <span data-raw="${host.name.replace(/"/g, '&quot;')}">${escapeHtml(host.name)}</span>
                            <button class="btn-copy-small" onclick="const raw = this.previousElementSibling.dataset.raw; copyToClipboard(raw); event.stopPropagation();" title="Copiar Nome/IP">
                                <i class="fa-regular fa-copy"></i>
                            </button>
                        </div>
                    </div>
        ${credentialsHTML}
                    ${notesHTML}
                </div>
        `;
        }).join('');
    }

    async function handleHostSubmit(e) {
        e.preventDefault();
        const hostClientId = document.getElementById('hostClientId');
        const id = hostClientId.value;
        const client = clients.find(c => c.id == id);
        if (!client) return;

        if (!client.hosts) client.hosts = [];

        const environmentSelect = document.getElementById('hostEnvironmentSelect');
        const editingIndex = document.getElementById('editingHostIndex').value;
        const hostNameInput = document.getElementById('hostNameInput');
        const hostNotesInput = document.getElementById('hostNotesInput');
        const hostCredentialList = document.getElementById('hostCredentialList');

        // Collect Credentials
        const credDivs = hostCredentialList.querySelectorAll('.credential-field-group');
        const credentials = [];
        const currentUser = JSON.parse(localStorage.getItem('sofis_user') || '{}').username || 'anônimo';

        for (const div of credDivs) {
            const u = div.querySelector('.server-user-input').value.trim();
            const p = div.querySelector('.server-pass-input').value.trim();
            const isPrivate = div.querySelector('.server-private-check')?.checked || false;

            if (u || p) {
                credentials.push({
                    user: u,
                    password: await window.Security.encrypt(p),
                    is_private: isPrivate,
                    owner: currentUser
                });
            }
        }

        // Preserve hidden private credentials (other users)
        if (editingIndex !== '') {
            const originalHost = client.hosts[parseInt(editingIndex)];
            if (originalHost && originalHost.credentials) {
                const hiddenCredentials = originalHost.credentials.filter(c => c.is_private && c.owner !== currentUser);
                credentials.push(...hiddenCredentials);
            }
        }

        if (!environmentSelect.value) {
            showToast('⚠️ O ambiente é obrigatório.', 'error');
            environmentSelect.focus();
            return;
        }
        if (!hostNameInput.value.trim()) {
            showToast('⚠️ O nome do servidor é obrigatório.', 'error');
            hostNameInput.focus();
            return;
        }

        const hostBefore = (editingIndex !== '') ? JSON.parse(JSON.stringify(client.hosts[parseInt(editingIndex)])) : null;

        const hostRecord = {
            environment: environmentSelect.value,
            name: hostNameInput.value.trim(),
            credentials: credentials,
            notes: hostNotesInput ? hostNotesInput.value.trim() : ''
        };

        if (editingIndex !== '') {
            client.hosts[parseInt(editingIndex)] = hostRecord;
            showToast(`✅ Servidor do cliente "${client.name}" atualizado com sucesso!`, 'success');
        } else {
            client.hosts.push(hostRecord);
            showToast(`✅ Servidor adicionado ao cliente "${client.name}"!`, 'success');
        }

        // Optimistic Render
        renderHostsList(client);
        renderClients(clients);
        closeHostEntryModal();

        try {
            await saveToLocal(client.id);

            const opType = (editingIndex !== '') ? 'EDIÇÃO' : 'CRIAÇÃO';
            const actionLabel = (editingIndex !== '') ? 'Edição de Servidor' : 'Adição de Servidor';
            await registerAuditLog(opType, actionLabel, `Cliente: ${client.name}, Servidor: ${hostRecord.name} `, hostBefore, hostRecord);
        } catch (error) {
            console.error(error);
            showToast('Erro ao salvar servidor: ' + error.message, 'error');
            // Revert changes if needed, but for now we just log
        }
    }

    window.editHostRecord = async (clientId, index) => {
        // Permission Check
        if (window.Permissions && !window.Permissions.can('Servidores', 'can_edit')) {
            showToast('🚫 Acesso negado: Você não tem permissão para editar servidores.', 'error');
            return;
        }

        const client = clients.find(c => c.id == clientId);
        if (!client || !client.hosts || !client.hosts[index]) return;

        const host = client.hosts[index];
        const environmentSelect = document.getElementById('hostEnvironmentSelect');
        const editingHostIndex = document.getElementById('editingHostIndex');
        const hostNameInput = document.getElementById('hostNameInput');
        const hostNotesInput = document.getElementById('hostNotesInput');
        const hostCredentialList = document.getElementById('hostCredentialList');
        const currentUser = JSON.parse(localStorage.getItem('sofis_user') || '{}').username || 'anônimo';

        if (environmentSelect) environmentSelect.value = host.environment;
        if (hostNameInput) hostNameInput.value = host.name;
        if (hostNotesInput) hostNotesInput.value = host.notes || '';
        if (editingHostIndex) editingHostIndex.value = index;

        // Populate credentials
        hostCredentialList.innerHTML = '';
        if (host.credentials && host.credentials.length > 0) {
            for (const cred of host.credentials) {
                // Skip if private and not owner
                if (cred.is_private && cred.owner !== currentUser) continue;

                const decPass = await window.Security.decrypt(cred.password);
                addHostCredentialField(cred.user, decPass, cred.is_private);
            }
        } else {
            addHostCredentialField();
        }

        const hostEntryModalTitle = document.getElementById('hostEntryModalTitle');
        const hostEntryModal = document.getElementById('hostEntryModal');

        if (hostEntryModalTitle) hostEntryModalTitle.textContent = 'Editar Servidor';
        if (hostEntryModal) hostEntryModal.classList.remove('hidden');
    };

    window.deleteHostRecord = async (clientId, index) => {
        // Permission Check
        if (window.Permissions && !window.Permissions.can('Servidores', 'can_delete')) {
            showToast('🚫 Acesso negado: Você não tem permissão para excluir servidores.', 'error');
            return;
        }

        const client = clients.find(c => c.id == clientId);
        if (!client || !client.hosts) return;
        const host = client.hosts[index];

        // Validation: Check if other users own any credentials
        const currentUser = JSON.parse(localStorage.getItem('sofis_user') || '{}').username || 'anônimo';
        const blockingCreds = (host.credentials || []).filter(c => c.owner && c.owner !== currentUser);

        if (blockingCreds.length > 0) {
            const blockingOwners = [...new Set(blockingCreds.map(c => c.owner))];
            await window.handleBlockedDeletion(blockingOwners);
            return;
        }

        const confirmed = await window.showConfirm('Tem certeza que deseja excluir este servidor?', 'Excluir Servidor', 'fa-server');
        if (!confirmed) return;

        const deletedHost = JSON.parse(JSON.stringify(host));
        client.hosts.splice(index, 1);
        await saveToLocal(client.id);
        renderClients(clients);
        renderHostsList(client);
        showToast(`🗑️ Servidor excluído com sucesso!`, 'success');
        await registerAuditLog('EXCLUSÃO', 'Exclusão de Servidor', `Cliente: ${client.name}, Servidor: ${deletedHost.name} `, deletedHost, null);
    };

    // Event Listeners for Host Modals
    if (document.getElementById('closeHostModal'))
        document.getElementById('closeHostModal').onclick = closeHostModal;

    if (document.getElementById('closeHostModalBtn'))
        document.getElementById('closeHostModalBtn').onclick = closeHostModal;

    if (document.getElementById('addHostEntryBtn'))
        document.getElementById('addHostEntryBtn').onclick = openHostEntry;

    if (document.getElementById('addUrlCredentialBtn'))
        document.getElementById('addUrlCredentialBtn').onclick = () => addUrlCredentialField();

    if (document.getElementById('addExecCredentialBtn'))
        document.getElementById('addExecCredentialBtn').onclick = () => addExecCredentialField();

    if (document.getElementById('closeHostEntryModal'))
        document.getElementById('closeHostEntryModal').onclick = closeHostEntryModal;

    if (document.getElementById('cancelHostEntryBtn'))
        document.getElementById('cancelHostEntryBtn').onclick = closeHostEntryModal;

    if (document.getElementById('addHostCredentialBtn'))
        document.getElementById('addHostCredentialBtn').onclick = () => addHostCredentialField();

    if (document.getElementById('addVpnCredentialBtn'))
        document.getElementById('addVpnCredentialBtn').onclick = () => addVpnCredentialField();

    if (document.getElementById('hostForm'))
        document.getElementById('hostForm').onsubmit = handleHostSubmit;

    // --- ISBT 128 Functions ---
    window.openIsbtModal = (clientId) => {
        const client = clients.find(c => c.id == clientId);
        if (!client) return;

        const hasEditPerm = window.Permissions ? window.Permissions.can('Gestão de Clientes', 'can_edit') : true;

        document.getElementById('isbtClientId').value = clientId;
        document.getElementById('isbtClientName').textContent = client.name;
        document.getElementById('isbtCodeInput').value = client.isbt_code || '';

        const hasPoint = client.has_collection_point || false;
        const check = document.getElementById('isbtCollectionPointCheck');
        check.checked = hasPoint;
        document.getElementById('isbtCollectionPointInput').value = client.isbt_collection_point || '';

        window.toggleIsbtCollectionPoint();

        // Disable inputs if no permission? Or just let them see? 
        // Assuming edit permission is needed to SAVE, but maybe everyone can view?
        // For now, leaving enabled as the Save button is the gatekeeper if needed, 
        // but typically readonly forms are better. I'll stick to basic.

        document.getElementById('isbtModal').classList.remove('hidden');
    };

    window.toggleIsbtCollectionPoint = () => {
        const check = document.getElementById('isbtCollectionPointCheck');
        const group = document.getElementById('isbtCollectionPointGroup');
        if (check.checked) {
            group.classList.remove('hidden');
        } else {
            group.classList.add('hidden');
        }
    };

    window.submitIsbtForm = async () => {
        // Permissions Check (using Client Edit permission as proxy)
        if (window.Permissions && !window.Permissions.can('Gestão de Clientes', 'can_edit')) {
            showToast('🚫 Sem permissão para editar dados do cliente.', 'error');
            return;
        }

        const clientId = document.getElementById('isbtClientId').value;
        const client = clients.find(c => c.id == clientId);
        if (!client) return;

        const oldData = {
            isbt_code: client.isbt_code,
            has_collection_point: client.has_collection_point,
            isbt_collection_point: client.isbt_collection_point
        };

        client.isbt_code = document.getElementById('isbtCodeInput').value;
        client.has_collection_point = document.getElementById('isbtCollectionPointCheck').checked;
        client.isbt_collection_point = client.has_collection_point ? document.getElementById('isbtCollectionPointInput').value : '';

        await saveToLocal(client.id);

        // Re-render row to update button status
        const row = document.getElementById(`client-row-${clientId}`);
        if (row) {
            const newRow = createClientRow(client);
            row.replaceWith(newRow);
        }

        document.getElementById('isbtModal').classList.add('hidden');
        showToast('✅ Dados ISBT salvos com sucesso!', 'success');

        await registerAuditLog('EDIÇÃO', 'Atualização ISBT 128', `Cliente: ${client.name}`, oldData, {
            isbt_code: client.isbt_code,
            has_collection_point: client.has_collection_point,
            isbt_collection_point: client.isbt_collection_point
        });
    };

});
console.log("✅ APP.JS FULLY PARSED AND LOADED");
