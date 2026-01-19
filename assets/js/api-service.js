// api-service.js
// Substitui supabase-client.js para arquitetura Local PHP/Apache/Postgres

const API_BASE = 'api';

async function request(endpoint, options = {}) {
    const url = `${API_BASE}/${endpoint}`;
    try {
        const res = await fetch(url, options);
        // Helper para ler JSON com segurança ou obter texto se falhar
        const text = await res.text();

        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error(`[API] Non-JSON response from ${url}:`, text);
            // Provavelmente um erro fatal do PHP ou aviso impresso como HTML
            throw new Error(`Erro no servidor (Resposta inválida). Verifique o console.`);
        }

        if (!res.ok) {
            throw new Error(data.error || data.message || `Erro ${res.status}: ${res.statusText}`);
        }

        return data;
    } catch (err) {
        console.error(`[API] Network/Logic Error:`, err);
        throw err;
    }
}

const api = {
    logs: {
        async list(filters = {}) {
            const params = new URLSearchParams(filters).toString();
            return await request(`audit.php?${params}`);
        },
        async create(log) {
            return await request('audit.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(log)
            });
        }
    },
    permissions: {
        async list(role) {
            return await request(`permissions.php?role=${encodeURIComponent(role)}`);
        },
        async update(permissions) {
            return await request('permissions.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(permissions)
            });
        }
    },
    auth: {
        async signIn(username, password) {
            return await request('auth.php?action=login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
        },
        async signOut() {
            try {
                const userStr = localStorage.getItem('sofis_user');
                if (userStr) {
                    const u = JSON.parse(userStr);
                    // Tentar logar o logout
                    if (api && api.logs) {
                        await api.logs.create({
                            action_type: 'SECURITY',
                            action: 'Logout',
                            details: `Logout efetuado: ${u.full_name || u.username} (@${u.username})`,
                            user_id: u.id,
                            target_id: null
                        });
                    }
                }
            } catch (e) {
                console.error('Erro ao registrar log de logout:', e);
            }

            await fetch(`${API_BASE}/auth.php?action=logout`);
            localStorage.removeItem('sofis_user');
            window.location.href = 'login.html';
        },
        async checkSession() {
            try {
                // Usamos fetch nativo aqui para lidar com casos específicos de 401/403 sem gerar alerta de erro
                const res = await fetch(`${API_BASE}/auth.php?action=check`);
                const text = await res.text();
                try {
                    return JSON.parse(text);
                } catch {
                    return { authenticated: false };
                }
            } catch (e) {
                return { authenticated: false };
            }
        }
    },
    clients: {
        async list() {
            return await request('clients.php');
        },
        async create(client) {
            return await request('clients.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(client)
            });
        },
        async update(id, client) {
            return await request(`clients.php?id=${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(client)
            });
        },
        async delete(id) {
            return await request(`clients.php?id=${id}`, {
                method: 'DELETE'
            });
        }
    },
    users: {
        async list() {
            return await request('users.php');
        },
        async create(user) {
            return await request('users.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(user)
            });
        },
        async update(id, user) {
            return await request(`users.php?id=${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(user)
            });
        },
        async delete(id) {
            return await request(`users.php?id=${id}`, {
                method: 'DELETE'
            });
        }
    },
    versions: {
        async list() {
            return await request('versions.php');
        },
        async history(clientId) {
            return await request(`versions.php?action=history&client_id=${clientId}`);
        },
        async create(version) {
            return await request('versions.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(version)
            });
        },
        async update(id, version) {
            return await request(`versions.php?id=${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(version)
            });
        },
        async delete(id, smartContext = null) {
            let endpoint = `versions.php?id=${id}`;
            if (smartContext) {
                const params = new URLSearchParams({
                    smart: 'true',
                    client_id: smartContext.clientId,
                    system: smartContext.system,
                    environment: smartContext.environment,
                    version: smartContext.version
                });
                endpoint = `versions.php?${params.toString()}`;
            }
            return await request(endpoint, { method: 'DELETE' });
        }
    },
    products: {
        async list() {
            return await request('products.php');
        },
        async create(product) {
            return await request('products.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(product)
            });
        },
        async update(id, product) {
            return await request(`products.php?id=${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(product)
            });
        },
        async delete(id) {
            return await request(`products.php?id=${id}`, {
                method: 'DELETE'
            });
        }
    },
    favorites: {
        async list(username) {
            return await request(`favorites.php?username=${encodeURIComponent(username)}`);
        },
        async add(username, clientId) {
            return await request('favorites.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, client_id: clientId })
            });
        },
        async remove(username, clientId) {
            return await request(`favorites.php?username=${encodeURIComponent(username)}&client_id=${clientId}`, {
                method: 'DELETE'
            });
        }
    },
    roles: {
        async list() {
            return await request('roles.php');
        },
        async create(role) {
            return await request('roles.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(role)
            });
        },
        async update(oldName, newName) {
            return await request(`roles.php?name=${encodeURIComponent(oldName)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName })
            });
        },
        async delete(name) {
            return await request(`roles.php?name=${encodeURIComponent(name)}`, {
                method: 'DELETE'
            });
        },
        async copy(from, to) {
            return await request('roles.php?action=copy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ from, to })
            });
        }
    }
};

window.api = api;
// Shim de Compatibilidade
window.supabaseClient = {
    from: () => { throw new Error("Supabase foi removido. Use window.api em vez disso."); }
};
