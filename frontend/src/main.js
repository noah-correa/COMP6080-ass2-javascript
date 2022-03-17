import { fileToDataUrl } from './helpers.js';
import API from './api.js';



//* State Object
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

const changeScreen = (id, cb=undefined, args=undefined) => {
    try {
        hideScreen(state.currentScreen);
        showScreen(id);
        if (args) cb(...args);
        else if (cb) cb();
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


//* Navbar Functions
// #region
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
// #endregion


//* Login Screen
// #region
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
// #endregion


//* Register Screen
// #region
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
// #endregion


// Dashboard helper functions
// #region
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
    });
}

const constructJobItem = (user, job) => {
    const jobTemplate = document.getElementById('job-item-template').cloneNode(true);
    jobTemplate.removeAttribute('id');
    jobTemplate.setAttribute('id', `job-${job.id}`);

    const [title, postedInfo, hr, startDate, imgDesc, hr2, popups, interactions] = jobTemplate.children;
    // Title
    title.textContent = `${job.title}`;
    // Posted Info
    postedInfo.children[0].children[0].textContent = `${user.name}`;
    postedInfo.children[0].setAttribute('id', `profile-${user.id}`);
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
    // Poster Profile Button
    postedInfo.children[0].addEventListener('click', (event) => {
        event.preventDefault();
        changeScreen('profile-screen', loadProfileScreen, [user.id]);
    })

    // Likes/Comments Popup
    const [likesPopup, commentsPopup] = popups.children;

    // Set inital icon state
    const icon = heartButton.children[0];
    let userLiked = job.likes.find((like) => {
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
        API.likeJob(state.user.userToken, job.id, !userLiked).then(res => {
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
                if (userLiked) {
                    icon.textContent = 'favorite_border';
                } else {
                    icon.textContent = 'favorite';
                }
                userLiked = !userLiked;
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

const constructJobFeed = (feed, page) => {
    API.getJobFeed(state.user.userToken, page).then(res => {
        if (res.ok) return res.json();
        else {
            if (res.status === 403) {
                showError('dashboard-error', 'Invalid token');
                return false;
            }
        }
    }).then(res => {
        if (res.length === 0) { 
            // Clear Job List
            clearList(feed);
            return false;
        }
        if (res) {
            // Clear Job List
            clearList(feed);
            res.forEach((job, index) => {
                API.getUser(state.user.userToken, job.creatorId).then(res => {
                    if (res.ok) return res.json();
                    else {
                        if (res.status === 403) {
                            showError('dashboard-screen', 'Invalid token');
                        }
                    }
                }).then(userJson => {
                    if (userJson) {
                        const newJob = constructJobItem(userJson, job);
                        newJob.setAttribute('key', index);
                        feed.appendChild(newJob);
                    }
                });
            });
            return true;
        }
        return false;
    })
}
// #endregion

//* Dashboard Screen
// #region
const loadDashboard = () => {
    if (state.user.isLoggedIn) {
        // Change Navbar links
        document.getElementById('nav-login').classList.add('hidden');
        document.getElementById('nav-register').classList.add('hidden');
        document.getElementById('nav-dashboard').classList.remove('hidden');

        API.getUser(state.user.userToken, state.user.userId).then(res => {
            if (res.ok) return res.json();
            else {
                if (res.status === 403) {
                    showError('dashboard-screen', 'Invalid token');
                }
            }
        }).then(res => {
            if (res) {
                document.getElementById('nav-user-container').classList.remove('vis-hidden');
                document.getElementById('nav-user').textContent = res.name;
                if (document.getElementById('nav-user').getAttribute('listener') !== 'true') {
                    document.getElementById('nav-user').addEventListener('click', (event) => {
                        event.preventDefault();
                        document.getElementById('nav-user').setAttribute('listener', 'true')
                        changeScreen('profile-screen', loadProfileScreen, [res.id]);
                    });
               }
            }
        })

        const feedList = document.getElementById('job-list');
        const [pageBack, pageNum, pageNext] = document.getElementById('job-page').children;

        let currPage = 1;
        let jobsPerPage = 3;    // TODO: test with more jobs
        constructJobFeed(feedList, jobsPerPage * (currPage-1));
        
        pageBack.addEventListener('click', (event) => {
            event.preventDefault();
            if (currPage === 1) return;
            const made = constructJobFeed(feedList, jobsPerPage * (currPage-2));
            if (made) {
                currPage -= 1;
                pageNum.textContent = `Page ${currPage}`;
            }
        });

        pageNext.addEventListener('click', (event) => {
            event.preventDefault();
            const made = constructJobFeed(feedList, jobsPerPage * (currPage));
            if (made) {
                currPage += 1;
                pageNum.textContent = `Page ${currPage}`;
            }
        });
    }
}
// #endregion


//* Profile Screen
// #region
const constructProfileJob = (job, name) => {
    const profileJobTemplate = document.getElementById('profile-job-item-template').cloneNode(true);
    profileJobTemplate.removeAttribute('id');
    profileJobTemplate.setAttribute('id', `job-${job.id}`);

    const [title, postedInfo, hr, startDate, imgDesc] = profileJobTemplate.children;
    // Title
    title.textContent = `${job.title}`;
    // Posted Info
    postedInfo.children[0].children[0].textContent = `${name}`;
    postedInfo.children[0].setAttribute('id', `profile-${job.creatorId}`);
    postedInfo.children[1].textContent = `Posted: ${getJobDate(job.createdAt)}`;
    // Start Date
    startDate.textContent = `Start date: ${formatDate(new Date(job.start))}`
    // Image
    imgDesc.children[0].setAttribute('src', job.image);
    // Description
    imgDesc.children[1].textContent = job.description;
    return profileJobTemplate;
}

const constructProfileWatchee = (id, name) => {
    const watcheeTemplate = document.getElementById('profile-watchee-item-template').cloneNode(true);
    watcheeTemplate.removeAttribute('id');
    watcheeTemplate.setAttribute('id', `profile-${id}`);
    const profileButton = watcheeTemplate.children[0];
    profileButton.textContent = name;
    profileButton.addEventListener('click', (event) => {
        event.preventDefault();
        changeScreen('profile-screen', loadProfileScreen, [id]);
    });

    return watcheeTemplate;
}

const loadProfileScreen = (id) => {
    API.getUser(state.user.userToken, id).then(res => {
        if (res.ok) return res.json();
        else {
            if (res.status === 403) {
                showError('profile-error', "Invalid Token");
            }
        }
    }).then(res => {
        if (res) {
            const [nameEmailImg, h1, t1, jobs, h2, t2, watchedBy] = document.getElementById('profile-container').children;
            const [nameEmail, img] = nameEmailImg.children;
            nameEmail.children[0].firstChild.textContent = res.name;
            nameEmail.children[1].firstChild.textContent = res.email;
            if (res.image) img.children[1].setAttribute('src', res.image);
            
            // Jobs List
            clearList(jobs);
            if (res.jobs.length === 0) {
                const noJobs = document.createElement('li');
                noJobs.classList.add('list-group-item');
                noJobs.textContent = "No jobs created";
                jobs.appendChild(noJobs);
            } else {
                res.jobs.forEach((job, index) => {
                    const newJob = constructProfileJob(job, res.name);
                    newJob.setAttribute('key', index);
                    jobs.appendChild(newJob);
                });
            }

            // Watchee List
            clearList(watchedBy);
            if (res.watcheeUserIds.length === 0) {
                const noWatchees = document.createElement('li');
                noWatchees.classList.add('list-group-item');
                noWatchees.textContent = "No users watching";
                watchedBy.appendChild(noWatchees);
            } else {
                res.watcheeUserIds.forEach((watcheeId, index) => {
                    API.getUser(state.user.userToken, watcheeId).then(userRes => {
                        if (userRes.ok) return userRes.json();
                        else {
                            if (userRes.status === 403) {
                                showError('profile-error', "Invalid Token");
                            }
                        }
                    }).then(watchee => {
                        if (watchee) {
                            const newWatchee = constructProfileWatchee(watcheeId, watchee.name);
                            newWatchee.setAttribute('key', index);
                            watchedBy.appendChild(newWatchee);
                        }
                    })
                });
            }
        }
    })
}
// #endregion





//* Event Listeners
document.getElementById('nav-login').addEventListener('click', handleNavLogin);
document.getElementById('nav-register').addEventListener('click', handleNavRegister);
document.getElementById('nav-dashboard').addEventListener('click', handleNavDashboard);
document.getElementById('login').addEventListener('submit', handleLogin);
document.getElementById('register').addEventListener('submit', handleRegister);
