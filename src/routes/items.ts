import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import {
  categoryIdDoesExistValidator,
  genericSanitizerMany,
  itemNameDoesNotExistValidator,
  stringValidator,
  validationCheck,
  xssSanitizerMany,
} from '../lib/validation.js';
import { getImageUrl } from '../setup/genImage.js';
import { requireAdminAuthentication } from './users.js';

const prisma = new PrismaClient();

const itemFields = ['name', 'category', 'imageURL'];

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

async function createItemHandler(req: Request, res: Response) {
  const { name, categoryId } = req.body;

  const imageURL = await getImageUrl(name);

  console.log('RGwqgewgqwg', imageURL);

  const item = await prisma.items.create({
    data: {
      name,
      categoryId,
      imageURL,
    },
  });

  if (!item) {
    return res.status(400).json({ error: 'Item could not be created' });
  }

  return res.status(200).json(item);
}

export const createItem = [
  requireAdminAuthentication,
  stringValidator({ field: 'name', maxLength: 128 }),
  itemNameDoesNotExistValidator,
  categoryIdDoesExistValidator,
  xssSanitizerMany(itemFields),
  validationCheck,
  genericSanitizerMany(itemFields),
  createItemHandler,
].flat();
