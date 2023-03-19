import { PrismaClient, users } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { ExtractJwt } from 'passport-jwt';

dotenv.config();

const {
  PORT: port = 3000,
  JWT_SECRET: jwtSecret,
  TOKEN_LIFETIME: tokenLifetime = 86400,
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

export async function signup(req: Request, res: Response) {
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
  return res.json({ token });
}

function getAdminDetailsHandler(req: Request, res: Response) {
  res.json({ data: 'top secret' });
}

export const getAdminDetails = [
  requireAdminAuthentication,
  getAdminDetailsHandler,
];

async function getUsersHandler(req: Request, res: Response) {
  const user = await prisma.users.findMany({
    where: {},
    include: {
      firstOptionAnsweredQuestions: true,
      secondOptionAnsweredQuestions: true,
    },
  });

  if (!user) {
    return res.status(201).json({ error: 'No users exist' });
  }

  return res.status(200).json(user);
}

export const getUsers = [requireAdminAuthentication, getUsersHandler];

async function getUserHandler(req: Request, res: Response) {
  const { userId } = req.params;

  const user = await prisma.users.findUnique({
    where: { id: Number.parseInt(userId, 10) },
    include: {
      firstOptionAnsweredQuestions: true,
      secondOptionAnsweredQuestions: true,
    },
  });

  if (!user) {
    return res.status(201).json({ error: 'No users exist' });
  }

  return res.status(200).json(user);
}

export const getUser = [requireAdminAuthentication, getUserHandler];
