from sqlalchemy import Column,String,Integer,Float,DateTime
from database import Base


class Expense(Base):
    __tablename__="expenses"
    id = Column(Integer, primary_key=True, index=True)
    title=Column(String)
    amount= Column (Float)
    description=Column(String)
    expense_date=Column(DateTime)

