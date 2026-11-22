from sqlalchemy import Column,Integer,String
from sqlalchemy.orm import relationship
from database import Base

class Customer(Base):
    __tablename__="customers"
    id=Column(Integer,primary_key=True,index=True)
    name=Column(String,nullable=False)
    address=Column(String)
    phone=Column(String)
    orders = relationship("Order", back_populates="customer")

