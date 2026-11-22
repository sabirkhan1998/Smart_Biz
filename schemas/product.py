from pydantic import BaseModel,ConfigDict

class Create_product(BaseModel):
    name:str
    price:float
    quantity:int
    category_id:int
    description:str

class ResponseProduct(BaseModel):
    id:int
    name:str
    price:float
    quantity:int
    category_id:int
    description:str
    model_config=ConfigDict(from_attributes=True)