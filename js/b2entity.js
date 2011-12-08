(function(){
	var B2DEntity, exports;
	exports = this;
	exports.B2DEntity = B2DEntity = (function(){
		function B2DEntity(args){
			var body;
			//args can be either instructions for a basic shape or the actual shape
			if(typeof(args) == "object"){
				
				if(!args.world) throw "Missing parameter WORLD";
				this.world = args.world;
				
				//we create the body:
				var bodyDef = new b2BodyDef;
				bodyDef.type = args.body_type;
				bodyDef.position.Set(args.position.x/this.world.drawScale,args.position.y/this.world.drawScale);
				bodyDef.angle = args.angle != undefined ? args.angle : 0;
				bodyDef.fixedRotation = args.fixedRotation != undefined? args.fixedRotation : false;
				bodyDef.bullet = args.bullet != undefined ? args.bullet : false;
				var body = this.world.CreateBody(bodyDef)
				
				if(!args.objects) throw "Missing parameter OBJECTS";
				for(i in args.objects){
					obj_args = args.objects[i];
					var fixDef = new b2FixtureDef;
					fixDef.density = obj_args.density != undefined ? obj_args.density : 1.0;
					fixDef.friction = obj_args.friction != undefined ? obj_args.friction : 0.5;
					fixDef.restitution = obj_args.restitution != undefined ? obj_args.restitution : 0.2;
						
					if(obj_args.type && obj_args.type != "box"){
						if(obj_args.type == "circle"){
							var r = obj_args.radius/this.world.drawScale/2;
							fixDef.shape = new b2CircleShape(r);
							var offX = obj_args.offX/this.world.drawScale || r;
							var offY = obj_args.offY/this.world.drawScale || r;
							fixDef.shape.SetLocalPosition(new b2Vec2(offX,offY))
						}
						if(obj_args.type == "polygon"){
							var vertexCount = obj_args.polys.length;
							fixDef.shape = new b2PolygonShape;
							var vertex = [];
							var offX = obj_args.offX/this.world.drawScale || 0;
							var offY = obj_args.offY/this.world.drawScale || 0;
							for(j in obj_args.polys){
								var poly = obj_args.polys[j];
								vertex.push(new b2Vec2( poly[0]/this.world.drawScale+offX,poly[1]/this.world.drawScale+offY ));
							}
							fixDef.shape.SetAsVector(vertex,vertexCount);
						}
					}
					else{
						fixDef.shape = new b2PolygonShape;
						var w = obj_args.w/this.world.drawScale/2;
						var h = obj_args.h/this.world.drawScale/2;
						var offX = obj_args.offX/this.world.drawScale || w;
						var offY = obj_args.offY/this.world.drawScale || h;
						fixDef.shape.SetAsOrientedBox(w, h,new b2Vec2(offX,offY),0.0);
					}
					body.CreateFixture(fixDef);
				}				
			}
			else{
				body = args;
			}
			body.userData = {
				b2d_entity:this,
				crafty_entity:args.crafty_entity
			};
			this.body = body;
			this._contact_listeners = {};
			this._contactEnd_listeners = {};
		}
		B2DEntity.prototype._onContact = function(contacts){
			var listener, name, _ref, _results;
			_ref = this._contact_listeners;
			_results = [];
			for(name in _ref){
				listener = _ref[name];
				_results.push(listener.trigger("Contact",contacts));
			}
			return _results;
		}
		B2DEntity.prototype._onContactEnd = function(contacts){
			var listener, name, _ref, _results;
			_ref = this._contactEnd_listeners;
			_results = [];
			for(name in _ref){
				listener = _ref[name];
				_results.push(listener.trigger("ContactEnd",contacts));
			}
			return _results;
		}
		B2DEntity.prototype.contactListen = function(listener_name,instance){
			this._contact_listeners[listener_name] = instance;
		}
		B2DEntity.prototype.contactEndListen = function(listener_name,instance){
			this._contactEnd_listeners[listener_name] = instance;
		}
		B2DEntity.prototype.contactIgnore = function(listener_name) {
			delete this._contact_listeners[listener_name];
		}
		return B2DEntity;
	})();
}).call(this);
