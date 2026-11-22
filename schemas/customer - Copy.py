from pydantic import  BaseModel,ConfigDict


class CustomerCreate(BaseModel):
    name:str
    address:str
    phone:str

class CustomerResponse(BaseModel):
    id:int
    name:str
    address:str
    phone:str
    model_config=ConfigDict(from_attributes=True)

    