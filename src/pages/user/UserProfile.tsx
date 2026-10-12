import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { accountApi, type ShippingAddress, type ShippingAddressInput } from '@/lib/accountApi';
import { toast } from 'sonner';
import { nativeApiErrorMessage, nativeRequestPasswordReset } from '@/lib/apiClient';
import { Loader2, Save, User, MapPin, Plus, Trash2, Star, KeyRound, LogOut, RefreshCw } from 'lucide-react';

const emptyAddress: ShippingAddressInput = {
  firstName:'', lastName:'', phone:'', email:'', addressLine1:'', addressLine2:'', city:'', state:'', postalCode:'',
  country:'India', landmark:'', addressType:'home', isDefault:false,
};

const requiredAddressFields: Array<keyof ShippingAddressInput> = ['firstName','lastName','phone','email','addressLine1','city','state','postalCode','country'];

const UserProfile=()=>{
  const {user,signOutAll}=useAuth();
  const [loading,setLoading]=useState(true), [saving,setSaving]=useState(false);
  const [loadError,setLoadError]=useState<string|null>(null);
  const [profile,setProfile]=useState({full_name:'',phone:'',address:''});
  const [addresses,setAddresses]=useState<ShippingAddress[]>([]);
  const [addressForm,setAddressForm]=useState<ShippingAddressInput>(emptyAddress);
  const [savingAddress,setSavingAddress]=useState(false);
  const [busyAddressId,setBusyAddressId]=useState<string|null>(null);
  const loadGeneration=useRef(0);

  const load=async()=>{
    if(!user){setProfile({full_name:'',phone:'',address:''});setAddresses([]);setLoading(false);return;}
    const generation=++loadGeneration.current;
    setLoading(true);setLoadError(null);
    try{
      const [p,a]=await Promise.all([accountApi.profile(),accountApi.addresses()]);
      if(generation!==loadGeneration.current)return;
      setProfile({full_name:p.fullName||'',phone:p.phone||'',address:p.address||''});
      setAddresses(a);
      setAddressForm(v=>({...v,email:v.email||user.email||''}));
    }catch(error){
      if(generation!==loadGeneration.current)return;
      const message=nativeApiErrorMessage(error,'Failed to load profile');
      setLoadError(message);toast.error(message);
    }finally{if(generation===loadGeneration.current)setLoading(false);}
  };
  useEffect(()=>{void load(); return()=>{loadGeneration.current+=1;};},[user?.id]);

  const handleSave=async()=>{
    if(!user||saving)return;
    setSaving(true);
    try{
      const updated=await accountApi.updateProfile({fullName:profile.full_name.trim()||null,phone:profile.phone.trim()||null,address:profile.address.trim()||null});
      setProfile({full_name:updated.fullName||'',phone:updated.phone||'',address:updated.address||''});
      toast.success('Profile updated!');
    }catch(error){toast.error(nativeApiErrorMessage(error,'Failed to save profile'));}
    finally{setSaving(false);}
  };

  const validateAddress=()=>{
    for(const key of requiredAddressFields){if(!String(addressForm[key]??'').trim())return `Please enter ${key.replace(/([A-Z])/g,' $1').toLowerCase()}.`;}
    if(!/^\S+@\S+\.\S+$/.test(addressForm.email))return 'Please enter a valid email address.';
    if(addressForm.phone.trim().length<6)return 'Please enter a valid phone number.';
    return null;
  };

  const addAddress=async()=>{
    if(savingAddress)return;
    const validation=validateAddress(); if(validation){toast.error(validation);return;}
    setSavingAddress(true);
    try{
      const created=await accountApi.createAddress({...addressForm,firstName:addressForm.firstName.trim(),lastName:addressForm.lastName.trim(),phone:addressForm.phone.trim(),email:addressForm.email.trim(),addressLine1:addressForm.addressLine1.trim(),city:addressForm.city.trim(),state:addressForm.state.trim(),postalCode:addressForm.postalCode.trim(),country:addressForm.country.trim()});
      setAddresses(v=>[created,...v.map(x=>created.isDefault?{...x,isDefault:false}:x)]);
      setAddressForm({...emptyAddress,email:user?.email||''});
      toast.success('Address saved');
    }catch(error){toast.error(nativeApiErrorMessage(error,'Failed to save address'));}
    finally{setSavingAddress(false);}
  };

  const makeDefault=async(id:string)=>{
    if(busyAddressId)return; setBusyAddressId(id);
    const previous=addresses;
    setAddresses(v=>v.map(x=>({...x,isDefault:x.id===id})));
    try{const updated=await accountApi.setDefaultAddress(id);setAddresses(v=>v.map(x=>({...x,isDefault:x.id===updated.id})));toast.success('Default address updated');}
    catch(error){setAddresses(previous);toast.error(nativeApiErrorMessage(error,'Failed to update default address'));}
    finally{setBusyAddressId(null);}
  };

  const removeAddress=async(id:string)=>{
    if(busyAddressId)return; setBusyAddressId(id);
    const previous=addresses;
    setAddresses(v=>v.filter(x=>x.id!==id));
    try{await accountApi.deleteAddress(id);toast.success('Address removed');}
    catch(error){setAddresses(previous);toast.error(nativeApiErrorMessage(error,'Failed to remove address'));}
    finally{setBusyAddressId(null);}
  };

  const requestPasswordReset=async()=>{if(!user?.email)return toast.error('No email is linked to this account.');try{await nativeRequestPasswordReset(user.email);toast.success('Password reset link sent to your email.');}catch(error){toast.error(nativeApiErrorMessage(error,'Unable to send password reset link.'));}};
  const revokeAllSessions=async()=>{try{await signOutAll();toast.success('Signed out from all devices.');window.location.assign('/login');}catch(error){toast.error(nativeApiErrorMessage(error,'Unable to sign out all sessions.'));}};

  if(loading)return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary"/></div>;
  if(loadError)return <div className="max-w-lg rounded-xl border border-border bg-card p-8 text-center"><h1 className="text-xl font-bold">Could not load your profile</h1><p className="mt-2 text-sm text-muted-foreground">{loadError}</p><button onClick={()=>void load()} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-primary-foreground"><RefreshCw className="h-4 w-4"/>Try again</button></div>;

  return <div className="max-w-3xl space-y-8">
    <div><h1 className="text-2xl font-heading font-bold text-foreground mb-1">My Profile</h1><p className="text-sm text-muted-foreground">Manage your personal information and saved addresses</p></div>
    <div className="bg-card border border-border rounded-xl p-6 space-y-6">
      <div className="flex items-center gap-4 pb-4 border-b border-border"><div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center"><User className="w-6 h-6 text-primary"/></div><div><p className="font-heading font-bold text-foreground">{profile.full_name||'User'}</p><p className="text-sm text-muted-foreground">{user?.email}</p></div></div>
      <div className="space-y-4">
        <label className="block text-sm font-medium">Full Name<input maxLength={120} value={profile.full_name} onChange={e=>setProfile({...profile,full_name:e.target.value})} className="mt-1.5 w-full px-4 py-2.5 rounded-lg border border-border bg-background"/></label>
        <label className="block text-sm font-medium">Phone Number<input maxLength={30} value={profile.phone} onChange={e=>setProfile({...profile,phone:e.target.value})} className="mt-1.5 w-full px-4 py-2.5 rounded-lg border border-border bg-background"/></label>
        <label className="block text-sm font-medium">Address<textarea maxLength={1000} value={profile.address} onChange={e=>setProfile({...profile,address:e.target.value})} rows={3} className="mt-1.5 w-full px-4 py-2.5 rounded-lg border border-border bg-background resize-none"/></label>
      </div>
      <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">{saving?<Loader2 className="w-4 h-4 animate-spin"/>:<Save className="w-4 h-4"/>}Save Changes</button>
    </div>

    <div className="bg-card border border-border rounded-xl p-6 space-y-4">
      <div><h2 className="font-heading font-bold text-lg">Security</h2><p className="text-sm text-muted-foreground">Manage password recovery and active sessions.</p></div>
      <div className="grid sm:grid-cols-2 gap-3">
        <button onClick={requestPasswordReset} className="flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted"><KeyRound className="w-4 h-4"/>Send password reset link</button>
        <button onClick={revokeAllSessions} className="flex items-center justify-center gap-2 rounded-lg border border-destructive/30 px-4 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10"><LogOut className="w-4 h-4"/>Sign out all devices</button>
      </div>
    </div>

    <div className="bg-card border border-border rounded-xl p-6 space-y-5">
      <div className="flex items-center gap-2"><MapPin className="w-5 h-5 text-primary"/><h2 className="font-heading font-bold text-lg">Saved Addresses</h2></div>
      {addresses.length===0&&<p className="text-sm text-muted-foreground">You have no saved addresses yet.</p>}
      <div className="space-y-3">{addresses.map(a=><div key={a.id} className="border border-border rounded-lg p-4 flex justify-between gap-4"><div><div className="flex items-center gap-2 font-medium">{a.firstName} {a.lastName}{a.isDefault&&<span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">Default</span>}</div><p className="text-sm text-muted-foreground">{a.addressLine1}{a.addressLine2?`, ${a.addressLine2}`:''}, {a.city}, {a.state} {a.postalCode}</p><p className="text-xs text-muted-foreground mt-1">{a.phone} · {a.email}</p></div><div className="flex gap-2">{!a.isDefault&&<button disabled={busyAddressId!==null} onClick={()=>void makeDefault(a.id)} title="Set default" className="p-2 rounded border border-border disabled:opacity-50"><Star className="w-4 h-4"/></button>}<button disabled={busyAddressId!==null} onClick={()=>void removeAddress(a.id)} title="Delete" className="p-2 rounded border border-border disabled:opacity-50"><Trash2 className="w-4 h-4"/></button></div></div>)}</div>
      <div className="border-t border-border pt-5"><h3 className="font-medium flex items-center gap-2 mb-3"><Plus className="w-4 h-4"/>Add address</h3><div className="grid sm:grid-cols-2 gap-3">{([['firstName','First name'],['lastName','Last name'],['phone','Phone'],['email','Email'],['addressLine1','Address line 1'],['addressLine2','Address line 2'],['city','City'],['state','State'],['postalCode','Postal code'],['landmark','Landmark']] as Array<[keyof ShippingAddressInput,string]>).map(([k,l])=><input key={k} placeholder={l} value={String(addressForm[k]??'')} onChange={e=>setAddressForm({...addressForm,[k]:e.target.value})} className="px-3 py-2 rounded-lg border border-border bg-background"/> )}</div><label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={addressForm.isDefault} onChange={e=>setAddressForm({...addressForm,isDefault:e.target.checked})}/>Make default</label><button onClick={()=>void addAddress()} disabled={savingAddress} className="mt-4 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm disabled:opacity-50">{savingAddress?'Saving...':'Save address'}</button></div>
    </div>
  </div>;
};
export default UserProfile;
