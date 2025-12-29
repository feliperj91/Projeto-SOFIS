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

    // Apply filters
    let filteredVersions = versionControls;

    // Apply search filter
    const searchTerm = document.getElementById('versionSearchInput')?.value.toLowerCase() || '';
    if (searchTerm) {
        filteredVersions = filteredVersions.filter(v => {
            const clientName = v.clients?.name?.toLowerCase() || '';
            const system = v.system?.toLowerCase() || '';
            const version = v.version?.toLowerCase() || '';
            return clientName.includes(searchTerm) || system.includes(searchTerm) || version.includes(searchTerm);
        });
    }

    // Apply time filter
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

    // Render cards
    filteredVersions.forEach(version => {
        const card = createVersionCard(version);
        versionList.appendChild(card);
    });
}

// ===================================
// CREATE VERSION CARD
// ===================================

function createVersionCard(version) {
    const card = document.createElement('div');
    const status = getVersionStatus(version.updated_at);
    const timeInfo = getTimeInfo(version.updated_at);

    card.className = `version-card status-${status}`;
    card.innerHTML = `
        <div class="version-card-header">
            <div class="version-card-title">
                <h3 class="version-card-name">${escapeHtml(version.clients?.name || 'Cliente Desconhecido')}</h3>
                ${version.has_alert ? '<i class="fa-solid fa-triangle-exclamation version-alert-icon"></i>' : ''}
            </div>
            <div class="version-card-actions">
                <button class="btn-icon" onclick="editVersion('${version.id}')" title="Editar">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="btn-icon btn-danger" onclick="deleteVersion('${version.id}')" title="Excluir">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </div>

        <div class="version-card-body">
            <span class="environment-badge ${version.environment}">${version.environment === 'homologacao' ? 'HOMOLOGAÇÃO' : 'PRODUÇÃO'}</span>
            
            <div class="version-info-row">
                <span class="version-info-label">Sistema</span>
                <span class="version-info-value version-system">${escapeHtml(version.system)}</span>
            </div>

            <div class="version-info-row">
                <span class="version-info-label">Versão</span>
                <span class="version-info-value">${escapeHtml(version.version)}</span>
            </div>

            <div class="version-info-row">
                <span class="version-info-label">Atualizado em</span>
                <span class="version-info-value">${formatDate(version.updated_at)}</span>
            </div>
        </div>

        <div class="version-card-footer">
            <a href="#" class="version-history-link" onclick="openVersionHistory('${version.id}'); return false;">
                <i class="fa-solid fa-clock-rotate-left"></i>
                Histórico de Atualização
            </a>
            <span class="version-time-badge ${status}">${timeInfo}</span>
        </div>
    `;

    return card;
}

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
    const diffMs = now - updated;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);

    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return '1 dia';
    if (diffDays < 30) return `${diffDays} dias`;
    if (diffMonths === 1) return '1 mês';

    const remainingDays = diffDays - (diffMonths * 30);
    if (remainingDays === 0) return `${diffMonths} meses`;
    if (remainingDays === 1) return `${diffMonths} meses e 1 dia`;
    return `${diffMonths} meses e ${remainingDays} dias`;
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

    if (versionId) {
        // Edit mode
        const version = versionControls.find(v => v.id === versionId);
        if (version) {
            modalTitle.textContent = 'Editar Versão';
            document.getElementById('versionId').value = version.id;
            document.getElementById('versionClientSelect').value = version.client_id;
            document.getElementById('versionEnvironmentSelect').value = version.environment;
            document.getElementById('versionSystemSelect').value = version.system;
            document.getElementById('versionNumberInput').value = version.version;
            document.getElementById('versionAlertCheck').checked = version.has_alert;
            document.getElementById('versionNotesInput').value = version.notes || '';
        }
    } else {
        // Add mode
        modalTitle.textContent = 'Nova Versão';
    }

    modal.classList.remove('hidden');
}

function closeVersionModal() {
    const modal = document.getElementById('versionModal');
    if (modal) modal.classList.add('hidden');
}

// ===================================
// SAVE VERSION
// ===================================

async function handleVersionSubmit(e) {
    e.preventDefault();

    const versionId = document.getElementById('versionId').value;
    const clientId = document.getElementById('versionClientSelect').value;
    const environment = document.getElementById('versionEnvironmentSelect').value;
    const system = document.getElementById('versionSystemSelect').value;
    const version = document.getElementById('versionNumberInput').value;
    const hasAlert = document.getElementById('versionAlertCheck').checked;
    const notes = document.getElementById('versionNotesInput').value;

    const versionData = {
        client_id: clientId,
        environment,
        system,
        version,
        has_alert: hasAlert,
        notes,
        updated_at: new Date().toISOString()
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
        showToast('Erro ao salvar versão', 'error');
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
            .order('created_at', { ascending: false });

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

// Make functions globally available
window.editVersion = openVersionModal;
window.deleteVersion = deleteVersion;
window.openVersionHistory = openVersionHistory;
window.loadVersionControls = loadVersionControls;
