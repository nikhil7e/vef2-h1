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
import { requireAdminAuthentication, requireAuthentication } from './users.js';

const prisma = new PrismaClient();

const itemFields = ['name', 'categoryId'];

interface PaginationLinks {
  self: string;
  next?: string;
  prev?: string;
}

async function getItemsHandler(req: Request, res: Response) {
  try {
    const page = Number(req.query.page) || 1; // set default page to 1 if not provided
    const perPage = 10; // set number of items per page
    const skip = (page - 1) * perPage; // calculate the number of items to skip

    const [items, totalItems] = await Promise.all([
      prisma.items.findMany({
        take: perPage, // limit the number of items returned to perPage
        skip, // skip the first 'skip' number of items
        where: {},
        include: {
          category: true,
          firstOptionQuestions: true,
          secondOptionQuestions: true,
        },
      }),
      prisma.items.count(), // get total number of items
    ]);

    if (!items || items.length === 0) {
      return res.status(404).json({ error: 'No items exist' });
    }

    const totalPages = Math.ceil(totalItems / perPage); // calculate the total number of pages

    // construct pagination links
    const links: PaginationLinks = {
      self: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
    };
    if (page < totalPages) {
      links.next = `${req.protocol}://${req.get('host')}${req.path}?page=${
        page + 1
      }`;
    }
    if (page > 1) {
      links.prev = `${req.protocol}://${req.get('host')}${req.path}?page=${
        page - 1
      }`;
    }

    // return paginated response
    return res.status(200).json({
      items,
      links,
      page,
      perPage,
      totalItems,
      totalPages,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

export const getItems = [requireAuthentication, getItemsHandler];

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
  requireAuthentication,
  itemIdDoesExistValidator,
  validationCheck,
  getItemHandler,
];

async function createItemHandler(req: Request, res: Response) {
  const { name, categoryId } = req.body;

  const cId = Number.parseInt(categoryId, 10);

  const imageURL = await getImageUrl(name);

  const item = await prisma.items.create({
    data: {
      name,
      categoryId: cId,
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
  stringValidator({
    field: 'categoryId',
  }),
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
  itemNameDoesNotExistValidator.optional(),
  categoryIdDoesExistValidator.optional(),
  xssSanitizerMany(itemFields),
  validationCheck,
  genericSanitizerMany(itemFields),
  patchItemHandler,
].flat();
