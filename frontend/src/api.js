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

    feed: (token) => {
        // console.log(`${baseURL}/job/feed`);
        return fetch(`${baseURL}/job/feed?start=0`, {
            ...defaultGet,
            headers: { 
                ...defaultGet.headers,
                "Authorization": token,
            },
        }).then(res => {
            return res.json();
        }).catch(err => {
            console.log(err);
            return { error: err };
        });
    },

    users: () => {
        console.log(`${baseURL}/user`);
        fetch(`${baseURL}/user`, {
            ...defaultGet,
        }).then(res => {
            console.log(res);
            return res.json();
        });
    }



}

export default apiMethods;