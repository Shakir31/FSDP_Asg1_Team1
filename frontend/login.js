document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const googleLoginBtn = document.getElementById('googleLogin');
    const facebookLoginBtn = document.getElementById('facebookLogin');

    // login form submission
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        handleLogin();
    });

    // login handlers
    googleLoginBtn.addEventListener('click', handleGoogleLogin);
    facebookLoginBtn.addEventListener('click', handleFacebookLogin);
});

function handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;

    // validation
    if (!email || !password) {
        alert('Please fill in all fields');
        return;
    }

    console.log('Login attempt:', { email, rememberMe });
    alert('Login successful! Redirecting...');
}

function handleGoogleLogin() {
    console.log('Google login initiated');
    
    // to simulate Google OAuth process
    setTimeout(() => {
        alert('Google authentication successful!');
    }, 1000);
}

function handleFacebookLogin() {
    console.log('Facebook login initiated');
    
    // to simulate Facebook login process
    setTimeout(() => {
        alert('Facebook authentication successful!');
        // window.location.href = 'index.html';
    }, 1000);
}