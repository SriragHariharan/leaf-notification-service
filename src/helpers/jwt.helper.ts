import createHttpError from 'http-errors';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
// Reopen the Request interface and add user object to it
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

/* Validate access token from the request header */
export function validateAccessToken(req: Request, _res: Response, next: NextFunction): void {
    try {

        const authHeader = req.headers['authorization'];

        if (!authHeader) {
            return next(createHttpError.Unauthorized("Unauthorized request, authorization header is required."));
        }

        const bearerToken = authHeader.split(' ');

        const token = bearerToken[1];

        if (!token) {
            return next(createHttpError.Unauthorized("Unauthorized request, token is required."));
        }

        const resp = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!);

        req.user = resp;
        next();
    }
 catch (error) {        console.log("axt validation error ::: ", error);

        return next(createHttpError.Unauthorized("Unauthorized request: " + error));
    }
}

/* Verify token for inserting to the database */
export const verifyToken = (token: string) => {
    try {

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!);
        return decoded;
    }
 catch (error) {        console.error("Invalid token:", error);

        return null;
    }
};

/* Sign a new access token for a given userID */
export function signAccessToken(userID: string): string {
    try {

        const payload = {};

        const secret = process.env.ACCESS_TOKEN_SECRET!;

        const options = {
            expiresIn: 300,
            issuer: 'leaf.com',
            audience: userID,
        };


        const token = jwt.sign(payload, secret, options);
        return token;
    }
 catch (error) {
        throw createHttpError(500, "An unexpected error occurred");
    }
}