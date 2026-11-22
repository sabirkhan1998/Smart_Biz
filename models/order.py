from sqlalchemy import Column,Integer,String,Float,ForeignKey,DateTime
from sqlalchemy.orm import relationship
from database import Base

class Order(Base):
    __tablename__="orders"
    id=Column(Integer,primary_key=True,index=True)
    customer_id=Column(Integer,ForeignKey("customers.id"))
    total_amount=Column(Float)
    status=Column(String)
    order_date=Column(DateTime)
    customer = relationship("Customer", back_populates="orders")
    order_items = relationship("OrderItem", back_populates="order")


