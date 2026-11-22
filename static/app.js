// ================= SmartBiz Frontend =================
// Backend ka address
const API = "http://127.0.0.1:8000";

// Dukan ki maloomat (receipt par chhapti hain) - yahan apni dukan ka naam likhein
const SHOP = {
    name: "SmartBiz Store",
    address: "Main Bazar, Lahore",
    phone: "0300-1234567"
};

// Saara data yahan rakha jata hai
const data = {
    categories: [],
    products: [],
    customers: [],
    suppliers: [],
    orders: [],
    purchases: [],
    payments: [],
    expenses: []
};

const paths = {
    categories: "/categories/",
    products: "/products/",
    customers: "/customers/",
    suppliers: "/suppliers/",
    orders: "/orders/",
    purchases: "/purchases/",
    payments: "/payments/",
    expenses: "/expenses/"
};

let currentPage = "dashboard";
const content = document.getElementById("content");


// ================= Helper functions =================

async function api(path, method = "GET", body = null) {
    const options = { method: method, headers: {} };
    if (body) {
        options.headers["Content-Type"] = "application/json";
        options.body = JSON.stringify(body);
    }

    let response;
    try {
        response = await fetch(API + path, options);
    } catch (e) {
        throw new Error("Server se rabta nahi ho saka. Check karein ke uvicorn chal raha hai.");
    }

    let result = null;
    try {
        result = await response.json();
    } catch (e) {
        result = null;
    }

    if (!response.ok) {
        let message = "Something went wrong";
        if (result && typeof result.detail === "string") {
            message = result.detail;
        } else if (result && Array.isArray(result.detail)) {
            message = result.detail.map(d => d.loc.slice(1).join(".") + ": " + d.msg).join(", ");
        }
        throw new Error(message);
    }
    return result;
}

function esc(text) {
    if (text === null || text === undefined) return "";
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function money(n) {
    return "Rs " + Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function pad(n) {
    return String(n).padStart(2, "0");
}

function nowLocal() {
    const d = new Date();
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) +
        "T" + pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
}

function showDate(value) {
    if (!value) return "-";
    const d = new Date(value);
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function nameOf(list, id, field) {
    field = field || "name";
    const item = list.find(i => i.id === id);
    return item ? item[field] : "-";
}

function sum(list, key) {
    return list.reduce((total, i) => total + Number(i[key] || 0), 0);
}

function badge(status) {
    const s = (status || "").toLowerCase();
    return '<span class="badge ' + esc(s) + '">' + esc(status || "-") + "</span>";
}

function stockBadge(q) {
    if (q <= 0) return '<span class="badge out">Out of stock</span>';
    if (q < 10) return '<span class="badge low">' + q + " (Low)</span>";
    return '<span class="badge ok">' + q + "</span>";
}

function setHeader(title, sub) {
    document.getElementById("pageTitle").textContent = title;
    document.getElementById("pageSub").textContent = sub || "";
}

function showToast(message, type) {
    const box = document.getElementById("toastBox");
    const div = document.createElement("div");
    div.className = "toast " + (type || "success");
    div.textContent = message;
    box.appendChild(div);
    setTimeout(() => div.remove(), 3800);
}

function emptyState(title, text) {
    return '<div class="empty"><strong>' + title + "</strong>" + text + "</div>";
}


// ================= Modal =================

function openModal(title, html, wide) {
    document.getElementById("modalTitle").textContent = title;
    document.getElementById("modalBody").innerHTML = html;
    document.getElementById("modalBox").className = "modal" + (wide ? " wide" : "");
    document.getElementById("modalOverlay").classList.remove("hidden");
}

function closeModal() {
    document.getElementById("modalOverlay").classList.add("hidden");
    document.getElementById("modalBody").innerHTML = "";
}

document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeModal();
});

document.getElementById("modalOverlay").addEventListener("mousedown", function (e) {
    if (e.target.id === "modalOverlay") closeModal();
});


// ================= Data loading =================

async function loadAll() {
    const keys = Object.keys(paths);
    const results = await Promise.all(keys.map(k => api(paths[k])));
    keys.forEach((k, i) => { data[k] = results[i]; });
}


// ================= Form builder =================

function buildForm(fields, values) {
    let html = '<div class="form-grid">';
    fields.forEach(f => {
        let v = "";
        if (values && values[f.name] !== undefined && values[f.name] !== null) {
            v = values[f.name];
        } else if (f.default !== undefined) {
            v = typeof f.default === "function" ? f.default() : f.default;
        }

        let input = "";
        if (f.type === "select") {
            input = '<select id="f_' + f.name + '"><option value="">Select...</option>';
            f.options().forEach(o => {
                const selected = String(o.value) === String(v) ? "selected" : "";
                input += '<option value="' + esc(o.value) + '" ' + selected + ">" + esc(o.label) + "</option>";
            });
            input += "</select>";
        } else if (f.type === "datetime") {
            input = '<input type="datetime-local" id="f_' + f.name + '" value="' + esc(String(v).slice(0, 16)) + '">';
        } else if (f.type === "number") {
            input = '<input type="number" min="0" step="' + (f.int ? "1" : "any") + '" id="f_' + f.name + '" value="' + esc(v) + '">';
        } else {
            input = '<input type="text" id="f_' + f.name + '" value="' + esc(v) + '">';
        }

        html += '<div class="form-group ' + (f.full ? "full" : "") + '"><label>' + f.label + "</label>" + input + "</div>";
    });
    return html + "</div>";
}

function readForm(fields) {
    const out = {};
    fields.forEach(f => {
        const value = document.getElementById("f_" + f.name).value.trim();

        if (value === "" && !f.optional) {
            throw new Error("Please fill: " + f.label);
        }

        if (f.type === "number") {
            out[f.name] = Number(value);
        } else if (f.type === "select") {
            out[f.name] = Number(value);
        } else if (f.type === "datetime") {
            out[f.name] = value.length === 16 ? value + ":00" : value;
        } else {
            out[f.name] = value;
        }
    });
    return out;
}


// ================= Simple pages (Products, Categories, ...) =================

const methods = ["Cash", "Card", "Bank Transfer", "JazzCash", "Easypaisa"];

const entities = {
    products: {
        title: "Products",
        sub: "Manage your inventory, prices and stock",
        single: "Product",
        fields: [
            { name: "name", label: "Product Name", type: "text" },
            { name: "category_id", label: "Category", type: "select", options: () => data.categories.map(c => ({ value: c.id, label: c.name })) },
            { name: "price", label: "Price (Rs)", type: "number" },
            { name: "quantity", label: "Stock Quantity", type: "number", int: true },
            { name: "description", label: "Description", type: "text", optional: true, full: true }
        ],
        columns: [
            { label: "#", get: i => i.id },
            { label: "Product", get: i => "<strong>" + esc(i.name) + "</strong><br><small style='color:#64748b'>" + esc(i.description) + "</small>" },
            { label: "Category", get: i => esc(nameOf(data.categories, i.category_id)) },
            { label: "Price", get: i => money(i.price), num: true },
            { label: "Stock", get: i => stockBadge(i.quantity) }
        ]
    },
    categories: {
        title: "Categories",
        sub: "Group your products into categories",
        single: "Category",
        fields: [
            { name: "name", label: "Category Name", type: "text", full: true },
            { name: "description", label: "Description", type: "text", optional: true, full: true }
        ],
        columns: [
            { label: "#", get: i => i.id },
            { label: "Name", get: i => "<strong>" + esc(i.name) + "</strong>" },
            { label: "Description", get: i => esc(i.description) },
            { label: "Products", get: i => data.products.filter(p => p.category_id === i.id).length }
        ]
    },
    customers: {
        title: "Customers",
        sub: "Your customer directory",
        single: "Customer",
        fields: [
            { name: "name", label: "Customer Name", type: "text", full: true },
            { name: "phone", label: "Phone", type: "text", optional: true },
            { name: "address", label: "Address", type: "text", optional: true }
        ],
        columns: [
            { label: "#", get: i => i.id },
            { label: "Name", get: i => "<strong>" + esc(i.name) + "</strong>" },
            { label: "Phone", get: i => esc(i.phone) },
            { label: "Address", get: i => esc(i.address) },
            { label: "Bills", get: i => data.orders.filter(o => o.customer_id === i.id).length }
        ]
    },
    suppliers: {
        title: "Suppliers",
        sub: "Companies and people you buy from",
        single: "Supplier",
        fields: [
            { name: "name", label: "Supplier Name", type: "text" },
            { name: "company_name", label: "Company", type: "text", optional: true },
            { name: "phone", label: "Phone", type: "text", optional: true },
            { name: "address", label: "Address", type: "text", optional: true }
        ],
        columns: [
            { label: "#", get: i => i.id },
            { label: "Name", get: i => "<strong>" + esc(i.name) + "</strong>" },
            { label: "Company", get: i => esc(i.company_name) },
            { label: "Phone", get: i => esc(i.phone) },
            { label: "Address", get: i => esc(i.address) }
        ]
    },
    expenses: {
        title: "Expenses",
        sub: "Track rent, bills, salaries and other costs",
        single: "Expense",
        fields: [
            { name: "title", label: "Title", type: "text" },
            { name: "amount", label: "Amount (Rs)", type: "number" },
            { name: "expense_date", label: "Date", type: "datetime", default: () => nowLocal().slice(0, 16) },
            { name: "description", label: "Description", type: "text", optional: true }
        ],
        columns: [
            { label: "#", get: i => i.id },
            { label: "Date", get: i => showDate(i.expense_date) },
            { label: "Title", get: i => "<strong>" + esc(i.title) + "</strong>" },
            { label: "Description", get: i => esc(i.description) },
            { label: "Amount", get: i => money(i.amount), num: true }
        ]
    }
};

function renderCrud(key) {
    const e = entities[key];
    setHeader(e.title, e.sub);
    content.innerHTML =
        '<div class="toolbar">' +
        '<div class="search"><input id="searchBox" placeholder="Search ' + e.title.toLowerCase() + '..." oninput="drawTable(\'' + key + '\')"></div>' +
        '<button class="btn primary" onclick="openForm(\'' + key + '\')">+ Add ' + e.single + "</button>" +
        "</div>" +
        '<div class="card"><div class="table-wrap" id="tableBox"></div></div>';
    drawTable(key);
}

function drawTable(key) {
    const e = entities[key];
    const box = document.getElementById("tableBox");
    const searchBox = document.getElementById("searchBox");
    const term = searchBox ? searchBox.value.toLowerCase() : "";

    const rows = data[key].filter(item => Object.values(item).join(" ").toLowerCase().includes(term));

    if (rows.length === 0) {
        box.innerHTML = emptyState("No " + e.title.toLowerCase() + " found", "Click the Add button to create your first record.");
        return;
    }

    let html = "<table><thead><tr>";
    e.columns.forEach(c => { html += "<th" + (c.num ? ' class="num"' : "") + ">" + c.label + "</th>"; });
    html += '<th class="num">Actions</th></tr></thead><tbody>';

    rows.forEach(item => {
        html += "<tr>";
        e.columns.forEach(c => { html += "<td" + (c.num ? ' class="num"' : "") + ">" + c.get(item) + "</td>"; });
        html += '<td><div class="actions">' +
            '<button class="btn sm" onclick="openForm(\'' + key + "'," + item.id + ')">Edit</button>' +
            '<button class="btn sm danger" onclick="deleteItem(\'' + key + "'," + item.id + ')">Delete</button>' +
            "</div></td></tr>";
    });
    box.innerHTML = html + "</tbody></table>";
}

function openForm(key, id) {
    const e = entities[key];
    const item = id ? data[key].find(i => i.id === id) : null;
    const html = buildForm(e.fields, item) +
        '<div class="modal-actions">' +
        '<button class="btn" onclick="closeModal()">Cancel</button>' +
        '<button class="btn primary" onclick="saveForm(\'' + key + "'," + (id || 0) + ')">Save</button>' +
        "</div>";
    openModal((id ? "Edit " : "Add ") + e.single, html);
}

async function saveForm(key, id) {
    try {
        const body = readForm(entities[key].fields);
        if (id) {
            await api(paths[key] + id, "PUT", body);
        } else {
            await api(paths[key], "POST", body);
        }
        closeModal();
        showToast(entities[key].single + " saved successfully");
        await loadAll();
        renderPage(currentPage);
    } catch (err) {
        showToast(err.message, "error");
    }
}

async function deleteItem(key, id) {
    if (!confirm("Are you sure you want to delete this " + entities[key].single.toLowerCase() + "?")) return;
    try {
        await api(paths[key] + id, "DELETE");
        showToast(entities[key].single + " deleted");
        await loadAll();
        renderPage(currentPage);
    } catch (err) {
        showToast(err.message, "error");
    }
}


// ================= Dashboard =================

function renderDashboard() {
    setHeader("Dashboard", "Overview of your business at a glance");

    const sales = sum(data.orders, "total_amount");
    const purchases = sum(data.purchases, "total_amount");
    const expenses = sum(data.expenses, "amount");
    const received = sum(data.payments, "amount");
    const pending = sales - received;
    const net = sales - purchases - expenses;
    const lowStock = data.products.filter(p => p.quantity < 10);
    const max = Math.max(sales, purchases, expenses, 1);

    let html = '<div class="stats">' +
        statCard("Total Sales", money(sales), data.orders.length + " bills", "") +
        statCard("Payments Received", money(received), data.payments.length + " payments", "green") +
        statCard("Pending Amount", money(pending), "To be collected", "amber") +
        statCard("Total Purchases", money(purchases), data.purchases.length + " purchases", "blue") +
        statCard("Total Expenses", money(expenses), data.expenses.length + " entries", "red") +
        statCard("Net Balance", money(net), "Sales - Purchases - Expenses", "purple") +
        "</div>";

    // Bars + low stock
    html += '<div class="grid-2">';
    html += '<div class="card"><div class="card-head">Financial Overview</div><div class="card-body">' +
        barRow("Sales", sales, max, "#4f46e5") +
        barRow("Purchases", purchases, max, "#0284c7") +
        barRow("Expenses", expenses, max, "#dc2626") +
        "</div></div>";

    html += '<div class="card"><div class="card-head">Low Stock Alerts <span class="badge ' + (lowStock.length ? "low" : "ok") + '">' + lowStock.length + "</span></div><div class='card-body'>";
    if (lowStock.length === 0) {
        html += "<p style='color:#64748b'>All products have enough stock.</p>";
    } else {
        lowStock.slice(0, 6).forEach(p => {
            html += "<div style='display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f1f5f9'>" +
                "<span>" + esc(p.name) + "</span>" + stockBadge(p.quantity) + "</div>";
        });
    }
    html += "</div></div></div>";

    // Recent bills
    html += '<div class="card"><div class="card-head">Recent Bills' +
        '<button class="btn sm" onclick="showPage(\'orders\')">View all</button></div><div class="table-wrap">';
    const recent = data.orders.slice(-5).reverse();
    if (recent.length === 0) {
        html += emptyState("No bills yet", "Create your first bill from Sales / Bills.");
    } else {
        html += "<table><thead><tr><th>Bill</th><th>Customer</th><th>Date</th><th class='num'>Total</th><th>Status</th></tr></thead><tbody>";
        recent.forEach(o => {
            html += "<tr><td><strong>" + docNumber("INV", o.id) + "</strong></td>" +
                "<td>" + esc(nameOf(data.customers, o.customer_id)) + "</td>" +
                "<td>" + showDate(o.order_date) + "</td>" +
                "<td class='num'>" + money(o.total_amount) + "</td>" +
                "<td>" + badge(o.status) + "</td></tr>";
        });
        html += "</tbody></table>";
    }
    html += "</div></div>";

    content.innerHTML = html;
}

function statCard(label, value, sub, color) {
    return '<div class="stat ' + color + '"><div class="stat-label">' + label + "</div>" +
        '<div class="stat-value">' + value + '</div><div class="stat-sub">' + sub + "</div></div>";
}

function barRow(label, value, max, color) {
    const width = Math.round((value / max) * 100);
    return '<div class="bar-row"><div class="bar-top"><span>' + label + "</span><strong>" + money(value) + "</strong></div>" +
        '<div class="bar-track"><div class="bar-fill" style="width:' + width + "%;background:" + color + '"></div></div></div>';
}

function docNumber(prefix, id) {
    return prefix + "-" + String(id).padStart(4, "0");
}


// ================= Sales / Bills (Orders) =================

function paidOf(orderId) {
    return data.payments.filter(p => p.order_id === orderId).reduce((t, p) => t + p.amount, 0);
}

function renderOrders() {
    setHeader("Sales / Bills", "Create bills, track payments and print invoices");
    content.innerHTML =
        '<div class="toolbar">' +
        '<div class="search"><input id="searchBox" placeholder="Search bills..." oninput="drawOrders()"></div>' +
        '<button class="btn primary" onclick="openNewDocument(\'order\')">+ New Bill</button></div>' +
        '<div class="card"><div class="table-wrap" id="tableBox"></div></div>';
    drawOrders();
}

function drawOrders() {
    const box = document.getElementById("tableBox");
    const term = document.getElementById("searchBox").value.toLowerCase();

    const rows = data.orders.slice().reverse().filter(o => {
        const text = docNumber("INV", o.id) + " " + nameOf(data.customers, o.customer_id) + " " + o.status;
        return text.toLowerCase().includes(term);
    });

    if (rows.length === 0) {
        box.innerHTML = emptyState("No bills found", "Click New Bill to sell products to a customer.");
        return;
    }

    let html = "<table><thead><tr><th>Bill</th><th>Customer</th><th>Date</th><th class='num'>Total</th><th class='num'>Paid</th><th class='num'>Due</th><th>Status</th><th class='num'>Actions</th></tr></thead><tbody>";
    rows.forEach(o => {
        const paid = paidOf(o.id);
        html += "<tr><td><strong>" + docNumber("INV", o.id) + "</strong></td>" +
            "<td>" + esc(nameOf(data.customers, o.customer_id)) + "</td>" +
            "<td>" + showDate(o.order_date) + "</td>" +
            "<td class='num'>" + money(o.total_amount) + "</td>" +
            "<td class='num'>" + money(paid) + "</td>" +
            "<td class='num'>" + money(o.total_amount - paid) + "</td>" +
            "<td>" + badge(o.status) + "</td>" +
            '<td><div class="actions">' +
            '<button class="btn sm" onclick="viewOrder(' + o.id + ')">View</button>' +
            '<button class="btn sm danger" onclick="deleteOrder(' + o.id + ')">Delete</button>' +
            "</div></td></tr>";
    });
    box.innerHTML = html + "</tbody></table>";
}

async function viewOrder(id) {
    try {
        const order = data.orders.find(o => o.id === id);
        const items = await api("/orderitems/order/" + id);
        const pays = await api("/payments/order/" + id);
        const paid = pays.reduce((t, p) => t + p.amount, 0);
        const due = order.total_amount - paid;
        const customer = data.customers.find(c => c.id === order.customer_id) || {};

        let rows = "";
        items.forEach((it, n) => {
            rows += "<tr><td>" + (n + 1) + "</td><td>" + esc(nameOf(data.products, it.product_id)) + "</td>" +
                "<td class='num'>" + it.quantity + "</td><td class='num'>" + money(it.unit_price) + "</td>" +
                "<td class='num'>" + money(it.quantity * it.unit_price) + "</td></tr>";
        });

        let payRows = "";
        pays.forEach(p => {
            payRows += "<tr><td>" + showDate(p.payment_date) + "</td><td>" + esc(p.payment_method) + "</td><td class='num'>" + money(p.amount) + "</td></tr>";
        });

        let html = '<div class="invoice">' +
            '<div class="invoice-head"><div><div class="invoice-title">SmartBiz</div><div style="color:#64748b">Sales Invoice</div></div>' +
            '<div class="invoice-meta"><div><strong>' + docNumber("INV", order.id) + "</strong></div><div>" + showDate(order.order_date) + "</div><div>" + badge(order.status) + "</div></div></div>" +
            '<div class="invoice-info"><div><h4>Billed To</h4><strong>' + esc(customer.name || "-") + "</strong><div>" + esc(customer.phone) + "</div><div>" + esc(customer.address) + "</div></div></div>" +
            "<table><thead><tr><th>#</th><th>Product</th><th class='num'>Qty</th><th class='num'>Unit Price</th><th class='num'>Amount</th></tr></thead><tbody>" +
            (rows || "<tr><td colspan='5' style='text-align:center;color:#64748b'>No items in this bill</td></tr>") + "</tbody></table>" +
            '<div class="invoice-summary"><div><span>Total</span><span>' + money(order.total_amount) + "</span></div>" +
            "<div><span>Paid</span><span>" + money(paid) + "</span></div>" +
            '<div class="grand"><span>Balance Due</span><span>' + money(due) + "</span></div></div>";

        if (pays.length > 0) {
            html += '<div class="sub-title">Payments received</div><table><thead><tr><th>Date</th><th>Method</th><th class="num">Amount</th></tr></thead><tbody>' + payRows + "</tbody></table>";
        }
        html += "</div>";

        html += '<div class="modal-actions no-print">' +
            '<button class="btn" onclick="window.print()">Print A4</button>' +
            '<button class="btn primary" onclick="printReceipt(' + order.id + ')">Print Receipt</button>' +
            (due > 0 ? '<button class="btn primary" onclick="openPaymentForm(' + order.id + ')">Add Payment</button>' : "") +
            '<button class="btn" onclick="closeModal()">Close</button></div>';

        openModal("Bill " + docNumber("INV", order.id), html, true);
    } catch (err) {
        showToast(err.message, "error");
    }
}

// Market jaisi chhoti receipt (80mm) print karo
async function printReceipt(id) {
    // Window pehle kholni hai (click ke foran baad), warna browser block kar deta hai
    const win = window.open("", "_blank", "width=420,height=700");
    if (!win) {
        showToast("Popup blocked. Browser mein popups allow karein.", "error");
        return;
    }
    win.document.write("<p style='font-family:Arial;padding:20px'>Loading receipt...</p>");

    try {
        const order = data.orders.find(o => o.id === id);
        const items = await api("/orderitems/order/" + id);
        const pays = await api("/payments/order/" + id);
        const paid = pays.reduce((t, p) => t + p.amount, 0);
        const due = order.total_amount - paid;
        const customer = data.customers.find(c => c.id === order.customer_id) || {};
        const d = new Date(order.order_date);

        let rows = "";
        let qtyTotal = 0;
        items.forEach(it => {
            qtyTotal += it.quantity;
            rows += "<tr><td colspan='3' class='pname'>" + esc(nameOf(data.products, it.product_id)) + "</td></tr>" +
                "<tr><td>" + it.quantity + " x " + Number(it.unit_price).toLocaleString("en-US") + "</td><td></td>" +
                "<td class='r'>" + Number(it.quantity * it.unit_price).toLocaleString("en-US") + "</td></tr>";
        });

        const page =
            "<!DOCTYPE html><html><head><meta charset='UTF-8'><title>Receipt " + docNumber("INV", id) + "</title>" +
            "<style>" +
            "@page { size: 80mm auto; margin: 3mm; }" +
            "body { font-family: 'Courier New', monospace; font-size: 12px; width: 74mm; margin: 0 auto; color: #000; }" +
            ".c { text-align: center; } .r { text-align: right; }" +
            "h1 { font-size: 20px; margin: 4px 0 0; } p { margin: 2px 0; }" +
            "hr { border: none; border-top: 1px dashed #000; margin: 8px 0; }" +
            "table { width: 100%; border-collapse: collapse; } td { padding: 2px 0; vertical-align: top; }" +
            ".pname { font-weight: bold; padding-top: 6px; }" +
            ".big { font-size: 15px; font-weight: bold; }" +
            "</style></head><body>" +
            "<div class='c'><h1>" + esc(SHOP.name) + "</h1><p>" + esc(SHOP.address) + "</p><p>Tel: " + esc(SHOP.phone) + "</p></div>" +
            "<hr>" +
            "<p>Bill No : " + docNumber("INV", id) + "</p>" +
            "<p>Date    : " + d.toLocaleDateString("en-GB") + " " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) + "</p>" +
            "<p>Customer: " + esc(customer.name || "-") + "</p>" +
            "<hr><table>" + rows + "</table><hr>" +
            "<table>" +
            "<tr><td>Total Items</td><td class='r'>" + qtyTotal + "</td></tr>" +
            "<tr class='big'><td>TOTAL</td><td class='r'>Rs " + Number(order.total_amount).toLocaleString("en-US") + "</td></tr>" +
            "<tr><td>Paid</td><td class='r'>Rs " + Number(paid).toLocaleString("en-US") + "</td></tr>" +
            "<tr><td>Balance</td><td class='r'>Rs " + Number(due).toLocaleString("en-US") + "</td></tr>" +
            "</table><hr>" +
            "<div class='c'><p>Thank you for shopping!</p><p>Shukriya, dobara tashreef layen</p></div>" +
            "</body></html>";

        win.document.open();
        win.document.write(page);
        win.document.close();
        win.focus();
        setTimeout(() => win.print(), 400);
    } catch (err) {
        win.close();
        showToast(err.message, "error");
    }
}

async function deleteOrder(id) {
    if (!confirm("Delete this bill? Its items will be removed and the stock will be returned.")) return;
    try {
        const items = await api("/orderitems/order/" + id);
        for (const it of items) {
            await api("/orderitems/" + it.id, "DELETE");
        }
        const pays = await api("/payments/order/" + id);
        for (const p of pays) {
            await api("/payments/" + p.id, "DELETE");
        }
        await api("/orders/" + id, "DELETE");
        showToast("Bill deleted");
    } catch (err) {
        showToast(err.message, "error");
    }
    await loadAll();
    renderPage(currentPage);
}


// ================= Purchases =================

function renderPurchases() {
    setHeader("Purchases", "Buy stock from suppliers - stock increases automatically");
    content.innerHTML =
        '<div class="toolbar">' +
        '<div class="search"><input id="searchBox" placeholder="Search purchases..." oninput="drawPurchases()"></div>' +
        '<button class="btn primary" onclick="openNewDocument(\'purchase\')">+ New Purchase</button></div>' +
        '<div class="card"><div class="table-wrap" id="tableBox"></div></div>';
    drawPurchases();
}

function drawPurchases() {
    const box = document.getElementById("tableBox");
    const term = document.getElementById("searchBox").value.toLowerCase();

    const rows = data.purchases.slice().reverse().filter(p => {
        const text = docNumber("PUR", p.id) + " " + nameOf(data.suppliers, p.supplier_id) + " " + p.status;
        return text.toLowerCase().includes(term);
    });

    if (rows.length === 0) {
        box.innerHTML = emptyState("No purchases found", "Click New Purchase to add stock from a supplier.");
        return;
    }

    let html = "<table><thead><tr><th>Purchase</th><th>Supplier</th><th>Date</th><th class='num'>Total</th><th>Status</th><th class='num'>Actions</th></tr></thead><tbody>";
    rows.forEach(p => {
        html += "<tr><td><strong>" + docNumber("PUR", p.id) + "</strong></td>" +
            "<td>" + esc(nameOf(data.suppliers, p.supplier_id)) + "</td>" +
            "<td>" + showDate(p.purchase_date) + "</td>" +
            "<td class='num'>" + money(p.total_amount) + "</td>" +
            "<td>" + badge(p.status) + "</td>" +
            '<td><div class="actions">' +
            '<button class="btn sm" onclick="viewPurchase(' + p.id + ')">View</button>' +
            '<button class="btn sm danger" onclick="deletePurchase(' + p.id + ')">Delete</button>' +
            "</div></td></tr>";
    });
    box.innerHTML = html + "</tbody></table>";
}

async function viewPurchase(id) {
    try {
        const purchase = data.purchases.find(p => p.id === id);
        const items = await api("/purchaseitems/purchase/" + id);
        const supplier = data.suppliers.find(s => s.id === purchase.supplier_id) || {};

        let rows = "";
        items.forEach((it, n) => {
            rows += "<tr><td>" + (n + 1) + "</td><td>" + esc(nameOf(data.products, it.product_id)) + "</td>" +
                "<td class='num'>" + it.quantity + "</td><td class='num'>" + money(it.unit_price) + "</td>" +
                "<td class='num'>" + money(it.quantity * it.unit_price) + "</td></tr>";
        });

        const html = '<div class="invoice">' +
            '<div class="invoice-head"><div><div class="invoice-title">SmartBiz</div><div style="color:#64748b">Purchase Order</div></div>' +
            '<div class="invoice-meta"><div><strong>' + docNumber("PUR", purchase.id) + "</strong></div><div>" + showDate(purchase.purchase_date) + "</div><div>" + badge(purchase.status) + "</div></div></div>" +
            '<div class="invoice-info"><div><h4>Supplier</h4><strong>' + esc(supplier.name || "-") + "</strong><div>" + esc(supplier.company_name) + "</div><div>" + esc(supplier.phone) + "</div></div></div>" +
            "<table><thead><tr><th>#</th><th>Product</th><th class='num'>Qty</th><th class='num'>Unit Price</th><th class='num'>Amount</th></tr></thead><tbody>" +
            (rows || "<tr><td colspan='5' style='text-align:center;color:#64748b'>No items</td></tr>") + "</tbody></table>" +
            '<div class="invoice-summary"><div class="grand"><span>Total</span><span>' + money(purchase.total_amount) + "</span></div></div></div>" +
            '<div class="modal-actions no-print"><button class="btn" onclick="window.print()">Print</button>' +
            '<button class="btn" onclick="closeModal()">Close</button></div>';

        openModal("Purchase " + docNumber("PUR", purchase.id), html, true);
    } catch (err) {
        showToast(err.message, "error");
    }
}

async function deletePurchase(id) {
    if (!confirm("Delete this purchase? The stock added by it will be removed.")) return;
    try {
        const items = await api("/purchaseitems/purchase/" + id);
        for (const it of items) {
            await api("/purchaseitems/" + it.id, "DELETE");
        }
        await api("/purchases/" + id, "DELETE");
        showToast("Purchase deleted");
    } catch (err) {
        showToast(err.message, "error");
    }
    await loadAll();
    renderPage(currentPage);
}


// ================= New Bill / New Purchase (shared) =================

const docConfig = {
    order: {
        title: "New Bill",
        party: "Customer",
        list: () => data.customers,
        partyKey: "customer_id",
        headPath: "/orders/",
        itemPath: "/orderitems/",
        headKey: "order_id",
        dateKey: "order_date",
        status: "pending",
        checkStock: true
    },
    purchase: {
        title: "New Purchase",
        party: "Supplier",
        list: () => data.suppliers,
        partyKey: "supplier_id",
        headPath: "/purchases/",
        itemPath: "/purchaseitems/",
        headKey: "purchase_id",
        dateKey: "purchase_date",
        status: "received",
        checkStock: false
    }
};

let docKind = "order";
let docLines = [];

function openNewDocument(kind) {
    docKind = kind;
    docLines = [];
    const cfg = docConfig[kind];

    if (cfg.list().length === 0) {
        showToast("Please add a " + cfg.party.toLowerCase() + " first", "error");
        return;
    }
    if (data.products.length === 0) {
        showToast("Please add products first", "error");
        return;
    }

    let partyOptions = '<option value="">Select ' + cfg.party.toLowerCase() + "...</option>";
    cfg.list().forEach(p => { partyOptions += '<option value="' + p.id + '">' + esc(p.name) + "</option>"; });

    let productOptions = '<option value="">Select product...</option>';
    data.products.forEach(p => {
        productOptions += '<option value="' + p.id + '">' + esc(p.name) + " (stock: " + p.quantity + ")</option>";
    });

    const html =
        '<div class="form-grid"><div class="form-group full"><label>' + cfg.party + '</label><select id="docParty">' + partyOptions + "</select></div></div>" +
        '<div class="line-add">' +
        '<div class="form-group"><label>Product</label><select id="lineProduct" onchange="fillLinePrice()">' + productOptions + "</select></div>" +
        '<div class="form-group"><label>Qty</label><input type="number" id="lineQty" min="1" step="1" value="1"></div>' +
        '<div class="form-group"><label>Unit Price</label><input type="number" id="linePrice" min="0" step="any"></div>' +
        '<button class="btn" onclick="addLine()">Add</button></div>' +
        '<div id="lineTable"></div>' +
        '<div class="modal-actions"><button class="btn" onclick="closeModal()">Cancel</button>' +
        '<button class="btn primary" id="saveDocBtn" onclick="saveDocument()">Save</button></div>';

    openModal(cfg.title, html, true);
    drawLines();
}

function fillLinePrice() {
    const id = Number(document.getElementById("lineProduct").value);
    const product = data.products.find(p => p.id === id);
    document.getElementById("linePrice").value = product ? product.price : "";
}

function addLine() {
    const productId = Number(document.getElementById("lineProduct").value);
    const qty = Number(document.getElementById("lineQty").value);
    const price = Number(document.getElementById("linePrice").value);
    const product = data.products.find(p => p.id === productId);

    if (!product) { showToast("Select a product", "error"); return; }
    if (!qty || qty < 1 || !Number.isInteger(qty)) { showToast("Enter a valid quantity", "error"); return; }
    if (isNaN(price) || price < 0 || document.getElementById("linePrice").value === "") { showToast("Enter a valid price", "error"); return; }

    if (docConfig[docKind].checkStock) {
        const already = docLines.filter(l => l.product_id === productId).reduce((t, l) => t + l.qty, 0);
        if (already + qty > product.quantity) {
            showToast("Only " + product.quantity + " in stock for " + product.name, "error");
            return;
        }
    }

    docLines.push({ product_id: productId, name: product.name, qty: qty, price: price });
    document.getElementById("lineProduct").value = "";
    document.getElementById("lineQty").value = 1;
    document.getElementById("linePrice").value = "";
    drawLines();
}

function removeLine(index) {
    docLines.splice(index, 1);
    drawLines();
}

function drawLines() {
    const box = document.getElementById("lineTable");
    if (docLines.length === 0) {
        box.innerHTML = '<div class="empty" style="padding:26px">No items added yet</div>';
        return;
    }
    let total = 0;
    let html = "<table><thead><tr><th>Product</th><th class='num'>Qty</th><th class='num'>Price</th><th class='num'>Amount</th><th></th></tr></thead><tbody>";
    docLines.forEach((l, i) => {
        const amount = l.qty * l.price;
        total += amount;
        html += "<tr><td>" + esc(l.name) + "</td><td class='num'>" + l.qty + "</td><td class='num'>" + money(l.price) + "</td><td class='num'>" + money(amount) + "</td>" +
            '<td class="num"><button class="btn sm danger" onclick="removeLine(' + i + ')">Remove</button></td></tr>';
    });
    html += "</tbody></table>";
    html += '<div class="total-box"><span>Total</span><span>' + money(total) + "</span></div>";
    box.innerHTML = html;
}

async function saveDocument() {
    const cfg = docConfig[docKind];
    const partyId = Number(document.getElementById("docParty").value);

    if (!partyId) { showToast("Please select a " + cfg.party.toLowerCase(), "error"); return; }
    if (docLines.length === 0) { showToast("Add at least one item", "error"); return; }

    const btn = document.getElementById("saveDocBtn");
    btn.disabled = true;
    btn.textContent = "Saving...";

    let newId = 0;
    try {
        const head = { total_amount: 0, status: cfg.status };
        head[cfg.partyKey] = partyId;
        head[cfg.dateKey] = nowLocal();
        if (docKind === "purchase") {
            head.phone = nameOf(data.suppliers, partyId, "phone");
        }

        const doc = await api(cfg.headPath, "POST", head);
        newId = doc.id;

        for (const line of docLines) {
            const item = { product_id: line.product_id, quantity: line.qty, unit_price: line.price };
            item[cfg.headKey] = doc.id;
            await api(cfg.itemPath, "POST", item);
        }
        showToast(cfg.title.replace("New ", "") + " saved successfully");
    } catch (err) {
        showToast(err.message, "error");
    }

    closeModal();
    await loadAll();
    renderPage(currentPage);

    if (newId) {
        if (docKind === "order") viewOrder(newId);
        else viewPurchase(newId);
    }
}


// ================= Payments =================

function renderPayments() {
    setHeader("Payments", "Record money received against bills");
    content.innerHTML =
        '<div class="toolbar">' +
        '<div class="search"><input id="searchBox" placeholder="Search payments..." oninput="drawPayments()"></div>' +
        '<button class="btn primary" onclick="openPaymentForm()">+ Add Payment</button></div>' +
        '<div class="card"><div class="table-wrap" id="tableBox"></div></div>';
    drawPayments();
}

function drawPayments() {
    const box = document.getElementById("tableBox");
    const term = document.getElementById("searchBox").value.toLowerCase();

    const rows = data.payments.slice().reverse().filter(p => {
        const order = data.orders.find(o => o.id === p.order_id);
        const customer = order ? nameOf(data.customers, order.customer_id) : "";
        return (docNumber("INV", p.order_id) + " " + customer + " " + p.payment_method).toLowerCase().includes(term);
    });

    if (rows.length === 0) {
        box.innerHTML = emptyState("No payments found", "Payments you record will appear here.");
        return;
    }

    let html = "<table><thead><tr><th>#</th><th>Date</th><th>Bill</th><th>Customer</th><th>Method</th><th class='num'>Amount</th><th class='num'>Actions</th></tr></thead><tbody>";
    rows.forEach(p => {
        const order = data.orders.find(o => o.id === p.order_id);
        html += "<tr><td>" + p.id + "</td><td>" + showDate(p.payment_date) + "</td>" +
            "<td><strong>" + docNumber("INV", p.order_id) + "</strong></td>" +
            "<td>" + esc(order ? nameOf(data.customers, order.customer_id) : "-") + "</td>" +
            "<td>" + esc(p.payment_method) + "</td>" +
            "<td class='num'>" + money(p.amount) + "</td>" +
            '<td><div class="actions"><button class="btn sm danger" onclick="deletePayment(' + p.id + ')">Delete</button></div></td></tr>';
    });
    box.innerHTML = html + "</tbody></table>";
}

function openPaymentForm(orderId) {
    const unpaid = data.orders.filter(o => o.total_amount - paidOf(o.id) > 0);
    if (unpaid.length === 0) {
        showToast("No bills with pending amount", "error");
        return;
    }

    const fields = [
        {
            name: "order_id", label: "Bill", type: "select", full: true,
            options: () => unpaid.map(o => ({
                value: o.id,
                label: docNumber("INV", o.id) + " - " + nameOf(data.customers, o.customer_id) + " (Due " + money(o.total_amount - paidOf(o.id)) + ")"
            }))
        },
        { name: "amount", label: "Amount (Rs)", type: "number" },
        { name: "payment_method", label: "Method", type: "select", options: () => methods.map(m => ({ value: m, label: m })) },
        { name: "payment_date", label: "Date", type: "datetime", full: true, default: () => nowLocal().slice(0, 16) }
    ];
    window.paymentFields = fields;

    const values = orderId ? { order_id: orderId } : null;
    const html = buildForm(fields, values) +
        '<div class="modal-actions"><button class="btn" onclick="closeModal()">Cancel</button>' +
        '<button class="btn primary" onclick="savePayment()">Save Payment</button></div>';
    openModal("Add Payment", html);

    // Bill select karne par baqi raqam khud aa jaye
    const select = document.getElementById("f_order_id");
    function fillDue() {
        const order = data.orders.find(o => o.id === Number(select.value));
        if (order) {
            document.getElementById("f_amount").value = order.total_amount - paidOf(order.id);
        }
    }
    select.addEventListener("change", fillDue);
    if (orderId) fillDue();
}

async function savePayment() {
    try {
        const body = readForm(window.paymentFields);
        const order = data.orders.find(o => o.id === body.order_id);
        const due = order.total_amount - paidOf(order.id);

        if (body.amount <= 0) throw new Error("Amount must be greater than 0");
        if (body.amount > due) throw new Error("Amount is more than the balance due (" + money(due) + ")");

        await api("/payments/", "POST", body);
        await updateOrderStatus(body.order_id);
        closeModal();
        showToast("Payment recorded");
        await loadAll();
        renderPage(currentPage);
    } catch (err) {
        showToast(err.message, "error");
    }
}

async function deletePayment(id) {
    if (!confirm("Delete this payment?")) return;
    try {
        const payment = data.payments.find(p => p.id === id);
        await api("/payments/" + id, "DELETE");
        await updateOrderStatus(payment.order_id);
        showToast("Payment deleted");
        await loadAll();
        renderPage(currentPage);
    } catch (err) {
        showToast(err.message, "error");
    }
}

// Payment ke baad bill ka status (pending / partial / paid) khud theek karo
async function updateOrderStatus(orderId) {
    const order = await api("/orders/" + orderId);
    const pays = await api("/payments/order/" + orderId);
    const paid = pays.reduce((t, p) => t + p.amount, 0);

    let status = "pending";
    if (order.total_amount > 0 && paid >= order.total_amount) {
        status = "paid";
    } else if (paid > 0) {
        status = "partial";
    }

    await api("/orders/" + orderId, "PUT", {
        customer_id: order.customer_id,
        total_amount: order.total_amount,
        status: status,
        order_date: order.order_date
    });
}


// ================= Navigation =================

function renderPage(name) {
    if (name === "dashboard") renderDashboard();
    else if (name === "orders") renderOrders();
    else if (name === "purchases") renderPurchases();
    else if (name === "payments") renderPayments();
    else renderCrud(name);
}

async function showPage(name) {
    currentPage = name;
    document.querySelectorAll(".nav-item").forEach(b => {
        b.classList.toggle("active", b.dataset.page === name);
    });
    try {
        await loadAll();
        setServerStatus(true);
    } catch (err) {
        setServerStatus(false);
        showToast(err.message, "error");
    }
    renderPage(name);
}

function setServerStatus(ok) {
    document.getElementById("serverDot").className = "dot " + (ok ? "ok" : "bad");
    document.getElementById("serverText").textContent = ok ? "Server connected" : "Server offline";
}

document.querySelectorAll(".nav-item").forEach(b => {
    b.addEventListener("click", () => showPage(b.dataset.page));
});

document.getElementById("todayDate").textContent = new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
});

showPage("dashboard");
