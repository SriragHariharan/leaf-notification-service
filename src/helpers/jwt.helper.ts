import createHttpError from 'http-errors';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import logger from './logger';

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
    logger.debug(`Entering validateAccessToken method.`, { method: "validateAccessToken", layer: "middleware" });
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            logger.error(`Unauthorized request: Authorization header is missing.`, { layer: "middleware" });
            return next(createHttpError.Unauthorized("Unauthorized request, authorization header is required."));
        }

        const bearerToken = authHeader.split(' ');
        const token = bearerToken[1];
        if (!token) {
            logger.error(`Unauthorized request: Token is missing.`, { layer: "middleware" });
            return next(createHttpError.Unauthorized("Unauthorized request, token is required."));
        }

        const resp = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!);
        req.user = resp;

        logger.info(`Access token validated successfully for user: ${resp?.aud}`, { layer: "middleware" });
        next();
    } catch (error) {
        logger.error(`Error validating access token: ${error}`, { error, layer: "middleware" });
        console.log("axt validation error ::: ", error);
        return next(createHttpError.Unauthorized("Unauthorized request: " + error));
    } finally {
        logger.debug(`Exiting validateAccessToken method.`, { method: "validateAccessToken", layer: "middleware" });
    }
}

/* Verify token for inserting to the database */
export const verifyToken = (token: string) => {
    logger.debug(`Entering verifyToken method.`, { method: "verifyToken", layer: "helper" });
    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!);

        logger.info(`Token verified successfully.`, { layer: "helper" });
        return decoded;
    } catch (error) {
        logger.error(`Invalid token: ${error}`, { error, layer: "helper" });
        console.error("Invalid token:", error);
        return null;
    } finally {
        logger.debug(`Exiting verifyToken method.`, { method: "verifyToken", layer: "helper" });
    }
};

/* Sign a new access token for a given userID */
export function signAccessToken(userID: string): string {
    logger.debug(`Entering signAccessToken method. Param: ${userID}`, { method: "signAccessToken", layer: "helper" });
    try {
        const payload = {};
        const secret = process.env.ACCESS_TOKEN_SECRET!;
        const options = {
            expiresIn: 300,
            issuer: 'leaf.com',
            audience: userID,
        };

        const token = jwt.sign(payload, secret, options);

        logger.info(`Access token signed successfully for userID: ${userID}`, { layer: "helper" });
        return token;
    } catch (error) {
        logger.error(`Error signing access token: ${error}`, { error, layer: "helper" });
        throw createHttpError(500, "An unexpected error occurred");
    } finally {
        logger.debug(`Exiting signAccessToken method. Param: ${userID}`, { method: "signAccessToken", layer: "helper" });
    }
}