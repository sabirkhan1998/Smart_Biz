from pydantic import BaseModel,ConfigDict
from datetime import datetime

class ExpenseCreate(BaseModel):
    title:str
    amount:float
    description:str
    expense_date:datetime

class ExpenseResponse(BaseModel):
    id:int
    title:str
    amount:float
    description:str
    expense_date:datetime
    model_config=ConfigDict(from_attributes=True)