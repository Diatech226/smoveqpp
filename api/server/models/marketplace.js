const mongoose = require('mongoose');

const orderStatus = ['pending','confirmed','paid','processing','shipped','delivered','cancelled'];
const shipmentStatus = ['not_created','estimated','created','in_transit','delivered','failed'];

const userSchema = new mongoose.Schema({ clerkId: { type: String, index: true }, email: { type: String, required: true, unique: true }, name: String, role: { type: String, enum: ['customer','vendor','admin'], default: 'customer' } }, { timestamps: true });
const vendorRequestSchema = new mongoose.Schema({ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, shopName: { type: String, required: true }, status: { type: String, enum: ['pending','approved','rejected'], default: 'pending' }, rejectionReason: String }, { timestamps: true });
const vendorSchema = new mongoose.Schema({ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true }, shopName: { type: String, required: true }, description: String, isActive: { type: Boolean, default: true } }, { timestamps: true });

const categorySchema = new mongoose.Schema({ name: { type: String, required: true }, slug: { type: String, required: true, unique: true }, description: String, isActive: { type: Boolean, default: true } }, { timestamps: true });

const productSchema = new mongoose.Schema({
  name: { type: String, required: true }, slug: { type: String, required: true, unique: true, index: true }, description: String, price: { type: Number, required: true, min: 0 }, currency: { type: String, required: true, default: 'USD' }, images: [{ type: String }], category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true }, vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true }, stock: { type: Number, default: 0, min: 0 }, weight: { type: Number, default: 0 }, length: { type: Number, default: 0 }, width: { type: Number, default: 0 }, height: { type: Number, default: 0 }, originCountry: String, originCity: String, status: { type: String, enum: ['draft','active','archived'], default: 'draft' }, isFeatured: { type: Boolean, default: false }, isPromoted: { type: Boolean, default: false }
}, { timestamps: true });

const orderItemSchema = new mongoose.Schema({ order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true }, product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }, vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true }, quantity: { type: Number, required: true, min: 1 }, unitPrice: { type: Number, required: true, min: 0 }, currency: { type: String, required: true, default: 'USD' }, subtotal: { type: Number, required: true, min: 0 } }, { timestamps: true });

const shipmentSchema = new mongoose.Schema({ order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true }, status: { type: String, enum: shipmentStatus, default: 'not_created' }, estimatedCost: Number, carrier: String, trackingNumber: String, externalReference: String, simulated: { type: Boolean, default: true } }, { timestamps: true });

const orderSchema = new mongoose.Schema({ customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, items: [{ type: mongoose.Schema.Types.ObjectId, ref: 'OrderItem' }], status: { type: String, enum: orderStatus, default: 'pending' }, currency: { type: String, default: 'USD' }, subtotal: Number, shippingCost: Number, total: Number, shippingStatus: { type: String, enum: shipmentStatus, default: 'not_created' }, shippingAddress: { fullName: String, line1: String, city: String, country: String, postalCode: String, phone: String } }, { timestamps: true });

const slideSchema = new mongoose.Schema({ title: String, image: String, ctaLabel: String, ctaUrl: String, isActive: { type: Boolean, default: true }, order: { type: Number, default: 0 } }, { timestamps: true });
const settingSchema = new mongoose.Schema({ key: { type: String, required: true, unique: true }, value: mongoose.Schema.Types.Mixed }, { timestamps: true });
const currencyRateSchema = new mongoose.Schema({ base: { type: String, required: true }, quote: { type: String, required: true }, rate: { type: Number, required: true }, source: String, asOf: Date }, { timestamps: true });
const marketplacePointSchema = new mongoose.Schema({ name: { type: String, required: true }, type: { type: String, enum: ['pickup','hub','warehouse'], default: 'pickup' }, city: String, country: String, address: String, lat: Number, lng: Number, isActive: { type: Boolean, default: true } }, { timestamps: true });

module.exports = {
  orderStatus, shipmentStatus,
  User: mongoose.models.User || mongoose.model('User', userSchema),
  VendorRequest: mongoose.models.VendorRequest || mongoose.model('VendorRequest', vendorRequestSchema),
  Vendor: mongoose.models.Vendor || mongoose.model('Vendor', vendorSchema),
  Product: mongoose.models.Product || mongoose.model('Product', productSchema),
  Category: mongoose.models.Category || mongoose.model('Category', categorySchema),
  Order: mongoose.models.Order || mongoose.model('Order', orderSchema),
  OrderItem: mongoose.models.OrderItem || mongoose.model('OrderItem', orderItemSchema),
  Slide: mongoose.models.Slide || mongoose.model('Slide', slideSchema),
  Shipment: mongoose.models.Shipment || mongoose.model('Shipment', shipmentSchema),
  Setting: mongoose.models.Setting || mongoose.model('Setting', settingSchema),
  CurrencyRate: mongoose.models.CurrencyRate || mongoose.model('CurrencyRate', currencyRateSchema),
  MarketplacePoint: mongoose.models.MarketplacePoint || mongoose.model('MarketplacePoint', marketplacePointSchema),
};
