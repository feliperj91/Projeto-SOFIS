#!/bin/bash

# Script para configurar o Apache para o SOFIS
# Execute com: sudo bash configure_apache.sh

echo "🔧 Configurando Apache para SOFIS..."

# Copiar arquivo de configuração
echo "📁 Copiando arquivo de configuração..."
cp sofis.conf /etc/apache2/sites-available/sofis.conf

# Habilitar o site
echo "✅ Habilitando site SOFIS..."
a2ensite sofis.conf

# Habilitar módulo PHP
echo "🐘 Habilitando módulo PHP..."
a2enmod php8.1 2>/dev/null || a2enmod php8.2 2>/dev/null || a2enmod php

# Habilitar módulo rewrite
echo "🔄 Habilitando módulo rewrite..."
a2enmod rewrite

# Testar configuração
echo "🧪 Testando configuração do Apache..."
apache2ctl configtest 2>/dev/null || apachectl configtest

# Reiniciar Apache
echo "🔄 Reiniciando Apache..."
systemctl restart apache2 2>/dev/null || service apache2 restart 2>/dev/null || /etc/init.d/apache2 restart

echo ""
echo "✅ Configuração concluída!"
echo "📍 Acesse: http://localhost/sofis/login.html"
