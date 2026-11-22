from pydantic import BaseModel,ConfigDict


class Create_supplier(BaseModel):
    name:str
    address:str
    company_name:str

class ResponseSupplier(BaseModel):
    id:int
    name:str
    address:str
    company_name:str
  




   
    model_config=ConfigDict(from_attributes=True)


