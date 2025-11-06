import { expect } from 'chai';
import { renderTable, renderParticipantSearchResults, renderTablePage, setupActiveColumns, defaultColumns, filterBySiteKey, getActiveColumns, waitForActiveColumnsUpdate } from '../src/participantCommons.js';
import { searchState, buildPredefinedSearchMetadata, uiState } from '../src/stateManager.js';
import { searchBubbleMap, tableHeaderMap } from '../src/idsToName.js';
import { setupTestEnvironment, teardownTestEnvironment, installFirebaseStub, createMockParticipant, createDOMFixture, cleanupDOMFixture, clearAllState } from './helpers.js';
import fieldMapping from '../src/fieldToConceptIdMapping.js';

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
    const { searchState, uiState } = await import('../src/stateManager.js');
    searchState.clearSearchResults();
    uiState.clear();
    cleanupDOMFixture(mainContent);
    teardownTestEnvironment();
  });

  describe('renderTable - Bubble Filter Rendering', () => {
    it('should render bubble filters from searchBubbleMap', () => {
      const mockData = [createMockParticipant('test-1')];
      const html = renderTable(mockData, 'participantLookup');

      expect(html).to.include('columnFilter');
      expect(html).to.include('column-filter');

      // Create a temporary container to parse and check bubbles
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      const bubbleContainer = tempDiv.querySelector('#columnFilter');
      expect(bubbleContainer).to.not.be.null;

      const bubbles = bubbleContainer.querySelectorAll('button[name="column-filter"]');
      expect(bubbles.length).to.be.greaterThan(0);
      expect(bubbles.length).to.equal(searchBubbleMap.size);
    });

    it('should render bubbles with correct data-column attributes', () => {
      const mockData = [createMockParticipant('test-1')];
      const html = renderTable(mockData, 'participantLookup');

      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      const bubbles = tempDiv.querySelectorAll('button[name="column-filter"]');

      bubbles.forEach((bubble) => {
        expect(bubble.hasAttribute('data-column')).to.be.true;
        const columnKey = bubble.getAttribute('data-column');
        // searchBubbleMap has both string and numeric keys, so check both
        const hasStringKey = searchBubbleMap.has(columnKey);
        const hasNumericKey = !isNaN(columnKey) && searchBubbleMap.has(parseInt(columnKey));
        expect(hasStringKey || hasNumericKey).to.be.true;
      });
    });

    it('should render bubbles with correct labels from searchBubbleMap', () => {
      const mockData = [createMockParticipant('test-1')];
      const html = renderTable(mockData, 'participantLookup');

      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      const bubbles = tempDiv.querySelectorAll('button[name="column-filter"]');

      bubbles.forEach((bubble) => {
        const columnKey = bubble.getAttribute('data-column');
        // Try string key first, then numeric key
        let expectedLabel = searchBubbleMap.get(columnKey);
        if (!expectedLabel && !isNaN(columnKey)) {
          expectedLabel = searchBubbleMap.get(parseInt(columnKey));
        }
        expect(expectedLabel).to.not.be.undefined;
        expect(bubble.textContent.trim()).to.equal(expectedLabel);
      });
    });

    it('should render table structure with header placeholder', () => {
      const mockData = [createMockParticipant('test-1')];
      const html = renderTable(mockData, 'participantLookup');

      expect(html).to.include('dataTable');
      expect(html).to.include('table');
    });

    it('should render "Back to Search" button for lookup searches', () => {
      const mockData = [createMockParticipant('test-1')];
      const html = renderTable(mockData, 'participantLookup');

      expect(html).to.include('back-to-search');
      expect(html).to.include('Back to Search');
    });

    it('should not render "Back to Search" button for predefined searches', () => {
      const mockData = [createMockParticipant('test-1')];
      const html = renderTable(mockData, 'all');

      expect(html).to.not.include('back-to-search');
    });
  });

  describe('activeColumns - Column Visibility Control', () => {
    let mockData;

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
      
      // Filter defaultColumns to only include those that have bubbles (are in searchBubbleMap)
      // This ensures the test stays in sync with actual defaultColumns and won't drift over time
      const defaultColumnsWithBubbles = defaultColumns.filter((columnKey) => {
        // Check if columnKey exists in searchBubbleMap (handles both string and number keys)
        return searchBubbleMap.has(columnKey) || 
               (typeof columnKey === 'number' && searchBubbleMap.has(columnKey.toString())) ||
               (typeof columnKey === 'string' && !isNaN(columnKey) && searchBubbleMap.has(parseInt(columnKey, 10)));
      });

      defaultColumnsWithBubbles.forEach((columnKey) => {
        // Find bubble - dataset.column is always a string
        const bubble = Array.from(bubbles).find((btn) => {
          const btnColumn = btn.dataset.column;
          return btnColumn === columnKey.toString() || 
                 (!isNaN(btnColumn) && !isNaN(columnKey) && parseInt(btnColumn) === parseInt(columnKey));
        });
        
        expect(bubble).to.not.be.null;
        // All default columns with bubbles should be marked as active
        expect(bubble.classList.contains('filter-active')).to.be.true;
        const activeCols = getActiveColumns();
        expect(activeCols.includes(columnKey) || activeCols.includes(columnKey.toString())).to.be.true;
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

      expect(tokenBubble).to.not.be.null;
      expect(tokenBubble.classList.contains('filter-active')).to.be.false;
      expect(getActiveColumns().includes('token')).to.be.false;

      // Click the bubble
      tokenBubble.click();
      await waitForActiveColumnsUpdate();

      expect(tokenBubble.classList.contains('filter-active')).to.be.true;
      const activeColsAfter = getActiveColumns();
      expect(activeColsAfter.includes('token')).to.be.true;
      expect(activeColsAfter.length).to.equal(initialColumnCount + 1);
    });

    it('should remove column when active bubble is clicked', async () => {
      mainContent.innerHTML = renderTable(mockData, 'participantLookup');
      renderParticipantSearchResults(mockData, 'participantLookup');
      setupActiveColumns(mockData);

      // Find a default column bubble that's in searchBubbleMap (Connect_ID is a good choice)
      const connectIdBubble = Array.from(document.getElementsByName('column-filter')).find(
        (btn) => btn.dataset.column === 'Connect_ID'
      );

      expect(connectIdBubble).to.not.be.null;
      expect(connectIdBubble.classList.contains('filter-active')).to.be.true;
      expect(getActiveColumns().includes('Connect_ID')).to.be.true;

      const initialColumnCount = getActiveColumns().length;

      // Click to remove
      connectIdBubble.click();
      await waitForActiveColumnsUpdate();

      expect(connectIdBubble.classList.contains('filter-active')).to.be.false;
      const activeColsAfter = getActiveColumns();
      expect(activeColsAfter.includes('Connect_ID')).to.be.false;
      expect(activeColsAfter.length).to.equal(initialColumnCount - 1);
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
      expect(updatedTableHTML).to.not.equal(initialTableHTML);
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

      const initialCount = getActiveColumns().length;

      // Add token
      tokenBubble.click();
      await waitForActiveColumnsUpdate();
      let activeCols = getActiveColumns();
      expect(activeCols.includes('token')).to.be.true;
      expect(activeCols.length).to.equal(initialCount + 1);

      // Add pin
      pinBubble.click();
      await waitForActiveColumnsUpdate();
      activeCols = getActiveColumns();
      expect(activeCols.includes('pin')).to.be.true;
      expect(activeCols.length).to.equal(initialCount + 2);

      // Remove token
      tokenBubble.click();
      await waitForActiveColumnsUpdate();
      activeCols = getActiveColumns();
      expect(activeCols.includes('token')).to.be.false;
      expect(activeCols.includes('pin')).to.be.true;
      expect(activeCols.length).to.equal(initialCount + 1);
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
      expect(headersAfter.length).to.equal(headerCountBefore + 1);

      // Check that token header exists
      const tokenHeader = Array.from(headersAfter).find(
        (th) => th.textContent.trim() === searchBubbleMap.get('token')
      );
      expect(tokenHeader).to.not.be.null;
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

      expect(mainContent.innerHTML).to.include('dataTable');
      expect(mainContent.innerHTML).to.include('columnFilter');
      expect(mainContent.innerHTML).to.include('back-to-search');

      const bubbles = document.getElementsByName('column-filter');
      expect(bubbles.length).to.be.greaterThan(0);
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

      expect(mainContent.innerHTML).to.include('dataTable');
      expect(mainContent.innerHTML).to.include('columnFilter');
      expect(mainContent.innerHTML).to.not.include('back-to-search');

      const bubbles = document.getElementsByName('column-filter');
      expect(bubbles.length).to.be.greaterThan(0);
    });

    it('should initialize activeColumns after rendering table page', async () => {
      uiState.clear();
      
      renderTablePage(mockData, 'participantLookup');

      const bubbles = document.getElementsByName('column-filter');
      
      // Filter defaultColumns to only include those that have bubbles (are in searchBubbleMap)
      // This ensures the test stays in sync with actual defaultColumns and won't drift over time
      const defaultColumnsWithBubbles = defaultColumns.filter((columnKey) => {
        // Check if columnKey exists in searchBubbleMap (handles both string and number keys)
        return searchBubbleMap.has(columnKey) || 
               (typeof columnKey === 'number' && searchBubbleMap.has(columnKey.toString())) ||
               (typeof columnKey === 'string' && !isNaN(columnKey) && searchBubbleMap.has(parseInt(columnKey, 10)));
      });

      defaultColumnsWithBubbles.forEach((columnKey) => {
        // Find bubble - dataset.column is always a string
        const bubble = Array.from(bubbles).find((btn) => {
          const btnColumn = btn.dataset.column;
          return btnColumn === columnKey.toString() || 
                 (!isNaN(btnColumn) && !isNaN(columnKey) && parseInt(btnColumn) === parseInt(columnKey));
        });
        
        expect(bubble).to.not.be.null;
        // All default columns with bubbles should be marked as active
        expect(bubble.classList.contains('filter-active')).to.be.true;
        const activeCols = getActiveColumns();
        expect(activeCols.includes(columnKey) || activeCols.includes(columnKey.toString())).to.be.true;
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
      expect(table).to.not.be.null;

      const headers = table.querySelectorAll('thead th');
      expect(headers.length).to.equal(getActiveColumns().length + 1); // +1 for Select column

      // Check that Select column exists
      const selectHeader = Array.from(headers).find(
        (th) => th.textContent.trim() === 'Select'
      );
      expect(selectHeader).to.not.be.null;
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
      expect(rows.length).to.equal(mockData.length);

      // Check that Select button exists in first row
      const firstRow = rows[0];
      const selectButton = firstRow.querySelector('.select-participant');
      expect(selectButton).to.not.be.null;
      expect(selectButton.dataset.token).to.equal('token-123');
    });

    it('should handle empty data array', () => {
      const emptyData = [];
      const html = renderTable(emptyData, 'participantLookup');
      expect(html).to.equal('No data found!');
    });

    it('should limit results to 50 rows', () => {
      const largeDataSet = Array.from({ length: 100 }, (_, i) =>
        createMockParticipant(`test-${i}`)
      );

      mainContent.innerHTML = renderTable(largeDataSet, 'participantLookup');
      renderParticipantSearchResults(largeDataSet, 'participantLookup');

      // Check that data was spliced (this happens in renderParticipantSearchResults)
      expect(largeDataSet.length).to.equal(50);
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
      expect(filtered.length).to.equal(2);
    });

    it('should return all data when siteAbbr is null or undefined', () => {
      const mockData = [
        createMockParticipant('test-1', {
          [fieldMapping.healthcareProvider]: siteCode1,
        }),
      ];

      expect(filterBySiteKey(mockData, null).length).to.equal(1);
      expect(filterBySiteKey(mockData, undefined).length).to.equal(1);
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
      expect(filtered.length).to.equal(1);
      expect(filtered[0][fieldMapping.healthcareProvider]).to.equal(siteCode1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle bubbles for columns not in searchBubbleMap', () => {
      const mockData = [createMockParticipant('test-1')];
      mainContent.innerHTML = renderTable(mockData, 'participantLookup');
      renderParticipantSearchResults(mockData, 'participantLookup');
      setupActiveColumns(mockData);

      // Should not throw errors when processing bubbles
      const bubbles = document.getElementsByName('column-filter');
      expect(bubbles.length).to.be.greaterThan(0);
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
      expect(isIncluded).to.equal(isActive);
      // Count should differ by at most 1 from initial
      expect(Math.abs(finalCount - initialCount)).to.be.lessThanOrEqual(1);
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

      expect(getActiveColumns().includes('token')).to.be.true;
      
      // Re-render (simulating bubble filter re-render)
      renderParticipantSearchResults(mockData, 'bubbleFilters');

      // Token should still be in active columns
      expect(getActiveColumns().includes('token')).to.be.true;
      
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
      expect(savedColumns).to.not.be.undefined;
      expect(Array.isArray(savedColumns)).to.be.true;
      expect(savedColumns.includes('token')).to.be.true;
      
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
      expect(activeCols.length).to.equal(savedColumns.length);
      savedColumns.forEach((col) => {
        expect(activeCols.includes(col) || activeCols.includes(col.toString())).to.be.true;
      });

      // Check that bubbles are marked as active
      const bubbles = document.getElementsByName('column-filter');
      const tokenBubble = Array.from(bubbles).find((btn) => btn.dataset.column === 'token');
      const pinBubble = Array.from(bubbles).find((btn) => btn.dataset.column === 'pin');
      expect(tokenBubble.classList.contains('filter-active')).to.be.true;
      expect(pinBubble.classList.contains('filter-active')).to.be.true;
      
      uiState.clear();
    });

    it('should use default columns when no saved state exists', () => {
      renderTablePage(mockData, 'participantLookup');

      // Use imported defaultColumns to ensure test stays in sync with production code
      const activeCols = getActiveColumns();
      expect(activeCols.length).to.equal(defaultColumns.length);
      defaultColumns.forEach((col) => {
        expect(activeCols.includes(col) || activeCols.includes(col.toString())).to.be.true;
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
      expect(getActiveColumns().includes('token')).to.be.true;
      const savedColumns = uiState.getActiveColumns();
      expect(savedColumns).to.not.be.undefined;
      expect(savedColumns.includes('token')).to.be.true;
      
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
      expect(getActiveColumns().includes('token')).to.be.true;

      // Clear search results - columns should persist
      searchState.clearSearchResults();
      expect(uiState.getActiveColumns()).to.not.be.undefined;
      expect(uiState.getActiveColumns().includes('token')).to.be.true;
      expect(getActiveColumns().includes('token')).to.be.true;
      
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
      expect(getActiveColumns().includes('token')).to.be.true;

      // Simulate pagination update - columns should persist
      await searchState.updatePredefinedMetadata({
        pageNumber: 2,
      });

      // Columns should still be available from uiState
      expect(uiState.getActiveColumns()).to.not.be.undefined;
      expect(uiState.getActiveColumns().includes('token')).to.be.true;
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
      expect(uiState.getActiveColumns()).to.not.be.undefined;
      expect(uiState.getActiveColumns().includes('token')).to.be.true;
      expect(uiState.getActiveColumns().includes('pin')).to.be.true;
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
      expect(uiState.getActiveColumns()).to.not.be.undefined;
      expect(uiState.getActiveColumns().includes(fieldMapping.email)).to.be.true;
      expect(uiState.getActiveColumns().includes('Connect_ID')).to.be.true;
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
      expect(uiState.getActiveColumns()).to.not.be.undefined;
      expect(uiState.getActiveColumns().includes('token')).to.be.true;
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
      { key: fieldMapping.verifiedFlag, label: 'Verif Status' },
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

        expect(bubble).to.not.be.null;
        expect(bubble.textContent.trim()).to.equal(label);

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

        expect(afterActive).to.not.equal(initialActive);
        expect(afterInColumns).to.not.equal(initialInColumns);

        // Verify state persistence
        const savedColumns = uiState.getActiveColumns();
        if (afterInColumns) {
          expect(savedColumns).to.not.be.undefined;
          expect(savedColumns.includes(key) || savedColumns.includes(key.toString())).to.be.true;
        }
      });
    });

    it('should render bubbles with correct labels from searchBubbleMap for concept IDs', async () => {
      mainContent.innerHTML = renderTable(mockData, 'participantLookup');

      // Test numeric concept ID bubbles
      const verifiedBubble = Array.from(document.getElementsByName('column-filter')).find(
        (btn) => btn.dataset.column === fieldMapping.verifiedFlag.toString()
      );

      expect(verifiedBubble).to.not.be.null;
      expect(verifiedBubble.textContent.trim()).to.equal('Verif Status');

      uiState.clear();
    });

    it('should handle adding multiple specific bubbles in sequence', async () => {  
      mainContent.innerHTML = renderTable(mockData, 'participantLookup');
      renderParticipantSearchResults(mockData, 'participantLookup');
      setupActiveColumns(mockData);

      const bubblesToAdd = ['token', 'pin', 'studyId'];
      const initialCount = getActiveColumns().length;

      for (const bubbleKey of bubblesToAdd) {
        const bubble = Array.from(document.getElementsByName('column-filter')).find(
          (btn) => btn.dataset.column === bubbleKey
        );

        expect(bubble.classList.contains('filter-active')).to.be.false;
        bubble.click();
        await waitForActiveColumnsUpdate();
        expect(bubble.classList.contains('filter-active')).to.be.true;
      }

      const finalActiveCols = getActiveColumns();
      expect(finalActiveCols.length).to.equal(initialCount + bubblesToAdd.length);
      bubblesToAdd.forEach((key) => {
        expect(finalActiveCols.includes(key)).to.be.true;
      });

      // Verify all are persisted
      const savedColumns = uiState.getActiveColumns();
      expect(savedColumns).to.not.be.undefined;
      bubblesToAdd.forEach((key) => {
        expect(savedColumns.includes(key)).to.be.true;
      });
      
      uiState.clear();
    });
  });
});
