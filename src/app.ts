import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import indexRouter from './routes/index';
const PORT = process.env.PORT || 3000;

const app = express();

app.use('/', indexRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
