const { Product, Category, VendorRequest, Vendor, Order, OrderItem, Shipment, User, orderStatus } = require('../models/marketplace');
const shippingService = require('../services/shipping.service');

const listProducts = async (req, res) => {
  const { page = 1, limit = 20, q, category, vendor, status, isFeatured, isPromoted, minPrice, maxPrice } = req.query;
  const filter = {};
  if (q) filter.$or = [{ name: { $regex: q, $options: 'i' } }, { description: { $regex: q, $options: 'i' } }];
  if (category) filter.category = category;
  if (vendor) filter.vendor = vendor;
  if (status) filter.status = status;
  if (isFeatured !== undefined) filter.isFeatured = isFeatured === 'true';
  if (isPromoted !== undefined) filter.isPromoted = isPromoted === 'true';
  if (minPrice || maxPrice) filter.price = { ...(minPrice ? { $gte: Number(minPrice) } : {}), ...(maxPrice ? { $lte: Number(maxPrice) } : {}) };
  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([Product.find(filter).populate('category vendor').skip(skip).limit(Number(limit)).sort({ createdAt: -1 }), Product.countDocuments(filter)]);
  res.json({ data: items, meta: { page: Number(page), limit: Number(limit), total } });
};
const getProductBySlug = async (req, res) => { const item = await Product.findOne({ slug: req.params.slug }).populate('category vendor'); if (!item) return res.status(404).json({ message: 'Not found' }); res.json(item); };
const createProduct = async (req, res) => { const item = await Product.create(req.body); res.status(201).json(item); };
const updateProduct = async (req, res) => { const item = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }); if (!item) return res.status(404).json({ message: 'Not found' }); res.json(item); };
const deleteProduct = async (req, res) => { const item = await Product.findByIdAndDelete(req.params.id); if (!item) return res.status(404).json({ message: 'Not found' }); res.status(204).send(); };

const listCategories = async (_req, res) => res.json(await Category.find().sort({ name: 1 }));
const createCategory = async (req, res) => res.status(201).json(await Category.create(req.body));
const updateCategory = async (req, res) => res.json(await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }));
const deleteCategory = async (req, res) => { await Category.findByIdAndDelete(req.params.id); res.status(204).send(); };

const createVendorRequest = async (req, res) => res.status(201).json(await VendorRequest.create(req.body));
const listVendorRequests = async (_req, res) => res.json(await VendorRequest.find().populate('user').sort({ createdAt: -1 }));
const approveVendorRequest = async (req, res) => { const vr = await VendorRequest.findByIdAndUpdate(req.params.id, { status: 'approved' }, { new: true }); if (!vr) return res.status(404).json({ message: 'Not found' }); await User.findByIdAndUpdate(vr.user, { role: 'vendor' }); const vendor = await Vendor.create({ user: vr.user, shopName: vr.shopName }); res.json({ vendorRequest: vr, vendor }); };
const rejectVendorRequest = async (req, res) => res.json(await VendorRequest.findByIdAndUpdate(req.params.id, { status: 'rejected', rejectionReason: req.body.rejectionReason || '' }, { new: true }));

const createOrder = async (req, res) => {
  const { customer, items, shippingAddress, currency = 'USD' } = req.body;
  const createdItems = await OrderItem.insertMany(items.map((i) => ({ ...i, subtotal: i.quantity * i.unitPrice, currency })));
  const subtotal = createdItems.reduce((a, i) => a + i.subtotal, 0);
  const estimate = await shippingService.estimateShipping({ items: createdItems, currency, totalWeight: req.body.totalWeight || 0 });
  const order = await Order.create({ customer, items: createdItems.map((i) => i._id), currency, subtotal, shippingCost: estimate.estimatedCost, total: subtotal + estimate.estimatedCost, shippingStatus: estimate.status, shippingAddress });
  await Shipment.create({ order: order._id, status: estimate.status, estimatedCost: estimate.estimatedCost, simulated: estimate.simulated });
  res.status(201).json(await Order.findById(order._id).populate('items'));
};
const listOrders = async (_req, res) => res.json(await Order.find().populate('customer items').sort({ createdAt: -1 }));
const getOrder = async (req, res) => { const item = await Order.findById(req.params.id).populate('customer items'); if (!item) return res.status(404).json({ message: 'Not found' }); res.json(item); };
const updateOrderStatus = async (req, res) => { if (!orderStatus.includes(req.body.status)) return res.status(400).json({ message: 'Invalid status' }); const order = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true }); if (!order) return res.status(404).json({ message: 'Not found' }); if (req.body.status === 'shipped') { const shipment = await shippingService.createShipment({ orderId: order._id, currency: order.currency }); await Shipment.findOneAndUpdate({ order: order._id }, shipment, { upsert: true, new: true }); order.shippingStatus = 'created'; await order.save(); } res.json(order); };

module.exports = { listProducts, getProductBySlug, createProduct, updateProduct, deleteProduct, listCategories, createCategory, updateCategory, deleteCategory, createVendorRequest, listVendorRequests, approveVendorRequest, rejectVendorRequest, createOrder, listOrders, getOrder, updateOrderStatus };
