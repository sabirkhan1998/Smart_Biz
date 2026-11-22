from pydantic import BaseModel,ConfigDict
from datetime import datetime

class Create_order(BaseModel):
    customer_id:int
    total_amount:float=0
    status:str
    order_date:datetime


class ResponseOrder(BaseModel):
    id:int
    customer_id:int
    total_amount:float
    status:str
    order_date:datetime

    model_config=ConfigDict(from_attributes=True)