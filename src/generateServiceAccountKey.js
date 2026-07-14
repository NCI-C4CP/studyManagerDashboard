import { updateNavBar } from './navigationBar.js';
import { getIdToken, baseAPI, showAnimation, hideAnimation, triggerNotificationBanner, showConfirmModal } from './utils.js';

/**
 * Triggers a browser download of a JSON object as a file.
 * Creates a temporary Blob URL and programmatically clicks a hidden anchor element.
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
 * Example: "connect-hp-key-2026-07-14.json"
 * @param {string} clientEmail - The client_email from the generated key (e.g., "connect-hp@project.iam.gserviceaccount.com")
 * @returns {string} The formatted filename
 */
const buildFilename = (clientEmail) => {
    const prefix = clientEmail ? clientEmail.split('@')[0] : 'service-account';
    const date = new Date().toISOString().slice(0, 10);
    return `${prefix}-key-${date}.json`;
};

/**
 * Handles the "Generate Key" button click.
 * Shows a confirmation dialog, calls the backend endpoint on confirm,
 * and triggers a JSON file download on success. Displays a spinner during
 * the API call to prevent double-clicks.
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
            headers: {
                Authorization: 'Bearer ' + idToken,
            },
        });

        const result = await response.json();

        if (result.code === 200 && result.data) {
            const filename = buildFilename(result.data.client_email);
            downloadJsonFile(result.data, filename);
            triggerNotificationBanner('Service account key generated and downloaded successfully.', 'success');
        } else {
            const errorMsg = result.message || `Error generating key (status ${result.code}).`;
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
 * Renders the "Admin Use Only - API Key Generator" page.
 * Accessible to all authenticated site users (no additional role gating).
 * The page includes descriptive text about restricted use and a button to
 * initiate key generation.
 */
export const renderGenerateServiceAccountKeyPage = () => {
    updateNavBar('generateServiceAccountKeyBtn');

    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <div class="container-fluid">
            <div id="alert_placeholder"></div>
            <div class="row">
                <div class="col-lg-8">
                    <h2>Admin Use Only - API Key Generator</h2>
                    <div class="alert alert-warning mt-3" role="alert">
                        <strong>Restricted Use:</strong> This tool generates a GCP service account key for your site's API integration.
                        Its use is restricted to specific authorized team members. Do not share generated keys.
                    </div>
                    <p>
                        This tool generates a new JSON key file for your site's service account.
                        The downloaded file is in the same format as keys previously shared via Box.
                    </p>
                    <p>Previously generated keys remain active until they automatically expire.</p>
                    <button class="btn btn-primary mt-2" id="generateKeyBtn">
                        <i class="fa-solid fa-key"></i> Generate Key
                    </button>
                </div>
            </div>
        </div>`;

    document.getElementById('generateKeyBtn').addEventListener('click', handleGenerateKey);
};
