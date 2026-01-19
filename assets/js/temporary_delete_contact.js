
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
