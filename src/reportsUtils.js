import { getIdToken, baseAPI } from './utils.js';

/**
 * Retrieve physical activity report for a participant
 * @param {object} participant - The participant object
 * @returns {Promise<object|null>} The physical activity report or null
 */
export const retrievePhysicalActivityReport = async (participant) => {
    if (!participant || !participant.state || !participant.state.uid || !participant.Connect_ID) {
        return null;
    }

    try {
        const idToken = await getIdToken();
        const response = await fetch(`${baseAPI}/dashboard?api=retrievePhysicalActivityReport&uid=${participant.state.uid}`, {
            method: "GET",
            headers:{
                Authorization: "Bearer " + idToken,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            const error = (response.status + ": " + (await response.json()).message);
            throw new Error(error);
        }

        let data = await response.json();
        if (data.code === 200) {
            return data.data ? data.data[0] : null;
        }
    } catch (error) {
        console.error('Error in retrievePhysicalActivityReport:', error);
        throw error;
    }

    return null;
};
