from sqlalchemy import Column, Date, ForeignKey, Integer, String, Text

from ..database import Base


class Risque(Base):
    __tablename__ = "risque"

    id_risque = Column(Integer, primary_key=True)
    id_non_conformite = Column(Integer, ForeignKey("non_conformite.id_non_conformite"), nullable=False)
    nom = Column(String(100))
    description = Column(Text)
    impact = Column(Integer)
    probabilite = Column(Integer)
    criticite = Column(Integer)
    statut = Column(String(20))


class PlanMitigation(Base):
    __tablename__ = "plan_mitigation"

    id_plan = Column(Integer, primary_key=True)
    id_risque = Column(Integer, ForeignKey("risque.id_risque"), nullable=False)
    description = Column(Text)
    date_limite = Column(Date)
    statut = Column(String(20))
