import { Playlist, PlaylistOptions, PlayOptions, Queue, Song } from "..";
import { GuildChannel } from "discord.js";
export declare class Utils {
    static regexList: {
        YouTubeVideo: RegExp;
        YouTubeVideoID: RegExp;
        YouTubePlaylist: RegExp;
        YouTubePlaylistID: RegExp;
        Spotify: RegExp;
        SpotifyPlaylist: RegExp;
    };
    /**
     *
     */
    private constructor();
    /**
     * Get ID from YouTube link
     * @param {string} url
     * @returns {?string}
     */
    static parseVideo(url: string): string | null;
    /**
     * Get timecode from YouTube link
     * @param {string} url
     * @returns {?string}
     */
    static parseVideoTimecode(url: string): string | null;
    /**
     * Get ID from Playlist link
     * @param {string} url
     * @returns {?string}
     */
    static parsePlaylist(url: string): string | null;
    /**
     * Search for Songs
     * @param {string} search
     * @param {PlayOptions} [options=DefaultPlayOptions]
     * @param {Queue} queue
     * @param {number} [limit=1]
     * @return {Promise<Song[]>}
     */
    static search(search: string, options: PlayOptions, queue: Queue, limit?: number): Promise<Song[]>;
    static spotifySearch(search: string, options: PlayOptions, queue: Queue, limit?: number): Promise<Song[]>;
    static youtubeSearch(search: string, options: PlayOptions, queue: Queue, limit?: number): Promise<Song[]>;
    static soundcloudSearch(search: string, options: PlayOptions, queue: Queue, limit?: number): Promise<Song[]>;
    /**
     * Search for Song via link
     * @param {string} search
     * @param {PlayOptions} options
     * @param {Queue} queue
     * @return {Promise<Song>}
     */
    static link(search: string, options: PlayOptions, queue: Queue): Promise<any>;
    static spotifyLink(url: string, options: PlayOptions, queue: Queue): Promise<any>;
    static youtubeLink(url: string, options: PlayOptions, queue: Queue): Promise<Song>;
    static soundCloudLink(url: string, options: PlayOptions, queue: Queue): Promise<Song>;
    /**
     * Gets the best result of a Search
     * @param {Song|string} Search
     * @param {PlayOptions} SOptions
     * @param {Queue} Queue
     * @return {Promise<Song>}
     */
    static best(Search: Song | string, SOptions: PlayOptions, Queue: Queue): Promise<Song>;
    /**
     * Search for Playlist
     * @param {string} search
     * @param {PlaylistOptions} options
     * @param {Queue} queue
     * @return {Promise<Playlist>}
     */
    static playlist(search: Playlist | string, options: PlaylistOptions & {
        data?: any;
    }, queue: Queue): Promise<Playlist>;
    static spotifyPlayList(url: string, options: PlaylistOptions & {
        data?: any;
    }, queue: Queue): Promise<Playlist>;
    static youtubePlayList(url: string, options: PlaylistOptions & {
        data?: any;
    }, queue: Queue): Promise<Playlist>;
    static soundCloudPlayList(url: string, options: PlaylistOptions & {
        data?: any;
    }, queue: Queue): Promise<Playlist>;
    /**
     * Shuffles an array
     * @param {any[]} array
     * @returns {any[]}
     */
    static shuffle(array: any[]): any[];
    /**
     * Converts milliseconds to duration (HH:MM:SS)
     * @returns {string}
     */
    static msToTime(duration: number): string;
    /**
     * Converts duration (HH:MM:SS) to milliseconds
     * @returns {number}
     */
    static timeToMs(duration: string): number;
    static isVoiceChannel(Channel: GuildChannel): boolean;
    static isStageVoiceChannel(Channel: GuildChannel): boolean;
}
