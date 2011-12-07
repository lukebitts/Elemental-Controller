(function() {
  var B2DEntity, exports;
  exports = this;
  exports.B2DEntity = B2DEntity = (function() {
    function B2DEntity(args) {
      var a, body, bodyDef, body_type, fixtureDef, h, shape, w, x, y, _ref, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7;
      this.world = args.world;
      this.width = (_ref = args.width) != null ? _ref : 0;
      this.height = (_ref2 = args.height) != null ? _ref2 : 0;
      this.position = (_ref3 = args.position) != null ? _ref3 : [0, 0];
      body_type = (_ref4 = args.body_type) != null ? _ref4 : b2Body.b2_dynamicBody;
      this.velocity = (_ref5 = args.velocity) != null ? _ref5 : new b2Vec2(0, 0);
      this.rotation = (_ref6 = args.rotation) != null ? _ref6 : 0;
      this.body = null;
      x = this.position[0] / this.world.scale;
      y = this.position[1] / this.world.scale;
      a = Math.PI * (this.rotation / 180);
      w = this.width / this.world.scale;
      h = this.height / this.world.scale;
      bodyDef = new b2BodyDef();
      bodyDef.type = body_type;
      bodyDef.position.Set(x + w / 2, y + h / 2);
      bodyDef.linearDamping = (_ref7 = args != null ? args.linearDamping : void 0) != null ? _ref7 : 5;
      bodyDef.angle = a;
      body = this.world.CreateBody(bodyDef);
      shape = new b2PolygonShape.AsBox(w / 2, h / 2);
      fixtureDef = new b2FixtureDef();
      fixtureDef.restitution = 0.0;
      fixtureDef.density = 1.0;
      fixtureDef.friction = 0.0;
      fixtureDef.shape = shape;
      body.CreateFixture(fixtureDef);
      body.userData = {
        b2d_entity: this,
        crafty_entity: args.crafty_entity
      };
      this.body = body;
      this._contact_listeners = {};
    }
    B2DEntity.prototype._onContact = function(contacts) {
      var listener, name, _ref, _results;
      _ref = this._contact_listeners;
      _results = [];
      for (name in _ref) {
        listener = _ref[name];
        _results.push(listener(contacts));
      }
      return _results;
    };
    B2DEntity.prototype.contactListen = function(listener_name, listener) {
      return this._contact_listeners[listener_name] = listener;
    };
    B2DEntity.prototype.contactIgnore = function(listener_name) {
      return delete this._contact_listeners[listener_name];
    };
    return B2DEntity;
  })();
}).call(this);
