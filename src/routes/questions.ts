import { PrismaClient, users } from '@prisma/client';
import { Request, Response } from 'express';
import { body } from 'express-validator';
import {
  atLeastOneBodyValueValidator,
  categoryIdDoesExistValidator,
  genericSanitizerMany,
  itemIdDoesExistValidator,
  questionIdDoesExistValidator,
  userHasNotVotedForQuestionValidator,
  validationCheck,
  xssSanitizerMany,
} from '../lib/validation.js';
import { requireAdminAuthentication, requireAuthentication } from './users.js';

const prisma = new PrismaClient();

const questionFields = ['categoryId'];

interface PaginationLinks {
  self: string;
  next?: string;
  prev?: string;
}

async function getQuestionsHandler(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    const page = Number(req.query.page) || 1; // set default page to 1 if not provided
    const perPage = 10; // set number of items per page
    const skip = (page - 1) * perPage; // calculate the number of items to skip

    const [questions, totalQuestions] = await Promise.all([
      prisma.questions.findMany({
        take: perPage, // limit the number of items returned to perPage
        skip, // skip the first 'skip' number of items
        where: {},
        include: {
          category: true,
          firstItem: true,
          secondItem: true,
          firstOptionAnsweredUsers: true,
          secondOptionAnsweredUsers: true,
        },
      }),
      prisma.questions.count(), // get total number of questions
    ]);

    if (!questions || questions.length === 0) {
      return res.status(201).json({ error: 'No questions exist' });
    }

    const totalPages = Math.ceil(totalQuestions / perPage); // calculate the total number of pages

    // construct pagination links
    const links: PaginationLinks = {
      self: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
    };
    if (page < totalPages) {
      links.next = `${req.protocol}://${req.get('host')}${req.baseUrl}?page=${
        page + 1
      }`;
    }
    if (page > 1) {
      links.prev = `${req.protocol}://${req.get('host')}${req.baseUrl}?page=${
        page - 1
      }`;
    }

    // return paginated response
    return res.status(200).json({
      items: questions,
      links,
      page,
      perPage,
      totalQuestions,
      totalPages,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
export const getQuestions = [requireAdminAuthentication, getQuestionsHandler];

async function getQuestionHandler(req: Request, res: Response) {
  const { questionId } = req.params;

  const id = Number.parseInt(questionId, 10);

  const question = await prisma.questions.findUnique({
    where: { id },
    include: {
      category: true,
      firstItem: true,
      secondItem: true,
      firstOptionAnsweredUsers: true,
      secondOptionAnsweredUsers: true,
    },
  });

  if (!question) {
    return res
      .status(404)
      .json({ error: 'Question with questionId does not exist' });
  }

  return res.status(200).json(question);
}

export const getQuestion = [
  requireAdminAuthentication,
  questionIdDoesExistValidator,
  validationCheck,
  getQuestionHandler,
];

async function createQuestionHandler(req: Request, res: Response) {
  let { categoryId } = req.body;

  categoryId = Number.parseInt(categoryId, 10);

  const itemsCount = await prisma.items.count({ where: { categoryId } });

  if (itemsCount < 2) {
    return res
      .status(400)
      .json({ error: 'Question could not be created, not enough items exist' });
  }

  let skip = Math.floor(Math.random() * itemsCount);

  const firstItem = await prisma.items.findMany({
    where: { categoryId },
    take: 1,
    skip,
  });

  let secondItem;

  do {
    skip = Math.floor(Math.random() * itemsCount);
    // eslint-disable-next-line no-await-in-loop
    secondItem = await prisma.items.findMany({
      where: { categoryId },
      take: 1,
      skip,
    });
  } while (firstItem[0].name === secondItem[0].name);

  const question = await prisma.questions.create({
    data: {
      firstItemId: firstItem[0].id,
      secondItemId: secondItem[0].id,
      categoryId,
    },
  });

  if (!question) {
    return res.status(400).json({ error: 'Question could not be created' });
  }

  return res.status(200).json(question);
}

export const createQuestion = [
  requireAdminAuthentication,
  body('categoryId')
    .isInt({ min: 1 })
    .withMessage('categoryId must be integer > 0'),
  // stringValidator({ field: 'categoryId', maxLength: 128 }),
  // itemNameDoesNotExistValidator,
  categoryIdDoesExistValidator,
  xssSanitizerMany(questionFields),
  validationCheck,
  genericSanitizerMany(questionFields),
  createQuestionHandler,
].flat();

async function deleteQuestionHandler(req: Request, res: Response) {
  const { questionId } = req.params;

  const id = Number.parseInt(questionId, 10);

  const question = await prisma.questions.delete({
    where: { id },
  });

  if (!question) {
    return res
      .status(404)
      .json({ error: 'Question with questionId does not exist' });
  }

  return res.status(204).json();
}

export const deleteQuestion = [
  requireAdminAuthentication,
  questionIdDoesExistValidator,
  validationCheck,
  deleteQuestionHandler,
];

async function voteItemHandler(req: Request, res: Response) {
  const { questionId, itemId } = req.params;

  const qId = Number.parseInt(questionId, 10);
  const iId = Number.parseInt(itemId, 10);

  const question = await prisma.questions.findFirst({
    where: { id: qId },
  });

  const user = req.user as users;

  let questionUpdated;

  if (question?.firstItemId === iId) {
    questionUpdated = await prisma.questions.update({
      where: { id: qId },
      data: {
        firstOptionAnsweredUserIds: {
          push: user.id,
        },
        firstOptionAnsweredUsers: {
          connect: {
            id: user.id,
          },
        },
      },
      include: {
        firstOptionAnsweredUsers: true,
      },
    });
  } else if (question?.secondItemId === iId) {
    questionUpdated = await prisma.questions.update({
      where: { id: qId },
      data: {
        secondOptionAnsweredUserIds: {
          push: user.id,
        },
        secondOptionAnsweredUsers: {
          connect: {
            id: user.id,
          },
        },
      },
      include: {
        secondOptionAnsweredUsers: true,
      },
    });
  }

  if (!questionUpdated) {
    return res
      .status(404)
      .json({ error: 'could not update question (vote failed)' });
  }

  return res.status(200).json(questionUpdated);
}

export const voteItem = [
  requireAuthentication,
  questionIdDoesExistValidator,
  itemIdDoesExistValidator,
  userHasNotVotedForQuestionValidator,
  validationCheck,
  voteItemHandler,
];

async function patchQuestionHandler(req: Request, res: Response) {
  let { categoryId } = req.body;
  const { questionId } = req.params;

  categoryId = Number.parseInt(categoryId, 10);

  const qId = Number.parseInt(questionId, 10);

  // const oldQuestion = await prisma.questions.findFirst({
  //   where: {
  //     id: qId,
  //   },
  // });

  await prisma.questions.delete({
    where: {
      id: qId,
    },
  });
  const itemsCount = await prisma.items.count({ where: { categoryId } });

  if (itemsCount < 2) {
    return res
      .status(400)
      .json({ error: 'Question could not be created, not enough items exist' });
  }

  let skip = Math.floor(Math.random() * itemsCount);

  const firstItem = await prisma.items.findMany({
    where: { categoryId },
    take: 1,
    skip,
  });

  let secondItem;

  do {
    skip = Math.floor(Math.random() * itemsCount);
    // eslint-disable-next-line no-await-in-loop
    secondItem = await prisma.items.findMany({
      where: { categoryId },
      take: 1,
      skip,
    });
  } while (firstItem[0].name === secondItem[0].name);

  const question = await prisma.questions.create({
    data: {
      id: qId,
      firstItemId: firstItem[0].id,
      secondItemId: secondItem[0].id,
      categoryId,
    },
    include: {
      category: true,
      firstItem: true,
      secondItem: true,
      firstOptionAnsweredUsers: false,
      secondOptionAnsweredUsers: false,
    },
  });

  if (!question) {
    return res.status(400).json({ error: 'Question could not be updated' });
  }

  return res.status(200).json(question);

  // const questionToUpdate = await createQuestionHandler(req, res);

  // if (!questionToUpdate) {
  //   return res.status(400).json({ error: 'Category could not be updated' });
  // }

  // return res.status(200).json(questionToUpdate);
}

export const patchQuestion = [
  requireAdminAuthentication,
  body('categoryId')
    .isInt({ min: 1 })
    .withMessage('categoryId must be integer > 0'),
  atLeastOneBodyValueValidator(questionFields),
  // itemIdDoesExistValidator,
  // itemNameDoesNotExistValidator({ optional: true }),
  categoryIdDoesExistValidator.optional(),
  xssSanitizerMany(questionFields),
  validationCheck,
  genericSanitizerMany(questionFields),
  patchQuestionHandler,
].flat();
