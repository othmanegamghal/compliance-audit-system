-- =====================================================================
--  Ajustements additifs du schéma "audit" pour couvrir les besoins
--  du frontend (aucune colonne existante n'est modifiée de façon
--  destructive, aucune table n'est droppée). Toutes les tables sont
--  vides au moment de l'écriture de ce script.
-- =====================================================================

USE audit;

-- 1. Département : code court affiché dans l'UI
ALTER TABLE departement
    ADD COLUMN code VARCHAR(30) NULL AFTER nom;

-- 2. Utilisateur : statut actif/inactif
ALTER TABLE utilisateur
    ADD COLUMN actif BOOLEAN DEFAULT TRUE AFTER derniere_connexion;

-- 3. Modèle de checklist : auteur + date de création
ALTER TABLE modele_checklist
    ADD COLUMN id_utilisateur_creation INT NULL AFTER description,
    ADD COLUMN date_creation DATETIME DEFAULT CURRENT_TIMESTAMP AFTER id_utilisateur_creation,
    ADD CONSTRAINT fk_modele_utilisateur FOREIGN KEY (id_utilisateur_creation) REFERENCES utilisateur(id_utilisateur);

-- 4. Question de checklist : catégorie (regroupement thématique)
ALTER TABLE question_checklist
    ADD COLUMN categorie VARCHAR(100) NULL AFTER libelle;

-- 5. Réponse d'audit : preuve jointe + statut "partiel"
ALTER TABLE reponse_audit
    MODIFY COLUMN conformite ENUM('conforme','non_conforme','partiel','non_applicable'),
    ADD COLUMN preuve_nom VARCHAR(150) NULL AFTER commentaire,
    ADD COLUMN preuve_chemin VARCHAR(255) NULL AFTER preuve_nom;

-- 6. Audit : rattachement au modèle de checklist utilisé + date de création,
--    et projet devient optionnel (le frontend ne gère pas encore les projets)
ALTER TABLE audit
    ADD COLUMN id_modele INT NULL AFTER id_projet,
    ADD COLUMN date_creation DATETIME DEFAULT CURRENT_TIMESTAMP AFTER description,
    ADD CONSTRAINT fk_audit_modele FOREIGN KEY (id_modele) REFERENCES modele_checklist(id_modele),
    MODIFY COLUMN id_projet INT NULL;

-- 7. Non-conformité : rattachement direct à l'audit/question, statut, assignation, dates
ALTER TABLE non_conformite
    ADD COLUMN id_audit INT NULL AFTER id_categorie,
    ADD COLUMN id_question INT NULL AFTER id_audit,
    ADD COLUMN statut VARCHAR(20) DEFAULT 'open' AFTER gravite,
    ADD COLUMN id_utilisateur_assigne INT NULL AFTER statut,
    ADD COLUMN date_creation DATETIME DEFAULT CURRENT_TIMESTAMP AFTER date_fin,
    ADD COLUMN date_resolution DATETIME NULL AFTER date_creation,
    ADD CONSTRAINT fk_nc_audit FOREIGN KEY (id_audit) REFERENCES audit(id_audit),
    ADD CONSTRAINT fk_nc_question FOREIGN KEY (id_question) REFERENCES question_checklist(id_question),
    ADD CONSTRAINT fk_nc_assigne FOREIGN KEY (id_utilisateur_assigne) REFERENCES utilisateur(id_utilisateur);

-- 8. Notification : type (info/warning/success/danger) pour l'UI
ALTER TABLE notification
    ADD COLUMN type VARCHAR(20) DEFAULT 'info' AFTER message;
