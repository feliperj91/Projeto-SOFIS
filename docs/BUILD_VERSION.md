# Sistema de Versionamento Automático - SOFIS

## 📋 Como Atualizar a Build

Para atualizar o número de versão em **TODAS as telas do sistema**, edite apenas o arquivo:

```
build-config.js
```

### Exemplo:

```javascript
window.SOFIS_BUILD = {
    version: '1.9.61',  // ← Altere aqui
    date: '2025-12-30',
    time: '10:30'
};
```

### ✅ Telas Atualizadas Automaticamente:
- **Login** (login.html)
- **Sistema Principal** (index.html)

### 🔄 Não é mais necessário:
- ❌ Editar manualmente o HTML de cada tela
- ❌ Atualizar comentários de build
- ❌ Sincronizar versões entre arquivos

### 🚀 Benefícios:
- **Fonte única de verdade** para a versão
- **Atualização automática** em todas as telas
- **Menos erros** de sincronização
- **Manutenção simplificada**
