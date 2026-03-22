from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, create_engine
from sqlalchemy.orm import declarative_base, relationship, sessionmaker

DATABASE_URL = "sqlite:///./corpus.db"

Base = declarative_base()


class Speech(Base):
    __tablename__ = "speeches"

    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(String, unique=True, index=True)
    title = Column(String)
    upload_date = Column(String)
    utterance_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    utterances = relationship("Utterance", back_populates="speech", cascade="all, delete-orphan")


class Utterance(Base):
    __tablename__ = "utterances"

    id = Column(Integer, primary_key=True, index=True)
    speech_id = Column(Integer, ForeignKey("speeches.id", ondelete="CASCADE"))
    text = Column(String)
    start_seconds = Column(Float)
    duration = Column(Float)

    speech = relationship("Speech", back_populates="utterances")


engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)
