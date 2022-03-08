// API Interface Methods
import { BACKEND_PORT } from './config.js';

const baseURL = `http://localhost:${BACKEND_PORT}`;

const defaultGet = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
};

const defaultPost = {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
    },
};

const defaultPut = {
    method: "PUT",
    headers: {
        "Content-Type": "application/json",
    },
};

const defaultDelete = {
    method: "DELETE",
    headers: {
        "Content-Type": "application/json",
    },
};



// API Methods
const apiMethods = {
    login: (email, password) => {
        const data = {
            email: email,
            password: password
        };
        return fetch(`${baseURL}/auth/login`, {
            ...defaultPost,
            body: JSON.stringify(data)
        });
    },

    register: (email, password, name) => {
        const data = {
            email: email,
            password: password,
            name: name
        };
        return fetch(`${baseURL}/auth/register`, {
            ...defaultPost,
            body: JSON.stringify(data)
        });
    },

    feed: (token) => {
        return fetch(`${baseURL}/job/feed?start=0`, {
            ...defaultGet,
            headers: { 
                ...defaultGet.headers,
                "Authorization": token,
            },
        });
    },

    users: () => {
        return fetch(`${baseURL}/user`, {
            ...defaultGet,
        })
    }



}

export default apiMethods;