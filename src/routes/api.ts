import express, { Request, Response } from 'express';
import {
  createCategory,
  deleteCategory,
  getCategories,
  getCategory,
} from './categories.js';
import {
  createCourse,
  deleteCourse,
  getCourse,
  listCourses,
  updateCourse,
} from './courses.js';
import {
  createDepartment,
  deleteDepartment,
  getDepartment,
  listDepartments,
  updateDepartment,
} from './departments.js';
import { createItem, deleteItem, getItem, getItems } from './items.js';
import {
  createQuestion,
  deleteQuestion,
  getQuestion,
  getQuestions,
} from './questions.js';
import {
  deleteUser,
  getAdminDetails,
  getUser,
  getUsers,
  login,
  signup,
} from './users.js';

export const router = express.Router();

export async function index(req: Request, res: Response) {
  // TODO: Fylla út eventually

  return res.json([
    {
      href: '/login',
      methods: ['POST'],
    },
    {
      href: '/signup',
      methods: ['POST'],
    },
    {
      href: '/admin',
      methods: ['GET'],
    },
  ]);
}

router.get('/', index);

// Users
router.get('/users', getUsers);
router.get('/users/:userId', getUser);
router.post('/login', login);
router.post('/signup', signup);
router.get('/admin', getAdminDetails); // Hvað á getAdminDetails að gera?
router.delete('/users/:userId', deleteUser);

// Items
router.get('/items', getItems);
router.get('/items/:itemId', getItem);
router.post('/items', createItem);
router.delete('/items/:itemId', deleteItem);

// Questions
router.get('/questions', getQuestions);
router.get('/questions/:questionId', getQuestion);
router.post('/questions', createQuestion);
router.delete('/questions/:questionId', deleteQuestion);

// Categories
router.get('/categories', getCategories);
router.get('/categories/:categoryId', getCategory);
router.post('/categories', createCategory);
router.delete('/categories/:categoryId', deleteCategory);

// Departments
router.get('/departments', listDepartments);
router.post('/departments', createDepartment);
router.get('/departments/:slug', getDepartment);
router.patch('/departments/:slug', updateDepartment);
router.delete('/departments/:slug', deleteDepartment);

// Courses
router.get('/departments/:slug/courses', listCourses);
router.post('/departments/:slug/courses', createCourse);
router.get('/departments/:slug/courses/:courseId', getCourse);
router.patch('/departments/:slug/courses/:courseId', updateCourse);
router.delete('/departments/:slug/courses/:courseId', deleteCourse);
