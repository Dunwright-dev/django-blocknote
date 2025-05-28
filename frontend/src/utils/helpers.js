// Check if dependencies are loaded
export function checkReady() {
    const reactReady = typeof React !== 'undefined';
    const reactDOMReady = typeof ReactDOM !== 'undefined';
    
    console.log('Dependency check:', {
        React: reactReady,
        ReactDOM: reactDOMReady
    });
    
    return reactReady && reactDOMReady;
}
