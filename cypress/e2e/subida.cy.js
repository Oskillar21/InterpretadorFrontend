describe('Subida de Video', () => {
  beforeEach(() => {
    cy.visit('http://127.0.0.1:5500'); // O la URL que tu Live Server esté usando
  });

  it('debería mostrar el formulario de subida', () => {
    cy.get('form#uploadForm').should('exist');
    cy.contains('Subir Video');
  });

  it('debería permitir seleccionar un archivo de video', () => {
    const fileName = 'video.mp4';
    cy.get('input#videoFile').selectFile({
      contents: Cypress.Buffer.from('archivo de prueba'),
      fileName,
      mimeType: 'video/mp4',
      lastModified: Date.now(),
    });

    cy.get('#filePreview').should('not.have.class', 'd-none');
    cy.get('#fileName').should('contain.text', fileName);
  });

  it('debería mostrar alerta si se intenta subir sin seleccionar archivo', () => {
    cy.get('button#submitBtn').click();
    cy.get('#alertContainer').should('contain.text', 'Por favor selecciona un archivo');
  });
});
