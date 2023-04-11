import { PrismaClient, users } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { ExtractJwt } from 'passport-jwt';
import {
  atLeastOneBodyValueValidator,
  genericSanitizerMany,
  stringValidator,
  userIdDoesExistValidator,
  userNameDoesNotExistValidator,
  validationCheck,
  xssSanitizerMany,
} from '../lib/validation.js';

dotenv.config();

const {
  // PORT: port = 3000,
  JWT_SECRET: jwtSecret,
  TOKEN_LIFETIME: tokenLifetime = '24h',
  DATABASE_URL: databaseUrl,
} = process.env;

if (!jwtSecret || !databaseUrl) {
  console.error('Vantar .env gildi');
  process.exit(1);
}

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: jwtSecret,
};

const prisma = new PrismaClient();

const userFields = ['username', 'password'];

export async function findById(id: number): Promise<users | null> {
  const user = await prisma.users.findUnique({
    where: {
      id,
    },
    include: {
      firstOptionAnsweredQuestions: true,
      secondOptionAnsweredQuestions: true,
    },
  });

  if (!user) {
    console.error('Gat ekki fundið notanda eftir id');
  }

  return user;
}

export function requireAuthentication(
  req: Request,
  res: Response,
  next: NextFunction
) {
  return passport.authenticate(
    'jwt',
    { session: false },
    (err: Error, user: users, info: any) => {
      if (err) {
        return next(err);
      }

      if (!user) {
        const error =
          info?.name === 'TokenExpiredError'
            ? 'expired token'
            : 'invalid token';

        return res.status(401).json({ error });
      }

      // Látum notanda vera aðgengilegan í rest af middlewares
      req.user = user;
      return next();
    }
  )(req, res, next);
}

export function requireAdminAuthentication(
  req: Request,
  res: Response,
  next: NextFunction
) {
  return passport.authenticate(
    'jwt',
    { session: false },
    (err: Error, user: users, info: any) => {
      if (err) {
        return next(err);
      }

      if (!user) {
        const error =
          info?.name === 'TokenExpiredError'
            ? 'expired token'
            : 'invalid token';

        return res.status(401).json({ error });
      }

      if (!user.admin) {
        const error = 'unauthorized admin access';

        return res.status(401).json({ error });
      }

      // Látum notanda vera aðgengilegan í rest af middlewares
      req.user = user;
      return next();
    }
  )(req, res, next);
}

export async function comparePasswords(
  password: string,
  hash: string
): Promise<boolean> {
  const result: boolean = await bcrypt.compare(password, hash);

  return result;
}

export async function login(req: Request, res: Response) {
  const { username, password = '' } = req.body;

  const user = await prisma.users.findUnique({
    where: {
      username,
    },
  });

  if (!user) {
    return res.status(401).json({ error: 'No such user' });
  }

  const passwordIsCorrect = await comparePasswords(password, user.password);

  if (passwordIsCorrect) {
    const payload = { id: user.id };
    const tokenOptions = { expiresIn: tokenLifetime };
    const token = jwt.sign(payload, jwtOptions.secretOrKey, tokenOptions);
    return res.json({ token });
  }

  return res.status(401).json({ error: 'Invalid password' });
}

async function signupHandler(req: Request, res: Response) {
  const { username, password = '' } = req.body;

  const hashedPassword = await bcrypt.hash(password, 11);

  const user = await prisma.users.create({
    data: {
      username,
      password: hashedPassword,
    },
  });

  if (!user) {
    return res.status(400).json({ error: 'Could not create user' });
  }

  const payload = { id: user.id };
  const tokenOptions = { expiresIn: tokenLifetime };
  const token = jwt.sign(payload, jwtOptions.secretOrKey, tokenOptions);
  return res.status(201).json({ token });
}

export const signup = [
  stringValidator({
    field: 'username',
  }),
  stringValidator({
    field: 'password',
  }),
  userNameDoesNotExistValidator,
  validationCheck,
  signupHandler,
];

function getAdminDetailsHandler(req: Request, res: Response) {
  res.json({ data: 'top secret' });
}

export const getAdminDetails = [
  requireAdminAuthentication,
  getAdminDetailsHandler,
];

interface PaginationLinks {
  self: string;
  next?: string;
  prev?: string;
}

async function getUsersHandler(req: Request, res: Response): Promise<Response> {
  try {
    const page = Number(req.query.page) || 1; // set default page to 1 if not provided
    const perPage = 10; // set number of items per page
    const skip = (page - 1) * perPage; // calculate the number of items to skip

    const [usersResult, totalUsers] = await Promise.all([
      prisma.users.findMany({
        take: perPage, // limit the number of items returned to perPage
        skip, // skip the first 'skip' number of items
        where: {},
        select: {
          id: true,
          admin: true,
          username: true,
          password: false,
          score: true,
          firstOptionAnsweredQuestions: true,
          secondOptionAnsweredQuestions: true,
          firstOptionAnsweredQuestionsIds: true,
          secondOptionAnsweredQuestionsIds: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.users.count(), // get total number of users
    ]);

    if (!usersResult || usersResult.length === 0) {
      return res.status(404).json({ error: 'No users exist' });
    }

    const totalPages = Math.ceil(totalUsers / perPage); // calculate the total number of pages

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
      items: usersResult,
      links,
      page,
      perPage,
      totalUsers,
      totalPages,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

export const getUsers = [requireAdminAuthentication, getUsersHandler];

async function getUserHandler(req: Request, res: Response) {
  const { userId } = req.params;

  const user = await prisma.users.findFirst({
    where: { id: Number.parseInt(userId, 10) },
    select: {
      id: true,
      admin: true,
      username: true,
      password: false,
      score: true,
      firstOptionAnsweredQuestions: {
        include: { firstItem: true, secondItem: true },
      },
      secondOptionAnsweredQuestions: {
        include: { firstItem: true, secondItem: true },
      },
      firstOptionAnsweredQuestionsIds: true,
      secondOptionAnsweredQuestionsIds: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    return res
      .status(404)
      .json({ error: `User with id ${userId} does not exist` });
  }

  return res.status(200).json(user);
}

export const getUser = [
  requireAuthentication,
  userIdDoesExistValidator,
  validationCheck,
  getUserHandler,
];

async function deleteUserHandler(req: Request, res: Response) {
  const { userId } = req.params;

  const user = await prisma.users.delete({
    where: { id: Number.parseInt(userId, 10) },
  });

  if (!user) {
    return res
      .status(404)
      .json({ error: `User with id ${userId} does not exist` });
  }

  return res.status(204).json();
}

export const deleteUser = [
  requireAdminAuthentication,
  userIdDoesExistValidator,
  validationCheck,
  deleteUserHandler,
];

async function patchUserHandler(req: Request, res: Response) {
  const { username, password } = req.body;
  const { userId } = req.params;

  const id = Number.parseInt(userId, 10);

  const oldUser = await prisma.users.findFirst({
    where: {
      id,
    },
  });

  const userToCreate = await prisma.users.update({
    where: {
      id,
    },
    data: {
      username: username || oldUser?.username,
      password: password ? await bcrypt.hash(password, 11) : oldUser?.password,
    },
  });

  if (!userToCreate) {
    return res.status(400).json({ error: 'User could not be updated' });
  }

  const { password: passwordHash, ...user } = userToCreate;

  return res.status(200).json(user);
}

export const patchUser = [
  requireAdminAuthentication,
  stringValidator({
    field: 'username',
    valueRequired: false,
    maxLength: 128,
    optional: true,
  }),
  stringValidator({
    field: 'password',
    maxLength: 128,
    optional: true,
  }),
  atLeastOneBodyValueValidator(userFields),
  userNameDoesNotExistValidator.optional(),
  xssSanitizerMany(userFields),
  validationCheck,
  genericSanitizerMany(userFields),
  patchUserHandler,
].flat();
