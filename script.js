// 모든 스크립트를 DOM이 완전히 준비된 뒤 실행
document.addEventListener('DOMContentLoaded', () => {
  /* ===== 모바일 메뉴 토글 ===== */
  const menuBtn = document.getElementById('menuBtn');
  const nav = document.getElementById('nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', () => {
      const opened = getComputedStyle(nav).display !== 'none';
      if (opened) {
        nav.style.display = 'none';
      } else {
        nav.style.display = 'flex';
        nav.style.flexDirection = 'column';
        nav.style.gap = '12px';
        nav.style.background = '#fff';
        nav.style.position = 'absolute';
        nav.style.top = '64px';
        nav.style.right = '20px';
        nav.style.padding = '10px 12px';
        nav.style.border = '1px solid #e5e7eb';
        nav.style.borderRadius = '12px';
        nav.style.boxShadow = '0 10px 30px rgba(2,6,23,.10)';
      }
    });
  }

  /* ===== 모달(팝업) 로직 ===== */
  const modal = document.getElementById('appModal');
  const msgEl = document.getElementById('modalMessage');
  const panel = modal?.querySelector('.modal-panel');

  function openModal(message = '준비중입니다.') {
    if (!modal || !msgEl) {
      // 요소가 없을 때도 반드시 동작하도록 보장
      alert(message);
      return;
    }
    msgEl.textContent = message;
    modal.setAttribute('aria-hidden', 'false');

    // 포커스를 패널로 이동 (접근성)
    if (panel) panel.focus();

    // ESC 닫기 1회성 바인딩
    const onEsc = (e) => { if (e.key === 'Escape') closeModal(); };
    document.addEventListener('keydown', onEsc, { once: true });
  }

  function closeModal() {
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'true');
  }

  // 닫기 트리거 (배경/버튼/X)
  modal?.addEventListener('click', (e) => {
    if (e.target instanceof Element && e.target.matches('[data-close], .modal-backdrop')) {
      closeModal();
    }
  });

  // ===== 버튼 바인딩 (분석 4종 + FAQ) =====
  document.querySelectorAll('button[data-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      openModal('준비중입니다.');
    });
  });
});
