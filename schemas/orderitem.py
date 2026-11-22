from pydantic import BaseModel,ConfigDict

class Create_orderitem(BaseModel):
    order_id:int
    product_id:int
    quantity:int
    unit_price:float

class ResponseOrderItem(BaseModel):
    id:int
    order_id:int
    product_id:int
    quantity:int
    unit_price:float
    model_config=ConfigDict(from_attributes=True)