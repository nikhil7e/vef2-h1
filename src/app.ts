import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import passport from 'passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { cors } from './lib/cors.js';
import { router } from './routes/api.js';

import { findById } from './routes/users.js';

dotenv.config();

const {
  PORT: port = 3000,
  JWT_SECRET: jwtSecret,
  TOKEN_LIFETIME: tokenLifetime = '24h',
  DATABASE_URL: databaseUrl,
} = process.env;

if (!jwtSecret || !databaseUrl) {
  console.error('Vantar .env gildi');
  process.exit(1);
}

const app = express();

app.use(express.json());

app.use(cors);
app.use(router);

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: jwtSecret,
  tokenLifetime,
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

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'not found' });
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, req: Request, res: Response) => {
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
