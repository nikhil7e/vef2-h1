import {
  category,
  items,
  PrismaClient,
  questions,
  users,
} from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import slugify from 'slugify';
import xss from 'xss';
import { ALLOWED_SEMESTERS } from '../types.js';

import {
  getCourseByCourseId,
  getCourseByTitle,
  getDepartmentBySlug,
} from './db.js';

const prisma = new PrismaClient();

/**
 * Checks to see if there are validation errors or returns next middlware if not.
 * @param {object} req HTTP request
 * @param {object} res HTTP response
 * @param {function} next Next middleware
 * @returns Next middleware or validation errors.
 */
export function validationCheck(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const validation = validationResult(req);
  if (!validation.isEmpty()) {
    const errors = validation.array();
    const notFoundError = errors.find((error) => error.msg === 'not found');
    const serverError = errors.find((error) => error.msg === 'server error');

    let status = 400;

    if (serverError) {
      status = 500;
    } else if (notFoundError) {
      status = 404;
    }

    return res.status(status).json({ errors });
  }

  return next();
}

export async function getItemByName(name: string): Promise<items | null> {
  const item = await prisma.items.findUnique({
    where: { name },
  });

  if (!item) {
    return null;
  }

  return item;
}

export async function getCategoryById(id: number): Promise<category | null> {
  let categoryToSearch;

  try {
    categoryToSearch = await prisma.category.findFirst({
      where: { id },
    });
  } catch {
    return null;
  }

  if (!categoryToSearch) {
    return null;
  }

  return categoryToSearch;
}

export async function getCategoryByName(
  name: string
): Promise<category | null> {
  let categoryToSearch;

  try {
    categoryToSearch = await prisma.category.findFirst({
      where: { name },
    });
  } catch {
    return null;
  }

  if (!categoryToSearch) {
    return null;
  }

  return categoryToSearch;
}

export async function getQuestionById(id: number): Promise<questions | null> {
  let questionToSearch;

  try {
    questionToSearch = await prisma.questions.findFirst({
      where: { id },
    });
  } catch {
    return null;
  }

  if (!questionToSearch) {
    return null;
  }

  return questionToSearch;
}

export async function getUserById(id: number): Promise<users | null> {
  let userToSearch;

  try {
    userToSearch = await prisma.users.findFirst({
      where: { id },
    });
  } catch {
    return null;
  }

  if (!userToSearch) {
    return null;
  }

  return userToSearch;
}

export async function getUserByName(username: string): Promise<users | null> {
  let userToSearch;
  console.log(`the username is ${username}`);
  try {
    userToSearch = await prisma.users.findFirst({
      where: { username },
    });
  } catch {
    return null;
  }

  if (!userToSearch) {
    return null;
  }

  return userToSearch;
}

export async function getItemById(id: number): Promise<items | null> {
  let itemToSearch;

  try {
    itemToSearch = await prisma.items.findFirst({
      where: { id },
    });
  } catch {
    return null;
  }

  if (!itemToSearch) {
    return null;
  }

  return itemToSearch;
}

export function atLeastOneBodyValueValidator(fields: Array<string>) {
  return body().custom(async (value, { req }) => {
    const { body: reqBody } = req;

    let valid = false;

    for (let i = 0; i < fields.length; i += 1) {
      const field = fields[i];

      if (field in reqBody && reqBody[field] != null) {
        valid = true;
        break;
      }
    }

    if (!valid) {
      return Promise.reject(
        new Error(`require at least one value of: ${fields.join(', ')}`)
      );
    }
    return Promise.resolve();
  });
}

export const xssSanitizer = (parameter: string) =>
  body(parameter).customSanitizer((v) => xss(v));

export const xssSanitizerMany = (params: string[]) =>
  params.map((parameter) => xssSanitizer(parameter));

export const genericSanitizer = (parameter: string) =>
  body(parameter).trim().escape();

export const genericSanitizerMany = (params: string[]) =>
  params.map((parameter) => genericSanitizer(parameter));

export const stringValidator = ({
  field = '',
  valueRequired = true,
  maxLength = 0,
  optional = false,
} = {}) => {
  const val = body(field)
    .trim()
    .isString()
    .isLength({
      min: valueRequired ? 1 : undefined,
      max: maxLength || undefined,
    })
    .withMessage(
      [
        field,
        valueRequired ? 'required' : '',
        maxLength ? `max ${maxLength} characters` : '',
      ]
        .filter((i) => Boolean(i))
        .join(' ')
    );

  if (optional) {
    return val.optional();
  }
  return val;
};

export const semesterValidator = ({ field = '', optional = false } = {}) => {
  const val = body(field)
    .isIn(ALLOWED_SEMESTERS)
    .withMessage(`${field} must be one of: ${ALLOWED_SEMESTERS.join(', ')}`);
  if (optional) {
    return val.optional();
  }
  return val;
};

export const departmentDoesNotExistValidator = body('title').custom(
  async (title) => {
    if (await getDepartmentBySlug(slugify(title))) {
      return Promise.reject(new Error('department with title already exists'));
    }
    return Promise.resolve();
  }
);

export const courseTitleDoesNotExistValidator = body('title').custom(
  async (title) => {
    if (await getCourseByTitle(title)) {
      return Promise.reject(new Error('course with title already exists'));
    }
    return Promise.resolve();
  }
);

// export const userNameDoesNotExistValidator = body('username').custom(
//   async (username) => {
//     if (await getUserByName(username)) {
//       return Promise.reject(
//         new Error('A user with this username already exists')
//       );
//     }
//     return Promise.resolve();
//   }
// );

export const userNameDoesNotExistValidator = ({ optional = false } = {}) => {
  const val = body('username').custom(async (username) => {
    if (await getUserByName(username)) {
      return Promise.reject(
        new Error('A user with this username already exists')
      );
    }
    return Promise.resolve();
  });

  if (optional) {
    return val.optional();
  }
  return val;
};

export const userNameDoesExistValidator = body('username').custom(
  async (username) => {
    if (await getUserByName(username)) {
      return Promise.resolve();
    }
    return Promise.reject(
      new Error('A user with this username already exists')
    );
  }
);

export const courseIdDoesNotExistValidator = body('courseId').custom(
  async (courseId) => {
    if (await getCourseByCourseId(courseId)) {
      return Promise.reject(new Error('course with courseId already exists'));
    }
    return Promise.resolve();
  }
);

export const itemNameDoesNotExistValidator = body('name').custom(
  async (name) => {
    if (await getItemByName(name)) {
      return Promise.reject(new Error('item with name already exists'));
    }
    return Promise.resolve();
  }
);

export const categoryIdDoesExistValidator = body('categoryId').custom(
  async (id) => {
    if (!(await getCategoryById(Number.parseInt(id, 10)))) {
      return Promise.reject(new Error('category with id does not exist'));
    }
    return Promise.resolve();
  }
);

// export const categoryNameDoesNotExistValidator = body('name').custom(
//   async (name) => {
//     if (!(await getCategoryByName(name))) {
//       return Promise.resolve();
//     }
//     return Promise.reject(new Error('category with name already exists'));
//   }
// );

export const categoryNameDoesNotExistValidator = ({
  optional = false,
} = {}) => {
  const val = body('name').custom(async (name) => {
    if (!(await getCategoryByName(name))) {
      return Promise.resolve();
    }
    return Promise.reject(new Error('category with name already exists'));
  });

  if (optional) {
    return val.optional();
  }
  return val;
};

export const categoryIdParamDoesExistValidator = param('categoryId').custom(
  async (id) => {
    if (!(await getCategoryById(Number.parseInt(id, 10)))) {
      return Promise.reject(new Error('category with id does not exist'));
    }
    return Promise.resolve();
  }
);

export const questionIdDoesExistValidator = param('questionId').custom(
  async (id) => {
    if (!(await getQuestionById(Number.parseInt(id, 10)))) {
      return Promise.reject(new Error('question with id does not exist'));
    }
    return Promise.resolve();
  }
);

export const itemIdDoesExistValidator = param('itemId').custom(async (id) => {
  if (!(await getItemById(Number.parseInt(id, 10)))) {
    return Promise.reject(new Error('item with id does not exist'));
  }
  return Promise.resolve();
});

export const userIdDoesExistValidator = param('userId').custom(async (id) => {
  if (!(await getUserById(Number.parseInt(id, 10)))) {
    return Promise.reject(new Error('user with id does not exist'));
  }
  return Promise.resolve();
});

export const userHasNotVotedForQuestionValidator = param().custom(
  async (values, { req }) => {
    console.log(values);
    const questionId = Number.parseInt(values.questionId, 10);
    const itemId = Number.parseInt(values.itemId, 10);
    console.log(questionId, itemId);

    const questionToSearch = await getQuestionById(questionId);
    if (!questionToSearch) {
      return Promise.reject(new Error('question with id does not exist'));
    }

    if (
      questionToSearch.firstItemId !== itemId &&
      questionToSearch.secondItemId !== itemId
    ) {
      return Promise.reject(
        new Error('item with id does not exist in this question')
      );
    }
    const { user } = req;
    if (
      questionToSearch.firstOptionAnsweredUserIds.includes(user.id) ||
      questionToSearch.secondOptionAnsweredUserIds.includes(user.id)
    ) {
      return Promise.reject(
        new Error('User has already voted for this question')
      );
    }

    return Promise.resolve();
  }
);
