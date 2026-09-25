import { describe, expect, it } from 'vitest';
import { getSchemaHtmlStr } from '../src/storeNotifications.js';

describe('notification schema recipient query mode', () => {
  it('shows the condition builder by default', () => {
    const html = getSchemaHtmlStr();

    expect(html).toContain('id="conditionsQueryMode" value="conditions" checked');
    expect(html).toContain('id="conditionsQuerySection" class=""');
    expect(html).toContain('id="rawSqlQuerySection" class="d-none"');
    expect(html).toContain('id="participantFieldsSection" class=""');
  });

  it('shows and safely renders a saved full SQL query', () => {
    const html = getSchemaHtmlStr({
      rawSql: 'SELECT token FROM `Connect.activitiesTracking` WHERE activityRound = "A1"',
    });

    expect(html).toContain('id="rawSqlQueryMode" value="rawSql" checked');
    expect(html).toContain('id="conditionsQuerySection" class="d-none"');
    expect(html).toContain('id="rawSqlQuerySection" class=""');
    expect(html).toContain('id="participantFieldsSection" class="d-none"');
    expect(html).toContain('SELECT token FROM `Connect.activitiesTracking`');
  });
});
