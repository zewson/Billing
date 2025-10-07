import axios from 'axios';

const { MIKROTIK_URL, MIKROTIK_USER, MIKROTIK_PASS } = process.env;

interface ToggleResult { success: boolean; message: string; }

export async function togglePppUser(username: string, disable: boolean): Promise<ToggleResult> {
    if (!username) return { success: false, message: "Username is required" };
    const auth = { username: MIKROTIK_USER!, password: MIKROTIK_PASS! };
    try {
        const findResponse = await axios.post(`${MIKROTIK_URL}/rest/ppp/secret`, { "name": username }, { auth });
        if (!findResponse.data || findResponse.data.length === 0) {
            return { success: false, message: "User not found in PPP secrets" };
        }
        const secretId = findResponse.data[0]['.id'];
        await axios.patch(`${MIKROTIK_URL}/rest/ppp/secret/${secretId}`, { "disabled": disable ? "true" : "false" }, { auth });
        if (disable) {
            const activeSessionsResponse = await axios.post(`${MIKROTIK_URL}/rest/ppp/active`, { "name": username }, { auth });
            if (activeSessionsResponse.data && activeSessionsResponse.data.length > 0) {
                const sessionId = activeSessionsResponse.data[0]['.id'];
                await axios.delete(`${MIKROTIK_URL}/rest/ppp/active/${sessionId}`, { auth });
            }
        }
        return { success: true, message: `User ${username} ${disable ? 'disabled' : 'enabled'} successfully.` };
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || "MikroTik communication error." };
    }
}