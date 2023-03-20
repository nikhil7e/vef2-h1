import dotenv from 'dotenv';
import fetch, { RequestInit, Response } from 'node-fetch';

dotenv.config();

const { BASE_TEST_URL = 'http://localhost:3000' } = process.env;

export const baseUrl: string = BASE_TEST_URL;

type ResultAndStatus = { result: any; status: number };

async function methodAndParse(
  method: string,
  path: string,
  data: any = null
): Promise<ResultAndStatus> {
  const url = new URL(path, baseUrl);

  const options: RequestInit = {
    headers: {},
  };

  if (method !== 'GET') {
    options.method = method;
  }

  if (data) {
    options.headers = { 'Content-Type': 'application/json' };
    options.body = JSON.stringify(data);
  }

  const result: Response = await fetch(url, options);

  let json: any;

  try {
    json = await result.json();
  } catch (e) {
    if (method !== 'DELETE') {
      console.error('unable to parse json', e);
    }
  }

  return {
    result: json,
    status: result.status,
  };
}

export async function fetchAndParse(path: string): Promise<ResultAndStatus> {
  return methodAndParse('GET', path);
}

export async function postAndParse(
  path: string,
  data: any
): Promise<ResultAndStatus> {
  return methodAndParse('POST', path, data);
}

export async function patchAndParse(
  path: string,
  data: any
): Promise<ResultAndStatus> {
  return methodAndParse('PATCH', path, data);
}

export async function deleteAndParse(
  path: string,
  data: any
): Promise<ResultAndStatus> {
  return methodAndParse('DELETE', path, data);
}
