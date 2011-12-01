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

function createDynamicBox(world,x,y,w,h,density,friction,restitution,rotation){
	density = density==undefined?1.0:density;
	friction = friction==undefined?0.5:friction;
	restitution = restitution==undefined?0.2:restitution;
	rotation = rotation || 0;
	
	var fixDef = new b2FixtureDef;
	fixDef.density = density;
	fixDef.friction = friction;
	fixDef.restitution = restitution;
	var bodyDef = new b2BodyDef;
	
	bodyDef.type = b2Body.b2_dynamicBody;
	fixDef.shape = new b2PolygonShape;
	fixDef.shape.SetAsBox(pTOm(w/2), pTOm(h/2));
	bodyDef.position.Set(pTOm(x),pTOm(y));
	bodyDef.angle = rotation;
	
	var r = world.CreateBody(bodyDef);
	r.CreateFixture(fixDef);
	return r;
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
	//bodyDef.fixedRotation = true;
	    
	var r = world.CreateBody(bodyDef);
	r.CreateFixture(fixDef);
	return r;
}

function createPlayer(world){	
	var fixDef = new b2FixtureDef;
	fixDef.density = 1;
	fixDef.friction = 0.2;
	fixDef.restitution = 0.2;
	var bodyDef = new b2BodyDef;
		
	bodyDef.type = b2Body.b2_dynamicBody;
	fixDef.shape = new b2CircleShape(pTOm(40/2));
	
	bodyDef.position.x = pTOm(40);
	bodyDef.position.y = pTOm(40);
	//bodyDef.fixedRotation = true;

	var r = world.CreateBody(bodyDef);
	//r.CreateShape(bodyDef);
	r.CreateFixture(fixDef);
	
	fixDef.shape = new b2PolygonShape;
	fixDef.shape.SetAsOrientedBox(pTOm(20), pTOm(40), new b2Vec2(pTOm(0), pTOm(-40)), 0);
	fixDef.density = 1;
	fixDef.friction = 0.2;
	fixDef.restitution = 0.2;
	
	r.CreateFixture(fixDef);
	return r;
}
