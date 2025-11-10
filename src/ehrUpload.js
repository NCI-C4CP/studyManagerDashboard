import { updateNavBar } from "./navigationBar.js";
import { getIdToken, hideAnimation, showAnimation, triggerNotificationBanner, baseAPI, escapeHTML } from "./utils.js";

let fileState = {
  // invalidFileNames: [],
  fileExtension: "", // ".csv" | ".csv.gz" | ".parquet". Cannot be mixed in one upload.
  toBeSelectedDuplicate: [],
  selected: [],
  toBeUploadedDuplicate: [],
  toBeUploaded: [],
  // uploadedFileNames: [],
  prevDelivery: { name: "", uploadedFileNames: [] },
  currDelivery: { name: "", uploadedFileNames: [] },
};
let modalStatus = ""; // "" | "duplicateSelection" | "missingOptionalFiles" | "duplicateUploads"
const validExtensions = [".csv", ".csv.gz", ".parquet"];
const ehrRequiredNames = [
  "person",
  "visit_occurrence",
  "visit_detail",
  "condition_occurrence",
  "drug_exposure",
  "procedure_occurrence",
  "device_exposure",
  "measurement",
  "observation",
  "death",
  "specimen",
  "cdm_source",
  "concept",
  "vocabulary",
];
const ehrOptionalNames = [
  "concept_class",
  "concept_relationship",
  "concept_synonym",
  "concept_ancestor",
  "drug_strength",
  "relationship",
  "domain",
  "source_to_concept_map",
  "observation_period",
  "drug_era",
  "condition_era",
  "dose_era",
  "provider",
  "care_site",
  "location",
  "cost",
  "payer_plan_period",
  "note_nlp",
  "note",
  "fact_relationship",
  "episode",
  "episode_event",
  "cohort",
  "cohort_definition",
  "metadata",
  "attribute_definition",
];
const validNames = [...ehrRequiredNames, ...ehrOptionalNames];

const checkEhrFileName = (filename) => {
  const result = { name: "", ext: "", isValid: false };
  const filenameLower = filename.toLowerCase();
  for (const ext of validExtensions) {
    if (filenameLower.endsWith(ext)) {
      result.name = filenameLower.slice(0, -ext.length);
      result.ext = ext;
      break;
    }
  }

  if (validNames.includes(result.name) && validExtensions.includes(result.ext)) {
    result.isValid = true;
  }

  return result;
};

const setupEhrUploadPage = () => {
  return `
    <div class="container" id="ehrUploadPage">
      <div id="alert_placeholder"></div>
            <div class="row">
                <div class="col-md-12">
                    <h3 style="text-align: center;">Select EHR Files</h3>
                    <form id="uploadForm" enctype="multipart/form-data" style="margin-bottom: 18px;">
                        <input type="file" id="fileInput" name="files" style="display: none;" multiple>
                        <div style="display: flex; align-items: stretch; gap: 18px;">
                            <div style="flex: 1 1 auto;">
                                <div id="dropBox">
                                    <div style="color:#888; font-size:1.1rem; margin-bottom:8px;" id="dropHint">
                                    Drop files here for uploading
                                    <br>
                                Or <a href="#" id="selectFilesLink" style="color:#1976d2; text-decoration:none;">choose your files</a>
                                </div>
                                <div id="selectedFileNames"></div>
                            </div>
                        </div>
                        <div style="display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
                            <button type="submit" class="btn btn-primary" id="uploadBtn" disabled style="margin-top:0;">
                                Upload
                            </button>
                        </div>
                    </div>
                </form>
                <div id="uploadedFilesWrapper" style="margin-top: 24px; display: none;">
                  <h3 style="text-align: center;">Uploaded EHR Files in Today's Delivery</h3>
                  <div id="uploadedFilesBox" style="border: 2px solid #0078d7; padding: 15px; border-radius: 0.5rem; background: #f8faff">
                      <div id="uploadedFileNames"></div>
                  </div>
                </div>

                <div class="modal fade" id="warningModal" tabindex="-1" role="dialog">
                  <div class="modal-dialog modal-dialog-centered" role="document">
                    <div class="modal-content" style="border-radius:8px;">
                      <div class="modal-header" style="border-bottom:none; background-color:#fff3cd">
                        <h5 class="modal-title" id="warningModalLabel" style="color:black; border-radius:4px; padding:6px 12px;">Duplicate Selection</h5>
                      </div>
                      <div class="modal-body" style="text-align:left;">
                        <div id="warningModalBody"></div>
                      </div>
                      <div class="modal-footer" style="border-top:none; justify-content:center;">
                        <button id="proceedBtn" class="btn btn-warning" style="margin-right:12px;">Replace</button>
                        <button id="cancelBtn" class="btn btn-secondary">Cancel</button>
                      </div>
                    </div>
                  </div>
                </div>
            </div>
        </div>
    </div>
    `;
};

const showWarningModal = (headingText, msg, stringArray, modalNewStatus = "", proceedBtnText = "Replace") => {
  if (!headingText || !msg || !Array.isArray(stringArray) || stringArray.length === 0 || modalNewStatus === "") return;

  document.querySelector("#warningModalLabel").textContent = headingText;
  const warningDiv = document.querySelector("#warningModalBody");
  warningDiv.textContent = msg;
  const ulEle = document.createElement("ul");
  stringArray.sort().forEach((str) => {
    const liEle = document.createElement("li");
    liEle.textContent = str;
    ulEle.appendChild(liEle);
  });
  warningDiv.appendChild(ulEle);
  document.querySelector("#proceedBtn").textContent = proceedBtnText;
  modalStatus = modalNewStatus;
  // Todo: Remove JQuery after migration to Bootstrap 5
  // const modal = new bootstrap.Modal("#warningModal", { backdrop: "static", keyboard: false });
  // modal.show();
  $("#warningModal").modal({ backdrop: "static", keyboard: false });
};

const hideWarningModal = () => {
  // Todo: Remove JQuery after migration to Bootstrap 5
  // const modal = new bootstrap.Modal("#warningModal", { backdrop: "static", keyboard: false });
  // modal.hide();
  $("#warningModal").modal("hide");
};

const selectNewFiles = (newFiles) => {
  const fileArray = Array.from(newFiles);
  const selectedFileCount = fileState.selected.length;
  const newFilesData = {
    extensionSet : new Set(),
    selected: [],
    toBeSelectedDuplicate: [],
    invalidFileNames: [],
  };
  // fileState.toBeSelectedDuplicate = [];
  // fileState.invalidFileNames = [];

  for (const file of fileArray) {
    const { isValid, ext } = checkEhrFileName(file.name);
    if (!isValid) {
      newFilesData.invalidFileNames.push(file.name);
      continue;
    }

    newFilesData.extensionSet.add(ext);
    const idxInSelectedFiles = fileState.selected.findIndex((selectedFile) => selectedFile.name === file.name);
    if (idxInSelectedFiles === -1) {
      newFilesData.selected.push(file);
    } else {
      newFilesData.toBeSelectedDuplicate.push(file);
    }
  }

  let allExtensionSet = new Set(newFilesData.extensionSet);
  if (fileState.fileExtension === "" && newFilesData.extensionSet.size === 1) {
    fileState.fileExtension = [...newFilesData.extensionSet][0];
  } else if (fileState.fileExtension !== "") {
    allExtensionSet.add(fileState.fileExtension);
  }

  if (allExtensionSet.size > 1) {
    triggerNotificationBanner(`Upload files should be in the same file type, but multiple file types (${[...allExtensionSet].join(", ")}) are selected.`, "warning");
    return;
  }

  if (newFilesData.invalidFileNames.length > 0) {
    const msg = `The following ${
      newFilesData.invalidFileNames.length > 1 ? "files don't" : "file doesn't"
    } match file naming convention, thus cannot be selected`;

    triggerNotificationBanner(`Please select files with correct naming convention. ${msg}:<br>${newFilesData.invalidFileNames.sort().join("<br>")}`, "warning");
  }

  fileState.toBeSelectedDuplicate = newFilesData.toBeSelectedDuplicate;
  if (fileState.toBeSelectedDuplicate.length > 0) {
    const headingText = "Duplicate Selection";
    let msg = `Below file is already selected. Do you want to replace it with the new file?`;
    if (fileState.toBeSelectedDuplicate.length > 1) {
      fileState.toBeSelectedDuplicate.sort((a, b) => a.name.localeCompare(b.name));
      msg = `Below files are already selected. Do you want to replace them with the new files?`;
    }

    showWarningModal(headingText, msg, fileState.toBeSelectedDuplicate.map((file) => file.name), "duplicateSelection");
  }

  fileState.selected = fileState.selected.concat(newFilesData.selected);
  if (fileState.selected.length > selectedFileCount) {
    refreshSelectedFiles();
  }
};

const refreshSelectedFiles = () => {
  const selectedFileNamesDiv = document.querySelector("#selectedFileNames");
  const uploadBtn = document.querySelector("#uploadBtn");

  if (fileState.selected.length === 0) {
    uploadBtn.disabled = true;
    selectedFileNamesDiv.innerHTML = "";
    return;
  }

  uploadBtn.disabled = false;
  fileState.selected
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach((file, idx) => {
      const div = document.createElement("div");
      const safeFilename = escapeHTML(file.name);
      div.innerHTML = `
      <div class="d-flex align-items-center mb-1" style="gap: 8px;">
        <button class="btn btn-sm btn-warning py-0 px-2" style="margin-right: 0.75rem; font-size: 0.85em;" title="Remove file">✕</button>
        <span id="filename-${safeFilename}">${safeFilename}</span>
      </div>
      `;
      div.querySelector("button").addEventListener("click", (e) => {
        e.preventDefault();
        fileState.selected.splice(idx, 1);
        refreshSelectedFiles();
      });

      selectedFileNamesDiv.replaceChildren(...Array.from(div.children));
    });
};

const showUploadedFiles = (updatedFileNames) => {
  if (!updatedFileNames || updatedFileNames.length === 0) return;

  updatedFileNames.forEach((filename) => {
    if (!fileState.uploadedFileNames.includes(filename)) {
      fileState.uploadedFileNames.push(filename);
    }
  });

  const ul = document.createElement("ul");
  ul.style = "text-align: left; padding-left: 20px;";
  fileState.uploadedFileNames.sort().forEach((filename) => {
    const li = document.createElement("li");
    li.style = "font-weight: bold;";
    li.textContent = `${filename}`;
    ul.appendChild(li);
  });

  document.querySelector("#uploadedFileNames").replaceChildren(ul);
  document.querySelector("#uploadedFilesWrapper").style.display = "";
};

const getAndShowUploadedEhrNames = async () => {
  showAnimation();
  const url = `${baseAPI}/dashboard/?api=getUploadedEhrNames`;
  const idToken = await getIdToken();
  let allFilenames = [];
  try {
    const resp = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: "Bearer " + idToken,
      },
    });
    const respJson = await resp.json();
    if (respJson.code === 200) {
      allFilenames = respJson.data.allFilenames || [];
    } else {
      console.error("Failed to fetch uploaded file names:", respJson.message);
      triggerNotificationBanner("Failed to fetch uploaded file names: " + respJson.message, "danger");
    }
  } catch (e) {
    triggerNotificationBanner("Error fetching uploaded file names: " + e.message, "danger");
  } finally {
    showUploadedFiles(allFilenames);
  }

  hideAnimation();
};

const checkDuplicateUploads = () => {
  fileState = { ...fileState, toBeUploadedDuplicate: [], toBeUploaded: [] };
  const fileNameSet = new Set();

  for (const file of fileState.selected) {
    if (fileNameSet.has(file.name)) continue;

    const idx = fileState.uploadedFileNames.findIndex((uploadedFilename) => uploadedFilename === file.name);
    if (idx !== -1) {
      fileState.toBeUploadedDuplicate.push(file);
    } else {
      fileState.toBeUploaded.push(file);
    }
    fileNameSet.add(file.name);
  }

  if (fileState.toBeUploadedDuplicate.length > 0) {
    const headingText = "Duplicate Upload(s)";
    let msg = `Below file has been uploaded previously. Do you want to replace it with the new file or cancel this upload?`;
    if (fileState.toBeUploadedDuplicate.length > 1) {
      msg = `Below files have been uploaded previously. Do you want to replace them with the new files or cancel this upload?`;
    }

    showWarningModal(headingText, msg, fileState.toBeUploadedDuplicate.map((file) => file.name), "duplicateUploads");
    return true;
  }

  return false;
};

const formatBytes = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const base = 1024;
  const units = ["Bytes", "KB", "MB", "GB"];
  const idx = Math.floor(Math.log(bytes) / Math.log(base));
  return (bytes / Math.pow(base, idx)).toFixed(1) + " " + units[idx];
};

const showUploadStatus = (filename, loaded, total) => {
  const span = document.getElementById(`filename-${filename}`);
  if (span) {
    span.textContent = `${filename}: ${percent}% (${formatBytes(loaded)}/${formatBytes(total)})`;
    const percent = Math.round((loaded / total) * 100);

    if (percent === 100) {
      span.style.color = "green";
      span.style.fontWeight = "bold";
    }
  }
};

const uploadFileWithProgress = (file, signedUrl) => {
  const xhr = new XMLHttpRequest();
  const progressThrottle = 500;
  let lastProgressTime = 0;

  return new Promise((resolve) => {
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        const now = Date.now();
        if (now - lastProgressTime < progressThrottle) return;
        lastProgressTime = now;
        showUploadStatus(file.name, e.loaded, e.total);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({ filename: file.name, success: true });
      } else {
        resolve({ filename: file.name, success: false, error: xhr.statusText });
      }
    });

    xhr.addEventListener("error", () => {
      resolve({ filename: file.name, success: false, error: "Network error" });
    });

    xhr.open("PUT", signedUrl);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.send(file);
  });
};


const uploadEhrUsingSignedUrls = async () => {
  hideWarningModal();
  showAnimation();
  const fileInfoArray = fileState.toBeUploaded.map((file) => ({
    filename: file.name,
    contentType: file.type || "application/octet-stream",
  }));

  try {
    const idToken = await getIdToken();
    const resp = await fetch(`${baseAPI}/dashboard/?api=createEhrUploadUrls`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + idToken,
      },
      body: JSON.stringify({ fileInfoArray }),
    });

    const respJson = await resp.json();
    if (!resp.ok) {
      throw new Error(`Failed to get signed URLs: ${respJson.message || resp.statusText}`);
    }

    const { signedUrls } = respJson.data;
    const uploadPromises = fileState.toBeUploaded.map((file) => {
      const signedUrl = signedUrls[file.name];
      if (!signedUrl) {
        return Promise.resolve({ filename: file.name, success: false, error: "No signed URL" });
      }
      return uploadFileWithProgress(file, signedUrl);
    });

    const results = await Promise.allSettled(uploadPromises);
    const successFileNames = [];
    const failureDataArray = [];

    results.forEach((result) => {
      if (result.value.success) {
        successFileNames.push(result.value.filename);
      } else {
        failureDataArray.push(result.value);
      }
    });

    if (failureDataArray.length > 0) {
      triggerNotificationBanner(
        `File(s) failed to upload:<br>${failureDataArray
          .map((data) => `${data.filename} (${data.error})`)
          .join("<br>")}`,
        "danger"
      );
    } else if (successFileNames.length > 0) {
      triggerNotificationBanner("Files uploaded successfully!", "success");
    }

    const failureFileNames = failureDataArray.map((data) => data.filename);
    fileState.selected = fileState.selected.filter((file) => failureFileNames.includes(file.name));
    if (fileState.currBatchName === "") {
      fileState.currBatchName = new Date().toLocaleDateString("en-CA");
    }
    refreshSelectedFiles();
    showUploadedFiles(successFileNames);
  } catch (err) {
    triggerNotificationBanner("Error uploading files. " + err.message, "danger");
  }

  hideAnimation();
};

export const renderEhrUploadPage = async () => {
  updateNavBar('ehrUploadBtn');

  const mainContent = document.getElementById("mainContent");
  mainContent.innerHTML = setupEhrUploadPage();
  await getAndShowUploadedEhrNames();

  const fileInput = document.querySelector("#fileInput");
  fileInput.addEventListener("change", (e) => {
    selectNewFiles(e.target.files);
  });

  const dropBoxDiv = document.querySelector("#dropBox");
  dropBoxDiv.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropBoxDiv.classList.add("dragover");
  });

  dropBoxDiv.addEventListener("dragleave", () => {
    dropBoxDiv.classList.remove("dragover");
  });

  dropBoxDiv.addEventListener("drop", (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropBoxDiv.classList.remove("dragover");
    selectNewFiles(e.dataTransfer.files);
  });

  document.querySelector("#selectFilesLink").addEventListener("click", (e) => {
    e.preventDefault();
    fileInput.click();
  });

  document.getElementById("proceedBtn").addEventListener("click", async () => {
    if (modalStatus === "duplicateSelection") {
      while (fileState.toBeSelectedDuplicate.length > 0) {
        const duplicateFile = fileState.toBeSelectedDuplicate.pop();
        const idx = fileState.selected.findIndex((file) => file.name === duplicateFile.name);
        if (idx !== -1) {
          fileState.selected.splice(idx, 1);
        }
        fileState.selected.push(duplicateFile);
      }
      hideWarningModal();
      refreshSelectedFiles();
    } else if (modalStatus === "missingOptionalFiles") {
      const hasDuplicates = checkDuplicateUploads();
      if (!hasDuplicates) {
        await uploadEhrUsingSignedUrls();
      }
    } else if (modalStatus === "duplicateUploads") {
      const fileNameSet = new Set();
      while (fileState.toBeUploadedDuplicate.length > 0) {
        const file = fileState.toBeUploadedDuplicate.pop();
        if (!fileNameSet.has(file.name)) {
          fileState.toBeUploaded.push(file);
          fileNameSet.add(file.name);
        }
      }

      await uploadEhrUsingSignedUrls();
    }
  });

  document.getElementById("cancelBtn").addEventListener("click", () => {
    hideWarningModal();
  });

  document.querySelector("#uploadForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const selectedNameSet = new Set(
      fileState.selected.map((file) => {
        const { name } = checkEhrFileName(file.name);
        return name;
      })
    );

    const isInitialUploadOfBatch = fileState.currDelivery.name === "";
    if (isInitialUploadOfBatch) {
      const missingRequiredNames = ehrRequiredNames.filter((name) => !selectedNameSet.has(name));
      if (missingRequiredNames.length > 0) {
        triggerNotificationBanner(
          `Please include required file(s) for this upload:<br>${missingRequiredNames.sort().join("<br>")}`,
          "danger"
        );
        return;
      }

      const missingOptionalNames = ehrOptionalNames.filter((name) => !selectedNameSet.has(name));
      if (missingOptionalNames.length > 0) {
        const headingText = `Missing Optional ${missingOptionalNames.length > 1 ? "Files" : "File"}`;
        const msg = `The following optional ${
          missingOptionalNames.length > 1 ? "files aren't" : "file isn't"
        } included. Would you like to proceed with the upload or cancel to include additional files?`;

        showWarningModal(headingText, msg, missingOptionalNames, "missingOptionalFiles", "Proceed");
        return;
      }
    }

    const hasDuplicates = checkDuplicateUploads();
    if (!hasDuplicates) {
      await uploadEhrUsingSignedUrls();
    }
  });
};
