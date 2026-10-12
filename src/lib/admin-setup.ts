import { nativeRegister } from '@/lib/apiClient';
export async function createInitialAccount(email:string,password:string){return nativeRegister(email,password)}
