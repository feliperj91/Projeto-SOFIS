// ===========================================
// MODULE: VERSION CONTROL - FULL PRECISE v7.1
// ===========================================

(function () {
    console.log("🚀 [SOFIS] Version Control Premium Module v7.1 Loaded");

    // Internal state
    let versionControls = [];
    window.currentVersionFilter = 'all';
    let sofis_isUpdating = false;
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
        // Prevent concurrent loads if needed, but for UI refresh we often want to force it
        // sofis_isUpdating flag is useful to prevent spam, but let's allow overlapping calls to ensure latest data wins
        if (sofis_isUpdating) {
            console.log("⚠️ loadVersionControls: Already updating, queuing next check turned off for simplicity but allowing pass through if critical.");
            // For now, let's just proceed to ensure data is fresh. Supabase client handles connection.
        }
        sofis_isUpdating = true;

        try {
            if (!window.supabaseClient) {
                console.warn("❌ supabaseClient not ready");
                return;
            }

            console.log("🔄 Loading Version Controls...");

            // Artificial delay removed/minimized. Just fetch.
            const { data, error } = await window.supabaseClient
                .from('version_controls')
                .select(`*, clients (id, name)`)
                .order('updated_at', { ascending: false });

            if (error) throw error;

            versionControls = data || [];
            window.versionControls = versionControls; // Sync global state including for other modules

            console.log(`✅ Loaded ${versionControls.length} version records.`);
            renderVersionControls();
        } catch (err) {
            console.error('❌ Error loadVersionControls:', err);
            // Optionally show error in UI
        } finally {
            sofis_isUpdating = false;
        }
    }

    function renderVersionControls() {
        // Removed re-entrancy guard "sofis_isRendering" to ensure always renders the current state
        try {
            const list = document.getElementById('versionList');
            if (!list) return;

            // Clear IMMEDIATELY to prevent stale state visualization
            list.innerHTML = '';

            let filtered = versionControls;
            const searchInput = document.getElementById('versionSearchInput');
            const search = searchInput ? searchInput.value.toLowerCase() : '';

            if (search) {
                filtered = filtered.filter(v =>
                    (v.clients?.name || '').toLowerCase().includes(search) ||
                    (v.system || '').toLowerCase().includes(search) ||
                    (v.version || '').toLowerCase().includes(search)
                );
            }

            if (window.currentVersionFilter !== 'all') {
                filtered = filtered.filter(v => utils.getStatus(v.updated_at) === window.currentVersionFilter);
            }

            // Environment Filter Logic
            if (window.currentEnvFilter && window.currentEnvFilter !== 'all') {
                // Removed global logic as per user request
            }

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
                // Note: filtered array is already sorted by updated_at desc.
                // So the first one we encounter is the latest.
                const key = `${v.system}_${v.environment}`;
                const existing = grouped[name].versionsMap[key];

                if (!existing) {
                    grouped[name].versionsMap[key] = v;
                }
                // If existing is present, since we iterate desc, we don't replace it unless we want to handle out-of-order array (which shouldn't happen with sort)
            });

            // Sort by client name
            Object.values(grouped).sort((a, b) => a.name.localeCompare(b.name)).forEach(group => {
                // Convert Map back to array for rendering
                group.versions = Object.values(group.versionsMap);
                list.appendChild(createClientGroupCard(group));
            });
        } catch (e) {
            console.error("Error in renderVersionControls:", e);
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
                <div class="version-item-row status-${status}" data-environment="${v.environment}" style="${v.environment !== 'producao' ? 'display:none;' : ''}">
                    <div class="version-row-main">
                        <!-- Left section: System and Badge -->
                        <div class="version-left-info">
                            <span class="version-system-name">${utils.escapeHtml(v.system)}</span>
                            <div class="version-badge-container">
                                <span class="environment-badge-small ${v.environment}">${v.environment === 'producao' ? 'PRODUÇÃO' : 'HOMOLOGAÇÃO'}</span>
                            </div>
                        </div>

                        <!-- Right section: Version, Edit and Meta -->
                        <div class="version-right-data">
                            <div class="version-right-new-layout">
                                <!-- Text Group: Version + Metas (Aligned Left) -->
                                <div class="version-text-group">
                                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 4px;">
                                        <div style="display: flex; align-items: baseline;">
                                            <span style="color: #ffffff; font-size: 0.75rem; margin-right: 5px; font-weight: 400;">Versão:</span>
                                            <span class="version-number-display">${utils.escapeHtml(v.version)}</span>
                                        </div>
                                        ${v.has_alert ?
                    `<i class="fa-solid fa-bell client-note-indicator" onclick="window.openVersionNotes('${v.id}')" title="Possui observações importantes" style="color: #ffc107; cursor: pointer; font-size: 0.9rem;"></i>` :
                    ``
                }
                                    </div>
                                    <div class="version-meta-area">
                                        <div class="meta-line">Data da atualização: ${utils.formatDate(v.updated_at)}</div>
                                        <div class="meta-line">${timeInfo}</div>
                                    </div>
                                </div>
                                <!-- Actions Group: Icons (Aligned Right) -->
                                <div class="version-actions-group">

                                    <button class="btn-edit-version-small" onclick="window.editVersion('${v.id}')" title="Editar">
                                        <i class="fa-solid fa-pencil"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        card.innerHTML = `
                <div class="client-group-header status-${overallStatus}">
                    <div class="client-group-title">
                        <h3 style="cursor:default" title="Nome do Cliente">${utils.escapeHtml(group.name)}</h3>
                    </div>
                <div class="client-header-actions">
                    <button class="btn-card-action" onclick="window.openClientInteraction('${group.id}', '${utils.escapeHtml(group.name)}')" title="Editar Cliente">
                        <i class="fa-solid fa-pencil"></i>
                    </button>
                    <button class="btn-card-action" onclick="window.openClientVersionsHistory('${group.id}')" title="Ver Histórico">
                        <i class="fa-solid fa-rotate"></i>
                    </button>
                    <button class="btn-card-action" onclick="window.prefillClientVersion('${group.id}', '${utils.escapeHtml(group.name)}')" title="Adicionar Sistema">
                        <i class="fa-solid fa-plus-circle"></i>
                    </button>
                    
                    <!-- Card Level Filter -->
                    <div class="card-filter-dropdown">
                        <button class="btn-sm card-env-toggle" onclick="window.toggleCardFilterMenu(this)">
                            <i class="fa-solid fa-filter"></i>
                        </button>
                        <div class="card-filter-menu hidden">
                            <div class="filter-menu-item" onclick="window.applyCardEnvFilter(this, 'all')">
                                <i class="fa-solid fa-layer-group"></i> <span>Todos</span>
                            </div>
                            <div class="filter-menu-item active" onclick="window.applyCardEnvFilter(this, 'producao')">
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
                notes: document.getElementById('versionNotesInput').value,
                responsible: document.getElementById('versionResponsibleSelect').value
            };

            if (!fields.clientId) {
                if (window.showToast) window.showToast('⚠️ Selecione um cliente', 'warning');
                sofis_isSaving = false;
                return;
            }

            // Version Validation (Incomplete or Empty)
            if (!fields.ver || fields.ver.trim() === '') {
                if (window.showToast) window.showToast('⚠️ O campo de versão é obrigatório.', 'warning');
                sofis_isSaving = false;
                return;
            }

            if (fields.ver.length < 10) {
                if (window.showToast) window.showToast('⚠️ Versão do sistema incompleta!', 'warning');
                sofis_isSaving = false;
                return;
            }

            // Year Validation
            if (fields.date) {
                const year = parseInt(fields.date.split('-')[0]);
                if (year < 2000 || year > 2099) {
                    if (window.showToast) window.showToast('⚠️ Ano inválido na data. Por favor verifique.', 'warning');
                    sofis_isSaving = false;
                    return;
                }
            }

            const payload = {
                client_id: fields.clientId,
                environment: fields.env,
                system: fields.sys,
                version: fields.ver,
                has_alert: fields.alert,
                notes: fields.notes,
                responsible: fields.responsible,
                updated_at: fields.date ? `${fields.date}T12:00:00+00:00` : new Date().toISOString()
            };

            let result;
            if (fields.id) {
                result = await window.supabaseClient.from('version_controls').update(payload).eq('id', fields.id);
            } else {
                result = await window.supabaseClient.from('version_controls').insert([payload]).select();
                if (result.data && result.data[0]) {
                    await logHistory(result.data[0].id, null, fields.ver, 'Registro Inicial', fields.responsible);
                }
            }

            if (result.error) throw result.error;

            if (window.showToast) window.showToast('Concluído com sucesso!');
            window.closeVersionModal();

            // Refresh with clear context - WAIT for a moment to ensure propagation
            // Increased delay slightly and forceful reload
            setTimeout(() => {
                loadVersionControls();
            }, 500);

        } catch (err) {
            console.error('❌ handleVersionSubmit Error:', err);
            if (window.showToast) window.showToast('Falha ao salvar dados', 'error');
        } finally {
            sofis_isSaving = false;
        }
    }

    async function logHistory(vcId, oldV, newV, notes, responsible = null) {
        try {
            const user = responsible || JSON.parse(localStorage.getItem('sofis_user') || '{}').username || 'Sistema';
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
        // Refresh client list if adding new version control to ensure we filter out existing ones
        if (!id && window.populateVersionClientSelect) {
            window.populateVersionClientSelect();
        }

        const modal = document.getElementById('versionModal');
        if (!modal) return;
        document.getElementById('versionForm').reset();
        document.getElementById('versionId').value = id;

        const v = versionControls.find(x => x.id === id);
        if (v) {
            document.getElementById('versionClientSelect').value = v.client_id;
            document.getElementById('versionClientInput').value = v.clients?.name || '';
            document.getElementById('versionClientInput').disabled = true; // Lock client on edit
            document.getElementById('versionEnvironmentSelect').value = v.environment;
            document.getElementById('versionSystemSelect').value = v.system;
            document.getElementById('versionNumberInput').value = v.version;
            document.getElementById('versionResponsibleSelect').value = v.responsible || '';
            if (v.updated_at) document.getElementById('versionDateInput').value = v.updated_at.split('T')[0];
            const check = document.getElementById('versionAlertCheck');
            check.checked = !!v.has_alert;
            const notes = document.getElementById('versionNotesInput');
            notes.value = v.notes || '';
            notes.disabled = !check.checked;
        } else {
            document.getElementById('versionClientInput').disabled = false;
        }

        // Auto-select current user in responsible list if new
        if (!id) {
            const currentUser = JSON.parse(localStorage.getItem('sofis_user') || '{}').username;
            if (currentUser) {
                const respSelect = document.getElementById('versionResponsibleSelect');
                for (let i = 0; i < respSelect.options.length; i++) {
                    if (respSelect.options[i].value === currentUser) {
                        respSelect.selectedIndex = i;
                        break;
                    }
                }
            }
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
            document.getElementById('versionClientInput').disabled = true; // Lock client when prefilling

            // Auto-select current user in responsible list
            const currentUser = JSON.parse(localStorage.getItem('sofis_user') || '{}').username;
            if (currentUser) {
                const respSelect = document.getElementById('versionResponsibleSelect');
                for (let i = 0; i < respSelect.options.length; i++) {
                    if (respSelect.options[i].value === currentUser) {
                        respSelect.selectedIndex = i;
                        break;
                    }
                }
            }

            modal.classList.remove('hidden');
        }, 50);
    };

    window.openVersionNotes = (id) => {
        const v = versionControls.find(x => x.id === id);
        if (!v || !v.notes) return;

        const modal = document.getElementById('versionNotesModal');
        if (!modal) return;

        const contentBox = document.getElementById('versionNotesContent');
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
        const clearBtn = document.getElementById('clearVersionSearch');

        if (sInput) {
            sInput.oninput = () => {
                if (clearBtn) {
                    if (sInput.value.length > 0) clearBtn.classList.remove('hidden');
                    else clearBtn.classList.add('hidden');
                }
                renderVersionControls();
            };
        }

        if (clearBtn && sInput) {
            clearBtn.onclick = () => {
                sInput.value = '';
                clearBtn.classList.add('hidden');
                sInput.focus();
                renderVersionControls();
            };
        }

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

        // Mask for Version Number: YYYY.MM-DD
        const versionInput = document.getElementById('versionNumberInput');
        if (versionInput) {
            versionInput.addEventListener('input', function (e) {
                let value = e.target.value.replace(/\D/g, ''); // Remove all non-digits
                if (value.length > 8) value = value.substring(0, 8); // Max 8 digits

                let result = '';
                for (let i = 0; i < value.length; i++) {
                    if (i === 4) result += '.';
                    if (i === 6) result += '-';
                    result += value[i];
                }
                e.target.value = result;
            });
        }
    };

    let currentHistoryData = [];
    window.openClientVersionsHistory = async (clientId) => {
        const modal = document.getElementById('versionHistoryModal');
        if (!modal) return;

        const vEntry = versionControls.find(v => v.client_id === clientId);
        const clientName = vEntry?.clients?.name || 'Cliente';

        document.getElementById('versionHistoryTitle').innerHTML = `Histórico: <span style="color:var(--accent)">${utils.escapeHtml(clientName)}</span>`;
        modal.classList.remove('hidden');

        // Reset filters
        // Reset filters
        document.getElementById('historySystemFilter').value = 'all';

        renderHistoryLoading();

        try {
            const clientVCs = versionControls.filter(vc => vc.client_id === clientId);
            if (clientVCs.length === 0) {
                renderHistoryList([]);
                return;
            }

            const { data } = await window.supabaseClient.from('version_history')
                .select('*, version_controls(system, environment)')
                .in('version_control_id', clientVCs.map(vc => vc.id))
                .order('created_at', { ascending: false });

            currentHistoryData = data || [];
            window.filterHistory(); // Apply limits immediately
        } catch (e) {
            document.getElementById('versionHistoryList').innerHTML = '<div style="color:var(--danger); text-align:center; padding:20px;">Erro ao carregar dados.</div>';
        }
    };

    function renderHistoryLoading() {
        document.getElementById('versionHistoryList').innerHTML = '<div style="text-align:center; padding:20px; color:var(--text-secondary)">Carregando...</div>';
    }

    function renderHistoryList(data) {
        const list = document.getElementById('versionHistoryList');
        list.innerHTML = data.map(h => `
            <div style="background:rgba(255,255,255,0.03); padding:12px; border-radius:10px; margin-bottom:12px; border-left:4px solid var(--accent); border: 1px solid rgba(255,255,255,0.05); border-left-width: 4px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:8px; align-items: flex-start;">
                    <div>
                        <strong style="color:#ffffff; font-size:1.1rem; display:block;">${h.version_controls?.system}</strong>
                        <span class="environment-badge-small ${h.version_controls?.environment}" style="font-size: 0.6rem; padding: 1px 6px;">${h.version_controls?.environment?.toUpperCase()}</span>
                    </div>
                    <small style="opacity:0.6; text-align:right;">${new Date(h.created_at).toLocaleDateString('pt-BR')} ${new Date(h.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</small>
                </div>
                <div style="font-size:0.9rem; margin:5px 0; color:#fff; font-family:'Outfit', sans-serif;">
                    <span style="font-weight: 400;">Versão:</span> <span style="color:var(--success); font-weight:600;">${h.new_version}</span>
                </div>
                <div style="font-size:0.9rem; color:#fff; font-family:'Outfit', sans-serif;">
                    <span style="font-weight: 400;">Atualizado por:</span> <span>${h.updated_by}</span>
                </div>
                ${h.notes && h.notes !== 'Versão inicial cadastrada' && h.notes !== 'Registro Inicial' ? `<div style="font-size:0.85rem; margin-top:10px; padding-top:8px; border-top:1px solid rgba(255,255,255,0.05); color:#cfd8dc; border-radius:0;">${utils.escapeHtml(h.notes)}</div>` : ''}
            </div>
        `).join('') || '<div style="text-align:center; opacity:0.5; padding:30px;">Nenhum registro encontrado para os filtros selecionados.</div>';
    }

    window.filterHistory = () => {
        const sys = document.getElementById('historySystemFilter').value;

        // Base filter by system if selected
        let filtered = currentHistoryData;
        if (sys !== 'all') {
            filtered = filtered.filter(h => h.version_controls?.system === sys);
        }

        // Apply Logic: Top 3 latest updates per System per Environment
        const finalResults = [];
        const counters = {}; // stores count for "System|Environment"

        filtered.forEach(h => {
            const system = h.version_controls?.system || 'Unknown';
            const env = h.version_controls?.environment || 'Unknown';
            const key = `${system}|${env}`;

            if (!counters[key]) counters[key] = 0;

            if (counters[key] < 3) {
                finalResults.push(h);
                counters[key]++;
            }
        });

        // Sort by Environment if a system is selected (Production first)
        if (sys !== 'all') {
            finalResults.sort((a, b) => {
                const envA = a.version_controls?.environment || '';
                const envB = b.version_controls?.environment || '';
                if (envA === 'producao' && envB !== 'producao') return -1;
                if (envA !== 'producao' && envB === 'producao') return 1;
                return 0; // Preserve date order
            });
        }

        renderHistoryList(finalResults);
    };

    window.closeVersionHistoryModal = () => {
        document.getElementById('versionHistoryModal').classList.add('hidden');
    };



    // ==========================================
    // PULSE DASHBOARD LOGIC (Real-time Analytics)
    // ==========================================
    let pulseCharts = {};
    let pulseRefreshInterval = null;

    window.openPulseDashboard = function () {
        const modal = document.getElementById('pulseDashboardModal');
        if (!modal) return;

        modal.classList.remove('hidden');

        // Smooth entrance animation
        const container = modal.querySelector('.dashboard-container');
        container.style.opacity = '0';
        container.style.transform = 'scale(0.95)';
        setTimeout(() => {
            container.style.transition = 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
            container.style.opacity = '1';
            container.style.transform = 'scale(1)';
        }, 50);

        // Initial render
        calculateAndRenderPulse();

        // Auto-refresh every 5 seconds for real-time data
        if (pulseRefreshInterval) clearInterval(pulseRefreshInterval);
        pulseRefreshInterval = setInterval(() => {
            calculateAndRenderPulse();
        }, 5000);
    };

    window.closePulseDashboard = function () {
        const modal = document.getElementById('pulseDashboardModal');
        if (modal) modal.classList.add('hidden');

        // Stop auto-refresh
        if (pulseRefreshInterval) {
            clearInterval(pulseRefreshInterval);
            pulseRefreshInterval = null;
        }
    };

    function calculateAndRenderPulse() {
        if (!window.versionControls || window.versionControls.length === 0) {
            console.warn("📊 [Pulse] No data available");
            return;
        }

        const allData = window.versionControls;

        // ===== FILTRAR APENAS PRODUÇÃO =====
        const data = allData.filter(d => {
            const env = (d.environment || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            return env.includes('produ');
        });

        console.log(`📊 [Pulse] Processing ${data.length} production records (${allData.length} total)`);

        if (data.length === 0) {
            console.warn("📊 [Pulse] No production data available");
            document.getElementById('kpiTotalClients').innerText = '0';
            document.getElementById('kpiMostPopularSystem').innerText = '-';
            return;
        }

        // ===== KPI 1: Total de Clientes Únicos (Produção) =====
        const uniqueClients = new Set(data.map(d => d.client_id)).size;
        document.getElementById('kpiTotalClients').innerText = uniqueClients;

        // ===== KPI 2: Todos os Sistemas com Quantidades (Clientes Únicos) =====
        const systemClientSets = {};
        data.forEach(d => {
            const sys = d.system || 'Desconhecido';
            if (!systemClientSets[sys]) {
                systemClientSets[sys] = new Set();
            }
            systemClientSets[sys].add(d.client_id);
        });

        // Converter Sets para contagens e ordenar
        const sortedSystems = Object.entries(systemClientSets)
            .map(([sys, clientSet]) => [sys, clientSet.size])
            .sort((a, b) => b[1] - a[1]);

        // Renderizar lista de sistemas com quantidades
        const kpiElement = document.getElementById('kpiMostPopularSystem');
        if (sortedSystems.length > 0) {
            const systemsList = sortedSystems.map(([sys, count]) => `${sys} (${count})`).join(', ');
            kpiElement.innerHTML = systemsList;
            kpiElement.style.fontSize = '0.95rem';
            kpiElement.style.lineHeight = '1.4';
        } else {
            kpiElement.innerText = '-';
        }

        // Preparar systemCounts para os gráficos
        const systemCounts = {};
        sortedSystems.forEach(([sys, count]) => {
            systemCounts[sys] = count;
        });

        // ===== Renderizar Gráficos =====
        if (typeof Chart === 'undefined') {
            console.error("❌ [Pulse] Chart.js not loaded");
            return;
        }

        renderEnvironmentChart(allData); // Este pode mostrar todos os ambientes
        renderSystemDistributionChart(data, systemCounts); // Apenas produção
        renderVersionsChart(data); // Apenas produção
    }

    // Chart Configuration - Modern Vibrant Colors
    const chartColors = {
        purple: '#8b5cf6',
        blue: '#3b82f6',
        green: '#10b981',
        teal: '#14b8a6',
        orange: '#f59e0b',
        pink: '#ec4899',
        red: '#ef4444',
        indigo: '#6366f1',
        text: '#6b7280',
        grid: 'rgba(229, 231, 235, 0.5)',
        gridDark: 'rgba(156, 163, 175, 0.2)'
    };

    function destroyChart(id) {
        if (pulseCharts[id]) {
            pulseCharts[id].destroy();
        }
    }

    // ===== Gráfico 1: Ambientes (Produção vs Homologação) =====
    function renderEnvironmentChart(data) {
        const ctx = document.getElementById('envChart').getContext('2d');
        destroyChart('envChart');

        let prod = 0, homolog = 0;
        data.forEach(d => {
            const env = (d.environment || '').toLowerCase();
            if (env.includes('prod')) prod++;
            else if (env.includes('homolog') || env.includes('test')) homolog++;
        });

        pulseCharts['envChart'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Produção', 'Homologação'],
                datasets: [{
                    data: [prod, homolog],
                    backgroundColor: [chartColors.teal, chartColors.teal],
                    borderRadius: 8,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(17, 24, 39, 0.95)',
                        titleColor: '#fff',
                        bodyColor: '#e5e7eb',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 1,
                        padding: 12,
                        titleFont: { size: 13, weight: 'bold' },
                        bodyFont: { size: 12 }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: chartColors.text, font: { size: 12, weight: '600' } }
                    },
                    y: {
                        grid: { color: chartColors.grid },
                        ticks: { color: chartColors.text, precision: 0 },
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // ===== Gráfico 2: Distribuição de Clientes por Sistema =====
    function renderSystemDistributionChart(data, counts) {
        const container = document.getElementById('systemDistChart').parentElement;
        const total = Object.values(counts).reduce((a, b) => a + b, 0);

        // Criar layout customizado: Pizza à esquerda + Barras à direita
        container.innerHTML = `
            <div style="display: flex; gap: 32px; align-items: center; height: 100%;">
                <div style="flex: 0 0 280px; position: relative;">
                    <canvas id="systemPieChart"></canvas>
                </div>
                <div id="systemBars" style="flex: 1; display: flex; flex-direction: column; gap: 16px; justify-content: center;">
                </div>
            </div>
        `;

        const labels = Object.keys(counts);
        const values = Object.values(counts);

        const colors = [
            { main: '#6366f1', light: '#6366f1' },  // indigo
            { main: '#8b5cf6', light: '#8b5cf6' },  // purple
            { main: '#ec4899', light: '#ec4899' },  // pink
            { main: '#f59e0b', light: '#f59e0b' },  // orange
            { main: '#14b8a6', light: '#14b8a6' },  // teal
            { main: '#3b82f6', light: '#3b82f6' }   // blue
        ];

        // Renderizar Pizza
        const ctx = document.getElementById('systemPieChart').getContext('2d');
        destroyChart('systemDistChart');

        pulseCharts['systemDistChart'] = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors.map(c => c.main),
                    borderWidth: 3,
                    borderColor: '#ffffff',
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(17, 24, 39, 0.95)',
                        titleColor: '#fff',
                        bodyColor: '#e5e7eb',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 1,
                        padding: 12,
                        callbacks: {
                            label: function (context) {
                                const value = context.parsed;
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${context.label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });

        // Renderizar Barras Horizontais
        const barsContainer = document.getElementById('systemBars');
        labels.forEach((label, i) => {
            const value = values[i];
            const percentage = ((value / total) * 100).toFixed(1);
            const color = colors[i % colors.length];

            const barHtml = `
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 12px; height: 12px; border-radius: 50%; background: ${color.main}; flex-shrink: 0;"></div>
                    <div style="flex: 1; min-width: 0;">
                        <div style="font-size: 0.85rem; font-weight: 600; color: #374151; margin-bottom: 4px;">${label}</div>
                        <div style="width: 100%; height: 8px; background: #f3f4f6; border-radius: 4px; overflow: hidden;">
                            <div style="height: 100%; background: ${color.main}; border-radius: 4px; width: ${percentage}%; transition: width 0.6s ease;"></div>
                        </div>
                    </div>
                    <div style="font-size: 0.85rem; font-weight: 700; color: #111827; min-width: 50px; text-align: right;">${percentage}%</div>
                </div>
            `;
            barsContainer.innerHTML += barHtml;
        });
    }

    // ===== Gráfico 3: Distribuição de Versões =====
    function renderVersionsChart(data) {
        const ctx = document.getElementById('versionsChart').getContext('2d');
        destroyChart('versionsChart');


        // Coletar versões únicas (sistema + versão)
        console.log(`📊 [Versions Chart] Recebendo ${data.length} registros`);

        const versionSet = new Set();
        data.forEach(d => {
            const sys = d.system || 'Sem Sistema';
            const ver = d.version || 'S/V';
            const env = d.environment || '';
            const key = `${sys} ${ver}`;
            console.log(`  - ${key} (${env})`);
            versionSet.add(key);
        });

        // Converter para array e ordenar alfabeticamente
        const sortedVersions = Array.from(versionSet).sort();
        console.log(`📊 [Versions Chart] Total de versões únicas: ${sortedVersions.length}`);

        const labels = sortedVersions;
        const values = sortedVersions.map(() => 1); // Todas com altura 1

        // Cores vibrantes diferentes para cada barra
        const colors = [
            '#8b5cf6', // purple
            '#6366f1', // indigo
            '#ec4899', // pink
            '#f59e0b', // orange
            '#10b981', // green
            '#14b8a6', // teal
            '#3b82f6', // blue
            '#f97316', // orange-red
            '#a855f7', // purple-light
            '#06b6d4', // cyan
            '#ef4444', // red
            '#84cc16'  // lime
        ];

        const bgColors = labels.map((_, i) => colors[i % colors.length]);

        pulseCharts['versionsChart'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: bgColors,
                    borderRadius: 8,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(17, 24, 39, 0.95)',
                        titleColor: '#fff',
                        bodyColor: '#e5e7eb',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 1,
                        padding: 12,
                        titleFont: { size: 13, weight: 'bold' },
                        bodyFont: { size: 12 },
                        callbacks: {
                            label: function (context) {
                                return context.label;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: {
                            color: chartColors.text,
                            font: { size: 11, weight: '500' },
                            maxRotation: 45,
                            minRotation: 45
                        }
                    },
                    y: {
                        grid: { color: chartColors.grid },
                        ticks: {
                            color: chartColors.text,
                            precision: 0,
                            font: { size: 11 }
                        },
                        beginAtZero: true
                    }
                }
            }
        });
    }

})();
