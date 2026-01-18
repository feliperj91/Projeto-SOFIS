#!/bin/bash

# Script de diagnóstico do Apache para SOFIS
# Execute com: bash diagnose_apache.sh

echo "🔍 Diagnóstico do Apache - SOFIS"
echo "=================================="
echo ""

echo "📁 1. Verificando arquivos no diretório web:"
ls -la /var/www/html/sofis/ | head -20
echo ""

echo "📄 2. Verificando se login.html existe:"
if [ -f /var/www/html/sofis/login.html ]; then
    echo "✅ login.html encontrado"
else
    echo "❌ login.html NÃO encontrado"
fi
echo ""

echo "⚙️ 3. Configuração do site SOFIS:"
cat /etc/apache2/sites-available/sofis.conf
echo ""

echo "🔗 4. Sites habilitados:"
ls -la /etc/apache2/sites-enabled/
echo ""

echo "🌐 5. Site padrão do Apache:"
cat /etc/apache2/sites-available/000-default.conf | grep DocumentRoot
echo ""

echo "📋 6. Verificando qual site está ativo:"
apache2ctl -S 2>/dev/null || apachectl -S
echo ""

echo "💡 Sugestão: Se o site padrão estiver ativo, desabilite-o:"
echo "   sudo a2dissite 000-default.conf"
echo "   sudo a2ensite sofis.conf"
echo "   sudo service apache2 reload"
