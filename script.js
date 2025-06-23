// Configuración
const CONFIG = {
    UPLOAD_URL: 'http://localhost:8000/upload', // Cambia por tu URL
    MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB en bytes
    ALLOWED_TYPES: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv']
};

// Referencias a elementos del DOM
const elements = {
    uploadForm: document.getElementById('uploadForm'),
    videoFile: document.getElementById('videoFile'),
    filePreview: document.getElementById('filePreview'),
    fileName: document.getElementById('fileName'),
    fileSize: document.getElementById('fileSize'),
    progressContainer: document.getElementById('progressContainer'),
    progressBar: document.getElementById('progressBar'),
    progressText: document.getElementById('progressText'),
    submitBtn: document.getElementById('submitBtn'),
    alertContainer: document.getElementById('alertContainer')
};

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

/**
 * Inicializa la aplicación
 */
function initializeApp() {
    setupEventListeners();
    console.log('Aplicación de subida de videos inicializada');
}

/**
 * Configura todos los event listeners
 */
function setupEventListeners() {
    // Event listener para cambio de archivo
    elements.videoFile.addEventListener('change', handleFileSelection);
    
    // Event listener para envío del formulario
    elements.uploadForm.addEventListener('submit', handleFormSubmit);
}

/**
 * Maneja la selección de archivo
 */
function handleFileSelection(event) {
    const file = event.target.files[0];
    
    if (file) {
        // Validar tipo de archivo
        if (!isValidFileType(file)) {
            showAlert('Tipo de archivo no válido. Solo se permiten videos.', 'warning');
            clearFileSelection();
            return;
        }
        
        // Mostrar preview
        showFilePreview(file);
    } else {
        hideFilePreview();
    }
}

/**
 * Maneja el envío del formulario
 */
async function handleFormSubmit(event) {
    event.preventDefault();
    
    const file = elements.videoFile.files[0];
    
    // Validaciones
    if (!file) {
        showAlert('Por favor selecciona un archivo', 'warning');
        return;
    }
    
    if (!validateFile(file)) {
        return;
    }
    
    // Proceder con la subida
    await uploadFile(file);
}

/**
 * Valida el archivo seleccionado
 */
function validateFile(file) {
    // Validar tipo
    if (!isValidFileType(file)) {
        showAlert('Tipo de archivo no válido. Solo se permiten videos.', 'danger');
        return false;
    }
    
    // Validar tamaño
    if (file.size > CONFIG.MAX_FILE_SIZE) {
        showAlert(`El archivo es demasiado grande. Máximo ${formatFileSize(CONFIG.MAX_FILE_SIZE)} permitido.`, 'danger');
        return false;
    }
    
    return true;
}

/**
 * Verifica si el tipo de archivo es válido
 */
function isValidFileType(file) {
    return file.type.startsWith('video/');
}

/**
 * Sube el archivo al servidor
 */
async function uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        showProgress();
        
        const response = await uploadWithProgress(formData);
        
        hideProgress();
        
        if (response.ok) {
            const result = await response.json();
            handleUploadSuccess(result);
        } else {
            const error = await response.json();
            handleUploadError(error);
        }
        
    } catch (error) {
        hideProgress();
        handleUploadError({ detail: error.message });
    }
}

/**
 * Sube archivo con seguimiento de progreso
 */
function uploadWithProgress(formData) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        // Manejar progreso de subida
        xhr.upload.addEventListener('progress', function(e) {
            if (e.lengthComputable) {
                const percentComplete = (e.loaded / e.total) * 100;
                updateProgress(percentComplete);
            }
        });
        
        // Manejar respuesta
        xhr.addEventListener('load', function() {
            resolve({
                ok: xhr.status === 200,
                json: () => Promise.resolve(JSON.parse(xhr.responseText))
            });
        });
        
        // Manejar errores de red
        xhr.addEventListener('error', function() {
            reject(new Error('Error de conexión. Verifica que el servidor esté funcionando.'));
        });
        
        // Enviar petición
        xhr.open('POST', CONFIG.UPLOAD_URL);
        xhr.send(formData);
    });
}

/**
 * Maneja el éxito de la subida
 */
function handleUploadSuccess(result) {
    showAlert('¡Video subido exitosamente!', 'success');
    console.log('Respuesta del servidor:', result);
    
    // Resetear formulario
    resetForm();
}

/**
 * Maneja errores de subida
 */
function handleUploadError(error) {
    const message = error.detail || 'Error desconocido al subir el archivo';
    showAlert(`Error: ${message}`, 'danger');
    console.error('Error de subida:', error);
}

/**
 * Muestra el preview del archivo seleccionado
 */
function showFilePreview(file) {
    elements.fileName.textContent = file.name;
    elements.fileSize.textContent = formatFileSize(file.size);
    elements.filePreview.classList.remove('d-none');
}

/**
 * Oculta el preview del archivo
 */
function hideFilePreview() {
    elements.filePreview.classList.add('d-none');
}

/**
 * Limpia la selección de archivo
 */
function clearFileSelection() {
    elements.videoFile.value = '';
    hideFilePreview();
}

/**
 * Muestra la barra de progreso
 */
function showProgress() {
    elements.progressContainer.classList.remove('d-none');
    elements.submitBtn.disabled = true;
    elements.submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Subiendo...';
}

/**
 * Oculta la barra de progreso
 */
function hideProgress() {
    elements.progressContainer.classList.add('d-none');
    elements.submitBtn.disabled = false;
    elements.submitBtn.innerHTML = '<i class="bi bi-upload me-2"></i>Subir Video';
}

/**
 * Actualiza el progreso de subida
 */
function updateProgress(percent) {
    elements.progressBar.style.width = percent + '%';
    elements.progressText.textContent = `Subiendo... ${Math.round(percent)}%`;
}

/**
 * Muestra una alerta
 */
function showAlert(message, type) {
    const alertHtml = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    elements.alertContainer.innerHTML = alertHtml;
    
    // Auto-ocultar después de 5 segundos para mensajes de éxito
    if (type === 'success') {
        setTimeout(() => {
            const alert = elements.alertContainer.querySelector('.alert');
            if (alert) {
                const bsAlert = new bootstrap.Alert(alert);
                bsAlert.close();
            }
        }, 5000);
    }
}

/**
 * Resetea el formulario
 */
function resetForm() {
    elements.uploadForm.reset();
    hideFilePreview();
}

/**
 * Formatea el tamaño del archivo
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}