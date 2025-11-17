# 📋 Guide d'Installation Complète - Nouvelle Machine

Ce guide vous aidera à installer toutes les dépendances nécessaires pour faire fonctionner l'application sur une nouvelle machine.

---

## 🔧 1. LOGICIELS REQUIS À INSTALLER

### A. Node.js et npm
**Version recommandée :** Node.js v16 ou supérieur (v18+ recommandé)

**Installation :**
- **Windows :** Télécharger depuis [nodejs.org](https://nodejs.org/)
  - Télécharger la version LTS (Long Term Support)
  - Installer avec les options par défaut
  - Vérifier l'installation :
    ```bash
    node --version
    npm --version
    ```

### B. PostgreSQL
**Version recommandée :** PostgreSQL 12 ou supérieur

**Installation :**
- **Windows :** Télécharger depuis [postgresql.org/download/windows](https://www.postgresql.org/download/windows/)
  - Installer avec PostgreSQL Installer
  - **IMPORTANT :** Notez le mot de passe que vous définissez pour l'utilisateur `postgres`
  - Vérifier l'installation :
    ```bash
    psql --version
    ```

### C. Git (optionnel mais recommandé)
- Télécharger depuis [git-scm.com](https://git-scm.com/download/win)

---

## 📦 2. INSTALLATION DES DÉPENDANCES NPM

### A. Installation des dépendances Backend

```bash
cd backend
npm install
```

**Bibliothèques installées :**
- `@prisma/client` (^6.18.0) - Client Prisma pour la base de données
- `bcryptjs` (^3.0.2) - Hachage des mots de passe
- `cors` (^2.8.5) - Configuration CORS
- `dotenv` (^16.4.5) - Gestion des variables d'environnement
- `express` (^5.1.0) - Framework web Node.js
- `jsonwebtoken` (^9.0.2) - Authentification JWT

**Dépendances de développement :**
- `nodemon` (^3.1.10) - Redémarrage automatique du serveur
- `prisma` (^6.18.0) - CLI Prisma
- `@types/node`, `@types/bcryptjs`, `@types/jsonwebtoken` - Types TypeScript

### B. Installation des dépendances Frontend

```bash
cd frontend
npm install
```

**Bibliothèques installées :**
- `react` (^19.2.0) - Framework React
- `react-dom` (^19.2.0) - DOM React
- `react-router-dom` (^7.1.2) - Routage React
- `axios` (^1.13.1) - Client HTTP pour les appels API
- `jspdf` (^3.0.3) - Génération de PDF
- `jspdf-autotable` (^5.0.2) - Tables dans PDF
- `react-scripts` (^5.0.1) - Scripts Create React App

### C. Installation des dépendances racine (optionnel)

```bash
# À la racine du projet
npm install
```

**Dépendances :**
- `concurrently` (^9.2.1) - Pour lancer backend et frontend simultanément

---

## 🗄️ 3. CONFIGURATION DE LA BASE DE DONNÉES

### A. Créer la base de données PostgreSQL

1. **Ouvrir pgAdmin ou psql :**

```bash
# Via psql en ligne de commande
psql -U postgres
```

2. **Créer la base de données :**

```sql
CREATE DATABASE paintstore;
\q
```

**OU via pgAdmin :**
- Ouvrir pgAdmin
- Clic droit sur "Databases" → "Create" → "Database"
- Nom : `paintstore`
- Sauvegarder

### B. Configuration du fichier .env

Créer un fichier `.env` dans le dossier `backend/` :

```env
# URL de connexion à la base de données PostgreSQL
# Format: postgresql://utilisateur:mot_de_passe@localhost:port/nom_base
DATABASE_URL="postgresql://postgres:votre_mot_de_passe@localhost:5432/paintstore"

# Port du serveur backend
PORT=5000

# Environnement (development, production)
NODE_ENV=development

# Origine CORS (URL du frontend)
CORS_ORIGIN=http://localhost:3000

# Secret JWT (changez cette valeur en production!)
JWT_SECRET=your-super-secret-key-change-this-in-production

# Durée d'expiration du token JWT
JWT_EXPIRES_IN=7d
```

**⚠️ IMPORTANT :**
- Remplacez `votre_mot_de_passe` par le mot de passe PostgreSQL que vous avez défini
- Changez `JWT_SECRET` par une clé secrète forte en production

---

## 🔨 4. SETUP DE PRISMA

### A. Générer le client Prisma

```bash
cd backend
npx prisma generate
```

Cette commande génère le client Prisma dans `backend/generated/prisma/`

### B. Appliquer les migrations

```bash
cd backend
npx prisma migrate deploy
```

OU si vous voulez créer une nouvelle migration :

```bash
npx prisma migrate dev
```

Cette commande crée toutes les tables dans la base de données selon le schéma Prisma.

### C. Remplir la base de données avec des données de test (optionnel)

```bash
cd backend
npx prisma db seed
```

**Données créées :**
- 2 Utilisateurs (1 Admin, 1 Gestionnaire)
- 6 Marques (Loggia, Venixia, Pigma Color, Rolux, Casapaint, Valpaint)
- 4 Catégories (peinture, accessoires, supports, outil)
- 3 Clients
- 6 Produits
- 1 Achat d'exemple

**Identifiants par défaut après le seed :**
- **Admin :** `admin@gmail.com` / `djalildjt`
- **Gestionnaire :** `djalil@gmail.com` / `djalildjt`

---

## 🚀 5. LANCER L'APPLICATION

### Option 1 : Lancer depuis la racine (les deux en même temps)

```bash
# À la racine du projet
npm start
```

### Option 2 : Lancer séparément

**Terminal 1 - Backend :**
```bash
cd backend
npm start
```
Le backend sera accessible sur : `http://localhost:5000`

**Terminal 2 - Frontend :**
```bash
cd frontend
npm start
```
Le frontend sera accessible sur : `http://localhost:3000`

---

## ✅ 6. VÉRIFICATION DE L'INSTALLATION

### Vérifier que tout fonctionne :

1. **Backend :**
   - Ouvrir `http://localhost:5000`
   - Vérifier qu'il n'y a pas d'erreurs dans le terminal

2. **Frontend :**
   - Ouvrir `http://localhost:3000`
   - La page de login devrait s'afficher

3. **Base de données :**
   ```bash
   # Se connecter à PostgreSQL
   psql -U postgres -d paintstore
   
   # Vérifier les tables
   \dt
   
   # Quitter
   \q
   ```

---

## 🔍 7. RÉSUMÉ DES COMMANDES COMPLÈTES

Voici toutes les commandes dans l'ordre :

```bash
# 1. Installer Node.js (téléchargement manuel depuis nodejs.org)
# 2. Installer PostgreSQL (téléchargement manuel depuis postgresql.org)

# 3. Créer la base de données
psql -U postgres
CREATE DATABASE paintstore;
\q

# 4. Installer les dépendances backend
cd backend
npm install

# 5. Créer le fichier .env (voir section 3.B)

# 6. Générer Prisma Client
npx prisma generate

# 7. Appliquer les migrations
npx prisma migrate deploy

# 8. Remplir avec des données de test (optionnel)
npx prisma db seed

# 9. Installer les dépendances frontend
cd ../frontend
npm install

# 10. Installer les dépendances racine (optionnel)
cd ..
npm install

# 11. Lancer l'application
npm start
```

---

## 🐛 8. DÉPANNAGE

### Problème : "Cannot find module '@prisma/client'"
**Solution :**
```bash
cd backend
npx prisma generate
npm install
```

### Problème : "Error: connect ECONNREFUSED" (connexion base de données)
**Solutions :**
1. Vérifier que PostgreSQL est démarré
2. Vérifier le `DATABASE_URL` dans `.env`
3. Vérifier que la base de données `paintstore` existe

### Problème : "Port 5000 already in use"
**Solution :**
- Changer le port dans `backend/.env` : `PORT=5001`
- Ou arrêter le processus utilisant le port 5000

### Problème : "Port 3000 already in use"
**Solution :**
- Arrêter le processus utilisant le port 3000
- Ou lancer React sur un autre port : `PORT=3001 npm start`

### Problème : "Prisma schema not found"
**Solution :**
- Vérifier que vous êtes dans le dossier `backend/`
- Vérifier que `prisma/schema.prisma` existe

### Problème : Erreurs de migration
**Solution :**
```bash
cd backend
npx prisma migrate reset  # ⚠️ Supprime toutes les données!
npx prisma migrate deploy
npx prisma db seed
```

---

## 📝 9. FICHIERS À COPIER

Assurez-vous de copier tous ces fichiers/dossiers sur la nouvelle machine :

### Obligatoires :
- ✅ `backend/` (tout le dossier)
- ✅ `frontend/` (tout le dossier)
- ✅ `package.json` (racine)
- ✅ `package-lock.json` (racine)

### À créer manuellement :
- ⚠️ `backend/.env` (créer avec les valeurs de votre nouvelle machine)
- ⚠️ Base de données PostgreSQL (créer avec les commandes ci-dessus)

### À NE PAS copier :
- ❌ `node_modules/` (réinstaller avec `npm install`)
- ❌ `backend/generated/` (réinstaller avec `npx prisma generate`)
- ❌ Fichiers de cache (`.cache`, etc.)

---

## 📚 10. RÉFÉRENCES DES VERSIONS

### Versions recommandées :
- **Node.js :** v18.x LTS ou v20.x LTS
- **npm :** v9.x ou supérieur (vient avec Node.js)
- **PostgreSQL :** v14.x ou v15.x
- **Prisma :** ^6.18.0

### Pour vérifier les versions installées :
```bash
node --version
npm --version
psql --version
cd backend && npx prisma --version
```

---

## 🎯 11. CHECKLIST D'INSTALLATION

- [ ] Node.js installé et vérifié
- [ ] PostgreSQL installé et vérifié
- [ ] Base de données `paintstore` créée
- [ ] Fichier `backend/.env` créé avec les bonnes valeurs
- [ ] Dépendances backend installées (`cd backend && npm install`)
- [ ] Prisma Client généré (`npx prisma generate`)
- [ ] Migrations appliquées (`npx prisma migrate deploy`)
- [ ] Base de données remplie avec seed (optionnel) (`npx prisma db seed`)
- [ ] Dépendances frontend installées (`cd frontend && npm install`)
- [ ] Dépendances racine installées (`npm install`)
- [ ] Backend démarre sans erreur
- [ ] Frontend démarre sans erreur
- [ ] Application accessible sur `http://localhost:3000`

---

## 📞 12. SUPPORT

Si vous rencontrez des problèmes :

1. Vérifier les logs dans les terminaux (backend et frontend)
2. Vérifier les fichiers `.env` et les variables d'environnement
3. Vérifier que tous les services sont démarrés (PostgreSQL)
4. Vérifier les versions de Node.js et PostgreSQL
5. Consulter la section "Dépannage" ci-dessus

---

**Bon développement ! 🚀**







