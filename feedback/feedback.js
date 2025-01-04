(function (Backendless) {
  // const APPLICATION_ID = "A1D0E797-A8A7-4894-9F4B-CB04B16E36D9";
  // const SECRET_KEY = "627D5872-C92C-4224-968A-03655A6E1807";
  const APPLICATION_ID = '3A3C6A0A-0ACE-4124-AB1B-7B78131E868D';
  const SECRET_KEY = '9BA9FD39-C4C9-4155-8634-5C42EB7A55FB';

  if (!APPLICATION_ID || !SECRET_KEY) {
    alert(
      "Missing application ID or secret key arguments. Login to Backendless Console, select your app and get the ID and key from the Manage > App Settings screen. Copy/paste the values into the Backendless.initApp call."
    );
  }

  init();

  function init() {
    Backendless.initApp(APPLICATION_ID, SECRET_KEY);
    initEventHandlers();
  }

  function initEventHandlers() {
    document.getElementById("logout-btn").addEventListener("click", logoutUser);
    document.getElementById('user-profile-btn').addEventListener('click', () => {
      window.location.href = '../profile/profile.html';
    });
    document.getElementById("places-btn").addEventListener("click", () => {
      window.location.href = "../places/places.html";
    });
    document.getElementById("file-management-btn").addEventListener("click", () => {
      window.location.href = "../file-managment/file-managment.html";
    });
    document.getElementById("friends-btn").addEventListener("click", () => {
      window.location.href = "../friends/friends.html";
    });
    document.getElementById("send-feedback-btn")?.addEventListener("click", sendFeedback);
  }

  Backendless.UserService.getCurrentUser()
    .then((currentUser) => {
      if (!currentUser) {
        console.log("User is not logged in");
        showInfo("Please login first");
        setTimeout(() => {
          window.location.href = "../login/login.html";
        }, 1000);
      }
    })
    .catch(onError);

    function sendFeedback() {
      console.log("Sending feedback");
      var theme = document.getElementById("feedback-theme").value;
      var message = document.getElementById("feedback-message").value;
      console.log(`Theme: ${theme}, Message: ${message}`);
  
      if (!theme || !message) {
        showInfo("Please, provie a message and theme");
        return;
      }
  
      var bodyParts = new Backendless.Bodyparts();
      bodyParts.textmessage = message;
  
      var recipient = ["vladyslav.bohuslavskyi@nure.ua"];
      var subject = theme;
      var attachment = null;
      
      console.log(`Recipient: ${recipient}, Subject: ${subject}, Body: ${bodyParts}`);

      Backendless.Messaging.sendEmail(subject, bodyParts, recipient, attachment)
      console.log("Email has been sent");
      showInfo("Email has been sent");
    }

  function logoutUser() {
    showInfo("Logging out...");

    Backendless.UserService.logout()
      .then(() => showInfo("User logged out successfully"))
      .then(() => (window.location.href = "../login/login.html"))
      .catch((err) => console.error("Error during logout:", err));
  }

  function onError(error) {
    console.error("An error occurred:", error);
    showInfo(error.message || "An error occurred");
  }

  function showInfo(text) {
    const messageElement = document.getElementById("message");
    messageElement.textContent = text;
    messageElement.classList.add("visible");

    setTimeout(() => {
      messageElement.classList.remove("visible");
    }, 6000);
  }
})(Backendless);
