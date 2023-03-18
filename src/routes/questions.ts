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
