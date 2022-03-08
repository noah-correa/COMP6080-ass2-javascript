import { BACKEND_PORT } from './config.js';
// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl } from './helpers.js';
import API from './api.js';


let userToken = undefined;
let userId = undefined;
// SCREEN: Login
// Handles user login
document.getElementById('login').addEventListener('submit', (event) => {
    event.preventDefault();
    const { email, password } = document.forms.login;
    const loginError = document.getElementById('login-container').childNodes[2];
    API.login(email.value, password.value).then(res => {
        if (res.ok) return res.json();
        else {
            if (res.status === 400) {
                // Input error
                // console.log('Input error');
                loginError.nodeValue = "Input error";
            }
        }
    }).then(res => {
        if (res) {
            // console.log(res);
            loginError.nodeValue = "";
            userToken = res.token;
            userId = res.userId;
            console.log("User logged in successfully");
            hideScreen('login-container');
            showScreen('dashboard-container');
            
        }
    });
});


document.getElementById('feed').addEventListener('click', (event) => {
    event.preventDefault();
    // console.log(userToken);
    if (!userToken) console.log("User not logged in");
    API.feed("userToken").then(res => {
        const feed = res;
    })
    // console.log(feed);
});



const hideScreen = (id) => {
    document.getElementById(id).classList.add('hidden');
}

const showScreen = (id) => {
    try {
        document.getElementById(id).classList.remove('hidden');
    } catch {
        console.log("Error: Cannot hide ")
    }
}