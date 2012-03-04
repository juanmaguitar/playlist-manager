(function($) {

	// Model
	var Playlist = null;
	// Collection
	var SetPlaylists = null;
	
	var playlists = null;

	// Views
	var PlaylistEditView = null;
	var PlaylistNewView = null;
	var SongDetailsView = null;
	var SongNewView = null;
	var PlaylistView = null;
	var LibraryView = null;

 	// Set our CLIENT ID so we can use SC calls without
 	// passing it at every call    
 	// See [SoundCloud Javascript SDK Authentication](http://developers.soundcloud.com/docs/javascript-sdk#authentication) 
 	
	SC.initialize({ client_id: "2c73737268dcb58ba837ab14ea99a31b" });

	  
    // Models & Collections
	// --------------------

    // ###Playlist
    // Model. Represents a Playlist that contains tracks
	Playlist = Backbone.Model.extend({

 		// We set these default values every time 
 		// a new playlist model is instanced
		defaults: function() {
			return {
				playing: false,
				title: '',
				description: '',
				tracks: []
			};
		},


 		// Plays all songs in a list
		playList: function() {

			var aTracks = this.get("tracks");
			var nNumTracks = aTracks.length;

			// Check that there are tracks to play
			if (nNumTracks) {

				// Set `this.listIndexPlaying` that is going to set if we  
				// should play some track when this one finish playing
				this.listIndexPlaying = 0;
				this.listNumTracks  = nNumTracks;

				// Bagin playing of the list
				this.playTrack(this.listIndexPlaying);
			}
			else {
				return false;
			}

		},

 		// Removes a track from a playlist
		removeTrack : function( nIndex ) {
	
			var aTracks = this.get("tracks");

			// If the track we're going to remove is being played
			// we stop it first of all
			if (aTracks[nIndex].playing) {
				window.soundObj.stop();
			}

			// Delete the track from the array & update the model
			aTracks.splice(nIndex, 1)
			this.set("tracks",aTracks);
			this.trigger("change");

		},

		// Set Actions to do after the track has finished playing   
		// either if we're playing as part of a list or as a single track
		onFinish: function(nIndexTrack) {

			var aTracks = this.get("tracks");
			var bLastTrack = true;

    		// if `this.listIndexPlaying` exists we're playing a list
    		// so if there's a next song in the list, play it
			if (typeof this.listIndexPlaying !== "undefined") {
				this.listIndexPlaying += 1;
				if (this.listIndexPlaying < this.listNumTracks) {
					this.playTrack(this.listIndexPlaying);
					bLastTrack = false;
				}
			}

    		// If this is the last track in the list or a single track 
    		// after finishing we mark this track as `playing = false`    
    		// and mark the list as stopped `delete this.listIndexPlaying`
			if (bLastTrack) {
				aTracks[nIndexTrack].playing = false;
				this.set("tracks",aTracks);
				this.trigger("change");
				delete this.listIndexPlaying;
			}
		},

		// Create the object to play with the proper params
		playSoundObject: function(sIdTrack, nIndexTrack) {

			var self = this;
			var oOptions = { 
				onfinish: function() { self.onFinish(nIndexTrack); }
			};

			window.soundObj = SC.stream(sIdTrack);
			window.soundObj.souncloudTrack = sIdTrack;
			window.soundObj.play(oOptions);

			this.trackPlaying = true;

		},

		// Stop the playing and clean the playing attribute in all tracks
		// For example: when we start the app  
		// return array with all tracks marked as `playing=false` 
		cleanPlaying: function(aTracks) {
    		
			if (window.soundObj) {
				if (!!window.soundObj.playState) {
					window.soundObj.stop();	
					this.trackPlaying = false;
				}
			}

			_.each(aTracks, function(track){ track.playing=false; });
			return aTracks;

    	},

		// Play the track (or pause it). Controls if we have changed the track
		// so we can set the proper states to the tracks in the list
    	playTrack : function(index) {

			var bIsSameSong = false;
			var bIsLoaded = (typeof(window.soundObj) !== 'undefined' );
			
			var sAction = '';
			var aTracks = this.get("tracks");
			var sIdTrack = aTracks[index].id;
			var self=this;

			this.trackPlaying = false;

			if ( !bIsLoaded ) {

				// Our first track to stream 
				// we must assure the SC object is ready to stream before doing anything
				this.trackPlaying = true;
				SC.whenStreamingReady(function(){
					self.playSoundObject(sIdTrack, index);
				});		

			}
			else {

				// There's some track being played
				this.trackPlaying = !window.soundObj.paused && !!window.soundObj.playState;

				// If this track being played is not part of any list
				if (!window.soundObj.souncloudTrack) {
					// first track of a list playing
					aTracks = this.cleanPlaying(aTracks);
					self.playSoundObject(sIdTrack, index);
				}

				// If is part of some list...    
				// are we trying some action to the same track?
				else if (window.soundObj.souncloudTrack === sIdTrack){
					
					// Set if we have to pause or play the track
					if (this.trackPlaying) {
						sAction = 'pause';
						this.trackPlaying = false;
					}
					else {
						sAction = 'play';
						this.trackPlaying = true;
					}
					
					window.soundObj[sAction]();
				}

				// Then... is a new track on some list     
				else {
					aTracks = this.cleanPlaying(aTracks);
					self.playSoundObject(sIdTrack, index);
				}

			}
			
			// Save the updated states of the tracks 
			aTracks[index].playing = this.trackPlaying;
			this.set("tracks",aTracks);
			// trigger `change`so the views can be updated	
			this.trigger("change");
		
    	} 
	});

	// ###SetPlaylists
    // Collection. Represents a collection of Playlists    
    // Base Collection. Connected with the API (in our case with localStorage).
	SetPlaylists = Backbone.Collection.extend ({

		model: Playlist,

		// Set the localStorage datastore
		localStorage: new Store("playlists")
				
	})

	// Create an instance of this collection
	playlists = new SetPlaylists;


    // Views
	// -----

	// We need to wait until the DOM is ready to define the views
	// (the templates are set in the DOM)
	$(document).ready(function() {

		// ###PlaylistEditView
		// View of the form to edit a Playlist
		PlaylistEditView = Backbone.View.extend ({

			// we're going to insert this view as a fieldset
			tagName: 'fieldset',
			// with className `edit_playlist`
			className: 'edit_playlist',
			// and using the template `pl_edit_tpl
			template: _.template( $('#pl_edit_tpl').html() ),

			// The DOM events for editing this playlist
			events: {
				"click .save" : "save",
				"click .cancel" : "cancel"
			},

			// Save the data to localStorage (New or Edit)
			save: function (eEvent) {

				var oData = {
					title: this.$("input[name='title']").val(),
					description: this.$("textarea[name='description']").val()
				};
				var bIsNew = this.model.isNew();
				
				if (!bIsNew) {
					this.model.save(oData);
				}
				else {
					this.collection.create(oData);	
					this.close();
				}

				eEvent.preventDefault();
			},

			// Close New Playlist Form so we must hide this form
			// and show the button `viewNew.render()`
			close: function () {
				this.options.viewNew.render();
			},

			// Cancel action so we must render the proper views
			cancel: function (eEvent) {

				var bIsNew = this.model.isNew();

				if (!bIsNew) {
					this.model.trigger("change");
				}
				else {
					this.close();
				}

				eEvent.preventDefault();
			},

			// render this view
			// we'll be able to access this HTML with `render().el`
			render: function() {
				var renderedContent = this.template( this.model.toJSON() );
				$(this.el).html(renderedContent);
				return this;	
			}
		
		});

		// ###PlaylistNewView
		// View of the part where we can create a new playlist
		// `Create a New PLayList` button
		PlaylistNewView = Backbone.View.extend ({

			el: $("#new_playlist"),
			template: _.template( $('#pl_new_tpl').html() ),
			
			// The DOM events specific to an item.
			events: {
				"click #create_playlist" : "create"
			},

			initialize: function() {
				this.render();
			},

		    // Show New Playlist Form `PlaylistEditView`
		    // creating a new model in the way
			create: function (eEvent) {

				var view = new PlaylistEditView({ 	
					model: new Playlist(),
					collection: this.collection,
					viewNew : this,
				});

				$(this.el).html( view.render().el );
				eEvent.preventDefault();
			},
			
			// We don need any data to render this view 
			render: function() {
				$(this.el).html( this.template() );
				return this;	
			}
		
		});


		// ###SongDetailsView
		// View of the details of the track found on Soundcloud
		// We use the JSON that we received from the API wit the data of the track   
		// (so we could show here all this info just modifying the template)
		SongDetailsView = Backbone.View.extend ({

			className: 'details_song',
			template: _.template( $('#pl_songDetails_tpl').html() ),
			events: {
				"click a.play" : "playPreview"
			},
			initialize: function(){

				var sTrackId = this.options.data.id;

				// stop sound if something is being played
				SC.whenStreamingReady(function(){
					if (window.soundObj) {
						window.soundObj.stop();
					}
					window.soundObj = SC.stream(sTrackId);
				});

			},

			// Play/pause the track found (preview)
			playPreview: function(eEvent) {
				
				var bPlaying = !window.soundObj.paused && !!window.soundObj.playState ;
				var sAction = bPlaying ? 'pause' : 'play';

				$(eEvent.target).toggleClass("playing", !bPlaying);
				window.soundObj[sAction]();
		    	
				eEvent.preventDefault();
			},		    

			// Render this View (we just need the data received from the API)
			render: function() {
				var oDetailsSong = this.options.data;
				$(this.el).html( this.template( oDetailsSong ) );
				return this;	
			}
		
		});

		// ###SongNewView
		// View of the Form to add a track
		// We can check the URL in SoundCloud, get the track-data and add it to the playlist
		SongNewView = Backbone.View.extend ({

			className: "add_track",
			template: _.template( $('#pl_newTrack_tpl').html() ),
			
			// The DOM events of this view
			events: {
				"click .details a" : "getDetailsSong",
				"click .add a" : "addSong",
				"click a.see_form" : "show",
			},

			// Show the Form
			show: function(eEvent) {
				$(this.el).toggleClass("adding");
				eEvent.preventDefault();
			},

		    
			// Show details of the track found through the API
			// using view `SongDetailsView`
			showTrackDetails : function ( oTrack ) {

				var viewSongDetails = new SongDetailsView({ data: oTrack });
				
				this.$('p.details').hide();
				this.$('p.add').show().before( viewSongDetails.render().el );
				this.songDetails = oTrack;

			},

			// Find track-ID in the tracks found
			findTrackInResults: function( sIdSong, oTracks ){

				var oTrackFound = null;
				_.bind( this.showTrackDetails, this ) 

				$.each(oTracks, function(index, track) {
					if ( track.permalink === sIdSong ) {
						oTrackFound = track;
					}
				})

				if (oTrackFound) {
					this.showTrackDetails (oTrackFound);
				}
				else {
					/* console.log ("we found nothing"); */
				}
				
			},


    		// If we can "decipher" the URL, call the API to check
    		// if this URL corresponds to an existing track
			getDetailsSong: function(eEvent) {

				var sUrlSong = this.$('input').val();
				var aParts = sUrlSong.split("/");

				var sUser = aParts[aParts.length-2]
				var sIdSong = aParts[aParts.length-1]

				if (sUser && sIdSong ) {
					SC.get("/users/"+sUser+"/tracks.json", _.bind( this.findTrackInResults, this, sIdSong ) );
				}
				else {
					/* console.log ("we found nothing"); */
				}

				eEvent.preventDefault();
				
			},

    		// Add current track to the playlist 
			addSong: function(eEvent) {

				var aTracks = this.model.get("tracks");
				var oTrack = {
					id: this.songDetails.id,
					title: this.songDetails.title,
					user: this.songDetails.user.username,
					url: this.songDetails.permalink_url
				};
				aTracks.push(oTrack);

				this.model.set("tracks",aTracks);
				this.model.save();
				this.model.trigger("change");

				window.soundObj.stop();
					
				eEvent.preventDefault();
			},

			render: function() {
				$(this.el).html( this.template( this.model.toJSON() ) );
				return this;	
			}
		
		});

		// ###PlaylistView
		// View of the PlayList with the list of tracks
		PlaylistView = Backbone.View.extend ({

			className: 'pl_container',
			template: _.template( $('#pl_listItem_tpl').html() ),

			// The DOM events specific to an item.
			events: {
				"click .edit" : "edit",
				"click .delete" : "deletePlaylist",
				"click .track" : "play",
				"click .remove" : "removeSong",
				"click .play_list" : "playList"
			 },

			initialize: function() {

				// begin from scratch
				var aTracks = this.model.get("tracks");
				aTracks = this.model.cleanPlaying(aTracks);
				this.model.set("tracks",aTracks);

				this.input = this.$('.edit input');
				this.model.bind('change', this.render, this);
				this.model.bind('destroy', this.remove, this);
				
			},

			// play the whole list
			playList : function (eEvent) {

				this.model.playList();
				eEvent.preventDefault();	

			},

			// removes this song from the playlist
			removeSong : function(eEvent) {
				
				var oLink = $(eEvent.target).parent().find(".track")[0];
				var nIndex = (oLink.id).split("#")[0];
				
				var bConfirmed = confirm("Are you sure you want to delete the track " + $(oLink).text() + " from this playlist");
				if (bConfirmed) {
					this.model.removeTrack (nIndex);
				}
				eEvent.preventDefault();	
			},

			// play only this song
			play: function(eEvent) {
		
				var oLink = $(eEvent.target).closest("a")[0];
				var sIndexTrack = oLink.id.split("#")[0];

				delete this.model.listIndexPlaying;
				this.model.playTrack(sIndexTrack);
				eEvent.preventDefault();
				
			},

			// delete this playlist
			deletePlaylist: function (eEvent) {

				var sTitle = this.model.get("title");
				var bConfirmed = confirm("Are you sure you want to delete playlist " + sTitle);

				if (bConfirmed) {
					this.model.destroy();
				}

				eEvent.preventDefault();
			},
			
			// show edit form of this playlist with view `PlaylistEditView`
			edit: function (eEvent) {

				var view = new PlaylistEditView({ model: this.model });
				this.$('.title').hide().after( view.render().el );
				
				eEvent.preventDefault();
			},
			
			render: function() {
				
				var renderedContent = this.template( this.model.toJSON() );
				var viewSongNew = new SongNewView({
					model: this.model
				});

				$(this.el).html(renderedContent);
				$(this.el).append( viewSongNew.render().el );

				return this;	
			}
		
		});

		// ###LibraryView
		// MAIN view. List of all playlists 
		LibraryView = Backbone.View.extend ({

 			el: $("#list_playlists"),

			initialize: function() {

				console.log ("updated");

				// Create the view to add new playlists
				var viewNew = new PlaylistNewView({
					collection: this.collection
				});

				_.bindAll(this, 'showOne', 'showAll');

				this.collection.bind('add', this.showOne);
				this.collection.bind('reset', this.showAll);
				
				// Get the data from localStorage
				this.collection.fetch();

			},
			
			// Show a Playlist
			showOne: function( playlist ) {
				var view = new PlaylistView({ model: playlist });
				$(this.el).append( view.render().el );
			},
			
			// Show all Playlists 
			showAll: function() {
				this.collection.each(this.showOne);
			},

			render: function() {

				var renderedContent = this.template( this.model.toJSON() );
				$(this.el).html(renderedContent);
				
				return this;	
			}
		
		});
		
		// Instance or MAIN view at window.PlaylistsManagerApp
		window.PlaylistsManagerApp = new LibraryView({
			collection: playlists
		});

	});


})(jQuery);