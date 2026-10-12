import { useState } from "react";
import { Link } from "react-router-dom";
import { lookupNativeBooking } from "@/lib/nativeBooking";
import { toast } from "sonner";
import type { NativeBooking } from "@/lib/apiContracts";
import { Search, Calendar, Clock, ArrowLeft, ShieldCheck, Loader2 } from "lucide-react";

const BookingTracking = () => {
 const [token,setToken]=useState("");const [booking,setBooking]=useState<NativeBooking|null>(null);const [loading,setLoading]=useState(false);const [searched,setSearched]=useState(false);const [error,setError]=useState<string|null>(null);
 const search=async(e:React.FormEvent)=>{e.preventDefault();const value=token.trim();if(value.length<50){toast.error("Enter the secure tracking code from your booking confirmation.");return;}setLoading(true);setSearched(true);setBooking(null);setError(null);
  try{setBooking(await lookupNativeBooking(value));}catch(err:any){const message=err?.message||"Tracking lookup failed. Please try again.";setError(message);toast.error(message);}finally{setLoading(false);}};
 return <div className="min-h-screen bg-muted/20"><div className="container max-w-2xl mx-auto px-4 py-10">
  <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground mb-8"><ArrowLeft className="w-4 h-4"/>Back to Home</Link>
  <div className="text-center mb-8"><ShieldCheck className="w-10 h-10 text-primary mx-auto mb-3"/><h1 className="text-3xl font-bold">Secure Booking Tracking</h1><p className="text-muted-foreground mt-2">Use the private tracking code from your booking confirmation. Phone/email lookup is disabled to protect customer information.</p></div>
  <form onSubmit={search} className="bg-card border rounded-2xl p-5 shadow-sm"><label className="text-sm font-semibold">Tracking code</label><div className="flex gap-2 mt-2"><input value={token} onChange={e=>setToken(e.target.value)} autoComplete="off" className="flex-1 px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="Paste secure tracking code"/><button disabled={loading} className="px-5 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-50">{loading?<Loader2 className="w-5 h-5 animate-spin"/>:<Search className="w-5 h-5"/>}</button></div></form>
  {searched&&!loading&&!booking&&<div className="mt-6 p-6 bg-card border rounded-2xl text-center"><p className="font-semibold">{error ? "Tracking unavailable" : "No booking found"}</p><p className="text-sm text-muted-foreground mt-1">{error || "Check the tracking code or sign in to view your bookings."}</p>{error&&<button type="button" onClick={() => void search({preventDefault(){}} as React.FormEvent)} className="mt-3 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">Retry</button>}</div>}
  {booking&&<div className="mt-6 bg-card border rounded-2xl p-6"><div className="flex justify-between gap-4"><div><p className="text-sm text-muted-foreground">Service</p><h2 className="text-xl font-bold">{booking.service_type}</h2></div><span className="h-fit px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold">{booking.status}</span></div><div className="grid sm:grid-cols-2 gap-4 mt-6 text-sm"><div className="flex gap-2"><Calendar className="w-4 h-4 text-primary"/>{new Date(booking.preferred_date).toLocaleDateString("en-IN")}</div><div className="flex gap-2"><Clock className="w-4 h-4 text-primary"/>{booking.preferred_time}</div></div>{booking.technician_name&&<p className="mt-4 text-sm"><span className="text-muted-foreground">Assigned technician:</span> {booking.technician_name}</p>}</div>}
 </div></div>;
};
export default BookingTracking;