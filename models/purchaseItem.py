from sqlalchemy import Column,String,Integer,Float,ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class PurchaseItem(Base):
    __tablename__="purchase_items"
    id=Column(Integer,primary_key=True,index=True)
    purchase_id=Column(Integer,ForeignKey("purchases.id"))
    product_id=Column(Integer,ForeignKey("products.id"))
    quantity=Column(Integer)
    unit_price=Column(Float)
    purchase = relationship("Purchase", back_populates="purchase_items")
    product = relationship("Product", back_populates="purchase_items")