var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
(function(){
var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
s1.async=true;
s1.src='https://embed.tawk.to/69df69cb36ae341c33397434/1jm8bags7';
s1.charset='UTF-8';
s1.setAttribute('crossorigin','*');
s0.parentNode.insertBefore(s1,s0);
})();

/* ══ CONFIG ══════════════════════════════════════════════════════════ */
  const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz4CVwdYZXKYmL3au2WbDnNUNsGmMfY6vC-5JZD7KgErn-8DnSAAUuC-pXlsblRhIA0pw/exec';

  /*
    Optional hardcoded fallback photos (Drive thumbnail URLs):
    { url: 'https://drive.google.com/thumbnail?id=FILE_ID&sz=w800', caption: 'Label' }
  */
  const FALLBACK_PHOTOS = [
    { url: 'https://drive.google.com/thumbnail?id=1cmknJgx3RmJimzmpLWav6yI7ErlFx5LD&sz=w800' },
    { url: 'https://drive.google.com/thumbnail?id=10p3gWu86QXSGeO_WmqfkJGndAagpSBOh&sz=w800' },
    { url: 'https://drive.google.com/thumbnail?id=13S8AexYtzBsTDsxrtMBRJ7Fk4R815dB1&sz=w800' },
  ];

  /* ══ MODAL ══════════════════════════════════════════════════════════ */
  function closeReminder() {
    const m = document.getElementById('reminderModal');
    m.style.animation = 'fadeIn 0.2s ease reverse';
    setTimeout(() => m.style.display = 'none', 180);
  }

  /* ══ INIT ════════════════════════════════════════════════════════════ */
  const CATEGORIES = ['CAKE', 'PASTRY', 'BAKERY', 'SSMM', 'DRINKS', 'SANDWICH', 'SIGNS', 'CHOCOLATES', 'OCCASIONS'];
  let checked = {}, allProducts = [], productGroups = {}, activeCategory = '';
  let currentSlide = 0, slides = [], slideTimer = null;

  document.getElementById('dateField').valueAsDate = new Date();

  window.addEventListener('DOMContentLoaded', () => {
    initEmailVerification();
    loadBranches();
    loadProducts();
    loadHolidays();
    loadPhotos();
    document.getElementById('productSearch').addEventListener('input', filterProducts);
  });

  /* ══ EMAIL VERIFICATION ══════════════════════════════════════════════ */
  let selectedEmailMethod = '';
  let verifiedEmail = '';
  let verifiedEmailMethod = '';

  function initEmailVerification() {
    const flexwayField = document.getElementById('flexwayEmailField');
    if (flexwayField) {
      flexwayField.addEventListener('input', validateFlexwayEmailLive);
    }

    ['googleChoice', 'flexwayChoice'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          selectEmailMethod(id === 'googleChoice' ? 'google' : 'flexway');
        }
      });
    });
  }

  function selectEmailMethod(method) {
    selectedEmailMethod = method;
    document.getElementById('googleChoice').classList.toggle('active', method === 'google');
    document.getElementById('flexwayChoice').classList.toggle('active', method === 'flexway');
    document.getElementById('googlePanel').classList.toggle('active', method === 'google');
    document.getElementById('flexwayPanel').classList.toggle('active', method === 'flexway');

    verifiedEmail = '';
    verifiedEmailMethod = '';
    document.getElementById('emailField').value = '';
    document.getElementById('googleVerifiedPill').classList.remove('show');

    if (method === 'google') {
      setEmailStatus('neutral', 'Please sign in with Google to verify your email.');
    } else {
      validateFlexwayEmailLive();
      setTimeout(() => document.getElementById('flexwayEmailField').focus(), 50);
    }
  }

  function handleGoogleCredentialResponse(response) {
    try {
      const payload = parseJwt(response.credential);
      const email = String(payload.email || '').trim().toLowerCase();

      if (!email || !payload.email_verified) {
        clearVerifiedEmail('Google could not verify this email. Please try again.');
        return;
      }

      if (!email.endsWith('@gmail.com') && !email.endsWith('@flexway.com')) {
        clearVerifiedEmail('Only @gmail.com or @flexway.com Google accounts are allowed.');
        return;
      }

      selectedEmailMethod = 'google';
      verifiedEmail = email;
      verifiedEmailMethod = 'google';
      document.getElementById('emailField').value = email;
      document.getElementById('googleVerifiedPill').textContent = '✓ ' + email;
      document.getElementById('googleVerifiedPill').classList.add('show');
      setEmailStatus('ok', 'Google account verified: ' + email);
    } catch (err) {
      clearVerifiedEmail('Google sign-in failed. Please try again.');
    }
  }

  function parseJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  }

  function validateFlexwayEmailLive() {
    if (selectedEmailMethod !== 'flexway') return false;
    const field = document.getElementById('flexwayEmailField');
    const email = String(field.value || '').trim().toLowerCase();
    const isValid = /^[a-z0-9._%+-]+@flexway\.com$/i.test(email);

    if (!email) {
      clearVerifiedEmail('Enter your @flexway.com email address.');
      return false;
    }

    if (!isValid) {
      clearVerifiedEmail('Only a valid @flexway.com email is accepted for this option.');
      return false;
    }

    verifiedEmail = email;
    verifiedEmailMethod = 'flexway';
    document.getElementById('emailField').value = email;
    setEmailStatus('ok', 'Flexway email accepted: ' + email);
    return true;
  }

  function clearVerifiedEmail(message) {
    verifiedEmail = '';
    verifiedEmailMethod = '';
    document.getElementById('emailField').value = '';
    setEmailStatus('error', message);
  }

  function setEmailStatus(type, message) {
    const status = document.getElementById('emailStatus');
    if (!status) return;
    status.className = 'email-status ' + type;
    status.textContent = message;
  }

  function getValidatedEmailForSubmit() {
    if (!selectedEmailMethod) {
      showError('Please choose one email option: Login with Google or use your @flexway.com email.');
      return '';
    }

    if (selectedEmailMethod === 'google') {
      if (!verifiedEmail || verifiedEmailMethod !== 'google') {
        showError('Please complete Google sign-in before submitting.');
        return '';
      }
      return verifiedEmail;
    }

    if (selectedEmailMethod === 'flexway') {
      if (!validateFlexwayEmailLive()) {
        showError('Please enter a valid @flexway.com email before submitting.');
        return '';
      }
      return verifiedEmail;
    }

    showError('Please complete email verification before submitting.');
    return '';
  }



  /* ══ BRANCHES FROM GOOGLE SHEET ══════════════════════════════════════
     Google Sheet tab name: Branches
     Column A: Branch Name
     Add/remove branches in the Sheet; this dropdown updates on page load.
     Apps Script must handle: action=getBranches
     Returns: { success: true, data: [ "UPTOWN MIRDIF", "AL BARSHA" ] }
  ════════════════════════════════════════════════════════════════════════ */
  function loadBranches() {
    const select = document.getElementById('branchField');
    const status = document.getElementById('branchLoadStatus');
    if (!select) return;

    select.disabled = true;
    select.innerHTML = '<option value="">Fetching Branch List…</option>';
    if (status) {
      status.className = 'branch-load-status';
      status.textContent = 'Fetching Branch List';
    }

    const cbName = '_branchesCb_' + Date.now();
    window[cbName] = function(res) {
      delete window[cbName];
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        const branches = res.data
          .map(branch => typeof branch === 'string' ? branch : (branch.name || branch.branch || branch.Branch || ''))
          .map(branch => String(branch).trim())
          .filter(Boolean);

        if (branches.length) {
          populateBranchDropdown(branches);
          if (status) {
            status.className = 'branch-load-status ok';
            status.textContent = branches.length + ' branches loaded ✅';
          }
          return;
        }
      }
      showBranchLoadError('No branches found. Add branch names in the Google Sheet tab named "Branches".');
    };

    const s = document.createElement('script');
    s.onerror = function() {
      delete window[cbName];
      showBranchLoadError('Could not load branches from Google Sheet. Please check Apps Script action=getBranches.');
    };
    s.src = APPS_SCRIPT_URL + '?action=getBranches&callback=' + cbName;
    document.head.appendChild(s);
  }

  function populateBranchDropdown(branches) {
    const select = document.getElementById('branchField');
    const uniqueBranches = [...new Set(branches)].sort((a, b) => a.localeCompare(b));

    select.innerHTML = '<option value="">— Choose branch —</option>' +
      uniqueBranches.map(branch => '<option value="' + escapeOptionValue(branch) + '">' + escapeHtml(branch) + '</option>').join('');
    select.disabled = false;
  }

  function showBranchLoadError(message) {
    const select = document.getElementById('branchField');
    const status = document.getElementById('branchLoadStatus');
    select.innerHTML = '<option value="">Branch list unavailable</option>';
    select.disabled = true;
    if (status) {
      status.className = 'branch-load-status error';
      status.textContent = message;
    }
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"]/g, function(ch) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch];
    });
  }

  function escapeOptionValue(value) {
    return escapeHtml(value).replace(/'/g, '&#39;');
  }

  /* ══ PRODUCTS ════════════════════════════════════════════════════════ */
  function loadProducts() {
    window._prodCb = function(res) {
      if (res.success) onProductsLoaded(res.data);
      else showLoadError('Failed to load products: ' + (res.error || 'Unknown'));
    };
    const s = document.createElement('script');
    s.onerror = () => showLoadError('Could not reach server.');
    s.src = APPS_SCRIPT_URL + '?action=getProducts&callback=_prodCb';
    document.head.appendChild(s);
  }

  function showLoadError(msg) {
    document.getElementById('loadingState').innerHTML =
      `<p style="color:#b84040;font-size:13px;padding:10px 0;">⚠ ${msg}</p>`;
  }

  function onProductsLoaded(products) {
    allProducts = (products || []).map((p, i) => {
      const rowNumber = p.rowNumber || p.sheetRow || (i + 2);
      return {
        ...p,
        rowNumber: rowNumber,
        productKey: String(p.productKey || ('ROW_' + rowNumber)),
        name: String(p.name || '').trim(),
        price: String(p.price || '').trim(),
        netWeightEN: String(p.netWeightEN || p.netWeight || '').trim(),
        category: String(p.category || '').trim().toUpperCase()
      };
    });

    document.getElementById('loadingState').style.display = 'none';
    renderGroups(allProducts);
    document.getElementById('productGroups').style.display = 'block';
  }

  function getProductByKey(key) {
    return allProducts.find(p => String(p.productKey) === String(key));
  }

  function renderGroups(products) {
    const container = document.getElementById('productGroups');
    productGroups = {};
    CATEGORIES.forEach(c => productGroups[c] = []);
    productGroups['OTHER'] = [];

    products.forEach(p => {
      const cat = p.category && CATEGORIES.includes(p.category) ? p.category : 'OTHER';
      productGroups[cat].push(p);
    });

    const activeCats = CATEGORIES.filter(c => productGroups[c].length > 0)
      .concat(productGroups['OTHER'].length > 0 ? ['OTHER'] : []);

    container.innerHTML = `
      <div class="selection-controls">
        <div id="selectedBadge" class="selected-badge zero">0 items selected</div>
        <div class="selection-actions">
          <button class="select-action-btn" onclick="selectAllVisible()">Select All</button>
          <button class="select-action-btn" onclick="deselectAllVisible()">Deselect All</button>
        </div>
      </div>
      <div class="category-tabs">
        ${activeCats.map((cat, i) =>
          `<div class="cat-tab ${i===0?'active':''}" onclick="filterByCategory('${cat}')">${cat}</div>`
        ).join('')}
      </div>
      <div class="product-grid" id="productGrid"></div>`;

    activeCategory = activeCats[0] || 'CAKE';
    filterByCategory(activeCategory);
  }

  function filterByCategory(cat) {
    activeCategory = cat;
    document.querySelectorAll('.cat-tab').forEach(t => {
      t.classList.toggle('active', t.textContent === cat);
    });
    renderGrid(productGroups[cat] || []);
  }

  function renderGrid(products) {
    const grid = document.getElementById('productGrid');
    if (!grid) return;

    grid.innerHTML = products.map(p => {
      const key = escapeOptionValue(p.productKey);
      const name = escapeHtml(p.name);
      const price = escapeHtml(p.price || '');
      const weight = escapeHtml(p.netWeightEN || '');
      const rowNumber = escapeHtml(p.rowNumber || '');

      return `<div class="check-item" data-key="${key}" onclick="toggleItem(this)">
        <span class="check-box">
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
        <span class="check-name">
          ${name}
          <small style="display:block;font-size:11px;color:var(--clay-muted);font-weight:700;margin-top:3px;">
            ${weight ? weight: ''}
          </small>
        </span>
        <span class="check-price">
          <img src="https://cdn.iconscout.com/icon/free/png-256/free-uae-dirham-icon-svg-download-png-11698521.png" class="dirham-symbol" alt="AED">
          <span class="price-num">${price}</span>
        </span>
      </div>`;
    }).join('');

    grid.querySelectorAll('.check-item').forEach(el => {
      if (checked[el.getAttribute('data-key')]) {
        el.classList.add('checked');
      }
    });
  }

  function toggleItem(el) {
    const key = el.getAttribute('data-key');
    const product = getProductByKey(key);
    if (!product) return;

    if (checked[key]) {
      delete checked[key];
      el.classList.remove('checked');
    } else {
      checked[key] = product;
      el.classList.add('checked');
    }

    updateBadge();
  }

  function selectAllVisible() {
    document.querySelectorAll('#productGrid .check-item').forEach(el => {
      const key = el.getAttribute('data-key');
      const product = getProductByKey(key);

      if (key && product) {
        checked[key] = product;
        el.classList.add('checked');
      }
    });

    updateBadge();
  }

  function deselectAllVisible() {
    document.querySelectorAll('#productGrid .check-item').forEach(el => {
      const key = el.getAttribute('data-key');

      if (key) {
        delete checked[key];
        el.classList.remove('checked');
      }
    });

    updateBadge();
  }

  function filterProducts() {
    const q = document.getElementById('productSearch').value.trim().toLowerCase();

    if (!q) {
      filterByCategory(activeCategory);
      return;
    }

    const matches = allProducts.filter(p => {
      return [
        p.name,
        p.price,
        p.netWeightEN,
        p.category,
        p.rowNumber
      ].join(' ').toLowerCase().includes(q);
    });

    if (!matches.length) {
      document.getElementById('productGrid').innerHTML =
        '<div style="grid-column:1/-1;text-align:center;padding:30px;color:var(--muted);">No products found</div>';
    } else {
      renderGrid(matches);
    }
  }

  function updateBadge() {
    const b = document.getElementById('selectedBadge');
    if (!b) return;

    const n = Object.keys(checked).length;
    b.textContent = n === 0 ? '0 items selected' : `${n} item${n !== 1 ? 's' : ''} selected`;
    b.classList.toggle('zero', n === 0);
  }

  /* ══ SUBMIT ══════════════════════════════════════════════════════════ */
  function jsonpRequest(action, params = {}, timeoutMs = 45000) {
    return new Promise((resolve, reject) => {
      const cbName = '__jsonp_' + Date.now() + '_' + Math.random().toString(36).slice(2);
      const script = document.createElement('script');
      let finished = false;

      const cleanup = () => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        try { delete window[cbName]; } catch (err) { window[cbName] = undefined; }
        if (script.parentNode) script.parentNode.removeChild(script);
      };

      window[cbName] = function(response) {
        cleanup();
        resolve(response);
      };

      script.async = true;
      script.onerror = function() {
        cleanup();
        reject(new Error('Could not contact the Apps Script web app. Check the deployment access and URL.'));
      };

      const query = new URLSearchParams({ action, callback: cbName });
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) query.set(key, String(value));
      });
      query.set('_ts', Date.now().toString());
      script.src = APPS_SCRIPT_URL + '?' + query.toString();

      const timer = setTimeout(() => {
        cleanup();
        reject(new Error('The request timed out. Please try again.'));
      }, timeoutMs);

      document.head.appendChild(script);
    });
  }

  function submitRequestToServer(payload) {
    // When the page is served directly by Apps Script, use google.script.run.
    if (window.google && google.script && google.script.run) {
      return new Promise((resolve, reject) => {
        google.script.run
          .withSuccessHandler(resolve)
          .withFailureHandler(error => reject(new Error(error && error.message ? error.message : String(error))))
          .submitRequest(payload);
      });
    }

    // GitHub Pages uses JSONP. Only compact row numbers are sent so the URL stays small.
    return jsonpRequest('submitRequest', {
      payload: JSON.stringify(payload)
    });
  }

  async function handleSubmit() {
    const errorAlert = document.getElementById('errorAlert');
    errorAlert.style.display = 'none';

    const email  = getValidatedEmailForSubmit();
    const date   = document.getElementById('dateField').value;
    const branch = document.getElementById('branchField').value;
    const notes  = document.getElementById('notesField').value.trim();

    if (!email) return;
    if (!date) return showError('Please select a date.');
    if (document.getElementById('branchField').disabled) return showError('Branch list is not loaded yet. Please refresh or check the Google Sheet connection.');
    if (!branch) return showError('Please select your branch.');
    if (!Object.keys(checked).length) return showError('Please select at least one product.');

    const selectedRows = Object.values(checked)
      .map(product => Number(product.rowNumber))
      .filter(rowNumber => Number.isInteger(rowNumber) && rowNumber > 1);

    if (!selectedRows.length) {
      return showError('The selected products are missing their Google Sheet row numbers. Reload the page and try again.');
    }

    // Do not send every Arabic/English product field in the GET URL.
    // Code.gs rebuilds the exact selected products from these unique row numbers.
    const payload = {
      email,
      dateRequested: date,
      branch,
      selectedRows,
      notes
    };

    const btn = document.getElementById('submitBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span>Submitting…';

    try {
      const res = await submitRequestToServer(payload);
      if (res && res.success) {
        document.getElementById('formWrap').style.display = 'none';
        document.getElementById('successScreen').style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        showError('Submission failed: ' + ((res && res.error) || 'Unknown error'));
      }
    } catch (error) {
      showError(error && error.message ? error.message : 'Could not submit the request. Please try again.');
    } finally {
      btn.disabled = false;
      btn.innerHTML = 'Submit Request';
    }
  }

  function showError(msg) {
    const el = document.getElementById('errorAlert');
    el.textContent = '⚠ ' + msg; el.style.display = 'block';
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function resetForm() {
    selectedEmailMethod = '';
    verifiedEmail = '';
    verifiedEmailMethod = '';
    document.getElementById('emailField').value = '';
    document.getElementById('flexwayEmailField').value = '';
    document.getElementById('googleChoice').classList.remove('active');
    document.getElementById('flexwayChoice').classList.remove('active');
    document.getElementById('googlePanel').classList.remove('active');
    document.getElementById('flexwayPanel').classList.remove('active');
    document.getElementById('googleVerifiedPill').classList.remove('show');
    setEmailStatus('neutral', 'Choose Google login or enter a Flexway email before submitting.');
    document.getElementById('dateField').valueAsDate = new Date();
    document.getElementById('branchField').value = '';
    document.getElementById('notesField').value = '';
    document.getElementById('productSearch').value = '';
    checked = {}; updateBadge(); filterByCategory(activeCategory);
    document.getElementById('formWrap').style.display = 'block';
    document.getElementById('successScreen').style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

 
  function loadHolidays() {
    const cbName = '_holCb_' + Date.now();
    window[cbName] = function(res) {
      delete window[cbName];
      if (res && res.success && res.data && res.data.length > 0) {
        renderHolidays(res.data);
      } else {
        renderHolidays([
          { name: 'Eid al Adha-May 26-29',       emoji: '🌙' },
          { name: 'Islamic New Year-June 17',    emoji: '🎆' },
          { name: "Prophet's Birthday-August 25",  emoji: '⭐' },
          { name: "National Day-December 2-3",  emoji: '🚩' },
        ]);
      }
    };
    const s = document.createElement('script');
    s.onerror = function() {
      delete window[cbName];
      renderHolidays([
        { name: 'Eid al Adha-May 26-29',       emoji: '🌙' },
        { name: 'Islamic New Year-June 17',    emoji: '🎆' },
        { name: "Prophet's Birthday-August 25",  emoji: '⭐' },
        { name: "National Day-December 2-3",  emoji: '🚩' },
      ]);
    };
    s.src = APPS_SCRIPT_URL + '?action=getHolidays&callback=' + cbName;
    document.head.appendChild(s);
  }

  function renderHolidays(holidays) {
    const items = holidays.map(h => `
      <div class="h-item">
        <span class="h-bullet">•</span>
        <span class="h-name">${h.emoji ? h.emoji + '\u00A0' : ''}${h.name}</span>
      </div>`).join('');
    // Duplicate items for seamless infinite scroll
    document.getElementById('holidaysList').innerHTML =
      `<div class="marquee-track">${items}${items}${items}</div>`;
  }

 
  function loadPhotos() {
    const cbName = '_photoCb_' + Date.now();
    window[cbName] = function(res) {
      delete window[cbName];
      if (res && res.success && res.data && res.data.length > 0) buildSlideshow(res.data);
      else if (FALLBACK_PHOTOS.length > 0) buildSlideshow(FALLBACK_PHOTOS);
    };
    const s = document.createElement('script');
    s.onerror = function() {
      delete window[cbName];
      if (FALLBACK_PHOTOS.length > 0) buildSlideshow(FALLBACK_PHOTOS);
    };
    s.src = APPS_SCRIPT_URL + '?action=getPhotos&callback=' + cbName;
    document.head.appendChild(s);
  }

  function buildSlideshow(photos) {
    slides = photos; currentSlide = 0;
    const box = document.getElementById('slideshow');

    let html = photos.map((p, i) => `
      <div class="slide ${i===0?'active':''}">
        <img src="${p.url}" alt="${p.caption||'Photo '+(i+1)}"
             onerror="this.parentElement.innerHTML='<div class=slide-placeholder><span>🖼️</span><p>Image unavailable</p></div>'">
      </div>`).join('');

    if (photos.length > 1) {
      html += `
        <button class="slide-nav prev" onclick="changeSlide(-1)">&#8249;</button>
        <button class="slide-nav next" onclick="changeSlide(1)">&#8250;</button>
        <div class="slideshow-dots">
          ${photos.map((_, i) => `<div class="s-dot ${i===0?'active':''}" onclick="goSlide(${i})"></div>`).join('')}
        </div>`;
    }

    box.innerHTML = html;
    updateCaption();
    const hint = document.getElementById('photosSetupHint');
    if (hint) hint.style.display = 'none';
    if (photos.length > 1) {
      clearInterval(slideTimer);
      slideTimer = setInterval(() => changeSlide(1), 4500);
    }
  }

  function changeSlide(dir) {
    clearInterval(slideTimer);
    const all = document.querySelectorAll('.slideshow .slide');
    const dots = document.querySelectorAll('.s-dot');
    if (!all.length) return;
    all[currentSlide].classList.remove('active');
    if (dots.length) dots[currentSlide].classList.remove('active');
    currentSlide = (currentSlide + dir + all.length) % all.length;
    all[currentSlide].classList.add('active');
    if (dots.length) dots[currentSlide].classList.add('active');
    updateCaption();
    slideTimer = setInterval(() => changeSlide(1), 4500);
  }

  function goSlide(idx) {
    clearInterval(slideTimer);
    const all = document.querySelectorAll('.slideshow .slide');
    const dots = document.querySelectorAll('.s-dot');
    all[currentSlide].classList.remove('active');
    if (dots.length) dots[currentSlide].classList.remove('active');
    currentSlide = idx;
    all[currentSlide].classList.add('active');
    if (dots.length) dots[currentSlide].classList.add('active');
    updateCaption();
    slideTimer = setInterval(() => changeSlide(1), 4500);
  }

  function updateCaption() {
    const cap = document.getElementById('photoCaption');
    if (!cap || !slides.length) return;
    const p = slides[currentSlide];
    cap.textContent = (p.caption || ('Photo ' + (currentSlide+1)))
      + (slides.length > 1 ? `  —  ${currentSlide+1} / ${slides.length}` : '');
  }
