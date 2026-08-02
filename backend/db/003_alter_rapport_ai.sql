-- =====================================================================
--  Stockage du rapport d'audit généré par l'IA (résumé exécutif,
--  constats majeurs, recommandations) sérialisé en JSON dans `contenu`.
-- =====================================================================

USE audit;

ALTER TABLE rapport
    ADD COLUMN contenu LONGTEXT NULL AFTER nom_fichier;
