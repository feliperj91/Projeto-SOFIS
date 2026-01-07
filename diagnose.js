(function () {
    // Error Catcher
    const errors = [];
    const logError = (msg) => {
        errors.push(msg);
        updateOverlay();
    };

    window.onerror = function (msg, url, line, col, error) {
        logError(`GLOBAL ERROR: ${msg}\nLine: ${line}:${col}\nURL: ${url}`);
        return false;
    };

    window.addEventListener('unhandledrejection', function (event) {
        logError(`UNHANDLED PROMISE: ${event.reason}`);
    });

    // Diagnóstico
    window.addEventListener('load', () => {
        setTimeout(() => {
            const checks = [];

            // 1. Supabase Lib
            if (typeof window.supabase !== 'undefined') checks.push("✅ Lib Supabase (@supabase/supabase-js) carregada");
            else checks.push("❌ Lib Supabase NÃO encontrada");

            // 2. Supabase Client
            if (window.supabaseClient) checks.push("✅ Cliente Supabase inicializado");
            else checks.push("❌ Cliente Supabase (window.supabaseClient) é NULL");

            // 3. User LocalStorage
            const user = localStorage.getItem('sofis_user');
            if (user) checks.push(`✅ LocalStorage User: ${user}`);
            else checks.push("⚠️ LocalStorage User vazio (Logoff?)");

            // 4. Permissions
            if (window.Permissions) {
                checks.push(`✅ Permissions Object existe. Role: ${window.Permissions.userRole}`);
                checks.push(`Rules loaded: ${Object.keys(window.Permissions.rules || {}).length}`);
            } else {
                checks.push("❌ window.Permissions não existe");
            }

            logError("--- DIAGNÓSTICO ---\n" + checks.join('\n'));
        }, 2000);
    });

    // UI Overlay
    function updateOverlay() {
        let el = document.getElementById('debug-overlay');
        if (!el) {
            el = document.createElement('div');
            el.id = 'debug-overlay';
            el.style.position = 'fixed';
            el.style.top = '0';
            el.style.left = '0';
            el.style.width = '100%';
            el.style.height = 'auto';
            el.style.maxHeight = '50%';
            el.style.backgroundColor = 'rgba(255, 0, 0, 0.9)';
            el.style.color = 'white';
            el.style.zIndex = '999999';
            el.style.overflowY = 'scroll';
            el.style.padding = '20px';
            el.style.fontFamily = 'monospace';
            el.style.fontSize = '14px';
            el.style.whiteSpace = 'pre-wrap';
            document.body.appendChild(el);

            const closeBtn = document.createElement('button');
            closeBtn.textContent = 'FECHAR DEBUG';
            closeBtn.style.position = 'fixed';
            closeBtn.style.top = '10px';
            closeBtn.style.right = '10px';
            closeBtn.onclick = () => el.remove();
            document.body.appendChild(closeBtn);
        }
        el.textContent = errors.join('\n\n');
    }
})();
