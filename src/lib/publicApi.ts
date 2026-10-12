import { nativeApiFetch } from '@/lib/apiClient';

async function apiGet<T>(path:string, signal?:AbortSignal){return nativeApiFetch<T>(path,{signal},false)}
export const publicCatalogBackend = 'express';

export interface ProductQuery { page?:number;limit?:number;category?:string;brand?:string;search?:string;sort?:'featured'|'newest'|'price-asc'|'price-desc'|'name';featured?:boolean; }
export async function listPublicProducts(input:ProductQuery={}, signal?:AbortSignal){
 const q=new URLSearchParams(); if(input.page)q.set('page',String(input.page));if(input.limit)q.set('limit',String(input.limit));if(input.category)q.set('category',input.category);if(input.brand)q.set('brand',input.brand);if(input.search)q.set('search',input.search);if(input.sort)q.set('sort',input.sort);if(input.featured!==undefined)q.set('featured',String(input.featured));
 return apiGet<any[]>(`/products${q.toString()?`?${q}`:''}`, signal);
}
export const getPublicProduct=(slug:string,signal?:AbortSignal)=>apiGet<any>(`/products/${encodeURIComponent(slug)}`,signal);
export const listPublicCategories=(signal?:AbortSignal)=>apiGet<any[]>('/product-categories',signal);
export const listPublicServices=(signal?:AbortSignal)=>apiGet<any[]>('/services',signal);
export const listPublicTeam=(signal?:AbortSignal)=>apiGet<any[]>('/team-members',signal);
export const listPublicTestimonials=(limit=50,signal?:AbortSignal)=>apiGet<any[]>(`/testimonials?limit=${limit}`,signal);
export const listPublicProjects=(limit=50,signal?:AbortSignal)=>apiGet<any[]>(`/projects?limit=${limit}`,signal);
export const listPublicOffers=(visibility='home_hero',signal?:AbortSignal)=>apiGet<any[]>(`/offers?visibility=${encodeURIComponent(visibility)}`,signal);
export const getPublicSiteSettings=(signal?:AbortSignal)=>apiGet<Record<string,string>>('/site-settings',signal);
