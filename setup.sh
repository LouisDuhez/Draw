#!/bin/bash

# Script de démarrage automatique pour les étudiants
echo "🎨 Démarrage Draw App - MMI3 2025"
echo "=================================="

# Vérification Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js non installé. Installer depuis https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node --version)
echo "✅ Node.js détecté: $NODE_VERSION"

# Vérification nvm et version
if [ -f ".nvmrc" ]; then
    echo "🔧 Utilisation de la version Node.js du projet..."
    
    # Charger nvm dans le script
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    
    if nvm use; then
        echo "✅ Version Node.js configurée via nvm"
    else
        echo "⚠️  nvm non disponible. Vérifiez que vous utilisez Node.js v22.12+"
    fi
fi

# Installation des dépendances
echo "📦 Installation des dépendances..."

echo "  → Serveur..."
cd server && npm install --silent
if [ $? -ne 0 ]; then
    echo "❌ Erreur installation serveur"
    exit 1
fi

echo "  → Client..."
cd ../client && npm install --silent  
if [ $? -ne 0 ]; then
    echo "❌ Erreur installation client"
    exit 1
fi

# Configuration environnement
if [ ! -f ".env" ]; then
    echo "🔧 Copie configuration environnement..."
    cp .env.example .env
fi

echo ""
echo "✅ Installation terminée !"
echo ""
echo "🚀 Pour démarrer l'application :"
echo "   Terminal 1: cd server && npm run dev"
echo "   Terminal 2: cd client && npm run dev"
echo ""
echo "🌐 URLs :"
echo "   Serveur: http://localhost:3005"
echo "   Client:  http://localhost:5173"