(function($) {


	SC.initialize({
    	client_id: "2c73737268dcb58ba837ab14ea99a31b"
    });

    // Models & Collections
	// --------------------

    // ###Playlist
    // Model. Represents an Playlist that contains tracks
	window.Playlist = Backbone.Model.extend({
 		defaults: function() {
      		return {
      			title: '',
      			description: '',
      			tracks: []
      		};
    	},
	});

	// ###SetPlaylists
    // Collection. Represents a collection of Playlists    
    // Base Collection. Connected with the API.
	window.SetPlaylists = Backbone.Collection.extend ({

		model: Playlist,

		// Set the localStorage datastore
		localStorage: new Store("playlists")
				
	})

	window.playlists = new SetPlaylists;

	$(document).ready(function() {

		// View of a Playlist
		window.PlaylistEditView = Backbone.View.extend ({

			tagName: 'fieldset',
			className: 'edit_playlist',
			template: _.template( $('#pl_edit_tpl').html() ),

			// The DOM events specific to an item.
		    events: {
		      "click .save" : "save",
		      "click .cancel" : "cancel"
		     },

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

			close: function () {
				
  				this.options.viewNew.render();
			},

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
			
			render: function() {
				var renderedContent = this.template( this.model.toJSON() );
				$(this.el).html(renderedContent);
				return this;	
			}
		
		});

		// View of a Playlist
		window.PlaylistNewView = Backbone.View.extend ({

			el: $("#new_playlist"),
			template: _.template( $('#pl_new_tpl').html() ),
			
			// The DOM events specific to an item.
		    events: {
		      "click #create_playlist" : "create"
		     },

		     initialize: function() {
		     	this.render();
		     },

			create: function (eEvent) {

				var view = new PlaylistEditView({ 
					model: new Playlist(),
					collection: this.collection,
					viewNew : this,
				});

				$(this.el).html( view.render().el );
				eEvent.preventDefault();
			},

			cancel: function (eEvent) {
				var viewNew = new PlaylistNewView();
				eEvent.preventDefault();
			},
			
			render: function() {
				$(this.el).html( this.template() );
				return this;	
			}
		
		});


		// View of a Playlist
		window.SongDetailsView = Backbone.View.extend ({

			className: 'details_song',
			template: _.template( $('#pl_songDetails_tpl').html() ),
			render: function() {

				var oDetailsSong = this.options.data;
				$(this.el).html( this.template( oDetailsSong ) );
				return this;	
			}
		
		});

		// View of a Playlist
		window.SongNewView = Backbone.View.extend ({

			className: "add_track",
			template: _.template( $('#pl_newTrack_tpl').html() ),
			
			// The DOM events specific to an item.
		    events: {
		      "click .details a" : "getDetailsSong",
		      "click .add a" : "addSong",
		      "click a.see_form" : "show"
		     },

		    initialize: function() {
		     	this.render();
		    },

		    show: function(eEvent) {
		    	$(this.el).toggleClass("adding");
		    	eEvent.preventDefault();
		    },

			getDetailsSong: function(eEvent) {

				var sUrlSong = this.$('input').val();
				var aParts = sUrlSong.split("/");

				var sUser = aParts[aParts.length-2]
				var sIdSong = aParts[aParts.length-1]
				var self = this;

				console.log ("vamos a añadir: " + sIdSong + " de " + sUser + " to " + this.model.get("title"));
				eEvent.preventDefault();

				if (sUser && sIdSong ) {

	        		SC.get("/users/"+sUser+"/tracks.json", function( oTracks ){

	        			var oTrackFound = null;

	        			$.each(oTracks, function(index, track) {
	        				if ( track.permalink === sIdSong ) {
	        					oTrackFound = track;
	        				}
	        			})
	        			
	        			if (oTrackFound) {
			        		var viewSongDetails = new SongDetailsView({ data: oTrackFound });
				        	self.$('p.details').hide();
							self.$('p.add').show().before( viewSongDetails.render().el );
							self.songDetails = oTrackFound;
						}
						else {
							console.log ("we found nothing");
						}
						
					});
				}
				else {
					console.log ("we found nothing");
				}           
				
			},

			addSong: function() {

				var aTracks = this.model.get("tracks");
				var oTrack = {
					title: this.songDetails.title,
					user: this.songDetails.user.username,
					url: this.songDetails.permalink_url
				};
				aTracks.push(oTrack);

				this.model.set("tracks",aTracks);
				this.model.save();
				this.model.trigger("change");
				

			},

			render: function() {
				$(this.el).html( this.template( this.model.toJSON() ) );
				return this;	
			}
		
		});

		// View of a Playlist
		window.PlaylistView = Backbone.View.extend ({

			className: 'pl_container',
			template: _.template( $('#pl_listItem_tpl').html() ),

			// The DOM events specific to an item.
		    events: {
		      "click .edit" : "edit",
		      "click .delete" : "deletePlaylist"

		     },

			initialize: function() {

				this.input = this.$('.edit input');
				this.model.bind('change', this.render, this);
				this.model.bind('destroy', this.remove, this);
				
			},

			deletePlaylist: function (eEvent) {

				var sTitle = this.model.get("title");
				var bConfirmed = confirm("Are you sure you want to delete playlist " + sTitle);

				if (bConfirmed) {
					this.model.destroy();
				}

				eEvent.preventDefault();
			},
			
			edit: function (eEvent) {

				var view = new PlaylistEditView({ model: this.model });
				this.$('.title').hide().after( view.render().el );
				
				eEvent.preventDefault();
			},
			
			render: function() {
				console.log ("algo ha cambiado en el modelo");
				var renderedContent = this.template( this.model.toJSON() );

				// TO-DO.: check a better place for this
				var viewSongNew = new SongNewView({
					model: this.model
				});

				$(this.el).html(renderedContent);
				$(this.el).append( viewSongNew.render().el );


				return this;	
			}
		
		});

		// View of the list of Playlists
		window.LibraryView = Backbone.View.extend ({

 			el: $("#list_playlists"),

			initialize: function() {

				var viewNew = new PlaylistNewView({
					collection: this.collection
				});

				_.bindAll(this, 'addOne', 'addAll');

				this.collection.bind('add', this.addOne);
				this.collection.bind('reset', this.addAll);
				
				this.collection.fetch();

			},
			

			addOne: function( playlist ) {
				
				var view = new PlaylistView({ model: playlist });
			    $(this.el).append( view.render().el );
			},
			
			// Add all items in the Todos collection at once.

			addAll: function() {

				this.collection.each(this.addOne);
			},

			render: function() {
				var renderedContent = this.template( this.model.toJSON() );
				$(this.el).html(renderedContent);
				return this;	
			}
		
		});
		
		window.App = new LibraryView({
			collection: playlists
		});

	});


})(jQuery);