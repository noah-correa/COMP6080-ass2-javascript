import { BACKEND_PORT } from './config.js';
// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl } from './helpers.js';
import API from './api.js';



//* User Object
const state = {
    user: {
        isLoggedIn: false,
        userToken: undefined,
        userId: undefined,
    },
    currentScreen: 'login-screen'
}


//* Screen helper functions
// #region
const hideScreen = () => {
    document.getElementById(state.currentScreen).classList.add('hidden');
}

const showScreen = (id) => {
    try {
        document.getElementById(id).classList.remove('hidden');
        state.currentScreen = id;
    } catch {
        console.error("Error: Cannot hide screen")
    }
}

const changeScreen = (id, cb=undefined) => {
    try {
        hideScreen(state.currentScreen);
        showScreen(id);
        if (cb) cb();
    } catch {
        console.log("Error: Cannot change screens")
    }
}
// #endregion

//* Error helper functions
// #region
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
// #endregion

//* User Function
const findUser = (userId) => {
    return API.getUser(state.user.userToken, userId).then(res => {
        if (res.ok) return res.json();
        else {
            if (res.status === 403) {
                showError('dashboard-screen', 'Invalid token');
            }
        }
    })
}


//* Navbar Functions
const handleNavLogin = (event) => {
    event.preventDefault();
    if (!state.user.isLoggedIn) {
        changeScreen('login-screen');
        document.title = "LurkForWork - Login";
    }
}


const handleNavRegister = (event) => {
    event.preventDefault();
    if (!state.user.isLoggedIn) {
        changeScreen('register-screen');
        document.title = "LurkForWork - Register";
    }
}

const handleNavDashboard = (event) => {
    event.preventDefault();
    if (state.user.isLoggedIn) {
        changeScreen('dashboard-screen', loadDashboard);
        document.title = "LurkForWork - Dashboard";
    }
}




//* Login Screen
const handleLogin = (event) => {
    event.preventDefault();
    const { email, password } = document.forms.login;
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
            state.user.userToken = res.token;
            state.user.userId = res.userId;
            state.user.isLoggedIn = true;
            console.log("User logged in successfully");
            changeScreen('dashboard-screen', loadDashboard);
            document.title = "LurkForWork - Dashboard";
        }
    });
}


//* Register Screen
const handleRegister = (event) => {
    event.preventDefault();
    const { email, name, password, confirmpassword } = document.forms.register;
    
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
            state.user.userToken = res.token;
            state.user.userId = res.userId;
            state.user.isLoggedIn = true;
            console.log("User registered successfully");
            changeScreen('dashboard-screen', loadDashboard);
            document.title = "LurkForWork - Dashboard";
        }
    });
}







const formatDate = (date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

const getJobDate = (timeCreated) => {
    const now = Date.now();
    const posted = new Date(timeCreated);
    const hoursSinceCreated = Math.floor((now - posted.getTime()) / 1000 / 60 / 60);
    if (hoursSinceCreated < 24) {
        const minsSinceCreated = Math.round((now - posted.getTime()) % 86400000 % 3600000 / 60000);
        return `${hoursSinceCreated} hr${hoursSinceCreated === 1 ? "" : "s"} ${minsSinceCreated} min${minsSinceCreated === 1 ? "" : "s"} ago`
    } else {
        return formatDate(posted);
    }
}

const clearList = (parent) => {
    [...parent.children].forEach((child) => {
        parent.removeChild(child);
    })
}

const constructJobItem = (user, job) => {
    const jobTemplate = document.getElementById('job-item-template').cloneNode(true);
    jobTemplate.removeAttribute('id');
    jobTemplate.setAttribute('id', `job-${job.id}`);
    jobTemplate.classList.add('job-item');
    jobTemplate.classList.remove('hidden');

    const [title, postedInfo, hr, startDate, imgDesc, hr2, popups, interactions] = jobTemplate.children[0].children[0].children;
    // Title
    title.textContent = `${job.title}`;
    // Posted Info
    postedInfo.children[0].textContent = `${user.name}`;
    postedInfo.children[1].textContent = `Posted: ${getJobDate(job.createdAt)}`;
    // Start Date
    startDate.textContent = `Start date: ${formatDate(new Date(job.start))}`
    // Image
    imgDesc.children[0].setAttribute('src', job.image);
    // Description
    imgDesc.children[1].textContent = job.description;
    // Interactions
    const [jobLikesContainer, commentsButton] = interactions.children;
    const [heartButton, likesButton] = jobLikesContainer.children;
    likesButton.textContent = `${job.likes.length} like${job.likes.length === 1 ? "" : "s"}`
    commentsButton.textContent = `${job.comments.length} comment${job.comments.length === 1 ? "" : "s"}`

    // Likes/Comments Popup
    const [likesPopup, commentsPopup] = popups.children;

    // Set inital icon state
    const icon = heartButton.firstChild;
    const userLiked = job.likes.find((like) => {
        return like.userId === state.user.userId;
    });
    if (userLiked) {
        icon.textContent = 'favorite';
    } else {
        icon.textContent = 'favorite_border';
    }

    // Heart Button Click listener
    heartButton.addEventListener('click', (event) => {
        event.preventDefault();
        const tryLike = userLiked ? false : true;
        API.likeJob(state.user.userToken, job.id, tryLike).then(res => {
            if (res.ok) return res.json();
            else {
                if (res.status === 400) {
                    showError('dashboard-error', 'Invalid input');
                } else if (res.status === 403) {
                    showError('dashboard-error', 'Invalid token');
                }
            }
        }).then(res => {
            if (res) {
                if (tryLike) {
                    icon.textContent = 'favorite';
                } else {
                    icon.textContent = 'favorite_border';
                }
            }
        });
    })

    // Like Button Click listener
    likesButton.addEventListener('click', (event) => {
        event.preventDefault();
        const popupsState = popups.getAttribute('data-popup');
        if (popupsState === 'none') {
            popups.setAttribute('data-popup', 'likes');
            likesPopup.classList.remove('hidden');
            job.likes.forEach((like, index) => {
                // Create a new like list item
                const newLike = document.createElement('li');
                newLike.setAttribute('key', index);
                newLike.classList.add('list-group-item');
                newLike.textContent = `${like.userName}`;
                likesPopup.appendChild(newLike);
            })
        } else if (popupsState === 'likes') {
            popups.setAttribute('data-popup', 'none');
            // Clear Likes list
            clearList(likesPopup);
            likesPopup.classList.add('hidden');

        }
    })

    // Like Button Blur listener
    likesButton.addEventListener('blur', (event) => {
        event.preventDefault();
        popups.setAttribute('data-popup', 'none');
        clearList(likesPopup);
        likesPopup.classList.add('hidden');
    })

    // Comment Button 
    commentsButton.addEventListener('click', (event) => {
        event.preventDefault();
        const popupsState = popups.getAttribute('data-popup');
        if (popupsState === 'none') {
            popups.setAttribute('data-popup', 'comments');
            commentsPopup.classList.remove('hidden');
            job.comments.forEach((comment, index) => {
                // Create a new like list item
                const newComment = document.createElement('li');
                newComment.setAttribute('key', index);
                newComment.classList.add('list-group-item');
                newComment.textContent = `${comment.userName}: ${comment.comment}`;
                commentsPopup.appendChild(newComment);
            })
        } else if (popupsState === 'comments') {
            popups.setAttribute('data-popup', 'none');
            // Clear Comments list
            clearList(commentsPopup);
            commentsPopup.classList.add('hidden');
        }
    })

    // Comment Button
    commentsButton.addEventListener('blur', (event) => {
        event.preventDefault();
        popups.setAttribute('data-popup', 'none');
        clearList(commentsPopup);
        commentsPopup.classList.add('hidden');
    })

    return jobTemplate;
}


//* Dashboard Screen
const loadDashboard = () => {
    if (state.user.isLoggedIn) {
        const feedList = document.getElementById('job-list');

        // Clear Job List
        [...feedList.children].forEach((child) => {
            if (child.id !== 'job-item-template') feedList.removeChild(child);
        })

        API.getJobFeed(state.user.userToken).then(res => {
            if (res.ok) return res.json();
            else {
                if (res.status === 403) {
                    showError('dashboard-error', 'Invalid token');
                }
            }
        }).then(res => {
            if (res) {
                res.forEach((job, index) => {
                    console.log(job);
                    findUser(job.creatorId).then(userJson => {
                        if (userJson) {
                            const newJob = constructJobItem(userJson, job);
                            newJob.setAttribute('key', index);
                            feedList.appendChild(newJob);
                        }
                    });
                });
            }
        })
    }
}


//* Event Listeners
document.getElementById('nav-login').addEventListener('click', handleNavLogin);
document.getElementById('nav-register').addEventListener('click', handleNavRegister);
document.getElementById('nav-dashboard').addEventListener('click', handleNavDashboard);
document.getElementById('login').addEventListener('submit', handleLogin);
document.getElementById('register').addEventListener('submit', handleRegister);
