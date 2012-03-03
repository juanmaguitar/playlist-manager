var SetPlaylistsData = [{
    "title":  "Playlist A",
    "description":  "Description A",
    "tracks": [
        {
            "title": "2 de corazones - intro",
            "user": "juanmaguitar",
            "url": "http://soundcloud.com/juanmaguitar/sounds-from-thursday-evening"
        },
        {
            "title": "Beautiful Girls + Stand By Me",
            "user": "covertura",
            "url": "http://soundcloud.com/covertura/beautiful-girls-stand-by-me"
        }]
}, {
    "title":  "Playlist B",
    "description":  "Description B",
    "tracks": [
        {
            "title": "Moondance (Jazzy style)",
            "user": "covertura",
            "url": "http://soundcloud.com/covertura/moondance-jazzy-style"
        },
        {
            "title": "Gimme Satisfaction",
            "user": "juanmaguitar",
            "url": "http://soundcloud.com/juanmaguitar/gimme-satisfaction"
        }]
}];


describe("PlayList", function () {

    beforeEach(function () {
        this.playlist = new Playlist (SetPlaylistsData[0]);
    });

    it("creates from data", function () {
        expect(this.playlist.get('tracks').length).toEqual(2);
    });

    describe("track url at index", function () {

        it("returns URL for existing track", function () {
            expect(this.playlist.trackUrlAtIndex(0))
                .toEqual('http://soundcloud.com/juanmaguitar/sounds-from-thursday-evening');
        });

        it("returns null for non-existing track", function () {
            expect(this.playlist.trackUrlAtIndex(5)).toBe(null);
        });

    });

});
