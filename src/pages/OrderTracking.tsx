import { useEffect,useState } from "react";
import { useSearchParams,Link } from "react-router-dom";
import { trackNativeOrder } from "@/lib/nativeOrders";
import type { NativeOrderTracking } from "@/lib/apiContracts";
import { nativeApiErrorMessage } from "@/lib/apiClient";
import { Package,Truck,CheckCircle,Clock,ShieldCheck,Search,Loader2,ArrowLeft } from "lucide-react";
import { toast } from "sonner";
const OrderTracking=()=>{
 const [params,setParams]=useSearchParams();const [token,setToken]=useState(params.get("token")||"");const [order,setOrder]=useState<NativeOrderTracking|null>(null);const [loading,setLoading]=useState(false);const [searched,setSearched]=useState(false);
 const lookup=async(value:string)=>{if(value.trim().length<40)return;setLoading(true);setSearched(true);setOrder(null);try{setOrder(await trackNativeOrder(value.trim()));}catch(error){toast.error(nativeApiErrorMessage(error,"Tracking lookup failed."));}finally{setLoading(false);}};
 useEffect(()=>{const q=params.get("token");if(q)lookup(q);},[]);
 const submit=(e:React.FormEvent)=>{e.preventDefault();if(token.trim().length<40){toast.error("Enter the secure tracking code from your order confirmation.");return;}setParams({token:token.trim()});lookup(token);};
 const icon=order?.status==="delivered"?<CheckCircle className="w-6 h-6"/>:order?.status==="shipped"?<Truck className="w-6 h-6"/>:<Package className="w-6 h-6"/>;
 return <div className="min-h-screen bg-muted/20"><div className="container max-w-2xl mx-auto px-4 py-10"><Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground mb-8"><ArrowLeft className="w-4 h-4"/>Back</Link><div className="text-center mb-8"><ShieldCheck className="w-10 h-10 mx-auto text-primary mb-3"/><h1 className="text-3xl font-bold">Secure Order Tracking</h1><p className="text-muted-foreground mt-2">Order numbers alone do not expose customer shipment information.</p></div>
 <form onSubmit={submit} className="bg-card border rounded-2xl p-5 flex gap-2"><input value={token} onChange={e=>setToken(e.target.value)} className="flex-1 px-4 py-3 rounded-xl border bg-background" placeholder="Secure tracking code"/><button disabled={loading} className="px-5 rounded-xl bg-primary text-primary-foreground">{loading?<Loader2 className="w-5 h-5 animate-spin"/>:<Search className="w-5 h-5"/>}</button></form>
 {searched&&!loading&&!order&&<div className="mt-6 p-6 bg-card border rounded-2xl text-center">Tracking code not found.</div>}
 {order&&<div className="mt-6 bg-card border rounded-2xl p-6"><div className="flex items-start justify-between"><div><p className="text-sm text-muted-foreground">Order</p><h2 className="font-bold text-xl">#{order.order_number}</h2></div><div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full font-semibold">{icon}{order.status}</div></div><div className="mt-6 grid gap-3 text-sm"><p><span className="text-muted-foreground">Fulfillment:</span> {order.fulfillment_status||"pending"}</p>{order.tracking_number&&<p><span className="text-muted-foreground">AWB:</span> <span className="font-mono">{order.tracking_number}</span></p>}{order.courier_name&&<p><span className="text-muted-foreground">Courier:</span> {order.courier_name}</p>}{order.estimated_delivery_date&&<p><span className="text-muted-foreground">Estimated delivery:</span> {new Date(order.estimated_delivery_date).toLocaleDateString("en-IN")}</p>}</div></div>}
 </div></div>;
};export default OrderTracking;