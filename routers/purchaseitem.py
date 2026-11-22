from fastapi import APIRouter,Depends,HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.purchase import Purchase
from models.purchaseItem import PurchaseItem
from models.product import Product
from schemas.purchaseitem import Create_purchaseitem,ResponsePurchaseItem


router = APIRouter(prefix="/purchaseitems", tags=["purchaseitems"])


@router.post("/", response_model=ResponsePurchaseItem)
def add_purchaseitem(data: Create_purchaseitem, db: Session = Depends(get_db)):
    purchase = db.query(Purchase).filter(Purchase.id == data.purchase_id).first()
    if purchase is None:
        raise HTTPException(status_code=404, detail="Purchase not found")

    product = db.query(Product).filter(Product.id == data.product_id).first()
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")

    item = PurchaseItem(
        purchase_id=data.purchase_id,
        product_id=data.product_id,
        quantity=data.quantity,
        unit_price=data.unit_price
    )
    db.add(item)

    # stock barhao
    product.quantity = product.quantity + data.quantity

    # khareed ka total barhao
    purchase.total_amount = (purchase.total_amount or 0) + data.quantity * data.unit_price

    db.commit()
    db.refresh(item)
    return item


@router.get("/", response_model=list[ResponsePurchaseItem])
def get_purchaseitems(db: Session = Depends(get_db)):
    return db.query(PurchaseItem).all()


@router.get("/purchase/{purchase_id}", response_model=list[ResponsePurchaseItem])
def get_items_of_purchase(purchase_id: int, db: Session = Depends(get_db)):
    return db.query(PurchaseItem).filter(PurchaseItem.purchase_id == purchase_id).all()


@router.put("/{item_id}", response_model=ResponsePurchaseItem)
def update_purchaseitem(item_id: int, data: Create_purchaseitem, db: Session = Depends(get_db)):
    item = db.query(PurchaseItem).filter(PurchaseItem.id == item_id).first()
    if item is None:
        raise HTTPException(status_code=404, detail="PurchaseItem not found")

    purchase = db.query(Purchase).filter(Purchase.id == item.purchase_id).first()
    product = db.query(Product).filter(Product.id == item.product_id).first()

    # purani quantity nikal kar nayi daalo
    new_stock = product.quantity - item.quantity + data.quantity
    if new_stock < 0:
        raise HTTPException(status_code=400, detail="Stock can not be negative")

    purchase.total_amount = purchase.total_amount - item.quantity * item.unit_price + data.quantity * data.unit_price
    product.quantity = new_stock

    item.quantity = data.quantity
    item.unit_price = data.unit_price

    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}")
def delete_purchaseitem(item_id: int, db: Session = Depends(get_db)):
    item = db.query(PurchaseItem).filter(PurchaseItem.id == item_id).first()
    if item is None:
        raise HTTPException(status_code=404, detail="PurchaseItem not found")

    purchase = db.query(Purchase).filter(Purchase.id == item.purchase_id).first()
    product = db.query(Product).filter(Product.id == item.product_id).first()

    if product.quantity < item.quantity:
        raise HTTPException(status_code=400, detail="Stock already sold, can not delete")

    product.quantity = product.quantity - item.quantity
    purchase.total_amount = purchase.total_amount - item.quantity * item.unit_price

    db.delete(item)
    db.commit()
    return {"message": "PurchaseItem deleted"}