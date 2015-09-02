// Copyright 2002-2015, University of Colorado Boulder

/**
 * In the "more tools" tab, the protractor can be expanded with a "+" button and returned to the original size with a
 * "-" button.
 *
 * @author Chandrashekar Bemagoni (Actual Concepts)
 * @author Sam Reid
 */
define( function( require ) {
  'use strict';

  // modules
  var inherit = require( 'PHET_CORE/inherit' );
  var ExpandCollapseButton = require( 'SUN/ExpandCollapseButton' );
  var ProtractorNode = require( 'BENDING_LIGHT/common/view/ProtractorNode' );

  /**
   * @param {Node} afterLightLayer - layer in which ProtractorNode is present when in play area
   * @param {Node} beforeLightLayer2 - layer in which ProtractorNode is present when in toolbox
   * @param {ModelViewTransform2} modelViewTransform - convert between model and view values
   * @param {Property.<boolean>} showProtractorProperty - controls the protractor visibility
   * @param {ProtractorModel} protractorModel - model of protractor
   * @param {function} translateShape - function that returns the shape that can be translated
   * @param {function} rotateShape - function that returns the shape that can be rotated
   * @param {number} protractorIconWidth - width of protractor icon to show in toolbox node
   * @param {Bounds2} containerBounds - bounds of container for all tools, needed to snap protractor to initial
   * position when it in container
   * @param {Property.<Bounds2>} dragBoundsProperty - bounds that define where the protractor may be dragged
   * @param {function} getProtractorNodeToolboxPosition - Function that gets the view coordinates where the protractor
   *                                                    - should appear in the toolbox.  Necessary because the toolbox
   *                                                    - can move because it floats to the side
   * @constructor
   */
  function ExpandableProtractorNode( afterLightLayer, beforeLightLayer2, modelViewTransform, showProtractorProperty,
                                     protractorModel, translateShape, rotateShape, protractorIconWidth, containerBounds,
                                     dragBoundsProperty, getProtractorNodeToolboxPosition ) {

    ProtractorNode.call( this, afterLightLayer, beforeLightLayer2, modelViewTransform, showProtractorProperty, protractorModel, translateShape,
      rotateShape, protractorIconWidth, containerBounds, dragBoundsProperty, getProtractorNodeToolboxPosition );
    var expandableProtractorNode = this;

    // Add expandable /collapse button
    var expandCollapseButton = new ExpandCollapseButton( this.expandedProperty, {
      x: this.protractorImageNode.getWidth() * 0.7,
      y: this.protractorImageNode.getHeight() * 0.57
    } );
    this.addChild( expandCollapseButton );
    expandCollapseButton.touchArea = expandCollapseButton.localBounds.dilatedXY( 30, 30 );

    // Add a observer to expand/collapse button
    this.expandedProperty.link( function( expand ) {
      expandableProtractorNode.setExpanded( expand );
    } );
    this.setProtractorScale( this.multiScale );

    this.expandedButtonVisibilityProperty.linkAttribute( expandCollapseButton, 'visible' );
  }

  return inherit( ProtractorNode, ExpandableProtractorNode, {

    /**
     * Set whether the protractor should be shown as large (expanded) or regular
     * @private
     * @param {boolean} expanded - whether to expand the protractor
     */
    setExpanded: function( expanded ) {
      this.setProtractorScale( expanded ? 0.8 : 0.4 );
    }
  } );
} );