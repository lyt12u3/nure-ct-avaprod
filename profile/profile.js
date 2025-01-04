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
    document.getElementById("file-management-btn").addEventListener("click", () => {
      window.location.href = "../file-managment/file-managment.html";
    });
    document.getElementById("places-btn").addEventListener("click", () => {
      window.location.href = "../places/places.html";
    });
    document.getElementById("feedback-btn").addEventListener("click", () => {
      window.location.href = "../feedback/feedback.html";
    });
    document.getElementById("friends-btn").addEventListener("click", () => {
      window.location.href = "../friends/friends.html";
    });
    document.getElementById("update-profile-photo-btn").addEventListener("click", updatePhoto);
    document.getElementById('view-existing-photos-btn').addEventListener('click', modalWindow);
    document.getElementById('close-modal-btn').addEventListener('click', closeModal);
    document.getElementById('save-photo-btn').addEventListener('click', savePhoto);
    document.getElementById('save-profile-info').addEventListener('click', saveProfileInfo);
    document.getElementById('toggle-location-tracking').addEventListener('change', toggleLocationTracking);
  }

  Backendless.UserService.getCurrentUser()
    .then((currentUser) => {
      if (!currentUser) {
        console.log("User is not logged in");
        showInfo("Please login first");
        setTimeout(() => {
          window.location.href = "../login/login.html";
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

  // UPDATE PROFILE PHOTO
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
        console.log("file: " + file);
        const path = `pictures/users/${currentUser.objectId}/avatar/${Date.now()}_${file.name}`;

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

  // VIEW EXISTING PHOTOS
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

        let path = `pictures/users/${currentUser.objectId}/avatar/`;

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
                <input type="radio" name="selected_photo" style="border-color: none; box-shadow: none;" value="${file.publicUrl}">
              `;
              photosList.appendChild(label);
            });
    
            modal.style.display = "flex";
          })
          .catch(onError);
      })
      .catch(onError);
  }

  // SAVE PHOTO
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

  // UPDATE PROFILE INFORMATION
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
      })
      .catch(onError);
  }

  // ENABLE TRACKING
  let trackingInterval;
  function toggleLocationTracking() {
    Backendless.UserService.getCurrentUser()
      .then((currentUser) => {
        if (!currentUser) {
          showInfo("Please login first");
          return;
        }

        let checkbox = document.getElementById("toggle-location-tracking").checked;
        console.log(checkbox);
        // return;
        if (!checkbox) {
          clearInterval(trackingInterval);
          trackingInterval = null;
          showInfo("Location tracking disabled.");
        } else {
          showInfo("Location tracking enabled.");
          trackingInterval = setInterval(() => {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                var { latitude, longitude } = position.coords;
                currentUser["my location"] = {
                  type: "Point",
                  coordinates: [longitude, latitude],
                };
                Backendless.UserService.update(currentUser)
                  .then((updatedUser) => {
                    currentUser = updatedUser;
                    console.log("Location updated:", currentUser["my location"]);
                  })
                  .catch((error) =>
                    console.error("Error updating location:", error)
                  );
              },
              (error) => console.error("Geolocation error:", error),
              { enableHighAccuracy: true }
            );
          }, 60000);
        }
      })
      .catch(onError);
  }

  // ADD PLACE
  function addPlace() {
    Backendless.UserService.getCurrentUser()
      .then((currentUser) => {
        if (!currentUser) {
          showInfo("Please login first");
          return;
        }

        var latitude = parseFloat(document.getElementById("place-latitude").value);
        var longitude = parseFloat(
          document.getElementById("place-longitude").value
        );
        var place = {
          category: document.getElementById("place-category").value,
          description: document.getElementById("place-description").value,
          hashtags: document
            .getElementById("place-tags")
            .value.split(",")
            .join(","),
          location: { type: "Point", coordinates: [longitude, latitude] },
          name: document.getElementById("place-name").value,
          ownerId: currentUser.objectId,
        };

        Backendless.Data.of("Places")
          .save(place)
          .then((savedPlace) => {
            showInfo(`Place "${savedPlace.name}" added successfully.`);
          })
          .catch(onError);
      })
      .catch(onError);
  }

  // DELETE PLACE
  function deletePlace() {
    Backendless.UserService.getCurrentUser()
      .then((currentUser) => {
        if (!currentUser) {
          showInfo("Please login first");
          return;
        }

        var placeName = document.getElementById("place-to-delete").value;

        Backendless.Data.of("Places")
          .findFirst({
            where: `name = '${placeName}' AND ownerId = '${currentUser.objectId}'`,
          })
          .then((place) => {
            if (place) {
              return Backendless.Data.of("Places").remove(place);
            } else {
              showInfo("You can only delete your own places or the place may not exist.");
            }
          })
          .then(() => showInfo("Place deleted successfully"))
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
