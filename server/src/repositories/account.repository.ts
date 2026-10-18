import type { DatabaseClient, QueryableDatabase } from '../config/database.js';

export interface ProfileRecord {
  id: string;
  userId: string;
  email: string | null;
  fullName: string | null;
  phone: string | null;
  address: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AddressRecord {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  landmark: string | null;
  addressType: string | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function mapProfile(row: any): ProfileRecord {
  return { id: row.id, userId: row.user_id, email: row.email, fullName: row.full_name, phone: row.phone, address: row.address, createdAt: row.created_at, updatedAt: row.updated_at };
}
function mapAddress(row: any): AddressRecord {
  return { id: row.id, userId: row.user_id, firstName: row.first_name, lastName: row.last_name, phone: row.phone, email: row.email, addressLine1: row.address_line1, addressLine2: row.address_line2, city: row.city, state: row.state, postalCode: row.postal_code, country: row.country, landmark: row.landmark, addressType: row.address_type, isDefault: row.is_default, createdAt: row.created_at, updatedAt: row.updated_at };
}

export class AccountRepository {
  constructor(private readonly db: DatabaseClient) {}

  async getProfile(userId: string, tx: QueryableDatabase = this.db) {
    const result = await tx.query(`SELECT p.*, u.email AS account_email FROM profiles p JOIN users u ON u.id=p.user_id WHERE p.user_id=$1 LIMIT 1`, [userId]);
    if (!result.rows[0]) return null;
    const row = result.rows[0];
    if (!row.email && row.account_email) row.email = row.account_email;
    return mapProfile(row);
  }

  async upsertProfile(userId: string, input: { fullName?: string | null | undefined; phone?: string | null | undefined; address?: string | null | undefined }, tx: QueryableDatabase = this.db) {
    const result = await tx.query(
      `INSERT INTO profiles (user_id,email,full_name,phone,address)
       SELECT u.id,u.email,$2,$3,$4 FROM users u WHERE u.id=$1
       ON CONFLICT (user_id) DO UPDATE SET
         email=COALESCE(profiles.email,EXCLUDED.email),
         full_name=$2, phone=$3, address=$4, updated_at=now()
       RETURNING *`,
      [userId, input.fullName ?? null, input.phone ?? null, input.address ?? null]
    );
    return mapProfile(result.rows[0]);
  }

  async listAddresses(userId: string) {
    const result = await this.db.query(`SELECT * FROM shipping_addresses WHERE user_id=$1 ORDER BY is_default DESC, created_at DESC`, [userId]);
    return result.rows.map(mapAddress);
  }

  async getAddress(userId: string, id: string, tx: QueryableDatabase = this.db) {
    const result = await tx.query(`SELECT * FROM shipping_addresses WHERE id=$1 AND user_id=$2 LIMIT 1`, [id, userId]);
    return result.rows[0] ? mapAddress(result.rows[0]) : null;
  }

  async createAddress(userId: string, input: any) {
    return this.db.withTransaction(async (tx) => {
      const count = await tx.query<{ count: string }>(`SELECT count(*)::text AS count FROM shipping_addresses WHERE user_id=$1`, [userId]);
      const makeDefault = input.isDefault === true || Number(count.rows[0]?.count ?? 0) === 0;
      if (makeDefault) await tx.query(`UPDATE shipping_addresses SET is_default=false, updated_at=now() WHERE user_id=$1 AND is_default=true`, [userId]);
      const result = await tx.query(
        `INSERT INTO shipping_addresses (user_id,first_name,last_name,phone,email,address_line1,address_line2,city,state,postal_code,country,landmark,address_type,is_default)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
        [userId,input.firstName,input.lastName,input.phone,input.email,input.addressLine1,input.addressLine2 ?? null,input.city,input.state,input.postalCode,input.country ?? 'India',input.landmark ?? null,input.addressType ?? 'home',makeDefault]
      );
      return mapAddress(result.rows[0]);
    });
  }

  async updateAddress(userId: string, id: string, input: any) {
    return this.db.withTransaction(async (tx) => {
      const current = await this.getAddress(userId, id, tx);
      if (!current) return null;
      const next = { ...current, ...input };
      if (input.isDefault === true) await tx.query(`UPDATE shipping_addresses SET is_default=false, updated_at=now() WHERE user_id=$1 AND id<>$2 AND is_default=true`, [userId, id]);
      const result = await tx.query(
        `UPDATE shipping_addresses SET first_name=$3,last_name=$4,phone=$5,email=$6,address_line1=$7,address_line2=$8,city=$9,state=$10,postal_code=$11,country=$12,landmark=$13,address_type=$14,is_default=$15,updated_at=now()
         WHERE id=$1 AND user_id=$2 RETURNING *`,
        [id,userId,next.firstName,next.lastName,next.phone,next.email,next.addressLine1,next.addressLine2,next.city,next.state,next.postalCode,next.country,next.landmark,next.addressType,next.isDefault]
      );
      return result.rows[0] ? mapAddress(result.rows[0]) : null;
    });
  }

  async deleteAddress(userId: string, id: string) {
    return this.db.withTransaction(async (tx) => {
      const current = await this.getAddress(userId, id, tx);
      if (!current) return false;
      await tx.query(`DELETE FROM shipping_addresses WHERE id=$1 AND user_id=$2`, [id,userId]);
      if (current.isDefault) {
        await tx.query(`UPDATE shipping_addresses SET is_default=true, updated_at=now() WHERE id=(SELECT id FROM shipping_addresses WHERE user_id=$1 ORDER BY created_at DESC LIMIT 1)`, [userId]);
      }
      return true;
    });
  }

  async setDefaultAddress(userId: string, id: string) {
    return this.db.withTransaction(async (tx) => {
      const current = await this.getAddress(userId, id, tx);
      if (!current) return null;
      await tx.query(`UPDATE shipping_addresses SET is_default=false, updated_at=now() WHERE user_id=$1 AND is_default=true`, [userId]);
      const result = await tx.query(`UPDATE shipping_addresses SET is_default=true, updated_at=now() WHERE id=$1 AND user_id=$2 RETURNING *`, [id,userId]);
      return result.rows[0] ? mapAddress(result.rows[0]) : null;
    });
  }
}
