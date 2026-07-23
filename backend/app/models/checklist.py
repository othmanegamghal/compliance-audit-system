from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import relationship

from ..database import Base


class ModeleChecklist(Base):
    __tablename__ = "modele_checklist"

    id_modele = Column(Integer, primary_key=True)
    nom = Column(String(100), nullable=False)
    description = Column(Text)
    id_utilisateur_creation = Column(Integer, ForeignKey("utilisateur.id_utilisateur"))
    date_creation = Column(DateTime, server_default=func.now())

    questions = relationship("QuestionChecklist", back_populates="modele", order_by="QuestionChecklist.id_question")


class QuestionChecklist(Base):
    __tablename__ = "question_checklist"

    id_question = Column(Integer, primary_key=True)
    id_modele = Column(Integer, ForeignKey("modele_checklist.id_modele"), nullable=False)
    libelle = Column(String(255), nullable=False)
    categorie = Column(String(100))
    reponse_attendue = Column(String(255))

    modele = relationship("ModeleChecklist", back_populates="questions")
