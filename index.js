document.addEventListener('DOMContentLoaded', function() {
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
    
    // 初期UIを設定
    updateUI();
  });