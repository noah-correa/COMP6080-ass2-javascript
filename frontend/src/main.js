import { BACKEND_PORT } from './config.js';
// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl } from './helpers.js';
import API from './api.js';


//* User Object
const user = {
    isLoggedIn: false,
    userToken: undefined,
    userId: undefined,
}

//* Screen helper functions
const hideScreen = (id) => {
    document.getElementById(id).classList.add('hidden');
}

const showScreen = (id) => {
    try {
        document.getElementById(id).classList.remove('hidden');
    } catch {
        console.error("Error: Cannot hide screen")
    }
}

//* Error helper functions
const hideError = (id) => {
    document.getElementById(id).classList.add('hidden');
}

const showError = (id, message) => {
    try {
        document.getElementById(id).classList.remove('hidden');
        document.getElementById(id).childNodes[1].textContent = message;
        document.getElementById(`${id}-close`).addEventListener('click', (event) => {
            event.preventDefault();
            hideError(id);
        })
    } catch {
        console.error("Error: Cannot hide error")
    }
}


//* Navbar Functions
document.getElementById('nav-login').addEventListener('click', (event) => {
    event.preventDefault();
    if (!user.isLoggedIn) {
        hideScreen('register-screen');
        showScreen('login-screen');
        document.title = "LurkForWork - Login";
    }
});

document.getElementById('nav-register').addEventListener('click', (event) => {
    event.preventDefault();
    if (!user.isLoggedIn) {
        hideScreen('login-screen');
        showScreen('register-screen');
        document.title = "LurkForWork - Register";
    }
});




//* Login Screen
document.getElementById('login').addEventListener('submit', (event) => {
    event.preventDefault();
    const { email, password } = document.forms.login;
    const loginError = document.getElementById('login-screen').childNodes[2];
    API.login(email.value, password.value).then(res => {
        if (res.ok) return res.json();
        else {
            if (res.status === 400) {
                showError('login-error', 'Invalid input');
            }
        }
    }).then(res => {
        if (res) {
            hideError('login-error');
            user.userToken = res.token;
            user.userId = res.userId;
            user.isLoggedIn = true;
            console.log("User logged in successfully");
            hideScreen('login-screen');
            showScreen('dashboard-screen');
            document.title = "LurkForWork - Dashboard";
            
        }
    });
});


//* Register Screen
document.getElementById('register').addEventListener('submit', (event) => {
    event.preventDefault();
    const { email, name, password, confirmpassword } = document.forms.register;
    const registerError = document.getElementById('register-error').childNodes[1];
    
    if (password.value !== confirmpassword.value) {
        // Passwords do not match
        showError('register-error', 'Passwords do not match');
        return;
    }

    API.register(email.value, password.value, name.value).then(res => {
        if (res.ok) return res.json();
        else {
            if (res.status === 400) {
                showError('register-error', 'Invalid input');
            }
        }
    }).then(res => {
        if (res) {
            hideError('register-error');
            user.userToken = res.token;
            user.userId = res.userId;
            user.isLoggedIn = true;
            console.log("User registered successfully");
            hideScreen('register-screen');
            showScreen('dashboard-screen');
            document.title = "LurkForWork - Dashboard";
        }
    });
});





// Dashboard Screen
document.getElementById('feed').addEventListener('click', (event) => {
    event.preventDefault();
    if (user.isLoggedIn) {
        API.feed(user.userToken).then(res => {
            const feed = res;
            console.log(feed);
        })
    }
});


