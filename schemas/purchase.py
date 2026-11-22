from pydantic import BaseModel,ConfigDict
from datetime import datetime

class Create_purchase(BaseModel):

    supplier_id:int
    total_amount:float
    status:str
    purchase_date:datetime
    phone:str

class ResponsePurchase(BaseModel):
    id:int
    supplier_id:int
    total_amount:float
    status:str
    purchase_date:datetime
    phone:str
    model_config=ConfigDict(from_attributes=True)