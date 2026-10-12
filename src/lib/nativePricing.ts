import { nativeApiFetch } from './apiClient';

export type PricingQuoteItem = { productId:string; quantity:number; installationService:boolean };
export type PricingQuoteLine = { productId:string; name:string; quantity:number; unitPrice:number; lineSubtotal:number; installationUnit:number; installationTotal:number };
export type PricingTaxLine = { productId:string; rate:number; taxableAmount:number; taxAmount:number };
export type PricingQuote = {
  policyVersion:string;
  currency:'INR'|string;
  items:PricingQuoteLine[];
  subtotal:number;
  installationTotal:number;
  discountAmount:number;
  shipping:{amount:number;zone:string;estimatedDays:string;free:boolean};
  tax:{amount:number;lines:PricingTaxLine[]};
  total:number;
  coupon:null|{id?:string;code:string;type:string;discountAmount:number;freeShipping:boolean};
  quoteOnly:true;
};

export async function getNativePricingQuote(input:{items:PricingQuoteItem[];state:string;couponCode?:string|null}) {
  return nativeApiFetch<PricingQuote>('/pricing/quote',{method:'POST',body:JSON.stringify(input)});
}
