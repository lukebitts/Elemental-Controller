//http://www.box2dflash.org/docs/2.1a/reference/

function createStaticBox(world,x,y,w,h,density,friction,restitution,rotation){
	density = density==undefined?1.0:density;
	friction = friction==undefined?0.5:friction;
	restitution = restitution==undefined?0.2:restitution;
	rotation = rotation || 0;
	
	var fixDef = new b2FixtureDef;
	fixDef.density = density;
	fixDef.friction = friction;
	fixDef.restitution = restitution;
	var bodyDef = new b2BodyDef;
	
	bodyDef.type = b2Body.b2_staticBody;
	fixDef.shape = new b2PolygonShape;
	fixDef.shape.SetAsBox(pTOm(w/2), pTOm(h/2));
	bodyDef.position.Set(pTOm(x),pTOm(y));
	bodyDef.angle = rotation;
	
	var r = world.CreateBody(bodyDef);
	r.CreateFixture(fixDef);
	return r;
}

function createDynamicBox(){
	
}

function createStaticCircle(){
	
}

function createDynamicCircle(world,x,y,r,density,friction,restitution){
	density = density==undefined?1.0:density;
	friction = friction==undefined?0.5:friction;
	restitution = restitution==undefined?0.2:restitution;
		
	var fixDef = new b2FixtureDef;
	fixDef.density = density;
	fixDef.friction = friction;
	fixDef.restitution = restitution;
	var bodyDef = new b2BodyDef;
		
	bodyDef.type = b2Body.b2_dynamicBody;
	fixDef.shape = new b2CircleShape(pTOm(r/2));
	bodyDef.position.x = pTOm(x);
	bodyDef.position.y = pTOm(y);
	bodyDef.fixedRotation = true;
	    
	var r = world.CreateBody(bodyDef);
	r.CreateFixture(fixDef);
	return r;
}