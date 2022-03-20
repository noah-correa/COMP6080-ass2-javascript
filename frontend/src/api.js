// API Interface Methods
import { BACKEND_PORT } from './config.js';

// Base URL for Backend API
const baseURL = `http://localhost:${BACKEND_PORT}`;

// Request Builder function
const buildRequest = (method, token=undefined, body={}) => {
    const req = {
        method: method,
        headers: { "Content-Type": "application/json" }
    }
    if (token) req.headers = { ...req.headers, "Authorization": token };
    if (method !== 'GET') req.body = JSON.stringify(body);
    return req;
}


// API Methods
const apiMethods = {
    login: (email, password) => {
        const data = {
            email,
            password
        };
        return fetch(`${baseURL}/auth/login`, 
            buildRequest('POST', undefined, data))
                .then(res => res.json());
    },

    register: (email, password, name) => {
        const data = {
            email,
            password,
            name
        };
        return fetch(`${baseURL}/auth/register`, 
            buildRequest('POST', undefined, data))
                .then(res => res.json());
    },

    getJobFeed: (token, page=0) => {
        return fetch(`${baseURL}/job/feed?start=${page}`, 
            buildRequest('GET', token))
                .then(res => res.json());
    },

    getUser: (token, userId) => {
        return fetch(`${baseURL}/user?userId=${userId}`, 
            buildRequest('GET', token))
                .then(res => res.json());
    },

    likeJob: (token, id, turnon) => {
        const data = {
            id,
            turnon
        };
        return fetch(`${baseURL}/job/like`, 
            buildRequest('PUT', token, data))
                .then(res => res.json());
    },

    updateProfile: (token, data) => {
        return fetch(`${baseURL}/user`, 
            buildRequest('PUT', token, data))
                .then(res => res.json());
    },

    watchUser: (token, email, turnon) => {
        const data = {
            email,
            turnon
        };
        return fetch(`${baseURL}/user/watch`, 
            buildRequest('PUT', token, data))
                .then(res => res.json());
    },

    addJob: (token, title, image, start, description) => {
        const data = {
            title,
            image,
            start,
            description
        };
        return fetch(`${baseURL}/job`, 
            buildRequest('POST', token, data))
                .then(res => res.json());
    },

    updateJob: (token, data) => {
        return fetch(`${baseURL}/job`,
            buildRequest('PUT', token, data))
                .then(res => res.json());
    },

    deleteJob: (token, id) => {
        const data = {
            id,
        };
        return fetch(`${baseURL}/job`,
            buildRequest('DELETE', token, data))
                .then(res => res.json());
    },

}

export default apiMethods;