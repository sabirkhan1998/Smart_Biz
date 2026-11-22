from sqlalchemy import Column,Integer,String,Float,ForeignKey,DateTime
from sqlalchemy.orm import relationship
from database import Base


class Purchase(Base):
    __tablename__="purchases"
    id=Column(Integer,primary_key=True,index=True)
    supplier_id=Column(Integer,ForeignKey("suppliers.id"))
    total_amount=Column(Float)
    status=Column(String)
    purchase_date=Column(DateTime)
    phone=Column(String)
    purchase_items = relationship("PurchaseItem", back_populates="purchase")
    
    supplier = relationship("Supplier", back_populates="purchases")
    

    

    

