-- =====================================================================
--  Plateforme de gestion des audits, de la conformité et des risques
--  Cible : MySQL 8 / MariaDB 10+  (compatible phpMyAdmin)
--  Encodage : utf8mb4
-- =====================================================================

--SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS justification_non_conformite;
DROP TABLE IF EXISTS plan_mitigation;
DROP TABLE IF EXISTS risque;
DROP TABLE IF EXISTS action_corrective;
DROP TABLE IF EXISTS preuve;
DROP TABLE IF EXISTS commentaire;
DROP TABLE IF EXISTS notification;
DROP TABLE IF EXISTS historique;
DROP TABLE IF EXISTS rapport;
DROP TABLE IF EXISTS reponse_audit;
DROP TABLE IF EXISTS non_conformite;
DROP TABLE IF EXISTS categorie_non_conformite;
DROP TABLE IF EXISTS question_checklist;
DROP TABLE IF EXISTS modele_checklist;
DROP TABLE IF EXISTS audit;
DROP TABLE IF EXISTS document_reference;
DROP TABLE IF EXISTS objectif;
DROP TABLE IF EXISTS projet;
DROP TABLE IF EXISTS role_permission;
DROP TABLE IF EXISTS permission;
DROP TABLE IF EXISTS utilisateur;
DROP TABLE IF EXISTS role;
DROP TABLE IF EXISTS departement;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
--  1. ADMINISTRATION
-- =====================================================================

CREATE TABLE departement (
    id_departement  INT AUTO_INCREMENT PRIMARY KEY,
    nom             VARCHAR(100) NOT NULL,
    description     TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE role (
    id_role      INT AUTO_INCREMENT PRIMARY KEY,
    nom          VARCHAR(50) NOT NULL,
    description  VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE permission (
    id_permission  INT AUTO_INCREMENT PRIMARY KEY,
    nom            VARCHAR(100) NOT NULL,
    description    VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE utilisateur (
    id_utilisateur      INT AUTO_INCREMENT PRIMARY KEY,
    id_role             INT NOT NULL,
    id_departement      INT NOT NULL,
    nom                 VARCHAR(50) NOT NULL,
    prenom              VARCHAR(50),
    email               VARCHAR(150) NOT NULL UNIQUE,
    mot_de_passe        VARCHAR(255) NOT NULL,        -- stocke un HASH, pas le mot de passe en clair
    telephone           VARCHAR(20),                  -- varchar, pas numeric (zéros initiaux, +, etc.)
    photo               VARCHAR(255),
    date_creation       DATETIME DEFAULT CURRENT_TIMESTAMP,
    derniere_connexion  DATETIME,
    CONSTRAINT fk_utilisateur_role        FOREIGN KEY (id_role)        REFERENCES role(id_role),
    CONSTRAINT fk_utilisateur_departement FOREIGN KEY (id_departement) REFERENCES departement(id_departement)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE role_permission (
    id_role        INT NOT NULL,
    id_permission  INT NOT NULL,
    PRIMARY KEY (id_role, id_permission),
    CONSTRAINT fk_rp_role       FOREIGN KEY (id_role)       REFERENCES role(id_role),
    CONSTRAINT fk_rp_permission FOREIGN KEY (id_permission) REFERENCES permission(id_permission)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================================
--  2. PROJETS
-- =====================================================================

CREATE TABLE projet (
    id_projet       INT AUTO_INCREMENT PRIMARY KEY,
    id_departement  INT NOT NULL,
    nom             VARCHAR(100) NOT NULL,
    description     TEXT,
    date_debut      DATE,
    budget          DECIMAL(12,2),
    priorite        VARCHAR(20),
    statut          VARCHAR(30),
    CONSTRAINT fk_projet_departement FOREIGN KEY (id_departement) REFERENCES departement(id_departement)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE objectif (
    id_objectif     INT AUTO_INCREMENT PRIMARY KEY,
    id_departement  INT NOT NULL,
    id_projet       INT NOT NULL,
    nom             VARCHAR(100) NOT NULL,
    description     TEXT,
    valeur_cible    DECIMAL(12,2),
    date_debut      DATE,
    date_fin        DATE,
    statut          VARCHAR(30),
    CONSTRAINT fk_objectif_departement FOREIGN KEY (id_departement) REFERENCES departement(id_departement),
    CONSTRAINT fk_objectif_projet      FOREIGN KEY (id_projet)      REFERENCES projet(id_projet)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE document_reference (
    id_document  INT AUTO_INCREMENT PRIMARY KEY,
    id_projet    INT NOT NULL,
    nom          VARCHAR(150) NOT NULL,
    version      VARCHAR(20),
    type         VARCHAR(50),
    chemin       VARCHAR(255),
    CONSTRAINT fk_document_projet FOREIGN KEY (id_projet) REFERENCES projet(id_projet)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================================
--  3. CHECKLISTS & AUDITS
-- =====================================================================

CREATE TABLE modele_checklist (
    id_modele    INT AUTO_INCREMENT PRIMARY KEY,
    nom          VARCHAR(100) NOT NULL,
    description  TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE question_checklist (
    id_question       INT AUTO_INCREMENT PRIMARY KEY,
    id_modele         INT NOT NULL,
    libelle           VARCHAR(255) NOT NULL,
    reponse_attendue  VARCHAR(255),
    CONSTRAINT fk_question_modele FOREIGN KEY (id_modele) REFERENCES modele_checklist(id_modele)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE audit (
    id_audit        INT AUTO_INCREMENT PRIMARY KEY,
    id_departement  INT NOT NULL,
    id_utilisateur  INT NOT NULL,                    -- auditeur
    id_projet       INT NOT NULL,
    titre           VARCHAR(150),
    objectif        VARCHAR(255),
    perimetre       VARCHAR(255),
    date_planifiee  DATE,
    date_debut      DATE,
    date_fin        DATE,                            -- corrige le champ "V" généré par erreur
    statut          VARCHAR(30),
    type_audit      VARCHAR(50),
    description     TEXT,
    CONSTRAINT fk_audit_departement FOREIGN KEY (id_departement) REFERENCES departement(id_departement),
    CONSTRAINT fk_audit_utilisateur FOREIGN KEY (id_utilisateur) REFERENCES utilisateur(id_utilisateur),
    CONSTRAINT fk_audit_projet      FOREIGN KEY (id_projet)      REFERENCES projet(id_projet)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE reponse_audit (
    id_reponse      INT AUTO_INCREMENT PRIMARY KEY,
    id_audit        INT NOT NULL,
    id_question     INT NOT NULL,
    id_utilisateur  INT NOT NULL,
    reponse         VARCHAR(255),
    conformite      ENUM('conforme','non_conforme','non_applicable'),  -- AJOUT : indispensable pour les taux Power BI
    commentaire     VARCHAR(255),
    date_reponse    DATETIME,                        -- était varchar(50), corrigé en datetime
    CONSTRAINT fk_reponse_audit       FOREIGN KEY (id_audit)       REFERENCES audit(id_audit),
    CONSTRAINT fk_reponse_question    FOREIGN KEY (id_question)    REFERENCES question_checklist(id_question),
    CONSTRAINT fk_reponse_utilisateur FOREIGN KEY (id_utilisateur) REFERENCES utilisateur(id_utilisateur)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE rapport (
    id_rapport       INT AUTO_INCREMENT PRIMARY KEY,
    id_audit         INT NOT NULL,
    id_utilisateur   INT NOT NULL,
    type             VARCHAR(50),
    nom_fichier      VARCHAR(150),
    date_generation  DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_rapport_audit       FOREIGN KEY (id_audit)       REFERENCES audit(id_audit),
    CONSTRAINT fk_rapport_utilisateur FOREIGN KEY (id_utilisateur) REFERENCES utilisateur(id_utilisateur)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================================
--  4. NON-CONFORMITÉS
-- =====================================================================

CREATE TABLE categorie_non_conformite (
    id_categorie  INT AUTO_INCREMENT PRIMARY KEY,
    nom           VARCHAR(100) NOT NULL,
    description   TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE non_conformite (
    id_non_conformite  INT AUTO_INCREMENT PRIMARY KEY,
    id_categorie       INT NOT NULL,
    titre              VARCHAR(150),
    description        TEXT,
    gravite            VARCHAR(20),
    date_fin           DATE,                         -- corrige le champ "V" généré par erreur
    priorite           VARCHAR(20),
    CONSTRAINT fk_nc_categorie FOREIGN KEY (id_categorie) REFERENCES categorie_non_conformite(id_categorie)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table d'association réponse d'audit <-> non-conformité
CREATE TABLE justification_non_conformite (
    id_reponse         INT NOT NULL,
    id_non_conformite  INT NOT NULL,
    PRIMARY KEY (id_reponse, id_non_conformite),
    CONSTRAINT fk_jnc_reponse FOREIGN KEY (id_reponse)        REFERENCES reponse_audit(id_reponse),
    CONSTRAINT fk_jnc_nc      FOREIGN KEY (id_non_conformite) REFERENCES non_conformite(id_non_conformite)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE preuve (
    id_preuve          INT AUTO_INCREMENT PRIMARY KEY,
    id_non_conformite  INT NOT NULL,
    nom_fichier        VARCHAR(150),
    chemin_fichier     VARCHAR(255),
    type_fichier       VARCHAR(50),
    date_ajout         DATE,
    CONSTRAINT fk_preuve_nc FOREIGN KEY (id_non_conformite) REFERENCES non_conformite(id_non_conformite)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE action_corrective (
    id_action          INT AUTO_INCREMENT PRIMARY KEY,
    id_non_conformite  INT NOT NULL,
    id_utilisateur     INT NOT NULL,                 -- responsable
    description        TEXT,
    date_limite        DATE,
    date_realisation   DATE,
    statut             VARCHAR(20),
    priorite           VARCHAR(20),
    CONSTRAINT fk_action_nc          FOREIGN KEY (id_non_conformite) REFERENCES non_conformite(id_non_conformite),
    CONSTRAINT fk_action_utilisateur FOREIGN KEY (id_utilisateur)    REFERENCES utilisateur(id_utilisateur)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================================
--  5. RISQUES
-- =====================================================================

CREATE TABLE risque (
    id_risque          INT AUTO_INCREMENT PRIMARY KEY,
    id_non_conformite  INT NOT NULL,
    nom                VARCHAR(100),
    description        TEXT,
    impact             INT,
    probabilite        INT,
    criticite          INT,
    statut             VARCHAR(20),
    CONSTRAINT fk_risque_nc FOREIGN KEY (id_non_conformite) REFERENCES non_conformite(id_non_conformite)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE plan_mitigation (
    id_plan      INT AUTO_INCREMENT PRIMARY KEY,
    id_risque    INT NOT NULL,
    description  TEXT,
    date_limite  DATE,
    statut       VARCHAR(20),
    CONSTRAINT fk_plan_risque FOREIGN KEY (id_risque) REFERENCES risque(id_risque)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================================
--  6. COLLABORATION & TRAÇABILITÉ
-- =====================================================================

CREATE TABLE commentaire (
    id_commentaire     INT AUTO_INCREMENT PRIMARY KEY,
    id_utilisateur     INT NOT NULL,
    id_audit           INT NULL,                     -- rendu optionnel : un commentaire ne porte pas forcément sur un audit
    id_non_conformite  INT NULL,                     -- ... ni forcément sur une non-conformité
    contenu            TEXT NOT NULL,
    date_commentaire   DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_com_utilisateur FOREIGN KEY (id_utilisateur)    REFERENCES utilisateur(id_utilisateur),
    CONSTRAINT fk_com_audit       FOREIGN KEY (id_audit)          REFERENCES audit(id_audit),
    CONSTRAINT fk_com_nc          FOREIGN KEY (id_non_conformite) REFERENCES non_conformite(id_non_conformite)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE notification (
    id_notification  INT AUTO_INCREMENT PRIMARY KEY,
    id_utilisateur   INT NOT NULL,
    id_audit         INT NULL,                       -- rendu optionnel
    titre            VARCHAR(150),
    message          TEXT,
    lue              BOOLEAN DEFAULT FALSE,          -- était "long varchar", corrigé en booléen
    date_envoi       DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notif_utilisateur FOREIGN KEY (id_utilisateur) REFERENCES utilisateur(id_utilisateur),
    CONSTRAINT fk_notif_audit       FOREIGN KEY (id_audit)       REFERENCES audit(id_audit)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE historique (
    id_historique   INT AUTO_INCREMENT PRIMARY KEY,
    id_utilisateur  INT NOT NULL,
    id_audit        INT NULL,
    action          VARCHAR(100) NOT NULL,
    description     TEXT,
    date_action     DATETIME DEFAULT CURRENT_TIMESTAMP,
    adresse_ip      VARCHAR(50),
    CONSTRAINT fk_hist_utilisateur FOREIGN KEY (id_utilisateur) REFERENCES utilisateur(id_utilisateur),
    CONSTRAINT fk_hist_audit       FOREIGN KEY (id_audit)       REFERENCES audit(id_audit)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
