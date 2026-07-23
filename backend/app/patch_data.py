"""Ajoute (de façon idempotente) le rôle Direction, le catalogue de permissions,
et des données de démonstration pour les nouveaux modules (projets, objectifs,
documents, risques, plans de mitigation) SANS écraser les données existantes.

Usage: python -m app.patch_data
"""
from datetime import date

from . import models
from .database import SessionLocal

PERMISSIONS = [
    ("manage_users", "Gérer les utilisateurs et les rôles"),
    ("manage_departments", "Gérer les départements"),
    ("manage_projects", "Gérer les projets et objectifs"),
    ("manage_templates", "Créer et modifier les modèles de checklist"),
    ("create_audit", "Planifier et créer des audits"),
    ("execute_audit", "Réaliser les audits"),
    ("manage_findings", "Gérer les non-conformités"),
    ("manage_actions", "Gérer les actions correctives"),
    ("manage_risks", "Gérer les risques et plans de mitigation"),
    ("view_reports", "Consulter et exporter les rapports"),
    ("view_history", "Consulter l'historique et la traçabilité"),
]

ROLE_PERMISSIONS = {
    "admin": [p[0] for p in PERMISSIONS],
    "direction": ["manage_projects", "manage_risks", "view_reports", "view_history", "manage_departments"],
    "auditor": ["manage_templates", "create_audit", "execute_audit", "manage_findings", "manage_risks", "view_reports"],
    "manager": ["manage_actions", "manage_findings", "manage_risks", "view_reports"],
}


def run():
    db = SessionLocal()
    try:
        # 1. Direction role
        direction = db.query(models.Role).filter(models.Role.nom == "direction").first()
        if direction is None:
            direction = models.Role(nom="direction", description="Direction / Comité de pilotage")
            db.add(direction)
            print("Rôle 'direction' ajouté.")
        db.flush()

        # 2. Permissions catalog
        existing_perms = {p.nom: p for p in db.query(models.Permission).all()}
        for name, desc in PERMISSIONS:
            if name not in existing_perms:
                p = models.Permission(nom=name, description=desc)
                db.add(p)
                existing_perms[name] = p
        db.flush()
        print(f"Permissions présentes: {len(existing_perms)}")

        # 3. Role-permission assignments
        roles = {r.nom: r for r in db.query(models.Role).all()}
        existing_rp = {(rp.id_role, rp.id_permission) for rp in db.query(models.RolePermission).all()}
        for role_name, perm_names in ROLE_PERMISSIONS.items():
            role = roles.get(role_name)
            if not role:
                continue
            for pname in perm_names:
                perm = existing_perms.get(pname)
                if perm and (role.id_role, perm.id_permission) not in existing_rp:
                    db.add(models.RolePermission(id_role=role.id_role, id_permission=perm.id_permission))
        db.commit()
        print("Assignations rôle-permission mises à jour.")

        # 4. Demo projects/objectives/documents (only if none exist)
        if db.query(models.Projet).count() == 0:
            dept_ops = db.query(models.Departement).first()
            dept_it = db.query(models.Departement).filter(models.Departement.code == "IT-SEC").first() or dept_ops
            p1 = models.Projet(
                id_departement=dept_it.id_departement,
                nom="Migration Cloud Sécurisée",
                description="Migration de l'infrastructure vers le cloud avec conformité ISO 27001.",
                date_debut=date(2026, 3, 1),
                budget=250000,
                priorite="high",
                statut="in_progress",
            )
            p2 = models.Projet(
                id_departement=dept_ops.id_departement,
                nom="Optimisation Chaîne Logistique",
                description="Amélioration des processus qualité et réduction des délais.",
                date_debut=date(2026, 1, 15),
                budget=120000,
                priorite="medium",
                statut="in_progress",
            )
            db.add_all([p1, p2])
            db.flush()
            db.add_all([
                models.Objectif(id_projet=p1.id_projet, id_departement=p1.id_departement, nom="Chiffrement de 100% des données", valeur_cible=100, date_debut=date(2026, 3, 1), date_fin=date(2026, 9, 1), statut="in_progress"),
                models.Objectif(id_projet=p1.id_projet, id_departement=p1.id_departement, nom="Réduire les incidents de 30%", valeur_cible=30, date_debut=date(2026, 3, 1), date_fin=date(2026, 12, 1), statut="in_progress"),
                models.Objectif(id_projet=p2.id_projet, id_departement=p2.id_departement, nom="Délai de livraison < 48h", valeur_cible=48, date_debut=date(2026, 1, 15), date_fin=date(2026, 6, 30), statut="in_progress"),
            ])
            db.add_all([
                models.DocumentReference(id_projet=p1.id_projet, nom="Norme ISO 27001:2022", version="2022", type="Norme", chemin="/docs/iso27001.pdf"),
                models.DocumentReference(id_projet=p1.id_projet, nom="Politique de sécurité interne", version="1.4", type="Politique", chemin="/docs/security-policy.pdf"),
                models.DocumentReference(id_projet=p2.id_projet, nom="Procédure Qualité Logistique", version="2.1", type="Procédure", chemin="/docs/quality-proc.pdf"),
            ])
            db.commit()
            print("Projets, objectifs et documents de démonstration ajoutés.")

        # 5. Demo risks + mitigation (linked to existing findings, only if none exist)
        if db.query(models.Risque).count() == 0:
            findings = db.query(models.NonConformite).limit(3).all()
            impacts = [5, 3, 4]
            probs = [4, 2, 3]
            names = [
                "Fuite de données sensibles",
                "Non-respect réglementaire GDPR",
                "Interruption de service",
            ]
            for f, imp, prob, nm in zip(findings, impacts, probs, names):
                risk = models.Risque(
                    id_non_conformite=f.id_non_conformite,
                    nom=nm,
                    description=f"Risque associé à: {f.titre or 'non-conformité'}",
                    impact=imp,
                    probabilite=prob,
                    criticite=imp * prob,
                    statut="open",
                )
                db.add(risk)
                db.flush()
                db.add(models.PlanMitigation(
                    id_risque=risk.id_risque,
                    description=f"Plan de réduction pour: {nm}",
                    date_limite=date(2026, 9, 1),
                    statut="todo",
                ))
            db.commit()
            print("Risques et plans de mitigation de démonstration ajoutés.")

        print("Patch terminé avec succès.")
    finally:
        db.close()


if __name__ == "__main__":
    run()
