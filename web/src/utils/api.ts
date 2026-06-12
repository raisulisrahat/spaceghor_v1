import api, { BASE_URL } from '../services/api';

export const getMediaUrl = (url: string | null) => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('blob') || url.startsWith('data:')) {
        return url;
    }
    // Ensure relative paths start with a slash if not already present
    const path = url.startsWith('/') ? url : `/${url}`;
    return `${BASE_URL}${path}`;
};

export { BASE_URL };
export default api;
