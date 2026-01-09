#!/bin/bash
# deploy.sh
# Copia os arquivos do diretório atual para a pasta do servidor Apache
# Útil após um git pull para aplicar as alterações

TARGET_DIR="/var/www/html/sofis"
SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🔄 Iniciando deploy para $TARGET_DIR..."

if [ ! -d "$TARGET_DIR" ]; then
    echo "❌ Erro: Diretório de destino não encontrado. O projeto foi instalado?"
    exit 1
fi

# Copiar arquivos (sobrescrevendo)
sudo cp -r "$SOURCE_DIR"/* "$TARGET_DIR/"

# Ajustar permissões
sudo chown -R www-data:www-data "$TARGET_DIR"

echo "✅ Deploy concluído com sucesso!"
echo "➡️  Por favor, recarregue a página no navegador (Ctrl + F5)."
