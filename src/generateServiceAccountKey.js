/**
 * Generate Service Account Key
 *
 * Provides a UI for authenticated dashboard users to generate and download a GCP
 * service account key JSON file for their site's API integration. Displays active
 * keys and enforces creation guards (max 2 keys, 2-week expiration window).
 *
 * Backend endpoints:
 *   GET  ?api=listServiceAccountKeys    — returns active keys for the site
 *   POST ?api=generateServiceAccountKey — creates a new key (returns keyData + updated keys list)
 *
 * Response codes for generate:
 *   200 — Success (data.keyData = key JSON, data.keys = updated list)
 *   400 — Site has no service account configured
 *   401 — Not authenticated
 *   405 — Wrong HTTP method
 *   409 — Creation blocked (max keys or expiration window guard)
 *   500 — IAM API error
 */

import { updateNavBar } from './navigationBar.js';
import { getIdToken, baseAPI, showAnimation, hideAnimation, triggerNotificationBanner, showConfirmModal } from './utils.js';

/**
 * Triggers a browser download of a JSON object as a file.
 * @param {Object} data - The JSON-serializable object to download
 * @param {string} filename - The suggested filename for the download
 */
const downloadJsonFile = (data, filename) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

/**
 * Builds the download filename from the service account's client_email field.
 * Format: {client_email_prefix}-key-{YYYY-MM-DD}.json
 * @param {string} clientEmail - e.g., "connect-hp@project.iam.gserviceaccount.com"
 * @returns {string} The formatted filename
 */
const buildFilename = (clientEmail) => {
    const prefix = clientEmail ? clientEmail.split('@')[0] : 'service-account';
    const date = new Date().toISOString().slice(0, 10);
    return `${prefix}-key-${date}.json`;
};

/**
 * Fetches the site's active service account keys from the backend.
 * @returns {Promise<Array>} Array of key objects, or empty array on error
 */
const fetchActiveKeys = async () => {
    const idToken = await getIdToken();
    const response = await fetch(`${baseAPI}/dashboard?api=listServiceAccountKeys`, {
        method: 'GET',
        headers: { Authorization: 'Bearer ' + idToken },
    });

    if (!response.ok) {
        console.error(`listServiceAccountKeys failed: ${response.status}`);
        return [];
    }

    const result = await response.json();
    return result.code === 200 && result.data?.keys ? result.data.keys : [];
};

/**
 * Determines whether key creation should be blocked based on existing keys.
 * @param {Array} keys - Array of active key objects
 * @returns {{ blocked: boolean, reason: string }}
 */
const shouldBlockCreation = (keys) => {
    if (!keys || keys.length === 0) return { blocked: false, reason: '' };

    if (keys.length >= 2) {
        return { blocked: true, reason: 'Maximum of 2 active keys reached. Delete an existing key before creating a new one.' };
    }

    const twoWeeksMs = 14 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    for (const key of keys) {
        if (key.isLegacy || !key.expiresAt) continue;
        const expiresAt = new Date(key.expiresAt).getTime();
        if (expiresAt - now > twoWeeksMs) {
            const expDate = new Date(key.expiresAt).toLocaleDateString();
            return { blocked: true, reason: `An active key still has more than 2 weeks before expiration (expires ${expDate}). New keys can only be created within 2 weeks of all existing keys expiring.` };
        }
    }

    return { blocked: false, reason: '' };
};

/**
 * Formats a key's expiration for display.
 * @param {Object} key - Key object with expiresAt and isLegacy fields
 * @returns {string} Human-readable expiration text
 */
const formatExpiration = (key) => {
    if (key.isLegacy || !key.expiresAt) return 'No expiration (legacy)';
    return new Date(key.expiresAt).toLocaleDateString();
};

/**
 * Renders the active keys table into the #keyListContainer element.
 * Also updates the Generate button's disabled state.
 * @param {Array} keys - Array of key objects from the backend
 */
const renderKeyList = (keys) => {
    const container = document.getElementById('keyListContainer');
    if (!container) return;

    if (!keys || keys.length === 0) {
        container.innerHTML = '<p class="text-muted">No active keys found for this site.</p>';
    } else {
        const rows = keys.map(key => `
            <tr>
                <td><code>${key.keyId ? key.keyId.substring(0, 12) + '...' : 'N/A'}</code></td>
                <td>${key.createdAt ? new Date(key.createdAt).toLocaleDateString() : 'Unknown'}</td>
                <td>${formatExpiration(key)}</td>
            </tr>`).join('');

        container.innerHTML = `
            <table class="table table-sm table-bordered mt-3">
                <thead class="table-light">
                    <tr><th>Key ID</th><th>Created</th><th>Expires</th></tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>`;
    }

    updateGenerateButtonState(keys);
};

/**
 * Enables or disables the Generate button based on creation guards.
 * @param {Array} keys - Array of active key objects
 */
const updateGenerateButtonState = (keys) => {
    const btn = document.getElementById('generateKeyBtn');
    const noteEl = document.getElementById('generateBlockedNote');
    if (!btn) return;

    const { blocked, reason } = shouldBlockCreation(keys);
    btn.disabled = blocked;

    if (noteEl) {
        noteEl.textContent = blocked ? reason : '';
        noteEl.classList.toggle('d-none', !blocked);
    }
};

/**
 * Handles the "Generate Key" button click.
 * Shows a confirmation dialog, calls the backend, downloads the key on success,
 * and refreshes the key list. Handles 409 (creation blocked) gracefully.
 */
const handleGenerateKey = async () => {
    const proceed = await showConfirmModal({
        title: 'Generate Service Account Key',
        message: 'This will create a new service account key. Proceed?',
        confirmText: 'Generate',
        cancelText: 'Cancel'
    });

    if (!proceed) return;

    showAnimation();
    try {
        const idToken = await getIdToken();
        const response = await fetch(`${baseAPI}/dashboard?api=generateServiceAccountKey`, {
            method: 'POST',
            headers: { Authorization: 'Bearer ' + idToken },
        });

        if (!response.ok && response.headers.get('content-type')?.indexOf('application/json') === -1) {
            triggerNotificationBanner(`Server error (HTTP ${response.status}). Please try again later.`, 'danger');
            return;
        }

        const result = await response.json();

        if (result.code === 200 && result.data?.keyData) {
            const filename = buildFilename(result.data.keyData.client_email);
            downloadJsonFile(result.data.keyData, filename);
            triggerNotificationBanner('Service account key generated and downloaded successfully.', 'success');
            if (result.data.keys) renderKeyList(result.data.keys);
        } else if (result.code === 409) {
            triggerNotificationBanner(result.message, 'warning');
            if (result.data?.keys) renderKeyList(result.data.keys);
        } else {
            const errorMsg = result.message || `Error generating key (HTTP ${response.status}).`;
            triggerNotificationBanner(errorMsg, 'danger');
        }
    } catch (error) {
        console.error('Error generating service account key:', error);
        triggerNotificationBanner('An unexpected error occurred while generating the key.', 'danger');
    } finally {
        hideAnimation();
    }
};

/**
 * Renders the API Key Generator page.
 * Visible to all users on the normal dashboard nav bar (isSiteManager, helpDesk,
 * coordinatingCenter). EHR-only uploaders use a separate nav and cannot access this page.
 * Fetches and displays active keys on load, with a button to generate new ones.
 */
export const renderGenerateServiceAccountKeyPage = async () => {
    updateNavBar('generateServiceAccountKeyBtn');

    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <div class="container-fluid">
            <div id="alert_placeholder"></div>
            <div class="row">
                <div class="col-lg-8">
                    <h2>Developer Use Only - API Key Generator</h2>
                    <div class="alert alert-warning mt-3" role="alert">
                        <strong>Developer Tool:</strong> Service account keys are used by developers to authenticate
                        automated API access for your site. Do not share generated keys outside your authorized team.
                    </div>
                    <p>
                        This tool generates a new JSON key file for your site's service account.
                        The downloaded file is in the same format as keys previously shared via Box.
                    </p>
                    <p>Previously generated keys remain active until they automatically expire per organization policy.</p>

                    <h5 class="mt-4">Active Keys</h5>
                    <div id="keyListContainer">
                        <p class="text-muted">Loading keys...</p>
                    </div>

                    <button class="btn btn-primary mt-3" id="generateKeyBtn">
                        <i class="fa-solid fa-key"></i> Generate Key
                    </button>
                    <p id="generateBlockedNote" class="text-danger mt-2 d-none"></p>
                </div>
            </div>
        </div>`;

    document.getElementById('generateKeyBtn').addEventListener('click', handleGenerateKey);

    showAnimation();
    try {
        const keys = await fetchActiveKeys();
        renderKeyList(keys);
    } catch (error) {
        console.error('Error loading active keys:', error);
        const container = document.getElementById('keyListContainer');
        if (container) container.innerHTML = '<p class="text-danger">Failed to load active keys.</p>';
    } finally {
        hideAnimation();
    }
};
