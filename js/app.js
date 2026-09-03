/* =====================================================================
   MOOD CHANGER — APPLICATION LOGIC
   ---------------------------------------------------------------------
   This file reads categories/songs from js/music-data.js and drives:
     - clock + online counter
     - the Mood Dial + category browsing
     - the custom HTML5 audio player (play/pause/shuffle/repeat/etc.)
     - search, favorites, recently played (all via localStorage)
     - view switching (home / category / songs / favorites / playlists)
     - PWA install prompt

   You should NOT need to edit this file to customize the site —
   see js/music-data.js instead.
===================================================================== */

(function () {
  "use strict";

  /* ------------------------------------------------------------ */
  /* 0. FLATTEN DATA                                                */
  /* ------------------------------------------------------------ */
  const CATEGORIES = window.categories || [];
  const SETTINGS = window.siteSettings || {};

  // Every song, with its parent category attached, in one flat list.
  const ALL_SONGS = [];
  CATEGORIES.forEach((cat) => {
    (cat.songs || []).forEach((song) => {
      ALL_SONGS.push(Object.assign({}, song, {
        categoryId: cat.id,
        categoryName: cat.name,
        categoryGradient: cat.gradient
      }));
    });
  });

  function findCategory(id) {
    return CATEGORIES.find((c) => c.id === id) || null;
  }
  function findSongById(id) {
    return ALL_SONGS.find((s) => String(s.id) === String(id)) || null;
  }

  /* ------------------------------------------------------------ */
  /* 1. DOM SHORTCUTS                                               */
  /* ------------------------------------------------------------ */
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const el = {
    clock: $("#clock"),
    dateLine: $("#dateLine"),
    onlineCount: $("#onlineCount"),

    bgImage: $("#bgImage"),

    navPlaylists: $("#navPlaylists"),
    navSongs: $("#navSongs"),
    navFavorites: $("#navFavorites"),
    navSearch: $("#navSearch"),
    navCategories: $("#navCategories"),
    installBtn: $("#installBtn"),
    mobileInstallBtn: $("#mobileInstallBtn"),
    hamburgerBtn: $("#hamburgerBtn"),

    mobileDrawer: $("#mobileDrawer"),
    mobileDrawerClose: $("#mobileDrawerClose"),
    scrim: $("#scrim"),

    categoryDrawer: $("#categoryDrawer"),
    categoryDrawerClose: $("#categoryDrawerClose"),
    categoryDrawerList: $("#categoryDrawerList"),

    searchOverlay: $("#searchOverlay"),
    searchInput: $("#searchInput"),
    searchClose: $("#searchClose"),
    searchResults: $("#searchResults"),

    queueDrawer: $("#queueDrawer"),
    queueDrawerClose: $("#queueDrawerClose"),
    queueList: $("#queueList"),
    queueBtn: $("#queueBtn"),

    heroEyebrow: $("#heroEyebrow"),
    heroTagline: $("#heroTagline"),
    heroSubtagline: $("#heroSubtagline"),
    moodDial: $("#moodDial"),
    moodDialRing: $("#moodDialRing"),
    dialCenterIcon: $("#dialCenterIcon"),
    dialCenterLabel: $("#dialCenterLabel"),

    promoPill: $("#promoPill"),
    promoLink: $("#promoLink"),

    categoryGrid: $("#categoryGrid"),
    playlistsGrid: $("#playlistsGrid"),

    recentlyPlayedSection: $("#recentlyPlayedSection"),
    recentlyPlayedList: $("#recentlyPlayedList"),

    viewHome: $("#viewHome"),
    viewCategory: $("#viewCategory"),
    viewSongs: $("#viewSongs"),
    viewFavorites: $("#viewFavorites"),
    viewPlaylists: $("#viewPlaylists"),

    categoryHero: $("#categoryHero"),
    categoryHeroIcon: $("#categoryHeroIcon"),
    categoryHeroName: $("#categoryHeroName"),
    categoryHeroDesc: $("#categoryHeroDesc"),
    categoryYoutubeBtn: $("#categoryYoutubeBtn"),
    categoryBackBtn: $("#categoryBackBtn"),
    categorySongList: $("#categorySongList"),
    categoryPlayAll: $("#categoryPlayAll"),

    songsBackBtn: $("#songsBackBtn"),
    allSongsList: $("#allSongsList"),

    favoritesBackBtn: $("#favoritesBackBtn"),
    favoritesList: $("#favoritesList"),
    favoritesEmpty: $("#favoritesEmpty"),

    playlistsBackBtn: $("#playlistsBackBtn"),

    audioEl: $("#audioEl"),
    playerCover: $("#playerCover"),
    playerTitle: $("#playerTitle"),
    playerArtist: $("#playerArtist"),
    playerFavoriteBtn: $("#playerFavoriteBtn"),
    visualizer: $("#visualizer"),

    shuffleBtn: $("#shuffleBtn"),
    prevBtn: $("#prevBtn"),
    playPauseBtn: $("#playPauseBtn"),
    nextBtn: $("#nextBtn"),
    repeatBtn: $("#repeatBtn"),

    currentTime: $("#currentTime"),
    durationTime: $("#durationTime"),
    progressBar: $("#progressBar"),

    muteBtn: $("#muteBtn"),
    volumeBar: $("#volumeBar"),
    fullscreenBtn: $("#fullscreenBtn"),

    toast: $("#toast")
  };

  /* ------------------------------------------------------------ */
  /* 2. STORAGE HELPERS                                             */
  /* ------------------------------------------------------------ */
  const STORE_KEYS = {
    favorites: "moodchanger_favorites",
    recent: "moodchanger_recent",
    volume: "moodchanger_volume",
    repeat: "moodchanger_repeat"
  };

  function loadJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }
  function saveJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ }
  }

  let favorites = loadJSON(STORE_KEYS.favorites, []); // array of song ids
  let recentlyPlayed = loadJSON(STORE_KEYS.recent, []); // array of song ids, newest first

  function isFavorite(songId) { return favorites.map(String).includes(String(songId)); }
  function toggleFavorite(songId) {
    if (isFavorite(songId)) {
      favorites = favorites.filter((id) => String(id) !== String(songId));
    } else {
      favorites.unshift(String(songId));
    }
    saveJSON(STORE_KEYS.favorites, favorites);
    refreshFavoriteButtons();
  }
  function pushRecentlyPlayed(songId) {
    recentlyPlayed = [songId, ...recentlyPlayed.filter((id) => id !== songId)].slice(0, 10);
    saveJSON(STORE_KEYS.recent, recentlyPlayed);
    renderRecentlyPlayed();
  }

  /* ------------------------------------------------------------ */
  /* 3. TOAST / ERROR MESSAGES                                      */
  /* ------------------------------------------------------------ */
  let toastTimer = null;
  function showToast(message) {
    el.toast.textContent = message;
    el.toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.toast.hidden = true; }, 3200);
  }

  /* ------------------------------------------------------------ */
  /* 4. CLOCK + ONLINE COUNTER                                      */
  /* ------------------------------------------------------------ */
  function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    el.clock.textContent = `${hours}:${minutes} ${ampm}`;
    el.dateLine.textContent = now.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  }
  updateClock();
  setInterval(updateClock, 1000 * 15);

  function randomOnlineCount() { return Math.floor(Math.random() * (180 - 80 + 1)) + 80; }
  el.onlineCount.textContent = randomOnlineCount();
  setInterval(() => { el.onlineCount.textContent = randomOnlineCount(); }, 8000);

  /* ------------------------------------------------------------ */
  /* 5. BACKGROUND MANAGEMENT (per-category, with gradient fallback)*/
  /* ------------------------------------------------------------ */
  function setBackground(imagePath, fallbackGradient) {
    const gradient = fallbackGradient && fallbackGradient.length === 2
      ? `linear-gradient(160deg, ${fallbackGradient[0]}, ${fallbackGradient[1]})`
      : "linear-gradient(160deg, #1a1024, #3a1d1d)";

    if (!imagePath) {
      el.bgImage.style.backgroundImage = gradient;
      return;
    }
    const test = new Image();
    test.onload = () => { 
      el.bgImage.style.backgroundImage = `url("${imagePath}")`;
      el.bgImage.style.backgroundSize = "cover";
      el.bgImage.style.backgroundPosition = "center";
      el.bgImage.style.backgroundRepeat = "no-repeat";
    };
    test.onerror = () => { 
      el.bgImage.style.backgroundImage = gradient; 
    };
    test.src = imagePath;
  }
  setBackground(SETTINGS.homeBackground, SETTINGS.homeBackgroundFallback);

  // Promo pill (only shown if a community link is configured)
  if (SETTINGS.communityLink) {
    el.promoPill.hidden = false;
    el.promoLink.href = SETTINGS.communityLink;
  }
  el.heroTagline.textContent = SETTINGS.tagline || el.heroTagline.textContent;
  el.heroSubtagline.textContent = SETTINGS.subtagline || el.heroSubtagline.textContent;
  document.title = `${SETTINGS.siteName || "Mood Changer"} — ${SETTINGS.tagline || ""}`;

  /* ------------------------------------------------------------ */
  /* 6. IMAGE FALLBACK HELPER (for <img> and card art divs)         */
  /* ------------------------------------------------------------ */
  function gradientCss(gradient) {
    if (!gradient || gradient.length !== 2) return "linear-gradient(160deg, #22232f, #34363f)";
    return `linear-gradient(160deg, ${gradient[0]}, ${gradient[1]})`;
  }
  function applyArtBackground(node, imagePath, gradient) {
    if (!imagePath) {
      node.style.backgroundImage = gradientCss(gradient);
      return;
    }
    const test = new Image();
    test.onload = () => { 
      node.style.backgroundImage = `url("${imagePath}")`; 
      node.style.backgroundSize = "cover";
      node.style.backgroundPosition = "center";
      node.style.backgroundRepeat = "no-repeat";
    };
    test.onerror = () => {
      node.style.backgroundImage = gradientCss(gradient);
    };
    test.src = imagePath;
  }
  function safeImgSrc(imgNode, src, gradient) {
    imgNode.onerror = () => {
      imgNode.onerror = null;
      imgNode.style.background = gradientCss(gradient);
      imgNode.removeAttribute("src");
    };
    imgNode.src = src || "";
  }

  /* ------------------------------------------------------------ */
  /* 7. VIEW SWITCHING                                              */
  /* ------------------------------------------------------------ */
  const VIEWS = {
    home: el.viewHome,
    category: el.viewCategory,
    songs: el.viewSongs,
    favorites: el.viewFavorites,
    playlists: el.viewPlaylists
  };
  function showView(name) {
    Object.entries(VIEWS).forEach(([key, node]) => {
      if (!node) return;
      const active = key === name;
      node.hidden = !active;
      node.classList.toggle("is-active", active);
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ------------------------------------------------------------ */
  /* 8. MOOD DIAL (signature element)                               */
  /* ------------------------------------------------------------ */
  function buildMoodDial() {
    const radius = 120; // px, matches ~ (310/2 - node radius) visually
    const count = CATEGORIES.length;
    el.moodDialRing.innerHTML = "";
    CATEGORIES.forEach((cat, i) => {
      const angle = (i / count) * 2 * Math.PI - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const btn = document.createElement("button");
      btn.className = "mood-node";
      btn.type = "button";
      btn.style.transform = `translate(${x}px, ${y}px)`;
      btn.setAttribute("role", "option");
      btn.setAttribute("aria-label", cat.name);
      btn.dataset.categoryId = cat.id;
      btn.textContent = cat.icon;
      btn.addEventListener("mouseenter", () => setDialCenter(cat));
      btn.addEventListener("focus", () => setDialCenter(cat));
      btn.addEventListener("click", () => {
        $$(".mood-node").forEach((n) => n.classList.remove("is-active"));
        btn.classList.add("is-active");
        setDialCenter(cat);
        openCategory(cat.id);
      });
      el.moodDialRing.appendChild(btn);
    });
  }
  function setDialCenter(cat) {
    el.dialCenterIcon.textContent = cat.icon;
    el.dialCenterLabel.textContent = cat.name;
  }
  buildMoodDial();

  /* ------------------------------------------------------------ */
  /* 9. CATEGORY GRID / PLAYLISTS GRID / DRAWER LIST                */
  /* ------------------------------------------------------------ */
  function makeCategoryCard(cat) {
    const card = document.createElement("div");
    card.className = "category-card";

    const art = document.createElement("div");
    art.className = "category-card-art";
    applyArtBackground(art, cat.image, cat.gradient);
    card.appendChild(art);

    const playBtn = document.createElement("button");
    playBtn.className = "category-card-play";
    playBtn.setAttribute("aria-label", `Play ${cat.name}`);
    playBtn.textContent = "▶";
    playBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      playQueue(cat.songs, 0);
    });
    card.appendChild(playBtn);

    const body = document.createElement("div");
    body.className = "category-card-body";
    body.innerHTML = `
      <span class="category-card-icon">${cat.icon}</span>
      <span class="category-card-name">${cat.name}</span>
      <span class="category-card-count">${cat.songs.length} song${cat.songs.length === 1 ? "" : "s"}</span>
    `;
    card.appendChild(body);

    card.addEventListener("click", () => openCategory(cat.id));
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.addEventListener("keydown", (e) => { if (e.key === "Enter") openCategory(cat.id); });

    return card;
  }

  function renderCategoryGrids() {
    el.categoryGrid.innerHTML = "";
    el.playlistsGrid.innerHTML = "";
    CATEGORIES.forEach((cat) => {
      el.categoryGrid.appendChild(makeCategoryCard(cat));
      el.playlistsGrid.appendChild(makeCategoryCard(cat));
    });
  }
  renderCategoryGrids();

  function renderCategoryDrawerList() {
    el.categoryDrawerList.innerHTML = "";
    CATEGORIES.forEach((cat) => {
      const item = document.createElement("button");
      item.className = "category-drawer-item";
      item.innerHTML = `<span class="cdi-icon">${cat.icon}</span><span>${cat.name}</span><span class="cdi-count">${cat.songs.length}</span>`;
      item.addEventListener("click", () => { closeAllDrawers(); openCategory(cat.id); });
      el.categoryDrawerList.appendChild(item);
    });
  }
  renderCategoryDrawerList();

  /* ------------------------------------------------------------ */
  /* 10. SONG ROW RENDERING (shared by all list views)              */
  /* ------------------------------------------------------------ */
  function formatTime(seconds) {
    if (!isFinite(seconds) || seconds < 0) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  function makeSongRow(song, index, queue) {
    const row = document.createElement("div");
    row.className = "song-row";
    row.dataset.songId = song.id;

    const idx = document.createElement("span");
    idx.className = "song-index";
    idx.textContent = String(index + 1).padStart(2, "0");

    const cover = document.createElement("img");
    cover.className = "song-cover";
    cover.alt = "";
    safeImgSrc(cover, song.cover, song.categoryGradient);

    const info = document.createElement("div");
    info.className = "song-info";
    info.innerHTML = `<span class="s-title">${song.title}</span><span class="s-artist">${song.artist} · ${song.categoryName || ""}</span>`;

    const duration = document.createElement("span");
    duration.className = "song-duration";
    duration.textContent = song.durationSeconds ? formatTime(song.durationSeconds) : "--:--";

    const actions = document.createElement("div");
    actions.className = "song-actions";

    const favBtn = document.createElement("button");
    favBtn.className = "icon-btn-sm fav-row-btn" + (isFavorite(song.id) ? " is-fav" : "");
    favBtn.setAttribute("aria-label", "Toggle favorite");
    favBtn.textContent = isFavorite(song.id) ? "♥" : "♡";
    favBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleFavorite(song.id);
      favBtn.textContent = isFavorite(song.id) ? "♥" : "♡";
      favBtn.classList.toggle("is-fav", isFavorite(song.id));
    });

    const playBtn = document.createElement("button");
    playBtn.className = "icon-btn-sm play-row-btn";
    playBtn.setAttribute("aria-label", `Play ${song.title}`);
    playBtn.textContent = "▶";
    playBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      playQueue(queue, index);
    });

    actions.appendChild(favBtn);
    actions.appendChild(playBtn);

    row.appendChild(idx);
    row.appendChild(cover);
    row.appendChild(info);
    row.appendChild(duration);
    row.appendChild(actions);

    row.addEventListener("dblclick", () => playQueue(queue, index));

    return row;
  }

  function renderSongList(container, songs, emptyNode) {
    container.innerHTML = "";
    if (!songs.length) {
      if (emptyNode) emptyNode.hidden = false;
      return;
    }
    if (emptyNode) emptyNode.hidden = true;
    songs.forEach((song, i) => container.appendChild(makeSongRow(song, i, songs)));
  }

  function refreshFavoriteButtons() {
    $$(".fav-row-btn").forEach((btn) => {
      const row = btn.closest(".song-row");
      const id = row.dataset.songId;
      btn.textContent = isFavorite(id) ? "♥" : "♡";
      btn.classList.toggle("is-fav", isFavorite(id));
    });
    if (currentSong) {
      el.playerFavoriteBtn.setAttribute("aria-pressed", isFavorite(currentSong.id));
      el.playerFavoriteBtn.querySelector("span").textContent = isFavorite(currentSong.id) ? "♥" : "♡";
    }
  }

  function renderRecentlyPlayed() {
    const songs = recentlyPlayed.map(findSongById).filter(Boolean);
    el.recentlyPlayedSection.hidden = songs.length === 0;
    renderSongList(el.recentlyPlayedList, songs);
  }
  renderRecentlyPlayed();

  /* ------------------------------------------------------------ */
  /* 11. CATEGORY DETAIL VIEW                                       */
  /* ------------------------------------------------------------ */
  async function openCategory(categoryId) {
    const cat = findCategory(categoryId);
    if (!cat) return;

    el.categoryHeroIcon.textContent = cat.icon;
    el.categoryHeroName.textContent = cat.name;
    el.categoryHeroDesc.textContent = cat.description || "";
    applyArtBackground(el.categoryHero, cat.image, cat.gradient);
    setBackground(cat.image, cat.gradient);

    const getPlaylistId = (url) => {
      if (!url) return null;
      const match = String(url).match(/[?&]list=([^#&?]+)/);
      return match ? match[1] : (String(url).startsWith("PL") ? String(url) : null);
    };

    const pId = getPlaylistId(cat.youtubePlaylistUrl || cat.playlistId);

    if (pId && (!cat.songs || cat.songs.length === 0)) {
      el.categorySongList.innerHTML = `<p class="empty-state">⏳ Loading playlist songs from YouTube...</p>`;
      el.categoryPlayAll.hidden = true;
      showView("category");

      const cacheKey = `yt_cache_v2_${pId}`;
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length) cat.songs = parsed;
        }
      } catch (_) {}

      if (!cat.songs || cat.songs.length === 0) {
        try {
          cat.songs = await fetchYouTubePlaylistSongs(pId, cat);
          if (cat.songs.length) {
            try { localStorage.setItem(cacheKey, JSON.stringify(cat.songs)); } catch (_) {}
          }
        } catch (err) {
          console.error("YouTube playlist loading failed:", err);
          el.categorySongList.innerHTML =
            `<p class="empty-state">⚠️ ${escapeHtml(err.message || "Could not load this YouTube playlist.")}</p>`;
          el.categoryPlayAll.hidden = true;
          showView("category");
          return;
        }
      }
    }

    // Register dynamically loaded YouTube songs globally so Search,
    // Favorites, Recently Played and All Songs can use them too.
    (cat.songs || []).forEach((song) => {
      if (!ALL_SONGS.some((existing) => String(existing.id) === String(song.id))) {
        ALL_SONGS.push(Object.assign({}, song, {
          categoryId: cat.id,
          categoryName: cat.name,
          categoryGradient: cat.gradient
        }));
      }
    });

    if (cat.songs && cat.songs.length) {
      renderSongList(el.categorySongList, cat.songs);
      el.categoryPlayAll.hidden = false;
    } else {
      el.categorySongList.innerHTML =
        `<p class="empty-state">🎵 No songs found. Add a YouTube playlist link to this category.</p>`;
      el.categoryPlayAll.hidden = true;
    }

    if (cat.youtubePlaylistUrl) {
      el.categoryYoutubeBtn.hidden = false;
      el.categoryYoutubeBtn.href = cat.youtubePlaylistUrl;
    } else {
      el.categoryYoutubeBtn.hidden = true;
    }

    el.categoryPlayAll.onclick = () => playQueue(cat.songs, 0);
    showView("category");
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[char]));
  }

  async function fetchYouTubePlaylistSongs(playlistId, cat) {
  
  const items = [];
  let pageToken = "";

  // playlistItems.list returns a maximum of 50 items per page.
  // Keep following nextPageToken so the full playlist is imported.
  do {
    const apiUrl = new URL(
      "https://moodchangerapi.birajdarbhaskar8.workers.dev/playlist"
    );

    apiUrl.searchParams.set("playlistId", playlistId);

    if (pageToken) {
      apiUrl.searchParams.set("pageToken", pageToken);
    }

    const res = await fetch(apiUrl.toString());
    const data = await res.json();

    if (!res.ok || data.error) {
      const reason = data?.error?.errors?.[0]?.reason || data?.error?.message;
      throw new Error(
        reason
          ? `YouTube API: ${reason}`
          : "YouTube API request failed."
      );
    }

    items.push(...(data.items || []));
    pageToken = data.nextPageToken || "";
  } while (pageToken);

    const validItems = items.filter((item) => {
      const title = item?.snippet?.title || "";
      const videoId = item?.snippet?.resourceId?.videoId;
      return videoId && title !== "Private video" && title !== "Deleted video";
    });

    if (!validItems.length) return [];

    // Fetch durations in batches of 50 so the UI can show real durations.
    const songs = [];
    for (let i = 0; i < validItems.length; i += 50) {
      const batch = validItems.slice(i, i + 50);
      const ids = batch.map(item => item.snippet.resourceId.videoId).join(",");

      const params = new URLSearchParams({
        part: "contentDetails,status",
        id: ids,
      });

      const res = await fetch(
  `https://moodchangerapi.birajdarbhaskar8.workers.dev/videos?id=${encodeURIComponent(ids)}`
);
      const data = await res.json();

      if (!res.ok || data.error) {
        const reason = data?.error?.errors?.[0]?.reason || data?.error?.message;
        throw new Error(reason ? `YouTube duration API: ${reason}` : "Could not load video details.");
      }

      const details = new Map((data.items || []).map(v => [v.id, v]));

      batch.forEach(item => {
        const videoId = item.snippet.resourceId.videoId;
        const detail = details.get(videoId);
        // status.embeddable=false means YouTube does not allow the video to
        // be played in an embedded player, so leave it out of the playable list.
        // Keep the track; playback errors are handled by the player with auto-skip.
        songs.push({
          id: `yt-${videoId}`,
          youtubeId: videoId,
          title: item.snippet.title,
          artist: item.snippet.videoOwnerChannelTitle || cat.name,
          cover: item.snippet.thumbnails?.high?.url ||
                 item.snippet.thumbnails?.medium?.url ||
                 item.snippet.thumbnails?.default?.url ||
                 cat.image,
          durationSeconds: parseYouTubeDuration(detail?.contentDetails?.duration),
          audio: "",
          src: "",
          categoryId: cat.id,
          categoryName: cat.name,
          categoryGradient: cat.gradient
        });
      });
    }

    return songs;
  }

  function parseYouTubeDuration(isoDuration) {
    if (!isoDuration) return 0;
    const match = isoDuration.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
    if (!match) return 0;
    return (Number(match[1] || 0) * 3600) +
           (Number(match[2] || 0) * 60) +
           Number(match[3] || 0);
  }

  el.categoryBackBtn.addEventListener("click", () => {
    showView("home");
    setBackground(SETTINGS.homeBackground, SETTINGS.homeBackgroundFallback);
  });

  /* ------------------------------------------------------------ */
  /* 12. SONGS / FAVORITES / PLAYLISTS NAV                          */
  /* ------------------------------------------------------------ */
  function openSongsView() {
    renderSongList(el.allSongsList, ALL_SONGS);
    showView("songs");
  }
  function openFavoritesView() {
    const songs = favorites.map(findSongById).filter(Boolean);
    renderSongList(el.favoritesList, songs, el.favoritesEmpty);
    showView("favorites");
  }
  function openPlaylistsView() { showView("playlists"); }

  el.navSongs.addEventListener("click", openSongsView);
  el.navFavorites.addEventListener("click", openFavoritesView);
  el.navPlaylists.addEventListener("click", openPlaylistsView);
  el.songsBackBtn.addEventListener("click", () => showView("home"));
  el.favoritesBackBtn.addEventListener("click", () => showView("home"));
  el.playlistsBackBtn.addEventListener("click", () => showView("home"));

  /* ------------------------------------------------------------ */
  /* 13. DRAWERS (categories / mobile / queue) + SCRIM              */
  /* ------------------------------------------------------------ */
  function closeAllDrawers() {
    [el.categoryDrawer, el.mobileDrawer, el.queueDrawer].forEach((d) => { d.hidden = true; });
    el.scrim.hidden = true;
    el.navCategories.setAttribute("aria-expanded", "false");
    el.hamburgerBtn.setAttribute("aria-expanded", "false");
  }
  function openDrawer(drawer) {
    closeAllDrawers();
    drawer.hidden = false;
    el.scrim.hidden = false;
  }
  el.navCategories.addEventListener("click", () => { openDrawer(el.categoryDrawer); el.navCategories.setAttribute("aria-expanded", "true"); });
  el.categoryDrawerClose.addEventListener("click", closeAllDrawers);

  el.hamburgerBtn.addEventListener("click", () => { openDrawer(el.mobileDrawer); el.hamburgerBtn.setAttribute("aria-expanded", "true"); });
  el.mobileDrawerClose.addEventListener("click", closeAllDrawers);

  el.queueBtn.addEventListener("click", () => { renderQueue(); openDrawer(el.queueDrawer); });

  // Full screen — only relevant for YouTube video songs. mp3/local songs
  // never show this button, so this only ever runs for a video track.
  el.fullscreenBtn?.addEventListener("click", () => {
    if (!ytPlayer) return;
    const iframe = ytPlayer.getIframe?.();
    if (!iframe) return;
    const request =
      iframe.requestFullscreen ||
      iframe.webkitRequestFullscreen ||
      iframe.msRequestFullscreen;
    if (request) request.call(iframe);
    else showToast("Full screen isn't supported on this browser.");
  });
  el.queueDrawerClose.addEventListener("click", closeAllDrawers);

  el.scrim.addEventListener("click", closeAllDrawers);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { closeAllDrawers(); closeSearch(); } });

  $$(".drawer-link").forEach((link) => {
    link.addEventListener("click", () => {
      const action = link.dataset.action;
      closeAllDrawers();
      if (action === "playlists") openPlaylistsView();
      if (action === "songs") openSongsView();
      if (action === "favorites") openFavoritesView();
      if (action === "search") openSearch();
      if (action === "categories") openDrawer(el.categoryDrawer);
    });
  });

  /* ------------------------------------------------------------ */
  /* 14. SEARCH                                                     */
  /* ------------------------------------------------------------ */
  function openSearch() {
    el.searchOverlay.hidden = false;
    el.searchInput.value = "";
    el.searchResults.innerHTML = "";
    setTimeout(() => el.searchInput.focus(), 60);
  }
  function closeSearch() { el.searchOverlay.hidden = true; }
  el.navSearch.addEventListener("click", openSearch);
  el.searchClose.addEventListener("click", closeSearch);

  el.searchInput.addEventListener("input", () => {
    const q = el.searchInput.value.trim().toLowerCase();
    if (!q) { el.searchResults.innerHTML = ""; return; }
    const matches = ALL_SONGS.filter((s) =>
      s.title.toLowerCase().includes(q) ||
      s.artist.toLowerCase().includes(q) ||
      s.categoryName.toLowerCase().includes(q)
    );
    el.searchResults.innerHTML = "";
    if (!matches.length) {
      el.searchResults.innerHTML = `<p class="empty-state">No results for "${el.searchInput.value}"</p>`;
      return;
    }
    matches.forEach((song, i) => {
      const row = makeSongRow(song, i, matches);
      row.querySelector(".play-row-btn").addEventListener("click", closeSearch);
      el.searchResults.appendChild(row);
    });
  });

  /* ================================================================
     15. MUSIC PLAYER
     ----------------------------------------------------------------
     YouTube tracks use the official YouTube IFrame Player API.
     Local/licensed MP3 tracks continue to use the native <audio>.
  ================================================================ */
  const audio = el.audioEl;
  let queue = [];
  let queueIndex = -1;
  let currentSong = null;
  let isShuffling = false;
  let shuffleOrder = [];
  let repeatMode = loadJSON(STORE_KEYS.repeat, "off");
  let visualizerTimer = null;

  let ytPlayer = null;
  let ytApiReady = false;
  let ytPlayerReady = false;
  let ytPendingSong = null;
  let ytTicker = null;

  window.onYouTubeIframeAPIReady = function () {
    ytApiReady = true;
    if (ytPendingSong?.youtubeId) createYouTubePlayer(ytPendingSong);
  };

  function createYouTubePlayer(song, shouldAutoplay = true) {
    const shell = document.getElementById("youtubePlayerShell");
    const host = document.getElementById("youtubePlayer");
    if (!shell || !host || !song?.youtubeId || !window.YT?.Player) return;

    shell.hidden = false;
    document.querySelector(".player-cover-wrap")?.classList.add("is-youtube");
    // Video songs only — mp3/local songs never show this button.
    if (el.fullscreenBtn) el.fullscreenBtn.hidden = false;

    if (ytPlayer) {
      try { ytPlayer.destroy(); } catch (_) {}
      ytPlayer = null;
    }

    ytPlayerReady = false;
    ytPlayer = new YT.Player("youtubePlayer", {
      width: "320",
      height: "200",
      videoId: song.youtubeId,
      playerVars: {
        autoplay: shouldAutoplay ? 1 : 0,
        controls: 1,
        playsinline: 1,
        rel: 0,
        enablejsapi: 1
      },
      events: {
        onReady: (event) => {
          ytPlayerReady = true;
          const savedVolume = loadJSON(STORE_KEYS.volume, 80);
          event.target.setVolume(Number(savedVolume));

if (shouldAutoplay) {
  event.target.playVideo();
  startYouTubeTicker();
},
        onStateChange: (event) => {
          if (event.data === YT.PlayerState.PLAYING) {
            el.playPauseBtn.textContent = "⏸";
            el.playPauseBtn.setAttribute("aria-label", "Pause");
            el.visualizer.classList.add("is-playing");
            startYouTubeTicker();
          } else if (event.data === YT.PlayerState.PAUSED) {
            el.playPauseBtn.textContent = "▶";
            el.playPauseBtn.setAttribute("aria-label", "Play");
            el.visualizer.classList.remove("is-playing");
          } else if (event.data === YT.PlayerState.ENDED) {
            stopYouTubeTicker();
            playNext(true);
          } else if (event.data === YT.PlayerState.BUFFERING) {
            el.playPauseBtn.textContent = "⏳";
          }
        },
        onError: (event) => {
          console.warn("YouTube player error:", event.data);

          // Destroy the failed instance so the next track gets a clean player.
          ytPlayerReady = false;
          stopYouTubeTicker();
          try { ytPlayer?.destroy(); } catch (_) {}
          ytPlayer = null;

          // Move forward automatically. The current queue index is advanced
          // by playNext(), so the user never has to press Next manually.
          showToast("This YouTube track is unavailable here. Playing the next track…");
          setTimeout(() => playNext(true), 250);
        }
      }
    });
  }

  function hideYouTubePlayer() {
    stopYouTubeTicker();
    ytPendingSong = null;
    ytPlayerReady = false;
    const shell = document.getElementById("youtubePlayerShell");
    const wrap = document.querySelector(".player-cover-wrap");
    if (shell) shell.hidden = true;
    wrap?.classList.remove("is-youtube");
    if (el.fullscreenBtn) el.fullscreenBtn.hidden = true;
    if (ytPlayer) {
      try { ytPlayer.stopVideo(); } catch (_) {}
    }
  }

  function startYouTubeTicker() {
    stopYouTubeTicker();
    ytTicker = setInterval(() => {
      if (!ytPlayer || !ytPlayerReady || !currentSong) return;
      const duration = Number(ytPlayer.getDuration() || 0);
      const current = Number(ytPlayer.getCurrentTime() || 0);
      if (duration > 0) {
        el.currentTime.textContent = formatTime(current);
        el.durationTime.textContent = formatTime(duration);
        el.progressBar.value = Math.min(100, (current / duration) * 100);
      }
    }, 250);
  }

  function stopYouTubeTicker() {
    if (ytTicker) clearInterval(ytTicker);
    ytTicker = null;
  }

  function getCurrentDuration() {
    if (currentSong?.youtubeId && ytPlayerReady && ytPlayer) {
      return Number(ytPlayer.getDuration() || 0);
    }
    return Number(audio.duration || currentSong?.durationSeconds || 0);
  }

  // Restore saved volume.
  const savedVolume = loadJSON(STORE_KEYS.volume, 80);
  audio.volume = Number(savedVolume) / 100;
  el.volumeBar.value = savedVolume;
  updateMuteIcon();
  updateRepeatIcon();

  function buildShuffleOrder() {
    const indices = queue.map((_, i) => i).filter((i) => i !== queueIndex);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    shuffleOrder = indices;
  }

  function playQueue(songs, startIndex) {
    if (!songs || !songs.length) return;
    queue = songs.slice();
    queueIndex = Math.max(0, Math.min(startIndex, queue.length - 1));
    if (isShuffling) buildShuffleOrder();
    loadAndPlay(queue[queueIndex]);
    renderQueue();
  }

  function loadAndPlay(song) {
    if (!song) return;
    currentSong = song;

    updatePlayerUI();
    pushRecentlyPlayed(song.id);
    highlightPlayingRow();

    if (song.youtubeId) {
      audio.pause();
      audio.removeAttribute("src");
      ytPendingSong = song;

      if (ytApiReady && window.YT?.Player) {
        createYouTubePlayer(song);
      } else {
        showToast("Loading YouTube player…");
      }
      return;
    }

    // Licensed/local audio fallback.
    hideYouTubePlayer();
    const streamUrl = song.audio || song.src;
    if (!streamUrl) {
      showToast("This track has no playable audio source.");
      return;
    }

    audio.src = streamUrl;
    audio.load();
    audio.play().catch(err => {
      console.error("Playback failed:", err);
      showToast("Unable to play this audio file.");
    });
  }

  function updatePlayerUI() {
    if (!currentSong) return;
    el.playerTitle.textContent = currentSong.title;
    el.playerArtist.textContent = `${currentSong.artist} · ${currentSong.categoryName || ""}`;
    safeImgSrc(el.playerCover, currentSong.cover, currentSong.categoryGradient);
    el.playerFavoriteBtn.setAttribute("aria-pressed", isFavorite(currentSong.id));
    el.playerFavoriteBtn.querySelector("span").textContent = isFavorite(currentSong.id) ? "♥" : "♡";
    document.title = `${currentSong.title} — ${SETTINGS.siteName || "Mood Changer"}`;

    const knownDuration = Number(currentSong.durationSeconds || 0);
    if (knownDuration && !currentSong.youtubeId) {
      el.durationTime.textContent = formatTime(knownDuration);
    } else if (knownDuration) {
      el.durationTime.textContent = formatTime(knownDuration);
    }
  }

  function highlightPlayingRow() {
    $$(".song-row").forEach((row) => {
      row.classList.toggle("is-playing", currentSong && String(row.dataset.songId) === String(currentSong.id));
    });
  }


  // Keep the active track visually selected whenever the user changes
  // category/playlist views.
  function refreshActiveSongInCurrentView() {
    highlightPlayingRow();
    if (currentSong?.categoryId && typeof renderCategory === "function") {
      // Category views are rendered from the category's own song array;
      // highlightPlayingRow() is sufficient when the view is visible.
    }
  }

  function togglePlay() {
    if (!currentSong) {
      if (ALL_SONGS.length) playQueue(ALL_SONGS, 0);
      return;
    }

    if (currentSong.youtubeId) {
      if (!ytPlayerReady || !ytPlayer) {
        showToast("YouTube player is still loading…");
        return;
      }
      const state = ytPlayer.getPlayerState();
      if (state === YT.PlayerState.PLAYING || state === YT.PlayerState.BUFFERING) {
        ytPlayer.pauseVideo();
      } else {
        ytPlayer.playVideo();
      }
      return;
    }

    if (audio.paused) audio.play().catch(() => showToast("Unable to play this audio file."));
    else audio.pause();
  }

  function playNext(auto) {
    if (!queue.length) return;

    if (repeatMode === "one" && auto) {
      if (currentSong?.youtubeId && ytPlayerReady && ytPlayer) {
        ytPlayer.seekTo(0, true);
        ytPlayer.playVideo();
      } else {
        audio.currentTime = 0;
        audio.play();
      }
      return;
    }

    if (isShuffling) {
      if (!shuffleOrder.length) buildShuffleOrder();
      const next = shuffleOrder.shift();
      if (next === undefined) {
        if (repeatMode === "all") { buildShuffleOrder(); playNext(auto); }
        return;
      }
      queueIndex = next;
    } else {
      queueIndex += 1;
      if (queueIndex >= queue.length) {
        if (repeatMode === "all") queueIndex = 0;
        else { queueIndex = queue.length - 1; return; }
      }
    }
    loadAndPlay(queue[queueIndex]);
  }

  function playPrev() {
    if (!queue.length) return;

    if (currentSong?.youtubeId && ytPlayerReady && ytPlayer && ytPlayer.getCurrentTime() > 3) {
      ytPlayer.seekTo(0, true);
      return;
    }
    if (!currentSong?.youtubeId && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }

    queueIndex -= 1;
    if (queueIndex < 0) queueIndex = repeatMode === "all" ? queue.length - 1 : 0;
    loadAndPlay(queue[queueIndex]);
  }

  el.playPauseBtn.addEventListener("click", togglePlay);
  el.nextBtn.addEventListener("click", () => playNext(false));
  el.prevBtn.addEventListener("click", playPrev);

  el.shuffleBtn.addEventListener("click", () => {
    isShuffling = !isShuffling;
    el.shuffleBtn.setAttribute("aria-pressed", String(isShuffling));
    if (isShuffling) buildShuffleOrder();
  });

  function updateRepeatIcon() {
    const labels = { off: "Repeat off", all: "Repeat playlist", one: "Repeat current song" };
    el.repeatBtn.setAttribute("aria-label", labels[repeatMode]);
    el.repeatBtn.setAttribute("aria-pressed", String(repeatMode !== "off"));
    el.repeatBtn.textContent = repeatMode === "one" ? "🔂" : "🔁";
    el.repeatBtn.style.opacity = repeatMode === "off" ? "0.65" : "1";
  }

  el.repeatBtn.addEventListener("click", () => {
    repeatMode = repeatMode === "off" ? "all" : repeatMode === "all" ? "one" : "off";
    saveJSON(STORE_KEYS.repeat, repeatMode);
    updateRepeatIcon();
    showToast(`Repeat: ${repeatMode === "off" ? "off" : repeatMode === "all" ? "playlist" : "current song"}`);
  });

  el.playerFavoriteBtn.addEventListener("click", () => {
    if (!currentSong) return;
    toggleFavorite(currentSong.id);
  });

  audio.addEventListener("play", () => {
    el.playPauseBtn.textContent = "⏸";
    el.playPauseBtn.setAttribute("aria-label", "Pause");
    el.visualizer.classList.add("is-playing");
  });
  audio.addEventListener("pause", () => {
    if (currentSong?.youtubeId) return;
    el.playPauseBtn.textContent = "▶";
    el.playPauseBtn.setAttribute("aria-label", "Play");
    el.visualizer.classList.remove("is-playing");
  });
  audio.addEventListener("timeupdate", () => {
    if (currentSong?.youtubeId || !audio.duration) return;
    el.currentTime.textContent = formatTime(audio.currentTime);
    el.progressBar.value = (audio.currentTime / audio.duration) * 100 || 0;
  });
  audio.addEventListener("loadedmetadata", () => {
    if (currentSong?.youtubeId) return;
    el.durationTime.textContent = formatTime(audio.duration);
    const row = document.querySelector(`.song-row[data-song-id="${CSS.escape(String(currentSong?.id ?? ""))}"] .song-duration`);
    if (row) row.textContent = formatTime(audio.duration);
  });
  audio.addEventListener("ended", () => {
    if (!currentSong?.youtubeId) playNext(true);
  });
  audio.addEventListener("error", () => {
    if (currentSong && !currentSong.youtubeId) showToast("Unable to play this local audio track.");
  });

  el.progressBar.addEventListener("input", () => {
    const pct = Number(el.progressBar.value) / 100;
    if (currentSong?.youtubeId && ytPlayerReady && ytPlayer) {
      const duration = ytPlayer.getDuration();
      if (duration) ytPlayer.seekTo(duration * pct, true);
      return;
    }
    if (audio.duration) audio.currentTime = audio.duration * pct;
  });

  function updateMuteIcon() {
    const youtubeActive = currentSong?.youtubeId && ytPlayerReady && ytPlayer;
    const volume = youtubeActive ? ytPlayer.getVolume() : audio.volume * 100;
    el.muteBtn.textContent = (youtubeActive ? ytPlayer.isMuted() : audio.muted) || volume === 0
      ? "🔇" : volume < 50 ? "🔉" : "🔊";
  }

  el.volumeBar.addEventListener("input", () => {
    const value = Number(el.volumeBar.value);
    if (currentSong?.youtubeId && ytPlayerReady && ytPlayer) {
      ytPlayer.unMute();
      ytPlayer.setVolume(value);
    } else {
      audio.volume = value / 100;
      audio.muted = false;
    }
    saveJSON(STORE_KEYS.volume, value);
    updateMuteIcon();
  });

  el.muteBtn.addEventListener("click", () => {
    if (currentSong?.youtubeId && ytPlayerReady && ytPlayer) {
      if (ytPlayer.isMuted()) ytPlayer.unMute();
      else ytPlayer.mute();
    } else {
      audio.muted = !audio.muted;
    }
    updateMuteIcon();
  });

  /* ---- queue drawer ---- */
  function renderQueue() {
    if (!queue.length) {
      el.queueList.innerHTML = `<p class="empty-state">Your queue is empty. Play a mood to fill it up.</p>`;
      return;
    }
    el.queueList.innerHTML = "";
    queue.forEach((song, i) => {
      const row = makeSongRow(song, i, queue);
      if (currentSong && String(song.id) === String(currentSong.id)) row.classList.add("is-playing");
      el.queueList.appendChild(row);
    });
  }

  /* ------------------------------------------------------------ */
  /* 16. PWA INSTALL PROMPT                                         */
  /* ------------------------------------------------------------ */
  let deferredInstallPrompt = null;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    el.installBtn.hidden = false;
    el.mobileInstallBtn.hidden = false;
  });
  function triggerInstall() {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    deferredInstallPrompt.userChoice.finally(() => {
      deferredInstallPrompt = null;
      el.installBtn.hidden = true;
      el.mobileInstallBtn.hidden = true;
    });
  }
  el.installBtn.addEventListener("click", triggerInstall);
  el.mobileInstallBtn.addEventListener("click", triggerInstall);

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("service-worker.js").catch(() => { /* optional, safe to ignore */ });
    });
  }

  /* ------------------------------------------------------------ */
/* 17. INIT                                                       */
/* ------------------------------------------------------------ */

if (CATEGORIES[0]) setDialCenter(CATEGORIES[0]);

// Show the first available song in the player when the website opens.
// The song is selected and displayed, but it does NOT autoplay.
const firstAvailableSong = ALL_SONGS.find((song) => song);

if (firstAvailableSong) {
  queue = ALL_SONGS.slice();
  queueIndex = ALL_SONGS.indexOf(firstAvailableSong);
  currentSong = firstAvailableSong;

  updatePlayerUI();
  highlightPlayingRow();

  if (firstAvailableSong.youtubeId) {
    ytPendingSong = firstAvailableSong;

    if (ytApiReady && window.YT?.Player) {
      createYouTubePlayer(firstAvailableSong, false);
    }
  }
}
})();
// Fix: Close Mobile Drawer
const closeDrawer = () => {
    const drawer = document.getElementById("mobileDrawer");
    const scrim = document.getElementById("scrim");
    if (drawer) drawer.setAttribute("hidden", "");
    if (scrim) scrim.setAttribute("hidden", "");
};

document.getElementById("mobileDrawerClose")?.addEventListener("click", closeDrawer);
document.getElementById("scrim")?.addEventListener("click", closeDrawer);
