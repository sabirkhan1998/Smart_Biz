from sqlalchemy import ForeignKey,Column,Integer,String,Float
from sqlalchemy.orm import relationship
from database import Base

class Product(Base):
    __tablename__="products"
    id=Column(Integer,primary_key=True,index=True)
    name=Column(String,nullable=False)
    price=Column(Float,nullable=False)
    quantity=Column(Integer,nullable=False)
    category_id=Column(Integer,ForeignKey("categories.id"))
    description=Column(String)
    category = relationship("Category", back_populates="products")
    order_items = relationship("OrderItem", back_populates="product")
    purchase_items = relationship("PurchaseItem", back_populates="product")




