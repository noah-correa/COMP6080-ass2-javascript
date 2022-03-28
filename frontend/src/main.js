import { fileToDataUrl } from './helpers.js';
import API from './api.js';


//* State Object
const state = {
    user: {
        isLoggedIn: false,
        userToken: undefined,
        userId: undefined,
    },
    currentScreen: 'login-screen',
    currentJobPage: 1,
}

// Clears a <li> except for element with id defined
const clearList = (parent, except=undefined) => {
    [...parent.children].forEach((child) => {
        if (except && except === child.id);
        else parent.removeChild(child);
    });
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
    hideError();
    if (args) cb(...args);
    else if (cb) cb();
    hideScreen(state.currentScreen);
    showScreen(id);
}
// #endregion


//* Error helper functions
// #region
const hideError = () => {
    document.getElementById('error-alert').classList.add('hidden');
}

const showError = (message) => {
    try {
        document.getElementById('error-alert').classList.remove('hidden');
        document.getElementById('error-message').textContent = message;
        document.getElementById('error-close').addEventListener('click', (event) => {
            event.preventDefault();
            hideError();
        })
    } catch (error) {
        console.error("Error: Cannot show error")
        console.error(error);
    }
}
// #endregion


//* Button Handler Functions
// #region
// Navbar Buttons
const handleNavLogin = (event) => {
    event.preventDefault();
    if (!state.user.isLoggedIn && state.currentScreen !== 'login-screen') {
        changeScreen('login-screen');
        document.title = "LurkForWork - Login";
    }
}

const handleNavRegister = (event) => {
    event.preventDefault();
    if (!state.user.isLoggedIn && state.currentScreen !== 'register-screen') {
        changeScreen('register-screen');
        document.title = "LurkForWork - Register";
    }
}

const handleNavDashboard = (event) => {
    event.preventDefault();
    if (state.user.isLoggedIn && state.currentScreen !== 'dashboard-screen') {
        changeScreen('dashboard-screen', loadDashboardScreen);
        document.title = "LurkForWork - Dashboard";
    }
}

const handleNavUserProfile = (event) => {
    event.preventDefault();
    event.currentTarget.removeEventListener('click', handleNavUserProfile);
    changeScreen('profile-screen', loadProfileScreen, [state.user.userId]);
}

// Login Form Button
const handleLogin = (event) => {
    event.preventDefault();
    const { email, password } = document.forms.login;
    API.login(email.value, password.value).then(res => {
        if (res.error) {
            showError(res.error);
        } else {
            hideError();
            state.user.userToken = res.token;
            state.user.userId = res.userId;
            state.user.isLoggedIn = true;
            changeScreen('dashboard-screen', loadDashboardScreen);
            document.title = "LurkForWork - Dashboard";
        }
    });
}

// Login Register Switch Link Button
const handleSwitchRegister = (event) => {
    event.preventDefault();
    changeScreen('register-screen');
}

// Register Submit Button
const handleRegister = (event) => {
    event.preventDefault();
    const { email, name, password, confirmpassword } = document.forms.register;
    
    if (password.value !== confirmpassword.value) {
        // Passwords do not match
        showError('Passwords do not match');
        return;
    }

    API.register(email.value, password.value, name.value).then(res => {
        if (res.error) {
            showError(res.error);
        } else {
            hideError();
            state.user.userToken = res.token;
            state.user.userId = res.userId;
            state.user.isLoggedIn = true;
            changeScreen('dashboard-screen', loadDashboardScreen);
            document.title = "LurkForWork - Dashboard";
        }
    });
}

// Profile Button
const handleProfileButton = (event) => {
    event.preventDefault();
    event.currentTarget.removeEventListener('click', handleProfileButton);
    document.getElementById('job-likes-modal-close').click();
    document.getElementById('job-comments-modal-close').click();
    changeScreen('profile-screen', loadProfileScreen, [event.currentTarget.userId]);
}

// Like Job Button
const handleHeartButton = (event) => {
    event.preventDefault();
    const heartButton = event.currentTarget;
    const { job, userLiked } = heartButton;
    let liked = userLiked;
    API.likeJob(state.user.userToken, job.id, !liked).then(res => {
        if (res.error) {
            showError(res.error);
        } else {
            hideError();
            heartButton.textContent = userLiked ? '\u2606' : '\u2605';
            liked = !liked;
            heartButton.removeEventListener('click', handleHeartButton);
            changeScreen('dashboard-screen', loadDashboardScreen);
        }
    });
}

// Job Likes Modal Button
const handleLikesModal = (event) => {
    event.preventDefault();
    const { job } = event.currentTarget;
    const likesModalList = document.getElementById('job-likes-list');
    clearList(likesModalList);
    if (job.likes.length === 0) {
        const noJob = document.createElement('li');
        noJob.classList.add('list-group-item', 'fst-italic');
        noJob.textContent = "No likes"
        likesModalList.appendChild(noJob);
    } else {
        job.likes.forEach((like, index) => {
            // Create a new like list item
            const newItem = document.createElement('li');
            const newLike = document.createElement('button');
            newItem.setAttribute('key', index);
            newItem.classList.add('list-group-item');
            newLike.classList.add('btn', 'btn-link');
            newLike.textContent = `${like.userName}`;
            newLike.userId = like.userId;
            newLike.addEventListener('click', handleProfileButton);
            newItem.appendChild(newLike);
            likesModalList.appendChild(newItem);
        });
    }
}

// Job Add Comment Button
const handleAddComment = (event) => {
    event.preventDefault();
    const { jobId } = event.currentTarget;
    const comment = document.getElementById('add-comment-text').value;
    API.addComment(state.user.userToken, jobId, comment).then(res => {
        if (res.error) showError(res.error);
        else {
            hideError();
            document.getElementById('job-comments-modal-close').click();
            changeScreen('dashboard-screen', loadDashboardScreen);
        }
    });

}

// Job Comments Modal Button
const handleCommentsModal = (event) => {
    event.preventDefault();
    const { job } = event.currentTarget;
    const commentsModalList = document.getElementById('job-comments-list');
    clearList(commentsModalList, 'add-comment-item');
    document.getElementById('add-comment-button').jobId = job.id;

    if (job.comments.length === 0) {
        const noComment = document.createElement('li');
        noComment.classList.add('list-group-item', 'fst-italic');
        noComment.textContent = "No comments";
        commentsModalList.appendChild(noComment);
    } else {
        job.comments.forEach((comment, index) => {
            // Create a new like list item
            const newItem = document.createElement('li');
            const newCommentButton = document.createElement('button');
            const newComment = document.createElement('span');
            newComment.textContent = `${comment.comment}`;
            newItem.setAttribute('key', index);
            newItem.classList.add('list-group-item');
            newCommentButton.classList.add('btn', 'btn-link');
            newCommentButton.textContent = `${comment.userName}: `;
            newCommentButton.userId = comment.userId;
            newCommentButton.addEventListener('click', handleProfileButton);
            newItem.appendChild(newCommentButton);
            newItem.appendChild(newComment);
            commentsModalList.appendChild(newItem);
        })
    }
}

// Email Search Button
const handleEmailSearch = (event) => {
    event.preventDefault();
    const button = event.currentTarget;
    const { email } = document.forms['email-search'];
    
    API.watchUser(state.user.userToken, email.value, true).then(res => {
        if (res.error) showError(res.error);
        else {
            button.removeEventListener('click', handleEmailSearch);
            changeScreen('dashboard-screen', loadDashboardScreen);
        }
    })
}

// Create New Job Button
const handleNewJob = (event) => {
    event.preventDefault();
    changeScreen('new-job-screen');
}

// Update User Profile Screen Button
const handleUpdateProfileButton = (event) => {
    event.preventDefault();
    const update = event.currentTarget;
    const { res } = event.currentTarget;
    changeScreen('update-profile-screen', loadProfileUpdateScreen, [res]);
}

// Watch User Button
const handleWatchButton = (event) => {
    event.preventDefault();
    const watch = event.currentTarget;
    const { res, watching, userId } = watch;
    let isWatching = watching;
    API.watchUser(state.user.userToken, res.email, !isWatching).then(watchRes => {
        if (watchRes.error) showError(watchRes.error);
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
            changeScreen('profile-screen', loadProfileScreen, [userId]);
        }
    });
}

// Watchee User Profile Button
const handleProfileWatcheeButton = (event) => {
    event.preventDefault();
    const { userId } = event.currentTarget;
    changeScreen('profile-screen', loadProfileScreen, [userId]);
}

// Update Job Button
const handleJobUpdate = (event) => {
    event.preventDefault();
    changeScreen('update-job-screen', loadUpdateJobScreen, [event.currentTarget.job]);
}

// Delete Job Button
const handleJobDelete = (event) => {
    event.preventDefault();
    const deleteButton = event.currentTarget;
    const { jobId } = deleteButton;
    API.deleteJob(state.user.userToken, jobId).then(res => {
        if (res.error) showError(res.error);
        else {
            hideError();
            changeScreen('profile-screen', loadProfileScreen, [state.user.userId]);
        }
    });
}

// Update User Information Submit Button
const handleUpdateProfile = (event) => {
    event.preventDefault();
    hideError();
    const id = document.getElementById('update-profile-button').getAttribute('data-id');
    const { email, password, cpassword, name, image } = document.forms['update-profile-form'];
    const data = {};
    if (email.value) data.email = email.value;
    if (password.value && password.value === cpassword.value) data.password = password.value;
    if (password.value && password.value !== cpassword.value) {
        showError("Passwords do not match");
        return;
    }
    if (name.value) data.name = name.value;
    if (image.files[0]) {
        try {
            fileToDataUrl(image.files[0]).then(res => {
                data.image = res;                
                API.updateProfile(state.user.userToken, data).then(res => {
                    if (res.error) showError(res.error);
                    else {
                        if (data.name) document.getElementById('nav-user').textContent = data.name;
                        changeScreen('profile-screen', loadProfileScreen, [id]);
                    }
                });
            })
        } catch {
            showError("Invalid image file");
        }
    } else {
        API.updateProfile(state.user.userToken, data).then(res => {
            if (res.error) showError(res.error);
            else {
                if (data.name) document.getElementById('nav-user').textContent = data.name;
                changeScreen('profile-screen', loadProfileScreen, [id]);
            }
        });

    }

}

// New Job Submit Button
const handleSubmitNewJob = (event) => {
    event.preventDefault();
    const { title, start, description, newjobimage } = document.forms['new-job-form'];
    try {
        if (!document.forms['new-job-form'].checkValidity()) {
            showError("Please fill out all fields")
        } else {
            hideError();
            fileToDataUrl(newjobimage.files[0]).then(img => {
                const startDate = new Date(start.value).toISOString();
                API.addJob(state.user.userToken, title.value, img, startDate, description.value).then(jobRes => {
                    if (jobRes.error) showError(jobRes.error);
                    else {
                        hideError();
                    }
                });
                changeScreen('dashboard-screen', loadDashboardScreen);
            })
        }
    } catch {
        showError("Invalid image file");
    }
}

// Update Job Submit Button
const handleUpdateJobButton = (event) => {
    event.preventDefault();
    const { title, start, description, image } = document.getElementById('update-job-form');
    const id = Number.parseInt(document.getElementById('update-job-button').getAttribute('data-id'), 10);
    hideError();
    const data = { id };
    if (title.value) data.title = title.value;
    if (start.value) data.start = new Date(start.value).toISOString();
    if (description.value) data.description = description.value;
    if (image.files[0]) {
        try {
            fileToDataUrl(image.files[0]).then(res => {
                data.image = res;                
                API.updateJob(state.user.userToken, data).then(res => {
                    if (res.error) showError(res.error);
                    else {
                        changeScreen('profile-screen', loadProfileScreen, [state.user.userId]);
                    }
                });
            })
        } catch {
            showError("Invalid image file");
        }
    } else {
        API.updateJob(state.user.userToken, data).then(res => {
            if (res.error) showError(res.error);
            else {
                event.currentTarget.removeEventListener('submit', handleUpdateProfile);
                changeScreen('profile-screen', loadProfileScreen, [state.user.userId]);
            }
        });

    }
}

// Job Feed Page Back Button
const handlePageBack = (event) => {
    event.preventDefault();
    if (state.currentJobPage === 1) return;
    constructJobFeed(state.currentJobPage-1);
}

// Job Feed Page Next Button
const handlePageNext = (event) => {
    event.preventDefault();
    constructJobFeed(state.currentJobPage+1);
}
// #endregion


//* List Element Construction Functions
// #region
// Format date to dd/mm/yyyy
const formatDate = (date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// Construct Job Date String
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

// Construct Job Feed Job Item
const constructJobItem = (user, job) => {
    const jobTemplate = document.getElementById('job-item-template').cloneNode(true);
    jobTemplate.removeAttribute('id');
    jobTemplate.setAttribute('id', `job-${job.id}`);

    const [title, postedInfo, hr, content, hr2, interactions] = jobTemplate.children;
    const [img, startDesc] = content.children;
    // Title
    title.textContent = `${job.title}`;
    // Posted Info
    postedInfo.children[0].children[0].textContent = `${user.name}`;
    postedInfo.children[0].setAttribute('id', `profile-${user.id}`);
    postedInfo.children[1].textContent = `Posted: ${getJobDate(job.createdAt)}`;
    // Image
    img.setAttribute('src', job.image);
    // Start Date
    startDesc.children[0].textContent = `Start date: ${formatDate(new Date(job.start))}`;
    // Description
    startDesc.children[1].textContent = job.description;
    // Interactions
    const [jobLikesContainer, commentsButton] = interactions.children;
    const [heartButton, likesButton] = jobLikesContainer.children;
    likesButton.textContent = `${job.likes.length} like${job.likes.length === 1 ? "" : "s"}`
    commentsButton.textContent = `${job.comments.length} comment${job.comments.length === 1 ? "" : "s"}`
    commentsButton.id = `comments-${job.id}`;
    // Poster Profile Button
    postedInfo.children[0].userId = user.id;
    postedInfo.children[0].addEventListener('click', handleProfileButton);

    // Set inital icon state
    const icon = heartButton.children[0];
    let userLiked = job.likes.find((like) => {
        return like.userId === state.user.userId;
    });
    icon.textContent = userLiked ? '\u2605' : '\u2606';

    // Heart Button Click listener
    heartButton.job = job;
    heartButton.userLiked = userLiked;
    heartButton.addEventListener('click', handleHeartButton);

    // Like Button Click listener
    likesButton.job = job;
    likesButton.addEventListener('click', handleLikesModal);

    // Comment Button Click listener
    commentsButton.job = job;
    commentsButton.addEventListener('click', handleCommentsModal);

    return jobTemplate;
}

// Construct Complete Job Feed
const constructJobFeed = (page) => {
    const jobsPerPage = 5;
    API.getJobFeed(state.user.userToken, (page-1)*jobsPerPage).then(res => {
        if (res.error) {
            showError(res.error);
        } else if (res.length === 0) { 
            hideError();
        } else {
            hideError();
            const feedList = document.getElementById('job-list');
            if (res.length === 0 && page === 1) {
                // First page and no jobs
                clearList(feedList);
                const noJobs = document.createElement('li');
                noJobs.classList.add('list-group-item');
                noJobs.textContent = "No jobs watched";
                feedList.appendChild(noJobs);
            } else {
                clearList(feedList);
                res.forEach((job, index) => {
                    API.getUser(state.user.userToken, job.creatorId).then(userJson => {
                        if (userJson.error) {
                            showError(userJson.error);
                        } else {
                            hideError();
                            const newJob = constructJobItem(userJson, job);
                            newJob.setAttribute('key', index);
                            feedList.appendChild(newJob);
                        }
                    });
                });
                document.getElementById('page-number').textContent = page;
                state.currentJobPage = page;
            }
        }
    })
}

// Construct Profile Screen Job Item
const constructProfileJob = (job, name) => {
    const profileJobTemplate = document.getElementById('profile-job-item-template').cloneNode(true);
    profileJobTemplate.removeAttribute('id');
    profileJobTemplate.setAttribute('id', `job-${job.id}`);

    const [title, postedInfo, hr, content, hr2, modify] = profileJobTemplate.children;
    const [img, startDesc] = content.children;
    // Title
    title.textContent = `${job.title}`;
    // Posted Info
    postedInfo.children[0].textContent = `${name}`;
    postedInfo.children[0].setAttribute('id', `profile-${job.creatorId}`);
    postedInfo.children[1].textContent = `Posted: ${getJobDate(job.createdAt)}`;
    // Image
    img.setAttribute('src', job.image);
    // Start Date
    startDesc.children[0].textContent = `Start date: ${formatDate(new Date(job.start))}`
    // Description
    startDesc.children[1].textContent = job.description;

    const [updateButton, deleteButton] = modify.children;

    // Update and Delete Listeners
    updateButton.job = job;
    deleteButton.jobId = job.id;
    updateButton.addEventListener('click', handleJobUpdate);
    deleteButton.addEventListener('click', handleJobDelete);

    return profileJobTemplate;
}

// Construct Profile Watchee Item
const constructProfileWatchee = (id, name) => {
    const watcheeTemplate = document.getElementById('profile-watchee-item-template').cloneNode(true);
    watcheeTemplate.removeAttribute('id');
    watcheeTemplate.setAttribute('id', `profile-${id}`);
    const profileButton = watcheeTemplate.children[0];
    profileButton.textContent = name;
    profileButton.userId = id;
    profileButton.addEventListener('click', handleProfileWatcheeButton);
    return watcheeTemplate;
}
// #endregion


//* Dashboard Screen
// #region
const loadDashboardScreen = () => {
    if (state.user.isLoggedIn) {
        // Change Navbar links
        document.getElementById('nav-login').classList.add('hidden');
        document.getElementById('nav-register').classList.add('hidden');
        document.getElementById('nav-dashboard').classList.remove('hidden');
        
        // Set up Navbar Logged in user
        API.getUser(state.user.userToken, state.user.userId).then(res => {
            if (res.error) {
                showError(res.error);
            } else {
                hideError();
                document.getElementById('nav-user-container').classList.remove('vis-hidden');
                document.getElementById('nav-user').textContent = res.name;
                document.getElementById('nav-user').addEventListener('click', handleNavUserProfile);
            }
        })
        // Handle Email search
        document.getElementById('search-email').addEventListener('click', handleEmailSearch);
        // Handle New Job
        document.getElementById('dashboard-new-job').addEventListener('click', handleNewJob);
        // Load Initial Job Feed
        const feedList = document.getElementById('job-list');
        clearList(feedList);
        state.currentJobPage = 1;
        constructJobFeed(state.currentJobPage);
    }
}
// #endregion


//* Profile Screen
// #region
const loadProfileScreen = (userId) => {
    const id = Number.parseInt(userId, 10);
    // Profile User JSON
    API.getUser(state.user.userToken, id).then(res => {
        if (res.error) showError(res.error);
        else {
            hideError();
            const [nameEmailButtons, img] = document.getElementById('profile-container').children;
            const [name, email, buttons] = nameEmailButtons.children;
            const [update, watch] = buttons.children;
            const jobs = document.getElementById('profile-job-list');
            const watchedBy = document.getElementById('profile-watchee-list');
            const watchedTitle = watchedBy.parentElement.children[0];

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
                watch.userId = id;
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
            watchedTitle.textContent = `Watched by ${res.watcheeUserIds.length} User${res.watcheeUserIds.length === 1 ? "" : "s"}`;
            if (res.watcheeUserIds.length === 0) {
                const noWatchees = document.createElement('li');
                noWatchees.classList.add('list-group-item');
                noWatchees.textContent = "No users watching";
                watchedBy.appendChild(noWatchees);
            } else {
                res.watcheeUserIds.forEach((watcheeId, index) => {
                    API.getUser(state.user.userToken, watcheeId).then(watchee => {
                        if (watchee.error) {
                            showError(watchee.error);
                        } else {
                            hideError();
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
const loadProfileUpdateScreen = (prevUser) => {
    const { email, name } = document.forms['update-profile-form'];
    email.setAttribute('placeholder', prevUser.email);
    name.setAttribute('placeholder', prevUser.name);
    document.getElementById('update-profile-button').setAttribute('data-id', prevUser.id);
    if (prevUser.image) document.getElementById('update-profile-image').setAttribute('src', prevUser.image);
    document.getElementById('update-profile-button').addEventListener('submit', handleUpdateProfile);
}
// #endregion


//* Update Job Screen
// #region
const loadUpdateJobScreen = (job) => {
    const { title, start, description, previmage } = document.getElementById('update-job-form');
    title.value = job.title;
    start.value = job.start;
    description.value = job.description;
    previmage.src = job.image;
    document.getElementById('update-job-button').setAttribute('data-id', job.id);
}
// #endregion


//* Event Listeners
document.getElementById('nav-login').addEventListener('click', handleNavLogin);
document.getElementById('nav-register').addEventListener('click', handleNavRegister);
document.getElementById('nav-dashboard').addEventListener('click', handleNavDashboard);
document.getElementById('login-button').addEventListener('click', handleLogin);
document.getElementById('switch-register').addEventListener('click', handleSwitchRegister);
document.getElementById('register').addEventListener('click', handleRegister);
document.getElementById('new-job-button').addEventListener('click', handleSubmitNewJob);
document.getElementById('update-job-button').addEventListener('click', handleUpdateJobButton);
document.getElementById('add-comment-button').addEventListener('click', handleAddComment);
document.getElementById('page-back').addEventListener('click', handlePageBack);
document.getElementById('page-next').addEventListener('click', handlePageNext);
