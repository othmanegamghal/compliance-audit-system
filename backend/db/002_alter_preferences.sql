-- =====================================================================
--  Préférences utilisateur : langue et fuseau horaire (persistés en base)
-- =====================================================================

USE audit;

ALTER TABLE utilisateur
    ADD COLUMN langue VARCHAR(5) DEFAULT 'en' AFTER actif,
    ADD COLUMN timezone VARCHAR(20) DEFAULT 'utc+0' AFTER langue;
