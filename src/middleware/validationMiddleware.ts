import { NextFunction, Request, Response } from 'express';
import { z, ZodError } from 'zod';
import { StatusCodes } from 'http-status-codes';

type ValidationTypes = 'body' | 'params' | 'query' | 'headers' | 'cookies';

export function validateData(
  schema: z.ZodSchema,
  validationType: ValidationTypes = 'body'
) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req[validationType]);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((issue) => ({
          message: `${issue.path.join('.')} is ${issue.message}`,
        }));

        res
          .status(StatusCodes.BAD_REQUEST)
          .json({ error: 'Invalid data', details: errorMessages });
      } else {
        res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .json({ error: 'Internal Server Error' });
      }
    }
  };
}

