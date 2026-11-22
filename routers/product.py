from fastapi import APIRouter,Depends,HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.product import Product
from models.category import Category
from schemas.product import Create_product,ResponseProduct


router = APIRouter(prefix="/products", tags=["products"])


@router.post("/", response_model=ResponseProduct)
def create_product(product_data: Create_product, db: Session = Depends(get_db)):
    category = db.query(Category).filter(Category.id == product_data.category_id).first()
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found")

    new_product = Product(
        name=product_data.name,
        price=product_data.price,
        quantity=product_data.quantity,
        category_id=product_data.category_id,
        description=product_data.description
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product


@router.get("/", response_model=list[ResponseProduct])
def get_products(db: Session = Depends(get_db)):
    return db.query(Product).all()


@router.get("/{product_id}", response_model=ResponseProduct)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.put("/{product_id}", response_model=ResponseProduct)
def update_product(product_id: int, product_data: Create_product, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")

    category = db.query(Category).filter(Category.id == product_data.category_id).first()
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found")

    product.name = product_data.name
    product.price = product_data.price
    product.quantity = product_data.quantity
    product.category_id = product_data.category_id
    product.description = product_data.description
    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()
    return {"message": "Product deleted"}