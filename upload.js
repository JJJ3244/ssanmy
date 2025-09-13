document.addEventListener('DOMContentLoaded', () => {
  /* ===== 모바일 메뉴 토글(공통) ===== */
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

  /* ===== 툴 이름 매핑 (쿼리파라미터로 헤더 문구 변경) ===== */
  const params = new URLSearchParams(location.search);
  const tool = params.get('tool') || '';
  const toolMap = {
    'summary': '종합분석',
    'demographic': '인구통계분석',
    'pre-sale': '분양 전망 예측',
    'elasticity': '탄력성 분석',
    'faq': 'FAQ'
  };
  const uploadTitle = document.getElementById('uploadTitle');
  const uploadDesc  = document.getElementById('uploadDesc');

  if (toolMap[tool]) {
    uploadTitle.textContent = `${toolMap[tool]} · 파일 업로드`;
    uploadDesc.textContent  = `${toolMap[tool]}에 사용할 데이터를 업로드하세요.`;
  }

  /* ===== 업로드 UI ===== */
  const dz = document.getElementById('dropzone');
  const input = document.getElementById('fileInput');
  const list = document.getElementById('fileList');
  const tbody = document.getElementById('fileTbody');

  function bytesToKB(size) {
    return `${(size/1024).toFixed(1)} KB`;
  }

  function renderFiles(files) {
    if (!files || files.length === 0) {
      list.style.display = 'none';
      tbody.innerHTML = '';
      return;
    }
    list.style.display = 'block';
    tbody.innerHTML = '';
    [...files].forEach(file => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${file.name}</td>
        <td>${file.type || '-'}</td>
        <td>${bytesToKB(file.size)}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  // 파일 선택(클릭)
  input.addEventListener('change', (e) => {
    renderFiles(e.target.files);
  });

  // 드래그 앤 드롭
  ['dragenter','dragover'].forEach(ev => {
    dz.addEventListener(ev, (e) => {
      e.preventDefault(); e.stopPropagation();
      dz.classList.add('dragover');
    });
  });
  ['dragleave','drop'].forEach(ev => {
    dz.addEventListener(ev, (e) => {
      e.preventDefault(); e.stopPropagation();
      dz.classList.remove('dragover');
    });
  });
  dz.addEventListener('drop', (e) => {
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      renderFiles(files);
    }
  });

  // 키보드 접근: 스페이스/엔터로 파일 선택
  dz.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      input.click();
    }
  });
});
