from pydantic import BaseModel
from typing import List, Optional

class EmployeeBase(BaseModel):
    name: str
    email: str
    department: str

class EmployeeCreate(EmployeeBase):
    pass

class EmployeeUpdate(EmployeeBase):
    pass

class EmployeeOut(EmployeeBase):
    id: int

    class Config:
        from_attributes = True  # ✅ Fix for Pydantic v2
        

class BulkCreateRequest(BaseModel):
    employees: List[EmployeeCreate]

class BulkDeleteRequest(BaseModel):
    employee_ids: List[int]
