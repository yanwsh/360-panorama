/**
 * Created by wensheng.yan on 8/19/16.
 */

'use strict';

import util from './lib/Util';
import Canvas from './lib/Canvas';

const runOnMobile = (util.mobileAndTabletcheck());
const defaults = {
    clickAndDrag: runOnMobile,

    //limit the element size when user scroll.
    scrollable: true,
    initFov: 75,
    maxFov: 105,
    minFov: 51,
    //initial position for the video
    initLat: 0,
    initLon: -180,
    //A float value back to center when mouse out the canvas. The higher, the faster.
    returnStepLat: 0.5,
    returnStepLon: 2,
    backToVerticalCenter: !runOnMobile,
    backToHorizonCenter: !runOnMobile,

    //limit viewable zoom
    minLat: -85,
    maxLat: 85,

    minLon: -Infinity,
    maxLon: Infinity,

    elementType: "equirectangular",

    rotateX: 0,
    rotateY: 0,
    rotateZ: 0,

    autoMobileOrientation: false,
    mobileVibrationValue: util.isIos()? 0.022 : 1,

    VREnable: true,
    VRGapDegree: 2.5
};

function insertAfter(newElement,targetElement) {
    //target is what you want it to go after. Look for this elements parent.
    var parent = targetElement.parentNode;

    //if the parents lastchild is the targetElement...
    if(parent.lastchild == targetElement) {
        //add the newElement after the target element.
        parent.appendChild(newElement);
    } else {
        // else the target has siblings, insert the new element between the target and it's next sibling.
        parent.insertBefore(newElement, targetElement.nextSibling);
    }
}

var ThreeSixtyPanorama = function(element, options){
    const runOnMobile = (util.mobileAndTabletcheck());
    options = Object.assign(defaults, options);
    var canvas = new Canvas(element, options);
    insertAfter(canvas.el(), element);
    if(runOnMobile){
        canvas.onMobile();
    }
};

window.ThreeSixtyPanorama = ThreeSixtyPanorama;

