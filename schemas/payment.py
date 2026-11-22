from pydantic import BaseModel,ConfigDict
from datetime import datetime

class PaymentCreate(BaseModel):
    order_id:int
    amount:float
    payment_method:str
    payment_date:datetime

class PaymentResponse(BaseModel):
    id:int
    order_id:int
    amount:float
    payment_method:str
    payment_date:datetime
    model_config=ConfigDict(from_attributes=True)