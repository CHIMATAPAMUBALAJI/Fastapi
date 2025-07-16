from sqlalchemy.orm import Session
from . import models, schemas

def get_employees(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Employee).offset(skip).limit(limit).all()

def create_employee(db: Session, employee: schemas.EmployeeCreate):
    db_employee = models.Employee(**employee.dict())
    db.add(db_employee)
    db.commit()
    db.refresh(db_employee)
    return db_employee

def bulk_create_employees(db: Session, employees: list[schemas.EmployeeCreate]):
    db_employees = [models.Employee(**emp.dict()) for emp in employees]
    db.add_all(db_employees)
    db.commit()
    return db_employees

def update_employee(db: Session, employee_id: int, employee: schemas.EmployeeUpdate):
    db_employee = db.query(models.Employee).filter(models.Employee.id == employee_id).first()
    if not db_employee:
        return None
    for field, value in employee.dict().items():
        setattr(db_employee, field, value)
    db.commit()
    db.refresh(db_employee)
    return db_employee

def delete_employee(db: Session, employee_id: int):
    db_employee = db.query(models.Employee).filter(models.Employee.id == employee_id).first()
    if not db_employee:
        return None
    db.delete(db_employee)
    db.commit()
    return db_employee

def bulk_delete_employees(db: Session, employee_ids: list[int]):
    db.query(models.Employee).filter(models.Employee.id.in_(employee_ids)).delete(synchronize_session=False)
    db.commit()
    return {"deleted": employee_ids}
