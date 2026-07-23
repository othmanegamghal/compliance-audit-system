from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import relationship

from ..database import Base


class Departement(Base):
    __tablename__ = "departement"

    id_departement = Column(Integer, primary_key=True)
    nom = Column(String(100), nullable=False)
    code = Column(String(30))
    description = Column(Text)

    utilisateurs = relationship("Utilisateur", back_populates="departement")


class Role(Base):
    __tablename__ = "role"

    id_role = Column(Integer, primary_key=True)
    nom = Column(String(50), nullable=False)
    description = Column(String(255))

    utilisateurs = relationship("Utilisateur", back_populates="role")


class Permission(Base):
    __tablename__ = "permission"

    id_permission = Column(Integer, primary_key=True)
    nom = Column(String(100), nullable=False)
    description = Column(String(255))


class RolePermission(Base):
    __tablename__ = "role_permission"

    id_role = Column(Integer, ForeignKey("role.id_role"), primary_key=True)
    id_permission = Column(Integer, ForeignKey("permission.id_permission"), primary_key=True)


class Utilisateur(Base):
    __tablename__ = "utilisateur"

    id_utilisateur = Column(Integer, primary_key=True)
    id_role = Column(Integer, ForeignKey("role.id_role"), nullable=False)
    id_departement = Column(Integer, ForeignKey("departement.id_departement"), nullable=False)
    nom = Column(String(50), nullable=False)
    prenom = Column(String(50))
    email = Column(String(150), nullable=False, unique=True)
    mot_de_passe = Column(String(255), nullable=False)
    telephone = Column(String(20))
    photo = Column(String(255))
    date_creation = Column(DateTime, server_default=func.now())
    derniere_connexion = Column(DateTime)
    actif = Column(Boolean, default=True)
    langue = Column(String(5), default="en")
    timezone = Column(String(20), default="utc+0")

    role = relationship("Role", back_populates="utilisateurs")
    departement = relationship("Departement", back_populates="utilisateurs")
