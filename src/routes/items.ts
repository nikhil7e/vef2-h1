import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import {
  atLeastOneBodyValueValidator,
  categoryIdDoesExistValidator,
  genericSanitizerMany,
  itemIdDoesExistValidator,
  itemNameDoesNotExistValidator,
  stringValidator,
  validationCheck,
  xssSanitizerMany,
} from '../lib/validation.js';
import { getImageUrl } from '../setup/genImage.js';
import { requireAdminAuthentication } from './users.js';

const prisma = new PrismaClient();

const itemFields = ['name', 'categoryId'];

async function getItemsHandler(req: Request, res: Response) {
  const items = await prisma.items.findMany({
    where: {},
    include: {
      category: true,
      firstOptionQuestions: true,
      secondOptionQuestions: true,
    },
  });

  if (!items) {
    return res.status(201).json({ error: 'No items exist' });
  }

  return res.status(200).json(items);
}

export const getItems = [requireAdminAuthentication, getItemsHandler];

async function getItemHandler(req: Request, res: Response) {
  const { itemId } = req.params;

  const id = Number.parseInt(itemId, 10);

  const item = await prisma.items.findUnique({
    where: { id },
    include: {
      category: true,
      firstOptionQuestions: true,
      secondOptionQuestions: true,
    },
  });

  if (!item) {
    return res.status(404).json({ error: 'Item with itemId does not exist' });
  }

  return res.status(200).json(item);
}

export const getItem = [
  requireAdminAuthentication,
  itemIdDoesExistValidator,
  validationCheck,
  getItemHandler,
];

async function createItemHandler(req: Request, res: Response) {
  const { name, categoryId } = req.body;

  const imageURL = await getImageUrl(name);

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

async function deleteItemHandler(req: Request, res: Response) {
  const { itemId } = req.params;

  const id = Number.parseInt(itemId, 10);

  const item = await prisma.items.delete({
    where: { id },
  });

  if (!item) {
    return res.status(404).json({ error: 'Item with itemId does not exist' });
  }

  return res.status(204).json();
}

export const deleteItem = [
  requireAdminAuthentication,
  itemIdDoesExistValidator,
  validationCheck,
  deleteItemHandler,
];

async function patchItemHandler(req: Request, res: Response) {
  const { name, categoryId } = req.body;
  const { itemId } = req.params;

  let imageURL;
  if (name) {
    imageURL = await getImageUrl(name);
  }

  let cId;
  if (categoryId) {
    cId = Number.parseInt(categoryId, 10);
  }

  const iId = Number.parseInt(itemId, 10);

  const oldItem = await prisma.items.findFirst({
    where: {
      id: iId,
    },
  });

  const itemToUpdate = await prisma.items.update({
    where: {
      id: iId,
    },
    data: {
      name: name || oldItem?.name,
      categoryId: cId || oldItem?.categoryId,
      imageURL: name ? imageURL : oldItem?.imageURL,
    },
  });

  if (!itemToUpdate) {
    return res.status(400).json({ error: 'Category could not be updated' });
  }

  return res.status(200).json(itemToUpdate);
}

export const patchItem = [
  requireAdminAuthentication,
  stringValidator({ field: 'name', maxLength: 128, optional: true }),
  stringValidator({
    field: 'categoryId',
    maxLength: 128,
    optional: true,
  }),
  atLeastOneBodyValueValidator(itemFields),
  itemIdDoesExistValidator,
  itemNameDoesNotExistValidator({ optional: true }),
  categoryIdDoesExistValidator({ optional: true }),
  xssSanitizerMany(itemFields),
  validationCheck,
  genericSanitizerMany(itemFields),
  patchItemHandler,
].flat();
