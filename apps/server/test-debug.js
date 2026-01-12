import { test } from 'vitest';
import request from 'supertest';
import { app } from './src/index.js';

test('debug corrupt STL', async () => {
  const fakeStl = Buffer.alloc(100);
  fakeStl.write('not solid', 0);
  fakeStl.writeUInt32LE(1000000, 80);

  const response = await request(app)
    .post('/api/analyze')
    .attach('file', fakeStl, 'corrupt.stl');

  console.log('Status:', response.status);
  console.log('Body:', JSON.stringify(response.body, null, 2));
});
