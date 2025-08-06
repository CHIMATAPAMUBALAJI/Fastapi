#!/usr/bin/env python3
"""
Test script to verify annotation data in PostgreSQL database
"""

from sqlalchemy import create_engine, text
from database import DATABASE_URL
import json

def test_annotations():
    """Test annotation data retrieval"""
    try:
        engine = create_engine(DATABASE_URL)
        
        with engine.connect() as conn:
            # Check if annotations table exists and has data
            result = conn.execute(text("SELECT * FROM annotations ORDER BY id;"))
            annotations = result.fetchall()
            
            print("=== ANNOTATION DATA IN DATABASE ===")
            print(f"Total annotations found: {len(annotations)}")
            
            for ann in annotations:
                print(f"\nAnnotation ID: {ann.id}")
                print(f"Employee ID: {ann.employee_id}")
                print(f"Annotation data type: {type(ann.annotations)}")
                
                if ann.annotations:
                    if isinstance(ann.annotations, str):
                        try:
                            parsed = json.loads(ann.annotations)
                            print(f"Parsed annotation keys: {list(parsed.keys()) if isinstance(parsed, dict) else 'Not a dict'}")
                        except:
                            print("Could not parse annotation JSON")
                    else:
                        print(f"Annotation keys: {list(ann.annotations.keys()) if isinstance(ann.annotations, dict) else 'Not a dict'}")
                else:
                    print("No annotation data")
            
            # Test specific employee
            print("\n=== TESTING SPECIFIC EMPLOYEE ===")
            result = conn.execute(text("SELECT * FROM annotations WHERE employee_id = 3;"))  # Vidhya's ID
            vidhya_ann = result.fetchone()
            
            if vidhya_ann:
                print(f"Found annotation for employee 3 (Vidhya)")
                print(f"Data: {vidhya_ann.annotations}")
            else:
                print("No annotation found for employee 3 (Vidhya)")
                
    except Exception as e:
        print(f"Error testing annotations: {e}")

if __name__ == "__main__":
    test_annotations()
