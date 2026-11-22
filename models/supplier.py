from sqlalchemy import Column,Integer,String
from sqlalchemy.orm import relationship
from database import Base

class Supplier(Base):
    __tablename__="suppliers"
    id=Column(Integer,primary_key=True,index=True)
    name=Column(String,nullable=False)
    address=Column(String)
    company_name=Column(String)
    phone=Column(String)
    purchases = relationship("Purchase", back_populates="supplier")