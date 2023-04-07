import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import {
  atLeastOneBodyValueValidator,
  categoryIdParamDoesExistValidator,
  categoryNameDoesNotExistValidator,
  genericSanitizerMany,
  stringValidator,
  validationCheck,
  xssSanitizerMany,
} from '../lib/validation.js';
import { requireAdminAuthentication, requireAuthentication } from './users.js';

const prisma = new PrismaClient();

const categoryFields = ['name', 'description', 'questionText'];

// async function getCategoriesHandler(req: Request, res: Response) {
//   const categories = await prisma.category.findMany({
//     where: {},
//     include: {
//       items: true,
//       questions: true,
//     },
//   });J

//   if (!categories) {
//     return res.status(201).json({ error: 'No categories exist' });
//   }

//   return res.status(200).json(categories);
// }

interface PaginationLinks {
  self: string;
  next?: string;
  prev?: string;
}

async function getCategoriesHandler(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    const page = Number(req.query.page) || 1; // set default page to 1 if not provided
    const perPage = 10; // set number of items per page
    const skip = (page - 1) * perPage; // calculate the number of items to skip

    const [categories, totalCategories] = await Promise.all([
      prisma.category.findMany({
        take: perPage, // limit the number of items returned to perPage
        skip, // skip the first 'skip' number of items
        where: {},
        include: {
          items: true,
          questions: true,
        },
      }),
      prisma.category.count(), // get total number of categories
    ]);

    if (!categories || categories.length === 0) {
      return res.status(201).json({ error: 'No categories exist' });
    }

    const totalPages = Math.ceil(totalCategories / perPage); // calculate the total number of pages

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
      items: categories,
      links,
      page,
      perPage,
      totalCategories,
      totalPages,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

export const getCategories = [requireAuthentication, getCategoriesHandler];

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

export const getCategory = [
  requireAuthentication,
  categoryIdParamDoesExistValidator,
  validationCheck,
  getCategoryHandler,
];

async function createCategoryHandler(req: Request, res: Response) {
  const { name, description, questionText } = req.body;

  const categoryToCreate = await prisma.category.create({
    data: {
      name,
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
  stringValidator({ field: 'name', maxLength: 128 }),
  stringValidator({ field: 'description', maxLength: 128 }),
  stringValidator({ field: 'questionText', maxLength: 128 }),
  categoryNameDoesNotExistValidator,
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
  categoryIdParamDoesExistValidator,
  validationCheck,
  deleteCategoryHandler,
];

async function patchCategoryHandler(req: Request, res: Response) {
  const { name, description, questionText } = req.body;
  const { categoryId } = req.params;

  const id = Number.parseInt(categoryId, 10);

  const oldCategory = await prisma.category.findFirst({
    where: {
      id,
    },
  });

  const categoryToCreate = await prisma.category.update({
    where: {
      id,
    },
    data: {
      name: name || oldCategory?.name,
      description,
      questionText,
    },
  });

  if (!categoryToCreate) {
    return res.status(400).json({ error: 'Category could not be created' });
  }

  return res.status(200).json(categoryToCreate);
}

export const patchCategory = [
  requireAdminAuthentication,
  stringValidator({ field: 'name', maxLength: 128, optional: true }),
  stringValidator({
    field: 'description',
    maxLength: 128,
    optional: true,
    valueRequired: false,
  }),
  stringValidator({
    field: 'questionText',
    maxLength: 128,
    optional: true,
    valueRequired: false,
  }),
  atLeastOneBodyValueValidator(categoryFields),
  categoryIdParamDoesExistValidator,
  categoryNameDoesNotExistValidator.optional(),
  xssSanitizerMany(categoryFields),
  validationCheck,
  genericSanitizerMany(categoryFields),
  patchCategoryHandler,
].flat();
