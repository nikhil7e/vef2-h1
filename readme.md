# Vefforritun 2, 2023, verkefni 3 sýnilausn

Sýnilausn á verkefni 3.

```bash
createdb vef2-2023-v3
npm install
npm run setup
npm run dev # eða "npm start"
```

Hægt að prófa request með því að importa `v3.postman.json` inn í Postman.

## TODO

- [ ] Test
- [ ] `DELETE` og eyða fyrst áföngum

# API Documentation

This API provides endpoints for managing users, items, questions, categories, departments, and courses.

## Users

### `GET /users`

Returns a list of all users.

### `GET /users/:userId`

Returns the user with the specified `userId`.

### `POST /login`

Authenticates the user and returns a JWT token.

### `POST /signup`

Creates a new user account.

### `GET /admin`

Returns details about the admin user.

### `DELETE /users/:userId`

Deletes the user with the specified `userId`.

## Items

### `GET /items`

Returns a list of all items.

### `GET /items/:itemId`

Returns the item with the specified `itemId`.

### `POST /items`

Creates a new item.

### `DELETE /items/:itemId`

Deletes the item with the specified `itemId`.

## Questions

### `GET /questions`

Returns a list of all questions.

### `GET /questions/:questionId`

Returns the question with the specified `questionId`.

### `POST /questions`

Creates a new question.

### `DELETE /questions/:questionId`

Deletes the question with the specified `questionId`.

## Categories

### `GET /categories`

Returns a list of all categories.

### `GET /categories/:categoryId`

Returns the category with the specified `categoryId`.

### `POST /categories`

Creates a new category.

### `DELETE /categories/:categoryId`

Deletes the category with the specified `categoryId`.
