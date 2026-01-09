// api-service.js
// Replaces supabase-client.js for Local PHP/Apache/Postgres architecture

const API_BASE = 'api';

const api = {
    logs: {
        async list(filters = {}) {
            const params = new URLSearchParams(filters).toString();
            const res = await fetch(`${API_BASE}/audit.php?${params}`);
            if (!res.ok) throw new Error('Failed to fetch logs');
            return await res.json();
        },
        async create(log) {
            await fetch(`${API_BASE}/audit.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(log)
            });
        }
    },
    permissions: {
        async list(role) {
            const res = await fetch(`${API_BASE}/permissions.php?role=${encodeURIComponent(role)}`);
            if (!res.ok) throw new Error('Failed to fetch permissions');
            return await res.json();
        },
        async update(permissions) {
            const res = await fetch(`${API_BASE}/permissions.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(permissions)
            });
            if (!res.ok) throw new Error('Failed to update permissions');
            return await res.json();
        }
    },
    auth: {
        async signIn(username, password) {
            const res = await fetch(`${API_BASE}/auth.php?action=login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Login failed');
            return data;
        },
        async signOut() {
            await fetch(`${API_BASE}/auth.php?action=logout`);
            localStorage.removeItem('sofis_user');
            window.location.href = 'login.html';
        },
        async checkSession() {
            try {
                const res = await fetch(`${API_BASE}/auth.php?action=check`);
                const data = await res.json();
                return data;
            } catch (e) {
                return { authenticated: false };
            }
        }
    },
    clients: {
        async list() {
            const res = await fetch(`${API_BASE}/clients.php`);
            if (!res.ok) throw new Error('Failed to fetch clients');
            return await res.json();
        },
        async create(client) {
            const res = await fetch(`${API_BASE}/clients.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(client)
            });
            if (!res.ok) throw new Error('Failed to create client');
            return await res.json();
        },
        async update(id, client) {
            const res = await fetch(`${API_BASE}/clients.php?id=${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(client)
            });
            if (!res.ok) throw new Error('Failed to update client');
            return await res.json();
        },
        async delete(id) {
            const res = await fetch(`${API_BASE}/clients.php?id=${id}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error('Failed to delete client');
            return await res.json();
        }
    },
    users: {
        async list() {
            const res = await fetch(`${API_BASE}/users.php`);
            if (!res.ok) throw new Error('Failed to fetch users');
            return await res.json();
        },
        async create(user) {
            const res = await fetch(`${API_BASE}/users.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(user)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to create user');
            return data;
        },
        async update(id, user) {
            const res = await fetch(`${API_BASE}/users.php?id=${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(user)
            });
            if (!res.ok) throw new Error('Failed to update user');
            return await res.json();
        },
        async delete(id) {
            const res = await fetch(`${API_BASE}/users.php?id=${id}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error('Failed to delete user');
            return await res.json();
        }
    },
    versions: {
        async list() {
            const res = await fetch(`${API_BASE}/versions.php`);
            if (!res.ok) throw new Error('Failed to fetch versions');
            return await res.json();
        },
        async history(clientId) {
            const res = await fetch(`${API_BASE}/versions.php?action=history&client_id=${clientId}`);
            if (!res.ok) throw new Error('Failed to fetch history');
            return await res.json();
        },
        async create(version) {
            const res = await fetch(`${API_BASE}/versions.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(version)
            });
            if (!res.ok) throw new Error('Failed to create version');
            return await res.json();
        },
        async update(id, version) {
            const res = await fetch(`${API_BASE}/versions.php?id=${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(version)
            });
            if (!res.ok) throw new Error('Failed to update version');
            return await res.json();
        },
        async delete(id, smartContext = null) {
            let url = `${API_BASE}/versions.php?id=${id}`;
            if (smartContext) {
                const params = new URLSearchParams({
                    smart: 'true',
                    client_id: smartContext.clientId,
                    system: smartContext.system,
                    environment: smartContext.environment,
                    version: smartContext.version
                });
                url = `${API_BASE}/versions.php?${params.toString()}`;
            }

            const res = await fetch(url, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete version');
            return await res.json();
        }
    },
    products: {
        async list() {
            const res = await fetch(`${API_BASE}/products.php`);
            return await res.json();
        },
        async create(product) {
            const res = await fetch(`${API_BASE}/products.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(product)
            });
            if (!res.ok) throw new Error('Failed to create product');
            return await res.json();
        },
        async update(id, product) {
            const res = await fetch(`${API_BASE}/products.php?id=${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(product)
            });
            if (!res.ok) throw new Error('Failed to update product');
            return await res.json();
        },
        async delete(id) {
            const res = await fetch(`${API_BASE}/products.php?id=${id}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error('Failed to delete product');
            return await res.json();
        }
    },
    favorites: {
        async list(username) {
            const res = await fetch(`${API_BASE}/favorites.php?username=${encodeURIComponent(username)}`);
            if (!res.ok) throw new Error('Failed to fetch favorites');
            return await res.json();
        },
        async add(username, clientId) {
            const res = await fetch(`${API_BASE}/favorites.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, client_id: clientId })
            });
            if (!res.ok) throw new Error('Failed to add favorite');
            return await res.json();
        },
        async remove(username, clientId) {
            const res = await fetch(`${API_BASE}/favorites.php?username=${encodeURIComponent(username)}&client_id=${clientId}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error('Failed to remove favorite');
            return await res.json();
        }
    }
};

window.api = api;
// Compatibility Shim
window.supabaseClient = {
    from: () => { throw new Error("Supabase is removed. Use window.api instead."); }
};
