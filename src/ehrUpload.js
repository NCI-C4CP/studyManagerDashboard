import { dashboardNavBarLinks, removeActiveClass } from "./navigationBar.js";
import { getIdToken, hideAnimation, showAnimation, triggerNotificationBanner, baseAPI } from "./utils.js";

let fileState = {
  tobeSelectedDuplicate: [],
  selected: [],
  tobeUploadedDuplicate: [],
  tobeUploaded: [],
  uploaded: [],
  stage: "select", // "select" | "upload"
};
const ehrExtensions = [".csv", ".csv.gz", ".parquet", ".parquet.gz"];
const ehrRequiredNamesExact = [
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
const ehrOptionalNamesAll = [
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
  "provider*",
  "care_site*",
  "location",
  "cost",
  "payer_plan_period",
  "note_nlp*",
  "note*",
  "fact_relationship",
  "episode",
  "episode_event",
  "cohort",
  "cohort_definition",
  "metadata",
  "attribute_definition",
];
const ehrOptionalNamesExact = ehrOptionalNamesAll.filter((name) => !name.endsWith("*"));
const ehrOptionalNamePrefixes = ehrOptionalNamesAll
  .filter((name) => name.endsWith("*"))
  .map((name) => name.replace(/\*$/, ""));

const checkEhrFullName = (fullName) => {
  const res = { fileName: "", fileExt: "", isValid: false };
  const fullNameLower = fullName.toLowerCase();
  for (const ext of ehrExtensions) {
    if (fullNameLower.endsWith(ext)) {
      res.fileName = fullNameLower.slice(0, -ext.length);
      res.fileExt = ext;
      break;
    }
  }

  if (ehrRequiredNamesExact.includes(res.fileName) || ehrOptionalNamesExact.includes(res.fileName)) {
    res.isValid = true;
    return res;
  }

  for (const prefix of ehrOptionalNamePrefixes) {
    if (res.fileName.startsWith(prefix)) {
      res.isValid = true;
      return res;
    }
  }

  return res;
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
            </div>
        </div>
    </div>
    `;
};

const selectNewFiles = (newFiles) => {
  const fileArray = Array.from(newFiles);
  const fileNameSet = new Set();
  const selecteFileCount = fileState.selected.length;
  fileState.stage = "select";
  fileState.tobeSelectedDuplicate = [];

  for (const file of fileArray) {
    const { fileName, fileExt, isValid } = checkEhrFullName(file.name);
    if (!isValid) continue;

    fileNameSet.add(fileName);
    const selectedFileIdx = fileState.selected.findIndex((item) => item.fileName === fileName);
    if (selectedFileIdx === -1) {
      fileState.selected.push({ file, fileName, fileExt });
    } else {
      fileState.tobeSelectedDuplicate.push({ file, fileName, fileExt });
    }
  }

  if (fileState.tobeSelectedDuplicate.length > 0) {
    const headingText = "Duplicate Selection";
    let msg = `Below file is already selected. Do you want to replace it with the new file?`;
    if (fileState.tobeSelectedDuplicate.length > 1) {
      msg = `Below files are already selected. Do you want to replace them with the new files?`;
    }

    document.querySelector("#warningModalLabel").textContent = headingText;
    const warningDiv = document.querySelector("#duplicateFilesWarning");
    warningDiv.textContent = msg;
    const listEle = document.createElement("ul");
    fileState.tobeSelectedDuplicate.forEach((item) => {
      const listItem = document.createElement("li");
      listItem.textContent = item.fileName;
      listEle.appendChild(listItem);
    });
    warningDiv.appendChild(listEle);

    // Todo: Remove JQuery after migration to Bootstrap 5
    // const modal = new bootstrap.Modal("#warningModal", { backdrop: "static", keyboard: false });
    // modal.show();
    $("#warningModal").modal({ backdrop: "static", keyboard: false });
  }

  if (fileState.selected.length > selecteFileCount) {
    refreshSelectedFiles();
  }
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
  fileState.selected.forEach((item, idx) => {
    const div = document.createElement("div");
    div.className = "d-flex align-items-center mb-1";
    div.style.gap = "8px";

    const btn = document.createElement("button");
    btn.textContent = "✕";
    btn.title = "Remove file";
    btn.className = "btn btn-sm btn-warning py-0 px-2";
    btn.style.marginRight = "0.75rem";
    btn.style.fontSize = "0.85em";
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      fileState.selected.splice(idx, 1);
      refreshSelectedFiles();
    });

    const span = document.createElement("span");
    span.textContent = item.file.name;
    div.append(btn, span);

    selectedFileNamesDiv.appendChild(div);
  });
};

const showUploadedFiles = (fileFullNameArray) => {
  const uploadedFilesWrapperDiv = document.querySelector("#uploadedFilesWrapper");
  if (fileFullNameArray.length === 0) {
    uploadedFilesWrapperDiv.style.display = "none";
    return;
  }

  fileState.uploaded = [];
  const ul = document.createElement("ul");
  ul.style = "text-align: left; padding-left: 20px;";
  fileFullNameArray.forEach((fullName) => {
    const { fileName, fileExt } = checkEhrFullName(fullName);
    fileState.uploaded.push({ fileName, fileExt });

    const li = document.createElement("li");
    li.style = "font-weight: bold;";
    li.textContent = `${fullName}`;
    ul.appendChild(li);
  });

  fileState.uploaded.sort((a, b) => a.fileName.localeCompare(b.fileName));
  document.querySelector("#uploadedFileNames").replaceChildren(ul);
  uploadedFilesWrapperDiv.style.display = "";
};

const refreshUploadedEhrNames = async () => {
  showAnimation();
  const url = `${baseAPI}/dashboard/?api=getUploadedEhrNames`;
  const idToken = await getIdToken();
  let fileFullNameArray = [];
  try {
    const resp = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: "Bearer " + idToken,
      },
    });
    const respJson = await resp.json();
    if (respJson.code === 200) {
      fileFullNameArray = respJson.data.allFilenames || [];
    } else {
      console.error("Failed to fetch uploaded file names:", respJson.message);
      triggerNotificationBanner("Failed to fetch uploaded file names: " + respJson.message, "danger");
    }
  } catch (e) {
    triggerNotificationBanner("Error fetching uploaded file names: " + e.message, "danger");
  } finally {
    showUploadedFiles(fileFullNameArray);
  }

  hideAnimation();
};

const checkEhrBeforeUpload = () => {
  if (fileState.tobeUploaded.length === 0) return false;
  const tobeUploadedSet = new Set(fileState.tobeUploaded.map((item) => item.fileName));
  const missingRequired = ehrRequiredNamesExact.filter((fileName) => !tobeUploadedSet.has(fileName));
  const missingOptional = ehrOptionalNamesExact.filter((fileName) => !tobeUploadedSet.has(fileName));
  const missingOptionalPrefix = ehrOptionalNamePrefixes.filter((prefix) => {
    return !fileState.tobeUploaded.some((item) => item.fileName.startsWith(prefix));
  });

  if (missingOptionalPrefix.length > 0) {
    missingOptionalPrefix.forEach((prefix) => {
      missingOptional.push(`${prefix}*`);
    });
  }

  if (missingRequired.length > 0) {
    triggerNotificationBanner(
      `Please include required file(s) for this upload:<br>${missingRequired.join("<br>")}`,
      "danger"
    );
    return false;
  }

  if (missingOptional.length > 0) {
    triggerNotificationBanner(
      `All requirement files are included.<br>Optional file(s) not included: ${missingOptional.join(", ")}`,
      "info"
    );
  }

  return true;
};

// Todo: Decide whether to use signed URLs for EHR uploads
const uploadEhrUsingSignedUrls = async (fileArray) => {
  const fileInfoArray = fileArray.map((file) => ({
    filename: file.name,
    contentType: file.type || "application/octet-stream",
  }));

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
  const uploadPromises = [];
  for (const file of fileArray) {
    const signedUrl = signedUrls[file.name];

    if (!signedUrl) {
      console.error(`No signed URL for file: ${file.name}`);
      continue;
    }

    uploadPromises.push(
      fetch(signedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
        body: file,
      })
        .then((uploadResponse) => {
          if (!uploadResponse.ok) {
            return {
              success: false,
              filename: file.name,
              error: `Upload failed: ${uploadResponse.statusText}`,
            };
          }
          return {
            success: true,
            filename: file.name,
          };
        })
        .catch((error) => {
          return {
            success: false,
            filename: file.name,
            error: error.message,
          };
        })
    );
  }

  const results = await Promise.allSettled(uploadPromises);
  const successful = [];
  const failed = [];

  results.forEach((result, index) => {
    const fileFullName = fileArray[index].name;
    if (result.status === "fulfilled" && result.value.success) {
      successful.push({ fileFullName });
    } else {
      failed.push({ fileFullName, error: result.value.error });
    }
  });

  return { successful, failed };
};

/**
 * Uploads EHR files to Bucket.
 * This implementation cannot handle large files. Use `uploadEhrUsingSignedUrls` for large files.
 * @returns {Promise<void>}
 */
const uploadEhr = async () => {
  const isReadyToUpload = checkEhrBeforeUpload();
  if (!isReadyToUpload) return;

  showAnimation();
  const formData = new FormData();
  fileState.tobeUploaded.forEach((item) => formData.append("files", item.file));

  const url = `${baseAPI}/dashboard/?api=uploadEhr`;
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
      } else if (respJson.code === 207) {
        const failureFilenames = respJson.data.failureFilenames || [];
        triggerNotificationBanner(
          `Files not successfully uploaded<br>:${failureFilenames.join("<br>")}`,
          "warning"
        );
      }
      showUploadedFiles(respJson.data.allFilenames);
      fileState.selected = [];
      refreshSelectedFiles();
    } else {
      triggerNotificationBanner("EHR upload failed: " + respJson.message, "danger");
    }
  } catch (err) {
    triggerNotificationBanner("Error uploading files: " + err.message, "danger");
  }
  hideAnimation();
};

export const renderEhrUploadPage = async () => {
  document.getElementById("navBarLinks").innerHTML = dashboardNavBarLinks();
  removeActiveClass("nav-link", "active");
  document.getElementById("ehrUploadBtn").classList.add("active");

  const mainContent = document.getElementById("mainContent");
  mainContent.innerHTML = setupEhrUploadPage();
  await refreshUploadedEhrNames();

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

  document.getElementById("replaceBtn").addEventListener("click", async () => {
    // Todo: Remove JQuery after migration to Bootstrap 5
    // const modal = new bootstrap.Modal("#warningModal", { backdrop: "static", keyboard: false });
    // modal.hide();
    $("#warningModal").modal("hide");

    if (fileState.stage === "select") {
      while (fileState.tobeSelectedDuplicate.length > 0) {
        const duItem = fileState.tobeSelectedDuplicate.pop();
        const idx = fileState.selected.findIndex((item) => item.fileName === duItem.fileName);
        if (idx !== -1) {
          fileState.selected.splice(idx, 1);
        }
        fileState.selected.push(duItem);
      }
      refreshSelectedFiles();
    } else if (fileState.stage === "upload") {
      const fileNameSet = new Set();
      while (fileState.tobeUploadedDuplicate.length > 0) {
        const item = fileState.tobeUploadedDuplicate.pop();
        if (!fileNameSet.has(item.fileName)) {
          fileState.tobeUploaded.push(item);
          fileNameSet.add(item.fileName);
        }
      }

      await uploadEhr();
    }
  });

  document.getElementById("cancelBtn").addEventListener("click", () => {
    // Todo: Remove JQuery after migration to Bootstrap 5
    $("#warningModal").modal("hide");
  });

  document.querySelector("#uploadForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    fileState = { ...fileState, stage: "upload", tobeUploaded: [], tobeUploadedDuplicate: [] };
    const fileNameSet = new Set();

    for (const item of fileState.selected) {
      const idx = fileState.uploaded.findIndex((uploadedItem) => uploadedItem.fileName === item.fileName);
      if (idx !== -1) {
        fileState.tobeUploadedDuplicate.push(item);
      } else if (!fileNameSet.has(item.fileName)) {
        fileState.tobeUploaded.push(item);
        fileNameSet.add(item.fileName);
      }
    }

    if (fileState.tobeUploadedDuplicate.length > 0) {
      const headingText = "Duplicate Upload";
      let msg = `Below file has been uploaded previously. Do you want to replace it with the new file or cancel this upload?`;
      if (fileState.tobeUploadedDuplicate.length > 1) {
        msg = `Below files have been uploaded previously. Do you want to replace them with the new files or cancel this upload?`;
      }

      document.querySelector("#warningModalLabel").textContent = headingText;
      const warningDiv = document.querySelector("#duplicateFilesWarning");
      warningDiv.textContent = msg;
      const ulEle = document.createElement("ul");
      fileState.tobeUploadedDuplicate.forEach((item) => {
        const liEle = document.createElement("li");
        liEle.textContent = item.fileName;
        ulEle.appendChild(liEle);
      });
      warningDiv.appendChild(ulEle);
      // Todo: Remove JQuery after migration to Bootstrap 5
      $("#warningModal").modal({ backdrop: "static", keyboard: false });
      return;
    }

    await uploadEhr();
  });
};
