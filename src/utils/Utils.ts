import {
    DefaultPlaylistOptions,
    DefaultPlayOptions,
    DMPErrors,
    Playlist,
    PlaylistOptions,
    PlayOptions,
    Queue,
    RawPlaylist,
    RawSong,
    Song,
} from "..";
import {ChannelType, GuildChannel} from "discord.js";
import playdl, { SoundCloudPlaylist, SoundCloudTrack, SpotifyAlbum, SpotifyPlaylist, SpotifyTrack, YouTubeVideo, yt_validate } from 'play-dl'

export class Utils {
    static regexList = {
        YouTubeVideo: /^((?:https?:)\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be))((?!channel)(?!user)\/(?:[\w\-]+\?v=|embed\/|v\/)?)((?!channel)(?!user)[\w\-]+)(((.*(\?|\&)t=(\d+))(\D?|\S+?))|\D?|\S+?)$/,
        YouTubeVideoID: /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/,
        YouTubePlaylist: /^((?:https?:)\/\/)?((?:www|m)\.)?((?:youtube\.com)).*(youtu.be\/|list=)([^#&?]*).*/,
        YouTubePlaylistID: /[&?]list=([^&]+)/,
        Spotify: /https?:\/\/(?:embed\.|open\.)(?:spotify\.com\/)(?:track\/|\?uri=spotify:track:)((\w|-)+)(?:(?=\?)(?:[?&]foo=(\d*)(?=[&#]|$)|(?![?&]foo=)[^#])+)?(?=#|$)/,
        SpotifyPlaylist: /https?:\/\/(?:embed\.|open\.)(?:spotify\.com\/)(?:(album|playlist)\/|\?uri=spotify:playlist:)((\w|-)+)(?:(?=\?)(?:[?&]foo=(\d*)(?=[&#]|$)|(?![?&]foo=)[^#])+)?(?=#|$)/,
    }

    /**
     *
     */
    private constructor() {
    }

    /**
     * Get ID from YouTube link
     * @param {string} url
     * @returns {?string}
     */
    static parseVideo(url: string): string | null {
        const match = url.match(this.regexList.YouTubeVideoID);
        return match ? match[7] : null;
    }

    /**
     * Get timecode from YouTube link
     * @param {string} url
     * @returns {?string}
     */
    static parseVideoTimecode(url: string): string | null {
        const match = url.match(this.regexList.YouTubeVideo);
        return match ? match[10] : null;
    }

    /**
     * Get ID from Playlist link
     * @param {string} url
     * @returns {?string}
     */
    static parsePlaylist(url: string): string | null {
        const match = url.match(this.regexList.YouTubePlaylistID);
        return match ? match[1] : null;
    }

    /**
     * Search for Songs
     * @param {string} search
     * @param {PlayOptions} [options=DefaultPlayOptions]
     * @param {Queue} queue
     * @param {number} [limit=1]
     * @return {Promise<Song[]>}
     */
    static async search(search: string, options: PlayOptions = DefaultPlayOptions, queue: Queue, limit: number = 1): Promise<Song[]> {
        options = Object.assign({}, DefaultPlayOptions, options);
        if (options.searchFrom == "soundcloud") {
            return this.soundcloudSearch(search, options, queue, limit);
        }
        else if (options.searchFrom == "spotify") {
            return this.spotifySearch(search, options, queue, limit);
        }
        else if (options.searchFrom == "youtube") {
            return this.youtubeSearch(search, options, queue, limit);
        }
    }

    static async spotifySearch(search: string, options: PlayOptions = DefaultPlayOptions, queue: Queue, limit: number = 1): Promise<Song[]> {
        try {
            if (playdl.is_expired()) {
                playdl.refreshToken();
            }
            let spotifyResult = await playdl.search(search, {
                source: {
                    spotify: "track"
                },
                limit
            })

            return spotifyResult.map(track => {
                return new Song({
                    name: track.name,
                    url: track.url,
                    duration: this.msToTime(track.durationInMs),
                    author: track.artists[0].name,
                    isLive: false,
                    thumbnail: track.thumbnail.url
                }, queue, options.requestedBy)
            })
        }
        catch (e) {
            throw DMPErrors.SEARCH_NULL
        }
    }

    static async youtubeSearch(search: string, options: PlayOptions = DefaultPlayOptions, queue: Queue, limit: number = 1): Promise<Song[]> {
        try {
            let youtubeResult = await playdl.search(search, {
                source: {
                    youtube: "video"
                },
                limit
            })

            return youtubeResult.map(video => {
                return new Song({
                    name: video.title,
                    url: video.url,
                    duration: video.durationRaw,
                    author: video.channel?.name ?? "Youtube Mix",
                    isLive: false,
                    thumbnail: video.thumbnails[0].url
                }, queue, options.requestedBy)
            })
        }
        catch (e) {
            throw DMPErrors.SEARCH_NULL
        }
    }

    static async soundcloudSearch(search: string, options: PlayOptions = DefaultPlayOptions, queue: Queue, limit: number = 1): Promise<Song[]> {
        try {
            let spotifyResult = await playdl.search(search, {
                source: {
                    soundcloud: "tracks"
                },
                limit
            })

            return spotifyResult.map(track => {
                return new Song({
                    name: track.name,
                    url: track.url,
                    duration: this.msToTime(track.durationInMs),
                    author: track.user.name,
                    isLive: false,
                    thumbnail: track.thumbnail,
                }, queue, options.requestedBy)
            })
        }
        catch (e) {
            throw DMPErrors.SEARCH_NULL
        }
    }

    /**
     * Search for Song via link
     * @param {string} search
     * @param {PlayOptions} options
     * @param {Queue} queue
     * @return {Promise<Song>}
     */
    static async link(search: string, options: PlayOptions = DefaultPlayOptions, queue: Queue) {
        let isSpotifyLink =
            this.regexList.Spotify.test(search);
        let isYoutubeLink =
            this.regexList.YouTubeVideo.test(search);
        let soundcloudType = await playdl.so_validate(search);

        if (isSpotifyLink) {
            return this.spotifyLink(search, options, queue)
        } else if (isYoutubeLink) {
            return this.youtubeLink(search, options, queue)
        } else if (soundcloudType === "track") {
            return this.soundCloudLink(search, options, queue)
        }
        else return null;
    }

    static async spotifyLink(url: string, options: PlayOptions = DefaultPlayOptions, queue: Queue) {
        let spotifyType = playdl.sp_validate(url);

        if (spotifyType === "track") {
            try {
                if (playdl.is_expired()) {
                    await playdl.refreshToken();
                }
                let spotifyResult = await playdl.spotify(url)
                spotifyResult = spotifyResult as SpotifyTrack
                return new Song({
                    name: spotifyResult.name,
                    author: spotifyResult.artists[0].name,
                    duration: this.msToTime(spotifyResult.durationInMs),
                    isLive: false,
                    thumbnail: spotifyResult.thumbnail.url,
                    url: url,
                }, queue)
            } catch (e) {
                throw DMPErrors.INVALID_SPOTIFY;
            }
        }
    }

    static async youtubeLink(url: string, options: PlayOptions = DefaultPlayOptions, queue: Queue) {
        let youtubeType = playdl.yt_validate(url);

        if (youtubeType === "video") {
            try {
                let youtubeResult = await playdl.video_info(url);
                let videoTimeCode = this.parseVideoTimecode(url)
                return new Song({
                    name: youtubeResult.video_details.title,
                    url: url,
                    duration: this.msToTime((youtubeResult.video_details.durationInSec ?? 0) * 1000),
                    author: youtubeResult.video_details.channel.name,
                    isLive: youtubeResult.video_details.live,
                    thumbnail: youtubeResult.video_details.thumbnails[0].url,
                    seekTime: options.timecode && videoTimeCode ? Number(videoTimeCode) * 1000 : null,
                } as RawSong, queue, options.requestedBy);
            }
            catch (e) {
                throw DMPErrors.INVALID_YOUTUBE
            }
        }
    }

    static async soundCloudLink(url: string, options: PlayOptions = DefaultPlayOptions, queue: Queue) {
        const soundCloudType = await playdl.so_validate(url);

        if (soundCloudType == "track") {
            try {
                let soundCloudResult = await playdl.soundcloud(url) as SoundCloudTrack;
                return new Song({
                    name: soundCloudResult.name,
                    url: url,
                    duration: this.msToTime(soundCloudResult.durationInMs),
                    author: soundCloudResult.user.name,
                    isLive: false,
                    thumbnail: soundCloudResult.thumbnail
                } as RawSong, queue, options.requestedBy)
            }
            catch (e) {
                throw DMPErrors.INVALID_SOUNDCLOUD
            }
        }
    }

    /**
     * Gets the best result of a Search
     * @param {Song|string} Search
     * @param {PlayOptions} SOptions
     * @param {Queue} Queue
     * @return {Promise<Song>}
     */
    static async best(Search: Song | string, SOptions: PlayOptions = DefaultPlayOptions, Queue: Queue): Promise<Song> {
        let _Song;

        if (Search instanceof Song)
            return Search as Song;

        _Song = await this.link(
            Search,
            SOptions,
            Queue
        ).catch(error => {
            if (!(error instanceof TypeError)) {
                throw DMPErrors.UNKNOWN //Ignore typeError
            }
        });

        if (!_Song)
            _Song = (await this.search(
                Search,
                SOptions,
                Queue
            ))[0];

        return _Song;
    }

    /**
     * Search for Playlist
     * @param {string} search
     * @param {PlaylistOptions} options
     * @param {Queue} queue
     * @return {Promise<Playlist>}
     */
    static async playlist(search: Playlist | string, options: PlaylistOptions & { data?: any } = DefaultPlaylistOptions, queue: Queue): Promise<Playlist> {
        if (search instanceof Playlist)
            return search as Playlist;
        
        let spotifyPlayType = playdl.sp_validate(search);
        let youtubePlayType = playdl.yt_validate(search);
        let soundCloudType = await playdl.so_validate(search);
        
        if (spotifyPlayType === "playlist" || spotifyPlayType === "album") {
            return this.spotifyPlayList(search, options, queue)
        } else if (youtubePlayType === "playlist") {
            return this.youtubePlayList(search, options, queue)
        } else if (soundCloudType === "playlist") {
            return this.soundCloudPlayList(search, options, queue)
        }

        throw DMPErrors.INVALID_PLAYLIST;
    }

    static async spotifyPlayList(url: string, options: PlaylistOptions & { data?: any } = DefaultPlayOptions, queue: Queue): Promise<Playlist> {
        if (playdl.is_expired()) {
            await playdl.refreshToken();
        }
        let spotifyType = playdl.sp_validate(url);
        let spotifyResult = await playdl.spotify(url);
        let spotifyPlayList: RawPlaylist
        let limit = options.maxSongs ?? -1;

        if (spotifyType === "album") {
            spotifyResult = spotifyResult as SpotifyAlbum
            spotifyPlayList = {
                name: spotifyResult.name,
                author: spotifyResult.artists[0].name,
                url: url,
                songs: [],
                type: "album"
            }
        }
        else if (spotifyType === "playlist") {
            spotifyResult = spotifyResult as SpotifyPlaylist
            spotifyPlayList = {
                name: spotifyResult.name,
                author: spotifyResult.owner.name,
                url: url,
                songs: [],
                type: "playlist"
            }
        }
        else {
            throw DMPErrors.INVALID_PLAYLIST;
        }

        spotifyPlayList.songs = (
            await Promise.all(
                (await spotifyResult.all_tracks()).map(async (track, index) => {
                    if (limit !== -1 && index >= limit)
                        return null;
                    const Result = await this.search(
                        `${track.artists[0].name} - ${track.name}`,
                        options,
                        queue
                    ).catch(() => null);
                    if (Result && Result[0]) {
                        Result[0].data = options.data;
                        return Result[0];
                    } else return null;
                })
            )
        )
            .filter((V): V is Song => V !== null);

        if (spotifyResult.tracksCount === 0)
            throw DMPErrors.INVALID_PLAYLIST;

        if (options.shuffle)
        spotifyPlayList.songs = this.shuffle(spotifyPlayList.songs);

        return new Playlist(spotifyPlayList, queue, options.requestedBy);
    }

    static async youtubePlayList(url: string, options: PlaylistOptions & { data?: any } = DefaultPlayOptions, queue: Queue): Promise<Playlist> {
        let limit = options.maxSongs ?? -1;
        const youtubeType = yt_validate(url);

        if (youtubeType === "playlist") {
            let PlaylistID = this.parsePlaylist(url);
            if (!PlaylistID)
                throw DMPErrors.INVALID_PLAYLIST;
    
            let youtubeResult = await playdl.playlist_info(url);
            if (!youtubeResult || Object.keys(youtubeResult).length === 0)
                throw DMPErrors.INVALID_PLAYLIST;
    
            let youtubePlaylist: RawPlaylist = {
                name: youtubeResult.title,
                author: youtubeResult.channel.name ?? "Youtube Mix",
                url: url,
                songs: [],
                type: 'playlist'
            }
    
            if (youtubeResult.videoCount > 100 && (limit === -1 || limit > 100))
                await youtubeResult.next(Math.floor((limit === -1 || limit > youtubeResult.videoCount ? youtubeResult.videoCount : limit - 1) / 100));
    
            youtubePlaylist.songs = (await youtubeResult.all_videos()).map((video, index: number) => {
                if (limit !== -1 && index >= limit)
                    return null;
                let song = new Song({
                    name: video.title,
                    url: `https://youtube.com/watch?v=${video.id}`,
                    duration: this.msToTime((video.durationInSec ?? 0) * 1000),
                    author: video.channel!.name,
                    isLive: video.live,
                    thumbnail: video.thumbnails[0].url!,
                }, queue, options.requestedBy);
                song.data = options.data;
                return song;
            })
                .filter((v): v is Song => v !== null);
    
            if (youtubePlaylist.songs.length === 0)
                throw DMPErrors.INVALID_PLAYLIST;
    
            if (options.shuffle)
                youtubePlaylist.songs = this.shuffle(youtubePlaylist.songs);
    
            return new Playlist(youtubePlaylist, queue, options.requestedBy);
        }
        else throw DMPErrors.INVALID_PLAYLIST
    
    }

    static async soundCloudPlayList(url: string, options: PlaylistOptions & { data?: any } = DefaultPlayOptions, queue: Queue): Promise<Playlist> {
        let limit = options.maxSongs ?? -1;
        const soundCloudType = await playdl.so_validate(url);

        if (soundCloudType === "playlist") {
            let soundCloudResult = await playdl.soundcloud(url) as SoundCloudPlaylist

            if (soundCloudResult.tracksCount === 0)
                throw DMPErrors.INVALID_PLAYLIST

            let soundCloudPlayList: RawPlaylist = {
                name: soundCloudResult.name,
                author: soundCloudResult.user.name,
                songs: [],
                type: "playlist",
                url: soundCloudResult.url
            }

            soundCloudPlayList.songs = (await soundCloudResult.all_tracks()).map((value, index) => {
                if (limit !== -1 && index >= limit)
                    return null;
                let song = new Song({
                    author: value.user.name,
                    duration: this.msToTime(value.durationInMs),
                    isLive: false,
                    name: value.name,
                    thumbnail: value.thumbnail,
                    url: value.url
                }, queue, options.requestedBy)
                song.data = options.data
                return song
            })

            if (soundCloudPlayList.songs.length === 0)
            throw DMPErrors.INVALID_PLAYLIST;

            if (options.shuffle)
            soundCloudPlayList.songs = this.shuffle(soundCloudPlayList.songs);

            return new Playlist(soundCloudPlayList, queue, options.requestedBy);
        }
        else {
            throw DMPErrors.INVALID_PLAYLIST
        }
    }

    /**
     * Shuffles an array
     * @param {any[]} array
     * @returns {any[]}
     */
    static shuffle(array: any[]): any[] {
        if (!Array.isArray(array))
            return [];
        const clone = [...array];
        const shuffled = [];
        while (clone.length > 0)
            shuffled.push(
                clone.splice(
                    Math.floor(
                        Math.random() * clone.length
                    ), 1
                )[0]
            );
        return shuffled;
    }

    /**
     * Converts milliseconds to duration (HH:MM:SS)
     * @returns {string}
     */
    static msToTime(duration: number): string {
        const seconds = Math.floor(duration / 1000 % 60);
        const minutes = Math.floor(duration / 60000 % 60);
        const hours = Math.floor(duration / 3600000);
        const secondsPad = `${seconds}`.padStart(2, '0');
        const minutesPad = `${minutes}`.padStart(2, '0');
        const hoursPad = `${hours}`.padStart(2, '0');

        return `${hours ? `${hoursPad}:` : ''}${minutesPad}:${secondsPad}`;
    }

    /**
     * Converts duration (HH:MM:SS) to milliseconds
     * @returns {number}
     */
    static timeToMs(duration: string): number {
        return duration.split(':')
            .reduceRight(
                (prev, curr, i, arr) => prev + parseInt(curr) * 60 ** (arr.length - 1 - i), 0
            ) * 1000;
    }

    static isVoiceChannel(Channel: GuildChannel): boolean {
        let type = Channel.type as ChannelType | string;
        if (typeof type === 'string')
            return ['GUILD_VOICE', 'GUILD_STAGE_VOICE'].includes(type);
        else return [ChannelType.GuildVoice, ChannelType.GuildStageVoice].includes(type);
    }

    static isStageVoiceChannel(Channel: GuildChannel): boolean {
        let type = Channel.type as ChannelType | string;
        if (typeof type === 'string')
            return type === 'GUILD_STAGE_VOICE';
        else return type === ChannelType.GuildStageVoice;
    }

}
