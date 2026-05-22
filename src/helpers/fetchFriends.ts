import axios from "axios";
import { signAccessToken } from "./jwt.helper";
import createHttpError from "http-errors";
/* Fetch friend IDs for a given ownerID */
async function fetchFriendID(ownerID: string): Promise<any> {
  try {
    const accessToken = signAccessToken(ownerID);

    const response = await axios.get(process.env.FRIEND_ID_FETCH_URL!, {
      headers: {
        Authorization: `Bearer ${accessToken}`, // Set the Bearer token in the header
      },
    });
    return [...response?.data?.data?.friendIDs];
  } catch (error) {
    console.error("Error fetching friend ID:", error);

    throw error; // Rethrow the error for further handling
  }
}

export default fetchFriendID;
