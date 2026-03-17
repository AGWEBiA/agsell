import { useEffect } from 'react';

/**
 * RuntimeProtection — dificulta inspeção do código em produção.
 * - Desabilita right-click
 * - Detecta atalhos de DevTools
 * - Desabilita seleção de texto / drag em elementos sensíveis
 * - Proteção contra cópia (Ctrl+C no código)
 */
export function RuntimeProtection() {
  useEffect(() => {
    if (import.meta.env.DEV) return; // só em produção

    // Bloquear atalhos de DevTools
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.key === 'F12') {
        e.preventDefault();
        return false;
      }
      // Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+Shift+C
      if (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) {
        e.preventDefault();
        return false;
      }
      // Ctrl+U (view source)
      if (e.ctrlKey && e.key.toUpperCase() === 'U') {
        e.preventDefault();
        return false;
      }
    };

    // Bloquear menu de contexto
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // Detecção de DevTools via diferença de tamanho
    let devtoolsOpen = false;
    const detectDevTools = () => {
      const threshold = 160;
      const widthDiff = window.outerWidth - window.innerWidth > threshold;
      const heightDiff = window.outerHeight - window.innerHeight > threshold;
      
      if (widthDiff || heightDiff) {
        if (!devtoolsOpen) {
          devtoolsOpen = true;
          console.clear();
          console.log(
            '%c⚠️ AMBIENTE PROTEGIDO',
            'color: red; font-size: 24px; font-weight: bold;'
          );
          console.log(
            '%cEste código é protegido e monitorado. Tentativas de engenharia reversa são registradas.',
            'color: orange; font-size: 14px;'
          );
        }
      } else {
        devtoolsOpen = false;
      }
    };

    // Bloquear drag de imagens/elementos
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
    };

    // Bloquear seleção excessiva
    const handleSelectStart = (e: Event) => {
      const target = e.target as HTMLElement;
      // Permitir seleção em inputs e textareas
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return true;
      }
      // Bloquear seleção em elementos de código/estrutura
      if (target.closest('pre') || target.closest('code')) {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('selectstart', handleSelectStart);

    const devToolsInterval = setInterval(detectDevTools, 1000);

    // CSS anti-seleção para body em produção
    document.body.style.setProperty('-webkit-user-select', 'none');
    document.body.style.setProperty('user-select', 'none');

    // Permitir seleção em áreas interativas
    const style = document.createElement('style');
    style.textContent = `
      input, textarea, [contenteditable="true"], .selectable,
      [role="textbox"], .ProseMirror, .ql-editor {
        -webkit-user-select: text !important;
        user-select: text !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('selectstart', handleSelectStart);
      clearInterval(devToolsInterval);
      document.body.style.removeProperty('-webkit-user-select');
      document.body.style.removeProperty('user-select');
      style.remove();
    };
  }, []);

  return null;
}
