from fastapi import APIRouter,Depends,HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.purchase import Purchase
from models.supplier import Supplier
from schemas.purchase import Create_purchase,ResponsePurchase


router = APIRouter(prefix="/purchases", tags=["purchases"])


@router.post("/", response_model=ResponsePurchase)
def create_purchase(purchase_data: Create_purchase, db: Session = Depends(get_db)):
    supplier = db.query(Supplier).filter(Supplier.id == purchase_data.supplier_id).first()
    if supplier is None:
        raise HTTPException(status_code=404, detail="Supplier not found")

    new_purchase = Purchase(
        supplier_id=purchase_data.supplier_id,
        total_amount=0,
        status=purchase_data.status,
        purchase_date=purchase_data.purchase_date,
        phone=purchase_data.phone
    )
    db.add(new_purchase)
    db.commit()
    db.refresh(new_purchase)
    return new_purchase


@router.get("/", response_model=list[ResponsePurchase])
def get_purchases(db: Session = Depends(get_db)):
    return db.query(Purchase).all()


@router.get("/{purchase_id}", response_model=ResponsePurchase)
def get_purchase(purchase_id: int, db: Session = Depends(get_db)):
    purchase = db.query(Purchase).filter(Purchase.id == purchase_id).first()
    if purchase is None:
        raise HTTPException(status_code=404, detail="Purchase not found")
    return purchase


@router.put("/{purchase_id}", response_model=ResponsePurchase)
def update_purchase(purchase_id: int, purchase_data: Create_purchase, db: Session = Depends(get_db)):
    purchase = db.query(Purchase).filter(Purchase.id == purchase_id).first()
    if purchase is None:
        raise HTTPException(status_code=404, detail="Purchase not found")

    supplier = db.query(Supplier).filter(Supplier.id == purchase_data.supplier_id).first()
    if supplier is None:
        raise HTTPException(status_code=404, detail="Supplier not found")

    purchase.supplier_id = purchase_data.supplier_id
    purchase.status = purchase_data.status
    purchase.purchase_date = purchase_data.purchase_date
    purchase.phone = purchase_data.phone
    db.commit()
    db.refresh(purchase)
    return purchase


@router.delete("/{purchase_id}")
def delete_purchase(purchase_id: int, db: Session = Depends(get_db)):
    purchase = db.query(Purchase).filter(Purchase.id == purchase_id).first()
    if purchase is None:
        raise HTTPException(status_code=404, detail="Purchase not found")
    db.delete(purchase)
    db.commit()
    return {"message": "Purchase deleted"}