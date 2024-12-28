(function (Backendless) {
  const APPLICATION_ID = "A1D0E797-A8A7-4894-9F4B-CB04B16E36D9";
  const SECRET_KEY = "627D5872-C92C-4224-968A-03655A6E1807";

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
    document.getElementById("file-management-btn").addEventListener("click", fileManagement);
    document.getElementById("update-profile-photo-btn").addEventListener("click", updatePhoto);
    document.getElementById('view-existing-photos-btn').addEventListener('click', modalWindow);
    document.getElementById('close-modal-btn').addEventListener('click', closeModal);
    document.getElementById('save-photo-btn').addEventListener('click', savePhoto);
    document.getElementById('save-profile-info').addEventListener('click', saveProfileInfo);
  }

  Backendless.UserService.getCurrentUser()
    .then((currentUser) => {
      if (!currentUser) {
        console.log("User is not logged in");
        showInfo("Please login first");
        setTimeout(() => {
          window.location.href = "../login/index.html";
        }, 1000);
      } else {
        document.getElementById("info-email").value = currentUser.email;
        document.getElementById("info-age").value = currentUser.age,
        document.getElementById("info-country").value = currentUser.country,
        document.getElementById("info-gender").value = currentUser.gender;

        if (currentUser.profilePhoto) {
          document.getElementById("profile-avatar").src =
            currentUser.profilePhoto;
        }
      }
    })
    .catch(onError);

  function fileManagement() {
    window.location.href = "../main/main.html";
  }

  function updatePhoto() {
    Backendless.UserService.getCurrentUser()
      .then((currentUser) => {
        if (!currentUser) {
          showInfo("Please login first");
          return;
        }

        const fileInput = document.getElementById("profile-photo-input");

        if (!fileInput.files.length) {
          showInfo("Please select a file");
          return;
        }

        const file = fileInput.files[0];
        const path = `/${currentUser.name}/avatar/${Date.now()}_${file.name}`;

        Backendless.Files.upload(file, path, true)
          .then((uploadedFile) => {
            showInfo(`File uploaded successfully`);
            let fileUrl = uploadedFile.fileURL;
            Backendless.UserService.update({
              objectId: currentUser.objectId,
              profilePhoto: fileUrl,
            })
              .then((updatedUser) => {
                currentUser = updatedUser;
                document.getElementById("profile-avatar").src = fileUrl;
                showInfo("Profile photo updated successfully.");
              })
              .catch(onError);
          })
          .catch(onError);
      })
      .catch(onError);
  }

  function modalWindow() {
    Backendless.UserService.getCurrentUser()
      .then((currentUser) => {
        if (!currentUser) {
          showInfo("Please login first");
          return;
        }
        const modal = document.getElementById('photos-modal');
        const photosList = document.getElementById('photos-list');

        photosList.innerHTML = "";

        let path = `/${currentUser.name}/avatar/`;

        Backendless.Files.listing(path)
          .then(files => {
            if (!files.length) {
              showInfo("No files");
              return;
            }

            files.forEach(file => {
              const label = document.createElement('label');
              label.innerHTML = `
                <img src="${file.publicUrl}" alt="${file.name}">
                <input type="radio" name="selected_photo" value="${file.publicUrl}">
              `;
              photosList.appendChild(label);
            });
    
            modal.style.display = "flex";
          })
          .catch(onError);
      })
      .catch(onError);
  }

  function savePhoto() {
    const selectedPhoto = document.querySelector('input[name="selected_photo"]:checked');

    if (!selectedPhoto) {
      showInfo("Please select a photo");
      return;
    }

    Backendless.UserService.getCurrentUser()
      .then((currentUser) => {
        if (!currentUser) {
          showInfo("Please login first");
          return;
        }

        Backendless.UserService.update({
          objectId: currentUser.objectId,
          profilePhoto: selectedPhoto.value,
        })
          .then((updatedUser) => {
            currentUser = updatedUser;
            document.getElementById("profile-avatar").src = selectedPhoto.value;
            showInfo("Profile photo updated successfully.");
            closeModal();
          })
          .catch(onError);
      })
  }

  function closeModal() {
    const modal = document.getElementById('photos-modal');
    modal.style.display = "none";
  }

  function saveProfileInfo() {
    Backendless.UserService.getCurrentUser()
      .then((currentUser) => {
        if (!currentUser) {
          showInfo("Please login first");
          return;
        }

        const profile = {
          email: document.getElementById("info-email").value,
          password: document.getElementById("info-password").value,
          age: Number(document.getElementById("info-age").value),
          country: document.getElementById("info-country").value,
          gender: document.getElementById("info-gender").value
        };

        Object.entries(profile).forEach(([key, value]) => {
          if (value) {
            currentUser[key] = value;
          }
        });

        Backendless.UserService.update(currentUser)
          .then(function (updatedUser) {
            currentUser = updatedUser;
            showInfo("Profile updated successfully");
          })
          .catch(onError);
        
        // Backendless.UserService.update({
        //   objectId: currentUser.objectId,
        //   ...profile,
        // })
        //   .then((updatedUser) => {
        //     currentUser = updatedUser;
        //     showInfo("Profile info updated successfully.");
        //   })
        //   .catch(onError);
      })
      .catch(onError);
  }

  function logoutUser() {
    showInfo("Logging out...");

    Backendless.UserService.logout()
      .then(() => showInfo("User logged out successfully"))
      .then(() => (window.location.href = "../login/index.html"))
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
