import { expect } from 'chai';
import { resolveBaseAPI, baseAPI, triggerNotificationBanner, escapeHTML } from '../src/utils.js';
import {
  installFirebaseStub,
  setupTestEnvironment,
  teardownTestEnvironment,
} from './helpers.js';

describe('utils', () => {
  beforeEach(() => {
    setupTestEnvironment();
    installFirebaseStub();
  });

  afterEach(() => {
    teardownTestEnvironment();
  });

  describe('baseAPI resolution', () => {
    it('returns prod endpoint when host matches prod', () => {
      expect(resolveBaseAPI('dashboard-myconnect.cancer.gov'))
        .to.equal('https://api-myconnect.cancer.gov');
    });

    it('returns stage endpoint when host matches stage', () => {
      expect(resolveBaseAPI('dashboard-myconnect-stage.cancer.gov'))
        .to.equal('https://api-myconnect-stage.cancer.gov');
    });

    it('defaults to dev endpoint otherwise', () => {
      expect(resolveBaseAPI('example.com'))
        .to.equal('https://us-central1-nih-nci-dceg-connect-dev.cloudfunctions.net');
    });

    it('exports baseAPI using dev endpoint when location is undefined', () => {
      // In test environment, location is not defined at module load time
      expect(baseAPI).to.equal('https://us-central1-nih-nci-dceg-connect-dev.cloudfunctions.net');
    });
  });

  describe('escapeHTML', () => {
    it('escapes special HTML characters', () => {
      const input = '<script>alert("xss")</script> & "quote"';
      const expected = '&lt;script&gt;alert("xss")&lt;/script&gt; &amp; "quote"';
      expect(escapeHTML(input)).to.equal(expected);
    });
  });

  describe('triggerNotificationBanner', () => {
    beforeEach(() => {
      document.body.innerHTML = '<div id="alert_placeholder"></div>';
    });

    it('renders a success message', () => {
      triggerNotificationBanner('Operation successful', 'success');
      const alert = document.querySelector('.alert-success');
      expect(alert).to.not.be.null;
      expect(alert.textContent).to.contain('Operation successful');
    });

    it('escapes HTML in the message', () => {
      triggerNotificationBanner('<b>Danger</b> <script>alert(1)</script>', 'danger');
      const alert = document.querySelector('.alert-danger');
      expect(alert.innerHTML).to.contain('&lt;b&gt;Danger&lt;/b&gt; &lt;script&gt;alert(1)&lt;/script&gt;');
      expect(alert.querySelector('b')).to.be.null;
    });

    it('preserves <br> tags in the message', () => {
      triggerNotificationBanner('Line 1<br>Line 2<br />Line 3', 'info');
      const alert = document.querySelector('.alert-info');
      expect(alert.innerHTML).to.contain('Line 1<br>Line 2<br>Line 3');
      expect(alert.querySelectorAll('br')).to.have.lengthOf(2);
    });

    it('escapes content between <br> tags', () => {
      triggerNotificationBanner('<i>Line 1</i><br><b>Line 2</b>', 'warning');
      const alert = document.querySelector('.alert-warning');
      expect(alert.innerHTML).to.contain('&lt;i&gt;Line 1&lt;/i&gt;<br>&lt;b&gt;Line 2&lt;/b&gt;');
    });
  });
});
