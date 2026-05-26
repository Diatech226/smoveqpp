const SIMULATION_MODE = process.env.SHIPPING_SIMULATION_MODE !== 'false';

async function estimateShipping(orderData) {
  const weight = Number(orderData?.totalWeight || 0);
  const base = 5;
  const estimatedCost = Number((base + weight * 0.6).toFixed(2));
  return { status: 'estimated', estimatedCost, currency: orderData.currency || 'USD', simulated: SIMULATION_MODE };
}

async function createShipment(orderData) {
  if (SIMULATION_MODE) {
    return { status: 'created', simulated: true, carrier: 'SIM_CARRIER', trackingNumber: `SIM-${Date.now()}`, externalReference: `sim_${orderData.orderId || 'na'}` };
  }
  throw new Error('Real shipping API not integrated yet');
}

module.exports = { estimateShipping, createShipment, SIMULATION_MODE };
