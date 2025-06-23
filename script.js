// Configuración
const CONFIG = {
    UPLOAD_URL: 'http://localhost:8000/api/upload', // Cambia por tu URL
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
    alertContainer: document.getElementById('alertContainer'),
    resultsSection: document.getElementById('resultsSection'),
    processedFileName: document.getElementById('processedFileName'),
    transcriptionText: document.getElementById('transcriptionText'),
    resumeText: document.getElementById('resumeText')
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
    
    console.log('Iniciando subida de archivo:', file.name, 'Tamaño:', formatFileSize(file.size));
    
    try {
        showProgress();
        
        const response = await fetch(CONFIG.UPLOAD_URL, {
            method: 'POST',
            body: formData
        });
        
        hideProgress();
        
        console.log('Respuesta recibida, status:', response.status);
        
        if (response.ok) {
            const result = await response.json();
            console.log('Datos de respuesta:', result);
            handleUploadSuccess(result);
        } else {
            const errorText = await response.text();
            console.error('Error del servidor:', errorText);
            
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch (e) {
                errorData = { detail: errorText };
            }
            
            handleUploadError(errorData);
        }
        
    } catch (error) {
        hideProgress();
        console.error('Error de red o procesamiento:', error);
        handleUploadError({ detail: error.message });
    }
}



/**
 * Maneja el éxito de la subida
 */
function handleUploadSuccess(result) {
    showAlert('¡Video procesado exitosamente!', 'success');
    console.log('Respuesta del servidor:', result);
    
    // Verificar si hay error en la respuesta
    if (result.error) {
        handleUploadError({ detail: result.error });
        return;
    }
    
    // Mostrar los resultados
    if (result.transcription && result.resume) {
        showResults(result);
    } else {
        showAlert('Video subido pero no se pudieron obtener los resultados de transcripción', 'warning');
    }
    
    // Resetear formulario
    resetForm();
}

/**
 * Maneja errores de subida
 */
function handleUploadError(error) {
    let message = error.detail || error.message || 'Error desconocido al subir el archivo';
    
    console.error('Error completo:', error);
    
    // Mostrar el error tal como viene del backend
    showAlert(`Error: ${message}`, 'danger');
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
    
    // Simular progreso de subida
    updateProgress(0);
    
    // Simular progreso gradual
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 95) {
            progress = 95;
            clearInterval(interval);
            elements.progressText.textContent = 'Procesando video... Por favor espera';
        }
        updateProgress(progress);
    }, 200);
    
    // Guardar el interval para poder limpiarlo
    elements.progressContainer.progressInterval = interval;
}

/**
 * Oculta la barra de progreso
 */
function hideProgress() {
    // Limpiar interval si existe
    if (elements.progressContainer.progressInterval) {
        clearInterval(elements.progressContainer.progressInterval);
        elements.progressContainer.progressInterval = null;
    }
    
    elements.progressContainer.classList.add('d-none');
    elements.submitBtn.disabled = false;
    elements.submitBtn.innerHTML = '<i class="bi bi-upload me-2"></i>Subir Video';
}

/**
 * Actualiza el progreso de subida
 */
function updateProgress(percent) {
    elements.progressBar.style.width = percent + '%';
    
    if (percent < 100) {
        elements.progressText.textContent = `Subiendo... ${Math.round(percent)}%`;
    } else {
        elements.progressText.textContent = 'Procesando video... Por favor espera';
        // Mantener la animación de la barra de progreso
        elements.progressBar.classList.add('progress-bar-striped', 'progress-bar-animated');
    }
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

/**
 * Muestra los resultados de la transcripción y el resumen
 */
function showResults(result) {
    // Obtener el nombre del archivo actual
    const currentFile = elements.videoFile.files[0];
    
    // Mostrar información del archivo
    elements.processedFileName.textContent = currentFile ? currentFile.name : 'Video procesado';
    
    // Mostrar transcripción
    elements.transcriptionText.textContent = result.transcription || 'No se pudo obtener la transcripción';
    
    // Mostrar resumen
    elements.resumeText.textContent = result.resume || 'No se pudo generar el resumen';
    
    // Mostrar la sección de resultados
    elements.resultsSection.classList.remove('d-none');
    
    // Scroll hacia los resultados
    setTimeout(() => {
        elements.resultsSection.scrollIntoView({ behavior: 'smooth' });
    }, 100);
}

/**
 * Copia texto al portapapeles
 */
function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    const text = element.textContent;
    
    if (navigator.clipboard && window.isSecureContext) {
        // Usar la API moderna del portapapeles
        navigator.clipboard.writeText(text).then(() => {
            showTemporaryTooltip(elementId, 'Copiado!');
        }).catch(err => {
            console.error('Error al copiar:', err);
            fallbackCopyToClipboard(text);
        });
    } else {
        // Fallback para navegadores más antiguos
        fallbackCopyToClipboard(text);
    }
}

/**
 * Método alternativo para copiar al portapapeles
 */
function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        showAlert('Texto copiado al portapapeles', 'success');
    } catch (err) {
        console.error('Error al copiar:', err);
        showAlert('Error al copiar el texto', 'danger');
    }
    
    document.body.removeChild(textArea);
}

/**
 * Muestra un tooltip temporal
 */
function showTemporaryTooltip(elementId, message) {
    // Encontrar el botón de copiar asociado
    const element = document.getElementById(elementId);
    const button = element.closest('.mb-4').querySelector('button');
    
    if (button) {
        const originalText = button.innerHTML;
        button.innerHTML = `<i class="bi bi-check me-1"></i>${message}`;
        button.classList.remove('btn-outline-secondary');
        button.classList.add('btn-success');
        
        setTimeout(() => {
            button.innerHTML = originalText;
            button.classList.remove('btn-success');
            button.classList.add('btn-outline-secondary');
        }, 2000);
    }
}

/**
 * Resetea la aplicación para procesar un nuevo video
 */
function resetForNewUpload() {
    // Ocultar resultados
    elements.resultsSection.classList.add('d-none');
    
    // Resetear formulario
    resetForm();
    
    // Limpiar alertas
    elements.alertContainer.innerHTML = '';
    
    // Scroll hacia arriba
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Oculta la sección de resultados
 */
function hideResults() {
    elements.resultsSection.classList.add('d-none');
}

/**
 * Verifica el estado del servidor
 */
async function checkServerStatus() {
    const checkButton = event.target;
    const originalText = checkButton.innerHTML;
    
    // Mostrar estado de carga
    checkButton.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Verificando...';
    checkButton.disabled = true;
    
    try {
        // Intentar una petición simple al servidor
        const response = await fetch(CONFIG.UPLOAD_URL.replace('/api/upload', ''), {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (response.ok || response.status === 404) {
            showAlert('✅ Servidor conectado y funcionando correctamente', 'success');
        } else {
            showAlert(`⚠️ Servidor respondió con código ${response.status}`, 'warning');
        }
    } catch (error) {
        showAlert(`❌ No se pudo conectar con el servidor: ${error.message}`, 'danger');
    }
    
    // Restaurar botón
    checkButton.innerHTML = originalText;
    checkButton.disabled = false;
}

