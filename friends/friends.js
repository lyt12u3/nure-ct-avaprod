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
      document.getElementById("feedback-btn").addEventListener("click", () => {
        window.location.href = "../feedback/feedback.html";
      });
      document.getElementById("add-friend-btn")?.addEventListener("click", addFriend);
      document.getElementById("view-my-requests-btn")?.addEventListener("click", viewMyRequests);
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


    function addFriend() {
        Backendless.UserService.getCurrentUser()
            .then((currentUser) => {
                var friendName = document.getElementById("friend-name").value;
                console.log("Adding friend:", friendName);

                if (!friendName) {
                    showInfo("Please enter friend's name.");
                    return;
                }

                if (!currentUser) {
                    showInfo("Please login first.");
                    return;
                }

                Backendless.Data.of("Users")
                    .findFirst({ where: `name = '${friendName}'` })
                    .then(friend => {
                        if (!friend) {
                            showInfo("User not found.");
                            return Promise.reject("User not found.");
                        }

                        Backendless.Data.of("FriendRequests")
                          .find({ where: `senderID = '${currentUser.objectId}' AND recipientID = '${friend.objectId}'` })
                          .then(requests => {
                            if (requests.length > 0) {
                              console.log(requests);
                              showInfo("Error! Friend request already sent");
                              return
                            }

                            const friendRequest = {
                              senderId: currentUser.objectId,
                              senderName: currentUser.name,
                              recipientID: friend.objectId,
                              recipientName: friend.name,
                              status: "pending"
                            };
  
                            showInfo("Friend request sent successfully");
  
                            return Backendless.Data.of("FriendRequests").save(friendRequest);
                          })
                          .catch(onError);
                    })
                    .catch(onError);
            })
            .catch(onError);
    }

    function viewMyRequests() {
        Backendless.UserService.getCurrentUser()
            .then((currentUser) => {
                if (!currentUser) {
                    showInfo("Please login first.");
                    return;
                }

                Backendless.Data.of("FriendRequests")
                    .find({ where: `recipientID = '${currentUser.objectId}' AND status = 'pending'` })
                    .then(requests => {
                        console.log("My requests:", requests);
                        showInfo("My requests: " + requests.length);

                        var resultsContainer = document.getElementById("view-my-requests-results");
                        resultsContainer.innerHTML = "";

                        if (requests.length > 0) {
                            requests.forEach(request => {
                                var text = document.createElement("p");
                                text.innerHTML = `<strong>${request.senderName}</strong>
                                wants to be your friend.`;

                                var acceptButton = document.createElement("button");
                                acceptButton.textContent = "Accept";
                                acceptButton.className = "green-btn";
                                acceptButton.type = "button";
                                acceptButton.style.width = "auto";

                                var rejectButton = document.createElement("button");
                                rejectButton.textContent = "Reject";
                                rejectButton.className = "red-btn";
                                rejectButton.type = "button";
                                rejectButton.style.width = "auto";
  
                                acceptButton.addEventListener('click', () => handleFriendRequest(request.objectId, 'accept'));
                                rejectButton.addEventListener('click', () => handleFriendRequest(request.objectId, 'reject'));

                                var chlidContainer = document.createElement("div");
                                chlidContainer.style.display = "flex";
                                chlidContainer.style.flexDirection = "column";
                                chlidContainer.style.alignItems = "center";
                                chlidContainer.style.margin = "10px";
                                chlidContainer.style.marginBottom = "20px";

                                chlidContainer.appendChild(text);
                                chlidContainer.appendChild(acceptButton);
                                chlidContainer.appendChild(rejectButton);

                                resultsContainer.appendChild(chlidContainer);
                                resultsContainer.appendChild(document.createElement("hr"));
                            });
                        } else {
                            resultsContainer.innerHTML = "<p>No friend requests found.</p>";
                        }
                    })
                    .catch(onError);
            })
            .catch(onError);
    }
  
    function handleFriendRequest(requestId, callback) {
      Backendless.UserService.getCurrentUser()
        .then((currentUser) => {
          if (!currentUser) {
            showInfo("Please login first.");
            return;
          }

          Backendless.Data.of("FriendRequests")
            .findById(requestId)
            .then(request => {
                if (!request || request.recipientID !== currentUser.objectId) {
                    console.error("Invalid request. Request data:", request);
                    showInfo("Invalid request.");
                    return Promise.reject("Invalid request.");
                }

                if (callback === "accept") {
                    return Backendless.Data.of("Users").findById(request.senderId)
                      .then(sender => {
                          if (!sender) {
                            console.error("Sender not found:", request.senderId);
                            showInfo("Sender not found.");
                            return Promise.reject("Sender not found.");
                          }

                          console.log(`Sender ID: ${request.senderId}`);
                          console.log(`Recipient ID: ${currentUser.objectId}`);

                          return Backendless.Data.of("Users").addRelation(currentUser.objectId, "friends", [request.senderId])
                            .then(() => Backendless.Data.of("Users").addRelation(request.senderId, "friends", [currentUser.objectId]))
                            .then(() => Backendless.Data.of("FriendRequests").remove(request));
                      });
                } else if (callback === "reject") {
                    return Backendless.Data.of("FriendRequests").remove(request);
                } else {
                    return Promise.reject("Invalid action.");
                }
            })
            .then(() => showInfo(`Friend request ${callback}ed successfully.`))
            .then(() => viewMyRequests())
            .catch(onError);
        })
        .catch(onError);
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
  