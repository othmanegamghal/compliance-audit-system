"""Peuple la base 'audit' avec des données de démonstration.

Usage: python -m app.seed
"""
from datetime import date, datetime

from . import models
from .config import settings
from .database import SessionLocal
from .security import hash_password


def run():
    db = SessionLocal()
    try:
        if db.query(models.Role).first() is not None:
            print("La base contient déjà des données (table 'role' non vide). Seed annulé.")
            return

        print("Création des rôles...")
        role_admin = models.Role(nom="admin", description="Administrateur système")
        role_auditor = models.Role(nom="auditor", description="Auditeur")
        role_manager = models.Role(nom="manager", description="Responsable de département")
        role_direction = models.Role(nom="direction", description="Direction / Comité de pilotage")
        db.add_all([role_admin, role_auditor, role_manager, role_direction])
        db.flush()

        print("Création des départements...")
        dept_ops = models.Departement(nom="Operations & Logistics", code="OPS-DEPT", description="Opérations et logistique")
        dept_it = models.Departement(nom="IT Infrastructure & Security", code="IT-SEC", description="Infrastructure et sécurité IT")
        dept_hr = models.Departement(nom="Human Resources", code="HR-CORP", description="Ressources humaines")
        dept_fin = models.Departement(nom="Finance & Accounts", code="FIN-ACC", description="Finance et comptabilité")
        db.add_all([dept_ops, dept_it, dept_hr, dept_fin])
        db.flush()

        print("Création des utilisateurs démo...")
        pwd = hash_password(settings.demo_password)
        sarah = models.Utilisateur(id_role=role_admin.id_role, id_departement=dept_ops.id_departement, nom="Connor", prenom="Sarah", email="sarah.connor@compliance.io", mot_de_passe=pwd, photo="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150")
        marcus = models.Utilisateur(id_role=role_auditor.id_role, id_departement=dept_ops.id_departement, nom="Wright", prenom="Marcus", email="marcus.wright@compliance.io", mot_de_passe=pwd, photo="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150")
        john = models.Utilisateur(id_role=role_manager.id_role, id_departement=dept_ops.id_departement, nom="Connor", prenom="John", email="john.connor@compliance.io", mot_de_passe=pwd, photo="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150")
        kyle = models.Utilisateur(id_role=role_manager.id_role, id_departement=dept_it.id_departement, nom="Reese", prenom="Kyle", email="kyle.reese@compliance.io", mot_de_passe=pwd, photo="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150")
        kate = models.Utilisateur(id_role=role_manager.id_role, id_departement=dept_hr.id_departement, nom="Connor", prenom="Kate", email="kate.connor@compliance.io", mot_de_passe=pwd, photo="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150")
        laura = models.Utilisateur(id_role=role_manager.id_role, id_departement=dept_fin.id_departement, nom="Kim", prenom="Laura", email="laura.kim@compliance.io", mot_de_passe=pwd, photo="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150")
        db.add_all([sarah, marcus, john, kyle, kate, laura])
        db.flush()

        print("Création de la catégorie de non-conformité par défaut...")
        cat_general = models.CategorieNonConformite(nom="Générale", description="Catégorie par défaut")
        db.add(cat_general)
        db.flush()

        print("Création des modèles de checklist...")
        tpl_iso27001 = models.ModeleChecklist(
            nom="ISO 27001 Information Security Standard",
            description="General Information Security checklist mapping controls for access management, backup policy, and data encryption.",
            id_utilisateur_creation=sarah.id_utilisateur,
        )
        tpl_gdpr = models.ModeleChecklist(
            nom="GDPR Privacy Compliance Audit",
            description="Privacy checklist focused on consent registration, data retention timelines, and data subject access requests.",
            id_utilisateur_creation=marcus.id_utilisateur,
        )
        tpl_iso9001 = models.ModeleChecklist(
            nom="ISO 9001 Quality Management System",
            description="Checks core standard operational compliance, documentation control, and management review records.",
            id_utilisateur_creation=sarah.id_utilisateur,
        )
        db.add_all([tpl_iso27001, tpl_gdpr, tpl_iso9001])
        db.flush()

        q101 = models.QuestionChecklist(id_modele=tpl_iso27001.id_modele, libelle="Are access control rights reviewed at regular intervals (at least annually)?", categorie="Access Control")
        q102 = models.QuestionChecklist(id_modele=tpl_iso27001.id_modele, libelle="Is backup data stored securely and tested periodically for restoration integrity?", categorie="Operations Security")
        q103 = models.QuestionChecklist(id_modele=tpl_iso27001.id_modele, libelle="Is sensitive data encrypted both at rest and in transit across corporate devices?", categorie="Cryptography")
        q104 = models.QuestionChecklist(id_modele=tpl_iso27001.id_modele, libelle="Are employees trained on security awareness within 30 days of hiring?", categorie="Human Resource Security")
        q105 = models.QuestionChecklist(id_modele=tpl_iso27001.id_modele, libelle="Is there a formal process for reporting and handling information security incidents?", categorie="Incident Management")

        q201 = models.QuestionChecklist(id_modele=tpl_gdpr.id_modele, libelle="Is user consent obtained explicitly before processing personal data?", categorie="Consent")
        q202 = models.QuestionChecklist(id_modele=tpl_gdpr.id_modele, libelle="Are data retention limits defined and data purged according to policy?", categorie="Data Retention")
        q203 = models.QuestionChecklist(id_modele=tpl_gdpr.id_modele, libelle="Is there a documented process for handling data subject access requests (DSAR)?", categorie="Subject Rights")
        q204 = models.QuestionChecklist(id_modele=tpl_gdpr.id_modele, libelle="Are processing registers updated and maintained on a regular basis?", categorie="Accountability")

        q301 = models.QuestionChecklist(id_modele=tpl_iso9001.id_modele, libelle="Are standard operating procedures (SOPs) documented, approved, and accessible?", categorie="Documentation")
        q302 = models.QuestionChecklist(id_modele=tpl_iso9001.id_modele, libelle="Is customer feedback logged and reviewed by management monthly?", categorie="Customer Focus")
        q303 = models.QuestionChecklist(id_modele=tpl_iso9001.id_modele, libelle="Are corrective actions from previous internal audits fully closed?", categorie="Improvement")

        db.add_all([q101, q102, q103, q104, q105, q201, q202, q203, q204, q301, q302, q303])
        db.flush()

        print("Création des audits d'exemple...")
        audit1 = models.Audit(
            id_departement=dept_it.id_departement,
            id_utilisateur=marcus.id_utilisateur,
            id_modele=tpl_iso27001.id_modele,
            titre="Q2 Security & Crypto Compliance Audit",
            statut="closed",
            date_fin=date(2026, 6, 15),
        )
        audit2 = models.Audit(
            id_departement=dept_hr.id_departement,
            id_utilisateur=marcus.id_utilisateur,
            id_modele=tpl_gdpr.id_modele,
            titre="Annual GDPR HR Process Audit",
            statut="in_progress",
        )
        audit3 = models.Audit(
            id_departement=dept_ops.id_departement,
            id_utilisateur=marcus.id_utilisateur,
            id_modele=tpl_iso9001.id_modele,
            titre="Q3 Quality Review Operations",
            statut="draft",
        )
        db.add_all([audit1, audit2, audit3])
        db.flush()

        def reponse(audit, question, value, comment):
            conformite_map = {"yes": "conforme", "no": "non_conforme", "partial": "partiel"}
            return models.ReponseAudit(
                id_audit=audit.id_audit,
                id_question=question.id_question,
                id_utilisateur=marcus.id_utilisateur,
                reponse=value,
                conformite=conformite_map[value],
                commentaire=comment,
                date_reponse=datetime(2026, 6, 15, 15, 30),
            )

        db.add_all([
            reponse(audit1, q101, "yes", "Access rights are checked quarterly by the team leads."),
            reponse(audit1, q102, "yes", "Backups restore tests succeeded on June 1st."),
            reponse(audit1, q103, "no", "Found 3 developer notebooks without BitLocker encryption active."),
            reponse(audit1, q104, "yes", "All onboarding modules updated in LMS."),
            reponse(audit1, q105, "partial", "Incidents are reported in Jira, but formal policy document lacks validation."),
            reponse(audit2, q201, "yes", "Explicit checkbox added in the job portal."),
            reponse(audit2, q202, "partial", "Retention policy exists, but clean-up scripts are not yet automated."),
            reponse(audit2, q203, "no", "No formal email templates or ticketing workflow to track DSAR requests."),
        ])
        db.flush()

        print("Création des non-conformités et actions correctives...")
        nc1 = models.NonConformite(
            id_categorie=cat_general.id_categorie,
            id_audit=audit1.id_audit,
            id_question=q103.id_question,
            titre=q103.libelle,
            description="Sensitive developer laptops lack standard disk encryption (BitLocker) posing database leak risks.",
            gravite="high",
            statut="action_completed",
            id_utilisateur_assigne=kyle.id_utilisateur,
            date_creation=datetime(2026, 6, 15, 15, 30),
        )
        nc2 = models.NonConformite(
            id_categorie=cat_general.id_categorie,
            id_audit=audit1.id_audit,
            id_question=q105.id_question,
            titre=q105.libelle,
            description="Security incident reporting workflow is active in Jira, but the formal SOP lacks review and sign-off.",
            gravite="medium",
            statut="resolved",
            id_utilisateur_assigne=kyle.id_utilisateur,
            date_creation=datetime(2026, 6, 15, 15, 30),
            date_resolution=datetime(2026, 6, 29, 10, 0),
        )
        nc3 = models.NonConformite(
            id_categorie=cat_general.id_categorie,
            id_audit=audit2.id_audit,
            id_question=q203.id_question,
            titre=q203.libelle,
            description="No formalized ticketing flow or SLA templates established to meet GDPR 30-day window for DSAR.",
            gravite="critical",
            statut="open",
            id_utilisateur_assigne=kate.id_utilisateur,
            date_creation=datetime(2026, 7, 1, 15, 0),
        )
        db.add_all([nc1, nc2, nc3])
        db.flush()

        db.add_all([
            models.ActionCorrective(id_non_conformite=nc1.id_non_conformite, id_utilisateur=kyle.id_utilisateur, description="Deploy Microsoft Intune policy to enforce BitLocker on all dev workstations.", statut="in_progress", date_limite=date(2026, 7, 15)),
            models.ActionCorrective(id_non_conformite=nc1.id_non_conformite, id_utilisateur=kyle.id_utilisateur, description="Audit encryption status on 100% of staff devices and extract dashboard compliance report.", statut="todo", date_limite=date(2026, 7, 20)),
            models.ActionCorrective(id_non_conformite=nc2.id_non_conformite, id_utilisateur=kyle.id_utilisateur, description="Draft incident handling policy document and present to Sarah for review.", statut="completed", date_limite=date(2026, 6, 25), date_realisation=date(2026, 6, 24)),
            models.ActionCorrective(id_non_conformite=nc3.id_non_conformite, id_utilisateur=kate.id_utilisateur, description="Install a designated email contact/form and setup Zendesk workflow tags for GDPR inquiries.", statut="todo", date_limite=date(2026, 7, 25)),
        ])

        print("Création des notifications de démonstration...")
        db.add_all([
            models.Notification(id_utilisateur=kyle.id_utilisateur, id_audit=audit1.id_audit, titre="Non-Conformity Raised", message="A high severity finding on device encryption was assigned to you.", type="warning", lue=False),
            models.Notification(id_utilisateur=kate.id_utilisateur, id_audit=audit2.id_audit, titre="Non-Conformity Raised", message="NC: Documented DSAR process is missing in HR onboarding.", type="danger", lue=False),
            models.Notification(id_utilisateur=marcus.id_utilisateur, id_audit=audit1.id_audit, titre="Corrective Action Completed", message="Kyle Reese completed a corrective action awaiting your validation.", type="success", lue=True),
        ])

        db.commit()
        print("Seed terminé avec succès.")
        print(f"Mot de passe démo pour tous les comptes: {settings.demo_password}")
        print("Comptes: sarah.connor@compliance.io (admin), marcus.wright@compliance.io (auditor),")
        print("         john.connor@compliance.io / kyle.reese@compliance.io / kate.connor@compliance.io / laura.kim@compliance.io (manager)")
    finally:
        db.close()


if __name__ == "__main__":
    run()
