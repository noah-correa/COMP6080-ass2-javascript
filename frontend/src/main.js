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
    // try {
    if (args) cb(...args);
    else if (cb) cb();
    hideScreen(state.currentScreen);
    showScreen(id);
    // } catch {
        // console.log("Error: Cannot change screens")
    // }
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
        if (res.error) {
            showError('login-error', res.error);
        } else {
            hideError('login-error');
            state.user.userToken = res.token;
            state.user.userId = res.userId;
            state.user.isLoggedIn = true;
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
        if (res.error) {
            showError('register-error', res.error);
        } else {
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
        if (hoursSinceCreated === 0) return `${minsSinceCreated} min${minsSinceCreated === 1 ? "" : "s"} ago`
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

const handleProfileButton = (event) => {
    event.preventDefault();
    event.currentTarget.removeEventListener('click', handleProfileButton);
    changeScreen('profile-screen', loadProfileScreen, [event.currentTarget.id]);
}

const handleHeartButton = (event) => {
    event.preventDefault();
    const heartButton = event.currentTarget;
    const { job, userLiked } = heartButton;
    let liked = userLiked;
    API.likeJob(state.user.userToken, job.id, !liked).then(res => {
        if (res.error) {
            showError('dashboard-error', res.error);
        } else {
            hideError('dashboard-error');
            // console.log(event.currentTarget);
            heartButton.textContent = liked ? 'favorite_border' : 'favorite';
            liked = !liked;
            heartButton.removeEventListener('click', handleHeartButton);
            changeScreen('dashboard-screen', loadDashboard);
        }
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
    postedInfo.children[0].id = user.id;
    postedInfo.children[0].addEventListener('click', handleProfileButton);

    // Likes/Comments Popup
    const [likesPopup, commentsPopup] = popups.children;

    // Set inital icon state
    const icon = heartButton.children[0];
    let userLiked = job.likes.find((like) => {
        return like.userId === state.user.userId;
    });
    icon.textContent = userLiked ? 'favorite' : 'favorite_border';

    // Heart Button Click listener
    // console.log(heartButton);
    heartButton.job = job;
    heartButton.userLiked = userLiked;
    heartButton.addEventListener('click', handleHeartButton);

    // Like Button Click listener
    likesButton.addEventListener('click', (event) => {
        event.preventDefault();
        const popupsState = popups.getAttribute('data-popup');
        if (popupsState === 'none') {
            popups.setAttribute('data-popup', 'likes');
            likesPopup.classList.remove('hidden');
            job.likes.forEach((like, index) => {
                // Create a new like list item
                const newItem = document.createElement('li');
                const newLike = document.createElement('button');

                newItem.setAttribute('key', index);
                newItem.classList.add('list-group-item', 'text-center');
                newLike.classList.add('btn', 'btn-link');
                newLike.textContent = `${like.userName}`;
                newLike.id = like.userId;
                newLike.addEventListener('click', handleProfileButton);
                newItem.appendChild(newLike);
                likesPopup.appendChild(newItem);
            })
        } else if (popupsState === 'likes') {
            popups.setAttribute('data-popup', 'none');
            // Clear Likes list
            clearList(likesPopup);
            likesPopup.classList.add('hidden');

        }
    })

    // Like Button Blur listener
    // likesButton.addEventListener('blur', (event) => {
    //     event.preventDefault();
    //     popups.setAttribute('data-popup', 'none');
    //     clearList(likesPopup);
    //     likesPopup.classList.add('hidden');
    // })

    // Comment Button Click listener
    commentsButton.addEventListener('click', (event) => {
        event.preventDefault();
        const popupsState = popups.getAttribute('data-popup');
        if (popupsState === 'none') {
            popups.setAttribute('data-popup', 'comments');
            commentsPopup.classList.remove('hidden');
            job.comments.forEach((comment, index) => {
                // Create a new like list item
                const newItem = document.createElement('li');
                const newComment = document.createElement('button');
                newItem.setAttribute('key', index);
                newItem.classList.add('list-group-item');
                newComment.classList.add('btn', 'btn-link');
                newComment.textContent = `${comment.userName}: ${comment.comment}`;
                newComment.id = comment.userId;
                newComment.addEventListener('click', handleProfileButton);
                newItem.appendChild(newComment);
                commentsPopup.appendChild(newItem);
            })
        } else if (popupsState === 'comments') {
            popups.setAttribute('data-popup', 'none');
            // Clear Comments list
            clearList(commentsPopup);
            commentsPopup.classList.add('hidden');
        }
    })

    // Comment Button Blur listener
    // commentsButton.addEventListener('blur', (event) => {
    //     event.preventDefault();
    //     popups.setAttribute('data-popup', 'none');
    //     clearList(commentsPopup);
    //     commentsPopup.classList.add('hidden');
    // })

    return jobTemplate;
}

const constructJobFeed = (feed, page) => {
    API.getJobFeed(state.user.userToken, page).then(res => {
        if (res.error) {
            showError('dashboard-error', res.error);
        } else if (res.length === 0) { 
            hideError('dashboard-error');
            // Clear Job List
            clearList(feed);
            const noJobs = document.createElement('li');
            noJobs.classList.add('list-group-item');
            noJobs.textContent = "No jobs watched";
            feed.appendChild(noJobs);
            return false;
        } else {
            hideError('dashboard-error');
            // Clear Job List
            clearList(feed);
            res.forEach((job, index) => {
                API.getUser(state.user.userToken, job.creatorId).then(userJson => {
                    if (userJson.error) {
                        showError('dashboard-error', userJson.error);
                    } else {
                        hideError('dashboard-error');
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
const handleEmailSearch = (event) => {
    event.preventDefault();
    const button = event.currentTarget;
    const { email } = document.forms['email-search'];
    
    // console.log(email);
    API.watchUser(state.user.userToken, email.value, true).then(res => {
        if (res.error) showError('email-search-error', res.error);
        else {
            button.removeEventListener('click', handleEmailSearch);
            changeScreen('dashboard-screen', loadDashboard);
        }
    })
}

const handleNavUserProfile = (event) => {
    event.preventDefault();
    event.currentTarget.removeEventListener('click', handleNavUserProfile);
    changeScreen('profile-screen', loadProfileScreen, [state.user.userId]);
}

const loadDashboard = () => {
    if (state.user.isLoggedIn) {
        // Change Navbar links
        document.getElementById('nav-login').classList.add('hidden');
        document.getElementById('nav-register').classList.add('hidden');
        document.getElementById('nav-dashboard').classList.remove('hidden');
        
        // Set up Navbar Logged in user
        API.getUser(state.user.userToken, state.user.userId).then(res => {
            if (res.error) {
                showError('dashboard-error', res.error);
            } else {
                hideError('dashboard-error');
                document.getElementById('nav-user-container').classList.remove('vis-hidden');
                document.getElementById('nav-user').textContent = res.name;
                document.getElementById('nav-user').addEventListener('click', handleNavUserProfile);
            }
        })

        // Handle Email search
        const emailSearchButton = document.getElementById('search-email');
        emailSearchButton.addEventListener('click', handleEmailSearch);

        // Handle Job Feed
        const feedList = document.getElementById('job-list');
        const [pageBack, pageNum, pageNext] = document.getElementById('job-page').children;

        let currPage = 1;
        let jobsPerPage = 3;    // TODO: test with more jobs
        constructJobFeed(feedList, jobsPerPage * (currPage-1));
        
        pageBack.addEventListener('click', (event) => {
            console.log('page back');
            event.preventDefault();
            if (currPage === 1) return;
            const made = constructJobFeed(feedList, jobsPerPage * (currPage-2));
            if (made) {
                currPage -= 1;
                console.log(pageNum);
                pageNum.textContent = `Page ${currPage}`;
            }
        });

        pageNext.addEventListener('click', (event) => {
            console.log('page next');
            event.preventDefault();
            const made = constructJobFeed(feedList, jobsPerPage * (currPage));
            if (made) {
                currPage += 1;
                console.log(pageNum);
                pageNum.textContent = `Page ${currPage}`;
            }
        });
    }
}
// #endregion


//* Profile Screen
// #region
const handleUpdateProfileButton = (event) => {
    event.preventDefault();
    const update = event.currentTarget;
    const { res } = event.currentTarget;
    update.removeEventListener('click', handleUpdateProfileButton);
    changeScreen('update-profile-screen', loadProfileUpdateScreen, [res]);
}

const handleWatchButton = (event) => {
    event.preventDefault();
    const watch = event.currentTarget;
    const { res, watching, id } = watch;
    let isWatching = watching;
    API.watchUser(state.user.userToken, res.email, !isWatching).then(watchRes => {
        if (watchRes.error) showError('profile-error', watchRes.error);
        else {
            if (isWatching) {
                watch.textContent = 'Watch User';
                watch.classList.remove('btn-primary');
                watch.classList.add('btn-outline-primary');
            } else {
                watch.textContent = 'Unwatch User';
                watch.classList.remove('btn-outline-primary');
                watch.classList.add('btn-primary');
            }
            isWatching = !isWatching;
            watch.removeEventListener('click', handleWatchButton);
            changeScreen('profile-screen', loadProfileScreen, [id]);
        }
    });
}

const handleProfileWatcheeButton = (event) => {
    event.preventDefault();
    const { id } = event.currentTarget;
    event.currentTarget.removeEventListener('click', handleProfileWatcheeButton);
    changeScreen('profile-screen', loadProfileScreen, [id]);
}

const constructProfileJob = (job, name) => {
    const profileJobTemplate = document.getElementById('profile-job-item-template').cloneNode(true);
    profileJobTemplate.removeAttribute('id');
    profileJobTemplate.setAttribute('id', `job-${job.id}`);

    const [title, postedInfo, hr, startDate, imgDesc] = profileJobTemplate.children;
    // Title
    title.textContent = `${job.title}`;
    // Posted Info
    postedInfo.children[0].textContent = `${name}`;
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
    profileButton.id = id;
    profileButton.addEventListener('click', handleProfileWatcheeButton);
    return watcheeTemplate;
}

const loadProfileScreen = (userId) => {
    const id = Number.parseInt(userId, 10);
    // Profile User JSON
    API.getUser(state.user.userToken, id).then(res => {
        // console.log(res);
        if (res.error) showError('profile-error', res.error);
        else {
            hideError('profile-error');
            const [nameEmailUpdateImg, h1, t1, jobs, h2, t2, watchedBy] = document.getElementById('profile-container').children;
            const [nameEmailUpdate, img] = nameEmailUpdateImg.children;
            const [name, email, buttons] = nameEmailUpdate.children;
            const [update, watch] = buttons.children;

            // Check if profile is logged in user's profile
            if (id === state.user.userId) {
                // If logged in user's profile, display update button
                watch.classList.add('hidden');
                update.classList.remove('hidden');
                // Watching button event listener
                update.res = res;
                update.addEventListener('click', handleUpdateProfileButton);
            } else {
                // Otherwise, display watch/unwatch button
                update.classList.add('hidden');
                watch.classList.remove('hidden');

                let watching = res.watcheeUserIds.find((watcheeId) => {
                    return watcheeId === state.user.userId;
                })
                if (watching) {
                    watch.textContent = 'Unwatch User';
                    watch.classList.remove('btn-outline-primary');
                    watch.classList.add('btn-primary');
                } else {
                    watch.textContent = 'Watch User';
                    watch.classList.remove('btn-primary');
                    watch.classList.add('btn-outline-primary');
                }
                // Watching button event listener
                watch.res = res;
                watch.watching = watching;
                watch.id = id;
                watch.addEventListener('click', handleWatchButton);
            }
            name.children[0].textContent = res.name;
            email.children[0].textContent = res.email;
            if (res.image) img.setAttribute('src', res.image);
            
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
                    API.getUser(state.user.userToken, watcheeId).then(watchee => {
                        if (watchee.error) {
                            showError('profile-error', watchee.error);
                        } else {
                            hideError('profile-error');
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


//* Profile Update Screen
// #region
const handleUpdateProfile = (event) => {
    event.preventDefault();
    hideError('update-profile-error');
    const id = document.getElementById('update-profile-button').getAttribute('data-id');
    const { email, password, cpassword, name, image } = document.forms['update-profile-form'];
    const data = {};
    if (email.value) data.email = email.value;
    if (password.value && password.value === cpassword.value) data.password = password.value;
    if (password.value && password.value !== cpassword.value) {
        showError('update-profile-error', "Passwords do not match");
        return;
    }
    if (name.value) data.name = name.value;
    if (image.files[0]) {
        try {
            fileToDataUrl(image.files[0]).then(res => {
                data.image = res;                
                API.updateProfile(state.user.userToken, data).then(res => {
                    if (res.error) showError('update-profile-error', res.error);
                    else {
                        if (data.name) document.getElementById('nav-user').textContent = data.name;
                        changeScreen('profile-screen', loadProfileScreen, [id]);
                    }
                });
            })
        } catch {
            showError('update-profile-error', "Invalid image chosen");
        }
    } else {
        // console.log(data);
        API.updateProfile(state.user.userToken, data).then(res => {
            if (res.error) showError('update-profile-error', res.error);
            else {
                if (data.name) document.getElementById('nav-user').textContent = data.name;
                changeScreen('profile-screen', loadProfileScreen, [id]);
            }
        });

    }

}

const loadProfileUpdateScreen = (prevUser) => {
    const { email, name } = document.forms['update-profile-form'];
    email.setAttribute('placeholder', prevUser.email);
    name.setAttribute('placeholder', prevUser.name);
    document.getElementById('update-profile-button').setAttribute('data-id', prevUser.id);
    if (prevUser.image) document.getElementById('update-profile-image').setAttribute('src', prevUser.image);
}
// #endregion



//* Event Listeners
document.getElementById('nav-login').addEventListener('click', handleNavLogin);
document.getElementById('nav-register').addEventListener('click', handleNavRegister);
document.getElementById('nav-dashboard').addEventListener('click', handleNavDashboard);
document.getElementById('login').addEventListener('submit', handleLogin);
document.getElementById('register').addEventListener('submit', handleRegister);
document.getElementById('update-profile-button').addEventListener('click', handleUpdateProfile);
