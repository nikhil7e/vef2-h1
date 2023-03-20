import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { readFile } from 'fs/promises';
import { join } from 'path';

import { query } from '../lib/db.js';
import { parseJson } from './parse.js';

dotenv.config();

const prisma = new PrismaClient();

const SCHEMA_FILE = './sql/schema.sql';
const DROP_SCHEMA_FILE = './sql/drop.sql';
const DATA_DIR = './data';

export async function createSchema(schemaFile = SCHEMA_FILE) {
  const data = await readFile(schemaFile);

  return query(data.toString('utf-8'));
}

export async function dropSchema(dropFile = DROP_SCHEMA_FILE) {
  const data = await readFile(dropFile);

  return query(data.toString('utf-8'));
}

async function setup() {
  // const drop = await dropSchema();

  // if (drop) {
  //   console.info('schema dropped');
  // } else {
  //   console.info('schema not dropped, exiting');
  //   poolEnd();
  //   return process.exit(-1);
  // }

  // const result = await createSchema();

  // if (result) {
  //   console.info('schema created');
  // } else {
  //   console.info('schema not created, exiting');
  //   poolEnd();
  //   return process.exit(-1);
  // }

  const indexFile = await readFile(join(DATA_DIR, 'index.json'));
  const indexData = parseJson(indexFile.toString('utf-8'));

  const drinkcategory = await prisma.category.create({
    data: {
      name: 'Sugar free Energy Drinks',
      questionText: 'Which of these do you prefer?',
      description: 'Sugar-free energy drinks',
    },
  });

  const biocategory = await prisma.category.create({
    data: {
      name: 'Icelandic cinemas',
      questionText: 'Which of these do you prefer?',
      description: 'Icelandic cinemas :)',
    },
  });

  const swimmingpoolscategory = await prisma.category.create({
    data: {
      name: 'Icelandic swimming pools',
      questionText: 'Which of these do you prefer?',
      description: 'Icelandic swimming pools :)',
    },
  });

  const beercategory = await prisma.category.create({
    data: {
      name: 'Classic beers and lagers',
      questionText: 'Which of these do you prefer?',
      description: 'A fine collection of beverages :)',
    },
  });

  const gamingcategory = await prisma.category.create({
    data: {
      name: 'PC Videogames',
      questionText: 'Which of these do you prefer?',
      description:
        'Videogames are a great way to waste time, not spend but waste. :)',
    },
  });

  let hashedPassword = await bcrypt.hash('123', 11);

  const adminUser = await prisma.users.create({
    data: {
      username: 'admin',
      password: hashedPassword,
      admin: true,
    },
  });

  hashedPassword = await bcrypt.hash('eddipass', 11);

  let newUser = await prisma.users.create({
    data: {
      username: 'Eddi',
      password: hashedPassword,
      admin: false,
    },
  });

  hashedPassword = await bcrypt.hash('joebroe123', 11);

  newUser = await prisma.users.create({
    data: {
      username: 'joe_nash01',
      password: hashedPassword,
      admin: false,
    },
  });

  hashedPassword = await bcrypt.hash('loki11', 11);

  newUser = await prisma.users.create({
    data: {
      username: 'tommyboy98',
      password: hashedPassword,
      admin: false,
    },
  });

  hashedPassword = await bcrypt.hash('nyquist69', 11);

  newUser = await prisma.users.create({
    data: {
      username: 'sigma_nicc17',
      password: hashedPassword,
      admin: false,
    },
  });

  for (const item of indexData) {
    // eslint-disable-next-line no-await-in-loop
    const itemToInsert = await prisma.items.create({
      data: {
        name: item.name,
        categoryId: item.categoryId, // id eða nafn?
        imageURL: item.imageURL,
      },
    });

    if (!itemToInsert) {
      console.error('unable to insert item', item);
      continue;
    } else {
      console.log(itemToInsert);
    }
  }

  let newQuestion = await prisma.questions.create({
    data: {
      categoryId: 1,
    },
  });

  newQuestion = await prisma.questions.create({
    data: {
      categoryId: 2,
    },
  });

  newQuestion = await prisma.questions.create({
    data: {
      categoryId: 3,
    },
  });

  newQuestion = await prisma.questions.create({
    data: {
      categoryId: 3,
    },
  });

  newQuestion = await prisma.questions.create({
    data: {
      categoryId: 3,
    },
  });

  await prisma.$disconnect();
}

setup().catch((err) => {
  console.error('error running setup', err);
});
