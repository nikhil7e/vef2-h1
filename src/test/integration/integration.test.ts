import { describe, expect, test } from '@jest/globals';
import { deleteAndParse, fetchAndParse, postAndParse } from './utils';

const token = null

describe('integration', () => {
  describe('/users', () => {
    test('GET /users returns 200', async () => {
      const response = await fetchAndParse('/users/', token);
      console.log(response.result)
      expect(response.result).toBe("admin");
    });

    test('POST /departments returns 200', async () => {
      const title = 'testDepartment';
      const description = 'testDepartment description';

      const response = await postAndParse('/departments/', {
        title,
        description,
      }, token);

      expect(response.status).toBe(200);
      expect(response.result.title).toBe(title);
    });

    test('GET /departments/:slug with newly created department', async () => {
      const title = 'testDepartment2';
      const description = 'testDepartment2 description';

      const { result } = await postAndParse('/departments/', {
        title,
        description,
      }, token);

      const response = await fetchAndParse(`/departments/${result.slug}/`, token);

      expect(response.status).toBe(200);
      expect(response.result.title).toBe(title);
    });

    test('POST /departments/:slug/courses/', async () => {
      const data = {
        number: 'teteg',
        name: 'teteeg',
        units: 3,
        semester: 'Haust',
        level: 'Grunn',
        url: 'et',
      };

      const response = await postAndParse(
        `/departments/hagfradideild/courses/`,
        data,
        token
      );

      expect(response.status).toBe(200);

      expect(response.result.number).toBe(data.number);
      expect(response.result.name).toBe(data.name);
      expect(response.result.units).toBe(data.units);
      expect(response.result.semester).toBe(data.semester);
      expect(response.result.level).toBe(data.level);
      expect(response.result.url).toBe(data.url);
    });

    test('DELETE /departments/:slug/courses/:courseSlug', async () => {
      const data = {
        number: 'tet',
        name: 'tete',
        units: 3,
        semester: 'Haust',
        level: 'Grunn',
        url: 'et',
      };

      const { result } = await postAndParse(
        '/departments/hagfradideild/courses/',
        data, 
        token
      );

      expect(result.number).toBe(data.number);

      const response = await deleteAndParse(
        `/departments/hagfradideild/courses/${result.slug}`,
        null,
        token
      );

      expect(response.status).toBe(204);
      expect(response.result).toEqual(undefined);
    });
  });
});
