let isPerfEnabled = null;

function checkPerfEnabled() {
    if (isPerfEnabled !== null) return isPerfEnabled;
    try {
        isPerfEnabled = new URLSearchParams(window.location.search).has('perf') || window.localStorage?.getItem('anm-perf') === '1';
    } catch (err) {
        isPerfEnabled = false;
    }
    
    if (isPerfEnabled) {
        console.log('%c[perf] debug logging ON (remove ?perf=1 to silence)', 'color:#fd551d;font-weight:bold');
    }
    
    return isPerfEnabled;
}

const getNow = () => (typeof performance !== 'undefined' ? performance.now() : 0);

export function perfLog(message, data) {
    if (!checkPerfEnabled()) return;
    
    const timeOffset = (getNow() / 1000).toFixed(2);
    
    if (data !== undefined) {
        console.log(`[perf +${timeOffset}s] ${message}`, data);
    } else {
        console.log(`[perf +${timeOffset}s] ${message}`);
    }
}

export function perfMeasure(message, callback) {
    if (!checkPerfEnabled()) return callback();
    
    const start = getNow();
    const result = callback();
    
    console.log(`[perf] ${message} took ${(getNow() - start).toFixed(1)}ms`);
    return result;
}
