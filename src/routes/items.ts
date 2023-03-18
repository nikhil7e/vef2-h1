import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { requireAdminAuthentication } from './users.js';

const prisma = new PrismaClient();

async function getItemsHandler(req: Request, res: Response) {
  const items = await prisma.items.findMany({
    where: {},
  });

  if (!items) {
    return res.status(201).json({ error: 'No items exist' });
  }

  return res.status(200).json(items);
}

export const getItems = [requireAdminAuthentication, getItemsHandler];
