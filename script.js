const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".main-nav");
const audioPlayer = new Audio();
audioPlayer.preload = "metadata";
audioPlayer.volume = 0.8;
let selectedTrack = null;
const FAVORITES_KEY = "multimedia-vibe-board";

function getFavoriteItems() {
  try {
    const saved = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch (error) {
    console.warn("Unable to read favorites from storage.", error);
    return [];
  }
}

function saveFavoriteItems(items) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(items));
  } catch (error) {
    console.warn("Unable to save favorites to storage.", error);
  }
}

function buildFavoriteItem(type, { title, subtitle, image, meta, id }) {
  return {
    type,
    id: String(id || title || meta),
    title,
    subtitle,
    image,
    meta,
  };
}

function isFavoriteSaved(type, id) {
  const key = `${type}:${String(id || "")}`;
  return getFavoriteItems().some((item) => `${item.type}:${item.id}` === key);
}

function renderVibeBoard() {
  const vibeBoard = document.querySelector("[data-vibe-board]");
  if (!vibeBoard) return;

  const favorites = getFavoriteItems();
  if (!favorites.length) {
    vibeBoard.innerHTML = `
      <div class="vibe-empty">
        <strong>Nothing saved yet.</strong>
        <span>Double-tap a track cover or trailer poster to save it. A red heart will pop up.</span>
      </div>
    `;
    return;
  }

  const items = favorites.map((item) => {
    const isTrack = item.type === "track";
    const badge = isTrack ? "TRACK" : "TRAILER";
    const image = item.image || "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=85";
    const primaryAction = isTrack ? "Play track" : "Watch trailer";

    return `
      <article class="vibe-item">
        <button class="vibe-art" type="button" data-vibe-action="${item.type}" data-vibe-id="${item.id}" aria-label="${primaryAction} ${item.title}">
          <img src="${image}" alt="${item.title}">
          <span class="vibe-art-tag">${badge}</span>
          <span class="vibe-art-play" aria-hidden="true">▶</span>
        </button>
        <div class="vibe-copy">
          <div class="vibe-copy-top">
            <span>${item.meta || "CURATED PICK"}</span>
            <button class="favorite-button is-favorite" type="button" data-favorite-toggle data-favorite-type="${item.type}" data-favorite-id="${item.id}" data-favorite-title="${item.title}" data-favorite-subtitle="${item.subtitle || "Saved pick"}" data-favorite-image="${image}" data-favorite-meta="${item.meta || "CURATED PICK"}" aria-label="Remove ${item.title} from favorites">♥</button>
          </div>
          <h3>${item.title}</h3>
          <p>${item.subtitle || "Your saved pick"}</p>
        </div>
      </article>
    `;
  }).join("");

  vibeBoard.innerHTML = `<div class="vibe-grid">${items}</div>`;
}

function toggleFavoriteItem(button) {
  const type = button.dataset.favoriteType;
  const id = button.dataset.favoriteId;
  const title = button.dataset.favoriteTitle || "Favorite item";
  const subtitle = button.dataset.favoriteSubtitle || "Saved pick";
  const image = button.dataset.favoriteImage || "";
  const meta = button.dataset.favoriteMeta || "CURATED PICK";

  toggleFavorite(buildFavoriteItem(type, { title, subtitle, image, meta, id }));
}

function toggleFavorite(item) {
  const favorites = getFavoriteItems();
  const index = favorites.findIndex((entry) => `${entry.type}:${entry.id}` === `${item.type}:${item.id}`);

  if (index >= 0) {
    favorites.splice(index, 1);
  } else {
    favorites.unshift(item);
  }

  saveFavoriteItems(favorites);
  updateFavoriteButtons();
  renderVibeBoard();
}

function toggleCardFavorite(card, type) {
  const title = card.dataset.title || card.querySelector("h3")?.textContent || "Favorite pick";
  const subtitle = card.dataset.artist || card.dataset.album || card.querySelector("p")?.textContent || "Curated vibe";
  const meta = card.dataset.album || card.querySelector(".movie-meta > span")?.textContent || "CURATED PICK";
  const image = card.querySelector("img")?.currentSrc || card.querySelector("img")?.src || "";
  const id = type === "track" ? card.dataset.title : card.dataset.video || card.dataset.title;
  toggleFavorite(buildFavoriteItem(type, { title, subtitle, image, meta, id }));

  card.querySelector(".favorite-pop")?.remove();
  const heart = document.createElement("span");
  heart.className = "favorite-pop";
  heart.setAttribute("aria-hidden", "true");
  heart.textContent = "♥";
  card.append(heart);
  heart.addEventListener("animationend", () => heart.remove(), { once: true });
}

function updateFavoriteButtons() {
  document.querySelectorAll("[data-favorite-toggle]").forEach((button) => {
    const isFavorite = isFavoriteSaved(button.dataset.favoriteType, button.dataset.favoriteId);
    button.classList.toggle("is-favorite", isFavorite);
    button.textContent = isFavorite ? "♥" : "♡";
    button.setAttribute("aria-label", `${isFavorite ? "Remove" : "Save"} ${button.dataset.favoriteTitle || "this item"} from favorites`);
  });
}

function performMediaTap(target) {
  const card = target.matches("[data-track-card], [data-video-card]")
    ? target
    : target.closest("[data-track-card], [data-video-card]");
  if (!card) return;

  if (card.matches("[data-track-card]")) {
    const image = card.querySelector(".track-cover img");
    openImage(image?.currentSrc || image?.src, card.dataset.title || image?.alt || "", image?.alt);
  } else {
    openTrailer(card.dataset.video, card.dataset.title || "Movie trailer");
  }
}

if (menuButton && navigation) {
  const updateActiveNavigation = () => {
    const currentHash = window.location.hash || "#home";
    navigation.querySelectorAll("a").forEach((link) => {
      link.classList.toggle("active", link.getAttribute("href") === currentHash);
    });
  };

  menuButton.addEventListener("click", () => {
    const isOpen = navigation.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
  });

  navigation.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      navigation.classList.remove("open");
      menuButton.setAttribute("aria-expanded", "false");
      updateActiveNavigation();
    }
  });

  window.addEventListener("hashchange", updateActiveNavigation);
  updateActiveNavigation();
}

const dialog = document.createElement("dialog");
dialog.className = "media-dialog";
dialog.setAttribute("aria-label", "Media preview");
dialog.innerHTML = `
  <div class="dialog-inner">
    <button class="dialog-close" type="button" aria-label="Close preview">×</button>
    <div class="dialog-content"></div>
  </div>
`;
document.body.append(dialog);

const dialogContent = dialog.querySelector(".dialog-content");

function closePreview() {
  if (dialog.open) dialog.close();
  dialogContent.replaceChildren();
  dialog.classList.remove("media-dialog--trailer");
}

function openImage(src, caption, alt) {
  if (!src) return;
  const figure = document.createElement("figure");
  figure.className = "dialog-media";
  const image = document.createElement("img");
  image.src = src;
  image.alt = alt || caption || "Expanded image preview";
  figure.append(image);
  dialogContent.replaceChildren(figure);
  if (caption) {
    const label = document.createElement("p");
    label.className = "dialog-caption";
    label.textContent = caption;
    dialogContent.append(label);
  }
  if (!dialog.open) dialog.showModal();
}

function openTrailer(videoId, title) {
  if (!videoId) return;
  audioPlayer.pause();
  updatePlayingTrack(null);
  dialog.classList.add("media-dialog--trailer");
  const frame = document.createElement("iframe");
  frame.className = "dialog-media";
  frame.title = title;
  frame.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&playsinline=1&rel=0`;
  frame.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
  frame.allowFullscreen = true;
  dialogContent.replaceChildren(frame);
  if (!dialog.open) dialog.showModal();
  if (typeof dialog.requestFullscreen === "function") {
    void dialog.requestFullscreen().catch((error) => {
      console.warn("Unable to enter fullscreen; keeping the trailer in the expanded player.", error);
    });
  }
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
}

function updatePlayingTrack() {
  const isPlaying = Boolean(selectedTrack && !audioPlayer.paused);
  const audioControls = document.querySelector(".audio-player");
  const hasSelectedTrack = Boolean(selectedTrack);
  if (audioControls) {
    const controlsHost = selectedTrack || document.querySelector(".playlist-section");
    if (controlsHost && audioControls.parentElement !== controlsHost) {
      controlsHost.append(audioControls);
    }
    audioControls.classList.toggle("is-visible", hasSelectedTrack);
    audioControls.setAttribute("aria-hidden", String(!hasSelectedTrack));
  }

  document.querySelectorAll("[data-track-card]").forEach((card) => {
    const isActive = card === selectedTrack && isPlaying;
    card.classList.toggle("is-selected", card === selectedTrack);
    card.classList.toggle("is-playing", isActive);
    const button = card.querySelector("[data-play-track]");
    if (button) {
      button.setAttribute("aria-label", `${isActive ? "Pause" : "Play"} ${card.dataset.title}`);
      button.textContent = isActive ? "Ⅱ" : "▶";
    }
  });

  const nowPlaying = document.querySelector("[data-now-playing]");
  const indicator = document.querySelector(".playing-indicator");
  const toggleButton = document.querySelector("[data-toggle-player]");
  if (nowPlaying) {
    nowPlaying.textContent = selectedTrack?.dataset.title || "Choose a track to start listening";
  }
  if (indicator) indicator.classList.toggle("active", isPlaying);
  if (toggleButton) {
    toggleButton.textContent = isPlaying ? "Ⅱ" : "▶";
    toggleButton.setAttribute("aria-label", isPlaying ? "Pause track" : "Play track");
  }

  const currentTime = document.querySelector("[data-current-time]");
  const duration = document.querySelector("[data-duration]");
  const seek = document.querySelector("[data-seek]");
  if (currentTime) currentTime.textContent = formatTime(audioPlayer.currentTime);
  if (duration) duration.textContent = formatTime(audioPlayer.duration);
  if (seek) {
    seek.value = Number.isFinite(audioPlayer.duration) && audioPlayer.duration > 0
      ? String((audioPlayer.currentTime / audioPlayer.duration) * 100)
      : "0";
  }
}

async function playTrack(card) {
  const nowPlaying = document.querySelector("[data-now-playing]");
  if (!card.dataset.src) {
    if (nowPlaying) nowPlaying.textContent = "THIS TRACK HAS NO AUDIO FILE";
    return false;
  }

  if (selectedTrack !== card) {
    selectedTrack = card;
    audioPlayer.src = new URL(card.dataset.src, document.baseURI).href;
  }
  updatePlayingTrack();

  try {
    await audioPlayer.play();
    updatePlayingTrack();
  } catch (error) {
    audioPlayer.pause();
    updatePlayingTrack();
    if (nowPlaying) nowPlaying.textContent = `COULD NOT PLAY ${card.dataset.title} — CHECK THE AUDIO FILE`;
    console.error(`Unable to play ${card.dataset.src}:`, error);
  }
}

async function toggleTrack(card) {
  if (selectedTrack === card && !audioPlayer.paused) {
    audioPlayer.pause();
    updatePlayingTrack();
    return;
  }
  await playTrack(card);
}

function showMoodMovies(mood) {
  const result = document.querySelector("[data-movie-pick]");
  if (!result) return;
  const movies = [...document.querySelectorAll("[data-video-card]")];
  const candidates = mood === "surprise"
    ? movies
    : movies.filter((movie) => movie.dataset.moods?.split(/\s+/).includes(mood));
  if (!candidates.length) return;

  document.querySelectorAll("[data-mood]").forEach((button) => {
    const isSelected = button.dataset.mood === mood;
    button.classList.toggle("is-selected", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });

  const heading = document.createElement("p");
  heading.className = "movie-pick-count";
  heading.textContent = mood === "surprise"
    ? `${candidates.length} TRAILERS · ALL GENRES`
    : `${candidates.length} TRAILERS FOR THIS MOOD`;
  const grid = document.createElement("div");
  grid.className = "movie-pick-grid";

  candidates.forEach((movie) => {
    const videoId = movie.dataset.video;
    const image = movie.querySelector(".movie-poster img");
    const title = movie.querySelector(".movie-meta h3")?.textContent || movie.dataset.title;
    const card = document.createElement("article");
    card.className = "movie-pick-card";

    const poster = document.createElement("button");
    poster.type = "button";
    poster.className = "movie-pick-poster";
    poster.dataset.watchPicked = videoId;
    poster.setAttribute("aria-label", `Play ${title} trailer`);
    const posterImage = document.createElement("img");
    posterImage.src = image?.src || `https://img.youtube.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg`;
    posterImage.alt = "";
    posterImage.loading = "lazy";
    const playIcon = document.createElement("span");
    playIcon.className = "movie-pick-play-icon";
    playIcon.setAttribute("aria-hidden", "true");
    playIcon.textContent = "▶";
    poster.append(posterImage, playIcon);

    const copy = document.createElement("div");
    copy.className = "movie-pick-copy";
    const details = document.createElement("span");
    details.className = "movie-pick-meta";
    details.textContent = movie.querySelector(".movie-meta > span")?.textContent || "MOVIE TRAILER";
    const heading = document.createElement("h3");
    heading.textContent = title;
    const summary = document.createElement("p");
    summary.textContent = movie.querySelector(".movie-meta p")?.textContent || "";
    const watch = document.createElement("button");
    watch.type = "button";
    watch.className = "button button-bright";
    watch.dataset.watchPicked = videoId;
    watch.textContent = "Play trailer";
    copy.append(details, heading, summary, watch);
    card.append(poster, copy);
    grid.append(card);
  });

  result.replaceChildren(heading, grid);
}

function skipTrack(offset) {
  const tracks = [...document.querySelectorAll("[data-track-card]")];
  if (!tracks.length) return;
  const currentIndex = tracks.indexOf(selectedTrack);
  const nextIndex = currentIndex < 0
    ? (offset > 0 ? 0 : tracks.length - 1)
    : (currentIndex + offset + tracks.length) % tracks.length;
  void toggleTrack(tracks[nextIndex]);
}

let pendingMediaTap = null;

document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;

  const mediaCardTarget = target.closest("[data-track-card], [data-video-card]");
  if (mediaCardTarget && !target.closest("[data-play-track], .audio-player")) {
    event.preventDefault();
    if (pendingMediaTap?.target === mediaCardTarget) {
      window.clearTimeout(pendingMediaTap.timeout);
      pendingMediaTap = null;
      toggleCardFavorite(mediaCardTarget, mediaCardTarget.matches("[data-track-card]") ? "track" : "movie");
      return;
    }

    if (pendingMediaTap) {
      window.clearTimeout(pendingMediaTap.timeout);
      performMediaTap(pendingMediaTap.target);
    }
    const timeout = window.setTimeout(() => {
      performMediaTap(mediaCardTarget);
      pendingMediaTap = null;
    }, 320);
    pendingMediaTap = { target: mediaCardTarget, timeout };
    return;
  }

  if (pendingMediaTap) {
    window.clearTimeout(pendingMediaTap.timeout);
    performMediaTap(pendingMediaTap.target);
    pendingMediaTap = null;
  }

  const favoriteButton = target.closest("[data-favorite-toggle]");
  if (favoriteButton) {
    toggleFavoriteItem(favoriteButton);
    return;
  }

  const clearFavorites = target.closest("[data-clear-favorites]");
  if (clearFavorites) {
    saveFavoriteItems([]);
    renderVibeBoard();
    updateFavoriteButtons();
    return;
  }

  const vibeAction = target.closest("[data-vibe-action]");
  if (vibeAction) {
    const vibeType = vibeAction.dataset.vibeAction;
    const vibeId = vibeAction.dataset.vibeId;
    const favoriteMatch = getFavoriteItems().find((item) => item.type === vibeType && item.id === vibeId);

    if (!favoriteMatch) return;

    if (vibeType === "track") {
      const card = [...document.querySelectorAll("[data-track-card]")].find((trackCard) => (trackCard.dataset.title || "") === favoriteMatch.title);
      if (card) {
        void toggleTrack(card);
      }
      return;
    }

    const movieCard = [...document.querySelectorAll("[data-video-card]")].find((videoCard) => (videoCard.dataset.title || "") === favoriteMatch.title);
    if (movieCard) {
      openTrailer(movieCard.dataset.video, movieCard.dataset.title || "Movie trailer");
    }
    return;
  }

  if (target.closest(".dialog-close")) {
    closePreview();
    return;
  }

  if (target.closest("[data-toggle-player]")) {
    if (selectedTrack) void toggleTrack(selectedTrack);
    else {
      const firstTrack = document.querySelector("[data-track-card]");
      if (firstTrack) void toggleTrack(firstTrack);
    }
    return;
  }

  if (target.closest("[data-previous-track]")) {
    skipTrack(-1);
    return;
  }

  if (target.closest("[data-next-track]")) {
    skipTrack(1);
    return;
  }

  const moodButton = target.closest("[data-mood]");
  if (moodButton) {
    showMoodMovies(moodButton.dataset.mood);
    return;
  }

  const watchPicked = target.closest("[data-watch-picked]");
  if (watchPicked) {
    const card = watchPicked.closest(".movie-pick-card");
    if (!card) return;
    openTrailer(watchPicked.dataset.watchPicked, `${card.querySelector("h3")?.textContent || "Movie"} trailer`);
    return;
  }

  const playButton = target.closest("[data-play-track]");
  if (playButton) {
    const card = playButton.closest("[data-track-card]");
    if (card) void toggleTrack(card);
    return;
  }

  const movieCard = target.closest("[data-video-card]");
  if (movieCard) {
    const card = movieCard.closest("[data-video-card]");
    if (card) openTrailer(card.dataset.video, card.dataset.title || "Telugu movie trailer");
    return;
  }

  const imageTrigger = target.closest("[data-lightbox], .image-trigger, [data-track-card]");
  if (imageTrigger) {
    const image = imageTrigger.querySelector("img");
    const src = imageTrigger.dataset.lightbox || image?.currentSrc || image?.src;
    const caption = imageTrigger.dataset.caption || imageTrigger.dataset.title || image?.alt || "";
    openImage(src, caption, image?.alt);
  }
});

dialog.addEventListener("click", (event) => {
  if (event.target === dialog) closePreview();
});

dialog.addEventListener("close", () => {
  dialogContent.replaceChildren();
  dialog.classList.remove("media-dialog--trailer");
});

const seekInput = document.querySelector("[data-seek]");
const volumeInput = document.querySelector("[data-volume]");

if (seekInput) {
  seekInput.addEventListener("input", () => {
    if (Number.isFinite(audioPlayer.duration) && audioPlayer.duration > 0) {
      audioPlayer.currentTime = (Number(seekInput.value) / 100) * audioPlayer.duration;
    }
  });
}

if (volumeInput) {
  volumeInput.addEventListener("input", () => {
    audioPlayer.volume = Number(volumeInput.value);
  });
}

["play", "pause", "timeupdate", "loadedmetadata", "durationchange", "ended"].forEach((eventName) => {
  audioPlayer.addEventListener(eventName, updatePlayingTrack);
});

renderVibeBoard();
updateFavoriteButtons();
updatePlayingTrack();
