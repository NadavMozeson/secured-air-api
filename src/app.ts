import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cookieParser from 'cookie-parser';
import indexRouter from './routes/index';
import airlinesRouter from './routes/airlines';
import airportsRouter from './routes/airports';
import flightRoutesRouter from './routes/flightRoutes';
const PORT = process.env.PORT || 3000;

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use('/', indexRouter);
app.use('/airlines', airlinesRouter);
app.use('/airports', airportsRouter);
app.use('/routes', flightRoutesRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
