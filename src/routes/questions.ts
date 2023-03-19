import { PrismaClient, users } from '@prisma/client';
import { Request, Response } from 'express';
import {
  categoryIdDoesExistValidator,
  genericSanitizerMany,
  itemIdDoesExistValidator,
  questionIdDoesExistValidator,
  stringValidator,
  userHasNotVotedForQuestionValidator,
  validationCheck,
  xssSanitizerMany,
} from '../lib/validation.js';
import { requireAdminAuthentication, requireAuthentication } from './users.js';

const prisma = new PrismaClient();

const questionFields = ['categoryId'];

async function getQuestionsHandler(req: Request, res: Response) {
  const questions = await prisma.questions.findMany({
    where: {},
    include: {
      category: true,
      firstItem: true,
      secondItem: true,
      firstOptionAnsweredUsers: true,
      secondOptionAnsweredUsers: true,
    },
  });

  if (!questions) {
    return res.status(201).json({ error: 'No questions exist' });
  }

  return res.status(200).json(questions);
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
  stringValidator({ field: 'categoryId', maxLength: 128 }),
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
