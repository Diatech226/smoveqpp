const express = require('express');
const c = require('../controllers/marketplaceController');
const { requireAuth, requireRole, validateRequest } = require('../middleware/marketplace');

function createMarketplaceRoutes() {
  const r = express.Router();
  r.get('/products', c.listProducts);
  r.get('/products/:slug', c.getProductBySlug);
  r.post('/products', requireAuth, requireRole('admin', 'vendor'), validateRequest(['name', 'slug', 'price', 'category', 'vendor']), c.createProduct);
  r.put('/products/:id', requireAuth, requireRole('admin', 'vendor'), c.updateProduct);
  r.delete('/products/:id', requireAuth, requireRole('admin', 'vendor'), c.deleteProduct);

  r.get('/categories', c.listCategories);
  r.post('/categories', requireAuth, requireRole('admin'), validateRequest(['name', 'slug']), c.createCategory);
  r.put('/categories/:id', requireAuth, requireRole('admin'), c.updateCategory);
  r.delete('/categories/:id', requireAuth, requireRole('admin'), c.deleteCategory);

  r.post('/vendor-requests', requireAuth, validateRequest(['user', 'shopName']), c.createVendorRequest);
  r.get('/vendor-requests', requireAuth, requireRole('admin'), c.listVendorRequests);
  r.put('/vendor-requests/:id/approve', requireAuth, requireRole('admin'), c.approveVendorRequest);
  r.put('/vendor-requests/:id/reject', requireAuth, requireRole('admin'), c.rejectVendorRequest);

  r.post('/orders', requireAuth, validateRequest(['customer', 'items', 'shippingAddress']), c.createOrder);
  r.get('/orders', requireAuth, requireRole('admin', 'vendor'), c.listOrders);
  r.get('/orders/:id', requireAuth, c.getOrder);
  r.put('/orders/:id/status', requireAuth, requireRole('admin', 'vendor'), validateRequest(['status']), c.updateOrderStatus);
  return r;
}
module.exports = { createMarketplaceRoutes };
