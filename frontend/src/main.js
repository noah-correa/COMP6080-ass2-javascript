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
    if (args) cb(...args);
    else if (cb) cb();
    hideScreen(state.currentScreen);
    showScreen(id);
}
// #endregion


//* Error helper functions
// #region
const hideError = (id) => {
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
        changeScreen('dashboard-screen', loadDashboardScreen);
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

const handleSwitchRegister = (event) => {
    event.preventDefault();
    changeScreen('register-screen');
}
// #endregion


//* Register Screen
// #region
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
            console.log("User registered successfully");
            changeScreen('dashboard-screen', loadDashboardScreen);
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

const clearList = (parent, except=undefined) => {
    [...parent.children].forEach((child) => {
        if (except && except === child.id);
        else parent.removeChild(child);
    });
}

const handleProfileButton = (event) => {
    event.preventDefault();
    event.currentTarget.removeEventListener('click', handleProfileButton);
    document.getElementById('job-likes-modal-close').click();
    document.getElementById('job-comments-modal-close').click();
    changeScreen('profile-screen', loadProfileScreen, [event.currentTarget.userId]);
}

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
            // console.log(event.currentTarget);
            if (userLiked) {
                heartButton.classList.add('bi-star');
                heartButton.classList.remove('bi-star-fill');
            } else {
                heartButton.classList.add('bi-star-fill');
                heartButton.classList.remove('bi-star');
            }
            // heartButton.textContent = liked ? 'favorite_border' : 'favorite';
            liked = !liked;
            heartButton.removeEventListener('click', handleHeartButton);
            changeScreen('dashboard-screen', loadDashboardScreen);
        }
    });
}

const handleLikesModal = (event) => {
    event.preventDefault();
    // console.log("showing modal");
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
        // console.log(likesModalList);
    }
}

const handleAddComment = (event) => {
    event.preventDefault();
    const { jobId } = event.currentTarget;
    const comment = document.getElementById('add-comment-text').value;
    console.log(jobId, comment);
    API.addComment(state.user.userToken, jobId, comment).then(res => {
        if (res.error) showError(res.error);
        else {
            hideError();
            document.getElementById('job-comments-modal-close').click();
            changeScreen('dashboard-screen', loadDashboardScreen);
        }
    });

}

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

    // Likes/Comments Popup
    // const [likesPopup, commentsPopup] = popups.children;

    // Set inital icon state
    const icon = heartButton.children[0];
    let userLiked = job.likes.find((like) => {
        return like.userId === state.user.userId;
    });
    if (userLiked) {
        icon.classList.add('bi-star-fill');
        icon.classList.remove('bi-star');
    } else {
        icon.classList.add('bi-star');
        icon.classList.remove('bi-star-fill');
    }
    // icon.textContent = userLiked ? 'favorite' : 'favorite_border';

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

const constructJobFeed = (feed, page) => {
    API.getJobFeed(state.user.userToken, page).then(res => {
        if (res.error) {
            showError(res.error);
        } else if (res.length === 0) { 
            hideError();
            // Clear Job List
            clearList(feed);
            const noJobs = document.createElement('li');
            noJobs.classList.add('list-group-item');
            noJobs.textContent = "No jobs watched";
            feed.appendChild(noJobs);
            return false;
        } else {
            hideError();
            // Clear Job List
            clearList(feed);
            res.forEach((job, index) => {
                API.getUser(state.user.userToken, job.creatorId).then(userJson => {
                    if (userJson.error) {
                        showError(userJson.error);
                    } else {
                        hideError();
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
        if (res.error) showError(res.error);
        else {
            button.removeEventListener('click', handleEmailSearch);
            changeScreen('dashboard-screen', loadDashboardScreen);
        }
    })
}

const handleNavUserProfile = (event) => {
    event.preventDefault();
    event.currentTarget.removeEventListener('click', handleNavUserProfile);
    changeScreen('profile-screen', loadProfileScreen, [state.user.userId]);
}

const handleNewJob = (event) => {
    event.preventDefault();
    event.currentTarget.removeEventListener('click', handleNewJob);
    changeScreen('new-job-screen');
}

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
            watch.removeEventListener('click', handleWatchButton);
            changeScreen('profile-screen', loadProfileScreen, [userId]);
        }
    });
}

const handleProfileWatcheeButton = (event) => {
    event.preventDefault();
    const { userId } = event.currentTarget;
    event.currentTarget.removeEventListener('click', handleProfileWatcheeButton);
    changeScreen('profile-screen', loadProfileScreen, [userId]);
}

const handleJobUpdate = (event) => {
    event.preventDefault();
    console.log("updated job");
    event.currentTarget.removeEventListener('click', handleJobUpdate);
    changeScreen('update-job-screen', loadUpdateJobScreen, [event.currentTarget.job]);
}

const handleJobDelete = (event) => {
    event.preventDefault();
    console.log("deleted job");
    const deleteButton = event.currentTarget;
    const { jobId } = deleteButton;
    API.deleteJob(state.user.userToken, jobId).then(res => {
        if (res.error) showError(res.error);
        else {
            hideError();
            deleteButton.removeEventListener('click', handleJobDelete);
            changeScreen('profile-screen', loadProfileScreen, [state.user.userId]);
        }
    });
}

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

const loadProfileScreen = (userId) => {
    const id = Number.parseInt(userId, 10);
    // Profile User JSON
    API.getUser(state.user.userToken, id).then(res => {
        // console.log(res);
        if (res.error) showError(res.error);
        else {
            hideError();
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
            t2.textContent = `Watched by ${res.watcheeUserIds.length} User${res.watcheeUserIds.length === 1 ? "" : "s"}`;
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
        // console.log(data);
        API.updateProfile(state.user.userToken, data).then(res => {
            if (res.error) showError(res.error);
            else {
                if (data.name) document.getElementById('nav-user').textContent = data.name;
                event.currentTarget.removeEventListener('submit', handleUpdateProfile);
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
    document.getElementById('update-profile-button').addEventListener('submit', handleUpdateProfile);
}
// #endregion


//* New Job Screen
// #region
const handleNewJobButton = (event) => {
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
                        console.log(jobRes.id);
                    }
                });
                changeScreen('dashboard-screen', loadDashboardScreen);
            })
        }
    } catch {
        showError("Invalid image file");
    }
}
// #endregion


//* Update Job Screen
// #region
const handleUpdateJobButton = (event) => {
    event.preventDefault();
    const { title, start, description, image } = document.getElementById('update-job-form');
    const id = Number.parseInt(document.getElementById('update-job-button').getAttribute('data-id'), 10);
    // console.log(id);
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
        console.log(data);
        API.updateJob(state.user.userToken, data).then(res => {
            if (res.error) showError(res.error);
            else {
                event.currentTarget.removeEventListener('submit', handleUpdateProfile);
                changeScreen('profile-screen', loadProfileScreen, [state.user.userId]);
            }
        });

    }
}

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
document.getElementById('new-job-button').addEventListener('click', handleNewJobButton);
document.getElementById('update-job-button').addEventListener('click', handleUpdateJobButton);
document.getElementById('add-comment-button').addEventListener('click', handleAddComment);

