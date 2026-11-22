from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.order import Order
from models.orderItem import OrderItem
from models.product import Product
from schemas.orderitem import Create_orderitem, ResponseOrderItem

router = APIRouter(prefix="/orderitems", tags=["OrderItem"])


@router.post("/", response_model=ResponseOrderItem)
def add_orderitem(data: Create_orderitem, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == data.order_id).first()
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")

    product = db.query(Product).filter(Product.id == data.product_id).first()
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")

    if product.quantity < data.quantity:
        raise HTTPException(status_code=400, detail="Not enough stock")

    item = OrderItem(
        order_id=data.order_id,
        product_id=data.product_id,
        quantity=data.quantity,
        unit_price=data.unit_price
    )
    db.add(item)

    # stock kam karo
    product.quantity = product.quantity - data.quantity

    # bill ka total barhao
    order.total_amount = (order.total_amount or 0) + data.quantity * data.unit_price

    db.commit()
    db.refresh(item)
    return item


@router.get("/", response_model=list[ResponseOrderItem])
def get_orderitems(db: Session = Depends(get_db)):
    return db.query(OrderItem).all()


@router.get("/order/{order_id}", response_model=list[ResponseOrderItem])
def get_items_of_order(order_id: int, db: Session = Depends(get_db)):
    return db.query(OrderItem).filter(OrderItem.order_id == order_id).all()
@router.put("/{item_id}", response_model=ResponseOrderItem)
def update_orderitem(item_id: int, data: Create_orderitem, db: Session = Depends(get_db)):
    item = db.query(OrderItem).filter(OrderItem.id == item_id).first()
    if item is None:
        raise HTTPException(status_code=404, detail="OrderItem not found")

    order = db.query(Order).filter(Order.id == item.order_id).first()
    product = db.query(Product).filter(Product.id == item.product_id).first()

    # purani quantity wapas daal kar kitna stock available hai
    available = product.quantity + item.quantity
    if available < data.quantity:
        raise HTTPException(status_code=400, detail="Not enough stock")

    # bill ka total: purani raqam kam, nayi raqam jama
    order.total_amount = order.total_amount - item.quantity * item.unit_price + data.quantity * data.unit_price

    # stock theek karo
    product.quantity = available - data.quantity

    item.quantity = data.quantity
    item.unit_price = data.unit_price

    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}")
def delete_orderitem(item_id: int, db: Session = Depends(get_db)):
    item = db.query(OrderItem).filter(OrderItem.id == item_id).first()
    if item is None:
        raise HTTPException(status_code=404, detail="OrderItem not found")

    order = db.query(Order).filter(Order.id == item.order_id).first()
    product = db.query(Product).filter(Product.id == item.product_id).first()

    # stock wapas aur bill se raqam kam
    product.quantity = product.quantity + item.quantity
    order.total_amount = order.total_amount - item.quantity * item.unit_price

    db.delete(item)
    db.commit()
    return {"message": "OrderItem deleted"}