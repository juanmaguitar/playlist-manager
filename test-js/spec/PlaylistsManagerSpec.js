var SetPlaylistsData = [{
        "playing": false,
        "title": "My Super Lists",
        "description": "Esta si que si que parece que es la buena ya",
        "tracks": [
            {
                "id": 22742579,
                "title": "Gimme Satisfaction",
                "user": "juanmaguitar",
                "url": "http://soundcloud.com/juanmaguitar/gimme-satisfaction",
                "playing": false
            },
            {
                "id": 22744919,
                "title": "Fade to Black (Intro)",
                "user": "juanmaguitar",
                "url": "http://soundcloud.com/juanmaguitar/fade-to-black",
                "playing": false
            },
            {
                "id": 37909688,
                "title": "session",
                "user": "losportales",
                "url": "http://soundcloud.com/losportales/session",
                "playing": false
            },
            {
                "id": 28962308,
                "title": "Moondance (Jazzy style)",
                "user": "covertura",
                "url": "http://soundcloud.com/covertura/moondance-jazzy-style",
                "playing": false
            },
            {
                "id": 26348958,
                "title": "Ira, tristeza, duda",
                "user": "icebend",
                "url": "http://soundcloud.com/icebend/ira-tristeza-duda",
                "playing": false
            },
            {
                "id": 10485463,
                "title": "02 Kickstart My Hopes",
                "user": "Eric Fuentes",
                "url": "http://soundcloud.com/info-1095/02-kickstart-my-hopes",
                "playing": false
            }
        ],
        "id": "69d73a2b-cd6e-2bfc-923d-0a3ef4e4de2d"
    }
];


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
