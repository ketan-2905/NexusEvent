
import axios from "axios";

// Create a separate instance for staff-related calls if needed, 
// OR simpler: just re-use Axios but manage tokens differently if required.
// But based on User request: "you could create a staff JS in the utils so it will help us to call the staff route and it has its own like sending the bearer token"
// This implies they might want to store the staff token separately? 
// Current ScannerLogin stores it in "token".
// Use "staffToken" to avoid conflict?
// Let's create a dedicated client that reads from "staffToken" or just reuses "token" if the app is dedicated (separate route /scan).
// Since /scan is part of the SAME app, if an Admin logs in, "token" is overwritten.
// So Staff should use "staffToken" to be safe.

const staffApi = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
});

staffApi.interceptors.request.use((config) => {
    // Try 'staffToken' first, else fallback (or just use staffToken)
    const token = localStorage.getItem("staffToken");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    } else {
        // Warn but don't block (maybe login request)
    }
    return config;
});

export default staffApi;
