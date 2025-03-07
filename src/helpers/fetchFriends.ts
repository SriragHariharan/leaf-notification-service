import axios from 'axios';
import { signAccessToken } from './jwt.helper'; 
import createHttpError from 'http-errors';
import logger from './logger';

/* Fetch friend IDs for a given ownerID */
async function fetchFriendID(ownerID: string): Promise<any> {
    logger.debug(`Entering fetchFriendID method. Param: ${ownerID}`, { method: "fetchFriendID", layer: "fetch_friends helper" });
    try {
        logger.info(`Fetching friend IDs for ownerID: ${ownerID}`, { layer: "fetch_friends helper" });

        const accessToken = signAccessToken(ownerID);
        const response = await axios.get(process.env.FRIEND_ID_FETCH_URL!, {
            headers: {
                Authorization: `Bearer ${accessToken}`, // Set the Bearer token in the header
            },
        });

        logger.info(`Successfully fetched friend IDs for ownerID: ${ownerID}`, { layer: "fetch_friends helper" });
        return [...response?.data?.data?.friendIDs];
    } catch (error) {
        if (createHttpError.isHttpError(error)) {
            logger.error(`HttpError in fetchFriendID. Param: ${ownerID}`, { error, layer: "fetch_friends helper" });
        } else {
            logger.error(`Unexpected error in fetchFriendID. Param: ${ownerID}`, { error, layer: "fetch_friends helper" });
        }
        console.error('Error fetching friend ID:', error);
        throw error; // Rethrow the error for further handling
    } finally {
        logger.debug(`Exiting fetchFriendID method. Param: ${ownerID}`, { method: "fetchFriendID", layer: "fetch_friends helper" });
    }
}

export default fetchFriendID;