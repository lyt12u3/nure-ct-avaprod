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
    document.getElementById("file-management-btn").addEventListener("click", () => {
      window.location.href = "../file-managment/file-managment.html";
    });
    document.getElementById("feedback-btn").addEventListener("click", () => {
      window.location.href = "../feedback/feedback.html";
    });
    document.getElementById("friends-btn").addEventListener("click", () => {
      window.location.href = "../friends/friends.html";
    });
    document.getElementById('add-place-btn').addEventListener('click', addPlace);
    document.getElementById('delete-place-btn').addEventListener('click', deletePlace);
    document.getElementById('use-my-coordinates-btn').addEventListener('click', useMyCoordinates);
    document.getElementById("search-places-btn").addEventListener("click", searchPlaces);
    document.getElementById("search-place-like-btn").addEventListener("click", likePlace);
    document.getElementById("view-my-places-btn").addEventListener("click", viewMyPlaces);
    document.getElementById("view-on-map-btn").addEventListener("click", viewOnMap);
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

        var photo = document.getElementById("place-photo-input");

        if (photo.files.length > 0) {
          var file = photo.files[0];
          var path = `pictures/users/${currentUser.objectId}/places/${Date.now()}_${file.name}`;

          Backendless.Files.upload(file, path, true)
            .then((uploadedFile) => {
              var fileUrl = uploadedFile.fileURL;
              place["photo"] = fileUrl;
              updatePlaceTable(place);
            })
            .catch(onError);
        } else {
          updatePlaceTable(place);
        }
      })
      .catch(onError);
  }

  function useMyCoordinates() {
    navigator.geolocation.getCurrentPosition((position) => {
      document.getElementById("place-latitude").value = position.coords.latitude;
      document.getElementById("place-longitude").value = position.coords.longitude;
    });
  }

  function updatePlaceTable(place) {
    Backendless.Data.of("Place")
      .save(place)
      .then((savedPlace) => {
        showInfo(`Place "${savedPlace.name}" added successfully.`);
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

        Backendless.Data.of("Place")
          .findFirst({
            where: `name = '${placeName}' AND ownerId = '${currentUser.objectId}'`,
          })
          .then((place) => {
            if (place) {
              showInfo("Place deleted successfully")
              return Backendless.Data.of("Place").remove(place);
            } else {
              showInfo("You can only delete your own places or the place may not exist.");
              return;
            }
          })
          .catch(onError);
      })
      .catch(onError);
  }

  // SEARCH PLACES
  function searchPlaces() {
    var searchQuery = document.getElementById("place-search-name").value;
    var searchCategory = document.getElementById("place-search-category").value;
    var radius = parseFloat(document.getElementById("search-radius").value);

    showInfo("Search");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        var whereClauses = [];
        if (searchQuery) whereClauses.push(`name LIKE '%${searchQuery}%'`);
        if (searchCategory) whereClauses.push(`category = '${searchCategory}'`);

        var queryBuilder = Backendless.DataQueryBuilder.create();
        queryBuilder.setWhereClause(whereClauses.join(" AND "));
        queryBuilder.setProperties([
          "objectId",
          "name",
          "category",
          "description",
          "location",
          "hashtags",
          "photo",
        ]);
        queryBuilder.setPageSize(20);

        Backendless.Data.of("Place")
          .find(queryBuilder)
          .then((places) => {
            var resultsContainer = document.getElementById("search-results");
            if (places.length > 0) {
              resultsContainer.innerHTML = places
                .map((place) => {
                  var location = [place.location.x, place.location.y];
                  var distance = calculateDistance(position.coords.latitude, position.coords.longitude, place.location.y, place.location.x);

                  var locationText =
                    location && location.length === 2
                      ? `${location[0]}, ${location[1]}`
                      : "Not available";
                  
                  if (distance <= radius) {
                    var photoHtml;
                    if (place.photo) {
                      photoHtml = `<img src="${place.photo}" class="img-search">`;
                    }

                    return `${photoHtml}
                      <div style="margin-top: 20px; text-align: left;">
                        <strong>${place.name}</strong><br>
                        Category: ${place.category}<br>
                        Hashtags: ${place.hashtags}<br>
                        Location: ${locationText}
                      </div>
                      <hr style="margin-top: 20px;">
                    `;
                  }
                })
                .join("");
              
              if (resultsContainer.innerHTML.length > 0) {
                resultsContainer.innerHTML = resultsContainer.innerHTML + `
                  <button type="button" id="close-search-results" class="red-btn" style="width: auto;">Close Results</button>
                `;
                document.getElementById("close-search-results").addEventListener("click", () => {
                  document.getElementById("search-results").innerHTML = "";
                });
                showInfo("Places found successfully.");
              } else {
                resultsContainer.innerHTML =
                '<p style="margin-top: 20px;">No places found matching the criteria.</p>';
                showInfo("No places found.");
              }
            } else {
              resultsContainer.innerHTML =
                '<p style="margin-top: 20px;">No places found matching the criteria.</p>';
              showInfo("No places found.");
            }
          })
          .catch(onError);
      },
      (error) => {
        console.error("Geolocation error:", error);
        showInfo("Failed to retrieve current location.");
      }
    );
  }

  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const toRad = (value) => (value * Math.PI) / 180;
  
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
  
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
    const distance = R * c;
    return distance;
  }

  // LIKE PLACE
  function likePlace() {
    Backendless.UserService.getCurrentUser()
      .then((currentUser) => {
        if (!currentUser) {
          showInfo("Please login first");
          return;
        }

        var placeName = document.getElementById("like-place-name").value;

        Backendless.Data.of("Place")
          .findFirst({ where: `name = '${placeName}'` })
          .then((place) => {
            if (!place) {
              showInfo("Place not found.");
              return;
            }

            return Backendless.Data.of("Place_Likes")
              .findFirst({
                where: `placeId = '${place.objectId}' AND likedById = '${currentUser.objectId}'`,
              })
              .then((existingLike) => {
                if (existingLike) {
                  showInfo("You have already liked this place.");
                  return;
                }

                return Backendless.Data.of("Place")
                  .findFirst({
                    where: `name = '${placeName}'`,
                  })
                  .then((placeOwner) => {
                    const like = {
                      placeId: place.objectId,
                      likedById: currentUser.objectId,
                      postedById: placeOwner.ownerId,
                    };
                    
                    showInfo("Place liked successfully");
                    return Backendless.Data.of("Place_Likes").save(like);
                  });
              });
          })
          .catch(onError);
        })
        .catch(onError);
  }

  // VIEW MY PLACES
  function viewMyPlaces() {
    Backendless.UserService.getCurrentUser()
      .then((currentUser) => {
        if (!currentUser) {
          showInfo("Please login first");
          return;
        }

        Backendless.Data.of("Place")
          .find({ where: `ownerId = '${currentUser.objectId}'` })
          .then((places) => {
            var resultsContainer = document.getElementById("view-my-places-results");
            if (places.length > 0) {
              resultsContainer.innerHTML = places
                .map((place) => {
                  var location = [place.location.x, place.location.y];

                  var locationText =
                    location && location.length === 2
                      ? `${location[0]}, ${location[1]}`
                      : "Not available";
                  
                  var photoHtml;
                  if (place.photo) {
                    photoHtml = `<img src="${place.photo}" class="img-search">`;
                  }

                  return `${photoHtml}
                    <div style="margin-top: 20px; text-align: left;">
                      <strong>${place.name}</strong><br>
                      Category: ${place.category}<br>
                      Hashtags: ${place.hashtags}<br>
                      Location: ${locationText}
                    </div>
                    <hr style="margin-top: 20px;">
                  `;
                })
                .join("");
              
              if (resultsContainer.innerHTML.length > 0) {
                resultsContainer.innerHTML = resultsContainer.innerHTML + `
                  <button type="button" id="close-view-results" class="red-btn" style="width: auto;">Close Results</button>
                `;
                document.getElementById("close-view-results").addEventListener("click", () => {
                  document.getElementById("view-my-places-results").innerHTML = "";
                });
                showInfo("Places found successfully.");
              } else {
                resultsContainer.innerHTML =
                '<p style="margin-top: 20px;">No places found matching the criteria.</p>';
                showInfo("No places found.");
              }
            } else {
              resultsContainer.innerHTML =
                '<p style="margin-top: 20px;">No places found matching the criteria.</p>';
              showInfo("No places found.");
            }
          })
          .catch(onError);
      })
      .catch(onError);
  }

  // VIEW ON MAP
  function viewOnMap() {
    Backendless.UserService.getCurrentUser()
      .then((currentUser) => {
        if (!currentUser) {
          showInfo("Please login first");
          return;
        }

        var placeName = document.getElementById("view-on-map-name").value;

        Backendless.Data.of("Place")
          .findFirst({ where: `name = '${placeName}'` })
          .then((place) => {
            if (!place) {
              showInfo("Place not found.");
            }

            var latitude =  place.location.y;
            var longitude = place.location.x;

            var container = document.getElementById("map-container");

            var button = document.getElementById("view-on-map-btn");
            if (container.innerHTML.trim() === "") {
              button.textContent = "Hide Map";
              container.innerHTML = `<iframe 
                frameborder="10" 
                class="map-iframe"
                src="https://www.google.com/maps?q=${latitude},${longitude}&z=15&output=embed" 
                allowfullscreen>
              </iframe>`;
            } else {
              button.textContent = "View";
              container.innerHTML = "";
            }
          })
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
