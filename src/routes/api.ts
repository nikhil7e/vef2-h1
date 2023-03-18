import express, { Request, Response } from 'express';
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
import { getAdminDetails, getUser, getUsers, login, signup } from './users.js';

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

// TODO: Færa routes úr app.ts hingað
router.get('/', index);

// Users
router.get('/users', getUsers);
router.get('/users/:userId', getUser);
router.post('/login', login);
router.post('/signup', signup);
router.get('/admin', getAdminDetails);

// Items

// Questions

// Categories

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
