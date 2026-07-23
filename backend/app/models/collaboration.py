from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text, func

from ..database import Base


class Commentaire(Base):
    __tablename__ = "commentaire"

    id_commentaire = Column(Integer, primary_key=True)
    id_utilisateur = Column(Integer, ForeignKey("utilisateur.id_utilisateur"), nullable=False)
    id_audit = Column(Integer, ForeignKey("audit.id_audit"))
    id_non_conformite = Column(Integer, ForeignKey("non_conformite.id_non_conformite"))
    contenu = Column(Text, nullable=False)
    date_commentaire = Column(DateTime, server_default=func.now())


class Notification(Base):
    __tablename__ = "notification"

    id_notification = Column(Integer, primary_key=True)
    id_utilisateur = Column(Integer, ForeignKey("utilisateur.id_utilisateur"), nullable=False)
    id_audit = Column(Integer, ForeignKey("audit.id_audit"))
    titre = Column(String(150))
    message = Column(Text)
    type = Column(String(20), default="info")
    lue = Column(Boolean, default=False)
    date_envoi = Column(DateTime, server_default=func.now())


class Historique(Base):
    __tablename__ = "historique"

    id_historique = Column(Integer, primary_key=True)
    id_utilisateur = Column(Integer, ForeignKey("utilisateur.id_utilisateur"), nullable=False)
    id_audit = Column(Integer, ForeignKey("audit.id_audit"))
    action = Column(String(100), nullable=False)
    description = Column(Text)
    date_action = Column(DateTime, server_default=func.now())
    adresse_ip = Column(String(50))
