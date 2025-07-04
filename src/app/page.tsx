"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { ChangeEvent, useEffect, useState } from "react";

export default function Home() {
  const { data: session, status } = useSession();
  const [playlists, setPlaylists] = useState<{  label: string; id:string }[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string>("");
  const [tracks, setTracks] = useState<{  label: string; artist:string }[]>([]);
  const [responseText, setResponseText] = useState("");

  


  function handlePlaylistSelect(event: ChangeEvent<HTMLSelectElement>): void {
    setSelectedPlaylist(event.target.value);
    console.log("Selected Playlist ID:", event.target.value);
  }

  useEffect(() => {
    console.log("Session Access Token:", session?.accessToken);
  }, [session]);

  //getting the user's playlists 
  useEffect (() => {
    const fetchPlaylists = async () => {
      console.log(session);
      if(!session){
        return
      }

      try {
        const res = await fetch("https://api.spotify.com/v1/me/playlists", {  
          headers: { Authorization: `Bearer ${session.accessToken}` }
        });

        if(!res.ok){
          throw new Error("Couldn't fetch playlists");
        }

        const data = await res.json();

        setPlaylists(
          data.items.map((item: { id: string, name: string }) => ({
            label: item.name,
            id: item.id
          }))
        );
      }
      catch (error) {
        console.error("Error fetching playlists:", error);
      }
    };
    fetchPlaylists();
  }, [session])

  //getting tracks from selected playlist
  useEffect (() => {
    const fetchTracks = async () => {
      console.log(session);
      if(!session || !selectedPlaylist){
        return
      }

      try {
        const res = await fetch(`https://api.spotify.com/v1/playlists/${selectedPlaylist}/tracks`, {  
          headers: { Authorization: `Bearer ${session.accessToken}` }
        });

        if(!res.ok){
          throw new Error("Couldn't fetch tracks");
        }

        const data = await res.json();

      

        setTracks(
          data.items.map((item: any) => ({
            label: item.track.name,
            artist: item.track.artists[0]?.name || "Unknown Artist"
          }))
        );
      }
      catch (error) {
        console.error("Error fetching tracks:", error);
      }
    };
    fetchTracks();
  }, [session, selectedPlaylist])

  async function askGemini(){
    const stringArrSongs = tracks.map(track => `${track.label} - ${track.artist}`)
    const res = await fetch ('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({songs: stringArrSongs})
    })
    const data = await res.json();
    setResponseText(data.text);
  }

 
 
  if (status === "loading") {
    return <p>Loading...</p>;
  }

  async function handleClick() {
    askGemini();
  }

  //UI
  return (
    <div>
      {session ? (
        <div>
          <h1>Welcome, {session.user?.name}!</h1>
          <img src={session.user?.image!} alt="Profile" width={50} height={50} />

          <h2>choose a playlist!</h2>
          <select value={selectedPlaylist} onChange={handlePlaylistSelect} className="border p-2">
            <option value="" disabled>select a playlist...</option>
            {playlists.map((playlist) => (
              <option key={playlist.label} value={playlist.id}>
                {playlist.label}
              </option>
            ))}
          </select>

          <button onClick={handleClick}>analyze my playlist...</button>
          {tracks.length > 0 && (
            <div>
              <h3>playlist contents:</h3>
              <ul>
                {tracks.map((track, index) => (
                  <li key={index}>{track.label}</li>
                ))}
              </ul>
            </div>
          )}
           <h3>your analysis:</h3>
          {responseText && <p>{responseText}</p>}
          <button onClick={() => signOut()}>Sign out</button>
        </div>
      ) : (
        <div>
          <h1>Please sign in</h1>
          <button onClick={() => signIn("spotify")}>Sign in with Spotify</button>
        </div>
      )}
    </div>
  );

  
}
