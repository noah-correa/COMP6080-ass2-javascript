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
        return fetch(`${baseURL}/auth/login`, buildRequest('POST', undefined, data));
    },

    register: (email, password, name) => {
        const data = {
            email: email,
            password: password,
            name: name
        };
        return fetch(`${baseURL}/auth/register`, buildRequest('POST', undefined, data));
    },

    getJobFeed: (token) => {
        return fetch(`${baseURL}/job/feed?start=0`, buildRequest('GET', token));
    },

    getUser: (token, userId) => {
        return fetch(`${baseURL}/user?userId=${userId}`, buildRequest('GET', token));
    },

    likeJob: (token, id, like) => {
        const data = {
            id: id,
            turnon: like
        };
        console.log(buildRequest('PUT', token, data));
        return fetch(`${baseURL}/job/like`, buildRequest('PUT', token, data));
    }

}

export default apiMethods;