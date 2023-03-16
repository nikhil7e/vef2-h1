import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import pg, { Pool, PoolClient } from 'pg';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

const pool: Pool = new pg.Pool({ connectionString });

pool.on('error', (err: Error) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export async function query(q: string, values: Array<any> = []): Promise<any> {
  const client: PoolClient = await pool.connect();

  let result: any;

  try {
    result = await client.query(q, values);
  } catch (err) {
    console.error('Villa í query', err);
    throw err;
  } finally {
    client.release();
  }

  return result;
}

export async function comparePasswords(
  password: string,
  hash: string
): Promise<boolean> {
  const result: boolean = await bcrypt.compare(password, hash);

  return result;
}

export async function findByUsername(username: string): Promise<any> {
  const q = 'SELECT * FROM users WHERE username = $1';

  try {
    const result: any = await query(q, [username]);

    if (result.rowCount === 1) {
      return result.rows[0];
    }
  } catch (e) {
    console.error('Gat ekki fundið notanda eftir notendnafni');
    return null;
  }

  return false;
}

export async function findById(id: number): Promise<any> {
  const q = 'SELECT * FROM users WHERE id = $1';

  try {
    const result: any = await query(q, [id]);

    if (result.rowCount === 1) {
      return result.rows[0];
    }
  } catch (e) {
    console.error('Gat ekki fundið notanda eftir id');
  }

  return null;
}
