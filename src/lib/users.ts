import { PrismaClient, users } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import pg, { Pool } from 'pg';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

const pool: Pool = new pg.Pool({ connectionString });

const prisma = new PrismaClient();

pool.on('error', (err: Error) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// export async function query(q: string, values: Array<any> = []): Promise<any> {
//   const client: PoolClient = await pool.connect();

//   let result: any;

//   try {
//     result = await client.query(q, values);
//   } catch (err) {
//     console.error('Villa í query', err);
//     throw err;
//   } finally {
//     client.release();
//   }

//   return result;
// }

export async function comparePasswords(
  password: string,
  hash: string
): Promise<boolean> {
  const result: boolean = await bcrypt.compare(password, hash);

  return result;
}

export async function findByUsername(username: string): Promise<users | null> {
  const user = await prisma.users.findUnique({
    where: {
      username,
    },
  });

  if (!user) {
    console.error('Gat ekki fundið notanda eftir notendanafni');
  }

  return user;
}

export async function findById(id: number): Promise<users | null> {
  const user = await prisma.users.findUnique({
    where: {
      id,
    },
  });

  if (!user) {
    console.error('Gat ekki fundið notanda eftir id');
  }

  return user;
}

export async function createUser(
  username: string,
  password: string
): Promise<users | null> {
  const hashedPassword = await bcrypt.hash(password, 11);

  const user = await prisma.users.create({
    data: {
      username,
      password: hashedPassword,
    },
  });

  if (!user) {
    console.error('Gat ekki búið til notanda');
  }

  return user;
}
