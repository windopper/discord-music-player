"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DMPError = exports.DMPErrorMessages = exports.DMPErrors = void 0;
class DMPError extends Error {
    /**
     * DMPError constructor
     * @param {DMPErrors} code
     */
    constructor(code = DMPErrors.UNKNOWN) {
        super();
        /**
         * DMPError short name (code)
         * @name DMPError#name
         * @type {string}
         */
        /**
         * DMPError long message
         * @name DMPError#message
         * @type {string}
         */
        this.name = code;
        this.message = exports.DMPErrorMessages[code] ?? exports.DMPErrorMessages[DMPErrors.UNKNOWN];
    }
    /**
     * DMPError in JSON representation
     * @returns {{message: string, code: string}}
     */
    toJSON() {
        return { message: this.message, code: this.name };
    }
    /**
     * DMPError in string representation
     * @returns {string}
     */
    toString() {
        return this.message;
    }
}
exports.DMPError = DMPError;
/**
 * The DMPErrors short messages.
 * Following modes exists:
 * - UNKNOWN = 'Unknown',
 * - QUEUE_DESTROYED = 'QueueDestroyed',
 * - NOTHING_PLAYING = 'NothingPlaying',
 * - UNKNOWN_VOICE = 'UnknownVoice',
 * - CHANNEL_TYPE_INVALID = 'ChannelTypeInvalid',
 * - VOICE_CONNECTION_ERROR = 'VoiceConnectionError',
 * - NO_VOICE_CONNECTION = 'NoVoiceConnection',
 * - UNKNOWN_REPEAT_MODE = 'UnknownRepeatMode',
 * - RESOURCE_NOT_READY = 'ResourceNotReady',
 * - INVALID_GUILD = 'InvalidGuild'
 * - INVALID_GUILD = 'InvalidGuild',
 * - SEARCH_NULL = 'SearchIsNull',
 * - INVALID_PLAYLIST = 'InvalidPlaylist',
 * - INVALID_SPOTIFY = 'InvalidSpotify'
 * - UNKNOWN_SONG = 'UnknownSong'
 * - INVALID_INDEX = 'InvalidIndex'
 * @typedef {string} DMPErrors
 */
var DMPErrors;
(function (DMPErrors) {
    DMPErrors["UNKNOWN"] = "Unknown";
    DMPErrors["QUEUE_DESTROYED"] = "QueueDestroyed";
    DMPErrors["NOTHING_PLAYING"] = "NothingPlaying";
    DMPErrors["UNKNOWN_VOICE"] = "UnknownVoice";
    DMPErrors["CHANNEL_TYPE_INVALID"] = "ChannelTypeInvalid";
    DMPErrors["VOICE_CONNECTION_ERROR"] = "VoiceConnectionError";
    DMPErrors["NO_VOICE_CONNECTION"] = "NoVoiceConnection";
    DMPErrors["UNKNOWN_REPEAT_MODE"] = "UnknownRepeatMode";
    DMPErrors["RESOURCE_NOT_READY"] = "ResourceNotReady";
    DMPErrors["INVALID_GUILD"] = "InvalidGuild";
    DMPErrors["SEARCH_NULL"] = "SearchIsNull";
    DMPErrors["INVALID_PLAYLIST"] = "InvalidPlaylist";
    DMPErrors["INVALID_SPOTIFY"] = "InvalidSpotify";
    DMPErrors["INVALID_SOUNDCLOUD"] = "InvalidSoundcloud";
    DMPErrors["INVALID_YOUTUBE"] = "InvalidYoutube";
    DMPErrors["UNKNOWN_SONG"] = "UnknownSong";
    DMPErrors["INVALID_INDEX"] = "InvalidIndex";
})(DMPErrors || (exports.DMPErrors = DMPErrors = {}));
/**
 * The DMPErrors short messages.
 * Following modes exists:
 * - Unknown: `There was an Unknown Error.`,
 * - QueueDestroyed: `The Queue was destroyed.`,
 * - NothingPlaying: `There is currently no Song playing in the Voice Channel.`,
 * - UnknownVoice: `The provided Member is not in a Voice Channel.`,
 * - ChannelTypeInvalid: `The provided Channel is not a Voice Channel.`,
 * - VoiceConnectionError: `There was an Error while starting the Voice Stream`,
 * - NoVoiceConnection: `There is no Queue#connection [you should use Queue#join()] first.`,
 * - UnknownRepeatMode: `The provided RepeatMode was not valid.`,
 * - ResourceNotReady: `The AudioResource was not ready.`,
 * - InvalidGuild: `The provided Guild was invalid.`,
 * - SearchIsNull: `The was no YouTube song found by that query.`,
 * - InvalidSpotify: `The was no Spotify song found with that link.`,
 * - InvalidPlaylist: `There was no Playlist found with that link.`
 * - UnknownSong: `There was no Song found with that link.`
 * - InvalidIndex: `The provided index was not valid.`
 * @typedef {DMPErrorMessages}
 */
exports.DMPErrorMessages = {
    Unknown: 'There was an Unknown Error.',
    QueueDestroyed: 'The Queue was destroyed.',
    NothingPlaying: 'There is currently no Song playing in the Voice Channel.',
    UnknownVoice: 'The provided Member is not in a Voice Channel.',
    ChannelTypeInvalid: 'The provided Channel is not a Voice Channel.',
    VoiceConnectionError: 'There was an Error while starting the Voice Stream',
    NoVoiceConnection: 'There is no Queue#connection [you should use Queue#join()] first.',
    UnknownRepeatMode: 'The provided RepeatMode was not valid.',
    ResourceNotReady: 'The AudioResource was not ready.',
    InvalidGuild: 'The provided Guild was invalid.',
    SearchIsNull: 'The was no YouTube song found by that query.',
    InvalidSpotify: 'The was no Spotify song found with that link.',
    InvalidPlaylist: 'There was no Playlist found with that link.',
    InvalidApple: 'There was no Apple music song with that link',
    UnknownSong: 'There is no song found by that index.',
    InvalidIndex: 'The provided index was not valid.'
};
