// // State Management
const createStore = (startState = {}) => {
    let state = JSON.parse(JSON.stringify(startState));

    /** @param {object | function} update - an object or a function to update state */
    const setState = (update) => { 
      const updatedSlice = typeof update === 'function' ? update(state) : update;
      state = { ...state, ...updatedSlice };
    };

    /** @return {object}  */
    const getState = () => state;

    return {
      setState,
      getState,
    };
  }
  
export const appState = createStore();