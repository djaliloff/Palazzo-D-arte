# 📚 Liste Complète des Bibliothèques et Versions

## 🔙 Backend Dependencies

### Dépendances de production (`backend/package.json`)

| Bibliothèque | Version | Description |
|-------------|---------|-------------|
| `@prisma/client` | ^6.18.0 | Client Prisma pour interagir avec la base de données |
| `bcryptjs` | ^3.0.2 | Bibliothèque pour le hachage des mots de passe |
| `cors` | ^2.8.5 | Middleware Express pour configurer CORS |
| `dotenv` | ^16.4.5 | Chargement des variables d'environnement depuis .env |
| `express` | ^5.1.0 | Framework web Node.js pour créer l'API REST |
| `jsonwebtoken` | ^9.0.2 | Création et vérification des tokens JWT |

### Dépendances de développement (`backend/package.json`)

| Bibliothèque | Version | Description |
|-------------|---------|-------------|
| `@types/bcryptjs` | ^2.4.6 | Types TypeScript pour bcryptjs |
| `@types/jsonwebtoken` | ^9.0.6 | Types TypeScript pour jsonwebtoken |
| `@types/node` | ^24.9.2 | Types TypeScript pour Node.js |
| `nodemon` | ^3.1.10 | Outil pour redémarrer automatiquement le serveur lors des changements |
| `prisma` | ^6.18.0 | CLI Prisma pour les migrations et la génération du client |
| `ts-node` | ^10.9.2 | TypeScript execution pour Node.js |

---

## 🎨 Frontend Dependencies

### Dépendances de production (`frontend/package.json`)

| Bibliothèque | Version | Description |
|-------------|---------|-------------|
| `axios` | ^1.13.1 | Client HTTP pour faire des requêtes API |
| `jspdf` | ^3.0.3 | Bibliothèque pour générer des fichiers PDF |
| `jspdf-autotable` | ^5.0.2 | Extension pour créer des tableaux dans les PDF |
| `react` | ^19.2.0 | Bibliothèque React pour créer l'interface utilisateur |
| `react-dom` | ^19.2.0 | Renderer React pour le DOM |
| `react-router-dom` | ^7.1.2 | Routage côté client pour React |
| `react-scripts` | ^5.0.1 | Scripts et configuration pour Create React App |
| `web-vitals` | ^2.1.4 | Bibliothèque pour mesurer les performances web |

### Dépendances de développement (`frontend/package.json`)

| Bibliothèque | Version | Description |
|-------------|---------|-------------|
| `@testing-library/dom` | ^10.4.1 | Utilitaires de test pour le DOM |
| `@testing-library/jest-dom` | ^6.9.1 | Matchers Jest personnalisés pour le DOM |
| `@testing-library/react` | ^16.3.0 | Utilitaires de test pour React |
| `@testing-library/user-event` | ^13.5.0 | Simulation d'événements utilisateur pour les tests |

---

## 📦 Root Dependencies

### Dépendances de développement (`package.json` racine)

| Bibliothèque | Version | Description |
|-------------|---------|-------------|
| `concurrently` | ^9.2.1 | Lancer plusieurs commandes npm en parallèle |

---

## 🗄️ Base de Données

| Technologie | Version | Description |
|------------|---------|-------------|
| PostgreSQL | 12+ (recommandé: 14+) | Système de gestion de base de données relationnelle |
| Prisma | ^6.18.0 | ORM moderne pour Node.js et TypeScript |

---

## 🛠️ Outils Système Requis

| Outil | Version minimale | Version recommandée | Où télécharger |
|-------|------------------|---------------------|----------------|
| Node.js | v16.0.0 | v18.x LTS ou v20.x LTS | https://nodejs.org/ |
| npm | v7.0.0 | v9.x ou supérieur | (inclus avec Node.js) |
| PostgreSQL | v12.0.0 | v14.x ou v15.x | https://www.postgresql.org/download/ |

---

## 📋 Commandes pour Installer Toutes les Dépendances

### Backend
```bash
cd backend
npm install
```

### Frontend
```bash
cd frontend
npm install
```

### Racine
```bash
npm install
```

---

## 🔍 Vérifier les Versions Installées

### Vérifier Node.js et npm
```bash
node --version
npm --version
```

### Vérifier PostgreSQL
```bash
psql --version
```

### Vérifier Prisma
```bash
cd backend
npx prisma --version
```

### Vérifier les dépendances installées
```bash
# Backend
cd backend
npm list --depth=0

# Frontend
cd frontend
npm list --depth=0
```

---

## 📝 Notes Importantes

1. **Versions avec `^`** : Le `^` signifie que npm installera une version compatible (majeure identique). Par exemple, `^6.18.0` acceptera `6.18.0` jusqu'à `6.99.99`.

2. **Node.js** : Assurez-vous d'avoir Node.js v16 ou supérieur. Les versions LTS sont recommandées pour la stabilité.

3. **PostgreSQL** : La version minimale recommandée est PostgreSQL 12, mais PostgreSQL 14 ou 15 est préférable pour de meilleures performances.

4. **Prisma** : Après installation, vous devez générer le client Prisma :
   ```bash
   cd backend
   npx prisma generate
   ```

5. **Mises à jour** : Pour mettre à jour toutes les dépendances :
   ```bash
   npm update
   ```

---

## 🔄 Mettre à Jour les Dépendances

### Vérifier les mises à jour disponibles
```bash
# Backend
cd backend
npm outdated

# Frontend
cd frontend
npm outdated
```

### Mettre à jour une bibliothèque spécifique
```bash
npm install nom-bibliotheque@latest
```

### Mettre à jour toutes les dépendances (⚠️ tester avant en production)
```bash
npm update
```

---

## 📦 Taille Approximative des node_modules

- **Backend** : ~100-150 MB
- **Frontend** : ~200-300 MB
- **Total** : ~300-450 MB

*Note : Ces tailles peuvent varier selon votre système d'exploitation.*

---

**Dernière mise à jour :** Basé sur les fichiers package.json du projet







