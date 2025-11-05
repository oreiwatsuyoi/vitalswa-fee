// Fix for null element classList error
// Add this script to prevent null element errors

// Safe element selector function
function safeGetElement(selector) {
  const element = document.getElementById(selector) || document.querySelector(selector);
  if (!element) {
    console.warn(`Element not found: ${selector}`);
    return null;
  }
  return element;
}

// Safe classList operations
function safeAddClass(elementId, className) {
  const element = safeGetElement(elementId);
  if (element && element.classList) {
    element.classList.add(className);
  }
}

function safeRemoveClass(elementId, className) {
  const element = safeGetElement(elementId);
  if (element && element.classList) {
    element.classList.remove(className);
  }
}

function safeToggleClass(elementId, className) {
  const element = safeGetElement(elementId);
  if (element && element.classList) {
    element.classList.toggle(className);
  }
}

// Wait for DOM to be fully loaded before running scripts
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM fully loaded - safe to access elements');
  
  // Check for common elements that might be missing
  const commonElements = [
    'preloader',
    'welcomeModal', 
    'servicesGrid',
    'carouselWrapper',
    'feeResult',
    'accountType',
    'serviceType'
  ];
  
  commonElements.forEach(id => {
    const element = document.getElementById(id);
    if (!element) {
      console.warn(`Missing element: ${id}`);
    }
  });
});

// Global error handler to catch and log null element errors
window.addEventListener('error', function(e) {
  if (e.message.includes('classList') || e.message.includes('Cannot read properties of null')) {
    console.error('Null element error caught:', e.message);
    console.error('Stack trace:', e.error?.stack);
    
    // Prevent the error from breaking the page
    e.preventDefault();
    return false;
  }
});