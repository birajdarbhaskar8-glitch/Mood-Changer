const YOUTUBE_API_KEY = "AIzaSyDhZBEpFEdcKjPa7i0he0TG_suxeqUSStc";
/* =====================================================================
   MOOD CHANGER — MUSIC & CATEGORY CONFIGURATION
   ---------------------------------------------------------------------
   This is the ONLY file you need to touch to change images, add songs,
   add categories, or link YouTube playlists. Nothing else in the
   project needs to be edited for everyday customization.

   Scroll down for:
     1. SITE SETTINGS       (homepage background, site title)
     2. CATEGORIES + SONGS  (images, songs, YouTube links)

   Every "REPLACE ME" comment marks something you should change.
===================================================================== */


/* ---------------------------------------------------------------------
   1. SITE SETTINGS
   -------------------------------------------------------------------
   homeBackground: the full-screen image shown on the homepage before
   a mood/category is selected.

   Put your image file inside the /images folder, then point to it here.
   Example:  homeBackground: "images/home-bg.jpg"

   If the file below doesn't exist, Mood Changer automatically falls
   back to a generated gradient so the site never looks broken.
------------------------------------------------------------------- */
const siteSettings = {
    siteName: "Mood Changer",
    tagline: "Music for every mood.",
    subtagline: "Relax. Feel. Listen.",

    // CHANGE HOMEPAGE BACKGROUND IMAGE HERE
    // REPLACE THIS IMAGE WITH YOUR OWN IMAGE
    homeBackground: "images/home-bg.jpg",

    // Fallback gradient used only if homeBackground fails to load.
    homeBackgroundFallback: ["#1a1024", "#3a1d1d", "#5c2a1a"],

    // WhatsApp / community link shown in the small promo pill (optional).
    // Leave the string empty ("") to hide the pill completely.
    communityLink: ""
};


/* ---------------------------------------------------------------------
   2. CATEGORIES + SONGS
   -------------------------------------------------------------------
   Each category needs:

     id                -> lowercase, no spaces, used internally (e.g. "lofi")
     name              -> shown on screen (e.g. "Lofi")
     icon              -> one emoji shown next to the name
     description       -> one short sentence
     image             -> path to a JPG/PNG inside /images
     gradient          -> two hex colors used as a backup background
                          if "image" is missing (also used for card art)
     youtubePlaylistUrl-> optional full YouTube playlist link
     songs             -> array of song objects (see below)

   HOW TO ADD A NEW CATEGORY
   --------------------------
   1. Copy one whole { ... } block below (from the opening { to closing },)
   2. Paste it just before the closing "];" of the categories array
   3. Change id, name, icon, description, image, gradient
   4. Save the file — the new category appears automatically everywhere
      (top menu, homepage grid, search, etc.)

   HOW TO ADD A SONG
   -----------------
   Inside a category's "songs" array, add:

     {
         id: 101,                                 // must be unique across ALL songs
         title: "My Song Name",
         artist: "My Artist Name",
         audio: "music/my-song.mp3",               // file inside /music folder
         cover: "images/my-song-cover.jpg"          // optional, falls back to category art
     }

   Only use audio you own, that is royalty-free, public domain, or
   properly licensed. The sample tracks below are freely-licensed demo
   tracks (SoundHelix) meant ONLY as placeholders — swap them out for
   your own music before publishing this site.
------------------------------------------------------------------- */

// ===============================
// CHANGE CATEGORY IMAGES HERE
// ===============================
const categories = [

    {
        id: "JAI MALHAR",
        name: "KHANDOBA SONGS",
        icon: "🕉️",
        description: "येळकोट येळकोट जय मल्हार.",
        // REPLACE THIS IMAGE WITH YOUR OWN IMAGE
        image: "images/khandoba.png",
        gradient: ["#1b1035", "#3a2a6b"],
        // PASTE YOUTUBE PLAYLIST LINK HERE
        youtubePlaylistUrl: "https://youtube.com/playlist?list=PLSyM_Dc4k8NE&si=9W7zCOyoPFSX4jMX",
        songs: [
    {
        id: 1,
        title: "jejuricha raja",
        artist: "khandoba",
        audio: "",
        cover: "https://i.pinimg.com/originals/78/86/6f/78866f5ca776438fcf816848e8693f56.jpg?nii=t"
    }
]
    },

    {
        id: "bhakti",
        name: "HANUMAN CHALISA",
        icon: "🕉️",
        description: "जय श्री राम.",
        image: "images/bhakti.png",
        gradient: ["#3a2a12", "#7a4a1a"],
        youtubePlaylistUrl: "https://youtube.com/playlist?list=PLDNH2LVio6-E&si=Lpg7Lx7ycEAZvkKE",
        songs: [ ]
    },

    {
        id: "old-songs",
        name: "OLD SONGS",
        icon: "📻",
        description: "Timeless classics that never get old.",
        image: "images/old-songs.png",
        gradient: ["#2a1a12", "#6b3a2a"],
        youtubePlaylistUrl: "https://music.youtube.com/playlist?list=PLTJ1PnzCWyFw",
        songs: []
    },

    {
        id: "vitthal",
        name: "VITTHAL RUKMINI SONGS",
        icon: "🕉️",
        description: "हरी ॐ विठ्ठला.",
        image: "images/vitthalrukmini.png",
        gradient: ["#3a1220", "#7a2a45"],
        youtubePlaylistUrl: "https://youtube.com/playlist?list=PLc3SBM-dmeD0&si=M3oQdWzEbckwo1Mc",
        songs: []
    },

    {
        id: "GANESHA",
        name: "GANPATI BAPPA SONGS",
        icon: "🕉️",
        description: "गणपती बाप्पा मोरया.",
        image: "images/ganesha.png",
        gradient: ["#0f2a2a", "#1f5a5a"],
        youtubePlaylistUrl: "https://youtube.com/playlist?list=PLWHg8SeRCuDQ&si=Odq4LrIkod8QhCIA",
        songs: []
    },

    {
        id: "krishna ji",
        name: "KRISHNA JI SONGS",
        icon: "🪈",
        description: "हरे राम हरे राम राम राम राम हरे हरे, हरे कृष्ण हरे कृष्ण कृष्ण कृष्ण हरे हरे.",
        image: "https://i.pinimg.com/originals/25/39/7b/25397bb8a9f174ce8a8ebdfe1be8efe8.jpg",
        gradient: ["#3a1a0a", "#8a3a12"],
        youtubePlaylistUrl: "https://youtube.com/playlist?list=PLXeU4Tgevsf4&si=xQe3Dt_nyi7aQeZa",
        songs: []
    },

    {
        id: "MAHADEV",
        name: "MAHADEV SONGS",
        icon: "🔱",
        description: "हर हर महादेव.",
        image: "https://i.pinimg.com/originals/08/81/3a/08813a077019e2dd2328e3a65859374e.jpg",
        gradient: ["#1a1a2e", "#2e2e5e"],
        youtubePlaylistUrl: "https://youtube.com/playlist?list=PLXO66AciyINw&si=qiqmBoiUGIlFN-e_",
        songs: []
    },

    {
        id: "SWAMI SAMARTH",
        name: "SHREE SWAMI SAMARTH SONGS",
        icon: "🕉️",
        description: "भिऊ नको मी तुझ्या पाठीशी आहे.",
        image: "images/swami.png",
        gradient: ["#1a1512", "#4a3a2a"],
        youtubePlaylistUrl: "https://youtube.com/playlist?list=PLRhQC0u_TXsY&si=kLsDKxfRQ9lCWSrN",
        // ADD LEGAL/OWN/LICENSED SONGS HERE — this category intentionally
        // starts empty to demonstrate the "no songs yet" state.
        songs: []
    }

];

// Make data available to app.js (both files are loaded as plain scripts).
window.siteSettings = siteSettings;
window.categories = categories;
