from pydantic import BaseModel,ConfigDict

class Create_purchaseitem(BaseModel):
    purchase_id:int
    product_id:int
    quantity:int
    unit_price:float

class ResponsePurchaseItem(BaseModel):
    id:int
    purchase_id:int
    product_id:int
    quantity:int
    unit_price:float
    model_config=ConfigDict(from_attributes=True)