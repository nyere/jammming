let accessToken = '';
const clientId = ''; // include a client_id
const redirectUri = 'http://localhost:3000';

const Spotify = {
    getAccessToken() {
        if (accessToken) {
            return accessToken;
        }

        const returnedAccessToken =
            window.location.href.match(/access_token=([^&]*)/);
        const returnedExpiresTime =
            window.location.href.match(/expires_in=([^&]*)/);

        if (returnedAccessToken && returnedExpiresTime) {
            accessToken = returnedAccessToken[1];
            const expiresIn = Number(returnedExpiresTime[1]);
            window.setTimeout(() => (accessToken = ''), expiresIn * 1000);
            window.history.pushState('Access Token', null, '/');
            return accessToken;
        } else {
            window.location = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&scope=playlist-modify-public&redirect_uri=${redirectUri}`;
        }
    },

    search(searchTerm) {
        const token = Spotify.getAccessToken();
        return fetch(
            `https://api.spotify.com/v1/search?type=track&q=${searchTerm}`,
            { headers: { Authorization: `Bearer ${token}` } }
        )
            .then((response) => {
                return response.json();
            })
            .then((jsonResponse) => {
                if (!jsonResponse.tracks) {
                    return [];
                }
                return jsonResponse.tracks.items.map((track) => ({
                    id: track.id,
                    name: track.name,
                    artist: track.artists[0].name,
                    album: track.album.name,
                    uri: track.uri,
                }));
            });
    },

    savePlaylist(playlistName, tracksURIs) {
        if (!(playlistName && tracksURIs)) {
            return;
        }

        const token = Spotify.getAccessToken();
        const headers = { Authorization: `Bearer ${token}` };
        let userID;
        let playlistID;

        return fetch('https://api.spotify.com/v1/me', {
            headers: headers,
        })
            .then((response) => response.json())
            .then((jsonResponse) => {
                userID = jsonResponse.id;
                return fetch(
                    `https://api.spotify.com/v1/users/${userID}/playlists`,
                    {
                        method: 'POST',
                        headers: headers,
                        body: JSON.stringify({ name: playlistName }),
                    }
                )
                    .then((response) => response.json())
                    .then((jsonResponse) => {
                        playlistID = jsonResponse.id;
                        return fetch(
                            `https://api.spotify.com/v1/playlists/${playlistID}/tracks`,
                            {
                                method: 'POST',
                                headers: headers,
                                body: JSON.stringify({
                                    uris: tracksURIs,
                                }),
                            }
                        );
                    });
            });
    },
};

export default Spotify;
