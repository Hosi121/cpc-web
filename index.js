document.addEventListener('DOMContentLoaded', function() {
    // ワードクラウドトグル機能の追加
    const toggleWordcloud = document.getElementById('toggle-wordcloud');
    const wordcloudContent = document.getElementById('wordcloud-content');
    
    if (toggleWordcloud) {
        toggleWordcloud.addEventListener('click', function() {
            const toggleIcon = this.querySelector('.toggle-icon');
            
            if (wordcloudContent.style.display === 'none') {
                wordcloudContent.style.display = 'block';
                toggleIcon.textContent = '▲';
            } else {
                wordcloudContent.style.display = 'none';
                toggleIcon.textContent = '▼';
            }
        });
    }

    // 全てのタグを収集
    const allTags = new Set();
    document.querySelectorAll('.card .tag').forEach(tag => {
      allTags.add(tag.textContent);
    });
    
    // 全タグ一覧を生成
    const toggleTagsButton = document.getElementById('toggle-tags');
    const allTagsContainer = document.getElementById('all-tags-container');
    const toggleIcon = toggleTagsButton.querySelector('.toggle-icon');
    
    // タグ一覧を生成
    allTags.forEach(tag => {
      const tagElement = document.createElement('span');
      tagElement.className = 'tag';
      tagElement.textContent = tag;
      tagElement.addEventListener('click', () => toggleFilter(tag));
      allTagsContainer.appendChild(tagElement);
    });
    
    toggleTagsButton.addEventListener('click', function() {
      if (allTagsContainer.style.display === 'none') {
        allTagsContainer.style.display = 'flex';
        toggleIcon.textContent = '▲';
      } else {
        allTagsContainer.style.display = 'none';
        toggleIcon.textContent = '▼';
      }
    });
    
    // 初期状態を設定
    allTagsContainer.style.display = 'none';
    
    // アクティブなフィルタータグ
    const activeFilters = new Set();
    
    // フィルター切り替え関数
    function toggleFilter(tag) {
      if (activeFilters.has(tag)) {
        activeFilters.delete(tag);
      } else {
        activeFilters.add(tag);
      }
      updateUI();
    }
    
    // カード内のタグにもイベントリスナーを追加
    document.querySelectorAll('.card .tag').forEach(tagElement => {
      tagElement.addEventListener('click', () => toggleFilter(tagElement.textContent));
    });
    
    // クリアボタン
    document.getElementById('clear-all').addEventListener('click', () => {
      activeFilters.clear();
      updateUI();
    });
    
    // UI更新関数
    function updateUI() {
      // タグのアクティブ状態を更新
      document.querySelectorAll('.tag').forEach(tag => {
        if (activeFilters.has(tag.textContent)) {
          tag.classList.add('active');
        } else {
          tag.classList.remove('active');
        }
      });
      
      // アクティブフィルターエリアを更新
      const activeFiltersEl = document.getElementById('active-filters');
      const activeTagsContainer = document.getElementById('active-tags-container');
      activeTagsContainer.innerHTML = '';
      
      activeFilters.forEach(tag => {
        const filterTag = document.createElement('span');
        filterTag.className = 'filter-tag';
        filterTag.textContent = tag + ' ×';
        filterTag.addEventListener('click', () => {
          activeFilters.delete(tag);
          updateUI();
        });
        activeTagsContainer.appendChild(filterTag);
      });
      
      // アクティブフィルターエリアの表示切り替え
      if (activeFilters.size > 0) {
        activeFiltersEl.classList.add('visible');
      } else {
        activeFiltersEl.classList.remove('visible');
      }
      
      // カードのフィルタリング
      const cards = document.querySelectorAll('.card');
      let visibleCount = 0;
      
      cards.forEach(card => {
        if (activeFilters.size === 0) {
          card.classList.remove('hidden');
          visibleCount++;
          return;
        }
        
        const cardTags = Array.from(card.querySelectorAll('.tag')).map(tag => tag.textContent);
        const hasAllTags = Array.from(activeFilters).every(filter => cardTags.includes(filter));
        
        if (hasAllTags) {
          card.classList.remove('hidden');
          visibleCount++;
        } else {
          card.classList.add('hidden');
        }
      });
      
      // 結果がない場合のメッセージ
      const noResults = document.getElementById('no-results');
      if (visibleCount === 0 && activeFilters.size > 0) {
        noResults.style.display = 'block';
      } else {
        noResults.style.display = 'none';
      }
    }
    
    // 論文欄の整形（柔軟な文法：番号/タイトル/リンク行をまとめる＋URL自動リンク）
    function formatPapers() {
      const urlRegex = /(https?:\/\/[\w!#$%&'()*+,./:;=?@\[\]-]+)/g;
      const trimTrailPunc = (s) => s.replace(/[)\]\}〉》】＞、。，．。.,]+$/u, '');
      const isNewItem = (line) => /^(タイトル[:：]|\d+[\.．)]\s*|\(\d+\)\s*|（\d+）\s*|[①-⑳]\s*|[・•]\s*|-\s*)/.test(line);
      const stripPrefix = (line) => line
        .replace(/^タイトル[:：]\s*/, '')
        .replace(/^\d+[\.．)]\s*/, '')
        .replace(/^\(\d+\)\s*/, '')
        .replace(/^（\d+）\s*/, '')
        .replace(/^[①-⑳]\s*/, '')
        .replace(/^[・•]\s*/, '')
        .replace(/^-\s*/, '')
        .trim();

      document.querySelectorAll('.papers').forEach(container => {
        const raw = (container.textContent || '').replace(/\r\n/g, '\n');
        const lines = raw.split(/\n/).map(l => l.trim()).filter(l => l.length);
        if (!lines.length) return;

        const items = [];
        let cur = null;
        const pushCur = () => { if (cur) items.push(cur); };

        lines.forEach(line => {
          const linkLine = line.replace(/^リンク[:：]\s*/, '');
          const urls = (linkLine.match(urlRegex) || []).map(u => trimTrailPunc(u));
          const startsNew = isNewItem(line) || /^タイトル[:：]/.test(line) || /^リンク[:：]/.test(line);

          if (startsNew && !/^リンク[:：]/.test(line)) {
            pushCur();
            cur = { title: stripPrefix(line), links: [] };
            if (urls.length && !/^タイトル[:：]/.test(line)) {
              cur.links.push(...urls);
            }
          } else if (/^リンク[:：]/.test(line)) {
            if (!cur) cur = { title: '', links: [] };
            cur.links.push(...urls);
          } else {
            if (!cur) cur = { title: '', links: [] };
            if (urls.length) {
              cur.links.push(...urls);
            } else {
              cur.title = (cur.title ? cur.title + ' ' : '') + stripPrefix(line);
            }
          }
        });
        pushCur();

        const ul = document.createElement('ul');
        ul.className = 'papers-list';
        items.forEach(it => {
          const li = document.createElement('li');
          if (it.title) {
            const titleSpan = document.createElement('span');
            titleSpan.className = 'paper-title';
            titleSpan.textContent = it.title;
            li.appendChild(titleSpan);
          }
          if (it.links && it.links.length) {
            if (it.title) li.appendChild(document.createTextNode(' '));
            it.links.forEach((u, idx) => {
              const a = document.createElement('a');
              a.href = u;
              a.target = '_blank';
              a.rel = 'noopener';
              a.textContent = u;
              li.appendChild(a);
              if (idx !== it.links.length - 1) li.appendChild(document.createTextNode(' / '));
            });
          }
          if (li.textContent.trim().length) ul.appendChild(li);
        });

        container.innerHTML = '';
        container.appendChild(ul);
      });
    }

    // 初期UIを設定
    updateUI();
    formatPapers();
});
