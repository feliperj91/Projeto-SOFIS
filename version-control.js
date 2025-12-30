// ===========================================
// MODULE: VERSION CONTROL - SAFE v6.1
// ===========================================

(function () {
    console.log("🚀 [SOFIS] Version Control Safe Module v6.1 Loaded");

    // Internal state
    let versionControls = [];
    window.currentVersionFilter = 'all';
    let currentHistoryClientId = null;

    // Safety guards
    let callDepth = 0;
    let isUpdating = false;
    let isRendering = false;
    let isSaving = false;

    function checkRecursion(name) {
        callDepth++;
        if (callDepth > 10) {
            console.error(`🛑 [SOFIS] Critical recursion detected in ${name}. Aborting.`);
            return false;
        }
        return true;
    }

    function resetRecursion() {
        callDepth = 0;
    }

    // Helper functions
    const utils = {
        escapeHtml: (text) => {
            if (!text) return '';
            return text.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
        },
        formatDate: (dateString) => {
            if (!dateString) return '-';
            try { return new Date(dateString).toLocaleDateString('pt-BR'); } catch (e) { return '-'; }
        },
        getStatus: (updatedAt) => {
            if (!updatedAt) return 'outdated';
            const diffDays = Math.floor((new Date() - new Date(updatedAt)) / (1000 * 60 * 60 * 24));
            if (diffDays <= 30) return 'recent';
            if (diffDays <= 90) return 'warning';
            return 'outdated';
        }
    };

    // Core Logic
    async function internalLoadControls() {
        if (isUpdating) return;
        if (!checkRecursion('loadControls')) return;
        isUpdating = true;

        try {
            if (!window.supabaseClient) throw new Error("Supabase não disponível");

            const { data, error } = await window.supabaseClient
                .from('version_controls')
                .select(`*, clients (id, name)`)
                .order('updated_at', { ascending: false });

            if (error) throw error;
            versionControls = data || [];
            window.versionControls = versionControls;

            // Render on next tick to be safe
            setTimeout(() => {
                internalRenderControls();
            }, 0);

        } catch (err) {
            console.error('❌ Erro internalLoadControls:', err);
        } finally {
            isUpdating = false;
            resetRecursion();
        }
    }

    function internalRenderControls() {
        if (isRendering) return;
        if (!checkRecursion('renderControls')) return;
        isRendering = true;

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

            // Grouping
            const grouped = {};
            filtered.forEach(v => {
                const name = v.clients?.name || 'Desconhecido';
                if (!grouped[name]) grouped[name] = { id: v.client_id, name, versions: [] };
                grouped[name].versions.push(v);
            });

            Object.values(grouped).sort((a, b) => a.name.localeCompare(b.name)).forEach(group => {
                list.appendChild(createGroupCard(group));
            });
        } finally {
            isRendering = false;
            resetRecursion();
        }
    }

    function createGroupCard(group) {
        const card = document.createElement('div');
        card.className = 'client-version-group-card';

        // Status determination
        let cardStatus = 'recent';
        group.versions.forEach(v => {
            const s = utils.getStatus(v.updated_at);
            if (s === 'outdated') cardStatus = 'outdated';
            else if (s === 'warning' && cardStatus !== 'outdated') cardStatus = 'warning';
        });

        const vHtml = group.versions.map(v => `
            <div class="version-item-row status-${utils.getStatus(v.updated_at)}" data-environment="${v.environment}">
                <div class="version-item-main">
                    <span class="version-system-name">${utils.escapeHtml(v.system)}</span>
                    <span class="environment-badge-small ${v.environment}">${v.environment.toUpperCase()}</span>
                    <div class="version-number-display">${utils.escapeHtml(v.version)}</div>
                    <div class="version-small-meta">Data: ${utils.formatDate(v.updated_at)}</div>
                </div>
                <div class="version-actions">
                    <button class="btn-icon-small" title="Editar" onclick="window.editVersion('${v.id}')"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn-icon-small" title="Histórico" onclick="window.openClientVersionsHistory('${group.id}')"><i class="fa-solid fa-history"></i></button>
                </div>
            </div>
        `).join('');

        card.innerHTML = `
            <div class="client-group-header status-${cardStatus}">
                <h3 onclick="window.openClientInteraction('${group.id}', '${utils.escapeHtml(group.name)}')" style="cursor:pointer">${utils.escapeHtml(group.name)}</h3>
                <div class="client-header-actions">
                    <button class="btn-secondary" onclick="window.prefillClientVersion('${group.id}', '${utils.escapeHtml(group.name)}')"><i class="fa-solid fa-plus"></i></button>
                </div>
            </div>
            <div class="client-group-body">${vHtml}</div>
        `;
        return card;
    }

    async function internalHandleSubmit(e) {
        if (e && e.preventDefault) e.preventDefault();
        if (isSaving) return;
        isSaving = true;

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
                    await logHistory(result.data[0].id, null, fields.ver, 'Inicial');
                }
            }

            if (result.error) throw result.error;

            if (window.showToast) window.showToast('Versão salva com sucesso!');
            window.closeVersionModal();

            // Refresh
            setTimeout(() => {
                internalLoadControls();
            }, 500);

        } catch (err) {
            console.error('❌ Erro internalHandleSubmit:', err);
            if (window.showToast) window.showToast('Erro ao salvar versão', 'error');
        } finally {
            isSaving = false;
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
                notes
            }]);
        } catch (e) {
            console.warn('Erro ao registrar histórico:', e);
        }
    }

    // Modal UI Functions
    function openModal(id = null) {
        const modal = document.getElementById('versionModal');
        if (!modal) return;

        document.getElementById('versionForm').reset();
        document.getElementById('versionId').value = id || '';
        document.getElementById('versionNotesInput').disabled = true;

        if (id && versionControls) {
            const v = versionControls.find(x => x.id === id);
            if (v) {
                document.getElementById('versionClientSelect').value = v.client_id;
                document.getElementById('versionClientInput').value = v.clients?.name || '';
                document.getElementById('versionEnvironmentSelect').value = v.environment;
                document.getElementById('versionSystemSelect').value = v.system;
                document.getElementById('versionNumberInput').value = v.version;
                if (v.updated_at) document.getElementById('versionDateInput').value = v.updated_at.split('T')[0];
                document.getElementById('versionAlertCheck').checked = v.has_alert;
                document.getElementById('versionNotesInput').value = v.notes || '';
                document.getElementById('versionNotesInput').disabled = !v.has_alert;
            }
        }
        modal.classList.remove('hidden');
    }

    // EXPORTS
    window.loadVersionControls = () => internalLoadControls();
    window.renderVersionControls = () => internalRenderControls();
    window.handleVersionSubmit = (e) => internalHandleSubmit(e);
    window.editVersion = (id) => openModal(id);
    window.closeVersionModal = () => {
        const m = document.getElementById('versionModal');
        if (m) m.classList.add('hidden');
    };
    window.submitVersionForm = () => {
        const f = document.getElementById('versionForm');
        if (f && f.checkValidity()) {
            internalHandleSubmit(null);
        } else if (f) {
            f.reportValidity();
        }
    };
    window.prefillClientVersion = (id, name) => {
        openModal();
        setTimeout(() => {
            const sel = document.getElementById('versionClientSelect');
            const inp = document.getElementById('versionClientInput');
            if (sel) sel.value = id;
            if (inp) inp.value = name;
        }, 100);
    };

    window.setupVersionControlFilters = () => {
        const searchInput = document.getElementById('versionSearchInput');
        if (searchInput) {
            searchInput.oninput = () => {
                if (!isRendering) internalRenderControls();
            };
        }
        document.querySelectorAll('[data-version-filter]').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('[data-version-filter]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                window.currentVersionFilter = btn.dataset.versionFilter;
                internalRenderControls();
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
        modal.classList.remove('hidden');
        const list = document.getElementById('versionHistoryList');
        list.innerHTML = '<div style="text-align:center; padding:20px;"><i class="fa-solid fa-circle-notch fa-spin"></i> Carregando...</div>';
        try {
            const { data, error } = await window.supabaseClient.from('version_history')
                .select('*, version_controls(system)')
                .in('version_control_id', versionControls.filter(vc => vc.client_id === clientId).map(vc => vc.id))
                .order('created_at', { ascending: false });

            if (error) throw error;
            list.innerHTML = (data || []).map(h => `
                <div style="margin-bottom:12px; border-bottom:1px solid var(--border); padding-bottom:8px;">
                    <div style="color:var(--accent); font-weight:600;">${h.version_controls?.system}</div>
                    <div style="font-size:0.9em;">Versão: ${h.previous_version || 'N/A'} <i class="fa-solid fa-arrow-right" style="font-size:0.8em; opacity:0.5;"></i> ${h.new_version}</div>
                    <div style="font-size:0.8em; color:var(--text-secondary); margin-top:4px;">${new Date(h.created_at).toLocaleString('pt-BR')} por ${h.updated_by}</div>
                </div>
            `).join('') || '<p style="text-align:center; opacity:0.5;">Nenhum histórico encontrado.</p>';
        } catch (e) {
            list.innerHTML = '<p style="color:var(--danger);">Erro ao carregar histórico.</p>';
        }
    };

    window.closeVersionHistoryModal = () => {
        const m = document.getElementById('versionHistoryModal');
        if (m) m.classList.add('hidden');
    };

})();
