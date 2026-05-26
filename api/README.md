# api

Backend API application.

## Production endpoints
- API origin: `https://smoveapi-1.onrender.com`
- API base path used by frontends: `https://smoveapi-1.onrender.com/api/v1`

## Required CORS setup
Set `FRONTEND_ORIGINS` to explicit origins:
- `https://smove-three.vercel.app`
- `https://smoovecms.vercel.app`

Optional preview support is disabled by default:
- `ALLOW_CMS_VERCEL_PREVIEW_ORIGINS=false`

If enabled (`true`), only `https://smoovecms-*.vercel.app` is accepted (not all `*.vercel.app`).

Local development origins are always allowed:
- `http://localhost:5173`, `http://localhost:5174`
- `http://127.0.0.1:5173`, `http://127.0.0.1:5174`

## Commands
- `npm install`
- `npm run dev`
- `npm start`

## Marketplace API (Iteration 2)
Base path: `/api`

### Products
- `GET /api/products` (pagination: `page`, `limit`; search/filter: `q`, `category`, `vendor`, `status`, `isFeatured`, `isPromoted`, `minPrice`, `maxPrice`)
- `GET /api/products/:slug`
- `POST /api/products`
- `PUT /api/products/:id`
- `DELETE /api/products/:id`

### Categories
- `GET /api/categories`
- `POST /api/categories`
- `PUT /api/categories/:id`
- `DELETE /api/categories/:id`

### Vendor requests
- `POST /api/vendor-requests`
- `GET /api/vendor-requests`
- `PUT /api/vendor-requests/:id/approve`
- `PUT /api/vendor-requests/:id/reject`

### Orders
- `POST /api/orders`
- `GET /api/orders`
- `GET /api/orders/:id`
- `PUT /api/orders/:id/status`

### JSON examples
Create product request:
```json
{
  "name": "Mini PC Ryzen 7",
  "slug": "mini-pc-ryzen-7",
  "description": "Compact workstation",
  "price": 699.99,
  "currency": "USD",
  "images": ["https://cdn.example.com/p1.jpg"],
  "category": "6653fd4ddf17ab1ac67d8a11",
  "vendor": "6653fd4ddf17ab1ac67d8a12",
  "stock": 25,
  "weight": 1.4,
  "length": 19,
  "width": 16,
  "height": 7,
  "originCountry": "US",
  "originCity": "Austin",
  "status": "active",
  "isFeatured": true,
  "isPromoted": false
}
```
Create order request:
```json
{
  "customer": "6653fd4ddf17ab1ac67d8a33",
  "currency": "USD",
  "items": [
    {
      "product": "6653fd4ddf17ab1ac67d8a44",
      "vendor": "6653fd4ddf17ab1ac67d8a12",
      "quantity": 2,
      "unitPrice": 699.99
    }
  ],
  "shippingAddress": {
    "fullName": "John Doe",
    "line1": "500 Market St",
    "city": "San Francisco",
    "country": "US",
    "postalCode": "94105",
    "phone": "+14155550100"
  }
}
```
Order response (sample):
```json
{
  "_id": "6653fe05df17ab1ac67d8b10",
  "status": "pending",
  "shippingStatus": "estimated",
  "subtotal": 1399.98,
  "shippingCost": 5.84,
  "total": 1405.82
}
```
