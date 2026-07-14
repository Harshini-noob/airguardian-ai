from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime, timezone

class Station(Base):
    __tablename__ = "stations"

    id        = Column(Integer, primary_key=True, index=True)
    openaq_id = Column(Integer, unique=True, index=True)
    name      = Column(String)
    lat       = Column(Float)
    lon       = Column(Float)
    area      = Column(String)

    readings  = relationship("Reading", back_populates="station")


class Reading(Base):
    __tablename__ = "readings"

    id         = Column(Integer, primary_key=True, index=True)
    station_id = Column(Integer, ForeignKey("stations.id"), index=True)  # ← was missing ForeignKey
    pm25       = Column(Float, nullable=True)
    aqi        = Column(Float, nullable=True)
    category   = Column(String, nullable=True)
    fetched_at = Column(DateTime(timezone=True),
                        default=lambda: datetime.now(timezone.utc))

    station    = relationship("Station", back_populates="readings")