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
		window.PlaylistView = Backbone.View.extend ({

			className: 'pl_container',
			template: _.template( $('#pl_listItem_tpl').html() ),

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