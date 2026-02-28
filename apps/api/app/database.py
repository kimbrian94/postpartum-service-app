from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    connect_args={"client_encoding": "utf8"}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

@event.listens_for(engine, "connect")
def set_encoding(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("SET CLIENT_ENCODING TO 'UTF8';")
    cursor.close()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
