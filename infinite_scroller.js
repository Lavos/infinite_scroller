(function(){
	var InfiniteScroller = function InfiniteScroller (params) {
		var self = this;

		var defaults = {
			scroll_element: $(window),
			element: $(),
			target: $(),
			item_template_string: '',
			pages_ahead: 1,
			enabled: true,
			offset: 0,
			total: 0,
			render_count: 7
		};

		_.defaults(self.options = {}, params, defaults);

		// required for being array-like
		self.length = 0;

		// cache management
		self.cache = [];
		self.offset = self.options.offset;

		self.$element = self.options.element;
		self.element = self.$element[0];
		self.$target = self.options.target;
		self.target = self.$target[0];
		self.stage = document.createElement('div');

		self.$element.addClass('infscr');

		self.scrollability = true;
		self.exhausted = false;
		self.enabled = false;
		self.position_offset = self.$element.position().top;
		self.item_template = __.template(self.options.item_template_string);

		// events

		self.options.scroll_element.on('scroll', function(e){
			if (self.enabled) {
				self.checkHeight();
			};
		});

		LUCID.ResponsiveWatcher.on('phone tablet full', function(e){
			if (self.enabled) {
				self.checkHeight();
				self.scrollability = true;
			};
		});

		if (self.options.enabled) {
			self.setEnabled(true);
		};

		if (self.options.offset >= self.options.total) {
			self.setExhausted(true);
		};
	};

	__.augment(InfiniteScroller, __.PubSubPattern);

	InfiniteScroller.prototype.splice = function splice (start_index, items_to_remove) {
		var self = this;

		var args = _.toArray(arguments);

		var removed_items = Array.prototype.splice.apply(self, arguments);
		var add_items = args.slice(2);

		self.fire('splice', arguments);

		if (removed_items.length) {
			var counter = removed_items.length;
			while (counter--) {
				self.target.removeChild(removed_items[counter]);
			};
		};

		if (add_items.length) {
			var frag = document.createDocumentFragment();
			var counter = 0, limit = add_items.length;
			while (counter < limit) {
				frag.appendChild(add_items[counter]);
				counter++;
			};

			self.target.appendChild(frag);
		};

		self.checkHeight();
		return removed_items;
	};

	InfiniteScroller.prototype.concat = function concat (arr) {
		var self = this;

		self.splice.apply(self, [self.length, 0].concat(arr));
		self.fire('concat', arr);
	};

	InfiniteScroller.prototype.push = function push (item) {
		var self = this;

		self.splice.apply(self, [self.length, 0].concat(item));
		self.fire('push', item);
	};

	InfiniteScroller.prototype.setEnabled = function setEnabled (enabled) {
		var self = this;

		self.enabled = enabled;
		self.fire('enabled_change', self.enabled);
		self.$element[self.enabled ? 'addClass' : 'removeClass']('infscr_enabled');
	};

	InfiniteScroller.prototype.setExhausted = function setExhausted (exhausted) {
		var self = this;

		self.exhausted = exhausted;
		self.fire('exhausted_change', self.exhausted);
		self.$element[self.exhausted ? 'addClass' : 'removeClass']('infscr_exhausted');
	};

	InfiniteScroller.prototype.checkHeight = function checkHeight () {
		var self = this;

		if (self.enabled && self.scrollability) {
			var scroll_point = self.options.scroll_element.scrollTop() + self.options.scroll_element.height();
			var remaining_height = self.$element.outerHeight() - self.position_offset - scroll_point;

			if (remaining_height < self.options.scroll_element.height() * self.options.pages_ahead) {
				self.renderFromCache();
			};
		};
	};

	InfiniteScroller.prototype.checkCache = function checkCache () {
		var self = this;

		if (self.cache.length < self.options.render_count * self.options.pages_ahead && !self.exhausted) {
			self.scrollability = false;
			self.fire('request_items', self.offset);
		};
	};

	InfiniteScroller.prototype.renderFromCache = function renderFromCache () {
		var self = this;

		self.render(self.cache.splice(0, self.options.render_count));
		self.checkCache();
	};

	InfiniteScroller.prototype.updateCache = function updateCache (items) {
		var self = this;

		if (items.length === 0) {
			self.setExhausted(true);
		};

		self.scrollability = true;
		self.cache = self.cache.concat(items);
		self.offset += items.length;
		self.checkHeight();
	};

	InfiniteScroller.prototype.render = function render (arr) {
		var self = this;

		var elements = [];
		var counter = 0, limit = arr.length;
		while (counter < limit) {
			self.stage.innerHTML = self.item_template(arr[counter], { __: __ }).replace(/^[\s\n\r]+/g, '');
			elements.push(self.stage.firstChild);
			counter++;
		};

		if (elements.length) {
			self.concat(elements);
			self.fire('render', elements);
		};
	};

	this.provide('Constructors.InfiniteScroller', InfiniteScroller);
}).call(this['LUCID'] = this['LUCID'] || new __.ModularNamespace());
