// Copyright 2015-2020, University of Colorado Boulder

/**
 * Node for drawing the laser itself, including an on/off button and ability to rotate/translate.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Chandrashekar Bemagoni (Actual Concepts)
 */

import Property from '../../../../axon/js/Property.js';
import Dimension2 from '../../../../dot/js/Dimension2.js';
import Vector2 from '../../../../dot/js/Vector2.js';
import LaserPointerNode from '../../../../scenery-phet/js/LaserPointerNode.js';
import SimpleDragHandler from '../../../../scenery/js/input/SimpleDragHandler.js';
import Node from '../../../../scenery/js/nodes/Node.js';
import Image from '../../../../scenery/js/nodes/Image.js';
import bendingLight from '../../bendingLight.js';
import BendingLightConstants from '../BendingLightConstants.js';
import knobImageData from '../../../images/knob_png.js';

class LaserNode extends Node {

  /**
   * @param {ModelViewTransform2} modelViewTransform - Transform between model and view coordinate frames
   * @param {Laser} laser - model for the laser
   * @param {Property.<boolean>} showRotationDragHandlesProperty - to show laser node rotate arrows
   * @param {Property.<boolean>} showTranslationDragHandlesProperty - to show laser node drag arrows
   * @param {function} clampDragAngle - function that limits the angle of laser to its bounds
   * @param {function} translationRegion - select from the entire region and front region which should be used for
   *                                       translating the laser
   * @param {function} rotationRegion - select from the entire region and back region which should be used for rotating
   *                                       the laser
   * @param {boolean} hasKnob - true if the laser should be shown with a knob
   * @param {Property.<Bounds2>} dragBoundsProperty - bounds that define where the laser may be dragged
   * @param {function} occlusionHandler - function that will move the laser out from behind a control panel if dropped
   *                                      there
   */
  constructor( modelViewTransform, laser, showRotationDragHandlesProperty, showTranslationDragHandlesProperty,
               clampDragAngle, translationRegion, rotationRegion, hasKnob, dragBoundsProperty,
               occlusionHandler ) {

    const laserPointerNode = new LaserPointerNode( laser.onProperty, {
      bodySize: new Dimension2( 70, 30 ),
      nozzleSize: new Dimension2( 10, 25 ),
      buttonRadius: 12,
      buttonXMargin: 2,
      buttonYMargin: 2,
      cornerRadius: 2,
      buttonTouchAreaDilation: 4
    } );

    const knobImage = new Image( knobImageData, { scale: 0.58, rightCenter: laserPointerNode.leftCenter } );
    knobImage.touchArea = knobImage.localBounds.dilatedXY( 15, 27 ).shiftedX( -15 );
    hasKnob && laserPointerNode.addChild( knobImage );
    laserPointerNode.translate( laserPointerNode.width, laserPointerNode.height / 2 );
    if ( !hasKnob ) {
      laserPointerNode.bodyAndNozzleNode.touchArea = laserPointerNode.bodyAndNozzleNode.bounds.dilated( 8 ).shiftedX( -8 );
    }

    const translationTarget = hasKnob ? laserPointerNode.bodyAndNozzleNode : knobImage;
    const rotationTarget = hasKnob ? knobImage : laserPointerNode.bodyAndNozzleNode;

    // When mousing over or starting to drag the laser, increment the over count.  If it is more than zero
    // then show the drag handles.  This ensures they will be shown whenever dragging or over, and they won't flicker
    const overCountProperty = new Property( 0 );
    overCountProperty.link( overCount => {
      showRotationDragHandlesProperty.value = overCount > 0;
    } );

    super( { cursor: 'pointer' } );

    // @public (read-only), Used for radius and length of drag handlers
    this.laserImageWidth = laserPointerNode.width;

    // add laser image
    laserPointerNode.rotateAround( laserPointerNode.getCenter(), Math.PI );

    this.addChild( laserPointerNode );

    const lightImageHeight = laserPointerNode.getHeight();

    // re usable vector to avoid vector allocation
    const emissionPointEndPosition = new Vector2( 0, 0 );

    // When the window reshapes, make sure the laser remains in the play area
    dragBoundsProperty.link( dragBounds => {
      const center = laser.emissionPointProperty.value;
      const eroded = dragBounds.erodedXY( lightImageHeight / 2, lightImageHeight / 2 );

      const newEmissionPoint = modelViewTransform.viewToModelBounds( eroded ).getClosestPoint( center.x, center.y );
      const delta = newEmissionPoint.minus( laser.emissionPointProperty.value );
      laser.translate( delta.x, delta.y );
    } );

    // add the drag region for translating the laser
    let start;

    translationTarget.addInputListener( new SimpleDragHandler( {
      start: event => {
        start = this.globalToParentPoint( event.pointer.point );
        showTranslationDragHandlesProperty.value = true;
      },
      drag: event => {

        const laserNodeDragBounds = dragBoundsProperty.value.erodedXY( lightImageHeight / 2, lightImageHeight / 2 );
        const laserDragBoundsInModelValues = modelViewTransform.viewToModelBounds( laserNodeDragBounds );

        const endDrag = this.globalToParentPoint( event.pointer.point );
        const deltaX = modelViewTransform.viewToModelDeltaX( endDrag.x - start.x );
        const deltaY = modelViewTransform.viewToModelDeltaY( endDrag.y - start.y );

        // position of final emission point with out constraining to bounds
        emissionPointEndPosition.setXY( laser.emissionPointProperty.value.x + deltaX, laser.emissionPointProperty.value.y + deltaY );

        // position of final emission point with constraining to bounds
        const emissionPointEndPositionInBounds = laserDragBoundsInModelValues.closestPointTo( emissionPointEndPosition );

        const translateX = emissionPointEndPositionInBounds.x - laser.emissionPointProperty.value.x;
        const translateY = emissionPointEndPositionInBounds.y - laser.emissionPointProperty.value.y;
        laser.translate( translateX, translateY );

        // Store the position of caught point after translating. Can be obtained by adding distance between emission
        // point and drag point (end - emissionPointEndPosition) to emission point (emissionPointEndPositionInBounds)
        // after translating.
        const boundsDx = emissionPointEndPositionInBounds.x - emissionPointEndPosition.x;
        const boundsDY = emissionPointEndPositionInBounds.y - emissionPointEndPosition.y;
        endDrag.x = endDrag.x + modelViewTransform.modelToViewDeltaX( boundsDx );
        endDrag.y = endDrag.y + modelViewTransform.modelToViewDeltaY( boundsDY );

        start = endDrag;
        showTranslationDragHandlesProperty.value = true;
      },
      end: () => {
        showTranslationDragHandlesProperty.value = false;
        occlusionHandler( this );
      }
    } ) );

    // Listeners to enable/disable the translation dragHandles
    translationTarget.addInputListener( {
      enter: () => {
        showTranslationDragHandlesProperty.value = !showRotationDragHandlesProperty.value;
      },
      exit: () => {
        showTranslationDragHandlesProperty.value = false;
      }
    } );

    rotationTarget.addInputListener( new SimpleDragHandler( {
      start: () => {
        showTranslationDragHandlesProperty.value = false;
        overCountProperty.value = overCountProperty.value + 1;
      },
      drag: event => {
        const coordinateFrame = this.parents[ 0 ];
        const laserAnglebeforeRotate = laser.getAngle();
        const localLaserPosition = coordinateFrame.globalToLocalPoint( event.pointer.point );
        const angle = Math.atan2( modelViewTransform.viewToModelY( localLaserPosition.y ) - laser.pivotProperty.value.y,
          modelViewTransform.viewToModelX( localLaserPosition.x ) - laser.pivotProperty.value.x );
        let laserAngleAfterClamp = clampDragAngle( angle );

        // prevent laser from going to 90 degrees when in wave mode, should go until laser bumps into edge.
        const pastMaxAngle = laserAngleAfterClamp > BendingLightConstants.MAX_ANGLE_IN_WAVE_MODE;
        if ( laser.waveProperty.value && pastMaxAngle && laser.topLeftQuadrant ) {
          laserAngleAfterClamp = BendingLightConstants.MAX_ANGLE_IN_WAVE_MODE;
        }
        laser.setAngle( laserAngleAfterClamp );

        const laserNodeDragBounds = dragBoundsProperty.value.erodedXY( lightImageHeight / 2, lightImageHeight / 2 );
        const laserDragBoundsInModelValues = modelViewTransform.viewToModelBounds( laserNodeDragBounds );
        if ( !laserDragBoundsInModelValues.containsPoint( laser.emissionPointProperty.value ) ) {
          laser.setAngle( laserAnglebeforeRotate );
        }
        showTranslationDragHandlesProperty.value = false;
        showRotationDragHandlesProperty.value = true;
      },
      end: () => {
        overCountProperty.value = overCountProperty.value - 1;
      }
    } ) );

    // Listeners to enable/disable the rotation dragHandles
    rotationTarget.addInputListener( {
      enter: () => {
        overCountProperty.value = overCountProperty.value + 1;
      },
      exit: () => {
        overCountProperty.value = overCountProperty.value - 1;
      }
    } );

    // update the laser position
    laser.emissionPointProperty.link( newEmissionPoint => {
      const emissionPointX = modelViewTransform.modelToViewX( newEmissionPoint.x );
      const emissionPointY = modelViewTransform.modelToViewY( newEmissionPoint.y );
      this.setTranslation( emissionPointX, emissionPointY );
      this.setRotation( -laser.getAngle() );
      this.translate( 0, -lightImageHeight / 2 );
    } );

    // TODO: Move to prototype?
    /**
     * Called from the occlusion handler.  Translates the view by the specified amount by translating the corresponding
     * model
     * @param {number} x
     * @param {number} y
     * @public
     */
    this.translateViewXY = ( x, y ) => {
      const delta = modelViewTransform.viewToModelDeltaXY( x, y );
      laser.translate( delta.x, delta.y );
    };
  }
}

bendingLight.register( 'LaserNode', LaserNode );

export default LaserNode;