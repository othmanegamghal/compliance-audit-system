# Backend — Compliance Audit System (FastAPI + MySQL)

API REST pour la plateforme de gestion des audits, de la conformité et des non-conformités.

## Stack
- **FastAPI** (Python 3.13) — API REST + documentation auto (Swagger)
- **SQLAlchemy 2** — ORM
- **MySQL / MariaDB** (base `audit` sous XAMPP)
- **JWT** (python-jose) + **bcrypt** (passlib) — authentification

## Prérequis
- XAMPP démarré (module **MySQL**)
- La base `audit` importée (via `phpMyAdmin` avec `audit_mysql.sql`)
- Python 3.13

## Installation

```bash
cd backend
python -m venv venv
venv\Scripts\activate           # Windows
pip install -r requirements.txt
```

## Configuration
Les paramètres sont dans `.env` :
```
DATABASE_URL=mysql+pymysql://root:@localhost:3306/audit
SECRET_KEY=...
ACCESS_TOKEN_EXPIRE_MINUTES=1440
CORS_ORIGINS=http://localhost:5173
DEMO_PASSWORD=Demo1234!
```

## Mise en route (première fois)

1. Appliquer les ajustements de schéma (colonnes additionnelles nécessaires au frontend) :
   ```bash
   "C:/xampp/mysql/bin/mysql.exe" -u root < db/001_alter_schema.sql
   ```
2. Peupler les données de démonstration :
   ```bash
   venv\Scripts\python -m app.seed
   ```
3. Lancer le serveur :
   ```bash
   venv\Scripts\python -m uvicorn app.main:app --reload --port 8000
   ```

- API : http://localhost:8000/api
- Documentation interactive (Swagger) : http://localhost:8000/docs

## Comptes de démonstration
Mot de passe commun : **Demo1234!**

| Rôle    | Email                          |
|---------|--------------------------------|
| admin   | sarah.connor@compliance.io     |
| auditor | marcus.wright@compliance.io    |
| manager | john.connor@compliance.io      |
| manager | kyle.reese@compliance.io       |
| manager | kate.connor@compliance.io      |
| manager | laura.kim@compliance.io        |

## Principaux endpoints
- `POST /api/auth/login`, `GET /api/auth/me`
- `GET/POST /api/users`, `PATCH /api/users/{id}`
- `GET/POST /api/departments`
- `GET/POST /api/templates`
- `GET/POST /api/audits`, `GET /api/audits/{id}`, `PUT /api/audits/{id}/answers`
- `GET /api/findings`, `PATCH /api/findings/{id}`
- `GET/POST /api/actions`, `PATCH /api/actions/{id}`
- `GET /api/notifications/me`, `PATCH /api/notifications/{id}/read`, `PATCH /api/notifications/read-all`
- `POST /api/uploads`

## Logique métier automatisée
- **Score d'audit** : `Oui = 100%`, `Partiel = 50%`, `Non = 0%` (moyenne des réponses évaluées).
- À la **soumission finale** d'un audit : le statut passe à `closed`, et chaque réponse `Non`/`Partiel`
  génère automatiquement une **non-conformité** assignée au manager du département + une notification.
- Passer une non-conformité en `action_pending` avec un texte d'action crée automatiquement une
  **action corrective** (statut `todo`) assignée au responsable.
- Quand **toutes** les actions d'une non-conformité sont `completed`, la non-conformité passe à
  `action_completed` et l'auditeur d'origine est notifié pour validation.

## Génération IA du rapport d'audit (Claude / Anthropic)

À la clôture d'un audit, l'auditeur peut générer une **synthèse rédigée par l'IA**
(résumé exécutif, constats majeurs, recommandations, conclusion) à partir des
réponses, des non-conformités et du taux de conformité.

Configuration — **option gratuite (Groq)**, recommandée :
1. Créer un compte gratuit sur https://console.groq.com (sans carte bancaire)
2. Créer une clé API (« API Keys ») — elle commence par `gsk_`
3. La renseigner dans `backend/.env` : `GROQ_API_KEY=gsk_...`
4. Redémarrer le serveur.

Option payante facultative : `ANTHROPIC_API_KEY=sk-ant-...` (Claude). Si les deux
sont présentes, Groq est prioritaire.

Sans aucune clé, l'endpoint renvoie un message clair (503) et l'interface l'affiche.

- `POST /api/reports/audits/{id}/generate-ai` (auditor/admin/direction) — génère et stocke le rapport IA.
- `GET  /api/reports/audits/{id}/ai` — renvoie le dernier rapport IA (ou `null`).
- Le contenu IA est aussi intégré dans le PDF (`GET /api/reports/audits/{id}/pdf`).

Fournisseur par défaut : **Groq** (`llama-3.3-70b-versatile`, configurable via `GROQ_MODEL`),
appelé en HTTP direct (`httpx`, aucun SDK à installer). Le rapport est sérialisé en JSON
dans la colonne `rapport.contenu` (migration `db/003_alter_rapport_ai.sql`).

## Réinitialiser les données de démo
```bash
# Vider puis re-remplir (voir commande TRUNCATE dans l'historique du projet), puis :
venv\Scripts\python -m app.seed
```
