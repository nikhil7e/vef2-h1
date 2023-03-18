import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { requireAdminAuthentication } from './users.js';

const prisma = new PrismaClient();

async function getCategoriesHandler(req: Request, res: Response) {
  const categories = await prisma.category.findMany({
    where: {},
  });

  if (!categories) {
    return res.status(201).json({ error: 'No categories exist' });
  }

  return res.status(200).json(categories);
}

export const getCategories = [requireAdminAuthentication, getCategoriesHandler];
