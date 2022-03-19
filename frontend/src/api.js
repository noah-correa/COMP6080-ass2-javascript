// API Interface Methods
import { BACKEND_PORT } from './config.js';

const baseURL = `http://localhost:${BACKEND_PORT}`;


// Request Builder function
const buildRequest = (method, token=undefined, body={}) => {
    const req = {
        method: method,
        headers: {
            "Content-Type": "application/json"
        }
    }

    if (token) {
        req.headers = {
            ...req.headers,
            "Authorization": token
        }
    }

    if (method !== 'GET') {
        req.body = JSON.stringify(body);
    }

    return req;
}



// API Methods
const apiMethods = {
    login: (email, password) => {
        const data = {
            email: email,
            password: password
        };
        return fetch(`${baseURL}/auth/login`, buildRequest('POST', undefined, data)).then(res => {
            if (res.ok) return res.json();
            else {
                if (res.status === 400) return { error: 'Invalid input' };
            }
        });
    },

    register: (email, password, name) => {
        const data = {
            email: email,
            password: password,
            name: name
        };
        return fetch(`${baseURL}/auth/register`, buildRequest('POST', undefined, data)).then(res => {
            if (res.ok) return res.json();
            else {
                if (res.status === 400) return { error: 'Invalid input' };
            }
        });
    },

    getJobFeed: (token, page=0) => {
        return fetch(`${baseURL}/job/feed?start=${page}`, buildRequest('GET', token)).then(res => {
            if (res.ok) return res.json();
            else {
                if (res.status === 403) return { error: 'Invalid token' };
            }
        });
    },

    getUser: (token, userId) => {
        // console.log(res);
        return fetch(`${baseURL}/user?userId=${userId}`, buildRequest('GET', token)).then(res => {
            if (res.ok) return res.json();
            else {
                if (res.status === 403) return { error: 'Invalid token' };
            }
        });
    },

    likeJob: (token, id, like) => {
        const data = {
            id: id,
            turnon: like
        };
        return fetch(`${baseURL}/job/like`, buildRequest('PUT', token, data)).then(res => {
            if (res.ok) return res.json();
            else {
                if (res.status === 400) return { error: 'Invalid input' };
                else if (res.status === 403) return { error: 'Invalid token' };
            }
        });
    },

    updateProfile: (token, data) => {
        return fetch(`${baseURL}/user`, buildRequest('PUT', token, data)).then(res => {
            if (res.ok) return res.json();
            else {
                if (res.status === 400) return { error: "Invalid input" };
                else if (res.status === 403) return { error: "Invalid token" };
            }
        });
    },

    watchUser: (token, email, watch) => {
        const data = {
            email: email,
            turnon: watch
        };
        return fetch(`${baseURL}/user/watch`, buildRequest('PUT', token, data)).then(res => {
            if (res.ok) return res.json();
            else {
                if (res.status === 400) return { error: "Invalid input" };
                else if (res.status === 403) return { error: "Invalid token" };
            }
        });
    },

}

export default apiMethods;