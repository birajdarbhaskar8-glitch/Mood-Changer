Put your own MP3 files in this folder.

The demo site currently points to free demo tracks hosted online
(SoundHelix sample MP3s) just so the player works out of the box.
Replace those with your own legal / royalty-free / licensed songs
before publishing this site.

To add a song:
1. Copy your .mp3 file into this "music" folder, e.g. music/my-song.mp3
2. Open js/music-data.js
3. Find the category you want the song in
4. Add a new entry to its "songs" array, e.g.:

   {
       id: 999,
       title: "My Song Name",
       artist: "My Artist Name",
       audio: "music/my-song.mp3",
       cover: "images/my-song-cover.jpg"
   }

Make sure every song's "id" number is unique across the whole file.

Do not use copyrighted songs you don't have the rights to distribute.
