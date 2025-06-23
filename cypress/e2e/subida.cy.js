describe('Interpretador de Videos - E2E Tests', () => {
  beforeEach(() => {
    // Ajusta la URL según tu servidor local
    cy.visit('http://127.0.0.1:5500'); // Live Server
    // o cy.visit('file:///C:/ruta/al/index.html'); si abres directamente el archivo
  });

  describe('Interfaz y Elementos Básicos', () => {
    it('debería cargar la página correctamente', () => {
      cy.contains('Interpretador de Videos').should('be.visible');
      cy.contains('Sube tu video para obtener transcripción y resumen automático').should('be.visible');
    });

    it('debería mostrar el estado del servidor', () => {
      cy.get('#server-status').should('be.visible');
      // El estado puede ser "Verificando...", "Servidor conectado" o "Servidor desconectado"
    });

    it('debería mostrar el área de subida de archivos', () => {
      cy.get('#drop-area').should('be.visible');
      cy.contains('Arrastra tu video aquí').should('be.visible');
      cy.contains('Seleccionar Archivo').should('be.visible');
    });
  });

  describe('Selección de Archivos', () => {
    it('debería permitir seleccionar un archivo de video', () => {
      // Simular la selección de un archivo de video
      const fileName = 'test-video.mp4';
      cy.get('#video-input').selectFile({
        contents: Cypress.Buffer.from('fake video content'),
        fileName,
        mimeType: 'video/mp4',
        lastModified: Date.now(),
      }, { force: true }); // force: true porque el input está oculto

      // Verificar que se muestra la información del archivo
      cy.get('#file-info').should('not.have.class', 'hidden');
      cy.get('#file-name').should('contain.text', fileName);
      cy.get('#file-size').should('be.visible');
      
      // Verificar que el botón de upload se habilita
      cy.get('#upload-btn').should('not.be.disabled');
    });

    it('debería permitir remover el archivo seleccionado', () => {
      // Seleccionar archivo primero
      cy.get('#video-input').selectFile({
        contents: Cypress.Buffer.from('fake video content'),
        fileName: 'test-video.mp4',
        mimeType: 'video/mp4',
      }, { force: true });

      // Verificar que está seleccionado
      cy.get('#file-info').should('not.have.class', 'hidden');
      
      // Remover archivo
      cy.get('#remove-file').click();
      
      // Verificar que se oculta la información y se deshabilita el botón
      cy.get('#file-info').should('have.class', 'hidden');
      cy.get('#upload-btn').should('be.disabled');
    });

    it('debería rechazar archivos que no son videos', () => {
      cy.get('#video-input').selectFile({
        contents: Cypress.Buffer.from('fake text content'),
        fileName: 'document.txt',
        mimeType: 'text/plain',
      }, { force: true });

      // Debería mostrar un toast de error
      cy.get('#toast-container').should('contain.text', 'Por favor selecciona un archivo de video válido');
    });
  });

  describe('Proceso de Upload (Mock)', () => {
    beforeEach(() => {
      // Interceptar las llamadas a la API para testing
      cy.intercept('GET', 'http://localhost:8000/', {
        statusCode: 200,
        body: { status: 'healthy', message: 'API is running' }
      }).as('healthCheck');

      cy.intercept('POST', 'http://localhost:8000/api/upload', {
        statusCode: 200,
        body: {
          message: 'Transcripción y resumen exitosos',
          transcription: 'Esta es una transcripción de prueba del video subido',
          resume: 'Este es un resumen de prueba del contenido del video',
          video_path: 'temp/test-video.mp4',
          audio_path: 'temp/test-audio.mp3'
        }
      }).as('uploadVideo');
    });

    it('debería procesar un video correctamente', () => {
      // Seleccionar archivo
      cy.get('#video-input').selectFile({
        contents: Cypress.Buffer.from('fake video content'),
        fileName: 'test-video.mp4',
        mimeType: 'video/mp4',
      }, { force: true });

      // Hacer click en el botón de upload
      cy.get('#upload-btn').click();

      // Verificar que se muestra el progreso
      cy.get('#progress-container').should('not.have.class', 'hidden');
      cy.get('#processing-status').should('not.have.class', 'hidden');

      // Esperar a que termine el procesamiento simulado
      cy.wait('@uploadVideo');
      
      // Verificar que se muestran los resultados (con timeout más alto)
      cy.get('#results-container', { timeout: 15000 }).should('not.have.class', 'hidden');
      
      // Verificar contenido de los resultados
      cy.get('#transcription-content p').should('contain.text', 'Esta es una transcripción de prueba');
      cy.get('#summary-content p').should('contain.text', 'Este es un resumen de prueba');

      // Verificar que se muestra el mensaje de éxito
      cy.get('#toast-container').should('contain.text', 'Transcripción y resumen exitosos');
    });

    it('debería funcionar el botón de copiar transcripción', () => {
      // Primero procesar un video para tener resultados
      cy.get('#video-input').selectFile({
        contents: Cypress.Buffer.from('fake video content'),
        fileName: 'test-video.mp4',
        mimeType: 'video/mp4',
      }, { force: true });

      cy.get('#upload-btn').click();
      cy.wait('@uploadVideo');
      cy.get('#results-container', { timeout: 15000 }).should('not.have.class', 'hidden');

      // Hacer click en copiar transcripción
      cy.get('#copy-transcription').click();
      
      // Verificar toast de confirmación
      cy.get('#toast-container').should('contain.text', 'Transcripción copiada');
    });
  });

  describe('Manejo de Errores', () => {
    it('debería manejar errores del servidor', () => {
      // Interceptar con error
      cy.intercept('POST', 'http://localhost:8000/api/upload', {
        statusCode: 500,
        body: { error: 'Error interno del servidor' }
      }).as('uploadError');

      // Seleccionar archivo y subir
      cy.get('#video-input').selectFile({
        contents: Cypress.Buffer.from('fake video content'),
        fileName: 'test-video.mp4',
        mimeType: 'video/mp4',
      }, { force: true });

      cy.get('#upload-btn').click();
      cy.wait('@uploadError');

      // Verificar que se muestra el error
      cy.get('#toast-container').should('contain.text', 'Error al procesar el video');
    });

    it('debería mostrar error cuando el servidor está offline', () => {
      // Interceptar health check con error
      cy.intercept('GET', 'http://localhost:8000/', {
        forceNetworkError: true
      }).as('healthCheckError');

      cy.reload();
      cy.wait('@healthCheckError');

      // Verificar estado offline
      cy.get('#server-status').should('contain.text', 'Servidor desconectado');
    });
  });
});
