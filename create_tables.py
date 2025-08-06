#!/usr/bin/env python3
"""
Database table creation script for the annotation system.
This script will create all necessary tables including the annotations table.
"""

from sqlalchemy import create_engine, text
from database import DATABASE_URL, Base
from models import Manager, Employee, Annotation
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_tables():
    """Create all database tables"""
    try:
        # Create engine
        engine = create_engine(DATABASE_URL)
        
        logger.info("Creating database tables...")
        
        # Drop and recreate annotations table to fix schema issues
        with engine.connect() as conn:
            # Drop annotations table if it exists (to fix schema issues)
            conn.execute(text("DROP TABLE IF EXISTS annotations CASCADE;"))
            conn.commit()
            logger.info("Dropped existing annotations table")
        
        # Create all tables from models
        Base.metadata.create_all(bind=engine)
        logger.info("Successfully created all database tables")
        
        # Verify tables were created
        with engine.connect() as conn:
            # Check if annotations table has correct columns
            result = conn.execute(text("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'annotations'
                ORDER BY ordinal_position;
            """))
            columns = result.fetchall()
            
            logger.info("Annotations table columns:")
            for col in columns:
                logger.info(f"  - {col[0]}: {col[1]}")
                
        logger.info("Database setup completed successfully!")
        
    except Exception as e:
        logger.error(f"Error creating tables: {e}")
        raise

if __name__ == "__main__":
    create_tables()
