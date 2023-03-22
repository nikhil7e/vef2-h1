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
      console.log(postPromise)
      const itemId = postPromise.result.id;
      const deletePromise = await deleteAndParse(`/items/${itemId}`, {
      } ,adminToken);
      expect(deletePromise.status).toBe(204);
    });
  });
  
  
  
  

    // test('GET /users returns 200', async () => {
    //   const response = await fetchAndParse('/users/', token);
    //   console.log(response.result)
    //   expect(response.result).toBe("admin");
    // });

    // test('POST /departments returns 200', async () => {
    //   const title = 'testDepartment';
    //   const description = 'testDepartment description';

    //   const response = await postAndParse('/departments/', {
    //     title,
    //     description,
    //   }, token);

    //   expect(response.status).toBe(200);
    //   expect(response.result.title).toBe(title);
    // });

    // test('GET /departments/:slug with newly created department', async () => {
    //   const title = 'testDepartment2';
    //   const description = 'testDepartment2 description';

    //   const { result } = await postAndParse('/departments/', {
    //     title,
    //     description,
    //   }, token);

    //   const response = await fetchAndParse(`/departments/${result.slug}/`, token);

    //   expect(response.status).toBe(200);
    //   expect(response.result.title).toBe(title);
    // });

    // test('POST /departments/:slug/courses/', async () => {
    //   const data = {
    //     number: 'teteg',
    //     name: 'teteeg',
    //     units: 3,
    //     semester: 'Haust',
    //     level: 'Grunn',
    //     url: 'et',
    //   };

    //   const response = await postAndParse(
    //     `/departments/hagfradideild/courses/`,
    //     data,
    //     token
    //   );

    //   expect(response.status).toBe(200);

    //   expect(response.result.number).toBe(data.number);
    //   expect(response.result.name).toBe(data.name);
    //   expect(response.result.units).toBe(data.units);
    //   expect(response.result.semester).toBe(data.semester);
    //   expect(response.result.level).toBe(data.level);
    //   expect(response.result.url).toBe(data.url);
    // });

    // test('DELETE /departments/:slug/courses/:courseSlug', async () => {
    //   const data = {
    //     number: 'tet',
    //     name: 'tete',
    //     units: 3,
    //     semester: 'Haust',
    //     level: 'Grunn',
    //     url: 'et',
    //   };

    //   const { result } = await postAndParse(
    //     '/departments/hagfradideild/courses/',
    //     data, 
    //     token
    //   );

    //   expect(result.number).toBe(data.number);

    //   const response = await deleteAndParse(
    //     `/departments/hagfradideild/courses/${result.slug}`,
    //     null,
    //     token
    //   );

    //   expect(response.status).toBe(204);
    //   expect(response.result).toEqual(undefined);
    // });
});
