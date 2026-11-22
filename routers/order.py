from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.order import Order
from models.customer import Customer
from schemas.order import Create_order, ResponseOrder

router = APIRouter(prefix="/orders", tags=["Order"])


@router.post("/", response_model=ResponseOrder)
def add_order(data: Create_order, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == data.customer_id).first()
    if customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")

    order = Order(
        customer_id=data.customer_id,
        total_amount=0,
        status=data.status,
        order_date=data.order_date
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


@router.get("/", response_model=list[ResponseOrder])
def get_orders(db: Session = Depends(get_db)):
    return db.query(Order).all()


@router.get("/{order_id}", response_model=ResponseOrder)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.delete("/{order_id}")
def delete_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    db.delete(order)
    db.commit()
    return {"message": "Order deleted"}
@router.put("/{order_id}", response_model=ResponseOrder)
def update_order(order_id: int, data: Create_order, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")

    customer = db.query(Customer).filter(Customer.id == data.customer_id).first()
    if customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")

    order.customer_id = data.customer_id
    order.status = data.status
    order.order_date = data.order_date
    db.commit()
    db.refresh(order)
    return order