import { renderTable, renderParticipantSearchResults, renderTablePage, setupActiveColumns, filterBySiteKey, getActiveColumns, waitForActiveColumnsUpdate, normalizeColumnValue } from '../src/participantCommons.js';
import { searchState, buildPredefinedSearchMetadata, uiState } from '../src/stateManager.js';
import { bubbleCategories, bubbleFieldMap, defaultColumnKeys } from '../src/participantColumnConfig.js';
import { setupTestEnvironment, teardownTestEnvironment, installFirebaseStub, createMockParticipant, createDOMFixture, cleanupDOMFixture, clearAllState } from './helpers.js';
import fieldMapping from '../src/fieldToConceptIdMapping.js';
const getDefaultColumnsWithBubbles = () =>
  defaultColumnKeys.filter((columnKey) => bubbleFieldMap.has(columnKey));

const formatBadgeCount = (count) => (count === 0 ? '' : `${count} selected`);
const getFieldKeyValue = (field) =>
  typeof field === 'object' && field !== null ? field.key : field;

const toColumnKeyString = (key) => String(key);
const deriveColumnMetadata = () => {
  const columnKeys = new Set();
  const labelsByKey = new Map();

  bubbleCategories.forEach((category) => {
    (category.fields ?? []).forEach((field) => {
      const keyValue = getFieldKeyValue(field);
      const keyString = toColumnKeyString(keyValue);
      columnKeys.add(keyString);

      if (!labelsByKey.has(keyString)) {
        labelsByKey.set(keyString, new Set());
      }
      labelsByKey.get(keyString).add(field.label);
    });
  });

  return { columnKeys, labelsByKey };
};

const { columnKeys: expectedColumnKeys, labelsByKey: columnLabelsByKey } = deriveColumnMetadata();

const expectBadgeDisplay = (badge, expectedCount) => {
  const text = badge.textContent.trim();
  if (expectedCount === 0) {
    expect(text).toBe('');
    expect(badge.classList.contains('d-none')).toBe(true);
  } else {
    expect(text).toBe(formatBadgeCount(expectedCount));
    expect(badge.classList.contains('d-none')).toBe(false);
  }
};

describe('participantCommons - Bubble Filter Functionality', () => {
  let firebaseStub;
  let mainContent;

  beforeEach(async () => {
    setupTestEnvironment();
    firebaseStub = installFirebaseStub({ uid: 'test-user' });
    await clearAllState();
    mainContent = createDOMFixture('mainContent');
  });

  afterEach(async () => {
    // Clean up any state that tests might have set
    const stateModule = await import('../src/stateManager.js');
    const { searchState, uiState } = stateModule?.default ?? stateModule;
    searchState?.clearSearchResults?.();
    uiState?.clear?.();
    cleanupDOMFixture(mainContent);
    teardownTestEnvironment();
  });

  describe('renderTable - Bubble Filter Rendering', () => {
    it('should render grouped bubble filters with dividers and default category bubbles', () => {
      const mockData = [createMockParticipant('test-1')];
      const html = renderTable(mockData, 'participantLookup');

      expect(html).toContain('columnFilterDiv');

      // Create a temporary container to parse and check bubbles
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      const bubbleContainer = tempDiv.querySelector('#columnFilterDiv');
      expect(bubbleContainer).not.toBeNull();

      const defaultCategory = bubbleContainer.querySelector('[data-category-key="default-columns"]');
      expect(defaultCategory).not.toBeNull();
      const defaultButtons = defaultCategory.querySelectorAll('button[name="column-filter"]');
      const defaultColumnsWithButtons = getDefaultColumnsWithBubbles();
      expect(defaultButtons.length).toBe(defaultColumnsWithButtons.length);
      expect(defaultCategory.querySelector('summary span').textContent).toContain('Default Columns');
      expect(defaultCategory.hasAttribute('open')).toBe(true);
      const defaultBody = defaultCategory.querySelector('.bubble-category-body');
      expect(defaultBody).not.toBeNull();
      expect(defaultBody.getAttribute('style')).toContain('margin-top');

      const nonDefaultCategories = bubbleContainer.querySelectorAll(
        '[data-category-key]:not([data-category-key="default-columns"])'
      );
      const expectedCategoryCount = bubbleCategories.length - 1;
      expect(nonDefaultCategories.length).toBe(expectedCategoryCount);

      const allCategories = Array.from(bubbleContainer.querySelectorAll('[data-category-key]'));
      expect(allCategories.length).toBe(bubbleCategories.length);
      const firstCategory = allCategories[0];
      expect(firstCategory).not.toBeNull();
      expect(firstCategory.getAttribute('data-category-key')).toBe('default-columns');
      expect(firstCategory.hasAttribute('open')).toBe(true);
      const lastCategory = allCategories[allCategories.length - 1];
      expect(lastCategory.getAttribute('data-category-key')).toBe('refusalsWithdrawals');
      expect(lastCategory.hasAttribute('open')).toBe(false);

      bubbleCategories.forEach((category) => {
        const categorySummary = bubbleContainer.querySelector(
          `[data-category-key="${category.key}"] summary`
        );
        expect(categorySummary, `summary for ${category.key}`).not.toBeNull();
        expect(categorySummary.textContent).toContain(category.label);
      });

      const bubbles = bubbleContainer.querySelectorAll('button[name="column-filter"]');
      expect(bubbles.length).toBeGreaterThan(0);
      expect(bubbles.length).toBeGreaterThanOrEqual(bubbleFieldMap.size);
    });

    it('renders header, total badge, reset button, and toggle text', () => {
      const mockData = [createMockParticipant('test-1')];
      mainContent.innerHTML = renderTable(mockData, 'participantLookup');
      renderParticipantSearchResults(mockData, 'participantLookup');
      setupActiveColumns(mockData);

      const heading = document.querySelector('#bubbleFiltersContainer h5');
      expect(heading).not.toBeNull();
      expect(heading.textContent.trim()).toBe('Fields to Display');

      const totalBadge = document.getElementById('bubbleFiltersTotalBadge');
      expect(totalBadge).not.toBeNull();
      expect(totalBadge.classList.contains('d-none')).toBe(false);
      expect(totalBadge.textContent.trim()).toBe(formatBadgeCount(getActiveColumns().length));

      const resetButton = document.getElementById('resetToDefaultFieldsButton');
      expect(resetButton).not.toBeNull();
      expect(resetButton.textContent.trim()).toBe('Reset To Default Fields');

      const toggleButton = document.getElementById('toggleBubbleFilters');
      const toggleLabel = document.getElementById('bubbleFiltersToggleLabel');
      expect(toggleButton).not.toBeNull();
      expect(toggleLabel.textContent.trim()).toBe('Hide field selectors');
      expect(toggleButton.getAttribute('aria-expanded')).toBe('true');
    });

    it('respects stored collapsed state and updates on toggle', async () => {
      await uiState.setFiltersExpanded(false);

      const mockData = [createMockParticipant('test-1')];
      mainContent.innerHTML = renderTable(mockData, 'participantLookup');
      renderParticipantSearchResults(mockData, 'participantLookup');
      setupActiveColumns(mockData);

      const filtersBody = document.getElementById('bubbleFiltersBody');
      const toggleButton = document.getElementById('toggleBubbleFilters');
      const toggleLabel = document.getElementById('bubbleFiltersToggleLabel');

      expect(filtersBody.classList.contains('d-none')).toBe(true);
      expect(toggleLabel.textContent.trim()).toBe('Show field selectors');
      expect(toggleButton.getAttribute('aria-expanded')).toBe('false');

      toggleButton.click();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(filtersBody.classList.contains('d-none')).toBe(false);
      expect(toggleLabel.textContent.trim()).toBe('Hide field selectors');
      expect(toggleButton.getAttribute('aria-expanded')).toBe('true');
      expect(uiState.isFiltersExpanded()).toBe(true);
    });

    it('should render default column chips with matching labels and selected state', () => {
      const mockData = [createMockParticipant('test-1')];
      const html = renderTable(mockData, 'participantLookup');

      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      const defaultCategory = tempDiv.querySelector('[data-category-key="default-columns"]');
      expect(defaultCategory).not.toBeNull();

      const buttons = Array.from(
        defaultCategory.querySelectorAll('button[name="column-filter"]')
      );
      expect(buttons.length).toBe(getDefaultColumnsWithBubbles().length);

      buttons.forEach((button) => {
        const key = normalizeColumnValue(button.dataset.column);
        const expectedLabel = bubbleFieldMap.get(key);
        expect(button.textContent.trim()).toBe(expectedLabel);
      });
    });

    it('should render bubbles with correct data-column attributes', () => {
      const mockData = [createMockParticipant('test-1')];
      const html = renderTable(mockData, 'participantLookup');

      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      const bubbles = tempDiv.querySelectorAll('button[name="column-filter"]');

      bubbles.forEach((bubble) => {
        expect(bubble.hasAttribute('data-column')).toBe(true);
        const columnKey = bubble.getAttribute('data-column');
        expect(columnKey).not.toBe('');
        expect(expectedColumnKeys.has(columnKey)).toBe(true);
      });
    });

    it('should include a reset to default fields button', () => {
      const mockParticipant = [createMockParticipant('test-1')];
      const html = renderTable(mockParticipant, 'participantLookup');

      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      const resetButton = tempDiv.querySelector('#resetToDefaultFieldsButton');
      expect(resetButton).not.toBeNull();
      expect(resetButton.textContent.trim()).toBe('Reset To Default Fields');
    });

    it('should render bubbles with correct labels from bubbleFieldMap', () => {
      const mockData = [createMockParticipant('test-1')];
      const html = renderTable(mockData, 'participantLookup');

      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      const bubbles = tempDiv.querySelectorAll('button[name="column-filter"]');

      bubbles.forEach((bubble) => {
        const columnKey = bubble.getAttribute('data-column');
        const labelOptions = columnLabelsByKey.get(columnKey);
        const bubbleLabel = bubble.textContent.trim();

        if (labelOptions?.size) {
          expect(labelOptions.has(bubbleLabel)).toBe(true);
        } else {
          const normalizedKey = normalizeColumnValue(columnKey);
          const expectedLabel = bubbleFieldMap.get(normalizedKey);
          expect(expectedLabel).toBeDefined();
          expect(bubbleLabel).toBe(expectedLabel);
        }
      });
    });

    it('should use category-provided labels for each bubble', () => {
      const mockData = [createMockParticipant('test-1')];
      const html = renderTable(mockData, 'participantLookup');

      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;

      bubbleCategories.forEach((category) => {
        const categoryContainer = tempDiv.querySelector(`[data-category-key="${category.key}"]`);
        expect(categoryContainer, `missing container for ${category.key}`).not.toBeNull();

        const buttons = categoryContainer.querySelectorAll('button[name="column-filter"]');
        const expectedLabels = category.fields.map((field) => field.label);
        const actualLabels = Array.from(buttons).map((btn) => btn.textContent.trim());
        expect(actualLabels).toEqual(expectedLabels);
      });
    });

    it('should render table structure with header placeholder', () => {
      const mockData = [createMockParticipant('test-1')];
      const html = renderTable(mockData, 'participantLookup');

      expect(html).toContain('dataTable');
      expect(html).toContain('table');
    });

    it('should render "Back to Search" button for lookup searches', () => {
      const mockData = [createMockParticipant('test-1')];
      const html = renderTable(mockData, 'participantLookup');

      expect(html).toContain('back-to-search');
      expect(html).toContain('Back to Search');
    });

    it('should not render "Back to Search" button for predefined searches', () => {
      const mockData = [createMockParticipant('test-1')];
      const html = renderTable(mockData, 'all');

      expect(html).not.toContain('back-to-search');
    });
  });

  describe('activeColumns - Column Visibility Control', () => {
    let mockData;
    const ensureColumnState = async (columnKey, shouldBeActive) => {
      const normalizedKey = normalizeColumnValue(columnKey);
      const activeCols = getActiveColumns();
      if (activeCols.includes(normalizedKey) === shouldBeActive) {
        return;
      }
      const button = Array.from(document.getElementsByName('column-filter')).find(
        (btn) => btn.dataset.column === columnKey
      );
      expect(button, `button for ${columnKey}`).not.toBeNull();
      button.click();
      await waitForActiveColumnsUpdate();
    };

    beforeEach(() => {
      mockData = [
        createMockParticipant('test-1', {
          [fieldMapping.fName]: 'John',
          [fieldMapping.lName]: 'Doe',
          token: 'token-123',
          pin: '1234',
        }),
        createMockParticipant('test-2', {
          [fieldMapping.fName]: 'Jane',
          [fieldMapping.lName]: 'Smith',
          token: 'token-456',
          pin: '5678',
        }),
      ];
    });

    it('should mark default columns as active', () => {
      // Render table page to set up DOM
      mainContent.innerHTML = renderTable(mockData, 'participantLookup');
      renderParticipantSearchResults(mockData, 'participantLookup');
      setupActiveColumns(mockData);

      const bubbles = document.getElementsByName('column-filter');
      
      // Filter default columns to only include those that have bubbles (are in bubbleFieldMap)
      const defaultColumnsWithBubbles = defaultColumnKeys.filter((columnKey) => {
        return (
          bubbleFieldMap.has(columnKey) ||
          (typeof columnKey === 'number' && bubbleFieldMap.has(columnKey.toString())) ||
          (typeof columnKey === 'string' && !isNaN(columnKey) && bubbleFieldMap.has(parseInt(columnKey, 10)))
        );
      });

      defaultColumnsWithBubbles.forEach((columnKey) => {
        // Find bubble - dataset.column is always a string
        const bubble = Array.from(bubbles).find((btn) => {
          const btnColumn = btn.dataset.column;
          return btnColumn === columnKey.toString() || 
                 (!isNaN(btnColumn) && !isNaN(columnKey) && parseInt(btnColumn) === parseInt(columnKey));
        });
        
        expect(bubble).not.toBeNull();
        // All default columns with bubbles should be marked as active
        expect(bubble.classList.contains('filter-active')).toBe(true);
        const activeCols = getActiveColumns();
        expect(activeCols.includes(columnKey) || activeCols.includes(columnKey.toString())).toBe(true);
      });
    });

    it('should add column when inactive bubble is clicked', async () => {
      mainContent.innerHTML = renderTable(mockData, 'participantLookup');
      renderParticipantSearchResults(mockData, 'participantLookup');
      setupActiveColumns(mockData);

      const initialColumnCount = getActiveColumns().length;
      const tokenBubble = Array.from(document.getElementsByName('column-filter')).find(
        (btn) => btn.dataset.column === 'token'
      );

      expect(tokenBubble).not.toBeNull();
      expect(tokenBubble.classList.contains('filter-active')).toBe(false);
      expect(getActiveColumns().includes('token')).toBe(false);

      // Click the bubble
      tokenBubble.click();
      await waitForActiveColumnsUpdate();

      expect(tokenBubble.classList.contains('filter-active')).toBe(true);
      const activeColsAfter = getActiveColumns();
      expect(activeColsAfter.includes('token')).toBe(true);
      expect(activeColsAfter.length).toBe(initialColumnCount + 1);
    });

    it('should display accurate category badge counts after setup', () => {
      mainContent.innerHTML = renderTable(mockData, 'participantLookup');
      renderParticipantSearchResults(mockData, 'participantLookup');
      setupActiveColumns(mockData);

      const activeCols = getActiveColumns();

      bubbleCategories.forEach((category) => {
        const badge = document.querySelector(`[data-category-count="${category.key}"]`);
        expect(badge, `badge for ${category.key}`).not.toBeNull();
        const expectedCount = category.fields.reduce((count, field) => {
          const normalizedKey = normalizeColumnValue(getFieldKeyValue(field));
          return activeCols.includes(normalizedKey) ? count + 1 : count;
        }, 0);
        expectBadgeDisplay(badge, expectedCount);
      });

      const defaultBadge = document.querySelector('[data-category-count="default-columns"]');
      if (defaultBadge) {
        const expectedCount = getDefaultColumnsWithBubbles().reduce((count, fieldKey) => {
          const normalizedKey = normalizeColumnValue(fieldKey);
          return activeCols.includes(normalizedKey) ? count + 1 : count;
        }, 0);
        const activeDefaultButtons = document.querySelectorAll(
          '[data-category-key="default-columns"] button.filter-active'
        ).length;
        expectBadgeDisplay(defaultBadge, expectedCount);
        if (expectedCount === 0) {
          expect(
            activeDefaultButtons,
            'default category should have zero active buttons when badge is hidden'
          ).toBe(0);
        }
      }
    });

    it('should update category badge counts when toggling filters', async () => {
      mainContent.innerHTML = renderTable(mockData, 'participantLookup');
      renderParticipantSearchResults(mockData, 'participantLookup');
      setupActiveColumns(mockData);

      const identifiersBadge = document.querySelector('[data-category-count="identifiers"]');
      expect(identifiersBadge).not.toBeNull();

      const identifiersCategory = bubbleCategories.find((category) => category.key === 'identifiers');
      expect(identifiersCategory).toBeDefined();

      const getExpectedBadgeCount = () => {
        const activeCols = getActiveColumns();
        return identifiersCategory.fields.reduce((count, field) => {
          const normalizedKey = normalizeColumnValue(getFieldKeyValue(field));
          return activeCols.includes(normalizedKey) ? count + 1 : count;
        }, 0);
      };

      const assertBadgeMatchesState = () => {
        const badge = document.querySelector('[data-category-count="identifiers"]');
        expectBadgeDisplay(badge, getExpectedBadgeCount());
      };

      const tokenBubble = Array.from(document.getElementsByName('column-filter')).find(
        (btn) => btn.dataset.column === 'token'
      );
      expect(tokenBubble).not.toBeNull();

      assertBadgeMatchesState();

      tokenBubble.click();
      await waitForActiveColumnsUpdate();
      assertBadgeMatchesState();

      tokenBubble.click();
      await waitForActiveColumnsUpdate();
      assertBadgeMatchesState();
    });

    it('should reset columns to defaults and collapse categories via the reset button', async () => {
      mainContent.innerHTML = renderTable(mockData, 'participantLookup');
      renderParticipantSearchResults(mockData, 'participantLookup');
      setupActiveColumns(mockData);

      const tokenBubble = Array.from(document.getElementsByName('column-filter')).find(
        (btn) => btn.dataset.column === 'token'
      );
      const connectIdBubble = Array.from(document.getElementsByName('column-filter')).find(
        (btn) => btn.dataset.column === 'Connect_ID'
      );

      expect(tokenBubble).not.toBeNull();
      expect(connectIdBubble).not.toBeNull();

      tokenBubble.click();
      await waitForActiveColumnsUpdate();
      connectIdBubble.click();
      await waitForActiveColumnsUpdate();
      expect(getActiveColumns()).not.toEqual(defaultColumnKeys);

      const resetToDefaultFieldsButton = document.getElementById('resetToDefaultFieldsButton');
      expect(resetToDefaultFieldsButton).not.toBeNull();
      resetToDefaultFieldsButton.click();
      await waitForActiveColumnsUpdate();

      expect(getActiveColumns()).toEqual(defaultColumnKeys);

      const categories = Array.from(document.querySelectorAll('[data-category-key]'));
      expect(categories[0].open).toBe(true);
      categories.slice(1).forEach((el) => expect(el.open).toBe(false));
    });


    it('should remove column when active bubble is clicked', async () => {
      mainContent.innerHTML = renderTable(mockData, 'participantLookup');
      renderParticipantSearchResults(mockData, 'participantLookup');
      setupActiveColumns(mockData);

      // Find a default column bubble that's in bubbleFieldMap (Connect_ID is a good choice)
      const connectIdBubble = Array.from(document.getElementsByName('column-filter')).find(
        (btn) => btn.dataset.column === 'Connect_ID'
      );

      expect(connectIdBubble).not.toBeNull();
      expect(connectIdBubble.classList.contains('filter-active')).toBe(true);
      expect(getActiveColumns().includes('Connect_ID')).toBe(true);

      const initialColumnCount = getActiveColumns().length;

      // Click to remove
      connectIdBubble.click();
      await waitForActiveColumnsUpdate();

      expect(connectIdBubble.classList.contains('filter-active')).toBe(false);
      const activeColsAfter = getActiveColumns();
      expect(activeColsAfter.includes('Connect_ID')).toBe(false);
      expect(activeColsAfter.length).toBe(initialColumnCount - 1);
    });

    it('should re-render table when bubble is clicked', async () => {
      mainContent.innerHTML = renderTable(mockData, 'participantLookup');
      renderParticipantSearchResults(mockData, 'participantLookup');
      setupActiveColumns(mockData);

      const tokenBubble = Array.from(document.getElementsByName('column-filter')).find(
        (btn) => btn.dataset.column === 'token'
      );

      // Get initial table HTML
      const initialTableHTML = document.getElementById('dataTable').innerHTML;

      // Click to add token column
      tokenBubble.click();
      await waitForActiveColumnsUpdate();

      // Table should be re-rendered
      const updatedTableHTML = document.getElementById('dataTable').innerHTML;
      expect(updatedTableHTML).not.toBe(initialTableHTML);
    });

    it('should handle multiple bubble clicks correctly', async () => {
      mainContent.innerHTML = renderTable(mockData, 'participantLookup');
      renderParticipantSearchResults(mockData, 'participantLookup');
      setupActiveColumns(mockData);

      const tokenBubble = Array.from(document.getElementsByName('column-filter')).find(
        (btn) => btn.dataset.column === 'token'
      );
      const pinBubble = Array.from(document.getElementsByName('column-filter')).find(
        (btn) => btn.dataset.column === 'pin'
      );

      await ensureColumnState('token', false);
      await ensureColumnState('pin', false);

      const initialCount = getActiveColumns().length;

      // Add token
      tokenBubble.click();
      await waitForActiveColumnsUpdate();
      let activeCols = getActiveColumns();
      expect(activeCols.includes('token')).toBe(true);
      expect(activeCols.length).toBe(initialCount + 1);

      // Add pin
      pinBubble.click();
      await waitForActiveColumnsUpdate();
      activeCols = getActiveColumns();
      expect(activeCols.includes('pin')).toBe(true);
      expect(activeCols.length).toBe(initialCount + 2);

      // Remove token
      tokenBubble.click();
      await waitForActiveColumnsUpdate();
      activeCols = getActiveColumns();
      expect(activeCols.includes('token')).toBe(false);
      expect(activeCols.includes('pin')).toBe(true);
      expect(activeCols.length).toBe(initialCount + 1);
    });

    it('should keep duplicate bubbles (default + category) in sync', async () => {
      mainContent.innerHTML = renderTable(mockData, 'participantLookup');
      renderParticipantSearchResults(mockData, 'participantLookup');
      setupActiveColumns(mockData);

      const defaultConnectButton = document.querySelector(
        '[data-category-key="default-columns"] button[data-column="Connect_ID"]'
      );
      const identifierConnectButton = document.querySelector(
        '[data-category-key="identifiers"] button[data-column="Connect_ID"]'
      );

      expect(defaultConnectButton).not.toBeNull();
      expect(identifierConnectButton).not.toBeNull();

      const assertButtonsMatch = (expectedActive) => {
        expect(defaultConnectButton.classList.contains('filter-active')).toBe(expectedActive);
        expect(identifierConnectButton.classList.contains('filter-active')).toBe(expectedActive);
      };

      await ensureColumnState('Connect_ID', true);
      assertButtonsMatch(true);

      defaultConnectButton.click();
      await waitForActiveColumnsUpdate();
      assertButtonsMatch(false);
      expect(getActiveColumns().includes('Connect_ID')).toBe(false);

      identifierConnectButton.click();
      await waitForActiveColumnsUpdate();
      assertButtonsMatch(true);
      expect(getActiveColumns().includes('Connect_ID')).toBe(true);
    });

    it('should update table headers when columns are added/removed', async () => {
      mainContent.innerHTML = renderTable(mockData, 'participantLookup');
      renderParticipantSearchResults(mockData, 'participantLookup');
      setupActiveColumns(mockData);

      const tokenBubble = Array.from(document.getElementsByName('column-filter')).find(
        (btn) => btn.dataset.column === 'token'
      );

      // Count headers before adding token
      const headersBefore = document.querySelectorAll('#dataTable thead th');
      const headerCountBefore = headersBefore.length;

      // Add token column
      tokenBubble.click();
      await waitForActiveColumnsUpdate();

      // Count headers after adding token
      const headersAfter = document.querySelectorAll('#dataTable thead th');
      expect(headersAfter.length).toBe(headerCountBefore + 1);

      // Check that token header exists
      const tokenHeader = Array.from(headersAfter).find(
        (th) => th.textContent.trim() === bubbleFieldMap.get('token')
      );
      expect(tokenHeader).not.toBeNull();
    });
  });

  describe('renderTablePage - Integration with Search Paths', () => {
    let mockData;

    beforeEach(() => {
      mockData = [
        createMockParticipant('test-1'),
        createMockParticipant('test-2'),
      ];
    });

    it('should render table page for lookup search path', () => {
      renderTablePage(mockData, 'participantLookup');

      expect(mainContent.innerHTML).toContain('dataTable');
      expect(mainContent.innerHTML).toContain('columnFilterDiv');
      expect(mainContent.innerHTML).toContain('back-to-search');

      const bubbles = document.getElementsByName('column-filter');
      expect(bubbles.length).toBeGreaterThan(0);
    });

    it('should render table page for predefined search path', async () => {
      // Set up metadata for predefined search
      const metadata = buildPredefinedSearchMetadata({
        predefinedType: 'all',
        effectiveType: 'all',
        routeKey: 'all',
      });
      await searchState.setSearchResults(metadata, mockData);

      renderTablePage(mockData, 'all');

      expect(mainContent.innerHTML).toContain('dataTable');
      expect(mainContent.innerHTML).toContain('columnFilterDiv');
      expect(mainContent.innerHTML).not.toContain('back-to-search');

      const bubbles = document.getElementsByName('column-filter');
      expect(bubbles.length).toBeGreaterThan(0);
    });

    it('should initialize activeColumns after rendering table page', async () => {
      uiState.clear();
      
      renderTablePage(mockData, 'participantLookup');

      const bubbles = document.getElementsByName('column-filter');
      
      // Filter default columns to only include those that have bubbles (are in bubbleFieldMap)
      const defaultColumnsWithBubbles = defaultColumnKeys.filter((columnKey) => {
        return (
          bubbleFieldMap.has(columnKey) ||
          (typeof columnKey === 'number' && bubbleFieldMap.has(columnKey.toString())) ||
          (typeof columnKey === 'string' && !isNaN(columnKey) && bubbleFieldMap.has(parseInt(columnKey, 10)))
        );
      });

      defaultColumnsWithBubbles.forEach((columnKey) => {
        // Find bubble - dataset.column is always a string
        const bubble = Array.from(bubbles).find((btn) => {
          const btnColumn = btn.dataset.column;
          return btnColumn === columnKey.toString() || 
                 (!isNaN(btnColumn) && !isNaN(columnKey) && parseInt(btnColumn) === parseInt(columnKey));
        });
        
        expect(bubble).not.toBeNull();
        // All default columns with bubbles should be marked as active
        expect(bubble.classList.contains('filter-active')).toBe(true);
        const activeCols = getActiveColumns();
        expect(activeCols.includes(columnKey) || activeCols.includes(columnKey.toString())).toBe(true);
      });
    });
  });

  describe('renderParticipantSearchResults - Table Rendering', () => {
    it('should render table with default columns', () => {
      const mockData = [
        createMockParticipant('test-1', {
          [fieldMapping.fName]: 'John',
          [fieldMapping.lName]: 'Doe',
        }),
      ];

      mainContent.innerHTML = renderTable(mockData, 'participantLookup');
      renderParticipantSearchResults(mockData, 'participantLookup');
      setupActiveColumns(mockData);

      const table = document.getElementById('dataTable');
      expect(table).not.toBeNull();

      const headers = table.querySelectorAll('thead th');
      expect(headers.length).toBe(getActiveColumns().length + 1); // +1 for Select column

      // Check that Select column exists
      const selectHeader = Array.from(headers).find(
        (th) => th.textContent.trim() === 'Select'
      );
      expect(selectHeader).not.toBeNull();
    });

    it('should render table rows with participant data', () => {
      const mockData = [
        createMockParticipant('test-1', {
          [fieldMapping.fName]: 'John',
          [fieldMapping.lName]: 'Doe',
          token: 'token-123',
        }),
      ];

      mainContent.innerHTML = renderTable(mockData, 'participantLookup');
      renderParticipantSearchResults(mockData, 'participantLookup');
      setupActiveColumns(mockData);

      const table = document.getElementById('dataTable');
      const rows = table.querySelectorAll('tbody tr');
      expect(rows.length).toBe(mockData.length);

      // Check that Select button exists in first row
      const firstRow = rows[0];
      const selectButton = firstRow.querySelector('.select-participant');
      expect(selectButton).not.toBeNull();
      expect(selectButton.dataset.token).toBe('token-123');
    });

    it('should handle empty data array', () => {
      const emptyData = [];
      const html = renderTable(emptyData, 'participantLookup');
      expect(html).toBe('No data found!');
    });

    it('should limit results to 50 rows', () => {
      const largeDataSet = Array.from({ length: 100 }, (_, i) =>
        createMockParticipant(`test-${i}`)
      );

      mainContent.innerHTML = renderTable(largeDataSet, 'participantLookup');
      renderParticipantSearchResults(largeDataSet, 'participantLookup');

      // Check that data was spliced (this happens in renderParticipantSearchResults)
      expect(largeDataSet.length).toBe(50);
    });
  });

  describe('filterBySiteKey', () => {
    const siteCode1 = 452412599; // KP NW
    const siteCode2 = 125001209; // KP CO

    it('should return all data when siteAbbr is "allResults"', () => {
      const mockData = [
        createMockParticipant('test-1', {
          [fieldMapping.healthcareProvider]: siteCode1,
        }),
        createMockParticipant('test-2', {
          [fieldMapping.healthcareProvider]: siteCode2,
        }),
      ];

      const filtered = filterBySiteKey(mockData, 'allResults');
      expect(filtered.length).toBe(2);
    });

    it('should return all data when siteAbbr is null or undefined', () => {
      const mockData = [
        createMockParticipant('test-1', {
          [fieldMapping.healthcareProvider]: siteCode1,
        }),
      ];

      expect(filterBySiteKey(mockData, null).length).toBe(1);
      expect(filterBySiteKey(mockData, undefined).length).toBe(1);
    });

    it('should filter by site code', () => {
      const mockData = [
        createMockParticipant('test-1', {
          [fieldMapping.healthcareProvider]: siteCode1,
        }),
        createMockParticipant('test-2', {
          [fieldMapping.healthcareProvider]: siteCode2,
        }),
      ];

      const filtered = filterBySiteKey(mockData, 'kpNW');
      expect(filtered.length).toBe(1);
      expect(filtered[0][fieldMapping.healthcareProvider]).toBe(siteCode1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle bubbles for columns not in bubbleFieldMap', () => {
      const mockData = [createMockParticipant('test-1')];
      mainContent.innerHTML = renderTable(mockData, 'participantLookup');
      renderParticipantSearchResults(mockData, 'participantLookup');
      setupActiveColumns(mockData);

      // Should not throw errors when processing bubbles
      const bubbles = document.getElementsByName('column-filter');
      expect(bubbles.length).toBeGreaterThan(0);
    });

    it('should handle clicking bubbles multiple times rapidly', async () => {
      const mockData = [createMockParticipant('test-1')];
      mainContent.innerHTML = renderTable(mockData, 'participantLookup');
      renderParticipantSearchResults(mockData, 'participantLookup');
      setupActiveColumns(mockData);

      const tokenBubble = Array.from(document.getElementsByName('column-filter')).find(
        (btn) => btn.dataset.column === 'token'
      );

      const initialCount = getActiveColumns().length;

      // Rapid clicks
      for (let i = 0; i < 3; i++) {
        tokenBubble.click();
        await waitForActiveColumnsUpdate();
      }

      // Should end up in a consistent state (either added or removed)
      const activeCols = getActiveColumns();
      const finalCount = activeCols.length;
      const isIncluded = activeCols.includes('token');
      const isActive = tokenBubble.classList.contains('filter-active');

      // State should be consistent
      expect(isIncluded).toBe(isActive);
      // Count should differ by at most 1 from initial
      expect(Math.abs(finalCount - initialCount)).toBeLessThanOrEqual(1);
      uiState.clear();
    });

    it('should maintain bubble state across table re-renders', async () => {
      const mockData = [createMockParticipant('test-1')];
      mainContent.innerHTML = renderTable(mockData, 'participantLookup');
      renderParticipantSearchResults(mockData, 'participantLookup');
      setupActiveColumns(mockData);

      const tokenBubble = Array.from(document.getElementsByName('column-filter')).find(
        (btn) => btn.dataset.column === 'token'
      );

      // Add token column
      tokenBubble.click();
      await waitForActiveColumnsUpdate();

      expect(getActiveColumns().includes('token')).toBe(true);
      
      // Re-render (simulating bubble filter re-render)
      renderParticipantSearchResults(mockData, 'bubbleFilters');

      // Token should still be in active columns
      expect(getActiveColumns().includes('token')).toBe(true);
      
      uiState.clear();
    });
  });

  describe('Column Selection Persistence', () => {
    let mockData;

    beforeEach(() => {
      mockData = [
        createMockParticipant('test-1'),
        createMockParticipant('test-2'),
      ];
    });

    it('should persist column selections to searchState', async () => {
      mainContent.innerHTML = renderTable(mockData, 'participantLookup');
      renderParticipantSearchResults(mockData, 'participantLookup');
      setupActiveColumns(mockData);

      const tokenBubble = Array.from(document.getElementsByName('column-filter')).find(
        (btn) => btn.dataset.column === 'token'
      );

      // Add token column
      tokenBubble.click();
      await waitForActiveColumnsUpdate();

      // Check that state was updated
      const savedColumns = uiState.getActiveColumns();
      expect(savedColumns).toBeDefined();
      expect(Array.isArray(savedColumns)).toBe(true);
      expect(savedColumns.includes('token')).toBe(true);
      
      uiState.clear();
    });

    it('should restore column selections from uiState on renderTablePage', async () => {
      // Set up saved columns in state
      const savedColumns = [
        fieldMapping.fName,
        fieldMapping.lName,
        fieldMapping.email,
        'token',
        'pin',
      ];
      await uiState.updateActiveColumns(savedColumns);

      // Render table page - should restore saved columns
      renderTablePage(mockData, 'participantLookup');

      const activeCols = getActiveColumns();
      expect(activeCols.length).toBe(savedColumns.length);
      savedColumns.forEach((col) => {
        expect(activeCols.includes(col) || activeCols.includes(col.toString())).toBe(true);
      });

      // Check that bubbles are marked as active
      const bubbles = document.getElementsByName('column-filter');
      const tokenBubble = Array.from(bubbles).find((btn) => btn.dataset.column === 'token');
      const pinBubble = Array.from(bubbles).find((btn) => btn.dataset.column === 'pin');
      expect(tokenBubble.classList.contains('filter-active')).toBe(true);
      expect(pinBubble.classList.contains('filter-active')).toBe(true);
      
      uiState.clear();
    });

    it('should use default columns when no saved state exists', () => {
      renderTablePage(mockData, 'participantLookup');

      // Use defaultColumnKeys to ensure test stays in sync with production code
      const activeCols = getActiveColumns();
      expect(activeCols.length).toBe(defaultColumnKeys.length);
      defaultColumnKeys.forEach((col) => {
        expect(activeCols.includes(col) || activeCols.includes(col.toString())).toBe(true);
      });
    });

    it('should persist column changes across table re-renders', async () => {
      mainContent.innerHTML = renderTable(mockData, 'participantLookup');
      renderParticipantSearchResults(mockData, 'participantLookup');
      setupActiveColumns(mockData);

      const tokenBubble = Array.from(document.getElementsByName('column-filter')).find(
        (btn) => btn.dataset.column === 'token'
      );

      // Add token
      tokenBubble.click();
      await waitForActiveColumnsUpdate();

      // Simulate re-render
      renderTablePage(mockData, 'participantLookup');

      // Token should still be in active columns
      expect(getActiveColumns().includes('token')).toBe(true);
      const savedColumns = uiState.getActiveColumns();
      expect(savedColumns).toBeDefined();
      expect(savedColumns.includes('token')).toBe(true);
      
      uiState.clear();
    });

    it('should persist columns when searchState.clearSearchResults() is called', async () => {
      uiState.clear();
      
      mainContent.innerHTML = renderTable(mockData, 'participantLookup');
      renderParticipantSearchResults(mockData, 'participantLookup');
      setupActiveColumns(mockData);

      const tokenBubble = Array.from(document.getElementsByName('column-filter')).find(
        (btn) => btn.dataset.column === 'token'
      );

      // Add token
      tokenBubble.click();
      await waitForActiveColumnsUpdate();

      // Verify token is in columns
      expect(getActiveColumns().includes('token')).toBe(true);

      // Clear search results - columns should persist
      searchState.clearSearchResults();
      expect(uiState.getActiveColumns()).toBeDefined();
      expect(uiState.getActiveColumns().includes('token')).toBe(true);
      expect(getActiveColumns().includes('token')).toBe(true);
      
      uiState.clear();
    });
  });

  describe('Integration Tests - Filters and Pagination', () => {
    let mockData;

    beforeEach(() => {
      mockData = [
        createMockParticipant('test-1', {
          [fieldMapping.fName]: 'John',
          [fieldMapping.lName]: 'Doe',
          token: 'token-123',
        }),
        createMockParticipant('test-2', {
          [fieldMapping.fName]: 'Jane',
          [fieldMapping.lName]: 'Smith',
          token: 'token-456',
        }),
      ];
    });

    it('should maintain column selections when pagination is used', async () => {
      // Set up columns in uiState
      await uiState.updateActiveColumns([fieldMapping.fName, fieldMapping.lName, 'token']);

      // Set up predefined search with pagination
      const metadata = buildPredefinedSearchMetadata({
        predefinedType: 'all',
        pageNumber: 1,
      });
      await searchState.setSearchResults(metadata, mockData);

      renderTablePage(mockData, 'all');

      // Verify columns are set (from uiState, not search metadata)
      expect(getActiveColumns().includes('token')).toBe(true);

      // Simulate pagination update - columns should persist
      await searchState.updatePredefinedMetadata({
        pageNumber: 2,
      });

      // Columns should still be available from uiState
      expect(uiState.getActiveColumns()).toBeDefined();
      expect(uiState.getActiveColumns().includes('token')).toBe(true);
    });

    it('should maintain column selections when site filter changes', async () => {
      // Set up columns in uiState
      await uiState.updateActiveColumns([fieldMapping.fName, 'token', 'pin']);

      const metadata = buildPredefinedSearchMetadata({
        predefinedType: 'all',
      });
      await searchState.setSearchResults(metadata, mockData);

      renderTablePage(mockData, 'all');

      // Change site filter
      await searchState.updatePredefinedMetadata({
        siteCode: 452412599, // KP NW
      });

      // Columns should still be available from uiState
      expect(uiState.getActiveColumns()).toBeDefined();
      expect(uiState.getActiveColumns().includes('token')).toBe(true);
      expect(uiState.getActiveColumns().includes('pin')).toBe(true);
    });

    it('should maintain column selections when date filters are applied', async () => {
      // Set up columns in uiState
      await uiState.updateActiveColumns([fieldMapping.fName, fieldMapping.email, 'Connect_ID']);

      const metadata = buildPredefinedSearchMetadata({
        predefinedType: 'all',
      });
      await searchState.setSearchResults(metadata, mockData);

      renderTablePage(mockData, 'all');

      // Apply date filter
      await searchState.updatePredefinedMetadata({
        startDateFilter: '2024-01-01',
        endDateFilter: '2024-12-31',
      });

      // Columns should still be available from uiState
      expect(uiState.getActiveColumns()).toBeDefined();
      expect(uiState.getActiveColumns().includes(fieldMapping.email)).toBe(true);
      expect(uiState.getActiveColumns().includes('Connect_ID')).toBe(true);
    });

    it('should maintain column selections when active/passive filter changes', async () => {
      // Set up columns in uiState
      await uiState.updateActiveColumns([fieldMapping.fName, 'token']);

      const metadata = buildPredefinedSearchMetadata({
        predefinedType: 'all',
        effectiveType: 'active',
      });
      await searchState.setSearchResults(metadata, mockData);

      renderTablePage(mockData, 'active');

      // Change to passive
      await searchState.updatePredefinedMetadata({
        effectiveType: 'passive',
      });

      // Columns should still be available from uiState
      expect(uiState.getActiveColumns()).toBeDefined();
      expect(uiState.getActiveColumns().includes('token')).toBe(true);
    });
  });

  describe('Specific Bubble Field Tests', () => {
    let mockData;

    beforeEach(() => {
      mockData = [createMockParticipant('test-1')];
    });

    // Test a representative subset of bubbles
    const testBubbles = [
      { key: 'token', label: 'Token' },
      { key: 'pin', label: 'Pin' },
      { key: 'studyId', label: 'Study ID' },
      { key: 'Connect_ID', label: 'Connect ID' },
      { key: fieldMapping.verifiedFlag, label: 'Verif Stat' },
      { key: fieldMapping.consentFlag, label: 'Consent Sub' },
      { key: fieldMapping.recruitmentType, label: 'Recruit Type' },
    ];

    testBubbles.forEach(({ key, label }) => {
      it(`should render and toggle "${label}" bubble correctly`, async () => {
        mainContent.innerHTML = renderTable(mockData, 'participantLookup');
        renderParticipantSearchResults(mockData, 'participantLookup');
        setupActiveColumns(mockData);

        const bubble = Array.from(document.getElementsByName('column-filter')).find(
          (btn) => {
            const btnColumn = btn.dataset.column;
            return btnColumn === key.toString() ||
                   (!isNaN(btnColumn) && !isNaN(key) && parseInt(btnColumn) === parseInt(key));
          }
        );

        expect(bubble).not.toBeNull();
        expect(bubble.textContent.trim()).toBe(label);

        const initialActive = bubble.classList.contains('filter-active');
        const initialActiveCols = getActiveColumns();
        const initialInColumns = initialActiveCols.includes(key) || initialActiveCols.includes(key.toString());

        // Toggle the bubble
        bubble.click();
        await waitForActiveColumnsUpdate();

        // State should have changed
        const afterActive = bubble.classList.contains('filter-active');
        const afterActiveCols = getActiveColumns();
        const afterInColumns = afterActiveCols.includes(key) || afterActiveCols.includes(key.toString());

        expect(afterActive).not.toBe(initialActive);
        expect(afterInColumns).not.toBe(initialInColumns);

        // Verify state persistence
        const savedColumns = uiState.getActiveColumns();
        if (afterInColumns) {
          expect(savedColumns).toBeDefined();
          expect(savedColumns.includes(key) || savedColumns.includes(key.toString())).toBe(true);
        }
      });
    });

    it('should render bubbles with correct labels from bubbleFieldMap for concept IDs', async () => {
      mainContent.innerHTML = renderTable(mockData, 'participantLookup');

      // Test numeric concept ID bubbles
      const verifiedBubble = Array.from(document.getElementsByName('column-filter')).find(
        (btn) => btn.dataset.column === fieldMapping.verifiedFlag.toString()
      );

      expect(verifiedBubble).not.toBeNull();
      const expectedLabel = bubbleFieldMap.get(fieldMapping.verifiedFlag);
      expect(expectedLabel, 'missing bubbleFieldMap label for verifiedFlag').toBeTypeOf('string');
      expect(verifiedBubble.textContent.trim()).toBe(expectedLabel);

      uiState.clear();
    });

    it('should handle adding multiple specific bubbles in sequence', async () => {  
      mainContent.innerHTML = renderTable(mockData, 'participantLookup');
      renderParticipantSearchResults(mockData, 'participantLookup');
      setupActiveColumns(mockData);

      const bubblesToAdd = ['token', 'pin', 'studyId'];
      const findBubble = (key) =>
        Array.from(document.getElementsByName('column-filter')).find(
          (btn) => btn.dataset.column === key
        );

      const ensureBubbleInactive = async (key) => {
        const bubble = findBubble(key);
        expect(bubble, `missing bubble for key ${key}`).toBeDefined();
        if (bubble.classList.contains('filter-active')) {
          bubble.click();
          await waitForActiveColumnsUpdate();
        }
        expect(bubble.classList.contains('filter-active')).toBe(false);
        return bubble;
      };

      const targetBubbles = [];
      for (const bubbleKey of bubblesToAdd) {
        const bubble = await ensureBubbleInactive(bubbleKey);
        targetBubbles.push({ key: bubbleKey, bubble });
      }

      const initialCount = getActiveColumns().length;

      for (const { bubble } of targetBubbles) {
        bubble.click();
        await waitForActiveColumnsUpdate();
        expect(bubble.classList.contains('filter-active')).toBe(true);
      }

      const finalActiveCols = getActiveColumns();
      expect(finalActiveCols.length).toBe(initialCount + bubblesToAdd.length);
      bubblesToAdd.forEach((key) => {
        expect(finalActiveCols.includes(key)).toBe(true);
      });

      // Verify all are persisted
      const savedColumns = uiState.getActiveColumns();
      expect(savedColumns).toBeDefined();
      bubblesToAdd.forEach((key) => {
        expect(savedColumns.includes(key)).toBe(true);
      });
      
      uiState.clear();
    });
  });
});
