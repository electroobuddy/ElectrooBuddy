import { describe, expect, it } from 'vitest';
import { MediaService } from '../src/services/media.service.js';
import type { StorageProvider } from '../src/providers/storage.provider.js';

const png = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c6360f8cfc000000401010089990d1d0000000049454e44ae426082','hex');

function storage(): StorageProvider {
  return {
    name:'test-s3',
    async put(input){ return { key:input.key,bucket:'images',size:input.body.byteLength,mimeType:input.mimeType,publicUrl:`https://cdn.example/${input.key}` }; },
    async delete(){}, async head(){ return {exists:true}; }, getPublicUrl(key){ return `https://cdn.example/${key}`; }
  };
}
function db(){ return { async query(){ return { rows:[{id:'00000000-0000-4000-8000-000000000001'}], rowCount:1 }; } } as any; }

describe('Phase 5 media security',()=>{
  it('accepts an actual image and ignores the original filename for the object key',async()=>{
    const service=new MediaService(db(),storage(),5*1024*1024);
    const result=await service.uploadImage({body:png,claimedMimeType:'image/png',originalName:'../../evil.php',folder:'products'});
    expect(result.mimeType).toBe('image/png');
    expect(result.key).toMatch(/^products\/\d{4}-\d{2}\/[0-9a-f-]+\.png$/);
    expect(result.key).not.toContain('evil');
  });
  it('rejects MIME spoofing',async()=>{
    const service=new MediaService(db(),storage(),5*1024*1024);
    await expect(service.uploadImage({body:png,claimedMimeType:'image/jpeg',folder:'products'})).rejects.toMatchObject({code:'IMAGE_MIME_MISMATCH'});
  });
  it('rejects non-image bytes',async()=>{
    const service=new MediaService(db(),storage(),5*1024*1024);
    await expect(service.uploadImage({body:Buffer.from('<script>alert(1)</script>'),claimedMimeType:'image/png',folder:'products'})).rejects.toMatchObject({code:'INVALID_IMAGE_TYPE'});
  });
});
