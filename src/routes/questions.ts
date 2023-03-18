import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { requireAdminAuthentication } from './users.js';

const prisma = new PrismaClient();

async function getQuestionsHandler(req: Request, res: Response) {
  const questions = await prisma.questions.findMany({
    where: {},
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
  });

  if (!question) {
    return res
      .status(404)
      .json({ error: 'Question with questionId does not exist' });
  }

  return res.status(200).json(question);
}

export const getQuestion = [requireAdminAuthentication, getQuestionHandler];
