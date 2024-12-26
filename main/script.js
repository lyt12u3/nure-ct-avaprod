(function (Backendless) {
    const APPLICATION_ID = 'A1D0E797-A8A7-4894-9F4B-CB04B16E36D9';
    const SECRET_KEY = '627D5872-C92C-4224-968A-03655A6E1807';
  
    if (!APPLICATION_ID || !SECRET_KEY) {
      alert("Missing application ID or secret key arguments. Login to Backendless Console, select your app and get the ID and key from the Manage > App Settings screen. Copy/paste the values into the Backendless.initApp call.");
    }
  
    init();
  
    function init() {
      Backendless.initApp(APPLICATION_ID, SECRET_KEY);
      initEventHandlers();
    }
  
    function initEventHandlers() {
      document.getElementById('logout-btn').addEventListener('click', logoutUser);
      document.getElementById('create-folder-btn').addEventListener('click', createFolder);
      document.getElementById('delete-folder-btn').addEventListener('click', deleteFolder);
      document.getElementById('list-files-btn').addEventListener('click', filesList);
      document.getElementById('upload-button').addEventListener('click', uploadFile);
      document.getElementById('download-button').addEventListener('click', downloadFile);
      document.getElementById('delete-button').addEventListener('click', deleteFile);
      document.getElementById('share-file-button').addEventListener('click', shareFile);
      document.getElementById('view-shared-files-button').addEventListener('click', viewSharedFiles);
    }

    Backendless.UserService.getCurrentUser()
        .then(currentUser => {
          if (!currentUser) {
            console.log("User is not logged in");
            showInfo("Please login first");
            setTimeout(() => {
              window.location.href = "../login/index.html";
            }, 1000);
          }
        })
        .catch(onError);

    // 3: СТВОРЕННЯ ПАПКИ
    function createFolder() {
      Backendless.UserService.getCurrentUser()
        .then(currentUser => {
          if (!currentUser) {
            showInfo("Please login first");
            return;
          }
    
          const folderName = document.getElementById('create-folder-name').value;
          if (!folderName) {
            showInfo("Please enter a folder name");
            return;
          }
    
          const path = `/${currentUser.name}/${folderName}`;
    
          Backendless.Files.createDirectory(path)
            .then(() => {
              showInfo(`Folder "${folderName}" created successfully`);
            })
            .catch(onError);
        })
        .catch(onError);
    }

    // 4: ВИДАЛЕННЯ ПАПКИ
    function deleteFolder() {
      Backendless.UserService.getCurrentUser()
        .then(currentUser => {
          if (!currentUser) {
            showInfo("Please login first");
            return;
          }
    
          const folderName = document.getElementById('delete-folder-name').value;
          if (!folderName) {
            showInfo("Please enter a folder name");
            return;
          }
    
          const path = `/${currentUser.name}/${folderName}`;
    
          Backendless.Files.remove(path)
            .then(() => {
              showInfo(`Folder "${folderName}" deleted successfully`);
            })
            .catch(onError);
        })
        .catch(onError);
    }

    // 5: ПЕРЕГЛЯД ФАЙЛІВ
    function filesList() {
      Backendless.UserService.getCurrentUser()
        .then(currentUser => {
          if (!currentUser) {
            showInfo("Please login first");
            return;
          }

          const folderName = document.getElementById('show-files-folder-name').value;
    
          const path = `/${currentUser.name}/${folderName}`;
    
          Backendless.Files.listing(path)
            .then(function (files) {
              var fileList = files.map(function(file) {
                return file.name;
              }).join(', ');
              showInfo(`Files in "${path}" directory: ${fileList}`);
            })
            .catch(onError);
        })
        .catch(onError);
    }

    // 7: ЗАВАНТАЖЕННЯ ФАЙЛУ НА СЕРВЕР
    function uploadFile() {
      Backendless.UserService.getCurrentUser()
        .then(currentUser => {
          if (!currentUser) {
            showInfo("Please login first");
            return;
          }
    
          const fileInput = document.getElementById('file-input');
          const folderName = document.getElementById('folder-name').value;

          if (!fileInput.files.length) {
            showInfo("Please select a file");
            return;
          }
    
          const file = fileInput.files[0];
          const path = `/${currentUser.name}/${folderName}`;
    
          Backendless.Files.upload(file, path, true)
            .then(uploadedFile => {
              showInfo(`File uploaded successfully`);
              console.log(uploadedFile);
            })
            .catch(error => {
              console.error("Upload failed", error);
              showInfo("File upload failed");
            })
            .catch(onError);
        })
        .catch(onError);
    }

    // 8: ЗАВАТНАЖЕННЯ ФАЙЛУ З СЕРВЕРУ
    function downloadFile() {
      Backendless.UserService.getCurrentUser()
        .then(currentUser => {
          if (!currentUser) {
            showInfo("Please login first");
            return;
          }
    
          const filePath = document.getElementById('file-path').value;
    
          if (!filePath) {
            showInfo("Please specify the file path");
            return;
          }
    
          const fullPath = `${currentUser.name}/${filePath}`;

          const baseFileURL = Backendless.appPath + "/files/";
          const fileURL = baseFileURL + fullPath;

          fetch(fileURL)
          .then(response => {
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.blob();
          })
          .then(blob => {
            const a = document.createElement('a');
            const url = window.URL.createObjectURL(blob);
            a.href = url;
            a.download = filePath.split('/').pop();
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            showInfo(`File "${filePath}" downloaded successfully`);
          })
          .catch(error => {
            console.error("Error downloading file:", error);
            showInfo("Failed to download file");
          });
        })
        .catch(onError);
    }

    // 9: ВИДАЛЕННЯ ФАЙЛУ НА СЕРВЕРІ
    function deleteFile() {
      Backendless.UserService.getCurrentUser()
        .then(currentUser => {
          if (!currentUser) {
            showInfo("Please login first");
            return;
          }
    
          const filePath = document.getElementById('delete-file-path').value;
    
          if (!filePath) {
            showInfo("Please specify the file path");
            return;
          }
    
          const fullPath = `/${currentUser.name}/${filePath}`;
    
          Backendless.Files.remove(fullPath)
            .then(() => {
              showInfo(`File "${filePath}" deleted successfully`);
            })
            .catch(error => {
              console.error("Error deleting file:", error);
              showInfo("Failed to delete file");
            });
        })
        .catch(onError);
    }

    // 11: ШАРИНГ ФАЙЛУ
    function shareFile() {
      let filePath = document.getElementById('file-to-share').value;
      let targetUsername = document.getElementById('user-to-share').value;
      console.log("File path: " + filePath);
      console.log("Target username: " + targetUsername);
    
      if (!filePath || !targetUsername) {
        showInfo("Please specify both file path and username.");
        return;
      }
    
      Backendless.UserService.getCurrentUser()
        .then(currentUser => {
          if (!currentUser) {
            showInfo("Please login first.");
            return;
          }
    
          Backendless.Data.of("Users").findFirst({ name: targetUsername })
            .then(targetUser => {
              if (!targetUser) {
                showInfo("User not found.");
                return;
              }
    
              let fullPath = `${currentUser.name}/${filePath}`;
              let sharedFolderPath = `/${targetUsername}/shared_with_me/`;
              console.log("Shared folder path: " + sharedFolderPath);
    
              let baseFileURL = Backendless.appPath + "/files/";
              let fileURL = baseFileURL + fullPath;
    
              let linkFileName = filePath.split('/').pop();
              let linkFilePath = `${sharedFolderPath}${linkFileName}.txt`;
    
              Backendless.Files.saveFile(sharedFolderPath, `${linkFileName}.txt`, new Blob([fileURL], { type: 'text/plain' }))
                .then(() => {
                  showInfo(`File shared successfully. Link created at: ${linkFilePath}`);
                })
                .catch(onError);
            })
            .catch(onError);
        })
        .catch(onError);
    }

    // 12: ПЕРЕГЛЯД СПІЛЬНИХ ФАЙЛІВ 
    function viewSharedFiles() {
      Backendless.UserService.getCurrentUser()
        .then(currentUser => {
          if (!currentUser) {
            showInfo("Please login first.");
            return;
          }
    
          const sharedFolderPath = `/${currentUser.name}/shared_with_me/`;
    
          Backendless.Files.listing(sharedFolderPath)
            .then(files => {
              if (!files.length) {
                showInfo("No files in 'shared with me'.");
                return;
              }
              
              let fileList = document.getElementById('sharedFilesList')
              if (!fileList) {
                fileList = document.createElement('ul');
                fileList.id = 'sharedFilesList';
              }
              fileList.innerHTML = "";
    
              files.forEach(file => {
                const listItem = document.createElement('li');
                listItem.textContent = file.name;
    
                const viewButton = document.createElement('button');
                viewButton.textContent = "View";
                viewButton.addEventListener('click', () => followLink(sharedFolderPath, file.name));
    
                listItem.appendChild(viewButton);
                fileList.appendChild(listItem);

                const form = document.getElementById('viewSharedFilesForm');
                form.appendChild(fileList);
              });
            })
            .catch(onError);
        })
        .catch(onError);
    }
    
    function followLink(folderPath, fileName) {
      event.preventDefault();
      const filePath = `${folderPath}${fileName}`;
    
      const fileURL = Backendless.appPath + "/files/" + filePath;
    
      fetch(fileURL)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.statusText}`);
          }
          return response.text();
        })
        .then(link => {
          window.open(link.trim(), "_blank");
          showInfo(`Opening file`);
        })
        .catch(error => {
          console.error("Error following link:", error);
          showInfo("Failed to open file link.");
        });
    }

    function logoutUser() {
        showInfo('Logging out...');
    
        Backendless.UserService.logout()
            .then(() => showInfo("User logged out successfully"))
            .then(() => window.location.href = "../login/index.html")
            .catch(err => console.error("Error during logout:", err));
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