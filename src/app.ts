import { users } from '@prisma/client';
import dotenv from 'dotenv';
import express, { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { cors } from './lib/cors.js';

import {
  comparePasswords,
  createUser,
  findById,
  findByUsername,
} from './lib/users.js';

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

const app = express();

app.use(express.json());

app.use(cors);
// app.use(router);

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: jwtSecret,
};

// async function strat(data: any, next: NextFunction) {
//   // fáum id gegnum data sem geymt er í token
//   const user = await findById(data.id);

//   if (user) {
//     // next(null, user);
//     next(null, user);
//   } else {
//     // next(null, false);
//     next(null, false);
//   }
// }

async function strat(
  data: any,
  done: (error: any, user?: any, info?: any) => void
) {
  try {
    const user = await findById(data.id);

    if (user) {
      done(null, user);
    } else {
      done(null, false);
    }
  } catch (error) {
    done(error);
  }
}

passport.use(new Strategy(jwtOptions, strat));

app.use(passport.initialize());

app.get('/', (req, res) => {
  res.json({
    login: '/login',
    admin: '/admin',
  });
});

app.post('/login', async (req, res) => {
  const { username, password = '' } = req.body;

  const user = await findByUsername(username);

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
});

app.post('/signup', async (req, res) => {
  const { username, password = '' } = req.body;

  const user = await createUser(username, password);

  if (!user) {
    return res.status(400).json({ error: 'Could not create user' });
  }

  const payload = { id: user.id };
  const tokenOptions = { expiresIn: tokenLifetime };
  const token = jwt.sign(payload, jwtOptions.secretOrKey, tokenOptions);
  return res.json({ token });
});

function requireAuthentication(
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

function requireAdminAuthentication(
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

app.get('/admin', requireAdminAuthentication, (req, res) => {
  res.json({ data: 'top secret' });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'not found' });
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (
    err instanceof SyntaxError &&
    'status' in err &&
    err.status === 400 &&
    'body' in err
  ) {
    return res.status(400).json({ error: 'invalid json' });
  }

  console.error('error handling route', err);
  return res
    .status(500)
    .json({ error: err.message ?? 'internal server error' });
});
