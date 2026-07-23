from sqlalchemy import Column, Date, DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import relationship

from ..database import Base


class Audit(Base):
    __tablename__ = "audit"

    id_audit = Column(Integer, primary_key=True)
    id_departement = Column(Integer, ForeignKey("departement.id_departement"), nullable=False)
    id_utilisateur = Column(Integer, ForeignKey("utilisateur.id_utilisateur"), nullable=False)
    id_projet = Column(Integer, ForeignKey("projet.id_projet"), nullable=True)
    id_modele = Column(Integer, ForeignKey("modele_checklist.id_modele"), nullable=True)
    titre = Column(String(150))
    objectif = Column(String(255))
    perimetre = Column(String(255))
    date_planifiee = Column(Date)
    date_debut = Column(Date)
    date_fin = Column(Date)
    statut = Column(String(30))
    type_audit = Column(String(50))
    description = Column(Text)
    date_creation = Column(DateTime, server_default=func.now())

    reponses = relationship("ReponseAudit", back_populates="audit", cascade="all, delete-orphan")
    modele = relationship("ModeleChecklist")


class ReponseAudit(Base):
    __tablename__ = "reponse_audit"

    id_reponse = Column(Integer, primary_key=True)
    id_audit = Column(Integer, ForeignKey("audit.id_audit"), nullable=False)
    id_question = Column(Integer, ForeignKey("question_checklist.id_question"), nullable=False)
    id_utilisateur = Column(Integer, ForeignKey("utilisateur.id_utilisateur"), nullable=False)
    reponse = Column(String(255))
    conformite = Column(Enum("conforme", "non_conforme", "partiel", "non_applicable", name="conformite_enum"))
    commentaire = Column(String(255))
    date_reponse = Column(DateTime)
    preuve_nom = Column(String(150))
    preuve_chemin = Column(String(255))

    audit = relationship("Audit", back_populates="reponses")


class Rapport(Base):
    __tablename__ = "rapport"

    id_rapport = Column(Integer, primary_key=True)
    id_audit = Column(Integer, ForeignKey("audit.id_audit"), nullable=False)
    id_utilisateur = Column(Integer, ForeignKey("utilisateur.id_utilisateur"), nullable=False)
    type = Column(String(50))
    nom_fichier = Column(String(150))
    date_generation = Column(DateTime, server_default=func.now())
