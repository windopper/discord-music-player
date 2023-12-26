"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Utils = void 0;
const __1 = require("..");
const discord_js_1 = require("discord.js");
const play_dl_1 = __importStar(require("play-dl"));
class Utils {
    /**
     *
     */
    constructor() {
    }
    /**
     * Get ID from YouTube link
     * @param {string} url
     * @returns {?string}
     */
    static parseVideo(url) {
        const match = url.match(this.regexList.YouTubeVideoID);
        return match ? match[7] : null;
    }
    /**
     * Get timecode from YouTube link
     * @param {string} url
     * @returns {?string}
     */
    static parseVideoTimecode(url) {
        const match = url.match(this.regexList.YouTubeVideo);
        return match ? match[10] : null;
    }
    /**
     * Get ID from Playlist link
     * @param {string} url
     * @returns {?string}
     */
    static parsePlaylist(url) {
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
    static async search(search, options = __1.DefaultPlayOptions, queue, limit = 1) {
        options = Object.assign({}, __1.DefaultPlayOptions, options);
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
    static async spotifySearch(search, options = __1.DefaultPlayOptions, queue, limit = 1) {
        try {
            if (play_dl_1.default.is_expired()) {
                play_dl_1.default.refreshToken();
            }
            let spotifyResult = await play_dl_1.default.search(search, {
                source: {
                    spotify: "track"
                },
                limit
            });
            return spotifyResult.map(track => {
                return new __1.Song({
                    name: track.name,
                    url: track.url,
                    duration: this.msToTime(track.durationInMs),
                    author: track.artists[0].name,
                    isLive: false,
                    thumbnail: track.thumbnail.url
                }, queue, options.requestedBy);
            });
        }
        catch (e) {
            throw __1.DMPErrors.SEARCH_NULL;
        }
    }
    static async youtubeSearch(search, options = __1.DefaultPlayOptions, queue, limit = 1) {
        try {
            let youtubeResult = await play_dl_1.default.search(search, {
                source: {
                    youtube: "video"
                },
                limit
            });
            return youtubeResult.map(video => {
                return new __1.Song({
                    name: video.title,
                    url: video.url,
                    duration: video.durationRaw,
                    author: video.channel?.name ?? "Youtube Mix",
                    isLive: false,
                    thumbnail: video.thumbnails[0].url
                }, queue, options.requestedBy);
            });
        }
        catch (e) {
            throw __1.DMPErrors.SEARCH_NULL;
        }
    }
    static async soundcloudSearch(search, options = __1.DefaultPlayOptions, queue, limit = 1) {
        try {
            let spotifyResult = await play_dl_1.default.search(search, {
                source: {
                    soundcloud: "tracks"
                },
                limit
            });
            return spotifyResult.map(track => {
                return new __1.Song({
                    name: track.name,
                    url: track.url,
                    duration: this.msToTime(track.durationInMs),
                    author: track.user.name,
                    isLive: false,
                    thumbnail: track.thumbnail,
                }, queue, options.requestedBy);
            });
        }
        catch (e) {
            throw __1.DMPErrors.SEARCH_NULL;
        }
    }
    /**
     * Search for Song via link
     * @param {string} search
     * @param {PlayOptions} options
     * @param {Queue} queue
     * @return {Promise<Song>}
     */
    static async link(search, options = __1.DefaultPlayOptions, queue) {
        let isSpotifyLink = this.regexList.Spotify.test(search);
        let isYoutubeLink = this.regexList.YouTubeVideo.test(search);
        let soundcloudType = await play_dl_1.default.so_validate(search);
        if (isSpotifyLink) {
            return this.spotifyLink(search, options, queue);
        }
        else if (isYoutubeLink) {
            return this.youtubeLink(search, options, queue);
        }
        else if (soundcloudType === "track") {
            return this.soundCloudLink(search, options, queue);
        }
        else
            return null;
    }
    static async spotifyLink(url, options = __1.DefaultPlayOptions, queue) {
        let spotifyType = play_dl_1.default.sp_validate(url);
        if (spotifyType === "track") {
            try {
                if (play_dl_1.default.is_expired()) {
                    await play_dl_1.default.refreshToken();
                }
                let spotifyResult = await play_dl_1.default.spotify(url);
                spotifyResult = spotifyResult;
                const result = await this.search(`${spotifyResult.artists[0].name} - ${spotifyResult.name}`, options, queue).catch(() => null);
                if (result && result[0]) {
                    return result[0];
                }
                else
                    return null;
            }
            catch (e) {
                throw __1.DMPErrors.INVALID_SPOTIFY;
            }
        }
    }
    static async youtubeLink(url, options = __1.DefaultPlayOptions, queue) {
        let youtubeType = play_dl_1.default.yt_validate(url);
        if (youtubeType === "video") {
            try {
                let youtubeResult = await play_dl_1.default.video_info(url);
                let videoTimeCode = this.parseVideoTimecode(url);
                return new __1.Song({
                    name: youtubeResult.video_details.title,
                    url: url,
                    duration: this.msToTime((youtubeResult.video_details.durationInSec ?? 0) * 1000),
                    author: youtubeResult.video_details.channel.name,
                    isLive: youtubeResult.video_details.live,
                    thumbnail: youtubeResult.video_details.thumbnails[0].url,
                    seekTime: options.timecode && videoTimeCode ? Number(videoTimeCode) * 1000 : null,
                }, queue, options.requestedBy);
            }
            catch (e) {
                throw __1.DMPErrors.INVALID_YOUTUBE;
            }
        }
    }
    static async soundCloudLink(url, options = __1.DefaultPlayOptions, queue) {
        const soundCloudType = await play_dl_1.default.so_validate(url);
        if (soundCloudType == "track") {
            try {
                let soundCloudResult = await play_dl_1.default.soundcloud(url);
                return new __1.Song({
                    name: soundCloudResult.name,
                    url: url,
                    duration: this.msToTime(soundCloudResult.durationInMs),
                    author: soundCloudResult.user.name,
                    isLive: false,
                    thumbnail: soundCloudResult.thumbnail
                }, queue, options.requestedBy);
            }
            catch (e) {
                throw __1.DMPErrors.INVALID_SOUNDCLOUD;
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
    static async best(Search, SOptions = __1.DefaultPlayOptions, Queue) {
        let _Song;
        if (Search instanceof __1.Song)
            return Search;
        _Song = await this.link(Search, SOptions, Queue).catch(error => {
            if (!(error instanceof TypeError)) {
                throw __1.DMPErrors.UNKNOWN; //Ignore typeError
            }
        });
        if (!_Song)
            _Song = (await this.search(Search, SOptions, Queue))[0];
        return _Song;
    }
    /**
     * Search for Playlist
     * @param {string} search
     * @param {PlaylistOptions} options
     * @param {Queue} queue
     * @return {Promise<Playlist>}
     */
    static async playlist(search, options = __1.DefaultPlaylistOptions, queue) {
        if (search instanceof __1.Playlist)
            return search;
        let spotifyPlayType = play_dl_1.default.sp_validate(search);
        let youtubePlayType = play_dl_1.default.yt_validate(search);
        let soundCloudType = await play_dl_1.default.so_validate(search);
        if (spotifyPlayType === "playlist" || spotifyPlayType === "album") {
            return this.spotifyPlayList(search, options, queue);
        }
        else if (youtubePlayType === "playlist") {
            return this.youtubePlayList(search, options, queue);
        }
        else if (soundCloudType === "playlist") {
            return this.soundCloudPlayList(search, options, queue);
        }
        throw __1.DMPErrors.INVALID_PLAYLIST;
    }
    static async spotifyPlayList(url, options = __1.DefaultPlayOptions, queue) {
        if (play_dl_1.default.is_expired()) {
            await play_dl_1.default.refreshToken();
        }
        let spotifyType = play_dl_1.default.sp_validate(url);
        let spotifyResult = await play_dl_1.default.spotify(url);
        let spotifyPlayList;
        let limit = options.maxSongs ?? -1;
        if (spotifyType === "album") {
            spotifyResult = spotifyResult;
            spotifyPlayList = {
                name: spotifyResult.name,
                author: spotifyResult.artists[0].name,
                url: url,
                songs: [],
                type: "album"
            };
        }
        else if (spotifyType === "playlist") {
            spotifyResult = spotifyResult;
            spotifyPlayList = {
                name: spotifyResult.name,
                author: spotifyResult.owner.name,
                url: url,
                songs: [],
                type: "playlist"
            };
        }
        else {
            throw __1.DMPErrors.INVALID_PLAYLIST;
        }
        spotifyPlayList.songs = (await Promise.all((await spotifyResult.all_tracks()).map(async (track, index) => {
            if (limit !== -1 && index >= limit)
                return null;
            const Result = await this.search(`${track.artists[0].name} - ${track.name}`, options, queue).catch(() => null);
            if (Result && Result[0]) {
                Result[0].data = options.data;
                return Result[0];
            }
            else
                return null;
        })))
            .filter((V) => V !== null);
        if (spotifyResult.tracksCount === 0)
            throw __1.DMPErrors.INVALID_PLAYLIST;
        if (options.shuffle)
            spotifyPlayList.songs = this.shuffle(spotifyPlayList.songs);
        return new __1.Playlist(spotifyPlayList, queue, options.requestedBy);
    }
    static async youtubePlayList(url, options = __1.DefaultPlayOptions, queue) {
        let limit = options.maxSongs ?? -1;
        const youtubeType = (0, play_dl_1.yt_validate)(url);
        if (youtubeType === "playlist") {
            let PlaylistID = this.parsePlaylist(url);
            if (!PlaylistID)
                throw __1.DMPErrors.INVALID_PLAYLIST;
            let youtubeResult = await play_dl_1.default.playlist_info(url);
            if (!youtubeResult || Object.keys(youtubeResult).length === 0)
                throw __1.DMPErrors.INVALID_PLAYLIST;
            let youtubePlaylist = {
                name: youtubeResult.title,
                author: youtubeResult.channel.name ?? "Youtube Mix",
                url: url,
                songs: [],
                type: 'playlist'
            };
            if (youtubeResult.videoCount > 100 && (limit === -1 || limit > 100))
                await youtubeResult.next(Math.floor((limit === -1 || limit > youtubeResult.videoCount ? youtubeResult.videoCount : limit - 1) / 100));
            youtubePlaylist.songs = (await youtubeResult.all_videos()).map((video, index) => {
                if (limit !== -1 && index >= limit)
                    return null;
                let song = new __1.Song({
                    name: video.title,
                    url: `https://youtube.com/watch?v=${video.id}`,
                    duration: this.msToTime((video.durationInSec ?? 0) * 1000),
                    author: video.channel.name,
                    isLive: video.live,
                    thumbnail: video.thumbnails[0].url,
                }, queue, options.requestedBy);
                song.data = options.data;
                return song;
            })
                .filter((v) => v !== null);
            if (youtubePlaylist.songs.length === 0)
                throw __1.DMPErrors.INVALID_PLAYLIST;
            if (options.shuffle)
                youtubePlaylist.songs = this.shuffle(youtubePlaylist.songs);
            return new __1.Playlist(youtubePlaylist, queue, options.requestedBy);
        }
        else
            throw __1.DMPErrors.INVALID_PLAYLIST;
    }
    static async soundCloudPlayList(url, options = __1.DefaultPlayOptions, queue) {
        let limit = options.maxSongs ?? -1;
        const soundCloudType = await play_dl_1.default.so_validate(url);
        if (soundCloudType === "playlist") {
            let soundCloudResult = await play_dl_1.default.soundcloud(url);
            if (soundCloudResult.tracksCount === 0)
                throw __1.DMPErrors.INVALID_PLAYLIST;
            let soundCloudPlayList = {
                name: soundCloudResult.name,
                author: soundCloudResult.user.name,
                songs: [],
                type: "playlist",
                url: soundCloudResult.url
            };
            soundCloudPlayList.songs = (await soundCloudResult.all_tracks()).map((value, index) => {
                if (limit !== -1 && index >= limit)
                    return null;
                let song = new __1.Song({
                    author: value.user.name,
                    duration: this.msToTime(value.durationInMs),
                    isLive: false,
                    name: value.name,
                    thumbnail: value.thumbnail,
                    url: value.url
                }, queue, options.requestedBy);
                song.data = options.data;
                return song;
            });
            if (soundCloudPlayList.songs.length === 0)
                throw __1.DMPErrors.INVALID_PLAYLIST;
            if (options.shuffle)
                soundCloudPlayList.songs = this.shuffle(soundCloudPlayList.songs);
            return new __1.Playlist(soundCloudPlayList, queue, options.requestedBy);
        }
        else {
            throw __1.DMPErrors.INVALID_PLAYLIST;
        }
    }
    /**
     * Shuffles an array
     * @param {any[]} array
     * @returns {any[]}
     */
    static shuffle(array) {
        if (!Array.isArray(array))
            return [];
        const clone = [...array];
        const shuffled = [];
        while (clone.length > 0)
            shuffled.push(clone.splice(Math.floor(Math.random() * clone.length), 1)[0]);
        return shuffled;
    }
    /**
     * Converts milliseconds to duration (HH:MM:SS)
     * @returns {string}
     */
    static msToTime(duration) {
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
    static timeToMs(duration) {
        return duration.split(':')
            .reduceRight((prev, curr, i, arr) => prev + parseInt(curr) * 60 ** (arr.length - 1 - i), 0) * 1000;
    }
    static isVoiceChannel(Channel) {
        let type = Channel.type;
        if (typeof type === 'string')
            return ['GUILD_VOICE', 'GUILD_STAGE_VOICE'].includes(type);
        else
            return [discord_js_1.ChannelType.GuildVoice, discord_js_1.ChannelType.GuildStageVoice].includes(type);
    }
    static isStageVoiceChannel(Channel) {
        let type = Channel.type;
        if (typeof type === 'string')
            return type === 'GUILD_STAGE_VOICE';
        else
            return type === discord_js_1.ChannelType.GuildStageVoice;
    }
}
exports.Utils = Utils;
Utils.regexList = {
    YouTubeVideo: /^((?:https?:)\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be))((?!channel)(?!user)\/(?:[\w\-]+\?v=|embed\/|v\/)?)((?!channel)(?!user)[\w\-]+)(((.*(\?|\&)t=(\d+))(\D?|\S+?))|\D?|\S+?)$/,
    YouTubeVideoID: /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/,
    YouTubePlaylist: /^((?:https?:)\/\/)?((?:www|m)\.)?((?:youtube\.com)).*(youtu.be\/|list=)([^#&?]*).*/,
    YouTubePlaylistID: /[&?]list=([^&]+)/,
    Spotify: /https?:\/\/(?:embed\.|open\.)(?:spotify\.com\/)(?:track\/|\?uri=spotify:track:)((\w|-)+)(?:(?=\?)(?:[?&]foo=(\d*)(?=[&#]|$)|(?![?&]foo=)[^#])+)?(?=#|$)/,
    SpotifyPlaylist: /https?:\/\/(?:embed\.|open\.)(?:spotify\.com\/)(?:(album|playlist)\/|\?uri=spotify:playlist:)((\w|-)+)(?:(?=\?)(?:[?&]foo=(\d*)(?=[&#]|$)|(?![?&]foo=)[^#])+)?(?=#|$)/,
};
