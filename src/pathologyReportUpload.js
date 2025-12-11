import {
  getIdToken,
  hideAnimation,
  showAnimation,
  conceptToSiteMapping,
  triggerNotificationBanner,
  baseAPI,
} from "./utils.js";
import { renderParticipantHeader } from "./participantHeader.js";
import conceptIds from "./fieldToConceptIdMapping.js";

/**
 * Render pathology report upload content for use in a tab
 * @param {object} participant - The participant object
 * @returns {Promise<string>} HTML string for pathology tab content
 */
export const renderPathologyTabContent = async (participant) => {
    if (!participant) {
        return '<div class="alert alert-warning">No participant data available</div>';
    }

    // Check if participant is allowed to upload
    const isAllowedToUpload =
        participant[conceptIds.verifiedFlag] === conceptIds.verified &&
        participant[conceptIds.consentFlag] === conceptIds.yes &&
        participant[conceptIds.hipaaFlag] === conceptIds.yes &&
        participant[conceptIds.withdrawConsent] === conceptIds.no &&
        participant[conceptIds.revokeHIPAA] === conceptIds.no &&
        participant[conceptIds.destroyData] === conceptIds.no;

    if (!isAllowedToUpload) {
        let displayedMsg = "Participant does not meet the criteria for uploading pathology reports.";
        if (participant[conceptIds.destroyData] === conceptIds.yes) {
            displayedMsg = "This participant has requested data destruction. Pathology reports cannot be uploaded and any previously uploaded reports have been deleted.";
        }
        return `<div class="alert alert-warning"><h4>${displayedMsg}</h4></div>`;
    }

    Connect_ID = participant?.Connect_ID;
    siteAcronym = conceptToSiteMapping[participant?.[conceptIds.healthcareProvider]];

    if (!siteAcronym) {
        return `<div class="alert alert-warning">Invalid healthcare provider for this participant.</div>`;
    }

    // Initialize file state
    fileState = {
        tobeSelectedDuplicate: [],
        selected: [],
        tobeUploadedDuplicate: [],
        tobeUploaded: [],
        filenamesUploaded: [],
        stage: "select",
    };

    const content = `
        ${renderParticipantHeader(participant)}
        <div id="alert_placeholder"></div>
        <h3 style="text-align: center;">Select Pathology Reports</h3>
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
            <h3 style="text-align: center;">All Uploaded Reports</h3>
            <div id="uploadedFilesBox" style="border: 2px solid #0078d7; padding: 15px; border-radius: 0.5rem; background: #f8faff">
                <div id="uploadedFilesNames"></div>
            </div>
        </div>

        <div class="modal fade" id="warningModal" tabindex="-1" role="dialog" aria-labelledby="warningModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered" role="document">
                <div class="modal-content" style="border-radius:8px;">
                    <div class="modal-header" style="border-bottom:none; background-color:#fff3cd">
                        <h5 class="modal-title" id="warningModalLabel" style="color:black; border-radius:4px; padding:6px 12px;">Duplicate Selection</h5>
                    </div>
                    <div class="modal-body" style="text-align:left;">
                        <div id="duplicateFilesWarning"></div>
                    </div>
                    <div class="modal-footer" style="border-top:none; justify-content:center;">
                        <button id="replaceBtn" class="btn btn-warning" style="margin-right:12px;">Replace</button>
                        <button id="cancelBtn" class="btn btn-secondary">Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Schedule event handlers and data loading to run after DOM is updated
    requestAnimationFrame(async () => {
        await getUploadedPathologyReportNames();
        setupPathologyEventListeners();
    });

    return content;
};

let fileState = {};
let Connect_ID, siteAcronym;

const getBootstrapModalInstance = (modalEl) => {
  if (!window.bootstrap?.Modal) return null;
  if (typeof bootstrap.Modal.getOrCreateInstance === "function") {
    return bootstrap.Modal.getOrCreateInstance(modalEl);
  }
  if (typeof bootstrap.Modal.getInstance === "function") {
    return bootstrap.Modal.getInstance(modalEl);
  }
  return null;
};

const showWarningModal = () => {
  const modalEl = document.getElementById("warningModal");
  if (!modalEl) return;

  const modalInstance = getBootstrapModalInstance(modalEl);
  if (modalInstance?.show) {
    modalInstance.show();
    return;
  }

  modalEl.classList.add("show");
  modalEl.style.display = "block";
  modalEl.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");

  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop fade show";
  backdrop.id = "warningModalBackdrop";
  document.body.appendChild(backdrop);
  modalEl.dataset.warningBackdropId = backdrop.id;
};

const hideWarningModal = () => {
  const modalEl = document.getElementById("warningModal");
  if (!modalEl) return;

  const modalInstance = getBootstrapModalInstance(modalEl);
  if (modalInstance?.hide) {
    modalInstance.hide();
    return;
  }

  modalEl.classList.remove("show");
  modalEl.style.display = "none";
  modalEl.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  document.body.style.removeProperty("padding-right");

  const backdropId = modalEl.dataset.warningBackdropId;
  if (backdropId) {
    document.getElementById(backdropId)?.remove();
    delete modalEl.dataset.warningBackdropId;
  }
  document.querySelectorAll(".modal-backdrop").forEach((el) => el.remove());
};

const refreshSelectedFiles = () => {
  const selectedFileNamesDiv = document.querySelector("#selectedFileNames");
  const uploadBtn = document.querySelector("#uploadBtn");
  selectedFileNamesDiv.innerHTML = "";

  if (fileState.selected.length === 0) {
    uploadBtn.disabled = true;
    return;
  }

  uploadBtn.disabled = false;
  fileState.selected.forEach((file, idx) => {
    const fileDiv = document.createElement("div");
    fileDiv.style.display = "flex";
    fileDiv.style.alignItems = "center";
    fileDiv.style.gap = "8px";
    fileDiv.style.marginBottom = "4px";

    const removeFileBtn = document.createElement("button");
    removeFileBtn.textContent = "✕";
    removeFileBtn.title = "Remove file";
    removeFileBtn.className = "btn btn-sm btn-warning py-0 px-2";
    removeFileBtn.style.marginRight = "0.75rem";
    removeFileBtn.style.fontSize = "0.85em";
    removeFileBtn.addEventListener("click", (e) => {
      e.preventDefault();
      fileState.selected.splice(idx, 1);
      refreshSelectedFiles();
    });
    fileDiv.appendChild(removeFileBtn);

    const nameSpan = document.createElement("span");
    nameSpan.textContent = file.name;
    fileDiv.appendChild(nameSpan);

    selectedFileNamesDiv.appendChild(fileDiv);
  });
};

const refreshUploadedFilenames = () => {
  const uploadedFilesWrapperDiv = document.querySelector("#uploadedFilesWrapper");
  if (fileState.filenamesUploaded.length === 0) {
    uploadedFilesWrapperDiv.style.display = "none";
    return;
  }

  const ul = document.createElement("ul");
  ul.style = "text-align: left; padding-left: 20px;";
  fileState.filenamesUploaded.forEach((filename) => {
    const li = document.createElement("li");
    li.style = "font-weight: bold;";
    li.textContent = filename;
    ul.appendChild(li);
  });

  document.querySelector("#uploadedFilesNames").replaceChildren(ul);
  uploadedFilesWrapperDiv.style.display = "";
};

const addNewFiles = (newFiles) => {
  const fileArray = Array.from(newFiles);
  const filenameSet = new Set();
  const invalidFileArray = [];
  let selecteFileCount = fileState.selected.length;
  fileState.stage = "select";
  fileState.tobeSelectedDuplicate = [];

  for (const file of fileArray) {
    if (filenameSet.has(file.name)) {
      alert(`Current selection has files with identical name "${file.name}". Please select files with unique names.`);
      return;
    }
    filenameSet.add(file.name);

    if (file.name.startsWith(Connect_ID)) {
      const selectedFileIdx = fileState.selected.findIndex((f) => f.name === file.name);
      if (selectedFileIdx === -1) {
        fileState.selected.push(file);
      } else {
        fileState.tobeSelectedDuplicate.push(file);
      }
    } else {
      invalidFileArray.push(file);
    }
  }

  if (invalidFileArray.length > 0) {
    const wrongName = invalidFileArray.filter((f) => !f.name.startsWith(Connect_ID));
    if (wrongName.length) {
      alert(`File names must start with Connect ID (${Connect_ID}). Invalid: ${wrongName.map((f) => f.name).join(", ")}`);
    }
  }

  if (fileState.tobeSelectedDuplicate.length > 0) {
    const headingText = "Duplicate Selection";
    let msg = `Below file is already selected. Do you want to replace it with the new file or cancel this selection?`;
    if (fileState.tobeSelectedDuplicate.length > 1) {
      msg = `Below files are already selected. Do you want to replace them with the new files or cancel this selection?`;
    }

    document.querySelector("#warningModalLabel").textContent = headingText;
    const warningDiv = document.querySelector("#duplicateFilesWarning");
    warningDiv.textContent = msg;
    const listEle = document.createElement("ul");
    fileState.tobeSelectedDuplicate.forEach((file) => {
      const listItem = document.createElement("li");
      listItem.textContent = file.name;
      listEle.appendChild(listItem);
    });
    warningDiv.appendChild(listEle);

    showWarningModal();
  }

  if (fileState.selected.length > selecteFileCount) {
    refreshSelectedFiles();
  }
};

const uploadPathologyReports = async () => {
  if (fileState.tobeUploaded.length === 0) return;

  showAnimation();
  const formData = new FormData();
  fileState.tobeUploaded.forEach((file) => formData.append("files", file));

  const searchParamsStr = new URLSearchParams({
    api: "uploadPathologyReports",
    Connect_ID,
    siteAcronym,
  }).toString();

  const url = `${baseAPI}/dashboard/?${searchParamsStr}`;
  const idToken = await getIdToken();
  try {
    const resp = await fetch(url, {
      method: "POST",
      body: formData,
      headers: {
        Authorization: "Bearer " + idToken,
      },
    });

    const respJson = await resp.json();
    if (resp.ok) {
      if (respJson.code === 200) {
        triggerNotificationBanner("Files uploaded successfully!", "success");
        fileState.filenamesUploaded = respJson.data.allFilenames;
      } else if (respJson.code === 207) {
        const failureFilenames = respJson.data.failureFilenames || [];
        triggerNotificationBanner(
          `Files not successfully uploaded<br>: ${failureFilenames.join("<br>")}`,
          "warning"
        );
        fileState.filenamesUploaded = respJson.data.allFilenames;
      }
      refreshUploadedFilenames();
      fileState.selected = [];
      refreshSelectedFiles();
    } else {
      triggerNotificationBanner("Upload failed: " + respJson.message, "danger");
    }
  } catch (err) {
    triggerNotificationBanner("Error uploading files: " + err.message, "danger");
  }
  hideAnimation();
};

const getUploadedPathologyReportNames = async () => {
  showAnimation();
  const searchParamsStr = new URLSearchParams({
    api: "getUploadedPathologyReportNames",
    Connect_ID,
    siteAcronym,
  }).toString();
  const url = `${baseAPI}/dashboard/?${searchParamsStr}`;
  const idToken = await getIdToken();
  try {
    const resp = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: "Bearer " + idToken,
      },
    });
    const respJson = await resp.json();
    if (respJson.code === 200) {
      fileState.filenamesUploaded = respJson.data;
    } else {
      console.error("Failed to fetch uploaded file names:", respJson.message);
      triggerNotificationBanner("Failed to fetch uploaded file names: " + respJson.message, "danger");
    }
  } catch (e) {
    triggerNotificationBanner("Error fetching uploaded file names: " + e.message, "danger");
  } finally {
    refreshUploadedFilenames();
  }

  hideAnimation();
};

/**
 * Setup event listeners for pathology upload page (for tabbed structure)
 */
const setupPathologyEventListeners = () => {
  const fileInput = document.querySelector("#fileInput");
  if (fileInput) {
    fileInput.addEventListener("change", (e) => {
      const newFiles = e.target.files;
      addNewFiles(newFiles);
    });
  }

  // Prevent browser navigating away when files are dropped outside the drop zone
  ["dragover", "drop"].forEach((evt) => {
    window.addEventListener(
      evt,
      (e) => {
        if (!document.getElementById("dropBox")) return;
        e.preventDefault();
        e.stopPropagation();
      },
      false
    );
  });

  const dropBoxDiv = document.querySelector("#dropBox");
  if (dropBoxDiv) {
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
      addNewFiles(e.dataTransfer.files);
    });
  }

  const selectFilesLink = document.querySelector("#selectFilesLink");
  if (selectFilesLink) {
    selectFilesLink.addEventListener("click", (e) => {
      e.preventDefault();
      fileInput.click();
    });
  }

  const replaceBtn = document.getElementById("replaceBtn");
  if (replaceBtn) {
    replaceBtn.addEventListener("click", async () => {
      hideWarningModal();

      if (fileState.stage === "select") {
        while (fileState.tobeSelectedDuplicate.length > 0) {
          const dupFile = fileState.tobeSelectedDuplicate.pop();
          const idx = fileState.selected.findIndex((f) => f.name === dupFile.name);
          if (idx !== -1) {
            fileState.selected.splice(idx, 1);
          }
          fileState.selected.push(dupFile);
        }
        refreshSelectedFiles();
      } else if (fileState.stage === "upload") {
        await uploadPathologyReports();
      }
    });
  }

  const cancelBtn = document.getElementById("cancelBtn");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      hideWarningModal();
      if (fileState.stage === "select") {
        fileState.tobeSelectedDuplicate = [];
      } else if (fileState.stage === "upload") {
        fileState.tobeUploaded = [];
        fileState.tobeUploadedDuplicate = [];
      }
    });
  }

  const uploadForm = document.querySelector("#uploadForm");
  if (uploadForm) {
    uploadForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (fileState.selected.length === 0) return;

      fileState.tobeUploaded = fileState.selected.slice();
      const duplicates = [];
      for (const file of fileState.tobeUploaded) {
        if (fileState.filenamesUploaded.includes(file.name)) {
          duplicates.push(file);
        }
      }

      if (duplicates.length > 0) {
        fileState.stage = "upload";
        fileState.tobeUploadedDuplicate = duplicates;
        const warningDiv = document.getElementById("duplicateFilesWarning");
        warningDiv.innerHTML = `<div>The following file(s) have already been uploaded for this participant. Click 'Replace' if you wish to replace the existing file(s).</div>`;
        const listEle = document.createElement("ul");
        duplicates.forEach((file) => {
          const listItem = document.createElement("li");
          listItem.textContent = file.name;
          listEle.appendChild(listItem);
        });
        warningDiv.appendChild(listEle);
        showWarningModal();
        return;
      }

      await uploadPathologyReports();
    });
  }
};

export { addNewFiles };
