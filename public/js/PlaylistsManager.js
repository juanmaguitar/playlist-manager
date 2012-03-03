(function($) {

    // Models & Collections
	// --------------------

    // ###Playlist
    // Model. Represents an Playlist that contains tracks
	window.Playlist = Backbone.Model.extend({
 		defaults: function() {
      		return {
      			//id: playlists.nextId(),
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
			template: _.template( $('#playlist-edit-template').html() ),

			// The DOM events specific to an item.
		    events: {
		      "click .save" : "save",
		      "click .cancel" : "cancel"
		     },

			save: function (eEvent) {

				var sTitle = this.$("input[name='title']").val();
				var sDesc = this.$("textarea[name='description']").val();
				var bIsNew = this.model.isNew();
				
				
				if (!bIsNew) {
	      			this.model.save({ 
	      				title: sTitle,
	      				description: sDesc
	      			});
	      		}
	      		else {
	      			this.collection.create({ 
	      				title: sTitle,
	      				description: sDesc
	      			});	
	      		}
      			this.close();
      			eEvent.preventDefault();
			},

			close: function () {
				var view = new PlaylistNewView({
					collection: this.collection
				});
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
			template: _.template( $('#playlist-new-template').html() ),
			
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
					collection: this.collection
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
		window.PlaylistView = Backbone.View.extend ({

			className: 'playlist-container',
			template: _.template( $('#playlist-list-item-template').html() ),

			// The DOM events specific to an item.
		    events: {
		      "click .edit" : "edit"
		     },

			initialize: function() {
				this.input = this.$('.edit input');
				this.model.bind('change', this.render, this);
			},

			edit: function (eEvent) {

				var view = new PlaylistEditView({ model: this.model });
				this.$('.title').hide().after( view.render().el );
				
				eEvent.preventDefault();
			},
			
			render: function() {
				var renderedContent = this.template( this.model.toJSON() );
				$(this.el).html(renderedContent);
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