// ===================================
// VERSION CONTROL MODULE
// ===================================

let versionControls = [];
window.currentVersionFilter = 'all'; // 'all', 'recent', 'warning', 'outdated'

// ===================================
// LOAD VERSION CONTROLS
// ===================================

async function loadVersionControls() {
    if (!window.supabaseClient) {
        console.error('Supabase client not initialized');
        return;
    }

    try {
        const { data, error } = await window.supabaseClient
            .from('version_controls')
            .select(`
                *,
                clients (
                    id,
                    name
                )
            `)
            .order('updated_at', { ascending: false });

        if (error) throw error;

        versionControls = data || [];
        renderVersionControls();
    } catch (err) {
        console.error('Erro ao carregar versões:', err);
        showToast('Erro ao carregar versões', 'error');
    }
}

// ===================================
// RENDER VERSION CONTROLS
// ===================================

function renderVersionControls() {
    const versionList = document.getElementById('versionList');
    if (!versionList) return;

    // Filter logic
    let filteredVersions = versionControls;
    const searchTerm = document.getElementById('versionSearchInput')?.value.toLowerCase() || '';

    if (searchTerm) {
        filteredVersions = filteredVersions.filter(v => {
            const clientName = v.clients?.name?.toLowerCase() || '';
            const system = v.system?.toLowerCase() || '';
            const version = v.version?.toLowerCase() || '';
            return clientName.includes(searchTerm) || system.includes(searchTerm) || version.includes(searchTerm);
        });
    }

    // Filter by Age/Status
    if (window.currentVersionFilter !== 'all') {
        filteredVersions = filteredVersions.filter(v => {
            const status = getVersionStatus(v.updated_at);
            return status === window.currentVersionFilter;
        });
    }

    // Clear list
    versionList.innerHTML = '';

    if (filteredVersions.length === 0) {
        versionList.innerHTML = `
            <div class="version-empty-state">
                <i class="fa-solid fa-code-branch"></i>
                <p>Nenhuma versão encontrada</p>
            </div>
        `;
        return;
    }

    // Group by Client
    const grouped = {};
    filteredVersions.forEach(v => {
        const clientName = v.clients?.name || 'Cliente Desconhecido';
        const clientId = v.client_id;
        if (!grouped[clientName]) {
            grouped[clientName] = {
                id: clientId,
                name: clientName,
                versions: [],
                lastUpdate: null
            };
        }
        grouped[clientName].versions.push(v);

        // Track global last update for the client
        if (!grouped[clientName].lastUpdate || new Date(v.updated_at) > new Date(grouped[clientName].lastUpdate)) {
            grouped[clientName].lastUpdate = v.updated_at;
        }
    });

    // Render Client Cards
    Object.values(grouped).sort((a, b) => a.name.localeCompare(b.name)).forEach(client => {
        const card = createClientGroupCard(client);
        versionList.appendChild(card);
    });
}

function createClientGroupCard(clientGroup) {
    const card = document.createElement('div');
    card.className = 'client-version-group-card';

    // Calculate overall status
    let hasOutdated = false;
    let hasWarning = false;
    clientGroup.versions.forEach(v => {
        const status = getVersionStatus(v.updated_at);
        if (status === 'outdated') hasOutdated = true;
        if (status === 'warning') hasWarning = true;
    });

    let overallStatusColor = 'var(--success)';
    if (hasOutdated) overallStatusColor = 'var(--danger)';
    else if (hasWarning) overallStatusColor = 'var(--accent)';

    // Limit to last 3 of each environment
    const prodVersions = clientGroup.versions
        .filter(v => v.environment === 'producao')
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
        .slice(0, 3);

    const homolVersions = clientGroup.versions
        .filter(v => v.environment === 'homologacao')
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
        .slice(0, 3);

    const displayVersions = [...prodVersions, ...homolVersions].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

    let versionsHtml = displayVersions.map(version => {
        const status = getVersionStatus(version.updated_at);
        const timeInfo = getTimeInfo(version.updated_at);

        // Status indicator color
        let statusColor = 'var(--success)';
        if (status === 'outdated') statusColor = 'var(--danger)';
        if (status === 'warning') statusColor = 'var(--accent)';

        return `
            <div class="version-item-row" style="border-left: 3px solid ${statusColor}">
                <div class="version-item-main">
                    <div class="version-system-info">
                        <span class="version-system-name">${escapeHtml(version.system)}</span>
                        <span class="environment-badge-small ${version.environment}">${version.environment === 'producao' ? 'Produção' : 'Homologação'}</span>
                    </div>
                    <div class="version-display-wrapper">
                        <div class="version-number-display clickable-text" onclick="openVersionHistory('${version.id}')" title="Ver Histórico" style="color: ${statusColor}">
                            ${escapeHtml(version.version)}
                            ${version.notes ? `<i class="fa-solid fa-bell clickable-bell" onclick="event.stopPropagation(); openVersionNotes('${version.id}')" title="Ver Observação" style="font-size: 0.8em; margin-left: 8px;"></i>` : ''}
                        </div>
                        <div class="version-small-meta">
                            <span class="version-meta-label">Data da última atualização: ${formatDate(version.updated_at)}</span>
                            <span class="version-meta-label">Tempo atualizado: ${timeInfo}</span>
                        </div>
                    </div>
                </div>
                
                <div class="version-actions">
                    <button class="btn-icon-small" onclick="editVersion('${version.id}')" title="Editar">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    card.innerHTML = `
        <div class="client-group-header">
            <div class="client-group-title">
                <div class="client-status-dot" style="background-color: ${overallStatusColor}"></div>
                <h3>${escapeHtml(clientGroup.name)}</h3>
            </div>
            <button class="btn-secondary btn-sm" onclick="window.prefillClientVersion('${clientGroup.id}', '${escapeHtml(clientGroup.name)}')" title="Adicionar Sistema">
                <i class="fa-solid fa-plus"></i> <span class="desktop-only">Sistema</span>
            </button>
        </div>
        <div class="client-group-body">
            ${versionsHtml}
        </div>
    `;

    return card;
}

// Helper to prefill client when adding new system from card
window.prefillClientVersion = function (id, name) {
    openVersionModal();
    // Tiny timeout to let modal open and clear
    setTimeout(() => {
        const select = document.getElementById('versionClientSelect');
        const input = document.getElementById('versionClientInput');
        if (select && input) {
            select.value = id;
            input.value = name;
            input.disabled = true; // Also fixed when adding specifically to a client
        }
    }, 100);
};

// ===================================
// GET VERSION STATUS
// ===================================

function getVersionStatus(updatedAt) {
    const now = new Date();
    const updated = new Date(updatedAt);
    const diffMonths = (now - updated) / (1000 * 60 * 60 * 24 * 30);

    if (diffMonths < 2) return 'recent';
    if (diffMonths < 3) return 'warning';
    return 'outdated';
}

// ===================================
// GET TIME INFO
// ===================================

function getTimeInfo(updatedAt) {
    const now = new Date();
    const updated = new Date(updatedAt);

    // Se a data for hoje
    const todayStr = now.toISOString().split('T')[0];
    const updatedStr = updated.toISOString().split('T')[0];
    if (todayStr === updatedStr) return 'Atualizado hoje';

    let years = now.getFullYear() - updated.getFullYear();
    let months = now.getMonth() - updated.getMonth();
    let days = now.getDate() - updated.getDate();

    // Ajuste de meses se o dia atual for menor que o dia da atualização
    if (days < 0) {
        months--;
        // Pega o último dia do mês anterior
        const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
        days += prevMonth;
    }

    // Ajuste de anos se os meses ficarem negativos
    if (months < 0) {
        years--;
        months += 12;
    }

    // Converte anos em meses para o formato solicitado (meses e dias)
    const totalMonths = (years * 12) + months;

    let result = '';

    if (totalMonths > 0) {
        result += `${totalMonths} ${totalMonths === 1 ? 'mês' : 'meses'}`;
        if (days > 0) {
            result += ` e ${days} ${days === 1 ? 'dia' : 'dias'}`;
        }
    } else {
        result = `${days} ${days === 1 ? 'dia' : 'dias'}`;
    }

    return result;
}

// ===================================
// FORMAT DATE
// ===================================

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

// ===================================
// OPEN VERSION MODAL
// ===================================

function openVersionModal(versionId = null) {
    const modal = document.getElementById('versionModal');
    const modalTitle = document.getElementById('versionModalTitle');
    const form = document.getElementById('versionForm');

    if (!modal || !form) return;

    // Reset form
    form.reset();
    document.getElementById('versionId').value = '';
    document.getElementById('versionClientInput').value = '';
    document.getElementById('versionClientSelect').value = '';

    // Set default date to Today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('versionDateInput').value = today;

    if (versionId) {
        // Edit mode
        const version = versionControls.find(v => v.id === versionId);
        if (version) {
            modalTitle.textContent = 'Editar Versão';
            document.getElementById('versionId').value = version.id;

            // Set client (Hidden ID and Visible Name)
            document.getElementById('versionClientSelect').value = version.client_id;
            document.getElementById('versionClientInput').value = version.clients?.name || '';
            document.getElementById('versionClientInput').disabled = true;

            document.getElementById('versionEnvironmentSelect').value = version.environment;
            document.getElementById('versionSystemSelect').value = version.system;
            document.getElementById('versionNumberInput').value = version.version;
            document.getElementById('versionDateInput').value = version.updated_at ? version.updated_at.split('T')[0] : today;
            document.getElementById('versionAlertCheck').checked = version.has_alert;
            document.getElementById('versionNotesInput').value = version.notes || '';
            document.getElementById('versionNotesInput').disabled = !version.has_alert;
        }
    } else {
        // Add mode
        modalTitle.textContent = 'Nova Versão';
        document.getElementById('versionClientInput').disabled = false;
        document.getElementById('versionNotesInput').disabled = true;
    }

    modal.classList.remove('hidden');

    // Initialize Mask if not already done (idempotent setup)
    setupVersionMask();
}

function setupVersionMask() {
    const versionInput = document.getElementById('versionNumberInput');
    if (versionInput && !versionInput.dataset.maskInitialized) {
        versionInput.dataset.maskInitialized = 'true';
        versionInput.addEventListener('input', function (e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 8) value = value.slice(0, 8);

            if (value.length > 6) {
                value = value.replace(/^(\d{4})(\d{2})(\d+)/, '$1.$2-$3');
            } else if (value.length > 4) {
                value = value.replace(/^(\d{4})(\d+)/, '$1.$2');
            }
            e.target.value = value;
        });
    }
}

function closeVersionModal() {
    const modal = document.getElementById('versionModal');
    if (modal) modal.classList.add('hidden');
}

// ===================================
// SAVE VERSION
// ===================================

async function handleVersionSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();

    const versionId = document.getElementById('versionId').value;
    const clientId = document.getElementById('versionClientSelect').value;
    const environment = document.getElementById('versionEnvironmentSelect').value;
    const system = document.getElementById('versionSystemSelect').value;
    const version = document.getElementById('versionNumberInput').value;
    const updateDate = document.getElementById('versionDateInput').value;
    const hasAlert = document.getElementById('versionAlertCheck').checked;
    const notes = document.getElementById('versionNotesInput').value;

    if (!clientId) {
        if (window.showToast) {
            window.showToast('Cliente não identificado. Selecione um cliente da lista.', 'warning');
        } else {
            alert('Cliente não identificado. Por favor, selecione um cliente da lista.');
        }
        return;
    }

    const versionData = {
        client_id: clientId,
        environment,
        system,
        version,
        has_alert: hasAlert,
        notes,
        updated_at: updateDate ? new Date(updateDate + 'T12:00:00').toISOString() : new Date().toISOString()
    };

    try {
        if (versionId) {
            // Update existing version
            const oldVersion = versionControls.find(v => v.id === versionId);

            const { error } = await window.supabaseClient
                .from('version_controls')
                .update(versionData)
                .eq('id', versionId);

            if (error) throw error;

            // Create history entry if version changed
            if (oldVersion && oldVersion.version !== version) {
                await createVersionHistory(versionId, oldVersion.version, version);
            }

            await registerAuditLog('UPDATE', 'Versão atualizada', `${system} - ${version}`);
            showToast('Versão atualizada com sucesso!');
        } else {
            // Create new version
            const { data, error } = await window.supabaseClient
                .from('version_controls')
                .insert([versionData])
                .select();

            if (error) throw error;

            // Create initial history entry
            if (data && data[0]) {
                await createVersionHistory(data[0].id, null, version, 'Versão inicial cadastrada');
            }

            await registerAuditLog('CREATE', 'Nova versão cadastrada', `${system} - ${version}`);
            showToast('Versão cadastrada com sucesso!');
        }

        closeVersionModal();
        await loadVersionControls();
    } catch (err) {
        console.error('Erro ao salvar versão:', err);
        if (window.showToast) {
            window.showToast('Erro: ' + (err.message || 'Falha desconhecida'), 'error');
        } else {
            alert('Erro CRÍTICO ao salvar: ' + (err.message || err));
        }
    }
}

// ===================================
// CREATE VERSION HISTORY
// ===================================

async function createVersionHistory(versionControlId, previousVersion, newVersion, notes = '') {
    const user = JSON.parse(localStorage.getItem('sofis_user') || '{}');
    const username = user.username || 'Sistema';

    try {
        const { error } = await window.supabaseClient
            .from('version_history')
            .insert([{
                version_control_id: versionControlId,
                previous_version: previousVersion,
                new_version: newVersion,
                updated_by: username,
                notes
            }]);

        if (error) throw error;
    } catch (err) {
        console.error('Erro ao criar histórico:', err);
    }
}

// ===================================
// DELETE VERSION
// ===================================

async function deleteVersion(versionId) {
    const version = versionControls.find(v => v.id === versionId);
    if (!version) return;

    const confirmMsg = `Deseja realmente excluir a versão ${version.system} - ${version.version} do cliente ${version.clients?.name}?`;
    if (!confirm(confirmMsg)) return;

    try {
        const { error } = await window.supabaseClient
            .from('version_controls')
            .delete()
            .eq('id', versionId);

        if (error) throw error;

        await registerAuditLog('DELETE', 'Versão excluída', `${version.system} - ${version.version}`);
        showToast('Versão excluída com sucesso!');
        await loadVersionControls();
    } catch (err) {
        console.error('Erro ao excluir versão:', err);
        showToast('Erro ao excluir versão', 'error');
    }
}

// ===================================
// OPEN VERSION HISTORY
// ===================================

async function openVersionHistory(versionId) {
    const modal = document.getElementById('versionHistoryModal');
    const historyList = document.getElementById('versionHistoryList');
    const version = versionControls.find(v => v.id === versionId);

    if (!modal || !historyList || !version) return;

    document.getElementById('versionHistoryTitle').textContent =
        `Histórico - ${version.clients?.name} (${version.system})`;

    try {
        const { data, error } = await window.supabaseClient
            .from('version_history')
            .select('*')
            .eq('version_control_id', versionId)
            .order('created_at', { ascending: false })
            .limit(3);

        if (error) throw error;

        historyList.innerHTML = '';

        if (!data || data.length === 0) {
            historyList.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Nenhum histórico encontrado</p>';
        } else {
            data.forEach(entry => {
                const item = document.createElement('div');
                item.className = 'version-history-item';
                item.innerHTML = `
                    <div class="version-history-header">
                        <span class="version-history-date">${formatDateTime(entry.created_at)}</span>
                        <span style="color: var(--text-secondary); font-size: 0.85rem;">${escapeHtml(entry.updated_by || 'Sistema')}</span>
                    </div>
                    <div class="version-history-change">
                        ${entry.previous_version ? `<span class="version-history-old">${escapeHtml(entry.previous_version)}</span>` : '<span style="color: var(--text-secondary);">-</span>'}
                        <i class="fa-solid fa-arrow-right version-history-arrow"></i>
                        <span class="version-history-new">${escapeHtml(entry.new_version)}</span>
                    </div>
                    ${entry.notes ? `<div class="version-history-notes">${escapeHtml(entry.notes)}</div>` : ''}
                `;
                historyList.appendChild(item);
            });
        }

        modal.classList.remove('hidden');
    } catch (err) {
        console.error('Erro ao carregar histórico:', err);
        showToast('Erro ao carregar histórico', 'error');
    }
}

function closeVersionHistoryModal() {
    const modal = document.getElementById('versionHistoryModal');
    if (modal) modal.classList.add('hidden');
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString('pt-BR');
    const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `${dateStr} às ${timeStr}`;
}

// ===================================
// VIEW NOTES
// ===================================

function openVersionNotes(versionId) {
    const version = versionControls.find(v => v.id === versionId);
    if (!version) return;

    const modal = document.getElementById('versionNotesModal');
    const title = document.getElementById('versionNotesTitle');
    const content = document.getElementById('versionNotesContent');

    if (!modal || !title || !content) return;

    title.textContent = `Observações - ${version.clients?.name || 'Cliente'}`;

    // Mostra qual foi a atualização com uma pequena linha divisória
    content.innerHTML = `
        <div style="font-weight: 600; color: var(--accent); margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px;">
            ${escapeHtml(version.system)} - Versão ${escapeHtml(version.version)}
        </div>
        <div style="line-height: 1.6;">${escapeHtml(version.notes || 'Nenhuma observação cadastrada.')}</div>
    `;

    modal.classList.remove('hidden');
}

// openClientNotes removed as per request to focus only on the bell


// Make functions globally available
window.editVersion = openVersionModal;
window.deleteVersion = deleteVersion;
window.openVersionHistory = openVersionHistory;
window.openVersionNotes = openVersionNotes;
window.loadVersionControls = loadVersionControls;
window.handleVersionSubmit = handleVersionSubmit;
window.submitVersionForm = function () {
    const form = document.getElementById('versionForm');
    if (form && !form.checkValidity()) {
        form.reportValidity();
        return;
    }
    handleVersionSubmit({});
};
window.closeVersionModal = closeVersionModal;
window.closeVersionHistoryModal = closeVersionHistoryModal;
