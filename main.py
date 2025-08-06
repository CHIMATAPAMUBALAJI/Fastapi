# Backup Balaji's code

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Base, Manager, Employee
import models
# from routers import employees
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy import text
from typing import Any



Base.metadata.create_all(bind=engine)

app = FastAPI()

origins = [
    "http://localhost:3000",  
    "http://localhost:3001",  
    "http://127.0.0.1:3000",  
    "http://127.0.0.1:3001",  
    "*"  # Allow all origins for development
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "FastAPI is running PLEASE CHECK THE CONSOLE FOR ERRORS"}


# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

#SCHEMAS:

class EmployeeSchema(BaseModel):
    id: int
    name: str
    email: str
    role: str
    manager_id: int
    country: str = "India"
    x0: Optional[float] = None
    x1: Optional[float] = None
    y0: Optional[float] = None
    y1: Optional[float] = None
    page: Optional[int] = None
    snippet: Optional[str] = None

    class Config:
        orm_mode = True

class ManagerSchema(BaseModel):
    id: int
    name: str
    email: str
    role: str
    employees: List[EmployeeSchema] = []

    class Config:
        orm_mode = True
        
class EmployeeCreate(BaseModel):
    name: str
    email: str
    role: str
    manager_id: int
    country: str = "India"
    snippet: Optional[str] = None
    
class UpdateUser(BaseModel):
    name: str
    email: str
    role: str
    manager_id: Optional[int] = None
    country: str = "India"
    snippet: Optional[str] = None
    
    
class EmployeeDeleteResponse(BaseModel):
    message: str
class AnnotationCoordinates(BaseModel):
    x0: Optional[float] = None
    x1: Optional[float] = None
    y0: Optional[float] = None
    y1: Optional[float] = None
    page: Optional[int] = None
    snippet: Optional[str] = None
    
class AnnotationResponse(BaseModel):
    employee_id: int
    employee_name: str
    has_annotation: bool
    coordinates: Optional[AnnotationCoordinates] = None
    
class AnnotationSaveRequest(BaseModel):
    employee_id: int
    annotations: Any  
    
class MyModel(BaseModel):
    model_config = {
        "from_attributes": True
    }
       
   
# ==== EMPLOYEE SEARCH API ====

# Add search endpoint for frontend TreeGrid
@app.get("/api/search")
def search_employees(name: str = "", db: Session = Depends(get_db)):
    """Search employees by name - used by TreeGrid component with hierarchy"""
    print(f"🔍 Searching employees with name: '{name}'")
    
    # Get all managers and employees with their relationships
    query = """
    SELECT 
        e.id,
        e.name,
        e.email,
        e.role,
        e.manager_id,
        e.country,
        e.x0,
        e.x1,
        e.y0,
        e.y1,
        e.page,
        e.snippet,
        m.name as manager_name,
        ARRAY[m.name, e.name] as path
    FROM employees e
    LEFT JOIN managers m ON e.manager_id = m.id
    """
    
    if name:
        query += " WHERE e.name ILIKE :name OR m.name ILIKE :name"
        result = db.execute(text(query), {"name": f"%{name}%"})
    else:
        result = db.execute(text(query))
    
    # Convert to list of dictionaries
    employees_data = []
    for row in result:
        employees_data.append({
            "id": row.id,
            "name": row.name,
            "email": row.email,
            "role": row.role,
            "manager_id": row.manager_id,
            "country": row.country,
            "x0": row.x0,
            "x1": row.x1,
            "y0": row.y0,
            "y1": row.y1,
            "page": row.page,
            "snippet": row.snippet,
            "manager_name": row.manager_name,
            "path": row.path
        })
    
    print(f"📊 Found {len(employees_data)} employees with hierarchy")
    return employees_data
    
# ==== ANNOTATION MANAGEMENT APIs ====

# GET: Retrieve employee annotation coordinates
@app.get("/employee/{employee_id}/annotation", response_model=AnnotationResponse)
def get_employee_annotation(employee_id: int, db: Session = Depends(get_db)):
    """
    GET /employee/{employee_id}/annotation
    Retrieves annotation coordinates for a specific employee.
    Returns employee info and coordinates if annotation exists.
    """
    print(f"🔍 GET annotation for employee {employee_id}")
    
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    has_annotation = all([
        emp.x0 is not None,
        emp.x1 is not None, 
        emp.y0 is not None,
        emp.y1 is not None,
        emp.page is not None
    ])
    
    coordinates = None
    if has_annotation:
        coordinates = AnnotationCoordinates(
            x0=emp.x0,
            x1=emp.x1,
            y0=emp.y0,
            y1=emp.y1,
            page=emp.page
        )
    
    response = AnnotationResponse(
        employee_id=emp.id,
        employee_name=emp.name,
        has_annotation=has_annotation,
        coordinates=coordinates
    )
    
    print(f"✅ Retrieved annotation for {emp.name}: {has_annotation}")
    return response

# PUT: Update/Replace employee annotation coordinates
@app.put("/employee/{employee_id}/annotation")
def update_employee_annotation(employee_id: int, coordinates: AnnotationCoordinates, db: Session = Depends(get_db)):
    """
    PUT /employee/{employee_id}/annotation
    Updates or replaces annotation coordinates for an employee.
    If coordinates are null, removes the annotation.
    """
    print(f"📝 PUT annotation for employee {employee_id}: {coordinates}")
    
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Update coordinates (allows null values to clear annotation)
    emp.x0 = coordinates.x0
    emp.x1 = coordinates.x1
    emp.y0 = coordinates.y0
    emp.y1 = coordinates.y1
    emp.page = coordinates.page
    emp.snippet = coordinates.snippet
    
    db.commit()
    
    action = "cleared" if coordinates.x0 is None else "updated"
    print(f"✅ Annotation {action} for {emp.name}")
    
    return {
        "message": f"Annotation {action} successfully",
        "employee_id": emp.id,
        "employee_name": emp.name,
        "coordinates": {
            "x0": emp.x0,
            "x1": emp.x1,
            "y0": emp.y0,
            "y1": emp.y1,
            "page": emp.page
        },
        "snippet": emp.snippet
    }

# POST: Create new annotation (alternative to PUT)
@app.post("/employee/{employee_id}/annotation")
def create_employee_annotation(employee_id: int, coordinates: AnnotationCoordinates, db: Session = Depends(get_db)):
    """
    POST /employee/{employee_id}/annotation
    Creates a new annotation for an employee (replaces existing if any).
    Same functionality as PUT but follows REST conventions for creation.
    """
    print(f"➕ POST annotation for employee {employee_id}: {coordinates}")
    
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Validate that we have complete coordinates for creation
    if any([coordinates.x0 is None, coordinates.x1 is None, coordinates.y0 is None, coordinates.y1 is None, coordinates.page is None]):
        raise HTTPException(status_code=400, detail="All coordinates (x0, x1, y0, y1, page) are required for creating annotation")
    
    # Set coordinates (replaces any existing annotation)
    emp.x0 = coordinates.x0
    emp.x1 = coordinates.x1
    emp.y0 = coordinates.y0
    emp.y1 = coordinates.y1
    emp.page = coordinates.page
    emp.snippet = coordinates.snippet
    
    db.commit()
    
    print(f"✅ Annotation created for {emp.name}")
    
    return {
        "message": "Annotation created successfully",
        "employee_id": emp.id,
        "employee_name": emp.name,
        "coordinates": {
            "x0": emp.x0,
            "x1": emp.x1,
            "y0": emp.y0,
            "y1": emp.y1,
            "page": emp.page
        },
        "snippet": emp.snippet
    }

# DELETE: Remove employee annotation
@app.delete("/employee/{employee_id}/annotation")
def delete_employee_annotation(employee_id: int, db: Session = Depends(get_db)):
    """
    DELETE /employee/{employee_id}/annotation
    Removes annotation for an employee by setting coordinates to null.
    """
    print(f"🗑️ DELETE annotation for employee {employee_id}")
    
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Clear all coordinates
    emp.x0 = None
    emp.x1 = None
    emp.y0 = None
    emp.y1 = None
    emp.page = None
    
    db.commit()
    
    print(f"✅ Annotation deleted for {emp.name}")
    
    return {
        "message": "Annotation deleted successfully",
        "employee_id": emp.id,
        "employee_name": emp.name
    }    
    

# ==== API ENDPOINTS ====

# GET org chart for AG Grid Tree View
from sqlalchemy import text
from fastapi import Depends, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import random


@app.get("/org-chart", response_model=List[Dict[str, Any]])
def get_org_chart(db: Session = Depends(get_db)):
    result = db.execute(text("""
        SELECT emp.*, m.name AS manager_name, m.id AS manager_id
        FROM employees emp
        LEFT JOIN managers m ON emp.manager_id = m.id
    """))
    rows = result.fetchall()

    all_employees = [dict(row._mapping) for row in rows]

    # Create a dictionary to look up manager by ID
    manager_lookup = {m['id']: m for m in db.execute(text("SELECT * FROM managers")).mappings()}

    def build_path(emp):
        path = [emp['name']]
        current_manager_id = emp['manager_id']

        while current_manager_id:
            manager = manager_lookup.get(current_manager_id)
            if not manager:
                break
            path.insert(0, manager['name'])  
            current_manager_id = manager.get('manager_id')  

        return path

    for emp in all_employees:
        emp['path'] = build_path(emp)

    
    print("EMPLOYEE HIERARCHY PATHS:")
    for emp in all_employees:
        print(f"{emp['name']}: {emp['path']}")

    return all_employees
from models import Annotation




COLORS = ["#FFEB3B", "#FFCDD2", "#C8E6C9", "#BBDEFB", "#E1BEE7"]


@app.get("/api/search", response_model=List[Dict[str, Any]])
def search_employees(name: str = Query(...), db: Session = Depends(get_db)):
    # Get all employees that match the search
    employee_result = db.execute(text("""
        SELECT emp.*, m.name AS manager_name, m.id AS manager_id
        FROM employees emp
        LEFT JOIN managers m ON emp.manager_id = m.id
        WHERE emp.name ILIKE :name
    """), {"name": f"%{name}%"}).fetchall()
    filtered_employees = [dict(row._mapping) for row in employee_result]

    # Get all managers for hierarchy
    manager_lookup = {
        m['id']: m for m in db.execute(text("SELECT * FROM managers")).mappings()
    }

    def build_path(emp):
        path = [emp['name']]
        current_manager_id = emp['manager_id']
        while current_manager_id:
            manager = manager_lookup.get(current_manager_id)
            if not manager:
                break
            path.insert(0, manager['name'])
            current_manager_id = manager.get('manager_id')
        return path

    # Process employees and build their paths
    for emp in filtered_employees:
        emp['path'] = build_path(emp)
        emp['annotation'] = {
            "pageIndex": emp['page'],
            "boundingBox": {
                "left": emp['x0'],
                "top": emp['y0'],
                "width": emp['x1'] - emp['x0'],
                "height": emp['y1'] - emp['y0']
            },
            "color": random.choice(COLORS),
            "type": "pspdfkit/rectangle/highlight",
            "id": f"highlight-{emp['id']}"
        }

    # For row grouping, we only need employees with proper manager_name
    # Add is_manager flag to employees and ensure they have manager_name
    for emp in filtered_employees:
        emp['is_manager'] = False
        # Ensure manager_name is set correctly (it should already be from the SQL query)
        if not emp.get('manager_name') and emp.get('manager_id'):
            manager = manager_lookup.get(emp['manager_id'])
            if manager:
                emp['manager_name'] = manager['name']
        print(f"Employee: {emp['name']} under manager: {emp.get('manager_name', 'No Manager')}")
    
    print(f"\nReturning {len(filtered_employees)} employees for row grouping:")
    for emp in filtered_employees:
        print(f"  - {emp['name']} (manager: {emp.get('manager_name', 'None')})")
    
    # Return only employees - ag-Grid row grouping will create the hierarchy
    return filtered_employees

@app.put("/employee/{employee_id}")
def update_employee(employee_id: int, updated: UpdateUser, db: Session = Depends(get_db)):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")


    emp.name = updated.name
    emp.email = updated.email
    emp.role = updated.role


    if updated.manager_id:
        manager = db.query(Employee).filter(Employee.id == updated.manager_id).first()
        if not manager:
            raise HTTPException(status_code=404, detail="Manager not found")
        emp.manager_id = updated.manager_id
        emp.path = [updated.name, manager.name]
    else:
        # Only update name in the path if manager is not changed
        emp.path[0] = updated.name

    db.commit()
    db.refresh(emp)
    return {"message": "Employee updated successfully", "updated_employee": {
        "id": emp.id,
        "name": emp.name,
        "email": emp.email,
        "role": emp.role,
        "path": emp.path,
        "manager_id": emp.manager_id
    }}

# PUT Update Manager + employee paths
@app.put("/manager/{manager_id}")
def update_manager(manager_id: int, updated: UpdateUser, db: Session = Depends(get_db)):
    manager = db.query(Manager).filter(Manager.id == manager_id).first()
    if not manager:
        raise HTTPException(status_code=404, detail="Manager not found")

    old_name = manager.name
    manager.name = updated.name
    manager.email = updated.email
    manager.role = updated.role

    # Update all employee paths
    employees = db.query(Employee).filter(Employee.manager_id == manager_id).all()
    for emp in employees:
        emp.path[0] = updated.name

    db.commit()
    return {"message": "Manager and employee paths updated"}

@app.post("/api/annotations/save")
def save_annotations(data: AnnotationSaveRequest, db: Session = Depends(get_db)):
    try:
        print(f"💾 Saving annotations for employee {data.employee_id}")
        
        # Save or update annotations directly (no employee validation to avoid schema issues)
        existing = db.query(models.Annotation).filter(models.Annotation.employee_id == data.employee_id).first()
        if existing:
            existing.annotations = data.annotations
            print(f"✅ Updated annotations for employee {data.employee_id}")
        else:
            new = models.Annotation(employee_id=data.employee_id, annotations=data.annotations)
            db.add(new)
            print(f"✅ Created new annotations for employee {data.employee_id}")
        
        db.commit()
        return {"status": "success", "message": "Annotations saved successfully"}
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error saving annotations: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to save annotations: {str(e)}")

@app.get("/api/annotations/get/{employee_id}")
def get_annotations(employee_id: int, db: Session = Depends(get_db)):
    print(f"🔄 GETTING ANNOTATIONS FOR EMPLOYEE {employee_id}")
    
    try:
        # Get the annotation record for this employee
        result = db.query(models.Annotation).filter(models.Annotation.employee_id == employee_id).first()
        
        if not result:
            print(f"❌ No annotations found for employee {employee_id}")
            return {"annotations": None}
        
        print(f"✅ Found annotations for employee {employee_id}")
        print(f"📊 Data type: {type(result.annotations)}")
        
        # Return the raw data exactly as stored
        return {"annotations": result.annotations}
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return {"annotations": None}

@app.post("/upload/")
def upload_employees(data: List[EmployeeCreate], db: Session = Depends(get_db)):
    manager_cache = {}
    for item in data:
        manager_name = item.path[0]

        # Check if manager already exists (cached or in DB)
        if manager_name in manager_cache:
            manager = manager_cache[manager_name]
        else:
            manager = db.query(Manager).filter(Manager.name == manager_name).first()
            if not manager:
                manager = Manager(name=manager_name, email=f"{manager_name.lower()}@example.com", role="Manager")
                db.add(manager)
                db.commit()
                db.refresh(manager)
            manager_cache[manager_name] = manager

        # Create employee
        employee = Employee(
            name=item.name,
            email=item.email,
            role=item.role,
            manager_id=manager.id,
            path=item.path
        )
        db.add(employee)

    db.commit()
    return {"message": "Data uploaded successfully"}



# GET: Get all managers for dropdown selection
@app.get("/api/managers")
def get_managers(db: Session = Depends(get_db)):
    """
    GET /api/managers
    Returns all managers for dropdown selection in add employee form.
    """
    print(f"📄 Fetching all managers for dropdown")
    
    try:
        managers = db.query(models.Manager).all()
        
        managers_list = []
        for manager in managers:
            managers_list.append({
                "id": manager.id,
                "name": manager.name,
                "email": manager.email,
                "role": manager.role
            })
        
        print(f"✅ Found {len(managers_list)} managers")
        return {"managers": managers_list}
        
    except Exception as e:
        print(f"❌ Error fetching managers: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch managers: {str(e)}")

# POST: Add new employee
@app.post("/api/employees")
def add_employee(employee_data: UpdateUser, db: Session = Depends(get_db)):
    """
    POST /api/employees
    Creates a new employee with name, email, role, and manager_id.
    Returns created employee data.
    """
    print(f"➕ Adding new employee with data: {employee_data.dict()}")
    
    # Validate manager exists if manager_id is provided
    if employee_data.manager_id:
        manager = db.query(models.Manager).filter(models.Manager.id == employee_data.manager_id).first()
        if not manager:
            print(f"❌ Manager {employee_data.manager_id} not found")
            raise HTTPException(status_code=404, detail="Manager not found")
        print(f"✅ Manager found: {manager.name} (ID: {manager.id})")
    
    try:
        # Create new employee
        new_employee = models.Employee(
            name=employee_data.name,
            email=employee_data.email,
            role=employee_data.role,
            manager_id=employee_data.manager_id,
            country=employee_data.country
        )
        
        db.add(new_employee)
        db.commit()
        db.refresh(new_employee)
        
        print(f"✅ Employee created successfully:")
        print(f"   ID: {new_employee.id}")
        print(f"   Name: {new_employee.name}")
        print(f"   Email: {new_employee.email}")
        print(f"   Role: {new_employee.role}")
        print(f"   Manager ID: {new_employee.manager_id}")
        print(f"   Country: {new_employee.country}")
        
        # Return created employee data
        return {
            "id": new_employee.id,
            "name": new_employee.name,
            "email": new_employee.email,
            "role": new_employee.role,
            "manager_id": new_employee.manager_id,
            "country": new_employee.country,
            "message": "Employee created successfully"
        }
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating employee: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create employee: {str(e)}")

# PUT: Update employee details (name, email, role)
@app.put("/api/employees/{employee_id}")
def update_employee(employee_id: int, updated_data: UpdateUser, db: Session = Depends(get_db)):
    """
    PUT /api/employees/{employee_id}
    Updates employee name, email, and role.
    Returns updated employee data.
    """
    print(f"🔄 Updating employee {employee_id} with data: {updated_data.dict()}")
    
    # Find the employee
    employee = db.query(models.Employee).filter(models.Employee.id == employee_id).first()
    if not employee:
        print(f"❌ Employee {employee_id} not found")
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Store old values for logging
    old_name = employee.name
    old_email = employee.email
    old_role = employee.role
    old_country = employee.country
    
    try:
        # Update employee fields
        employee.name = updated_data.name
        employee.email = updated_data.email
        employee.role = updated_data.role
        employee.country = updated_data.country
        
        # Update manager_id if provided
        if updated_data.manager_id is not None:
            employee.manager_id = updated_data.manager_id
        
        db.commit()
        db.refresh(employee)
        
        print(f"✅ Employee {employee_id} updated successfully:")
        print(f"   Name: {old_name} → {employee.name}")
        print(f"   Email: {old_email} → {employee.email}")
        print(f"   Role: {old_role} → {employee.role}")
        print(f"   Country: {old_country} → {employee.country}")
        
        # Return updated employee data
        return {
            "id": employee.id,
            "name": employee.name,
            "email": employee.email,
            "role": employee.role,
            "manager_id": employee.manager_id,
            "country": employee.country,
            "message": "Employee updated successfully"
        }
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error updating employee {employee_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update employee: {str(e)}")

# DELETE: Delete employee from database
@app.delete("/api/employees/{employee_id}")
def delete_employee(employee_id: int, db: Session = Depends(get_db)):
    """
    DELETE /api/employees/{employee_id}
    Deletes an employee from the database.
    Returns confirmation message.
    """
    print(f"🗑️ Deleting employee {employee_id}")
    
    # Find the employee
    employee = db.query(models.Employee).filter(models.Employee.id == employee_id).first()
    if not employee:
        print(f"❌ Employee {employee_id} not found")
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Store employee info for logging
    employee_name = employee.name
    employee_email = employee.email
    
    try:
        # Delete the employee
        db.delete(employee)
        db.commit()
        
        print(f"✅ Employee deleted successfully:")
        print(f"   ID: {employee_id}")
        print(f"   Name: {employee_name}")
        print(f"   Email: {employee_email}")
        
        return {
            "id": employee_id,
            "name": employee_name,
            "message": f"Employee {employee_name} deleted successfully"
        }
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error deleting employee {employee_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete employee: {str(e)}")


