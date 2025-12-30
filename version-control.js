// ===========================================
// MODULE: VERSION CONTROL - FULL PRECISE v7.0
// ===========================================

(function () {
    console.log("🚀 [SOFIS] Version Control Premium Module v7.0 Loaded");

    // Internal state
    let versionControls = [];
    window.currentVersionFilter = 'all';
    let sofis_isUpdating = false;
    let sofis_isRendering = false;
    let sofis_isSaving = false;

    // Helper functions
    const utils = {
        escapeHtml: (text) => {
            if (!text) return '';
            return text.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
        },
        formatDate: (dateString) => {
            if (!dateString) return '-';
            try {
                // Adjust for UTC/Local mismatch
                const date = new Date(dateString);
                return date.toLocaleDateString('pt-BR');
            } catch (e) { return '-'; }
        },
        getStatus: (updatedAt) => {
            if (!updatedAt) return 'outdated';
            const diffDays = Math.floor((new Date() - new Date(updatedAt)) / (1000 * 60 * 60 * 24));
            if (diffDays <= 30) return 'recent';
            if (diffDays <= 90) return 'warning';
            return 'outdated';
        },
        getTimeInfo: (updatedAt) => {
            if (!updatedAt) return 'Nunca atualizado';
            const lastUpdate = new Date(updatedAt);
            const now = new Date();
            const diffTime = Math.abs(now - lastUpdate);
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays === 0) return 'Atualizado hoje';
            if (diffDays === 1) return 'Atualizado ontem';
            return `Atualizado há ${diffDays} dias`;
        }
    };

    // Core Logic
    async function loadVersionControls() {
        if (sofis_isUpdating) return;
        sofis_isUpdating = true;

        try {
            if (!window.supabaseClient) return;

            const { data, error } = await window.supabaseClient
                .from('version_controls')
                .select(`*, clients (id, name)`)
                .order('updated_at', { ascending: false });

            if (error) throw error;
            versionControls = data || [];
            window.versionControls = versionControls;

            renderVersionControls();
        } catch (err) {
            console.error('❌ Error loadVersionControls:', err);
        } finally {
            sofis_isUpdating = false;
        }
    }

    function renderVersionControls() {
        if (sofis_isRendering) return;
        sofis_isRendering = true;

        try {
            const list = document.getElementById('versionList');
            if (!list) return;

            let filtered = versionControls;
            const searchInput = document.getElementById('versionSearchInput');
            const search = searchInput ? searchInput.value.toLowerCase() : '';

            if (search) {
                filtered = filtered.filter(v =>
                    (v.clients?.name || '').toLowerCase().includes(search) ||
                    (v.system || '').toLowerCase().includes(search)
                );
            }

            if (window.currentVersionFilter !== 'all') {
                filtered = filtered.filter(v => utils.getStatus(v.updated_at) === window.currentVersionFilter);
            }

            list.innerHTML = '';
            if (filtered.length === 0) {
                list.innerHTML = '<div class="version-empty-state"><p>Nenhuma versão encontrada</p></div>';
                return;
            }

            // Grouping by client
            const grouped = {};
            filtered.forEach(v => {
                const name = v.clients?.name || 'Desconhecido';
                if (!grouped[name]) grouped[name] = { id: v.client_id, name, versionsMap: {} };

                // Keep only the most recent version for each [system + environment] combination
                const key = `${v.system}_${v.environment}`;
                const existing = grouped[name].versionsMap[key];

                if (!existing || new Date(v.updated_at) > new Date(existing.updated_at)) {
                    grouped[name].versionsMap[key] = v;
                }
            });

            // Sort by client name
            Object.values(grouped).sort((a, b) => a.name.localeCompare(b.name)).forEach(group => {
                // Convert Map back to array for rendering
                group.versions = Object.values(group.versionsMap);
                list.appendChild(createClientGroupCard(group));
            });
        } finally {
            sofis_isRendering = false;
        }
    }

    function createClientGroupCard(group) {
        const card = document.createElement('div');
        card.className = 'client-version-group-card';

        // General status of the card based on items
        let overallStatus = 'recent';
        group.versions.forEach(v => {
            const s = utils.getStatus(v.updated_at);
            if (s === 'outdated') overallStatus = 'outdated';
            else if (s === 'warning' && overallStatus !== 'outdated') overallStatus = 'warning';
        });

        // Building row HTML precisely as the reference image
        const versionsHtml = group.versions.map(v => {
            const status = utils.getStatus(v.updated_at);
            const timeInfo = utils.getTimeInfo(v.updated_at);

            return `
                <div class="version-item-row status-${status}" data-environment="${v.environment}">
                    <div class="version-item-main">
                        <!-- Left Side: System info -->
                        <div class="version-system-info">
                            <span class="version-system-name">${utils.escapeHtml(v.system)}</span>
                            <span class="environment-badge-small ${v.environment}">${v.environment.toUpperCase()}</span>
                        </div>
                        
                        <!-- Right Side Data: Version number and meta -->
                        <div class="version-display-wrapper">
                            <div class="version-number-display">
                                ${utils.escapeHtml(v.version)}
                                ${v.has_alert ? `<i class="fa-solid fa-bell client-note-indicator" onclick="window.openVersionNotes('${v.id}')" title="Possui observações importantes" style="margin-left: 10px; font-size: 0.8rem;"></i>` : ''}
                            </div>
                            <div class="version-small-meta">
                                <div class="version-meta-label">Data da última atualização: ${utils.formatDate(v.updated_at)}</div>
                                <div class="version-meta-label">Tempo atualizado: ${timeInfo}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="version-actions">
                        <button class="btn-icon-small" title="Editar" onclick="window.editVersion('${v.id}')">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        card.innerHTML = `
            <div class="client-group-header status-${overallStatus}">
                <div class="client-group-title">
                    <h3 onclick="window.openClientInteraction('${group.id}', '${utils.escapeHtml(group.name)}')" style="cursor:pointer" title="Clique para ver opções do cliente">${utils.escapeHtml(group.name)}</h3>
                </div>
                <div class="client-header-actions">
                    <button class="btn-sm btn-secondary" onclick="window.openClientVersionsHistory('${group.id}')">
                        <i class="fa-solid fa-history"></i> Histórico
                    </button>
                    <button class="btn-sm btn-secondary" onclick="window.prefillClientVersion('${group.id}', '${utils.escapeHtml(group.name)}')">
                        <i class="fa-solid fa-plus"></i> Sistema
                    </button>
                    
                    <!-- Card Level Filter -->
                    <div class="card-filter-dropdown">
                        <button class="btn-sm card-env-toggle" onclick="window.toggleCardFilterMenu(this)">
                            <i class="fa-solid fa-filter"></i>
                        </button>
                        <div class="card-filter-menu hidden">
                            <div class="filter-menu-item active" onclick="window.applyCardEnvFilter(this, 'all')">
                                <i class="fa-solid fa-layer-group"></i> <span>Todos</span>
                            </div>
                            <div class="filter-menu-item" onclick="window.applyCardEnvFilter(this, 'producao')">
                                <i class="fa-solid fa-server"></i> <span>Produção</span>
                            </div>
                            <div class="filter-menu-item" onclick="window.applyCardEnvFilter(this, 'homologacao')">
                                <i class="fa-solid fa-vial"></i> <span>Homologação</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="client-group-body">${versionsHtml}</div>
        `;
        return card;
    }

    async function handleVersionSubmit(e) {
        if (e && e.preventDefault) e.preventDefault();
        if (sofis_isSaving) return;
        sofis_isSaving = true;

        try {
            const fields = {
                id: document.getElementById('versionId').value,
                clientId: document.getElementById('versionClientSelect').value,
                env: document.getElementById('versionEnvironmentSelect').value,
                sys: document.getElementById('versionSystemSelect').value,
                ver: document.getElementById('versionNumberInput').value,
                date: document.getElementById('versionDateInput').value,
                alert: document.getElementById('versionAlertCheck').checked,
                notes: document.getElementById('versionNotesInput').value
            };

            if (!fields.clientId) {
                if (window.showToast) window.showToast('Selecione um cliente', 'warning');
                return;
            }

            const payload = {
                client_id: fields.clientId,
                environment: fields.env,
                system: fields.sys,
                version: fields.ver,
                has_alert: fields.alert,
                notes: fields.notes,
                updated_at: fields.date ? `${fields.date}T12:00:00+00:00` : new Date().toISOString()
            };

            let result;
            if (fields.id) {
                result = await window.supabaseClient.from('version_controls').update(payload).eq('id', fields.id);
            } else {
                result = await window.supabaseClient.from('version_controls').insert([payload]).select();
                if (result.data && result.data[0]) {
                    await logHistory(result.data[0].id, null, fields.ver, 'Registro Inicial');
                }
            }

            if (result.error) throw result.error;

            if (window.showToast) window.showToast('Concluído com sucesso!');
            window.closeVersionModal();

            // Refresh with clear context
            setTimeout(() => {
                loadVersionControls();
            }, 300);

        } catch (err) {
            console.error('❌ handleVersionSubmit Error:', err);
            if (window.showToast) window.showToast('Falha ao salvar dados', 'error');
        } finally {
            sofis_isSaving = false;
        }
    }

    async function logHistory(vcId, oldV, newV, notes) {
        try {
            const user = JSON.parse(localStorage.getItem('sofis_user') || '{}').username || 'Sistema';
            await window.supabaseClient.from('version_history').insert([{
                version_control_id: vcId,
                previous_version: oldV,
                new_version: newV,
                updated_by: user,
                notes: notes || ''
            }]);
        } catch (e) {
            console.warn('History log failed skipped');
        }
    }

    // EXPORTS
    window.loadVersionControls = loadVersionControls;
    window.renderVersionControls = renderVersionControls;
    window.handleVersionSubmit = handleVersionSubmit;

    window.editVersion = (id) => {
        const modal = document.getElementById('versionModal');
        if (!modal) return;
        document.getElementById('versionForm').reset();
        document.getElementById('versionId').value = id;

        const v = versionControls.find(x => x.id === id);
        if (v) {
            document.getElementById('versionClientSelect').value = v.client_id;
            document.getElementById('versionClientInput').value = v.clients?.name || '';
            document.getElementById('versionEnvironmentSelect').value = v.environment;
            document.getElementById('versionSystemSelect').value = v.system;
            document.getElementById('versionNumberInput').value = v.version;
            if (v.updated_at) document.getElementById('versionDateInput').value = v.updated_at.split('T')[0];
            const check = document.getElementById('versionAlertCheck');
            check.checked = !!v.has_alert;
            const notes = document.getElementById('versionNotesInput');
            notes.value = v.notes || '';
            notes.disabled = !check.checked;
        }
        modal.classList.remove('hidden');
    };

    window.closeVersionModal = () => {
        const m = document.getElementById('versionModal');
        if (m) m.classList.add('hidden');
    };

    window.submitVersionForm = () => {
        const f = document.getElementById('versionForm');
        if (f && f.checkValidity()) {
            setTimeout(() => handleVersionSubmit(null), 0);
        } else if (f) {
            f.reportValidity();
        }
    };

    window.prefillClientVersion = (id, name) => {
        const modal = document.getElementById('versionModal');
        if (!modal) return;
        document.getElementById('versionForm').reset();
        document.getElementById('versionId').value = '';
        setTimeout(() => {
            document.getElementById('versionClientSelect').value = id;
            document.getElementById('versionClientInput').value = name;
            modal.classList.remove('hidden');
        }, 50);
    };

    window.openVersionNotes = (id) => {
        const v = versionControls.find(x => x.id === id);
        if (!v || !v.notes) return;

        const modal = document.getElementById('versionNotesModal');
        if (!modal) return;

        const contentBox = document.getElementById('versionNotesBox');
        const titleEl = document.getElementById('versionNotesTitle');

        const clientName = v.clients?.name || 'Cliente';
        titleEl.innerHTML = `Observações: <span style="color:var(--accent)">${utils.escapeHtml(clientName)}</span> <small style="opacity:0.6; font-size:0.8em">(${v.system} ${v.version})</small>`;
        contentBox.textContent = v.notes;

        modal.classList.remove('hidden');
    };

    window.closeVersionNotesModal = () => {
        const m = document.getElementById('versionNotesModal');
        if (m) m.classList.add('hidden');
    };

    // Filter Menu Logic
    window.toggleCardFilterMenu = (btn) => {
        document.querySelectorAll('.card-filter-menu').forEach(m => {
            if (m !== btn.nextElementSibling) m.classList.add('hidden');
        });
        btn.nextElementSibling.classList.toggle('hidden');
    };

    window.applyCardEnvFilter = (item, env) => {
        const card = item.closest('.client-version-group-card');
        const rows = card.querySelectorAll('.version-item-row');
        const items = item.parentNode.querySelectorAll('.filter-menu-item');

        items.forEach(i => i.classList.remove('active'));
        item.classList.add('active');

        rows.forEach(row => {
            if (env === 'all' || row.dataset.environment === env) {
                row.style.display = 'flex';
            } else {
                row.style.display = 'none';
            }
        });
        item.parentNode.classList.add('hidden');
    };

    // Global listeners
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.card-filter-dropdown')) {
            document.querySelectorAll('.card-filter-menu').forEach(m => m.classList.add('hidden'));
        }
    });

    window.setupVersionControlFilters = () => {
        const sInput = document.getElementById('versionSearchInput');
        if (sInput) sInput.oninput = () => renderVersionControls();

        document.querySelectorAll('[data-version-filter]').forEach(b => {
            b.onclick = () => {
                document.querySelectorAll('[data-version-filter]').forEach(x => x.classList.remove('active'));
                b.classList.add('active');
                window.currentVersionFilter = b.dataset.versionFilter;
                renderVersionControls();
            };
        });

        const alertCheck = document.getElementById('versionAlertCheck');
        if (alertCheck) {
            alertCheck.onchange = () => {
                document.getElementById('versionNotesInput').disabled = !alertCheck.checked;
            };
        }
    };

    window.openClientVersionsHistory = async (clientId) => {
        const modal = document.getElementById('versionHistoryModal');
        if (!modal) return;

        const vEntry = versionControls.find(v => v.client_id === clientId);
        const clientName = vEntry?.clients?.name || 'Cliente';

        document.getElementById('versionHistoryTitle').innerHTML = `Histórico: <span style="color:var(--accent)">${utils.escapeHtml(clientName)}</span>`;
        modal.classList.remove('hidden');

        const list = document.getElementById('versionHistoryList');
        list.innerHTML = '<div style="text-align:center; padding:20px; color:var(--text-secondary)">Carregando...</div>';

        try {
            const { data } = await window.supabaseClient.from('version_history')
                .select('*, version_controls(system)')
                .in('version_control_id', versionControls.filter(vc => vc.client_id === clientId).map(vc => vc.id))
                .order('created_at', { ascending: false });

            list.innerHTML = (data || []).map(h => `
                <div style="background:rgba(0,0,0,0.2); padding:10px; border-radius:8px; margin-bottom:10px; border-left:3px solid var(--accent)">
                    <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                        <strong style="color:var(--accent)">${h.version_controls?.system}</strong>
                        <small style="opacity:0.6">${new Date(h.created_at).toLocaleDateString('pt-BR')} ${new Date(h.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</small>
                    </div>
                    <div style="font-size:0.9em; margin:5px 0;">Versão: ${h.previous_version || 'N/A'} <i class="fa-solid fa-arrow-right" style="opacity:0.5; font-size:0.8em"></i> ${h.new_version}</div>
                    <div style="font-size:0.8em; opacity:0.7; font-style:italic;">Por: ${h.updated_by}</div>
                    ${h.notes ? `<div style="font-size:0.85em; margin-top:5px; padding-top:5px; border-top:1px solid rgba(255,255,255,0.05)">${utils.escapeHtml(h.notes)}</div>` : ''}
                </div>
            `).join('') || '<div style="text-align:center; opacity:0.5; padding:20px;">Nenhum histórico disponível</div>';
        } catch (e) {
            list.innerHTML = '<div style="color:var(--danger); text-align:center;">Erro ao carregar dados.</div>';
        }
    };

    window.closeVersionHistoryModal = () => {
        document.getElementById('versionHistoryModal').classList.add('hidden');
    };

})();
