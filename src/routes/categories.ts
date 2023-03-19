import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import {
  categoryIdDoesExistValidator,
  genericSanitizerMany,
  stringValidator,
  validationCheck,
  xssSanitizerMany,
} from '../lib/validation.js';
import { requireAdminAuthentication } from './users.js';

const prisma = new PrismaClient();

const categoryFields = ['description', 'questionText'];

async function getCategoriesHandler(req: Request, res: Response) {
  const categories = await prisma.category.findMany({
    where: {},
    include: {
      items: true,
      questions: true,
    },
  });

  if (!categories) {
    return res.status(201).json({ error: 'No categories exist' });
  }

  return res.status(200).json(categories);
}

export const getCategories = [requireAdminAuthentication, getCategoriesHandler];

async function getCategoryHandler(req: Request, res: Response) {
  const { categoryId } = req.params;

  const id = Number.parseInt(categoryId, 10);

  const categoryToSearch = await prisma.category.findUnique({
    where: { id },
    include: {
      items: true,
      questions: true,
    },
  });

  if (!categoryToSearch) {
    return res.status(404).json({ error: 'Category with id does not exist' });
  }

  return res.status(200).json(categoryToSearch);
}

export const getCategory = [requireAdminAuthentication, getCategoryHandler];

async function createCategoryHandler(req: Request, res: Response) {
  const { description, questionText } = req.body;

  const categoryToCreate = await prisma.category.create({
    data: {
      description,
      questionText,
    },
  });

  if (!categoryToCreate) {
    return res.status(400).json({ error: 'Category could not be created' });
  }

  return res.status(200).json(categoryToCreate);
}

export const createCategory = [
  requireAdminAuthentication,
  stringValidator({ field: 'description', maxLength: 128 }),
  stringValidator({ field: 'questionText', maxLength: 128 }),
  // itemNameDoesNotExistValidator,
  // categoryIdDoesExistValidator,
  xssSanitizerMany(categoryFields),
  validationCheck,
  genericSanitizerMany(categoryFields),
  createCategoryHandler,
].flat();

async function deleteCategoryHandler(req: Request, res: Response) {
  const { categoryId } = req.params;

  const id = Number.parseInt(categoryId, 10);

  const categoryToSearch = await prisma.category.delete({
    where: { id },
  });

  if (!categoryToSearch) {
    return res.status(404).json({ error: 'Category with id does not exist' });
  }

  return res.status(204).json();
}

export const deleteCategory = [
  requireAdminAuthentication,
  categoryIdDoesExistValidator,
  deleteCategoryHandler,
];
