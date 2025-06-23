// Configuration
const API_BASE_URL = 'http://localhost:8000';
const API_UPLOAD_URL = `${API_BASE_URL}/api/upload`;

// DOM Elements
const dropArea = document.getElementById('drop-area');
const videoInput = document.getElementById('video-input');
const fileInfo = document.getElementById('file-info');
const fileName = document.getElementById('file-name');
const fileSize = document.getElementById('file-size');
const removeFileBtn = document.getElementById('remove-file');
const uploadBtn = document.getElementById('upload-btn');
const progressContainer = document.getElementById('progress-container');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const progressPercent = document.getElementById('progress-percent');
const processingStatus = document.getElementById('processing-status');
const resultsContainer = document.getElementById('results-container');
const transcriptionContent = document.getElementById('transcription-content');
const summaryContent = document.getElementById('summary-content');
const serverStatus = document.getElementById('server-status');

// Global variables
let selectedFile = null;

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
});

// Initialize application
async function initializeApp() {
    await checkServerHealth();
}

// Health check function
async function checkServerHealth() {
    try {
        updateServerStatus('checking', 'Verificando...');
        
        const response = await fetch(`${API_BASE_URL}/`);
        const data = await response.json();
        
        console.log('Health check response:', data);
        updateServerStatus('online', 'Servidor conectado');
        showToast('Servidor conectado correctamente', 'success');
    } catch (error) {
        console.error('Health check failed:', error);
        updateServerStatus('offline', 'Servidor desconectado');
        showToast('No se pudo conectar al servidor', 'error');
    }
}

// Update server status display
function updateServerStatus(status, message) {
    const statusColors = {
        checking: 'bg-yellow-400 animate-pulse',
        online: 'bg-green-500',
        offline: 'bg-red-500'
    };
    
    const statusIcon = serverStatus.querySelector('div');
    const statusText = serverStatus.querySelector('span');
    
    statusIcon.className = `w-3 h-3 rounded-full ${statusColors[status]}`;
    statusText.textContent = message;
    statusText.className = status === 'online' ? 'text-green-600' : 
                          status === 'offline' ? 'text-red-600' : 'text-yellow-600';
}

// Setup event listeners
function setupEventListeners() {
    // File drop area events
    dropArea.addEventListener('click', () => videoInput.click());
    dropArea.addEventListener('dragover', handleDragOver);
    dropArea.addEventListener('dragleave', handleDragLeave);
    dropArea.addEventListener('drop', handleDrop);
    
    // File input change
    videoInput.addEventListener('change', handleFileSelect);
    
    // Remove file button
    removeFileBtn.addEventListener('click', clearSelectedFile);
    
    // Upload button
    uploadBtn.addEventListener('click', handleUpload);
    
    // Copy buttons
    document.getElementById('copy-transcription').addEventListener('click', () => {
        copyToClipboard(transcriptionContent.textContent, 'Transcripción copiada');
    });
    
    document.getElementById('copy-summary').addEventListener('click', () => {
        copyToClipboard(summaryContent.textContent, 'Resumen copiado');
    });
}

// Handle drag over
function handleDragOver(e) {
    e.preventDefault();
    dropArea.classList.add('drag-over');
}

// Handle drag leave
function handleDragLeave(e) {
    e.preventDefault();
    dropArea.classList.remove('drag-over');
}

// Handle file drop
function handleDrop(e) {
    e.preventDefault();
    dropArea.classList.remove('drag-over');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFileSelection(files[0]);
    }
}

// Handle file selection from input
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        handleFileSelection(file);
    }
}

// Handle file selection (common function)
function handleFileSelection(file) {
    // Validate file type
    if (!file.type.startsWith('video/')) {
        showToast('Por favor selecciona un archivo de video válido', 'error');
        return;
    }
    
    // Validate file size (100MB limit)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
        showToast('El archivo es demasiado grande. Máximo 100MB', 'error');
        return;
    }
    
    selectedFile = file;
    displayFileInfo(file);
}

// Display file information
function displayFileInfo(file) {
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    
    fileInfo.classList.remove('hidden');
    uploadBtn.disabled = false;
    uploadBtn.classList.remove('disabled:bg-gray-400');
    uploadBtn.classList.add('hover:bg-green-700');
}

// Clear selected file
function clearSelectedFile() {
    selectedFile = null;
    videoInput.value = '';
    fileInfo.classList.add('hidden');
    uploadBtn.disabled = true;
    uploadBtn.classList.add('disabled:bg-gray-400');
    uploadBtn.classList.remove('hover:bg-green-700');
    hideResults();
}

// Handle file upload
async function handleUpload() {
    if (!selectedFile) {
        showToast('Por favor selecciona un archivo primero', 'error');
        return;
    }
    
    // Prepare form data
    const formData = new FormData();
    formData.append('file', selectedFile);
    
    try {
        // Show progress and processing status
        showProgress();
        showProcessingStatus();
        updateProcessingStep(1, 'active');
        
        // Upload file
        const response = await fetch(API_UPLOAD_URL, {
            method: 'POST',
            body: formData
        });
          if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Upload response completa:', data);
        
        // Simulate processing steps
        await simulateProcessingSteps();
        
        // Display results
        displayResults(data);
        
        // Don't show success toast here since displayResults will handle it
        // showToast('Video procesado exitosamente', 'success');
        
    } catch (error) {
        console.error('Upload failed:', error);
        showToast('Error al procesar el video: ' + error.message, 'error');
        hideProgress();
        hideProcessingStatus();
    }
}

// Show progress bar
function showProgress() {
    progressContainer.classList.remove('hidden');
    uploadBtn.disabled = true;
    
    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
        }
        updateProgress(progress, 'Subiendo...');
    }, 500);
}

// Hide progress bar
function hideProgress() {
    progressContainer.classList.add('hidden');
    uploadBtn.disabled = false;
}

// Update progress bar
function updateProgress(percent, text) {
    progressBar.style.width = `${percent}%`;
    progressPercent.textContent = `${Math.round(percent)}%`;
    progressText.textContent = text;
}

// Show processing status
function showProcessingStatus() {
    processingStatus.classList.remove('hidden');
}

// Hide processing status
function hideProcessingStatus() {
    processingStatus.classList.add('hidden');
    // Reset all steps
    for (let i = 1; i <= 4; i++) {
        updateProcessingStep(i, 'pending');
    }
}

// Update processing step
function updateProcessingStep(step, status) {
    const stepIcon = document.getElementById(`step${step}-icon`);
    const statusClasses = {
        pending: 'bg-gray-200',
        active: 'bg-blue-500 animate-pulse',
        completed: 'bg-green-500'
    };
    
    stepIcon.className = `w-6 h-6 rounded-full flex items-center justify-center ${statusClasses[status]}`;
    
    if (status === 'completed') {
        stepIcon.innerHTML = '<i class="fas fa-check text-xs text-white"></i>';
    }
}

// Simulate processing steps
async function simulateProcessingSteps() {
    const steps = [
        { step: 1, text: 'Subiendo video...', delay: 1000 },
        { step: 2, text: 'Extrayendo audio...', delay: 2000 },
        { step: 3, text: 'Transcribiendo...', delay: 3000 },
        { step: 4, text: 'Generando resumen...', delay: 2000 }
    ];
    
    for (const { step, text, delay } of steps) {
        updateProgress(25 * step, text);
        updateProcessingStep(step, 'active');
        
        await new Promise(resolve => setTimeout(resolve, delay));
        
        updateProcessingStep(step, 'completed');
    }
}

// Display results
function displayResults(data) {
    console.log('Datos recibidos del servidor:', data);
    
    // Extract transcription and summary from response
    // Tu backend devuelve 'transcription' y 'resume' (no 'summary')
    const transcription = data.transcription || data.full_transcription || 'Transcripción no disponible';
    const summary = data.resume || data.summary || 'Resumen no disponible';
    
    // Log para debug
    console.log('Transcripción:', transcription);
    console.log('Resumen:', summary);
    
    // Update content
    transcriptionContent.querySelector('p').textContent = transcription;
    summaryContent.querySelector('p').textContent = summary;
    
    // Show results
    resultsContainer.classList.remove('hidden');
    hideProgress();
    hideProcessingStatus();
    
    // Show success message from server if available
    if (data.message) {
        showToast(data.message, 'success');
    }
}

// Hide results
function hideResults() {
    resultsContainer.classList.add('hidden');
}

// Copy to clipboard
async function copyToClipboard(text, successMessage) {
    try {
        await navigator.clipboard.writeText(text);
        showToast(successMessage, 'success');
    } catch (error) {
        showToast('Error al copiar al portapapeles', 'error');
    }
}

// Show toast notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-500' : 
                   type === 'error' ? 'bg-red-500' : 'bg-blue-500';
    
    toast.className = `${bgColor} text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 transform transition-all duration-300 translate-x-full`;
    
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
        <button class="ml-4 text-white hover:text-gray-200" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.getElementById('toast-container').appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.classList.remove('translate-x-full');
    }, 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.classList.add('translate-x-full');
        setTimeout(() => {
            if (toast.parentElement) {
                toast.parentElement.removeChild(toast);
            }
        }, 300);
    }, 5000);
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Error handling for fetch requests
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    showToast('Error de conexión: ' + event.reason.message, 'error');
});

// Refresh server status every 30 seconds
setInterval(checkServerHealth, 30000);