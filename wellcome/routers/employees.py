from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from .. import crud, schemas
from ..database import SessionLocal

router = APIRouter(prefix="/employees", tags=["Employees"])

# DB session dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# GET all employees
@router.get("")
def read_employees(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_employees(db, skip=skip, limit=limit)

# POST bulk create employees
@router.post("/bulk_create")
def create_employees(request: schemas.BulkCreateRequest, db: Session = Depends(get_db)):
    return crud.bulk_create_employees(db, request.employees)

# Manually handle preflight request (optional)
@router.options("/bulk_create")
def options_bulk_create():
    return Response(status_code=200)

# PUT update one employee
@router.put("/{employee_id}")
def update_employee(employee_id: int, emp: schemas.EmployeeUpdate, db: Session = Depends(get_db)):
    updated = crud.update_employee(db, employee_id, emp)
    if not updated:
        raise HTTPException(status_code=404, detail="Employee not found")
    return updated

# DELETE one employee
@router.delete("/{employee_id}")
def delete_employee(employee_id: int, db: Session = Depends(get_db)):
    deleted = crud.delete_employee(db, employee_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Employee not found")
    return deleted

# DELETE bulk
@router.delete("/bulk_delete")
def bulk_delete(request: schemas.BulkDeleteRequest, db: Session = Depends(get_db)):
    return crud.bulk_delete_employees(db, request.employee_ids)
