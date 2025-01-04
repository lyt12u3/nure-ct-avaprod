(function (Backendless) {
    // const APPLICATION_ID = 'A1D0E797-A8A7-4894-9F4B-CB04B16E36D9';
    // const SECRET_KEY = '627D5872-C92C-4224-968A-03655A6E1807';
    const APPLICATION_ID = '3A3C6A0A-0ACE-4124-AB1B-7B78131E868D';
    const SECRET_KEY = '9BA9FD39-C4C9-4155-8634-5C42EB7A55FB';
  
    if (!APPLICATION_ID || !SECRET_KEY) {
      alert("Missing application ID or secret key arguments. Login to Backendless Console, select your app and get the ID and key from the Manage > App Settings screen. Copy/paste the values into the Backendless.initApp call.");
    }
  
    Backendless.initApp(APPLICATION_ID, SECRET_KEY);

    function initEventHandlersLogin() {
      document.getElementById('login-btn').addEventListener('click', loginUser);
    }
    window.initEventHandlersLogin = initEventHandlersLogin;

    function initEventHandlersRegister() {
      document.getElementById('register-btn').addEventListener('click', createUser);
    }
    window.initEventHandlersRegister = initEventHandlersRegister;

    function initEventHandlersRecover() {
      document.getElementById('forgot-password-btn').addEventListener('click', resetPassword);
    }
    window.initEventHandlersRecover = initEventHandlersRecover;
    
    Backendless.UserService.getCurrentUser()
        .then(currentUser => {
          if (currentUser) {
            console.log("User is logged in");
            showInfo("Session restored");
            setTimeout(() => {
              window.location.href = "../file-managment/file-managment.html";
            }, 1000);
          }
        })
        .catch(onError);

    function createUser() {
      const user = new Backendless.User();
  
      document.querySelectorAll('.register-field').forEach(input => {
        user[input.name] = input.name === 'age' ? Number(input.value) : input.value;
      });
  
      if (!validateEmail(user.email)) {
        showInfo("Invalid email address");
        return;
      }
  
      if (user.age < 5) {
        showInfo("Registration is not allowed for users under 5 years old");
        return;
      }
  
      if (!user.password || !user.email || !user.name || !user.age || !user.gender || !user.country) {
        showInfo("All fields are required");
        return;
      }
  
      showInfo('Creating user and setting up file structure...');
  
      Backendless.UserService.register(user)
        .then(registeredUser => {
          return createUserFolder(registeredUser.name);
        })
        .then(() => {
          return createSharedFolder(user.name);
        })
        .then(() => {
          showInfo("User successfully created and file structure set up");
        })
        .catch(onError);
    }
  
    function createUserFolder(username) {
      const folderPath = `/${username}`;
      return Backendless.Files.createDirectory(folderPath);
    }
  
    function createSharedFolder(username) {
      const sharedFolderPath = `users/${username}/shared_with_me`;
      return Backendless.Files.createDirectory(sharedFolderPath);
    }
  
    function loginUser() {
      const login = {};
  
      document.querySelectorAll('.login-field').forEach(input => {
        login[input.name] = input.value;
      });
  
      showInfo('Logging in...');
  
      Backendless.UserService.login(login.username, login.password, true)
        .then(user => {
          if (user) {
            showInfo("Login successful");
            setTimeout(() => {
              window.location.href = "../file-managment/file-managment.html";
            }, 1000);
          } else {
            showInfo("Login failed");
          }
        })
        .catch(error => {
          loginError('Login error', login.username, login.password, error);
        });
    }
  
    function resetPassword() {
      const email = document.getElementById('forgot-password-email').value;
  
      showInfo('Sending password reset email...');
  
      Backendless.UserService.restorePassword(email)
        .then(() => {
          showInfo("Password reset instructions have been sent to your email");
        })
        .catch(onError);
    }

    function loginError(logger, username, password, error) {
      if (error.code === 3003) {
        showInfo(error.message || "An error occurred");
        Backendless.Logging.getLogger(logger).error(
          `Invalid login or password. Username: '${username}', password: '${password}'`
        );
      } else {
        console.error("An error occurred:", error);
        showInfo(error.message || "An error occurred");
      }
    }

    function logoutUser() {
        showInfo('Logging out...');
    
        Backendless.UserService.logout()
            .then(() => showInfo("User logged out successfully"))
            .then(() => console.log("Logged out from first page"))
            .catch(err => console.error("Error during logout:", err));
    }
  
    function validateEmail(email) {
      const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      return re.test(String(email).toLowerCase());
    }
  
    function onError(error) {
      console.error("An error occurred:", error);
      showInfo(error.message || "An error occurred");
    }
  
    function showInfo(text) {
        const messageElement = document.getElementById('message');
        messageElement.textContent = text;
        messageElement.classList.add('visible');
        
        setTimeout(() => {
          messageElement.classList.remove('visible');
        }, 6000);
      }
      
  })(Backendless);