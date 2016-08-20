/**
 * Created by wensheng.yan on 8/19/16.
 */
import Util from './Util';

class Canvas {
    constructor(element, options){
        this.settings = options;
        this.width = element.offsetWidth, this.height = element.offsetHeight;
        this.elementType = options.elementType;
        this.lon = options.initLon, this.lat = options.initLat, this.phi = 0, this.theta = 0;
        this.mouseDown = false;
        this.isUserInteracting = false;
        this.VRMode = false;
        //define scene
        this.scene = new THREE.Scene();
        //define camera
        this.camera = new THREE.PerspectiveCamera(options.initFov, this.width / this.height, 1, 2000);
        this.camera.target = new THREE.Vector3( 0, 0, 0 );
        //define render
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.width, this.height);
        this.renderer.autoClear = false;
        this.renderer.setClearColor(0x000000, 1);

        this.texture = new THREE.Texture(element);
        this.texture.needsUpdate = true;

        element.style.display = "none";

        this.texture.generateMipmaps = false;
        this.texture.minFilter = THREE.LinearFilter;
        this.texture.maxFilter = THREE.LinearFilter;
        this.texture.format = THREE.RGBFormat;
        //define geometry
        var geometry = (this.elementType === "equirectangular")? new THREE.SphereGeometry(500, 60, 40): new THREE.SphereBufferGeometry( 500, 60, 40 ).toNonIndexed();
        if(this.elementType === "fisheye"){
            var normals = geometry.attributes.normal.array;
            var uvs = geometry.attributes.uv.array;
            for ( var i = 0, l = normals.length / 3; i < l; i ++ ) {
                var x = normals[ i * 3 + 0 ];
                var y = normals[ i * 3 + 1 ];
                var z = normals[ i * 3 + 2 ];

                var r = Math.asin(Math.sqrt(x * x + z * z) / Math.sqrt(x * x  + y * y + z * z)) / Math.PI;
                if(y < 0) r = 1 - r;
                var theta = (x == 0 && z == 0)? 0 : Math.acos(x / Math.sqrt(x * x + z * z));
                if(z < 0) theta = theta * -1;
                uvs[ i * 2 + 0 ] = -0.8 * r * Math.cos(theta) + 0.5;
                uvs[ i * 2 + 1 ] = 0.8 * r * Math.sin(theta) + 0.5;
            }
            geometry.rotateX( options.rotateX);
            geometry.rotateY( options.rotateY);
            geometry.rotateZ( options.rotateZ);
        }
        geometry.scale( - 1, 1, 1 );
        //define mesh
        this.mesh = new THREE.Mesh(geometry,
            new THREE.MeshBasicMaterial({ map: this.texture})
        );

        //this.mesh.scale.x = -1;
        this.scene.add(this.mesh);
        this.el_ = this.renderer.domElement;
        this.el_.classList.add('threesixty-panorama-canvas');

        this.attachControlEvents();

        this.animate();

        if(options.callback) options.callback();
    }

    el(){
        return this.el_;
    }

    on(eventName, eventHandler){
        this.el().addEventListener(eventName, eventHandler);
    }

    off(eventName, eventHandler){
        this.el().removeEventListener(eventName, eventHandler);
    }

    enableVR() {
        this.VRMode = true;
        if (typeof vrHMD !== 'undefined') {
            var eyeParamsL = vrHMD.getEyeParameters('left');
            var eyeParamsR = vrHMD.getEyeParameters('right');

            this.eyeFOVL = eyeParamsL.recommendedFieldOfView;
            this.eyeFOVR = eyeParamsR.recommendedFieldOfView;
        }

        this.cameraL = new THREE.PerspectiveCamera(this.camera.fov, this.width / 2 / this.height, 1, 2000);
        this.cameraR = new THREE.PerspectiveCamera(this.camera.fov, this.width / 2 / this.height, 1, 2000);
    }

    disableVR() {
        this.VRMode = false;
        this.renderer.setViewport(0, 0, this.width, this.height);
        this.renderer.setScissor(0, 0, this.width, this.height);
    }

    attachControlEvents() {
        this.on('mousemove', this.handleMouseMove.bind(this));
        this.on('touchmove', this.handleMouseMove.bind(this));
        this.on('mousedown', this.handleMouseDown.bind(this));
        this.on('touchstart', this.handleMouseDown.bind(this));
        this.on('mouseup', this.handleMouseUp.bind(this));
        this.on('touchend', this.handleMouseUp.bind(this));
        if (this.settings.scrollable) {
            this.on('mousewheel', this.handleMouseWheel.bind(this));
            this.on('MozMousePixelScroll', this.handleMouseWheel.bind(this));
        }
        this.on('mouseenter', this.handleMouseEnter.bind(this));
        this.on('mouseleave', this.handleMouseLease.bind(this));
    }

    handleResize() {
        this.width = this.el().offsetWidth, this.height = this.el().offsetHeight;
        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();
        if (this.VRMode) {
            this.cameraL.aspect = this.camera.aspect / 2;
            this.cameraR.aspect = this.camera.aspect / 2;
            this.cameraL.updateProjectionMatrix();
            this.cameraR.updateProjectionMatrix();
        }
        this.renderer.setSize(this.width, this.height);
    }

    handleMouseUp(event) {
        this.mouseDown = false;
    }

    handleMouseDown(event) {
        event.preventDefault();
        var clientX = event.clientX || event.touches && event.touches[0].clientX;
        var clientY = event.clientY || event.touches && event.touches[0].clientY;
        this.mouseDown = true;
        this.onPointerDownPointerX = clientX;
        this.onPointerDownPointerY = clientY;
        this.onPointerDownLon = this.lon;
        this.onPointerDownLat = this.lat;
    }

    handleMouseMove(event) {
        var clientX = event.clientX || event.touches && event.touches[0].clientX;
        var clientY = event.clientY || event.touches && event.touches[0].clientY;
        if (this.settings.clickAndDrag) {
            if (this.mouseDown) {
                this.lon = ( this.onPointerDownPointerX - clientX ) * 0.2 + this.onPointerDownLon;
                this.lat = ( clientY - this.onPointerDownPointerY ) * 0.2 + this.onPointerDownLat;
            }
        } else {
            var x = event.pageX - this.el_.offsetLeft;
            var y = event.pageY - this.el_.offsetTop;
            this.lon = (x / this.width) * 430 - 225;
            this.lat = (y / this.height) * -180 + 90;
        }
    }

    handleMobileOrientation (event) {
        if (typeof event.rotationRate === "undefined") return;
        var x = event.rotationRate.alpha;
        var y = event.rotationRate.beta;
        var portrait = (typeof event.portrait !== "undefined") ? event.portrait : window.matchMedia("(orientation: portrait)").matches;
        var landscape = (typeof event.landscape !== "undefined") ? event.landscape : window.matchMedia("(orientation: landscape)").matches;
        var orientation = event.orientation || window.orientation;

        if (portrait) {
            this.lon = this.lon - y * this.settings.mobileVibrationValue;
            this.lat = this.lat + x * this.settings.mobileVibrationValue;
        } else if (landscape) {
            var orientationDegree = -90;
            if (typeof orientation != "undefined") {
                orientationDegree = orientation;
            }

            this.lon = (orientationDegree == -90) ? this.lon + x * this.settings.mobileVibrationValue : this.lon - x * this.settings.mobileVibrationValue;
            this.lat = (orientationDegree == -90) ? this.lat + y * this.settings.mobileVibrationValue : this.lat - y * this.settings.mobileVibrationValue;
        }
    }

    handleMouseWheel(event) {
        event.stopPropagation();
        event.preventDefault();
        // WebKit
        if (event.wheelDeltaY) {
            this.camera.fov -= event.wheelDeltaY * 0.05;
            // Opera / Explorer 9
        } else if (event.wheelDelta) {
            this.camera.fov -= event.wheelDelta * 0.05;
            // Firefox
        } else if (event.detail) {
            this.camera.fov += event.detail * 1.0;
        }
        this.camera.fov = Math.min(this.settings.maxFov, this.camera.fov);
        this.camera.fov = Math.max(this.settings.minFov, this.camera.fov);
        this.camera.updateProjectionMatrix();
        if (this.VRMode) {
            this.cameraL.fov = this.camera.fov;
            this.cameraR.fov = this.camera.fov;
            this.cameraL.updateProjectionMatrix();
            this.cameraR.updateProjectionMatrix();
        }
    }

    handleMouseEnter(event) {
        this.isUserInteracting = true;
    }

    handleMouseLease(event) {
        this.isUserInteracting = false;
    }

    animate() {
        this.requestAnimationId = requestAnimationFrame(this.animate.bind(this));
        if(!this.isUserInteracting){
            var symbolLat = (this.lat > this.settings.initLat)?  -1 : 1;
            var symbolLon = (this.lon > this.settings.initLon)?  -1 : 1;
            if(this.settings.backToVerticalCenter){
                this.lat = (
                    this.lat > (this.settings.initLat - Math.abs(this.settings.returnStepLat)) &&
                    this.lat < (this.settings.initLat + Math.abs(this.settings.returnStepLat))
                )? this.settings.initLat : this.lat + this.settings.returnStepLat * symbolLat;
            }
            if(this.settings.backToHorizonCenter){
                this.lon = (
                    this.lon > (this.settings.initLon - Math.abs(this.settings.returnStepLon)) &&
                    this.lon < (this.settings.initLon + Math.abs(this.settings.returnStepLon))
                )? this.settings.initLon : this.lon + this.settings.returnStepLon * symbolLon;
            }
        }
        this.lat = Math.max( this.settings.minLat, Math.min( this.settings.maxLat, this.lat ) );
        this.lon = Math.max( this.settings.minLon, Math.min( this.settings.maxLon, this.lon ) );
        this.phi = THREE.Math.degToRad( 90 - this.lat );
        this.theta = THREE.Math.degToRad( this.lon );
        this.camera.target.x = 500 * Math.sin( this.phi ) * Math.cos( this.theta );
        this.camera.target.y = 500 * Math.cos( this.phi );
        this.camera.target.z = 500 * Math.sin( this.phi ) * Math.sin( this.theta );
        this.camera.lookAt( this.camera.target );

        this.renderer.clear();
        if(!this.VRMode){
            this.renderer.render( this.scene, this.camera );
        }else{
            var viewPortWidth = this.width / 2, viewPortHeight = this.height;
            if(typeof vrHMD !== 'undefined'){
                this.cameraL.projectionMatrix = Util.fovToProjection( this.eyeFOVL, true, this.camera.near, this.camera.far );
                this.cameraR.projectionMatrix = Util.fovToProjection( this.eyeFOVR, true, this.camera.near, this.camera.far );
            }else{
                var lonL = this.lon + this.settings.VRGapDegree;
                var lonR = this.lon - this.settings.VRGapDegree;

                var thetaL = THREE.Math.degToRad( lonL );
                var thetaR = THREE.Math.degToRad( lonR );

                var targetL = Util.extend(this.camera.target);
                targetL.x = 500 * Math.sin( this.phi ) * Math.cos( thetaL );
                targetL.z = 500 * Math.sin( this.phi ) * Math.sin( thetaL );
                this.cameraL.lookAt(targetL);

                var targetR = Util.extend(this.camera.target);
                targetR.x = 500 * Math.sin( this.phi ) * Math.cos( thetaR );
                targetR.z = 500 * Math.sin( this.phi ) * Math.sin( thetaR );
                this.cameraR.lookAt(targetR);
            }
            // render left eye
            this.renderer.setViewport( 0, 0, viewPortWidth, viewPortHeight );
            this.renderer.setScissor( 0, 0, viewPortWidth, viewPortHeight );
            this.renderer.render( this.scene, this.cameraL );

            // render right eye
            this.renderer.setViewport( viewPortWidth, 0, viewPortWidth, viewPortHeight );
            this.renderer.setScissor( viewPortWidth, 0, viewPortWidth, viewPortHeight );
            this.renderer.render( this.scene, this.cameraR );
        }
    }

    onMobile() {
        if (this.settings.autoMobileOrientation)
            window.addEventListener('devicemotion', this.handleMobileOrientation.bind(this));
    }
}

module.exports = Canvas;