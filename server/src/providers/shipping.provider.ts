export interface ShipmentItemInput { name:string; sku?:string|null; units:number; sellingPrice:number }
export interface ShipmentAddressInput { name:string; email:string; phone:string; address:string; address2?:string|null; city:string; state:string; pincode:string; country:string }
export interface CreateShipmentInput { orderId:string; orderNumber:string; orderedAt:Date; paymentMethod:'cod'|'prepaid'; total:number; subtotal:number; weight:number; length:number; breadth:number; height:number; address:ShipmentAddressInput; items:ShipmentItemInput[] }
export interface ShipmentResult { providerOrderId:string; providerShipmentId:string; awbCode?:string|null; courierName?:string|null; trackingUrl?:string|null }
export interface TrackingResult { status:string; awbCode?:string|null; courierName?:string|null; trackingUrl?:string|null; estimatedDeliveryDate?:string|null; history?:unknown[] }
export interface ShippingDocumentsResult { labelUrl?:string|null; manifestUrl?:string|null }
export interface ShippingProvider {
  testConnection(): Promise<void>;
  createShipment(input:CreateShipmentInput): Promise<ShipmentResult>;
  assignAwb(providerShipmentId:string): Promise<ShipmentResult>;
  schedulePickup(providerShipmentId:string): Promise<void>;
  trackAwb(awbCode:string): Promise<TrackingResult>;
  cancelShipment(input:{providerOrderId?:string|null;providerShipmentId?:string|null}): Promise<void>;
  generateLabel(providerShipmentIds:string[]): Promise<string|null>;
  generateManifest(providerShipmentIds:string[]): Promise<string|null>;
}
