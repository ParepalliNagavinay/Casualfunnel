import dotenv from 'dotenv';
import path from 'node:path';
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
const [{ default: app }, { connectDatabase }] = await Promise.all([import('./src/app.js'), import('./src/config/database.js')]);
const port = Number(process.env.PORT) || 5000;
try {
  await connectDatabase();
  const server = app.listen(port, () => console.log(`InsightFlow API listening on http://localhost:${port}`));
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(async () => { const mongoose = await import('mongoose'); await mongoose.default.disconnect(); process.exit(0); }));
} catch (error) {
  console.error(`Unable to connect to MongoDB: ${error.message}`);
  process.exit(1);
}
