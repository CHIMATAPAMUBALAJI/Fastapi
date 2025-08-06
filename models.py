# Backup Balaji's code
from sqlalchemy import Column, Integer, String, ForeignKey, ARRAY, JSON, Float, Text
from sqlalchemy.orm import relationship
from database import Base

class Manager(Base):
    __tablename__ = "managers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    role = Column(String, nullable=False)

    employees = relationship("Employee", back_populates="manager")

class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    role = Column(String, nullable=False)
    manager_id = Column(Integer, ForeignKey("managers.id"))
    country = Column(String, default="India", nullable=False)
    x0 = Column(Float)
    x1 = Column(Float)
    y0 = Column(Float)
    y1 = Column(Float)
    page = Column(Integer)
    snippet = Column(Text, nullable=True)  # Store extracted text from PDF rectangles

    manager = relationship("Manager", back_populates="employees")
    
class Annotation(Base):
    __tablename__ = "annotations"
    id = Column(Integer, primary_key=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    annotations = Column(JSON, nullable=False) 
