from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import relationship

from ..database import Base


class CategorieNonConformite(Base):
    __tablename__ = "categorie_non_conformite"

    id_categorie = Column(Integer, primary_key=True)
    nom = Column(String(100), nullable=False)
    description = Column(Text)


class NonConformite(Base):
    __tablename__ = "non_conformite"

    id_non_conformite = Column(Integer, primary_key=True)
    id_categorie = Column(Integer, ForeignKey("categorie_non_conformite.id_categorie"), nullable=False)
    id_audit = Column(Integer, ForeignKey("audit.id_audit"))
    id_question = Column(Integer, ForeignKey("question_checklist.id_question"))
    titre = Column(String(150))
    description = Column(Text)
    gravite = Column(String(20))
    statut = Column(String(20), default="open")
    id_utilisateur_assigne = Column(Integer, ForeignKey("utilisateur.id_utilisateur"))
    date_fin = Column(Date)
    date_creation = Column(DateTime, server_default=func.now())
    date_resolution = Column(DateTime)
    priorite = Column(String(20))

    actions = relationship("ActionCorrective", back_populates="non_conformite", cascade="all, delete-orphan")
    preuves = relationship("Preuve", back_populates="non_conformite", cascade="all, delete-orphan")


class JustificationNonConformite(Base):
    __tablename__ = "justification_non_conformite"

    id_reponse = Column(Integer, ForeignKey("reponse_audit.id_reponse"), primary_key=True)
    id_non_conformite = Column(Integer, ForeignKey("non_conformite.id_non_conformite"), primary_key=True)


class Preuve(Base):
    __tablename__ = "preuve"

    id_preuve = Column(Integer, primary_key=True)
    id_non_conformite = Column(Integer, ForeignKey("non_conformite.id_non_conformite"), nullable=False)
    nom_fichier = Column(String(150))
    chemin_fichier = Column(String(255))
    type_fichier = Column(String(50))
    date_ajout = Column(Date)

    non_conformite = relationship("NonConformite", back_populates="preuves")


class ActionCorrective(Base):
    __tablename__ = "action_corrective"

    id_action = Column(Integer, primary_key=True)
    id_non_conformite = Column(Integer, ForeignKey("non_conformite.id_non_conformite"), nullable=False)
    id_utilisateur = Column(Integer, ForeignKey("utilisateur.id_utilisateur"), nullable=False)
    description = Column(Text)
    date_limite = Column(Date)
    date_realisation = Column(Date)
    statut = Column(String(20))
    priorite = Column(String(20))

    non_conformite = relationship("NonConformite", back_populates="actions")
