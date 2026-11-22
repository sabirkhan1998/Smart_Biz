from fastapi import APIRouter,Depends,HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.supplier import Supplier
from schemas.supplier import Create_supplier,ResponseSupplier


router = APIRouter(prefix="/suppliers", tags=["suppliers"])


@router.post("/", response_model=ResponseSupplier)
def create_supplier(supplier_data: Create_supplier, db: Session = Depends(get_db)):
    new_supplier = Supplier(
        name=supplier_data.name,
        address=supplier_data.address,
        company_name=supplier_data.company_name,
        phone=supplier_data.phone
    )
    db.add(new_supplier)
    db.commit()
    db.refresh(new_supplier)
    return new_supplier


@router.get("/", response_model=list[ResponseSupplier])
def get_suppliers(db: Session = Depends(get_db)):
    return db.query(Supplier).all()


@router.get("/{supplier_id}", response_model=ResponseSupplier)
def get_supplier(supplier_id: int, db: Session = Depends(get_db)):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if supplier is None:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return supplier


@router.put("/{supplier_id}", response_model=ResponseSupplier)
def update_supplier(supplier_id: int, supplier_data: Create_supplier, db: Session = Depends(get_db)):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if supplier is None:
        raise HTTPException(status_code=404, detail="Supplier not found")
    supplier.name = supplier_data.name
    supplier.address = supplier_data.address
    supplier.company_name = supplier_data.company_name
    supplier.phone = supplier_data.phone
    db.commit()
    db.refresh(supplier)
    return supplier


@router.delete("/{supplier_id}")
def delete_supplier(supplier_id: int, db: Session = Depends(get_db)):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if supplier is None:
        raise HTTPException(status_code=404, detail="Supplier not found")
    db.delete(supplier)
    db.commit()
    return {"message": "Supplier deleted"}