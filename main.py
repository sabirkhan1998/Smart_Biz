from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from database import Base, engine

# Import all models
from models.category import Category
from models.product import Product
from models.customer import Customer
from models.supplier import Supplier
from models.order import Order
from models.orderItem import OrderItem
from models.purchase import Purchase
from models.purchaseItem import PurchaseItem
from models.payment import Payment
from models.Expense import Expense

# Import routers
from routers import product, category, customer, supplier
from routers import expense, order, orderitem, payment, purchase, purchaseitem

app = FastAPI()
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(product.router)
app.include_router(category.router)
app.include_router(customer.router)
app.include_router(supplier.router)
app.include_router(expense.router)
app.include_router(order.router)
app.include_router(orderitem.router)
app.include_router(payment.router)
app.include_router(purchase.router)
app.include_router(purchaseitem.router)
app.mount("/app", StaticFiles(directory="static", html=True), name="static")