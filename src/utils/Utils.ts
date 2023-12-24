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
import fetch from 'isomorphic-unfetch';
import {ChannelType, GuildChannel} from "discord.js";
import playdl, { SpotifyAlbum, SpotifyPlaylist, SpotifyTrack, YouTubeVideo } from 'play-dl'

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
     * @param {string} Search
     * @param {PlayOptions} [SOptions=DefaultPlayOptions]
     * @param {Queue} Queue
     * @param {number} [Limit=1]
     * @return {Promise<Song[]>}
     */
    static async search(Search: string, SOptions: PlayOptions = DefaultPlayOptions, Queue: Queue, Limit: number = 1): Promise<Song[]> {
        SOptions = Object.assign({}, DefaultPlayOptions, SOptions);
        try {
            let result = await playdl.search(Search, {
                source: {
                    youtube: "video"
                }
            })

            let items = result as YouTubeVideo[]

            let songs: (Song | null)[] = items.map(item => {
                if (item.type !== 'video')
                    return null;
                return new Song({
                    name: item.title,
                    url: item.url,
                    duration: item.durationRaw,
                    author: item.channel?.name,
                    isLive: item.live,
                    thumbnail: item.thumbnails[0].url,
                } as RawSong, Queue, SOptions.requestedBy);
            });

            return songs as Song[];
        } catch (e) {
            throw DMPErrors.SEARCH_NULL;
        }
    }

    /**
     * Search for Song via link
     * @param {string} search
     * @param {PlayOptions} SOptions
     * @param {Queue} Queue
     * @return {Promise<Song>}
     */
    static async link(search: string, SOptions: PlayOptions = DefaultPlayOptions, Queue: Queue) {

        let isSpotifyLink =
            this.regexList.Spotify.test(search);
        let isYoutubeLink =
            this.regexList.YouTubeVideo.test(search);

        if (isSpotifyLink) {
            try {
                let spotifyResult = await playdl.spotify(search)
                if (spotifyResult.type === "track") {
                    spotifyResult = spotifyResult as SpotifyTrack
                    let searchResult = await this.search(
                        `${spotifyResult.artists} - ${spotifyResult.name}`,
                        SOptions,
                        Queue
                    );
                    return searchResult[0];
                }
            } catch (e) {
                throw DMPErrors.INVALID_SPOTIFY;
            }
        } else if (isYoutubeLink) {
            let youtubeResult = await playdl.video_info(search);
            let videoTimeCode = this.parseVideoTimecode(search)

            return new Song({
                name: youtubeResult.video_details.title,
                url: search,
                duration: this.msToTime((youtubeResult.video_details.durationInSec ?? 0) * 1000),
                author: youtubeResult.video_details.channel.name,
                isLive: youtubeResult.video_details.live,
                thumbnail: youtubeResult.video_details.thumbnails[0].url,
                seekTime: SOptions.timecode && videoTimeCode ? Number(videoTimeCode) * 1000 : null,
            } as RawSong, Queue, SOptions.requestedBy);
        } else return null;
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
     * @param {PlaylistOptions} Soptions
     * @param {Queue} queue
     * @return {Promise<Playlist>}
     */
    static async playlist(search: Playlist | string, Soptions: PlaylistOptions & { data?: any } = DefaultPlaylistOptions, queue: Queue): Promise<Playlist> {
        if (search instanceof Playlist)
            return search as Playlist;

        let limit = Soptions.maxSongs ?? -1;
        let isSpotifyPlayListLink =
            this.regexList.SpotifyPlaylist.test(search);
        let isYoutubePlayListLink =
            this.regexList.YouTubePlaylist.test(search);
        
        
        if (isSpotifyPlayListLink) {
            let spotifyResult = await playdl.spotify(search);
            let spotifyPlayList: RawPlaylist

            if (spotifyResult.type === "album") {
                spotifyResult = spotifyResult as SpotifyAlbum
                spotifyPlayList = {
                    name: spotifyResult.name,
                    author: spotifyResult.artists[0].name,
                    url: search,
                    songs: [],
                    type: "album"
                }
            }
            else if (spotifyResult.type === "playlist") {
                spotifyResult = spotifyResult as SpotifyPlaylist
                spotifyPlayList = {
                    name: spotifyResult.name,
                    author: spotifyResult.owner.name,
                    url: search,
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
                            Soptions,
                            queue
                        ).catch(() => null);
                        if (Result && Result[0]) {
                            Result[0].data = Soptions.data;
                            return Result[0];
                        } else return null;
                    })
                )
            )
                .filter((V): V is Song => V !== null);

            if (spotifyResult.tracksCount === 0)
                throw DMPErrors.INVALID_PLAYLIST;

            if (Soptions.shuffle)
            spotifyPlayList.songs = this.shuffle(spotifyPlayList.songs);

            return new Playlist(spotifyPlayList, queue, Soptions.requestedBy);
        } else if (isYoutubePlayListLink) {
            let PlaylistID = this.parsePlaylist(search);
            if (!PlaylistID)
                throw DMPErrors.INVALID_PLAYLIST;

            let youtubeResult = await playdl.playlist_info(search);
            if (!youtubeResult || Object.keys(youtubeResult).length === 0)
                throw DMPErrors.INVALID_PLAYLIST;

            let youtubePlaylist: RawPlaylist = {
                name: youtubeResult.title,
                author: youtubeResult.channel.name ?? "Youtube Mix",
                url: search,
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
                }, queue, Soptions.requestedBy);
                song.data = Soptions.data;
                return song;
            })
                .filter((V): V is Song => V !== null);

            if (youtubePlaylist.songs.length === 0)
                throw DMPErrors.INVALID_PLAYLIST;

            if (Soptions.shuffle)
                youtubePlaylist.songs = this.shuffle(youtubePlaylist.songs);

            return new Playlist(youtubePlaylist, queue, Soptions.requestedBy);
        }

        throw DMPErrors.INVALID_PLAYLIST;
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
