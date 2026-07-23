from sqlalchemy import Column, Date, DECIMAL, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from ..database import Base


class Projet(Base):
    __tablename__ = "projet"

    id_projet = Column(Integer, primary_key=True)
    id_departement = Column(Integer, ForeignKey("departement.id_departement"), nullable=False)
    nom = Column(String(100), nullable=False)
    description = Column(Text)
    date_debut = Column(Date)
    budget = Column(DECIMAL(12, 2))
    priorite = Column(String(20))
    statut = Column(String(30))


class Objectif(Base):
    __tablename__ = "objectif"

    id_objectif = Column(Integer, primary_key=True)
    id_departement = Column(Integer, ForeignKey("departement.id_departement"), nullable=False)
    id_projet = Column(Integer, ForeignKey("projet.id_projet"), nullable=False)
    nom = Column(String(100), nullable=False)
    description = Column(Text)
    valeur_cible = Column(DECIMAL(12, 2))
    date_debut = Column(Date)
    date_fin = Column(Date)
    statut = Column(String(30))


class DocumentReference(Base):
    __tablename__ = "document_reference"

    id_document = Column(Integer, primary_key=True)
    id_projet = Column(Integer, ForeignKey("projet.id_projet"), nullable=False)
    nom = Column(String(150), nullable=False)
    version = Column(String(20))
    type = Column(String(50))
    chemin = Column(String(255))
