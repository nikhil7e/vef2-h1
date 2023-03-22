import { describe, expect, test } from '@jest/globals';
import { deleteAndParse, fetchAndParse, loginAndGetToken, postAndParse } from './utils';

let adminToken:string;

describe('integration', () => {
  describe('/users', () => {
    test('POST /login returns token with admin privileges', async () => {
      adminToken = await loginAndGetToken('admin', '123');
      const users = await fetchAndParse('/users/', adminToken);
      expect(users.result.items[0].admin).toBe(true);
    });
    test('POST /login returns token with non-admin privileges', async () => {
      const token = await loginAndGetToken('Eddi', 'eddipass');
      const users = await fetchAndParse('/users/', token);
      expect(users.result.error).toBe('unauthorized admin access');
    });
  });
  describe('/items', () => {
    test('POST /items should put an object into the database if user has admin privileges',
     async () => {
      const promise = await postAndParse('/items/', {
        name: 'Orange',
        categoryId: 1
      } ,adminToken);
      // console.log(promise.result)
      expect(promise.result.name).toBe('Orange');
      expect(promise.result.categoryId).toBe(1);
      expect(promise.status).toBe(200);
    });
    test(' /DELETE items should reduce the number of items in our database', async () => {
      const postPromise = await postAndParse('/items/', {
        name: 'Apple',
        categoryId: 1
      } ,adminToken);
      const itemId = postPromise.result.id;
      const deletePromise = await deleteAndParse(`/items/${itemId}`, {
      } ,adminToken);
      expect(deletePromise.status).toBe(204);
    });
  });
});
