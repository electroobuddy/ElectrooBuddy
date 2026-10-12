import { nativeApiFetch } from './apiClient';

export interface AccountProfile { id:string; userId:string; email:string|null; fullName:string|null; phone:string|null; address:string|null; createdAt:string; updatedAt:string; }
export type AddressType = 'home' | 'work' | 'other';
export interface ShippingAddress { id:string; userId:string; firstName:string; lastName:string; phone:string; email:string; addressLine1:string; addressLine2:string|null; city:string; state:string; postalCode:string; country:string; landmark:string|null; addressType:AddressType|null; isDefault:boolean; createdAt:string; updatedAt:string; }
export interface ShippingAddressInput { firstName:string; lastName:string; phone:string; email:string; addressLine1:string; addressLine2?:string|null; city:string; state:string; postalCode:string; country:string; landmark?:string|null; addressType?:AddressType; isDefault?:boolean; }

export const accountApi = {
  profile: () => nativeApiFetch<AccountProfile>('/users/me/profile'),
  updateProfile: (data: {fullName?:string|null;phone?:string|null;address?:string|null}) => nativeApiFetch<AccountProfile>('/users/me/profile',{method:'PATCH',body:JSON.stringify(data)}),
  addresses: () => nativeApiFetch<ShippingAddress[]>('/users/me/addresses'),
  createAddress: (data: ShippingAddressInput) => nativeApiFetch<ShippingAddress>('/users/me/addresses',{method:'POST',body:JSON.stringify(data)}),
  updateAddress: (id:string,data:Partial<ShippingAddressInput>) => nativeApiFetch<ShippingAddress>(`/users/me/addresses/${id}`,{method:'PATCH',body:JSON.stringify(data)}),
  deleteAddress: (id:string) => nativeApiFetch<{deleted:boolean}>(`/users/me/addresses/${id}`,{method:'DELETE'}),
  setDefaultAddress: (id:string) => nativeApiFetch<ShippingAddress>(`/users/me/addresses/${id}/default`,{method:'POST'})
};
